'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      userId: user?.id || 'demo-user-001'
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
