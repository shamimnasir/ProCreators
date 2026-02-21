// Test endpoint to verify FAL.ai credentials are working
// This helps debug the intermittent "Unauthorized" errors

import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

// Validate FAL API key format
const validateFalKeyFormat = (key) => {
  if (!key) return { valid: false, error: 'Key is empty' }
  
  const parts = key.split(':')
  if (parts.length !== 2) {
    return { valid: false, error: 'Key should be in format KEY_ID:KEY_SECRET' }
  }
  
  const [keyId, keySecret] = parts
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidPattern.test(keyId)) {
    return { 
      valid: false, 
      error: `KEY_ID doesn't look like a valid UUID`,
      keyIdPreview: keyId.substring(0, 20) + (keyId.length > 20 ? '...' : ''),
      hint: 'FAL keys should start with a UUID like: 360556a7-58bf-49f4-8ac8-dcb26a52d50d:...'
    }
  }
  
  if (!/^[0-9a-f]{32}$/i.test(keySecret)) {
    return { valid: false, error: 'KEY_SECRET should be a 32-character hex string' }
  }
  
  return { valid: true, keyId, keySecretPreview: keySecret.substring(0, 8) + '...' }
}

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
    
    // Validate key format first
    const validation = validateFalKeyFormat(falKey)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'FAL_KEY format is invalid',
        details: validation,
        hint: validation.hint || 'Check that your FAL_KEY is in the correct format: UUID:SECRET'
      }, { status: 400 })
    }
    
    // Configure with fresh credentials
    fal.config({ credentials: falKey })
    
    // Test by uploading a tiny blob to verify auth works
    const testResult = await Promise.race([
      fal.storage.upload(new Blob(['test'], { type: 'text/plain' }))
        .then(url => ({ authWorking: true, method: 'storage-upload', uploadUrl: url }))
        .catch(e => {
          if (e.status === 401 || e.message?.includes('nauthorized')) {
            throw e
          }
          return { authWorking: true, note: 'Auth OK but upload had other error', error: e.message }
        }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
      )
    ])
    
    return NextResponse.json({
      success: true,
      message: 'FAL.ai credentials are working',
      keyFormat: 'valid',
      keyId: validation.keyId,
      keySecretPreview: validation.keySecretPreview,
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
      timestamp: new Date().toISOString(),
      hint: isUnauthorized 
        ? 'The API key format is correct but FAL.ai rejected it. The key may be invalid, expired, or revoked.'
        : 'Check the error message for details'
    }, { status: isUnauthorized ? 401 : 500 })
  }
}
