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
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { FeatureIcon } from '@/components/ui/FeatureIcon'

const features = [
  {
    icon: Sparkles,
    title: 'Viral Content Tools',
    description: 'Create threads, quotes, carousels, and more that go viral'
  },
  {
    icon: ImageIcon,
    title: 'AI Image Generation',
    description: 'Generate stunning images with Google Gemini AI'
  },
  {
    icon: Video,
    title: 'Video Creation',
    description: 'Create reels, shorts, and long-form videos automatically'
  },
  {
    icon: BookOpen,
    title: 'Digital Products',
    description: 'Generate ebooks, storybooks, and learning materials'
  },
  {
    icon: Presentation,
    title: 'Slide Maker',
    description: 'Turn notes into professional presentations instantly'
  },
  {
    icon: Mic,
    title: 'Voice Tools',
    description: 'Clone voices and create talking-head videos'
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
      'Analytics'
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
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-6">
          <Link href="/">
            <Logo variant="full" className="h-10 w-10" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</Link>
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
                Sign Up
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
              <Link href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="block text-gray-300 hover:text-white transition-colors">Dashboard</Link>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]">Sign Up</Button>
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
              {/* Logo/Icon */}
              <div className="relative inline-block">
                <Logo variant="icon" className="h-32 w-32 mx-auto" />
              </div>

              {/* Main Logo Text */}
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
                <span className="bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent text-glow">
                  ProCreators
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-2xl md:text-3xl font-bold text-gray-300 tracking-wider uppercase">
                Create. Generate. Dominate.
              </p>

              <p className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed">
                Unleash the power of AI to generate viral content, stunning visuals, and income-generating digital products. Your creative empire starts here.
              </p>

              {/* CTA Button */}
              <div className="pt-6">
                <Button 
                  size="lg"
                  onClick={() => router.push('/register')}
                  className="text-lg px-12 py-7 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-white font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
                >
                  Start Creating Now
                </Button>
              </div>

              {/* Beta notice */}
              <p className="text-sm text-gray-500 italic">
                Notice: AI-powered tools in active development. Join early for exclusive benefits.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#a78bfa]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Your Complete Arsenal
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Powerful AI tools designed to dominate the content creation battlefield
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
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20 text-[#a78bfa] transition-all group-hover:from-[#7c3aed]/40 group-hover:to-[#a78bfa]/40 group-hover:scale-110">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="container px-6 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Choose Your Path
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
              Ready to Dominate?
            </h2>
            <p className="mb-10 text-xl text-gray-300">
              Join thousands of creators already building their empires with ProCreators
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push('/register')}
              className="text-lg px-12 py-7 bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#7c3aed] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#6d28d9] border-0 text-white font-bold uppercase tracking-wider glow-primary transition-all duration-300 hover:scale-105"
            >
              Start Your Journey
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-[#7c3aed]" />
              <span className="font-bold text-white">ProCreators</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 ProCreators. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
