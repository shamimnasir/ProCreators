'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Video,
  Zap,
  ArrowRight,
  Sparkles,
  Calendar,
  Target,
  Trophy,
  Clock,
  Loader2,
  Play,
  BookOpen,
  Palette,
  PenTool,
  Star,
  Crown,
  Layers
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Quick action cards with vibrant colors
const quickActions = [
  { 
    name: 'Create Video', 
    href: '/dashboard/tools/ai-video-studio', 
    icon: Video, 
    description: 'AI-powered video creation',
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
    emoji: '🎬'
  },
  { 
    name: 'Write Content', 
    href: '/dashboard/viral-posts', 
    icon: PenTool, 
    description: 'Viral posts & threads',
    gradient: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    emoji: '✍️'
  },
  { 
    name: 'Design Graphics', 
    href: '/dashboard/tools/carousels', 
    icon: Palette, 
    description: 'Carousels & images',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    emoji: '🎨'
  },
  { 
    name: 'Build Products', 
    href: '/dashboard/digital-products', 
    icon: BookOpen, 
    description: 'Ebooks & planners',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    emoji: '📚'
  },
]

// Popular tools
const popularTools = [
  { name: 'Quick Reels', href: '/dashboard/tools/quick-reels', icon: Zap, color: 'bg-amber-100 dark:bg-amber-900/30' },
  { name: 'Thumbnails', href: '/dashboard/tools/thumbnail-maker', icon: ImageIcon, color: 'bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Blog Writer', href: '/dashboard/tools/blog-creator', icon: FileText, color: 'bg-green-100 dark:bg-green-900/30' },
  { name: 'Ad Copy', href: '/dashboard/tools/ad-copy', icon: Target, color: 'bg-red-100 dark:bg-red-900/30' },
  { name: 'Carousels', href: '/dashboard/tools/carousels', icon: Layers, color: 'bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Story Writer', href: '/dashboard/tools/story-writer', icon: BookOpen, color: 'bg-pink-100 dark:bg-pink-900/30' },
]

// Map category to icon
const getCategoryIcon = (category) => {
  switch (category) {
    case 'video': return Video
    case 'image': return ImageIcon
    default: return FileText
  }
}

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', emoji: '🌅' }
  if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' }
  return { text: 'Good evening', emoji: '🌙' }
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const getUserAndFetchStats = async () => {
      try {
        setLoading(true)
        
        let currentUserId = null
        const sessionToken = localStorage.getItem('sessionToken')
        
        if (sessionToken) {
          const sessionRes = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          const sessionData = await sessionRes.json()
          if (sessionData.success && sessionData.user) {
            currentUserId = sessionData.user.id
            setUserName(sessionData.user.name || sessionData.user.email?.split('@')[0] || 'Creator')
          }
        }
        
        if (!currentUserId) {
          window.location.href = '/login?redirect=/dashboard'
          return
        }
        
        const response = await fetch(`/api/dashboard/stats?userId=${currentUserId}`, {
          headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}
        })
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
          setRecentActivity(data.recentActivity || [])
        } else {
          setError(data.error || 'Failed to fetch stats')
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    getUserAndFetchStats()
  }, [])

  const greeting = getGreeting()
  const totalCreations = (stats?.totalContent || 0) + (stats?.videoContent || 0)
  const weeklyGoal = 10
  const progressPercent = Math.min((totalCreations / weeklyGoal) * 100, 100)

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 md:p-8 text-white"
      >
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm mb-1">{greeting.text} {greeting.emoji}</p>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {loading ? '...' : userName}! ✨
              </h1>
              <p className="text-white/70 mt-2 max-w-md">
                Ready to create something amazing today? Your content journey continues here.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/tools/ai-video-studio">
                <Button className="bg-white text-purple-700 hover:bg-white/90 shadow-lg">
                  <Play className="h-4 w-4 mr-2" />
                  Create Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -mb-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-4 right-8 text-6xl opacity-20">🚀</div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Total Creations', value: stats?.totalContent || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', trend: '+12%' },
          { name: 'Videos Made', value: stats?.videoContent || 0, icon: Video, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30', trend: '+8%' },
          { name: 'Images Created', value: stats?.imageContent || 0, icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', trend: '+15%' },
          { name: 'AI Generations', value: stats?.aiGenerations || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', trend: '+20%' },
        ].map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.value > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-3xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Quick Actions & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                >
                  <Link href={action.href}>
                    <Card className={`group cursor-pointer transition-all hover:shadow-xl border-0 ${action.bgLight}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-lg`}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <span className="text-2xl">{action.emoji}</span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {action.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                        <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Get Started <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </div>
                <Link href="/dashboard/library">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((item, index) => {
                    const Icon = getCategoryIcon(item.category)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${
                          item.category === 'video' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' : 
                          item.category === 'image' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-3">No activity yet</p>
                  <Link href="/dashboard/tools/ai-video-studio">
                    <Button size="sm">Create Your First Content</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Progress & Popular */}
        <div className="space-y-6">
          {/* Weekly Progress */}
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/50 dark:border-violet-800/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-violet-600" />
                <h3 className="font-semibold">Weekly Goal</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{totalCreations}/{weeklyGoal} creations</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {progressPercent >= 100 ? '🎉 Goal achieved!' : `${weeklyGoal - totalCreations} more to reach your goal`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievement */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/50 dark:border-amber-800/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Creator Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalCreations >= 50 ? 'Pro Creator 🌟' : 
                     totalCreations >= 20 ? 'Rising Star ⭐' : 
                     totalCreations >= 5 ? 'Getting Started 🚀' : 'Newcomer 👋'}
                  </p>
                </div>
              </div>
              {totalCreations < 50 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  {50 - totalCreations} more creations to Pro Creator status
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Tools */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Popular Tools</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {popularTools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <div className={`p-3 rounded-xl ${tool.color} hover:scale-105 transition-transform cursor-pointer`}>
                    <span className="text-xl mb-1 block">{tool.icon}</span>
                    <span className="text-xs font-medium">{tool.name}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Pro Upgrade */}
          <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-yellow-300" />
                <span className="font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-sm text-white/80 mb-4">
                Get unlimited AI generations, priority support, and exclusive tools.
              </p>
              <Link href="/pricing">
                <Button className="w-full bg-white text-purple-700 hover:bg-white/90">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
