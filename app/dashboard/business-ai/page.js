'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Target,
  MessageSquare,
  Calendar,
  Star,
  FileText,
  DollarSign,
  BarChart,
  Mail,
  Users
} from 'lucide-react'

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
        name: 'Marketing Strategy AI',
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
        name: 'SWOT Analysis Generator',
        description: 'Strategic analysis for your business',
        icon: '📊',
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
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business & Marketing</h1>
              <p className="text-white/80">Scale your business with AI-powered tools</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <DollarSign className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">10x</p>
              <p className="text-xs text-white/70">ROI Potential</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <BarChart className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">50%</p>
              <p className="text-xs text-white/70">Time Saved</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Target className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Higher</p>
              <p className="text-xs text-white/70">Conversions</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Users className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Scale</p>
              <p className="text-xs text-white/70">Your Team</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Business Types Banner */}
      <Card className="border-dashed bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Perfect for:</span>
              <div className="flex gap-2 flex-wrap">
                {['Startups', 'E-commerce', 'Agencies', 'Freelancers', 'SaaS', 'Local Business'].map((type) => (
                  <Badge key={type} variant="secondary" className="bg-white dark:bg-indigo-900">
                    {type}
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
          {BUSINESS_CATEGORIES.map((cat) => (
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
            {BUSINESS_CATEGORIES.map((category) => (
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

        {BUSINESS_CATEGORIES.map((category) => (
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
      <Card className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
            <Sparkles className="h-5 w-5" />
            Business Growth Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-indigo-900 dark:text-indigo-100">A/B Test Everything</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">Generate multiple versions and test</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-indigo-900 dark:text-indigo-100">Data-Driven</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">Track metrics and optimize</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-indigo-900 dark:text-indigo-100">Scale Gradually</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">Test small, then scale winners</p>
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
