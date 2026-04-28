import { NextResponse } from 'next/server'
import { getAllTools } from '@/lib/system-prompts'

import { requireAdmin } from '@/lib/auth-middleware'
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const tools = getAllTools()
    
    return NextResponse.json({
      success: true,
      tools
    })
  } catch (error) {
    console.error('Error listing tools:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list tools' },
      { status: 500 }
    )
  }
}
