#!/usr/bin/env python3
import sys
import json
import os
import asyncio
import base64
from emergentintegrations.llm.gemeni.image_generation import GeminiImageGeneration

async def generate_image_nano_banana(prompt, model="nano-banana"):
    """
    Generate image using Google Gemini Nano Banana directly with Google API key
    """
    try:
        # Use Google API key directly (not Emergent key)
        api_key = os.getenv('GOOGLE_API_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "GOOGLE_API_KEY not found in environment"
            }
        
        # Use GeminiImageGeneration with Google API key
        generator = GeminiImageGeneration(api_key=api_key)
        
        # Generate images - returns list of bytes
        image_bytes_list = await generator.generate_images(
            prompt=prompt,
            model=model,
            number_of_images=1
        )
        
        if image_bytes_list and len(image_bytes_list) > 0:
            # Convert first image to base64
            image_bytes = image_bytes_list[0]
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
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
        
        result = asyncio.run(generate_image_nano_banana(prompt, model))
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
