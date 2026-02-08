'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera } from 'lucide-react'
import { ToolCard, FeaturedToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const FEATURED_TOOLS = [
  {
    id: 'cover-image-creator',
    name: 'Cover Image Creator',
    description: 'Create stunning cover images and banners for any platform',
    icon: '🖼️',
    href: '/dashboard/tools/cover-image-creator',
    useCase: 'Social media, Blogs',
    badge: 'Popular',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Templates', 'Custom Sizes', 'Brand Colors']
  },
  {
    id: 'thumbnail-maker',
    name: 'Thumbnail Maker',
    description: 'Eye-catching thumbnails that get clicks',
    icon: '🎬',
    href: '/dashboard/tools/thumbnail-maker',
    useCase: 'YouTube, Videos',
    badge: 'Hot',
    gradient: 'from-red-500 to-orange-500',
    features: ['Click-Worthy', 'A/B Test', 'HD Export']
  },
  {
    id: 'avatar-creator',
    name: 'Avatar Creator',
    description: 'Create unique cartoon or artistic avatars',
    icon: '🎭',
    href: '/dashboard/tools/avatar-creator',
    useCase: 'Social media, Gaming',
    badge: 'Fun',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Multiple Styles', 'Customizable', 'High Quality']
  }
]

const IMAGE_CATEGORIES = [
  {
    id: 'product',
    name: 'Covers & Banners',
    description: 'Professional cover images',
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
        name: 'Avatar Creator',
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
        name: 'Image Editor',
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
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Image Generation"
        subtitle="Create stunning visuals with AI-powered tools"
        icon={<Camera className="h-7 w-7" />}
        gradient="from-violet-600 via-purple-600 to-fuchsia-600"
        emoji="🎨"
        stats={[
          { value: '1-Click', label: 'Generation' },
          { value: '10 sec', label: 'Avg Speed' },
          { value: 'HD', label: 'Quality' },
          { value: 'Unlimited', label: 'Styles' }
        ]}
      />

      {/* Featured Tools */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Camera className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-bold">Featured Tools</h2>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Image</Badge>
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
            🎯 All Images
          </TabsTrigger>
          {IMAGE_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-8">
          <div className="space-y-10">
            {IMAGE_CATEGORIES.map((category) => (
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

        {IMAGE_CATEGORIES.map((category) => (
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

      {/* Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200/50 dark:border-purple-800/30">
        <CardContent className="py-6">
          <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image Creation Tips
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: '📐', title: 'Right Size', desc: 'Use platform-specific dimensions' },
              { emoji: '🎨', title: 'Brand Colors', desc: 'Maintain visual consistency' },
              { emoji: '✨', title: 'High Quality', desc: 'Export in HD for best results' },
              { emoji: '👁️', title: 'Eye-Catching', desc: 'Use contrast and bold elements' }
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">{tip.title}</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
