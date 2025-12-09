import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

// GET - Fetch all custom prompts
export async function GET(request) {
  try {
    const db = await connectDB()
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
      error: error.message || 'Failed to fetch prompts'
    }, { status: 500 })
  }
}

// POST - Save/Update custom prompt
export async function POST(request) {
  try {
    const { nicheSlug, prompt } = await request.json()
    
    if (!nicheSlug || !prompt) {
      return NextResponse.json({
        success: false,
        error: 'nicheSlug and prompt are required'
      }, { status: 400 })
    }

    const db = await connectDB()
    const promptsCollection = db.collection('custom_prompts')
    
    // Upsert the custom prompt
    const result = await promptsCollection.updateOne(
      { nicheSlug },
      {
        $set: {
          nicheSlug,
          prompt,
          updatedAt: new Date(),
          updatedBy: 'admin' // TODO: Replace with actual user ID when auth is implemented
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log(`[Admin Prompts] Saved prompt for niche: ${nicheSlug}`)
    
    return NextResponse.json({
      success: true,
      message: 'Prompt saved successfully',
      nicheSlug,
      modified: result.modifiedCount > 0,
      upserted: result.upsertedCount > 0
    })

  } catch (error) {
    console.error('[Admin Prompts] Error saving prompt:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save prompt'
    }, { status: 500 })
  }
}

// DELETE - Remove custom prompt (revert to default)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nicheSlug = searchParams.get('nicheSlug')
    
    if (!nicheSlug) {
      return NextResponse.json({
        success: false,
        error: 'nicheSlug parameter is required'
      }, { status: 400 })
    }

    const db = await connectDB()
    const promptsCollection = db.collection('custom_prompts')
    
    // Delete the custom prompt
    const result = await promptsCollection.deleteOne({ nicheSlug })
    
    console.log(`[Admin Prompts] Deleted prompt for niche: ${nicheSlug}`)
    
    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully, will use default',
      nicheSlug,
      deleted: result.deletedCount > 0
    })

  } catch (error) {
    console.error('[Admin Prompts] Error deleting prompt:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete prompt'
    }, { status: 500 })
  }
}
