'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  ArrowRight,
  MessageSquare,
  Quote,
  ImageIcon,
  Newspaper,
  GraduationCap,
  List,
  CreditCard,
  TrendingUp,
  Share2,
  Eye,
  Heart,
  Zap,
  Wand2,
  Shield,
  CheckCircle
} from 'lucide-react'

// Featured/Highlighted Tools - Top-level prominent tools
const FEATURED_TOOLS = [
  {
    id: 'content-humanizer',
    name: 'AI Content Humanizer',
    description: 'Transform AI-generated text into natural, human-sounding content that bypasses AI detection',
    icon: '✨',
    href: '/dashboard/tools/content-humanizer',
    useCase: 'Bypass AI Detection',
    badge: 'Pro',
    gradient: 'from-purple-600 to-pink-600',
    features: ['Undetectable Content', 'Multiple Tones', 'Deep Rewriting']
  },
  {
    id: 'blog-creator',
    name: 'Blog Post Creator',
    description: 'SEO articles, affiliate content & product reviews with AI humanization built-in',
    icon: '📝',
    href: '/dashboard/tools/blog-creator',
    useCase: 'Blogs, SEO, Affiliate',
    badge: 'New',
    gradient: 'from-blue-600 to-indigo-600',
    features: ['SEO Optimized', 'Grammar Check', 'AI Humanizer']
  },
  {
    id: 'social-media-posts',
    name: 'Social Media Post Creator',
    description: 'Viral posts for 7 platforms with AI generation and optimization',
    icon: '📱',
    href: '/dashboard/tools/linkedin-posts',
    useCase: 'All Social Platforms',
    badge: 'Hot',
    gradient: 'from-rose-600 to-orange-600',
    features: ['7 Platforms', 'Viral Hooks', 'Engagement Optimized']
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
        useCase: 'All social platforms',
        badge: 'Hot'
      },
      {
        id: 'content-humanizer',
        name: 'AI Content Humanizer',
        description: 'Make AI text sound natural & bypass detection',
        icon: '✨',
        href: '/dashboard/tools/content-humanizer',
        useCase: 'AI Detection Bypass',
        badge: 'Pro'
      },
      {
        id: 'blog-creator',
        name: 'Blog Post Creator',
        description: 'SEO articles, affiliate content & product reviews',
        icon: '📝',
        href: '/dashboard/tools/blog-creator',
        useCase: 'Blogs, SEO, Affiliate',
        badge: 'New'
      },
      {
        id: 'threads',
        name: 'Thread Generator',
        description: 'Create viral Twitter/X threads that get engagement',
        icon: '🧵',
        href: '/dashboard/tools/threads',
        useCase: 'Twitter/X, LinkedIn',
        badge: 'Viral'
      },
      {
        id: 'quotes',
        name: 'Quote Maker',
        description: 'Beautiful quote images for social media',
        icon: '💬',
        href: '/dashboard/tools/quotes',
        useCase: 'Instagram, Pinterest',
        badge: 'Popular'
      },
      {
        id: 'lists',
        name: 'List Post Creator',
        description: 'Engaging listicles and top 10 posts',
        icon: '📋',
        href: '/dashboard/tools/lists',
        useCase: 'All platforms',
        badge: ''
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
        useCase: 'Instagram, LinkedIn',
        badge: 'Hot'
      },
      {
        id: 'photo-cards',
        name: 'Photo Cards',
        description: 'Stunning photo cards with text overlays',
        icon: '🌅',
        href: '/dashboard/tools/photo-cards',
        useCase: 'Stories, posts',
        badge: ''
      },
      {
        id: 'infographics',
        name: 'Infographic Maker',
        description: 'Data-driven visual content',
        icon: '📊',
        href: '/dashboard/tools/infographics',
        useCase: 'Educational content',
        badge: ''
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
        useCase: 'Trending topics',
        badge: 'Trending'
      },
      {
        id: 'hot-takes',
        name: 'Hot Takes Generator',
        description: 'Controversial opinions that spark debate',
        icon: '🔥',
        href: '/dashboard/tools/hot-takes',
        useCase: 'Engagement bait',
        badge: 'Spicy'
      }
    ]
  },
  {
    id: 'educational',
    name: 'Educational Posts',
    description: 'Teach and provide value',
    icon: '🎓',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'tutorials',
        name: 'Tutorial Creator',
        description: 'Step-by-step how-to posts',
        icon: '📖',
        href: '/dashboard/tools/tutorials',
        useCase: 'Teaching, guides',
        badge: 'Value'
      },
      {
        id: 'tips-tricks',
        name: 'Tips & Tricks Posts',
        description: 'Quick tips that get saved and shared',
        icon: '💡',
        href: '/dashboard/tools/tips-tricks',
        useCase: 'High save rate',
        badge: ''
      },
      {
        id: 'myth-busters',
        name: 'Myth Buster Posts',
        description: 'Debunk myths and misconceptions',
        icon: '❌',
        href: '/dashboard/tools/myth-busters',
        useCase: 'Controversy, shares',
        badge: ''
      }
    ]
  },
  {
    id: 'engagement',
    name: 'Engagement Posts',
    description: 'Maximize interaction',
    icon: '💬',
    color: 'from-purple-500 to-violet-500',
    tools: [
      {
        id: 'polls',
        name: 'Poll & Question Posts',
        description: 'Interactive polls that drive comments',
        icon: '🗳️',
        href: '/dashboard/tools/polls',
        useCase: 'Comments, engagement',
        badge: 'Interactive'
      },
      {
        id: 'fill-blank',
        name: 'Fill-in-the-Blank Posts',
        description: 'Engagement hooks that get responses',
        icon: '❓',
        href: '/dashboard/tools/fill-blank',
        useCase: 'Comment farming',
        badge: ''
      },
      {
        id: 'this-or-that',
        name: 'This or That Posts',
        description: 'Choice posts that spark debate',
        icon: '⚖️',
        href: '/dashboard/tools/this-or-that',
        useCase: 'Engagement',
        badge: ''
      }
    ]
  }
]

export default function ViralPostsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Viral Content Creation</h1>
              <p className="text-white/80">Create content that breaks the algorithm</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Eye className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">10x</p>
              <p className="text-xs text-white/70">More Views</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Heart className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">5x</p>
              <p className="text-xs text-white/70">Engagement</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Share2 className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Viral</p>
              <p className="text-xs text-white/70">Potential</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Zap className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-white/70">Optimized</p>
            </div>
          </div>
        </div>
        
        {/* Decorations */}
        <div className="absolute top-4 right-4 text-4xl">🚀</div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Platforms Banner */}
      <Card className="border-dashed bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-rose-800 dark:text-rose-200">Optimized for:</span>
              <div className="flex gap-2 flex-wrap">
                {['Twitter/X', 'Instagram', 'LinkedIn', 'TikTok', 'Facebook', 'Pinterest'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-rose-900">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🎯 All Posts
          </TabsTrigger>
          {VIRAL_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {VIRAL_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                    <span className="text-xl">{category.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {VIRAL_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                <span className="text-2xl">{category.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} categoryColor={category.color} expanded />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Viral Tips */}
      <Card className="bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-950/30 dark:to-purple-950/30 border-rose-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <Sparkles className="h-5 w-5" />
            Viral Content Formula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-rose-900 dark:text-rose-100">Strong Hook</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">First line must grab attention</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-rose-900 dark:text-rose-100">Provide Value</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">Teach, entertain, or inspire</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-medium text-rose-900 dark:text-rose-100">Ask Questions</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">Drive comments and engagement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-medium text-rose-900 dark:text-rose-100">Post Timing</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">Post when audience is active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ToolCard({ tool, categoryColor, expanded = false }) {
  return (
    <Link href={tool.href}>
      <Card className="group h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
        <CardHeader className={expanded ? "pb-2" : "pb-1"}>
          <div className="flex items-start justify-between">
            <div className="text-3xl mb-2">{tool.icon}</div>
            {tool.badge && (
              <Badge className={`bg-gradient-to-r ${categoryColor} text-white text-[10px]`}>
                {tool.badge}
              </Badge>
            )}
          </div>
          <CardTitle className={`group-hover:text-primary transition-colors ${expanded ? "text-lg" : "text-base"}`}>
            {tool.name}
          </CardTitle>
          <CardDescription className={expanded ? "" : "text-xs line-clamp-2"}>
            {tool.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {expanded && tool.useCase && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Best for:</span>
              <Badge variant="outline" className="text-[10px]">{tool.useCase}</Badge>
            </div>
          )}
          <div className="flex items-center justify-between">
            {!expanded && tool.useCase && (
              <span className="text-xs text-muted-foreground">{tool.useCase}</span>
            )}
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Create <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
