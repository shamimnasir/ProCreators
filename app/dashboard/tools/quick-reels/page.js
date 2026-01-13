'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Video, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Users,
  Play
} from 'lucide-react'
import { QUICK_REELS_NICHES } from '@/config/quick-reels-niches'

// Define categories for grouping
const NICHE_CATEGORIES = [
  {
    id: 'storytelling',
    name: 'Storytelling',
    icon: '📖',
    description: 'Captivating narratives and tales',
    color: 'from-purple-500 to-pink-500',
    niches: ['mini-stories', 'horror', 'kids-stories', 'transformation']
  },
  {
    id: 'educational',
    name: 'Educational',
    icon: '🧠',
    description: 'Learn and teach with engaging content',
    color: 'from-blue-500 to-cyan-500',
    niches: ['facts-explainer', 'kids-learning', 'documentary']
  },
  {
    id: 'emotional',
    name: 'Emotional & Lifestyle',
    icon: '❤️',
    description: 'Connect with hearts and minds',
    color: 'from-red-500 to-pink-500',
    niches: ['motivational', 'relationship', 'gratitude']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎉',
    description: 'Fun content that entertains',
    color: 'from-yellow-500 to-orange-500',
    niches: ['comedy', 'festival', 'generic']
  },
  {
    id: 'business',
    name: 'Business & Marketing',
    icon: '💼',
    description: 'Promote and grow your brand',
    color: 'from-indigo-500 to-purple-500',
    niches: ['business-promo', 'product-review']
  }
]

export default function QuickVideoStudioPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Get niches for a category
  const getNichesForCategory = (categoryId) => {
    const category = NICHE_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return []
    return category.niches.map(nicheId => QUICK_REELS_NICHES.find(n => n.id === nicheId)).filter(Boolean)
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Video className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Quick Video Studio</h1>
              <p className="text-white/80">AI-Powered Short-Form Video Creation</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Play className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">13 Niches</p>
              <p className="text-xs text-white/70">Content Types</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Clock className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">15s - 10m</p>
              <p className="text-xs text-white/70">Video Length</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Sparkles className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI Scripts</p>
              <p className="text-xs text-white/70">Auto-Generated</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Zap className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">1-Click</p>
              <p className="text-xs text-white/70">Quick Export</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Platform Badges */}
      <Card className="border-dashed bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Perfect for:
              </span>
              <div className="flex gap-2 flex-wrap">
                {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook Reels', 'Snapchat'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-purple-900">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href="/dashboard/tools/story-reels">
              <Button variant="outline" size="sm" className="text-purple-700 border-purple-300">
                <Video className="h-3 w-3 mr-1" />
                Story Video Reels
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🎯 All Videos
          </TabsTrigger>
          {NICHE_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Videos View */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {NICHE_CATEGORIES.map((category) => (
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
                  {getNichesForCategory(category.id).map((niche) => (
                    <NicheCard key={niche.id} niche={niche} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Individual Category Views */}
        {NICHE_CATEGORIES.map((category) => (
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
              {getNichesForCategory(category.id).map((niche) => (
                <NicheCard key={niche.id} niche={niche} categoryColor={category.color} expanded />
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
            Pro Tips for Viral Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">1️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Hook in 3 Seconds</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Grab attention immediately with a bold statement or question</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">2️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Post Consistently</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">3-5 videos per week performs better than sporadic posting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">3️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Trending Audio</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Use trending sounds to boost discoverability</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            More Video Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dashboard/tools/story-reels">
              <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-semibold">Story Video Reels</h3>
                <p className="text-sm text-muted-foreground">Product promotions with AI voiceover</p>
              </div>
            </Link>
            <Link href="/dashboard/tools/long-form">
              <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">🎬</div>
                <h3 className="font-semibold">Long Form Videos</h3>
                <p className="text-sm text-muted-foreground">Extended content up to 10 minutes</p>
              </div>
            </Link>
            <Link href="/dashboard/tools/auto-reels">
              <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold">Auto Reels</h3>
                <p className="text-sm text-muted-foreground">Batch generate multiple videos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Niche Card Component
function NicheCard({ niche, categoryColor, expanded = false }) {
  // Use custom page if defined, otherwise use default quick-reels page
  const href = niche.customPage || `/dashboard/tools/quick-reels/${niche.slug}`
  
  return (
    <Link href={href}>
      <Card className={`group h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 ${niche.cardBg}`}>
        <CardHeader className={expanded ? "pb-2" : "pb-1"}>
          <div className="flex items-start justify-between">
            <div className={`text-3xl mb-2 group-hover:scale-110 transition-transform`}>{niche.icon}</div>
            <div className="flex gap-1">
              {niche.isNew && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px]">
                  ✨ New
                </Badge>
              )}
              <Badge className={`bg-gradient-to-r ${categoryColor} text-white text-[10px]`}>
                AI
              </Badge>
            </div>
          </div>
          <CardTitle className={`group-hover:text-primary transition-colors ${expanded ? "text-lg" : "text-base"}`}>
            {niche.name}
          </CardTitle>
          <CardDescription className={expanded ? "" : "text-xs line-clamp-2"}>
            {niche.tagline}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {expanded && (
            <p className="text-sm text-muted-foreground mb-3">
              {niche.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Create Video <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
