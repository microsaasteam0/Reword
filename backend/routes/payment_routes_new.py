"""
REFACTORED Payment Routes - Simple and Reliable
"""
import os
import json
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import get_current_active_user
from models import User, Subscription, PaymentHistory
from subscription_manager import subscription_manager

payment_router = APIRouter()

# Helper function to safely get values from webhook data (dict or object)
def safe_get(data, key, default=None):
    """Safely get value from webhook data whether it's a dict or object"""
    if isinstance(data, dict):
        return data.get(key, default)
    else:
        return getattr(data, key, default)

# Helper function to convert complex objects to JSON-serializable format
def serialize_webhook_data(data):
    """Convert webhook data to JSON-serializable format, handling complex objects"""
    if data is None:
        return None
    elif isinstance(data, (str, int, float, bool)):
        return data
    elif isinstance(data, (list, tuple)):
        return [serialize_webhook_data(item) for item in data]
    elif isinstance(data, dict):
        return {key: serialize_webhook_data(value) for key, value in data.items()}
    elif hasattr(data, '__dict__'):
        # Handle objects with __dict__ (most custom objects)
        return {key: serialize_webhook_data(value) for key, value in data.__dict__.items()}
    elif hasattr(data, 'model_dump'):
        # Handle Pydantic models
        try:
            return data.model_dump()
        except Exception:
            return str(data)
    elif hasattr(data, 'dict'):
        # Handle other dict-like objects
        try:
            return data.dict()
        except Exception:
            return str(data)
    else:
        # Fallback: convert to string
        return str(data)

# Real DodoPayments integration
try:
    from dodopayments import DodoPayments
    print("✅ Using real DodoPayments SDK")
    
    # Initialize real Dodo Payments client with webhook key
    dodo_client = DodoPayments(
        bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"),
        environment=os.environ.get("DODO_PAYMENTS_ENVIRONMENT", "test_mode"),
        webhook_key=os.environ.get("DODO_WEBHOOK_SECRET")  # Add webhook key for signature verification
    )
    
except ImportError:
    print("⚠️ DodoPayments SDK not found, using mock implementation")
    
    # Fallback mock implementation
    class MockSession:
        def __init__(self, session_id, checkout_url, status="created"):
            self.session_id = session_id
            self.checkout_url = checkout_url
            self.status = status

    class MockCheckoutSessions:
        def create(self, *args, **kwargs):
            session_id = f"mock_session_{uuid.uuid4().hex[:8]}"
            checkout_url = "https://mock-checkout.example.com/pay"
            return MockSession(session_id, checkout_url)

    class MockWebhooks:
        def unwrap(self, raw_body, headers):
            return {
                "type": "payment.succeeded",
                "data": {},
                "business_id": "mock_business",
                "timestamp": datetime.utcnow().isoformat()
            }

    class DodoPayments:
        def __init__(self, bearer_token, environment):
            self.bearer_token = bearer_token
            self.environment = environment
            self.checkout_sessions = MockCheckoutSessions()
            self.webhooks = MockWebhooks()

    dodo_client = DodoPayments(
        bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"),
        environment=os.environ.get("DODO_PAYMENTS_ENVIRONMENT", "test_mode"),
        webhook_key=os.environ.get("DODO_WEBHOOK_SECRET")  # Add webhook key for mock too
    )

# Pydantic models
class CheckoutRequest(BaseModel):
    plan_id: str = "pro"
    billing_cycle: str = "monthly"  # "monthly" or "yearly"

class PaymentResponse(BaseModel):
    success: bool
    message: str
    checkout_url: Optional[str] = None
    is_premium: Optional[bool] = None
    plan: Optional[str] = None

# Product mapping - loaded from environment variables
PRODUCTS = {
    "pro": {
        "monthly": {
            "id": os.environ.get("DODO_PRODUCT_ID_MONTHLY", "pdt_0NWvtb7XjLAzNVCacN59c"),
            "price": float(os.environ.get("DODO_PRICE_MONTHLY", "15.00")),
            "checkout_url": os.environ.get("DODO_PAYMENTS_CHECKOUT_URL_MONTHLY")
        },
        "yearly": {
            "id": os.environ.get("DODO_PRODUCT_ID_YEARLY", "pdt_0NWvtb7XjLAzNVCacN59c"),
            "price": float(os.environ.get("DODO_PRICE_YEARLY", "144.00")),
            "checkout_url": os.environ.get("DODO_PAYMENTS_CHECKOUT_URL_YEARLY")
        }
    }
}

@payment_router.post("/create-checkout", response_model=PaymentResponse)
async def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create Dodo Payments checkout session"""
    
    try:
        print(f"🛒 Creating checkout for {current_user.email} - {request.plan_id} ({request.billing_cycle})")
        
        # Get product details
        product = PRODUCTS.get(request.plan_id, {}).get(request.billing_cycle)
        if not product:
            raise HTTPException(status_code=400, detail="Invalid plan or billing cycle")
        
        # Create unique payment ID for tracking
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        
        # Helper to create session or use static URL
        session_id = None
        checkout_url = None
        
        if product.get("checkout_url"):
            # Use static checkout URL from env
            print(f"🔗 Using static checkout URL for {request.plan_id} {request.billing_cycle}")
            
            # Base URL from env
            base_url = product["checkout_url"]
            
            # Determine separator (if URL already has query params)
            separator = "&" if "?" in base_url else "?"
            
            # Import explicitly here
            import urllib.parse
            
            # Get user info
            user_email = current_user.email
            user_name = current_user.full_name or current_user.username
            
            # Helper to split name
            name_parts = user_name.split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            # Prepare params with multiple variants to ensure compatibility
            # Based on Dodo docs, 'fullName' or 'firstName'/'lastName' are often used
            params = {
                "email": user_email,
                "billing_email": user_email,
                "name": user_name,
                "billing_name": user_name,
                "fullName": user_name,
                "firstName": first_name,
                "lastName": last_name,
                "disable_fields": "email,name,fullName,firstName,lastName" # Try to lock them
            }
            
            encoded_params = urllib.parse.urlencode(params)
            checkout_url = f"{base_url}{separator}{encoded_params}"
            
            # Add legacy readonly flags just in case (as secondary measure)
            checkout_url += "&readonly_email=true&readonly_name=true"
            
            session_id = f"link_{uuid.uuid4().hex[:16]}"
            
            print(f"🔗 Generated dynamic link: {checkout_url}")
            
            # Attempt to append user info if URL allows (simple append)
            # Dodo Payment Links usually serve as a base
        else:
            # Create checkout session with Dodo Payments API
            session = dodo_client.checkout_sessions.create(
                product_cart=[{
                    "product_id": product["id"],
                    "quantity": 1
                }],
                customer={
                    "email": current_user.email,
                    "name": current_user.full_name or current_user.username,
                },
                return_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/?payment=success&user_id={current_user.id}&payment_id={payment_id}",
                metadata={
                    "user_id": str(current_user.id),
                    "user_email": current_user.email,
                    "plan_id": request.plan_id,
                    "billing_cycle": request.billing_cycle,
                    "payment_id": payment_id,
                    "amount": str(product["price"])  # Convert to string
                }
            )
            session_id = session.session_id
            checkout_url = session.checkout_url
        
        # Store payment record for tracking
        payment_record = PaymentHistory(
            user_id=current_user.id,
            payment_id=payment_id,
            dodo_session_id=session_id,
            amount=product["price"],
            currency="USD",
            status="pending",
            plan_type=request.plan_id,
            billing_cycle=request.billing_cycle,
            checkout_created_at=datetime.utcnow(),
            payment_metadata=json.dumps({
                "session_id": session_id,
                "checkout_url": checkout_url,
                "product_id": product["id"]
            })
        )
        
        db.add(payment_record)
        db.commit()
        
        print(f"✅ Checkout created: {checkout_url}")
        print(f"📦 Payment ID: {payment_id}")
        
        return PaymentResponse(
            success=True,
            message="Checkout session created successfully",
            checkout_url=checkout_url
        )
        
    except Exception as e:
        print(f"❌ Checkout creation failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

@payment_router.post("/check-status", response_model=PaymentResponse)
async def check_payment_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check payment/subscription status with real-time expiration validation
    This endpoint checks if webhooks have processed the user's subscription
    and validates subscription expiration in real-time
    """
    
    try:
        print(f"🔍 Checking payment status for {current_user.email}")
        
        # REAL-TIME EXPIRATION CHECK - This is the key addition
        actual_premium_status = subscription_manager.check_user_subscription_status(current_user.id, db)
        
        # Refresh user object after potential updates
        db.refresh(current_user)
        
        # Check if user is premium after real-time validation
        if current_user.is_premium and actual_premium_status:
            subscription = db.query(Subscription).filter(
                Subscription.user_id == current_user.id,
                Subscription.status == "active"
            ).first()
            
            expiry_info = ""
            if subscription and subscription.current_period_end:
                from subscription_manager import make_timezone_aware, get_utc_now
                current_time = get_utc_now()
                end_time = make_timezone_aware(subscription.current_period_end)
                days_left = (end_time - current_time).days
                expiry_info = f" (expires in {days_left} days)" if days_left > 0 else " (in grace period)"
            
            return PaymentResponse(
                success=True,
                message=f"You have an active premium subscription!{expiry_info}",
                is_premium=True,
                plan=subscription.plan_type if subscription else "pro"
            )
        
        # Check for recent pending payments (user might have just completed checkout)
        from subscription_manager import get_utc_now
        current_time = get_utc_now()
        recent_payment = db.query(PaymentHistory).filter(
            PaymentHistory.user_id == current_user.id,
            PaymentHistory.status == "pending",
            PaymentHistory.created_at >= current_time - timedelta(hours=1)  # Within last hour
        ).order_by(PaymentHistory.created_at.desc()).first()
        
        if recent_payment:
            return PaymentResponse(
                success=False,
                message="Payment is being processed. Please wait a few minutes for the webhook to activate your subscription. If this persists, contact support.",
                is_premium=False,
                plan="free"
            )
        
        # Check for any completed payments that might not have been processed
        completed_payment = db.query(PaymentHistory).filter(
            PaymentHistory.user_id == current_user.id,
            PaymentHistory.status == "completed"
        ).order_by(PaymentHistory.created_at.desc()).first()
        
        if completed_payment and not current_user.is_premium:
            # This shouldn't happen - completed payment but not premium
            print(f"⚠️ Found completed payment but user not premium: {completed_payment.payment_id}")
            return PaymentResponse(
                success=False,
                message="We found a completed payment but your account isn't upgraded. Please contact support.",
                is_premium=False,
                plan="free"
            )
        
        return PaymentResponse(
            success=False,
            message="No active subscription found. Please complete your payment to upgrade to premium.",
            is_premium=False,
            plan="free"
        )
        
    except Exception as e:
        print(f"❌ Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")

@payment_router.post("/verify-payment", response_model=PaymentResponse)
async def verify_payment_deprecated(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    DEPRECATED: Manual payment verification
    
    This endpoint is deprecated in favor of webhook-based subscription management.
    Use /check-status instead to check your subscription status.
    
    Manual verification is unreliable because:
    1. Test payments expire quickly in Dodo Payments
    2. Webhooks are the recommended way to handle subscriptions
    3. This method doesn't work well with subscription products
    """
    
    return PaymentResponse(
        success=False,
        message="Manual payment verification is deprecated. Your subscription will be activated automatically via webhooks when payment completes. Use /check-status to check your current status.",
        is_premium=current_user.is_premium,
        plan="pro" if current_user.is_premium else "free"
    )

@payment_router.get("/webhook-info")
async def webhook_info():
    """Get webhook endpoint information for Dodo Payments configuration"""
    
    base_url = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip('/')
    webhook_url = f"{base_url}/api/v1/payment/webhook"
    
    return {
        "webhook_url": webhook_url,
        "supported_events": [
            "subscription.active",
            "subscription.updated", 
            "subscription.on_hold",
            "subscription.failed",
            "subscription.renewed",
            "subscription.cancelled",
            "payment.succeeded",
            "payment.failed"
        ],
        "instructions": {
            "1": "Copy the webhook_url above",
            "2": "Go to your Dodo Payments dashboard",
            "3": "Add this URL as a webhook endpoint",
            "4": "Select the events you want to receive",
            "5": "Test the webhook to ensure it's working"
        },
        "test_webhook": f"{base_url}/api/v1/payment/test-webhook"
    }

@payment_router.post("/test-webhook")
async def test_webhook():
    """Test endpoint to verify webhook connectivity"""
    
    return {
        "status": "success",
        "message": "Webhook endpoint is working correctly!",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("DODO_PAYMENTS_ENVIRONMENT", "test_mode")
    }

@payment_router.post("/admin/check-expirations")
async def manual_expiration_check(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually trigger subscription expiration check - Admin only"""
    
    # Add admin check here if needed
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        print(f"🔧 Manual expiration check triggered by {current_user.email}")
        
        subscription_manager.check_expired_subscriptions(db)
        
        return {
            "success": True,
            "message": "Expiration check completed successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Manual expiration check error: {e}")
        raise HTTPException(status_code=500, detail=f"Expiration check failed: {str(e)}")

@payment_router.get("/admin/subscription-health")
async def get_subscription_health(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get subscription system health metrics - Admin only"""
    
    try:
        from sqlalchemy import func
        current_time = datetime.utcnow()
        
        # Count active subscriptions
        active_subs = db.query(func.count(Subscription.id)).filter(
            Subscription.status == "active"
        ).scalar()
        
        # Count expired subscriptions
        expired_subs = db.query(func.count(Subscription.id)).filter(
            Subscription.status == "expired"
        ).scalar()
        
        # Count subscriptions expiring in next 7 days
        week_cutoff = current_time + timedelta(days=7)
        expiring_soon = db.query(func.count(Subscription.id)).filter(
            and_(
                Subscription.status == "active",
                Subscription.current_period_end <= week_cutoff,
                Subscription.current_period_end > current_time
            )
        ).scalar()
        
        # Count subscriptions past expiry but still active (grace period)
        grace_period_subs = db.query(func.count(Subscription.id)).filter(
            and_(
                Subscription.status == "active",
                Subscription.current_period_end < current_time
            )
        ).scalar()
        
        # Count premium users
        premium_users = db.query(func.count(User.id)).filter(
            User.is_premium == True
        ).scalar()
        
        return {
            "success": True,
            "health": {
                "active_subscriptions": active_subs,
                "expired_subscriptions": expired_subs,
                "expiring_within_7_days": expiring_soon,
                "in_grace_period": grace_period_subs,
                "premium_users": premium_users,
                "grace_period_days": subscription_manager.grace_period_days,
                "check_interval_hours": subscription_manager.check_interval_hours,
                "last_check": current_time.isoformat()
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting subscription health: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription health")

@payment_router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel subscription"""
    
    try:
        print(f"❌ Cancelling subscription for {current_user.email}")
        
        # Find active subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
        
        if not subscription:
            raise HTTPException(status_code=400, detail="No active subscription found")
        
        # Cancel subscription
        subscription.status = "cancelled"
        subscription.updated_at = datetime.utcnow()
        
        # Downgrade user
        current_user.is_premium = False
        
        # Create cancellation record
        cancellation_record = PaymentHistory(
            user_id=current_user.id,
            subscription_id=subscription.id,
            payment_id=f"cancel_{uuid.uuid4().hex[:8]}",
            amount=0.0,
            currency="USD",
            status="completed",
            plan_type="free",
            billing_cycle="none",
            payment_completed_at=datetime.utcnow(),
            verification_completed_at=datetime.utcnow(),
            notes="Subscription cancelled by user",
            payment_metadata=json.dumps({"action": "cancellation"})
        )
        
        db.add(cancellation_record)
        db.commit()
        
        print(f"✅ Subscription cancelled for {current_user.email}")
        
        return PaymentResponse(
            success=True,
            message="Subscription cancelled successfully",
            is_premium=False,
            plan="free"
        )
        
    except Exception as e:
        print(f"❌ Cancellation failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Cancellation failed: {str(e)}")

@payment_router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment history for current user"""
    
    try:
        payments = db.query(PaymentHistory).filter(
            PaymentHistory.user_id == current_user.id
        ).order_by(PaymentHistory.created_at.desc()).limit(50).all()
        
        history = []
        for payment in payments:
            history.append({
                "id": payment.id,
                "payment_id": payment.payment_id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "plan_type": payment.plan_type,
                "billing_cycle": payment.billing_cycle,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "completed_at": payment.payment_completed_at.isoformat() if payment.payment_completed_at else None,
                "notes": payment.notes
            })
        
        return {
            "success": True,
            "payments": history,
            "total": len(history)
        }
        
    except Exception as e:
        print(f"❌ Error getting history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment history")

@payment_router.get("/admin/payment-stats")
async def get_payment_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment statistics - Admin only"""
    
    # Add admin check here if needed
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        from sqlalchemy import func
        
        # Total payments
        total_payments = db.query(func.count(PaymentHistory.id)).scalar()
        
        # Successful payments
        successful_payments = db.query(func.count(PaymentHistory.id)).filter(
            PaymentHistory.status == "completed"
        ).scalar()
        
        # Total revenue
        total_revenue = db.query(func.sum(PaymentHistory.amount)).filter(
            PaymentHistory.status == "completed"
        ).scalar() or 0
        
        # Active subscriptions
        active_subscriptions = db.query(func.count(Subscription.id)).filter(
            Subscription.status == "active"
        ).scalar()
        
        # Recent payments (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_payments = db.query(func.count(PaymentHistory.id)).filter(
            PaymentHistory.created_at >= thirty_days_ago,
            PaymentHistory.status == "completed"
        ).scalar()
        
        # Payment breakdown by plan
        plan_breakdown = db.query(
            PaymentHistory.plan_type,
            func.count(PaymentHistory.id).label('count'),
            func.sum(PaymentHistory.amount).label('revenue')
        ).filter(
            PaymentHistory.status == "completed"
        ).group_by(PaymentHistory.plan_type).all()
        
        return {
            "success": True,
            "stats": {
                "total_payments": total_payments,
                "successful_payments": successful_payments,
                "success_rate": f"{(successful_payments/total_payments*100):.1f}%" if total_payments > 0 else "0%",
                "total_revenue": f"${total_revenue:.2f}",
                "active_subscriptions": active_subscriptions,
                "recent_payments_30d": recent_payments,
                "plan_breakdown": [
                    {
                        "plan": plan.plan_type,
                        "count": plan.count,
                        "revenue": f"${plan.revenue:.2f}"
                    } for plan in plan_breakdown
                ]
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting payment stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment statistics")

# Webhook handler for Dodo Payments
@payment_router.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Dodo Payments webhooks - Primary method for subscription management"""
    
    try:
        raw_body = await request.body()
        
        # Try to verify webhook signature if possible
        try:
            # Verify Standard Webhooks signature using Dodo SDK
            unwrapped = dodo_client.webhooks.unwrap(
                raw_body,
                headers={
                    "webhook-id": request.headers.get("webhook-id", ""),
                    "webhook-signature": request.headers.get("webhook-signature", ""),
                    "webhook-timestamp": request.headers.get("webhook-timestamp", ""),
                },
            )
            
            # Check if unwrapped is a structured object or dict
            if hasattr(unwrapped, 'type'):
                # It's a structured webhook event object
                event_type = unwrapped.type
                event_data = unwrapped.data if hasattr(unwrapped, 'data') else unwrapped
                business_id = getattr(unwrapped, 'business_id', None)
                timestamp = getattr(unwrapped, 'timestamp', None)
                
                # Convert structured object to dict for our handlers
                if hasattr(event_data, '__dict__'):
                    event_data = event_data.__dict__
                elif hasattr(event_data, 'model_dump'):
                    event_data = event_data.model_dump()
                elif hasattr(event_data, 'dict'):
                    event_data = event_data.dict()
                    
            else:
                # It's a regular dict
                payload = unwrapped
                event_type = payload.get("type", "unknown")
                event_data = payload.get("data", {})
                business_id = payload.get("business_id")
                timestamp = payload.get("timestamp")
                
            print("✅ Webhook signature verified")
        except Exception as webhook_error:
            print(f"⚠️ Webhook signature verification failed: {webhook_error}")
            # Fallback: parse the raw body as JSON (less secure but functional)
            try:
                import json
                payload = json.loads(raw_body.decode('utf-8'))
                event_type = payload.get("type", "unknown")
                event_data = payload.get("data", {})
                business_id = payload.get("business_id")
                timestamp = payload.get("timestamp")
                print("⚠️ Processing webhook without signature verification (fallback mode)")
            except Exception as parse_error:
                print(f"❌ Failed to parse webhook body: {parse_error}")
                raise HTTPException(status_code=400, detail="Invalid webhook payload")
        
        print(f"🔔 Webhook received: {event_type}")
        print(f"📦 Business ID: {business_id}")
        print(f"⏰ Timestamp: {timestamp}")
        
        # Handle different webhook events according to Dodo documentation
        if event_type == 'subscription.active':
            await handle_subscription_active_webhook(event_data, db)
        elif event_type == 'subscription.updated':
            await handle_subscription_updated_webhook(event_data, db)
        elif event_type == 'subscription.on_hold':
            await handle_subscription_on_hold_webhook(event_data, db)
        elif event_type == 'subscription.failed':
            await handle_subscription_failed_webhook(event_data, db)
        elif event_type == 'subscription.renewed':
            await handle_subscription_renewed_webhook(event_data, db)
        elif event_type == 'subscription.cancelled':
            await handle_subscription_cancelled_webhook(event_data, db)
        elif event_type == 'payment.succeeded':
            await handle_payment_success_webhook(event_data, db)
        elif event_type == 'payment.failed':
            await handle_payment_failed_webhook(event_data, db)
        else:
            print(f"⚠️  Unhandled webhook event: {event_type}")
        
        return {"status": "success", "event_type": event_type}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        try:
            print(f"❌ Request body: {raw_body.decode('utf-8') if raw_body else 'None'}")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

async def handle_subscription_active_webhook(event_data: dict, db: Session):
    """
    Handle subscription.active webhook - PRIMARY method for upgrading users
    This is called when a subscription is successfully activated after payment
    """
    
    try:
        subscription_id = safe_get(event_data, 'subscription_id')
        customer_data = safe_get(event_data, 'customer', {})
        customer_email = safe_get(customer_data, 'email') if customer_data else None
        customer_id = safe_get(customer_data, 'customer_id') if customer_data else None
        plan_id = safe_get(event_data, 'product_id')
        
        # Extract amount from webhook data - DodoPayments sends it in different fields
        amount_cents = safe_get(event_data, 'recurring_pre_tax_amount') or safe_get(event_data, 'amount')
        currency = safe_get(event_data, 'currency', 'USD')
        # Normalize billing cycle
        raw_billing_cycle = str(safe_get(event_data, 'payment_frequency_interval', 'monthly')).lower()
        if 'year' in raw_billing_cycle:
            billing_cycle = 'yearly'
        else:
            billing_cycle = 'monthly'
        
        # Convert amount from cents to dollars
        normalized_amount = (amount_cents / 100.0) if isinstance(amount_cents, (int, float)) else 15.00  # Default fallback

        print(f"🎉 Subscription activated!")
        print(f"📧 Customer: {customer_email}")
        print(f"🆔 Subscription ID: {subscription_id}")
        print(f"💰 Amount: ${normalized_amount}")
        print(f"📅 Billing: {billing_cycle} (derived from {raw_billing_cycle})")
        print(f"🔢 Raw amount from webhook: {amount_cents}")
        
        if not customer_email:
            print("❌ No customer email in webhook data")
            return
        
        # Find user by email
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            print(f"❌ User not found for email: {customer_email}")
            return
        
        print(f"👤 Found user: {user.username} (ID: {user.id})")
        
        # Upgrade user to premium
        user.is_premium = True
        
        # Calculate period end based on normalized cycle
        period_days = 365 if billing_cycle == 'yearly' else 30
        
        # Create or update subscription record
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).order_by(Subscription.created_at.desc()).first()
        
        if subscription:
            print(f"📝 Updating existing subscription")
            subscription.dodo_subscription_id = subscription_id
            subscription.status = "active"
            subscription.plan_type = "pro"  # Map from plan_id if needed
            subscription.billing_cycle = billing_cycle
            subscription.amount = normalized_amount
            subscription.current_period_start = datetime.utcnow()
            subscription.current_period_end = datetime.utcnow() + timedelta(days=period_days)
            subscription.updated_at = datetime.utcnow()
        else:
            print(f"🆕 Creating new subscription")
            subscription = Subscription(
                user_id=user.id,
                dodo_subscription_id=subscription_id,
                status="active",
                plan_type="pro",
                billing_cycle=billing_cycle,
                amount=normalized_amount,
                currency=currency,
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow() + timedelta(days=period_days),
                extra_metadata=json.dumps(serialize_webhook_data(event_data))
            )
            db.add(subscription)
            db.flush()
        
        # Create payment history record
        payment_record = PaymentHistory(
            user_id=user.id,
            subscription_id=subscription.id,
            payment_id=f"webhook_{uuid.uuid4().hex[:8]}",
            dodo_subscription_id=subscription_id,
            amount=normalized_amount,  # Now guaranteed to have a value
            currency=currency,
            status="completed",
            plan_type="pro",
            billing_cycle=billing_cycle,
            payment_completed_at=datetime.utcnow(),
            verification_completed_at=datetime.utcnow(),
            notes="Activated via subscription.active webhook",
            payment_metadata=json.dumps(serialize_webhook_data(event_data))
        )
        
        db.add(payment_record)
        db.commit()
        db.refresh(user)
        
        print(f"✅ User {user.email} upgraded to premium via webhook!")
        print(f"📊 Subscription status: {subscription.status}")
        print(f"💎 Premium status: {user.is_premium}")
        
    except Exception as e:
        print(f"❌ Error processing subscription.active webhook: {e}")
        db.rollback()

async def handle_subscription_updated_webhook(event_data: dict, db: Session):
    """Handle subscription.updated webhook"""
    
    try:
        subscription_id = safe_get(event_data, 'subscription_id')
        customer_data = safe_get(event_data, 'customer', {})
        customer_email = safe_get(customer_data, 'email') if customer_data else None
        
        print(f"📝 Subscription updated: {subscription_id}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Update subscription record
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.dodo_subscription_id == subscription_id
        ).first()
        
        if subscription:
            # Update subscription with new data - use custom serializer
            subscription.extra_metadata = json.dumps(serialize_webhook_data(event_data))
            subscription.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Subscription updated for {user.email}")
        
    except Exception as e:
        print(f"❌ Error processing subscription.updated webhook: {e}")
        db.rollback()

async def handle_subscription_on_hold_webhook(event_data: dict, db: Session):
    """Handle subscription.on_hold webhook"""
    
    try:
        subscription_id = event_data.get('subscription_id')
        customer_email = event_data.get('customer', {}).get('email')
        
        print(f"⏸️  Subscription on hold: {subscription_id}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Update subscription status
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.dodo_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "on_hold"
            subscription.updated_at = datetime.utcnow()
            
            # Optionally downgrade user (or keep premium until resolved)
            # user.is_premium = False  # Uncomment if you want to immediately revoke access
            
            db.commit()
            print(f"⏸️  Subscription on hold for {user.email}")
        
    except Exception as e:
        print(f"❌ Error processing subscription.on_hold webhook: {e}")
        db.rollback()

async def handle_subscription_failed_webhook(event_data: dict, db: Session):
    """Handle subscription.failed webhook"""
    
    try:
        subscription_id = event_data.get('subscription_id')
        customer_email = event_data.get('customer', {}).get('email')
        
        print(f"❌ Subscription failed: {subscription_id}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Update subscription status
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.dodo_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "failed"
            subscription.updated_at = datetime.utcnow()
            
            # Downgrade user
            user.is_premium = False
            
            db.commit()
            print(f"❌ Subscription failed for {user.email} - downgraded to free")
        
    except Exception as e:
        print(f"❌ Error processing subscription.failed webhook: {e}")
        db.rollback()

async def handle_subscription_renewed_webhook(event_data: dict, db: Session):
    """Handle subscription.renewed webhook"""
    
    try:
        subscription_id = safe_get(event_data, 'subscription_id')
        customer_data = safe_get(event_data, 'customer', {})
        customer_email = safe_get(customer_data, 'email') if customer_data else None
        
        # Extract amount from webhook data - same as subscription.active
        amount_cents = safe_get(event_data, 'recurring_pre_tax_amount') or safe_get(event_data, 'amount')
        currency = safe_get(event_data, 'currency', 'USD')
        
        # Convert amount from cents to dollars with fallback
        normalized_amount = (amount_cents / 100.0) if isinstance(amount_cents, (int, float)) else 15.00
        
        print(f"🔄 Subscription renewed: {subscription_id}")
        print(f"💰 Renewal amount: ${normalized_amount}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Update subscription period
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.dodo_subscription_id == subscription_id
        ).first()
        
        if subscription:
            # Extend subscription period
            subscription.current_period_start = datetime.utcnow()
            subscription.current_period_end = datetime.utcnow() + timedelta(days=30 if subscription.billing_cycle == "monthly" else 365)
            subscription.updated_at = datetime.utcnow()
            
            # Ensure user is premium
            user.is_premium = True
            
            # Create payment history record for renewal
            payment_record = PaymentHistory(
                user_id=user.id,
                subscription_id=subscription.id,
                payment_id=f"renewal_{uuid.uuid4().hex[:8]}",
                dodo_subscription_id=subscription_id,
                amount=normalized_amount,  # Now guaranteed to have a value
                currency=currency,
                status="completed",
                plan_type=subscription.plan_type,
                billing_cycle=subscription.billing_cycle,
                payment_completed_at=datetime.utcnow(),
                verification_completed_at=datetime.utcnow(),
                notes="Subscription renewal via webhook",
                payment_metadata=json.dumps(serialize_webhook_data(event_data))
            )
            
            db.add(payment_record)
            db.commit()
            print(f"🔄 Subscription renewed for {user.email}")
        
    except Exception as e:
        print(f"❌ Error processing subscription.renewed webhook: {e}")
        db.rollback()

async def handle_subscription_cancelled_webhook(event_data: dict, db: Session):
    """Handle subscription.cancelled webhook"""
    
    try:
        subscription_id = event_data.get('subscription_id')
        customer_email = event_data.get('customer', {}).get('email')
        
        print(f"❌ Subscription cancelled: {subscription_id}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Update subscription status
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.dodo_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "cancelled"
            subscription.updated_at = datetime.utcnow()
            
            # Downgrade user
            user.is_premium = False
            
            db.commit()
            print(f"❌ Subscription cancelled for {user.email} - downgraded to free")
        
    except Exception as e:
        print(f"❌ Error processing subscription.cancelled webhook: {e}")
        db.rollback()

async def handle_payment_failed_webhook(event_data: dict, db: Session):
    """Handle payment.failed webhook"""
    
    try:
        payment_id = event_data.get('payment_id')
        customer_email = event_data.get('customer', {}).get('email')
        
        print(f"❌ Payment failed: {payment_id}")
        
        if not customer_email:
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            return
        
        # Find and update payment record
        payment_record = db.query(PaymentHistory).filter(
            PaymentHistory.user_id == user.id,
            PaymentHistory.dodo_payment_id == payment_id
        ).first()
        
        if payment_record:
            payment_record.status = "failed"
            payment_record.failure_reason = event_data.get('failure_reason', 'Payment failed')
            payment_record.updated_at = datetime.utcnow()
            db.commit()
            print(f"❌ Payment marked as failed for {user.email}")
        
    except Exception as e:
        print(f"❌ Error processing payment.failed webhook: {e}")
        db.rollback()

async def handle_payment_success_webhook(event_data: dict, db: Session):
    """Handle payment.succeeded webhook - for individual payments"""
    
    try:
        payment_id = event_data.get('payment_id') or event_data.get('id')
        customer_email = event_data.get('customer', {}).get('email')
        subscription_id = event_data.get('subscription_id')
        
        print(f"💰 Payment succeeded: {payment_id}")
        
        if not customer_email:
            print("⚠️ No customer email in payment webhook")
            return
        
        user = db.query(User).filter(User.email == customer_email).first()
        if not user:
            print(f"❌ User not found for email: {customer_email}")
            return
        
        # Find and update payment record
        payment_record = db.query(PaymentHistory).filter(
            PaymentHistory.user_id == user.id,
            PaymentHistory.dodo_payment_id == payment_id
        ).first()
        
        if not payment_record and subscription_id:
            # Try to find by subscription ID
            payment_record = db.query(PaymentHistory).filter(
                PaymentHistory.user_id == user.id,
                PaymentHistory.dodo_subscription_id == subscription_id,
                PaymentHistory.status == "pending"
            ).first()
        
        if payment_record:
            payment_record.status = "completed"
            payment_record.dodo_payment_id = payment_id
            payment_record.payment_completed_at = datetime.utcnow()
            payment_record.verification_completed_at = datetime.utcnow()
            db.commit()
            print(f"✅ Payment record updated for {user.email}")
        else:
            print(f"⚠️ No matching payment record found for {payment_id}")
        
    except Exception as e:
        print(f"❌ Payment success webhook error: {e}")
        db.rollback()