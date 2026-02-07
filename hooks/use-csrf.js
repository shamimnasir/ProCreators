'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * React hook for CSRF protection
 * Fetches and maintains a CSRF token for form submissions
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch CSRF token
  const fetchToken = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/csrf')
      const data = await res.json()
      if (data.success) {
        setCsrfToken(data.csrfToken)
      } else {
        throw new Error(data.error || 'Failed to get CSRF token')
      }
    } catch (err) {
      setError(err.message)
      console.error('CSRF token fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch token on mount and refresh periodically
  useEffect(() => {
    fetchToken()
    
    // Refresh token every 45 minutes (before 1 hour expiry)
    const interval = setInterval(fetchToken, 45 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchToken])

  // Get headers for fetch requests
  const getCsrfHeaders = useCallback(() => ({
    'x-csrf-token': csrfToken || ''
  }), [csrfToken])

  // Protected fetch helper
  const protectedFetch = useCallback(async (url, options = {}) => {
    if (!csrfToken) {
      // Try to get a new token first
      await fetchToken()
    }

    const headers = {
      ...options.headers,
      'x-csrf-token': csrfToken
    }

    return fetch(url, { ...options, headers })
  }, [csrfToken, fetchToken])

  return {
    csrfToken,
    loading,
    error,
    refreshToken: fetchToken,
    getCsrfHeaders,
    protectedFetch
  }
}

/**
 * Higher-order component to add CSRF protection to forms
 */
export function withCsrfProtection(WrappedComponent) {
  return function CsrfProtectedComponent(props) {
    const csrf = useCsrf()
    return <WrappedComponent {...props} csrf={csrf} />
  }
}
