import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getDefaultPageTemplate, BLOCK_TYPES, BLOCK_TEMPLATES } from '@/lib/pageSchema'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'tool_pages'

// GET - List all tool pages or get specific page
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    if (toolId) {
      // Get specific page
      const page = await collection.findOne({ toolId })
      if (!page) {
        return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, page })
    }
    
    // List all pages
    const pages = await collection.find({}).sort({ updatedAt: -1 }).toArray()
    return NextResponse.json({ success: true, pages })
    
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new page or initialize from template
export async function POST(request) {
  try {
    const body = await request.json()
    const { toolId, toolName, action } = body
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    if (action === 'initialize') {
      // Check if page already exists
      const existing = await collection.findOne({ toolId })
      if (existing) {
        return NextResponse.json({ success: true, page: existing, message: 'Page already exists' })
      }
      
      // Create new page from template
      const newPage = getDefaultPageTemplate(toolId, toolName)
      newPage._id = uuidv4()
      await collection.insertOne(newPage)
      
      return NextResponse.json({ success: true, page: newPage, message: 'Page initialized' })
    }
    
    // Create custom page
    const newPage = {
      _id: uuidv4(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await collection.insertOne(newPage)
    return NextResponse.json({ success: true, page: newPage })
    
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update page
export async function PUT(request) {
  try {
    const body = await request.json()
    const { toolId, seo, contentBlocks, isPublished } = body
    
    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const updateData = {
      updatedAt: new Date()
    }
    
    if (seo) updateData.seo = seo
    if (contentBlocks) updateData.contentBlocks = contentBlocks
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished
    
    const result = await collection.updateOne(
      { toolId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }
    
    const updatedPage = await collection.findOne({ toolId })
    return NextResponse.json({ success: true, page: updatedPage })
    
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete page
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    
    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const result = await collection.deleteOne({ toolId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Page deleted' })
    
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
