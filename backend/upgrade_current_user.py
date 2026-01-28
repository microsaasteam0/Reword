#!/usr/bin/env python3
"""
Quick script to upgrade the current user to premium for testing
Use this while you configure webhooks in Dodo Payments dashboard
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, engine
from models import User, Subscription, PaymentHistory
from datetime import datetime, timedelta, timezone
import json
import uuid

def upgrade_user_to_premium(email: str):
    """Upgrade a specific user to premium"""
    
    print(f"🔄 Upgrading user {email} to premium...")
    
    # Create a session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User not found: {email}")
            return False
        
        print(f"👤 Found user: {user.username} (ID: {user.id})")
        print(f"📊 Current premium status: {user.is_premium}")
        
        if user.is_premium:
            print("✅ User is already premium!")
            return True
        
        # Upgrade user to premium
        user.is_premium = True
        
        # Create or update subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id
        ).order_by(Subscription.created_at.desc()).first()
        
        if subscription:
            print(f"📝 Updating existing subscription")
            subscription.status = "active"
            subscription.plan_type = "pro"
            subscription.billing_cycle = "monthly"
            subscription.amount = 15.00
            subscription.current_period_start = datetime.now(timezone.utc)
            subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
            subscription.updated_at = datetime.now(timezone.utc)
        else:
            print(f"🆕 Creating new subscription")
            subscription = Subscription(
                user_id=user.id,
                dodo_subscription_id=f"manual_upgrade_{uuid.uuid4().hex[:8]}",
                status="active",
                plan_type="pro",
                billing_cycle="monthly",
                amount=15.00,
                currency="USD",
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
                extra_metadata=json.dumps({"source": "manual_upgrade_for_testing"})
            )
            db.add(subscription)
            db.flush()
        
        # Create payment history record
        payment_record = PaymentHistory(
            user_id=user.id,
            subscription_id=subscription.id,
            payment_id=f"manual_{uuid.uuid4().hex[:8]}",
            amount=15.00,
            currency="USD",
            status="completed",
            plan_type="pro",
            billing_cycle="monthly",
            payment_completed_at=datetime.now(timezone.utc),
            verification_completed_at=datetime.now(timezone.utc),
            notes="Manual upgrade for testing while configuring webhooks",
            payment_metadata=json.dumps({"source": "manual_testing_upgrade"})
        )
        
        db.add(payment_record)
        db.commit()
        db.refresh(user)
        
        print(f"✅ User {user.email} upgraded to premium!")
        print(f"📊 Premium status: {user.is_premium}")
        print(f"📋 Subscription: {subscription.plan_type} ({subscription.status})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error upgrading user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Default to the test email, or pass email as argument
    email = sys.argv[1] if len(sys.argv) > 1 else "ptms2525@gmail.com"
    
    print("🔧 Manual Premium Upgrade Tool")
    print("=" * 40)
    print(f"📧 Target email: {email}")
    print("⚠️  This is for testing while you configure webhooks")
    print()
    
    success = upgrade_user_to_premium(email)
    
    if success:
        print("\n🎉 Upgrade successful!")
        print("📋 Next steps:")
        print("   1. Refresh your app to see premium status")
        print("   2. Configure webhook URL in Dodo Payments dashboard")
        print("   3. Test with a new payment to verify webhooks work")
    else:
        print("\n❌ Upgrade failed!")