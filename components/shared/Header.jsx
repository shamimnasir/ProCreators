'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

// KDP/Etsy publisher-focused primary navigation (matches landing Header)
const DEFAULT_NAV_ITEMS = [
  { id: 'h1', label: 'For KDP',   link: '/for-kdp-publishers' },
  { id: 'h2', label: 'For Etsy',  link: '/for-etsy-sellers' },
  { id: 'h3', label: 'Tools',     link: '/tools' },
  { id: 'h4', label: 'Pricing',   link: '/pricing' },
  { id: 'h5', label: 'Blog',      link: '/blog' },
  { id: 'h6', label: 'Dashboard', link: '/dashboard' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Note: We intentionally do NOT fetch menu items from /api/menus here.
  // The KDP/Etsy publisher navigation is the source of truth. To restore CMS-driven
  // nav in future, update the header menu via admin and re-enable the fetch.
  const navItems = DEFAULT_NAV_ITEMS

  return (
    <header className="fixed top-0 z-50 w-full glass-surface" aria-label="ProCreators main navigation">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/" aria-label="ProCreators home"><Logo variant="full" className="h-10 w-10" /></Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.id} href={item.link} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{item.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login"><Button variant="ghost" className="glass-btn rounded-xl">Log In</Button></Link>
          <Link href="/register" aria-label="Start publishing your first product free — no credit card required">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg glow-orange rounded-xl">Publish Free</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu" aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/30 bg-white/70 backdrop-blur-2xl">
          <div className="container px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link key={item.id} href={item.link} className="block text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
            <div className="pt-4 border-t border-white/30 space-y-3">
              <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" className="w-full glass-btn rounded-xl">Log In</Button></Link>
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}><Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl">Publish Free</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
