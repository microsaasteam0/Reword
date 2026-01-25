"""
Admin Routes for SnippetStream
Provides administrative endpoints for subscription management and system monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
from models import User, Subscription
from subscription_manager import SubscriptionManager
from background_tasks import manual_subscription_check

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Response models
class SubscriptionInfo(BaseModel):
    id: int
    user_id: int
    user_email: str
    plan_type: str
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_end: Optional[datetime]
    is_expired: bool
    days_until_expiry: Optional[int]

class AdminStatsResponse(BaseModel):
    total_users: int
    premium_users: int
    active_subscriptions: int
    expired_subscriptions: int
    trial_subscriptions: int
    subscriptions_expiring_soon: int  # Within 7 days

class SubscriptionCheckResponse(BaseModel):
    success: bool
    expired_count: int
    errors: List[str]
    checked_at: datetime

def is_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Check if current user is admin (for now, just check if it's a specific email)"""
    # TODO: Add proper admin role system
    admin_emails = [
        "admin@entrext.in",
        "business@entrext.in",
        # Add more admin emails as needed
    ]
    
    if current_user.email not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin_user)
):
    """Get system statistics for admin dashboard"""
    try:
        current_time = datetime.now(timezone.utc)
        
        # Basic user stats
        total_users = db.query(User).count()
        premium_users = db.query(User).filter(User.is_premium == True).count()
        
        # Subscription stats
        active_subscriptions = db.query(Subscription).filter(
            Subscription.status == "active"
        ).count()
        
        expired_subscriptions = db.query(Subscription).filter(
            Subscription.status == "expired"
        ).count()
        
        trial_subscriptions = db.query(Subscription).filter(
            and_(
                Subscription.status == "active",
                Subscription.trial_end != None,
                Subscription.trial_end > current_time
            )
        ).count()
        
        # Subscriptions expiring within 7 days
        from datetime import timedelta
        seven_days_from_now = current_time + timedelta(days=7)
        
        subscriptions_expiring_soon = db.query(Subscription).filter(
            and_(
                Subscription.status == "active",
                (
                    (Subscription.current_period_end != None) & 
                    (Subscription.current_period_end <= seven_days_from_now) & 
                    (Subscription.current_period_end > current_time)
                ) |
                (
                    (Subscription.trial_end != None) & 
                    (Subscription.trial_end <= seven_days_from_now) & 
                    (Subscription.trial_end > current_time)
                )
            )
        ).count()
        
        return AdminStatsResponse(
            total_users=total_users,
            premium_users=premium_users,
            active_subscriptions=active_subscriptions,
            expired_subscriptions=expired_subscriptions,
            trial_subscriptions=trial_subscriptions,
            subscriptions_expiring_soon=subscriptions_expiring_soon
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get admin stats: {str(e)}"
        )

@router.get("/subscriptions", response_model=List[SubscriptionInfo])
async def get_all_subscriptions(
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin_user)
):
    """Get all subscriptions with detailed information"""
    try:
        current_time = datetime.now(timezone.utc)
        
        query = db.query(Subscription, User).join(User, Subscription.user_id == User.id)
        
        if status_filter:
            query = query.filter(Subscription.status == status_filter)
        
        subscriptions = query.order_by(Subscription.created_at.desc()).offset(offset).limit(limit).all()
        
        result = []
        for subscription, user in subscriptions:
            # Calculate if expired and days until expiry
            is_expired = False
            days_until_expiry = None
            
            expiry_date = subscription.current_period_end or subscription.trial_end
            if expiry_date:
                if current_time > expiry_date:
                    is_expired = True
                else:
                    days_until_expiry = (expiry_date - current_time).days
            
            result.append(SubscriptionInfo(
                id=subscription.id,
                user_id=subscription.user_id,
                user_email=user.email,
                plan_type=subscription.plan_type,
                status=subscription.status,
                current_period_start=subscription.current_period_start,
                current_period_end=subscription.current_period_end,
                trial_end=subscription.trial_end,
                is_expired=is_expired,
                days_until_expiry=days_until_expiry
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscriptions: {str(e)}"
        )

@router.post("/check-subscriptions", response_model=SubscriptionCheckResponse)
async def manual_check_subscriptions(
    admin_user: User = Depends(is_admin_user)
):
    """Manually trigger subscription expiration check"""
    try:
        result = await manual_subscription_check()
        
        return SubscriptionCheckResponse(
            success=result["success"],
            expired_count=result.get("expired_count", 0),
            errors=result.get("errors", []),
            checked_at=result.get("checked_at", datetime.now(timezone.utc))
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check subscriptions: {str(e)}"
        )

@router.post("/user/{user_id}/check-subscription")
async def check_user_subscription(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin_user)
):
    """Check and update a specific user's subscription status"""
    try:
        manager = SubscriptionManager(db)
        result = manager.check_user_subscription_status(user_id)
        
        return {
            "user_id": user_id,
            "subscription_status": result,
            "checked_at": datetime.now(timezone.utc)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check user subscription: {str(e)}"
        )

@router.get("/user/{user_id}/subscription-history")
async def get_user_subscription_history(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(is_admin_user)
):
    """Get subscription history for a specific user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        subscriptions = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).order_by(Subscription.created_at.desc()).all()
        
        return {
            "user_id": user_id,
            "user_email": user.email,
            "is_premium": user.is_premium,
            "subscriptions": [
                {
                    "id": sub.id,
                    "plan_type": sub.plan_type,
                    "status": sub.status,
                    "amount": sub.amount,
                    "current_period_start": sub.current_period_start,
                    "current_period_end": sub.current_period_end,
                    "trial_end": sub.trial_end,
                    "created_at": sub.created_at,
                    "updated_at": sub.updated_at
                }
                for sub in subscriptions
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user subscription history: {str(e)}"
        )