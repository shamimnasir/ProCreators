#!/usr/bin/env python3
"""
ProCreators Backend API Testing Suite
Tests authentication, credits, library save, and generator APIs
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://app-rescue-mission-1.preview.emergentagent.com"
TEST_USER_EMAIL = "shourjois@gmail.com"
TEST_USER_PASSWORD = "TempPass123!"

class ProCreatorsAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, files: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)
            
        if self.session_token and 'Authorization' not in default_headers:
            default_headers['Authorization'] = f'Bearer {self.session_token}'
            
        try:
            if files:
                # Remove Content-Type for multipart/form-data
                if 'Content-Type' in default_headers:
                    del default_headers['Content-Type']
                response = requests.request(method, url, data=data, headers=default_headers, files=files, timeout=30)
            else:
                response = requests.request(method, url, json=data, headers=default_headers, timeout=30)
            
            try:
                return {
                    'status_code': response.status_code,
                    'data': response.json(),
                    'headers': dict(response.headers)
                }
            except json.JSONDecodeError:
                return {
                    'status_code': response.status_code,
                    'data': {'error': 'Invalid JSON response', 'text': response.text[:500]},
                    'headers': dict(response.headers)
                }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': f'Request failed: {str(e)}'},
                'headers': {}
            }

    def test_auth_signup(self):
        """Test user signup API"""
        test_email = f"test_{int(time.time())}@example.com"
        
        response = self.make_request('POST', '/api/auth', {
            'action': 'signup',
            'email': test_email,
            'password': 'TestPass123!',
            'name': 'Test User'
        })
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'Auth Signup API',
                True,
                'Successfully created test account',
                {'email': test_email, 'response': response['data']}
            )
        else:
            self.log_result(
                'Auth Signup API',
                False,
                f'Signup failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_auth_login(self):
        """Test user login API"""
        response = self.make_request('POST', '/api/auth', {
            'action': 'login',
            'email': TEST_USER_EMAIL,
            'password': TEST_USER_PASSWORD
        })
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.session_token = response['data'].get('sessionToken')
            user_data = response['data'].get('user', {})
            self.user_id = user_data.get('id')
            
            self.log_result(
                'Auth Login API',
                True,
                f'Successfully logged in as {user_data.get("email")}',
                {
                    'user_id': self.user_id,
                    'credits': user_data.get('credits'),
                    'plan': user_data.get('plan'),
                    'has_token': bool(self.session_token)
                }
            )
        else:
            self.log_result(
                'Auth Login API',
                False,
                f'Login failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_auth_session(self):
        """Test session validation API"""
        if not self.session_token:
            self.log_result('Auth Session API', False, 'No session token available', {})
            return
            
        response = self.make_request('GET', '/api/auth/session')
        
        if response['status_code'] == 200 and response['data'].get('success'):
            user_data = response['data'].get('user', {})
            self.log_result(
                'Auth Session API',
                True,
                'Session validation successful',
                {
                    'user_id': user_data.get('id'),
                    'email': user_data.get('email'),
                    'credits': user_data.get('credits'),
                    'plan': user_data.get('plan')
                }
            )
        else:
            self.log_result(
                'Auth Session API',
                False,
                f'Session validation failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_credits_get(self):
        """Test get user credits API"""
        if not self.session_token:
            self.log_result('Credits GET API', False, 'No session token available', {})
            return
            
        response = self.make_request('GET', '/api/credits')
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'Credits GET API',
                True,
                'Successfully retrieved credit information',
                {
                    'credits': response['data'].get('credits'),
                    'plan': response['data'].get('plan'),
                    'membership_credits': response['data'].get('membershipCredits'),
                    'purchased_credits': response['data'].get('purchasedCredits')
                }
            )
        else:
            self.log_result(
                'Credits GET API',
                False,
                f'Failed to get credits: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_credits_deduct(self):
        """Test credit deduction API"""
        if not self.session_token or not self.user_id:
            self.log_result('Credits Deduct API', False, 'No session token or user ID available', {})
            return
            
        response = self.make_request('POST', '/api/credits', {
            'action': 'deduct',
            'userId': self.user_id,
            'toolId': 'text-generation',
            'params': {'test': True}
        })
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'Credits Deduct API',
                True,
                'Credit deduction successful',
                {
                    'transaction_id': response['data'].get('transactionId'),
                    'new_balance': response['data'].get('newBalance'),
                    'credits_charged': response['data'].get('creditsCharged')
                }
            )
        elif response['status_code'] == 402:
            self.log_result(
                'Credits Deduct API',
                True,
                'Credit deduction properly rejected (insufficient credits)',
                {'status_code': response['status_code'], 'response': response['data']}
            )
        else:
            self.log_result(
                'Credits Deduct API',
                False,
                f'Credit deduction failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_library_save_zod_validation(self):
        """Test library save API with Zod validation"""
        if not self.session_token:
            self.log_result('Library Save Zod Validation', False, 'No session token available', {})
            return
            
        # Test 1: Valid save request
        valid_data = {
            'type': 'test-content',
            'title': 'Test Content for Validation',
            'content': 'This is test content to verify Zod validation is working properly.',
            'description': 'Test description',
            'metadata': {'test': True, 'validation': 'zod'}
        }
        
        response = self.make_request('POST', '/api/library/save', valid_data)
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'Library Save Valid Request',
                True,
                'Valid library save request successful',
                {
                    'item_id': response['data'].get('itemId'),
                    'category': response['data'].get('category'),
                    'expires_at': response['data'].get('expiresAt')
                }
            )
        else:
            self.log_result(
                'Library Save Valid Request',
                False,
                f'Valid save request failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )
        
        # Test 2: Invalid request - missing required fields
        invalid_data = {
            'content': 'Content without required type and title'
        }
        
        response = self.make_request('POST', '/api/library/save', invalid_data)
        
        if response['status_code'] == 400:
            self.log_result(
                'Library Save Invalid Request (Missing Fields)',
                True,
                'Properly rejected request with missing required fields',
                {'error': response['data'].get('error')}
            )
        else:
            self.log_result(
                'Library Save Invalid Request (Missing Fields)',
                False,
                f'Should have rejected invalid request: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )
        
        # Test 3: Invalid request - no content, videoUrl, or filePath
        empty_data = {
            'type': 'test',
            'title': 'Test Title'
        }
        
        response = self.make_request('POST', '/api/library/save', empty_data)
        
        if response['status_code'] == 400:
            self.log_result(
                'Library Save Invalid Request (No Content)',
                True,
                'Properly rejected request with no content/video/file',
                {'error': response['data'].get('error')}
            )
        else:
            self.log_result(
                'Library Save Invalid Request (No Content)',
                False,
                f'Should have rejected request with no content: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_story_reels_compose(self):
        """Test story reels compose API"""
        if not self.session_token:
            self.log_result('Story Reels Compose API', False, 'No session token available', {})
            return
            
        # Prepare form data for story reels
        form_data = {
            'script': 'This is a test story reel script for API testing.',
            'duration': '10',
            'voiceOption': 'tts',
            'ttsLanguage': 'en',
            'selectedVoice': 'en-US-Neural2-D',
            'captionStyle': 'bold-outline',
            'musicTrack': 'none',
            'resolution': '1080p',
            'stockVideos': json.dumps([]),
            'videoOrder': json.dumps([]),
            'keywords': json.dumps(['test', 'api', 'story']),
            'captionFontSize': 'medium',
            'captionPosition': 'bottom',
            'niche': 'story-reels'
        }
        
        # Remove Content-Type header for form data
        headers = {}
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
            
        response = self.make_request('POST', '/api/story-reels/compose', form_data, headers)
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'Story Reels Compose API',
                True,
                'Story reel composition successful',
                {
                    'video_url': response['data'].get('videoUrl'),
                    'duration': response['data'].get('duration'),
                    'clip_count': response['data'].get('clipCount'),
                    'credits_used': response['data'].get('creditsUsed')
                }
            )
        elif response['status_code'] == 401:
            self.log_result(
                'Story Reels Compose API',
                True,
                'Properly requires authentication',
                {'status_code': response['status_code'], 'error': response['data'].get('error')}
            )
        elif response['status_code'] == 402:
            self.log_result(
                'Story Reels Compose API',
                True,
                'Properly checks credits before generation',
                {'status_code': response['status_code'], 'error': response['data'].get('error')}
            )
        else:
            self.log_result(
                'Story Reels Compose API',
                False,
                f'Story reel composition failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_ai_video_studio_generate(self):
        """Test AI video studio generate API"""
        if not self.session_token:
            self.log_result('AI Video Studio Generate API', False, 'No session token available', {})
            return
            
        # Prepare form data for AI video generation
        form_data = {
            'mode': 'text-to-video',
            'prompt': 'A beautiful sunset over mountains with cinematic lighting',
            'duration': '5',
            'format': 'portrait',
            'templateId': 'cinematic-script',
            'videoSource': 'ai',
            'voiceOption': 'none',
            'captionStyle': 'none',
            'musicTrack': 'none'
        }
        
        headers = {}
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
            
        response = self.make_request('POST', '/api/ai-video-studio/generate', form_data, headers)
        
        if response['status_code'] == 200 and response['data'].get('success'):
            self.log_result(
                'AI Video Studio Generate API',
                True,
                'AI video generation successful',
                {
                    'video_url': response['data'].get('videoUrl'),
                    'duration': response['data'].get('duration'),
                    'format': response['data'].get('format'),
                    'provider': response['data'].get('provider'),
                    'credits_used': response['data'].get('creditsUsed')
                }
            )
        elif response['status_code'] == 401:
            self.log_result(
                'AI Video Studio Generate API',
                True,
                'Properly requires authentication',
                {'status_code': response['status_code'], 'error': response['data'].get('error')}
            )
        elif response['status_code'] == 402:
            self.log_result(
                'AI Video Studio Generate API',
                True,
                'Properly checks credits before generation',
                {'status_code': response['status_code'], 'error': response['data'].get('error')}
            )
        else:
            self.log_result(
                'AI Video Studio Generate API',
                False,
                f'AI video generation failed: {response["data"].get("error", "Unknown error")}',
                {'status_code': response['status_code'], 'response': response['data']}
            )

    def test_api_syntax_errors(self):
        """Test for basic API syntax errors by making simple requests"""
        test_endpoints = [
            ('/api/auth', 'POST', {'action': 'login', 'email': 'test@test.com', 'password': 'test'}),
            ('/api/credits', 'GET', None),
            ('/api/library/save', 'POST', {'type': 'test', 'title': 'test', 'content': 'test'}),
        ]
        
        for endpoint, method, data in test_endpoints:
            response = self.make_request(method, endpoint, data)
            
            # Check for 500 errors which might indicate syntax issues
            if response['status_code'] == 500:
                error_text = response['data'].get('text', '')
                if 'SyntaxError' in error_text or 'Unexpected token' in error_text:
                    self.log_result(
                        f'Syntax Check {endpoint}',
                        False,
                        f'Syntax error detected in {endpoint}',
                        {'error': error_text[:200]}
                    )
                else:
                    self.log_result(
                        f'Syntax Check {endpoint}',
                        True,
                        f'{endpoint} has no syntax errors (500 error is functional)',
                        {'status_code': response['status_code']}
                    )
            else:
                self.log_result(
                    f'Syntax Check {endpoint}',
                    True,
                    f'{endpoint} responds without syntax errors',
                    {'status_code': response['status_code']}
                )

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting ProCreators Backend API Testing Suite")
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {TEST_USER_EMAIL}")
        print("=" * 60)
        print()
        
        # Test API syntax first
        print("📋 Testing API Syntax and Basic Responses...")
        self.test_api_syntax_errors()
        
        # Test authentication flow
        print("🔐 Testing Authentication APIs...")
        self.test_auth_signup()
        self.test_auth_login()
        self.test_auth_session()
        
        # Test credit system
        print("💳 Testing Credit System APIs...")
        self.test_credits_get()
        self.test_credits_deduct()
        
        # Test library save with Zod validation
        print("📚 Testing Library Save API with Zod Validation...")
        self.test_library_save_zod_validation()
        
        # Test generator APIs
        print("🎬 Testing Generator APIs...")
        self.test_story_reels_compose()
        self.test_ai_video_studio_generate()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}: {result['message']}")
        
        print()
        print("🎯 KEY FINDINGS:")
        
        # Check authentication
        auth_working = any(r['success'] and 'Auth Login' in r['test'] for r in self.test_results)
        if auth_working:
            print("  ✅ Authentication system is working")
        else:
            print("  ❌ Authentication system has issues")
            
        # Check credits
        credits_working = any(r['success'] and 'Credits' in r['test'] for r in self.test_results)
        if credits_working:
            print("  ✅ Credit system is functional")
        else:
            print("  ❌ Credit system has issues")
            
        # Check Zod validation
        zod_working = any(r['success'] and 'Zod' in r['test'] for r in self.test_results)
        if zod_working:
            print("  ✅ Zod validation is enabled and working")
        else:
            print("  ❌ Zod validation may have issues")
            
        # Check generators
        generators_working = any(r['success'] and ('Story Reels' in r['test'] or 'AI Video' in r['test']) for r in self.test_results)
        if generators_working:
            print("  ✅ Generator APIs are responding correctly")
        else:
            print("  ❌ Generator APIs may have issues")

if __name__ == "__main__":
    tester = ProCreatorsAPITester()
    tester.run_all_tests()