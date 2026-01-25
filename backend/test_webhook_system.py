#!/usr/bin/env python3
"""
Test script to simulate Dodo Payments webhooks and verify the new system works
"""

import requests
import json
import sys
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "webhook_test@example.com"
TEST_PASSWORD = "test123456"

def test_webhook_system():
    """Test the new webhook-based subscription system"""
    
    print("🔗 Testing Webhook-Based Subscription System")
    print("=" * 60)
    
    # Step 1: Register and login
    print("1️⃣ Setting up test user...")
    
    # Register user
    register_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "username": "webhooktest",
        "password": TEST_PASSWORD,
        "full_name": "Webhook Test User"
    })
    
    if register_response.status_code in [200, 201]:
        if "access_token" in register_response.json():
            token = register_response.json()["access_token"]
        else:
            # Need to login separately
            login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
                "username": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            token = login_response.json()["access_token"]
    elif register_response.status_code == 400:
        # User exists, login
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
    else:
        print(f"❌ Failed to setup user: {register_response.status_code}")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✅ Test user ready")
    
    # Step 2: Check initial status (should be free)
    print("2️⃣ Checking initial status...")
    status_response = requests.post(f"{BASE_URL}/api/v1/payment/check-status", headers=headers)
    
    if status_response.status_code != 200:
        print(f"   ❌ Status check failed: {status_response.status_code}")
        return False
    
    status_data = status_response.json()
    if status_data.get("is_premium"):
        print("   ⚠️ User is already premium, this might affect the test")
    else:
        print("   ✅ User is correctly on free plan")
    
    # Step 3: Simulate subscription.active webhook
    print("3️⃣ Simulating subscription.active webhook...")
    
    webhook_payload = {
        "business_id": "test_business_123",
        "timestamp": datetime.utcnow().isoformat(),
        "type": "subscription.active",
        "data": {
            "subscription_id": "sub_test_12345",
            "customer": {
                "email": TEST_EMAIL,
                "customer_id": "cust_test_123"
            },
            "product": {
                "product_id": "prod_pro_monthly"
            },
            "amount": 1500,  # $15.00 in cents
            "billing_cycle": "monthly",
            "status": "active"
        }
    }
    
    webhook_response = requests.post(
        f"{BASE_URL}/api/v1/payment/webhook",
        json=webhook_payload,
        headers={"Content-Type": "application/json"}
    )
    
    if webhook_response.status_code != 200:
        print(f"   ❌ Webhook failed: {webhook_response.status_code} - {webhook_response.text}")
        return False
    
    webhook_result = webhook_response.json()
    if webhook_result.get("status") != "success":
        print(f"   ❌ Webhook processing failed: {webhook_result}")
        return False
    
    print("   ✅ Webhook processed successfully")
    
    # Step 4: Check status after webhook (should be premium)
    print("4️⃣ Checking status after webhook...")
    
    status_response2 = requests.post(f"{BASE_URL}/api/v1/payment/check-status", headers=headers)
    
    if status_response2.status_code != 200:
        print(f"   ❌ Status check failed: {status_response2.status_code}")
        return False
    
    status_data2 = status_response2.json()
    if not status_data2.get("is_premium"):
        print(f"   ❌ User is not premium after webhook! Response: {status_data2}")
        return False
    
    print("   ✅ User is now premium via webhook!")
    
    # Step 5: Test subscription.cancelled webhook
    print("5️⃣ Testing subscription cancellation...")
    
    cancel_webhook_payload = {
        "business_id": "test_business_123",
        "timestamp": datetime.utcnow().isoformat(),
        "type": "subscription.cancelled",
        "data": {
            "subscription_id": "sub_test_12345",
            "customer": {
                "email": TEST_EMAIL,
                "customer_id": "cust_test_123"
            },
            "status": "cancelled"
        }
    }
    
    cancel_response = requests.post(
        f"{BASE_URL}/api/v1/payment/webhook",
        json=cancel_webhook_payload,
        headers={"Content-Type": "application/json"}
    )
    
    if cancel_response.status_code != 200:
        print(f"   ❌ Cancel webhook failed: {cancel_response.status_code}")
        return False
    
    print("   ✅ Cancellation webhook processed")
    
    # Step 6: Check final status (should be free again)
    print("6️⃣ Checking status after cancellation...")
    
    status_response3 = requests.post(f"{BASE_URL}/api/v1/payment/check-status", headers=headers)
    status_data3 = status_response3.json()
    
    if status_data3.get("is_premium"):
        print(f"   ❌ User is still premium after cancellation! Response: {status_data3}")
        return False
    
    print("   ✅ User correctly downgraded to free")
    
    print("\n🎉 All webhook tests passed!")
    print("✅ Webhook system is working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_webhook_system()
        if success:
            print("\n🔗 Webhook-based subscription system is working perfectly!")
            print("📋 Next steps:")
            print("   1. Configure webhook URL in Dodo Payments dashboard")
            print("   2. Enable subscription.active and other events")
            print("   3. Test with real Dodo checkout")
            sys.exit(0)
        else:
            print("\n🚨 WEBHOOK SYSTEM ISSUES DETECTED!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)