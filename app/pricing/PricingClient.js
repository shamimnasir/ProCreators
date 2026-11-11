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

// Pricing FAQs for schema (KDP/Etsy publisher-focused)
const pricingFAQs = [
 {
 question: 'Can I cancel my ProCreators plan anytime?',
 answer: 'Yes. No contracts, no cancellation fees. Cancel from your account settings in under 30 seconds. Your published products on Amazon and Etsy are unaffected.'
 },
 {
 question: 'What happens to my published products if I cancel?',
 answer: 'Nothing. Your exported files stay on your device. Your Amazon and Etsy listings keep earning royalties. Cancelling ProCreators does not affect any published products.'
 },
 {
 question: 'Is there a money-back guarantee?',
 answer: 'Yes. If you are not satisfied within the first 7 days of a paid plan, contact support for a full refund after deducting the cost of credits you have already used. No questions asked.'
 },
 {
 question: 'Can I upgrade or downgrade my plan?',
 answer: 'Yes. Upgrade any time and new credits are added instantly. Downgrades take effect at the start of your next billing cycle.'
 },
 {
 question: 'Do I own the products I create?',
 answer: 'Yes. 100%. Every word, every design, every page. Upload it to Amazon KDP, sell it on Etsy, bundle it, sell the rights, we have no claim on any of it.'
 },
]

const pricingTiers = [
 {
 id: 'free',
 name: 'Try It Free',
 price: 0,
 priceYearly: 0,
 monthlyCredits: 25,
 icon: Play,
 color: 'from-gray-500 to-gray-600',
 description: 'One complete product, on us',
 features: [
 '1 complete ebook, planner, or coloring book',
 '1 KDP cover design (front, spine, back)',
 '1 Amazon listing (title, bullets, keywords)',
 'KDP-formatted PDF export',
 'No credit card required',
 ],
 cta: 'Current Plan',
 popular: false
 },
 {
 id: 'creator',
 name: 'Publisher',
 price: 19,
 priceYearly: 190,
 monthlyCredits: 1000,
 icon: Star,
 color: 'from-purple-500 to-pink-500',
 description: 'For publishers releasing 5–10 products per month',
 features: [
 '~10 complete products per month',
 'Unlimited cover designs',
 '100+ interior pages per month',
 'Amazon listing writer (10 listings)',
 'KDP-ready export (PDF, EPUB)',
 'No watermarks on any export',
 'Purchased credits never expire',
 '5% off all extra credit packs',
 'Email support · 7-day refund guarantee'
 ],
 cta: 'Start Publishing $19/mo',
 popular: true
 },
 {
 id: 'pro',
 name: 'Pro Publisher',
 price: 49,
 priceYearly: 490,
 monthlyCredits: 2500,
 icon: Crown,
 color: 'from-orange-500 to-red-500',
 description: 'For serious publishers releasing 20+ products monthly',
 features: [
 '~25 complete products per month',
 'Unlimited covers and interior pages',
 'Niche research tool included',
 'Unlimited Amazon listing optimisation',
 'Bulk export',
 'Everything in Publisher',
 '4K cover export quality',
 'Priority generation queue',
 'Brand kit (save 1 brand identity)',
 'Priority support'
 ],
 cta: 'Go Pro $49/mo',
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
 description: 'For agencies and multi-brand Etsy shops',
 features: [
 '~50 complete products per month',
 'Everything in Pro Publisher',
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

// Credit costs for the calculator (v3. Feb 2026)
// Video items priced per 10s for finer granularity
const CREDIT_ITEMS = [
 { id: 'blogs', name: 'Blog Posts', creditsEach: 3, icon: '📝', defaultQty: 0 },
 { id: 'images', name: 'AI Images', creditsEach: 15, icon: '🎨', defaultQty: 0 },
 { id: 'videos', name: 'Cinematic AI Video (10s)', creditsEach: 175, icon: '🎬', defaultQty: 0 },
 { id: 'ugc-ads', name: 'UGC Talking Head (15s)', creditsEach: 125, icon: '📣', defaultQty: 0 },
 { id: 'ebooks', name: 'Ebooks', creditsEach: 100, icon: '📚', defaultQty: 0 },
 { id: 'carousels', name: 'Carousels', creditsEach: 50, icon: '📱', defaultQty: 0 },
 { id: 'thumbnails', name: 'Thumbnails', creditsEach: 15, icon: '🖼️', defaultQty: 0 },
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
 router.push('/login?redirect=/pricing')
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
 <section aria-label="ProCreators pricing, plans for KDP and Etsy publishers" className="container pt-16 pb-8">
 <div className="mx-auto max-w-7xl text-center">
 <h1 className="mb-4 text-4xl font-bold md:text-5xl">Every Plan Pays for Itself With Your First Published Book</h1>
 <p className="mb-6 text-lg text-muted-foreground max-w-3xl mx-auto">
 A planner on Amazon earns $2–$8 per sale. A coloring book earns $3–$12. Our $19/month plan pays for itself after 4–6 sales. After that, every product you publish is profit.
 </p>

 {/* Trust strip */}
 <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
 <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> 7-day money-back guarantee</span>
 <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Cancel anytime</span>
 <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> You own every product you create</span>
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

 {/* What Your Credits Unlock, digital products matrix */}
 <section className="container py-12">
 <div className="mx-auto max-w-6xl">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold mb-3">Your Credits Unlock the Complete Publishing Toolkit</h2>
 <p className="text-muted-foreground max-w-2xl mx-auto">
 Credits are universal, mix and match across ebooks, covers, journals, planners, coloring books, and Amazon listings. Here's what your monthly allowance produces on our most-used tools.
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
 Counts assume you spend the entire monthly allowance on a single tool. Mix any way you want, credits are universal.
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
 {recommendedPlan.charAt(0).toUpperCase() + recommendedPlan.slice(1)} ${
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
 <section aria-label="Return on investment calculator for ProCreators publishing plans" className="container py-16">
 <div className="mx-auto max-w-4xl">
 <div className="text-center mb-10">
 <h2 className="text-3xl font-bold mb-3">How Fast Does ProCreators Pay for Itself?</h2>
 <p className="text-muted-foreground">Even conservative sales pay off Publisher and Pro Publisher plans within the first month.</p>
 </div>

 <Card className="overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border bg-muted/30">
 <th className="text-left p-4 font-semibold">Products / Month</th>
 <th className="text-center p-4 font-semibold text-muted-foreground">Monthly Sales Each</th>
 <th className="text-center p-4 font-semibold text-muted-foreground">Avg Royalty</th>
 <th className="text-center p-4 font-semibold text-muted-foreground">Monthly Royalties</th>
 <th className="text-center p-4 font-semibold text-muted-foreground">Plan Cost</th>
 <th className="text-center p-4 font-semibold text-emerald-500">Net Gain</th>
 </tr>
 </thead>
 <tbody>
 {[
 { p: '5 products', s: '20 sales', r: '$4.00', mo: '$400', plan: '$19', net: '+$381' },
 { p: '10 products', s: '20 sales', r: '$4.00', mo: '$800', plan: '$19', net: '+$781' },
 { p: '20 products', s: '20 sales', r: '$4.00', mo: '$1,600', plan: '$49', net: '+$1,551' },
 { p: '30 products', s: '20 sales', r: '$4.00', mo: '$2,400', plan: '$99', net: '+$2,301' },
 ].map((row, i) => (
 <tr key={i} className="border-b border-border last:border-0">
 <td className="p-4 font-medium text-foreground">{row.p}</td>
 <td className="p-4 text-center text-muted-foreground">{row.s}</td>
 <td className="p-4 text-center text-muted-foreground">{row.r}</td>
 <td className="p-4 text-center text-foreground font-medium">{row.mo}</td>
 <td className="p-4 text-center text-muted-foreground">{row.plan}</td>
 <td className="p-4 text-center text-emerald-500 font-bold">{row.net}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 <p className="text-center text-xs text-muted-foreground mt-4 max-w-3xl mx-auto">
 Estimates based on industry averages for low-content books on Amazon KDP. Actual results vary based on niche selection, cover quality, and listing optimisation. ProCreators does not guarantee any specific revenue outcome.
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
 <section aria-label="Frequently asked questions about ProCreators pricing" className="container pb-16">
 <div className="mx-auto max-w-3xl">
 <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
 <dl className="space-y-4">
 {pricingFAQs.map((faq, i) => (
 <div key={i} className="p-4 rounded-lg border">
 <dt><h3 className="font-semibold mb-2">{faq.question}</h3></dt>
 <dd className="text-sm text-muted-foreground">{faq.answer}</dd>
 </div>
 ))}
 </dl>
 </div>
 </section>
 </div>
 </PublicLayout>
 )
}
