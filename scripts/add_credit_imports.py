#!/usr/bin/env python3
"""
Script to add credit integration to all tool pages.
Adds CreditCostBadge import and useCredits hook.
"""

import os
import re

TOOLS_DIR = '/app/app/dashboard/tools'

# Import lines to add
CREDIT_IMPORTS = """import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'"""

def get_tool_id(folder_name):
    """Convert folder name to tool ID"""
    return folder_name

def process_file(filepath, tool_id):
    """Add credit imports to a tool page"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Skip if already has credit imports
        if 'CreditCostBadge' in content or 'useCredits' in content:
            return f"SKIP (already has credits): {tool_id}"
        
        # Skip if it's not a client component
        if "'use client'" not in content:
            return f"SKIP (not client): {tool_id}"
        
        # Find the last import line
        import_pattern = r"(import\s+.*?from\s+['\"].*?['\"];?\n)+"
        match = re.search(import_pattern, content)
        
        if match:
            # Insert credit imports after last import
            last_import_end = match.end()
            new_content = content[:last_import_end] + CREDIT_IMPORTS + '\n' + content[last_import_end:]
            
            with open(filepath, 'w') as f:
                f.write(new_content)
            
            return f"UPDATED: {tool_id}"
        else:
            return f"SKIP (no imports found): {tool_id}"
            
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
            results.append(f"SKIP (no page.js): {tool_folder}")
            continue
        
        result = process_file(page_file, tool_folder)
        results.append(result)
    
    # Print summary
    updated = len([r for r in results if r.startswith('UPDATED')])
    skipped = len([r for r in results if r.startswith('SKIP')])
    errors = len([r for r in results if r.startswith('ERROR')])
    
    print(f"\n=== SUMMARY ===")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"Errors: {errors}")
    print(f"\n=== DETAILS ===")
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
