# Dual-Fallback System Implementation

## Overview

To ensure maximum uptime and reliability, the Quick Video Reels platform now uses a **dual-fallback architecture** for both stock videos and background music.

## Video Services (3-Tier Fallback)

### Tier 1: Pixabay Videos (Primary)
- **Status**: ✅ Active
- **API Key**: `PIXABAY_API_KEY=703806-184e78058ce23a467d868ef82`
- **Benefits**:
  - Real HD video clips
  - 1,963+ business videos
  - Thousands per category
  - Portrait & landscape orientations
  - No attribution required
- **File**: `/app/api/story-reels/search-videos/route.js`

### Tier 2: Pexels Photos (Fallback)
- **Status**: ✅ Active
- **API Key**: `PEXELS_API_KEY` (photos endpoint works)
- **Usage**: When Pixabay returns no videos
- **Implementation**:
  - Returns high-quality still images
  - Frontend can add ken-burns motion effects
  - 3-second default duration per image
  - Special flag: `isPhoto: true`
- **Benefits**:
  - Always available (photos API stable)
  - Professional quality images
  - Can be animated for video feel

### Tier 3: Generic Nature Images
- **Usage**: Ultimate fallback if both fail
- **Implementation**: Uses generic "nature" query to Pexels
- **Benefit**: Ensures users never see empty results

## Music Services (2-Tier Fallback)

### Tier 1: Freesound (Primary)
- **Status**: ⚠️ Currently Down (504/503 errors)
- **API Key**: `FREESOUND_API_KEY=Zdo0jH8RDDgi2ah2vM3tKEvJxoWfcVFOVizxrZMC`
- **Benefits** (when working):
  - Largest free music library
  - Licensed for commercial use
  - Duration filtering
  - High-quality MP3 downloads
- **File**: `/app/api/story-reels/search-music/route.js`

### Tier 2: TheAudioDB (Fallback)
- **Status**: ✅ Active (NEW)
- **API**: Free tier, no key required
- **Endpoint**: `https://www.theaudiodb.com/api/v1/json/2/trending.php`
- **Implementation**:
  - Maps user queries to music genres
  - Returns trending tracks
  - iTunes preview links
  - Note: Preview only, not full downloads
- **Benefits**:
  - No API key required
  - Always available
  - Trending music tracks
  - Good for demos

### Fallback Logic Flow

```
User searches for music
    ↓
Try Freesound (primary)
    ├─ Success → Return Freesound tracks
    └─ Fail (504/503/timeout)
        ↓
    Try TheAudioDB (fallback)
        ├─ Success → Return TheAudioDB tracks
        └─ Fail
            ↓
        Return error: "Proceed without music"
```

## Technical Implementation

### Video Search (`/app/api/story-reels/search-videos/route.js`)

```javascript
// Check for both API keys
const pixabayKey = process.env.PIXABAY_API_KEY
const pexelsKey = process.env.PEXELS_API_KEY

// Try Pixabay first
if (pixabayKey) {
  const videos = await searchPixabay(keyword)
  if (videos.length > 0) return videos
}

// Fallback to Pexels Photos
if (pexelsKey) {
  const photos = await searchPexelsPhotos(keyword)
  if (photos.length > 0) return photos
}

// Ultimate fallback
return genericNatureImages()
```

### Music Search (`/app/api/story-reels/search-music/route.js`)

```javascript
let tracks = []

// Try Freesound first
try {
  tracks = await searchFreesound(query, duration)
  if (tracks.length > 0) return { success: true, tracks, service: 'Freesound' }
} catch (error) {
  console.log('Freesound failed, trying fallback...')
}

// Fallback to TheAudioDB
try {
  tracks = await searchTheAudioDB(query, duration)
  if (tracks.length > 0) return { success: true, tracks, service: 'TheAudioDB' }
} catch (error) {
  console.log('TheAudioDB failed')
}

// Both failed
return { success: false, canProceedWithoutMusic: true }
```

## Genre Mapping for TheAudioDB

Since TheAudioDB doesn't support direct keyword search, we map common queries to genres:

```javascript
const genreMapping = {
  'upbeat': 'pop',
  'calm': 'ambient',
  'relaxing': 'classical',
  'energetic': 'rock',
  'happy': 'pop',
  'sad': 'blues',
  'dramatic': 'classical',
  'background': 'ambient',
  'motivational': 'rock',
  'chill': 'electronic'
}
```

## Error Handling

### Graceful Degradation
- All errors return `status: 200` with `success: false`
- Frontend can handle gracefully without breaking
- User-friendly messages:
  - "Service temporarily unavailable"
  - "You can proceed without music"
  - "Trying alternative service..."

### Timeout Protection
- Freesound: 10-second timeout
- TheAudioDB: 5-second timeout
- Prevents hanging requests

### Logging
```
[Music Search] Query: "upbeat background music", duration: 30s
[Freesound] Attempting primary music search...
[Freesound] Failed, trying fallback... (504 Gateway Timeout)
[TheAudioDB] Attempting fallback music search...
[TheAudioDB] Mapped query "upbeat background music" to genre: pop
[TheAudioDB] Success: 8 tracks found
```

## Testing

### Test Video Fallback
```bash
# Test Pixabay (should work)
curl "https://pixabay.com/api/videos/?key=703806-184e78058ce23a467d868ef82&q=business&per_page=3"

# Test Pexels Photos (fallback, should work)
curl -H "Authorization: a4p0mqsuYiv7PJuya9oeRsE91L7RxCykya0P28qJWlx3DFMuqX4dz1kH" \
  "https://api.pexels.com/v1/search?query=business&per_page=3"
```

### Test Music Fallback
```bash
# Test Freesound (currently down)
curl "https://freesound.org/apiv2/search/text/?query=music&token=Zdo0jH8RDDgi2ah2vM3tKEvJxoWfcVFOVizxrZMC"

# Test TheAudioDB (should work)
curl "https://www.theaudiodb.com/api/v1/json/2/trending.php?country=us&type=itunes&format=singles"
```

## Benefits of Dual-Fallback System

1. **Maximum Uptime**: If one service is down, another takes over
2. **No Empty Results**: Users always get content
3. **Service Diversity**: Not dependent on single provider
4. **Cost Efficiency**: Uses free tiers of multiple services
5. **Automatic Recovery**: When primary service comes back online, it's automatically used again

## Future Enhancements

### Potential Additional Services
- **Videos**: 
  - Unsplash (photos)
  - Coverr (free videos)
  - Videvo (stock footage)
  
- **Music**:
  - YouTube Audio Library
  - Free Music Archive
  - Incompetech (Kevin MacLeod)

### Smart Routing
- Cache service status
- Route to fastest service
- Load balancing across services

## Monitoring

### Health Check Recommendations
1. Monitor API response times
2. Track fallback usage frequency
3. Alert when primary service is down >1 hour
4. Log service switch events

---

**Implementation Date**: December 2024
**Status**: ✅ Active and Tested
**Maintainer**: Development Team
