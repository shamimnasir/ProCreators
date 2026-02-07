// CSRF Token API Route
// Provides CSRF tokens for form submissions
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SALT || 'procreators-csrf-secret'

export async function GET(request) {
  try {
    // Generate a simpler CSRF token - just timestamp + signature
    const timestamp = Date.now()
    const data = `csrf:${timestamp}`
    const signature = crypto
      .createHmac('sha256', CSRF_SECRET)
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
