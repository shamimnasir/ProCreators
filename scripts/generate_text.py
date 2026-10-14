#!/usr/bin/env python3
import sys
import json
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gemini_client import generate

async def generate_text(prompt, system_message="You are a helpful AI assistant specialized in creating engaging content.", session_id=None):
    try:
        import uuid
        if not session_id:
            session_id = str(uuid.uuid4())
        content = await asyncio.to_thread(generate, prompt, system_message)
        return {
            "success": True,
            "content": content,
            "sessionId": session_id,
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
        # Read input from command line arguments
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "No input provided"
            }))
            sys.exit(1)
        
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt')
        system_message = input_data.get('systemMessage', "You are a helpful AI assistant specialized in creating engaging content.")
        session_id = input_data.get('sessionId')
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = asyncio.run(generate_text(prompt, system_message, session_id))
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
