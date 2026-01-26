#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

# Base URL from environment
BASE_URL = "https://marketingai-hub-5.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def log_test_result(test_name, success, details="", response_time=None):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status = "✅ PASS" if success else "❌ FAIL"
    time_info = f" ({response_time:.2f}s)" if response_time else ""
    print(f"[{timestamp}] {status} - {test_name}{time_info}")
    if details:
        print(f"    Details: {details}")
    print()

def test_business_plan_pdf_export():
    """Test Business Plan PDF Export API comprehensively"""
    print("🧪 TESTING BUSINESS PLAN PDF EXPORT API")
    print("=" * 60)
    
    # Test 1: Traditional Plan PDF Export
    print("📋 Test 1: Traditional Business Plan PDF Export")
    try:
        start_time = time.time()
        
        traditional_payload = {
            "data": {
                "planType": "Traditional Business Plan",
                "companyName": "TestCorp",
                "executiveSummary": {
                    "overview": "TestCorp is an innovative tech startup focused on providing cutting-edge analytics solutions.",
                    "missionStatement": "To provide excellent services that transform businesses through data-driven insights.",
                    "businessDescription": "A SaaS company providing advanced analytics and business intelligence solutions."
                },
                "companyDescription": {
                    "overview": "TestCorp was founded in 2024 with a vision to revolutionize business analytics.",
                    "missionStatement": "Excellence in everything we do, powered by innovation and customer focus.",
                    "coreValues": ["Innovation", "Integrity", "Customer Focus", "Excellence"]
                },
                "productsAndServices": {
                    "overview": "We offer comprehensive analytics solutions for modern businesses.",
                    "problemSolution": "Businesses struggle with data analysis - we provide intuitive tools to solve this.",
                    "uniqueValueProposition": "AI-powered analytics with real-time insights and predictive capabilities."
                },
                "marketAnalysis": {
                    "industryOverview": {
                        "description": "The business analytics market is rapidly growing with increasing demand for data-driven decisions.",
                        "size": "$50 billion globally",
                        "growthRate": "15% annually"
                    },
                    "targetMarket": {
                        "description": "Small to medium businesses looking to leverage data for growth.",
                        "demographics": "Companies with 10-500 employees in tech, retail, and services sectors"
                    }
                }
            },
            "metadata": {
                "planType": "Traditional Business Plan",
                "companyName": "TestCorp",
                "industry": "Technology",
                "stage": "Startup"
            },
            "saveToLibrary": False
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=traditional_payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                # Check if we got PDF or HTML fallback
                if data.get("pdfDataUrl"):
                    log_test_result("Traditional Plan PDF Export", True, 
                                  f"PDF generated successfully. Size: {len(data['pdfDataUrl'])} chars", response_time)
                elif data.get("fallback") and data.get("htmlContent"):
                    log_test_result("Traditional Plan PDF Export (HTML Fallback)", True, 
                                  f"HTML fallback provided. Size: {len(data['htmlContent'])} chars", response_time)
                else:
                    log_test_result("Traditional Plan PDF Export", False, 
                                  "No PDF or HTML content in response", response_time)
            else:
                log_test_result("Traditional Plan PDF Export", False, 
                              f"API returned success=false: {data.get('error', 'Unknown error')}", response_time)
        else:
            log_test_result("Traditional Plan PDF Export", False, 
                          f"HTTP {response.status_code}: {response.text[:200]}", response_time)
            
    except Exception as e:
        log_test_result("Traditional Plan PDF Export", False, f"Exception: {str(e)}")

    # Test 2: Pitch Deck PDF Export
    print("🎯 Test 2: Investor Pitch Deck PDF Export")
    try:
        start_time = time.time()
        
        pitch_payload = {
            "data": {
                "planType": "Investor Pitch Deck",
                "companyName": "PitchCo",
                "slides": [
                    {
                        "slideNumber": 1,
                        "title": "Title Slide",
                        "content": {
                            "companyName": "PitchCo",
                            "tagline": "Revolutionizing analytics for modern businesses",
                            "founderName": "John Smith"
                        },
                        "speakerNotes": "Welcome everyone to our pitch presentation"
                    },
                    {
                        "slideNumber": 2,
                        "title": "The Problem",
                        "content": {
                            "headline": "Analytics is too complex for most businesses",
                            "problemStatements": [
                                "Small businesses lack data expertise",
                                "Existing tools are too expensive",
                                "Complex setup and maintenance required"
                            ]
                        },
                        "speakerNotes": "This is a $10B problem affecting millions of businesses"
                    },
                    {
                        "slideNumber": 3,
                        "title": "The Solution",
                        "content": {
                            "headline": "AI-powered analytics made simple",
                            "solutionPoints": [
                                "One-click setup and integration",
                                "Automated insights and recommendations",
                                "Affordable pricing for all business sizes"
                            ]
                        }
                    }
                ]
            },
            "metadata": {
                "planType": "Investor Pitch Deck",
                "companyName": "PitchCo",
                "industry": "Technology",
                "stage": "MVP"
            },
            "saveToLibrary": False
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=pitch_payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                if data.get("pdfDataUrl"):
                    log_test_result("Pitch Deck PDF Export", True, 
                                  f"PDF generated successfully. Size: {len(data['pdfDataUrl'])} chars", response_time)
                elif data.get("fallback") and data.get("htmlContent"):
                    log_test_result("Pitch Deck PDF Export (HTML Fallback)", True, 
                                  f"HTML fallback provided. Size: {len(data['htmlContent'])} chars", response_time)
                else:
                    log_test_result("Pitch Deck PDF Export", False, 
                                  "No PDF or HTML content in response", response_time)
            else:
                log_test_result("Pitch Deck PDF Export", False, 
                              f"API returned success=false: {data.get('error', 'Unknown error')}", response_time)
        else:
            log_test_result("Pitch Deck PDF Export", False, 
                          f"HTTP {response.status_code}: {response.text[:200]}", response_time)
            
    except Exception as e:
        log_test_result("Pitch Deck PDF Export", False, f"Exception: {str(e)}")

    # Test 3: Lean Canvas PDF Export
    print("📊 Test 3: Lean Canvas PDF Export")
    try:
        start_time = time.time()
        
        lean_payload = {
            "data": {
                "planType": "Lean Startup Canvas",
                "companyName": "LeanStartup",
                "canvas": {
                    "problem": {
                        "topProblems": [
                            "Small businesses can't afford enterprise analytics",
                            "Existing solutions are too complex to implement",
                            "No real-time insights available"
                        ],
                        "existingAlternatives": ["Excel spreadsheets", "Basic reporting tools", "Manual analysis"]
                    },
                    "solution": {
                        "topFeatures": [
                            "One-click data integration",
                            "AI-powered insights",
                            "Real-time dashboards",
                            "Predictive analytics"
                        ]
                    },
                    "uniqueValueProposition": {
                        "statement": "Enterprise-grade analytics made simple and affordable for small businesses",
                        "highLevelConcept": "Tableau for small businesses"
                    },
                    "unfairAdvantage": {
                        "advantages": [
                            "Proprietary AI algorithms",
                            "10+ years of industry experience",
                            "Strategic partnerships with data providers"
                        ]
                    },
                    "customerSegments": {
                        "targetCustomers": [
                            "Small retail businesses (10-50 employees)",
                            "Local service providers",
                            "E-commerce startups"
                        ],
                        "earlyAdopters": "Tech-savvy small business owners looking for competitive advantage"
                    },
                    "keyMetrics": {
                        "metrics": [
                            "Monthly Active Users (MAU)",
                            "Customer Acquisition Cost (CAC)",
                            "Monthly Recurring Revenue (MRR)",
                            "Customer Lifetime Value (LTV)"
                        ]
                    },
                    "channels": {
                        "pathToCustomers": [
                            "Content marketing and SEO",
                            "Social media advertising",
                            "Partner referrals",
                            "Direct sales outreach"
                        ]
                    },
                    "costStructure": {
                        "fixedCosts": ["Software development", "Infrastructure", "Team salaries"],
                        "variableCosts": ["Customer acquisition", "Data processing", "Support"],
                        "monthlyBurnRate": "$25,000"
                    },
                    "revenueStreams": {
                        "streams": [
                            "Monthly subscription fees",
                            "Setup and onboarding services",
                            "Premium support packages"
                        ],
                        "pricing": "Starting at $99/month",
                        "lifetimeValue": "$2,400 average LTV"
                    }
                },
                "hypotheses": [
                    {
                        "hypothesis": "Small businesses will pay $99/month for simple analytics",
                        "test": "Landing page with pricing and email signup"
                    },
                    {
                        "hypothesis": "One-click integration is the key differentiator",
                        "test": "A/B test messaging focused on ease of setup"
                    }
                ],
                "mvpPlan": {
                    "description": "Basic dashboard with 3 key metrics and simple data integration",
                    "features": [
                        "Connect to 3 data sources",
                        "Pre-built dashboard templates",
                        "Basic reporting functionality"
                    ],
                    "timeline": "3 months to MVP",
                    "budget": "$75,000"
                }
            },
            "metadata": {
                "planType": "Lean Startup Canvas",
                "companyName": "LeanStartup",
                "industry": "Technology",
                "stage": "Idea"
            },
            "saveToLibrary": False
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=lean_payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                if data.get("pdfDataUrl"):
                    log_test_result("Lean Canvas PDF Export", True, 
                                  f"PDF generated successfully. Size: {len(data['pdfDataUrl'])} chars", response_time)
                elif data.get("fallback") and data.get("htmlContent"):
                    log_test_result("Lean Canvas PDF Export (HTML Fallback)", True, 
                                  f"HTML fallback provided. Size: {len(data['htmlContent'])} chars", response_time)
                else:
                    log_test_result("Lean Canvas PDF Export", False, 
                                  "No PDF or HTML content in response", response_time)
            else:
                log_test_result("Lean Canvas PDF Export", False, 
                              f"API returned success=false: {data.get('error', 'Unknown error')}", response_time)
        else:
            log_test_result("Lean Canvas PDF Export", False, 
                          f"HTTP {response.status_code}: {response.text[:200]}", response_time)
            
    except Exception as e:
        log_test_result("Lean Canvas PDF Export", False, f"Exception: {str(e)}")

    # Test 4: Validation Test - Missing Data
    print("⚠️ Test 4: Validation Test (Missing Required Data)")
    try:
        start_time = time.time()
        
        invalid_payload = {
            "data": {
                "planType": "Traditional Business Plan"
                # Missing companyName and other required fields
            },
            "saveToLibrary": False
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=invalid_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and data.get("error"):
                log_test_result("Validation Test (Missing Data)", True, 
                              f"Correctly rejected with 400: {data['error']}", response_time)
            else:
                log_test_result("Validation Test (Missing Data)", False, 
                              "Expected error response but got success", response_time)
        else:
            log_test_result("Validation Test (Missing Data)", False, 
                          f"Expected 400 but got {response.status_code}", response_time)
            
    except Exception as e:
        log_test_result("Validation Test (Missing Data)", False, f"Exception: {str(e)}")

    # Test 5: Validation Test - Missing Metadata
    print("⚠️ Test 5: Validation Test (Missing Metadata)")
    try:
        start_time = time.time()
        
        invalid_payload = {
            "data": {
                "planType": "Traditional Business Plan",
                "companyName": "TestCorp",
                "executiveSummary": {
                    "overview": "Test overview"
                }
            }
            # Missing metadata completely
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=invalid_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and data.get("error"):
                log_test_result("Validation Test (Missing Metadata)", True, 
                              f"Correctly rejected with 400: {data['error']}", response_time)
            else:
                log_test_result("Validation Test (Missing Metadata)", False, 
                              "Expected error response but got success", response_time)
        else:
            log_test_result("Validation Test (Missing Metadata)", False, 
                          f"Expected 400 but got {response.status_code}", response_time)
            
    except Exception as e:
        log_test_result("Validation Test (Missing Metadata)", False, f"Exception: {str(e)}")

    # Test 6: Save to Library Test
    print("💾 Test 6: Save to Library Test")
    try:
        start_time = time.time()
        
        save_payload = {
            "data": {
                "planType": "Traditional Business Plan",
                "companyName": "LibraryTestCorp",
                "executiveSummary": {
                    "overview": "Test company for library save functionality.",
                    "missionStatement": "To test the save to library feature."
                }
            },
            "metadata": {
                "planType": "Traditional Business Plan",
                "companyName": "LibraryTestCorp",
                "industry": "Technology",
                "stage": "Testing"
            },
            "saveToLibrary": True  # Enable library save
        }
        
        response = requests.post(
            f"{API_BASE}/business-plan/generate-pdf",
            json=save_payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                if data.get("libraryId"):
                    log_test_result("Save to Library Test", True, 
                                  f"Saved to library with ID: {data['libraryId']}", response_time)
                else:
                    log_test_result("Save to Library Test", False, 
                                  "Success but no libraryId returned", response_time)
            else:
                log_test_result("Save to Library Test", False, 
                              f"API returned success=false: {data.get('error', 'Unknown error')}", response_time)
        else:
            log_test_result("Save to Library Test", False, 
                          f"HTTP {response.status_code}: {response.text[:200]}", response_time)
            
    except Exception as e:
        log_test_result("Save to Library Test", False, f"Exception: {str(e)}")

def main():
    """Run all Business Plan PDF Export API tests"""
    print("🚀 BUSINESS PLAN PDF EXPORT API TESTING")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"📡 API Endpoint: {API_BASE}/business-plan/generate-pdf")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    test_business_plan_pdf_export()
    
    print("=" * 80)
    print("🏁 BUSINESS PLAN PDF EXPORT API TESTING COMPLETED")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()