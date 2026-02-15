#!/usr/bin/env python3
"""
Quick Zod Validation Test - Focus on validation responses only
"""

import requests
import json

BASE_URL = "https://ai-video-studio-79.preview.emergentagent.com"

def test_validation(endpoint, test_name, payload, expected_status=400):
    """Test validation only - quick timeout"""
    try:
        print(f"\n🧪 {test_name}")
        response = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:300]}...")
        except:
            print(f"Raw: {response.text[:200]}...")
        
        if response.status_code == expected_status:
            print("✅ PASS")
        else:
            print("❌ FAIL")
            
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT (expected for generation, but validation should be fast)")
    except Exception as e:
        print(f"❌ ERROR: {e}")

print("🚀 QUICK ZOD VALIDATION TESTS")

# Image Generation - Working
print("\n" + "="*50)
print("🖼️ IMAGE GENERATION API")
test_validation("/api/generate/image", "Missing prompt", {})
test_validation("/api/generate/image", "Invalid aspect ratio", {"prompt": "test", "aspectRatio": "invalid"})

# Text Generation - Working  
print("\n" + "="*50)
print("📝 TEXT GENERATION API")
test_validation("/api/generate/text", "Missing prompt", {})
test_validation("/api/generate/text", "Prompt too long", {"prompt": "A" * 10001})

# Blog Creator - Working
print("\n" + "="*50)
print("📰 BLOG CREATOR API")
test_validation("/api/blog-creator/generate", "Missing topic", {"articleType": "seo-article"})
test_validation("/api/blog-creator/generate", "Invalid article type", {"topic": "test", "articleType": "invalid"})

# Carousel - Should be working now
print("\n" + "="*50)
print("🎠 CAROUSEL GENERATION API")
test_validation("/api/generate/carousel", "Auto mode missing prompt", {"generationMode": "auto"})
test_validation("/api/generate/carousel", "Invalid platform", {"prompt": "test", "platform": "invalid"})

# Video Generation - Has syntax errors
print("\n" + "="*50)
print("🎬 VIDEO GENERATION API")
test_validation("/api/generate/video/generate", "Missing script", {})
test_validation("/api/generate/video/generate", "Invalid mode", {"script": "test", "mode": "invalid"})

print("\n🎯 VALIDATION TESTING COMPLETE")