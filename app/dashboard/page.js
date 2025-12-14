'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Video,
  Zap,
  ArrowRight,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const quickActions = [
  { name: 'Create Thread', href: '/dashboard/tools/threads', icon: FileText, description: 'Generate viral thread content' },
  { name: 'Generate Image', href: '/dashboard/tools/carousels', icon: ImageIcon, description: 'Create stunning visuals' },
  { name: 'Make Video', href: '/dashboard/tools/ai-video-studio', icon: Video, description: 'Produce engaging videos' },
  { name: 'Create Ebook', href: '/dashboard/digital-products', icon: FileText, description: 'Build digital products' },
]

// Helper to format relative time
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

// Map type to display name
const getTypeName = (type) => {
  const typeMap = {
    'thread': 'Thread',
    'quote': 'Quote',
    'carousel': 'Carousel',
    'photocard': 'Photo Card',
    'video': 'Video',
    'reel': 'Reel',
    'short': 'Short',
    'story-reel': 'Story Reel',
    'news': 'News',
    'list': 'List',
    'tutorial': 'Tutorial',
    'ebook': 'Ebook',
    'planner': 'Planner'
  }
  return typeMap[type] || type
}

// Map category to icon
const getCategoryIcon = (category) => {
  switch (category) {
    case 'video': return Video
    case 'image': return ImageIcon
    default: return FileText
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/stats')
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

    fetchStats()
  }, [])

  const statCards = [
    { name: 'Content Created', value: stats?.totalContent || 0, icon: FileText, color: 'text-blue-500' },
    { name: 'Images Generated', value: stats?.imageContent || 0, icon: ImageIcon, color: 'text-purple-500' },
    { name: 'Videos Created', value: stats?.videoContent || 0, icon: Video, color: 'text-pink-500' },
    { name: 'AI Generations', value: stats?.aiGenerations || 0, icon: Zap, color: 'text-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your content creation overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.value > 0 ? (
                        <><TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />Growing!</>
                      ) : (
                        'Start creating to see stats'
                      )}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <action.icon className="h-8 w-8 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <CardTitle className="mt-4">{action.name}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest content creations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item, index) => {
                const Icon = getCategoryIcon(item.category)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${item.category === 'video' ? 'bg-pink-100 text-pink-600' : item.category === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getTypeName(item.type)}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(item.createdAt)}
                    </div>
                    <Link href="/dashboard/library">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )
              })}
              <div className="pt-4 text-center">
                <Link href="/dashboard/library">
                  <Button variant="outline">
                    View All in Library
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm mt-2">Start creating content to see your activity here</p>
              <Link href="/dashboard/tools/threads">
                <Button className="mt-4">
                  Create Your First Content
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
