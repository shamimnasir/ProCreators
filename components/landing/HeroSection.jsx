'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { tools } from './data'

export function Header({ isLoggedIn, userName, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/">
          <Logo variant="full" className="h-10 w-10" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</Link>
          <Link href="#tools" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Tools</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</Link>
          <Link href="/roadmap" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Roadmap</Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Blog</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Dashboard</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="text-sm text-muted-foreground">Hi, {userName}</span>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
                  Go to Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="border border-border hover:bg-accent">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
                  Start Free Trial
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <span className="h-6 w-6">✕</span> : <span className="h-6 w-6">☰</span>}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container px-6 py-6 space-y-4">
            <Link href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#tools" className="block text-muted-foreground hover:text-foreground transition-colors">Tools</Link>
            <Link href="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/roadmap" className="block text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
            <Link href="/blog" className="block text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <div className="pt-4 border-t border-border space-y-3">
              {isLoggedIn ? (
                <>
                  <p className="text-sm text-muted-foreground">Logged in as {userName}</p>
                  <Link href="/dashboard" className="block">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold">Go to Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">Log In</Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold">Start Free Trial</Button>
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
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyOCwxMjgsMTI4LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      </div>
      
      <div className="container relative z-10 px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Warning Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa]">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              WARNING: Highly Addictive Platform
            </div>

            {/* Main H1 */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Don't</span>
              <span className="text-foreground"> use </span>
              <span className="text-[#a78bfa]">ProCreators</span>
              <span className="text-foreground">,</span>
              <br />
              <span className="text-foreground">because it's </span>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">ADDICTIVE</span>
            </h1>

            {/* H2 */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
              It solves <span className="text-foreground font-semibold">ALL the problems</span> of Creators, Businesses, Educators, Students & Job Seekers in <span className="text-[#a78bfa] font-bold">ONE place</span>
              <br />
              <span className="text-lg text-muted-foreground/80">...and it just keeps releasing <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">CREATOR DOPAMINES</span>!</span>
            </p>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-orange-400 font-medium flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Once you're in, there's no way out!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 text-black font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
              >
                Get Addicted Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-[#7c3aed] bg-transparent hover:bg-[#7c3aed]/20 text-foreground"
                onClick={onExplore}
              >
                Explore Tools
              </Button>
            </div>

            {/* Trial notice */}
            <p className="text-sm text-muted-foreground">
              14-day free trial • No credit card required • Cancel anytime
            </p>

            {/* Easy to use badge */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="text-green-400 text-sm font-medium">✓ So easy, even a kid can create</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
                <span className="text-blue-400 text-sm font-medium">✓ No AI skills required</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                <span className="text-purple-400 text-sm font-medium">✓ 70+ tools, one platform</span>
              </div>
            </div>

            {/* Tool badges */}
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">Integrated AI Models:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {tools.map((tool, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                    <tool.icon className="h-4 w-4 text-[#a78bfa]" />
                    <span className="text-sm text-muted-foreground">{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#a78bfa]/20 rounded-full blur-3xl animate-pulse"></div>
    </section>
  )
}
