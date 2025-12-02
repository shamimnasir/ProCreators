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
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-6">
          <Link href="/">
            <Logo variant="full" className="h-10 w-10" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</Link>
            <Link href="#tools" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Tools</Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
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
              <Link href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</Link>
              <Link href="#tools" className="block text-gray-300 hover:text-white transition-colors">Tools</Link>
              <Link href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="block text-gray-300 hover:text-white transition-colors">Dashboard</Link>
              <div className="pt-4 border-t border-white/10 space-y-3">
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
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#1a1147] to-[#0a0e27]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
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
                <span className="bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                  The Easiest Way to Create
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">
                  Income-Friendly Content
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed">
                Generate viral posts, stunning images, engaging videos, and digital products with AI.
                <br />
                Perfect for creators, marketers, and agencies.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => router.push('/register')}
                  className="text-lg px-8 py-6 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-white font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  Book a Demo
                </Button>
              </div>

              {/* Trial notice */}
              <p className="text-sm text-gray-500">
                14-day free trial • No credit card required • Cancel anytime
              </p>

              {/* Tool badges */}
              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4">Integrated AI Models:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {tools.map((tool, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                      <tool.icon className="h-4 w-4 text-[#a78bfa]" />
                      <span className="text-sm text-gray-300">{tool.name}</span>
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
      <section className="py-12 border-y border-white/10 bg-white/5">
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
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                A Powerful Range of AI Tools
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
                  className="group relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-sm transition-all hover:border-[#7c3aed]/50 hover:shadow-xl hover:shadow-[#7c3aed]/20"
                >
                  <div className="mb-6">
                    <FeatureIcon icon={feature.icon} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
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
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:border-[#7c3aed]/50 transition-all"
              >
                <div className="mb-6 h-48 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20 flex items-center justify-center">
                  <Rocket className="h-16 w-16 text-[#a78bfa]" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{useCase.title}</h3>
                <p className="text-gray-400 mb-6">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-sm text-gray-300">
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
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 backdrop-blur-sm"
              >
                <div className="mb-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-[#7c3aed] text-[#7c3aed]" />
                    ))}
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]"></div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
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
              <p className="mb-8 text-lg text-gray-400 max-w-2xl mx-auto">
                From beginner to professional creator - we have the perfect plan for your journey
              </p>
              <div className="inline-flex rounded-lg border border-white/20 p-1 bg-white/5">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                  className={billingCycle === 'monthly' ? 'bg-[#7c3aed]' : 'text-gray-400'}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                  className={billingCycle === 'yearly' ? 'bg-[#7c3aed]' : 'text-gray-400'}
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
                      : 'border-white/10 bg-gradient-to-b from-white/5 to-transparent'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] px-6 py-2 text-sm font-bold text-white glow-primary">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="mb-3 text-2xl font-bold text-white">{tier.name}</h3>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-white">{tier.price}</span>
                      <span className="ml-2 text-gray-400">/month</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 shrink-0 text-[#a78bfa] mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full text-base py-6 font-bold uppercase tracking-wider ${
                      tier.popular
                        ? 'bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] glow-primary'
                        : 'border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white'
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
            <h2 className="mb-6 text-4xl md:text-5xl font-bold text-white">
              Ready to Dominate Content Creation?
            </h2>
            <p className="mb-10 text-xl text-gray-300">
              Join thousands of creators already building their empires with ProCreators
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/register')}
                className="text-lg px-12 py-7 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-white font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
              >
                Start Your Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-12 py-7 border-2 border-white/40 bg-white/10 hover:bg-white/20 text-white"
              >
                Talk to Sales
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo variant="full" className="h-8 w-8" />
            <p className="text-sm text-gray-500">
              © 2025 ProCreators. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
