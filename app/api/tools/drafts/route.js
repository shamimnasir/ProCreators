import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

/**
 * Universal Drafts API for all ProCreators Tools
 * 
 * GET /api/tools/drafts?toolType=coloring-book
 * POST /api/tools/drafts { toolType, title, data, id? }
 * DELETE /api/tools/drafts?id=xxx
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')
    
    if (!toolType) {
      return NextResponse.json(
        { success: false, error: 'toolType is required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    const drafts = await draftsCollection
      .find({ toolType })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()
    
    return NextResponse.json({ success: true, drafts })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { id, toolType, title, data } = body
    
    if (!toolType) {
      return NextResponse.json(
        { success: false, error: 'toolType is required' },
        { status: 400 }
      )
    }
    
    const draftsCollection = await getCollection('drafts')
    
    if (id) {
      // Update existing draft
      await draftsCollection.updateOne(
        { id },
        {
          $set: {
            title: title || 'Untitled',
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
        title: title || 'Untitled',
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error('Failed to save draft:', error)
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
    console.error('Failed to delete draft:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
