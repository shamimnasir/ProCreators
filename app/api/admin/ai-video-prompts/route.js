import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { AI_VIDEO_TEMPLATES } from '@/config/ai-video-templates'

// GET - Fetch all custom AI Video Studio prompts
export async function GET(request) {
  try {
    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('ai_video_prompts')
    
    // Fetch all custom prompts
    const customPrompts = await promptsCollection.find({}).toArray()
    
    // Convert array to object keyed by templateId
    const promptsMap = {}
    customPrompts.forEach(doc => {
      promptsMap[doc.templateId] = {
        name: doc.name,
        description: doc.description,
        icon: doc.icon,
        systemPrompt: doc.systemPrompt,
        inputPlaceholder: doc.inputPlaceholder,
        updatedAt: doc.updatedAt
      }
    })
    
    return NextResponse.json({
      success: true,
      prompts: promptsMap,
      count: customPrompts.length
    })

  } catch (error) {
    console.error('[AI Video Prompts] Error fetching prompts:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch prompts'
    }, { status: 500 })
  }
}

// POST - Save/Update custom prompt
export async function POST(request) {
  try {
    const { templateId, data } = await request.json()
    
    if (!templateId || !data) {
      return NextResponse.json({
        success: false,
        error: 'templateId and data are required'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('ai_video_prompts')
    
    // Upsert the custom prompt
    const result = await promptsCollection.updateOne(
      { templateId },
      {
        $set: {
          templateId,
          name: data.name,
          description: data.description,
          icon: data.icon,
          systemPrompt: data.systemPrompt,
          inputPlaceholder: data.inputPlaceholder,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log(`[AI Video Prompts] Saved prompt for template: ${templateId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Prompt saved successfully',
      templateId,
      modified: result.modifiedCount > 0,
      upserted: result.upsertedCount > 0
    })

  } catch (error) {
    console.error('[AI Video Prompts] Error saving prompt:', error)
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
    const templateId = searchParams.get('templateId')
    
    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'templateId parameter is required'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('ai_video_prompts')
    
    // Delete the custom prompt
    const result = await promptsCollection.deleteOne({ templateId })
    
    console.log(`[AI Video Prompts] Deleted prompt for template: ${templateId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully, will use default',
      templateId,
      deleted: result.deletedCount > 0
    })

  } catch (error) {
    console.error('[AI Video Prompts] Error deleting prompt:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete prompt'
    }, { status: 500 })
  }
}

// Helper function to get prompt for a template (used by video generation)
export async function getTemplatePrompt(templateId) {
  try {
    const { db } = await connectToDatabase()
    const promptsCollection = db.collection('ai_video_prompts')
    
    // Try to get custom prompt
    const customPrompt = await promptsCollection.findOne({ templateId })
    
    if (customPrompt) {
      return customPrompt.systemPrompt
    }
    
    // Fall back to default from config
    const defaultTemplate = AI_VIDEO_TEMPLATES.find(t => t.id === templateId)
    return defaultTemplate?.systemPrompt || ''
    
  } catch (error) {
    console.error('[AI Video Prompts] Error getting prompt:', error)
    // Fall back to default
    const defaultTemplate = AI_VIDEO_TEMPLATES.find(t => t.id === templateId)
    return defaultTemplate?.systemPrompt || ''
  }
}
