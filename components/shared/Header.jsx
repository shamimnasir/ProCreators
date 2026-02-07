'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useTheme } from 'next-themes'

// Default navigation items (used as fallback)
const DEFAULT_NAV_ITEMS = [
  { id: 'h1', label: 'Features', link: '/#features' },
  { id: 'h2', label: 'Tools', link: '/#tools' },
  { id: 'h3', label: 'Pricing', link: '/pricing' },
  { id: 'h4', label: 'Roadmap', link: '/roadmap' },
  { id: 'h5', label: 'Blog', link: '/blog' },
  { id: 'h6', label: 'Dashboard', link: '/dashboard' }
]

export function Header() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS)

  // Fetch dynamic navigation from Menu API
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/menus?location=header')
        const data = await res.json()
        if (data.success && data.menu?.items?.length > 0) {
          setNavItems(data.menu.items)
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error)
        // Keep default items on error
      }
    }
    fetchNavigation()
  }, [])

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/">
          <Logo variant="full" className="h-10 w-10" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.id} 
              href={item.link} 
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="border border-border hover:bg-accent">
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 glow-primary font-semibold">
              Start Free Trial
            </Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.id}
                href={item.link} 
                className="block text-muted-foreground hover:text-foreground transition-colors" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>
              <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
