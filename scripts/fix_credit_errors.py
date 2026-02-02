#!/usr/bin/env python3
"""
Fix creditResult undefined errors by removing broken refund calls
that were added without proper credit deduction setup.
"""

import os
import re

TOOLS_DIR = '/app/app/dashboard/tools'

# Files with errors (from lint output)
FILES_WITH_ERRORS = [
    'activity-book',
    'ai-humanizer',
    'auto-subtitles',
    'blog-creator',
    'business-plan',
    'carousels',
    'checklist-maker',
    'citation-generator',
    'coloring-book',
    'content-humanizer',
    'cover-letter',
    'ebook-maker',
    'email-campaigns',
    'essay-helper',
    'exam-prep',
    'flashcard-maker',
    'grammar-checker',
    'guide-maker',
    'interview-prep',
    'job-matcher',
    'journal-maker',
    'landing-page',
    'learning-cards',
    'lesson-planner',
    'linkedin-optimizer',
    'linkedin-posts',
    'lists',
    'love-letter',
    'marketing-strategy',
    'news',
    'notion-templates',
    'photo-cards',
    'pitch-deck',
    'planner-maker',
    'professional-email',
    'quiz-maker',
    'quotes',
    'recipe-book',
    'reels',
    'resume-builder',
    'slides-maker',
    'social-media-manager',
    'story-writer',
    'storybook-maker',
    'swot-analysis',
    'threads',
    'thumbnail-maker',
    'tutorials',
    'video-editor',
    'voice-clone',
    'voice-enhancer',
    'worksheet-maker',
    'youtube-creator',
]

def fix_file(filepath, tool_id):
    """Remove broken refund calls that reference undefined creditResult"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        
        # Pattern 1: Remove standalone refund calls with creditResult
        # await refund(creditResult.transactionId, ...)
        content = re.sub(
            r'\n\s*await refund\(creditResult\.transactionId,\s*[^)]+\)\n',
            '\n',
            content
        )
        
        # Pattern 2: Remove inline refund in catch blocks
        content = re.sub(
            r'await refund\(creditResult\.transactionId,\s*(?:error|err|e)\.message\)\s*\n\s*',
            '',
            content
        )
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            return f"FIXED: {tool_id}"
        else:
            return f"NO CHANGE: {tool_id}"
            
    except Exception as e:
        return f"ERROR ({tool_id}): {str(e)}"

def main():
    results = []
    
    for tool_folder in FILES_WITH_ERRORS:
        tool_path = os.path.join(TOOLS_DIR, tool_folder)
        page_file = os.path.join(tool_path, 'page.js')
        
        if os.path.exists(page_file):
            result = fix_file(page_file, tool_folder)
            results.append(result)
        else:
            results.append(f"NOT FOUND: {tool_folder}")
    
    # Print summary
    fixed = len([r for r in results if r.startswith('FIXED')])
    no_change = len([r for r in results if r.startswith('NO CHANGE')])
    errors = len([r for r in results if r.startswith('ERROR')])
    
    print(f"\n=== SUMMARY ===")
    print(f"Fixed: {fixed}")
    print(f"No Change: {no_change}")
    print(f"Errors: {errors}")
    print(f"\n=== DETAILS ===")
    for r in results:
        print(r)

if __name__ == '__main__':
    main()
