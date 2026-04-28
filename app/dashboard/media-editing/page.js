'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit3, Image as ImageIcon } from 'lucide-react'
import { ToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const MEDIA_CATEGORIES = [
  {
    id: 'images',
    name: 'Image Tools',
    description: 'Image editing and enhancement',
    icon: 'Image',
    color: 'from-blue-500 to-blue-600',
    tools: [
      {
        id: 'image-editor',
        name: 'Image Studio',
        description: 'Generate, edit, upscale & compress images',
        icon: 'Image',
        href: '/dashboard/tools/image-editor',
        useCase: 'Complete image editing'
      }
    ]
  },
  {
    id: 'thumbnails',
    name: 'Thumbnails & Covers',
    description: 'Create click-worthy thumbnails',
    icon: 'Palette',
    color: 'from-rose-500 to-rose-600',
    tools: [
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        description: 'Click-worthy YouTube thumbnails',
        icon: 'Palette',
        href: '/dashboard/tools/thumbnail-maker',
        useCase: 'YouTube, videos'
      },
      {
        id: 'cover-image-creator',
        name: 'Cover Image Creator',
        description: 'Professional cover images',
        icon: 'Image',
        href: '/dashboard/tools/cover-image-creator',
        useCase: 'Social, blogs'
      },
      {
        id: 'podcast-cover-maker',
        name: 'Podcast Cover Maker',
        description: 'Professional podcast artwork',
        icon: 'Mic',
        href: '/dashboard/tools/podcast-cover-maker',
        useCase: 'Spotify, Apple Podcasts'
      }
    ]
  },
  {
    id: 'audio',
    name: 'Audio Tools',
    description: 'Audio editing and enhancement',
    icon: 'Music',
    color: 'from-emerald-500 to-emerald-600',
    tools: [
      {
        id: 'audio-editor',
        name: 'Audio Editor',
        description: 'Edit and enhance audio files',
        icon: 'Music',
        href: '/dashboard/tools/audio-editor',
        useCase: 'Podcasts, music'
      },
      {
        id: 'noise-remover',
        name: 'Noise Remover',
        description: 'Remove background noise from audio',
        icon: 'Volume2',
        href: '/dashboard/tools/noise-remover',
        useCase: 'Clean audio'
      },
      {
        id: 'voice-enhancer',
        name: 'Voice Enhancer',
        description: 'Enhance voice recordings',
        icon: 'Mic',
        href: '/dashboard/tools/voice-enhancer',
        useCase: 'Voice-overs, podcasts'
      },
      {
        id: 'auto-subtitles',
        name: 'Auto Subtitles',
        description: 'Add subtitles automatically',
        icon: 'Subtitles',
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
