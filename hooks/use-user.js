'use client'

import { useState, useEffect } from 'react'

const DEMO_USER_ID = 'demo-user-001'

/**
 * Hook to get the current user ID from session
 * Falls back to demo user if not authenticated
 */
export function useUserId() {
  const [userId, setUserId] = useState(DEMO_USER_ID)
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
        // Fallback to demo user
        setUserId(DEMO_USER_ID)
        setUser(null)
      } catch (error) {
        console.error('Error getting user:', error)
        setUserId(DEMO_USER_ID)
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
    userId: session?.user?.id || DEMO_USER_ID,
    loading,
    isAuthenticated: !!session,
    logout,
    refresh: checkSession
  }
}

export { DEMO_USER_ID }
