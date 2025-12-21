import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import clientPromise from '@/lib/mongodb'

// GET - Fetch all drafts
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    
    const drafts = await db.collection('drafts')
      .find({ tool: 'notion-templates' })
      .sort({ updatedAt: -1 })
      .toArray()
    
    return NextResponse.json({ 
      success: true, 
      drafts: drafts.map(d => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        step: d.step,
        updatedAt: d.updatedAt,
        data: d.data
      }))
    })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Save draft
export async function POST(request) {
  try {
    const body = await request.json()
    const { id, title, subtitle, step, data } = body
    
    const client = await clientPromise
    const db = client.db()
    
    const draftId = id || uuidv4()
    
    await db.collection('drafts').updateOne(
      { id: draftId, tool: 'notion-templates' },
      {
        $set: {
          id: draftId,
          tool: 'notion-templates',
          title,
          subtitle,
          step,
          data,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ success: true, id: draftId })
  } catch (error) {
    console.error('Failed to save draft:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete draft
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Draft ID required' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db()
    
    await db.collection('drafts').deleteOne({ id, tool: 'notion-templates' })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
