'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CheckCircle2,
  Clock,
  Award,
  Rocket,
  Layers,
  Video,
  Image,
  Mic,
  FileText,
  Globe,
  Server,
  Cpu,
  Target
} from 'lucide-react'
import { PublicLayout } from '@/components/shared/PublicLayout'
import Link from 'next/link'

export default function RoadmapClient() {
  const roadmapItems = [
    {
      quarter: 'Q1 2025',
      status: 'completed',
      icon: CheckCircle2,
      features: [
        { name: 'AI Text Generation Suite', desc: 'Blog Writer, Ad Copy, Threads, Quotes, Lists, News, Professional Email', completed: true },
        { name: 'Image Generation with Gemini', desc: 'Photo Cards, Carousels, Cover Images with Bengali language support', completed: true },
        { name: 'Content Library System', desc: 'Save, organize, manage and download all generated content', completed: true },
        { name: 'Admin System Prompts', desc: 'Customize AI behavior and system prompts for each tool', completed: true },
        { name: 'Digital Product Tools', desc: 'Ebook Maker, Worksheet Generator, Planner Maker, Journal Creator', completed: true },
        { name: 'Fun & Creative Tools', desc: 'Meme Generator, Joke Generator, Quote Creator, Story Writer', completed: true },
      ]
    },
    {
      quarter: 'Q2 2025',
      status: 'completed',
      icon: CheckCircle2,
      features: [
        { name: 'User Authentication', desc: 'Secure login with email/password and session management', completed: true },
        { name: 'Subscription & Payments', desc: 'Stripe integration with Creator, Pro, and Business plans', completed: true },
        { name: 'Credits System', desc: 'Monthly credits, credit packs, and subscriber discounts', completed: true },
        { name: 'AI Video Studio (Kling 2.0)', desc: '1080p AI video generation from text and images', completed: true },
        { name: 'Quick Reels & Auto Reels', desc: 'Create viral short-form videos for TikTok, Reels, Shorts', completed: true },
        { name: 'Auto Subtitles', desc: 'AI-powered subtitle generation and styling', completed: true },
      ]
    },
    {
      quarter: 'Q3 2025',
      status: 'completed',
      icon: CheckCircle2,
      features: [
        { name: 'Story Reels Creator', desc: 'Story-driven video content with AI narration', completed: true },
        { name: 'Long-Form Video (Kling 2.5)', desc: 'Extended video duration up to 30 seconds with better motion', completed: true },
        { name: 'Thumbnail Maker', desc: 'AI-powered YouTube thumbnail creation', completed: true },
        { name: 'Audio Editor & Voice Enhancer', desc: 'Professional audio editing and enhancement tools', completed: true },
        { name: 'Noise Remover', desc: 'AI-powered background noise removal from audio', completed: true },
        { name: 'Career Tools', desc: 'Resume Builder, Cover Letter Generator, Interview Prep', completed: true },
      ]
    },
    {
      quarter: 'Q4 2025',
      status: 'completed',
      icon: CheckCircle2,
      features: [
        { name: 'Kling 2.6 Integration', desc: 'One-click audio-video sync, 30% cost reduction, better motion control', completed: true },
        { name: 'Education Suite', desc: 'Essay Helper, Study Notes, Flashcard Creator, Quiz Maker, Lesson Planner', completed: true },
        { name: 'Business Tools', desc: 'Business Plan Generator, SWOT Analysis, Pitch Deck Creator', completed: true },
        { name: 'Avatar Creator', desc: 'AI-powered avatar and profile image generation', completed: true },
        { name: 'Content Humanizer', desc: 'Make AI text sound more natural and human', completed: true },
        { name: '60+ Tools Available', desc: 'Comprehensive suite covering all content creation needs', completed: true },
      ]
    },
    {
      quarter: 'Q1 2026',
      status: 'in-progress',
      icon: Rocket,
      features: [
        { name: 'Kling 3.0 Integration', desc: 'Elements for character consistency, multi-shot generations, subject binding', completed: false },
        { name: 'Seedance 2.0 Support', desc: 'Multimodal inputs (text + images + video + audio), native 2K resolution', completed: false },
        { name: 'Voice Cloning Studio', desc: 'Clone and generate custom voices in multiple languages', completed: false },
        { name: '4K Video Export', desc: 'Ultra-high-definition video output at 60fps', completed: false },
        { name: 'Multi-Character Scenes', desc: 'Multiple consistent characters in same video scene', completed: false },
        { name: 'Advanced Motion Control', desc: 'Transfer motion from reference videos to static images', completed: false },
      ]
    },
    {
      quarter: 'Q2 2026',
      status: 'planned',
      icon: Target,
      features: [
        { name: 'Real-Time Video Generation', desc: 'Streaming video output for interactive workflows', completed: false },
        { name: '60-Second Video Duration', desc: 'Extended video generation up to 1 minute per clip', completed: false },
        { name: 'Custom Voice Library', desc: 'Upload and use custom voices for personalized content', completed: false },
        { name: 'Interactive Video Features', desc: 'Branching narratives and choose-your-own-adventure videos', completed: false },
        { name: 'Auto-Posting Integration', desc: 'Schedule and auto-post to YouTube, TikTok, Instagram, LinkedIn', completed: false },
        { name: 'Team Collaboration', desc: 'Multi-user workspaces, permissions, and shared libraries', completed: false },
      ]
    },
    {
      quarter: 'Q3 2026',
      status: 'planned',
      icon: Globe,
      features: [
        { name: 'API Access', desc: 'Developer API for custom integrations and automation', completed: false },
        { name: 'Mobile Apps', desc: 'iOS and Android applications for on-the-go content creation', completed: false },
        { name: '8K Premium Video', desc: 'Premium tier for ultra-high resolution video output', completed: false },
        { name: 'Avatar Persistence', desc: 'Create and reuse consistent characters across all videos', completed: false },
        { name: 'Plugin Ecosystem', desc: 'Third-party plugins and extensions marketplace', completed: false },
        { name: 'Advanced Analytics', desc: 'Performance tracking, insights, and content recommendations', completed: false },
      ]
    },
    {
      quarter: 'Q4 2026',
      status: 'planned',
      icon: Cpu,
      features: [
        { name: 'Long-Form Videos (10+ minutes)', desc: 'Feature-length video generation without clip stitching', completed: false },
        { name: 'Custom AI Model Training', desc: 'Train personalized AI models on your brand content', completed: false },
        { name: 'White Label Solutions', desc: 'Rebrand and resell the platform under your brand', completed: false },
        { name: 'Real-Time Performance Capture', desc: 'Live motion capture for AI video generation', completed: false },
        { name: 'Photorealistic Humans', desc: 'Ultra-realistic human characters and expressions', completed: false },
        { name: 'Enterprise Features', desc: 'SSO, advanced security, custom contracts, SLA', completed: false },
      ]
    },
  ]

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'from-green-500 to-emerald-500'
      case 'in-progress': return 'from-yellow-500 to-orange-500'
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

  const stats = [
    { label: 'Tools Available', value: '60+', icon: Layers },
    { label: 'AI Models Integrated', value: '5+', icon: Server },
    { label: 'Video Quality', value: '4K', icon: Video },
    { label: 'Languages Supported', value: '10+', icon: Globe },
  ]

  return (
    <PublicLayout>
      {/* Header Section */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl">
            <span className="inline-block px-4 py-2 glass-badge text-purple-700 text-sm font-medium mb-4">
              Building the Future of Content Creation
            </span>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-purple-700 to-purple-500 bg-clip-text text-transparent mb-6">
              Product Roadmap
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              See what we've built and what's coming next. Powered by cutting-edge AI including Kling 3.0, Seedance 2.0, and more.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div key={i} className="glass-card p-4">
                    <Icon className="h-5 w-5 text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Content */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="space-y-16">
            {[...roadmapItems].reverse().map((item, index) => {
              const QuarterIcon = item.icon
              return (
                <div key={index} className="relative">
                  {/* Timeline line */}
                  {index !== roadmapItems.length - 1 && (
                    <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-transparent"></div>
                  )}

                  <div className="flex gap-6">
                    {/* Quarter Badge */}
                    <div className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br ${getStatusColor(item.status)} flex items-center justify-center font-bold text-sm shadow-lg`}>
                      <QuarterIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <h2 className="text-3xl font-bold text-foreground">{item.quarter}</h2>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(item.status)} text-white shadow-lg`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {item.features.map((feature, fIndex) => (
                          <Card key={fIndex} className={`p-5 glass-card hover:bg-white/80 transition-all duration-300 ${feature.completed ? 'border-l-4 border-l-green-500' : ''}`}>
                            <div className="flex items-start gap-3">
                              {feature.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                <h3 className="font-semibold text-foreground mb-1">{feature.name}</h3>
                                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Technology Partners Section */}
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-center mb-8">Powered By Leading AI Technology</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 glass-card hover:bg-white/80 transition-all">
                <Video className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Kling AI 3.0</h3>
                <p className="text-sm text-muted-foreground">
                  Character consistency with Elements, multi-shot generations, subject binding, and native audio support.
                </p>
              </Card>
              <Card className="p-6 glass-card hover:bg-white/80 transition-all">
                <Layers className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Seedance 2.0</h3>
                <p className="text-sm text-muted-foreground">
                  Multimodal DiT architecture with quad-modal inputs, native 2K resolution, and 30% faster generation.
                </p>
              </Card>
              <Card className="p-6 glass-card hover:bg-white/80 transition-all">
                <Image className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Gemini & GPT</h3>
                <p className="text-sm text-muted-foreground">
                  State-of-the-art image generation and text AI for stunning visuals and compelling copy.
                </p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <Card className="p-12 glass-card-elevated text-center">
              <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Have a Feature Request?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                We're constantly improving based on your feedback. Let us know what features would help your content creation workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/tools">
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Explore All Tools
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
