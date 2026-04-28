#!/usr/bin/env python3
"""
UGC Studio Platform/Aspect-Ratio Testing
Tests the new platform/aspect-ratio plumbing changes to ensure existing endpoints weren't broken.
Focus: Verify platforms field structure, aspectRatio validation, and auth protection.
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://ugc-ads-gen-1.preview.emergentagent.com"

class UGCPlatformAspectTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
    def log_test(self, test_name: str, success: bool, details: str, expected_status: int = None, actual_status: int = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'expected_status': expected_status,
            'actual_status': actual_status
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}: {details}")
        if expected_status and actual_status:
            print(f"   Expected: {expected_status}, Got: {actual_status}")
    
    def register_test_user(self) -> bool:
        """Register a fresh test user for auth testing"""
        try:
            # Generate unique email
            timestamp = int(time.time())
            test_email = f"ugc_platform_test_{timestamp}@example.com"
            test_password = "TestPassword123!"
            
            register_data = {
                "action": "signup",
                "email": test_email,
                "password": test_password,
                "name": "UGC Platform Test User"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth",
                json=register_data,
                timeout=10
            )
            
            if response.status_code == 200:
                # Try to login immediately
                login_data = {
                    "action": "login",
                    "email": test_email,
                    "password": test_password
                }
                
                login_response = self.session.post(
                    f"{self.base_url}/api/auth",
                    json=login_data,
                    timeout=10
                )
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if login_result.get('success') and login_result.get('sessionToken'):
                        self.auth_token = login_result['sessionToken']
                        print(f"✅ Test user registered and logged in: {test_email}")
                        return True
            
            print(f"⚠️ Could not create test user, will test 401 behavior only")
            return False
            
        except Exception as e:
            print(f"⚠️ User registration failed: {str(e)}")
            return False
    
    def test_1_script_generator_platforms_structure(self):
        """Test 1: GET /api/ugc-studio/generate-script (public) → returns 200 with platforms as structured object"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/ugc-studio/generate-script",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'platforms' in data:
                    platforms = data['platforms']
                    
                    # Check if platforms is an object (not array)
                    if isinstance(platforms, dict):
                        # Check for specific platform keys
                        expected_keys = ['tiktok', 'instagram-feed', 'youtube-shorts', 'facebook-reels']
                        found_keys = []
                        
                        for key in expected_keys:
                            if key in platforms:
                                platform_obj = platforms[key]
                                if isinstance(platform_obj, dict) and 'aspectRatio' in platform_obj:
                                    found_keys.append(key)
                        
                        # Check specific aspect ratios
                        tiktok_aspect = platforms.get('tiktok', {}).get('aspectRatio')
                        instagram_feed_aspect = platforms.get('instagram-feed', {}).get('aspectRatio')
                        
                        if tiktok_aspect == '9:16' and instagram_feed_aspect == '1:1':
                            self.log_test(
                                "GET /api/ugc-studio/generate-script platforms structure",
                                True,
                                f"Returns platforms as object with correct aspectRatio. TikTok: {tiktok_aspect}, IG Feed: {instagram_feed_aspect}. Found keys: {found_keys}",
                                200, response.status_code
                            )
                        else:
                            self.log_test(
                                "GET /api/ugc-studio/generate-script platforms structure",
                                False,
                                f"Incorrect aspectRatio values. TikTok: {tiktok_aspect}, IG Feed: {instagram_feed_aspect}",
                                200, response.status_code
                            )
                    else:
                        self.log_test(
                            "GET /api/ugc-studio/generate-script platforms structure",
                            False,
                            f"Platforms field is not an object: {type(platforms)}",
                            200, response.status_code
                        )
                else:
                    self.log_test(
                        "GET /api/ugc-studio/generate-script platforms structure",
                        False,
                        f"Missing platforms field in response: {data}",
                        200, response.status_code
                    )
            else:
                self.log_test(
                    "GET /api/ugc-studio/generate-script platforms structure",
                    False,
                    f"Unexpected status code",
                    200, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/ugc-studio/generate-script platforms structure",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_2_talking_head_no_auth(self):
        """Test 2: POST /api/ugc-studio/generate-talking-head without auth → 401"""
        try:
            test_data = {
                "avatarImageUrl": "https://example.com/avatar.jpg",
                "audioUrl": "https://example.com/audio.mp3"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/generate-talking-head",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "POST /api/ugc-studio/generate-talking-head (no auth)",
                    True,
                    "Correctly returns 401 without authentication",
                    401, response.status_code
                )
            else:
                self.log_test(
                    "POST /api/ugc-studio/generate-talking-head (no auth)",
                    False,
                    f"Should return 401 but got {response.status_code}",
                    401, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/generate-talking-head (no auth)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_3_talking_head_invalid_aspect_ratio(self):
        """Test 3: POST /api/ugc-studio/generate-talking-head with auth, invalid aspectRatio → 400"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/generate-talking-head (invalid aspectRatio)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {
                "avatarImageUrl": "https://example.com/avatar.jpg",
                "audioUrl": "https://example.com/audio.mp3",
                "aspectRatio": "invalid-xyz"  # Invalid aspect ratio
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/generate-talking-head",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if "aspectratio" in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/generate-talking-head (invalid aspectRatio)",
                        True,
                        f"Returns 400 with aspectRatio validation error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/generate-talking-head (invalid aspectRatio)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/generate-talking-head (invalid aspectRatio)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/generate-talking-head (invalid aspectRatio)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_4_render_no_auth(self):
        """Test 4: POST /api/ugc-studio/render without auth → 401"""
        try:
            test_data = {
                "clips": [{"url": "http://example.com/clip1.mp4"}]
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "POST /api/ugc-studio/render (no auth)",
                    True,
                    "Correctly returns 401 without authentication",
                    401, response.status_code
                )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (no auth)",
                    False,
                    f"Should return 401 but got {response.status_code}",
                    401, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (no auth)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_5_render_invalid_aspect_ratio(self):
        """Test 5: POST /api/ugc-studio/render with auth, invalid aspectRatio → 400"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (invalid aspectRatio)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {
                "clips": [{"url": "http://example.com/clip1.mp4"}],
                "aspectRatio": "invalid"  # Invalid aspect ratio
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if "aspectratio" in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/render (invalid aspectRatio)",
                        True,
                        f"Returns 400 with aspectRatio validation error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (invalid aspectRatio)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (invalid aspectRatio)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (invalid aspectRatio)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_6_render_valid_aspect_ratio(self):
        """Test 6: POST /api/ugc-studio/render with auth, valid aspectRatio → 200 (should accept)"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (valid aspectRatio)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {
                "clips": [{"url": "http://example.com/clip1.mp4"}],
                "aspectRatio": "1:1"  # Valid aspect ratio
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'jobId' in data:
                    self.log_test(
                        "POST /api/ugc-studio/render (valid aspectRatio)",
                        True,
                        f"Accepts valid aspectRatio 1:1, returns jobId: {data.get('jobId')[:8]}...",
                        200, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (valid aspectRatio)",
                        False,
                        f"Returns 200 but invalid response structure: {data}",
                        200, response.status_code
                    )
            else:
                # Could be 402 (insufficient credits) or other error, but not validation error
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                error_msg = data.get('error', '')
                
                if response.status_code == 402 or 'credit' in error_msg.lower():
                    self.log_test(
                        "POST /api/ugc-studio/render (valid aspectRatio)",
                        True,
                        f"Valid aspectRatio accepted, failed due to credits: {error_msg}",
                        200, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (valid aspectRatio)",
                        False,
                        f"Should accept valid aspectRatio but got {response.status_code}: {error_msg}",
                        200, response.status_code
                    )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (valid aspectRatio)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_7_render_default_aspect_ratio(self):
        """Test 7: POST /api/ugc-studio/render with auth, no aspectRatio → defaults to 9:16, should accept"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (default aspectRatio)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {
                "clips": [{"url": "http://example.com/clip1.mp4"}]
                # No aspectRatio field - should default to 9:16
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'jobId' in data:
                    self.log_test(
                        "POST /api/ugc-studio/render (default aspectRatio)",
                        True,
                        f"Accepts request without aspectRatio (defaults to 9:16), returns jobId: {data.get('jobId')[:8]}...",
                        200, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (default aspectRatio)",
                        False,
                        f"Returns 200 but invalid response structure: {data}",
                        200, response.status_code
                    )
            else:
                # Could be 402 (insufficient credits) or other error, but not validation error
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                error_msg = data.get('error', '')
                
                if response.status_code == 402 or 'credit' in error_msg.lower():
                    self.log_test(
                        "POST /api/ugc-studio/render (default aspectRatio)",
                        True,
                        f"Default aspectRatio accepted, failed due to credits: {error_msg}",
                        200, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (default aspectRatio)",
                        False,
                        f"Should accept default aspectRatio but got {response.status_code}: {error_msg}",
                        200, response.status_code
                    )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (default aspectRatio)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all 7 test cases"""
        print("🎬 Starting UGC Studio Platform/Aspect-Ratio Testing")
        print(f"Base URL: {self.base_url}")
        print("=" * 80)
        
        # Try to register test user for auth-required tests
        has_auth = self.register_test_user()
        if not has_auth:
            print("⚠️ Will test 401 behavior only for auth-required endpoints")
        
        print("\n🧪 Running 7 Test Cases:")
        print("-" * 40)
        
        # Run all tests
        self.test_1_script_generator_platforms_structure()
        self.test_2_talking_head_no_auth()
        self.test_3_talking_head_invalid_aspect_ratio()
        self.test_4_render_no_auth()
        self.test_5_render_invalid_aspect_ratio()
        self.test_6_render_valid_aspect_ratio()
        self.test_7_render_default_aspect_ratio()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} | {result['test']}")
            if not result['success']:
                print(f"      └─ {result['details']}")
        
        print("\n🎯 PLATFORM/ASPECT-RATIO INTEGRATION STATUS:")
        if passed == total:
            print("✅ ALL TESTS PASSED - Platform/aspect-ratio plumbing is working correctly")
            print("✅ No regression in existing UGC Studio endpoints")
            print("✅ All authentication and validation flows intact")
        elif passed >= total * 0.85:  # 85% pass rate
            print("⚠️ MOSTLY WORKING - Minor issues detected but core functionality intact")
        else:
            print("❌ INTEGRATION ISSUES - Multiple failures detected, needs investigation")
        
        return passed == total

if __name__ == "__main__":
    tester = UGCPlatformAspectTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)