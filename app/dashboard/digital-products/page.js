'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  ExternalLink,
  Zap,
  ArrowRight,
  Star,
  FileText,
  Calendar,
  ClipboardList,
  Palette,
  BookOpen,
  CheckSquare,
  BookMarked,
  UtensilsCrossed,
  FileQuestion,
  Layout,
  Presentation,
  GraduationCap,
  Layers,
  Baby,
  Puzzle,
  Target
} from 'lucide-react'
import { DIGITAL_PRODUCT_CATEGORIES } from '@/config/digital-products'

// Icon component mapping
const ICON_MAP = {
  'FileText': FileText,
  'Calendar': Calendar,
  'ClipboardList': ClipboardList,
  'Palette': Palette,
  'BookOpen': BookOpen,
  'CheckSquare': CheckSquare,
  'BookMarked': BookMarked,
  'UtensilsCrossed': UtensilsCrossed,
  'FileQuestion': FileQuestion,
  'Layout': Layout,
  'Presentation': Presentation,
  'GraduationCap': GraduationCap,
  'Layers': Layers,
  'Baby': Baby,
  'Puzzle': Puzzle,
  'Target': Target
}

// Helper to render icon
function ProductIcon({ iconName, className = "h-5 w-5" }) {
  const IconComponent = ICON_MAP[iconName]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  return <FileText className={className} />
}

export default function DigitalProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Digital Products Creator</h1>
              <p className="text-white/80">Create & Sell AI-Generated Products Online</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <DollarSign className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">$5-$500</p>
              <p className="text-xs text-white/70">Price Range</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <TrendingUp className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">90%+</p>
              <p className="text-xs text-white/70">Profit Margin</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Zap className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI-Powered</p>
              <p className="text-xs text-white/70">Fast Creation</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Star className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">∞ Copies</p>
              <p className="text-xs text-white/70">Sell Unlimited</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Selling Platforms Banner */}
      <Card className="border-dashed bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Sell on:
              </span>
              <div className="flex gap-2 flex-wrap">
                {['Etsy', 'Gumroad', 'Amazon KDP', 'Creative Market', 'Teachable'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-green-900">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-green-700 border-green-300">
              <ExternalLink className="h-3 w-3 mr-1" />
              Selling Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5">
            <Target className="h-4 w-4" /> All Products
          </TabsTrigger>
          {DIGITAL_PRODUCT_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
            >
              <ProductIcon iconName={cat.icon} className="h-4 w-4" /> {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Products View */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {DIGITAL_PRODUCT_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                    <ProductIcon iconName={category.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Individual Category Views */}
        {DIGITAL_PRODUCT_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                <ProductIcon iconName={category.icon} className="h-6 w-6" />
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

      {/* Quick Tips Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Pro Tips for Selling Digital Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">1️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Create Bundles</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Bundle 10-50 items together for higher prices ($20-50)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">2️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Niche Down</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Target specific audiences (busy moms, students, etc.)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">3️⃣</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Seasonal Products</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Create holiday-themed items (New Year planners, etc.)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tool Card Component
function ToolCard({ tool, categoryColor, expanded = false }) {
  return (
    <Link href={tool.href}>
      <Card className="group h-full transition-all border-2 hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-primary/50">
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
          {expanded && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Sell for: {tool.sellPrice}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {tool.platforms?.map((platform) => (
                  <Badge key={platform} variant="outline" className="text-[10px]">
                    {platform}
                  </Badge>
                ))}
              </div>
            </>
          )}
          
          <div className="flex items-center justify-between">
            {!expanded && (
              <span className="text-xs text-green-600 font-medium">{tool.sellPrice}</span>
            )}
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Create Now <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
