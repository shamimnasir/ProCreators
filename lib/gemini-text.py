#!/usr/bin/env python3
import sys
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid
import os

def generate_text(prompt, system_message="You are a helpful AI assistant specialized in creating engaging content.", session_id=None):
    try:
        api_key = os.getenv('EMERGENT_LLM_KEY')
        if not api_key:
            return {
                "success": False,
                "content": None,
                "error": "EMERGENT_LLM_KEY not found"
            }
        
        chat_session_id = session_id or str(uuid.uuid4())
        
        chat = LlmChat(
            api_key=api_key,
            session_id=chat_session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text=prompt)
        response = chat.send_message(user_message)
        
        return {
            "success": True,
            "content": response,
            "sessionId": chat_session_id,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "content": None,
            "error": str(e)
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    result = generate_text(
        prompt=input_data.get('prompt'),
        system_message=input_data.get('systemMessage', 'You are a helpful AI assistant specialized in creating engaging content.'),
        session_id=input_data.get('sessionId')
    )
    
    print(json.dumps(result))
