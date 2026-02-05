// Input Sanitization Utilities
// Protects against XSS, SQL injection, and other malicious input

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content - removes dangerous tags and attributes
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return ''
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'textarea', 'button', 'select', 'option'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  })
}

/**
 * Sanitize plain text - strips all HTML
 */
export function sanitizeText(dirty) {
  if (!dirty || typeof dirty !== 'string') return ''
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim()
}

/**
 * Sanitize user input for database storage
 * Removes potential NoSQL injection patterns
 */
export function sanitizeForDB(input) {
  if (input === null || input === undefined) return input
  
  if (typeof input === 'string') {
    // Remove potential MongoDB operators
    let sanitized = input
      .replace(/\$(?=\w)/g, '') // Remove $ prefix used in MongoDB operators
      .replace(/\{|\}/g, '') // Remove curly braces
      .trim()
    
    // Limit length to prevent DoS
    if (sanitized.length > 50000) {
      sanitized = sanitized.substring(0, 50000)
    }
    
    return sanitized
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeForDB(item))
  }
  
  if (typeof input === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(input)) {
      // Skip keys that look like MongoDB operators
      if (key.startsWith('$')) continue
      sanitized[sanitizeForDB(key)] = sanitizeForDB(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return ''
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .substring(0, 254) // Max email length per RFC
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'file'
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .substring(0, 255) // Max filename length
}

/**
 * Validate and sanitize request body
 */
export function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return {}
  
  const sanitized = {}
  
  for (const [key, value] of Object.entries(body)) {
    // Skip suspicious keys
    if (key.startsWith('$') || key.startsWith('_')) continue
    if (key.length > 100) continue // Key too long
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 1000).map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value)
    }
  }
  
  return sanitized
}

/**
 * Rate limit key generator - prevents user enumeration
 */
export function getRateLimitKey(identifier, action) {
  // Hash the identifier to prevent leaking user info in logs
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 16)
  return `ratelimit:${action}:${hash}`
}

/**
 * Check for common attack patterns in input
 */
export function detectMaliciousInput(input) {
  if (!input || typeof input !== 'string') return { safe: true }
  
  const patterns = [
    { name: 'script_injection', regex: /<script[\s\S]*?>[\s\S]*?<\/script>/gi },
    { name: 'sql_injection', regex: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/gi },
    { name: 'nosql_injection', regex: /\$(?:where|gt|gte|lt|lte|ne|in|nin|or|and|not|exists|regex)/gi },
    { name: 'path_traversal', regex: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\//gi },
    { name: 'null_byte', regex: /%00|\x00/g },
    { name: 'command_injection', regex: /[;&|`$()]|\b(eval|exec|system|shell_exec)\b/gi }
  ]
  
  const detected = []
  
  for (const pattern of patterns) {
    if (pattern.regex.test(input)) {
      detected.push(pattern.name)
    }
  }
  
  return {
    safe: detected.length === 0,
    threats: detected
  }
}

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeForDB,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeRequestBody,
  getRateLimitKey,
  detectMaliciousInput
}
