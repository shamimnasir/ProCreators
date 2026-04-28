'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const DEFAULT_NAV_ITEMS = [
  { id: 'h1', label: 'Features', link: '/#features' },
  { id: 'h2', label: 'Tools', link: '/tools' },
  { id: 'h3', label: 'Pricing', link: '/pricing' },
  { id: 'h4', label: 'Roadmap', link: '/roadmap' },
  { id: 'h5', label: 'Blog', link: '/blog' },
  { id: 'h6', label: 'Dashboard', link: '/dashboard' }
]

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS)

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/menus?location=header')
        const data = await res.json()
        if (data.success && data.menu?.items?.length > 0) setNavItems(data.menu.items)
      } catch (error) { console.error('Failed to fetch navigation:', error) }
    }
    fetchNavigation()
  }, [])

  return (
    <header className="fixed top-0 z-50 w-full glass-surface">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/"><Logo variant="full" className="h-10 w-10" /></Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link key={item.id} href={item.link} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{item.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login"><Button variant="ghost" className="glass-btn rounded-xl">Log In</Button></Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg glow-orange rounded-xl">Start Free</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}><Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl">Start Free</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
