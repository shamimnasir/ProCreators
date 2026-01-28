#!/usr/bin/env python3
"""
Nano Banana Image Generation & Editing
Supports:
- Text-to-Image generation
- Image editing with natural language
- Multi-image fusion (up to 14 images)
- Multiple models (Flash & Pro)
"""
import sys
import json
import os
import base64
import io
import google.generativeai as genai
from PIL import Image

# Model mappings - using official Gemini image generation models
MODELS = {
    "nano-banana": "gemini-2.0-flash-exp-image-generation",  # Fast image generation
    "nano-banana-pro": "gemini-2.5-flash-image",  # Higher quality
    "gemini-2.5-flash-image": "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview": "gemini-3-pro-image-preview",
}

def configure_genai():
    """Configure Google Generative AI with API key"""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    genai.configure(api_key=api_key)
    return api_key

def get_model(model_name="nano-banana"):
    """Get the appropriate model instance"""
    model_id = MODELS.get(model_name, MODELS["nano-banana"])
    
    return genai.GenerativeModel(model_name=model_id)

def extract_image_from_response(response):
    """Extract image data from Gemini response"""
    if hasattr(response, 'candidates'):
        for candidate in response.candidates:
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        if part.inline_data.mime_type and 'image' in part.inline_data.mime_type:
                            if part.inline_data.data and len(part.inline_data.data) > 0:
                                image_bytes = part.inline_data.data
                                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                                mime_type = part.inline_data.mime_type
                                return {
                                    "success": True,
                                    "imageUrl": f"data:{mime_type};base64,{base64_image}",
                                    "mimeType": mime_type
                                }
    return None

def generate_image(prompt, model_name="nano-banana", style=None, aspect_ratio="1:1"):
    """Generate image from text prompt"""
    try:
        configure_genai()
        model = get_model(model_name)
        
        # Build enhanced prompt with style
        enhanced_prompt = prompt
        if style and style != "none":
            style_prompts = {
                "realistic": "photorealistic, ultra-detailed, natural lighting, professional photography",
                "artistic": "artistic, creative, stylized, expressive brushstrokes",
                "product": "clean product photography, white background, professional lighting, e-commerce ready",
                "portrait": "professional portrait photography, soft lighting, sharp focus",
                "illustration": "digital illustration, clean lines, vibrant colors",
                "vintage": "vintage aesthetic, film grain, warm tones, retro style",
                "cinematic": "cinematic lighting, dramatic composition, movie poster style",
                "minimalist": "minimalist design, clean, simple, white space",
                "3d": "3D render, high quality, detailed textures, realistic materials",
                "watercolor": "watercolor painting style, soft edges, artistic",
                "pixel-art": "pixel art style, 16-bit retro game aesthetic",
                "comic": "comic book illustration, bold ink lines, high contrast",
                "infographic": "clean infographic style, data visualization, professional"
            }
            style_suffix = style_prompts.get(style, "")
            if style_suffix:
                enhanced_prompt = f"{prompt}. Style: {style_suffix}"
        
        # Add aspect ratio guidance
        if aspect_ratio and aspect_ratio != "1:1":
            aspect_map = {
                "16:9": "wide format, landscape orientation",
                "9:16": "vertical format, portrait orientation, mobile-friendly",
                "4:3": "standard format",
                "3:4": "portrait orientation"
            }
            if aspect_ratio in aspect_map:
                enhanced_prompt = f"{enhanced_prompt}. {aspect_map[aspect_ratio]}"
        
        # Generate with response modalities passed to generate_content
        response = model.generate_content(
            enhanced_prompt,
            generation_config={
                "response_modalities": ["TEXT", "IMAGE"]
            }
        )
        
        result = extract_image_from_response(response)
        if result:
            return result
        
        return {
            "success": False,
            "error": "No image generated in response. Try a different prompt."
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def edit_image(image_base64, edit_prompt, model_name="nano-banana", mime_type="image/png"):
    """Edit an existing image with natural language instructions"""
    try:
        configure_genai()
        model = get_model(model_name)
        
        # Decode base64 image
        if "base64," in image_base64:
            image_base64 = image_base64.split("base64,")[1]
        
        image_bytes = base64.b64decode(image_base64)
        
        # Create content with image and edit instruction
        content = [
            {
                "mime_type": mime_type,
                "data": image_bytes
            },
            f"Edit this image: {edit_prompt}"
        ]
        
        response = model.generate_content(content)
        
        result = extract_image_from_response(response)
        if result:
            return result
        
        return {
            "success": False,
            "error": "Failed to edit image. Try a clearer instruction."
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def fuse_images(images_base64, fusion_prompt, model_name="nano-banana-pro"):
    """Combine multiple images based on prompt"""
    try:
        configure_genai()
        model = get_model(model_name)
        
        content = []
        
        # Add all images to content
        for idx, img_data in enumerate(images_base64[:14]):  # Max 14 images
            if "base64," in img_data.get("data", ""):
                base64_str = img_data["data"].split("base64,")[1]
            else:
                base64_str = img_data.get("data", "")
            
            image_bytes = base64.b64decode(base64_str)
            content.append({
                "mime_type": img_data.get("mimeType", "image/png"),
                "data": image_bytes
            })
        
        # Add fusion instruction
        content.append(f"Combine these {len(images_base64)} images: {fusion_prompt}")
        
        response = model.generate_content(content)
        
        result = extract_image_from_response(response)
        if result:
            return result
        
        return {
            "success": False,
            "error": "Failed to fuse images. Try a different approach."
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Main entry point"""
    try:
        input_data = None
        
        # Check for --input-file argument (for large payloads)
        if len(sys.argv) >= 3 and sys.argv[1] == '--input-file':
            input_file = sys.argv[2]
            with open(input_file, 'r') as f:
                input_data = json.load(f)
        elif len(sys.argv) >= 2:
            # Direct JSON argument (for small payloads)
            input_data = json.loads(sys.argv[1])
        else:
            print(json.dumps({
                "success": False,
                "error": "No input provided"
            }))
            sys.exit(1)
        
        action = input_data.get('action', 'generate')
        model = input_data.get('model', 'nano-banana')
        
        if action == 'generate':
            prompt = input_data.get('prompt')
            style = input_data.get('style', None)
            aspect_ratio = input_data.get('aspectRatio', '1:1')
            
            if not prompt:
                print(json.dumps({
                    "success": False,
                    "error": "Prompt is required for generation"
                }))
                sys.exit(1)
            
            result = generate_image(prompt, model, style, aspect_ratio)
            
        elif action == 'edit':
            image_base64 = input_data.get('imageBase64')
            edit_prompt = input_data.get('editPrompt')
            mime_type = input_data.get('mimeType', 'image/png')
            
            if not image_base64 or not edit_prompt:
                print(json.dumps({
                    "success": False,
                    "error": "Image and edit prompt are required"
                }))
                sys.exit(1)
            
            result = edit_image(image_base64, edit_prompt, model, mime_type)
            
        elif action == 'fuse':
            images = input_data.get('images', [])
            fusion_prompt = input_data.get('fusionPrompt')
            
            if len(images) < 2:
                print(json.dumps({
                    "success": False,
                    "error": "At least 2 images required for fusion"
                }))
                sys.exit(1)
            
            result = fuse_images(images, fusion_prompt, model)
            
        else:
            result = {
                "success": False,
                "error": f"Unknown action: {action}"
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
