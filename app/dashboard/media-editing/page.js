'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Edit3, 
  Sparkles,
  ArrowRight,
  Video,
  ImageIcon,
  Scissors,
  Type,
  Music,
  Wand2,
  Layers,
  Maximize,
  Film
} from 'lucide-react'

const MEDIA_CATEGORIES = [
  {
    id: 'video',
    name: 'Video Editing',
    description: 'Edit and enhance videos',
    icon: '🎬',
    color: 'from-red-500 to-orange-500',
    tools: [
      {
        id: 'video-editor',
        name: 'AI Video Editor',
        description: 'Full-featured video editing with AI assistance',
        icon: '🎬',
        href: '/dashboard/tools/video-editor',
        useCase: 'Complete video editing',
        badge: 'Powerful'
      },
      {
        id: 'auto-subtitles',
        name: 'Auto Subtitles',
        description: 'Automatic captions and subtitles for any video',
        icon: '📝',
        href: '/dashboard/tools/auto-subtitles',
        useCase: 'Accessibility, reach',
        badge: 'Popular'
      }
    ]
  },
  {
    id: 'image',
    name: 'Image Editing',
    description: 'Edit and enhance images',
    icon: '🖼️',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'image-editor',
        name: 'AI Image Studio',
        description: 'Generate, edit, upscale & compress images',
        icon: '🖼️',
        href: '/dashboard/tools/image-editor',
        useCase: 'Complete image editing',
        badge: 'All-in-One'
      },
      {
        id: 'bg-remover',
        name: 'Background Remover',
        description: 'Remove backgrounds in one click',
        icon: '✂️',
        href: '/dashboard/tools/bg-remover',
        useCase: 'Product photos, portraits',
        badge: 'Hot'
      }
    ]
  },
  {
    id: 'thumbnails',
    name: 'Thumbnails & Covers',
    description: 'Create click-worthy thumbnails',
    icon: '🖼️',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        description: 'YouTube thumbnails that get clicks',
        icon: '🎯',
        href: '/dashboard/tools/thumbnail-maker',
        useCase: 'YouTube, videos',
        badge: 'CTR Booster'
      },
      {
        id: 'cover-maker',
        name: 'Cover Image Creator',
        description: 'Social media covers and banners',
        icon: '🖼️',
        href: '/dashboard/tools/cover-image-creator',
        useCase: 'Profiles, pages',
        badge: 'New'
      },
      {
        id: 'podcast-cover',
        name: 'Podcast Cover Maker',
        description: 'Professional podcast artwork',
        icon: '🎧',
        href: '/dashboard/tools/podcast-cover-maker',
        useCase: 'Spotify, Apple Podcasts',
        badge: 'New'
      }
    ]
  },
  {
    id: 'audio',
    name: 'Audio Editing',
    description: 'Edit and enhance audio',
    icon: '🎧',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'audio-editor',
        name: 'Audio Editor',
        description: 'Cut, trim, and edit audio files',
        icon: '🎧',
        href: '/dashboard/tools/audio-editor',
        useCase: 'Podcasts, music',
        badge: ''
      },
      {
        id: 'noise-remover',
        name: 'Noise Remover',
        description: 'AI-powered background noise removal',
        icon: '🔇',
        href: '/dashboard/tools/noise-remover',
        useCase: 'Clean audio',
        badge: 'AI Magic'
      },
      {
        id: 'voice-enhancer',
        name: 'Voice Enhancer',
        description: 'Improve voice clarity and quality',
        icon: '🎙️',
        href: '/dashboard/tools/voice-enhancer',
        useCase: 'Podcasts, voiceovers',
        badge: ''
      }
    ]
  },
  {
    id: 'convert',
    name: 'Format Conversion',
    description: 'Convert between formats',
    icon: '🔄',
    color: 'from-amber-500 to-yellow-500',
    tools: [
      {
        id: 'video-converter',
        name: 'Video Converter',
        description: 'Convert videos to any format',
        icon: '🎬',
        href: '/dashboard/tools/video-converter',
        useCase: 'MP4, MOV, WebM',
        badge: ''
      },
      {
        id: 'audio-converter',
        name: 'Audio Converter',
        description: 'Convert audio files',
        icon: '🎥',
        href: '/dashboard/tools/audio-converter',
        useCase: 'MP3, WAV, AAC',
        badge: ''
      },
      {
        id: 'gif-maker',
        name: 'GIF Maker',
        description: 'Create GIFs from videos',
        icon: '🎞️',
        href: '/dashboard/tools/gif-maker',
        useCase: 'Memes, reactions',
        badge: 'Fun'
      }
    ]
  }
]

export default function MediaEditingPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Edit3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Media Editing Studio</h1>
              <p className="text-white/80">Professional editing tools powered by AI</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Wand2 className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-white/70">Enhanced</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Layers className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Pro</p>
              <p className="text-xs text-white/70">Quality</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Maximize className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">4K</p>
              <p className="text-xs text-white/70">Support</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Film className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Fast</p>
              <p className="text-xs text-white/70">Export</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Formats Banner */}
      <Card className="border-dashed bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Supports:</span>
              <div className="flex gap-2 flex-wrap">
                {['MP4', 'MOV', 'PNG', 'JPG', 'GIF', 'MP3', 'WAV', 'WebM'].map((format) => (
                  <Badge key={format} variant="secondary" className="bg-white dark:bg-slate-900 font-mono text-xs">
                    {format}
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
          {MEDIA_CATEGORIES.map((cat) => (
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
            {MEDIA_CATEGORIES.map((category) => (
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
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {MEDIA_CATEGORIES.map((category) => (
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

      {/* Tips */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/30 dark:to-blue-950/30 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Sparkles className="h-5 w-5" />
            Pro Editing Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Start with Trim</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Remove unwanted parts first</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔊</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Fix Audio First</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Clean audio improves quality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Color Correct</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Consistent look matters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💾</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Export Right</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Choose format for platform</p>
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
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
