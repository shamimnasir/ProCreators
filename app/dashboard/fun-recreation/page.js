'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gamepad2, Play } from 'lucide-react'
import { ToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const FUN_CATEGORIES = [
  {
    id: 'memes',
    name: 'Memes & Humor',
    description: 'Create viral memes and jokes',
    icon: 'Smile',
    color: 'from-amber-500 to-amber-600',
    tools: [
      {
        id: 'meme-generator',
        name: 'Meme Generator',
        description: 'Create viral memes with AI assistance',
        icon: 'Smile',
        href: '/dashboard/tools/meme-generator',
        useCase: 'Social media, group chats',
      },
      {
        id: 'joke-generator',
        name: 'Joke Generator',
        description: 'Generate jokes on any topic',
        icon: 'Lightbulb',
        href: '/dashboard/tools/joke-generator',
        useCase: 'Ice breakers, entertainment',
      }
    ]
  },
  {
    id: 'avatars',
    name: 'Avatars & Characters',
    description: 'Create unique digital identities',
    icon: 'Users',
    color: 'from-purple-500 to-purple-600',
    tools: [
      {
        id: 'avatar-creator',
        name: 'Avatar Creator',
        description: 'Create unique avatars in any style',
        icon: 'Users',
        href: '/dashboard/tools/avatar-creator',
        useCase: 'Profile pics, gaming',
      }
    ]
  },
  {
    id: 'stories',
    name: 'Stories & Writing',
    description: 'Creative writing and storytelling',
    icon: 'BookOpen',
    color: 'from-blue-500 to-blue-600',
    tools: [
      {
        id: 'story-writer',
        name: 'Story Writer',
        description: 'Generate creative stories and tales',
        icon: 'BookOpen',
        href: '/dashboard/tools/story-writer',
        useCase: 'Entertainment, kids',
      }
    ]
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Express your feelings',
    icon: 'Heart',
    color: 'from-pink-500 to-pink-600',
    tools: [
      {
        id: 'love-letter',
        name: 'Love Letter Generator',
        description: 'Romantic letters for your special someone',
        icon: 'Heart',
        href: '/dashboard/tools/love-letter',
        useCase: "Anniversaries, Valentine's",
      }
    ]
  },
  {
    id: 'fun',
    name: 'Fun & Games',
    description: 'Entertainment and activities',
    icon: 'Gamepad2',
    color: 'from-emerald-500 to-emerald-600',
    tools: [
      {
        id: 'fortune-teller',
        name: 'Fortune Teller',
        description: 'Fun predictions and horoscopes',
        icon: 'Play',
        href: '/dashboard/tools/fortune-teller',
        useCase: 'Entertainment',
      }
    ]
  }
]

export default function FunRecreationPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Fun & Recreation"
        subtitle="Create entertaining content with AI"
        icon={<Gamepad2 className="h-7 w-7" />}
        gradient="from-yellow-500 via-orange-500 to-pink-500"
        stats={[
          { value: 'Fun', label: 'Guaranteed' },
          { value: 'Viral', label: 'Potential' },
          { value: 'Quick', label: 'Creation' },
          { value: 'Share', label: 'Worthy' }
        ]}
      />

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
            All Fun
          </TabsTrigger>
          {FUN_CATEGORIES.map((cat) => (
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
            {FUN_CATEGORIES.map((category) => (
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

        {FUN_CATEGORIES.map((category) => (
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

      {/* Fun Tips */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200/50 dark:border-yellow-800/30">
        <CardContent className="py-6">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4">
            Fun Content Tips
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: '😂', title: 'Be Relatable', desc: 'Content people connect with' },
              { emoji: '🎯', title: 'Know Audience', desc: 'Match humor to your crowd' },
              { emoji: '⏰', title: 'Stay Current', desc: 'Use trending formats' },
              { emoji: '💬', title: 'Encourage Shares', desc: 'Make it share-worthy' }
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">{tip.title}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
