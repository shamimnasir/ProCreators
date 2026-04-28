import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

import { requireAdmin } from '@/lib/auth-middleware'
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { tool, prompt } = await request.json()

    if (!tool || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Tool and prompt are required' },
        { status: 400 }
      )
    }

    const settingsCollection = await getCollection('settings')
    
    // Upsert the system prompt
    await settingsCollection.updateOne(
      { type: 'system-prompt', tool },
      { 
        $set: { 
          prompt,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'System prompt updated successfully'
    })
  } catch (error) {
    console.error('Error updating system prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update system prompt' },
      { status: 500 }
    )
  }
}
