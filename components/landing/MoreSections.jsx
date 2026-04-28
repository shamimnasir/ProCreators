'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Check,
  Lightbulb,
  Rocket,
  Brain,
  Shield,
  Video,
  Mic,
  Image,
  Presentation,
  FileText,
  BookOpen,
  Quote,
  MessageSquare,
  ListTodo,
  Newspaper,
  ScrollText,
  GraduationCap,
  BookMarked,
  Baby,
  Scissors,
  Edit3,
  Grid3X3,
  Image as ImageIcon,
  Layers,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useCases, popularTools } from './data'

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
    <section className="py-14 md:py-20 relative">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
            <Target className="h-4 w-4" />
            Built For People Who Create
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Who Uses </span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">ProCreators</span>
            <span className="text-foreground">?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From solo creators to marketing teams - if you make content, this is your toolkit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {useCases.map((useCase, i) => {
            const grad = useCase.gradient || 'from-purple-600 to-purple-400'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="group relative glass-card p-8 hover:bg-white/85 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <useCase.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground flex items-center gap-2">
                  {useCase.title}
                </h3>
                {useCase.stat && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${grad} text-white text-[10px] font-semibold uppercase tracking-wide mb-3 shadow-sm`}>
                    {useCase.stat}
                  </div>
                )}
                <p className="text-muted-foreground mb-4 leading-relaxed">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* Glow ring on hover */}
                <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl bg-gradient-to-br ${grad} -z-10 transition-opacity duration-500`}></div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ToolsShowcase() {
  return (
    <section id="tools" className="py-14 md:py-20 relative">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
            <Layers className="h-4 w-4" />
            70+ AI Tools
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Your </span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Creative Toolkit</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every tool you need to create, publish, and sell - all in one dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-12">
          {allTools.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group glass-card p-6 hover:bg-white/80 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tool.name}</h3>
              <p className="text-sm text-muted-foreground">{tool.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
          {popularTools.map((tool, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="px-5 py-2.5 glass-badge hover:bg-white/70 transition-all cursor-pointer"
            >
              <span className="text-muted-foreground text-sm">{tool}</span>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 font-medium">
            Explore all 70+ tools →
          </Link>
        </div>
      </div>
    </section>
  )
}

export function PhilosophySection() {
  return (
    <section className="py-14 md:py-20 relative">
      <div className="container px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
              <Brain className="h-4 w-4" />
              Our Philosophy
            </div>
            <h2 className="mb-4 text-4xl md:text-6xl font-bold">
              <span className="text-foreground">Why We're </span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Different</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-4">
              Most tools today are overloaded with features nobody asked for.
              <span className="text-orange-600 font-semibold"> We built ProCreators to be the opposite.</span>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Lightbulb, title: 'Creator-First',          desc: 'Built by creators, for creators. Every feature exists because someone actually needed it.', gradient: 'from-pink-500 to-rose-500' },
              { icon: Rocket,    title: 'Speed Over Complexity',  desc: 'Every second counts when you\'re creating at scale. Our tools are built for speed.',        gradient: 'from-orange-500 to-amber-500' },
              { icon: Shield,    title: 'Ridiculously Good',      desc: 'We obsess over output quality so you don\'t have to. Every tool is battle-tested.',         gradient: 'from-purple-500 to-violet-500' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative text-center glass-card p-8 hover:bg-white/85 hover:shadow-2xl transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: [0, 4, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                >
                  <item.icon className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {/* Hover glow ring */}
                <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl bg-gradient-to-br ${item.gradient} -z-10 transition-opacity duration-500`}></div>
              </motion.div>
            ))}
          </div>
          
          {/* Who is ProCreators for */}
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
                  className="px-5 py-3 glass-card hover:bg-white/80 transition-all"
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
    <section className="py-20 relative">
      <div className="container px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Popular AI Tools</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
          {popularTools.map((tool, i) => (
            <div 
              key={i}
              className="px-5 py-2.5 glass-badge hover:bg-white/70 transition-all cursor-pointer"
            >
              <span className="text-muted-foreground text-sm">{tool}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Default footer menus
const DEFAULT_FOOTER_MENUS = {
  footer_product: { name: 'Product', items: [
    { id: 'fp1', label: 'All Tools', link: '/tools' }, { id: 'fp2', label: 'Pricing', link: '/pricing' },
    { id: 'fp3', label: 'Dashboard', link: '/dashboard' }, { id: 'fp4', label: 'Roadmap', link: '/roadmap' }
  ]},
  footer_solutions: { name: 'Solutions', items: [
    { id: 'fs1', label: 'Content Creators', link: '/tools?category=video' }, { id: 'fs2', label: 'Marketing Teams', link: '/tools?category=business' },
    { id: 'fs3', label: 'Agencies', link: '/tools?category=business' }, { id: 'fs4', label: 'Educators', link: '/tools?category=education' }
  ]},
  footer_resources: { name: 'Resources', items: [
    { id: 'fr1', label: 'Documentation', link: '/docs' }, { id: 'fr2', label: 'Blog', link: '/blog' }, { id: 'fr3', label: 'FAQ', link: '/faq' }
  ]},
  footer_company: { name: 'Company', items: [
    { id: 'fc1', label: 'About Us', link: '/about' }, { id: 'fc2', label: 'Careers', link: '/careers' },
    { id: 'fc3', label: 'Contact', link: '/contact' }, { id: 'fc4', label: 'Media Kit', link: '/media-kit' }
  ]}
}

const DEFAULT_LEGAL_ITEMS = [
  { id: 'fl1', label: 'Privacy Policy', link: '/privacy' },
  { id: 'fl2', label: 'Terms of Service', link: '/terms' },
  { id: 'fl3', label: 'Cookie Policy', link: '/cookies' }
]

export function Footer() {
  const [footerMenus, setFooterMenus] = useState(Object.values(DEFAULT_FOOTER_MENUS))
  const [legalItems, setLegalItems] = useState(DEFAULT_LEGAL_ITEMS)
  const [siteSettings, setSiteSettings] = useState({
    footer: { footerDescription: 'The ultimate AI-powered content creation platform.', copyrightText: '© 2025 ProCreators. All rights reserved.', showSocialLinks: true },
    social: { twitter: '', facebook: '', instagram: '', linkedin: '', youtube: '', discord: '' }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [footerRes, legalRes, settingsRes] = await Promise.all([
          fetch('/api/menus?location=footer'), fetch('/api/menus?location=footer_bottom'), fetch('/api/site-settings')
        ])
        const footerData = await footerRes.json()
        const legalData = await legalRes.json()
        const settingsData = await settingsRes.json()
        if (footerData.success && footerData.menus?.length > 0) setFooterMenus(footerData.menus)
        if (legalData.success && legalData.menu?.items?.length > 0) setLegalItems(legalData.menu.items)
        if (settingsData.success && settingsData.settings) {
          setSiteSettings(prev => ({ ...prev, footer: { ...prev.footer, ...settingsData.settings.footer }, social: { ...prev.social, ...settingsData.settings.social } }))
        }
      } catch (error) { console.error('Failed to fetch footer data:', error) }
    }
    fetchData()
  }, [])

  const { footer, social } = siteSettings

  return (
    <footer className="glass-surface border-t border-white/40 mt-10">
      <div className="container px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo variant="full" className="h-10 w-10 mb-4" />
            <p className="text-muted-foreground text-sm mb-6">{footer.footerDescription}</p>
            {footer.showSocialLinks && (
              <div className="flex gap-4">
                {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>}
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></a>}
              </div>
            )}
          </div>
          {footerMenus.map((menu) => (
            <div key={menu.menuId || menu.name}>
              <h3 className="text-foreground font-semibold mb-4">{menu.name.replace(/^Footer\s*-\s*/i, '')}</h3>
              <ul className="space-y-3">
                {(menu.items || []).map((item) => (
                  <li key={item.id}><Link href={item.link} className="text-muted-foreground hover:text-foreground transition-colors text-sm">{item.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{footer.copyrightText}</p>
          <div className="flex gap-6">
            {legalItems.map((item) => (
              <Link key={item.id} href={item.link} className="text-muted-foreground hover:text-foreground transition-colors text-sm">{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
