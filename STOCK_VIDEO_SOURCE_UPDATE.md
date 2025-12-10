# Stock Video Source Priority Update

## Problem
Stock videos were appearing irrelevant to the keywords because the system was prioritizing **Pixabay** as the primary source, with **Pexels Photos** (not videos) as fallback.

## Solution
Updated the video search logic to prioritize sources correctly:
1. **Pexels Videos** (Primary) - High quality, highly relevant videos
2. **Pixabay Videos** (Secondary) - Fallback when Pexels doesn't have results

## Changes Made

### File: `/app/app/api/story-reels/search-videos/route.js`

#### Before:
```javascript
// Checked Pixabay key first
const usePixabay = !!pixabayKey

// Search priority:
1. Pixabay Videos
2. Pexels Photos (not videos!)
```

#### After:
```javascript
// Pexels is now preferred
const pexelsKey = process.env.PEXELS_API_KEY
const pixabayKey = process.env.PIXABAY_API_KEY

// Search priority:
1. Pexels Videos (using /videos/search endpoint)
2. Pixabay Videos (fallback)
```

## Technical Details

### Pexels Videos API (Priority 1)
- **Endpoint**: `https://api.pexels.com/videos/search`
- **Orientation**: `portrait` (for 9:16 vertical videos)
- **Quality**: HD preferred, with SD fallback
- **Results**: Up to 3 videos per keyword
- **Best for**: High-quality, relevant video content

### Pixabay Videos API (Priority 2)
- **Endpoint**: `https://pixabay.com/api/videos/`
- **Orientation**: `vertical` (for 9:16 videos)
- **Quality**: Medium, small, or large
- **Results**: Up to 3 videos per keyword
- **Used when**: Pexels doesn't have videos for a keyword

## Better Logging

Added detailed logging to track which source provides each video:

```
[Search] love → love
[Pexels] ✅ Found video for "love"

[Search] family → family
[Pexels] No videos found for "family", trying Pixabay...
[Pixabay] ✅ Found video for "family"

[Search] unknown_keyword → people lifestyle
[Pexels] No videos found for "unknown_keyword", trying Pixabay...
[Pixabay] No videos found for "unknown_keyword"
[Search] ❌ No videos found for "unknown_keyword" from any source
```

## Benefits

1. **Better Relevance**: Pexels has curated, high-quality videos with better keyword matching
2. **Higher Quality**: Pexels videos are typically HD quality
3. **Correct Orientation**: Both sources now search for vertical/portrait videos (9:16)
4. **Reliable Fallback**: Pixabay as secondary source ensures coverage
5. **Better Debugging**: Detailed logs show exactly which source provided each video

## API Requirements

Both API keys should be configured in `.env`:
```
PEXELS_API_KEY=your_pexels_key_here
PIXABAY_API_KEY=your_pixabay_key_here
```

- **Required**: At least one key (Pexels or Pixabay)
- **Recommended**: Both keys for maximum video availability
- **Free Tier**: Both services offer free API access

## Testing

To verify the changes:
1. Generate a story with keywords
2. Click "Search Videos" button
3. Check backend logs to see source priority
4. Verify videos are more relevant to keywords
5. Confirm videos are in 9:16 portrait orientation

## Performance

No performance impact:
- Still uses parallel search for all keywords
- Same 5-second timeout per API call
- Fallback happens automatically if primary source fails
- Total search time: typically 1-3 seconds for 5-10 keywords
