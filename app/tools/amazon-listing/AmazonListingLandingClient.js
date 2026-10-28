'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowRight, Check, Search, Tag, Sparkles, ListChecks } from 'lucide-react'
import { Header, Footer } from '@/components/landing'

const highlights = [
  { icon: ListChecks, title: 'Title + 7 Bullet Points',       body: 'Keyword-front-loaded 200-char title. 7 benefit-driven bullets (max 400 chars each) with capitalized hooks that convert.' },
  { icon: Sparkles,   title: 'Long-form Description',        body: 'HTML-safe multi-paragraph description with power words, use cases, gift/audience hooks, and a closing call-to-action.' },
  { icon: Tag,        title: '250-char Backend Keywords',    body: 'Comma-separated backend keywords with no repeats and no wasted characters. Direct copy-paste into KDP or Etsy.' },
  { icon: Search,     title: 'Amazon A9 Optimized',          body: 'Primary keyword lives in title, secondary keywords in bullets, backend keywords cover long-tail. Ranks faster on Amazon search.' },
  { icon: ShoppingCart, title: 'Works for KDP AND Etsy',     body: 'One click switches format between Amazon KDP listing and Etsy listing conventions. Backend keywords adapt to each marketplace.' },
  { icon: Check,      title: 'Built-in AI Humanizer',        body: 'Passes AI-detection filters so Amazon and Etsy never flag your listing as low-quality auto-generated content.' },
]

export default function AmazonListingLandingClient() {
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

  // If logged in, jump straight to the tool with the mode pre-selected.
  // If not, send to register with a next-URL callback.
  const openTool = () => {
    if (isLoggedIn) router.push('/dashboard/tools/blog-creator?type=amazon-listing')
    else router.push('/register?next=' + encodeURIComponent('/dashboard/tools/blog-creator?type=amazon-listing'))
  }

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={isLoggedIn} userName={userName} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* HERO */}
      <section aria-label="Amazon Listing Writer hero" className="relative pt-32 pb-16 md:pt-40 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="container relative z-10 px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-orange-700">
              <ShoppingCart className="w-4 h-4" />
              Amazon Listing Writer for KDP & Etsy
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              <span className="text-foreground block">Your Amazon Listing,</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block">Written and Optimized in Under 60 Seconds.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Title, 7 bullet points, description, and backend keywords, all Amazon A9 algorithm optimized. Built-in AI Humanizer so your listing reads human and never gets flagged. Works for KDP paperbacks, Kindle ebooks, and Etsy printables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" onClick={openTool} aria-label="Write my first Amazon listing free" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
                Write My First Listing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 glass-btn border-2 border-purple-400/50 hover:border-purple-500 text-purple-700 rounded-2xl">See Plans</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">First listing is free. No credit card. Copy-paste ready for your KDP or Etsy dashboard.</p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section aria-label="Amazon Listing Writer capabilities" className="container px-6 pb-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">Everything an Amazon Listing Actually Needs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Not a generic blog post repurposed. A proper Amazon KDP / Etsy listing structure, filled with the copy that converts.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {highlights.map((f, i) => {
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
      </section>

      {/* SAMPLE OUTPUT */}
      <section aria-label="Sample output structure" className="container px-6 pb-20">
        <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-8 md:p-10 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Sample Output You Get in One Click</h2>
          <div className="space-y-4 text-sm md:text-base">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Title (200 chars)</p>
              <p className="p-3 rounded-lg bg-muted/40 font-mono text-xs md:text-sm">Gratitude Journal for Women: 120-Day Prompted Daily Reflection Notebook, 6x9 Softcover, Perfect Gift for Moms, Sisters, Best Friends...</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">7 Bullet Points</p>
              <ul className="space-y-1.5 p-3 rounded-lg bg-muted/40 text-xs md:text-sm">
                <li>• <strong>PERFECT GIFT FOR HER</strong> — Thoughtful birthday, holiday, or self-care gift...</li>
                <li>• <strong>120 DAYS OF GUIDED PROMPTS</strong> — Unique morning and evening reflections...</li>
                <li>• <strong>PREMIUM 6x9 SOFTCOVER</strong> — Fits in bag, satisfying page count, no bleed-through...</li>
                <li>• <em>4 more bullets...</em></li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Backend Keywords (250 chars)</p>
              <p className="p-3 rounded-lg bg-muted/40 font-mono text-xs">gratitude notebook, journal for women, mindfulness planner, prompted diary, self care gift, teen girl journal, daily reflection, morning pages, women empowerment, positive thinking, mental wellness, mother daughter gift</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Try the Amazon Listing Writer" className="container px-6 pb-24">
        <div className="mx-auto max-w-4xl glass-card-elevated rounded-3xl p-10 md:p-14 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Your next Amazon listing is one click away.</h2>
          <p className="text-lg text-muted-foreground">First listing is free. Copy-paste ready.</p>
          <div className="flex justify-center">
            <Button size="lg" onClick={openTool} aria-label="Write my first listing free" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
              Write My First Listing Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
