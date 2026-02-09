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
    
    // Basic validation
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
    
    // Check required content
    if (!body.content && !body.videoUrl && !body.filePath) {
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

    // Determine content category
    let category = body.category || 'text'
    const type = body.type
    if (type === 'video' || type === 'reel' || type === 'short' || type === 'story-reel') {
      category = 'video'
    } else if (type === 'photocard' || type === 'carousel' || type === 'image') {
      category = 'image'
    } else if (['slides-maker', 'ebook', 'journal', 'planner', 'worksheet', 'checklist', 'study-notes', 'essay-helper', 'exam-prep', 'citation-generator', 'quiz-maker', 'flashcards', 'lesson-planner', 'activity-book', 'storybook', 'social-media-post'].includes(type)) {
      category = 'document'
    }

    // Get user ID (prefer authenticated, fallback to body)
    const userId = auth?.userId || body.userId || 'anonymous'

    // Calculate expiration: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Build document with sanitized values
    const documentId = randomUUID()
    const document = {
      id: documentId,
      userId,
      content: body.content ? sanitizeText(String(body.content).substring(0, 5000000)) : '',
      videoUrl: body.videoUrl ? sanitizeUrl(body.videoUrl) : null,
      filePath: body.filePath || null,
      fileSize: body.fileSize || null,
      script: body.script ? sanitizeText(String(body.script).substring(0, 50000)) : null,
      type,
      category,
      title: sanitizeText(String(body.title).substring(0, 500)),
      description: body.description ? sanitizeText(String(body.description).substring(0, 2000)) : '',
      metadata: body.metadata || {},
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
