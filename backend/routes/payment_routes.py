"""
Payment and subscription routes using Dodo Payments
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
import json

from database import get_db
from auth import get_current_active_user
from models import User, Subscription

# Import Dodo Payments SDK
from dodopayments import DodoPayments

payment_router = APIRouter()

# Initialize Dodo Payments client
dodo_client = DodoPayments(
    bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"),
    environment=os.environ.get("DODO_PAYMENTS_ENVIRONMENT", "test_mode")
)

# Pydantic models
class SubscriptionPlan(BaseModel):
    plan_id: str  # "pro", "enterprise"
    billing_cycle: str  # "monthly", "yearly"

class CheckoutSessionRequest(BaseModel):
    plan_id: str
    billing_cycle: str
    return_url: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    success: bool
    checkout_url: str
    session_id: str
    message: str

class SubscriptionStatus(BaseModel):
    plan: str
    is_active: bool
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[str] = None
    amount: Optional[float] = None
    subscription_id: Optional[str] = None

class WebhookEvent(BaseModel):
    business_id: str
    timestamp: str
    type: str
    data: dict

# Product IDs mapping (these should match your Dodo Payments dashboard)
PRODUCT_IDS = {
    "pro": {
        "monthly": "pdt_0NWg4gvtSa7waZtLUfnnv",  # Using the provided product ID
        "yearly": "pdt_0NWg4gvtSa7waZtLUfnnv"    # Same for now, update with actual yearly product ID
    },
    "enterprise": {
        "monthly": "pdt_0NWg4gvtSa7waZtLUfnnv",  # Update with actual enterprise monthly product ID
        "yearly": "pdt_0NWg4gvtSa7waZtLUfnnv"    # Update with actual enterprise yearly product ID
    }
}

# Pricing data for display purposes
PRICING = {
    "pro": {
        "monthly": 15.00,
        "yearly": 144.00
    },
    "enterprise": {
        "monthly": 49.00,
        "yearly": 470.00
    }
}

@payment_router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Dodo Payments checkout session"""
    
    # Validate plan
    if request.plan_id not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid plan selected"
        )
    
    # Validate billing cycle
    if request.billing_cycle not in ["monthly", "yearly"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid billing cycle"
        )
    
    try:
        # Get the product ID for the selected plan and billing cycle
        product_id = PRODUCT_IDS[request.plan_id][request.billing_cycle]
        
        # Create checkout session with Dodo Payments
        session = dodo_client.checkout_sessions.create(
            product_cart=[
                {
                    "product_id": product_id,
                    "quantity": 1
                }
            ],
            customer={
                "email": current_user.email,
                "name": current_user.full_name or current_user.email.split('@')[0],
            },
            return_url=request.return_url or f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/?payment=success",
            metadata={
                "user_id": str(current_user.id),
                "plan_id": request.plan_id,
                "billing_cycle": request.billing_cycle,
                "user_email": current_user.email
            }
        )
        
        print(f"✅ Created Dodo Payments checkout session for user {current_user.email}")
        print(f"📦 Plan: {request.plan_id} ({request.billing_cycle})")
        print(f"🔗 Checkout URL: {session.checkout_url}")
        print(f"🆔 Session ID: {session.session_id}")
        
        return CheckoutSessionResponse(
            success=True,
            checkout_url=session.checkout_url,
            session_id=session.session_id,
            message=f"Checkout session created for {request.plan_id.title()} plan"
        )
        
    except Exception as e:
        print(f"❌ Failed to create checkout session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout session: {str(e)}"
        )

@payment_router.post("/manual-upgrade")
async def manual_upgrade(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manual upgrade endpoint for testing (remove in production)"""
    
    try:
        print(f"🔧 Manually upgrading user {current_user.email}")
        
        # Create subscription record
        subscription = Subscription(
            user_id=current_user.id,
            plan_type='pro',
            billing_cycle='monthly',
            status='active',
            amount=15.00,
            extra_metadata=json.dumps({"source": "manual_upgrade", "test": True})
        )
        db.add(subscription)
        
        # Upgrade user
        current_user.is_premium = True
        
        db.commit()
        db.refresh(current_user)
        
        print(f"✅ User {current_user.email} manually upgraded to premium")
        
        return {
            "success": True,
            "message": "User manually upgraded to premium",
            "is_premium": current_user.is_premium
        }
        
    except Exception as e:
        print(f"❌ Manual upgrade error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to upgrade user"
        )

@payment_router.get("/debug-user-status")
async def debug_user_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check user status in database"""
    
    try:
        # Refresh user from database to get latest status
        db.refresh(current_user)
        
        # Get subscription records
        subscriptions = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).all()
        
        subscription_data = []
        for sub in subscriptions:
            subscription_data.append({
                "id": sub.id,
                "plan_type": sub.plan_type,
                "status": sub.status,
                "billing_cycle": sub.billing_cycle,
                "amount": sub.amount,
                "created_at": sub.created_at.isoformat() if sub.created_at else None
            })
        
        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "is_premium": current_user.is_premium,
            "subscriptions": subscription_data,
            "subscription_count": len(subscriptions)
        }
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get debug info"
        )

@payment_router.get("/subscription", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    
    try:
        print(f"🔍 Getting subscription status for user {current_user.email}")
        
        # Import the payment processor
        from payment_processor import get_user_subscription_status
        
        # Get subscription status using the payment processor
        status_data = get_user_subscription_status(db, current_user.id)
        
        print(f"📊 Subscription status: {status_data['plan']} ({'active' if status_data['is_active'] else 'inactive'})")
        
        return SubscriptionStatus(
            plan=status_data["plan"],
            is_active=status_data["is_active"],
            billing_cycle=status_data["billing_cycle"],
            next_billing_date=status_data["current_period_end"],
            amount=status_data["amount"],
            subscription_id=status_data["subscription_id"]
        )
        
    except Exception as e:
        print(f"❌ Error getting subscription status: {e}")
        # Return a safe default response
        return SubscriptionStatus(
            plan="free" if not current_user.is_premium else "pro",
            is_active=True,
            billing_cycle=None,
            next_billing_date=None,
            amount=None,
            subscription_id=None
        )

class PaymentVerificationRequest(BaseModel):
    payment_id: str

@payment_router.post("/verify-payment-status")
async def verify_payment_status(
    verification_request: PaymentVerificationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify and update payment status after successful payment"""
    
    try:
        print(f"🔍 Verifying payment status for user {current_user.email}")
        print(f"📦 Payment ID: {verification_request.payment_id}")
        
        # Import the payment processor
        from payment_processor import process_payment_success
        
        # Verify payment with Dodo Payments
        try:
            # First try to retrieve as a payment
            payment_info = dodo_client.payments.retrieve(verification_request.payment_id)
            print(f"✅ Dodo Payment retrieved: {payment_info.status}")
            
            if payment_info.status not in ['succeeded', 'completed', 'paid']:
                print(f"⚠️ Payment status is {payment_info.status}, not upgrading")
                return {
                    "success": False,
                    "is_premium": current_user.is_premium,
                    "plan_type": "free",
                    "status": "failed",
                    "message": f"Payment status: {payment_info.status}"
                }
                
            # Convert Dodo response to dict for processor
            # Assuming payment_info is an object, convert to dict safely
            payment_data = payment_info.__dict__ if hasattr(payment_info, '__dict__') else str(payment_info)
            if isinstance(payment_data, str):
                try:
                    payment_data = json.loads(payment_data)
                except:
                    payment_data = {"id": verification_request.payment_id, "amount": getattr(payment_info, 'amount', 0)}

            # Process the payment
            result = process_payment_success(
                db=db,
                user_id=current_user.id,
                dodo_payment_data=payment_data,
                force_upgrade=False 
            )
            
            print(f"✅ Payment verification completed: {result}")
            
            return {
                "success": result["success"],
                "is_premium": result["is_premium"],
                "plan_type": result["plan_type"],
                "message": result["message"]
            }
            
        except Exception as api_error:
            print(f"⚠️ Dodo API verification failed: {api_error}")
            # If API fails, check if we have it in our DB from webhook
            # This is a fallback
            from models import PaymentHistory
            existing_payment = db.query(PaymentHistory).filter(
                PaymentHistory.payment_id == verification_request.payment_id,
                PaymentHistory.status == 'completed'
            ).first()
            
            if existing_payment and existing_payment.user_id == current_user.id:
                print("✅ Found completed payment in local DB")
                current_user.is_premium = True
                db.commit()
                return {
                    "success": True,
                    "is_premium": True,
                    "plan_type": existing_payment.plan_type,
                    "message": "Payment verified from local records"
                }

            raise HTTPException(
                status_code=400,
                detail=f"Could not verify payment: {str(api_error)}"
            )

    except Exception as e:
        print(f"❌ Payment verification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify payment status"
        )

@payment_router.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Dodo Payments webhooks"""
    
    try:
        # Get the raw body
        body = await request.body()
        
        # Parse the webhook payload
        payload = json.loads(body.decode('utf-8'))
        
        print(f"🔔 Received Dodo Payments webhook: {payload.get('type', 'unknown')}")
        print(f"📦 Webhook payload: {payload}")
        
        event_type = payload.get('type')
        event_data = payload.get('data', {})
        
        # Handle different webhook events
        if event_type == 'payment.succeeded':
            await handle_payment_succeeded(event_data, db)
        elif event_type == 'subscription.active':
            await handle_subscription_active(event_data, db)
        elif event_type == 'subscription.renewed':
            await handle_subscription_renewed(event_data, db)
        elif event_type == 'subscription.cancelled':
            await handle_subscription_cancelled(event_data, db)
        elif event_type == 'subscription.on_hold':
            await handle_subscription_on_hold(event_data, db)
        else:
            print(f"⚠️ Unhandled webhook event type: {event_type}")
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"❌ Webhook processing error: {e}")
        print(f"❌ Request body: {body}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

async def handle_payment_succeeded(event_data: dict, db: Session):
    """Handle successful payment webhook"""
    
    try:
        print(f"🔍 Processing payment.succeeded webhook")
        print(f"📦 Event data: {event_data}")
        
        # Extract metadata from the payment
        metadata = event_data.get('metadata', {})
        user_id = metadata.get('user_id')
        plan_id = metadata.get('plan_id')
        billing_cycle = metadata.get('billing_cycle')
        
        # Also try to get user info from other possible locations
        if not user_id:
            # Try customer data
            customer = event_data.get('customer', {})
            customer_email = customer.get('email')
            if customer_email:
                user = db.query(User).filter(User.email == customer_email).first()
                if user:
                    user_id = str(user.id)
                    print(f"🔍 Found user by email: {customer_email}")
        
        if not user_id:
            print("⚠️ No user_id in payment metadata or customer data")
            print(f"📦 Available metadata: {metadata}")
            print(f"📦 Available customer data: {event_data.get('customer', {})}")
            return
        
        # Find the user
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            print(f"⚠️ User not found: {user_id}")
            return
        
        # Create or update subscription record
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status.in_(['active', 'on_hold'])
        ).first()
        
        if not subscription:
            # Create new subscription
            subscription = Subscription(
                user_id=user.id,
                plan_type=plan_id or 'pro',
                billing_cycle=billing_cycle or 'monthly',
                status='active',
                dodo_subscription_id=event_data.get('subscription_id'),
                dodo_customer_id=event_data.get('customer', {}).get('id'),
                amount=event_data.get('amount', 0) / 100 if event_data.get('amount') else None,  # Convert cents to dollars
                extra_metadata=json.dumps(metadata)
            )
            db.add(subscription)
            print(f"✅ Created new subscription for user {user.email}")
        else:
            # Update existing subscription
            subscription.status = 'active'
            subscription.plan_type = plan_id or subscription.plan_type
            subscription.billing_cycle = billing_cycle or subscription.billing_cycle
            print(f"✅ Updated existing subscription for user {user.email}")
        
        # Upgrade user to premium
        user.is_premium = True
        db.commit()
        
        print(f"✅ User {user.email} upgraded to premium (plan: {plan_id})")
        
    except Exception as e:
        print(f"❌ Error handling payment.succeeded: {e}")
        db.rollback()

async def handle_subscription_active(event_data: dict, db: Session):
    """Handle subscription activation webhook"""
    
    try:
        print(f"🔍 Processing subscription.active webhook")
        print(f"📦 Event data: {event_data}")
        
        # Extract customer information
        customer_email = event_data.get('customer', {}).get('email')
        subscription_id = event_data.get('subscription_id') or event_data.get('id')
        
        # Also try other possible locations for customer email
        if not customer_email:
            # Try subscription data
            subscription_data = event_data.get('subscription', {})
            customer_email = subscription_data.get('customer', {}).get('email')
        
        if not customer_email:
            print("⚠️ No customer email in subscription data")
            print(f"📦 Available data: {event_data}")
            return
        
        # Find the user by email
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            print(f"⚠️ User not found: {customer_email}")
            return
        
        # Create or update subscription record
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription:
            # Create new subscription
            subscription = Subscription(
                user_id=user.id,
                plan_type='pro',  # Default to pro
                status='active',
                dodo_subscription_id=subscription_id,
                dodo_customer_id=event_data.get('customer', {}).get('id'),
                extra_metadata=json.dumps(event_data)
            )
            db.add(subscription)
            print(f"✅ Created new subscription record for user {user.email}")
        else:
            # Update existing subscription
            subscription.status = 'active'
            subscription.dodo_subscription_id = subscription_id or subscription.dodo_subscription_id
            print(f"✅ Updated subscription status to active for user {user.email}")
        
        # Activate premium subscription
        user.is_premium = True
        db.commit()
        
        print(f"✅ Subscription activated for user {user.email}")
        
    except Exception as e:
        print(f"❌ Error handling subscription.active: {e}")
        db.rollback()

async def handle_subscription_renewed(event_data: dict, db: Session):
    """Handle subscription renewal webhook"""
    
    try:
        customer_email = event_data.get('customer', {}).get('email')
        
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                # Ensure user remains premium
                user.is_premium = True
                db.commit()
                print(f"✅ Subscription renewed for user {user.email}")
        
    except Exception as e:
        print(f"❌ Error handling subscription.renewed: {e}")
        db.rollback()

async def handle_subscription_cancelled(event_data: dict, db: Session):
    """Handle subscription cancellation webhook"""
    
    try:
        print(f"🔍 Processing subscription.cancelled webhook")
        print(f"📦 Event data: {event_data}")
        
        customer_email = event_data.get('customer', {}).get('email')
        subscription_id = event_data.get('subscription_id') or event_data.get('id')
        
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                # Update subscription record
                subscription = db.query(Subscription).filter(
                    Subscription.user_id == user.id,
                    Subscription.status == 'active'
                ).first()
                
                if subscription:
                    subscription.status = 'cancelled'
                    print(f"✅ Updated subscription record to cancelled for user {user.email}")
                
                # Downgrade user from premium
                user.is_premium = False
                db.commit()
                print(f"✅ Subscription cancelled for user {user.email}")
        
    except Exception as e:
        print(f"❌ Error handling subscription.cancelled: {e}")
        db.rollback()

async def handle_subscription_on_hold(event_data: dict, db: Session):
    """Handle subscription on hold webhook"""
    
    try:
        customer_email = event_data.get('customer', {}).get('email')
        
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                # For now, keep premium active but log the event
                # In production, you might want to implement grace period logic
                print(f"⚠️ Subscription on hold for user {user.email}")
        
    except Exception as e:
        print(f"❌ Error handling subscription.on_hold: {e}")

@payment_router.delete("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=400,
            detail="No active subscription to cancel"
        )
    
    print(f"🔄 Cancelling subscription for user {current_user.email}")
    
    try:
        # Import the payment processor
        from payment_processor import cancel_user_subscription
        
        # Cancel subscription using the payment processor
        result = cancel_user_subscription(db, current_user.id)
        
        if result["success"]:
            print(f"✅ Subscription cancelled for user {current_user.email}")
            return {
                "success": True,
                "message": result["message"]
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
    except Exception as e:
        print(f"❌ Cancellation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cancel subscription"
        )

@payment_router.post("/start-trial")
async def start_trial(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start 7-day free trial"""
    
    if current_user.is_premium:
        raise HTTPException(
            status_code=400,
            detail="User already has premium access"
        )
    
    print(f"🔄 Starting trial for user {current_user.email}")
    
    # Enable premium for trial
    current_user.is_premium = True
    
    try:
        db.commit()
        db.refresh(current_user)
        
        print(f"✅ Trial started for user {current_user.email}")
        
        return {
            "success": True,
            "message": "7-day free trial started! Enjoy all Pro features.",
            "trial_end_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Trial start error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start trial"
        )

@payment_router.get("/pricing")
async def get_pricing():
    """Get current pricing information"""
    return {
        "plans": {
            "free": {
                "name": "Starter",
                "price": {"monthly": 0, "yearly": 0},
                "features": [
                    "5 content generations per day",
                    "Text content only (up to 10,000 chars)",
                    "X, LinkedIn, Instagram formats",
                    "Copy to clipboard",
                    "Basic AI templates",
                    "Community support"
                ]
            },
            "pro": {
                "name": "Creator",
                "price": PRICING["pro"],
                "features": [
                    "Unlimited content generations",
                    "Text + URL processing",
                    "All social media formats + TikTok",
                    "Save & organize unlimited content",
                    "Content history & analytics",
                    "Advanced AI templates & styles",
                    "Priority support (24h response)",
                    "Export to multiple formats",
                    "Custom branding options",
                    "Bulk content processing (up to 50)"
                ]
            },
            "enterprise": {
                "name": "Agency",
                "price": PRICING["enterprise"],
                "features": [
                    "Everything in Creator",
                    "Team collaboration (up to 25 users)",
                    "White-label solution",
                    "Full API access & webhooks",
                    "Custom integrations",
                    "Advanced analytics dashboard",
                    "Dedicated account manager",
                    "Custom AI model training",
                    "99.9% SLA guarantee"
                ]
            }
        }
    }

@payment_router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get payment history for the current user"""
    
    try:
        print(f"🔍 Getting payment history for user {current_user.email}")
        
        # Import the payment processor
        from payment_processor import get_user_payment_history
        
        # Get payment history using the payment processor
        history = get_user_payment_history(db, current_user.id, limit)
        
        print(f"📊 Found {len(history)} payment records")
        
        return {
            "success": True,
            "payments": history,
            "total_count": len(history)
        }
        
    except Exception as e:
        print(f"❌ Error getting payment history: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get payment history"
        )

# Legacy endpoint for backward compatibility
@payment_router.post("/subscribe")
async def legacy_subscribe(
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Legacy subscribe endpoint - redirects to checkout session creation"""
    
    # Extract plan info from legacy request
    plan_id = request.get('plan_id', 'pro')
    billing_cycle = request.get('billing_cycle', 'monthly')
    
    # Create checkout session request
    checkout_request = CheckoutSessionRequest(
        plan_id=plan_id,
        billing_cycle=billing_cycle
    )
    
    # Create and return checkout session
    return await create_checkout_session(checkout_request, current_user, db)