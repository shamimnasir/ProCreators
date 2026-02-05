// CSRF Token API Route
// Provides CSRF tokens for form submissions
import { NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/csrf'

export async function GET(request) {
  try {
    // Get session ID from auth header or generate anonymous one
    const authHeader = request.headers.get('authorization')
    const sessionId = authHeader?.split(' ')[1] || `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const token = generateCsrfToken(sessionId)
    
    return NextResponse.json({
      success: true,
      csrfToken: token
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate CSRF token'
    }, { status: 500 })
  }
}
