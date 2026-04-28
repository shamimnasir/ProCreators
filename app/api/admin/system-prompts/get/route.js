import { NextResponse } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/system-prompts'
import { getCollection } from '@/lib/mongodb'

import { requireAdmin } from '@/lib/auth-middleware'
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const tool = searchParams.get('tool')

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool parameter is required' },
        { status: 400 }
      )
    }

    const defaultPrompt = SYSTEM_PROMPTS[tool]?.prompt || "You are a helpful AI assistant."

    // Check if there's a custom prompt in the database
    const settingsCollection = await getCollection('settings')
    const customPrompt = await settingsCollection.findOne({ 
      type: 'system-prompt',
      tool 
    })

    return NextResponse.json({
      success: true,
      prompt: customPrompt?.prompt || defaultPrompt,
      defaultPrompt,
      isCustom: !!customPrompt
    })
  } catch (error) {
    console.error('Error getting system prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get system prompt' },
      { status: 500 }
    )
  }
}
