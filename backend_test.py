#!/usr/bin/env python3
"""
Backend API Testing Script for Pitch Deck Creator
Tests the /api/pitch-deck/generate and /api/pitch-deck/generate-pdf endpoints
"""

import requests
import json
import time
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://marketingai-hub-5.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"   Details: {details}")

def test_pitch_deck_generate():
    """Test 1: Basic Pitch Deck Generation"""
    print_test_header("Test 1: Basic Pitch Deck Generation")
    
    try:
        url = f"{API_BASE}/pitch-deck/generate"
        payload = {
            "companyName": "TechFlow AI",
            "tagline": "AI that works for you",
            "companyDescription": "AI-powered productivity platform",
            "industry": "ai",
            "problemStatement": "Companies waste 20 hours per week on manual tasks",
            "solution": "Automated AI assistant",
            "deckStyle": "classic",
            "fundingStage": "seed",
            "fundingAmount": "$2M"
        }
        
        print(f"📡 POST {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=120)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f}s")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 Response keys: {list(data.keys())}")
            
            # Check response structure
            if data.get('success') == True:
                print_result(True, "API returned success=true")
                
                # Check data structure
                if 'data' in data:
                    pitch_data = data['data']
                    print_result(True, f"Response contains 'data' field")
                    
                    # Check slides
                    if 'slides' in pitch_data and isinstance(pitch_data['slides'], list):
                        slides_count = len(pitch_data['slides'])
                        print_result(True, f"Contains {slides_count} slides")
                        
                        if slides_count == 12:
                            print_result(True, "Correct number of slides (12)")
                        else:
                            print_result(False, f"Expected 12 slides, got {slides_count}")
                        
                        # Check first few slide titles
                        if slides_count > 0:
                            slide_titles = [slide.get('title', 'No title') for slide in pitch_data['slides'][:3]]
                            print(f"   First 3 slide titles: {slide_titles}")
                    else:
                        print_result(False, "Missing or invalid 'slides' array")
                else:
                    print_result(False, "Missing 'data' field in response")
                
                # Check metadata
                if 'metadata' in data:
                    metadata = data['metadata']
                    print_result(True, f"Contains metadata: {list(metadata.keys())}")
                else:
                    print_result(False, "Missing 'metadata' field")
                    
            else:
                print_result(False, f"API returned success=false or missing success field")
                if 'error' in data:
                    print(f"   Error: {data['error']}")
        else:
            print_result(False, f"HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error response: {error_data}")
            except:
                print(f"   Raw response: {response.text[:500]}")
                
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out (>120s)")
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")

def test_pitch_deck_validation():
    """Test 2: Validation Test - Empty Body"""
    print_test_header("Test 2: Validation Test - Empty Body")
    
    try:
        url = f"{API_BASE}/pitch-deck/generate"
        payload = {}  # Empty payload
        
        print(f"📡 POST {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f}s")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print_result(True, "Correctly returned 400 status code")
            
            try:
                data = response.json()
                if 'error' in data and 'Company name is required' in data['error']:
                    print_result(True, "Correct error message: 'Company name is required'")
                else:
                    print_result(False, f"Unexpected error message: {data.get('error', 'No error field')}")
            except:
                print_result(False, "Could not parse error response as JSON")
        else:
            print_result(False, f"Expected 400 status code, got {response.status_code}")
            try:
                data = response.json()
                print(f"   Response: {data}")
            except:
                print(f"   Raw response: {response.text[:500]}")
                
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")

def test_pitch_deck_pdf_export():
    """Test 3: PDF Export Test"""
    print_test_header("Test 3: PDF Export Test")
    
    try:
        url = f"{API_BASE}/pitch-deck/generate-pdf"
        payload = {
            "data": {
                "companyName": "TestCo",
                "slides": [
                    {
                        "slideNumber": 1,
                        "title": "Title Slide",
                        "slideType": "title",
                        "content": {
                            "companyName": "TestCo",
                            "tagline": "Testing PDF"
                        }
                    }
                ]
            },
            "metadata": {
                "companyName": "TestCo",
                "deckStyle": "classic",
                "industry": "Technology"
            }
        }
        
        print(f"📡 POST {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=60)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f}s")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 Response keys: {list(data.keys())}")
            
            if data.get('success') == True:
                print_result(True, "API returned success=true")
                
                # Check for PDF data URL or HTML fallback
                if 'pdfDataUrl' in data:
                    pdf_url = data['pdfDataUrl']
                    if pdf_url.startswith('data:application/pdf;base64,'):
                        print_result(True, "Contains valid PDF data URL")
                        pdf_size = len(pdf_url)
                        print(f"   PDF data size: {pdf_size} characters")
                    else:
                        print_result(False, "Invalid PDF data URL format")
                elif 'fallback' in data and data['fallback'] == True:
                    print_result(True, "PDF generation fallback activated")
                    if 'htmlContent' in data:
                        html_size = len(data['htmlContent'])
                        print_result(True, f"HTML fallback provided ({html_size} characters)")
                    else:
                        print_result(False, "Missing HTML content in fallback response")
                else:
                    print_result(False, "Missing both pdfDataUrl and fallback response")
                    
            else:
                print_result(False, "API returned success=false")
                if 'error' in data:
                    print(f"   Error: {data['error']}")
        else:
            print_result(False, f"HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error response: {error_data}")
            except:
                print(f"   Raw response: {response.text[:500]}")
                
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")

def test_pdf_validation_missing_data():
    """Test 4: PDF Export Validation - Missing Data"""
    print_test_header("Test 4: PDF Export Validation - Missing Data")
    
    try:
        url = f"{API_BASE}/pitch-deck/generate-pdf"
        payload = {
            "metadata": {
                "companyName": "TestCo",
                "deckStyle": "classic"
            }
            # Missing 'data' field
        }
        
        print(f"📡 POST {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print_result(True, "Correctly returned 400 status code")
            
            try:
                data = response.json()
                if 'error' in data and 'Missing data or metadata' in data['error']:
                    print_result(True, "Correct error message: 'Missing data or metadata'")
                else:
                    print_result(False, f"Unexpected error message: {data.get('error', 'No error field')}")
            except:
                print_result(False, "Could not parse error response as JSON")
        else:
            print_result(False, f"Expected 400 status code, got {response.status_code}")
                
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")

def test_pdf_validation_missing_metadata():
    """Test 5: PDF Export Validation - Missing Metadata"""
    print_test_header("Test 5: PDF Export Validation - Missing Metadata")
    
    try:
        url = f"{API_BASE}/pitch-deck/generate-pdf"
        payload = {
            "data": {
                "companyName": "TestCo",
                "slides": []
            }
            # Missing 'metadata' field
        }
        
        print(f"📡 POST {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print_result(True, "Correctly returned 400 status code")
            
            try:
                data = response.json()
                if 'error' in data and 'Missing data or metadata' in data['error']:
                    print_result(True, "Correct error message: 'Missing data or metadata'")
                else:
                    print_result(False, f"Unexpected error message: {data.get('error', 'No error field')}")
            except:
                print_result(False, "Could not parse error response as JSON")
        else:
            print_result(False, f"Expected 400 status code, got {response.status_code}")
                
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")

def main():
    """Run all tests"""
    print("🚀 Starting Pitch Deck Creator API Backend Tests")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test results tracking
    test_results = []
    
    try:
        # Test 1: Basic pitch deck generation
        print("\n" + "="*80)
        test_pitch_deck_generate()
        
        # Test 2: Validation test
        print("\n" + "="*80)
        test_pitch_deck_validation()
        
        # Test 3: PDF export test
        print("\n" + "="*80)
        test_pitch_deck_pdf_export()
        
        # Test 4: PDF validation - missing data
        print("\n" + "="*80)
        test_pdf_validation_missing_data()
        
        # Test 5: PDF validation - missing metadata
        print("\n" + "="*80)
        test_pdf_validation_missing_metadata()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error during testing: {str(e)}")
    
    print("\n" + "="*80)
    print("🏁 Pitch Deck Creator API Testing Complete")
    print("="*80)

if __name__ == "__main__":
    main()