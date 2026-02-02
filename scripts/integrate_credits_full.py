#!/usr/bin/env python3
"""
Comprehensive script to add full credit integration to all tool pages.
This adds:
1. useCredits hook initialization
2. Credit deduction before API calls
3. Refund on failure, complete on success
4. Credit badge near generate button
"""

import os
import re

TOOLS_DIR = '/app/app/dashboard/tools'

# Tools that have already been fully integrated
ALREADY_DONE = ['joke-generator', 'fortune-teller', 'ad-copy', 'ai-video-studio', 'image-editor']

def get_tool_id(folder_name):
    return folder_name

def add_use_credits_hook(content):
    """Add useCredits hook call after other hooks"""
    # Check if already has useCredits destructuring
    if 'checkAndDeduct' in content and 'refund' in content:
        return content, False
    
    # Find the component function and add hook
    # Look for pattern like "const { toast } = useToast()" or similar hooks
    patterns = [
        (r"(const \{ toast \} = useToast\(\))", r"\1\n  const { checkAndDeduct, refund, complete } = useCredits()"),
        (r"(const toast = useToast\(\))", r"\1\n  const { checkAndDeduct, refund, complete } = useCredits()"),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content):
            new_content = re.sub(pattern, replacement, content, count=1)
            if new_content != content:
                return new_content, True
    
    # Alternative: add after first useState
    pattern = r"(const \[[^\]]+\] = useState\([^)]*\))"
    match = re.search(pattern, content)
    if match:
        # Find a good insertion point after state declarations
        # Look for the last useState before any function definition
        all_states = list(re.finditer(pattern, content))
        if all_states:
            last_state = all_states[-1]
            insert_pos = last_state.end()
            # Check if useCredits already exists nearby
            nearby = content[insert_pos:insert_pos+200]
            if 'useCredits' not in nearby and 'checkAndDeduct' not in content:
                new_content = content[:insert_pos] + "\n  const { checkAndDeduct, refund, complete } = useCredits()" + content[insert_pos:]
                return new_content, True
    
    return content, False

def add_credit_logic_to_handle_generate(content, tool_id):
    """Add credit deduction logic to handleGenerate function"""
    
    # Skip if already has credit logic
    if 'checkAndDeduct' in content and 'creditResult' in content:
        return content, False
    
    # Find handleGenerate function
    pattern = r"(const handleGenerate = async \(\) => \{[^}]*?)(setGenerating\(true\)|setLoading\(true\)|setIsLoading\(true\))"
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        prefix = match.group(1)
        set_loading = match.group(2)
        
        # Create credit check code
        credit_code = f'''
    // Deduct credits first
    const creditResult = await checkAndDeduct('{tool_id}')
    if (!creditResult.success) {{
      toast({{ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' }})
      return
    }}
    
    '''
        
        new_content = content[:match.start()] + prefix + credit_code + set_loading + content[match.end():]
        return new_content, True
    
    return content, False

def add_complete_on_success(content):
    """Add complete() call on successful generation"""
    
    if 'await complete(creditResult' in content:
        return content, False
    
    # Pattern for success toast
    patterns = [
        # Pattern: toast({ title: '...' }) after success
        (r"(if \(data\.success\) \{[^}]*?)(toast\(\{[^}]+\}\))", 
         r"\1await complete(creditResult.transactionId)\n        \2"),
        # Pattern: setResult followed by toast
        (r"(setResult\(data[^)]*\)[^\n]*\n[^}]*?)(toast\(\{[^}]+title:[^}]+\}\))",
         r"\1await complete(creditResult.transactionId)\n        \2"),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            if new_content != content:
                return new_content, True
    
    return content, False

def add_refund_on_error(content):
    """Add refund() call on error"""
    
    if 'await refund(creditResult' in content:
        return content, False
    
    # Pattern for error handling
    patterns = [
        # Pattern: throw new Error in else block
        (r"(\} else \{[^}]*?)(throw new Error\(data\.error)", 
         r"\1await refund(creditResult.transactionId, data.error)\n        \2"),
        # Pattern: catch block with toast error
        (r"(\} catch \((error|err|e)\) \{[^}]*?)(toast\(\{[^}]*variant:\s*['\"]destructive['\"])",
         r"\1await refund(creditResult.transactionId, \2.message)\n      \3"),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            new_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            if new_content != content:
                return new_content, True
    
    return content, False

def process_file(filepath, tool_id):
    """Process a single tool file"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        changes = []
        
        # Skip if no useCredits import
        if 'useCredits' not in content:
            return f"SKIP (no import): {tool_id}"
        
        # Skip if already fully integrated
        if 'checkAndDeduct' in content and 'creditResult' in content and 'refund(creditResult' in content:
            return f"SKIP (already done): {tool_id}"
        
        # Step 1: Add useCredits hook
        content, changed = add_use_credits_hook(content)
        if changed:
            changes.append("hook")
        
        # Step 2: Add credit logic to handleGenerate
        content, changed = add_credit_logic_to_handle_generate(content, tool_id)
        if changed:
            changes.append("deduct")
        
        # Step 3: Add complete on success
        content, changed = add_complete_on_success(content)
        if changed:
            changes.append("complete")
        
        # Step 4: Add refund on error
        content, changed = add_refund_on_error(content)
        if changed:
            changes.append("refund")
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            return f"UPDATED ({', '.join(changes)}): {tool_id}"
        else:
            return f"NO CHANGE: {tool_id}"
            
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
    updated = len([r for r in results if r.startswith('UPDATED')])
    skipped = len([r for r in results if r.startswith('SKIP')])
    no_change = len([r for r in results if r.startswith('NO CHANGE')])
    errors = len([r for r in results if r.startswith('ERROR')])
    
    print(f"\n=== SUMMARY ===")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"No Change: {no_change}")
    print(f"Errors: {errors}")
    print(f"\n=== DETAILS ===")
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
