#!/usr/bin/env python3
"""
Backend API Testing Script for Zod Validation
Tests all content generation APIs with valid and invalid payloads
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Base URL from environment
BASE_URL = "https://ratelimit-clean.preview.emergentagent.com"

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Backend-Test-Script/1.0'
        })
        self.results = []
    
    def test_api(self, endpoint: str, test_name: str, payload: Dict[str, Any], expected_status: int = 200) -> Dict[str, Any]:
        """Test an API endpoint with given payload"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            print(f"\n🧪 Testing: {test_name}")
            print(f"📍 Endpoint: {endpoint}")
            print(f"📦 Payload: {json.dumps(payload, indent=2)}")
            
            response = self.session.post(url, json=payload, timeout=30)
            
            print(f"📊 Status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"📄 Response: {json.dumps(response_data, indent=2)[:500]}...")
            except:
                response_data = {"raw_response": response.text[:500]}
                print(f"📄 Raw Response: {response.text[:500]}...")
            
            # Determine if test passed
            status_match = response.status_code == expected_status
            
            if expected_status == 400:
                # For validation errors, check for expected error structure
                validation_error = (
                    response_data.get('success') == False and
                    response_data.get('error') == 'Validation failed' and
                    'errors' in response_data
                )
                test_passed = status_match and validation_error
            else:
                # For success cases, check for success field
                test_passed = status_match and response_data.get('success', False)
            
            result = {
                'test_name': test_name,
                'endpoint': endpoint,
                'status_code': response.status_code,
                'expected_status': expected_status,
                'response_data': response_data,
                'test_passed': test_passed
            }
            
            if test_passed:
                print("✅ PASS")
            else:
                print("❌ FAIL")
                if expected_status == 400:
                    print(f"   Expected validation error structure, got: {response_data}")
                else:
                    print(f"   Expected status {expected_status}, got {response.status_code}")
            
            self.results.append(result)
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"❌ NETWORK ERROR: {str(e)}")
            result = {
                'test_name': test_name,
                'endpoint': endpoint,
                'error': str(e),
                'test_passed': False
            }
            self.results.append(result)
            return result
    
    def run_image_generation_tests(self):
        """Test /api/generate/image endpoint"""
        print("\n" + "="*60)
        print("🖼️  TESTING IMAGE GENERATION API")
        print("="*60)
        
        # Valid test
        self.test_api(
            "/api/generate/image",
            "Image Gen - Valid Request",
            {"prompt": "A beautiful sunset over mountains"},
            200
        )
        
        # Missing prompt
        self.test_api(
            "/api/generate/image",
            "Image Gen - Missing Prompt",
            {},
            400
        )
        
        # Prompt too long (>2000 chars)
        long_prompt = "A" * 2001
        self.test_api(
            "/api/generate/image",
            "Image Gen - Prompt Too Long",
            {"prompt": long_prompt},
            400
        )
        
        # Valid with optional fields
        self.test_api(
            "/api/generate/image",
            "Image Gen - With Optional Fields",
            {
                "prompt": "sunset",
                "style": "realistic",
                "aspectRatio": "16:9"
            },
            200
        )
        
        # Invalid aspect ratio
        self.test_api(
            "/api/generate/image",
            "Image Gen - Invalid Aspect Ratio",
            {
                "prompt": "test",
                "aspectRatio": "invalid"
            },
            400
        )
    
    def run_text_generation_tests(self):
        """Test /api/generate/text endpoint"""
        print("\n" + "="*60)
        print("📝 TESTING TEXT GENERATION API")
        print("="*60)
        
        # Valid test
        self.test_api(
            "/api/generate/text",
            "Text Gen - Valid Request",
            {"prompt": "Write a short poem about nature"},
            200
        )
        
        # Missing prompt
        self.test_api(
            "/api/generate/text",
            "Text Gen - Missing Prompt",
            {},
            400
        )
        
        # Prompt too long (>10000 chars)
        long_prompt = "A" * 10001
        self.test_api(
            "/api/generate/text",
            "Text Gen - Prompt Too Long",
            {"prompt": long_prompt},
            400
        )
        
        # Valid with type
        self.test_api(
            "/api/generate/text",
            "Text Gen - With Type",
            {
                "prompt": "Write tips",
                "type": "tutorial"
            },
            200
        )
    
    def run_blog_creator_tests(self):
        """Test /api/blog-creator/generate endpoint"""
        print("\n" + "="*60)
        print("📰 TESTING BLOG CREATOR API")
        print("="*60)
        
        # Valid test
        self.test_api(
            "/api/blog-creator/generate",
            "Blog Creator - Valid Request",
            {"topic": "How to start a business"},
            200
        )
        
        # Missing topic
        self.test_api(
            "/api/blog-creator/generate",
            "Blog Creator - Missing Topic",
            {"articleType": "seo-article"},
            400
        )
        
        # Invalid article type
        self.test_api(
            "/api/blog-creator/generate",
            "Blog Creator - Invalid Article Type",
            {
                "topic": "test",
                "articleType": "invalid-type"
            },
            400
        )
        
        # Invalid tone
        self.test_api(
            "/api/blog-creator/generate",
            "Blog Creator - Invalid Tone",
            {
                "topic": "test",
                "tone": "invalid-tone"
            },
            400
        )
        
        # Valid full payload
        self.test_api(
            "/api/blog-creator/generate",
            "Blog Creator - Full Payload",
            {
                "topic": "Starting a business",
                "articleType": "how-to-guide",
                "tone": "friendly",
                "writingStyle": "conversational",
                "wordCount": 1500
            },
            200
        )
    
    def run_carousel_generation_tests(self):
        """Test /api/generate/carousel endpoint"""
        print("\n" + "="*60)
        print("🎠 TESTING CAROUSEL GENERATION API")
        print("="*60)
        
        # Valid auto mode
        self.test_api(
            "/api/generate/carousel",
            "Carousel - Valid Auto Mode",
            {
                "prompt": "5 tips for productivity",
                "generationMode": "auto"
            },
            200
        )
        
        # Auto mode without prompt
        self.test_api(
            "/api/generate/carousel",
            "Carousel - Auto Mode Missing Prompt",
            {"generationMode": "auto"},
            400
        )
        
        # Invalid platform
        self.test_api(
            "/api/generate/carousel",
            "Carousel - Invalid Platform",
            {
                "prompt": "test",
                "platform": "invalid"
            },
            400
        )
        
        # Valid manual mode
        self.test_api(
            "/api/generate/carousel",
            "Carousel - Valid Manual Mode",
            {
                "generationMode": "manual",
                "manualSlides": [
                    {"text": "Slide 1"},
                    {"text": "Slide 2"}
                ]
            },
            200
        )
        
        # Manual mode without slides
        self.test_api(
            "/api/generate/carousel",
            "Carousel - Manual Mode Missing Slides",
            {"generationMode": "manual"},
            400
        )
    
    def run_video_generation_tests(self):
        """Test /api/generate/video/generate endpoint"""
        print("\n" + "="*60)
        print("🎬 TESTING VIDEO GENERATION API")
        print("="*60)
        
        # Valid test
        self.test_api(
            "/api/generate/video/generate",
            "Video Gen - Valid Request",
            {"script": "A short video about nature"},
            200
        )
        
        # Missing script
        self.test_api(
            "/api/generate/video/generate",
            "Video Gen - Missing Script",
            {},
            400
        )
        
        # Invalid mode
        self.test_api(
            "/api/generate/video/generate",
            "Video Gen - Invalid Mode",
            {
                "script": "test",
                "mode": "invalid"
            },
            400
        )
        
        # Invalid platform
        self.test_api(
            "/api/generate/video/generate",
            "Video Gen - Invalid Platform",
            {
                "script": "test",
                "platform": "invalid"
            },
            400
        )
        
        # Valid full payload
        self.test_api(
            "/api/generate/video/generate",
            "Video Gen - Full Payload",
            {
                "script": "Nature video",
                "mode": "fast",
                "platform": "instagram"
            },
            200
        )
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Zod Validation Testing")
        print(f"🌐 Base URL: {self.base_url}")
        
        self.run_image_generation_tests()
        self.run_text_generation_tests()
        self.run_blog_creator_tests()
        self.run_carousel_generation_tests()
        self.run_video_generation_tests()
        
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.get('test_passed', False))
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result.get('test_passed', False):
                    print(f"  - {result['test_name']}")
                    if 'error' in result:
                        print(f"    Error: {result['error']}")
                    elif 'response_data' in result:
                        print(f"    Response: {result['response_data']}")
        
        print("\n🎯 VALIDATION TESTING COMPLETE")
        
        return passed_tests, failed_tests

def main():
    """Main test runner"""
    tester = APITester(BASE_URL)
    
    try:
        tester.run_all_tests()
        passed, failed = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if failed == 0 else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()