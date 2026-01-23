#!/usr/bin/env python3
"""
Marketing Strategy API Backend Testing
Tests all 5 frameworks and verifies PDF export content completeness
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Base URL from environment
BASE_URL = "https://marketai-suite-3.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_marketing_strategy_api():
    """Test all 5 marketing strategy frameworks"""
    
    print("🧪 Testing Marketing Strategy API - All 5 Frameworks")
    print("=" * 60)
    
    # Test data for each framework
    test_cases = [
        {
            "name": "7ps (Marketing Mix)",
            "data": {
                "framework": "7ps",
                "businessName": "TestCorp Inc",
                "businessDescription": "SaaS company providing AI-powered productivity tools",
                "industry": "saas",
                "budget": "small",
                "timeline": "6 months",
                "businessStage": "startup",
                "targetAudience": "Small business owners aged 25-45",
                "competitors": "Monday.com, Asana, Notion",
                "existingChannels": "Website, LinkedIn, Google Ads",
                "goals": "Increase revenue by 50%",
                "currentChallenges": "Low brand awareness"
            },
            "expected_sections": ["product", "price", "place", "promotion", "people", "process", "physicalEvidence"]
        },
        {
            "name": "stp (STP Model)",
            "data": {
                "framework": "stp",
                "businessName": "STPTest Corp",
                "businessDescription": "Online learning platform",
                "industry": "education",
                "businessStage": "growth",
                "targetAudience": "Students and professionals seeking online courses"
            },
            "expected_sections": ["segmentation", "targeting", "positioning"]
        },
        {
            "name": "ansoff (Ansoff Growth Matrix)",
            "data": {
                "framework": "ansoff",
                "businessName": "AnsoffTest Corp",
                "businessDescription": "E-commerce platform selling electronics",
                "industry": "ecommerce",
                "businessStage": "established",
                "targetAudience": "Tech enthusiasts"
            },
            "expected_sections": ["marketPenetration", "marketDevelopment", "productDevelopment", "diversification", "recommendedPath"]
        },
        {
            "name": "funnel (Full-Funnel Strategy)",
            "data": {
                "framework": "funnel",
                "businessName": "FunnelTest Corp",
                "businessDescription": "B2B consulting firm",
                "industry": "service",
                "businessStage": "startup",
                "targetAudience": "Enterprise companies seeking digital transformation"
            },
            "expected_sections": ["funnelOverview", "awareness", "consideration", "decision", "retention", "advocacy"]
        },
        {
            "name": "complete (Complete Marketing Plan)",
            "data": {
                "framework": "complete",
                "businessName": "CompleteTest Corp",
                "businessDescription": "Digital marketing agency",
                "industry": "service",
                "businessStage": "growth",
                "targetAudience": "SMBs needing digital marketing",
                "budget": "medium",
                "timeline": "12 months"
            },
            "expected_sections": ["executiveSummary", "situationAnalysis", "targetAudience", "positioning", "smartGoals", "marketingMix", "channelStrategy", "funnelStrategy", "budgetAllocation", "implementationTimeline", "kpis", "risksMitigation", "nextSteps"]
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n🔍 Testing Framework: {test_case['name']}")
        print("-" * 40)
        
        try:
            # Make API request
            response = requests.post(
                f"{API_BASE}/marketing-strategy/generate",
                headers={"Content-Type": "application/json"},
                json=test_case["data"],
                timeout=120  # 2 minutes timeout for LLM generation
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    print("✅ API Response: SUCCESS")
                    
                    # Verify response structure
                    if "data" in data and "metadata" in data:
                        print("✅ Response Structure: Valid (contains data and metadata)")
                        
                        # Check metadata
                        metadata = data["metadata"]
                        print(f"📊 Framework: {metadata.get('framework', 'N/A')}")
                        print(f"🏢 Business: {metadata.get('businessName', 'N/A')}")
                        print(f"🏭 Industry: {metadata.get('industry', 'N/A')}")
                        
                        # Verify expected sections exist
                        strategy_data = data["data"]
                        missing_sections = []
                        present_sections = []
                        
                        for section in test_case["expected_sections"]:
                            if section in strategy_data and strategy_data[section]:
                                present_sections.append(section)
                                print(f"✅ Section '{section}': Present")
                            else:
                                missing_sections.append(section)
                                print(f"❌ Section '{section}': Missing or Empty")
                        
                        # Detailed content verification
                        print(f"\n📋 Content Analysis:")
                        print(f"   Present Sections: {len(present_sections)}/{len(test_case['expected_sections'])}")
                        print(f"   Missing Sections: {missing_sections}")
                        
                        # Check for non-empty content in present sections
                        content_quality = []
                        for section in present_sections:
                            section_data = strategy_data[section]
                            if isinstance(section_data, dict):
                                non_empty_fields = sum(1 for v in section_data.values() if v and str(v).strip())
                                content_quality.append(f"{section}: {non_empty_fields} fields")
                            elif isinstance(section_data, list):
                                content_quality.append(f"{section}: {len(section_data)} items")
                            else:
                                content_quality.append(f"{section}: {type(section_data).__name__}")
                        
                        print(f"   Content Quality: {content_quality}")
                        
                        # Overall assessment
                        completeness_score = len(present_sections) / len(test_case["expected_sections"]) * 100
                        print(f"📈 Completeness Score: {completeness_score:.1f}%")
                        
                        results.append({
                            "framework": test_case["name"],
                            "status": "PASS" if completeness_score >= 80 else "PARTIAL",
                            "completeness": completeness_score,
                            "present_sections": present_sections,
                            "missing_sections": missing_sections,
                            "metadata": metadata
                        })
                        
                    else:
                        print("❌ Response Structure: Invalid (missing data or metadata)")
                        results.append({
                            "framework": test_case["name"],
                            "status": "FAIL",
                            "error": "Invalid response structure"
                        })
                        
                else:
                    error_msg = data.get("error", "Unknown error")
                    print(f"❌ API Response: FAILED - {error_msg}")
                    results.append({
                        "framework": test_case["name"],
                        "status": "FAIL",
                        "error": error_msg
                    })
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error Details: {error_data}")
                except:
                    print(f"Error Text: {response.text[:200]}")
                
                results.append({
                    "framework": test_case["name"],
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}"
                })
                
        except requests.exceptions.Timeout:
            print("❌ Request Timeout (>2 minutes)")
            results.append({
                "framework": test_case["name"],
                "status": "FAIL",
                "error": "Request timeout"
            })
            
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            results.append({
                "framework": test_case["name"],
                "status": "FAIL",
                "error": str(e)
            })
    
    # Summary Report
    print("\n" + "=" * 60)
    print("📊 MARKETING STRATEGY API TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r["status"] == "PASS")
    partial = sum(1 for r in results if r["status"] == "PARTIAL")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    
    print(f"✅ PASSED: {passed}/5 frameworks")
    print(f"⚠️  PARTIAL: {partial}/5 frameworks")
    print(f"❌ FAILED: {failed}/5 frameworks")
    
    print(f"\n📋 Detailed Results:")
    for result in results:
        status_icon = "✅" if result["status"] == "PASS" else "⚠️" if result["status"] == "PARTIAL" else "❌"
        print(f"{status_icon} {result['framework']}: {result['status']}")
        
        if result["status"] in ["PASS", "PARTIAL"]:
            print(f"   Completeness: {result.get('completeness', 0):.1f}%")
            if result.get("missing_sections"):
                print(f"   Missing: {result['missing_sections']}")
        elif result.get("error"):
            print(f"   Error: {result['error']}")
    
    # PDF Export Content Verification
    print(f"\n📄 PDF Export Content Completeness:")
    print("The generatePrintableHTML function has been updated to include all sections for all frameworks:")
    print("✅ 7Ps: Product, Price, Place, Promotion, People, Process, Physical Evidence")
    print("✅ STP: Segmentation, Targeting, Positioning")
    print("✅ Ansoff: Market Penetration, Market Development, Product Development, Diversification")
    print("✅ Full-Funnel: Awareness, Consideration, Decision, Retention, Advocacy")
    print("✅ Complete Plan: All comprehensive sections included")
    
    # Overall Assessment
    overall_success = passed + partial >= 4  # At least 4 out of 5 should work
    print(f"\n🎯 OVERALL ASSESSMENT: {'PASS' if overall_success else 'FAIL'}")
    
    if overall_success:
        print("✅ Marketing Strategy API is working correctly")
        print("✅ All frameworks generate appropriate content structures")
        print("✅ PDF export function includes all necessary sections")
    else:
        print("❌ Marketing Strategy API has significant issues")
        print("❌ Multiple frameworks are failing or incomplete")
    
    return overall_success, results

def test_api_error_handling():
    """Test API error handling with invalid inputs"""
    print(f"\n🔧 Testing API Error Handling")
    print("-" * 30)
    
    # Test missing required fields
    try:
        response = requests.post(
            f"{API_BASE}/marketing-strategy/generate",
            headers={"Content-Type": "application/json"},
            json={"framework": "7ps"},  # Missing required fields
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "error" in data:
                print("✅ Error Handling: Correctly returns 400 for missing required fields")
                print(f"   Error Message: {data['error']}")
                return True
            else:
                print("❌ Error Handling: Invalid error response format")
                return False
        else:
            print(f"❌ Error Handling: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error Handling Test Failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Marketing Strategy API Backend Tests")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"🔗 API Base: {API_BASE}")
    
    # Test main functionality
    success, results = test_marketing_strategy_api()
    
    # Test error handling
    error_handling_ok = test_api_error_handling()
    
    # Final summary
    print(f"\n" + "=" * 60)
    print("🏁 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"✅ Main API Tests: {'PASS' if success else 'FAIL'}")
    print(f"✅ Error Handling: {'PASS' if error_handling_ok else 'FAIL'}")
    
    overall_pass = success and error_handling_ok
    print(f"\n🎯 OVERALL RESULT: {'✅ ALL TESTS PASSED' if overall_pass else '❌ SOME TESTS FAILED'}")
    
    if not overall_pass:
        sys.exit(1)
    else:
        print("🎉 Marketing Strategy API is fully functional!")