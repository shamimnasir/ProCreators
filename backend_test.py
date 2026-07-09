#!/usr/bin/env python3
"""
Sprint 2 Text Generation Endpoints Testing
Tests 5 new endpoints with comprehensive test matrix:
1. POST /api/ai-prompt-pack/generate (creditCost: 8)
2. POST /api/recipe-book/generate (creditCost: 10)
3. POST /api/spreadsheet-template/generate (creditCost: 8)
4. POST /api/wedding-suite/generate (creditCost: 12)
5. POST /api/puzzle-book/generate (creditCost: 8)

Test scenarios for each endpoint:
1. No auth → 401
2. Auth + no/invalid CSRF → 403 with code: 'CSRF_INVALID'
3. Auth + valid CSRF + insufficient credits → 402 with code: 'INSUFFICIENT_CREDITS'
4. Auth + valid CSRF + sufficient credits → 200 with success: true
"""

import requests
import os
import json
import time
from pymongo import MongoClient
import random
import string

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ugc-ads-gen-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'procreators')

print(f"🔧 Configuration:")
print(f"   BASE_URL: {BASE_URL}")
print(f"   API_BASE: {API_BASE}")
print(f"   MONGO_URL: {MONGO_URL}")
print(f"   DB_NAME: {DB_NAME}")
print()

# Test endpoints configuration
ENDPOINTS = [
    {
        'name': 'AI Prompt Pack Generate',
        'path': '/ai-prompt-pack/generate',
        'creditCost': 8,
        'body': {
            'niche': 'Content Creation',
            'packSize': 10,
            'category': 'marketing',
            'audience': 'social media managers',
            'aiTool': 'ChatGPT'
        }
    },
    {
        'name': 'Recipe Book Generate',
        'path': '/recipe-book/generate',
        'creditCost': 10,
        'body': {
            'cuisine': 'Italian',
            'recipeCount': 5,
            'skill': 'Beginner-friendly',
            'diet': 'Vegetarian',
            'audience': 'home cooks'
        }
    },
    {
        'name': 'Spreadsheet Template Generate',
        'path': '/spreadsheet-template/generate',
        'creditCost': 8,
        'body': {
            'templateType': 'Budget Tracker',
            'audience': 'freelancers',
            'style': 'Professional'
        }
    },
    {
        'name': 'Wedding Suite Generate',
        'path': '/wedding-suite/generate',
        'creditCost': 12,
        'body': {
            'style': 'Modern Minimalist',
            'couple': 'Sarah & Michael',
            'weddingDate': 'September 20, 2026',
            'venue': 'Garden Terrace, Brooklyn',
            'time': '5:00 PM ceremony',
            'dressCode': 'Semi-formal',
            'rsvpBy': 'August 15, 2026'
        }
    },
    {
        'name': 'Puzzle Book Generate',
        'path': '/puzzle-book/generate',
        'creditCost': 8,
        'body': {
            'theme': 'Space Exploration',
            'puzzleCount': 5,
            'difficulty': 'Medium',
            'audience': 'Adults'
        }
    }
]

def generate_random_email():
    """Generate a random email for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_str}@example.com"

def setup_test_user():
    """Create a test user with email verification and credits"""
    print("=" * 80)
    print("SETUP: Creating test user")
    print("=" * 80)
    
    email = generate_random_email()
    password = "TestPass123"
    name = "Test User Sprint2"
    
    print(f"📧 Email: {email}")
    print(f"🔑 Password: {password}")
    
    # Register user
    print("\n1️⃣ Registering user...")
    try:
        response = requests.post(
            f"{API_BASE}/auth",
            json={
                'action': 'signup',
                'email': email,
                'password': password,
                'name': name
            },
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
        if response.status_code not in [200, 201]:
            print(f"   ❌ Registration failed")
            return None
            
        data = response.json()
        user_id = data.get('userId')
        print(f"   ✅ User registered: {user_id}")
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return None
    
    # Set emailVerified and credits in MongoDB
    print("\n2️⃣ Setting emailVerified=true and credits=200 in MongoDB...")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        users_collection = db['users']
        
        result = users_collection.update_one(
            {'email': email},
            {
                '$set': {
                    'emailVerified': True,
                    'credits': 200,
                    'purchasedCredits': 200
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"   ✅ Updated user in MongoDB")
        else:
            print(f"   ⚠️  User not found or already updated")
        
        client.close()
    except Exception as e:
        print(f"   ❌ MongoDB update error: {e}")
        return None
    
    # Login to get session token
    print("\n3️⃣ Logging in to get session token...")
    try:
        response = requests.post(
            f"{API_BASE}/auth",
            json={
                'action': 'login',
                'email': email,
                'password': password
            },
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ Login failed: {response.text[:200]}")
            return None
            
        data = response.json()
        session_token = data.get('sessionToken')
        
        if not session_token:
            print(f"   ❌ No sessionToken in response")
            return None
            
        print(f"   ✅ Session token obtained: {session_token[:20]}...")
        
        return {
            'email': email,
            'password': password,
            'userId': user_id,
            'sessionToken': session_token
        }
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return None

def get_csrf_token():
    """Get CSRF token from /api/csrf"""
    print("\n4️⃣ Getting CSRF token...")
    try:
        response = requests.get(f"{API_BASE}/csrf", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ CSRF token request failed")
            return None
            
        data = response.json()
        csrf_token = data.get('csrfToken')
        
        if not csrf_token:
            print(f"   ❌ No csrfToken in response")
            return None
            
        print(f"   ✅ CSRF token obtained: {csrf_token[:20]}...")
        return csrf_token
    except Exception as e:
        print(f"   ❌ CSRF token error: {e}")
        return None

def set_user_credits(email, credits):
    """Set user credits in MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        users_collection = db['users']
        
        result = users_collection.update_one(
            {'email': email},
            {
                '$set': {
                    'credits': credits,
                    'purchasedCredits': credits
                }
            }
        )
        
        client.close()
        return result.modified_count > 0
    except Exception as e:
        print(f"   ❌ Error setting credits: {e}")
        return False

def test_endpoint(endpoint, user_data, csrf_token):
    """Test a single endpoint with all 4 scenarios"""
    print("\n" + "=" * 80)
    print(f"TESTING: {endpoint['name']}")
    print(f"Endpoint: POST {endpoint['path']}")
    print(f"Credit Cost: {endpoint['creditCost']}")
    print("=" * 80)
    
    url = f"{API_BASE}{endpoint['path']}"
    results = {
        'endpoint': endpoint['name'],
        'path': endpoint['path'],
        'creditCost': endpoint['creditCost'],
        'tests': {}
    }
    
    # Test 1: No auth → 401
    print("\n📋 Test 1: No authentication")
    print("   Expected: 401 'Not authenticated'")
    try:
        response = requests.post(url, json=endpoint['body'], timeout=15)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
        if response.status_code == 401:
            data = response.json()
            if 'Not authenticated' in data.get('error', ''):
                print("   ✅ PASS: Correctly rejected unauthenticated request")
                results['tests']['no_auth'] = 'PASS'
            else:
                print(f"   ⚠️  PASS but unexpected error message: {data.get('error')}")
                results['tests']['no_auth'] = 'PASS'
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}")
            results['tests']['no_auth'] = 'FAIL'
    except Exception as e:
        print(f"   ❌ FAIL: Request error: {e}")
        results['tests']['no_auth'] = 'ERROR'
    
    # Test 2: Auth + no/invalid CSRF → 403
    print("\n📋 Test 2: Auth without CSRF token")
    print("   Expected: 403 with code: 'CSRF_INVALID'")
    try:
        headers = {
            'Authorization': f"Bearer {user_data['sessionToken']}"
        }
        response = requests.post(url, json=endpoint['body'], headers=headers, timeout=15)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
        if response.status_code == 403:
            data = response.json()
            if data.get('code') == 'CSRF_INVALID':
                print("   ✅ PASS: Correctly rejected request without CSRF token")
                results['tests']['no_csrf'] = 'PASS'
            else:
                print(f"   ⚠️  Got 403 but code is: {data.get('code')}")
                results['tests']['no_csrf'] = 'PARTIAL'
        else:
            print(f"   ❌ FAIL: Expected 403, got {response.status_code}")
            results['tests']['no_csrf'] = 'FAIL'
    except Exception as e:
        print(f"   ❌ FAIL: Request error: {e}")
        results['tests']['no_csrf'] = 'ERROR'
    
    # Test 3: Auth + CSRF + insufficient credits → 402
    print("\n📋 Test 3: Auth + CSRF with insufficient credits")
    print(f"   Expected: 402 with code: 'INSUFFICIENT_CREDITS', required: {endpoint['creditCost']}")
    
    # Set credits to less than required
    insufficient_credits = endpoint['creditCost'] - 1
    print(f"   Setting user credits to {insufficient_credits}...")
    if set_user_credits(user_data['email'], insufficient_credits):
        print(f"   ✅ Credits set to {insufficient_credits}")
    else:
        print(f"   ⚠️  Could not set credits")
    
    try:
        headers = {
            'Authorization': f"Bearer {user_data['sessionToken']}",
            'X-CSRF-Token': csrf_token
        }
        response = requests.post(url, json=endpoint['body'], headers=headers, timeout=15)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:300]}")
        
        if response.status_code == 402:
            data = response.json()
            if data.get('code') == 'INSUFFICIENT_CREDITS' and data.get('required') == endpoint['creditCost']:
                print(f"   ✅ PASS: Correctly rejected with insufficient credits (required: {data.get('required')})")
                results['tests']['insufficient_credits'] = 'PASS'
            else:
                print(f"   ⚠️  Got 402 but code: {data.get('code')}, required: {data.get('required')}")
                results['tests']['insufficient_credits'] = 'PARTIAL'
        else:
            print(f"   ❌ FAIL: Expected 402, got {response.status_code}")
            results['tests']['insufficient_credits'] = 'FAIL'
    except Exception as e:
        print(f"   ❌ FAIL: Request error: {e}")
        results['tests']['insufficient_credits'] = 'ERROR'
    
    # Test 4: Auth + CSRF + sufficient credits → 200
    print("\n📋 Test 4: Auth + CSRF with sufficient credits")
    print("   Expected: 200 with success: true, toolId, and content")
    
    # Set credits to sufficient amount
    sufficient_credits = 200
    print(f"   Setting user credits to {sufficient_credits}...")
    if set_user_credits(user_data['email'], sufficient_credits):
        print(f"   ✅ Credits set to {sufficient_credits}")
    else:
        print(f"   ⚠️  Could not set credits")
    
    try:
        headers = {
            'Authorization': f"Bearer {user_data['sessionToken']}",
            'X-CSRF-Token': csrf_token
        }
        response = requests.post(url, json=endpoint['body'], headers=headers, timeout=60)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            
            # Check required fields
            has_success = data.get('success') == True
            has_tool_id = data.get('toolId') == endpoint['path'].split('/')[1]
            has_content = 'content' in data and isinstance(data['content'], str) and len(data['content']) > 0
            
            print(f"   - success: {data.get('success')}")
            print(f"   - toolId: {data.get('toolId')}")
            print(f"   - content length: {len(data.get('content', ''))} chars")
            
            # Special check for spreadsheet-template
            if 'spreadsheet-template' in endpoint['path']:
                has_csv = 'csv' in data
                print(f"   - csv field present: {has_csv}")
                if has_csv:
                    csv_value = data.get('csv')
                    if csv_value:
                        print(f"   - csv length: {len(csv_value)} chars")
                    else:
                        print(f"   - csv is null")
            
            if has_success and has_tool_id and has_content:
                print("   ✅ PASS: Successfully generated content with all required fields")
                results['tests']['success'] = 'PASS'
            else:
                print(f"   ⚠️  PARTIAL: Got 200 but missing fields (success:{has_success}, toolId:{has_tool_id}, content:{has_content})")
                results['tests']['success'] = 'PARTIAL'
        elif response.status_code == 500:
            print(f"   ⚠️  Got 500 - LLM generation may have failed")
            print(f"   Response: {response.text[:500]}")
            # Check if credits were refunded
            print("   Note: If LLM key unavailable, this is acceptable per test instructions")
            results['tests']['success'] = 'LLM_ERROR'
        else:
            print(f"   ❌ FAIL: Expected 200, got {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            results['tests']['success'] = 'FAIL'
    except Exception as e:
        print(f"   ❌ FAIL: Request error: {e}")
        results['tests']['success'] = 'ERROR'
    
    return results

def main():
    print("\n" + "🚀" * 40)
    print("Sprint 2 Text Generation Endpoints - Comprehensive Testing")
    print("🚀" * 40)
    
    # Setup test user
    user_data = setup_test_user()
    if not user_data:
        print("\n❌ Failed to setup test user. Exiting.")
        return
    
    # Get CSRF token
    csrf_token = get_csrf_token()
    if not csrf_token:
        print("\n❌ Failed to get CSRF token. Exiting.")
        return
    
    print("\n✅ Setup complete. Starting endpoint tests...")
    
    # Test all endpoints
    all_results = []
    for endpoint in ENDPOINTS:
        results = test_endpoint(endpoint, user_data, csrf_token)
        all_results.append(results)
        time.sleep(1)  # Brief pause between endpoints
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY: Sprint 2 Text Generation Endpoints Testing")
    print("=" * 80)
    
    for result in all_results:
        print(f"\n📊 {result['endpoint']} (POST {result['path']}, cost: {result['creditCost']})")
        tests = result['tests']
        
        test_names = {
            'no_auth': 'No Auth → 401',
            'no_csrf': 'Auth + No CSRF → 403',
            'insufficient_credits': 'Insufficient Credits → 402',
            'success': 'Success → 200'
        }
        
        for test_key, test_name in test_names.items():
            status = tests.get(test_key, 'NOT_RUN')
            emoji = '✅' if status == 'PASS' else '⚠️' if status in ['PARTIAL', 'LLM_ERROR'] else '❌'
            print(f"   {emoji} {test_name}: {status}")
    
    # Overall statistics
    total_tests = len(all_results) * 4
    passed_tests = sum(1 for r in all_results for t in r['tests'].values() if t == 'PASS')
    partial_tests = sum(1 for r in all_results for t in r['tests'].values() if t in ['PARTIAL', 'LLM_ERROR'])
    failed_tests = sum(1 for r in all_results for t in r['tests'].values() if t in ['FAIL', 'ERROR'])
    
    print(f"\n📈 Overall Statistics:")
    print(f"   Total Tests: {total_tests}")
    print(f"   ✅ Passed: {passed_tests}")
    print(f"   ⚠️  Partial/LLM Error: {partial_tests}")
    print(f"   ❌ Failed: {failed_tests}")
    print(f"   Success Rate: {(passed_tests / total_tests * 100):.1f}%")
    
    print("\n" + "🎉" * 40)
    print("Testing Complete!")
    print("🎉" * 40)

if __name__ == '__main__':
    main()
