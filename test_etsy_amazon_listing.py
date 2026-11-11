#!/usr/bin/env python3
"""
Sprint 3: Etsy/Amazon Listing Mode Re-test
After fixing Python LLM script model from gemini-2.0-flash → gemini-3.5-flash

Tests:
- Scenario A: Etsy listing with field validation
- Scenario B: Amazon listing regression check
"""
import requests
import json
import os
from pymongo import MongoClient
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ugc-ads-gen-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'procreators')

# Test user credentials
TEST_EMAIL = f"etsytest_{int(time.time())}@test.com"
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

def register_and_login():
    """Register a new test user directly in MongoDB and login"""
    print("\n=== CREATING TEST USER IN MONGODB ===")
    
    try:
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
        
        # Create user document with sufficient credits
        user_doc = {
            "_id": user_id,
            "email": TEST_EMAIL,
            "passwordHash": password_hash,
            "name": "Etsy Test User",
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
        db.users.insert_one(user_doc)
        print(f"✅ User created in MongoDB: {TEST_EMAIL} (ID: {user_id})")
        print(f"✅ Initial credits: 500")
        
        # Login
        print("\n=== LOGGING IN ===")
        time.sleep(2)  # Brief pause to avoid rate limiting
        
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
                return user_id, token
            else:
                print(f"❌ No sessionToken in response: {data}")
                return user_id, None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return user_id, None
            
    except Exception as e:
        print(f"❌ Failed to create user or login: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None

def test_etsy_listing(token):
    """
    Scenario A: Etsy listing
    Expected 200 with data containing:
    - title <= 140 chars
    - tags array of 13 strings, each <= 20 chars
    - materials array (0-13 entries)
    - description non-empty
    - personalization field present
    - sectionSuggestion field present
    """
    print("\n" + "="*80)
    print("SCENARIO A: ETSY LISTING")
    print("="*80)
    
    request_body = {
        "articleType": "etsy-listing",
        "topic": "Handmade Boho Wall Art Printable",
        "targetKeyword": "boho wall art",
        "tone": "friendly",
        "writingStyle": "conversational"
    }
    
    try:
        print(f"\n📤 Sending request to POST /api/blog-creator/generate")
        print(f"   Body: {json.dumps(request_body, indent=2)}")
        
        response = requests.post(
            f"{API_BASE}/blog-creator/generate",
            json=request_body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=90  # Longer timeout for LLM generation
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            log_result(
                "Etsy Listing - Status Code",
                False,
                f"Expected 200, got {response.status_code}: {response.text[:500]}"
            )
            return
        
        data = response.json()
        print(f"   Response keys: {list(data.keys())}")
        
        # Check success field
        if not data.get('success'):
            log_result(
                "Etsy Listing - Success Field",
                False,
                f"success field is False or missing: {data.get('success')}"
            )
            return
        
        # Check data field exists
        if 'data' not in data:
            log_result(
                "Etsy Listing - Data Field",
                False,
                "Missing 'data' field in response"
            )
            return
        
        listing_data = data['data']
        print(f"   Listing data keys: {list(listing_data.keys())}")
        
        # Validation checks
        validation_results = []
        
        # 1. Title validation (max 140 chars)
        title = listing_data.get('title', '')
        if title and len(title) <= 140:
            validation_results.append(f"✅ title present and <= 140 chars (actual: {len(title)})")
        else:
            validation_results.append(f"❌ title missing or > 140 chars (actual: {len(title) if title else 'missing'})")
        
        # 2. Tags validation (13 items, each <= 20 chars)
        tags = listing_data.get('tags', [])
        if isinstance(tags, list) and len(tags) == 13:
            tag_lengths = [len(tag) for tag in tags]
            max_tag_len = max(tag_lengths) if tag_lengths else 0
            if all(len(tag) <= 20 for tag in tags):
                validation_results.append(f"✅ tags array has 13 items, all <= 20 chars (max: {max_tag_len})")
            else:
                over_limit = [f"{tag}({len(tag)})" for tag in tags if len(tag) > 20]
                validation_results.append(f"❌ tags array has items > 20 chars: {over_limit}")
        else:
            validation_results.append(f"❌ tags not array of 13 items (actual: {len(tags) if isinstance(tags, list) else 'not array'})")
        
        # 3. Materials validation (0-13 entries)
        materials = listing_data.get('materials', [])
        if isinstance(materials, list) and 0 <= len(materials) <= 13:
            validation_results.append(f"✅ materials array present with {len(materials)} items (0-13 valid)")
        else:
            validation_results.append(f"❌ materials not valid array (actual: {len(materials) if isinstance(materials, list) else 'not array'})")
        
        # 4. Description validation (non-empty)
        description = listing_data.get('description', '')
        if description and len(description) > 0:
            validation_results.append(f"✅ description present and non-empty ({len(description)} chars)")
        else:
            validation_results.append(f"❌ description missing or empty")
        
        # 5. Personalization field validation
        personalization = listing_data.get('personalization')
        if personalization is not None:
            validation_results.append(f"✅ personalization field present")
        else:
            validation_results.append(f"❌ personalization field missing")
        
        # 6. SectionSuggestion field validation
        section_suggestion = listing_data.get('sectionSuggestion')
        if section_suggestion is not None:
            validation_results.append(f"✅ sectionSuggestion field present")
        else:
            validation_results.append(f"❌ sectionSuggestion field missing")
        
        # Print all validation results
        print("\n   Validation Results:")
        for result in validation_results:
            print(f"   {result}")
        
        # Overall pass/fail
        all_passed = all('✅' in result for result in validation_results)
        
        if all_passed:
            log_result(
                "Etsy Listing - Complete Validation",
                True,
                f"All Etsy listing fields validated successfully: title({len(title)}), tags(13), materials({len(materials)}), description({len(description)}), personalization, sectionSuggestion"
            )
        else:
            failed_checks = [r for r in validation_results if '❌' in r]
            log_result(
                "Etsy Listing - Complete Validation",
                False,
                f"Some validations failed: {'; '.join(failed_checks)}"
            )
        
    except Exception as e:
        log_result("Etsy Listing - Exception", False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()

def test_amazon_listing_regression(token):
    """
    Scenario B: Amazon listing regression check
    Expected 200 with data containing:
    - title <= 200 chars
    - bullets array of 7 strings, each <= 400 chars
    - backendKeywords string <= 250 chars
    - description non-empty
    
    CRITICAL: Verify Amazon returns CLASSIC schema (bullets + backendKeywords),
    NOT the Etsy schema (tags/materials). No regression.
    """
    print("\n" + "="*80)
    print("SCENARIO B: AMAZON LISTING REGRESSION CHECK")
    print("="*80)
    
    request_body = {
        "articleType": "amazon-listing",
        "topic": "Handmade Boho Wall Art Printable",
        "targetKeyword": "boho wall art"
    }
    
    try:
        print(f"\n📤 Sending request to POST /api/blog-creator/generate")
        print(f"   Body: {json.dumps(request_body, indent=2)}")
        
        response = requests.post(
            f"{API_BASE}/blog-creator/generate",
            json=request_body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=90  # Longer timeout for LLM generation
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            log_result(
                "Amazon Listing - Status Code",
                False,
                f"Expected 200, got {response.status_code}: {response.text[:500]}"
            )
            return
        
        data = response.json()
        print(f"   Response keys: {list(data.keys())}")
        
        # Check success field
        if not data.get('success'):
            log_result(
                "Amazon Listing - Success Field",
                False,
                f"success field is False or missing: {data.get('success')}"
            )
            return
        
        # Check data field exists
        if 'data' not in data:
            log_result(
                "Amazon Listing - Data Field",
                False,
                "Missing 'data' field in response"
            )
            return
        
        listing_data = data['data']
        print(f"   Listing data keys: {list(listing_data.keys())}")
        
        # Validation checks
        validation_results = []
        
        # CRITICAL: Check for NO REGRESSION - should have bullets/backendKeywords, NOT tags/materials
        has_etsy_fields = 'tags' in listing_data or 'materials' in listing_data
        has_amazon_fields = 'bullets' in listing_data and 'backendKeywords' in listing_data
        
        if has_etsy_fields:
            validation_results.append(f"❌ REGRESSION: Found Etsy fields (tags/materials) in Amazon listing response")
        else:
            validation_results.append(f"✅ No Etsy fields (tags/materials) in response - no regression")
        
        if not has_amazon_fields:
            validation_results.append(f"❌ Missing Amazon fields (bullets and/or backendKeywords)")
        else:
            validation_results.append(f"✅ Amazon fields (bullets, backendKeywords) present")
        
        # 1. Title validation (max 200 chars)
        title = listing_data.get('title', '')
        if title and len(title) <= 200:
            validation_results.append(f"✅ title present and <= 200 chars (actual: {len(title)})")
        else:
            validation_results.append(f"❌ title missing or > 200 chars (actual: {len(title) if title else 'missing'})")
        
        # 2. Bullets validation (7 items, each <= 400 chars)
        bullets = listing_data.get('bullets', [])
        if isinstance(bullets, list) and len(bullets) == 7:
            bullet_lengths = [len(bullet) for bullet in bullets]
            max_bullet_len = max(bullet_lengths) if bullet_lengths else 0
            if all(len(bullet) <= 400 for bullet in bullets):
                validation_results.append(f"✅ bullets array has 7 items, all <= 400 chars (max: {max_bullet_len})")
            else:
                over_limit = [f"bullet{i+1}({len(bullet)})" for i, bullet in enumerate(bullets) if len(bullet) > 400]
                validation_results.append(f"❌ bullets array has items > 400 chars: {over_limit}")
        else:
            validation_results.append(f"❌ bullets not array of 7 items (actual: {len(bullets) if isinstance(bullets, list) else 'not array'})")
        
        # 3. BackendKeywords validation (string <= 250 chars)
        backend_keywords = listing_data.get('backendKeywords', '')
        if isinstance(backend_keywords, str) and len(backend_keywords) <= 250:
            validation_results.append(f"✅ backendKeywords string present and <= 250 chars (actual: {len(backend_keywords)})")
        else:
            validation_results.append(f"❌ backendKeywords not valid string or > 250 chars (actual: {len(backend_keywords) if isinstance(backend_keywords, str) else 'not string'})")
        
        # 4. Description validation (non-empty)
        description = listing_data.get('description', '')
        if description and len(description) > 0:
            validation_results.append(f"✅ description present and non-empty ({len(description)} chars)")
        else:
            validation_results.append(f"❌ description missing or empty")
        
        # Print all validation results
        print("\n   Validation Results:")
        for result in validation_results:
            print(f"   {result}")
        
        # Overall pass/fail
        all_passed = all('✅' in result for result in validation_results)
        
        if all_passed:
            log_result(
                "Amazon Listing - Complete Validation",
                True,
                f"All Amazon listing fields validated successfully: title({len(title)}), bullets(7), backendKeywords({len(backend_keywords)}), description({len(description)}). NO REGRESSION - classic Amazon schema maintained."
            )
        else:
            failed_checks = [r for r in validation_results if '❌' in r]
            log_result(
                "Amazon Listing - Complete Validation",
                False,
                f"Some validations failed: {'; '.join(failed_checks)}"
            )
        
    except Exception as e:
        log_result("Amazon Listing - Exception", False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Main test execution"""
    print("="*80)
    print("SPRINT 3: ETSY/AMAZON LISTING MODE RE-TEST")
    print("After fixing Python LLM script: gemini-2.0-flash → gemini-3.5-flash")
    print("="*80)
    
    # Register and login
    user_id, token = register_and_login()
    if not user_id or not token:
        print("❌ Failed to register/login, aborting tests")
        return
    
    # Run tests
    test_etsy_listing(token)
    test_amazon_listing_regression(token)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    total_tests = results['passed'] + results['failed']
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    if total_tests > 0:
        print(f"Success Rate: {results['passed'] / total_tests * 100:.1f}%")
    
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
        db.sessions.delete_many({"userId": user_id})
        db.credit_transactions.delete_many({"userId": user_id})
        print(f"✅ Cleaned up test user and transactions")
    except Exception as e:
        print(f"⚠️ Cleanup error: {str(e)}")

if __name__ == "__main__":
    main()
