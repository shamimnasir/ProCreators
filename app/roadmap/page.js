'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Clock, Sparkles, ArrowLeft } from 'lucide-react'

export default function RoadmapPage() {
  const roadmapItems = [
    {
      quarter: 'Q1 2025',
      status: 'completed',
      features: [
        { name: 'AI Text Generation Tools', desc: 'Threads, Quotes, Lists, News, Tutorials', completed: true },
        { name: 'Image Generation with Gemini', desc: 'Photo cards and carousels with Bengali support', completed: true },
        { name: 'Content Library System', desc: 'Save, manage, and download generated content', completed: true },
        { name: 'Admin System Prompts', desc: 'Customize AI behavior for each tool', completed: true },
      ]
    },
    {
      quarter: 'Q2 2025',
      status: 'in-progress',
      features: [
        { name: 'User Authentication', desc: 'Supabase integration for secure login', completed: false },
        { name: 'Subscription & Payments', desc: 'Stripe integration for monetization', completed: false },
        { name: 'Video Generation Tools', desc: 'Reels, shorts, and video editing', completed: false },
        { name: 'Voice Cloning', desc: 'AI-powered voice synthesis', completed: false },
      ]
    },
    {
      quarter: 'Q3 2025',
      status: 'planned',
      features: [
        { name: 'Auto-Posting Integration', desc: 'Schedule and auto-post to social platforms', completed: false },
        { name: 'Team Collaboration', desc: 'Multi-user workspaces and permissions', completed: false },
        { name: 'API Access', desc: 'Developer API for custom integrations', completed: false },
        { name: 'Mobile Apps', desc: 'iOS and Android applications', completed: false },
      ]
    },
    {
      quarter: 'Q4 2025',
      status: 'planned',
      features: [
        { name: 'White Label Solutions', desc: 'Rebrand and resell the platform', completed: false },
        { name: 'Advanced Analytics', desc: 'Performance tracking and insights', completed: false },
        { name: 'Bulk Operations', desc: 'Create multiple content pieces at once', completed: false },
        { name: 'Custom AI Models', desc: 'Train and use your own AI models', completed: false },
      ]
    },
  ]

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'from-green-500 to-emerald-500'
      case 'in-progress': return 'from-blue-500 to-cyan-500'
      case 'planned': return 'from-purple-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completed'
      case 'in-progress': return 'In Progress'
      case 'planned': return 'Planned'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Product Roadmap
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            See what we're building and what's coming next. Your feedback shapes our future.
          </p>
        </div>
      </header>

      {/* Roadmap Content */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="space-y-12">
            {roadmapItems.map((item, index) => (
              <div key={index} className="relative">
                {/* Timeline line */}
                {index !== roadmapItems.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-[#7c3aed] to-transparent"></div>
                )}

                <div className="flex gap-6">
                  {/* Quarter Badge */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br ${getStatusColor(item.status)} flex items-center justify-center font-bold text-sm`}>
                    {item.quarter.split(' ')[0]}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-2xl font-bold text-white">{item.quarter}</h2>
                      <span className={`px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(item.status)} text-white`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {item.features.map((feature, fIndex) => (
                        <Card key={fIndex} className="p-6 bg-white/5 border-white/10 hover:border-[#7c3aed]/50 transition-all">
                          <div className="flex items-start gap-3">
                            {feature.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h3 className="font-semibold text-white mb-1">{feature.name}</h3>
                              <p className="text-sm text-gray-400">{feature.desc}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="p-12 bg-gradient-to-b from-[#7c3aed]/20 to-transparent border-[#7c3aed]/50">
              <Sparkles className="h-12 w-12 text-[#a78bfa] mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Have a Feature Request?</h2>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                We'd love to hear your ideas! Your feedback helps us prioritize what to build next.
              </p>
              <Button className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white">
                Submit Feature Request
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
