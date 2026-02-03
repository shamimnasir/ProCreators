#!/usr/bin/env python3
"""
Script to add CreditCostBadge to tool pages that have the import but don't use it.
This script wraps the main generate button with a flex container containing the badge.
"""
import os
import re

# Tool ID mapping - folder name to toolId in CreditCostBadge
TOOL_ID_MAP = {
    'auto-subtitles': 'auto-subtitles',
    'script-to-ad': 'script-to-ad',
    'lesson-planner': 'lesson-planner',
    'auto-longform': 'auto-longform',
    'activity-book': 'activity-book',
    'slides-maker': 'slides-maker',
    'voice-enhancer': 'voice-enhancer',
    'quick-reels': 'quick-reels',
    'content-humanizer': 'content-humanizer',
    'cover-image-creator': 'cover-image-creator',
    'reels': 'reels',
    'linkedin-posts': 'linkedin-posts',
    'citation-generator': 'citation-generator',
    'podcast-cover-maker': 'podcast-cover-maker',
    'study-notes': 'study-notes',
    'transformation-video': 'transformation-video',
    'professional-email': 'professional-email',
    'coloring-book': 'coloring-book',
    'grammar-checker': 'grammar-checker',
    'worksheet-maker': 'worksheet-maker',
    'job-matcher': 'job-matcher',
    'exam-prep': 'exam-prep',
    'storybook-maker': 'storybook-maker',
    'auto-reels': 'auto-reels',
    'pitch-deck': 'pitch-deck',
    'talking-head': 'talking-head',
    'photo-cards': 'photo-cards',
    'ai-humanizer': 'ai-humanizer',
    'notion-templates': 'notion-templates',
    'essay-helper': 'essay-helper',
    'swot-analysis': 'swot-analysis',
    'learning-cards': 'learning-cards',
    'audio-editor': 'audio-editor',
    'long-form': 'long-form',
    'youtube-creator': 'youtube-creator',
    'noise-remover': 'noise-remover',
    'journal-maker': 'journal-maker',
    'story-reels': 'story-reels',
    'business-plan': 'business-plan',
    'ebook-maker': 'ebook-maker',
    'quiz-maker': 'quiz-maker',
    'networking-message': 'networking-message',
    'video-editor': 'video-editor',
}

def find_pages_needing_badge():
    """Find all tool pages that need the CreditCostBadge added."""
    tools_dir = '/app/app/dashboard/tools'
    pages_to_update = []
    
    for tool_folder in os.listdir(tools_dir):
        page_path = os.path.join(tools_dir, tool_folder, 'page.js')
        if os.path.exists(page_path):
            with open(page_path, 'r') as f:
                content = f.read()
            
            # Check if it has the import but doesn't use the component
            if 'import' in content and 'CreditCostBadge' in content:
                if '<CreditCostBadge' not in content:
                    pages_to_update.append((tool_folder, page_path))
    
    return pages_to_update

def add_badge_to_page(tool_folder, page_path):
    """Add CreditCostBadge to a page near its generate button."""
    with open(page_path, 'r') as f:
        content = f.read()
    
    tool_id = TOOL_ID_MAP.get(tool_folder, tool_folder)
    badge_component = f'<CreditCostBadge toolId="{tool_id}" />'
    
    # Strategy 1: Find className="w-full" button patterns and wrap them
    # Look for: <Button ... className="w-full" ...> ... </Button>
    
    # Pattern for button with w-full that might be a generate button
    button_patterns = [
        # Pattern: Button onClick={...Generate...} className="w-full"
        (r'(<Button[^>]*onClick=\{[^}]*[Gg]enerat[^}]*\}[^>]*className="[^"]*w-full[^"]*"[^>]*>)', 
         r'<div className="flex items-center gap-4">\n                ' + badge_component + r'\n                \1'),
        
        # Pattern: Button className="w-full" onClick={...Generate...}
        (r'(<Button[^>]*className="[^"]*w-full[^"]*"[^>]*onClick=\{[^}]*[Gg]enerat[^}]*\}[^>]*>)',
         r'<div className="flex items-center gap-4">\n                ' + badge_component + r'\n                \1'),
         
        # Pattern: Button className="w-full" size="lg" onClick={...}  (common generate button)
        (r'(<Button\s+className="w-full"\s+size="lg"\s+onClick=\{[a-zA-Z]+\}\s+disabled=\{[^}]+\}>)',
         r'<div className="flex items-center gap-4">\n                ' + badge_component + r'\n                \1'),
    ]
    
    modified = False
    for pattern, replacement in button_patterns:
        if re.search(pattern, content) and not modified:
            new_content = re.sub(pattern, replacement, content, count=1)
            if new_content != content:
                content = new_content
                modified = True
                break
    
    if not modified:
        # Fallback: Just add badge after the last </CardDescription> in the first Card
        # This puts it in a visible location at least
        print(f"  Warning: Could not find suitable button pattern for {tool_folder}")
        return False
    
    # Write the modified content
    with open(page_path, 'w') as f:
        f.write(content)
    
    return True

def main():
    pages = find_pages_needing_badge()
    print(f"Found {len(pages)} pages needing CreditCostBadge")
    
    success_count = 0
    failed = []
    
    for tool_folder, page_path in pages:
        print(f"Processing: {tool_folder}")
        if add_badge_to_page(tool_folder, page_path):
            success_count += 1
            print(f"  ✓ Added badge")
        else:
            failed.append(tool_folder)
            print(f"  ✗ Could not add badge automatically")
    
    print(f"\nResults: {success_count}/{len(pages)} pages updated")
    if failed:
        print(f"Failed pages: {', '.join(failed)}")

if __name__ == '__main__':
    main()
