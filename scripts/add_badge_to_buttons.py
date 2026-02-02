#!/usr/bin/env python3
"""
Script to add CreditCostBadge near generate buttons in all tool pages.
"""

import os
import re

TOOLS_DIR = '/app/app/dashboard/tools'

# Tools that already have the badge
ALREADY_DONE = ['joke-generator', 'fortune-teller', 'ad-copy', 'ai-video-studio', 'image-editor']

def add_badge_to_button(content, tool_id):
    """Add CreditCostBadge near generate button"""
    
    # Skip if already has badge for this tool
    if f'toolId="{tool_id}"' in content:
        return content, False
    
    # Various button patterns to match
    patterns = [
        # Pattern 1: Button with className="w-full" and onClick={handleGenerate}
        (r'(\s*)(<Button\s+[^>]*?className="[^"]*w-full[^"]*"[^>]*?onClick=\{handleGenerate\}[^>]*>)',
         r'\1<div className="flex items-center gap-3">\n\1  <CreditCostBadge toolId="TOOL_ID" />\n\1  \2'),
        
        # Pattern 2: Button with onClick={handleGenerate} and className="w-full"
        (r'(\s*)(<Button\s+[^>]*?onClick=\{handleGenerate\}[^>]*?className="[^"]*w-full[^"]*"[^>]*>)',
         r'\1<div className="flex items-center gap-3">\n\1  <CreditCostBadge toolId="TOOL_ID" />\n\1  \2'),
        
        # Pattern 3: Button size="lg" className="w-full"
        (r'(\s*)(<Button\s+size="lg"\s+className="w-full[^"]*"[^>]*onClick=\{handleGenerate\})',
         r'\1<div className="flex items-center gap-3">\n\1  <CreditCostBadge toolId="TOOL_ID" />\n\1  \2'),
    ]
    
    for pattern, replacement in patterns:
        replacement = replacement.replace('TOOL_ID', tool_id)
        match = re.search(pattern, content)
        if match:
            # Find the closing </Button> for this button
            start_pos = match.start()
            button_start = match.group(2)
            
            # Find </Button>
            rest = content[match.end():]
            button_end_match = re.search(r'</Button>', rest)
            
            if button_end_match:
                end_pos = match.end() + button_end_match.end()
                
                # Check if already wrapped
                before = content[max(0, start_pos-100):start_pos]
                if 'CreditCostBadge' in before or '<div className="flex items-center gap' in before:
                    continue
                
                # Get indentation
                indent = match.group(1)
                
                # Build new content
                button_code = content[match.start(2):end_pos]
                
                # Replace w-full with flex-1 in the button
                new_button = button_code.replace('w-full', 'flex-1')
                
                wrapped = f'{indent}<div className="flex items-center gap-3">\n{indent}  <CreditCostBadge toolId="{tool_id}" />\n{indent}  {new_button}\n{indent}</div>'
                
                new_content = content[:start_pos] + wrapped + content[end_pos:]
                return new_content, True
    
    return content, False

def process_file(filepath, tool_id):
    """Process a single tool file"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Skip if no CreditCostBadge import
        if 'CreditCostBadge' not in content:
            return f"SKIP (no import): {tool_id}"
        
        # Skip if already has badge
        if f'toolId="{tool_id}"' in content:
            return f"SKIP (has badge): {tool_id}"
        
        new_content, changed = add_badge_to_button(content, tool_id)
        
        if changed:
            with open(filepath, 'w') as f:
                f.write(new_content)
            return f"BADGE ADDED: {tool_id}"
        else:
            return f"NO MATCH: {tool_id}"
            
    except Exception as e:
        return f"ERROR ({tool_id}): {str(e)}"

def main():
    results = []
    tools = sorted(os.listdir(TOOLS_DIR))
    
    for tool_folder in tools:
        if tool_folder in ALREADY_DONE:
            results.append(f"SKIP (manual): {tool_folder}")
            continue
            
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
    no_match = len([r for r in results if r.startswith('NO MATCH')])
    errors = len([r for r in results if r.startswith('ERROR')])
    
    print(f"\n=== SUMMARY ===")
    print(f"Badge Added: {added}")
    print(f"Skipped: {skipped}")
    print(f"No Match: {no_match}")
    print(f"Errors: {errors}")
    print(f"\n=== NO MATCH DETAILS ===")
    for r in results:
        if r.startswith('NO MATCH'):
            print(r)

if __name__ == '__main__':
    main()
