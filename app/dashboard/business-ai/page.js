'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { ToolCard, FeaturedToolCard, CategoryHeader, PageHero } from '@/components/dashboard/ToolCard'

const FEATURED_TOOLS = [
  {
    id: 'ad-copy',
    name: 'Ad Copy Generator',
    description: 'High-converting ad copy for Facebook, Google, TikTok and more',
    icon: '🎯',
    href: '/dashboard/tools/ad-copy',
    useCase: 'Facebook, Google, TikTok',
    badge: 'Best Seller',
    gradient: 'from-red-500 to-orange-500',
    features: ['Multi-Platform', 'A/B Variants', 'Hook Templates']
  },
  {
    id: 'business-plan',
    name: 'Business Plan Generator',
    description: 'Complete business plans ready for investors and banks',
    icon: '💼',
    href: '/dashboard/tools/business-plan',
    useCase: 'Investors, Banks',
    badge: 'Comprehensive',
    gradient: 'from-amber-500 to-yellow-500',
    features: ['Financial Projections', 'Market Analysis', 'PDF Export']
  },
  {
    id: 'email-campaigns',
    name: 'Email Campaigns',
    description: 'Complete email sequences and newsletters that convert',
    icon: '📧',
    href: '/dashboard/tools/email-campaigns',
    useCase: 'Email Marketing',
    badge: 'New',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Sequences', 'Newsletters', 'Templates']
  }
]

const BUSINESS_CATEGORIES = [
  {
    id: 'marketing',
    name: 'Marketing & Ads',
    description: 'Create compelling marketing content',
    icon: '📢',
    color: 'from-red-500 to-orange-500',
    tools: [
      {
        id: 'ad-copy',
        name: 'Ad Copy Generator',
        description: 'High-converting ad copy for any platform',
        icon: '🎯',
        href: '/dashboard/tools/ad-copy',
        useCase: 'Facebook, Google, TikTok ads',
        badge: 'Best Seller'
      },
      {
        id: 'marketing-strategy',
        name: 'Marketing Strategy',
        description: 'Complete marketing plans and strategies',
        icon: '📊',
        href: '/dashboard/tools/marketing-strategy',
        useCase: 'Campaign planning',
        badge: ''
      },
      {
        id: 'landing-page-copy',
        name: 'Landing Page Copy',
        description: 'Persuasive copy that converts visitors',
        icon: '📄',
        href: '/dashboard/tools/landing-page-copy',
        useCase: 'Websites, funnels',
        badge: 'New'
      }
    ]
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Manage your social presence',
    icon: '📱',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'linkedin-posts',
        name: 'Social Media Posts',
        description: 'Engaging posts for all platforms',
        icon: '📝',
        href: '/dashboard/tools/linkedin-posts',
        useCase: 'Daily posts',
        badge: 'Popular'
      },
      {
        id: 'carousels',
        name: 'Carousel Creator',
        description: 'Swipeable carousel posts',
        icon: '🎠',
        href: '/dashboard/tools/carousels',
        useCase: 'Instagram, LinkedIn',
        badge: 'Hot'
      }
    ]
  },
  {
    id: 'email',
    name: 'Email Marketing',
    description: 'Email campaigns that convert',
    icon: '📧',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'email-campaigns',
        name: 'Email Campaign & Newsletter',
        description: 'Complete email sequences and newsletters',
        icon: '📧',
        href: '/dashboard/tools/email-campaigns',
        useCase: 'Email marketing',
        badge: 'New'
      },
      {
        id: 'professional-email',
        name: 'Professional Email Writer',
        description: 'Business emails that get responses',
        icon: '✉️',
        href: '/dashboard/tools/professional-email',
        useCase: 'Business communication',
        badge: ''
      }
    ]
  },
  {
    id: 'planning',
    name: 'Business Planning',
    description: 'Plan and grow your business',
    icon: '💼',
    color: 'from-amber-500 to-yellow-500',
    tools: [
      {
        id: 'business-plan',
        name: 'Business Plan Generator',
        description: 'Complete business plans for funding',
        icon: '💼',
        href: '/dashboard/tools/business-plan',
        useCase: 'Investors, banks',
        badge: 'Comprehensive'
      },
      {
        id: 'pitch-deck',
        name: 'Pitch Deck Creator',
        description: 'Investor-ready pitch presentations',
        icon: '📊',
        href: '/dashboard/tools/pitch-deck',
        useCase: 'Fundraising',
        badge: ''
      },
      {
        id: 'swot-analysis',
        name: 'SWOT Analysis',
        description: 'Strategic business analysis',
        icon: '⚖️',
        href: '/dashboard/tools/swot-analysis',
        useCase: 'Strategy planning',
        badge: ''
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
        emoji="📈"
        stats={[
          { value: '10x', label: 'Faster Copy' },
          { value: 'Pro', label: 'Quality' },
          { value: 'Convert', label: 'Optimized' },
          { value: 'Save', label: 'Hours' }
        ]}
      />

      {/* Featured Tools */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold">Featured Tools</h2>
          <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white">Business</Badge>
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
            🎯 All Tools
          </TabsTrigger>
          {BUSINESS_CATEGORIES.map((cat) => (
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
