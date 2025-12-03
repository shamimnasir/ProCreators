#!/usr/bin/env python3
import sys
import json
import os
import asyncio
import base64
import litellm
import requests

async def generate_image(prompt, model="dall-e-3", quality="standard", size="1024x1024"):
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        proxy_url = "https://integrations.emergentagent.com/llm"
        
        # Use litellm with DALL-E 3 through Emergent proxy
        response = litellm.image_generation(
            model=model,
            prompt=prompt,
            api_base=proxy_url,
            api_key=api_key,
            custom_llm_provider="openai",
            n=1,
            quality=quality,
            size=size
        )
        
        if hasattr(response, 'data') and len(response.data) > 0:
            img = response.data[0]
            
            # Get image URL
            if hasattr(img, 'url') and img.url:
                # Download image and convert to base64 for embedding
                image_response = requests.get(img.url, timeout=30)
                if image_response.status_code == 200:
                    base64_image = base64.b64encode(image_response.content).decode('utf-8')
                    image_url = f"data:image/png;base64,{base64_image}"
                    
                    return {
                        "success": True,
                        "imageUrl": image_url,
                        "error": None
                    }
                else:
                    return {
                        "success": False,
                        "imageUrl": None,
                        "error": f"Failed to download image: HTTP {image_response.status_code}"
                    }
            elif hasattr(img, 'b64_json') and img.b64_json:
                # Already base64
                image_url = f"data:image/png;base64,{img.b64_json}"
                return {
                    "success": True,
                    "imageUrl": image_url,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "imageUrl": None,
                    "error": "No image URL or base64 in response"
                }
        else:
            return {
                "success": False,
                "imageUrl": None,
                "error": "No image generated"
            }
    except Exception as e:
        return {
            "success": False,
            "imageUrl": None,
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        # Read input from command line arguments
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "No input provided"
            }))
            sys.exit(1)
        
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt')
        model = input_data.get('model', 'gpt-image-1')
        quality = input_data.get('quality', 'medium')
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = asyncio.run(generate_image(prompt, model, quality))
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
