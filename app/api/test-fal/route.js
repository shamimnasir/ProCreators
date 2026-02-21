// Test endpoint to verify FAL.ai credentials are working
// This helps debug the intermittent "Unauthorized" errors

import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

export async function GET(request) {
  try {
    const falKey = process.env.FAL_KEY
    
    if (!falKey) {
      return NextResponse.json({
        success: false,
        error: 'FAL_KEY not found in environment',
        hint: 'Please set FAL_KEY in your .env file'
      }, { status: 500 })
    }
    
    // Configure with fresh credentials
    fal.config({ credentials: falKey })
    
    // Test by checking a simple endpoint
    // Using storage endpoint which is lightweight
    const testResult = await Promise.race([
      fal.storage.upload(new Blob(['test'], { type: 'text/plain' }))
        .then(url => ({ authWorking: true, method: 'storage-upload', uploadUrl: url }))
        .catch(e => {
          // If it's a 401/unauthorized, rethrow
          if (e.status === 401 || e.message?.includes('nauthorized')) {
            throw e
          }
          // Other errors might mean rate limit etc, but auth worked
          return { authWorking: true, note: 'Auth OK but upload had other error', error: e.message }
        }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
      )
    ])
    
    return NextResponse.json({
      success: true,
      message: 'FAL.ai credentials are working',
      keyPrefix: falKey.substring(0, 10) + '...',
      keyLength: falKey.length,
      timestamp: new Date().toISOString(),
      testResult
    })
    
  } catch (error) {
    const isUnauthorized = error.message && (
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('401') ||
      error.message.toLowerCase().includes('authentication') ||
      error.status === 401
    )
    
    return NextResponse.json({
      success: false,
      error: error.message,
      isUnauthorized,
      keyConfigured: !!process.env.FAL_KEY,
      keyPrefix: process.env.FAL_KEY ? process.env.FAL_KEY.substring(0, 10) + '...' : null,
      timestamp: new Date().toISOString(),
      hint: isUnauthorized 
        ? 'The API key is configured but FAL.ai rejected it. The key may be invalid, expired, or have incorrect permissions.'
        : 'Check the error message for details'
    }, { status: isUnauthorized ? 401 : 500 })
  }
}
