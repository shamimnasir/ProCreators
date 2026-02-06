#!/usr/bin/env python3
"""
Backend Security Testing for ProCreators.io
Tests rate limiting, Zod validation, authentication, and security headers
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

# Base URL from environment
BASE_URL = "https://devshield-6.preview.emergentagent.com"

class SecurityTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ProCreators-Security-Test/1.0'
        })
        
    def test_rate_limiting_auth_login(self):
        """Test rate limiting on /api/auth (POST) - Should block after 5 attempts"""
        print("\n🔒 Testing Rate Limiting on /api/auth (login)")
        print("=" * 60)
        
        url = f"{self.base_url}/api/auth"
        test_payload = {
            "action": "login",
            "email": "test@test.com",
            "password": "wrongpassword123"
        }
        
        results = []
        
        # Make 6 requests in quick succession
        for i in range(1, 7):
            try:
                response = self.session.post(url, json=test_payload, timeout=10)
                
                # Check rate limit headers
                rate_limit_headers = {
                    'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                    'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                    'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
                    'Retry-After': response.headers.get('Retry-After')
                }
                
                result = {
                    'attempt': i,
                    'status_code': response.status_code,
                    'headers': rate_limit_headers,
                    'response_time': response.elapsed.total_seconds()
                }
                
                if response.status_code == 429:
                    result['blocked'] = True
                    result['retry_after'] = response.headers.get('Retry-After')
                    print(f"   Attempt {i}: ❌ BLOCKED (429) - Retry-After: {result['retry_after']}s")
                else:
                    result['blocked'] = False
                    remaining = rate_limit_headers.get('X-RateLimit-Remaining', 'N/A')
                    print(f"   Attempt {i}: ✅ ALLOWED ({response.status_code}) - Remaining: {remaining}")
                
                results.append(result)
                
                # Small delay between requests
                time.sleep(0.1)
                
            except Exception as e:
                print(f"   Attempt {i}: ❌ ERROR - {str(e)}")
                results.append({'attempt': i, 'error': str(e)})
        
        # Analyze results
        blocked_attempts = [r for r in results if r.get('blocked', False)]
        allowed_attempts = [r for r in results if not r.get('blocked', True) and not r.get('error')]
        
        print(f"\n📊 Rate Limiting Results:")
        print(f"   • Allowed attempts: {len(allowed_attempts)}")
        print(f"   • Blocked attempts: {len(blocked_attempts)}")
        print(f"   • Expected: First 5 allowed, 6th blocked")
        
        # Check if rate limiting works as expected
        if len(allowed_attempts) <= 5 and len(blocked_attempts) >= 1:
            print("   ✅ PASS: Rate limiting working correctly")
            return True
        else:
            print("   ❌ FAIL: Rate limiting not working as expected")
            return False
    
    def test_zod_validation_stripe_checkout(self):
        """Test Zod validation on /api/stripe/checkout (POST)"""
        print("\n🔒 Testing Zod Validation on /api/stripe/checkout")
        print("=" * 60)
        
        url = f"{self.base_url}/api/stripe/checkout"
        
        # Test 1: Invalid packageId
        print("   Test 1: Invalid packageId")
        invalid_payload = {
            "packageId": "invalid",
            "userId": "test-user-123",
            "originUrl": "https://test.com"
        }
        
        try:
            response = self.session.post(url, json=invalid_payload, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                if 'errors' in data or 'validation' in data.get('error', '').lower():
                    print("   ✅ PASS: Invalid packageId correctly rejected with validation error")
                    test1_pass = True
                else:
                    print("   ❌ FAIL: Invalid packageId rejected but no validation error message")
                    test1_pass = False
            else:
                print("   ❌ FAIL: Invalid packageId not rejected (expected 400)")
                test1_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test1_pass = False
        
        # Test 2: Missing required fields
        print("\n   Test 2: Missing required fields")
        missing_fields_payload = {
            "packageId": "starter"
            # Missing userId and originUrl
        }
        
        try:
            response = self.session.post(url, json=missing_fields_payload, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                if 'errors' in data or 'validation' in data.get('error', '').lower():
                    print("   ✅ PASS: Missing fields correctly rejected with validation error")
                    test2_pass = True
                else:
                    print("   ❌ FAIL: Missing fields rejected but no validation error message")
                    test2_pass = False
            else:
                print("   ❌ FAIL: Missing fields not rejected (expected 400)")
                test2_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test2_pass = False
        
        return test1_pass and test2_pass
    
    def test_authentication_user_profile(self):
        """Test authentication on /api/user/profile (POST)"""
        print("\n🔒 Testing Authentication on /api/user/profile")
        print("=" * 60)
        
        url = f"{self.base_url}/api/user/profile"
        
        # Test 1: POST without auth header
        print("   Test 1: POST without auth header")
        test_payload = {
            "name": "Test User",
            "avatarUrl": "https://example.com/avatar.jpg"
        }
        
        try:
            # Remove any existing auth headers
            headers = self.session.headers.copy()
            if 'Authorization' in headers:
                del headers['Authorization']
            
            response = requests.post(url, json=test_payload, headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                data = response.json()
                if data.get('code') == 'AUTH_REQUIRED':
                    print("   ✅ PASS: Unauthenticated POST correctly rejected with AUTH_REQUIRED")
                    test1_pass = True
                else:
                    print("   ❌ FAIL: Unauthenticated POST rejected but wrong error code")
                    test1_pass = False
            else:
                print("   ❌ FAIL: Unauthenticated POST not rejected (expected 401)")
                test1_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test1_pass = False
        
        # Test 2: GET with userId param (should work)
        print("\n   Test 2: GET with userId param")
        try:
            get_url = f"{url}?userId=test-user-123"
            response = requests.get(get_url, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code in [200, 404]:  # 200 if user exists, 404 if not
                print("   ✅ PASS: GET with userId param works (returns 200 or 404)")
                test2_pass = True
            else:
                print(f"   ❌ FAIL: GET with userId param failed (expected 200/404, got {response.status_code})")
                test2_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test2_pass = False
        
        return test1_pass and test2_pass
    
    def test_zod_validation_library_save(self):
        """Test Zod validation on /api/library/save (POST)"""
        print("\n🔒 Testing Zod Validation on /api/library/save")
        print("=" * 60)
        
        url = f"{self.base_url}/api/library/save"
        
        # Test 1: Missing required field (title)
        print("   Test 1: Missing required field (title)")
        missing_title_payload = {
            "content": "test content",
            "type": "text"
            # Missing title
        }
        
        try:
            response = self.session.post(url, json=missing_title_payload, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                if 'errors' in data or 'validation' in data.get('error', '').lower():
                    print("   ✅ PASS: Missing title correctly rejected with validation error")
                    test1_pass = True
                else:
                    print("   ❌ FAIL: Missing title rejected but no validation error message")
                    test1_pass = False
            else:
                print("   ❌ FAIL: Missing title not rejected (expected 400)")
                test1_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test1_pass = False
        
        # Test 2: Valid payload (should succeed or have rate limit headers)
        print("\n   Test 2: Valid payload")
        valid_payload = {
            "content": "test content",
            "type": "text",
            "title": "Test Content"
        }
        
        try:
            response = self.session.post(url, json=valid_payload, timeout=10)
            print(f"   Status: {response.status_code}")
            
            # Check for rate limit headers
            rate_limit_headers = {
                'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset')
            }
            
            has_rate_limit_headers = any(rate_limit_headers.values())
            
            if response.status_code in [200, 201] or has_rate_limit_headers:
                print("   ✅ PASS: Valid payload accepted or rate limit headers present")
                test2_pass = True
            else:
                print(f"   ❌ FAIL: Valid payload failed unexpectedly ({response.status_code})")
                test2_pass = False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test2_pass = False
        
        return test1_pass and test2_pass
    
    def test_rate_limit_headers(self):
        """Test that rate limit headers are present on secured endpoints"""
        print("\n🔒 Testing Rate Limit Headers")
        print("=" * 60)
        
        # Test on a simple endpoint that should have rate limiting
        url = f"{self.base_url}/api/library/save"
        test_payload = {
            "content": "header test",
            "type": "text",
            "title": "Header Test"
        }
        
        try:
            response = self.session.post(url, json=test_payload, timeout=10)
            
            # Check for rate limit headers
            headers_to_check = [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining', 
                'X-RateLimit-Reset'
            ]
            
            found_headers = {}
            for header in headers_to_check:
                value = response.headers.get(header)
                found_headers[header] = value
                if value:
                    print(f"   ✅ {header}: {value}")
                else:
                    print(f"   ❌ {header}: Not found")
            
            # Check if at least some rate limit headers are present
            headers_present = sum(1 for v in found_headers.values() if v is not None)
            
            if headers_present >= 2:  # At least 2 out of 3 headers
                print("   ✅ PASS: Rate limit headers present")
                return True
            else:
                print("   ❌ FAIL: Rate limit headers missing or incomplete")
                return False
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🚀 Starting ProCreators.io Security Testing")
        print("=" * 80)
        print(f"Base URL: {self.base_url}")
        print("=" * 80)
        
        results = {}
        
        # Test 1: Rate Limiting on Auth
        results['rate_limiting_auth'] = self.test_rate_limiting_auth_login()
        
        # Test 2: Zod Validation on Stripe Checkout
        results['zod_validation_stripe'] = self.test_zod_validation_stripe_checkout()
        
        # Test 3: Authentication on User Profile
        results['authentication_profile'] = self.test_authentication_user_profile()
        
        # Test 4: Zod Validation on Library Save
        results['zod_validation_library'] = self.test_zod_validation_library_save()
        
        # Test 5: Rate Limit Headers
        results['rate_limit_headers'] = self.test_rate_limit_headers()
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 SECURITY TESTING SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL SECURITY TESTS PASSED!")
            return True
        else:
            print("⚠️  SOME SECURITY TESTS FAILED!")
            return False

def main():
    """Main function to run security tests"""
    tester = SecurityTester(BASE_URL)
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()