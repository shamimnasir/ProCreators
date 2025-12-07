# Setup Guide - Story Video Reels

## 📋 System Requirements

This application requires:
- **Node.js:** v20.x (managed by platform)
- **Next.js:** v15.1.0 (latest stable)
- **ffmpeg:** 5.1.7+ (for video processing)
- **MongoDB:** 7.0+ (managed by platform)

---

## 🚀 Automatic Setup

The application includes an automated dependency setup system that runs automatically when you start the development server.

### What Gets Installed Automatically:

1. **ffmpeg** - Video and audio processing library
2. **ffprobe** - Media file analysis tool (bundled with ffmpeg)

### How It Works:

The `setup-dependencies.sh` script runs automatically before:
- Starting the dev server (`yarn dev`)
- Building the production bundle (`yarn build`)

This is configured via npm/yarn lifecycle hooks (`predev`, `prebuild` in `package.json`).

---

## 🔧 Manual Setup (If Needed)

If automatic setup fails, you can run the setup script manually:

```bash
cd /app
bash setup-dependencies.sh
```

Or install ffmpeg directly:

```bash
apt-get update
apt-get install -y ffmpeg
```

---

## 📦 Dependencies

### Core Dependencies
- `next@15.1.0` - React framework with App Router
- `@google-cloud/text-to-speech@^5.7.0` - Google Cloud TTS integration
- `fluent-ffmpeg@^2.1.3` - Node.js ffmpeg wrapper
- `mongodb@^6.6.0` - MongoDB driver

### Video Processing
- `ffmpeg` (system package) - Must be installed at OS level
- `ffprobe` (system package) - Comes with ffmpeg

---

## 🔄 Updates Applied

### Recent Changes (December 2024)

1. **Next.js Updated:** 14.2.3 → 15.1.0
   - Fixed deprecated config options
   - Moved `experimental.serverComponentsExternalPackages` to `serverExternalPackages`

2. **Automated Setup Script:**
   - Created `setup-dependencies.sh` for automatic dependency installation
   - Added pre-hooks to package.json scripts

3. **Build Error Fixed:**
   - Fixed `const` reassignment in caption generation
   - Changed `fontSize` from `const` to `let` to allow modification

---

## ⚙️ Configuration Files

### package.json
- **Location:** `/app/package.json`
- **Purpose:** Manages Node.js dependencies and npm scripts
- **Key Scripts:**
  - `predev` - Runs setup before dev server
  - `dev` - Starts Next.js dev server
  - `prebuild` - Runs setup before build
  - `build` - Creates production bundle

### next.config.js
- **Location:** `/app/next.config.js`
- **Purpose:** Next.js configuration
- **Key Settings:**
  - `output: 'standalone'` - For containerized deployment
  - `serverExternalPackages: ['mongodb']` - Excludes MongoDB from client bundle
  - CORS headers configured for iframe embedding

### .env
- **Location:** `/app/.env`
- **Purpose:** Environment variables
- **Key Variables:**
  - `MONGO_URL` - MongoDB connection string
  - `NEXT_PUBLIC_BASE_URL` - Frontend URL
  - `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud credentials

---

## 🎬 Video Processing Architecture

### How It Works:

1. **User Input:**
   - Script text
   - Language selection (Bengali/English)
   - Voice selection from Google TTS
   - Caption style (9 options)
   - Background music
   - Resolution (720p-4K)

2. **Backend Processing:**
   - Downloads stock videos from Pexels
   - Generates TTS audio via Google Cloud
   - Creates ASS subtitle file with custom styling
   - Uses ffmpeg to:
     - Normalize and concatenate video clips
     - Mix audio (voice + background music)
     - Burn captions onto video
     - Export final MP4

3. **Output:**
   - Final video saved to `/app/public/story-reels/`
   - Accessible via web URL

### Key Files:
- `/app/app/api/story-reels/compose/route.js` - Main video composition logic
- `/app/app/api/story-reels/list-voices/route.js` - Google TTS voice API
- `/app/app/dashboard/tools/story-reels/page.js` - Frontend interface

---

## 🐛 Troubleshooting

### Issue: "ffmpeg: command not found"
**Solution:** Run setup script manually:
```bash
bash /app/setup-dependencies.sh
```

### Issue: "Next.js build error"
**Solution:** Clear cache and restart:
```bash
rm -rf /app/.next
sudo supervisorctl restart nextjs
```

### Issue: "Google TTS API error"
**Solution:** Check credentials file exists:
```bash
ls -la /app/google-cloud-tts-credentials.json
```

### Issue: Video generation fails silently
**Solution:** Check backend logs:
```bash
tail -n 100 /var/log/supervisor/nextjs.out.log
```

---

## 📊 Performance Notes

### Startup Time:
- **First run:** ~15-20 seconds (includes ffmpeg installation)
- **Subsequent runs:** ~5-10 seconds (ffmpeg already installed)

### Video Generation Time:
Depends on:
- Duration (10-60 seconds)
- Resolution (720p-4K)
- Number of video clips

**Typical times:**
- 30s @ 1080p: ~30-45 seconds
- 30s @ 4K: ~60-90 seconds

---

## 🔐 Security Notes

- Google Cloud credentials stored in `/app/google-cloud-tts-credentials.json`
- File is git-ignored (not committed to repository)
- API key managed via environment variable `GOOGLE_APPLICATION_CREDENTIALS`

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 2.0 | Next.js 15.1.0 upgrade, automated ffmpeg setup |
| Dec 2024 | 1.5 | Added 9 caption styles, fixed English TTS |
| Dec 2024 | 1.0 | Initial Google Cloud TTS integration |

---

## 🆘 Support

If you encounter issues not covered in this guide:
1. Check backend logs: `tail -f /var/log/supervisor/nextjs.out.log`
2. Verify ffmpeg: `ffmpeg -version`
3. Test Google TTS credentials: `node /app/test-tts.js` (create test file)

---

**Last Updated:** December 2024  
**Platform:** Emergent Agent Cloud Environment
