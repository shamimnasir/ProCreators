'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Pencil, LayoutGrid, Search, Star, Download, ArrowRight, Layers } from 'lucide-react'
import { Header, Footer } from '@/components/landing'

const kdpPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI Tool for Amazon KDP Publishers',
  description: 'ProCreators is an AI publishing studio for Amazon KDP sellers that creates complete books, covers, and listings in under 2 hours.',
  url: 'https://procreators.io/for-kdp-publishers',
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'ProCreators KDP Publishing Tools',
    applicationCategory: 'BusinessApplication',
    description: 'AI tools for Amazon KDP publishers: ebook generator, cover designer with spine calculation, interior page builder, and Amazon listing writer.'
  }
}

const features = [
  { icon: BookOpen,    title: 'KDP cover generator with auto spine calculation', body: 'Front cover, spine, and back cover in one tool. Spine width auto-calculated from your page count. 300 DPI download, ready to upload.' },
  { icon: Pencil,      title: 'Ebook and chapter generator for any niche',       body: 'Pick a niche, pick a structure, and AI writes the full ebook. Every chapter. Table of contents. Author bio. Edit anything or publish as-is.' },
  { icon: LayoutGrid,  title: 'Interior page builder — journals, planners, coloring books', body: '6x9 and 8.5x11 KDP-formatted interiors, generated in minutes. Journals, habit trackers, planners, activity pages — no Canva required.' },
  { icon: Search,      title: 'Amazon listing writer with keyword optimisation', body: 'Title, 7 bullet points, description, and backend keywords — all written for Amazon search. One click to generate. Minutes to review and copy.' },
  { icon: Star,        title: 'Niche research built in',                          body: 'Find low-competition, high-demand niches before you start. No guessing. No separate tools. Start every product knowing it has a buyer waiting.' },
  { icon: Download,    title: 'Print-ready 300 DPI PDF export every time',       body: 'No reformatting. No re-exporting. Download and upload straight to KDP. Correct margins and bleed settings built in.' },
]

const productTypes = [
  'Ebooks and guides',
  'Prompted journals',
  'Daily / weekly / monthly planners',
  'Coloring books (AI line art)',
  'Activity books for children',
  'Habit and goal trackers',
  'Recipe and cooking books',
  'Word search and puzzle books',
]

export default function KdpPublishersClient() {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(kdpPageJsonLd) }} />
      <Header isLoggedIn={isLoggedIn} userName={userName} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* HERO */}
      <section aria-label="Hero — AI tool for Amazon KDP publishers" className="relative pt-32 pb-16 md:pt-40 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="container relative z-10 px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700">Built for Amazon KDP Publishers</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              The Only AI Tool <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Built Specifically for Amazon KDP Publishers</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Other AI tools generate content. ProCreators generates complete, KDP-ready products — formatted, covered, and listed — in one session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" onClick={cta} aria-label="Create your first KDP product free — no credit card required" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
                Publish My First Book Free
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
      <section aria-label="The KDP publishing grind at scale" className="container px-6 pb-20">
        <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-8 md:p-12 space-y-5">
          <h2 className="text-2xl md:text-4xl font-bold">The KDP Publishing Grind Isn't Sustainable at Scale</h2>
          <p className="text-muted-foreground leading-relaxed">You know the routine. Find a niche. Research competitors. Write the content. Design the cover in Canva. Calculate the spine width. Format the interior. Write the title and backend keywords. Upload to KDP. Wait for review. Fix the inevitable rejection. Then do it all again for the next book.</p>
          <p className="text-muted-foreground leading-relaxed">At 10–20 hours per book, you can publish 2–3 products per month — if everything goes right. At that pace, building a $3,000/month royalty income takes years of full-time work.</p>
          <p className="text-foreground font-semibold leading-relaxed">The publishers making $5,000–$15,000/month in royalties aren't working harder. They publish more products, faster. They have a system.</p>
        </div>
      </section>

      {/* SOLUTION */}
      <section aria-label="ProCreators features for KDP publishers" className="container px-6 pb-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">ProCreators Is That System. <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Under 2 Hours Per Product.</span></h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <article key={i} className="glass-card-elevated rounded-2xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </article>
            )
          })}
        </div>
        <div className="flex justify-center mt-12">
          <Button size="lg" onClick={cta} aria-label="Start publishing free — no credit card needed" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
            Start Publishing Free — No Credit Card Needed
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* PRODUCT TYPES */}
      <section aria-label="Types of KDP products you can publish" className="container px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">What You Can Publish With ProCreators</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {productTypes.map((p, i) => (
            <div key={i} className="glass-card-elevated rounded-2xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto shadow-sm">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-foreground">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section aria-label="Call to action — create your first KDP product free" className="container px-6 pb-24">
        <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-10 md:p-14 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Your next KDP product is 2 hours away.</h2>
          <p className="text-lg text-muted-foreground">Start with one free product. No credit card.</p>
          <div className="flex justify-center">
            <Button size="lg" onClick={cta} aria-label="Create your first KDP product free" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
              Create My First KDP Product Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
