// Public Tool Page API - Fetches page content for frontend rendering
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

const COLLECTION_NAME = 'tool_pages'

// GET - Fetch tool page content for frontend
export async function GET(request, { params }) {
  try {
    const { toolId } = await params
    
    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const page = await collection.findOne({ 
      toolId,
      isPublished: true // Only return published pages
    })
    
    if (!page) {
      // Return default/empty page structure if not found
      return NextResponse.json({ 
        success: true, 
        page: null,
        isDefault: true
      })
    }
    
    // Return page data for frontend rendering
    return NextResponse.json({ 
      success: true, 
      page: {
        toolId: page.toolId,
        toolName: page.toolName,
        seo: page.seo || {},
        contentBlocks: page.contentBlocks || [],
        isPublished: page.isPublished,
        updatedAt: page.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
