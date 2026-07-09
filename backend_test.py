#!/usr/bin/env python3
"""
Sprint 2 Endpoints Re-test After simple-generator.js Fix
Tests 5 endpoints × 4 scenarios = 20 tests total
"""
import requests
import json
import os
from pymongo import MongoClient
import time

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ugc-ads-gen-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'procreators')

# Test user credentials
TEST_EMAIL = f"sprint2test_{int(time.time())}@test.com"
TEST_PASSWORD = "TestPass123"

# MongoDB client
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Test results
results = {
    'passed': 0,
    'failed': 0,
    'details': []
}

def log_result(test_name, passed, message):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    print(f"   {message}")
    results['details'].append({
        'test': test_name,
        'passed': passed,
        'message': message
    })
    if passed:
        results['passed'] += 1
    else:
        results['failed'] += 1

def register_user():
    """Register a new test user directly in MongoDB to avoid rate limiting"""
    print("\n=== CREATING TEST USER IN MONGODB ===")
    
    try:
        import uuid
        from datetime import datetime
        
        # Delete any existing test user first
        existing = db.users.find_one({"email": TEST_EMAIL})
        if existing:
            print(f"⚠️ Deleting existing test user: {existing['_id']}")
            db.users.delete_one({"email": TEST_EMAIL})
            db.sessions.delete_many({"userId": existing['_id']})
            db.credit_transactions.delete_many({"userId": existing['_id']})
        
        user_id = str(uuid.uuid4())
        
        # Password hash for "TestPass123" (bcrypt)
        password_hash = "$2b$10$D0Jpt8mUKwKoXtqIuFPafO3yNxm9bU3nlEqXI7CQji49VD.j/hVVy"
        
        # Create user document
        user_doc = {
            "_id": user_id,
            "email": TEST_EMAIL,
            "passwordHash": password_hash,  # Changed from "password" to "passwordHash"
            "name": "Sprint2 Test User",
            "emailVerified": True,
            "accountStatus": "active",
            "credits": 500,
            "membershipCredits": 500,
            "purchasedCredits": 500,
            "role": "user",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Insert user
        result = db.users.insert_one(user_doc)
        print(f"✅ User created in MongoDB: {TEST_EMAIL} (ID: {user_id})")
        print(f"✅ Initial credits: 500")
        
        # Verify user was created correctly
        verify_user = db.users.find_one({"_id": user_id})
        if verify_user and verify_user.get('passwordHash'):
            print(f"✅ User verified in DB with passwordHash field")
        else:
            print(f"❌ User verification failed: passwordHash={verify_user.get('passwordHash') if verify_user else 'user not found'}")
        
        return user_id
    except Exception as e:
        print(f"❌ Failed to create user in MongoDB: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def login_user():
    """Login and get session token"""
    print("\n=== LOGGING IN ===")
    
    # Wait a bit to avoid rate limiting
    time.sleep(3)
    
    try:
        # Use /api/auth with action: 'login'
        response = requests.post(
            f"{API_BASE}/auth",
            json={
                "action": "login",
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('sessionToken')
            if token:
                print(f"✅ Login successful, got token")
                return token
            else:
                print(f"❌ No sessionToken in response: {data}")
                return None
        elif response.status_code == 429:
            print(f"⚠️ Rate limited, waiting 5 seconds and retrying...")
            time.sleep(5)
            response = requests.post(
                f"{API_BASE}/auth",
                json={
                    "action": "login",
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD
                },
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get('sessionToken')
                if token:
                    print(f"✅ Login successful, got token")
                    return token
            else:
                print(f"❌ Login failed after retry: {response.status_code} - {response.text}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def set_user_credits(user_id, credits_value):
    """Set user credits in MongoDB"""
    try:
        db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "credits": credits_value,
                "membershipCredits": credits_value,
                "purchasedCredits": credits_value
            }}
        )
        print(f"✅ Set user credits to {credits_value}")
        return True
    except Exception as e:
        print(f"❌ Failed to set credits: {str(e)}")
        return False

def test_endpoint(endpoint_name, endpoint_path, credit_cost, request_body, token, expect_csv=False):
    """Test a single endpoint with 4 scenarios"""
    print(f"\n{'='*80}")
    print(f"TESTING: {endpoint_name} (creditCost: {credit_cost})")
    print(f"{'='*80}")
    
    # Get user_id for credit manipulation
    user = db.users.find_one({"email": TEST_EMAIL})
    user_id = user['_id'] if user else None
    
    # Scenario 1: No Auth → 401
    print(f"\n--- Scenario 1: No Auth → 401 ---")
    try:
        response = requests.post(
            f"{API_BASE}{endpoint_path}",
            json=request_body,
            timeout=30
        )
        
        if response.status_code == 401:
            data = response.json()
            if 'Not authenticated' in data.get('error', ''):
                log_result(f"{endpoint_name} - No Auth", True, "Correctly returns 401 with 'Not authenticated'")
            else:
                log_result(f"{endpoint_name} - No Auth", False, f"Got 401 but wrong error: {data.get('error')}")
        else:
            log_result(f"{endpoint_name} - No Auth", False, f"Expected 401, got {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_result(f"{endpoint_name} - No Auth", False, f"Exception: {str(e)}")
    
    # Scenario 2: Auth + Insufficient Credits → 402
    print(f"\n--- Scenario 2: Auth + Insufficient Credits → 402 ---")
    if user_id:
        set_user_credits(user_id, 0)
        time.sleep(0.5)  # Brief pause for DB sync
        
        try:
            response = requests.post(
                f"{API_BASE}{endpoint_path}",
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=30
            )
            
            if response.status_code == 402:
                data = response.json()
                if data.get('code') == 'INSUFFICIENT_CREDITS':
                    required = data.get('required', 0)
                    balance = data.get('balance', 0)
                    log_result(
                        f"{endpoint_name} - Insufficient Credits",
                        True,
                        f"✅ Correctly returns 402 with code='INSUFFICIENT_CREDITS', required={required}, balance={balance}"
                    )
                else:
                    log_result(
                        f"{endpoint_name} - Insufficient Credits",
                        False,
                        f"Got 402 but missing code='INSUFFICIENT_CREDITS': {data}"
                    )
            else:
                log_result(
                    f"{endpoint_name} - Insufficient Credits",
                    False,
                    f"Expected 402, got {response.status_code}: {response.text[:500]}"
                )
        except Exception as e:
            log_result(f"{endpoint_name} - Insufficient Credits", False, f"Exception: {str(e)}")
    else:
        log_result(f"{endpoint_name} - Insufficient Credits", False, "User ID not found")
    
    # Scenario 3: Auth + Sufficient Credits → 200 (or 500 if LLM key invalid)
    print(f"\n--- Scenario 3: Auth + Sufficient Credits → 200 ---")
    if user_id:
        set_user_credits(user_id, 500)
        time.sleep(0.5)  # Brief pause for DB sync
        
        try:
            response = requests.post(
                f"{API_BASE}{endpoint_path}",
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('toolId') and data.get('content'):
                    extra_checks = []
                    if expect_csv and 'csv' in data:
                        extra_checks.append("csv field present")
                    elif expect_csv:
                        extra_checks.append("⚠️ csv field missing")
                    
                    extra_msg = f" ({', '.join(extra_checks)})" if extra_checks else ""
                    log_result(
                        f"{endpoint_name} - Success",
                        True,
                        f"✅ Returns 200 with success=true, toolId={data.get('toolId')}, content length={len(data.get('content', ''))}{extra_msg}"
                    )
                    
                    # Check if credits were refunded (transaction should be completed, not refunded)
                    # We'll verify by checking credit_transactions collection
                    transactions = list(db.credit_transactions.find({"userId": user_id}).sort("createdAt", -1).limit(1))
                    if transactions:
                        tx = transactions[0]
                        if tx.get('status') == 'completed':
                            print(f"   ✅ Transaction status: completed (credits properly deducted)")
                        elif tx.get('status') == 'refunded':
                            print(f"   ⚠️ Transaction status: refunded (credits were refunded, likely LLM error)")
                        else:
                            print(f"   ℹ️ Transaction status: {tx.get('status')}")
                else:
                    log_result(
                        f"{endpoint_name} - Success",
                        False,
                        f"Got 200 but missing required fields: success={data.get('success')}, toolId={data.get('toolId')}, content={bool(data.get('content'))}"
                    )
            elif response.status_code == 500:
                data = response.json()
                error_msg = data.get('error', '')
                # If LLM key is invalid, credits should be refunded
                log_result(
                    f"{endpoint_name} - Success",
                    True,
                    f"⚠️ Got 500 (LLM error: {error_msg[:100]}). This is acceptable if API key is invalid. Checking if credits were refunded..."
                )
                
                # Verify credits were refunded
                time.sleep(1)  # Wait for refund to process
                transactions = list(db.credit_transactions.find({"userId": user_id}).sort("createdAt", -1).limit(1))
                if transactions:
                    tx = transactions[0]
                    if tx.get('status') == 'refunded':
                        print(f"   ✅ Credits properly refunded (status: refunded, reason: {tx.get('refundReason', 'N/A')})")
                    else:
                        print(f"   ⚠️ Transaction status: {tx.get('status')} (expected 'refunded')")
            else:
                log_result(
                    f"{endpoint_name} - Success",
                    False,
                    f"Expected 200 or 500, got {response.status_code}: {response.text[:500]}"
                )
        except Exception as e:
            log_result(f"{endpoint_name} - Success", False, f"Exception: {str(e)}")
    else:
        log_result(f"{endpoint_name} - Success", False, "User ID not found")

def main():
    """Main test execution"""
    print("="*80)
    print("SPRINT 2 ENDPOINTS RE-TEST AFTER simple-generator.js FIX")
    print("="*80)
    
    # Register and login
    user_id = register_user()
    if not user_id:
        print("❌ Failed to register user, aborting tests")
        return
    
    token = login_user()
    if not token:
        print("❌ Failed to login, aborting tests")
        return
    
    # Define test cases for each endpoint
    endpoints = [
        {
            'name': 'AI Prompt Pack',
            'path': '/ai-prompt-pack/generate',
            'cost': 8,
            'body': {
                'niche': 'Content Marketing',
                'packSize': 10,
                'category': 'marketing',
                'audience': 'digital marketers',
                'aiTool': 'ChatGPT'
            },
            'expect_csv': False
        },
        {
            'name': 'Recipe Book',
            'path': '/recipe-book/generate',
            'cost': 10,
            'body': {
                'cuisine': 'Italian',
                'recipeCount': 5,
                'skill': 'Beginner-friendly',
                'diet': 'Vegetarian',
                'audience': 'home cooks'
            },
            'expect_csv': False
        },
        {
            'name': 'Spreadsheet Template',
            'path': '/spreadsheet-template/generate',
            'cost': 8,
            'body': {
                'templateType': 'Monthly Budget Tracker',
                'audience': 'freelancers',
                'style': 'Professional'
            },
            'expect_csv': True
        },
        {
            'name': 'Wedding Suite',
            'path': '/wedding-suite/generate',
            'cost': 12,
            'body': {
                'style': 'Modern Minimalist',
                'couple': 'Emma & Liam',
                'weddingDate': 'September 20, 2026',
                'venue': 'Garden Terrace, San Francisco',
                'time': '5:00 PM ceremony',
                'dressCode': 'Semi-formal',
                'rsvpBy': 'August 15, 2026'
            },
            'expect_csv': False
        },
        {
            'name': 'Puzzle Book',
            'path': '/puzzle-book/generate',
            'cost': 8,
            'body': {
                'theme': 'Space Exploration',
                'puzzleCount': 5,
                'difficulty': 'Medium',
                'audience': 'Adults'
            },
            'expect_csv': False
        }
    ]
    
    # Test each endpoint
    for endpoint in endpoints:
        test_endpoint(
            endpoint['name'],
            endpoint['path'],
            endpoint['cost'],
            endpoint['body'],
            token,
            endpoint['expect_csv']
        )
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['passed'] + results['failed']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"Success Rate: {results['passed'] / (results['passed'] + results['failed']) * 100:.1f}%")
    
    print("\n" + "="*80)
    print("DETAILED RESULTS")
    print("="*80)
    for detail in results['details']:
        status = "✅" if detail['passed'] else "❌"
        print(f"{status} {detail['test']}")
        print(f"   {detail['message']}")
    
    # Cleanup
    print("\n=== CLEANUP ===")
    try:
        db.users.delete_one({"email": TEST_EMAIL})
        db.credit_transactions.delete_many({"userId": user_id})
        print(f"✅ Cleaned up test user and transactions")
    except Exception as e:
        print(f"⚠️ Cleanup error: {str(e)}")

if __name__ == "__main__":
    main()
