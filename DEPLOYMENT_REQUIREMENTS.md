# Deployment Requirements for ProCreators

## System Dependencies

This application requires the following system packages to be installed:

### Required Packages

1. **FFmpeg** - Required for video processing and composition
   - Used by the Story Video Reels feature
   - Must be available in the system PATH
   - Version: 5.1+ recommended

## Installation Commands

### For Debian/Ubuntu-based systems:
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

### For Docker Deployment:

Add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*
```

### For Emergent AI Platform:

The `apt-packages.txt` file in the root directory specifies system dependencies.
Ensure the base image includes FFmpeg or add it to the deployment configuration.

## Verification

To verify FFmpeg is installed correctly:
```bash
ffmpeg -version
```

Expected output should show FFmpeg version 5.1 or higher.

## Why This Is Needed

The Story Video Reels feature performs the following operations that require FFmpeg:
- Downloading and normalizing video clips from Pexels
- Concatenating multiple video clips
- Adding audio (TTS narration) to videos
- Trimming videos to specified durations
- Generating captions/subtitles

Without FFmpeg, these features will fail with "spawn /usr/bin/ffmpeg ENOENT" errors.

## For Production Deployment

**IMPORTANT**: FFmpeg must be included in your production Docker image or base environment.
It should NOT require manual installation on each deployment.

Contact your platform support team to ensure FFmpeg is included in the base image or deployment configuration.
