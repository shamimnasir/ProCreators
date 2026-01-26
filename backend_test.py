#!/usr/bin/env python3
"""
Backend API Testing Script for SWOT Analysis Generator
Tests the SWOT Analysis API endpoints as specified in the review request.
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Base URL from environment
BASE_URL = "https://marketingai-hub-5.preview.emergentagent.com"

class SWOTAnalysisAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.results = []
        
    def log_result(self, test_name: str, success: bool, details: str, response_data: Dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   Details: {details}")
        if response_data:
            print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
        print()

    def test_basic_swot_analysis(self):
        """Test Case 1: Basic SWOT Analysis Test"""
        print("🧪 Testing Basic SWOT Analysis Generation...")
        
        payload = {
            "subjectName": "TechCorp Inc",
            "subjectDescription": "A mid-size software company",
            "analysisType": "business",
            "industry": "technology",
            "objectives": "Strategic planning for 2026",
            "analysisDepth": "standard"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/swot-analysis/generate",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if not data.get("success"):
                    self.log_result("Basic SWOT Analysis", False, f"Response success=false: {data}")
                    return
                
                # Check required fields
                response_data = data.get("data", {})
                required_sections = ["strengths", "weaknesses", "opportunities", "threats"]
                missing_sections = []
                
                for section in required_sections:
                    if section not in response_data:
                        missing_sections.append(section)
                    else:
                        section_data = response_data[section]
                        if not isinstance(section_data, dict) or "items" not in section_data:
                            missing_sections.append(f"{section}.items")
                
                if missing_sections:
                    self.log_result("Basic SWOT Analysis", False, f"Missing sections: {missing_sections}", data)
                else:
                    # Check metadata
                    metadata = data.get("metadata", {})
                    expected_meta = ["analysisType", "subjectName", "industry", "generatedAt"]
                    missing_meta = [m for m in expected_meta if m not in metadata]
                    
                    if missing_meta:
                        self.log_result("Basic SWOT Analysis", False, f"Missing metadata: {missing_meta}", data)
                    else:
                        self.log_result("Basic SWOT Analysis", True, 
                                      f"Generated complete SWOT with {len(response_data.get('strengths', {}).get('items', []))} strengths, "
                                      f"{len(response_data.get('weaknesses', {}).get('items', []))} weaknesses, "
                                      f"{len(response_data.get('opportunities', {}).get('items', []))} opportunities, "
                                      f"{len(response_data.get('threats', {}).get('items', []))} threats", data)
            else:
                self.log_result("Basic SWOT Analysis", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            self.log_result("Basic SWOT Analysis", False, "Request timeout (60s)")
        except Exception as e:
            self.log_result("Basic SWOT Analysis", False, f"Exception: {str(e)}")

    def test_validation_error(self):
        """Test Case 2: Validation Test - Empty body should return 400 error"""
        print("🧪 Testing Validation (Empty Body)...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/swot-analysis/generate",
                json={},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                if "Subject name is required" in data.get("error", ""):
                    self.log_result("Validation Test", True, "Correctly rejected empty body with 400 error", data)
                else:
                    self.log_result("Validation Test", False, f"Wrong error message: {data.get('error')}", data)
            else:
                self.log_result("Validation Test", False, f"Expected 400, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Validation Test", False, f"Exception: {str(e)}")

    def test_pdf_export(self):
        """Test Case 3: PDF Export Test"""
        print("🧪 Testing PDF Export...")
        
        payload = {
            "data": {
                "subjectName": "TestCo",
                "executiveSummary": "Test summary",
                "strengths": {
                    "title": "Strengths",
                    "items": [
                        {
                            "point": "Strong brand",
                            "description": "Well known",
                            "impact": "High"
                        }
                    ]
                },
                "weaknesses": {
                    "title": "Weaknesses",
                    "items": [
                        {
                            "point": "Limited funding",
                            "description": "Cash constrained",
                            "impact": "Medium"
                        }
                    ]
                },
                "opportunities": {
                    "title": "Opportunities",
                    "items": [
                        {
                            "point": "Market growth",
                            "description": "Expanding market",
                            "impact": "High"
                        }
                    ]
                },
                "threats": {
                    "title": "Threats",
                    "items": [
                        {
                            "point": "Competition",
                            "description": "New entrants",
                            "impact": "High"
                        }
                    ]
                }
            },
            "metadata": {
                "subjectName": "TestCo",
                "analysisType": "Business",
                "industry": "Technology"
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/swot-analysis/generate-pdf",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "htmlContent" in data:
                    html_length = len(data.get("htmlContent", ""))
                    self.log_result("PDF Export Test", True, 
                                  f"Generated HTML content ({html_length} chars) with fallback mechanism", data)
                else:
                    self.log_result("PDF Export Test", False, f"Missing success or htmlContent: {data}")
            else:
                self.log_result("PDF Export Test", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("PDF Export Test", False, f"Exception: {str(e)}")

    def test_pdf_validation_missing_data(self):
        """Test Case 4: PDF Validation - Missing data"""
        print("🧪 Testing PDF Validation (Missing Data)...")
        
        payload = {
            "metadata": {
                "subjectName": "TestCo",
                "analysisType": "Business"
            }
            # Missing "data" field
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/swot-analysis/generate-pdf",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                if "Missing data or metadata" in data.get("error", ""):
                    self.log_result("PDF Validation (Missing Data)", True, "Correctly rejected missing data with 400 error", data)
                else:
                    self.log_result("PDF Validation (Missing Data)", False, f"Wrong error message: {data.get('error')}", data)
            else:
                self.log_result("PDF Validation (Missing Data)", False, f"Expected 400, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("PDF Validation (Missing Data)", False, f"Exception: {str(e)}")

    def test_pdf_validation_missing_metadata(self):
        """Test Case 5: PDF Validation - Missing metadata"""
        print("🧪 Testing PDF Validation (Missing Metadata)...")
        
        payload = {
            "data": {
                "subjectName": "TestCo",
                "strengths": {"title": "Strengths", "items": []}
            }
            # Missing "metadata" field
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/swot-analysis/generate-pdf",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                if "Missing data or metadata" in data.get("error", ""):
                    self.log_result("PDF Validation (Missing Metadata)", True, "Correctly rejected missing metadata with 400 error", data)
                else:
                    self.log_result("PDF Validation (Missing Metadata)", False, f"Wrong error message: {data.get('error')}", data)
            else:
                self.log_result("PDF Validation (Missing Metadata)", False, f"Expected 400, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("PDF Validation (Missing Metadata)", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all SWOT Analysis API tests"""
        print("🚀 Starting SWOT Analysis API Testing...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test cases
        self.test_basic_swot_analysis()
        self.test_validation_error()
        self.test_pdf_export()
        self.test_pdf_validation_missing_data()
        self.test_pdf_validation_missing_metadata()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = SWOTAnalysisAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)