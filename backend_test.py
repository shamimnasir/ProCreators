#!/usr/bin/env python3
"""
Backend API Testing Script for Library Save API with Zod Validation
Tests the /api/library/save endpoint with comprehensive validation scenarios
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://ai-video-studio-79.preview.emergentagent.com"
API_ENDPOINT = f"{BASE_URL}/api/library/save"

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")

def print_test_result(success, message, response_data=None):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response_data:
        print(f"Response: {json.dumps(response_data, indent=2)}")
    print("-" * 60)

def test_library_save_api():
    """Test Library Save API with Zod validation"""
    
    print(f"🧪 LIBRARY SAVE API TESTING STARTED")
    print(f"Endpoint: {API_ENDPOINT}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = []
    
    # Test Case 1: Valid Save Request (should succeed)
    print_test_header("Valid Save Request")
    try:
        payload = {
            "type": "test",
            "title": "Test Library Save",
            "content": "This is test content for the library save API."
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('success'):
            required_fields = ['itemId', 'category', 'expiresAt']
            has_all_fields = all(field in response_data for field in required_fields)
            
            if has_all_fields:
                print_test_result(True, f"Valid request succeeded with status {response.status_code}", response_data)
                test_results.append(("Valid Save Request", True, "Success with all required fields"))
            else:
                missing_fields = [field for field in required_fields if field not in response_data]
                print_test_result(False, f"Missing required fields: {missing_fields}", response_data)
                test_results.append(("Valid Save Request", False, f"Missing fields: {missing_fields}"))
        else:
            print_test_result(False, f"Expected success but got status {response.status_code}", response_data)
            test_results.append(("Valid Save Request", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Valid Save Request", False, f"Exception: {str(e)}"))
    
    # Test Case 2: Missing Required Field - type (should fail validation)
    print_test_header("Missing Required Field - type")
    try:
        payload = {
            "title": "Test Title",
            "content": "Some content"
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 400 and response_data.get('error') == 'Validation failed':
            errors = response_data.get('errors', [])
            type_error_found = any('type' in str(error).lower() for error in errors)
            
            if type_error_found:
                print_test_result(True, f"Correctly rejected missing 'type' field with status {response.status_code}", response_data)
                test_results.append(("Missing type field", True, "Validation correctly failed"))
            else:
                print_test_result(False, f"Expected 'type' validation error but got: {errors}", response_data)
                test_results.append(("Missing type field", False, f"Wrong error: {errors}"))
        else:
            print_test_result(False, f"Expected 400 validation error but got status {response.status_code}", response_data)
            test_results.append(("Missing type field", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Missing type field", False, f"Exception: {str(e)}"))
    
    # Test Case 3: Missing Required Field - title (should fail validation)
    print_test_header("Missing Required Field - title")
    try:
        payload = {
            "type": "test",
            "content": "Some content"
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 400 and response_data.get('error') == 'Validation failed':
            errors = response_data.get('errors', [])
            title_error_found = any('title' in str(error).lower() for error in errors)
            
            if title_error_found:
                print_test_result(True, f"Correctly rejected missing 'title' field with status {response.status_code}", response_data)
                test_results.append(("Missing title field", True, "Validation correctly failed"))
            else:
                print_test_result(False, f"Expected 'title' validation error but got: {errors}", response_data)
                test_results.append(("Missing title field", False, f"Wrong error: {errors}"))
        else:
            print_test_result(False, f"Expected 400 validation error but got status {response.status_code}", response_data)
            test_results.append(("Missing title field", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Missing title field", False, f"Exception: {str(e)}"))
    
    # Test Case 4: Missing Content (should fail - no content, videoUrl, or filePath)
    print_test_header("Missing Content")
    try:
        payload = {
            "type": "test",
            "title": "Test Title"
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 400:
            error_message = response_data.get('error', '')
            content_error = 'content' in error_message.lower() or 'videourl' in error_message.lower() or 'filepath' in error_message.lower()
            
            if content_error:
                print_test_result(True, f"Correctly rejected missing content with status {response.status_code}", response_data)
                test_results.append(("Missing content", True, "Content validation correctly failed"))
            else:
                print_test_result(False, f"Expected content validation error but got: {error_message}", response_data)
                test_results.append(("Missing content", False, f"Wrong error: {error_message}"))
        else:
            print_test_result(False, f"Expected 400 validation error but got status {response.status_code}", response_data)
            test_results.append(("Missing content", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Missing content", False, f"Exception: {str(e)}"))
    
    # Test Case 5: Valid Save with videoUrl (should succeed)
    print_test_header("Valid Save with videoUrl")
    try:
        payload = {
            "type": "video",
            "title": "Video Test",
            "videoUrl": "https://example.com/video.mp4"
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('success'):
            category = response_data.get('category')
            if category == 'video':
                print_test_result(True, f"Valid videoUrl request succeeded with category: {category}", response_data)
                test_results.append(("Valid videoUrl", True, f"Success with category: {category}"))
            else:
                print_test_result(False, f"Expected category 'video' but got: {category}", response_data)
                test_results.append(("Valid videoUrl", False, f"Wrong category: {category}"))
        else:
            print_test_result(False, f"Expected success but got status {response.status_code}", response_data)
            test_results.append(("Valid videoUrl", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Valid videoUrl", False, f"Exception: {str(e)}"))
    
    # Test Case 6: Invalid videoUrl format (should fail validation)
    print_test_header("Invalid videoUrl format")
    try:
        payload = {
            "type": "video",
            "title": "Video Test",
            "videoUrl": "not-a-valid-url"
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        response_data = response.json()
        
        if response.status_code == 400 and response_data.get('error') == 'Validation failed':
            errors = response_data.get('errors', [])
            url_error_found = any('url' in str(error).lower() or 'videourl' in str(error).lower() for error in errors)
            
            if url_error_found:
                print_test_result(True, f"Correctly rejected invalid URL with status {response.status_code}", response_data)
                test_results.append(("Invalid videoUrl", True, "URL validation correctly failed"))
            else:
                print_test_result(False, f"Expected URL validation error but got: {errors}", response_data)
                test_results.append(("Invalid videoUrl", False, f"Wrong error: {errors}"))
        else:
            print_test_result(False, f"Expected 400 validation error but got status {response.status_code}", response_data)
            test_results.append(("Invalid videoUrl", False, f"Status {response.status_code}"))
            
    except Exception as e:
        print_test_result(False, f"Request failed: {str(e)}")
        test_results.append(("Invalid videoUrl", False, f"Exception: {str(e)}"))
    
    # Print Summary
    print(f"\n{'='*60}")
    print(f"LIBRARY SAVE API TEST SUMMARY")
    print(f"{'='*60}")
    
    passed_tests = sum(1 for _, success, _ in test_results if success)
    total_tests = len(test_results)
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    print(f"\nDetailed Results:")
    for test_name, success, message in test_results:
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
    
    # Overall assessment
    if passed_tests == total_tests:
        print(f"\n🎉 ALL TESTS PASSED - Library Save API with Zod validation is working correctly!")
        return True
    else:
        print(f"\n⚠️  {total_tests - passed_tests} TEST(S) FAILED - Library Save API needs attention")
        return False

if __name__ == "__main__":
    try:
        success = test_library_save_api()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTesting interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error during testing: {str(e)}")
        sys.exit(1)