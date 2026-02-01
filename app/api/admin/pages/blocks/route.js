import { NextResponse } from 'next/server'
import { BLOCK_TYPES, BLOCK_TEMPLATES } from '@/lib/pageSchema'

// GET - Get available block types and templates
export async function GET() {
  try {
    const blockTypes = Object.entries(BLOCK_TYPES).map(([key, value]) => ({
      id: value,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      template: BLOCK_TEMPLATES[value]
    }))
    
    return NextResponse.json({
      success: true,
      blockTypes
    })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
