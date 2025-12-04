'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/">
          <Logo variant="full" className="h-10 w-10" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</Link>
          <Link href="/#tools" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Tools</Link>
          <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
          <Link href="/roadmap" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Roadmap</Link>
          <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Blog</Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Dashboard</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 hover:border-white/40">
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white border-0 glow-primary font-semibold">
              Start Free Trial
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0e27]/95 backdrop-blur-xl">
          <div className="container px-6 py-6 space-y-4">
            <Link href="/#features" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/#tools" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Tools</Link>
            <Link href="/#pricing" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/roadmap" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Roadmap</Link>
            <Link href="/blog" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link href="/dashboard" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <div className="pt-4 border-t border-white/10 space-y-3">
              <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
