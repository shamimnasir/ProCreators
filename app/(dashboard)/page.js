'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Video,
  Zap,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const stats = [
  { name: 'Content Created', value: '0', icon: FileText, color: 'text-blue-500' },
  { name: 'Images Generated', value: '0', icon: ImageIcon, color: 'text-purple-500' },
  { name: 'Videos Created', value: '0', icon: Video, color: 'text-pink-500' },
  { name: 'AI Generations', value: '0', icon: Zap, color: 'text-yellow-500' },
]

const quickActions = [
  { name: 'Create Thread', href: '/dashboard/tools/threads', icon: FileText, description: 'Generate viral thread content' },
  { name: 'Generate Image', href: '/dashboard/tools/carousels', icon: ImageIcon, description: 'Create stunning visuals' },
  { name: 'Make Video', href: '/dashboard/tools/reels', icon: Video, description: 'Produce engaging videos' },
  { name: 'Create Ebook', href: '/dashboard/tools/ebook-maker', icon: FileText, description: 'Build digital products' },
]

export default function DashboardPage() {
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
        {stats.map((stat, index) => (
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
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Start creating to see stats
                </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
