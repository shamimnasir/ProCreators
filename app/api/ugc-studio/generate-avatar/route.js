import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { generateImage } from '@/lib/gemini-image'
import { connectToDatabase } from '@/lib/mongodb'
import { withCredits } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// =====================================================
// UGC STUDIO — AI AVATAR GENERATOR
// =====================================================
// POST: Generate a realistic, natural-looking AI avatar from a prompt
// Uses Nano Banana Pro for high-quality portrait generation
// Cost: 15 credits (ugc-avatar-generate)

// Backend system prompt to ensure realistic, natural portraits
const AVATAR_SYSTEM_PROMPT = `Candid phone selfie of a real person, half-body shot showing head shoulders and hands, casual everyday clothes like t-shirt or hoodie, natural imperfect skin, minimal or no makeup, slightly messy natural hair, relaxed expression as if about to talk to camera, real bedroom or kitchen background, natural window light, phone camera quality, not model-like, authentic and relatable, real person`

// Demographic/style presets for quick generation
// Each preset declares an inferred `gender` for downstream auto voice-matching.
const AVATAR_PRESETS = {
  'custom': { name: 'Custom Description', promptPrefix: '', gender: null },
  'young-female-casual': {
    name: 'Young Woman - Casual',
    promptPrefix: 'A young woman in her mid-20s with a warm friendly smile, casual outfit, natural makeup',
    gender: 'female'
  },
  'young-male-casual': {
    name: 'Young Man - Casual',
    promptPrefix: 'A young man in his mid-20s with a confident friendly expression, casual shirt',
    gender: 'male'
  },
  'professional-female': {
    name: 'Professional Woman',
    promptPrefix: 'A professional woman in her early 30s, business attire, confident and approachable expression',
    gender: 'female'
  },
  'professional-male': {
    name: 'Professional Man',
    promptPrefix: 'A professional man in his early 30s, business suit, confident and approachable expression',
    gender: 'male'
  },
  'mature-female': {
    name: 'Mature Woman',
    promptPrefix: 'A mature woman in her 40s-50s with an elegant, trustworthy appearance, well-dressed',
    gender: 'female'
  },
  'mature-male': {
    name: 'Mature Man',
    promptPrefix: 'A mature man in his 40s-50s with a distinguished, trustworthy appearance, well-dressed',
    gender: 'male'
  },
  'diverse-young': {
    name: 'Young & Diverse',
    promptPrefix: 'A young person in their early 20s with a vibrant, energetic expression, trendy casual clothing',
    gender: null
  },
  'influencer-style': {
    name: 'Influencer / Creator',
    promptPrefix: 'A social media influencer with a charismatic and expressive face, trendy outfit, ring light reflection in eyes',
    gender: null
  }
}

// Heuristic — infer gender from a free-form custom prompt (used when preset = 'custom')
function inferGenderFromText(text = '') {
  const t = (text || '').toLowerCase()
  const female = /\b(woman|female|girl|she|her|lady|mom|mother|daughter|wife|sister|aunt|grandma|grandmother)\b/.test(t)
  const male   = /\b(man|male|boy|he|his|him|guy|dad|father|son|husband|brother|uncle|grandpa|grandfather)\b/.test(t)
  if (female && !male) return 'female'
  if (male && !female) return 'male'
  return null
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      prompt = '',
      preset = 'custom',
      name = 'AI Avatar',
      additionalDetails = ''
    } = body

    // Get preset prompt or use custom
    const presetConfig = AVATAR_PRESETS[preset] || AVATAR_PRESETS['custom']
    const userPrompt = preset === 'custom' ? prompt : presetConfig.promptPrefix

    if (!userPrompt || userPrompt.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a description for your avatar or select a preset'
      }, { status: 400 })
    }

    // Combine user prompt with system prompt for realistic results
    const fullPrompt = `${userPrompt}${additionalDetails ? ', ' + additionalDetails : ''}, ${AVATAR_SYSTEM_PROMPT}`

    // Use withCredits wrapper for automatic credit management
    const creditResult = await withCredits(request, 'ugc-avatar-generate', async () => {
      // Generate the image
      const result = await generateImage(fullPrompt)

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate avatar image')
      }

      // Download and save the image locally
      let localUrl = result.imageUrl

      // If the image is a base64 data URL or external URL, save it locally
      if (result.imageUrl.startsWith('data:') || result.imageUrl.startsWith('http')) {
        const avatarDir = path.join(process.cwd(), 'public', 'uploads', 'ai-avatars')
        await mkdir(avatarDir, { recursive: true })

        const avatarId = uuidv4()
        const filename = `ai-${avatarId}.png`
        const filepath = path.join(avatarDir, filename)

        if (result.imageUrl.startsWith('data:')) {
          // Base64 data URL
          const base64Data = result.imageUrl.replace(/^data:image\/\w+;base64,/, '')
          await writeFile(filepath, Buffer.from(base64Data, 'base64'))
        } else {
          // External URL - download it
          const imgResponse = await fetch(result.imageUrl)
          if (imgResponse.ok) {
            const buffer = Buffer.from(await imgResponse.arrayBuffer())
            await writeFile(filepath, buffer)
          }
        }

        localUrl = `/uploads/ai-avatars/${filename}`
      }

      // Save as UGC avatar in database
      const { db } = await connectToDatabase()

      // Check avatar limit
      const count = await db.collection('ugc_avatars').countDocuments({ userId: auth.userId })
      if (count >= 20) {
        return {
          imageUrl: localUrl,
          savedAsAvatar: false,
          message: 'Avatar generated but not saved (limit reached). Delete some avatars first.'
        }
      }

      const avatar = {
        _id: uuidv4(),
        userId: auth.userId,
        name: name.trim().slice(0, 50) || 'AI Avatar',
        imageUrl: localUrl,
        type: 'generated',
        description: (preset === 'custom' ? prompt : presetConfig.name).slice(0, 200),
        gender: presetConfig.gender || inferGenderFromText(prompt) || null,
        usageCount: 0,
        createdAt: new Date()
      }

      await db.collection('ugc_avatars').insertOne(avatar)

      return {
        imageUrl: localUrl,
        avatar,
        savedAsAvatar: true
      }
    })

    if (!creditResult.success) {
      return creditResult.response
    }

    return NextResponse.json({
      success: true,
      imageUrl: creditResult.result.imageUrl,
      avatar: creditResult.result.avatar || null,
      savedAsAvatar: creditResult.result.savedAsAvatar,
      creditsUsed: creditResult.creditsUsed,
      remainingCredits: creditResult.remainingCredits,
      message: creditResult.result.message || 'AI avatar generated successfully!'
    })

  } catch (error) {
    console.error('AI Avatar generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate AI avatar'
    }, { status: 500 })
  }
}

// GET: Return available presets
export async function GET() {
  return NextResponse.json({
    success: true,
    presets: Object.entries(AVATAR_PRESETS).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.promptPrefix || 'Describe your ideal avatar'
    })),
    creditCost: 15
  })
}
