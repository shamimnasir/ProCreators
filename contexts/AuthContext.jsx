'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(undefined)

// Helper to get CSRF token
async function getCsrfToken() {
  try {
    // Check sessionStorage first
    const cached = sessionStorage.getItem('csrf_token')
    const expiry = sessionStorage.getItem('csrf_expires')
    if (cached && expiry && parseInt(expiry) > Date.now() + 60000) {
      return cached
    }
    
    // Fetch new token
    const res = await fetch('/api/csrf')
    const data = await res.json()
    if (data.success) {
      sessionStorage.setItem('csrf_token', data.csrfToken)
      sessionStorage.setItem('csrf_expires', data.expiresAt)
      return data.csrfToken
    }
  } catch (e) {
    console.error('Failed to get CSRF token:', e)
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState(null)

  // Fetch CSRF token on mount
  useEffect(() => {
    getCsrfToken().then(setCsrfToken)
  }, [])

  useEffect(() => {
    // Check for existing session
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        // Verify session with backend
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          localStorage.removeItem('sessionToken')
        }
      }
    } catch (error) {
      console.error('Session check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      // Get fresh CSRF token for login
      const token = await getCsrfToken()
      setCsrfToken(token)
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token || ''
        },
        body: JSON.stringify({ action: 'login', email, password })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        localStorage.setItem('sessionToken', data.sessionToken)
        return { success: true }
      } else {
        return { success: false, error: data.error, needsVerification: data.needsVerification }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signup = async (email, password, name) => {
    try {
      // Get fresh CSRF token for signup
      const token = await getCsrfToken()
      setCsrfToken(token)
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token || ''
        },
        body: JSON.stringify({ action: 'signup', email, password, name })
      })
      const data = await res.json()
      
      if (data.success) {
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sessionToken')
    sessionStorage.removeItem('csrf_token')
    sessionStorage.removeItem('csrf_expires')
  }

  const forgotPassword = async (email) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot_password', email })
      })
      return await res.json()
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const resendVerification = async (email) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_verification', email })
      })
      return await res.json()
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Secure fetch helper that includes auth and CSRF tokens
  const secureFetch = useCallback(async (url, options = {}) => {
    const sessionToken = localStorage.getItem('sessionToken')
    let token = csrfToken
    
    // Get fresh CSRF token if needed
    if (!token) {
      token = await getCsrfToken()
      setCsrfToken(token)
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`
    }
    
    if (token) {
      headers['x-csrf-token'] = token
    }
    
    return fetch(url, { ...options, headers })
  }, [csrfToken])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      forgotPassword,
      resendVerification,
      isAuthenticated: !!user,
      userId: user?.id || null,
      sessionToken: typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null,
      csrfToken,
      secureFetch // SECURITY: Use this for all state-changing requests
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
