'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to get the current user ID from session
 * Returns null if not authenticated - NO demo user fallback
 */
export function useUserId() {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionToken = localStorage.getItem('sessionToken')
        if (sessionToken) {
          const res = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          const data = await res.json()
          if (data.success && data.user) {
            setUserId(data.user.id)
            setUser(data.user)
            setLoading(false)
            return
          }
        }
        // No demo user fallback - return null
        setUserId(null)
        setUser(null)
      } catch (error) {
        console.error('Error getting user:', error)
        setUserId(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { userId, user, loading, isAuthenticated: !!user }
}

/**
 * Hook to manage user session state
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const data = await res.json()
        if (data.success && data.user) {
          setSession({
            user: data.user,
            token: sessionToken
          })
        } else {
          // Invalid session, clear it
          localStorage.removeItem('sessionToken')
          setSession(null)
        }
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error('Session check error:', error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('sessionToken')
    setSession(null)
  }

  return {
    session,
    user: session?.user || null,
    userId: session?.user?.id || null,
    loading,
    isAuthenticated: !!session,
    logout,
    refresh: checkSession
  }
}
