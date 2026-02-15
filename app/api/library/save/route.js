// Library Save API - Secured with Zod validation and rate limiting
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import { optionalAuth } from '@/lib/auth-middleware'
import { validateRequest, librarySaveSchema } from '@/lib/validation'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for library saves
    const rateLimitCheck = await enforceRateLimit(request, 'library_save')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    // Get user from auth (optional - can save as anonymous)
    const auth = await optionalAuth(request)
    
    const body = await request.json()
    
    // SECURITY: Zod validation for all input fields
    let validatedBody = body
    try {
      const validation = validateRequest(librarySaveSchema, body)
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        }, { status: 400 })
      }
      validatedBody = validation.data
    } catch (zodError) {
      console.error('Zod validation exception:', zodError.message)
      // Fallback to basic validation
      if (!body.type || typeof body.type !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Type is required'
        }, { status: 400 })
      }
      if (!body.title || typeof body.title !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'Title is required'
        }, { status: 400 })
      }
      validatedBody = body
    }
    
    // Check required content (at least one content source must be provided)
    if (!validatedBody.content && !validatedBody.videoUrl && !validatedBody.filePath) {
      return NextResponse.json(
        { success: false, error: 'Content, video URL, or file path is required' },
        { status: 400 }
      )
    }

    const libraryCollection = await getCollection('library')
    
    // Create TTL index on first save (if it doesn't exist)
    try {
      await libraryCollection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      )
    } catch (indexError) {
      // Index might already exist, that's okay
    }

    // Determine content category from validated type OR explicit category param
    const type = validatedBody.type
    let category = validatedBody.category || 'text' // Use explicit category if provided
    
    // Override category based on type if not explicitly provided
    if (!validatedBody.category) {
      if (type === 'video' || type === 'reel' || type === 'short' || type === 'story-reel' || type === 'ai-video-studio') {
        category = 'video'
      } else if (type === 'photocard' || type === 'carousel' || type === 'image' || type === 'image-generator') {
        category = 'image'
      } else if (['slides-maker', 'ebook', 'journal', 'planner', 'worksheet', 'checklist', 'study-notes', 'essay-helper', 'exam-prep', 'citation-generator', 'quiz-maker', 'flashcards', 'lesson-planner', 'activity-book', 'storybook', 'social-media-post'].includes(type)) {
        category = 'document'
      }
    }

    // Get user ID (prefer authenticated, fallback to validated body)
    const userId = auth?.userId || validatedBody.userId || 'anonymous'

    // Calculate expiration: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Build document with sanitized values (Zod already validates max lengths)
    const documentId = randomUUID()
    const document = {
      id: documentId,
      userId,
      content: validatedBody.content ? sanitizeText(validatedBody.content) : '',
      videoUrl: validatedBody.videoUrl ? sanitizeUrl(validatedBody.videoUrl) : null,
      filePath: validatedBody.filePath || null,
      fileSize: validatedBody.fileSize || null,
      script: validatedBody.script ? sanitizeText(validatedBody.script) : null,
      type,
      category,
      title: sanitizeText(validatedBody.title),
      description: validatedBody.description ? sanitizeText(validatedBody.description) : '',
      metadata: validatedBody.metadata || {},
      createdAt: new Date(),
      expiresAt,
    }

    await libraryCollection.insertOne(document)

    return NextResponse.json({
      success: true,
      message: 'Content saved to library successfully',
      itemId: documentId,
      category,
      expiresAt
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save content' },
      { status: 500 }
    )
  }
}
