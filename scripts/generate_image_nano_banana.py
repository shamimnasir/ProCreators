#!/usr/bin/env python3
import sys
import json
import os
import base64
import google.generativeai as genai

def generate_image_nano_banana(prompt, model="gemini-3-pro-image-preview"):
    """
    Generate image using Google Gemini 3 Pro Image Preview with perfect Bengali text support
    This model is specifically optimized for text rendering in images
    """
    try:
        # Use Google API key
        api_key = os.getenv('GOOGLE_API_KEY')
        
        if not api_key:
            return {
                "success": False,
                "imageUrl": None,
                "error": "GOOGLE_API_KEY not found in environment"
            }
        
        # Configure Google Generative AI
        genai.configure(api_key=api_key)
        
        # Use Gemini 3 Pro Image Preview - best for text rendering
        model_instance = genai.GenerativeModel(model)
        
        # Generate image with explicit instruction for clear text rendering
        enhanced_prompt = f"Create a high-quality image. IMPORTANT: Render all text EXACTLY as written, character by character, without any changes or interpretation. {prompt}"
        
        response = model_instance.generate_content(enhanced_prompt)
        
        # Extract image from response - check all parts for inline_data
        if hasattr(response, 'candidates'):
            for candidate in response.candidates:
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            # Check if mime_type is image and data exists
                            if part.inline_data.mime_type and 'image' in part.inline_data.mime_type:
                                if part.inline_data.data and len(part.inline_data.data) > 0:
                                    # Found image data
                                    image_bytes = part.inline_data.data
                                    base64_image = base64.b64encode(image_bytes).decode('utf-8')
                                    image_url = f"data:image/png;base64,{base64_image}"
                                    
                                    return {
                                        "success": True,
                                        "imageUrl": image_url,
                                        "error": None
                                    }
        
        return {
            "success": False,
            "imageUrl": None,
            "error": f"No image found in response. Response type: {type(response)}"
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
        model = input_data.get('model', 'gemini-2.5-flash-image')
        
        if not prompt:
            print(json.dumps({
                "success": False,
                "error": "Prompt is required"
            }))
            sys.exit(1)
        
        result = generate_image_nano_banana(prompt, model)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
