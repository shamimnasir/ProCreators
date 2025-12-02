'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    priceId: 'free',
    features: [
      '10 AI generations/month',
      'Basic content tools',
      'Standard support',
      'Watermarked exports',
      'Community access'
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    name: 'Creator',
    price: 29,
    priceId: 'price_creator',
    features: [
      '500 AI generations/month',
      'All content tools',
      'Priority support',
      'No watermarks',
      'Advanced editing',
      'Analytics dashboard',
      'Export to all formats'
    ],
    cta: 'Upgrade to Creator',
    popular: true
  },
  {
    name: 'Pro Automation',
    price: 99,
    priceId: 'price_pro',
    features: [
      'Unlimited AI generations',
      'Auto-posting to socials',
      'Bulk content creation',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration'
    ],
    cta: 'Upgrade to Pro',
    popular: false
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubscribe = async (priceId, planName) => {
    if (priceId === 'free') {
      return
    }

    setLoading(priceId)
    try {
      // TODO: Implement Stripe checkout
      toast({
        title: "Stripe integration pending",
        description: "Add your Stripe credentials to .env to enable payments"
      })
      
      setTimeout(() => {
        router.push('/dashboard/billing')
      }, 1500)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ProCreators</span>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Choose Your Plan</h1>
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
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full ${
                    tier.popular ? 'border-primary shadow-lg' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>
                      <div className="flex items-baseline mt-4">
                        <span className="text-4xl font-bold">
                          ${billingCycle === 'yearly' ? Math.floor(tier.price * 0.8) : tier.price}
                        </span>
                        <span className="ml-2 text-muted-foreground">/month</span>
                      </div>
                      {billingCycle === 'yearly' && tier.price > 0 && (
                        <p className="text-sm text-primary mt-2">
                          Billed ${Math.floor(tier.price * 0.8 * 12)}/year
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="mr-2 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={tier.popular ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(tier.priceId, tier.name)}
                      disabled={loading === tier.priceId || tier.priceId === 'free'}
                    >
                      {loading === tier.priceId ? 'Processing...' : tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
