import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    const { content, type, metadata, title, description } = await request.json()
    
    if (!content || !type) {
      return NextResponse.json(
        { success: false, error: 'Content and type are required' },
        { status: 400 }
      )
    }

    const libraryCollection = await getCollection('library')
    
    const item = {
      id: uuidv4(),
      content,
      type,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`,
      description: description || content.substring(0, 100),
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      userId: 'default-user' // TODO: Replace with actual user ID when auth is implemented
    }

    await libraryCollection.insertOne(item)

    return NextResponse.json({
      success: true,
      message: 'Content saved successfully',
      itemId: item.id
    })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save content' },
      { status: 500 }
    )
  }
}
