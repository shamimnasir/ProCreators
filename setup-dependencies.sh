#!/bin/bash
# Automated dependency setup script for Story Video Reels
# This script checks and INSTALLS system dependencies automatically

echo "🔧 Checking system dependencies..."

# Check if ffmpeg is installed - INSTALL IF MISSING
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg available (version $(ffmpeg -version | head -n 1 | awk '{print $3}'))"
else
    echo "📦 Installing ffmpeg..."
    apt-get update -qq && apt-get install -y -qq ffmpeg > /dev/null 2>&1
    if command -v ffmpeg &> /dev/null; then
        echo "✅ ffmpeg installed successfully"
    else
        echo "⚠️  ffmpeg installation failed - some video features may not work"
    fi
fi

# Check for fonts with international support (Bengali, Hindi, etc.)
if fc-list | grep -q "NotoSansBengali"; then
    echo "✅ Noto fonts available"
else
    echo "📦 Installing Noto fonts for international text support..."
    apt-get update -qq && apt-get install -y -qq fonts-noto fonts-noto-cjk > /dev/null 2>&1
    if fc-list | grep -q "NotoSansBengali"; then
        echo "✅ Noto fonts installed"
    else
        echo "⚠️  Font installation failed - some text may not render correctly"
    fi
fi

# Check if chromium is installed (required for PDF generation)
if command -v chromium &> /dev/null; then
    echo "✅ chromium available ($(chromium --version | head -n 1))"
else
    echo "📦 Installing chromium for PDF generation..."
    apt-get update -qq && apt-get install -y -qq chromium chromium-common > /dev/null 2>&1
    if command -v chromium &> /dev/null; then
        echo "✅ chromium installed successfully"
    else
        echo "⚠️  chromium installation failed - PDF generation will use HTML fallback"
    fi
fi

# Check if ffprobe is available (comes with ffmpeg)
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
