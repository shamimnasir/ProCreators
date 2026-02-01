'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export function CreditBalance({ userId }) {
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchCredits()
    }
  }, [userId])

  const fetchCredits = async () => {
    try {
      const res = await fetch(`/api/credits?userId=${userId}`)
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <Link href="/dashboard/billing">
      <Button variant="outline" size="sm" className="gap-2">
        <CreditCard className="h-4 w-4" />
        <span className="font-bold">{credits?.toLocaleString() || 0}</span>
        <span className="text-muted-foreground">credits</span>
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
    return <span className="text-xs text-muted-foreground">Calculating cost...</span>
  }

  return (
    <Badge variant="outline" className="text-xs">
      <CreditCard className="h-3 w-3 mr-1" />
      {cost} credits
    </Badge>
  )
}

// Hook for managing credits in tool pages
export function useCredits(userId) {
  const [credits, setCredits] = useState(0)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchCredits()
    }
  }, [userId])

  const fetchCredits = async () => {
    try {
      const res = await fetch(`/api/credits?userId=${userId}`)
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits)
        setPlan(data.plan)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAndDeduct = async (toolId, params = {}) => {
    try {
      // First check if user has enough credits
      const checkRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', userId, toolId, params })
      })
      const checkData = await checkRes.json()

      if (!checkData.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. You need ${checkData.cost} credits but only have ${checkData.currentBalance}.`,
          shortfall: checkData.shortfall
        }
      }

      // Deduct credits
      const deductRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', userId, toolId, params })
      })
      const deductData = await deductRes.json()

      if (deductData.success) {
        setCredits(deductData.newBalance)
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
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', transactionId, userId, reason })
      })
      const data = await res.json()

      if (data.success) {
        setCredits(prev => prev + data.refundedAmount)
      }

      return data
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const complete = async (transactionId) => {
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', transactionId, userId })
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
    checkAndDeduct,
    refund,
    complete,
    refresh: fetchCredits
  }
}
