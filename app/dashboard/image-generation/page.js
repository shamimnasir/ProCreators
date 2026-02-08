'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Camera, 
  Sparkles,
  ArrowRight,
  Wand2,
  User,
  ImageIcon,
  Palette,
  Layers,
  Scissors,
  Download,
  Zap
} from 'lucide-react'

const IMAGE_CATEGORIES = [
  {
    id: 'product',
    name: 'Product & E-commerce',
    description: 'Professional product photography',
    icon: '📸',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'cover-image-creator',
        name: 'Cover Image Creator',
        description: 'Create stunning cover images and banners',
        icon: '🖼️',
        href: '/dashboard/tools/cover-image-creator',
        useCase: 'Social media, blogs',
        badge: 'Popular'
      },
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        description: 'Eye-catching thumbnails for videos',
        icon: '🎬',
        href: '/dashboard/tools/thumbnail-maker',
        useCase: 'YouTube, videos',
        badge: 'Hot'
      }
    ]
  },
  {
    id: 'portrait',
    name: 'Portraits & Avatars',
    description: 'Professional headshots and avatars',
    icon: '👤',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'avatar-creator',
        name: 'AI Avatar Creator',
        description: 'Create unique cartoon/artistic avatars',
        icon: '🎭',
        href: '/dashboard/tools/avatar-creator',
        useCase: 'Social media, gaming',
        badge: 'Fun'
      }
    ]
  },
  {
    id: 'editing',
    name: 'Image Editing',
    description: 'Edit and enhance images',
    icon: '🔧',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'image-editor',
        name: 'AI Image Editor',
        description: 'Advanced editing with AI assistance',
        icon: '🖼️',
        href: '/dashboard/tools/image-editor',
        useCase: 'Photo editing',
        badge: ''
      }
    ]
  }
]

export default function ImageGenerationPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Image Generation</h1>
              <p className="text-white/80">Create stunning visuals with AI-powered tools</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Wand2 className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">1-Click</p>
              <p className="text-xs text-white/70">Generation</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Zap className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">10 sec</p>
              <p className="text-xs text-white/70">Avg Speed</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Layers className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">4K</p>
              <p className="text-xs text-white/70">Resolution</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Download className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">PNG/JPG</p>
              <p className="text-xs text-white/70">Formats</p>
            </div>
          </div>
        </div>
        
        {/* Decorative */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Use Cases Banner */}
      <Card className="border-dashed bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-violet-800 dark:text-violet-200">Perfect for:</span>
              <div className="flex gap-2 flex-wrap">
                {['E-commerce', 'Social Media', 'Marketing', 'Personal Branding', 'Print'].map((use) => (
                  <Badge key={use} variant="secondary" className="bg-white dark:bg-violet-900">
                    {use}
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
            🎯 All Tools
          </TabsTrigger>
          {IMAGE_CATEGORIES.map((cat) => (
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
            {IMAGE_CATEGORIES.map((category) => (
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

        {/* Individual Category Views */}
        {IMAGE_CATEGORIES.map((category) => (
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

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
            <Sparkles className="h-5 w-5" />
            Pro Tips for AI Image Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="font-medium text-violet-900 dark:text-violet-100">Be Specific</p>
                <p className="text-sm text-violet-700 dark:text-violet-300">Detailed prompts = better results</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-medium text-violet-900 dark:text-violet-100">Mention Style</p>
                <p className="text-sm text-violet-700 dark:text-violet-300">Add "professional", "minimal", etc.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-medium text-violet-900 dark:text-violet-100">Iterate</p>
                <p className="text-sm text-violet-700 dark:text-violet-300">Generate multiple versions, pick the best</p>
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
          {expanded && tool.useCase && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Best for:</span>
              <Badge variant="outline" className="text-[10px]">
                {tool.useCase}
              </Badge>
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
