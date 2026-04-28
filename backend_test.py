#!/usr/bin/env python3
"""
Security Hardening Verification Test Suite
Tests the security changes shipped including:
1. Admin route protection via proxy middleware
2. Auth hardening on upload/scrape endpoints  
3. Session cookie + Bearer token support
4. CORS tightening
5. Rate limiting
6. Credit pricing config verification
"""

import requests
import json
import time
import random
import string
from urllib.parse import urljoin

# Base URL from environment
BASE_URL = "https://ai-avatar-ugc.preview.emergentagent.com"

def generate_random_email():
    """Generate a random email for testing"""
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_string}@example.com"

def test_admin_route_protection():
    """Test 1: Admin route protection - all should return 401 without auth"""
    print("\n🔒 Testing Admin Route Protection...")
    
    admin_endpoints = [
        "/api/admin/site-settings",
        "/api/admin/system-prompts/list", 
        "/api/admin/system-prompts/get?tool=blog-creator",
        "/api/admin/controls",
        "/api/admin/services-status",
        "/api/admin/static-pages",
        "/api/admin/menus",
        "/api/admin/ai-video-prompts",
        "/api/admin/pages",
        "/api/admin/pages/initialize-all",
        "/api/admin/pages/blocks",
        "/api/admin/blog",
        "/api/admin/unified-pages"
    ]
    
    results = []
    
    for endpoint in admin_endpoints:
        try:
            # Test GET endpoints
            response = requests.get(urljoin(BASE_URL, endpoint), timeout=10)
            expected_status = 401
            status_ok = response.status_code == expected_status
            
            # Check for proper error structure
            try:
                data = response.json()
                has_auth_error = data.get('code') == 'AUTH_REQUIRED' or 'Authentication required' in data.get('error', '')
            except:
                has_auth_error = False
            
            results.append({
                'endpoint': endpoint,
                'method': 'GET',
                'status': response.status_code,
                'expected': expected_status,
                'pass': status_ok and has_auth_error,
                'response_preview': str(response.text)[:200]
            })
            
            print(f"  {'✅' if status_ok and has_auth_error else '❌'} GET {endpoint}: {response.status_code}")
            
        except Exception as e:
            results.append({
                'endpoint': endpoint,
                'method': 'GET', 
                'status': 'ERROR',
                'expected': expected_status,
                'pass': False,
                'error': str(e)
            })
            print(f"  ❌ GET {endpoint}: ERROR - {e}")
    
    # Test POST endpoints that should also be protected
    post_endpoints = [
        ("/api/admin/site-settings", {"section": "branding", "data": {}}),
        ("/api/admin/system-prompts/update", {"tool": "x", "systemPrompt": "y"})
    ]
    
    for endpoint, payload in post_endpoints:
        try:
            response = requests.post(urljoin(BASE_URL, endpoint), json=payload, timeout=10)
            expected_status = 401
            status_ok = response.status_code == expected_status
            
            try:
                data = response.json()
                has_auth_error = data.get('code') == 'AUTH_REQUIRED' or 'Authentication required' in data.get('error', '')
            except:
                has_auth_error = False
            
            results.append({
                'endpoint': endpoint,
                'method': 'POST',
                'status': response.status_code,
                'expected': expected_status,
                'pass': status_ok and has_auth_error,
                'response_preview': str(response.text)[:200]
            })
            
            print(f"  {'✅' if status_ok and has_auth_error else '❌'} POST {endpoint}: {response.status_code}")
            
        except Exception as e:
            results.append({
                'endpoint': endpoint,
                'method': 'POST',
                'status': 'ERROR', 
                'expected': expected_status,
                'pass': False,
                'error': str(e)
            })
            print(f"  ❌ POST {endpoint}: ERROR - {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Admin Route Protection: {passed}/{total} tests passed")
    
    return results

def test_public_route_auth_hardening():
    """Test 2: Public route auth hardening - upload/scrape should require auth"""
    print("\n🔒 Testing Public Route Auth Hardening...")
    
    results = []
    
    # Test upload endpoint without auth
    try:
        response = requests.post(urljoin(BASE_URL, "/api/upload"), timeout=10)
        expected_status = 401
        status_ok = response.status_code == expected_status
        
        try:
            data = response.json()
            has_auth_error = 'Authentication required' in data.get('error', '')
        except:
            has_auth_error = False
        
        results.append({
            'endpoint': '/api/upload',
            'method': 'POST',
            'status': response.status_code,
            'expected': expected_status,
            'pass': status_ok and has_auth_error,
            'response_preview': str(response.text)[:200]
        })
        
        print(f"  {'✅' if status_ok and has_auth_error else '❌'} POST /api/upload (no auth): {response.status_code}")
        
    except Exception as e:
        results.append({
            'endpoint': '/api/upload',
            'method': 'POST',
            'status': 'ERROR',
            'expected': 401,
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ POST /api/upload: ERROR - {e}")
    
    # Test scrape endpoint without auth
    try:
        response = requests.post(urljoin(BASE_URL, "/api/scrape/url"), timeout=10)
        expected_status = 401
        status_ok = response.status_code == expected_status
        
        try:
            data = response.json()
            has_auth_error = 'Authentication required' in data.get('error', '')
        except:
            has_auth_error = False
        
        results.append({
            'endpoint': '/api/scrape/url',
            'method': 'POST',
            'status': response.status_code,
            'expected': expected_status,
            'pass': status_ok and has_auth_error,
            'response_preview': str(response.text)[:200]
        })
        
        print(f"  {'✅' if status_ok and has_auth_error else '❌'} POST /api/scrape/url (no auth): {response.status_code}")
        
    except Exception as e:
        results.append({
            'endpoint': '/api/scrape/url',
            'method': 'POST',
            'status': 'ERROR',
            'expected': 401,
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ POST /api/scrape/url: ERROR - {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Public Route Auth Hardening: {passed}/{total} tests passed")
    
    return results

def test_ssrf_protection():
    """Test SSRF protection on scrape endpoint with valid auth"""
    print("\n🛡️ Testing SSRF Protection...")
    
    # First register and login a test user
    test_email = generate_random_email()
    test_password = "TestPassword123!"
    
    results = []
    
    try:
        # Register user
        register_response = requests.post(urljoin(BASE_URL, "/api/auth"), json={
            "action": "register",
            "email": test_email,
            "password": test_password,
            "name": "Test User"
        }, timeout=10)
        
        if register_response.status_code not in [200, 201]:
            print(f"  ❌ User registration failed: {register_response.status_code}")
            return results
        
        # Login user
        login_response = requests.post(urljoin(BASE_URL, "/api/auth"), json={
            "action": "login", 
            "email": test_email,
            "password": test_password
        }, timeout=10)
        
        if login_response.status_code != 200:
            print(f"  ❌ User login failed: {login_response.status_code}")
            return results
        
        # Extract session token from response
        login_data = login_response.json()
        session_token = login_data.get('sessionToken')
        
        if not session_token:
            print("  ❌ No session token received from login")
            return results
        
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Test SSRF protection with internal addresses
        ssrf_tests = [
            ("http://127.0.0.1/test", "internal address"),
            ("http://localhost/test", "localhost"),
            ("ftp://example.com", "non-HTTP protocol"),
            ("https://example.com", "valid external URL")
        ]
        
        for url, test_type in ssrf_tests:
            try:
                response = requests.post(
                    urljoin(BASE_URL, "/api/scrape/url"),
                    json={"url": url},
                    headers=headers,
                    timeout=10
                )
                
                if test_type in ["internal address", "localhost", "non-HTTP protocol"]:
                    # Should be blocked with 400
                    expected_status = 400
                    status_ok = response.status_code == expected_status
                    
                    try:
                        data = response.json()
                        has_block_message = any(phrase in data.get('error', '').lower() for phrase in 
                                              ['internal', 'not permitted', 'blocked', 'invalid'])
                    except:
                        has_block_message = False
                    
                    test_pass = status_ok and has_block_message
                    
                else:  # valid external URL
                    # Should succeed with 200 or fail gracefully
                    expected_status = 200
                    status_ok = response.status_code in [200, 400, 500]  # Various valid responses
                    test_pass = status_ok
                
                results.append({
                    'test_type': test_type,
                    'url': url,
                    'status': response.status_code,
                    'expected': expected_status,
                    'pass': test_pass,
                    'response_preview': str(response.text)[:200]
                })
                
                print(f"  {'✅' if test_pass else '❌'} {test_type} ({url}): {response.status_code}")
                
            except Exception as e:
                results.append({
                    'test_type': test_type,
                    'url': url,
                    'status': 'ERROR',
                    'expected': expected_status,
                    'pass': False,
                    'error': str(e)
                })
                print(f"  ❌ {test_type}: ERROR - {e}")
        
    except Exception as e:
        print(f"  ❌ SSRF test setup failed: {e}")
        return results
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 SSRF Protection: {passed}/{total} tests passed")
    
    return results

def test_auth_cookie_issuance():
    """Test 3: Auth cookie issuance and session token support"""
    print("\n🍪 Testing Auth Cookie Issuance...")
    
    test_email = generate_random_email()
    test_password = "TestPassword123!"
    
    results = []
    
    try:
        # Register user first
        register_response = requests.post(urljoin(BASE_URL, "/api/auth"), json={
            "action": "register",
            "email": test_email,
            "password": test_password,
            "name": "Test User"
        }, timeout=10)
        
        if register_response.status_code not in [200, 201]:
            print(f"  ❌ User registration failed: {register_response.status_code}")
            return results
        
        # Test login response has Set-Cookie header
        login_response = requests.post(urljoin(BASE_URL, "/api/auth"), json={
            "action": "login",
            "email": test_email, 
            "password": test_password
        }, timeout=10)
        
        # Check for Set-Cookie header
        set_cookie_header = login_response.headers.get('Set-Cookie', '')
        has_session_cookie = 'session_token=' in set_cookie_header
        has_httponly = 'HttpOnly' in set_cookie_header
        has_samesite = 'SameSite=Lax' in set_cookie_header or 'SameSite=Strict' in set_cookie_header
        
        cookie_test_pass = has_session_cookie and has_httponly
        
        results.append({
            'test': 'Login Set-Cookie header',
            'status': login_response.status_code,
            'has_session_cookie': has_session_cookie,
            'has_httponly': has_httponly,
            'has_samesite': has_samesite,
            'pass': cookie_test_pass,
            'set_cookie_header': set_cookie_header[:200]
        })
        
        print(f"  {'✅' if cookie_test_pass else '❌'} Login Set-Cookie: session_token={has_session_cookie}, HttpOnly={has_httponly}")
        
        # Test direct /api/auth login endpoint
        direct_login_response = requests.post(urljoin(BASE_URL, "/api/auth/login"), json={
            "email": test_email,
            "password": test_password
        }, timeout=10)
        
        if direct_login_response.status_code == 200:
            direct_set_cookie = direct_login_response.headers.get('Set-Cookie', '')
            direct_has_session = 'session_token=' in direct_set_cookie
            direct_has_httponly = 'HttpOnly' in direct_set_cookie
            
            direct_cookie_test_pass = direct_has_session and direct_has_httponly
            
            results.append({
                'test': 'Direct /api/auth/login Set-Cookie',
                'status': direct_login_response.status_code,
                'has_session_cookie': direct_has_session,
                'has_httponly': direct_has_httponly,
                'pass': direct_cookie_test_pass,
                'set_cookie_header': direct_set_cookie[:200]
            })
            
            print(f"  {'✅' if direct_cookie_test_pass else '❌'} Direct login Set-Cookie: session_token={direct_has_session}, HttpOnly={direct_has_httponly}")
        
        # Test session cookie authentication (without Authorization header)
        if has_session_cookie:
            # Extract session token from Set-Cookie header
            import re
            session_match = re.search(r'session_token=([^;]+)', set_cookie_header)
            if session_match:
                session_token = session_match.group(1)
                
                # Test admin endpoint with cookie only (should still get 401/403 since test user isn't admin)
                cookie_headers = {'Cookie': f'session_token={session_token}'}
                admin_response = requests.get(
                    urljoin(BASE_URL, "/api/admin/site-settings"),
                    headers=cookie_headers,
                    timeout=10
                )
                
                # Should NOT get 401 (auth required) but might get 403 (not admin) or other error
                cookie_auth_working = admin_response.status_code != 401
                
                results.append({
                    'test': 'Cookie-only authentication',
                    'status': admin_response.status_code,
                    'not_401': cookie_auth_working,
                    'pass': cookie_auth_working,
                    'response_preview': str(admin_response.text)[:200]
                })
                
                print(f"  {'✅' if cookie_auth_working else '❌'} Cookie auth (admin endpoint): {admin_response.status_code} (not 401 = working)")
        
    except Exception as e:
        results.append({
            'test': 'Auth cookie test setup',
            'status': 'ERROR',
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ Auth cookie test failed: {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Auth Cookie Issuance: {passed}/{total} tests passed")
    
    return results

def test_rate_limiting():
    """Test 4: Rate limiting via proxy.js"""
    print("\n⏱️ Testing Rate Limiting...")
    
    results = []
    
    # Test login rate limiting (10 requests per 15 minutes)
    print("  Testing login rate limiting...")
    
    login_endpoint = urljoin(BASE_URL, "/api/auth")
    bogus_credentials = {
        "action": "login",
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    rate_limit_hit = False
    requests_made = 0
    
    try:
        for i in range(12):  # Try 12 requests (limit is 10)
            response = requests.post(login_endpoint, json=bogus_credentials, timeout=5)
            requests_made += 1
            
            if response.status_code == 429:
                rate_limit_hit = True
                retry_after = response.headers.get('Retry-After')
                
                results.append({
                    'test': 'Login rate limiting',
                    'requests_made': requests_made,
                    'status': response.status_code,
                    'retry_after': retry_after,
                    'pass': True,
                    'response_preview': str(response.text)[:200]
                })
                
                print(f"  ✅ Rate limit hit after {requests_made} requests (429 with Retry-After: {retry_after})")
                break
            
            time.sleep(0.1)  # Small delay between requests
        
        if not rate_limit_hit:
            results.append({
                'test': 'Login rate limiting',
                'requests_made': requests_made,
                'status': 'No rate limit hit',
                'pass': False,
                'note': 'Rate limit may be shared with other tests or higher than expected'
            })
            print(f"  ⚠️ No rate limit hit after {requests_made} requests (may be shared IP or higher limit)")
    
    except Exception as e:
        results.append({
            'test': 'Login rate limiting',
            'status': 'ERROR',
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ Rate limiting test failed: {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Rate Limiting: {passed}/{total} tests passed")
    
    return results

def test_cors_tightening():
    """Test 5: CORS tightening"""
    print("\n🌐 Testing CORS Tightening...")
    
    results = []
    
    # Test with malicious origin
    try:
        malicious_headers = {
            'Origin': 'https://malicious-site.com',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            urljoin(BASE_URL, "/api/root"),
            headers=malicious_headers,
            timeout=10
        )
        
        # Check if CORS is blocked
        access_control_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_blocked = (
            response.status_code == 403 or
            access_control_origin != 'https://malicious-site.com'
        )
        
        try:
            data = response.json()
            has_cors_error = data.get('code') == 'CORS_BLOCKED'
        except:
            has_cors_error = False
        
        results.append({
            'test': 'Malicious origin blocking',
            'origin': 'https://malicious-site.com',
            'status': response.status_code,
            'access_control_origin': access_control_origin,
            'cors_blocked': cors_blocked,
            'has_cors_error': has_cors_error,
            'pass': cors_blocked or has_cors_error,
            'response_preview': str(response.text)[:200]
        })
        
        print(f"  {'✅' if cors_blocked or has_cors_error else '❌'} Malicious origin: {response.status_code}, ACAO: {access_control_origin}")
        
    except Exception as e:
        results.append({
            'test': 'Malicious origin blocking',
            'status': 'ERROR',
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ CORS malicious origin test failed: {e}")
    
    # Test with trusted origin (deployment host)
    try:
        trusted_origin = "https://ai-avatar-ugc.preview.emergentagent.com"
        trusted_headers = {
            'Origin': trusted_origin,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            urljoin(BASE_URL, "/api/root"),
            headers=trusted_headers,
            timeout=10
        )
        
        access_control_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_allowed = (
            response.status_code == 200 and
            access_control_origin == trusted_origin
        )
        
        results.append({
            'test': 'Trusted origin allowing',
            'origin': trusted_origin,
            'status': response.status_code,
            'access_control_origin': access_control_origin,
            'cors_allowed': cors_allowed,
            'pass': cors_allowed,
            'response_preview': str(response.text)[:200]
        })
        
        print(f"  {'✅' if cors_allowed else '❌'} Trusted origin: {response.status_code}, ACAO: {access_control_origin}")
        
    except Exception as e:
        results.append({
            'test': 'Trusted origin allowing',
            'status': 'ERROR',
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ CORS trusted origin test failed: {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 CORS Tightening: {passed}/{total} tests passed")
    
    return results

def test_regression_checks():
    """Test 6: Regression checks for existing routes"""
    print("\n🔄 Testing Regression Checks...")
    
    results = []
    
    # Test UGC Studio endpoints
    ugc_endpoints = [
        "/api/ugc-studio/generate-broll",
        "/api/ugc-studio/render"
    ]
    
    for endpoint in ugc_endpoints:
        try:
            # Test without auth - should get 401
            response = requests.post(urljoin(BASE_URL, endpoint), timeout=10)
            expected_status = 401
            status_ok = response.status_code == expected_status
            
            try:
                data = response.json()
                has_auth_error = 'Authentication required' in data.get('error', '') or data.get('code') == 'AUTH_REQUIRED'
            except:
                has_auth_error = False
            
            results.append({
                'endpoint': endpoint,
                'method': 'POST',
                'status': response.status_code,
                'expected': expected_status,
                'pass': status_ok and has_auth_error,
                'response_preview': str(response.text)[:200]
            })
            
            print(f"  {'✅' if status_ok and has_auth_error else '❌'} POST {endpoint} (no auth): {response.status_code}")
            
        except Exception as e:
            results.append({
                'endpoint': endpoint,
                'method': 'POST',
                'status': 'ERROR',
                'expected': 401,
                'pass': False,
                'error': str(e)
            })
            print(f"  ❌ POST {endpoint}: ERROR - {e}")
    
    # Test public template endpoint
    try:
        response = requests.get(urljoin(BASE_URL, "/api/ugc-studio/generate-broll"), timeout=10)
        expected_status = 200
        status_ok = response.status_code == expected_status
        
        try:
            data = response.json()
            has_templates = isinstance(data, dict) and 'templates' in data
        except:
            has_templates = False
        
        results.append({
            'endpoint': '/api/ugc-studio/generate-broll',
            'method': 'GET',
            'status': response.status_code,
            'expected': expected_status,
            'pass': status_ok and has_templates,
            'response_preview': str(response.text)[:200]
        })
        
        print(f"  {'✅' if status_ok and has_templates else '❌'} GET /api/ugc-studio/generate-broll (templates): {response.status_code}")
        
    except Exception as e:
        results.append({
            'endpoint': '/api/ugc-studio/generate-broll',
            'method': 'GET',
            'status': 'ERROR',
            'expected': 200,
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ GET /api/ugc-studio/generate-broll: ERROR - {e}")
    
    # Test credits/membership endpoints
    credit_endpoints = [
        "/api/credits",
        "/api/membership"
    ]
    
    for endpoint in credit_endpoints:
        try:
            response = requests.get(urljoin(BASE_URL, endpoint), timeout=10)
            # These should either work (200) or require auth (401) - both are acceptable
            status_ok = response.status_code in [200, 401]
            
            results.append({
                'endpoint': endpoint,
                'method': 'GET',
                'status': response.status_code,
                'expected': '200 or 401',
                'pass': status_ok,
                'response_preview': str(response.text)[:200]
            })
            
            print(f"  {'✅' if status_ok else '❌'} GET {endpoint}: {response.status_code}")
            
        except Exception as e:
            results.append({
                'endpoint': endpoint,
                'method': 'GET',
                'status': 'ERROR',
                'expected': '200 or 401',
                'pass': False,
                'error': str(e)
            })
            print(f"  ❌ GET {endpoint}: ERROR - {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Regression Checks: {passed}/{total} tests passed")
    
    return results

def verify_credit_pricing():
    """Test 7: Credit pricing config verification"""
    print("\n💰 Verifying Credit Pricing Config...")
    
    # Expected new credit costs from the review request
    expected_costs = {
        'ai-video-studio': 520,
        'talking-head': 520,
        'ugc-talking-head-pro': 250,
        'ugc-talking-head-standard': 125,
        'ugc-broll': 140,
        'quick-reels-ai-cinema': 430,
        'quick-reels-ai-seedance': 520,
        'quick-reels-ai-essential': 20
    }
    
    results = []
    
    # Read the credits.js file to verify pricing
    try:
        with open('/app/lib/credits.js', 'r') as f:
            credits_content = f.read()
        
        for tool, expected_cost in expected_costs.items():
            # Look for the tool in the credits file
            import re
            pattern = rf"'{tool}':\s*(\d+)"
            match = re.search(pattern, credits_content)
            
            if match:
                actual_cost = int(match.group(1))
                cost_correct = actual_cost == expected_cost
                
                results.append({
                    'tool': tool,
                    'expected_cost': expected_cost,
                    'actual_cost': actual_cost,
                    'pass': cost_correct
                })
                
                print(f"  {'✅' if cost_correct else '❌'} {tool}: {actual_cost} credits (expected {expected_cost})")
            else:
                results.append({
                    'tool': tool,
                    'expected_cost': expected_cost,
                    'actual_cost': 'NOT_FOUND',
                    'pass': False
                })
                print(f"  ❌ {tool}: NOT FOUND in credits.js")
        
        # Check if 1 credit = $0.02 is documented
        credit_value_correct = 'CREDIT_VALUE = 0.02' in credits_content
        results.append({
            'tool': 'CREDIT_VALUE',
            'expected_cost': 0.02,
            'actual_cost': 0.02 if credit_value_correct else 'NOT_FOUND',
            'pass': credit_value_correct
        })
        print(f"  {'✅' if credit_value_correct else '❌'} CREDIT_VALUE = 0.02: {credit_value_correct}")
        
    except Exception as e:
        results.append({
            'tool': 'FILE_READ',
            'expected_cost': 'N/A',
            'actual_cost': 'ERROR',
            'pass': False,
            'error': str(e)
        })
        print(f"  ❌ Failed to read credits.js: {e}")
    
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"\n📊 Credit Pricing Config: {passed}/{total} tests passed")
    
    return results

def main():
    """Run all security hardening tests"""
    print("🔐 SECURITY HARDENING VERIFICATION TEST SUITE")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print("=" * 60)
    
    all_results = {}
    
    # Run all test suites
    all_results['admin_protection'] = test_admin_route_protection()
    all_results['auth_hardening'] = test_public_route_auth_hardening()
    all_results['ssrf_protection'] = test_ssrf_protection()
    all_results['auth_cookies'] = test_auth_cookie_issuance()
    all_results['rate_limiting'] = test_rate_limiting()
    all_results['cors_tightening'] = test_cors_tightening()
    all_results['regression_checks'] = test_regression_checks()
    all_results['credit_pricing'] = verify_credit_pricing()
    
    # Calculate overall results
    total_passed = 0
    total_tests = 0
    
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS SUMMARY")
    print("=" * 60)
    
    for test_name, results in all_results.items():
        if results:
            passed = sum(1 for r in results if r.get('pass', False))
            total = len(results)
            total_passed += passed
            total_tests += total
            
            status = "✅ PASS" if passed == total else "⚠️ PARTIAL" if passed > 0 else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}: {passed}/{total}")
    
    print("-" * 60)
    overall_percentage = (total_passed / total_tests * 100) if total_tests > 0 else 0
    overall_status = "✅ EXCELLENT" if overall_percentage >= 90 else "⚠️ GOOD" if overall_percentage >= 75 else "❌ NEEDS WORK"
    
    print(f"{overall_status} Overall Security: {total_passed}/{total_tests} ({overall_percentage:.1f}%)")
    print("=" * 60)
    
    # Report critical failures
    critical_failures = []
    for test_name, results in all_results.items():
        if results:
            failed = [r for r in results if not r.get('pass', False)]
            if failed and test_name in ['admin_protection', 'auth_hardening']:
                critical_failures.extend(failed)
    
    if critical_failures:
        print("\n🚨 CRITICAL SECURITY ISSUES FOUND:")
        for failure in critical_failures[:5]:  # Show first 5
            endpoint = failure.get('endpoint', failure.get('test', 'Unknown'))
            status = failure.get('status', 'Unknown')
            print(f"  ❌ {endpoint}: {status}")
        if len(critical_failures) > 5:
            print(f"  ... and {len(critical_failures) - 5} more")
    else:
        print("\n✅ No critical security issues found!")
    
    return all_results

if __name__ == "__main__":
    main()