'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { ToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const BUSINESS_CATEGORIES = [
  {
    id: 'marketing',
    name: 'Marketing & Ads',
    description: 'Create compelling marketing content',
    icon: 'Megaphone',
    color: 'from-rose-500 to-rose-600',
    tools: [
      {
        id: 'ad-copy',
        name: 'Ad Copy Generator',
        description: 'High-converting ad copy for any platform',
        icon: 'Target',
        href: '/dashboard/tools/ad-copy',
        useCase: 'Facebook, Google, TikTok ads',
      },
      {
        id: 'marketing-strategy',
        name: 'Marketing Strategy',
        description: 'Complete marketing plans and strategies',
        icon: 'BarChart3',
        href: '/dashboard/tools/marketing-strategy',
        useCase: 'Campaign planning',
      },
      {
        id: 'landing-page-copy',
        name: 'Landing Page Copy',
        description: 'Persuasive copy that converts visitors',
        icon: 'Layout',
        href: '/dashboard/tools/landing-page-copy',
        useCase: 'Websites, funnels',
      }
    ]
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Manage your social presence',
    icon: 'Share2',
    color: 'from-blue-500 to-blue-600',
    tools: [
      {
        id: 'linkedin-posts',
        name: 'Social Media Posts',
        description: 'Engaging posts for all platforms',
        icon: 'FileText',
        href: '/dashboard/tools/linkedin-posts',
        useCase: 'Daily posts',
      },
      {
        id: 'carousels',
        name: 'Carousel Creator',
        description: 'Swipeable carousel posts',
        icon: 'Layers',
        href: '/dashboard/tools/carousels',
        useCase: 'Instagram, LinkedIn',
      }
    ]
  },
  {
    id: 'email',
    name: 'Email Marketing',
    description: 'Email campaigns that convert',
    icon: 'Mail',
    color: 'from-purple-500 to-purple-600',
    tools: [
      {
        id: 'email-campaigns',
        name: 'Email Campaign & Newsletter',
        description: 'Complete email sequences and newsletters',
        icon: 'Mail',
        href: '/dashboard/tools/email-campaigns',
        useCase: 'Email marketing',
      },
      {
        id: 'professional-email',
        name: 'Professional Email Writer',
        description: 'Business emails that get responses',
        icon: 'Send',
        href: '/dashboard/tools/professional-email',
        useCase: 'Business communication',
      }
    ]
  },
  {
    id: 'planning',
    name: 'Business Planning',
    description: 'Plan and grow your business',
    icon: 'Briefcase',
    color: 'from-amber-500 to-amber-600',
    tools: [
      {
        id: 'business-plan',
        name: 'Business Plan Generator',
        description: 'Complete business plans for funding',
        icon: 'Briefcase',
        href: '/dashboard/tools/business-plan',
        useCase: 'Investors, banks',
      },
      {
        id: 'pitch-deck',
        name: 'Pitch Deck Creator',
        description: 'Investor-ready pitch presentations',
        icon: 'Presentation',
        href: '/dashboard/tools/pitch-deck',
        useCase: 'Fundraising',
      },
      {
        id: 'swot-analysis',
        name: 'SWOT Analysis',
        description: 'Strategic business analysis',
        icon: 'PieChart',
        href: '/dashboard/tools/swot-analysis',
        useCase: 'Strategy planning',
      }
    ]
  }
]

export default function BusinessAIPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHero
        title="Business & Marketing"
        subtitle="Grow your business with AI-powered tools"
        icon={<TrendingUp className="h-7 w-7" />}
        gradient="from-orange-500 via-red-500 to-pink-600"
        stats={[
          { value: '10x', label: 'Faster Copy' },
          { value: 'Pro', label: 'Quality' },
          { value: 'Convert', label: 'Optimized' },
          { value: 'Save', label: 'Hours' }
        ]}
      />

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
            All Tools
          </TabsTrigger>
          {BUSINESS_CATEGORIES.map((cat) => (
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
            {BUSINESS_CATEGORIES.map((category) => (
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

        {BUSINESS_CATEGORIES.map((category) => (
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
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200/50 dark:border-orange-800/30">
        <CardContent className="py-6">
          <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Growth Tips
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { emoji: '🎯', title: 'Clear CTA', desc: 'Always include a clear call-to-action' },
              { emoji: '📊', title: 'Data-Driven', desc: 'Back claims with statistics' },
              { emoji: '🎨', title: 'Visual Appeal', desc: 'Use professional designs' },
              { emoji: '🔄', title: 'A/B Test', desc: 'Test different versions' }
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">{tip.title}</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
