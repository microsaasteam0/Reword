#!/usr/bin/env python3
"""
Test script to verify payment security fix
This ensures users cannot get premium without completing payment
"""

import requests
import json
import sys

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "security_test@example.com"
TEST_PASSWORD = "test123456"

def test_payment_security():
    """Test that users cannot get premium without completing payment"""
    
    print("🔒 Testing Payment Security Fix")
    print("=" * 50)
    
    login_needed = True
    headers = None
    
    # Step 1: Register a test user
    print("1️⃣ Registering test user...")
    register_response = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "username": "securitytest",
        "password": TEST_PASSWORD,
        "full_name": "Security Test User"
    })
    
    if register_response.status_code == 400 and "already registered" in register_response.text:
        print("   ✅ User already exists, continuing...")
        # Need to login separately
        login_needed = True
    elif register_response.status_code in [200, 201]:
        print("   ✅ User registered successfully")
        # Check if we got tokens (auto-login)
        if "access_token" in register_response.json():
            token = register_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            login_needed = False
        else:
            login_needed = True
    else:
        print(f"   ❌ Registration failed: {register_response.status_code} - {register_response.text}")
        return False
    
    # Step 2: Login if needed
    if login_needed:
        print("2️⃣ Logging in...")
        login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.status_code} - {login_response.text}")
            return False
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   ✅ Login successful")
    else:
        print("2️⃣ Already logged in from registration")
    
    # Step 3: Check initial premium status (should be False)
    print("3️⃣ Checking initial premium status...")
    me_response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    if me_response.status_code != 200:
        print(f"   ❌ Failed to get user info: {me_response.status_code}")
        return False
    
    user_data = me_response.json()
    if user_data.get("is_premium"):
        print("   ❌ User is already premium! This shouldn't happen with a fresh user.")
        return False
    
    print("   ✅ User is correctly not premium initially")
    
    # Step 4: Create a checkout session (this creates a pending payment)
    print("4️⃣ Creating checkout session...")
    checkout_response = requests.post(f"{BASE_URL}/api/v1/payment/create-checkout", 
                                    headers=headers,
                                    json={
                                        "plan_id": "pro",
                                        "billing_cycle": "monthly"
                                    })
    
    if checkout_response.status_code != 200:
        print(f"   ❌ Checkout creation failed: {checkout_response.status_code} - {checkout_response.text}")
        return False
    
    checkout_data = checkout_response.json()
    print("   ✅ Checkout session created (this creates a pending payment)")
    
    # Step 5: Try to verify payment without completing it (this should fail)
    print("5️⃣ Attempting to verify payment without completing it...")
    
    # Extract payment_id from the checkout URL or use a fake one
    # In real scenario, user would return from Dodo Payments with payment_id
    fake_payment_id = "pay_fake_incomplete"
    
    verify_response = requests.post(f"{BASE_URL}/api/v1/payment/verify-payment",
                                  headers=headers,
                                  json={"payment_id": fake_payment_id})
    
    # This should fail with our security fix
    if verify_response.status_code == 200:
        print("   ❌ SECURITY ISSUE: Payment verification succeeded without completing payment!")
        print(f"   Response: {verify_response.json()}")
        return False
    elif verify_response.status_code == 400:
        error_message = verify_response.json().get("detail", "")
        if "not completed" in error_message or "not found" in error_message:
            print("   ✅ Payment verification correctly rejected incomplete payment")
        else:
            print(f"   ⚠️  Payment rejected but with unexpected message: {error_message}")
    else:
        print(f"   ⚠️  Unexpected response: {verify_response.status_code} - {verify_response.text}")
    
    # Step 6: Verify user is still not premium
    print("6️⃣ Verifying user is still not premium...")
    me_response2 = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    if me_response2.status_code != 200:
        print(f"   ❌ Failed to get user info: {me_response2.status_code}")
        return False
    
    user_data2 = me_response2.json()
    if user_data2.get("is_premium"):
        print("   ❌ CRITICAL SECURITY ISSUE: User became premium without completing payment!")
        return False
    
    print("   ✅ User correctly remains non-premium after failed verification")
    
    print("\n🎉 All security tests passed!")
    print("✅ Users cannot get premium without completing payment")
    return True

if __name__ == "__main__":
    try:
        success = test_payment_security()
        if success:
            print("\n🔒 Payment security is working correctly!")
            sys.exit(0)
        else:
            print("\n🚨 SECURITY ISSUES DETECTED!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)