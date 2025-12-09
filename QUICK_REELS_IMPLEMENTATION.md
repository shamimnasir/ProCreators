# Quick Video Reels & Shorts Platform - Implementation Documentation

## Overview

The Quick Video Reels & Shorts platform is a multi-niche video generation system that extends the existing Story Reels functionality. It provides 12 specialized niches, each with custom AI prompts optimized for their specific content type.

## Architecture

### 1. Configuration System (`/config/quick-reels-niches.js`)

**Purpose**: Central configuration for all niches with their prompts, styling, and metadata.

**Structure**:
```javascript
{
  id: 'mini-stories',
  name: 'Mini Stories',
  slug: 'mini-stories',
  description: '...',
  tagline: '...',
  icon: '📖',
  color: 'from-purple-500 to-pink-500',
  cardBg: 'bg-gradient-to-br from-purple-50...',
  promptTemplate: `...` // Custom AI prompt for this niche
}
```

**Available Niches**:
1. Mini Stories - Moral, emotional, twist, folklore
2. Motivational Reels - Discipline, growth, self-worth
3. Facts & Explainers - Educational facts and science
4. Comedy & Memes - Localized humor
5. Kids Stories - Playful moral stories
6. Kids Learning - ABC, 123, colors, shapes
7. Business Promos - Marketing content
8. Horror Stories - Atmospheric creepy tales
9. Relationship Advice - Emotional guidance
10. Documentary Style - Historical facts
11. Festival Themed - Celebration content
12. Custom Creation - User-defined topics

### 2. Hub Page (`/app/dashboard/tools/quick-reels/page.js`)

**Purpose**: Landing page showcasing all available niches in a beautiful grid layout.

**Features**:
- Responsive grid (1/2/3 columns based on screen size)
- Gradient backgrounds for each niche card
- Hover effects and animations
- Direct links to individual niche tools
- Feature highlights section

**URL**: `/dashboard/tools/quick-reels`

### 3. Dynamic Niche Pages (`/app/dashboard/tools/quick-reels/[niche]/page.js`)

**Purpose**: Individual tool pages for each niche using Next.js dynamic routing.

**Features**:
- Validates niche slug against configuration
- Shows 404-style error for invalid niches
- Passes niche context to ReelGenerator component
- Special handling for 'generic' niche (shows topic input)

**URLs**: 
- `/dashboard/tools/quick-reels/horror`
- `/dashboard/tools/quick-reels/motivational`
- `/dashboard/tools/quick-reels/generic`
- etc.

### 4. ReelGenerator Component (`/components/ReelGenerator.jsx`)

**Purpose**: Reusable video generation interface that accepts niche configuration.

**Props**:
- `niche` - Niche slug (e.g., 'horror', 'motivational')
- `nicheName` - Display name (e.g., 'Horror Stories')
- `nicheIcon` - Emoji icon
- `nicheDescription` - Brief description
- `showCustomTopicInput` - Boolean for generic niche

**Current Status**: ⚠️ **Simplified Implementation**
- Currently shows only Step 1 (Script Generation)
- Missing full workflow from original Story Reels:
  - ❌ Keyword extraction
  - ❌ Stock video search and selection
  - ❌ Voice options (TTS vs Upload)
  - ❌ Preview modal
  - ❌ Final video composition
  - ❌ Music selection
  - ❌ Caption customization

**To Complete**: 
The component needs to be expanded to match the full Story Reels functionality (see `/app/dashboard/tools/story-reels/page.js` lines 1-1388 for reference).

### 5. Backend API Updates

#### Script Generation API (`/app/api/story-reels/generate-script/route.js`)

**Changes Made**:
- ✅ Accepts `niche` parameter
- ✅ Accepts `customTopic` for generic niche
- ✅ Uses niche-specific prompt templates from config
- ✅ Falls back to default Story Reels prompt if no niche specified

**Request Format**:
```javascript
{
  duration: 30,
  language: 'bn',
  niche: 'horror',
  customTopic: 'optional - only for generic niche'
}
```

#### Video Composition API (`/app/api/story-reels/compose/route.js`)

**Changes Made**:
- ✅ Accepts `niche` parameter in form data
- ✅ Stores niche in library document
- ✅ Uses niche for video title generation
- ✅ Includes niche metadata

**Library Document Structure**:
```javascript
{
  id: 'uuid',
  userId: 'default-user',
  niche: 'horror', // NEW FIELD
  category: 'video',
  title: 'Horror Stories: ...',
  metadata: {
    niche: 'horror',
    nicheDisplayName: 'Horror Stories',
    // ... other metadata
  }
}
```

### 6. Library Integration (`/app/dashboard/library/page.js`)

**Changes Made**:
- ✅ Imports niche configuration
- ✅ Shows niche badge on video cards
- ✅ Displays niche icon and name
- ✅ Supports filtering by niche (UI ready)

**Future Enhancement**: Add dedicated niche filter tabs

## How It Works - User Flow

1. **User visits hub**: `/dashboard/tools/quick-reels`
2. **Selects a niche**: Clicks on "Horror Stories" card
3. **Redirects to tool**: `/dashboard/tools/quick-reels/horror`
4. **Configure settings**: Set duration (10-60s), language
5. **Generate script**: AI creates niche-specific script using custom prompt
6. **Extract keywords**: AI identifies visual keywords from script
7. **Search videos**: System finds matching stock footage
8. **Choose voice**: Select TTS voice or upload audio
9. **Preview**: See draft with captions and music
10. **Generate final**: System composes HD video
11. **Auto-save**: Video saved to Library with niche tag
12. **View in Library**: Video shows niche badge

## Prompt Engineering

Each niche has a specialized prompt that:
1. **Maintains consistency**: All prompts start with the universal foundation
2. **Enforces safety**: No copyrighted content, real people, harmful content
3. **Optimizes structure**: Tight sentences, natural hooks, clear pacing
4. **Targets audience**: Content appropriate for niche (kids, business, horror, etc.)
5. **Controls length**: Precise duration requirements

**Example - Horror Niche Prompt**:
```
You are the internal generator. Produce a short script in simple, emotional, 
high-retention language. Avoid copyrighted characters, real celebrities, and 
real events unless they are historical facts. Keep sentences tight. Add natural 
suspense, rhythm, and hooks.

Create a 25–40 second horror story with atmospheric tension and a clean buildup. 
No gore, no graphic violence, no real locations, no real individuals. Use sensory 
details to imply fear instead of describing explicit harm. End with an eerie 
unresolved twist.
```

## Testing Checklist

### Completed ✅
- [x] Configuration file created with all 12 niches
- [x] Hub page displays all niches correctly
- [x] Dynamic routing works for niche pages
- [x] Backend accepts niche parameter
- [x] Niche-specific prompts integrated
- [x] Library stores niche information
- [x] Library displays niche badges

### Pending ⚠️
- [ ] Complete ReelGenerator with full workflow
- [ ] Test script generation for each niche
- [ ] Test full video generation end-to-end
- [ ] Verify library filtering by niche
- [ ] Test 'generic' niche with custom topics
- [ ] Mobile responsiveness check
- [ ] Add breadcrumb navigation
- [ ] Add "Back to Hub" button on niche pages

## Known Limitations

1. **Simplified UI**: Current ReelGenerator is MVP-level. It shows script generation but lacks the complete workflow steps.

2. **Code Duplication**: To avoid this, the ReelGenerator should ideally import and reuse logic from the original Story Reels page, or Story Reels itself should be refactored into smaller, reusable components.

3. **No Niche Filtering**: Library page shows niche badges but doesn't yet have a dedicated niche filter/tab system.

## Future Enhancements

### Short Term
1. Complete ReelGenerator component with all workflow steps
2. Add niche-specific examples/templates
3. Implement library filtering by niche
4. Add usage analytics per niche

### Long Term
1. Allow users to create custom niches
2. Niche-specific stock video preferences
3. Voice persona mapping per niche
4. A/B testing different prompt variations
5. Community niche templates marketplace

## File Structure

```
/app
├── config/
│   └── quick-reels-niches.js          # Niche configurations
├── app/
│   ├── dashboard/
│   │   ├── tools/
│   │   │   ├── quick-reels/
│   │   │   │   ├── page.js            # Hub landing page
│   │   │   │   └── [niche]/
│   │   │   │       └── page.js        # Dynamic niche pages
│   │   │   └── story-reels/
│   │   │       └── page.js            # Original tool (unchanged)
│   │   └── library/
│   │       └── page.js                # Updated with niche badges
│   └── api/
│       └── story-reels/
│           ├── generate-script/
│           │   └── route.js           # Updated with niche support
│           └── compose/
│               └── route.js           # Updated with niche tracking
└── components/
    └── ReelGenerator.jsx               # Reusable tool interface
```

## API Reference

### Generate Script
**Endpoint**: `POST /api/story-reels/generate-script`

**Request**:
```json
{
  "duration": 30,
  "language": "en",
  "niche": "horror",
  "customTopic": "haunted library" // optional, only for generic
}
```

**Response**:
```json
{
  "success": true,
  "script": "In the old library, a book fell from the shelf...",
  "language": "en",
  "duration": 30,
  "niche": "horror"
}
```

### Compose Video
**Endpoint**: `POST /api/story-reels/compose`

**Form Data** (in addition to existing fields):
- `niche`: string - Niche slug for categorization

## Maintenance Notes

- **Adding New Niches**: Add entry to `QUICK_REELS_NICHES` array in config file
- **Modifying Prompts**: Update `promptTemplate` in niche configuration
- **Changing UI**: Edit hub page or ReelGenerator component
- **Backend Changes**: Ensure niche parameter is passed through all API calls

## Support & Troubleshooting

**Issue**: Niche page shows 404
- **Solution**: Verify slug matches config file exactly (case-sensitive)

**Issue**: Script doesn't match niche style
- **Solution**: Review and refine `promptTemplate` in configuration

**Issue**: Videos not tagged with niche in library
- **Solution**: Ensure `niche` parameter is passed to compose API

**Issue**: ReelGenerator missing features
- **Solution**: This is expected - component needs completion (see Pending tasks)

---

**Last Updated**: December 2024
**Version**: 1.0.0 (MVP)
**Status**: Phase 1-4 Complete, Component needs full implementation
