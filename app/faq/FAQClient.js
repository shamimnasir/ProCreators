'use client'

import { useState } from 'react'
import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Search,
  HelpCircle,
  CreditCard,
  Video,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function FAQClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const faqs = [
    {
      category: 'Getting Started',
      icon: HelpCircle,
      items: [
        { q: 'What is ProCreators?', a: 'ProCreators is an AI-powered content creation platform with 60+ tools for creating videos, images, text content, digital products, and more. Our tools use advanced AI including Kling 3.0, Seedance 2.0, Gemini, and GPT-4.' },
        { q: 'How do I get started?', a: 'Simply create a free account to get 25 starter credits for 30 days. No credit card required. Browse our tools, pick one, and start creating in minutes.' },
        { q: 'Do I need technical skills?', a: 'Not at all! Our tools are designed to be intuitive. Just enter your requirements, and AI handles the technical work. Check our Documentation for step-by-step guides.' },
        { q: 'What can I create with ProCreators?', a: 'You can create AI videos, social media content, carousels, thumbnails, blog posts, ebooks, resumes, business plans, educational materials, and much more. We have 60+ tools across multiple categories.' },
      ]
    },
    {
      category: 'Credits & Pricing',
      icon: CreditCard,
      items: [
        { q: 'How do credits work?', a: 'Credits are the currency for using our tools. Each tool costs a certain number of credits based on complexity. Text generation costs fewer credits, while video generation costs more.' },
        { q: 'Do unused credits expire?', a: 'Monthly subscription credits reset each billing cycle. However, any credits you purchase separately never expire and roll over indefinitely.' },
        { q: 'Can I get a refund?', a: 'Yes, we offer refunds for unused subscription time within the first 7 days. Credit packs are non-refundable once purchased.' },
        { q: 'Do subscribers get discounts?', a: 'Yes! Subscribers get discounts on extra credit purchases: Creator (5% off), Pro (10% off), Business (15% off).' },
      ]
    },
    {
      category: 'Video Tools',
      icon: Video,
      items: [
        { q: 'What video formats are supported?', a: 'We support MP4 output in various resolutions (720p, 1080p, 4K) and aspect ratios (16:9, 9:16, 1:1) for different platforms.' },
        { q: 'How long can AI videos be?', a: 'Currently, AI-generated videos can be up to 30 seconds. Longer videos can be created by combining clips or using our story-based tools.' },
        { q: 'Can I add my own audio?', a: 'Yes! You can upload custom audio, use our AI voice generation, or add background music from our library.' },
        { q: 'What makes ProCreators videos different?', a: 'We use the latest AI models (Kling 3.0, Seedance 2.0) for industry-leading quality, character consistency, and realistic motion.' },
      ]
    },
    {
      category: 'Account & Security',
      icon: Shield,
      items: [
        { q: 'Is my data secure?', a: 'Yes! We use bank-level encryption, secure servers, and never sell your data. Your content is yours.' },
        { q: 'Can I delete my account?', a: 'Yes, you can delete your account anytime from Settings. All your data will be permanently removed.' },
        { q: 'Do you store my generated content?', a: 'Content is stored in your library until you delete it. We don\'t use your content to train AI models.' },
        { q: 'Can I use content commercially?', a: 'Yes! All content you create with ProCreators is yours to use commercially, including for client work and products to sell.' },
      ]
    },
  ]

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-amber-700 text-sm font-medium mb-4">
              <HelpCircle className="inline h-4 w-4 mr-1" />
              Help Center
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers to common questions about ProCreators.
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {filteredFaqs.map((category, ci) => {
            const Icon = category.icon
            return (
              <div key={ci} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold">{category.category}</h2>
                </div>
                <div className="space-y-3">
                  {category.items.map((item, i) => {
                    const itemId = `${ci}-${i}`
                    const isOpen = openItems[itemId]
                    return (
                      <Card key={i} className="overflow-hidden">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full p-5 text-left flex justify-between items-center hover:bg-muted/50 transition"
                        >
                          <span className="font-medium pr-4">{item.q}</span>
                          {isOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-muted-foreground">
                            {item.a}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="p-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/docs">
                <Button variant="outline">View Documentation</Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  Contact Support
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
