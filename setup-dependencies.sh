#!/bin/bash
# Automated dependency setup script for Story Video Reels
# This script ensures ffmpeg is installed and ready

set -e  # Exit on error

echo "🔧 Checking system dependencies..."

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 ffmpeg not found. Installing..."
    apt-get update -qq > /dev/null 2>&1
    apt-get install -y ffmpeg > /dev/null 2>&1
    echo "✅ ffmpeg installed successfully (version $(ffmpeg -version | head -n 1 | awk '{print $3}'))"
else
    echo "✅ ffmpeg already installed (version $(ffmpeg -version | head -n 1 | awk '{print $3}'))"
fi

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo "⚠️  ffprobe not found (should come with ffmpeg)"
    apt-get install -y ffmpeg > /dev/null 2>&1
else
    echo "✅ ffprobe available"
fi

echo "✅ All dependencies ready!"
exit 0
