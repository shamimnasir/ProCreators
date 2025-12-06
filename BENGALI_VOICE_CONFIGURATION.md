# Bengali Voice Configuration for ElevenLabs TTS

## Overview
This document explains how to configure and optimize Bengali (Bangladeshi accent) voices for the Story Video Reels feature using ElevenLabs TTS.

## Current Configuration

### Voice Settings (Optimized for Bengali)
```javascript
{
  stability: 0.5,              // Moderate for natural variation
  similarity_boost: 0.75,      // High to maintain voice character
  style: 0.3,                  // Moderate expressiveness
  use_speaker_boost: true      // Enhanced clarity
}
```

### Model Used
- **eleven_multilingual_v2** - Best support for Bengali language with natural pronunciation

### Default Voice Mapping
Located in: `/app/app/api/story-reels/compose/route.js` (lines ~131-139)

```javascript
const bengaliVoiceMap = {
  'female-1': 'Xb7hH8MSUJpSbSDYk0k2', // Rachel - Natural, Expressive
  'female-2': 'EXAVITQu4vr4xnSDxMaL', // Sarah - Soft, Calm
  'male-1': 'pNInz6obpgDQGcFmaJgB',   // Adam - Clear, Professional
  'male-2': 'TxGEqnHWrfWFTfGW9XjX',   // Josh - Deep, Storytelling
}
```

## How to Find Bengali-Specific Voice IDs

### Method 1: Using ElevenLabs Web Interface

1. **Log in to ElevenLabs**
   - Visit: https://elevenlabs.io
   - Log in to your account

2. **Go to Text to Speech**
   - Navigate to the TTS tool

3. **Filter for Bengali Voices**
   - Enter Bengali text in the input box
   - Click on the voice selector dropdown
   - Browse the Voice Library
   - Look for voices labeled "Bengali", "Bangla", or "Bangladeshi"

4. **Get the Voice ID**
   - Select a Bengali voice
   - The Voice ID appears in the URL or voice settings
   - Copy the ID (format: `xxXxXxXxXxXxXxXxXxXx`)

### Method 2: Using the API (Programmatic)

Create a test script to list all voices:

```javascript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const elevenlabs = new ElevenLabsClient({
  apiKey: 'YOUR_API_KEY'
})

async function listBengaliVoices() {
  try {
    const voices = await elevenlabs.voices.getAll()
    
    // Filter for multilingual voices (work with Bengali)
    const bengaliVoices = voices.voices.filter(v => 
      v.labels?.language?.includes('Bengali') ||
      v.labels?.language?.includes('multi') ||
      v.name.toLowerCase().includes('bengali')
    )
    
    console.log('Available Bengali/Multilingual Voices:')
    bengaliVoices.forEach(voice => {
      console.log(`Name: ${voice.name}`)
      console.log(`Voice ID: ${voice.voice_id}`)
      console.log(`Labels:`, voice.labels)
      console.log('---')
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

listBengaliVoices()
```

## Updating Voice IDs

### Step 1: Get Your Bengali Voice IDs
Use one of the methods above to find voice IDs that work well with Bengali.

### Step 2: Update the Voice Map
Edit `/app/app/api/story-reels/compose/route.js`:

```javascript
const bengaliVoiceMap = {
  'female-1': 'YOUR_BENGALI_FEMALE_ID_1',
  'female-2': 'YOUR_BENGALI_FEMALE_ID_2',
  'male-1': 'YOUR_BENGALI_MALE_ID_1',
  'male-2': 'YOUR_BENGALI_MALE_ID_2',
}
```

### Step 3: Test the Voices
1. Restart the Next.js server:
   ```bash
   sudo supervisorctl restart nextjs
   ```

2. Test each voice with Bengali text
3. Adjust voice settings if needed

## Advanced: Voice Cloning for Custom Bengali Voices

If you want to create custom Bengali voices:

1. **Record Voice Sample**
   - Record 30 seconds of clear Bengali speech
   - Use native Bangladeshi speaker

2. **Upload to ElevenLabs**
   - Go to Voice Lab → Add Voice
   - Upload your recording
   - ElevenLabs will create a custom voice ID

3. **Add to Voice Map**
   - Get the new voice ID
   - Add it to the `bengaliVoiceMap` in the code

## Testing Different Models

You can test different ElevenLabs models for Bengali:

### Available Models:
- `eleven_multilingual_v2` (Current) - Best balance
- `eleven_turbo_v2` - Faster, good quality
- `eleven_turbo_v2_5` - Latest, most natural
- `eleven_multilingual_v1` - Older, still works

### To Change Model:
Edit line ~162 in `/app/app/api/story-reels/compose/route.js`:

```javascript
model_id: 'eleven_turbo_v2_5', // Try different models
```

## Voice Settings Tuning

Adjust these parameters in the code for different effects:

### For More Natural Speech:
```javascript
{
  stability: 0.3,              // Lower = more expressive
  similarity_boost: 0.8,       // Higher = more consistent
  style: 0.5,                  // Higher = more dramatic
  use_speaker_boost: true
}
```

### For Professional Narration:
```javascript
{
  stability: 0.7,              // Higher = more controlled
  similarity_boost: 0.6,       // Balanced
  style: 0.2,                  // Lower = more neutral
  use_speaker_boost: true
}
```

### For Storytelling:
```javascript
{
  stability: 0.4,              // Natural variation
  similarity_boost: 0.75,      // Maintain character
  style: 0.6,                  // More expressive
  use_speaker_boost: true
}
```

## Language Code

The system uses `bn` as the language code for Bengali. This is set automatically when you select "বাংলা (Bangla)" in the UI.

## Troubleshooting

### Issue: Voice doesn't sound Bengali
- **Solution**: Make sure you're using a multilingual voice ID
- Try different voices from the Voice Library
- Verify the language code is set to `bn`

### Issue: Audio quality is poor
- **Solution**: Adjust voice settings (increase `similarity_boost`)
- Try `eleven_turbo_v2_5` model
- Ensure your ElevenLabs plan supports high-quality audio

### Issue: Voice is too robotic
- **Solution**: Lower `stability` (try 0.3-0.4)
- Increase `style` (try 0.4-0.6)
- Try different voice IDs

## Resources

- **ElevenLabs Documentation**: https://elevenlabs.io/docs
- **Voice Library**: https://elevenlabs.io/voice-library
- **Supported Languages**: https://help.elevenlabs.io/hc/en-us/articles/13313366263441
- **Bengali TTS Info**: https://elevenlabs.io/text-to-speech/bengali

## Notes

- All multilingual voices support Bengali, but some perform better than others
- Test multiple voices to find the best match for Bangladeshi accent
- Voice quality depends on your ElevenLabs subscription tier
- The current voice IDs are multilingual voices that work with Bengali but aren't specifically Bengali voices
- For best results, use Bengali-specific voices from the Voice Library when available
