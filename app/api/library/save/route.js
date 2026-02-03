import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import { getUserIdFromRequest } from '@/lib/get-user-id'

export async function POST(request) {
  try {
    const body = await request.json()
    const { content, type, title, description, metadata, videoUrl, script, filePath, fileSize, userId: bodyUserId } = body

    if (!content && !videoUrl && !filePath) {
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
      console.log('TTL index creation skipped (may already exist)')
    }

    // Determine content category
    let category = 'text'
    if (type === 'video' || type === 'reel' || type === 'short' || type === 'story-reel') {
      category = 'video'
    } else if (type === 'photocard' || type === 'carousel' || type === 'image') {
      category = 'image'
    } else if (type === 'slides-maker' || type === 'ebook' || type === 'journal' || type === 'planner' || type === 'worksheet' || type === 'checklist' || type === 'study-notes' || type === 'essay-helper' || type === 'exam-prep' || type === 'citation-generator' || type === 'quiz-maker' || type === 'flashcards' || type === 'lesson-planner' || type === 'activity-book' || type === 'storybook') {
      category = 'document'
    }

    // Get user ID from body or request headers
    const userId = bodyUserId || await getUserIdFromRequest(request)

    // Calculate expiration: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const document = {
      id: randomUUID(),
      userId,
      content: content || '',
      videoUrl: videoUrl || null,
      filePath: filePath || null,
      fileSize: fileSize || null,
      script: script || null,
      type,
      category,
      title,
      description: description || '',
      metadata: metadata || {},
      createdAt: new Date(),
      expiresAt,
    }

    await libraryCollection.insertOne(document)

    console.log(`Library item saved: ${document.id} (${category}) - expires in 30 days`)

    return NextResponse.json({
      success: true,
      message: 'Content saved to library successfully',
      itemId: document.id,
      category,
      expiresAt
    })
  } catch (error) {
    console.error('Library save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save content' },
      { status: 500 }
    )
  }
}
