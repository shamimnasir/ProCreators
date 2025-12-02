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
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ProCreators</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="inline h-4 w-4 mr-1" />
              AI-Powered Content Creation
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Create Income-Friendly
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {' '}Content {' '}
              </span>
              in Minutes
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Generate viral posts, stunning images, engaging videos, and digital products
              using the power of AI. Start earning with content that converts.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="text-lg" onClick={() => router.push('/register')}>
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything You Need to Create</h2>
            <p className="text-lg text-muted-foreground">
              Powerful AI tools to create content that drives engagement and income
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
                className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Choose Your Plan</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Start free, upgrade as you grow
            </p>
            <div className="inline-flex rounded-lg border p-1">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
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
                className={`relative rounded-2xl border p-8 shadow-sm ${
                  tier.popular ? 'border-primary shadow-lg' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-2xl font-bold">{tier.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="ml-2 text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => router.push(tier.name === 'Free' ? '/register' : '/pricing')}
                >
                  {tier.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-4xl rounded-2xl bg-primary p-12 text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Start Creating?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of creators already using ProCreators to generate income-friendly content
          </p>
          <Button size="lg" variant="secondary" className="text-lg" onClick={() => router.push('/register')}>
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">ProCreators</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ProCreators. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
