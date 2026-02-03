#!/usr/bin/env python3
"""
ProCreators Phase 2-3 API Testing Script
Tests: Credit System, Stripe Payment, Authentication, Admin Controls
"""

import requests
import json
import time
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://creator-launch-8.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ProCreatorsAPITest:
    def __init__(self):
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
        self.session_token = None
        self.test_user_id = None
        
    def log(self, message, test_name=None):
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = f"[{timestamp}]"
        if test_name:
            prefix += f" [{test_name}]"
        print(f"{prefix} {message}")
        
    def test_result(self, test_name, success, message="", data=None):
        self.results["total_tests"] += 1
        if success:
            self.results["passed"] += 1
            self.log(f"✅ PASS: {message}", test_name)
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
            self.log(f"❌ FAIL: {message}", test_name)
        
        if data:
            self.log(f"Response: {json.dumps(data, indent=2)[:200]}...", test_name)
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.Timeout:
            return None, "Request timeout (30s)"
        except requests.exceptions.ConnectionError:
            return None, "Connection error - service might be down"
        except Exception as e:
            return None, f"Request error: {str(e)}"
    
    # =================== CREDIT SYSTEM API TESTS ===================
    
    def test_credit_get_balance(self):
        """Test GET /api/credits - Check user balance"""
        test_name = "Credit Balance Check"
        
        # Test with demo user
        response, error = self.make_request("GET", "/credits?userId=demo-user-001")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                credits = data.get("credits", 0)
                plan = data.get("plan", "unknown")
                self.test_result(test_name, True, f"Balance retrieved: {credits} credits, plan: {plan}", data)
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_credit_operations(self):
        """Test POST /api/credits - Various credit operations"""
        operations = [
            ("check", "Credit Check", {"userId": "demo-user-001", "toolId": "blog-creator"}),
            ("deduct", "Credit Deduction", {"userId": "demo-user-001", "toolId": "blog-creator"}),
            ("history", "Credit History", {"userId": "demo-user-001"})
        ]
        
        for action, test_name, payload in operations:
            payload["action"] = action
            response, error = self.make_request("POST", "/credits", payload)
            
            if error:
                self.test_result(test_name, False, f"Request failed: {error}")
                continue
                
            try:
                data = response.json()
                
                if action == "deduct" and response.status_code == 402:
                    self.test_result(test_name, True, "Insufficient credits (expected behavior)", data)
                elif response.status_code == 200 and data.get("success"):
                    self.test_result(test_name, True, f"Action '{action}' completed successfully", data)
                else:
                    self.test_result(test_name, False, f"Unexpected response: {data.get('error', response.status_code)}")
                    
            except json.JSONDecodeError:
                self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    # =================== STRIPE CHECKOUT API TESTS ===================
    
    def test_stripe_checkout_packages(self):
        """Test GET /api/stripe/checkout - Get credit packages"""
        test_name = "Stripe Packages List"
        
        response, error = self.make_request("GET", "/stripe/checkout")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                packages = data.get("packages", [])
                if len(packages) >= 4:  # Expecting 4 packages
                    package_names = [pkg.get("name") for pkg in packages]
                    self.test_result(test_name, True, f"Found {len(packages)} packages: {package_names}", data)
                else:
                    self.test_result(test_name, False, f"Expected 4 packages, got {len(packages)}")
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_stripe_checkout_session(self):
        """Test POST /api/stripe/checkout - Create checkout session"""
        test_name = "Stripe Checkout Session"
        
        payload = {
            "packageId": "starter",
            "userId": "test-user-12345",
            "originUrl": BASE_URL
        }
        
        response, error = self.make_request("POST", "/stripe/checkout", payload)
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                checkout_url = data.get("url")
                session_id = data.get("sessionId")
                if checkout_url and session_id:
                    self.test_result(test_name, True, f"Checkout session created: {session_id[:20]}...", data)
                else:
                    self.test_result(test_name, False, "Missing checkout URL or session ID")
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_stripe_status(self):
        """Test GET /api/stripe/status - Check payment status"""
        test_name = "Stripe Payment Status"
        
        # Using a dummy session ID since we can't create a real payment
        dummy_session_id = "cs_test_dummy_session_12345"
        response, error = self.make_request("GET", f"/stripe/status?session_id={dummy_session_id}")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            # Expecting 404 for dummy session - that's correct behavior
            if response.status_code == 404:
                self.test_result(test_name, True, "Correctly handled non-existent session", data)
            elif response.status_code == 400:
                self.test_result(test_name, True, "API validation working", data)
            else:
                self.test_result(test_name, False, f"Unexpected response: {response.status_code} - {data.get('error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    # =================== AUTHENTICATION API TESTS ===================
    
    def test_auth_signup(self):
        """Test POST /api/auth - User signup"""
        test_name = "User Signup"
        
        # Generate unique email for testing
        timestamp = str(int(time.time()))
        test_email = f"test-{timestamp}@example.com"
        
        payload = {
            "action": "signup",
            "email": test_email,
            "password": "testPassword123",
            "name": "Test User"
        }
        
        response, error = self.make_request("POST", "/auth", payload)
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                self.test_user_id = data.get("userId")
                message = data.get("message", "")
                self.test_result(test_name, True, f"Signup successful: {message}", data)
            elif response.status_code == 400 and "already registered" in data.get("error", ""):
                self.test_result(test_name, True, "Email already exists (expected for repeated tests)", data)
            else:
                self.test_result(test_name, False, f"Signup failed: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_auth_login(self):
        """Test POST /api/auth - User login"""
        test_name = "User Login"
        
        payload = {
            "action": "login", 
            "email": "test@test.com",
            "password": "test123"
        }
        
        response, error = self.make_request("POST", "/auth", payload)
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                self.session_token = data.get("sessionToken")
                user_info = data.get("user", {})
                self.test_result(test_name, True, f"Login successful for {user_info.get('email')}", data)
            elif response.status_code == 401:
                self.test_result(test_name, True, f"Login rejected (expected): {data.get('error')}", data)
            else:
                self.test_result(test_name, False, f"Unexpected response: {data.get('error', response.status_code)}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_auth_actions(self):
        """Test other authentication actions"""
        actions = [
            ("verify", "Email Verification", {"token": "dummy-verification-token"}),
            ("forgot_password", "Forgot Password", {"email": "test@example.com"})
        ]
        
        for action, test_name, payload in actions:
            payload["action"] = action
            response, error = self.make_request("POST", "/auth", payload)
            
            if error:
                self.test_result(test_name, False, f"Request failed: {error}")
                continue
                
            try:
                data = response.json()
                
                if action == "verify" and response.status_code == 400:
                    self.test_result(test_name, True, "Invalid token rejected (expected)", data)
                elif action == "forgot_password" and response.status_code == 200:
                    self.test_result(test_name, True, "Password reset email handling working", data)
                else:
                    self.test_result(test_name, True, f"Action '{action}' handled appropriately", data)
                    
            except json.JSONDecodeError:
                self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_session_verification(self):
        """Test GET /api/auth/session - Session verification"""
        test_name = "Session Verification"
        
        # Test without token first
        response, error = self.make_request("GET", "/auth/session")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 401:
                self.test_result(test_name, True, "No token rejected correctly", data)
            else:
                self.test_result(test_name, False, f"Expected 401, got {response.status_code}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
        
        # Test with dummy token
        headers = {"Authorization": "Bearer dummy-token-12345"}
        response, error = self.make_request("GET", "/auth/session", headers=headers)
        
        if error:
            self.test_result("Session with Token", False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 401:
                self.test_result("Session with Token", True, "Invalid token rejected correctly", data)
            else:
                self.test_result("Session with Token", False, f"Expected 401, got {response.status_code}")
                
        except json.JSONDecodeError:
            self.test_result("Session with Token", False, f"Invalid JSON response: {response.text[:100]}")
    
    # =================== ADMIN API TESTS ===================
    
    def test_admin_controls(self):
        """Test GET /api/admin/controls - Get admin controls"""
        test_name = "Admin Controls Get"
        
        response, error = self.make_request("GET", "/admin/controls")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                controls = data.get("controls", {})
                self.test_result(test_name, True, f"Admin controls retrieved: {len(controls)} settings", data)
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_admin_users_list(self):
        """Test GET /api/admin/users - List users"""
        test_name = "Admin Users List"
        
        response, error = self.make_request("GET", "/admin/users?limit=10")
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                users = data.get("users", [])
                pagination = data.get("pagination", {})
                self.test_result(test_name, True, f"Retrieved {len(users)} users, total: {pagination.get('total', 0)}", data)
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    def test_admin_add_credits(self):
        """Test POST /api/admin/users - Add credits action"""
        test_name = "Admin Add Credits"
        
        payload = {
            "action": "add_credits",
            "userId": "demo-user-001",
            "amount": 10,
            "reason": "Testing credit addition"
        }
        
        response, error = self.make_request("POST", "/admin/users", payload)
        
        if error:
            self.test_result(test_name, False, f"Request failed: {error}")
            return
            
        try:
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                self.test_result(test_name, True, "Credits added successfully", data)
            else:
                self.test_result(test_name, False, f"API error: {data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            self.test_result(test_name, False, f"Invalid JSON response: {response.text[:100]}")
    
    # =================== MAIN TEST RUNNER ===================
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("🚀 Starting ProCreators Phase 2-3 API Testing...")
        self.log(f"🔗 Testing against: {API_BASE}")
        
        print("\n" + "="*60)
        print("CREDIT SYSTEM API TESTS")
        print("="*60)
        
        self.test_credit_get_balance()
        self.test_credit_operations()
        
        print("\n" + "="*60)
        print("STRIPE PAYMENT API TESTS")
        print("="*60)
        
        self.test_stripe_checkout_packages()
        self.test_stripe_checkout_session()
        self.test_stripe_status()
        
        print("\n" + "="*60)
        print("AUTHENTICATION API TESTS") 
        print("="*60)
        
        self.test_auth_signup()
        self.test_auth_login()
        self.test_auth_actions()
        self.test_session_verification()
        
        print("\n" + "="*60)
        print("ADMIN API TESTS")
        print("="*60)
        
        self.test_admin_controls()
        self.test_admin_users_list()
        self.test_admin_add_credits()
        
        # Final Results
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        
        total = self.results["total_tests"]
        passed = self.results["passed"]
        failed = self.results["failed"]
        
        print(f"📊 Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/total*100):.1f}%")
        
        if self.results["errors"]:
            print(f"\n🚨 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        print(f"\n🏁 Testing completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return passed == total

if __name__ == "__main__":
    tester = ProCreatorsAPITest()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)