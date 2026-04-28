'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Coins,
  Loader2,
  Check,
  Play,
  Crown,
  Building2,
  Star,
  RefreshCw,
  ArrowRight,
  Clock,
  Infinity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// SECURITY: No demo user fallback
function BillingPageContent() {
  const [membershipCredits, setMembershipCredits] = useState(0)
  const [purchasedCredits, setPurchasedCredits] = useState(0)
  const [credits, setCredits] = useState(null)
  const [plan, setPlan] = useState('free')
  const [subscription, setSubscription] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [userId, setUserId] = useState(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get logged-in user first, then fetch data
    initUserAndFetchData()
  }, [])

  const initUserAndFetchData = async () => {
    let currentUserId = null
    
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const data = await res.json()
        if (data.success && data.user) {
          currentUserId = data.user.id
          setUserId(currentUserId)
        }
      }
      
      // SECURITY: Redirect to login if not authenticated
      if (!currentUserId) {
        window.location.href = '/login?redirect=/dashboard/billing'
        return
      }
    } catch (error) {
      console.error('Error getting user:', error)
      window.location.href = '/login?redirect=/dashboard/billing'
      return
    }
    
    // Now fetch data using Authorization header (no userId params needed)
    fetchCredits()
    fetchMembership()
    fetchPackagesWithDiscount()
    fetchTransactions()
    
    // Check for payment success/cancel
    const sessionId = searchParams.get('session_id')
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const subscriptionSuccess = searchParams.get('subscription')
    
    if (subscriptionSuccess === 'success') {
      toast({
        title: '🎉 Subscription Activated!',
        description: 'Welcome to your new plan! Your credits have been added.',
      })
      fetchCredits()
      fetchMembership()
    } else if (sessionId && success) {
      pollPaymentStatus(sessionId)
    } else if (canceled) {
      toast({
        title: 'Payment Canceled',
        description: 'Your payment was canceled. You were not charged.',
        variant: 'default'
      })
    }
  }

  const fetchCredits = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) return
      
      const res = await fetch('/api/credits', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
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

  const fetchMembership = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) return
      
      const res = await fetch('/api/membership', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setMembershipCredits(data.membershipCredits || 0)
        setPurchasedCredits(data.purchasedCredits || 0)
        setSubscription(data.subscription)
        setPlan(data.plan || 'free')
      }
    } catch (error) {
      console.error('Error fetching membership:', error)
    }
  }

  const fetchPackagesWithDiscount = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      // Pass Authorization header for subscriber-specific discounts
      const res = await fetch('/api/stripe/checkout', {
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
      })
      const data = await res.json()
      if (data.success) {
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) return
      
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'history' })
      })
      const data = await res.json()
      if (data.success) {
        setTransactions(data.history?.slice(0, 10) || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5
    
    if (attempts >= maxAttempts) {
      toast({
        title: 'Status Check Timeout',
        description: 'Please refresh the page to see your updated balance.',
        variant: 'default'
      })
      return
    }
    
    try {
      const res = await fetch(`/api/stripe/status?session_id=${sessionId}`)
      const data = await res.json()
      
      if (data.paymentStatus === 'paid') {
        toast({
          title: '🎉 Payment Successful!',
          description: `${data.credits} credits have been added to your account.`,
        })
        fetchCredits()
        fetchTransactions()
        return
      } else if (data.status === 'expired') {
        toast({
          title: 'Session Expired',
          description: 'The payment session has expired.',
          variant: 'destructive'
        })
        return
      }
      
      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000)
    } catch (error) {
      console.error('Error polling status:', error)
    }
  }

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId)
    
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          packageId,
          originUrl: window.location.origin
        })
      })
      
      const data = await res.json()
      
      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setPurchasing(null)
    }
  }

  const getPackageIcon = (id) => {
    switch (id) {
      case 'starter': return <Play className="h-6 w-6" />
      case 'creator': return <Star className="h-6 w-6" />
      case 'pro': return <Crown className="h-6 w-6" />
      case 'business': return <Building2 className="h-6 w-6" />
      default: return <Coins className="h-6 w-6" />
    }
  }

  const getPackageColor = (id) => {
    switch (id) {
      case 'starter': return 'from-blue-500 to-cyan-500'
      case 'creator': return 'from-purple-500 to-pink-500'
      case 'pro': return 'from-orange-500 to-red-500'
      case 'business': return 'from-green-500 to-teal-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits & Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and purchase credits
          </p>
        </div>
        <Link href="/pricing">
          <Button variant="outline">
            View Plans <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Credits */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="h-8 w-8 text-yellow-500" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Total Balance</p>
            </div>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <span className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">
                {(membershipCredits + purchasedCredits).toLocaleString()}
              </span>
            )}
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">credits available</p>
          </CardContent>
        </Card>

        {/* Membership Credits */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="h-6 w-6 text-purple-500" />
              <p className="text-sm font-medium text-muted-foreground">Monthly Credits</p>
            </div>
            <span className="text-3xl font-bold">{membershipCredits.toLocaleString()}</span>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Resets monthly • No rollover</p>
            </div>
            {subscription?.renewsAt && (
              <p className="text-xs text-purple-600 mt-1">
                Renews: {new Date(subscription.renewsAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Purchased Credits */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Infinity className="h-6 w-6 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Purchased Credits</p>
            </div>
            <span className="text-3xl font-bold">{purchasedCredits.toLocaleString()}</span>
            <div className="flex items-center gap-2 mt-2">
              <Check className="h-4 w-4 text-green-500" />
              <p className="text-xs text-green-600">Never expire • Roll over forever</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan */}
      <Card className={`${plan !== 'free' ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${plan !== 'free' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-200'} text-white`}>
                {plan === 'business' ? <Building2 className="h-6 w-6" /> : 
                 plan === 'pro' ? <Crown className="h-6 w-6" /> : 
                 plan === 'creator' ? <Star className="h-6 w-6" /> : 
                 <Play className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold capitalize">{plan} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {plan === 'free' ? 'Upgrade to unlock more credits and features' :
                   subscription?.status === 'active' ? 'Your subscription is active' :
                   'Manage your subscription'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {plan !== 'free' && subscription?.status && (
                <Badge className={`${subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {subscription.status}
                </Badge>
              )}
              <Link href="/pricing">
                <Button className={plan === 'free' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}>
                  {plan === 'free' ? 'Upgrade Now' : 'Manage Plan'}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Play className="h-6 w-6 text-yellow-500" />
          Buy Extra Credits
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pack) => (
            <Card 
              key={pack.id} 
              className={`relative overflow-hidden ${pack.popular ? 'ring-2 ring-purple-500' : ''}`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                  POPULAR
                </div>
              )}
              {pack.discount > 0 && (
                <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-lg font-medium">
                  {pack.discount}% OFF
                </div>
              )}
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPackageColor(pack.id)} flex items-center justify-center text-white mb-2`}>
                  {getPackageIcon(pack.id)}
                </div>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{pack.credits.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">credits</span>
                </div>
                <div className="mb-4">
                  {pack.discount > 0 && pack.originalPrice ? (
                    <>
                      <span className="text-lg text-muted-foreground line-through mr-2">${pack.originalPrice}</span>
                      <span className="text-2xl font-bold text-green-600">${pack.price}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">${pack.price}</span>
                  )}
                  <span className="text-muted-foreground ml-1">USD</span>
                </div>
                {pack.discountLabel && (
                  <p className="text-xs text-green-600 font-medium mb-2">
                    {pack.discountLabel}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-4">
                  ${(pack.price / pack.credits * 100).toFixed(1)}¢ per credit
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing === pack.id}
                >
                  {purchasing === pack.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your credit transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No transactions yet. Start creating to use your credits!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, idx) => (
                <div key={tx._id || idx} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.amount > 0 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                    }`}>
                      {tx.amount > 0 ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.type === 'free_credits' ? 'Welcome Bonus' : 
                         tx.type === 'credit_add' ? 'Credit Purchase' :
                         tx.toolId || 'Generation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'refunded' ? 'secondary' : 'outline'}>
                      {tx.status}
                    </Badge>
                    <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Credits Get You */}
      <Card>
        <CardHeader>
          <CardTitle>What Can You Create?</CardTitle>
          <CardDescription>Credit costs based on actual API usage (1 credit = $0.001)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">💬 Text Content</h3>
              <p className="text-xs text-green-600 mb-2">Very affordable!</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Jokes, Fortune: 5 credits</li>
                <li>• Emails, Letters: 8-10 credits</li>
                <li>• Blog Posts: 15-20 credits</li>
                <li>• Business Plans: 30 credits</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🖼️ Images & PDFs</h3>
              <p className="text-xs text-yellow-600 mb-2">AI image = 300 credits</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Text PDFs: 15-35 credits</li>
                <li>• Single AI Image: 300 credits</li>
                <li>• Storybook (10 imgs): 3,000</li>
                <li>• Coloring Book (25 imgs): 7,500</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">🎬 Video</h3>
              <p className="text-xs text-purple-600 mb-2">AI video = 10,000/30s</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Stock Video Reels: 40 credits</li>
                <li>• AI Video (30s): 10,000 credits</li>
                <li>• AI Video (60s): 20,000 credits</li>
                <li>• AI Video (5min): 100,000 credits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  )
}
