'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit3, Image as ImageIcon } from 'lucide-react'
import { ToolCard, FeaturedToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const FEATURED_TOOLS = [
  {
    id: 'video-editor',
    name: 'Video Editor',
    description: 'Professional video editing with trimming, effects & transitions',
    icon: '🎬',
    href: '/dashboard/tools/video-editor',
    useCase: 'All Video Editing',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Trim & Cut', 'Effects', 'Transitions']
  },
  {
    id: 'image-editor',
    name: 'Image Studio',
    description: 'Complete AI image generation, editing, upscaling & compression',
    icon: '🖼️',
    href: '/dashboard/tools/image-editor',
    useCase: 'All Image Needs',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['AI Generate', 'Edit', 'Upscale']
  },
  {
    id: 'audio-editor',
    name: 'Audio Editor',
    description: 'Edit, enhance and clean up your audio files',
    icon: '🎵',
    href: '/dashboard/tools/audio-editor',
    useCase: 'Podcasts, Voice-overs',
    gradient: 'from-green-500 to-emerald-500',
    features: ['Trim & Cut', 'Noise Remove', 'Enhance']
  }
]

const MEDIA_CATEGORIES = [
  {
    id: 'images',
    name: 'Image Tools',
    description: 'Image editing and enhancement',
    icon: '🖼️',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'image-editor',
        name: 'Image Studio',
        description: 'Generate, edit, upscale & compress images',
        icon: '🖼️',
        href: '/dashboard/tools/image-editor',
        useCase: 'Complete image editing'
      }
    ]
  },
  {
    id: 'thumbnails',
    name: 'Thumbnails & Covers',
    description: 'Create click-worthy thumbnails',
    icon: '🎨',
    color: 'from-red-500 to-orange-500',
    tools: [
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        description: 'Click-worthy YouTube thumbnails',
        icon: '🎨',
        href: '/dashboard/tools/thumbnail-maker',
        useCase: 'YouTube, videos'
      },
      {
        id: 'cover-image-creator',
        name: 'Cover Image Creator',
        description: 'Professional cover images',
        icon: '🖼️',
        href: '/dashboard/tools/cover-image-creator',
        useCase: 'Social, blogs'
      },
      {
        id: 'podcast-cover-maker',
        name: 'Podcast Cover Maker',
        description: 'Professional podcast artwork',
        icon: '🎙️',
        href: '/dashboard/tools/podcast-cover-maker',
        useCase: 'Spotify, Apple Podcasts'
      }
    ]
  },
  {
    id: 'audio',
    name: 'Audio Tools',
    description: 'Audio editing and enhancement',
    icon: '🎵',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'audio-editor',
        name: 'Audio Editor',
        description: 'Edit and enhance audio files',
        icon: '🎵',
        href: '/dashboard/tools/audio-editor',
        useCase: 'Podcasts, music'
      },
      {
        id: 'noise-remover',
        name: 'Noise Remover',
        description: 'Remove background noise from audio',
        icon: '🔇',
        href: '/dashboard/tools/noise-remover',
        useCase: 'Clean audio'
      },
      {
        id: 'voice-enhancer',
        name: 'Voice Enhancer',
        description: 'Enhance voice recordings',
        icon: '🎤',
        href: '/dashboard/tools/voice-enhancer',
        useCase: 'Voice-overs, podcasts'
      },
      {
        id: 'auto-subtitles',
        name: 'Auto Subtitles',
        description: 'Add subtitles automatically',
        icon: '📝',
        href: '/dashboard/tools/auto-subtitles',
        useCase: 'Accessibility, reach'
      }
    ]
  }
]

export default function MediaEditingPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Media Editor"
        subtitle="Professional image and audio editing tools"
        icon={<Edit3 className="h-7 w-7" />}
        gradient="from-blue-600 via-cyan-600 to-teal-500"
        stats={[
          { value: 'Pro', label: 'Quality' },
          { value: '4K', label: 'Support' },
          { value: 'Fast', label: 'Export' },
          { value: 'Easy', label: 'To Use' }
        ]}
      />

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
            All Tools
          </TabsTrigger>
          {MEDIA_CATEGORIES.map((cat) => (
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
            {MEDIA_CATEGORIES.map((category) => (
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

        {MEDIA_CATEGORIES.map((category) => (
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
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200/50 dark:border-blue-800/30">
        <CardContent className="py-6">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-4">
            Media Editing Tips
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: '🖼️', title: 'High Resolution', desc: 'Start with quality source files' },
              { emoji: '🎨', title: 'Consistent Style', desc: 'Maintain brand colors and fonts' },
              { emoji: '🔊', title: 'Clean Audio', desc: 'Remove noise before editing' },
              { emoji: '💾', title: 'Save Originals', desc: 'Keep backups of source files' }
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">{tip.title}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
