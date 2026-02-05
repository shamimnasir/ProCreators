'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, ArrowLeft, Zap, Star, Crown, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { PricingSchema } from '@/components/SchemaMarkup'

// Pricing FAQs for schema
const pricingFAQs = [
  {
    question: 'What are credits and how do they work?',
    answer: 'Credits are the currency used to generate content on ProCreators. Each tool costs a certain number of credits based on complexity. Monthly subscription credits reset each billing cycle, while purchased credits never expire.'
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! You can upgrade your plan at any time and the new credits will be added immediately. When downgrading, the change takes effect at the start of your next billing cycle.'
  },
  {
    question: 'What happens to unused credits?',
    answer: 'Monthly subscription credits reset at the start of each billing cycle. However, any credits you purchase separately never expire and roll over indefinitely.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Every new user gets 50 free credits to try all our tools. No credit card required.'
  },
  {
    question: 'How do subscriber discounts work?',
    answer: 'Subscribers get discounts when purchasing extra credits: Creator plan gets 5% off, Pro plan gets 10% off, and Business plan gets 15% off all credit purchases.'
  }
]

const pricingTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    monthlyCredits: 50,
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      '50 starter credits (expires in 7 days)',
      'Basic content tools',
      'Watermarked exports',
      'Standard support',
      'Community access'
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 19,
    priceYearly: 190,
    monthlyCredits: 400,
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    features: [
      '400 credits/month',
      'All content tools',
      'No watermarks',
      'Priority rendering queue',
      'Bangla Voice Studio access',
      '5% discount on extra credits',
      'Email support'
    ],
    cta: 'Start Creator',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceYearly: 490,
    monthlyCredits: 1000,
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    features: [
      '1,000 credits/month',
      'Everything in Creator',
      'Daily auto-reel generator',
      'Batch generation',
      'Shorts repurposing',
      '4K export quality',
      '10% discount on extra credits',
      'Priority support'
    ],
    cta: 'Go Pro',
    popular: false
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    priceYearly: 990,
    monthlyCredits: 3000,
    icon: Building2,
    color: 'from-green-500 to-teal-500',
    features: [
      '3,000 credits/month',
      'Everything in Pro',
      'Team access (5 seats)',
      'Brand kits',
      'Client folders',
      'API access',
      '15% discount on extra credits',
      'Dedicated support'
    ],
    cta: 'Start Business',
    popular: false
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is logged in and get their current plan
  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          const data = await res.json()
          if (data.success && data.user) {
            // Also fetch membership info for current plan
            const membershipRes = await fetch(`/api/membership?userId=${data.user.id}`)
            const membershipData = await membershipRes.json()
            
            setCurrentUser({
              ...data.user,
              plan: membershipData.plan || 'free'
            })
          }
        } catch (e) {
          console.error('Auth check failed:', e)
        }
      }
    }
    checkAuth()
  }, [])

  const handleSubscribe = async (planId, planName) => {
    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    // Check if user is logged in
    const sessionToken = localStorage.getItem('sessionToken')
    if (!sessionToken) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive"
      })
      router.push('/auth/login?redirect=/pricing')
      return
    }

    setLoading(planId)
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          originUrl: window.location.origin
        })
      })
      
      const data = await res.json()
      
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (tier) => {
    if (billingCycle === 'yearly') {
      return Math.floor(tier.priceYearly / 12)
    }
    return tier.price
  }

  const getSavings = (tier) => {
    if (billingCycle === 'yearly' && tier.price > 0) {
      const monthlyCost = tier.price * 12
      const yearlyCost = tier.priceYearly
      return Math.round((1 - yearlyCost / monthlyCost) * 100)
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Schema.org structured data for SEO */}
      <PricingSchema faqs={pricingFAQs} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ProCreators</span>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Simple, Transparent Pricing</h1>
            <p className="mb-6 text-lg text-muted-foreground">
              Choose a plan that fits your creative needs. Credits reset monthly.
            </p>
            <div className="inline-flex rounded-lg border p-1 bg-muted/50">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly <span className="ml-1 text-xs text-green-500 font-bold">Save 17%</span>
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon
              const isCurrentPlan = currentUser?.plan === tier.id || (!currentUser && tier.id === 'free')
              const isUpgrade = currentUser?.plan && ['free', 'creator', 'pro'].indexOf(currentUser.plan) < ['free', 'creator', 'pro', 'business'].indexOf(tier.id)
              
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={`relative h-full flex flex-col ${
                      tier.popular ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : ''
                    } ${isCurrentPlan ? 'border-2 border-green-500 shadow-lg shadow-green-500/20' : ''}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-sm font-medium text-white">
                        ✓ Current Plan
                      </div>
                    )}
                    {tier.popular && !isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-sm font-medium text-white">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white mb-3`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-baseline mt-2">
                          <span className="text-4xl font-bold text-foreground">
                            ${getPrice(tier)}
                          </span>
                          <span className="ml-2 text-muted-foreground">/month</span>
                        </div>
                        {billingCycle === 'yearly' && tier.price > 0 && (
                          <p className="text-sm text-green-500 font-medium mt-1">
                            Billed ${tier.priceYearly}/year (Save {getSavings(tier)}%)
                          </p>
                        )}
                        <p className="text-sm mt-2 font-medium text-primary">
                          {tier.monthlyCredits.toLocaleString()} credits/month
                        </p>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-3 flex-1">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="mr-2 h-5 w-5 shrink-0 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-6 ${tier.popular && !isCurrentPlan ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''} ${isCurrentPlan ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        variant={tier.popular || isCurrentPlan ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(tier.id, tier.name)}
                        disabled={loading === tier.id || isCurrentPlan}
                      >
                        {loading === tier.id ? 'Processing...' : isCurrentPlan ? '✓ Current Plan' : isUpgrade ? `Upgrade to ${tier.name}` : tier.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Credit Info */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Need More Credits?</h2>
            <p className="text-muted-foreground mb-6">
              Subscribers get discounts on extra credit packs. Purchased credits never expire and roll over!
            </p>
            <Link href="/dashboard/billing">
              <Button variant="outline" size="lg">
                View Credit Packs
              </Button>
            </Link>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Do monthly credits roll over?</h3>
                <p className="text-sm text-muted-foreground">
                  No, monthly subscription credits reset each billing cycle. However, any credits you purchase separately will never expire and roll over indefinitely.
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can change your plan anytime. When upgrading, you'll get immediate access to your new credits. When downgrading, your current credits remain until the billing cycle ends.
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">What happens if I run out of credits?</h3>
                <p className="text-sm text-muted-foreground">
                  You can always buy additional credit packs. Subscribers enjoy 5-15% discounts on credit purchases depending on their plan level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
