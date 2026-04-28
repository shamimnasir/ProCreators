// Secure API Key Management
// Provides runtime protection for API keys without requiring rotation

import crypto from 'crypto'

/**
 * SECURITY MEASURES FOR API KEYS (without rotation):
 * 1. Never log full keys - only masked versions
 * 2. Validate key format before use
 * 3. Monitor for suspicious usage patterns
 * 4. Implement request signing where possible
 * 5. Use environment-specific keys
 */

// Key patterns for validation
const KEY_PATTERNS = {
  stripe_secret: /^sk_(live|test)_[a-zA-Z0-9]{24,}$/,
  stripe_publishable: /^pk_(live|test)_[a-zA-Z0-9]{24,}$/,
  stripe_webhook: /^whsec_[a-zA-Z0-9]{24,}$/,
  replicate: /^r8_[a-zA-Z0-9]{37,}$/,
  openai: /^sk-[a-zA-Z0-9]{32,}$/,
  google: /^AIza[a-zA-Z0-9_-]{35}$/,
  fal: /^.+:[a-f0-9]{32}$/,
  generic_hex: /^[a-f0-9]{32,64}$/i
}

/**
 * Mask an API key for safe logging
 * Shows only first 4 and last 4 characters
 */
export function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '[NOT SET]'
  if (key.length <= 12) return '****'
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
}

/**
 * Validate API key format without exposing it
 * Returns { valid: boolean, type?: string, error?: string }
 */
export function validateKeyFormat(key, expectedType = null) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key not provided' }
  }
  
  // Check against known patterns
  for (const [type, pattern] of Object.entries(KEY_PATTERNS)) {
    if (pattern.test(key)) {
      if (expectedType && type !== expectedType) {
        return { 
          valid: false, 
          error: `Expected ${expectedType} key but got ${type}`,
          detectedType: type
        }
      }
      return { valid: true, type }
    }
  }
  
  // Key doesn't match known patterns - could be valid but unknown format
  return { valid: true, type: 'unknown' }
}

/**
 * Get a secure hash of the API key for tracking/logging
 * Never logs the actual key
 */
export function getKeyFingerprint(key) {
  if (!key) return null
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 12)
}

/**
 * Secure key retrieval with validation
 * Logs masked key access for audit trail
 */
export function getSecureKey(envVarName, options = {}) {
  const { 
    required = true, 
    expectedType = null,
    logAccess = true 
  } = options
  
  const key = process.env[envVarName]
  
  if (!key) {
    if (required) {
      console.error(`[SECURITY] Required key ${envVarName} is not set`)
    }
    return { key: null, valid: false, error: 'Not configured' }
  }
  
  const validation = validateKeyFormat(key, expectedType)
  
  if (logAccess && process.env.NODE_ENV === 'production') {
    // Log key access with fingerprint (never the actual key)
    console.log(`[KEY_ACCESS] ${envVarName} accessed, fingerprint: ${getKeyFingerprint(key)}`)
  }
  
  return {
    key: validation.valid ? key : null,
    valid: validation.valid,
    type: validation.type,
    fingerprint: getKeyFingerprint(key),
    masked: maskApiKey(key),
    error: validation.error
  }
}

/**
 * Check if running in production with live keys
 * Warns if test keys are used in production
 */
export function checkKeyEnvironment() {
  const warnings = []
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check Stripe keys
  const stripeKey = process.env.STRIPE_API_KEY
  if (stripeKey) {
    const isLive = stripeKey.startsWith('sk_live_')
    const isTest = stripeKey.startsWith('sk_test_')
    
    if (isProduction && isTest) {
      warnings.push('WARNING: Using Stripe TEST key in production environment')
    }
    if (!isProduction && isLive) {
      warnings.push('WARNING: Using Stripe LIVE key in non-production environment')
    }
  }
  
  return {
    isProduction,
    warnings,
    hasWarnings: warnings.length > 0
  }
}

/**
 * Runtime key protection - prevents accidental exposure
 * Use this wrapper around sensitive operations
 */
export function withKeyProtection(operation, keyName) {
  return async (...args) => {
    const startTime = Date.now()
    
    try {
      const result = await operation(...args)
      
      // Log successful operation (no key details)
      if (process.env.NODE_ENV === 'production') {
        console.log(`[KEY_OP] ${keyName} operation completed in ${Date.now() - startTime}ms`)
      }
      
      return result
    } catch (error) {
      // Sanitize error message to remove any leaked keys
      const sanitizedError = sanitizeErrorMessage(error.message)
      console.error(`[KEY_OP] ${keyName} operation failed: ${sanitizedError}`)
      throw new Error(sanitizedError)
    }
  }
}

/**
 * Remove any potential API keys from error messages
 */
export function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') return 'Unknown error'
  
  // Remove anything that looks like an API key
  let sanitized = message
  
  // Remove Stripe keys
  sanitized = sanitized.replace(/sk_(live|test)_[a-zA-Z0-9]+/g, 'sk_***REDACTED***')
  sanitized = sanitized.replace(/pk_(live|test)_[a-zA-Z0-9]+/g, 'pk_***REDACTED***')
  sanitized = sanitized.replace(/whsec_[a-zA-Z0-9]+/g, 'whsec_***REDACTED***')
  
  // Remove OpenAI keys
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-***REDACTED***')
  
  // Remove Google keys
  sanitized = sanitized.replace(/AIza[a-zA-Z0-9_-]{35}/g, 'AIza***REDACTED***')
  
  // Remove Replicate tokens
  sanitized = sanitized.replace(/r8_[a-zA-Z0-9]+/g, 'r8_***REDACTED***')
  
  // Remove generic long hex strings (potential keys)
  sanitized = sanitized.replace(/[a-f0-9]{32,}/gi, '***REDACTED_HEX***')
  
  // Remove Bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***REDACTED***')
  
  return sanitized
}

/**
 * API Key Usage Monitoring
 * Track usage patterns to detect anomalies
 */
const keyUsageStats = new Map()

export function trackKeyUsage(keyName, endpoint) {
  const now = Date.now()
  const hour = Math.floor(now / 3600000)
  const key = `${keyName}:${hour}`
  
  if (!keyUsageStats.has(key)) {
    keyUsageStats.set(key, { count: 0, endpoints: new Set(), firstUse: now })
  }
  
  const stats = keyUsageStats.get(key)
  stats.count++
  stats.endpoints.add(endpoint)
  stats.lastUse = now
  
  // Alert on high usage (potential abuse)
  if (stats.count > 1000) {
    console.warn(`[SECURITY] High API key usage detected for ${keyName}: ${stats.count} calls in current hour`)
  }
  
  // Clean old stats (keep last 24 hours)
  const oldHour = hour - 24
  for (const [k] of keyUsageStats) {
    if (k.endsWith(`:${oldHour}`)) {
      keyUsageStats.delete(k)
    }
  }
  
  return stats.count
}

/**
 * Get current key usage statistics
 */
export function getKeyUsageStats(keyName) {
  const now = Date.now()
  const hour = Math.floor(now / 3600000)
  const key = `${keyName}:${hour}`
  
  return keyUsageStats.get(key) || { count: 0, endpoints: new Set() }
}

// Export utility for checking all keys at startup
export function validateAllKeys() {
  const results = {
    valid: [],
    invalid: [],
    missing: []
  }
  
  const requiredKeys = [
    { name: 'STRIPE_API_KEY', type: 'stripe_secret' },
    { name: 'EMERGENT_LLM_KEY', type: 'openai' },
  ]
  
  const optionalKeys = [
    { name: 'GOOGLE_API_KEY', type: 'google' },
    { name: 'REPLICATE_API_TOKEN', type: 'replicate' },
    { name: 'FAL_KEY', type: 'fal' },
    { name: 'PEXELS_API_KEY', type: 'generic_hex' },
    { name: 'MAILGUN_API_KEY', type: 'generic_hex' },
    { name: 'ELEVENLABS_API_KEY', type: 'generic_hex' },
  ]
  
  for (const { name, type } of [...requiredKeys, ...optionalKeys]) {
    const key = process.env[name]
    if (!key) {
      if (requiredKeys.find(k => k.name === name)) {
        results.missing.push(name)
      }
      continue
    }
    
    const validation = validateKeyFormat(key, type)
    if (validation.valid) {
      results.valid.push({ name, type: validation.type, masked: maskApiKey(key) })
    } else {
      results.invalid.push({ name, error: validation.error, masked: maskApiKey(key) })
    }
  }
  
  return results
}
