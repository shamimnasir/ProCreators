'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  BookOpen,
  Presentation,
  Mic,
  ArrowRight,
  Check,
  Zap,
  Menu,
  X,
  MessageSquare,
  Quote,
  Film,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Rocket,
  Star,
  BarChart3,
  FileText,
  Moon,
  Sun
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Logo } from '@/components/ui/Logo'
import { FeatureIcon } from '@/components/ui/FeatureIcon'

const tools = [
  { name: 'Thread Generator', icon: MessageSquare },
  { name: 'Quote Maker', icon: Quote },
  { name: 'Image Creator', icon: ImageIcon },
  { name: 'Video Studio', icon: Video },
  { name: 'Ebook Builder', icon: BookOpen },
  { name: 'Slides Maker', icon: Presentation },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Create professional content in seconds using cutting-edge AI models'
  },
  {
    icon: ImageIcon,
    title: 'Image Creation',
    description: 'Generate stunning visuals with Google Gemini Nano Banana'
  },
  {
    icon: Video,
    title: 'Video Production',
    description: 'Create reels, shorts, and long-form videos automatically'
  },
  {
    icon: BookOpen,
    title: 'Digital Products',
    description: 'Generate ebooks, storybooks, and learning materials instantly'
  },
  {
    icon: Presentation,
    title: 'Slide Decks',
    description: 'Turn notes into professional presentations in minutes'
  },
  {
    icon: Mic,
    title: 'Voice Synthesis',
    description: 'Clone voices and create talking-head videos effortlessly'
  },
]

const stats = [
  { number: '50K+', label: 'Content Created', icon: FileText },
  { number: '10K+', label: 'Active Users', icon: Users },
  { number: '98%', label: 'Satisfaction Rate', icon: Star },
  { number: '24/7', label: 'Support', icon: Clock },
]

const useCases = [
  {
    title: 'For Content Creators',
    description: 'Generate viral content, stunning visuals, and engaging videos to grow your audience',
    image: '/api/placeholder/400/300',
    features: ['Unlimited AI generations', 'Multi-platform support', 'Advanced analytics']
  },
  {
    title: 'For Marketing Teams',
    description: 'Scale your content production and maintain consistency across all channels',
    image: '/api/placeholder/400/300',
    features: ['Team collaboration', 'Brand guidelines', 'Content calendar']
  },
  {
    title: 'For Agencies',
    description: 'Deliver exceptional results for multiple clients with powerful automation',
    image: '/api/placeholder/400/300',
    features: ['Client management', 'White-label options', 'Bulk creation']
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Content Creator',
    company: 'Digital Nomad',
    image: '/api/placeholder/100/100',
    quote: 'ProCreators has transformed my content workflow. I can now create in minutes what used to take hours!'
  },
  {
    name: 'Michael Chen',
    role: 'Marketing Director',
    company: 'TechStart Inc',
    image: '/api/placeholder/100/100',
    quote: 'The AI-powered tools are incredibly accurate. Our team productivity has increased by 300%.'
  },
  {
    name: 'Emma Williams',
    role: 'Agency Owner',
    company: 'Creative Solutions',
    image: '/api/placeholder/100/100',
    quote: 'Best investment we made for our agency. Client satisfaction has skyrocketed!'
  },
]

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '10 AI generations/month',
      'Basic content tools',
      'Standard support',
      'Watermarked exports'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Creator',
    price: '$29',
    features: [
      '500 AI generations/month',
      'All content tools',
      'Priority support',
      'No watermarks',
      'Advanced editing',
      'Analytics dashboard'
    ],
    cta: 'Start Creating',
    popular: true
  },
  {
    name: 'Pro Automation',
    price: '$99',
    features: [
      'Unlimited AI generations',
      'Auto-posting',
      'Bulk creation',
      'API access',
      'White-label options',
      'Dedicated support'
    ],
    cta: 'Go Pro',
    popular: false
  },
]

export default function Home() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
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

          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]">Start Free Trial</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Animated background gradient - adapts to theme */}
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
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa]">
                <Zap className="h-4 w-4" />
                AI-Powered Content Generation - Now Live
              </div>

              {/* Main Logo Text */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-b from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                  The Easiest Way to Create
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">
                  Income-Friendly Content
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
                Generate viral posts, stunning images, engaging videos, and digital products with AI.
                <br />
                Perfect for creators, marketers, and agencies.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => router.push('/register')}
                  className="text-lg px-8 py-6 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-foreground font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 border-border bg-muted/50 hover:bg-muted text-foreground"
                >
                  Book a Demo
                </Button>
              </div>

              {/* Trial notice */}
              <p className="text-sm text-muted-foreground">
                14-day free trial • No credit card required • Cancel anytime
              </p>

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
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#a78bfa]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section id="tools" className="py-20 md:py-32 relative">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                22 Powerful Tools. Endless Possibilities.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, automate, and scale your content across every platform
              </p>
            </div>

            {/* Tool Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button className="bg-[#7c3aed] hover:bg-[#6d28d9]">All Tools (22)</Button>
              <Button variant="outline" className="border-white/20 text-muted-foreground hover:bg-white/10">Video & Audio (6)</Button>
              <Button variant="outline" className="border-white/20 text-muted-foreground hover:bg-white/10">Image & Design (6)</Button>
              <Button variant="outline" className="border-white/20 text-muted-foreground hover:bg-white/10">Text Content (6)</Button>
              <Button variant="outline" className="border-white/20 text-muted-foreground hover:bg-white/10">Digital Products (2)</Button>
            </div>

            {/* Tools Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {[
                { name: 'Auto Subtitles & Captions', desc: 'Add AI-powered subtitles to any video', icon: MessageSquare, color: 'from-cyan-500 to-blue-500' },
                { name: 'Script-to-Ad Generator', desc: 'Generate complete ads with script & voiceover', icon: Film, color: 'from-pink-500 to-rose-500' },
                { name: 'Reels & Short Videos', desc: 'Create viral reels with AI scenes & voiceover', icon: Video, color: 'from-orange-500 to-red-500' },
                { name: 'Talking Head Videos', desc: 'AI avatars that speak your script', icon: Users, color: 'from-green-500 to-emerald-500' },
                { name: 'Video Editor', desc: 'Trim, merge, and enhance videos', icon: Film, color: 'from-yellow-500 to-orange-500' },
                { name: 'Voice Clone', desc: 'Clone any voice for unlimited TTS', icon: Mic, color: 'from-purple-500 to-pink-500' },
                { name: 'AI Thumbnail Maker', desc: 'Platform-optimized thumbnails with AI', icon: ImageIcon, color: 'from-pink-500 to-purple-500' },
                { name: 'Photo Cards', desc: 'Beautiful social media cards', icon: ImageIcon, color: 'from-purple-500 to-indigo-500' },
                { name: 'Learning Cards', desc: 'Educational flashcards & study materials', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
                { name: 'Carousels', desc: 'Multi-slide social media carousels', icon: ImageIcon, color: 'from-cyan-500 to-teal-500' },
                { name: 'Image Editor', desc: 'AI-powered image editing & enhancement', icon: ImageIcon, color: 'from-green-500 to-lime-500' },
                { name: 'Slides Maker', desc: 'Full presentation decks in minutes', icon: Presentation, color: 'from-orange-500 to-amber-500' },
                { name: 'Quotes Generator', desc: 'Inspiring quotes for social media', icon: Quote, color: 'from-purple-500 to-violet-500' },
                { name: 'Thread Creator', desc: 'Engaging Twitter/X threads', icon: MessageSquare, color: 'from-blue-500 to-indigo-500' },
                { name: 'List Maker', desc: 'Comprehensive lists & listicles', icon: FileText, color: 'from-cyan-500 to-sky-500' },
                { name: 'News Articles', desc: 'Professional news-style content', icon: FileText, color: 'from-red-500 to-pink-500' },
                { name: 'Long-Form Articles', desc: '1500+ word in-depth content', icon: FileText, color: 'from-amber-500 to-yellow-500' },
                { name: 'Tutorials', desc: 'Step-by-step how-to guides', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
                { name: 'Ebook Generator', desc: 'Complete ebooks with chapters & cover', icon: BookOpen, color: 'from-indigo-500 to-blue-500' },
                { name: 'Storybook Maker', desc: "Children's stories with illustrations", icon: BookOpen, color: 'from-pink-500 to-fuchsia-500' },
              ].map((tool, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative rounded-xl border border-border bg-gradient-to-b from-white/5 to-transparent p-6 backdrop-blur-sm transition-all hover:border-[#7c3aed]/50 hover:shadow-xl hover:shadow-[#7c3aed]/20 cursor-pointer"
                  onClick={() => router.push('/dashboard')}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color}`}>
                    <tool.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-foreground font-bold"
              >
                Access All 22 Tools Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-[#0a0e27] to-[#1a1147]">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                A Powerful Range of AI Tools
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to dominate content creation, all powered by cutting-edge AI
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative rounded-xl border border-border bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-sm transition-all hover:border-[#7c3aed]/50 hover:shadow-xl hover:shadow-[#7c3aed]/20"
                >
                  <div className="mb-6">
                    <FeatureIcon icon={feature.icon} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases / Solutions Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-[#0a0e27] to-[#1a1147]">
        <div className="container px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Built for Every Creator
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're solo or leading a team, ProCreators scales with your needs
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {useCases.map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-white/5 p-8 backdrop-blur-sm hover:border-[#7c3aed]/50 transition-all"
              >
                <div className="mb-6 h-48 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20 flex items-center justify-center">
                  <Rocket className="h-16 w-16 text-[#a78bfa]" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{useCase.title}</h3>
                <p className="text-muted-foreground mb-6">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-sm text-muted-foreground">
                      <Check className="h-4 w-4 mr-2 text-[#a78bfa]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32">
        <div className="container px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Loved by 10,000+ Creators
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users are saying about ProCreators
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-sm"
              >
                <div className="mb-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-[#7c3aed] text-[#7c3aed]" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]"></div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-[#1a1147] to-[#0a0e27]">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Choose Your Plan
              </h2>
              <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
                From beginner to professional creator - we have the perfect plan for your journey
              </p>
              <div className="inline-flex rounded-lg border border-white/20 p-1 bg-white/5">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                  className={billingCycle === 'monthly' ? 'bg-[#7c3aed]' : 'text-muted-foreground'}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                  className={billingCycle === 'yearly' ? 'bg-[#7c3aed]' : 'text-muted-foreground'}
                >
                  Yearly <span className="ml-1 text-xs">(Save 20%)</span>
                </Button>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl border p-8 backdrop-blur-sm ${
                    tier.popular 
                      ? 'border-[#7c3aed] bg-gradient-to-b from-[#7c3aed]/20 to-transparent shadow-2xl shadow-[#7c3aed]/30 scale-105' 
                      : 'border-border bg-gradient-to-b from-white/5 to-transparent'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] px-6 py-2 text-sm font-bold text-foreground glow-primary">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="mb-3 text-2xl font-bold text-foreground">{tier.name}</h3>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                      <span className="ml-2 text-muted-foreground">/month</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 shrink-0 text-[#a78bfa] mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full text-base py-6 font-bold uppercase tracking-wider ${
                      tier.popular
                        ? 'bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] glow-primary'
                        : 'border-2 border-white/20 bg-white/5 hover:bg-white/10 text-foreground'
                    }`}
                    onClick={() => router.push(tier.name === 'Free' ? '/register' : '/pricing')}
                  >
                    {tier.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/20 via-[#a78bfa]/20 to-[#7c3aed]/20"></div>
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-4xl rounded-3xl border border-[#7c3aed]/50 bg-gradient-to-b from-[#7c3aed]/20 to-transparent p-12 md:p-16 text-center backdrop-blur-sm shadow-2xl shadow-[#7c3aed]/30">
            <h2 className="mb-6 text-4xl md:text-5xl font-bold text-foreground">
              Ready to Dominate Content Creation?
            </h2>
            <p className="mb-10 text-xl text-muted-foreground">
              Join thousands of creators already building their empires with ProCreators
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/register')}
                className="text-lg px-12 py-7 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-foreground font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
              >
                Start Your Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-12 py-7 border-2 border-white/40 bg-white/10 hover:bg-white/20 text-foreground"
              >
                Talk to Sales
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Popular AI Tools Section */}
      <section className="py-20 bg-background">
        <div className="container px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Popular AI Tools</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
            {[
              'Auto Subtitles',
              'Script-to-Ad',
              'Thumbnail Maker',
              'Voice Clone',
              'Ebook Generator',
              'Reels Creator',
              'Talking Head',
              'Thread Creator'
            ].map((tool, i) => (
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

      {/* Footer */}
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
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">All Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Pricing</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Dashboard</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">API Access</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Integrations</Link></li>
                <li><Link href="/roadmap" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Roadmap</Link></li>
              </ul>
            </div>

            {/* Solutions Column */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Solutions</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Content Creators</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Marketing Teams</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Agencies</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Freelancers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Educators</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">E-commerce</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Help Center</Link></li>
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Video Tutorials</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Community</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Status</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Press Kit</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Partners</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Affiliate Program</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 ProCreators. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Service</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cookie Policy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">GDPR</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
