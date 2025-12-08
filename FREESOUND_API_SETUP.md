# Freesound API Integration Setup

## 🎵 Background Music Feature

Your Story Reels app now integrates with Freesound's free music library, giving users access to thousands of royalty-free music tracks that auto-cut to match video duration.

---

## 🔑 How to Get Your FREE Freesound API Key

### Step 1: Create Freesound Account
1. Go to https://freesound.org
2. Click "Register" in the top right
3. Fill in your details and create account
4. Verify your email address

### Step 2: Apply for API Key
1. Log in to your Freesound account
2. Go to https://freesound.org/apiv2/apply
3. Click "Request a new API key"
4. Fill in the application form:
   - **Application Name:** Story Video Reels
   - **Application Description:** Video creation tool with background music
   - **Application Type:** Select "Web application"
   - **Usage:** Non-commercial or Commercial (your choice)
5. Submit the application
6. You'll receive your API key immediately on the confirmation page

### Step 3: Add API Key to Your App
1. Copy your API key from the Freesound page
2. Open your `.env` file in `/app/.env`
3. Add this line:
   ```
   FREESOUND_API_KEY=YOUR_API_KEY_HERE
   ```
4. Save the file
5. Restart your Next.js server:
   ```bash
   sudo supervisorctl restart nextjs
   ```

---

## ✅ Features Enabled

Once you add the API key, users can:

1. **Search Music Library**
   - Search by keywords: "upbeat", "calm", "epic", "cinematic", etc.
   - Browse thousands of free music tracks
   - Filter by mood, genre, style

2. **Preview Before Selecting**
   - Play 30-second preview of any track
   - Listen before downloading
   - See track details (duration, tags, license)

3. **Auto-Cut to Video Length**
   - Selected music automatically trimmed to match video duration
   - Fade out effect added at the end
   - No manual editing needed

4. **Cache & Reuse**
   - Downloaded tracks cached locally in `/public/music-cache/`
   - Reuse popular tracks without re-downloading
   - Faster video generation

5. **Royalty-Free**
   - All Freesound tracks are free to use
   - Most require attribution (automatically handled)
   - Safe for commercial use (check individual licenses)

---

## 🎨 User Experience

### Without API Key:
- Users see default music options (upbeat, calm, epic, emotional)
- Can still generate videos with built-in tracks

### With API Key:
- **"Browse Freesound Library"** button appears
- Click to open music picker modal
- Search & select from thousands of tracks
- Custom music auto-cuts and mixes into video

---

## 🔧 Technical Details

### API Endpoints Created:
1. `/api/story-reels/search-music` - Search Freesound library
2. `/api/story-reels/download-music` - Download & cache tracks

### Music Processing:
1. User searches and selects track from Freesound
2. Track downloads and caches in `/public/music-cache/`
3. During video generation:
   - Music trimmed to exact video duration using ffmpeg
   - Mixed with voiceover (voice 100%, music 25%)
   - Fade-out effect applied at the end
   - Final audio embedded in video

### File Storage:
- Downloaded music: `/app/public/music-cache/{soundId}.mp3`
- Cache persists across video generations
- No need to re-download popular tracks

---

## 📊 API Limits

Freesound API (Free Tier):
- **Rate Limit:** 2000 requests per day
- **Download Limit:** Unlimited
- **Search Results:** Up to 15,000 sounds
- **Cost:** FREE forever

**More than enough for most video creation workflows!**

---

## 🎯 Usage Example

```javascript
// User workflow:
1. Create video script
2. Select stock videos
3. Choose voice
4. Click "Browse Freesound Library"
5. Search: "upbeat background music"
6. Preview tracks
7. Select favorite track
8. Generate video
   → Music auto-cuts to 30s (if video is 30s)
   → Mixed at 25% volume under voiceover
   → Perfect sync!
```

---

## 🐛 Troubleshooting

### "API key not configured" error:
- Check `.env` file has `FREESOUND_API_KEY=...`
- Restart server after adding key
- Verify no typos in key

### Music not playing in video:
- Check `/var/log/supervisor/nextjs.out.log` for ffmpeg errors
- Verify ffmpeg is installed: `ffmpeg -version`
- Check music file exists in `/public/music-cache/`

### Search returns no results:
- Try different keywords
- Check API key is valid
- Verify network connectivity to freesound.org

---

## 🎉 Benefits

**For Users:**
- Unlimited music choices
- Professional quality tracks
- Perfect sync with videos
- No copyright issues

**For You:**
- No hosting costs (cached locally)
- No API fees (free forever)
- Enhances app value
- Differentiates from competitors

---

## 📝 Attribution

Freesound tracks may require attribution depending on their license (CC0, CC-BY, etc.). The app displays license info during selection.

**Recommended:** Add a small credits section in generated videos or provide a separate credits file.

---

**Setup Time:** 5 minutes  
**Cost:** FREE  
**Result:** Professional background music in every video! 🎵

Get your API key now: https://freesound.org/apiv2/apply
