#!/bin/bash
# Automated dependency setup script for Story Video Reels
# This script checks system dependencies (install separately if needed)

echo "🔧 Checking system dependencies..."

# Check if ffmpeg is installed
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg available (version $(ffmpeg -version | head -n 1 | awk '{print $3}'))"
else
    echo "⚠️  ffmpeg not found - some video features may not work"
fi

# Check if chromium is installed (required for PDF generation)
if command -v chromium &> /dev/null; then
    echo "✅ chromium available"
else
    echo "⚠️  chromium not found - PDF generation may not work"
fi

# Check if ffprobe is available
if command -v ffprobe &> /dev/null; then
    echo "✅ ffprobe available"
else
    echo "⚠️  ffprobe not found"
fi

# Show current Next.js version
echo "📦 Checking Next.js version..."
CURRENT_NEXT=$(node -p "require('./package.json').dependencies.next" 2>/dev/null || echo "unknown")
echo "✅ Current Next.js: $CURRENT_NEXT"

echo "✅ Dependency check complete!"
exit 0
