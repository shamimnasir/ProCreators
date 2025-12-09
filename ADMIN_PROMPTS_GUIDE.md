# Admin System Prompts Manager - User Guide

## Overview

The **AI System Prompts Manager** is an admin feature that allows you to customize how the AI generates content for each Quick Reels niche. This gives you complete control over the AI's behavior without editing code.

## Accessing the Admin Panel

**Navigation**: Dashboard → Sidebar → Admin → AI System Prompts

**Direct URL**: `/dashboard/admin/prompts`

## Features

### 1. Visual Prompt Editor

Each niche has its own dedicated tab with:
- **Full-screen text editor** for writing/editing prompts
- **Character counter** to monitor prompt length
- **Real-time editing** with syntax highlighting
- **Modified indicator** shows unsaved changes

### 2. Per-Niche Customization

**All 12 Niches Available**:
- 📖 Mini Stories
- 💪 Motivational Reels
- 🧠 Facts & Explainers
- 😂 Comedy & Memes
- 🦄 Kids Stories
- 🎨 Kids Learning
- 💼 Business Promos
- 👻 Horror Stories
- ❤️ Relationship Advice
- 🎬 Documentary Style
- 🎉 Festival Themed
- ✨ Custom Creation

### 3. Action Buttons

**Save Changes**:
- Saves your custom prompt to the database
- Takes effect immediately for new generations
- Disabled if no changes made

**Reset to Default**:
- Restores the original hardcoded prompt
- Useful if your customization isn't working well
- Can be undone by not saving

**Copy**:
- Copies current prompt to clipboard
- Useful for backing up prompts
- Share prompts across environments

### 4. Bulk Actions

**Export All Prompts**:
- Copies all 12 niche prompts to clipboard
- Formatted with niche names as headers
- Perfect for backup or documentation

**Reset All to Defaults**:
- Reverts all niches to original prompts
- Requires manual save per niche after reset
- Use with caution!

## How It Works

### Prompt Priority System

When a user generates a script, the system checks:

1. **Custom Admin Prompt** (Database) - Highest Priority
   - If admin has saved a custom prompt for this niche
   - Stored in MongoDB `custom_prompts` collection

2. **Default Config Prompt** (Fallback)
   - Original hardcoded prompt from `/config/quick-reels-niches.js`
   - Used if no custom prompt exists

### Database Schema

```javascript
{
  nicheSlug: 'business-promo',
  prompt: 'Your custom prompt here...',
  createdAt: Date,
  updatedAt: Date,
  updatedBy: 'admin'
}
```

## Prompt Engineering Best Practices

### Structure Your Prompts

```
[Role Definition]
You are a [specific role] who [does what]

[Task Description]
Your task is to [specific task] that [outcome]

[Constraints]
- DO: [what to do]
- DON'T: [what to avoid]
- MUST: [requirements]

[Output Format]
Return: [exact format expected]
```

### Example: Business Promo Prompt

```
You are a professional promotional script writer.

TASK: Create a promotional script for the user's business/product/service.

CRITICAL RULES:
- Use the EXACT business name provided by the user
- Write ONLY spoken narration (no scene directions)
- Language: Match user's input language
- Tone: Friendly, confident, trustworthy
- Length: 15-30 seconds
- Structure: Hook → Benefit → Call-to-action

CONSTRAINTS:
- No exaggerated claims
- No fake testimonials
- No comparison to competitors
- No copyrighted references

OUTPUT FORMAT:
Plain text narration only - what the voice actor will say.
```

### Dynamic Variables

Use these in your prompts:
- `${duration}` - Target video duration
- `${language}` - User's selected language (bn/en)
- `${customTopic}` - User input (for generic/business-promo)

## Testing Your Prompts

### Step-by-Step Testing Process

1. **Edit Prompt** in admin panel
2. **Save Changes**
3. **Navigate to the niche tool** (e.g., Business Promos)
4. **Generate a test script**
5. **Review the output**:
   - Does it follow your instructions?
   - Is the tone correct?
   - Are constraints respected?
6. **Iterate**: Go back to admin panel and refine
7. **Repeat** until satisfied

### A/B Testing

1. Export current prompt (backup)
2. Try new variation
3. Generate 5-10 scripts
4. Compare quality
5. Keep winner, discard loser

## Common Use Cases

### Use Case 1: Stricter Content Guidelines

**Problem**: AI generates controversial content
**Solution**: Add strict "DO NOT" rules in prompt

```
FORBIDDEN CONTENT:
- Political opinions
- Religious content
- Sensitive social issues
- Controversial topics
```

### Use Case 2: Brand Voice Consistency

**Problem**: Content doesn't match brand tone
**Solution**: Define explicit tone guidelines

```
TONE REQUIREMENTS:
- Professional but approachable
- Avoid slang and colloquialisms
- Use "we" not "I"
- Focus on empowerment
```

### Use Case 3: Localization

**Problem**: Content feels too generic for Bangladesh audience
**Solution**: Add cultural context

```
CULTURAL CONTEXT:
- Use Bangladeshi examples
- Reference local festivals (Eid, Pohela Boishakh)
- Avoid Western-centric references
- Use familiar local brands as examples
```

### Use Case 4: Length Control

**Problem**: Scripts are too long or too short
**Solution**: Add word count targets

```
LENGTH REQUIREMENTS:
- Target: ${duration} seconds
- Word count: ~${Math.floor(duration * 2.5)} words
- Aim for: ${duration - 2} to ${duration + 2} seconds range
```

## Troubleshooting

### Problem: Custom Prompt Not Working

**Check**:
1. Is the prompt actually saved? (Green "Saved" badge)
2. Did you refresh the tool page after saving?
3. Check browser console for errors
4. Verify database has the custom prompt

**Debug**:
```bash
# Check if prompt is in database
mongo
use your_database
db.custom_prompts.find({ nicheSlug: 'business-promo' })
```

### Problem: AI Ignores Instructions

**Solutions**:
1. **Be more explicit**: AI needs very clear instructions
2. **Add examples**: Show good vs bad outputs
3. **Repeat key points**: Critical instructions should appear multiple times
4. **Use CAPITALS**: For absolutely critical rules
5. **Structure with bullets**: Easier for AI to parse

### Problem: Prompt Too Long

**Optimal Length**: 500-1500 characters
**Maximum**: 3000 characters

**If too long**:
- Remove redundant instructions
- Combine similar rules
- Focus on most important guidelines
- Use concise language

## Security & Access Control

### Current Implementation

- **No authentication** on `/dashboard/admin/prompts` (TODO)
- Any user can access and modify prompts
- Changes are permanent and affect all users

### Recommended Security (Future)

```javascript
// Add middleware for admin-only access
if (user.role !== 'admin') {
  return redirect('/dashboard')
}
```

### Audit Trail

The system logs:
- Who made changes (`updatedBy` field)
- When changes were made (`updatedAt` timestamp)
- Which niche was modified

## Backup & Restore

### Manual Backup

1. Click "Export All Prompts"
2. Save clipboard to text file
3. Date the backup file
4. Store securely

### Restore from Backup

1. Open saved backup file
2. Copy individual prompt
3. Paste into admin editor
4. Click "Save Changes"

### Database Backup

```bash
# Backup custom_prompts collection
mongodump --db=your_db --collection=custom_prompts --out=/backup/

# Restore
mongorestore --db=your_db --collection=custom_prompts /backup/
```

## API Reference

### GET /api/admin/prompts

Fetch all custom prompts

**Response**:
```json
{
  "success": true,
  "prompts": {
    "business-promo": "Custom prompt text...",
    "horror": "Custom prompt text..."
  },
  "count": 2
}
```

### POST /api/admin/prompts

Save/update custom prompt

**Request**:
```json
{
  "nicheSlug": "business-promo",
  "prompt": "Your custom prompt text here..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Prompt saved successfully",
  "nicheSlug": "business-promo",
  "modified": true,
  "upserted": false
}
```

### DELETE /api/admin/prompts?nicheSlug=business-promo

Remove custom prompt (revert to default)

**Response**:
```json
{
  "success": true,
  "message": "Prompt deleted successfully, will use default",
  "nicheSlug": "business-promo",
  "deleted": true
}
```

## Examples Gallery

### Conservative/Safe Content

```
You are a family-friendly content creator.

SAFETY FIRST:
- All content must be appropriate for ages 13+
- No violence, explicit content, or sensitive topics
- Use positive, uplifting language
- Focus on universal themes

If unsure, err on the side of caution.
```

### Aggressive Marketing

```
You are a high-energy sales copywriter.

STYLE:
- Use action verbs: "Transform", "Discover", "Unlock"
- Create urgency: "Limited time", "Don't miss out"
- Highlight benefits, not features
- End with strong call-to-action

HOOK FORMAT:
Question → Pain Point → Solution → CTA
```

### Educational/Informative

```
You are an educator making complex topics simple.

TEACHING STYLE:
- Start with "Did you know..."
- Use analogies and metaphors
- Break down into 3 main points
- End with a memorable takeaway

Avoid jargon. Explain like you're talking to a curious 12-year-old.
```

## Tips for Success

1. **Start Small**: Modify one niche at a time
2. **Test Thoroughly**: Generate 10+ scripts before going live
3. **Keep Backups**: Always export before major changes
4. **Document Changes**: Keep notes on what works
5. **Monitor Results**: Track script quality over time
6. **Iterate Continuously**: Prompt engineering is ongoing
7. **Learn from Output**: AI responses teach you what works

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
