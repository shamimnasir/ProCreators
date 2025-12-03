'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/ui/Logo'
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Quote,
  ImageIcon,
  Newspaper,
  GraduationCap,
  List,
  CreditCard,
  Video,
  Film,
  Zap,
  BookOpen,
  BookText,
  Presentation,
  FlipVertical,
  Edit3,
  VideoIcon,
  Mic,
  User,
  Library,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Viral Tools',
    icon: Sparkles,
    children: [
      { name: 'Threads', href: '/dashboard/tools/threads', icon: MessageSquare },
      { name: 'Quotes', href: '/dashboard/tools/quotes', icon: Quote },
      { name: 'Carousels', href: '/dashboard/tools/carousels', icon: ImageIcon },
      { name: 'News Generator', href: '/dashboard/tools/news', icon: Newspaper },
      { name: 'Tutorials', href: '/dashboard/tools/tutorials', icon: GraduationCap },
      { name: 'Lists', href: '/dashboard/tools/lists', icon: List },
      { name: 'Photo Cards', href: '/dashboard/tools/photo-cards', icon: CreditCard },
    ]
  },
  {
    name: 'Video Tools',
    icon: Video,
    children: [
      { name: 'Reels / Shorts', href: '/dashboard/tools/reels', icon: Film },
      { name: 'Long Form', href: '/dashboard/tools/long-form', icon: VideoIcon },
      { name: 'Auto Reels', href: '/dashboard/tools/auto-reels', icon: Zap },
      { name: 'Auto Long Form', href: '/dashboard/tools/auto-longform', icon: Zap },
    ]
  },
  {
    name: 'Digital Products',
    icon: BookOpen,
    children: [
      { name: 'Ebook Maker', href: '/dashboard/tools/ebook-maker', icon: BookText },
      { name: 'Storybook Maker', href: '/dashboard/tools/storybook-maker', icon: BookOpen },
      { name: 'Slides Maker', href: '/dashboard/tools/slides-maker', icon: Presentation },
      { name: 'Learning Cards', href: '/dashboard/tools/learning-cards', icon: FlipVertical },
    ]
  },
  {
    name: 'Media Editing',
    icon: Edit3,
    children: [
      { name: 'Image Editor', href: '/dashboard/tools/image-editor', icon: ImageIcon },
      { name: 'Video Editor', href: '/dashboard/tools/video-editor', icon: VideoIcon },
      { name: 'Auto Subtitles', href: '/dashboard/tools/auto-subtitles', icon: MessageSquare },
      { name: 'Thumbnail Maker', href: '/dashboard/tools/thumbnail-maker', icon: ImageIcon },
    ]
  },
  {
    name: 'AI Generators',
    icon: Sparkles,
    children: [
      { name: 'Script to Ad', href: '/dashboard/tools/script-to-ad', icon: Film },
    ]
  },
  {
    name: 'Voice Tools',
    icon: Mic,
    children: [
      { name: 'Voice Cloning', href: '/dashboard/tools/voice-clone', icon: Mic },
      { name: 'Talking-Head', href: '/dashboard/tools/talking-head', icon: User },
    ]
  },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  {
    name: 'Admin',
    icon: Settings,
    children: [
      { name: 'System Prompts', href: '/dashboard/admin/system-prompts', icon: Settings },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (name) => {
    setExpandedSections(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  return (
    <div className={cn(
      "relative flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-[#0a0e27] to-[#1a1147] transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <Link href="/dashboard">
            <Logo variant="full" className="h-8 w-8" />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Logo variant="icon" className="h-8 w-8" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      collapsed && "justify-center px-2"
                    )}
                    onClick={() => toggleSection(item.name)}
                  >
                    <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                    {!collapsed && <span>{item.name}</span>}
                  </Button>
                  {!collapsed && expandedSections[item.name] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.name} href={child.href}>
                          <Button
                            variant={pathname === child.href ? "secondary" : "ghost"}
                            className="w-full justify-start text-sm"
                          >
                            <child.icon className="mr-2 h-3 w-3" />
                            <span>{child.name}</span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                    {!collapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
