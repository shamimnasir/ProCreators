import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import textToSpeech from '@google-cloud/text-to-speech'

// =====================================================
// UGC STUDIO — AUDIO (TTS) GENERATOR
// =====================================================
// POST: Generate audio from text using Google Cloud TTS
// Returns a URL to the generated audio file

// Voice presets organized by language → gender → style.
// All voices are Google Cloud Neural2 / Studio voices (high quality).
// Language codes match the actual voice's region (US American / British / Australian / etc.)
const VOICE_PRESETS = {
  // ============ ENGLISH (US) — DEFAULT ============
  'en-US-female-casual':       { name: 'en-US-Neural2-F', languageCode: 'en-US', speakingRate: 1.0,  pitch: 0.5,  language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Casual' },
  'en-US-female-professional': { name: 'en-US-Neural2-C', languageCode: 'en-US', speakingRate: 0.95, pitch: 0,    language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Professional' },
  'en-US-female-excited':      { name: 'en-US-Neural2-H', languageCode: 'en-US', speakingRate: 1.1,  pitch: 1.0,  language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Excited' },
  'en-US-male-casual':         { name: 'en-US-Neural2-D', languageCode: 'en-US', speakingRate: 1.0,  pitch: -0.5, language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Casual' },
  'en-US-male-professional':   { name: 'en-US-Neural2-J', languageCode: 'en-US', speakingRate: 0.95, pitch: -1.0, language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Professional' },
  'en-US-male-energetic':      { name: 'en-US-Neural2-A', languageCode: 'en-US', speakingRate: 1.1,  pitch: 0,    language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Energetic' },

  // ============ ENGLISH (UK) ============
  'en-GB-female-casual':       { name: 'en-GB-Neural2-A', languageCode: 'en-GB', speakingRate: 0.95, pitch: 0,    language: 'en-GB', gender: 'female', label: '🇬🇧 UK Female — Casual' },
  'en-GB-female-professional': { name: 'en-GB-Neural2-C', languageCode: 'en-GB', speakingRate: 0.95, pitch: 0.5,  language: 'en-GB', gender: 'female', label: '🇬🇧 UK Female — Professional' },
  'en-GB-male-casual':         { name: 'en-GB-Neural2-B', languageCode: 'en-GB', speakingRate: 0.95, pitch: -0.5, language: 'en-GB', gender: 'male',   label: '🇬🇧 UK Male — Casual' },
  'en-GB-male-professional':   { name: 'en-GB-Neural2-D', languageCode: 'en-GB', speakingRate: 0.92, pitch: -0.5, language: 'en-GB', gender: 'male',   label: '🇬🇧 UK Male — Professional' },

  // ============ ENGLISH (AU) ============
  'en-AU-female-casual':       { name: 'en-AU-Neural2-A', languageCode: 'en-AU', speakingRate: 1.0,  pitch: 0.5,  language: 'en-AU', gender: 'female', label: '🇦🇺 AU Female — Casual' },
  'en-AU-female-professional': { name: 'en-AU-Neural2-C', languageCode: 'en-AU', speakingRate: 0.95, pitch: 0,    language: 'en-AU', gender: 'female', label: '🇦🇺 AU Female — Professional' },
  'en-AU-male-casual':         { name: 'en-AU-Neural2-B', languageCode: 'en-AU', speakingRate: 1.0,  pitch: -0.5, language: 'en-AU', gender: 'male',   label: '🇦🇺 AU Male — Casual' },
  'en-AU-male-professional':   { name: 'en-AU-Neural2-D', languageCode: 'en-AU', speakingRate: 0.95, pitch: -0.5, language: 'en-AU', gender: 'male',   label: '🇦🇺 AU Male — Professional' },

  // ============ SPANISH ============
  'es-ES-female-casual':       { name: 'es-ES-Neural2-A', languageCode: 'es-ES', speakingRate: 1.0,  pitch: 0.5,  language: 'es-ES', gender: 'female', label: '🇪🇸 Spanish Female — Casual' },
  'es-ES-male-casual':         { name: 'es-ES-Neural2-B', languageCode: 'es-ES', speakingRate: 1.0,  pitch: -0.5, language: 'es-ES', gender: 'male',   label: '🇪🇸 Spanish Male — Casual' },
  'es-US-female-casual':       { name: 'es-US-Neural2-A', languageCode: 'es-US', speakingRate: 1.0,  pitch: 0.5,  language: 'es-US', gender: 'female', label: '🇲🇽 Latin American Spanish Female' },
  'es-US-male-casual':         { name: 'es-US-Neural2-B', languageCode: 'es-US', speakingRate: 1.0,  pitch: -0.5, language: 'es-US', gender: 'male',   label: '🇲🇽 Latin American Spanish Male' },

  // ============ FRENCH ============
  'fr-FR-female-casual':       { name: 'fr-FR-Neural2-A', languageCode: 'fr-FR', speakingRate: 1.0,  pitch: 0.5,  language: 'fr-FR', gender: 'female', label: '🇫🇷 French Female — Casual' },
  'fr-FR-male-casual':         { name: 'fr-FR-Neural2-B', languageCode: 'fr-FR', speakingRate: 1.0,  pitch: -0.5, language: 'fr-FR', gender: 'male',   label: '🇫🇷 French Male — Casual' },

  // ============ GERMAN ============
  'de-DE-female-casual':       { name: 'de-DE-Neural2-A', languageCode: 'de-DE', speakingRate: 1.0,  pitch: 0.5,  language: 'de-DE', gender: 'female', label: '🇩🇪 German Female — Casual' },
  'de-DE-male-casual':         { name: 'de-DE-Neural2-B', languageCode: 'de-DE', speakingRate: 1.0,  pitch: -0.5, language: 'de-DE', gender: 'male',   label: '🇩🇪 German Male — Casual' },

  // ============ HINDI ============
  'hi-IN-female-casual':       { name: 'hi-IN-Neural2-A', languageCode: 'hi-IN', speakingRate: 1.0,  pitch: 0.5,  language: 'hi-IN', gender: 'female', label: '🇮🇳 Hindi Female — Casual' },
  'hi-IN-male-casual':         { name: 'hi-IN-Neural2-B', languageCode: 'hi-IN', speakingRate: 1.0,  pitch: -0.5, language: 'hi-IN', gender: 'male',   label: '🇮🇳 Hindi Male — Casual' },

  // ============ BENGALI ============
  'bn-IN-female-casual':       { name: 'bn-IN-Wavenet-A', languageCode: 'bn-IN', speakingRate: 1.0,  pitch: 0.5,  language: 'bn-IN', gender: 'female', label: '🇧🇩 Bengali Female — Casual' },
  'bn-IN-male-casual':         { name: 'bn-IN-Wavenet-B', languageCode: 'bn-IN', speakingRate: 1.0,  pitch: -0.5, language: 'bn-IN', gender: 'male',   label: '🇧🇩 Bengali Male — Casual' },

  // ============ ARABIC ============
  'ar-XA-female-casual':       { name: 'ar-XA-Wavenet-A', languageCode: 'ar-XA', speakingRate: 1.0,  pitch: 0.5,  language: 'ar-XA', gender: 'female', label: '🇸🇦 Arabic Female — Casual' },
  'ar-XA-male-casual':         { name: 'ar-XA-Wavenet-B', languageCode: 'ar-XA', speakingRate: 1.0,  pitch: -0.5, language: 'ar-XA', gender: 'male',   label: '🇸🇦 Arabic Male — Casual' },

  // ============ LEGACY ALIASES (backwards compat) ============
  'female-casual':       { name: 'en-US-Neural2-F', languageCode: 'en-US', speakingRate: 1.0,  pitch: 0.5,  language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Casual' },
  'female-professional': { name: 'en-US-Neural2-C', languageCode: 'en-US', speakingRate: 0.95, pitch: 0,    language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Professional' },
  'female-excited':      { name: 'en-US-Neural2-H', languageCode: 'en-US', speakingRate: 1.1,  pitch: 1.0,  language: 'en-US', gender: 'female', label: '🇺🇸 US Female — Excited' },
  'male-casual':         { name: 'en-US-Neural2-D', languageCode: 'en-US', speakingRate: 1.0,  pitch: -0.5, language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Casual' },
  'male-professional':   { name: 'en-US-Neural2-J', languageCode: 'en-US', speakingRate: 0.95, pitch: -1.0, language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Professional' },
  'male-energetic':      { name: 'en-US-Neural2-A', languageCode: 'en-US', speakingRate: 1.1,  pitch: 0,    language: 'en-US', gender: 'male',   label: '🇺🇸 US Male — Energetic' },
  'british-female':      { name: 'en-GB-Neural2-A', languageCode: 'en-GB', speakingRate: 0.95, pitch: 0,    language: 'en-GB', gender: 'female', label: '🇬🇧 UK Female — Casual' },
  'british-male':        { name: 'en-GB-Neural2-B', languageCode: 'en-GB', speakingRate: 0.95, pitch: -0.5, language: 'en-GB', gender: 'male',   label: '🇬🇧 UK Male — Casual' },
}

// Build structured response for the picker UI
function getVoicePresetsList() {
  return Object.entries(VOICE_PRESETS)
    .filter(([key]) => key.includes('-'))   // drop legacy short keys from listing
    .filter(([key]) => key.split('-').length >= 4) // only "lang-region-gender-style" format
    .map(([id, val]) => ({
      id,
      name: val.label,
      language: val.language,
      gender: val.gender
    }))
}

function textToSSML(text, emotion = '') {
  // Clean text of emotion tags and B-roll cues
  let cleanText = text
    .replace(/\[.*?\]/g, '') // Remove emotion tags
    .replace(/\{.*?\}/g, '') // Remove B-roll cues
    .trim()
  
  // Convert natural pause markers to SSML breaks
  cleanText = cleanText
    .replace(/\.\.\./g, '<break time="400ms"/>') // ... → pause
    .replace(/—/g, '<break time="300ms"/>')       // em-dash → pause
    .replace(/\bum\b/gi, 'um<break time="200ms"/>')
    .replace(/\blike\b,/gi, 'like,<break time="150ms"/>')
    .replace(/\byou know\b/gi, 'you know<break time="200ms"/>')

  let ssml = '<speak>'
  
  // Raw UGC delivery — slightly varied rate, natural imperfection
  if (emotion === 'excited' || emotion === 'surprised') {
    ssml += `<prosody rate="105%" pitch="+1st">${cleanText}</prosody>`
  } else if (emotion === 'whispering') {
    ssml += `<prosody volume="soft" rate="90%">${cleanText}</prosody>`
  } else if (emotion === 'urgent') {
    ssml += `<prosody rate="110%" pitch="+0.5st">${cleanText}</prosody>`
  } else if (emotion === 'emotional' || emotion === 'genuine') {
    ssml += `<prosody rate="92%" pitch="-0.5st">${cleanText}</prosody>`
  } else if (emotion === 'skeptical') {
    ssml += `<prosody rate="95%" pitch="-1st">${cleanText}</prosody>`
  } else if (emotion === 'thinking' || emotion === 'pause') {
    ssml += `<break time="500ms"/><prosody rate="90%">${cleanText}</prosody>`
  } else if (emotion === 'laughing') {
    ssml += `<prosody rate="105%" pitch="+1.5st">${cleanText}</prosody>`
  } else {
    // Default casual delivery — slightly relaxed pace
    ssml += `<prosody rate="97%">${cleanText}</prosody>`
  }
  
  ssml += '</speak>'
  return ssml
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      text,
      voicePreset = 'female-casual',
      emotion = '',
      segmentId = null
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    if (text.length > 2000) {
      return NextResponse.json({ success: false, error: 'Text too long (max 2000 characters)' }, { status: 400 })
    }

    const voiceConfig = VOICE_PRESETS[voicePreset] || VOICE_PRESETS['female-casual']

    // Create output directory
    const outputDir = path.join(process.cwd(), 'public', 'ugc-audio')
    await mkdir(outputDir, { recursive: true })

    const audioId = uuidv4()
    const filename = `${audioId}.mp3`
    const filepath = path.join(outputDir, filename)

    // Generate TTS with Google Cloud
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })

    const ssml = textToSSML(text, emotion)

    const ttsRequest = {
      input: { ssml },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: voiceConfig.speakingRate,
        pitch: voiceConfig.pitch,
        volumeGainDb: 0.0,
      },
    }

    const [response] = await client.synthesizeSpeech(ttsRequest)

    // Write the audio content to file
    await writeFile(filepath, response.audioContent, 'binary')

    const audioUrl = `/ugc-audio/${filename}`

    return NextResponse.json({
      success: true,
      audio: {
        id: audioId,
        url: audioUrl,
        segmentId,
        voicePreset,
        language: voiceConfig.language || voiceConfig.languageCode,
        gender: voiceConfig.gender || null,
        textLength: text.length
      },
      voicePresets: getVoicePresetsList()
    })

  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate audio' }, { status: 500 })
  }
}

// GET: Return available voice presets, grouped + flat
export async function GET() {
  const list = getVoicePresetsList()
  // Group by language for the picker UI
  const grouped = list.reduce((acc, v) => {
    if (!acc[v.language]) acc[v.language] = []
    acc[v.language].push(v)
    return acc
  }, {})
  return NextResponse.json({
    success: true,
    voicePresets: list,
    voicePresetsByLanguage: grouped,
    languages: Object.keys(grouped)
  })
}
