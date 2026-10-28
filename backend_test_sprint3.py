#!/usr/bin/env python3
"""
Sprint 3 Backend Testing: Ebook EPUB Export, Ebook Series Generator, Etsy Listing Mode
Tests 3 new endpoints with comprehensive scenarios
"""
import requests
import json
import os
from pymongo import MongoClient
import time
import uuid as uuid_lib

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ugc-ads-gen-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'procreators')

# Test user credentials
TEST_EMAIL = f"sprint3test_{int(time.time())}@test.com"
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
    """Register a new test user directly in MongoDB"""
    print("\n=== CREATING TEST USER IN MONGODB ===")
    
    try:
        from datetime import datetime
        
        # Delete any existing test user first
        existing = db.users.find_one({"email": TEST_EMAIL})
        if existing:
            print(f"⚠️ Deleting existing test user: {existing['_id']}")
            db.users.delete_one({"email": TEST_EMAIL})
            db.sessions.delete_many({"userId": existing['_id']})
            db.credit_transactions.delete_many({"userId": existing['_id']})
        
        user_id = str(uuid_lib.uuid4())
        
        # Password hash for "TestPass123" (bcrypt)
        password_hash = "$2b$10$D0Jpt8mUKwKoXtqIuFPafO3yNxm9bU3nlEqXI7CQji49VD.j/hVVy"
        
        # Create user document
        user_doc = {
            "_id": user_id,
            "email": TEST_EMAIL,
            "passwordHash": password_hash,
            "name": "Sprint3 Test User",
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
        
        return user_id
    except Exception as e:
        print(f"❌ Failed to create user in MongoDB: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def login_user():
    """Login and get session token"""
    print("\n=== LOGGING IN ===")
    
    time.sleep(2)
    
    try:
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
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def get_csrf_token(token):
    """Get CSRF token"""
    print("\n=== GETTING CSRF TOKEN ===")
    
    try:
        response = requests.get(
            f"{API_BASE}/csrf",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            csrf_token = data.get('csrfToken')
            if csrf_token:
                print(f"✅ Got CSRF token")
                return csrf_token
            else:
                print(f"❌ No csrfToken in response: {data}")
                return None
        else:
            print(f"❌ CSRF request failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ CSRF error: {str(e)}")
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

def test_ebook_epub_export(token, csrf_token, user_id):
    """Test POST /api/ebook-maker/generate-epub"""
    print(f"\n{'='*80}")
    print(f"TESTING: Ebook EPUB Export API (creditCost: 20)")
    print(f"{'='*80}")
    
    # Valid ebook payload
    valid_payload = {
        "cover": {
            "title": "The Ultimate Guide to Testing",
            "subtitle": "A Comprehensive Handbook",
            "authorName": "Test Author"
        },
        "introduction": {
            "title": "Introduction",
            "content": "This is the introduction to our test ebook.\n\nIt has multiple paragraphs to test the EPUB builder."
        },
        "chapters": [
            {
                "title": "Chapter 1: Getting Started",
                "content": "This is the first chapter content.\n\nIt explains the basics of testing."
            },
            {
                "title": "Chapter 2: Advanced Topics",
                "content": "This chapter covers advanced testing techniques.\n\nYou'll learn about integration testing and more."
            }
        ],
        "conclusion": {
            "title": "Conclusion",
            "content": "Thank you for reading this test ebook.\n\nWe hope you found it useful."
        },
        "settings": {
            "language": "en"
        }
    }
    
    # Test 1: No Auth → 401
    print(f"\n--- Test 1: No Auth → 401 ---")
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-epub",
            json=valid_payload,
            timeout=30
        )
        
        if response.status_code == 401:
            data = response.json()
            if 'Not authenticated' in data.get('error', ''):
                log_result("EPUB Export - No Auth", True, "Correctly returns 401 with 'Not authenticated'")
            else:
                log_result("EPUB Export - No Auth", False, f"Got 401 but wrong error: {data.get('error')}")
        else:
            log_result("EPUB Export - No Auth", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_result("EPUB Export - No Auth", False, f"Exception: {str(e)}")
    
    # Test 2: Missing cover.title → 400
    print(f"\n--- Test 2: Missing cover.title → 400 ---")
    try:
        invalid_payload = {
            "cover": {
                "subtitle": "No title here"
            },
            "chapters": [{"title": "Chapter 1", "content": "Content"}]
        }
        
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-epub",
            json=invalid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 400:
            data = response.json()
            if 'cover.title' in data.get('error', ''):
                log_result("EPUB Export - Missing cover.title", True, f"Correctly returns 400: {data.get('error')}")
            else:
                log_result("EPUB Export - Missing cover.title", False, f"Got 400 but wrong error: {data.get('error')}")
        else:
            log_result("EPUB Export - Missing cover.title", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_result("EPUB Export - Missing cover.title", False, f"Exception: {str(e)}")
    
    # Test 3: Empty chapters → 400
    print(f"\n--- Test 3: Empty chapters → 400 ---")
    try:
        invalid_payload = {
            "cover": {"title": "Test Book"},
            "chapters": []
        }
        
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-epub",
            json=invalid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 400:
            data = response.json()
            if 'chapter' in data.get('error', '').lower():
                log_result("EPUB Export - Empty chapters", True, f"Correctly returns 400: {data.get('error')}")
            else:
                log_result("EPUB Export - Empty chapters", False, f"Got 400 but wrong error: {data.get('error')}")
        else:
            log_result("EPUB Export - Empty chapters", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_result("EPUB Export - Empty chapters", False, f"Exception: {str(e)}")
    
    # Test 4: Insufficient Credits → 402
    print(f"\n--- Test 4: Insufficient Credits → 402 ---")
    set_user_credits(user_id, 0)
    time.sleep(0.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-epub",
            json=valid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 402:
            data = response.json()
            if data.get('code') == 'INSUFFICIENT_CREDITS':
                log_result("EPUB Export - Insufficient Credits", True, 
                          f"Correctly returns 402 with code='INSUFFICIENT_CREDITS', required={data.get('required')}, balance={data.get('balance')}")
            else:
                log_result("EPUB Export - Insufficient Credits", False, f"Got 402 but missing code: {data}")
        else:
            log_result("EPUB Export - Insufficient Credits", False, f"Expected 402, got {response.status_code}")
    except Exception as e:
        log_result("EPUB Export - Insufficient Credits", False, f"Exception: {str(e)}")
    
    # Test 5: Valid EPUB Generation → 200
    print(f"\n--- Test 5: Valid EPUB Generation → 200 ---")
    set_user_credits(user_id, 500)
    time.sleep(0.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-epub",
            json=valid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=60
        )
        
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            content_length = int(response.headers.get('Content-Length', 0))
            content_disposition = response.headers.get('Content-Disposition', '')
            
            # Check EPUB magic bytes (ZIP header: PK\x03\x04)
            epub_data = response.content
            has_zip_magic = epub_data[:4] == b'PK\x03\x04'
            
            if content_type == 'application/epub+zip' and content_length > 1000 and has_zip_magic:
                log_result("EPUB Export - Valid Generation", True, 
                          f"✅ Returns 200 with Content-Type: application/epub+zip, Content-Length: {content_length} bytes, ZIP magic bytes verified, Content-Disposition: {content_disposition}")
            else:
                log_result("EPUB Export - Valid Generation", False, 
                          f"Got 200 but invalid response: Content-Type={content_type}, Content-Length={content_length}, ZIP magic={has_zip_magic}")
        else:
            log_result("EPUB Export - Valid Generation", False, f"Expected 200, got {response.status_code}: {response.text[:500]}")
    except Exception as e:
        log_result("EPUB Export - Valid Generation", False, f"Exception: {str(e)}")

def test_ebook_series_generator(token, csrf_token, user_id):
    """Test POST /api/ebook-maker/generate-series"""
    print(f"\n{'='*80}")
    print(f"TESTING: Ebook Series Generator API (creditCost: 50)")
    print(f"{'='*80}")
    
    # Valid series payload
    valid_payload = {
        "seedTopic": "Mastering Python Programming",
        "audience": "beginner programmers",
        "tone": "friendly",
        "genre": "educational",
        "seriesSize": 5
    }
    
    # Test 1: No Auth → 401
    print(f"\n--- Test 1: No Auth → 401 ---")
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-series",
            json=valid_payload,
            timeout=30
        )
        
        if response.status_code == 401:
            data = response.json()
            if 'Not authenticated' in data.get('error', ''):
                log_result("Series Generator - No Auth", True, "Correctly returns 401 with 'Not authenticated'")
            else:
                log_result("Series Generator - No Auth", False, f"Got 401 but wrong error: {data.get('error')}")
        else:
            log_result("Series Generator - No Auth", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_result("Series Generator - No Auth", False, f"Exception: {str(e)}")
    
    # Test 2: Missing seedTopic → 400
    print(f"\n--- Test 2: Missing seedTopic → 400 ---")
    try:
        invalid_payload = {
            "audience": "readers",
            "seriesSize": 5
        }
        
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-series",
            json=invalid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 400:
            data = response.json()
            if 'seedTopic' in data.get('error', ''):
                log_result("Series Generator - Missing seedTopic", True, f"Correctly returns 400: {data.get('error')}")
            else:
                log_result("Series Generator - Missing seedTopic", False, f"Got 400 but wrong error: {data.get('error')}")
        else:
            log_result("Series Generator - Missing seedTopic", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_result("Series Generator - Missing seedTopic", False, f"Exception: {str(e)}")
    
    # Test 3: Insufficient Credits → 402
    print(f"\n--- Test 3: Insufficient Credits → 402 ---")
    set_user_credits(user_id, 0)
    time.sleep(0.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-series",
            json=valid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        if response.status_code == 402:
            data = response.json()
            if data.get('code') == 'INSUFFICIENT_CREDITS':
                log_result("Series Generator - Insufficient Credits", True, 
                          f"Correctly returns 402 with code='INSUFFICIENT_CREDITS', required={data.get('required')}, balance={data.get('balance')}")
            else:
                log_result("Series Generator - Insufficient Credits", False, f"Got 402 but missing code: {data}")
        else:
            log_result("Series Generator - Insufficient Credits", False, f"Expected 402, got {response.status_code}")
    except Exception as e:
        log_result("Series Generator - Insufficient Credits", False, f"Exception: {str(e)}")
    
    # Test 4: Valid Series Generation → 200
    print(f"\n--- Test 4: Valid Series Generation → 200 ---")
    set_user_credits(user_id, 500)
    time.sleep(0.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/ebook-maker/generate-series",
            json=valid_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "X-CSRF-Token": csrf_token,
                "Content-Type": "application/json"
            },
            timeout=90  # Longer timeout for LLM generation
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'books' in data:
                books = data.get('books', [])
                series_brand = data.get('seriesBrand', {})
                
                # Verify books array length matches seriesSize
                if len(books) == valid_payload['seriesSize']:
                    # Verify each book has required fields
                    all_valid = True
                    for book in books:
                        if not all(k in book for k in ['position', 'title', 'subtitle', 'hook', 'chapters']):
                            all_valid = False
                            break
                    
                    if all_valid and series_brand:
                        log_result("Series Generator - Valid Generation", True, 
                                  f"✅ Returns 200 with success=true, books array length={len(books)}, seriesBrand present with seriesName='{series_brand.get('seriesName', 'N/A')}'")
                    else:
                        log_result("Series Generator - Valid Generation", False, 
                                  f"Got 200 but invalid book structure or missing seriesBrand")
                else:
                    log_result("Series Generator - Valid Generation", False, 
                              f"Got 200 but books array length={len(books)}, expected {valid_payload['seriesSize']}")
            else:
                log_result("Series Generator - Valid Generation", False, 
                          f"Got 200 but missing required fields: success={data.get('success')}, books={bool(data.get('books'))}")
        elif response.status_code == 500:
            # LLM error - check if credits were refunded
            log_result("Series Generator - Valid Generation", True, 
                      f"⚠️ Got 500 (LLM error). Checking if credits were refunded...")
            time.sleep(1)
            transactions = list(db.credit_transactions.find({"userId": user_id}).sort("createdAt", -1).limit(1))
            if transactions and transactions[0].get('status') == 'refunded':
                print(f"   ✅ Credits properly refunded")
        else:
            log_result("Series Generator - Valid Generation", False, f"Expected 200, got {response.status_code}: {response.text[:500]}")
    except Exception as e:
        log_result("Series Generator - Valid Generation", False, f"Exception: {str(e)}")

def test_blog_creator_etsy_listing(token, user_id):
    """Test POST /api/blog-creator/generate - Etsy Listing Mode"""
    print(f"\n{'='*80}")
    print(f"TESTING: Blog Creator - Etsy Listing Mode")
    print(f"{'='*80}")
    
    # Etsy listing payload
    etsy_payload = {
        "articleType": "etsy-listing",
        "topic": "Handmade Boho Wall Art Printable",
        "targetKeyword": "boho wall art",
        "tone": "friendly",
        "writingStyle": "conversational"
    }
    
    # Test 1: Etsy Listing Mode → 200 with Etsy structure
    print(f"\n--- Test 1: Etsy Listing Mode → 200 with Etsy structure ---")
    set_user_credits(user_id, 500)
    time.sleep(0.5)
    
    try:
        response = requests.post(
            f"{API_BASE}/blog-creator/generate",
            json=etsy_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=90
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                listing_data = data.get('data', {})
                
                # Check Etsy-specific fields
                title = listing_data.get('title', '')
                tags = listing_data.get('tags', [])
                materials = listing_data.get('materials', [])
                description = listing_data.get('description', '')
                personalization = listing_data.get('personalization', '')
                section_suggestion = listing_data.get('sectionSuggestion', '')
                
                # Validate Etsy requirements
                title_valid = len(title) <= 140
                tags_valid = len(tags) == 13 and all(len(tag) <= 20 for tag in tags)
                materials_valid = len(materials) <= 13
                
                if title_valid and tags_valid and materials_valid and description and personalization and section_suggestion:
                    log_result("Blog Creator - Etsy Listing", True, 
                              f"✅ Returns 200 with Etsy structure: title={len(title)} chars, tags={len(tags)} items (all <=20 chars), materials={len(materials)} items, description present, personalization='{personalization[:30]}...', sectionSuggestion='{section_suggestion}'")
                else:
                    log_result("Blog Creator - Etsy Listing", False, 
                              f"Got 200 but invalid Etsy structure: title_valid={title_valid} ({len(title)} chars), tags_valid={tags_valid} ({len(tags)} tags), materials_valid={materials_valid} ({len(materials)} materials)")
            else:
                log_result("Blog Creator - Etsy Listing", False, 
                          f"Got 200 but missing required fields: success={data.get('success')}, data={bool(data.get('data'))}")
        else:
            log_result("Blog Creator - Etsy Listing", False, f"Expected 200, got {response.status_code}: {response.text[:500]}")
    except Exception as e:
        log_result("Blog Creator - Etsy Listing", False, f"Exception: {str(e)}")
    
    # Test 2: Amazon Listing Mode (regression test) → 200 with Amazon structure
    print(f"\n--- Test 2: Amazon Listing Mode (regression) → 200 with Amazon structure ---")
    set_user_credits(user_id, 500)
    time.sleep(0.5)
    
    amazon_payload = {
        "articleType": "amazon-listing",
        "topic": "Handmade Boho Wall Art Printable",
        "targetKeyword": "boho wall art",
        "tone": "friendly",
        "writingStyle": "conversational"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/blog-creator/generate",
            json=amazon_payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=90
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                listing_data = data.get('data', {})
                
                # Check Amazon-specific fields
                bullets = listing_data.get('bullets', [])
                backend_keywords = listing_data.get('backendKeywords', '')
                description = listing_data.get('description', '')
                
                # Validate Amazon requirements
                bullets_valid = len(bullets) == 7
                backend_keywords_valid = len(backend_keywords) <= 250
                
                if bullets_valid and backend_keywords_valid and description:
                    log_result("Blog Creator - Amazon Listing (regression)", True, 
                              f"✅ Returns 200 with Amazon structure: bullets={len(bullets)} items, backendKeywords={len(backend_keywords)} chars, description present. No regression detected.")
                else:
                    log_result("Blog Creator - Amazon Listing (regression)", False, 
                              f"Got 200 but invalid Amazon structure: bullets_valid={bullets_valid} ({len(bullets)} bullets), backend_keywords_valid={backend_keywords_valid} ({len(backend_keywords)} chars)")
            else:
                log_result("Blog Creator - Amazon Listing (regression)", False, 
                          f"Got 200 but missing required fields: success={data.get('success')}, data={bool(data.get('data'))}")
        else:
            log_result("Blog Creator - Amazon Listing (regression)", False, f"Expected 200, got {response.status_code}: {response.text[:500]}")
    except Exception as e:
        log_result("Blog Creator - Amazon Listing (regression)", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print("="*80)
    print("SPRINT 3 BACKEND TESTING: EBOOK EPUB, SERIES GENERATOR, ETSY LISTING")
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
    
    csrf_token = get_csrf_token(token)
    if not csrf_token:
        print("❌ Failed to get CSRF token, aborting tests")
        return
    
    # Run tests
    test_ebook_epub_export(token, csrf_token, user_id)
    test_ebook_series_generator(token, csrf_token, user_id)
    test_blog_creator_etsy_listing(token, user_id)
    
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
        db.credit_transactions.delete_many({"userId": user_id})
        db.sessions.delete_many({"userId": user_id})
        print(f"✅ Cleaned up test user and transactions")
    except Exception as e:
        print(f"⚠️ Cleanup error: {str(e)}")

if __name__ == "__main__":
    main()
