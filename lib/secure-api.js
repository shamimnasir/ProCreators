'use client'

/**
 * Secure API call utility for frontend components
 * Automatically includes authentication and CSRF tokens
 */

// Get CSRF token from session storage or fetch a new one
async function getCsrfToken() {
  // Check cache first
  const cached = sessionStorage.getItem('csrf_token')
  const expiry = sessionStorage.getItem('csrf_expires')
  
  if (cached && expiry && parseInt(expiry) > Date.now() + 60000) {
    return cached
  }
  
  // Fetch new token
  try {
    const res = await fetch('/api/csrf')
    const data = await res.json()
    if (data.success && data.csrfToken) {
      sessionStorage.setItem('csrf_token', data.csrfToken)
      sessionStorage.setItem('csrf_expires', data.expiresAt.toString())
      return data.csrfToken
    }
  } catch (e) {
    console.error('Failed to get CSRF token:', e)
  }
  return null
}

/**
 * Make a secure API call with auth and CSRF tokens
 * Use this for all POST/PUT/DELETE requests
 */
export async function secureApiCall(url, options = {}) {
  const sessionToken = localStorage.getItem('sessionToken')
  const csrfToken = await getCsrfToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`
  }
  
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Save content to library with proper authentication
 */
export async function saveToLibrary(data) {
  try {
    const response = await secureApiCall('/api/library/save', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    return await response.json()
  } catch (error) {
    console.error('Save to library error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete from library with proper authentication
 */
export async function deleteFromLibrary(itemId) {
  try {
    const response = await secureApiCall('/api/library/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id: itemId })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Delete from library error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch library items (GET doesn't need CSRF but needs auth)
 */
export async function fetchLibrary(filters = {}) {
  try {
    const sessionToken = localStorage.getItem('sessionToken')
    const params = new URLSearchParams(filters)
    
    const response = await fetch(`/api/library/list?${params}`, {
      headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
    })
    
    return await response.json()
  } catch (error) {
    console.error('Fetch library error:', error)
    return { success: false, error: error.message, items: [] }
  }
}
