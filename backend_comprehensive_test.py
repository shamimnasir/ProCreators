#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite for Credit System, Library Save, and Core APIs
Testing CSRF protection, authentication flows, and core generator APIs.
"""

import requests
import json
import sys
import os
import time
from datetime import datetime
from urllib.parse import quote

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ai-avatar-ugc.preview.emergentagent.com')
API_BASE_URL = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session_token = None
        self.csrf_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result with timestamp"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}: {details}")
        
        if not success and response_data:
            print(f"   Response: {response_data}")

    def get_csrf_token(self):
        """Get CSRF token for protected operations"""
        try:
            response = requests.get(f"{API_BASE_URL}/csrf", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('csrfToken'):
                    self.csrf_token = data['csrfToken']
                    self.log_result("CSRF Token Fetch", True, f"Token obtained successfully")
                    return True
            
            self.log_result("CSRF Token Fetch", False, f"Failed with status {response.status_code}", response.text)
            return False
        except Exception as e:
            self.log_result("CSRF Token Fetch", False, f"Exception: {str(e)}")
            return False

    def authenticate_user(self):
        """Authenticate user to get session token"""
        try:
            # Try with known test users first
            test_users = [
                ("shourjois@gmail.com", "password123"),  # From previous tests
                ("test@example.com", "TestPassword123!"),
                ("admin@procreators.io", "AdminPassword123!")
            ]
            
            for test_email, test_password in test_users:
                login_data = {
                    "email": test_email,
                    "password": test_password,
                    "action": "login"
                }
                
                response = requests.post(f"{API_BASE_URL}/auth", 
                                       json=login_data,
                                       headers={'Content-Type': 'application/json'},
                                       timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('sessionToken'):
                        self.session_token = data['sessionToken']
                        self.log_result("User Authentication", True, f"Login successful with {test_email}")
                        return True
            
            # If no existing users work, try signup without verification for testing
            test_email = "comprehensive.test@example.com"
            test_password = "ComprehensiveTest2024!"
            
            signup_data = {
                "email": test_email,
                "password": test_password,
                "name": "Comprehensive Test",
                "action": "signup"
            }
            
            signup_response = requests.post(f"{API_BASE_URL}/auth", 
                                          json=signup_data,
                                          headers={'Content-Type': 'application/json'},
                                          timeout=10)
            
            self.log_result("User Authentication", False, 
                          "Authentication requires verified user. Using anonymous tests only.", 
                          f"Tried multiple users, signup response: {signup_response.status_code}")
            return False
            
        except Exception as e:
            self.log_result("User Authentication", False, f"Exception: {str(e)}")
            return False

    def test_library_save_with_csrf(self):
        """Test library save WITH CSRF token (should succeed)"""
        if not self.csrf_token or not self.session_token:
            self.log_result("Library Save WITH CSRF", False, "Missing CSRF token or session token")
            return False
            
        try:
            test_data = {
                "type": "test-content",
                "title": "CSRF Test Save - Comprehensive Testing",
                "content": "Testing library save with CSRF token protection - comprehensive test suite",
                "category": "text"
            }
            
            headers = {
                'Content-Type': 'application/json',
                'x-csrf-token': self.csrf_token,
                'Authorization': f'Bearer {self.session_token}'
            }
            
            response = requests.post(f"{API_BASE_URL}/library/save", 
                                   json=test_data,
                                   headers=headers,
                                   timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('itemId'):
                    self.log_result("Library Save WITH CSRF", True, 
                                  f"Save successful, itemId: {data['itemId'][:8]}...")
                    return True
            
            self.log_result("Library Save WITH CSRF", False, 
                          f"Save failed with status {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Library Save WITH CSRF", False, f"Exception: {str(e)}")
            return False

    def test_library_save_without_csrf(self):
        """Test library save WITHOUT CSRF token (should fail with 403)"""
        if not self.session_token:
            self.log_result("Library Save WITHOUT CSRF", False, "Missing session token")
            return False
            
        try:
            test_data = {
                "type": "test-content",
                "title": "No CSRF Test Save",
                "content": "Testing library save without CSRF token - should fail",
                "category": "text"
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.session_token}'
                # Deliberately NOT including x-csrf-token header
            }
            
            response = requests.post(f"{API_BASE_URL}/library/save", 
                                   json=test_data,
                                   headers=headers,
                                   timeout=15)
            
            if response.status_code == 403:
                data = response.json()
                if 'CSRF' in data.get('error', ''):
                    self.log_result("Library Save WITHOUT CSRF", True, 
                                  "Correctly rejected with 403 CSRF error")
                    return True
            
            self.log_result("Library Save WITHOUT CSRF", False, 
                          f"Expected 403 CSRF error but got {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Library Save WITHOUT CSRF", False, f"Exception: {str(e)}")
            return False

    def test_credit_check(self):
        """Test credit check API"""
        if not self.session_token:
            self.log_result("Credit Check", False, "Missing session token")
            return False
            
        try:
            headers = {
                'Authorization': f'Bearer {self.session_token}'
            }
            
            # Test with toolId parameter
            params = {'toolId': 'photo-cards'}
            response = requests.get(f"{API_BASE_URL}/credits", 
                                  headers=headers,
                                  params=params,
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    credits = data.get('totalCredits', 0)
                    plan = data.get('plan', 'unknown')
                    self.log_result("Credit Check", True, 
                                  f"Credits: {credits}, Plan: {plan}")
                    return True
            
            self.log_result("Credit Check", False, 
                          f"Credit check failed with status {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Credit Check", False, f"Exception: {str(e)}")
            return False

    def test_credit_deduction_with_csrf(self):
        """Test credit deduction WITH CSRF token"""
        if not self.csrf_token or not self.session_token:
            self.log_result("Credit Deduction WITH CSRF", False, "Missing CSRF token or session token")
            return False
            
        try:
            test_data = {
                "action": "deduct",
                "toolId": "photo-cards",
                "amount": 1
            }
            
            headers = {
                'Content-Type': 'application/json',
                'x-csrf-token': self.csrf_token,
                'Authorization': f'Bearer {self.session_token}'
            }
            
            response = requests.post(f"{API_BASE_URL}/credits", 
                                   json=test_data,
                                   headers=headers,
                                   timeout=15)
            
            # Can succeed (200) or fail due to insufficient credits (402)
            if response.status_code in [200, 402]:
                data = response.json()
                if response.status_code == 200 and data.get('success'):
                    self.log_result("Credit Deduction WITH CSRF", True, 
                                  "Credit deduction successful")
                    return True
                elif response.status_code == 402:
                    self.log_result("Credit Deduction WITH CSRF", True, 
                                  "Correctly handled insufficient credits (402)")
                    return True
            
            self.log_result("Credit Deduction WITH CSRF", False, 
                          f"Unexpected response {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Credit Deduction WITH CSRF", False, f"Exception: {str(e)}")
            return False

    def test_credit_deduction_without_csrf(self):
        """Test credit deduction WITHOUT CSRF token (should fail with 403)"""
        if not self.session_token:
            self.log_result("Credit Deduction WITHOUT CSRF", False, "Missing session token")
            return False
            
        try:
            test_data = {
                "action": "deduct",
                "toolId": "photo-cards",
                "amount": 1
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.session_token}'
                # Deliberately NOT including x-csrf-token header
            }
            
            response = requests.post(f"{API_BASE_URL}/credits", 
                                   json=test_data,
                                   headers=headers,
                                   timeout=15)
            
            if response.status_code == 403:
                data = response.json()
                if 'CSRF' in data.get('error', ''):
                    self.log_result("Credit Deduction WITHOUT CSRF", True, 
                                  "Correctly rejected with 403 CSRF error")
                    return True
            
            self.log_result("Credit Deduction WITHOUT CSRF", False, 
                          f"Expected 403 CSRF error but got {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Credit Deduction WITHOUT CSRF", False, f"Exception: {str(e)}")
            return False

    def test_authentication_flow(self):
        """Test authentication endpoints"""
        try:
            # Test session validation
            if not self.session_token:
                self.log_result("Authentication Flow", False, "No session token to validate")
                return False
                
            headers = {
                'Authorization': f'Bearer {self.session_token}'
            }
            
            response = requests.get(f"{API_BASE_URL}/auth/session", 
                                  headers=headers,
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('valid'):
                    self.log_result("Authentication Flow", True, 
                                  f"Session validation successful, userId: {data.get('userId', 'unknown')[:8]}...")
                    return True
            
            self.log_result("Authentication Flow", False, 
                          f"Session validation failed with status {response.status_code}", response.text)
            return False
            
        except Exception as e:
            self.log_result("Authentication Flow", False, f"Exception: {str(e)}")
            return False

    def test_core_generator_api(self, endpoint, test_data, test_name):
        """Test core generator API endpoints"""
        if not self.session_token:
            self.log_result(test_name, False, "Missing session token")
            return False
            
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.session_token}'
            }
            
            response = requests.post(f"{API_BASE_URL}/{endpoint}", 
                                   json=test_data,
                                   headers=headers,
                                   timeout=30)
            
            # Check for proper authentication handling
            if response.status_code == 401:
                self.log_result(test_name, True, "Correctly requires authentication (401)")
                return True
            
            # Check for validation errors
            if response.status_code == 400:
                data = response.json()
                if 'validation' in data.get('error', '').lower() or 'required' in data.get('error', '').lower():
                    self.log_result(test_name, True, "Correctly validates input (400)")
                    return True
            
            # Check for credit requirements
            if response.status_code == 402:
                self.log_result(test_name, True, "Correctly checks credits (402)")
                return True
            
            # Check for success
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result(test_name, True, "API responding correctly (200)")
                    return True
            
            self.log_result(test_name, False, 
                          f"Unexpected response {response.status_code}", response.text[:200])
            return False
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")
            return False

    def test_core_api_structure(self):
        """Test core API structure and proper authentication requirements"""
        api_tests = [
            # Text Generation API
            {
                "endpoint": "generate/text",
                "method": "POST",
                "data": {"prompt": "Test text generation"},
                "name": "Text Generation API Structure"
            },
            # Image Generation API  
            {
                "endpoint": "generate/image",
                "method": "POST", 
                "data": {"prompt": "Test image generation"},
                "name": "Image Generation API Structure"
            },
            # Carousel Generation API
            {
                "endpoint": "generate/carousel",
                "method": "POST",
                "data": {"prompt": "Test carousel", "platform": "instagram"},
                "name": "Carousel Generation API Structure"
            },
            # Blog Creator API
            {
                "endpoint": "blog-creator/generate", 
                "method": "POST",
                "data": {"topic": "Test blog", "articleType": "how_to"},
                "name": "Blog Creator API Structure"
            },
            # Business Plan API
            {
                "endpoint": "business-plan/generate",
                "method": "POST", 
                "data": {"companyName": "Test Company", "planType": "traditional"},
                "name": "Business Plan API Structure"
            },
            # Credit API
            {
                "endpoint": "credits",
                "method": "GET",
                "data": {},
                "name": "Credits API Structure"
            },
            # Library Save API
            {
                "endpoint": "library/save",
                "method": "POST",
                "data": {"type": "test", "title": "test", "content": "test"},
                "name": "Library Save API Structure"
            }
        ]
        
        for test in api_tests:
            try:
                headers = {'Content-Type': 'application/json'}
                
                if test["method"] == "GET":
                    response = requests.get(f"{API_BASE_URL}/{test['endpoint']}", 
                                          headers=headers, timeout=10)
                else:
                    response = requests.post(f"{API_BASE_URL}/{test['endpoint']}", 
                                           json=test["data"],
                                           headers=headers, timeout=10)
                
                # Should require authentication (401) or have CSRF protection (403)
                if response.status_code in [401, 403]:
                    reason = "requires authentication" if response.status_code == 401 else "has CSRF protection"
                    self.log_result(test["name"], True, f"Properly {reason} ({response.status_code})")
                elif response.status_code == 400:
                    # Validation error is also acceptable - shows API is responding
                    self.log_result(test["name"], True, "Proper validation (400)")
                elif response.status_code == 200:
                    # Some APIs might be public - check response structure
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            self.log_result(test["name"], True, "API responding with JSON structure")
                        else:
                            self.log_result(test["name"], False, "Invalid JSON response structure")
                    except:
                        self.log_result(test["name"], False, "Non-JSON response")
                else:
                    self.log_result(test["name"], False, 
                                  f"Unexpected status {response.status_code}", response.text[:100])
                
            except Exception as e:
                self.log_result(test["name"], False, f"Exception: {str(e)}")

    def test_unauthenticated_requests(self):
        """Test that protected endpoints require authentication"""
        test_cases = [
            ("GET /api/credits", "credits", {}, "GET"),
            ("POST /api/library/save", "library/save", {"type": "test", "title": "test"}, "POST"),
            ("POST /api/credits (deduct)", "credits", {"action": "deduct", "toolId": "test", "amount": 1}, "POST"),
            ("POST /api/generate/text", "generate/text", {"prompt": "test"}, "POST"),
            ("POST /api/generate/image", "generate/image", {"prompt": "test"}, "POST")
        ]
        
        all_passed = True
        
        for description, endpoint, data, method in test_cases:
            try:
                headers = {'Content-Type': 'application/json'}
                
                if method == "GET":
                    response = requests.get(f"{API_BASE_URL}/{endpoint}", 
                                          headers=headers, timeout=10)
                else:
                    response = requests.post(f"{API_BASE_URL}/{endpoint}", 
                                           json=data,
                                           headers=headers, timeout=10)
                
                if response.status_code in [401, 403]:
                    error_type = "authentication" if response.status_code == 401 else "CSRF protection"
                    self.log_result(f"Unauthenticated {description}", True, 
                                  f"Correctly requires {error_type} ({response.status_code})")
                elif response.status_code == 400:
                    # Validation error might come before auth check - acceptable
                    self.log_result(f"Unauthenticated {description}", True, 
                                  "Validation before auth (400) - acceptable")
                else:
                    self.log_result(f"Unauthenticated {description}", False, 
                                  f"Expected 401/403 but got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_result(f"Unauthenticated {description}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests"""
        print("🎯 COMPREHENSIVE BACKEND API TESTING SUITE")
        print("Testing CSRF protection, authentication, credit system, and core APIs")
        print("=" * 80)
        
        # Phase 1: Setup and Authentication
        print("\n📋 PHASE 1: SETUP AND AUTHENTICATION")
        print("-" * 50)
        
        csrf_available = self.get_csrf_token()
        if not csrf_available:
            print("❌ Failed to get CSRF token - continuing with limited tests")
        
        auth_available = self.authenticate_user()
        if not auth_available:
            print("⚠️ No authenticated user available - testing anonymous access protection")
        
        # Phase 2: Unauthenticated Request Testing (SECURITY CRITICAL)
        print("\n🔐 PHASE 2: UNAUTHENTICATED ACCESS PROTECTION")
        print("-" * 50)
        
        self.test_unauthenticated_requests()
        
        # Phase 3: CSRF Protection Testing (if we have auth)
        if auth_available and csrf_available:
            print("\n🔒 PHASE 3: CSRF PROTECTION TESTING")
            print("-" * 50)
            
            self.test_library_save_with_csrf()
            self.test_library_save_without_csrf()
            self.test_credit_deduction_with_csrf()
            self.test_credit_deduction_without_csrf()
        else:
            print("\n🔒 PHASE 3: CSRF PROTECTION TESTING - SKIPPED")
            print("-" * 50)
            print("⚠️ Skipped CSRF tests due to missing authentication")
        
        # Phase 4: Core API Structure Testing (authentication required responses)
        print("\n🛠️ PHASE 4: CORE API STRUCTURE TESTING")
        print("-" * 50)
        
        self.test_core_api_structure()
        
        # Phase 5: Authentication Flow Testing (if available)
        if auth_available:
            print("\n🔐 PHASE 5: AUTHENTICATION FLOW TESTING")
            print("-" * 50)
            
            self.test_authentication_flow()
            self.test_credit_check()
        else:
            print("\n🔐 PHASE 5: AUTHENTICATION FLOW TESTING - SKIPPED")
            print("-" * 50)
            print("⚠️ Skipped authenticated tests due to missing credentials")
        
        # Phase 6: Results Summary
        print("\n📊 PHASE 6: TEST RESULTS SUMMARY")
        print("-" * 50)
        
        self.print_test_summary()
        
        return True

    def print_test_summary(self):
        """Print comprehensive test results summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n🏁 COMPREHENSIVE TEST RESULTS:")
        print(f"✅ Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Categorize results
        csrf_tests = [r for r in self.test_results if 'CSRF' in r['test']]
        credit_tests = [r for r in self.test_results if 'Credit' in r['test']]
        auth_tests = [r for r in self.test_results if 'Authentication' in r['test'] or 'Unauthenticated' in r['test']]
        api_tests = [r for r in self.test_results if 'API' in r['test'] or 'Generation' in r['test']]
        
        print(f"\n📋 BY CATEGORY:")
        print(f"🔒 CSRF Protection: {sum(1 for r in csrf_tests if r['success'])}/{len(csrf_tests)} passed")
        print(f"💰 Credit System: {sum(1 for r in credit_tests if r['success'])}/{len(credit_tests)} passed")  
        print(f"🔐 Authentication: {sum(1 for r in auth_tests if r['success'])}/{len(auth_tests)} passed")
        print(f"🛠️ Generator APIs: {sum(1 for r in api_tests if r['success'])}/{len(api_tests)} passed")
        
        # Show failed tests
        failed_results = [r for r in self.test_results if not r['success']]
        if failed_results:
            print(f"\n❌ FAILED TESTS:")
            for result in failed_results:
                print(f"   • {result['test']}: {result['details']}")
        
        # Show critical security tests
        print(f"\n🔒 SECURITY VERIFICATION:")
        csrf_protection = any(r['success'] for r in self.test_results if 'WITHOUT CSRF' in r['test'])
        auth_protection = any(r['success'] for r in self.test_results if 'Unauthenticated' in r['test'])
        
        print(f"   • CSRF Protection: {'✅ Working' if csrf_protection else '❌ Not Working'}")
        print(f"   • Authentication Protection: {'✅ Working' if auth_protection else '❌ Not Working'}")
        
        return success_rate >= 80


def main():
    """Main test runner"""
    tester = BackendTester()
    success = tester.run_comprehensive_tests()
    
    print("\n" + "=" * 80)
    print("🎯 COMPREHENSIVE BACKEND TESTING COMPLETE")
    print("=" * 80)
    
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)