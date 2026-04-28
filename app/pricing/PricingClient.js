'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Check,
  Play,
  Star,
  Crown,
  Building2,
  Calculator,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { PricingSchema } from '@/components/SchemaMarkup'
import { PublicLayout } from '@/components/shared/PublicLayout'

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
    answer: 'Yes! Every new user gets 25 free credits to try all our tools for 30 days. No credit card required. That\'s enough for 25 text generations or 1-2 AI images!'
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
    monthlyCredits: 25,
    icon: Play,
    color: 'from-gray-500 to-gray-600',
    features: [
      '25 starter credits (30-day trial)',
      'All text generation tools',
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
    monthlyCredits: 1000,
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    features: [
      '1,000 credits/month — mix & match',
      '🎬 7 cinematic AI video clips (~60s)',
      '📣 8 UGC talking-head ads (15s)',
      '🎨 66 AI images / 🖼️ 66 thumbnails',
      '📝 333 blog posts / ✉️ 500 emails',
      'All 70+ creation tools unlocked',
      'No watermarks on any export',
      'Bangla Voice Studio access',
      'Purchased credits never expire',
      '5% off all extra credit packs',
      'Email support · 7-day refund on unused credits'
    ],
    cta: 'Start Creator',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceYearly: 490,
    monthlyCredits: 2500,
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    features: [
      '2,500 credits/month — best value',
      '🎬 17 cinematic AI video clips (~2.5 min)',
      '📣 20 UGC talking-head ads (15s)',
      '🎨 166 AI images / 🖼️ 166 thumbnails',
      '📝 833 blog posts / ✉️ 1,250 emails',
      'Everything in Creator',
      '4K export quality',
      'Batch generation (parallel jobs)',
      'Priority generation queue',
      'Brand kit (save 1 brand identity)',
      'Early access to new tools',
      '10% off extra credits',
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
    monthlyCredits: 5000,
    icon: Building2,
    color: 'from-green-500 to-teal-500',
    features: [
      '5,000 credits/month — for teams',
      '🎬 35 cinematic AI video clips (~5 min)',
      '📣 40 UGC talking-head ads (15s)',
      '🎨 333 AI images / 🖼️ 333 thumbnails',
      '📝 1,666 blog posts / ✉️ 2,500 emails',
      'Everything in Pro',
      'Team access (5 seats)',
      'Multi-brand kits (up to 5 brands)',
      'API access for automation',
      'Custom voice cloning slots (3)',
      '15% off extra credits',
      'Dedicated account manager',
      '99.9% uptime SLA'
    ],
    cta: 'Start Business',
    popular: false
  },
]

// Credit costs for the calculator (v3 — Feb 2026)
// Video items priced per 10s for finer granularity
const CREDIT_ITEMS = [
  { id: 'blogs',      name: 'Blog Posts',                creditsEach: 3,   icon: '📝', defaultQty: 0 },
  { id: 'images',     name: 'AI Images',                 creditsEach: 15,  icon: '🎨', defaultQty: 0 },
  { id: 'videos',     name: 'Cinematic AI Video (10s)',  creditsEach: 175, icon: '🎬', defaultQty: 0 },
  { id: 'ugc-ads',    name: 'UGC Talking Head (15s)',    creditsEach: 125, icon: '📣', defaultQty: 0 },
  { id: 'ebooks',     name: 'Ebooks',                    creditsEach: 100, icon: '📚', defaultQty: 0 },
  { id: 'carousels',  name: 'Carousels',                 creditsEach: 50,  icon: '📱', defaultQty: 0 },
  { id: 'thumbnails', name: 'Thumbnails',                creditsEach: 15,  icon: '🖼️', defaultQty: 0 },
]

export default function PricingClient() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [calcItems, setCalcItems] = useState(
    CREDIT_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: item.defaultQty }), {})
  )
  const router = useRouter()
  const { toast } = useToast()

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

  // Calculator logic
  const totalCreditsNeeded = CREDIT_ITEMS.reduce(
    (sum, item) => sum + (calcItems[item.id] || 0) * item.creditsEach, 0
  )

  const recommendedPlan = totalCreditsNeeded <= 25 ? 'free'
    : totalCreditsNeeded <= 1000 ? 'creator'
    : totalCreditsNeeded <= 2500 ? 'pro'
    : 'business'

  return (
    <PublicLayout>
      <div className="min-h-screen">
        <PricingSchema faqs={pricingFAQs} />

        {/* Hero */}
        <section className="container pt-16 pb-8">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Simple, Transparent Pricing</h1>
            <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Every plan unlocks all 70+ tools. Credits work across cinematic AI video, UGC ads, images, blogs and more — mix any way you want.
            </p>

            {/* Trust strip */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> 7-day money-back on unused credits</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Cancel anytime</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Purchased credits never expire</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> No credit card for free plan</span>
            </div>

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
        </section>

        {/* Pricing Cards */}
        <section className="container pb-16">
          <div className="mx-auto max-w-7xl">
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
                          Current Plan
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
                          {loading === tier.id ? 'Processing...' : isCurrentPlan ? 'Current Plan' : isUpgrade ? `Upgrade to ${tier.name}` : tier.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* What Your Credits Unlock — digital products matrix */}
        <section className="container py-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Your Credits Unlock 70+ Tools</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Credits are universal — use them anywhere. Here's what the same monthly allowance creates across our most popular tools.
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold">Tool</th>
                      <th className="px-4 py-3 font-semibold text-center">
                        <div>Creator</div>
                        <div className="text-xs text-muted-foreground font-normal">1,000 cr</div>
                      </th>
                      <th className="px-4 py-3 font-semibold text-center bg-purple-500/5 border-x border-purple-500/20">
                        <div className="text-purple-500">Pro</div>
                        <div className="text-xs text-muted-foreground font-normal">2,500 cr</div>
                      </th>
                      <th className="px-4 py-3 font-semibold text-center">
                        <div>Business</div>
                        <div className="text-xs text-muted-foreground font-normal">5,000 cr</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { icon: '🎬', name: 'Cinematic AI Videos (8s clips)', cr: 140, suffix: '' },
                      { icon: '📣', name: 'UGC Talking-Head Ads (15s)', cr: 125, suffix: '' },
                      { icon: '🎨', name: 'AI Images / Thumbnails', cr: 15, suffix: '' },
                      { icon: '📱', name: 'Carousel Posts (5 slides)', cr: 50, suffix: '' },
                      { icon: '📚', name: 'Storybooks (illustrated)', cr: 200, suffix: '' },
                      { icon: '🖍️', name: 'Coloring Books', cr: 400, suffix: '' },
                      { icon: '🍳', name: 'Recipe Books', cr: 120, suffix: '' },
                      { icon: '📕', name: 'Ebooks (illustrated)', cr: 100, suffix: '' },
                      { icon: '📒', name: 'Digital Planners / Journals', cr: 8, suffix: '' },
                      { icon: '🎓', name: 'Lesson Plans', cr: 3, suffix: '' },
                      { icon: '📝', name: 'CVs / Resumes', cr: 3, suffix: '' },
                      { icon: '💼', name: 'Interview Prep Sessions', cr: 2, suffix: '' },
                      { icon: '🐦', name: 'X / Threads / LinkedIn Posts', cr: 2, suffix: '' },
                      { icon: '✍️', name: 'Blog Posts (SEO)', cr: 3, suffix: '' },
                      { icon: '✉️', name: 'Email Campaigns', cr: 2, suffix: '' },
                      { icon: '📊', name: 'Pitch Decks / Business Plans', cr: 15, suffix: '' },
                      { icon: '🃏', name: 'Quiz / Flashcard Sets', cr: 5, suffix: '' },
                      { icon: '✅', name: 'Checklists / Worksheets', cr: 5, suffix: '' },
                    ].map((tool, idx) => {
                      const fmt = (qty) => qty >= 10000 ? `${(qty/1000).toFixed(1)}K` : qty.toLocaleString()
                      const creator = Math.floor(1000 / tool.cr)
                      const pro = Math.floor(2500 / tool.cr)
                      const business = Math.floor(5000 / tool.cr)
                      return (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 flex items-center gap-2">
                            <span className="text-base">{tool.icon}</span>
                            <span>{tool.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-medium">{fmt(creator)}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-purple-500 bg-purple-500/5 border-x border-purple-500/20">{fmt(pro)}</td>
                          <td className="px-4 py-2.5 text-center font-medium">{fmt(business)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground text-center">
                Counts assume you spend the entire monthly allowance on a single tool. Mix any way you want — credits are universal.
              </div>
            </Card>
          </div>
        </section>

        {/* Credit Calculator */}
        <section className="container py-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm font-medium text-purple-400 mb-4">
                <Calculator className="h-4 w-4" />
                Credit Calculator
              </div>
              <h2 className="text-3xl font-bold mb-3">Not Sure Which Plan You Need?</h2>
              <p className="text-muted-foreground">Tell us what you want to create each month and we'll recommend the right plan.</p>
            </div>

            <Card className="p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {CREDIT_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.creditsEach.toLocaleString()} credits each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCalcItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold text-foreground">{calcItems[item.id] || 0}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCalcItems(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total credits needed per month:</div>
                    <div className="text-3xl font-bold text-foreground">{totalCreditsNeeded.toLocaleString()} credits</div>
                  </div>
                  {totalCreditsNeeded > 0 && (
                    <div className="text-center md:text-right">
                      <div className="text-sm text-muted-foreground mb-1">Recommended plan:</div>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${
                        recommendedPlan === 'free' ? 'bg-gray-500' :
                        recommendedPlan === 'creator' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                        recommendedPlan === 'pro' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        'bg-gradient-to-r from-green-500 to-teal-500'
                      }`}>
                        {recommendedPlan.charAt(0).toUpperCase() + recommendedPlan.slice(1)} — ${
                          recommendedPlan === 'free' ? '0' :
                          recommendedPlan === 'creator' ? '19' :
                          recommendedPlan === 'pro' ? '49' : '99'
                        }/mo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Value Comparison */}
        <section className="container py-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">How ProCreators Compares</h2>
              <p className="text-muted-foreground">One platform vs. paying for everything separately.</p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-semibold">What you need</th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">Separate Tools</th>
                      <th className="text-center p-4 font-semibold text-purple-400">ProCreators</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { need: 'AI Video Creation', separate: '$15-48/mo (Runway, Pika)', ours: '✓ Included' },
                      { need: 'Blog / Article Writing', separate: '$49/mo (Jasper, Copy.ai)', ours: '✓ Included' },
                      { need: 'Social Media Graphics', separate: '$15/mo (Canva Pro)', ours: '✓ Included' },
                      { need: 'Ebook / Digital Products', separate: '$20-50/mo (Designrr)', ours: '✓ Included' },
                      { need: 'Thumbnail Maker', separate: '$10-20/mo', ours: '✓ Included' },
                      { need: 'AI Image Generation', separate: '$20/mo (Midjourney)', ours: '✓ Included' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-4 font-medium text-foreground">{row.need}</td>
                        <td className="p-4 text-center text-muted-foreground">{row.separate}</td>
                        <td className="p-4 text-center text-green-500 font-medium">{row.ours}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-bold">
                      <td className="p-4 text-foreground">Total Monthly Cost</td>
                      <td className="p-4 text-center text-red-400">$129-201/mo</td>
                      <td className="p-4 text-center text-green-500">From $19/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Prices based on publicly available pricing of listed tools as of 2025. ProCreators pricing reflects the Creator plan.
            </p>
          </div>
        </section>

        {/* Need More Credits */}
        <section className="container py-16">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-2xl font-bold mb-4">Need More Credits?</h2>
            <p className="text-muted-foreground mb-6">
              Subscribers get discounts on extra credit packs. Purchased credits never expire and roll over.
            </p>
            <Link href="/dashboard/billing">
              <Button variant="outline" size="lg">
                View Credit Packs
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="container pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Do monthly credits roll over?',
                  a: 'No, monthly subscription credits reset each billing cycle. However, any credits you purchase separately will never expire and roll over indefinitely.'
                },
                {
                  q: 'Can I upgrade or downgrade anytime?',
                  a: 'Yes! You can change your plan anytime. When upgrading, you get immediate access to your new credits. When downgrading, your current credits remain until the billing cycle ends.'
                },
                {
                  q: 'What happens if I run out of credits?',
                  a: 'You can always buy additional credit packs. Subscribers enjoy 5-15% discounts on credit purchases depending on their plan level.'
                },
                {
                  q: 'Is there a money-back guarantee?',
                  a: 'Yes. If you\'re not happy within the first 7 days, we\'ll refund your payment after deducting the cost of any credits you\'ve already used for generations. So you only pay for what you actually create.'
                },
              ].map((faq, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
