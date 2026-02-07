'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Check, Lightbulb, Rocket, Brain, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useCases, popularTools } from './data'

export function UseCasesSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
            <Target className="h-4 w-4" />
            Built For Your Success
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Who Gets </span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">ADDICTED</span>
            <span className="text-foreground">?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Spoiler: <span className="text-orange-400 font-semibold">Everyone</span>. 
            But these folks got hooked first.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {useCases.map((useCase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent p-8 backdrop-blur-sm hover:border-[#7c3aed]/50 hover:bg-muted/50 transition-all duration-300"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-lg">
                <useCase.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{useCase.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{useCase.description}</p>
              <ul className="space-y-2">
                {useCase.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-[#a78bfa]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ToolsShowcase() {
  return (
    <section id="tools" className="py-20 md:py-32 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
            <Rocket className="h-4 w-4" />
            70+ AI Tools
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Your </span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Creative Arsenal</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every tool you need. Zero excuses left.
          </p>
        </div>

        {/* Simplified tools grid - just popular tools */}
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
          {popularTools.map((tool, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="px-6 py-3 rounded-full bg-white/5 border border-border hover:border-[#7c3aed]/50 hover:bg-white/10 transition-all cursor-pointer"
            >
              <span className="text-muted-foreground text-sm">{tool}</span>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-[#a78bfa] hover:text-[#7c3aed] font-medium">
            Explore all 70+ tools →
          </Link>
        </div>
      </div>
    </section>
  )
}

export function PhilosophySection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
              <Brain className="h-4 w-4" />
              Our Philosophy
            </div>
            <h2 className="mb-4 text-4xl md:text-6xl font-bold">
              <span className="text-foreground">Why We're </span>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Different</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]">
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Creator-First</h3>
              <p className="text-muted-foreground">Built by creators, for creators. We know your pain because we lived it.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Speed Obsessed</h3>
              <p className="text-muted-foreground">Every second counts. Our tools are built for speed, not complexity.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Addictively Good</h3>
              <p className="text-muted-foreground">We warned you. Once you start, you won't want to stop creating.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PopularToolsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Popular AI Tools</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
          {popularTools.map((tool, i) => (
            <div 
              key={i}
              className="px-6 py-3 rounded-full bg-white/5 border border-border hover:border-[#7c3aed]/50 hover:bg-white/10 transition-all cursor-pointer"
            >
              <span className="text-muted-foreground text-sm">{tool}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Default footer menus (used as fallback)
const DEFAULT_FOOTER_MENUS = {
  footer_product: {
    name: 'Product',
    items: [
      { id: 'fp1', label: 'All Features', link: '/#features' },
      { id: 'fp2', label: 'Pricing', link: '/pricing' },
      { id: 'fp3', label: 'Dashboard', link: '/dashboard' },
      { id: 'fp4', label: 'Roadmap', link: '/roadmap' }
    ]
  },
  footer_solutions: {
    name: 'Solutions',
    items: [
      { id: 'fs1', label: 'Content Creators', link: '/solutions/creators' },
      { id: 'fs2', label: 'Marketing Teams', link: '/solutions/marketers' },
      { id: 'fs3', label: 'Agencies', link: '/solutions/agencies' },
      { id: 'fs4', label: 'Educators', link: '/solutions/educators' }
    ]
  },
  footer_resources: {
    name: 'Resources',
    items: [
      { id: 'fr1', label: 'Help Center', link: '/docs' },
      { id: 'fr2', label: 'Blog', link: '/blog' },
      { id: 'fr3', label: 'Community', link: '/community' },
      { id: 'fr4', label: 'Status', link: '/status' }
    ]
  },
  footer_company: {
    name: 'Company',
    items: [
      { id: 'fc1', label: 'About Us', link: '/about' },
      { id: 'fc2', label: 'Careers', link: '/careers' },
      { id: 'fc3', label: 'Contact', link: '/contact' }
    ]
  }
}

const DEFAULT_LEGAL_ITEMS = [
  { id: 'fl1', label: 'Privacy Policy', link: '/privacy' },
  { id: 'fl2', label: 'Terms of Service', link: '/terms' },
  { id: 'fl3', label: 'Security', link: '/security' }
]

export function Footer() {
  const [footerMenus, setFooterMenus] = useState(Object.values(DEFAULT_FOOTER_MENUS))
  const [legalItems, setLegalItems] = useState(DEFAULT_LEGAL_ITEMS)

  // Fetch dynamic footer menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // Fetch footer columns
        const footerRes = await fetch('/api/menus?location=footer')
        const footerData = await footerRes.json()
        if (footerData.success && footerData.menus?.length > 0) {
          setFooterMenus(footerData.menus)
        }

        // Fetch legal/bottom links
        const legalRes = await fetch('/api/menus?location=footer_bottom')
        const legalData = await legalRes.json()
        if (legalData.success && legalData.menu?.items?.length > 0) {
          setLegalItems(legalData.menu.items)
        }
      } catch (error) {
        console.error('Failed to fetch footer menus:', error)
        // Keep default menus on error
      }
    }
    fetchMenus()
  }, [])

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="container px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <Logo variant="full" className="h-10 w-10 mb-4" />
            <p className="text-muted-foreground text-sm mb-6">
              The ultimate AI-powered content creation platform. From videos to ebooks, we help creators dominate every platform.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/procreators" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="https://github.com/procreators" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://instagram.com/procreators" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Dynamic Footer Columns */}
          {footerMenus.map((menu) => (
            <div key={menu.menuId || menu.name}>
              <h3 className="text-foreground font-semibold mb-4">{menu.name}</h3>
              <ul className="space-y-3">
                {(menu.items || []).map((item) => (
                  <li key={item.id}>
                    <Link 
                      href={item.link} 
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ProCreators. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalItems.map((item) => (
              <Link 
                key={item.id}
                href={item.link} 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
