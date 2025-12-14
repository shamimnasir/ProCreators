'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/ui/Logo'
import { useState } from 'react'
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
  ChevronRight,
  Type,
  FileText,
  Palette,
  Briefcase,
  GamepadIcon,
  Camera,
  PenTool,
  Target,
  Users,
  TrendingUp,
  Lightbulb,
  Calendar,
  ShoppingBag,
  Smile,
  Heart,
  Star,
  Award
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: '🎬 AI Video Studio',
    href: '/dashboard/tools/ai-video-studio',
    icon: Film,
    badge: 'Pro',
    children: []
  },
  {
    name: '🎥 Quick Video Studio',
    href: '/dashboard/tools/quick-reels',
    icon: Video,
    badge: '',
    children: []
  },
  {
    name: '✨ Viral Post Creation',
    href: '/dashboard/viral-posts',
    icon: Sparkles,
    badge: '',
    children: []
  },
  {
    name: '📦 Digital Products',
    href: '/dashboard/digital-products',
    icon: ShoppingBag,
    badge: 'Hot',
    children: []
  },
  {
    name: '🎨 Image Generation',
    href: '/dashboard/image-generation',
    icon: ImageIcon,
    badge: '',
    children: []
  },
  {
    name: '👨‍🎓 Students & Teachers',
    href: '/dashboard/students-teachers',
    icon: GraduationCap,
    badge: 'New',
    children: []
  },
  {
    name: '💼 Jobs & Career',
    href: '/dashboard/jobs-career',
    icon: Briefcase,
    badge: 'New',
    children: []
  },
  {
    name: '🏢 Business with AI',
    href: '/dashboard/business-ai',
    icon: TrendingUp,
    badge: 'New',
    children: []
  },
  {
    name: '🎮 Fun & Recreation',
    href: '/dashboard/fun-recreation',
    icon: GamepadIcon,
    badge: 'New',
    children: []
  },
  {
    name: '🎬 Media Editing',
    href: '/dashboard/media-editing',
    icon: Edit3,
    badge: '',
    children: []
  },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export function MobileSidebar({ onNavigate }) {
  const pathname = usePathname()

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/dashboard" onClick={handleNavClick}>
          <Logo variant="full" className="h-8 w-8" />
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} onClick={handleNavClick}>
              <Button
                variant={pathname === item.href || pathname.startsWith(item.href + '/') ? "secondary" : "ghost"}
                className="w-full justify-start text-sm h-10"
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span className="truncate flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
