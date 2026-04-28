import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth-middleware'

// GET - Fetch all custom prompts
export async function GET(request) {
  // SECURITY: Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('custom_prompts')
    
    // Fetch all custom prompts
    const customPrompts = await promptsCollection.find({}).toArray()
    
    // Convert array to object keyed by nicheSlug
    const promptsMap = {}
    customPrompts.forEach(doc => {
      promptsMap[doc.nicheSlug] = doc.prompt
    })
    
    return NextResponse.json({
      success: true,
      prompts: promptsMap,
      count: customPrompts.length
    })

  } catch (error) {
    console.error('[Admin Prompts] Error fetching prompts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prompts'
    }, { status: 500 })
  }
}

// POST - Save/Update custom prompt
export async function POST(request) {
  // SECURITY: Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const { nicheSlug, prompt } = await request.json()
    
    // SECURITY: Input validation
    if (!nicheSlug || typeof nicheSlug !== 'string' || nicheSlug.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Valid nicheSlug is required (max 100 chars)'
      }, { status: 400 })
    }
    
    if (!prompt || typeof prompt !== 'string' || prompt.length > 50000) {
      return NextResponse.json({
        success: false,
        error: 'Valid prompt is required (max 50000 chars)'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('custom_prompts')
    
    // Sanitize nicheSlug
    const sanitizedSlug = nicheSlug.replace(/[<>'"${}]/g, '').substring(0, 100)
    
    // Upsert the custom prompt
    const result = await promptsCollection.updateOne(
      { nicheSlug: sanitizedSlug },
      {
        $set: {
          nicheSlug: sanitizedSlug,
          prompt,
          updatedAt: new Date(),
          updatedBy: auth.userId // SECURITY: Use verified admin ID
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Prompt saved successfully',
      nicheSlug: sanitizedSlug,
      modified: result.modifiedCount > 0,
      upserted: result.upsertedCount > 0
    })

  } catch (error) {
    console.error('[Admin Prompts] Error saving prompt:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save prompt'
    }, { status: 500 })
  }
}

// DELETE - Remove custom prompt (revert to default)
export async function DELETE(request) {
  // SECURITY: Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const nicheSlug = searchParams.get('nicheSlug')
    
    if (!nicheSlug || typeof nicheSlug !== 'string' || nicheSlug.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Valid nicheSlug parameter is required'
      }, { status: 400 })
    }
    
    // Sanitize
    const sanitizedSlug = nicheSlug.replace(/[<>'"${}]/g, '').substring(0, 100)

    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('custom_prompts')
    
    // Delete the custom prompt
    const result = await promptsCollection.deleteOne({ nicheSlug: sanitizedSlug })
    
    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully, will use default',
      nicheSlug: sanitizedSlug,
      deleted: result.deletedCount > 0
    })

  } catch (error) {
    console.error('[Admin Prompts] Error deleting prompt:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete prompt'
    }, { status: 500 })
  }
}
