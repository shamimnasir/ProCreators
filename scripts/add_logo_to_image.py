#!/usr/bin/env python3
import sys
import json
import base64
from io import BytesIO
from PIL import Image

def add_logo_to_image(image_data, logo_data, logo_size, logo_position):
    """
    Add logo overlay to an image
    
    Args:
        image_data: Base64 image data or PIL Image
        logo_data: Base64 logo data
        logo_size: Size of logo in pixels
        logo_position: Position ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')
    
    Returns:
        Base64 encoded image with logo
    """
    try:
        # Load base image
        if isinstance(image_data, str):
            # Decode base64
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            img_bytes = base64.b64decode(image_data)
            base_image = Image.open(BytesIO(img_bytes))
        else:
            base_image = image_data
        
        # Ensure RGBA mode
        if base_image.mode != 'RGBA':
            base_image = base_image.convert('RGBA')
        
        # Load logo
        if 'base64,' in logo_data:
            logo_data = logo_data.split('base64,')[1]
        logo_bytes = base64.b64decode(logo_data)
        logo = Image.open(BytesIO(logo_bytes))
        
        # Ensure logo has alpha channel
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        # Resize logo maintaining aspect ratio
        logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Calculate position
        padding = 20
        img_width, img_height = base_image.size
        logo_width, logo_height = logo.size
        
        if logo_position == 'top-left':
            position = (padding, padding)
        elif logo_position == 'top-right':
            position = (img_width - logo_width - padding, padding)
        elif logo_position == 'bottom-left':
            position = (padding, img_height - logo_height - padding)
        elif logo_position == 'bottom-right':
            position = (img_width - logo_width - padding, img_height - logo_height - padding)
        elif logo_position == 'center':
            position = ((img_width - logo_width) // 2, (img_height - logo_height) // 2)
        else:
            position = (img_width - logo_width - padding, padding)  # default to top-right
        
        # Paste logo onto base image
        base_image.paste(logo, position, logo)
        
        # Convert to RGB for JPEG
        if base_image.mode == 'RGBA':
            rgb_image = Image.new('RGB', base_image.size, (255, 255, 255))
            rgb_image.paste(base_image, mask=base_image.split()[3])
            base_image = rgb_image
        
        # Convert to base64
        buffered = BytesIO()
        base_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
        
    except Exception as e:
        print(f"Error adding logo: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        image_data = input_data.get('image')
        logo_data = input_data.get('logo')
        logo_size = input_data.get('logoSize', 80)
        logo_position = input_data.get('logoPosition', 'top-right')
        
        result = add_logo_to_image(image_data, logo_data, logo_size, logo_position)
        
        if result:
            print(json.dumps({
                "success": True,
                "image": result
            }))
        else:
            print(json.dumps({
                "success": False,
                "error": "Failed to add logo"
            }))
            
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
        sys.exit(1)
