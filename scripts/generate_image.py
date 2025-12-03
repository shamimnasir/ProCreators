#!/usr/bin/env python3
import sys
import json
import os
import asyncio
from emergentintegrations.llm.gemeni.image_generation import GeminiImageGeneration

async def generate_image(prompt, model="nano-banana"):
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        generator = GeminiImageGeneration(api_key=api_key)
        response = await generator.generate_image(prompt=prompt, model=model)
        
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
