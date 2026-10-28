'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock, DollarSign, Layers } from 'lucide-react'
import Link from 'next/link'
import { pricingTiers, painPoints } from './data'

// ============================================================
// PAIN POINTS SECTION
// ============================================================
export function FeaturesSection({ onGetStarted }) {
 return (
 <section id="features" aria-label="The problems KDP and Etsy sellers face without ProCreators" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-14 space-y-4">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">You’re Doing in 15 Hours What Should Take 30 Minutes</h2>
 </div>
 <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
 {painPoints.map((p, i) => {
 const Icon = p.icon
 return (
 <motion.article
 key={i}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.1 }}
 className="glass-card-elevated rounded-2xl p-7 space-y-4"
 >
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
 <Icon className="w-6 h-6 text-white" />
 </div>
 <h3 className="text-lg md:text-xl font-bold text-foreground">{p.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
 </motion.article>
 )
 })}
 </div>
 </div>
 </section>
 )
}

// ============================================================
// HOW IT WORKS, 4 STEP FLOW
// ============================================================
const steps = [
 { num: '01', title: 'Pick your niche and product type', body: 'Choose ebook, journal, planner, coloring book, or activity book. Enter your niche. ProCreators tells you what’s selling and suggests angles with low competition.' },
 { num: '02', title: 'AI builds your complete content', body: 'Chapters are written. Interior pages are designed. The structure is built. You review, edit anything you like, or publish as-is. Most users change less than you’d expect.' },
 { num: '03', title: 'Cover designed, spine calculated, export ready', body: 'Your cover is generated from KDP-optimized templates. Spine width is calculated automatically based on your page count. Export as 300 DPI PDF, ready to upload to KDP directly.' },
 { num: '04', title: 'Your Amazon listing, written and keyword-optimized', body: 'Title, 7 bullet points, book description, and backend keywords, all written for Amazon search. Copy. Paste. Publish. Done.' },
]

export function ComparisonSection({ onGetStarted }) {
 return (
 <section aria-label="How ProCreators builds a complete KDP or Etsy product in 4 steps" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-14 space-y-3">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">From Blank Page to Published Product. In One Session</h2>
 <p className="text-lg text-muted-foreground">Here is exactly what happens when you open ProCreators.</p>
 </div>
 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
 {steps.map((s, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.08 }}
 className="glass-card-elevated rounded-2xl p-6 space-y-3 relative"
 >
 <div className="text-4xl font-black bg-gradient-to-br from-orange-400 to-amber-500 bg-clip-text text-transparent">{s.num}</div>
 <h3 className="text-base md:text-lg font-bold text-foreground">{s.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
 </motion.div>
 ))}
 </div>
 <div className="flex justify-center mt-12">
 <Button size="lg" onClick={onGetStarted} aria-label="Try ProCreators free, build your first product now" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
 Try It Free. Build Your First Product Now
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 </div>
 </div>
 </section>
 )
}

// ============================================================
// SOCIAL PROOF, 4 metric cards (testimonials removed pending real ones)
// ============================================================
const stats = [
 { number: '< 2 hrs', label: 'Average time from blank page to published product' },
 { number: '1 session', label: 'To complete ebook, cover, interior, and Amazon listing' },
 { number: '$0', label: 'Extra tools needed alongside ProCreators' },
 { number: '300 DPI', label: 'KDP-ready PDF export, every product, every time' },
]

export function StatsSection() {
 return (
 <section aria-label="Early results from ProCreators publishers" className="py-20 md:py-24">
 {/*
 TODO BEFORE LAUNCH: Replace this section with verified user testimonials.
 Requirements for each testimonial:
 - Real full name
 - Link to their Amazon Author Page or Etsy store
 - Specific before/after numbers (hours saved, products published, royalties earned)
 - Photo with their permission
 Placeholder removed to protect trust. Do not re-add fake testimonials.
 */}
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-10 space-y-3">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">What Publishers Are Experiencing</h2>
 <p className="text-muted-foreground text-lg">Early publisher results speak for themselves.</p>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
 {stats.map((s, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.08 }}
 className="glass-card-elevated rounded-2xl p-6 text-center"
 >
 <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-orange-500 to-amber-500 bg-clip-text text-transparent">{s.number}</div>
 <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">{s.label}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 )
}

// TestimonialsSection kept as a passthrough noop (legacy import).
export function TestimonialsSection() { return null }

// ============================================================
// PRICING SECTION
// ============================================================
export function PricingSection() {
 return (
 <section id="pricing" aria-label="ProCreators pricing plans for KDP and Etsy publishers" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-12 space-y-4">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Priced for Publishers. Paid Back With Your First Sale.</h2>
 <p className="text-lg text-muted-foreground">A journal on Amazon earns $2–$8 per sale. Our $29/month plan pays for itself after 4–10 sales. Every product you publish after that is pure profit margin.</p>
 </div>

 <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
 {pricingTiers.map((tier, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.08 }}
 className={`glass-card-elevated rounded-3xl p-7 space-y-5 relative ${tier.highlighted ? 'ring-2 ring-orange-400 scale-[1.02]' : ''}`}
 >
 {tier.badge && (
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{tier.badge}</div>
 )}
 <div>
 <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
 <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-4xl md:text-5xl font-black text-foreground">{tier.price}</span>
 <span className="text-sm text-muted-foreground">{tier.price_sub}</span>
 </div>
 <ul className="space-y-2">
 {tier.features.map((f, j) => (
 <li key={j} className="flex items-start gap-2 text-sm text-foreground">
 <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
 <span>{f}</span>
 </li>
 ))}
 </ul>
 <Link href={tier.cta_href} aria-label={tier.cta_aria}>
 <Button className={`w-full font-bold py-6 rounded-xl ${tier.highlighted ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg glow-orange' : 'glass-btn border-2 border-purple-400/50 hover:border-purple-500 text-purple-700'}`}>
 {tier.cta_text}
 </Button>
 </Link>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 )
}

// ============================================================
// FINAL CTA SECTION
// ============================================================
export function CTASection({ onGetStarted }) {
 return (
 <section aria-label="Call to action, publish your first KDP product free" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-10 md:p-16 text-center space-y-6 relative overflow-hidden">
 <div className="absolute -top-24 -left-16 w-72 h-72 bg-orange-200/40 rounded-full blur-3xl" />
 <div className="absolute -bottom-24 -right-16 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
 <div className="relative">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your Next Published Book Is 30 Minutes Away.</h2>
 <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Create one complete product free. No credit card. No tutorials to watch. Just open the Ebook Creator and start.</p>
 <div className="flex justify-center mt-8">
 <Button size="lg" onClick={onGetStarted} aria-label="Build my first book free, no credit card" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
 Build My First Book Free
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 </div>
 <p className="text-xs text-muted-foreground mt-4">Free product includes ebook content, KDP cover, interior pages, and Amazon listing.</p>
 </div>
 </div>
 </div>
 </section>
 )
}
