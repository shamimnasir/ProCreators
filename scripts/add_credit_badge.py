#!/usr/bin/env python3
"""
Script to add CreditCostBadge next to generate buttons in all tool pages.
"""

import os
import re

TOOLS_DIR = '/app/app/dashboard/tools'

def get_tool_id(folder_name):
    """Convert folder name to tool ID"""
    return folder_name

def add_credit_badge_to_button(content, tool_id):
    """Add CreditCostBadge next to generate buttons"""
    
    # Pattern to find standalone generate buttons (Button with onClick={handleGenerate})
    # This handles various button patterns
    patterns = [
        # Pattern 1: Button with className="w-full" (most common)
        (r'(<Button[^>]*className="[^"]*w-full[^"]*"[^>]*onClick=\{handleGenerate\}[^>]*>)',
         f'<div className="flex items-center gap-3">\n              <CreditCostBadge toolId="{tool_id}" />\n              \\1'),
        
        # Pattern 2: Button with size="lg" and w-full
        (r'(<Button\s+size="lg"\s+className="w-full[^"]*"[^>]*onClick=\{handleGenerate\})',
         f'<div className="flex items-center gap-3">\n              <CreditCostBadge toolId="{tool_id}" />\n              \\1'),
    ]
    
    modified = content
    
    # Check if already has CreditCostBadge near a button
    if 'CreditCostBadge toolId=' in content:
        return content, False
    
    # Try to add badge before generate button
    for pattern, replacement in patterns:
        if re.search(pattern, modified):
            # Find the button and its closing tag
            button_match = re.search(pattern, modified)
            if button_match:
                # Find the closing </Button>
                start_pos = button_match.start()
                rest_of_content = modified[start_pos:]
                
                # Find matching </Button>
                button_end = rest_of_content.find('</Button>')
                if button_end != -1:
                    button_end += len('</Button>')
                    
                    # Check if it's already wrapped
                    before_button = modified[max(0, start_pos-50):start_pos]
                    if 'flex items-center gap' in before_button:
                        continue
                    
                    # Wrap the button with the badge
                    button_code = rest_of_content[:button_end]
                    new_button = f'<div className="flex items-center gap-3">\n              <CreditCostBadge toolId="{tool_id}" />\n              {button_code}\n            </div>'
                    
                    modified = modified[:start_pos] + new_button + modified[start_pos + button_end:]
                    return modified, True
    
    return content, False

def process_file(filepath, tool_id):
    """Process a single tool file"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Skip if doesn't have CreditCostBadge import
        if 'CreditCostBadge' not in content:
            return f"SKIP (no import): {tool_id}"
        
        # Skip if already has badge in component
        if f'toolId="{tool_id}"' in content:
            return f"SKIP (already has badge): {tool_id}"
        
        modified, changed = add_credit_badge_to_button(content, tool_id)
        
        if changed:
            with open(filepath, 'w') as f:
                f.write(modified)
            return f"BADGE ADDED: {tool_id}"
        else:
            return f"NO CHANGE: {tool_id}"
            
    except Exception as e:
        return f"ERROR ({tool_id}): {str(e)}"

def main():
    results = []
    tools = sorted(os.listdir(TOOLS_DIR))
    
    for tool_folder in tools:
        tool_path = os.path.join(TOOLS_DIR, tool_folder)
        if not os.path.isdir(tool_path):
            continue
            
        page_file = os.path.join(tool_path, 'page.js')
        if not os.path.exists(page_file):
            continue
        
        result = process_file(page_file, tool_folder)
        results.append(result)
    
    # Print summary
    added = len([r for r in results if r.startswith('BADGE ADDED')])
    skipped = len([r for r in results if r.startswith('SKIP')])
    no_change = len([r for r in results if r.startswith('NO CHANGE')])
    errors = len([r for r in results if r.startswith('ERROR')])
    
    print(f"\n=== SUMMARY ===")
    print(f"Badge Added: {added}")
    print(f"Skipped: {skipped}")
    print(f"No Change: {no_change}")
    print(f"Errors: {errors}")

if __name__ == '__main__':
    main()
