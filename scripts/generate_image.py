#!/usr/bin/env python3
import sys
import json
import os
import asyncio
import base64
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

async def generate_image(prompt, model="gpt-image-1", quality="medium"):
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        generator = OpenAIImageGeneration(api_key=api_key)
        response = await generator.generate_images(prompt=prompt, model=model, number_of_images=1, quality=quality)
        
        # Response is a list of bytes, convert first image to base64 data URL
        if response and len(response) > 0:
            image_bytes = response[0]
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
