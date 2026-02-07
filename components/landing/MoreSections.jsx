'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Check, Lightbulb, Rocket, Brain, AlertTriangle, 
  Video, Mic, Image, Presentation, FileText, BookOpen, Quote, MessageSquare,
  ListTodo, Newspaper, ScrollText, GraduationCap, BookMarked, Baby,
  Scissors, Edit3, Grid3X3, Image as ImageIcon, Zap, Heart } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useCases, popularTools } from './data'

// Comprehensive tool list with icons and descriptions
const allTools = [
  { name: 'Video Editor', icon: Video, desc: 'Trim, merge, and enhance videos', color: 'from-orange-500 to-amber-500' },
  { name: 'AI Image Editor', icon: Edit3, desc: 'Transform any image with AI magic', color: 'from-purple-500 to-violet-500' },
  { name: 'AI Thumbnail Maker', icon: Image, desc: 'Platform-optimized thumbnails with AI', color: 'from-green-500 to-emerald-500' },
  { name: 'Photo Cards', icon: Heart, desc: 'Beautiful social media cards', color: 'from-pink-500 to-rose-500' },
  { name: 'Learning Cards', icon: GraduationCap, desc: 'Educational flashcards & study materials', color: 'from-cyan-500 to-teal-500' },
  { name: 'Carousels', icon: Grid3X3, desc: 'Multi-slide social media carousels', color: 'from-blue-500 to-indigo-500' },
  { name: 'Image Generator', icon: ImageIcon, desc: 'Create stunning AI-generated images', color: 'from-lime-500 to-green-500' },
  { name: 'Slides Maker', icon: Presentation, desc: 'Full presentation decks in minutes', color: 'from-orange-500 to-red-500' },
  { name: 'Quotes Generator', icon: Quote, desc: 'Inspiring quotes for social media', color: 'from-yellow-500 to-orange-500' },
  { name: 'Thread Creator', icon: MessageSquare, desc: 'Engaging Twitter/X threads', color: 'from-sky-500 to-blue-500' },
  { name: 'List Maker', icon: ListTodo, desc: 'Comprehensive lists & listicles', color: 'from-rose-500 to-pink-500' },
  { name: 'News Articles', icon: Newspaper, desc: 'Professional news-style content', color: 'from-red-500 to-rose-500' },
  { name: 'Long-Form Articles', icon: FileText, desc: '1500+ word in-depth content', color: 'from-amber-500 to-yellow-500' },
  { name: 'Tutorials', icon: ScrollText, desc: 'Step-by-step how-to guides', color: 'from-teal-500 to-cyan-500' },
  { name: 'Ebook Generator', icon: BookOpen, desc: 'Complete ebooks with chapters & covers', color: 'from-indigo-500 to-purple-500' },
  { name: 'Storybook Maker', icon: Baby, desc: "Children's stories with illustrations", color: 'from-fuchsia-500 to-pink-500' },
]

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
          <p className="text-base text-muted-foreground max-w-3xl mx-auto mt-4">
            <span className="text-orange-400 font-semibold">So simple, even a 10-year-old can create stunning content.</span>
            {' '}From content creators to job seekers, business builders to product makers - we've made AI ridiculously easy for everyone.
          </p>
        </div>

        {/* Full Tool Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {allTools.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent hover:border-[#7c3aed]/50 hover:bg-muted/50 transition-all duration-300 cursor-pointer"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tool.name}</h3>
              <p className="text-sm text-muted-foreground">{tool.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick access pills */}
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
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-4">
              AI tools today are complicated. We're here to change that. 
              <span className="text-orange-400 font-semibold"> ProCreators makes AI so easy that a kid can use it and get things done.</span>
            </p>
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
          
          {/* Who is ProCreators for? */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-6">Who is ProCreators For?</h3>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {[
                { emoji: '🎬', label: 'Content Creators', desc: 'Create viral videos, thumbnails & posts' },
                { emoji: '💼', label: 'Job Seekers', desc: 'Build resumes, cover letters & portfolios' },
                { emoji: '🏢', label: 'Business Builders', desc: 'Generate pitches, plans & marketing' },
                { emoji: '🛠️', label: 'Product Makers', desc: 'Design ebooks, courses & digital assets' },
                { emoji: '📚', label: 'Students & Teachers', desc: 'Create study materials & lessons' },
                { emoji: '🚀', label: 'Anyone with Ideas', desc: 'Turn concepts into reality' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-border hover:border-[#7c3aed]/50 hover:bg-white/10 transition-all"
                >
                  <span className="text-2xl mr-2">{item.emoji}</span>
                  <span className="text-foreground font-medium">{item.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
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
  const [siteSettings, setSiteSettings] = useState({
    footer: {
      footerDescription: 'The ultimate AI-powered content creation platform. From videos to ebooks, we help creators dominate every platform.',
      copyrightText: '© 2025 ProCreators. All rights reserved.',
      showSocialLinks: true
    },
    social: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      discord: ''
    }
  })

  // Fetch dynamic footer menus and site settings
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch site settings for footer description and social links
        const settingsRes = await fetch('/api/site-settings')
        const settingsData = await settingsRes.json()
        if (settingsData.success && settingsData.settings) {
          setSiteSettings(prev => ({
            ...prev,
            footer: { ...prev.footer, ...settingsData.settings.footer },
            social: { ...prev.social, ...settingsData.settings.social }
          }))
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error)
        // Keep default values on error
      }
    }
    fetchData()
  }, [])

  const { footer, social } = siteSettings

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="container px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <Logo variant="full" className="h-10 w-10 mb-4" />
            <p className="text-muted-foreground text-sm mb-6">
              {footer.footerDescription}
            </p>
            {footer.showSocialLinks && (
              <div className="flex gap-4">
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {social.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </a>
                )}
                {social.discord && (
                  <a href={social.discord} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Footer Columns */}
          {footerMenus.map((menu) => (
            <div key={menu.menuId || menu.name}>
              <h3 className="text-foreground font-semibold mb-4">
                {menu.name.replace(/^Footer\s*-\s*/i, '')}
              </h3>
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
            {footer.copyrightText}
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
