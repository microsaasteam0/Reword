"""
Comprehensive Payment Processing System
Handles payment verification, subscription updates, and payment history tracking
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models import User, Subscription, PaymentHistory
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PaymentProcessor:
    """Handles all payment-related database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_payment_record(
        self,
        user_id: int,
        amount: float,
        plan_type: str,
        billing_cycle: str,
        dodo_session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentHistory:
        """Create a new payment record when checkout is initiated"""
        
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        
        payment_record = PaymentHistory(
            user_id=user_id,
            payment_id=payment_id,
            dodo_session_id=dodo_session_id,
            amount=amount,
            status="pending",
            plan_type=plan_type,
            billing_cycle=billing_cycle,
            checkout_created_at=datetime.now(timezone.utc),
            payment_metadata=json.dumps(metadata or {})
        )
        
        self.db.add(payment_record)
        self.db.commit()
        self.db.refresh(payment_record)
        
        logger.info(f"✅ Created payment record {payment_id} for user {user_id}")
        return payment_record
    
    def process_successful_payment(
        self,
        user_id: int,
        dodo_payment_data: Dict[str, Any],
        force_upgrade: bool = False
    ) -> Dict[str, Any]:
        """
        Process a successful payment and update all related records
        
        Args:
            user_id: The user ID
            dodo_payment_data: Payment data from Dodo Payments
            force_upgrade: If True, upgrade user even without Dodo data (for testing)
        
        Returns:
            Dict with success status and details
        """
        
        try:
            logger.info(f"🔄 Processing successful payment for user {user_id}")
            
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Extract payment details
            if force_upgrade:
                # For testing/manual upgrades
                plan_type = "pro"
                billing_cycle = "monthly"
                amount = 15.00
                dodo_payment_id = f"test_payment_{uuid.uuid4().hex[:8]}"
                dodo_subscription_id = f"test_sub_{uuid.uuid4().hex[:8]}"
                session_id = None
            else:
                # Extract from Dodo payment data
                plan_type = dodo_payment_data.get('metadata', {}).get('plan_id', 'pro')
                billing_cycle = dodo_payment_data.get('metadata', {}).get('billing_cycle', 'monthly')
                amount = dodo_payment_data.get('amount', 0) / 100  # Convert cents to dollars
                dodo_payment_id = dodo_payment_data.get('id')
                dodo_subscription_id = dodo_payment_data.get('subscription_id')
                session_id = dodo_payment_data.get('session_id')
            
            # Find or create payment record
            payment_record = None
            if session_id:
                payment_record = self.db.query(PaymentHistory).filter(
                    PaymentHistory.dodo_session_id == session_id,
                    PaymentHistory.user_id == user_id
                ).first()
            
            if not payment_record:
                # Create new payment record
                payment_record = self.create_payment_record(
                    user_id=user_id,
                    amount=amount,
                    plan_type=plan_type,
                    billing_cycle=billing_cycle,
                    dodo_session_id=session_id,
                    metadata=dodo_payment_data if not force_upgrade else {"source": "manual_upgrade"}
                )
            
            # Update payment record with completion details
            payment_record.status = "completed"
            payment_record.dodo_payment_id = dodo_payment_id
            payment_record.dodo_subscription_id = dodo_subscription_id
            payment_record.payment_completed_at = datetime.now(timezone.utc)
            
            # Create or update subscription
            subscription = self.create_or_update_subscription(
                user_id=user_id,
                plan_type=plan_type,
                billing_cycle=billing_cycle,
                amount=amount,
                dodo_subscription_id=dodo_subscription_id,
                dodo_payment_data=dodo_payment_data if not force_upgrade else {}
            )
            
            # Link payment to subscription
            payment_record.subscription_id = subscription.id
            
            # Upgrade user to premium
            user.is_premium = True
            
            # Mark verification as completed
            payment_record.verification_completed_at = datetime.now(timezone.utc)
            
            # Commit all changes
            self.db.commit()
            self.db.refresh(user)
            self.db.refresh(subscription)
            self.db.refresh(payment_record)
            
            logger.info(f"✅ Successfully processed payment for user {user.email}")
            logger.info(f"📊 User upgraded to {plan_type} plan ({billing_cycle})")
            logger.info(f"💰 Payment amount: ${amount}")
            
            return {
                "success": True,
                "user_id": user_id,
                "is_premium": user.is_premium,
                "plan_type": plan_type,
                "billing_cycle": billing_cycle,
                "amount": amount,
                "payment_id": payment_record.payment_id,
                "subscription_id": subscription.id,
                "message": f"Successfully upgraded to {plan_type.title()} plan"
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing payment for user {user_id}: {e}")
            self.db.rollback()
            
            # Update payment record with failure
            if 'payment_record' in locals():
                payment_record.status = "failed"
                payment_record.failure_reason = str(e)
                payment_record.retry_count += 1
                self.db.commit()
            
            raise e
    
    def create_or_update_subscription(
        self,
        user_id: int,
        plan_type: str,
        billing_cycle: str,
        amount: float,
        dodo_subscription_id: Optional[str] = None,
        dodo_payment_data: Optional[Dict[str, Any]] = None
    ) -> Subscription:
        """Create or update user subscription"""
        
        # Check for existing active subscription
        existing_subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(["active", "on_hold"])
        ).first()
        
        if existing_subscription:
            # Update existing subscription
            logger.info(f"📝 Updating existing subscription for user {user_id}")
            existing_subscription.plan_type = plan_type
            existing_subscription.billing_cycle = billing_cycle
            existing_subscription.status = "active"
            existing_subscription.amount = amount
            existing_subscription.dodo_subscription_id = dodo_subscription_id
            existing_subscription.current_period_start = datetime.now(timezone.utc)
            
            # Calculate next billing date
            if billing_cycle == "yearly":
                existing_subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=365)
            else:  # monthly
                existing_subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
            
            existing_subscription.extra_metadata = json.dumps(dodo_payment_data or {})
            existing_subscription.updated_at = datetime.now(timezone.utc)
            
            return existing_subscription
        
        else:
            # Create new subscription
            logger.info(f"🆕 Creating new subscription for user {user_id}")
            
            # Calculate billing period
            current_period_start = datetime.now(timezone.utc)
            if billing_cycle == "yearly":
                current_period_end = current_period_start + timedelta(days=365)
            else:  # monthly
                current_period_end = current_period_start + timedelta(days=30)
            
            subscription = Subscription(
                user_id=user_id,
                plan_type=plan_type,
                billing_cycle=billing_cycle,
                status="active",
                amount=amount,
                dodo_subscription_id=dodo_subscription_id,
                dodo_customer_id=dodo_payment_data.get('customer', {}).get('id') if dodo_payment_data else None,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                extra_metadata=json.dumps(dodo_payment_data or {})
            )
            
            self.db.add(subscription)
            self.db.flush()  # Get the ID without committing
            
            return subscription
    
    def cancel_subscription(self, user_id: int) -> Dict[str, Any]:
        """Cancel user subscription and downgrade to free plan"""
        
        try:
            logger.info(f"🔄 Cancelling subscription for user {user_id}")
            
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Find active subscription
            subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == "active"
            ).first()
            
            if not subscription:
                return {
                    "success": False,
                    "message": "No active subscription found"
                }
            
            # Update subscription status
            subscription.status = "cancelled"
            subscription.updated_at = datetime.now(timezone.utc)
            
            # Downgrade user
            user.is_premium = False
            
            # Create payment record for cancellation
            cancellation_record = PaymentHistory(
                user_id=user_id,
                subscription_id=subscription.id,
                payment_id=f"cancel_{uuid.uuid4().hex[:12]}",
                amount=0.0,
                status="completed",
                plan_type="free",
                billing_cycle="none",
                payment_completed_at=datetime.now(timezone.utc),
                verification_completed_at=datetime.now(timezone.utc),
                notes="Subscription cancelled by user",
                payment_metadata=json.dumps({"action": "cancellation", "cancelled_at": datetime.now(timezone.utc).isoformat()})
            )
            
            self.db.add(cancellation_record)
            self.db.commit()
            
            logger.info(f"✅ Successfully cancelled subscription for user {user.email}")
            
            return {
                "success": True,
                "message": "Subscription cancelled successfully",
                "is_premium": False,
                "plan_type": "free"
            }
            
        except Exception as e:
            logger.error(f"❌ Error cancelling subscription for user {user_id}: {e}")
            self.db.rollback()
            raise e
    
    def get_payment_history(self, user_id: int, limit: int = 50) -> list:
        """Get payment history for a user"""
        
        payments = self.db.query(PaymentHistory).filter(
            PaymentHistory.user_id == user_id
        ).order_by(PaymentHistory.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": payment.id,
                "payment_id": payment.payment_id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "plan_type": payment.plan_type,
                "billing_cycle": payment.billing_cycle,
                "payment_method": payment.payment_method,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "payment_completed_at": payment.payment_completed_at.isoformat() if payment.payment_completed_at else None,
                "notes": payment.notes
            }
            for payment in payments
        ]
    
    def get_subscription_status(self, user_id: int) -> Dict[str, Any]:
        """Get current subscription status for a user"""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Get active subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).order_by(Subscription.created_at.desc()).first()
        
        if subscription and subscription.status == "active":
            return {
                "plan": subscription.plan_type,
                "is_active": True,
                "billing_cycle": subscription.billing_cycle,
                "amount": subscription.amount,
                "currency": subscription.currency,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                "subscription_id": subscription.dodo_subscription_id or f"sub_{user_id}_{subscription.plan_type}",
                "created_at": subscription.created_at.isoformat() if subscription.created_at else None
            }
        else:
            return {
                "plan": "free",
                "is_active": True,
                "billing_cycle": None,
                "amount": None,
                "currency": "USD",
                "current_period_end": None,
                "subscription_id": None,
                "created_at": None
            }

# Convenience functions for easy import
def process_payment_success(db: Session, user_id: int, dodo_payment_data: Dict[str, Any] = None, force_upgrade: bool = False):
    """Convenience function to process successful payment"""
    processor = PaymentProcessor(db)
    return processor.process_successful_payment(user_id, dodo_payment_data or {}, force_upgrade)

def cancel_user_subscription(db: Session, user_id: int):
    """Convenience function to cancel subscription"""
    processor = PaymentProcessor(db)
    return processor.cancel_subscription(user_id)

def get_user_payment_history(db: Session, user_id: int, limit: int = 50):
    """Convenience function to get payment history"""
    processor = PaymentProcessor(db)
    return processor.get_payment_history(user_id, limit)

def get_user_subscription_status(db: Session, user_id: int):
    """Convenience function to get subscription status"""
    processor = PaymentProcessor(db)
    return processor.get_subscription_status(user_id)