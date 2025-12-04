'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, Video, MessageSquare, Settings, Zap, Image, FileText, ChevronRight } from 'lucide-react'
import { PublicLayout } from '@/components/shared/PublicLayout'

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      title: 'Getting Started',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      articles: [
        { title: 'Quick Start Guide', desc: 'Get up and running in 5 minutes' },
        { title: 'Account Setup', desc: 'Create and configure your account' },
        { title: 'Dashboard Overview', desc: 'Navigate the ProCreators interface' },
        { title: 'First Content Creation', desc: 'Create your first piece of content' },
      ]
    },
    {
      title: 'Text Tools',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      articles: [
        { title: 'Thread Generator', desc: 'Create engaging Twitter/X threads' },
        { title: 'Quote Maker', desc: 'Generate inspiring quotes' },
        { title: 'List Creator', desc: 'Build comprehensive lists and listicles' },
        { title: 'News Articles', desc: 'Write professional news content' },
        { title: 'Tutorial Writer', desc: 'Create step-by-step tutorials' },
      ]
    },
    {
      title: 'Image Tools',
      icon: Image,
      color: 'from-pink-500 to-purple-500',
      articles: [
        { title: 'Photo Cards', desc: 'Create viral social media cards' },
        { title: 'Carousel Generator', desc: 'Build multi-slide carousels' },
        { title: 'Image Filters', desc: 'Apply filters and effects' },
        { title: 'Logo Upload', desc: 'Add custom branding to images' },
      ]
    },
    {
      title: 'Video Tools',
      icon: Video,
      color: 'from-red-500 to-pink-500',
      articles: [
        { title: 'Reels Creator', desc: 'Make short-form videos (Coming Soon)' },
        { title: 'Video Editor', desc: 'Edit and enhance videos (Coming Soon)' },
        { title: 'Auto Subtitles', desc: 'Add AI-powered captions (Coming Soon)' },
      ]
    },
    {
      title: 'Library & Storage',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      articles: [
        { title: 'Content Library', desc: 'Save and manage your creations' },
        { title: 'Downloading Content', desc: 'Export your work' },
        { title: 'Organizing Projects', desc: 'Keep your content organized' },
      ]
    },
    {
      title: 'Advanced Features',
      icon: Settings,
      color: 'from-purple-500 to-indigo-500',
      articles: [
        { title: 'System Prompts', desc: 'Customize AI behavior (Admin)' },
        { title: 'API Access', desc: 'Integrate with external tools (Coming Soon)' },
        { title: 'Bulk Operations', desc: 'Create multiple pieces at once (Coming Soon)' },
        { title: 'Team Collaboration', desc: 'Work with your team (Coming Soon)' },
      ]
    },
  ]

  const popularArticles = [
    'How to create viral photo cards',
    'Understanding AI system prompts',
    'Best practices for thread writing',
    'Using URL context for better content',
    'Image filter guide',
  ]

  return (
    <PublicLayout>
      {/* Header Section */}
      <section className="border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Documentation
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mb-8">
            Everything you need to know about using ProCreators effectively.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-[#7c3aed]"
            />
          </div>
        </div>
      </header>

      {/* Quick Links */}
      <section className="py-8 border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Popular:</span>
            {popularArticles.map((article, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                {article}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Card key={index} className="p-6 border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-[#7c3aed]/50 transition-all">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${category.color} mb-4`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{category.title}</h3>
                <ul className="space-y-3">
                  {category.articles.map((article, aIndex) => (
                    <li key={aIndex}>
                      <a href="#" className="group flex items-start gap-2 text-sm hover:text-[#a78bfa] transition-colors">
                        <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-[#a78bfa] flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-300 group-hover:text-[#a78bfa]">{article.title}</div>
                          <div className="text-xs text-gray-500">{article.desc}</div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20 bg-gradient-to-b from-[#0a0e27] to-[#1a1147]">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="p-12 text-center bg-gradient-to-b from-[#7c3aed]/20 to-transparent border-[#7c3aed]/50">
            <MessageSquare className="h-12 w-12 text-[#a78bfa] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Still Need Help?</h2>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white">
                Contact Support
              </Button>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                Join Community
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
