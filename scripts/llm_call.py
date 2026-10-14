#!/usr/bin/env python3
import sys
import json
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gemini_client import generate

async def call_llm(prompt, system_prompt="You are a creative activity book creator. Generate engaging, age-appropriate content."):
    try:
        content = await asyncio.to_thread(generate, prompt, system_prompt)
        return {
            "success": True,
            "content": content,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "content": None,
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        # Read input from command line arguments or file
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "content": None,
                "error": "No input provided"
            }))
            sys.exit(1)
        
        # Check if using file input (for large content)
        if sys.argv[1] == '--file' and len(sys.argv) >= 3:
            file_path = sys.argv[2]
            with open(file_path, 'r', encoding='utf-8') as f:
                input_data = json.load(f)
        else:
            input_data = json.loads(sys.argv[1])
        
        prompt = input_data.get('prompt')
        system_prompt = input_data.get('system_prompt', "You are a creative activity book creator. Generate engaging, age-appropriate content.")
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "content": None,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = asyncio.run(call_llm(prompt, system_prompt))
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "content": None,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
