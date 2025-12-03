import { NextResponse } from 'next/server'
import { getAllTools } from '@/lib/system-prompts'

export async function GET(request) {
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
