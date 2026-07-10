'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export function Header({ isLoggedIn, userName, mobileMenuOpen, setMobileMenuOpen }) {
 return (
 <header className="fixed top-0 z-50 w-full glass-surface" aria-label="ProCreators main navigation">
 <div className="container flex h-20 items-center justify-between px-6">
 <Link href="/" aria-label="ProCreators home">
 <Logo variant="full" className="h-10 w-10" />
 </Link>

 <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
 <Link href="/for-kdp-publishers" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">For KDP</Link>
 <Link href="/for-etsy-sellers" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">For Etsy</Link>
 <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Tools</Link>
 <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</Link>
 <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Blog</Link>
 <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Dashboard</Link>
 </nav>

 <div className="hidden md:flex items-center gap-3">
 {isLoggedIn ? (
 <>
 <span className="text-sm text-muted-foreground">Hi, {userName}</span>
 <Link href="/dashboard">
 <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg glow-orange rounded-xl">
 Go to Dashboard
 </Button>
 </Link>
 </>
 ) : (
 <>
 <Link href="/login">
 <Button variant="ghost" className="glass-btn rounded-xl">Log In</Button>
 </Link>
 <Link href="/register" aria-label="Start publishing your first product free, no credit card required">
 <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg glow-orange rounded-xl">
 Publish Free
 </Button>
 </Link>
 </>
 )}
 </div>

 <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu" aria-expanded={mobileMenuOpen}>
 {mobileMenuOpen ? <span className="h-6 w-6">✕</span> : <span className="h-6 w-6">☰</span>}
 </button>
 </div>

 {mobileMenuOpen && (
 <div className="md:hidden border-t border-white/30 bg-white/70 backdrop-blur-2xl">
 <div className="container px-6 py-6 space-y-4">
 <Link href="/for-kdp-publishers" className="block text-muted-foreground hover:text-foreground transition-colors">For KDP</Link>
 <Link href="/for-etsy-sellers" className="block text-muted-foreground hover:text-foreground transition-colors">For Etsy</Link>
 <Link href="/tools" className="block text-muted-foreground hover:text-foreground transition-colors">Tools</Link>
 <Link href="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
 <Link href="/blog" className="block text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
 <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
 <div className="pt-4 border-t border-white/30 space-y-3">
 {isLoggedIn ? (
 <>
 <p className="text-sm text-muted-foreground">Logged in as {userName}</p>
 <Link href="/dashboard" className="block">
 <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl">Go to Dashboard</Button>
 </Link>
 </>
 ) : (
 <>
 <Link href="/login" className="block">
 <Button variant="outline" className="w-full glass-btn rounded-xl">Log In</Button>
 </Link>
 <Link href="/register" className="block">
 <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl">Publish Free</Button>
 </Link>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </header>
 )
}

export function HeroSection({ onGetStarted, onExplore }) {
 return (
 <section aria-label="Hero. AI publishing studio for KDP and Etsy sellers" className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
 {/* Decorative glass orbs */}
 <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />
 <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
 <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />

 <div className="container relative z-10 px-6">
 <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7 }}
 className="space-y-8"
 >
 <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700">
 <BookOpen className="w-4 h-4" />
 AI Publishing Studio for KDP & Etsy Sellers
 </div>

 <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
 <span className="text-foreground block">Stop Spending 15 Hours on One Digital Product.</span>
 <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block">Publish in 30 Minutes or Less.</span>
 </h1>

 <p className="text-lg md:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
 ProCreators builds your complete Amazon KDP or Etsy product or your own Digital Assets with{' '}
 <span className="text-foreground font-semibold">ebook, cover, interior pages, and listing copy</span>{' '}done in one session. No designer. No writer. No excuses.
 </p>

 <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
 <Button
 size="lg"
 onClick={onGetStarted}
 aria-label="Create your first complete KDP or Etsy product free, no credit card required"
 className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl glow-orange rounded-2xl"
 >
 Publish My First Book Free
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 <button
 onClick={onExplore}
 aria-label="Watch a 90-second demo of the ProCreators publishing workflow"
 className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline pt-4 sm:pt-0 sm:self-center"
 >
 See how it works in 90 seconds ↓
 </button>
 </div>

 <p className="text-sm text-muted-foreground pt-2">
 Free trial includes one complete product. No credit card. No catch.
 </p>
 </motion.div>
 </div>
 </div>
 </section>
 )
}
