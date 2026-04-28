'use client'

import { motion } from 'framer-motion'
import { Check, Star, Heart, CircleDollarSign, ArrowRight, Layers, Shield, Video, BookOpen, Image as ImageIcon, FileText, Presentation, MessageSquare, Play, Sparkle, TrendingUp, DollarSign, Search, Type, Paintbrush } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { features, stats } from './data'

// Visual feature showcases - each with a custom ANIMATED MOCKUP (no static images)
const featureShowcases = [
  {
    key: 'video',
    title: 'AI Video Studio',
    subtitle: 'Create stunning videos in minutes, not hours',
    description: 'From script to screen - generate talking-head clips, cinematic B-roll, and UGC-style ads powered by AI. No camera, no editing skills needed.',
    features: ['AI-powered video generation', 'Multiple avatar styles', 'Auto-subtitles & voiceover', 'Export in any aspect ratio'],
    gradient: 'from-pink-500 to-rose-500',
    icon: Video,
    stats: [{ label: 'Avg. render time', value: '2 min' }, { label: 'Hrs saved/week', value: '15+' }]
  },
  {
    key: 'content',
    title: 'Content & Blog Engine',
    subtitle: 'Write compelling content at scale',
    description: 'Generate SEO-optimized articles, social media threads, newsletters, and more. Built-in research and fact-checking keeps your content credible.',
    features: ['Long-form articles (3000+ words)', 'SEO optimization built-in', 'Multi-language support', '10+ content formats'],
    gradient: 'from-blue-500 to-indigo-500',
    icon: FileText,
    stats: [{ label: 'Keywords matched', value: '12/15' }, { label: 'Originality', value: '98%' }]
  },
  {
    key: 'design',
    title: 'Visual Design Suite',
    subtitle: 'Thumbnails, carousels, and graphics that convert',
    description: 'AI-powered image generation, professional thumbnail maker, Instagram carousels, and presentation slides - all designed to grab attention.',
    features: ['AI image generation', 'YouTube thumbnail maker', 'Social media carousels', 'Presentation slides'],
    gradient: 'from-purple-500 to-violet-500',
    icon: ImageIcon,
    stats: [{ label: 'Clickability score', value: '4★+' }, { label: 'More engagement', value: '4×' }]
  },
  {
    key: 'product',
    title: 'Digital Product Creator',
    subtitle: 'Build and sell ebooks, courses & more',
    description: 'Turn your knowledge into revenue. Generate complete ebooks with chapters and covers, create storybooks, learning materials, and digital products ready to sell.',
    features: ['Complete ebook generator', 'Auto cover design', 'Multiple export formats', 'Print-ready quality'],
    gradient: 'from-emerald-500 to-teal-500',
    icon: BookOpen,
    stats: [{ label: 'Avg monthly revenue', value: '$3K+' }, { label: 'Books shipped', value: '12+' }]
  },
]

// === Per-feature animated mockup components (replace static screenshots) ===

function VideoStudioMockup() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-pink-50/40 p-5 h-72 md:h-80 relative">
      {/* Top: video preview */}
      <div className="aspect-video bg-gradient-to-br from-pink-200 via-rose-100 to-pink-100 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
          <Play className="w-5 h-5 text-pink-600 ml-0.5 fill-pink-600" />
        </motion.div>
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">● REC</span>
        <span className="absolute bottom-2 right-2 bg-slate-800/90 text-white text-[9px] px-1.5 py-0.5 rounded">0:30 / 0:30</span>
      </div>
      {/* Timeline */}
      <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
        <div className="flex gap-1 items-end h-8">
          {[40, 70, 50, 90, 60, 80, 45, 65, 75, 55, 85, 50].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="flex-1 bg-gradient-to-t from-pink-400 to-rose-300 rounded-sm"
            />
          ))}
        </div>
        <div className="h-0.5 bg-pink-500 mt-1 w-1/3 rounded-full"></div>
      </div>
      {/* Floating stat */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-2 -right-2 bg-white rounded-xl shadow-lg p-2 border border-pink-100 flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Video className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500">Render time</div>
          <div className="text-xs font-bold text-slate-800">2 min</div>
        </div>
      </motion.div>
    </div>
  )
}

function ContentEngineMockup() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 h-72 md:h-80 relative">
      {/* Editor toolbar */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] rounded font-medium">📝 Article</div>
        <div className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[9px] rounded">SEO ✓</div>
        <div className="ml-auto text-[9px] text-slate-500">3,247 words</div>
      </div>
      {/* Title + body */}
      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm space-y-1.5">
        <div className="h-2.5 bg-slate-700 rounded w-3/4"></div>
        {[100, 95, 88, 92, 75, 90, 70, 85].map((w, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            whileInView={{ width: `${w}%` }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
            viewport={{ once: true }}
            className="h-1.5 bg-blue-200/80 rounded"
          />
        ))}
      </div>
      {/* SEO panel */}
      <div className="mt-3 bg-white rounded-lg p-2 border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Search className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-semibold text-slate-700">SEO</span>
        </div>
        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1.2 }} viewport={{ once: true }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"></motion.div>
        </div>
        <span className="text-[10px] font-bold text-blue-700">12/15</span>
      </div>
      {/* Floating originality stat */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.4, repeat: Infinity }}
        className="absolute -top-2 -right-2 bg-white rounded-xl shadow-lg p-2 border border-blue-100 flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500">Originality</div>
          <div className="text-xs font-bold text-slate-800">98%</div>
        </div>
      </motion.div>
    </div>
  )
}

function DesignSuiteMockup() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 p-5 h-72 md:h-80 relative">
      {/* Tab bar */}
      <div className="flex gap-1 mb-3">
        {['Thumbnails', 'Carousels', 'Slides'].map((t, i) => (
          <div key={i} className={`px-2 py-1 text-[9px] rounded ${i === 0 ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-white border border-slate-200 text-slate-500'}`}>{t}</div>
        ))}
      </div>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          'from-orange-300 to-amber-200',
          'from-purple-400 to-pink-300',
          'from-cyan-300 to-blue-300',
          'from-emerald-300 to-teal-200',
          'from-rose-300 to-red-200',
          'from-violet-400 to-indigo-300'
        ].map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            viewport={{ once: true }}
            className={`aspect-video bg-gradient-to-br ${g} rounded-lg flex items-center justify-center shadow-sm`}
          >
            <Paintbrush className="w-4 h-4 text-white/80" />
          </motion.div>
        ))}
      </div>
      {/* Stats row */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1 bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
          <div className="text-[8px] text-slate-500 uppercase tracking-wide">Click Rate</div>
          <div className="text-sm font-bold text-purple-700">4.8★</div>
        </div>
        <div className="flex-1 bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
          <div className="text-[8px] text-slate-500 uppercase tracking-wide">Engagement</div>
          <div className="text-sm font-bold text-purple-700">+412%</div>
        </div>
      </div>
      {/* Floating */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-2 -right-2 bg-white rounded-xl shadow-lg p-2 border border-purple-100 flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
          <ImageIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500">Auto-design</div>
          <div className="text-xs font-bold text-slate-800">4×</div>
        </div>
      </motion.div>
    </div>
  )
}

function DigitalProductMockup() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5 h-72 md:h-80 relative">
      <div className="flex gap-3 h-full">
        {/* Ebook cover */}
        <motion.div
          initial={{ rotate: -8, opacity: 0, x: -30 }}
          whileInView={{ rotate: -4, opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex-shrink-0 w-28 md:w-32 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg shadow-xl p-3 text-white relative"
        >
          <BookOpen className="w-5 h-5 mb-2" />
          <div className="space-y-1">
            <div className="h-1.5 bg-white/80 rounded w-full"></div>
            <div className="h-1.5 bg-white/80 rounded w-2/3"></div>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="text-[8px] uppercase tracking-wider opacity-80">Chapter</div>
            <div className="text-[10px] font-bold">Side Hustles 101</div>
          </div>
        </motion.div>
        {/* Chapters list */}
        <div className="flex-1 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-700 mb-1">12 Chapters Generated</div>
          {['Introduction', 'Finding Your Niche', 'Pricing Strategies', 'Marketing 101', 'Scaling Up'].map((ch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-md p-1.5 border border-slate-100 shadow-sm flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              <span className="text-[10px] text-slate-700 truncate">{ch}</span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Floating revenue stat */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity }}
        className="absolute -bottom-2 -right-2 bg-white rounded-xl shadow-lg p-2 border border-emerald-100 flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <div className="text-[9px] text-slate-500">Avg/month</div>
          <div className="text-xs font-bold text-slate-800">$3K+</div>
        </div>
      </motion.div>
    </div>
  )
}

const FEATURE_MOCKUPS = {
  video: VideoStudioMockup,
  content: ContentEngineMockup,
  design: DesignSuiteMockup,
  product: DigitalProductMockup,
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-14 md:py-20 relative">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
            <Layers className="h-4 w-4" />
            Why Creators Choose Us
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Everything You Need to </span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Create & Sell</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            One platform. 70+ tools. Whether you're making videos for YouTube, ebooks for Amazon, or posts for Instagram - it's all here.
          </p>
        </div>

        {/* Alternating Feature Showcases with ANIMATED MOCKUPS */}
        <div className="space-y-20 max-w-6xl mx-auto">
          {featureShowcases.map((feature, i) => {
            const Mockup = FEATURE_MOCKUPS[feature.key] || (() => null)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 items-center`}
              >
                {/* Animated mockup side */}
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div className="glass-card-elevated overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-2xl">
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/50 border-b border-white/30">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70"></div>
                        <span className="ml-3 text-[10px] text-muted-foreground/60">procreators.io / {feature.title.toLowerCase().replace(/\s+/g, '-')}</span>
                      </div>
                      <Mockup />
                    </div>
                    <div className={`absolute -inset-4 bg-gradient-to-r ${feature.gradient} opacity-10 blur-2xl rounded-3xl -z-10`}></div>
                  </div>

                  {/* Stat row below mockup */}
                  {feature.stats && (
                    <div className="mt-4 flex gap-3 justify-center">
                      {feature.stats.map((s, k) => (
                        <div key={k} className="bg-white/70 backdrop-blur-md rounded-xl px-3 py-2 border border-white/60 shadow-sm">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                          <div className={`text-base font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Text Side */}
                <div className="flex-1 w-full">
                  <div className={`inline-flex items-center gap-2 glass-badge px-4 py-2 text-sm font-medium mb-4`}>
                    <feature.icon className={`h-4 w-4 text-purple-600`} />
                    <span className="text-purple-700">{feature.title}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-snug">
                    {feature.subtitle}
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional features grid (smaller) */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-10 text-foreground">Plus 60+ More Tools</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, i) => {
              const grad = feature.gradient || 'from-purple-600 to-purple-400'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  className="group relative glass-card p-6 hover:bg-white/85 hover:shadow-xl transition-all duration-300"
                >
                  <motion.div
                    animate={{ rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-25 blur-xl bg-gradient-to-br ${grad} -z-10 transition-opacity duration-500`}></div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function StatsSection() {
  return (
    <section className="py-10 md:py-16 relative">
      <div className="container px-6">
        <div className="glass-card-elevated p-8 md:p-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function PricingSection({ billingCycle, setBillingCycle, pricingTiers, onSelectPlan }) {
  return (
    <section id="pricing" className="py-14 md:py-20 relative">
      <div className="container px-6 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
              <CircleDollarSign className="h-4 w-4" />
              Simple Pricing
            </div>
            <h2 className="mb-4 text-4xl md:text-6xl font-bold">
              <span className="text-foreground">Plans That </span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Grow With You</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free with 25 credits. Upgrade when you need more. Every plan gives you access to all 70+ tools.
            </p>
            <div className="inline-flex glass-card p-1.5">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
                className={billingCycle === 'monthly' ? 'bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-md' : 'text-muted-foreground rounded-xl'}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
                className={billingCycle === 'yearly' ? 'bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-md' : 'text-muted-foreground rounded-xl'}
              >
                Yearly <span className="ml-1 text-xs text-green-600 font-bold">(Save 20%)</span>
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 ${
                  tier.popular 
                    ? 'glass-card-elevated bg-white/80 shadow-2xl shadow-purple-200/50 scale-105 border-purple-300/60' 
                    : 'glass-card'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="mb-3 text-2xl font-bold text-foreground">{tier.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                    {tier.period && <span className="ml-1 text-muted-foreground">{tier.period}</span>}
                    {tier.name === 'Free' && <span className="ml-2 text-green-600 text-sm">forever</span>}
                  </div>
                </div>
                <ul className="mb-8 space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-purple-600 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full text-base py-6 font-bold uppercase tracking-wider rounded-2xl ${
                    tier.popular
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg glow-accent'
                      : 'glass-btn text-foreground hover:bg-white/80'
                  }`}
                  onClick={() => onSelectPlan(tier.name)}
                >
                  {tier.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Credit breakdown */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-center text-xl font-bold text-foreground mb-8">What Can You Create With Credits?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Blog Post', credits: '5', icon: '📝' },
                { label: 'AI Image', credits: '300', icon: '🎨' },
                { label: 'AI Video (30s)', credits: '2,600', icon: '🎬' },
                { label: 'Full Ebook', credits: '50', icon: '📚' },
                { label: 'Carousel (10 slides)', credits: '50', icon: '📱' },
                { label: 'Thumbnail', credits: '300', icon: '🖼️' },
                { label: 'Business Plan', credits: '20', icon: '💼' },
                { label: 'Voice-over (per min)', credits: '100', icon: '🎤' },
              ].map((item, i) => (
                <div key={i} className="glass-card-subtle p-4 text-center hover:bg-white/60 transition-all">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.credits} credits</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection({ testimonials }) {
  return (
    <section className="py-14 md:py-20 relative">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-purple-700 mb-6">
            <Heart className="h-4 w-4" />
            What Creators Are Saying
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Don't Take </span>
            <span className="text-purple-600">Our</span>
            <span className="text-foreground"> Word For It</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real feedback from people who use ProCreators to create content and build their business every day.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 hover:bg-white/80 hover:shadow-xl transition-all duration-300"
            >
              <div className="mb-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic leading-relaxed">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center gap-4">
                {testimonial.image ? (
                  <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover border-2 border-white/80 shadow-md" />
                ) : (
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.color || 'from-purple-600 to-purple-400'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {testimonial.initials || testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASection({ onGetStarted }) {
  return (
    <section className="py-14 md:py-20 relative overflow-hidden">
      <div className="container px-6 relative z-10">
        <div className="mx-auto max-w-5xl glass-card-elevated p-12 md:p-16">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="mb-6 text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Your Next Piece of Content<br/>
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Is 2 Minutes Away.</span>
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                70+ tools. Videos, ebooks, social posts, business docs - all in one place.
              </p>
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="text-lg px-10 py-7 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl glow-orange rounded-2xl"
              >
                Start Creating Free
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Free credits for 30 days - No credit card - Cancel anytime
              </p>
            </div>

            {/* Visual */}
            <div className="flex-1 w-full max-w-md">
              <div className="relative">
                <div className="glass-card overflow-hidden shadow-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1545063328-c8e3faffa16f?w=500&h=400&fit=crop&q=80" 
                    alt="Create content with ProCreators"
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 glass-card-elevated p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Content Ready!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


export function ComparisonSection({ onGetStarted }) {
  const comparisons = [
    { need: 'AI Video Creation',         separate: '$15–48/mo', separateTools: 'Runway, Pika' },
    { need: 'UGC Ad Videos',             separate: '$49–99/mo', separateTools: 'Arcads, Synthesia' },
    { need: 'Blog & Article Writing',    separate: '$49/mo',    separateTools: 'Jasper, Copy.ai' },
    { need: 'AI Image Generation',       separate: '$10–30/mo', separateTools: 'Midjourney, DALL·E' },
    { need: 'Social Media Carousels',    separate: '$15/mo',    separateTools: 'Canva Pro' },
    { need: 'YouTube Thumbnails',        separate: '$10–20/mo', separateTools: 'Snappa, Placeit' },
    { need: 'Presentation Slides',       separate: '$12–40/mo', separateTools: 'Beautiful.ai, Pitch' },
    { need: 'AI Voiceover & TTS',        separate: '$22–48/mo', separateTools: 'ElevenLabs, Murf' },
    { need: 'Ebook & Digital Products',  separate: '$20–50/mo', separateTools: 'Designrr, Visme' },
  ]

  return (
    <section className="py-12 md:py-16 relative">
      <div className="container px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-badge px-5 py-2.5 text-sm font-medium text-green-700 mb-6">
              <CircleDollarSign className="h-4 w-4" />
              Stop Overpaying
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="text-foreground">You're Paying </span>
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">$300+/month</span>
              <span className="text-foreground"> for Tools</span>
              <br />
              <span className="text-foreground">That Should Cost </span>
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">$19.</span>
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card-elevated overflow-hidden rounded-2xl"
          >
            <div className="grid grid-cols-3 bg-white/50 border-b border-white/60">
              <div className="p-4 md:p-5 text-sm font-semibold text-foreground">What you need</div>
              <div className="p-4 md:p-5 text-sm font-semibold text-center text-muted-foreground">Paying Separately</div>
              <div className="p-4 md:p-5 text-sm font-semibold text-center text-green-600">ProCreators</div>
            </div>
            {comparisons.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 border-b border-white/40 last:border-0 hover:bg-white/50 transition-colors"
              >
                <div className="p-4 md:p-5 flex items-center">
                  <div className="font-medium text-sm md:text-base text-foreground">{row.need}</div>
                </div>
                <div className="p-4 md:p-5 text-center">
                  <span className="text-sm md:text-base text-red-500 font-semibold">{row.separate}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">{row.separateTools}</div>
                </div>
                <div className="p-4 md:p-5 text-center flex items-center justify-center">
                  <motion.span
                    whileInView={{ scale: [0.8, 1.15, 1] }}
                    transition={{ duration: 0.5, delay: i * 0.06 + 0.2 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-1 text-sm md:text-base text-green-600 font-semibold"
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                    Included
                  </motion.span>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 bg-gradient-to-r from-red-50/60 via-white/40 to-green-50/60 border-t-2 border-white/60"
            >
              <div className="p-5 font-bold text-foreground">Total Monthly Cost</div>
              <div className="p-5 text-center"><span className="text-lg md:text-xl font-bold text-red-500 line-through decoration-2">$202–$404/mo</span></div>
              <div className="p-5 text-center">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">From $19/mo</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Savings callout */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            viewport={{ once: true }}
            className="mt-6 text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
              💰 Save up to $385/month - that's $4,620/year
            </span>
          </motion.div>

          <div className="text-center mt-10">
            <Button size="lg" onClick={onGetStarted} className="text-lg px-10 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl glow-orange rounded-2xl">
              Start Free - Replace Them All <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
