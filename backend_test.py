#!/usr/bin/env python3
"""
Backend API Testing Script for Business Plan Generator
Tests all API endpoints with comprehensive test cases
"""

import requests
import json
import time
import sys
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://marketingai-hub-5.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {test_name}")
    print(f"{'='*60}")

def print_test_result(test_name, success, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")

def test_business_plan_api():
    """Test Business Plan Generator API with all test cases"""
    
    print_test_header("BUSINESS PLAN GENERATOR API")
    
    # Test Case 1: Basic Traditional Plan Test
    print_test_header("Test Case 1: Basic Traditional Plan")
    try:
        payload = {
            "companyName": "TestCorp",
            "companyDescription": "A tech startup",
            "planType": "traditional",
            "industry": "technology",
            "businessStage": "idea"
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            has_success = data.get('success') == True
            has_data = 'data' in data
            
            if has_success and has_data:
                plan_data = data['data']
                
                # Check required sections for traditional plan
                required_sections = [
                    'executiveSummary', 'companyDescription', 'productsAndServices',
                    'marketAnalysis', 'marketingPlan', 'operationsPlan', 
                    'managementTeam', 'financialPlan'
                ]
                
                missing_sections = []
                for section in required_sections:
                    if section not in plan_data:
                        missing_sections.append(section)
                
                if not missing_sections:
                    print_test_result("Basic Traditional Plan", True, 
                                    f"All required sections present: {', '.join(required_sections)}")
                else:
                    print_test_result("Basic Traditional Plan", False, 
                                    f"Missing sections: {', '.join(missing_sections)}")
            else:
                print_test_result("Basic Traditional Plan", False, 
                                f"Invalid response structure. Success: {has_success}, Has data: {has_data}")
        else:
            print_test_result("Basic Traditional Plan", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print_test_result("Basic Traditional Plan", False, f"Exception: {str(e)}")
    
    # Test Case 2: Lean Canvas Test
    print_test_header("Test Case 2: Lean Canvas")
    try:
        payload = {
            "planType": "lean",
            "companyName": "LeanStartup",
            "companyDescription": "SaaS platform",
            "productsServices": "AI-powered analytics",
            "targetMarket": "SMBs",
            "industry": "technology"
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                plan_data = data['data']
                
                # Check for canvas structure
                if 'canvas' in plan_data:
                    canvas = plan_data['canvas']
                    required_canvas_sections = [
                        'problem', 'solution', 'uniqueValueProposition', 'unfairAdvantage',
                        'customerSegments', 'keyMetrics', 'channels', 'costStructure', 'revenueStreams'
                    ]
                    
                    missing_canvas_sections = []
                    for section in required_canvas_sections:
                        if section not in canvas:
                            missing_canvas_sections.append(section)
                    
                    if not missing_canvas_sections:
                        print_test_result("Lean Canvas", True, 
                                        f"All canvas sections present: {', '.join(required_canvas_sections)}")
                    else:
                        print_test_result("Lean Canvas", False, 
                                        f"Missing canvas sections: {', '.join(missing_canvas_sections)}")
                else:
                    print_test_result("Lean Canvas", False, "No canvas structure found in response")
            else:
                print_test_result("Lean Canvas", False, "Invalid response structure")
        else:
            print_test_result("Lean Canvas", False, f"HTTP {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print_test_result("Lean Canvas", False, f"Exception: {str(e)}")
    
    # Test Case 3: Pitch Deck Test
    print_test_header("Test Case 3: Pitch Deck")
    try:
        payload = {
            "planType": "pitch",
            "companyName": "PitchPro",
            "industry": "finance",
            "businessStage": "mvp",
            "fundingNeeded": "$500,000",
            "targetMarket": "Banks and credit unions"
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                plan_data = data['data']
                
                # Check for slides structure
                if 'slides' in plan_data and isinstance(plan_data['slides'], list):
                    slides = plan_data['slides']
                    
                    # Should have 12 slides
                    if len(slides) == 12:
                        expected_slide_titles = [
                            "Title Slide", "The Problem", "The Solution", "Market Opportunity",
                            "Business Model", "Traction", "Competition", "Go-to-Market Strategy",
                            "The Team", "Financials", "The Ask", "Thank You"
                        ]
                        
                        slide_titles = [slide.get('title', '') for slide in slides]
                        missing_slides = []
                        
                        for expected_title in expected_slide_titles:
                            if expected_title not in slide_titles:
                                missing_slides.append(expected_title)
                        
                        if not missing_slides:
                            print_test_result("Pitch Deck", True, 
                                            f"All 12 slides present with correct titles")
                        else:
                            print_test_result("Pitch Deck", False, 
                                            f"Missing slides: {', '.join(missing_slides)}")
                    else:
                        print_test_result("Pitch Deck", False, 
                                        f"Expected 12 slides, got {len(slides)}")
                else:
                    print_test_result("Pitch Deck", False, "No slides array found in response")
            else:
                print_test_result("Pitch Deck", False, "Invalid response structure")
        else:
            print_test_result("Pitch Deck", False, f"HTTP {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print_test_result("Pitch Deck", False, f"Exception: {str(e)}")
    
    # Test Case 4: Validation Test
    print_test_header("Test Case 4: Validation Test")
    try:
        payload = {
            "planType": "traditional"
            # Missing companyName intentionally
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            error_message = data.get('error', '')
            
            if 'Company name is required' in error_message:
                print_test_result("Validation Test", True, 
                                f"Correctly rejected with error: {error_message}")
            else:
                print_test_result("Validation Test", False, 
                                f"Wrong error message: {error_message}")
        else:
            print_test_result("Validation Test", False, 
                            f"Expected 400 status, got {response.status_code}")
            
    except Exception as e:
        print_test_result("Validation Test", False, f"Exception: {str(e)}")
    
    # Test Case 5: Full Payload Test (Traditional)
    print_test_header("Test Case 5: Full Payload Test")
    try:
        payload = {
            "planType": "traditional",
            "companyName": "ComprehensiveTech Solutions",
            "companyDescription": "A comprehensive technology solutions provider specializing in AI-powered business automation",
            "industry": "technology",
            "businessStage": "growth",
            "legalStructure": "llc",
            "foundingDate": "2023-01-15",
            "location": "San Francisco, CA",
            "missionStatement": "To empower businesses through innovative AI solutions that streamline operations and drive growth",
            "visionStatement": "To become the leading provider of AI-powered business automation solutions globally",
            "coreValues": "Innovation, Integrity, Customer Success, Continuous Learning",
            "productsServices": "AI-powered workflow automation, predictive analytics, custom AI model development",
            "problemSolved": "Manual business processes that are time-consuming and error-prone",
            "uniqueValue": "Proprietary AI algorithms with 99.5% accuracy and seamless integration capabilities",
            "pricingModel": "SaaS subscription with tiered pricing based on usage and features",
            "targetMarket": "Mid-market companies with 100-1000 employees in manufacturing, finance, and healthcare",
            "marketSize": "$50B total addressable market with 15% annual growth",
            "competitors": "UiPath, Automation Anywhere, Microsoft Power Automate",
            "competitiveAdvantage": "Superior AI accuracy, faster implementation, and industry-specific solutions",
            "founders": "John Smith (CEO, 15 years tech experience), Jane Doe (CTO, AI PhD from Stanford)",
            "keyTeam": "5 engineers, 2 sales professionals, 1 marketing specialist",
            "advisors": "Former executives from Google, Microsoft, and Salesforce",
            "hiringPlan": "Plan to hire 10 additional engineers and 3 sales reps in next 12 months",
            "operationsDescription": "Cloud-based development with agile methodology and continuous deployment",
            "suppliers": "AWS for cloud infrastructure, OpenAI for base models, various data providers",
            "technologyStack": "Python, TensorFlow, React, Node.js, PostgreSQL, AWS",
            "revenueModel": "Monthly recurring revenue from SaaS subscriptions plus professional services",
            "startupCosts": "$2M for initial development, team, and infrastructure",
            "fundingNeeded": "$5M Series A for scaling operations and market expansion",
            "fundingUse": "60% engineering team, 25% sales & marketing, 15% operations",
            "projectedRevenue": "Year 1: $1M, Year 2: $5M, Year 3: $15M",
            "breakEvenTimeline": "Month 18 with current growth trajectory",
            "shortTermGoals": "Launch enterprise product, acquire 50 customers, achieve $2M ARR",
            "longTermGoals": "IPO in 5 years, expand internationally, achieve $100M ARR",
            "milestones": "Q1: Product launch, Q2: 10 customers, Q3: Series A funding, Q4: 50 customers"
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=90  # Longer timeout for comprehensive plan
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                plan_data = data['data']
                
                # Check all sections are detailed and properly structured
                required_sections = [
                    'executiveSummary', 'companyDescription', 'productsAndServices',
                    'marketAnalysis', 'marketingPlan', 'operationsPlan', 
                    'managementTeam', 'financialPlan'
                ]
                
                detailed_sections = []
                for section in required_sections:
                    if section in plan_data:
                        section_data = plan_data[section]
                        # Check if section has substantial content (not just empty structures)
                        if isinstance(section_data, dict) and len(str(section_data)) > 100:
                            detailed_sections.append(section)
                
                if len(detailed_sections) == len(required_sections):
                    print_test_result("Full Payload Test", True, 
                                    f"All sections detailed and comprehensive: {', '.join(detailed_sections)}")
                else:
                    missing_detail = set(required_sections) - set(detailed_sections)
                    print_test_result("Full Payload Test", False, 
                                    f"Sections lacking detail: {', '.join(missing_detail)}")
            else:
                print_test_result("Full Payload Test", False, "Invalid response structure")
        else:
            print_test_result("Full Payload Test", False, f"HTTP {response.status_code}: {response.text[:200]}")
            
    except Exception as e:
        print_test_result("Full Payload Test", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print(f"🚀 Starting Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test Business Plan Generator API
    test_business_plan_api()
    
    print(f"\n{'='*60}")
    print(f"🏁 Backend Testing Complete")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()