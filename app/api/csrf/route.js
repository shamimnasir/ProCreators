// CSRF Token API Route
// Provides CSRF tokens for form submissions
import { NextResponse } from 'next/server'
import { getCsrfSecret } from '@/lib/csrf-secret'
import crypto from 'crypto'

// IMPORTANT: Must match lib/csrf-verify.js for consistent validation

export async function GET(request) {
  try {
    // Generate a simpler CSRF token - just timestamp + signature
    const timestamp = Date.now()
    const data = `csrf:${timestamp}`
    const signature = crypto
      .createHmac('sha256', getCsrfSecret())
      .update(data)
      .digest('hex')
    
    const token = Buffer.from(`${timestamp}:${signature}`).toString('base64')
    
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
