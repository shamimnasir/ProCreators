'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Loader2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// Global event name for credit updates
export const CREDITS_UPDATED_EVENT = 'credits-updated'

// Helper function to notify all CreditBalance components to refresh
export function notifyCreditsUpdated(newBalance) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT, { detail: { newBalance } }))
  }
}

export function CreditBalance({ userId: propUserId, compact = false }) {
  const [credits, setCredits] = useState(null)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchCredits = useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      if (!sessionToken) {
        setLoading(false)
        setIsAuthenticated(false)
        return
      }
      
      // Verify session and get credits in one flow
      const sessionRes = await fetch('/api/auth/session', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const sessionData = await sessionRes.json()
      
      if (sessionData.success && sessionData.user) {
        setIsAuthenticated(true)
        
        // Fetch credits with the same session token
        const creditRes = await fetch('/api/credits', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const creditData = await creditRes.json()
        
        if (creditData.success) {
          setCredits(creditData.credits)
          setPlan(creditData.plan || 'free')
        } else {
          setCredits(0)
        }
      } else {
        // Invalid session
        setIsAuthenticated(false)
        setCredits(null)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      setCredits(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [propUserId, fetchCredits])

  // Listen for credit update events from tool pages
  useEffect(() => {
    const handleCreditsUpdated = (event) => {
      if (event.detail?.newBalance !== undefined) {
        // Directly set the new balance for instant UI update
        setCredits(event.detail.newBalance)
      } else {
        // Fallback: refetch credits
        fetchCredits()
      }
    }

    window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated)
    return () => {
      window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdated)
    }
  }, [fetchCredits])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
        {!compact && <span className="text-sm">Loading...</span>}
      </div>
    )
  }

  if (compact) {
    return (
      <Link href="/dashboard/billing">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors">
          <Coins className="h-3.5 w-3.5 text-yellow-500" />
          <span className="font-bold">{credits?.toLocaleString() || 0}</span>
        </Badge>
      </Link>
    )
  }

  return (
    <Link href="/dashboard/billing">
      <Button variant="outline" size="sm" className="gap-2 h-9">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="font-bold">{credits?.toLocaleString() || 0}</span>
        <span className="text-muted-foreground text-xs">credits</span>
      </Button>
    </Link>
  )
}

// Simple version for showing cost before generation
export function CreditCost({ toolId, params = {} }) {
  const [cost, setCost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCost()
  }, [toolId, params])

  const fetchCost = async () => {
    try {
      const res = await fetch(`/api/credits?toolId=${toolId}`)
      const data = await res.json()
      if (data.success && data.costEstimate) {
        setCost(data.costEstimate)
      }
    } catch (error) {
      console.error('Error fetching cost:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <span className="text-xs text-muted-foreground">...</span>
  }

  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Coins className="h-3 w-3 text-yellow-500" />
      {cost} credits
    </Badge>
  )
}

// Hook for managing credits in tool pages
export function useCredits(propUserId) {
  const [credits, setCredits] = useState(0)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(propUserId)

  useEffect(() => {
    // Get user from session if not provided
    const initUser = async () => {
      if (!propUserId) {
        try {
          const sessionToken = localStorage.getItem('sessionToken')
          if (sessionToken) {
            const res = await fetch('/api/auth/session', {
              headers: { 'Authorization': `Bearer ${sessionToken}` }
            })
            const data = await res.json()
            if (data.success && data.user) {
              setUserId(data.user.id)
            }
          }
        } catch (error) {
          console.error('Error getting user:', error)
        }
      }
      if (userId) {
        fetchCredits()
      } else {
        setLoading(false)
      }
    }
    initUser()
  }, [propUserId])

  const fetchCredits = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const res = await fetch('/api/credits', {
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      })
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits || 0)
        setPlan(data.plan || 'free')
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAndDeduct = async (toolId, params = {}) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) {
        return {
          success: false,
          error: 'Please log in to use this tool',
          needsLogin: true
        }
      }
      
      // First check if user has enough credits
      const checkRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'check', toolId, params })
      })
      const checkData = await checkRes.json()

      if (!checkData.success) {
        return {
          success: false,
          error: checkData.error || 'Failed to check credits'
        }
      }

      if (!checkData.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. You need ${checkData.cost} credits but only have ${checkData.currentBalance}.`,
          shortfall: checkData.shortfall,
          needsUpgrade: true
        }
      }

      // Deduct credits
      const deductRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'deduct', toolId, params })
      })
      const deductData = await deductRes.json()

      if (deductData.success) {
        setCredits(deductData.newBalance)
        // Notify header CreditBalance component to update
        notifyCreditsUpdated(deductData.newBalance)
        return {
          success: true,
          transactionId: deductData.transactionId,
          cost: deductData.cost,
          newBalance: deductData.newBalance
        }
      } else {
        return {
          success: false,
          error: deductData.error
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  const refund = async (transactionId, reason) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'refund', transactionId, reason })
      })
      const data = await res.json()

      if (data.success) {
        const newBalance = credits + data.refundedAmount
        setCredits(newBalance)
        // Notify header CreditBalance component to update
        notifyCreditsUpdated(newBalance)
      }

      return data
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const complete = async (transactionId) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'complete', transactionId })
      })
      return await res.json()
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    credits,
    plan,
    loading,
    userId,
    checkAndDeduct,
    refund,
    complete,
    refresh: fetchCredits
  }
}
