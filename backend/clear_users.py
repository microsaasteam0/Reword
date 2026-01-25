#!/usr/bin/env python3
"""
Script to clear all users from the database for testing purposes.
This will delete all user data including saved content, history, etc.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, engine
from models import User, SavedContent, ContentGeneration, CustomTemplate, Subscription, PaymentHistory, UsageStats

def clear_all_users():
    """Clear all users and related data from the database"""
    
    print("🗑️  Starting database cleanup...")
    
    # Create a session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Delete in order to respect foreign key constraints
        
        # 1. Delete payment history
        payment_count = db.query(PaymentHistory).count()
        if payment_count > 0:
            db.query(PaymentHistory).delete()
            print(f"✅ Deleted {payment_count} payment history records")
        
        # 2. Delete subscriptions
        subscription_count = db.query(Subscription).count()
        if subscription_count > 0:
            db.query(Subscription).delete()
            print(f"✅ Deleted {subscription_count} subscription records")
        
        # 3. Delete usage stats
        usage_count = db.query(UsageStats).count()
        if usage_count > 0:
            db.query(UsageStats).delete()
            print(f"✅ Deleted {usage_count} usage stats records")
        
        # 4. Delete custom templates
        templates_count = db.query(CustomTemplate).count()
        if templates_count > 0:
            db.query(CustomTemplate).delete()
            print(f"✅ Deleted {templates_count} custom template records")
        
        # 5. Delete saved content
        saved_content_count = db.query(SavedContent).count()
        if saved_content_count > 0:
            db.query(SavedContent).delete()
            print(f"✅ Deleted {saved_content_count} saved content records")
        
        # 6. Delete content generation history
        history_count = db.query(ContentGeneration).count()
        if history_count > 0:
            db.query(ContentGeneration).delete()
            print(f"✅ Deleted {history_count} content generation records")
        
        # 7. Delete users
        user_count = db.query(User).count()
        if user_count > 0:
            db.query(User).delete()
            print(f"✅ Deleted {user_count} user records")
        else:
            print("ℹ️  No users found in database")
        
        # Commit the changes
        db.commit()
        print("✅ Database cleanup completed successfully!")
        
        # Verify cleanup
        remaining_users = db.query(User).count()
        remaining_content = db.query(SavedContent).count()
        remaining_history = db.query(ContentGeneration).count()
        remaining_templates = db.query(CustomTemplate).count()
        remaining_subscriptions = db.query(Subscription).count()
        remaining_payments = db.query(PaymentHistory).count()
        remaining_usage = db.query(UsageStats).count()
        
        print(f"\n📊 Final counts:")
        print(f"   Users: {remaining_users}")
        print(f"   Saved Content: {remaining_content}")
        print(f"   Content Generation History: {remaining_history}")
        print(f"   Custom Templates: {remaining_templates}")
        print(f"   Subscriptions: {remaining_subscriptions}")
        print(f"   Payment History: {remaining_payments}")
        print(f"   Usage Stats: {remaining_usage}")
        
        total_remaining = (remaining_users + remaining_content + remaining_history + 
                          remaining_templates + remaining_subscriptions + remaining_payments + remaining_usage)
        
        if total_remaining == 0:
            print("\n🎉 Database is now clean and ready for testing!")
        else:
            print("\n⚠️  Some records may still remain")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def reset_auto_increment():
    """Reset auto-increment counters for a fresh start"""
    try:
        with engine.connect() as conn:
            # Reset sequences for PostgreSQL (not AUTO_INCREMENT like MySQL)
            conn.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE saved_content_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE content_generations_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE custom_templates_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE subscriptions_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE payment_history_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE usage_stats_id_seq RESTART WITH 1"))
            conn.commit()
            print("✅ Reset auto-increment sequences")
    except Exception as e:
        print(f"⚠️  Could not reset sequences: {e}")

if __name__ == "__main__":
    print("🚨 WARNING: This will delete ALL users and their data!")
    print("This action cannot be undone.")
    
    # Ask for confirmation
    confirm = input("\nAre you sure you want to proceed? (type 'YES' to confirm): ")
    
    if confirm == "YES":
        clear_all_users()
        reset_auto_increment()
        print("\n🔄 You can now test the app with a clean database!")
        print("💡 Tip: Restart the backend server to ensure clean state")
    else:
        print("❌ Operation cancelled")