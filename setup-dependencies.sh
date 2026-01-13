#!/bin/bash
# Automated dependency setup script for Story Video Reels
# This script ensures ffmpeg, chromium and Next.js are up-to-date

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

# Check if chromium is installed (required for PDF generation)
if ! command -v chromium &> /dev/null; then
    echo "📦 chromium not found. Installing..."
    apt-get update -qq > /dev/null 2>&1
    apt-get install -y chromium > /dev/null 2>&1
    echo "✅ chromium installed successfully"
else
    echo "✅ chromium already installed"
fi

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo "⚠️  ffprobe not found (should come with ffmpeg)"
    apt-get install -y ffmpeg > /dev/null 2>&1
else
    echo "✅ ffprobe available"
fi

# Auto-update Next.js to latest version
echo "📦 Checking Next.js version..."
CURRENT_NEXT=$(node -p "require('./package.json').dependencies.next" 2>/dev/null || echo "unknown")
echo "Current Next.js: $CURRENT_NEXT"

# Get latest Next.js version from npm
LATEST_NEXT=$(yarn info next version --silent 2>/dev/null || echo "")

if [ -n "$LATEST_NEXT" ] && [ "$CURRENT_NEXT" != "$LATEST_NEXT" ]; then
    echo "🔄 Updating Next.js from $CURRENT_NEXT to $LATEST_NEXT..."
    yarn add next@latest react@latest react-dom@latest --silent
    echo "✅ Next.js updated to $LATEST_NEXT"
else
    echo "✅ Next.js is up-to-date ($CURRENT_NEXT)"
fi

echo "✅ All dependencies ready!"
exit 0
