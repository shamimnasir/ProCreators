'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Smile,
  Star,
  GraduationCap,
  Briefcase,
  Skull,
  Heart,
  Film,
  PartyPopper,
  ShoppingBag,
  RefreshCw,
  Wand2,
  ArrowRight
} from 'lucide-react'

// Icon mapping
const ICON_MAP = {
  'BookOpen': BookOpen,
  'TrendingUp': TrendingUp,
  'Lightbulb': Lightbulb,
  'Smile': Smile,
  'Star': Star,
  'GraduationCap': GraduationCap,
  'Briefcase': Briefcase,
  'Skull': Skull,
  'Heart': Heart,
  'Film': Film,
  'PartyPopper': PartyPopper,
  'ShoppingBag': ShoppingBag,
  'RefreshCw': RefreshCw,
  'Wand2': Wand2,
  'Wand2': Wand2
}

// Category labels
const CATEGORY_LABELS = {
  'storytelling': { name: 'Storytelling', icon: BookOpen },
  'inspiration': { name: 'Inspiration', icon: TrendingUp },
  'educational': { name: 'Educational', icon: GraduationCap },
  'entertainment': { name: 'Entertainment', icon: Smile },
  'kids': { name: 'Kids Content', icon: Star },
  'business': { name: 'Business', icon: Briefcase },
  'creative': { name: 'Creative', icon: Wand2 },
  'custom': { name: 'Custom', icon: Wand2 },
  'other': { name: 'Other', icon: Film }
}

export default function VideoThemeSelector({ onSelectTheme, videoType = 'ai' }) {
  const [themes, setThemes] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const res = await fetch('/api/admin/video-themes')
      const data = await res.json()
      if (data.success) {
        setThemes(data.themes || [])
        setCategories(data.categories || {})
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredThemes = themes.filter(theme => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!theme.name.toLowerCase().includes(query) && 
          !theme.description.toLowerCase().includes(query)) {
        return false
      }
    }
    // Filter by category
    if (selectedCategory && theme.category !== selectedCategory) {
      return false
    }
    return true
  })

  // Group filtered themes by category
  const groupedThemes = filteredThemes.reduce((acc, theme) => {
    const cat = theme.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(theme)
    return acc
  }, {})

  const handleSelectTheme = (theme) => {
    onSelectTheme({
      id: theme.id,
      name: theme.name,
      promptTemplate: theme.promptTemplate,
      isCustom: theme.id === 'custom'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading themes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Video Theme</h2>
        <p className="text-muted-foreground">
          Select a theme to get AI-optimized prompts, or choose Custom to create from scratch
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {Object.entries(CATEGORY_LABELS).filter(([key]) => key !== 'custom' && key !== 'other').map(([key, { name }]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Option - Always show first */}
      <div className="mb-8">
        <Card 
          className="cursor-pointer border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all"
          onClick={() => handleSelectTheme(themes.find(t => t.id === 'custom') || { id: 'custom', name: 'Custom Creation', promptTemplate: '', isCustom: true })}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
                <Wand2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Custom Creation</h3>
                <p className="text-muted-foreground">Create videos on any topic with your own prompt</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Themed Options by Category */}
      {Object.entries(groupedThemes)
        .filter(([cat]) => cat !== 'custom')
        .sort(([a], [b]) => {
          const order = ['storytelling', 'inspiration', 'educational', 'entertainment', 'kids', 'business', 'creative', 'other']
          return order.indexOf(a) - order.indexOf(b)
        })
        .map(([category, categoryThemes]) => {
          const catInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.other
          const CatIcon = catInfo.icon
          
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{catInfo.name}</h3>
                <Badge variant="secondary" className="ml-2">{categoryThemes.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryThemes
                  .filter(t => t.id !== 'custom')
                  .map(theme => {
                    const ThemeIcon = ICON_MAP[theme.icon] || Wand2
                    
                    return (
                      <Card 
                        key={theme.id}
                        className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
                        onClick={() => handleSelectTheme(theme)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${theme.color || 'from-gray-500 to-gray-600'} flex-shrink-0`}>
                              <ThemeIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {theme.name}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {theme.description}
                              </p>
                              {theme.tagline && (
                                <p className="text-xs text-primary/70 mt-1 truncate">
                                  {theme.tagline}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )
        })}

      {/* No results */}
      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No themes found</h3>
          <p className="text-muted-foreground">Try a different search term or category</p>
        </div>
      )}
    </div>
  )
}
