#!/usr/bin/env python3
import sys
import json
import os
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

async def generate_text(prompt, system_message="You are a helpful AI assistant specialized in creating engaging content.", session_id=None):
    try:
        import uuid
        api_key = os.getenv('EMERGENT_LLM_KEY')
        
        if not api_key:
            return {
                "success": False,
                "content": None,
                "error": "EMERGENT_LLM_KEY not found in environment"
            }
        
        if not session_id:
            session_id = str(uuid.uuid4())
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "content": response,
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
        
        result = generate_text(prompt, system_message, session_id)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
