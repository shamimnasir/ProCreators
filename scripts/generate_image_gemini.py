#!/usr/bin/env python3
import sys
import json
import os
import asyncio
import requests
import base64

async def generate_image_gemini(prompt, model="nano-banana"):
    """
    Generate image using Gemini Nano Banana through Emergent proxy
    """
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        # Use Emergent integration proxy
        proxy_url = "https://integrations.emergentagent.com"
        
        # Try different endpoint patterns for Gemini image generation
        endpoints_to_try = [
            f"{proxy_url}/llm/gemini/image/generate",
            f"{proxy_url}/gemini/image/generate",
            f"{proxy_url}/llm/image/generate",
        ]
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-API-Key": api_key
        }
        
        payload = {
            "prompt": prompt,
            "model": model,
            "number_of_images": 1
        }
        
        last_error = None
        for endpoint in endpoints_to_try:
            try:
                print(f"Trying endpoint: {endpoint}")
                response = requests.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=60
                )
                
                print(f"Status code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Try to extract image from response
                    if 'image' in data:
                        image_data = data['image']
                    elif 'images' in data and len(data['images']) > 0:
                        image_data = data['images'][0]
                    elif 'data' in data:
                        image_data = data['data']
                    else:
                        # Response might be base64 directly
                        image_data = data
                    
                    # Convert to base64 data URL if needed
                    if isinstance(image_data, str):
                        if image_data.startswith('data:image'):
                            image_url = image_data
                        else:
                            image_url = f"data:image/png;base64,{image_data}"
                    elif isinstance(image_data, bytes):
                        base64_image = base64.b64encode(image_data).decode('utf-8')
                        image_url = f"data:image/png;base64,{base64_image}"
                    else:
                        return {
                            "success": False,
                            "imageUrl": None,
                            "error": f"Unexpected image data format: {type(image_data)}"
                        }
                    
                    return {
                        "success": True,
                        "imageUrl": image_url,
                        "error": None
                    }
                else:
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                    print(f"Failed: {last_error}")
                    
            except Exception as e:
                last_error = str(e)
                print(f"Exception: {last_error}")
                continue
        
        # If all endpoints failed, return error
        return {
            "success": False,
            "imageUrl": None,
            "error": f"All endpoints failed. Last error: {last_error}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "imageUrl": None,
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "No input provided"
            }))
            sys.exit(1)
        
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt')
        model = input_data.get('model', 'nano-banana')
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = asyncio.run(generate_image_gemini(prompt, model))
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
