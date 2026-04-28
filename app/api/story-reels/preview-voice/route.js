import { NextResponse } from 'next/server'
import textToSpeech from '@google-cloud/text-to-speech'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir, stat } from 'fs/promises'
import path from 'path'

// Cache for voice previews
const voicePreviewCache = new Map()

// Sample phrases for voice preview
const SAMPLE_PHRASES = {
  en: [
    "Hello! This is how I sound. I can narrate your videos with this voice.",
    "Welcome to the video studio. Let me show you how this voice sounds.",
    "Hey there! Ready to create amazing content together?",
  ],
  bn: [
    "হ্যালো! এইভাবেই আমার কন্ঠস্বর শোনায়।",
    "স্বাগতম! আমি আপনার ভিডিওতে বর্ণনা করতে পারি।",
  ]
}

// Standard fallback voices when premium voices fail preview
const FALLBACK_VOICES = {
  'en-FEMALE': 'en-US-Neural2-C',
  'en-MALE': 'en-US-Neural2-D',
  'bn-FEMALE': 'bn-IN-Standard-A',
  'bn-MALE': 'bn-IN-Standard-B',
}

async function generateTTS(client, voiceName, languageCode, sampleText) {
  const ttsRequest = {
    input: { text: sampleText },
    voice: { 
      languageCode: languageCode,
      name: voiceName 
    },
    audioConfig: { 
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0,
    },
  }

  const [response] = await client.synthesizeSpeech(ttsRequest)
  return response
}

export async function POST(request) {
  try {
    const { voiceName, languageCode } = await request.json()
    
    if (!voiceName || !languageCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Voice name and language code required' 
      }, { status: 400 })
    }
    
    // Check cache first
    const cacheKey = `${voiceName}_${languageCode}`
    if (voicePreviewCache.has(cacheKey)) {
      const cachedUrl = voicePreviewCache.get(cacheKey)
      const publicPath = path.join(process.cwd(), 'public', cachedUrl)
      try {
        await stat(publicPath)
        return NextResponse.json({ success: true, audioUrl: cachedUrl })
      } catch {
        voicePreviewCache.delete(cacheKey)
      }
    }
    
    // Initialize TTS client
    const client = new textToSpeech.TextToSpeechClient()
    
    // Get sample text
    const langBase = languageCode.split('-')[0] || 'en'
    const phrases = SAMPLE_PHRASES[langBase] || SAMPLE_PHRASES.en
    const sampleText = phrases[Math.floor(Math.random() * phrases.length)]

    let response
    
    // Try generating with the requested voice first
    try {
      response = await generateTTS(client, voiceName, languageCode, sampleText)
    } catch (primaryError) {
      console.log(`Primary voice "${voiceName}" failed: ${primaryError.message}. Trying fallback...`)
      
      // Determine gender from voice name for better fallback matching
      // Chirp3-HD voices don't have obvious gender markers, so detect from the list
      const isMale = voiceName.toLowerCase().includes('male') || 
                     /-(A|B|D|F|H|J)$/.test(voiceName) ||
                     voiceName.includes('Standard-B') || voiceName.includes('Standard-D')
      const gender = isMale ? 'MALE' : 'FEMALE'
      const fallbackKey = `${langBase}-${gender}`
      const fallbackVoice = FALLBACK_VOICES[fallbackKey] || FALLBACK_VOICES['en-FEMALE']
      
      try {
        response = await generateTTS(client, fallbackVoice, languageCode, sampleText)
        console.log(`Fallback voice "${fallbackVoice}" worked`)
      } catch (fallbackError) {
        // Last resort: try basic standard voice
        try {
          response = await generateTTS(client, 'en-US-Standard-C', 'en-US', sampleText)
        } catch (lastError) {
          throw new Error(`Voice preview unavailable. Please select a different voice.`)
        }
      }
    }
    
    if (!response.audioContent) {
      throw new Error('No audio content generated')
    }
    
    // Save to public folder
    const previewDir = path.join(process.cwd(), 'public', 'voice-previews')
    await mkdir(previewDir, { recursive: true })
    
    const fileName = `${voiceName.replace(/[^a-zA-Z0-9]/g, '-')}-${uuidv4().slice(0,8)}.mp3`
    const filePath = path.join(previewDir, fileName)
    
    await writeFile(filePath, response.audioContent, 'binary')
    
    const audioUrl = `/voice-previews/${fileName}`
    
    // Cache the result
    voicePreviewCache.set(cacheKey, audioUrl)
    
    // Clean old cache entries (keep max 50)
    if (voicePreviewCache.size > 50) {
      const firstKey = voicePreviewCache.keys().next().value
      voicePreviewCache.delete(firstKey)
    }
    
    return NextResponse.json({ success: true, audioUrl })
    
  } catch (error) {
    console.error('Voice preview error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate voice preview' 
    }, { status: 500 })
  }
}

// GET method to check if preview exists
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const voiceName = searchParams.get('voiceName')
  const languageCode = searchParams.get('languageCode')
  
  if (!voiceName || !languageCode) {
    return NextResponse.json({ exists: false })
  }
  
  const cacheKey = `${voiceName}_${languageCode}`
  if (voicePreviewCache.has(cacheKey)) {
    return NextResponse.json({ 
      exists: true, 
      audioUrl: voicePreviewCache.get(cacheKey) 
    })
  }
  
  return NextResponse.json({ exists: false })
}
