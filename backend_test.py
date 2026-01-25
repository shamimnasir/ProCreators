#!/usr/bin/env python3
"""
Backend API Testing Script for Landing Page Copy Generator
Tests all frameworks, validation, and response structure
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://marketingai-hub-5.preview.emergentagent.com')
API_ENDPOINT = f"{BASE_URL}/api/landing-page-copy/generate"

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_basic_generation():
    """Test 1: Basic Generation Test with minimal fields"""
    print("🧪 TEST 1: Basic Generation Test")
    
    payload = {
        "productName": "AI Content Writer",
        "productDescription": "Tool that helps write blog posts faster"
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=60)
        
        if response.status_code != 200:
            print_test_result("Basic Generation", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
        data = response.json()
        
        # Check response structure
        if not data.get('success'):
            print_test_result("Basic Generation", False, f"API returned success=false: {data.get('error', 'Unknown error')}")
            return False
            
        # Verify required sections exist
        required_sections = ['heroSection', 'problemSection', 'solutionSection', 'ctaSection']
        missing_sections = []
        
        for section in required_sections:
            if section not in data.get('data', {}):
                missing_sections.append(section)
        
        if missing_sections:
            print_test_result("Basic Generation", False, f"Missing sections: {missing_sections}")
            return False
            
        # Check hero section structure
        hero = data['data']['heroSection']
        hero_fields = ['headline', 'subheadline', 'bulletPoints', 'primaryCTA', 'ctaTrigger']
        missing_hero_fields = [field for field in hero_fields if field not in hero]
        
        if missing_hero_fields:
            print_test_result("Basic Generation", False, f"Missing hero fields: {missing_hero_fields}")
            return False
            
        print_test_result("Basic Generation", True, f"Generated copy with framework: {data['data'].get('framework', 'Unknown')}")
        return True
        
    except requests.exceptions.Timeout:
        print_test_result("Basic Generation", False, "Request timeout (60s)")
        return False
    except Exception as e:
        print_test_result("Basic Generation", False, f"Exception: {str(e)}")
        return False

def test_framework_selection():
    """Test 2: Framework Selection Test - Test each framework"""
    print("🧪 TEST 2: Framework Selection Test")
    
    frameworks = ['pas', 'hso', 'bab', 'quest', 'spin', 'acfunnel']
    results = {}
    
    for framework in frameworks:
        print(f"  Testing framework: {framework.upper()}")
        
        payload = {
            "productName": "FlowState AI",
            "productDescription": "AI project management tool",
            "framework": framework
        }
        
        try:
            response = requests.post(API_ENDPOINT, json=payload, timeout=60)
            
            if response.status_code != 200:
                results[framework] = False
                print(f"    ❌ {framework}: HTTP {response.status_code}")
                continue
                
            data = response.json()
            
            if not data.get('success'):
                results[framework] = False
                print(f"    ❌ {framework}: {data.get('error', 'Unknown error')}")
                continue
                
            # Verify framework is correctly applied
            if data.get('metadata', {}).get('framework'):
                results[framework] = True
                print(f"    ✅ {framework}: {data['metadata']['framework']}")
            else:
                results[framework] = False
                print(f"    ❌ {framework}: Framework not in metadata")
                
        except Exception as e:
            results[framework] = False
            print(f"    ❌ {framework}: Exception - {str(e)}")
    
    success_count = sum(results.values())
    total_count = len(frameworks)
    
    if success_count == total_count:
        print_test_result("Framework Selection", True, f"All {total_count} frameworks working")
        return True
    else:
        print_test_result("Framework Selection", False, f"Only {success_count}/{total_count} frameworks working")
        return False

def test_industry_selection():
    """Test 3: Industry Selection Test"""
    print("🧪 TEST 3: Industry Selection Test")
    
    industries = ['saas', 'ecommerce', 'coaching', 'b2b']
    results = {}
    
    for industry in industries:
        print(f"  Testing industry: {industry}")
        
        payload = {
            "productName": "TestProduct",
            "productDescription": "Test product for industry testing",
            "industry": industry
        }
        
        try:
            response = requests.post(API_ENDPOINT, json=payload, timeout=60)
            
            if response.status_code != 200:
                results[industry] = False
                print(f"    ❌ {industry}: HTTP {response.status_code}")
                continue
                
            data = response.json()
            
            if not data.get('success'):
                results[industry] = False
                print(f"    ❌ {industry}: {data.get('error', 'Unknown error')}")
                continue
                
            # Verify industry is correctly applied
            metadata_industry = data.get('metadata', {}).get('industry')
            if metadata_industry:
                results[industry] = True
                print(f"    ✅ {industry}: {metadata_industry}")
            else:
                results[industry] = False
                print(f"    ❌ {industry}: Industry not in metadata")
                
        except Exception as e:
            results[industry] = False
            print(f"    ❌ {industry}: Exception - {str(e)}")
    
    success_count = sum(results.values())
    total_count = len(industries)
    
    if success_count == total_count:
        print_test_result("Industry Selection", True, f"All {total_count} industries working")
        return True
    else:
        print_test_result("Industry Selection", False, f"Only {success_count}/{total_count} industries working")
        return False

def test_full_pro_mode():
    """Test 4: Full Pro Mode Test with all fields"""
    print("🧪 TEST 4: Full Pro Mode Test")
    
    payload = {
        "productName": "FlowState AI",
        "productDescription": "AI project management tool",
        "industry": "saas",
        "targetAudience": "Busy entrepreneurs aged 25-45",
        "framework": "pas",
        "tone": "professional",
        "painPoints": "Spending $5k/month on ads with only 1% conversion",
        "desiredOutcome": "Close 30% more deals without extra tasks",
        "uniqueSellingPoints": "Only AI-driven tool that automates lead scoring",
        "socialProof": "10,000+ customers, 4.9 star rating",
        "specificResults": "Helped Company X reduce churn by 22% in 90 days",
        "pricing": "$97/month",
        "guarantee": "30-day money-back guarantee",
        "urgencyElement": "Beta pricing ends in 48 hours"
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=60)
        
        if response.status_code != 200:
            print_test_result("Full Pro Mode", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
        data = response.json()
        
        if not data.get('success'):
            print_test_result("Full Pro Mode", False, f"API returned success=false: {data.get('error', 'Unknown error')}")
            return False
            
        # Check comprehensive sections exist
        expected_sections = [
            'heroSection', 'problemSection', 'solutionSection', 
            'socialProofSection', 'faqSection', 'ctaSection'
        ]
        
        missing_sections = []
        for section in expected_sections:
            if section not in data.get('data', {}):
                missing_sections.append(section)
        
        if missing_sections:
            print_test_result("Full Pro Mode", False, f"Missing sections: {missing_sections}")
            return False
            
        # Verify metadata includes all provided info
        metadata = data.get('metadata', {})
        expected_metadata = ['framework', 'industry', 'tone', 'productName']
        missing_metadata = [field for field in expected_metadata if field not in metadata]
        
        if missing_metadata:
            print_test_result("Full Pro Mode", False, f"Missing metadata: {missing_metadata}")
            return False
            
        print_test_result("Full Pro Mode", True, "All sections and metadata present")
        return True
        
    except Exception as e:
        print_test_result("Full Pro Mode", False, f"Exception: {str(e)}")
        return False

def test_validation():
    """Test 5: Validation Test - Missing required field"""
    print("🧪 TEST 5: Validation Test")
    
    # Test with missing productName
    payload = {
        "productDescription": "Tool that helps write blog posts faster"
        # Missing productName
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=30)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get('success') and 'required' in data.get('error', '').lower():
                print_test_result("Validation Test", True, f"Correctly rejected missing productName: {data.get('error')}")
                return True
            else:
                print_test_result("Validation Test", False, f"Wrong error message: {data.get('error')}")
                return False
        else:
            print_test_result("Validation Test", False, f"Expected 400 status, got {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("Validation Test", False, f"Exception: {str(e)}")
        return False

def test_response_structure():
    """Test 6: Response Structure Verification"""
    print("🧪 TEST 6: Response Structure Verification")
    
    payload = {
        "productName": "TestProduct",
        "productDescription": "Test product for structure verification",
        "framework": "hso"
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=payload, timeout=60)
        
        if response.status_code != 200:
            print_test_result("Response Structure", False, f"HTTP {response.status_code}")
            return False
            
        data = response.json()
        
        if not data.get('success'):
            print_test_result("Response Structure", False, f"API error: {data.get('error')}")
            return False
            
        # Check top-level structure
        required_top_level = ['success', 'data', 'metadata']
        missing_top_level = [field for field in required_top_level if field not in data]
        
        if missing_top_level:
            print_test_result("Response Structure", False, f"Missing top-level fields: {missing_top_level}")
            return False
            
        # Check data structure
        data_obj = data['data']
        required_data_sections = ['framework', 'heroSection', 'problemSection', 'solutionSection', 'ctaSection']
        missing_data_sections = [section for section in required_data_sections if section not in data_obj]
        
        if missing_data_sections:
            print_test_result("Response Structure", False, f"Missing data sections: {missing_data_sections}")
            return False
            
        # Check heroSection structure
        hero = data_obj['heroSection']
        required_hero_fields = ['headline', 'subheadline', 'bulletPoints', 'primaryCTA', 'ctaTrigger']
        missing_hero_fields = [field for field in required_hero_fields if field not in hero]
        
        if missing_hero_fields:
            print_test_result("Response Structure", False, f"Missing hero fields: {missing_hero_fields}")
            return False
            
        # Check metadata structure
        metadata = data['metadata']
        required_metadata_fields = ['framework', 'generatedAt']
        missing_metadata_fields = [field for field in required_metadata_fields if field not in metadata]
        
        if missing_metadata_fields:
            print_test_result("Response Structure", False, f"Missing metadata fields: {missing_metadata_fields}")
            return False
            
        print_test_result("Response Structure", True, "All required structure elements present")
        return True
        
    except Exception as e:
        print_test_result("Response Structure", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 LANDING PAGE COPY GENERATOR API TESTING")
    print("=" * 60)
    print(f"Testing endpoint: {API_ENDPOINT}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all tests
    test_results = []
    
    test_results.append(test_basic_generation())
    test_results.append(test_framework_selection())
    test_results.append(test_industry_selection())
    test_results.append(test_full_pro_mode())
    test_results.append(test_validation())
    test_results.append(test_response_structure())
    
    # Summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Landing Page Copy Generator API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total-passed} TEST(S) FAILED. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())