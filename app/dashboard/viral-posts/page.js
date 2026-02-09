'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { ToolCard, FeaturedToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const FEATURED_TOOLS = [
  {
    id: 'linkedin-posts',
    name: 'Social Media Posts',
    description: 'Create viral posts for 7+ platforms with AI that understands engagement',
    icon: '📱',
    href: '/dashboard/tools/linkedin-posts',
    useCase: 'All Platforms',
    gradient: 'from-blue-500 to-indigo-500',
    features: ['Multi-platform', 'Engagement AI', 'Hashtag Suggest']
  },
  {
    id: 'content-humanizer',
    name: 'Content Humanizer',
    description: 'Transform AI text into natural human-like content that bypasses detection',
    icon: '✍️',
    href: '/dashboard/tools/content-humanizer',
    useCase: 'AI Detection Bypass',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Bypass Detection', 'Natural Tone', 'Style Match']
  },
  {
    id: 'threads',
    name: 'Thread Generator',
    description: 'Create viral Twitter/X threads that hook readers and drive engagement',
    icon: '🧵',
    href: '/dashboard/tools/threads',
    useCase: 'Twitter/X, LinkedIn',
    gradient: 'from-rose-500 to-orange-500',
    features: ['Hook First Line', 'Story Arc', 'CTA Builder']
  }
]

const VIRAL_CATEGORIES = [
  {
    id: 'text',
    name: 'Text Content',
    description: 'Viral text posts and threads',
    icon: '📝',
    color: 'from-blue-500 to-indigo-500',
    tools: [
      {
        id: 'social-media-posts',
        name: 'Social Media Post Creator',
        description: 'Viral posts for 7 platforms with AI generation',
        icon: '📱',
        href: '/dashboard/tools/linkedin-posts',
        useCase: 'All social platforms'
      },
      {
        id: 'content-humanizer',
        name: 'Content Humanizer',
        description: 'Make AI text sound natural & bypass detection',
        icon: '✍️',
        href: '/dashboard/tools/content-humanizer',
        useCase: 'AI Detection Bypass'
      },
      {
        id: 'blog-creator',
        name: 'Blog Post Creator',
        description: 'SEO articles, affiliate content & product reviews',
        icon: '📝',
        href: '/dashboard/tools/blog-creator',
        useCase: 'Blogs, SEO, Affiliate'
      },
      {
        id: 'threads',
        name: 'Thread Generator',
        description: 'Create viral Twitter/X threads that get engagement',
        icon: '🧵',
        href: '/dashboard/tools/threads',
        useCase: 'Twitter/X, LinkedIn'
      },
      {
        id: 'quotes',
        name: 'Quote Maker',
        description: 'Beautiful quote images for social media',
        icon: '💬',
        href: '/dashboard/tools/quotes',
        useCase: 'Instagram, Pinterest'
      },
      {
        id: 'lists',
        name: 'List Post Creator',
        description: 'Engaging listicles and top 10 posts',
        icon: '📋',
        href: '/dashboard/tools/lists',
        useCase: 'All platforms'
      }
    ]
  },
  {
    id: 'visual',
    name: 'Visual Content',
    description: 'Eye-catching visual posts',
    icon: '🖼️',
    color: 'from-pink-500 to-rose-500',
    tools: [
      {
        id: 'carousels',
        name: 'Carousel Creator',
        description: 'Swipeable carousel posts for Instagram',
        icon: '🎠',
        href: '/dashboard/tools/carousels',
        useCase: 'Instagram, LinkedIn'
      },
      {
        id: 'photo-cards',
        name: 'Photo Cards',
        description: 'Stunning photo cards with text overlays',
        icon: '🌅',
        href: '/dashboard/tools/photo-cards',
        useCase: 'Stories, posts'
      }
    ]
  },
  {
    id: 'news',
    name: 'News & Trends',
    description: 'Trending content creation',
    icon: '📰',
    color: 'from-orange-500 to-amber-500',
    tools: [
      {
        id: 'news',
        name: 'News Post Generator',
        description: 'Breaking news style posts',
        icon: '📰',
        href: '/dashboard/tools/news',
        useCase: 'Trending topics'
      }
    ]
  }
]

export default function ViralPostsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Viral Content Creation"
        subtitle="Create content that breaks the algorithm"
        icon={<TrendingUp className="h-7 w-7" />}
        gradient="from-rose-500 via-pink-500 to-purple-600"
        stats={[
          { value: '10x', label: 'More Views' },
          { value: '5x', label: 'Engagement' },
          { value: 'Viral', label: 'Potential' },
          { value: 'Smart', label: 'Optimized' }
        ]}
      />

      {/* Platforms Banner */}
      <Card className="border-dashed bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-rose-800 dark:text-rose-200">Optimized for:</span>
              <div className="flex gap-2 flex-wrap">
                {['Twitter/X', 'Instagram', 'LinkedIn', 'TikTok', 'Facebook', 'Pinterest'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-rose-900/50">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Tools */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-xl font-bold">Featured Tools</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURED_TOOLS.map((tool) => (
            <FeaturedToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
            All Posts
          </TabsTrigger>
          {VIRAL_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-8">
          <div className="space-y-10">
            {VIRAL_CATEGORIES.map((category) => (
              <div key={category.id}>
                <CategoryHeader category={category} />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} gradient={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {VIRAL_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-8">
            <CategoryHeader category={category} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} gradient={category.color} expanded />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Viral Tips */}
      <Card className="bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-950/30 dark:to-purple-950/30 border-rose-200/50 dark:border-rose-800/30">
        <CardContent className="py-6">
          <h3 className="font-bold text-rose-800 dark:text-rose-200 mb-4">
            Viral Content Formula
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: '🎯', title: 'Strong Hook', desc: 'First line must grab attention' },
              { emoji: '💡', title: 'Provide Value', desc: 'Teach, entertain, or inspire' },
              { emoji: '💬', title: 'Ask Questions', desc: 'Drive comments and engagement' },
              { emoji: '⏰', title: 'Post Timing', desc: 'Post when audience is active' }
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-medium text-rose-900 dark:text-rose-100">{tip.title}</p>
                  <p className="text-sm text-rose-700 dark:text-rose-300">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
