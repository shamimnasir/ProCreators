'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Plus, BookOpen, Image as ImageIcon, TrendingUp, FileText, Mic, Layers, Film, Search, Video, PenLine, Palette } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { tools } from './data'

export function Header({ isLoggedIn, userName, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header className="fixed top-0 z-50 w-full glass-surface">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/">
          <Logo variant="full" className="h-10 w-10" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</Link>
          <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Tools</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</Link>
          <Link href="/roadmap" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Roadmap</Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Blog</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Dashboard</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
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
                <Button variant="ghost" className="glass-btn rounded-xl">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg glow-orange rounded-xl">
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <span className="h-6 w-6">✕</span> : <span className="h-6 w-6">☰</span>}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/30 bg-white/70 backdrop-blur-2xl">
          <div className="container px-6 py-6 space-y-4">
            <Link href="/#features" className="block text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/tools" className="block text-muted-foreground hover:text-foreground transition-colors">Tools</Link>
            <Link href="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/roadmap" className="block text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
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
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl">Start Free</Button>
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
    <section className="relative pt-32 pb-10 md:pt-40 md:pb-16 overflow-hidden">
      {/* Decorative glass orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700">
              70+ Creation Tools in One Place
            </div>

            {/* Main H1 - sized to keep each phrase on one line */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              <span className="text-foreground block">Create Content. Build Digital Assets.</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent block">Powered by AI. Zero Skills Needed.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
              Turn any idea into videos, content, designs, UGC Ads, and digital products -
              <span className="text-foreground font-semibold"> in minutes</span>, all from one simple AI dashboard.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl glow-orange rounded-2xl"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 glass-btn border-2 border-purple-400/50 hover:border-purple-500 text-purple-700 rounded-2xl"
                onClick={onExplore}
              >
                See All 70+ Tools
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">
                Free credits for 30 days - No credit card required - Cancel anytime
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-0.5 text-amber-500">
                  {'★★★★★'}
                </span>
                <span className="text-foreground font-semibold">Rated 4.8/5</span>
                <span className="text-muted-foreground">by 15K+ creators</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Animated Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-16 max-w-6xl mx-auto"
        >
          <div className="relative">
            {/* Browser chrome mockup */}
            <div className="glass-card-elevated overflow-hidden shadow-2xl shadow-purple-200/40 rounded-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/60 border-b border-white/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="glass-card-subtle py-1.5 px-4 text-xs text-muted-foreground text-center rounded-lg">
                    🔒 procreators.io/dashboard
                  </div>
                </div>
              </div>

              {/* Animated dashboard body */}
              <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50/40 p-4 md:p-6">
                <div className="grid grid-cols-12 gap-4">
                  {/* Sidebar */}
                  <aside className="col-span-3 md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm shadow-md">P</div>
                      <div className="space-y-1.5 flex-1 hidden md:block">
                        <div className="h-2 w-12 bg-purple-200/70 rounded"></div>
                        <div className="h-2 w-8 bg-purple-200/70 rounded"></div>
                      </div>
                    </div>
                    {['Content', 'Design', 'Products', 'Library'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${i === 0 ? 'bg-purple-100/70' : ''}`}>
                        <div className={`w-3.5 h-3.5 rounded ${i === 0 ? 'bg-purple-400' : 'bg-slate-300'}`}></div>
                        <span className={`text-[11px] hidden md:inline ${i === 0 ? 'text-purple-700 font-medium' : 'text-slate-500'}`}>{item}</span>
                      </div>
                    ))}
                  </aside>

                  {/* Main content area */}
                  <div className="col-span-9 md:col-span-10 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Videos Created', value: '124', delta: '+12%', color: 'from-pink-400 to-pink-600', w: '78%' },
                        { label: 'Content Posts', value: '856', delta: '+23%', color: 'from-blue-400 to-blue-600', w: '60%' },
                        { label: 'Images Made', value: '2.4K', delta: '+18%', color: 'from-purple-400 to-purple-600', w: '72%' },
                        { label: 'Credits Left', value: '1,840', delta: '', color: 'from-emerald-400 to-green-500', w: '45%' }
                      ].map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                          className="bg-white rounded-xl p-3 shadow-sm border border-slate-100"
                        >
                          <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                          <div className="flex items-end justify-between">
                            <p className="text-lg md:text-xl font-bold text-slate-800">{s.value}</p>
                            {s.delta && <span className="text-[10px] text-green-600 font-medium">{s.delta}</span>}
                          </div>
                          <div className="h-1 mt-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: s.w }}
                              transition={{ duration: 1.2, delay: 0.8 + i * 0.1 }}
                              className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                            ></motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Content cards row */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Pink video card */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="aspect-[4/5] bg-gradient-to-br from-pink-200 via-pink-100 to-rose-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-pink-100"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
                        >
                          <Play className="w-5 h-5 text-purple-600 ml-0.5 fill-purple-600" />
                        </motion.div>
                        <span className="absolute bottom-2 right-2 bg-slate-800/90 text-white text-[9px] px-1.5 py-0.5 rounded">2:34</span>
                        <div className="absolute bottom-2 left-2 right-12 space-y-1">
                          <div className="h-1.5 w-full bg-white/60 rounded"></div>
                          <div className="h-1 w-2/3 bg-white/40 rounded"></div>
                        </div>
                      </motion.div>

                      {/* Blog card */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1.15 }}
                        className="aspect-[4/5] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 flex flex-col border border-blue-100"
                      >
                        <div className="space-y-1.5 flex-1">
                          {[100, 80, 60, 95, 70, 85].map((w, i) => (
                            <motion.div
                              key={i}
                              initial={{ width: 0 }}
                              animate={{ width: `${w}%` }}
                              transition={{ duration: 0.8, delay: 1.4 + i * 0.08 }}
                              className="h-1.5 bg-blue-200/80 rounded"
                            />
                          ))}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">SEO</span>
                          <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Published</span>
                        </div>
                      </motion.div>

                      {/* Thumbnail grid */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 1.3 }}
                        className="aspect-[4/5] grid grid-cols-2 gap-1.5 p-2 bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-xl border border-amber-100"
                      >
                        {[
                          'from-orange-300 to-amber-200',
                          'from-violet-300 to-blue-200',
                          'from-emerald-300 to-teal-200',
                          'from-pink-300 to-rose-200'
                        ].map((g, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 1.5 + i * 0.1 }}
                            className={`bg-gradient-to-br ${g} rounded-lg`}
                          ></motion.div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Card titles row */}
                    <div className="grid grid-cols-3 gap-3 -mt-2">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">Product Launch V...</p>
                        <p className="text-[9px] text-slate-400">Generated 2h ago</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">10 Growth Hacking Tips</p>
                        <p className="text-[9px] text-slate-400">1,234 views</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">Thumbnail Batch</p>
                        <p className="text-[9px] text-slate-400">4 images ready</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating animated cards */}
            {/* AI Video - top-left */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 1.2 },
                x: { duration: 0.8, delay: 1.2 },
                y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }
              }}
              className="absolute -left-2 md:-left-6 top-[28%] hidden sm:block z-10"
            >
              <div className="bg-white rounded-2xl p-3 shadow-xl border border-purple-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">AI Video</div>
                  <div className="text-[10px] text-green-600 font-medium">● Ready in 2 min</div>
                </div>
              </div>
            </motion.div>

            {/* Create button - top-right */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.4, type: 'spring' }}
              className="absolute -right-2 md:-right-4 -top-3 hidden sm:block z-10"
            >
              <div className="flex items-center gap-2">
                <button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Create
                </button>
                <div className="w-7 h-7 rounded-full bg-purple-500 shadow-lg"></div>
              </div>
            </motion.div>

            {/* Ebook Created - top-right */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 1.5 },
                x: { duration: 0.8, delay: 1.5 },
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }
              }}
              className="absolute -right-2 md:-right-8 top-[18%] hidden sm:block z-10"
            >
              <div className="bg-white rounded-2xl p-3 shadow-xl border border-orange-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Ebook Created</div>
                  <div className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span>✓</span> 12 chapters done</div>
                </div>
              </div>
            </motion.div>

            {/* 4 Thumbnails - bottom-left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 1.7 },
                y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 2 }
              }}
              className="absolute left-[28%] -bottom-6 hidden sm:block z-10"
            >
              <div className="bg-white rounded-2xl p-3 shadow-xl border border-emerald-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">4 Thumbnails</div>
                  <div className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span>✓</span> Batch Generated</div>
                </div>
              </div>
            </motion.div>

            {/* Blog Post SEO - bottom-right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -7, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 1.9 },
                y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }
              }}
              className="absolute right-[20%] -bottom-4 hidden sm:block z-10"
            >
              <div className="bg-white rounded-2xl p-3 shadow-xl border border-blue-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Blog Post</div>
                  <div className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span>✓</span> SEO Score: 96</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scrolling tool ribbon */}
        <div className="mt-20 md:mt-24 relative w-full overflow-hidden py-6 marquee-mask">
          <motion.div
            className="flex gap-3 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
          >
            {[
              { name: 'AI Avatar Studio', icon: Video,    color: 'from-pink-500 to-rose-500' },
              { name: 'UGC Ad Studio',   icon: Film,     color: 'from-orange-500 to-amber-500' },
              { name: 'Ebook Creator',   icon: BookOpen, color: 'from-emerald-500 to-green-500' },
              { name: 'Voice Studio',    icon: Mic,      color: 'from-amber-500 to-orange-500' },
              { name: 'Carousel Maker',  icon: Layers,   color: 'from-blue-500 to-indigo-500' },
              { name: 'Reels Creator',   icon: Film,     color: 'from-rose-500 to-pink-500' },
              { name: 'SEO Optimizer',   icon: Search,   color: 'from-emerald-500 to-teal-500' },
              { name: 'AI Video Studio', icon: Video,    color: 'from-red-500 to-rose-500' },
              { name: 'Blog Writer',     icon: PenLine,  color: 'from-slate-500 to-slate-700' },
              { name: 'Image Generator', icon: Palette,  color: 'from-purple-500 to-fuchsia-500' },
              { name: 'Thumbnail Maker', icon: ImageIcon,color: 'from-cyan-500 to-blue-500' },
              { name: 'Script Writer',   icon: FileText, color: 'from-indigo-500 to-purple-500' }
            ].concat([
              { name: 'AI Avatar Studio', icon: Video,    color: 'from-pink-500 to-rose-500' },
              { name: 'UGC Ad Studio',   icon: Film,     color: 'from-orange-500 to-amber-500' },
              { name: 'Ebook Creator',   icon: BookOpen, color: 'from-emerald-500 to-green-500' },
              { name: 'Voice Studio',    icon: Mic,      color: 'from-amber-500 to-orange-500' },
              { name: 'Carousel Maker',  icon: Layers,   color: 'from-blue-500 to-indigo-500' },
              { name: 'Reels Creator',   icon: Film,     color: 'from-rose-500 to-pink-500' },
              { name: 'SEO Optimizer',   icon: Search,   color: 'from-emerald-500 to-teal-500' },
              { name: 'AI Video Studio', icon: Video,    color: 'from-red-500 to-rose-500' },
              { name: 'Blog Writer',     icon: PenLine,  color: 'from-slate-500 to-slate-700' },
              { name: 'Image Generator', icon: Palette,  color: 'from-purple-500 to-fuchsia-500' },
              { name: 'Thumbnail Maker', icon: ImageIcon,color: 'from-cyan-500 to-blue-500' },
              { name: 'Script Writer',   icon: FileText, color: 'from-indigo-500 to-purple-500' }
            ]).map((tool, i) => {
              const Icon = tool.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-md border border-slate-100 flex-shrink-0"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{tool.name}</span>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
