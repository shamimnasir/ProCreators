'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Layers, CheckCircle2 } from 'lucide-react'
import { Header, Footer } from '@/components/landing'

const etsyPageJsonLd = {
 '@context': 'https://schema.org',
 '@type': 'WebPage',
 name: 'AI Tool for Etsy Printable Sellers',
 description: 'ProCreators helps Etsy sellers create complete printable products, planners, journals, coloring pages, worksheets, in under 2 hours.',
 url: 'https://procreators.io/for-etsy-sellers',
}

const features = [
 '10 planner types × 5 color themes × 4 design styles (200+ unique combinations)',
 '5 KDP-accepted coloring book sizes: 8.5×11 (gold standard), 8×10, 8.5×8.5 (mandalas), 7×10, 8.25×8.25',
 '8 journal types with unique prompts per page (Gratitude, Mindfulness, Dream, Travel, Bullet, Reading, Fitness, Self-Discovery)',
 'Worksheet builder with teacher fields (subject, grade level, instructions) and custom color pickers',
 'Cover designer with 12+ marketplace presets (Etsy shop cover, listing thumbnails, product mockups)',
 'High-resolution 300 DPI PDF download for Etsy digital delivery',
 'Notion template builder for Etsy sellers (Product, Marketing, HR, Health, Meal Plans, Habits)',
 'Auto-saved drafts so a full session can be resumed later',
]

const productTypes = [
 'Daily and weekly planners',
 'Monthly and yearly planners',
 'Gratitude and mindfulness journals',
 'Coloring page sets (adult and children)',
 'Worksheet bundles',
 'Habit and goal trackers',
 'Recipe and meal planning books',
 'Budget and finance trackers',
]

export default function EtsySellersClient() {
 const router = useRouter()
 const [isLoggedIn, setIsLoggedIn] = useState(false)
 const [userName, setUserName] = useState('')
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

 useEffect(() => {
 const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
 if (!token) return
 fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } })
 .then(r => r.json())
 .then(d => {
 if (d?.success && d.user) {
 setIsLoggedIn(true)
 setUserName(d.user.name || d.user.email?.split('@')[0] || 'User')
 }
 })
 .catch(() => {})
 }, [])

 const cta = () => router.push('/register')

 return (
 <div className="min-h-screen">
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(etsyPageJsonLd) }} />
 <Header isLoggedIn={isLoggedIn} userName={userName} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

 {/* HERO */}
 <section aria-label="Hero. AI tool for Etsy printable sellers" className="relative pt-32 pb-16 md:pt-40 overflow-hidden">
 <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl" />
 <div className="absolute top-40 right-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
 <div className="container relative z-10 px-6">
 <div className="mx-auto flex max-w-4xl flex-col items-center text-center space-y-8">
 <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700">Built for Etsy Printable Sellers</div>
 <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
 Create Etsy Printables <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">10x Faster With AI</span>
 </h1>
 <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
 Design your complete planner, journal, or coloring page set in one session. Download. List on Etsy. Earn passive income.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
 <Button size="lg" onClick={cta} aria-label="Build your first Etsy product free, no credit card" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
 Build My First Etsy Product Free
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 <Link href="/pricing">
 <Button size="lg" variant="outline" className="text-lg px-8 py-6 glass-btn border-2 border-purple-400/50 hover:border-purple-500 text-purple-700 rounded-2xl">See Publisher Plans</Button>
 </Link>
 </div>
 <p className="text-sm text-muted-foreground">Free trial includes one complete product. No credit card. No catch.</p>
 </div>
 </div>
 </section>

 {/* PAIN */}
 <section aria-label="The Etsy production bottleneck" className="container px-6 pb-20">
 <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-8 md:p-12 space-y-5">
 <h2 className="text-2xl md:text-4xl font-bold">Most Etsy Sellers Are Spending More Time Making Than Selling</h2>
 <p className="text-muted-foreground leading-relaxed">A planner set that earns $40/month takes 12 hours to design in Canva. A coloring book that earns $60/month takes 3 days to illustrate. At that ratio, you need 80+ active listings just to reach $1,000/month, and building 80 listings manually takes years.</p>
 <p className="text-foreground font-semibold leading-relaxed">The Etsy shops earning $3,000–$10,000/month share one thing: volume. They publish fast, they test niches quickly, and they have a production system.</p>
 </div>
 </section>

 {/* SOLUTION */}
 <section aria-label="ProCreators Etsy production features" className="container px-6 pb-20">
 <div className="mx-auto max-w-4xl text-center mb-10 space-y-3">
 <h2 className="text-3xl md:text-4xl font-bold">ProCreators Is Your <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Etsy Production System</span></h2>
 <p className="text-muted-foreground text-lg">Generate complete, Etsy-ready printable products, planners, journals, coloring pages, worksheets, and more, in under 2 hours. You focus on your shop. We handle the production.</p>
 </div>
 <dl className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
 {features.map((f, i) => (
 <div key={i} className="glass-card-elevated rounded-2xl p-5 flex items-start gap-3">
 <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
 <dd className="text-sm md:text-base text-foreground font-medium">{f}</dd>
 </div>
 ))}
 </dl>
 </section>

 {/* PRODUCT TYPES */}
 <section aria-label="Types of Etsy printables you can create" className="container px-6 pb-20">
 <div className="text-center mb-10">
 <h2 className="text-3xl md:text-4xl font-bold">Products You Can Sell on Etsy</h2>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
 {productTypes.map((p, i) => (
 <div key={i} className="glass-card-elevated rounded-2xl p-5 text-center space-y-2">
 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto shadow-sm">
 <Layers className="w-5 h-5 text-white" />
 </div>
 <p className="text-sm font-semibold text-foreground">{p}</p>
 </div>
 ))}
 </div>
 </section>

 {/* FINAL CTA */}
 <section aria-label="Call to action, create your first Etsy printable free" className="container px-6 pb-24">
 <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-10 md:p-14 text-center space-y-6">
 <h2 className="text-3xl md:text-4xl font-bold">Your next Etsy listing is 2 hours away.</h2>
 <p className="text-lg text-muted-foreground">Start with one free product. No credit card.</p>
 <div className="flex justify-center">
 <Button size="lg" onClick={cta} aria-label="Build your first Etsy product free" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
 Build My First Etsy Product Free
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 </div>
 </div>
 </section>

 <Footer />
 </div>
 )
}
