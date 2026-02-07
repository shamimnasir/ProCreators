'use client'

import { motion } from 'framer-motion'
import { Zap, Check, Star, Heart, CircleDollarSign, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { features, stats } from './data'

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
            <Zap className="h-4 w-4" />
            Why You'll Get Addicted
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Features That Make You </span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">UNSTOPPABLE</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Every feature designed to give you that <span className="text-orange-400 font-semibold">creative high</span>. 
            Warning: Side effects include increased productivity and uncontrollable content creation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent p-8 backdrop-blur-sm hover:border-[#7c3aed]/50 hover:bg-muted/50 transition-all duration-300"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-lg group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-[#7c3aed]/10 via-background to-[#7c3aed]/10">
      <div className="container px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PricingSection({ billingCycle, setBillingCycle, pricingTiers, onSelectPlan }) {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-6 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
              <CircleDollarSign className="h-4 w-4" />
              Ridiculously Affordable
            </div>
            <h2 className="mb-4 text-4xl md:text-6xl font-bold">
              <span className="text-foreground">Pick Your </span>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Addiction Level</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're <span className="text-orange-400 font-semibold">hooked</span>. (Spoiler: You will be)
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
                Yearly <span className="ml-1 text-xs text-green-400 font-bold">(Save 20%)</span>
              </Button>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
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
                    : 'border-border bg-gradient-to-b from-muted/30 to-transparent'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] px-3 py-1 text-xs font-medium text-white">
                    Limited Time Offer
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="mb-3 text-2xl font-bold text-foreground">{tier.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                    {tier.period && <span className="ml-1 text-muted-foreground">{tier.period}</span>}
                    {tier.name === 'Free' && <span className="ml-2 text-green-400 text-sm">forever</span>}
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
                      ? 'bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed]'
                      : 'border-2 border-white/20 bg-white/5 hover:bg-white/10 text-foreground'
                  }`}
                  onClick={() => onSelectPlan(tier.name)}
                >
                  {tier.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection({ testimonials }) {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
            <Heart className="h-4 w-4" />
            Real Results, Real People
          </div>
          <h2 className="mb-4 text-4xl md:text-6xl font-bold">
            <span className="text-foreground">Don't Take </span>
            <span className="text-[#a78bfa]">OUR</span>
            <span className="text-foreground"> Word For It</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            These creators were <span className="text-muted-foreground line-through">skeptical</span> <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">addicted</span> too.
            <br />
            <span className="text-sm text-orange-400">Warning: Reading testimonials may cause FOMO</span>
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
              className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-transparent p-8 backdrop-blur-sm"
            >
              <div className="mb-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-orange-400 text-orange-400" />
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
  )
}

export function CTASection({ onGetStarted }) {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/20 via-[#a78bfa]/20 to-[#7c3aed]/20"></div>
      <div className="container px-6 relative z-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#7c3aed]/50 bg-gradient-to-b from-[#7c3aed]/20 to-transparent p-12 md:p-16 text-center backdrop-blur-sm shadow-2xl shadow-[#7c3aed]/30">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 px-4 py-2 text-sm font-medium text-[#a78bfa] mb-6">
            <Zap className="h-4 w-4" />
            Last Warning Before Addiction
          </div>
          <h2 className="mb-6 text-4xl md:text-5xl font-bold text-foreground">
            You've Been Warned. <br/>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Now Get Addicted.</span>
          </h2>
          <p className="mb-10 text-xl text-muted-foreground">
            70+ AI tools. One platform. Unlimited creative dopamine.
            <br />
            <span className="text-sm">Your future self will thank you. (Or curse you for not starting sooner)</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="text-lg px-12 py-7 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 text-black font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
            >
              Get Your First Hit FREE
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            50 free credits • No credit card • Cancel anytime (but you won't want to)
          </p>
        </div>
      </div>
    </section>
  )
}
