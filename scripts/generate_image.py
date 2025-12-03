#!/usr/bin/env python3
import sys
import json
import os
from emergentintegrations.images.generator import ImageGenerator, GenerateImageRequest

def generate_image(prompt, model="nano-banana"):
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        generator = ImageGenerator(api_key=api_key).with_model("gemini", model)
        
        request = GenerateImageRequest(prompt=prompt)
        response = generator.generate(request)
        
        return {
            "success": True,
            "imageUrl": response,
            "error": None
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
        model = input_data.get('model', 'nano-banana')
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = generate_image(prompt, model)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
