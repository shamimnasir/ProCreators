import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'
import { 
  generateConsistentVideoClips, 
  isFalConfigured,
  generateKlingClip
} from '@/lib/services'

export const maxDuration = 300 // 5 minutes timeout for video generation

// Video generation input schema
const videoGenerationSchema = z.object({
  script: z.string().min(1, 'Script is required').max(5000, 'Script too long'),
  mode: z.enum(['budget', 'fast', 'pro']).default('budget'),
  duration: z.number().int().min(5).max(300).optional(),
  language: z.string().max(50).optional(),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'facebook']).default('instagram'),
  image: z.string().url().max(5000).optional().or(z.string().max(100000).optional()), // URL or base64
  consistencyMode: z.enum(['none', 'seed', 'frame-chain']).default('none')
})

// Mode to consistency and quality mapping
const MODE_CONFIG = {
  budget: { 
    consistencyMode: 'none', 
    name: 'Budget Mode',
    description: 'Fast generation with Kling',
    time: '30-60 seconds'
  },
  fast: { 
    consistencyMode: 'seed', 
    name: 'Fast Mode',
    description: 'Good quality with seed-based consistency',
    time: '1-2 minutes'
  },
  pro: { 
    consistencyMode: 'frame-chain', 
    name: 'Pro Mode',
    description: 'Best quality with frame-chain consistency',
    time: '2-5 minutes'
  }
}

export async function POST(request) {
  const jobId = randomUUID()
  
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    
    // SECURITY: Validate input with Zod schema
    const validation = validateRequest(videoGenerationSchema, body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { script, mode, duration = 15, language, platform, image, consistencyMode: requestedConsistency } = validation.data

    // Platform-specific configurations
    const platformConfig = {
      instagram: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 90, name: 'Instagram Reels' },
      tiktok: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 60, name: 'TikTok' },
      youtube: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 60, name: 'YouTube Shorts' },
      facebook: { aspectRatio: '9:16', orientation: 'portrait', maxDuration: 90, name: 'Facebook Reels' }
    }
    
    const targetPlatform = platformConfig[platform] || platformConfig.instagram
    const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.budget
    
    // Check if Fal.ai (Kling) is configured
    if (!isFalConfigured()) {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: 'Video generation service not configured',
        message: 'AI video generation service is not configured. Please contact support.',
        mode,
        jobId
      }, { status: 503 })
    }


    // Determine consistency mode (use mode's default or explicit request)
    const consistencyMode = requestedConsistency !== 'none' ? requestedConsistency : modeConfig.consistencyMode
    
    // Cap duration based on platform
    const effectiveDuration = Math.min(duration, targetPlatform.maxDuration)
    
    try {
      // Check if we have an input image (image-to-video mode)
      if (image) {
        
        // Single clip generation with image
        const clip = await generateKlingClip({
          prompt: script.substring(0, 500),
          aspectRatio: targetPlatform.aspectRatio,
          duration: '5',
          imageUrl: image,
          jobId
        })
        
        return NextResponse.json({
          success: true,
          status: 'completed',
          message: `${modeConfig.name} - Video generated successfully`,
          estimatedTime: modeConfig.time,
          videoUrl: clip.url,
          jobId,
          provider: 'Kling (Fal.ai)',
          mode,
          language,
          platform: targetPlatform.name,
          clips: [clip]
        })
      }
      
      // Text-to-video mode with consistency
      
      const result = await generateConsistentVideoClips({
        script,
        duration: effectiveDuration,
        aspectRatio: targetPlatform.aspectRatio,
        consistencyMode,
        characterDescription: null, // Auto-extract from script
        jobId,
        onProgress: (progress) => {
        }
      })
      
      // If multiple clips, return the first one (or we could merge them)
      const primaryVideo = result.clips[0]
      
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: `${modeConfig.name} - ${result.clips.length} clip(s) generated with ${consistencyMode} consistency`,
        estimatedTime: modeConfig.time,
        videoUrl: primaryVideo.url,
        jobId,
        provider: 'Kling (Fal.ai)',
        mode,
        language,
        platform: targetPlatform.name,
        consistencyMode,
        characterDescription: result.characterDescription,
        seed: result.seed,
        clips: result.clips.map(c => ({
          url: c.url,
          model: c.model,
          frameChained: c.frameChained,
          duration: c.duration
        })),
        totalDuration: result.totalDuration
      })
      
    } catch (generationError) {
      console.error(`[${jobId}] Video generation failed:`, generationError.message)
      
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: generationError.message || 'Video generation failed',
        jobId,
        mode
      }, { status: 500 })
    }

  } catch (error) {
    console.error(`[${jobId}] Video generation error:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}
