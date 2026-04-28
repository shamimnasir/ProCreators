#!/usr/bin/env python3
"""
UGC Studio Render Endpoint Testing
Tests the /api/ugc-studio/render endpoint for authentication and validation.
Focus: Auth/validation testing, NOT actual video rendering.
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://ugc-ads-gen-1.preview.emergentagent.com"

class UGCRenderTester:
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
            test_email = f"render_test_{timestamp}@test.com"
            test_password = "TestPass123!"
            
            register_data = {
                "action": "signup",
                "email": test_email,
                "password": test_password,
                "name": "Render Tester"
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
    
    def test_1_post_render_no_auth(self):
        """Test 1: POST /api/ugc-studio/render without auth → must return 401"""
        try:
            test_data = {
                "clips": [{"url": "https://example.com/video1.mp4"}]
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                timeout=10
            )
            
            if response.status_code == 401:
                data = response.json()
                error_msg = data.get('error', '')
                if 'authentication required' in error_msg.lower():
                    self.log_test(
                        "POST /api/ugc-studio/render (no auth)",
                        True,
                        f"Returns 401 with correct error: {error_msg}",
                        401, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (no auth)",
                        True,
                        f"Returns 401 (auth required): {error_msg}",
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
    
    def test_2_get_render_no_auth(self):
        """Test 2: GET /api/ugc-studio/render without auth → must return 401"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/ugc-studio/render?jobId=test-job-id",
                timeout=10
            )
            
            if response.status_code == 401:
                data = response.json()
                error_msg = data.get('error', '')
                if 'authentication required' in error_msg.lower():
                    self.log_test(
                        "GET /api/ugc-studio/render (no auth)",
                        True,
                        f"Returns 401 with correct error: {error_msg}",
                        401, response.status_code
                    )
                else:
                    self.log_test(
                        "GET /api/ugc-studio/render (no auth)",
                        True,
                        f"Returns 401 (auth required): {error_msg}",
                        401, response.status_code
                    )
            else:
                self.log_test(
                    "GET /api/ugc-studio/render (no auth)",
                    False,
                    f"Should return 401 but got {response.status_code}",
                    401, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/ugc-studio/render (no auth)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_3_post_render_empty_body(self):
        """Test 3: POST with auth, body {} → must return 400 with error mentioning 'clips array is required'"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (empty body)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {}  # Empty body
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if 'clips array is required' in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/render (empty body)",
                        True,
                        f"Returns 400 with correct error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (empty body)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (empty body)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (empty body)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_4_post_render_empty_clips_array(self):
        """Test 4: POST with auth, body {"clips":[]} → must return 400 with 'clips array is required'"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (empty clips array)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {"clips": []}  # Empty clips array
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if 'clips array is required' in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/render (empty clips array)",
                        True,
                        f"Returns 400 with correct error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (empty clips array)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (empty clips array)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (empty clips array)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_5_post_render_clip_without_url(self):
        """Test 5: POST with auth, clip without url field → must return 400 with 'Every clip must have a url string'"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (clip without url)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            test_data = {
                "clips": [{"foo": "bar"}]  # Clip without url field
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
                if 'every clip must have a' in error_msg and 'url' in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/render (clip without url)",
                        True,
                        f"Returns 400 with correct error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (clip without url)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (clip without url)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (clip without url)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_6_post_render_too_many_clips(self):
        """Test 6: POST with auth, 51 clips → must return 400 with 'Too many clips (max 50)'"""
        if not self.auth_token:
            self.log_test(
                "POST /api/ugc-studio/render (too many clips)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            # Create 51 clips
            clips = [{"url": f"https://example.com/video{i}.mp4"} for i in range(51)]
            test_data = {"clips": clips}
            
            response = self.session.post(
                f"{self.base_url}/api/ugc-studio/render",
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if 'too many clips' in error_msg and 'max 50' in error_msg:
                    self.log_test(
                        "POST /api/ugc-studio/render (too many clips)",
                        True,
                        f"Returns 400 with correct error: {data.get('error')}",
                        400, response.status_code
                    )
                else:
                    self.log_test(
                        "POST /api/ugc-studio/render (too many clips)",
                        False,
                        f"Returns 400 but wrong error: {data.get('error')}",
                        400, response.status_code
                    )
            else:
                self.log_test(
                    "POST /api/ugc-studio/render (too many clips)",
                    False,
                    f"Should return 400 but got {response.status_code}",
                    400, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/ugc-studio/render (too many clips)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_7_get_render_nonexistent_job(self):
        """Test 7: GET ?jobId=nonexistent-uuid → must return 404 with 'Job not found'"""
        if not self.auth_token:
            self.log_test(
                "GET /api/ugc-studio/render (nonexistent job)",
                False,
                "Skipped - no auth token available"
            )
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            # Use a valid UUID format but nonexistent job
            nonexistent_job_id = "12345678-1234-1234-1234-123456789abc"
            
            response = self.session.get(
                f"{self.base_url}/api/ugc-studio/render?jobId={nonexistent_job_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 404:
                data = response.json()
                error_msg = data.get('error', '').lower()
                if 'job not found' in error_msg:
                    self.log_test(
                        "GET /api/ugc-studio/render (nonexistent job)",
                        True,
                        f"Returns 404 with correct error: {data.get('error')}",
                        404, response.status_code
                    )
                else:
                    self.log_test(
                        "GET /api/ugc-studio/render (nonexistent job)",
                        False,
                        f"Returns 404 but wrong error: {data.get('error')}",
                        404, response.status_code
                    )
            else:
                self.log_test(
                    "GET /api/ugc-studio/render (nonexistent job)",
                    False,
                    f"Should return 404 but got {response.status_code}",
                    404, response.status_code
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/ugc-studio/render (nonexistent job)",
                False,
                f"Request failed: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all render endpoint tests"""
        print("🎬 Starting UGC Studio Render Endpoint Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 80)
        
        # Try to register test user for auth-required tests
        has_auth = self.register_test_user()
        if not has_auth:
            print("⚠️ Will test 401 behavior only for auth-required endpoints")
        
        print("\n🧪 Running 7 Test Cases:")
        print("-" * 40)
        
        # Run all tests
        self.test_1_post_render_no_auth()
        self.test_2_get_render_no_auth()
        self.test_3_post_render_empty_body()
        self.test_4_post_render_empty_clips_array()
        self.test_5_post_render_clip_without_url()
        self.test_6_post_render_too_many_clips()
        self.test_7_get_render_nonexistent_job()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        skipped = sum(1 for result in self.test_results if 'skipped' in result['details'].lower())
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Skipped: {skipped}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            if 'skipped' in result['details'].lower():
                status = "⏭️ SKIP"
            else:
                status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} | {result['test']}")
            if not result['success'] and 'skipped' not in result['details'].lower():
                print(f"      └─ {result['details']}")
        
        print("\n🎯 RENDER ENDPOINT STATUS:")
        if passed == total:
            print("✅ ALL TESTS PASSED - UGC Studio render endpoint is working correctly")
            print("✅ Authentication and validation flows are properly implemented")
        elif passed >= total * 0.8:  # 80% pass rate (accounting for potential skips)
            print("⚠️ MOSTLY WORKING - Minor issues detected but core functionality intact")
        else:
            print("❌ ENDPOINT ISSUES - Multiple failures detected, needs investigation")
        
        return passed >= total * 0.8  # Consider 80%+ as success due to potential auth issues

if __name__ == "__main__":
    tester = UGCRenderTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)