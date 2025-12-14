'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gamepad2, 
  Sparkles,
  ArrowRight,
  Smile,
  Heart,
  Music,
  Wand2,
  Star,
  Laugh,
  PartyPopper
} from 'lucide-react'

const FUN_CATEGORIES = [
  {
    id: 'memes',
    name: 'Memes & Humor',
    description: 'Create viral memes and jokes',
    icon: '😂',
    color: 'from-yellow-500 to-orange-500',
    tools: [
      {
        id: 'meme-generator',
        name: 'AI Meme Generator',
        description: 'Create viral memes with AI assistance',
        icon: '😂',
        href: '/dashboard/tools/meme-generator',
        useCase: 'Social media, group chats',
        badge: 'Viral'
      },
      {
        id: 'joke-generator',
        name: 'Joke Generator',
        description: 'Generate jokes on any topic',
        icon: '🤣',
        href: '/dashboard/tools/joke-generator',
        useCase: 'Ice breakers, entertainment',
        badge: ''
      },
      {
        id: 'roast-generator',
        name: 'Roast Generator',
        description: 'Friendly roasts and comebacks',
        icon: '🔥',
        href: '/dashboard/tools/roast-generator',
        useCase: 'Fun with friends',
        badge: 'Spicy'
      }
    ]
  },
  {
    id: 'avatars',
    name: 'Avatars & Characters',
    description: 'Create unique digital identities',
    icon: '🎭',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'avatar-creator',
        name: 'AI Avatar Creator',
        description: 'Create unique avatars in any style',
        icon: '🎭',
        href: '/dashboard/tools/avatar-creator',
        useCase: 'Profile pics, gaming',
        badge: 'Popular'
      },
      {
        id: 'character-creator',
        name: 'Character Generator',
        description: 'Design original characters',
        icon: '🧙',
        href: '/dashboard/tools/character-creator',
        useCase: 'Stories, games, art',
        badge: ''
      },
      {
        id: 'pet-avatar',
        name: 'Pet Portrait AI',
        description: 'Turn pet photos into art',
        icon: '🐶',
        href: '/dashboard/tools/pet-avatar',
        useCase: 'Pet lovers',
        badge: 'Cute'
      }
    ]
  },
  {
    id: 'stories',
    name: 'Stories & Writing',
    description: 'Creative writing and storytelling',
    icon: '📖',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'story-writer',
        name: 'AI Story Writer',
        description: 'Generate creative stories and tales',
        icon: '📖',
        href: '/dashboard/tools/story-writer',
        useCase: 'Entertainment, kids',
        badge: 'Creative'
      },
      {
        id: 'poem-generator',
        name: 'Poem Generator',
        description: 'Write poems for any occasion',
        icon: '🌹',
        href: '/dashboard/tools/poem-generator',
        useCase: 'Special occasions',
        badge: ''
      },
      {
        id: 'song-lyrics',
        name: 'Song Lyrics Writer',
        description: 'Generate lyrics for your music',
        icon: '🎵',
        href: '/dashboard/tools/song-lyrics',
        useCase: 'Musicians, karaoke',
        badge: ''
      }
    ]
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Express your feelings',
    icon: '💕',
    color: 'from-pink-500 to-rose-500',
    tools: [
      {
        id: 'love-letter',
        name: 'Love Letter Generator',
        description: 'Romantic letters for your special someone',
        icon: '💌',
        href: '/dashboard/tools/love-letter',
        useCase: 'Anniversaries, Valentine\'s',
        badge: 'Romantic'
      },
      {
        id: 'pickup-lines',
        name: 'Pickup Line Generator',
        description: 'Creative and funny pickup lines',
        icon: '😉',
        href: '/dashboard/tools/pickup-lines',
        useCase: 'Dating, fun',
        badge: 'Smooth'
      },
      {
        id: 'apology-letter',
        name: 'Apology Message Generator',
        description: 'Sincere apologies that work',
        icon: '🙏',
        href: '/dashboard/tools/apology-letter',
        useCase: 'Making amends',
        badge: ''
      }
    ]
  },
  {
    id: 'fun',
    name: 'Fun & Games',
    description: 'Entertainment and activities',
    icon: '🎮',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'fortune-teller',
        name: 'AI Fortune Teller',
        description: 'Fun predictions and horoscopes',
        icon: '🔮',
        href: '/dashboard/tools/fortune-teller',
        useCase: 'Entertainment',
        badge: 'Mystical'
      },
      {
        id: 'trivia-generator',
        name: 'Trivia Question Generator',
        description: 'Create trivia games on any topic',
        icon: '❓',
        href: '/dashboard/tools/trivia-generator',
        useCase: 'Game nights, parties',
        badge: ''
      },
      {
        id: 'would-you-rather',
        name: 'Would You Rather Generator',
        description: 'Fun dilemma questions',
        icon: '🤔',
        href: '/dashboard/tools/would-you-rather',
        useCase: 'Parties, ice breakers',
        badge: 'Party'
      }
    ]
  }
]

export default function FunRecreationPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Fun & Recreation</h1>
              <p className="text-white/80">Create, laugh, and have fun with AI</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Laugh className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">LOL</p>
              <p className="text-xs text-white/70">Guaranteed Fun</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Wand2 className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Magic</p>
              <p className="text-xs text-white/70">AI-Powered</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Heart className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Share</p>
              <p className="text-xs text-white/70">With Friends</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <PartyPopper className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Party</p>
              <p className="text-xs text-white/70">Ready</p>
            </div>
          </div>
        </div>
        
        {/* Fun decorations */}
        <div className="absolute top-4 right-4 text-4xl animate-bounce">🎉</div>
        <div className="absolute bottom-4 right-12 text-3xl animate-pulse">✨</div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Mood Banner */}
      <Card className="border-dashed bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">Perfect for:</span>
              <div className="flex gap-2 flex-wrap">
                {['Bored?', 'Party Time', 'Friends', 'Social Media', 'Just Vibes', 'Creative Mode'].map((mood) => (
                  <Badge key={mood} variant="secondary" className="bg-white dark:bg-pink-900">
                    {mood}
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
            🎉 All Fun Stuff
          </TabsTrigger>
          {FUN_CATEGORIES.map((cat) => (
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
            {FUN_CATEGORIES.map((category) => (
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

        {FUN_CATEGORIES.map((category) => (
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

      {/* Fun Tips */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Sparkles className="h-5 w-5" />
            How to Have More Fun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Share Everything</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">The best memes are shared memes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎲</span>
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Try Random Prompts</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Unexpected results are the funniest</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">👯</span>
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Bring Friends</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Fun is better together!</p>
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
              Play <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
