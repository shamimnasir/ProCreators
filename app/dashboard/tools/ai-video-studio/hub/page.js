'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Film, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Wand2,
  Play,
  Image,
  Video,
  Palette,
  Mic
} from 'lucide-react'

// AI Video Studio tools and templates
const VIDEO_CATEGORIES = [
  {
    id: 'ai-generation',
    name: 'AI Video Generation',
    icon: '🎬',
    description: 'Create videos from text prompts',
    color: 'from-purple-500 to-indigo-500',
    tools: [
      {
        id: 'text-to-video',
        name: 'Text to Video',
        icon: '✨',
        description: 'Generate stunning videos from text descriptions',
        href: '/dashboard/tools/ai-video-studio',
        badge: 'Pro',
        features: ['AI cinematography', 'Multiple styles', '4K output']
      },
      {
        id: 'image-to-video',
        name: 'Image to Video',
        icon: '🖼️',
        description: 'Animate any image with AI motion',
        href: '/dashboard/tools/ai-video-studio',
        badge: 'Pro',
        features: ['Photo animation', 'Camera movement', 'Loop effects']
      },
      {
        id: 'talking-head',
        name: 'Talking Head',
        icon: '🗣️',
        description: 'Create videos with AI presenters',
        href: '/dashboard/tools/talking-head',
        badge: 'New',
        features: ['AI avatars', 'Lip sync', 'Custom voices']
      }
    ]
  },
  {
    id: 'templates',
    name: 'Video Templates',
    icon: '📋',
    description: 'Pre-designed templates for quick creation',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'product-ads',
        name: 'Product Ads',
        icon: '🛍️',
        description: 'Professional product showcase videos',
        href: '/dashboard/tools/ai-video-studio?template=product-ad',
        features: ['E-commerce ready', '3D effects', 'Multiple angles']
      },
      {
        id: 'social-promos',
        name: 'Social Promos',
        icon: '📱',
        description: 'Eye-catching promotional content',
        href: '/dashboard/tools/ai-video-studio?template=social-promo',
        features: ['Platform optimized', 'Trendy styles', 'Auto-captions']
      },
      {
        id: 'explainer',
        name: 'Explainer Videos',
        icon: '💡',
        description: 'Educational and explainer content',
        href: '/dashboard/tools/ai-video-studio?template=explainer',
        features: ['Motion graphics', 'Voice sync', 'Infographics']
      },
      {
        id: 'cinematic',
        name: 'Cinematic Clips',
        icon: '🎥',
        description: 'Movie-quality video generation',
        href: '/dashboard/tools/ai-video-studio?template=cinematic',
        features: ['Film grain', 'Color grading', 'Letterbox']
      }
    ]
  },
  {
    id: 'enhancement',
    name: 'Video Enhancement',
    icon: '✨',
    description: 'Enhance and edit your videos',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'auto-subtitles',
        name: 'Auto Subtitles',
        icon: '📝',
        description: 'AI-generated captions and subtitles',
        href: '/dashboard/tools/auto-subtitles',
        features: ['Multi-language', 'Styled captions', 'Word timing']
      },
      {
        id: 'video-editor',
        name: 'Video Editor',
        icon: '✂️',
        description: 'Trim, cut, and edit your videos',
        href: '/dashboard/tools/video-editor',
        features: ['Timeline editing', 'Transitions', 'Effects']
      },
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        icon: '🖼️',
        description: 'Create click-worthy thumbnails',
        href: '/dashboard/tools/thumbnail-maker',
        features: ['AI suggestions', 'Templates', 'Text overlays']
      }
    ]
  }
]

export default function AIVideoStudioHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Film className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Video Studio</h1>
              <p className="text-white/80">Professional AI-Powered Video Creation</p>
            </div>
            <Badge className="ml-auto bg-white/20 text-white">Pro</Badge>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Wand2 className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI Engine</p>
              <p className="text-xs text-white/70">Cinema Quality</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Clock className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">5s - 2m</p>
              <p className="text-xs text-white/70">Video Duration</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Palette className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">20+</p>
              <p className="text-xs text-white/70">Visual Styles</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Zap className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">4K</p>
              <p className="text-xs text-white/70">Max Resolution</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Quick Start CTA */}
      <Card className="border-dashed bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <div>
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                  Ready to create?
                </span>
                <span className="text-sm text-indigo-600 dark:text-indigo-300 ml-2">
                  Jump straight into the video studio
                </span>
              </div>
            </div>
            <Link href="/dashboard/tools/ai-video-studio">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Play className="h-4 w-4 mr-2" />
                Open Studio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🎯 All Tools
          </TabsTrigger>
          {VIDEO_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Tools View */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {VIDEO_CATEGORIES.map((category) => (
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
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Individual Category Views */}
        {VIDEO_CATEGORIES.map((category) => (
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

      {/* Pro Tips Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Sparkles className="h-5 w-5" />
            Pro Tips for AI Video Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">1️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Detailed Prompts</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Be specific about camera angles, lighting, and mood</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">2️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Use Templates</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Start with templates for faster, better results</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">3️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Iterate & Refine</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Generate variations and pick the best one</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tool Card Component
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
          {expanded && tool.features && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tool.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-[10px]">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Open Tool <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
