#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Digital Products Suite (ProCreators)
Tests all 14 Digital Product tools APIs systematically
"""

import requests
import json
import time
import sys
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://unified-media-hub-1.preview.emergentagent.com/api"

class DigitalProductsTestSuite:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, tool_name, endpoint, payload, expected_fields=None):
        """Test a single API endpoint"""
        self.total_tests += 1
        self.log(f"Testing {tool_name}...")
        
        try:
            url = f"{BASE_URL}{endpoint}"
            self.log(f"POST {url}")
            self.log(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=60)
            response_data = response.json()
            
            # Check HTTP status
            if response.status_code == 200:
                # Check response structure
                if response_data.get('success'):
                    # Validate expected fields
                    missing_fields = []
                    if expected_fields:
                        for field in expected_fields:
                            if field not in response_data:
                                missing_fields.append(field)
                    
                    if not missing_fields:
                        self.passed_tests += 1
                        self.log(f"✅ {tool_name} - WORKING", "SUCCESS")
                        result = {
                            'tool': tool_name,
                            'endpoint': endpoint,
                            'status': 'WORKING',
                            'response_fields': list(response_data.keys()),
                            'content_summary': self._get_content_summary(response_data)
                        }
                    else:
                        self.failed_tests += 1
                        self.log(f"❌ {tool_name} - Missing fields: {missing_fields}", "ERROR")
                        result = {
                            'tool': tool_name,
                            'endpoint': endpoint,
                            'status': 'NOT WORKING',
                            'error': f'Missing response fields: {missing_fields}',
                            'response_fields': list(response_data.keys())
                        }
                else:
                    self.failed_tests += 1
                    error_msg = response_data.get('error', 'Unknown error')
                    self.log(f"❌ {tool_name} - API Error: {error_msg}", "ERROR")
                    result = {
                        'tool': tool_name,
                        'endpoint': endpoint,
                        'status': 'NOT WORKING',
                        'error': f'API returned success=false: {error_msg}'
                    }
            elif response.status_code == 400:
                # Validation error - this might be expected for some test cases
                error_msg = response_data.get('error', 'Validation error')
                if 'required' in error_msg.lower():
                    self.log(f"⚠️  {tool_name} - Expected validation error: {error_msg}", "WARN")
                    # Test with minimal required fields
                    return self._test_minimal_payload(tool_name, endpoint)
                else:
                    self.failed_tests += 1
                    self.log(f"❌ {tool_name} - Validation Error: {error_msg}", "ERROR")
                    result = {
                        'tool': tool_name,
                        'endpoint': endpoint,
                        'status': 'NOT WORKING',
                        'error': f'400 Validation Error: {error_msg}'
                    }
            else:
                self.failed_tests += 1
                self.log(f"❌ {tool_name} - HTTP {response.status_code}: {response.text[:200]}", "ERROR")
                result = {
                    'tool': tool_name,
                    'endpoint': endpoint,
                    'status': 'NOT WORKING',
                    'error': f'HTTP {response.status_code}: {response.text[:200]}'
                }
                
        except requests.exceptions.Timeout:
            self.failed_tests += 1
            self.log(f"❌ {tool_name} - Request timeout (60s)", "ERROR")
            result = {
                'tool': tool_name,
                'endpoint': endpoint,
                'status': 'NOT WORKING',
                'error': 'Request timeout after 60 seconds'
            }
        except Exception as e:
            self.failed_tests += 1
            self.log(f"❌ {tool_name} - Exception: {str(e)}", "ERROR")
            result = {
                'tool': tool_name,
                'endpoint': endpoint,
                'status': 'NOT WORKING',
                'error': f'Exception: {str(e)}'
            }
        
        self.results.append(result)
        return result
        
    def _test_minimal_payload(self, tool_name, endpoint):
        """Try minimal payload for tools that failed validation"""
        minimal_payloads = {
            '/planner-maker/generate': {'plannerType': 'daily'},
            '/worksheet-maker/generate': {'topic': 'Math Practice'},
            '/coloring-book/generate': {'theme': 'animals'},
            '/journal-maker/generate': {'journalType': 'daily'},
            '/checklist-maker/generate': {'checklistType': 'daily'},
            '/ebook-maker/generate': {'topic': 'Test Topic'},
            '/recipe-book/generate': {'theme': 'healthy'},
            '/how-to-guide/generate': {'topic': 'Test Guide'},
            '/notion-templates/generate': {'templateType': 'productivity'},
            '/slides-maker/generate': {'topic': 'Test Presentation'},
            '/learning-cards/generate': {'topic': 'Math'},
            '/quiz-maker/generate': {'topic': 'General Knowledge'},
            '/storybook-maker/generate': {'theme': 'adventure'},
            '/activity-book/generate': {'theme': 'kids'}
        }
        
        minimal = minimal_payloads.get(endpoint)
        if minimal:
            self.log(f"Retrying {tool_name} with minimal payload: {minimal}")
            return self.test_endpoint(f"{tool_name} (minimal)", endpoint, minimal)
        else:
            return {
                'tool': tool_name,
                'endpoint': endpoint,
                'status': 'NOT WORKING',
                'error': 'Could not determine minimal required fields'
            }
    
    def _get_content_summary(self, response_data):
        """Extract key information from successful response"""
        summary = {}
        if 'title' in response_data:
            summary['title'] = response_data['title']
        if 'pageCount' in response_data:
            summary['pageCount'] = response_data['pageCount']
        if 'downloadUrl' in response_data:
            summary['hasDownloadUrl'] = True
        if 'libraryId' in response_data:
            summary['savedToLibrary'] = True
        return summary
    
    def run_all_tests(self):
        """Run comprehensive tests for all 14 Digital Products"""
        self.log("Starting Comprehensive Digital Products Test Suite")
        self.log("=" * 60)
        
        # Test all 14 digital products
        tests = [
            # Category 1: Printables & Planners
            {
                'name': 'Planner Maker',
                'endpoint': '/planner-maker/generate',
                'payload': {
                    'plannerType': 'daily',
                    'colorScheme': 'rose-gold',
                    'coverStyle': 'elegant', 
                    'paperSize': 'letter',
                    'pageCount': 12,
                    'customTitle': 'My Test Planner',
                    'customInstructions': 'Create a productivity-focused planner'
                },
                'expected_fields': ['success', 'title', 'downloadUrl', 'pageCount']
            },
            {
                'name': 'Worksheet Maker',
                'endpoint': '/worksheet-maker/generate', 
                'payload': {
                    'worksheetType': 'math',
                    'gradeLevel': '3rd',
                    'topic': 'Addition and Subtraction',
                    'questionCount': 10,
                    'includeAnswerKey': True
                },
                'expected_fields': ['success', 'title', 'downloadUrl', 'pageCount', 'questionCount']
            },
            {
                'name': 'Coloring Book',
                'endpoint': '/coloring-book/generate',
                'payload': {
                    'theme': 'animals',
                    'difficulty': 'medium',
                    'pageCount': 12,
                    'title': 'Animal Adventures Coloring Book',
                    'generateImages': False,  # Skip image generation for speed
                    'generateCover': False
                },
                'expected_fields': ['success', 'title', 'downloadUrl', 'pageCount', 'pages']
            },
            {
                'name': 'Journal Maker',
                'endpoint': '/journal-maker/generate',
                'payload': {
                    'journalType': 'daily',
                    'pageCount': 30,
                    'customTitle': 'My Daily Journal',
                    'includePrompts': True
                },
                'expected_fields': ['success', 'title', 'downloadUrl', 'pageCount']
            },
            {
                'name': 'Checklist Maker', 
                'endpoint': '/checklist-maker/generate',
                'payload': {
                    'checklistType': 'daily',
                    'title': 'Daily Task Checklist',
                    'customItems': ['Wake up early', 'Exercise', 'Read book', 'Plan tomorrow'],
                    'pageCount': 7
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            
            # Category 2: Ebooks & Guides
            {
                'name': 'Ebook Maker',
                'endpoint': '/ebook-maker/generate',
                'payload': {
                    'topic': 'Digital Marketing Basics',
                    'targetAudience': 'beginners',
                    'chapterCount': 5,
                    'tone': 'friendly',
                    'includeImages': False
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Recipe Book',
                'endpoint': '/recipe-book/generate',
                'payload': {
                    'theme': 'healthy',
                    'cuisineType': 'mediterranean',
                    'recipeCount': 15,
                    'dietaryRestrictions': ['vegetarian'],
                    'includeNutrition': True
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Guide Maker',
                'endpoint': '/how-to-guide/generate',
                'payload': {
                    'topic': 'How to Start a Small Business',
                    'targetAudience': 'entrepreneurs',
                    'difficulty': 'beginner',
                    'includeImages': False,
                    'stepCount': 10
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            
            # Category 3: Templates
            {
                'name': 'Notion Templates',
                'endpoint': '/notion-templates/generate',
                'payload': {
                    'templateType': 'productivity',
                    'category': 'personal',
                    'features': ['task-tracking', 'habit-tracker', 'goal-setting'],
                    'customization': 'beginner-friendly'
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Slides Maker',
                'endpoint': '/slides-maker/generate',
                'payload': {
                    'topic': 'Introduction to AI',
                    'slideCount': 10,
                    'style': 'professional',
                    'targetAudience': 'business',
                    'includeImages': False
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            
            # Category 4: Education  
            {
                'name': 'Quiz Maker',
                'endpoint': '/quiz-maker/generate',
                'payload': {
                    'topic': 'General Knowledge',
                    'difficulty': 'medium',
                    'questionCount': 20,
                    'questionTypes': ['multiple-choice', 'true-false'],
                    'includeAnswers': True
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Storybook Maker',
                'endpoint': '/storybook-maker/generate',
                'payload': {
                    'theme': 'adventure',
                    'ageGroup': '6-10',
                    'mainCharacter': 'brave little mouse',
                    'setting': 'magical forest',
                    'pageCount': 16,
                    'generateImages': False
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Activity Book',
                'endpoint': '/activity-book/generate',
                'payload': {
                    'theme': 'kids',
                    'ageGroup': '5-8',
                    'activityTypes': ['puzzles', 'coloring', 'games'],
                    'pageCount': 20,
                    'difficulty': 'easy'
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            }
        ]
        
        # Check for Learning Cards separately as it might have different endpoint
        learning_cards_tests = [
            {
                'name': 'Learning Cards',
                'endpoint': '/learning-cards/generate',
                'payload': {
                    'topic': 'Math Facts',
                    'cardCount': 20,
                    'difficulty': 'beginner',
                    'cardType': 'flashcards'
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            },
            {
                'name': 'Learning Cards (alt)',
                'endpoint': '/flashcards/generate', 
                'payload': {
                    'topic': 'Math Facts',
                    'cardCount': 20,
                    'difficulty': 'beginner'
                },
                'expected_fields': ['success', 'title', 'downloadUrl']
            }
        ]
        
        # Run main tests
        for test in tests:
            self.test_endpoint(test['name'], test['endpoint'], test['payload'], test['expected_fields'])
            time.sleep(1)  # Brief pause between tests
            
        # Try Learning Cards with both possible endpoints
        learning_cards_found = False
        for test in learning_cards_tests:
            try:
                result = self.test_endpoint(test['name'], test['endpoint'], test['payload'], test['expected_fields'])
                if result['status'] == 'WORKING':
                    learning_cards_found = True
                    break
            except:
                continue
                
        if not learning_cards_found:
            self.results.append({
                'tool': 'Learning Cards',
                'endpoint': '/learning-cards/generate OR /flashcards/generate',
                'status': 'NOT WORKING',
                'error': 'Neither /learning-cards/generate nor /flashcards/generate endpoints found'
            })
        
        # Generate summary
        self.generate_summary()
        
    def generate_summary(self):
        """Generate comprehensive test summary"""
        self.log("=" * 60)
        self.log("DIGITAL PRODUCTS TEST SUMMARY")
        self.log("=" * 60)
        
        working_tools = []
        not_working_tools = []
        
        for result in self.results:
            if result['status'] == 'WORKING':
                working_tools.append(result)
            else:
                not_working_tools.append(result)
                
        self.log(f"Total Tests: {self.total_tests}")
        self.log(f"✅ Working: {len(working_tools)}")
        self.log(f"❌ Not Working: {len(not_working_tools)}")
        self.log(f"Success Rate: {(len(working_tools)/self.total_tests)*100:.1f}%")
        
        if working_tools:
            self.log("\n✅ WORKING TOOLS:")
            for tool in working_tools:
                endpoint = tool['endpoint']
                summary = tool.get('content_summary', {})
                summary_text = f" - {summary}" if summary else ""
                self.log(f"  • {tool['tool']} ({endpoint}){summary_text}")
                
        if not_working_tools:
            self.log("\n❌ NOT WORKING TOOLS:")
            for tool in not_working_tools:
                endpoint = tool['endpoint'] 
                error = tool.get('error', 'Unknown error')
                self.log(f"  • {tool['tool']} ({endpoint})")
                self.log(f"    Error: {error}")
                
        self.log("=" * 60)
        return {
            'total_tests': self.total_tests,
            'working_tools': working_tools,
            'not_working_tools': not_working_tools,
            'success_rate': (len(working_tools)/self.total_tests)*100 if self.total_tests > 0 else 0
        }

if __name__ == "__main__":
    # Run the comprehensive test suite
    test_suite = DigitalProductsTestSuite()
    test_suite.run_all_tests()
    
    # Exit with proper code
    sys.exit(0 if test_suite.failed_tests == 0 else 1)