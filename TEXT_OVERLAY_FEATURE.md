# Text Overlay Feature

## Overview
Added support for custom text overlays on individual video clips and product images. Users can now add product names, CTAs, prices, or any text to specific clips in their videos.

## Features

### Frontend UI
- **"Add Text" Button**: Each clip card now has an "Add Text" button
- **Inline Editor**: Click to reveal text input and position selector
- **Visual Indicator**: Green badge with text icon shows which clips have text overlays
- **Simple Configuration**:
  - Text content input field
  - Position dropdown: Top / Center / Bottom

### Backend Processing
- Text overlays applied during video normalization
- Uses FFmpeg's `drawtext` filter
- Styling: White text with black outline (readable on any background)
- Font size adapts to video resolution (72px for 1920p+, 56px for lower)

## How to Use

### Step 1: Add Clips
1. Generate a story or add product images
2. Search for stock videos or upload custom clips
3. Arrange clips in desired order

### Step 2: Add Text Overlays
1. Click "Add Text" button on any clip
2. Enter your text (e.g., "Buy Now!", "50% OFF", "Product Name")
3. Select position: Top, Center, or Bottom
4. Text is saved automatically

### Step 3: Generate Video
1. Configure voice, captions, and music as usual
2. Click "Compose Video"
3. Text overlays will be applied to each clip during processing

## Technical Details

### Frontend Changes
**File**: `/app/app/dashboard/tools/story-reels/page.js`

1. **SortableVideoItem Component** (Lines 40-135):
   - Added `showTextInput` state for toggling text editor
   - Added text input field and position dropdown
   - Added green badge indicator when text is present
   - Added `onTextChange` prop

2. **State Handler** (Lines 570-582):
   ```javascript
   const handleTextOverlayChange = (index, field, value) => {
     setStockVideos(prev => prev.map((video, i) => {
       if (i === index) {
         return {
           ...video,
           textOverlay: { ...video.textOverlay, [field]: value }
         }
       }
       return video
     }))
   }
   ```

3. **FormData Updates** (Lines 1007-1011, 1130-1134):
   ```javascript
   formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ 
     index: i, 
     isCustom: !!v.isCustom,
     textOverlay: v.textOverlay || null  // ← New field
   }))))
   ```

### Backend Changes
**File**: `/app/app/api/story-reels/compose/route.js`

**Normalization Step** (Lines 406-465):
```javascript
// Extract text overlay from videoOrder
const orderInfo = videoOrder[i]
const textOverlay = orderInfo?.textOverlay

// Build video filter with optional text overlay
let videoFilter = `scale=${targetWidth}:${targetHeight}:...`

if (textOverlay && textOverlay.text) {
  const text = textOverlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:")
  const position = textOverlay.position || 'top'
  const fontSize = parseInt(targetHeight) >= 1920 ? 72 : 56
  
  // Position mapping
  let yPosition
  if (position === 'top') {
    yPosition = '100'
  } else if (position === 'center') {
    yPosition = '(h-text_h)/2'
  } else { // bottom
    yPosition = 'h-text_h-100'
  }
  
  // Add drawtext filter
  videoFilter += `,drawtext=text='${text}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${yPosition}:borderw=4:bordercolor=black`
}

cmd.outputOptions(['-vf', videoFilter, ...])
```

## Text Styling Specifications

### Font Size
- **1920p+**: 72px
- **Lower resolutions**: 56px
- Automatically adapts to target video resolution

### Text Color
- **Foreground**: White (`fontcolor=white`)
- **Outline**: 4px black border (`borderw=4:bordercolor=black`)
- High contrast, readable on any background

### Position Options
- **Top**: 100px from top edge
- **Center**: Vertically centered `(h-text_h)/2`
- **Bottom**: 100px from bottom edge

### Text Alignment
- Horizontally centered: `x=(w-text_w)/2`

## Use Cases

### Product Reviews
- Add product name at top of product image clips
- Add "Buy Now" CTA at bottom
- Add price or discount info

### Story Reels
- Add chapter titles
- Add location names
- Add call-to-actions

### Marketing Videos
- Add brand name
- Add promotional text
- Add social media handles

## Limitations & Future Enhancements

### Current Limitations
1. Single text per clip
2. Fixed white text with black outline
3. No custom fonts
4. No animations

### Future Enhancements (Not Implemented)
- Multiple text layers per clip
- Custom text colors and fonts
- Text animations (fade in/out, slide)
- Custom font sizes
- Background boxes/highlights
- Text duration control (show for portion of clip)

## Testing

### Manual Testing Steps
1. Go to Story Reels or Product Review tool
2. Add some clips (images or videos)
3. Click "Add Text" on first clip
4. Enter "Test Text" and select "Top"
5. Click "Add Text" on second clip
6. Enter "Buy Now!" and select "Bottom"
7. Generate video
8. Verify text appears on correct clips at correct positions

### Expected Behavior
- Text overlay UI appears when "Add Text" is clicked
- Green badge shows on clips with text
- Text persists when reordering clips (drag and drop)
- Text is removed if input is cleared
- Final video shows text overlays at specified positions

## Performance Impact
- **Minimal**: Text overlay adds negligible processing time
- FFmpeg drawtext filter is highly optimized
- No additional encoding passes required
- Text applied during existing normalization step

## Browser Compatibility
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard HTML input and select elements
- No special browser features required
