import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType') || 'storybook'
    
    const draftsCollection = await getCollection('drafts')
    const drafts = await draftsCollection
      .find({ toolType })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ success: true, drafts })
  } catch (error) {
    console.error('Failed to fetch storybook drafts:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { id, toolType = 'storybook', title, data } = body
    
    const draftsCollection = await getCollection('drafts')
    
    if (id) {
      // Update existing draft
      await draftsCollection.updateOne(
        { id },
        {
          $set: {
            title,
            data,
            updatedAt: new Date()
          }
        }
      )
      return NextResponse.json({ success: true, id })
    } else {
      // Create new draft
      const newId = randomUUID()
      await draftsCollection.insertOne({
        id: newId,
        toolType,
        title,
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error('Failed to save storybook draft:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Draft ID required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    await draftsCollection.deleteOne({ id })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete storybook draft:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
