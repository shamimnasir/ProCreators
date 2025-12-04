import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { randomUUID } from 'crypto'

const client = new MongoClient(process.env.MONGO_URL)

export async function POST(request) {
  try {
    const { content, type, title, description, metadata, videoUrl, script } = await request.json()

    if (!content && !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Content or video URL is required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('procreators')
    const collection = db.collection('library')

    // Determine content category
    let category = 'text'
    if (type === 'video' || type === 'reel' || type === 'short') {
      category = 'video'
    } else if (type === 'photocard' || type === 'carousel' || type === 'image') {
      category = 'image'
    }

    // Calculate expiration based on user tier
    // TODO: Get actual user tier from session/auth
    const userTier = 'free' // or 'paid'
    const expirationDays = userTier === 'free' ? 7 : 90
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const document = {
      id: randomUUID(),
      userId: 'default-user', // TODO: Replace with actual user ID when auth is implemented
      content: content || '',
      videoUrl: videoUrl || null,
      script: script || null,
      type,
      category,
      title,
      description,
      metadata: metadata || {},
      userTier,
      createdAt: new Date(),
      expiresAt,
    }

    await collection.insertOne(document)

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
