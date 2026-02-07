#!/usr/bin/env python3
"""
Backend Testing Script for Billing Page Authentication Refactor
Tests the updated APIs that now use Authorization header (Bearer token) instead of userId query parameter.

APIs to Test:
1. GET /api/credits - Credit balance API
2. GET /api/membership - Membership status API  
3. POST /api/credits with action: 'history' - Credit history API

Test Flow:
1. Register a new test user
2. Login to get session token
3. Test each API with and without Authorization header
4. Verify proper authentication behavior
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://footer-editor.preview.emergentagent.com"
TEST_USER_EMAIL = f"test-billing-{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "TestPassword123"
TEST_USER_NAME = "Test User Billing"

class BillingAuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def register_test_user(self):
        """Register a new test user"""
        try:
            print("🔧 STEP 1: Registering test user...")
            
            payload = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.user_id = data.get('userId')
                    self.log_result("User Registration", True, f"User ID: {self.user_id}")
                    return True
                else:
                    self.log_result("User Registration", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("User Registration", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def login_user(self):
        """Login user to get session token"""
        try:
            print("🔧 STEP 2: Logging in to get session token...")
            
            payload = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.session_token = data.get('sessionToken')
                    user_info = data.get('user', {})
                    self.log_result("User Login", True, f"Session token obtained, User: {user_info.get('email')}")
                    return True
                else:
                    self.log_result("User Login", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("User Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_credits_api_with_auth(self):
        """Test GET /api/credits WITH valid Authorization header"""
        try:
            print("🧪 TEST 1: GET /api/credits WITH Authorization header...")
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/credits",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    credits = data.get('credits', 0)
                    plan = data.get('plan', 'unknown')
                    self.log_result("Credits API (With Auth)", True, f"Credits: {credits}, Plan: {plan}")
                    return True
                else:
                    self.log_result("Credits API (With Auth)", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("Credits API (With Auth)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Credits API (With Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_credits_api_without_auth(self):
        """Test GET /api/credits WITHOUT Authorization header - should return 401"""
        try:
            print("🧪 TEST 2: GET /api/credits WITHOUT Authorization header...")
            
            response = requests.get(
                f"{self.base_url}/api/credits",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json()
                error_msg = data.get('error', '')
                if 'Authentication required' in error_msg:
                    self.log_result("Credits API (No Auth)", True, f"Correctly returned 401: {error_msg}")
                    return True
                else:
                    self.log_result("Credits API (No Auth)", False, f"401 but wrong error message: {error_msg}")
                    return False
            else:
                self.log_result("Credits API (No Auth)", False, f"Expected 401 but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Credits API (No Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_credits_api_invalid_token(self):
        """Test GET /api/credits WITH invalid/expired token - should return 401"""
        try:
            print("🧪 TEST 3: GET /api/credits WITH invalid token...")
            
            headers = {
                "Authorization": "Bearer invalid_token_12345",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/credits",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json()
                error_msg = data.get('error', '')
                if 'Authentication required' in error_msg:
                    self.log_result("Credits API (Invalid Token)", True, f"Correctly returned 401: {error_msg}")
                    return True
                else:
                    self.log_result("Credits API (Invalid Token)", False, f"401 but wrong error message: {error_msg}")
                    return False
            else:
                self.log_result("Credits API (Invalid Token)", False, f"Expected 401 but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Credits API (Invalid Token)", False, f"Exception: {str(e)}")
            return False
    
    def test_membership_api_with_auth(self):
        """Test GET /api/membership WITH valid Authorization header"""
        try:
            print("🧪 TEST 4: GET /api/membership WITH Authorization header...")
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/membership",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    plan = data.get('plan', 'unknown')
                    total_credits = data.get('totalCredits', 0)
                    subscription = data.get('subscription', {})
                    self.log_result("Membership API (With Auth)", True, f"Plan: {plan}, Credits: {total_credits}, Subscription: {subscription.get('status', 'none')}")
                    return True
                else:
                    self.log_result("Membership API (With Auth)", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("Membership API (With Auth)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Membership API (With Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_membership_api_without_auth(self):
        """Test GET /api/membership WITHOUT Authorization header - should return default free plan"""
        try:
            print("🧪 TEST 5: GET /api/membership WITHOUT Authorization header...")
            
            response = requests.get(
                f"{self.base_url}/api/membership",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    plan = data.get('plan')
                    total_credits = data.get('totalCredits', 0)
                    if plan == 'free' and total_credits == 0:
                        self.log_result("Membership API (No Auth)", True, f"Correctly returned default free plan: {plan}, Credits: {total_credits}")
                        return True
                    else:
                        self.log_result("Membership API (No Auth)", False, f"Expected free plan with 0 credits, got Plan: {plan}, Credits: {total_credits}")
                        return False
                else:
                    self.log_result("Membership API (No Auth)", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("Membership API (No Auth)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Membership API (No Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_credit_history_with_auth(self):
        """Test POST /api/credits with action: 'history' WITH valid Authorization header"""
        try:
            print("🧪 TEST 6: POST /api/credits (action: history) WITH Authorization header...")
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "action": "history"
            }
            
            response = requests.post(
                f"{self.base_url}/api/credits",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    history = data.get('history', [])
                    self.log_result("Credit History API (With Auth)", True, f"History retrieved with {len(history)} entries")
                    return True
                else:
                    self.log_result("Credit History API (With Auth)", False, f"API returned success=false: {data.get('error')}")
                    return False
            else:
                self.log_result("Credit History API (With Auth)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Credit History API (With Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_credit_history_without_auth(self):
        """Test POST /api/credits with action: 'history' WITHOUT Authorization header - should return 401"""
        try:
            print("🧪 TEST 7: POST /api/credits (action: history) WITHOUT Authorization header...")
            
            payload = {
                "action": "history"
            }
            
            response = requests.post(
                f"{self.base_url}/api/credits",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json()
                error_msg = data.get('error', '')
                if 'Authentication required' in error_msg:
                    self.log_result("Credit History API (No Auth)", True, f"Correctly returned 401: {error_msg}")
                    return True
                else:
                    self.log_result("Credit History API (No Auth)", False, f"401 but wrong error message: {error_msg}")
                    return False
            else:
                self.log_result("Credit History API (No Auth)", False, f"Expected 401 but got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Credit History API (No Auth)", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all billing authentication tests"""
        print("=" * 80)
        print("🚀 BILLING PAGE AUTHENTICATION REFACTOR TESTING")
        print("=" * 80)
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {TEST_USER_EMAIL}")
        print()
        
        # Setup: Register and login
        if not self.register_test_user():
            print("❌ Failed to register test user. Aborting tests.")
            return False
            
        if not self.login_user():
            print("❌ Failed to login test user. Aborting tests.")
            return False
        
        print("🧪 RUNNING AUTHENTICATION TESTS...")
        print()
        
        # Test all APIs
        test_methods = [
            self.test_credits_api_with_auth,
            self.test_credits_api_without_auth,
            self.test_credits_api_invalid_token,
            self.test_membership_api_with_auth,
            self.test_membership_api_without_auth,
            self.test_credit_history_with_auth,
            self.test_credit_history_without_auth
        ]
        
        passed_tests = 0
        total_tests = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed_tests += 1
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                print(f"❌ Test method {test_method.__name__} failed with exception: {e}")
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED! Billing authentication refactor is working correctly.")
        else:
            print("⚠️  Some tests failed. Please review the results above.")
        
        return passed_tests == total_tests

def main():
    """Main test execution"""
    tester = BillingAuthTester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 80)
    print("📋 DETAILED TEST RESULTS")
    print("=" * 80)
    
    for result in tester.test_results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test']}")
        if result['details']:
            print(f"   {result['details']}")
        print(f"   Time: {result['timestamp']}")
        print()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())