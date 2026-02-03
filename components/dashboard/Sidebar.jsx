'use client'

import { useState, useEffect } from 'react'
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
  Award,
  Music,
  Volume2,
  Scissors,
  Layers,
  Shield,
  Settings2
} from 'lucide-react'

// Admin emails that can access the admin panel
const ADMIN_EMAILS = [
  'admin@procreators.io',
  'its4shamim@gmail.com',
  // Add more admin emails here
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: '🎬 AI Video Studio',
    href: '/dashboard/tools/ai-video-studio',
    icon: Film,
    children: []
  },
  {
    name: '🎥 Quick Video Studio',
    href: '/dashboard/tools/quick-reels',
    icon: Video,
    children: [
      { name: '📖 Mini Stories', href: '/dashboard/tools/quick-reels/mini-stories', icon: BookOpen },
      { name: '💪 Motivational', href: '/dashboard/tools/quick-reels/motivational', icon: Zap },
      { name: '🧠 Facts & Explainers', href: '/dashboard/tools/quick-reels/facts-explainer', icon: GraduationCap },
      { name: '😂 Comedy & Memes', href: '/dashboard/tools/quick-reels/comedy', icon: Sparkles },
      { name: '🦄 Kids Stories', href: '/dashboard/tools/quick-reels/kids-stories', icon: BookOpen },
      { name: '🎨 Kids Learning', href: '/dashboard/tools/quick-reels/kids-learning', icon: GraduationCap },
      { name: '💼 Business Promos', href: '/dashboard/tools/quick-reels/business-promo', icon: CreditCard },
      { name: '👻 Horror Stories', href: '/dashboard/tools/quick-reels/horror', icon: Video },
      { name: '❤️ Relationship Advice', href: '/dashboard/tools/quick-reels/relationship', icon: MessageSquare },
      { name: '🎬 Documentary Style', href: '/dashboard/tools/quick-reels/documentary', icon: Film },
      { name: '🎉 Festival Themed', href: '/dashboard/tools/quick-reels/festival', icon: Sparkles },
      { name: '✨ Custom Creation', href: '/dashboard/tools/quick-reels/generic', icon: Edit3 },
      { name: 'Story Video Reels', href: '/dashboard/tools/story-reels', icon: Sparkles },
      { name: 'Quick Video Generator', href: '/dashboard/tools/reels', icon: Film },
      { name: 'Long Form', href: '/dashboard/tools/long-form', icon: VideoIcon },
      { name: 'Auto Reels', href: '/dashboard/tools/auto-reels', icon: Zap },
      { name: 'Auto Long Form', href: '/dashboard/tools/auto-longform', icon: Zap },
    ]
  },
  {
    name: '🚀 Viral Post Creation',
    href: '/dashboard/viral-posts',
    icon: Sparkles,
    children: [
      { name: '✨ Content Humanizer', href: '/dashboard/tools/content-humanizer', icon: Edit3 },
      { name: '🧵 Threads', href: '/dashboard/tools/threads', icon: MessageSquare },
      { name: '💬 Quotes', href: '/dashboard/tools/quotes', icon: Quote },
      { name: '🎠 Carousels', href: '/dashboard/tools/carousels', icon: ImageIcon },
      { name: '📰 News Generator', href: '/dashboard/tools/news', icon: Newspaper },
      { name: '📚 Tutorials', href: '/dashboard/tools/tutorials', icon: GraduationCap },
      { name: '📋 Lists', href: '/dashboard/tools/lists', icon: List },
      { name: '🖼️ Photo Cards', href: '/dashboard/tools/photo-cards', icon: CreditCard },
    ]
  },
  {
    name: '💰 Digital Products',
    href: '/dashboard/digital-products',
    icon: ShoppingBag,
    children: [
      { name: '📅 Planner Maker', href: '/dashboard/tools/planner-maker', icon: Calendar },
      { name: '📝 Worksheet Generator', href: '/dashboard/tools/worksheet-maker', icon: FileText },
      { name: '🎨 Coloring Book Creator', href: '/dashboard/tools/coloring-book', icon: Palette },
      { name: '📓 Journal Maker', href: '/dashboard/tools/journal-maker', icon: BookText },
      { name: '✅ Checklist Maker', href: '/dashboard/tools/checklist-maker', icon: List },
      { name: '📚 Ebook Creator', href: '/dashboard/tools/ebook-maker', icon: BookOpen },
      { name: '📊 Notion Templates', href: '/dashboard/tools/notion-templates', icon: Presentation },
      { name: '📱 Social Templates', href: '/dashboard/tools/social-templates', icon: ImageIcon },
      { name: '📕 Storybook Maker', href: '/dashboard/tools/storybook-maker', icon: BookOpen },
      { name: '🎓 Learning Cards', href: '/dashboard/tools/learning-cards', icon: FlipVertical },
      { name: '📊 Slides Maker', href: '/dashboard/tools/slides-maker', icon: Presentation },
    ]
  },
  {
    name: '🎬 Media Editor',
    href: '/dashboard/media-editing',
    icon: Edit3,
    children: [
      { name: '✨ AI Image Studio', href: '/dashboard/tools/image-editor', icon: Camera },
      { name: '🎬 Video Editor', href: '/dashboard/tools/video-editor', icon: VideoIcon },
      { name: '📝 Auto Subtitles', href: '/dashboard/tools/auto-subtitles', icon: MessageSquare },
      { name: '🖼️ Thumbnail Maker', href: '/dashboard/tools/thumbnail-maker', icon: ImageIcon },
      { name: '🖼️ Cover Image Creator', href: '/dashboard/tools/cover-image-creator', icon: ImageIcon },
      { name: '🎧 Podcast Cover Maker', href: '/dashboard/tools/podcast-cover-maker', icon: Mic },
      { name: '🎵 Audio Editor', href: '/dashboard/tools/audio-editor', icon: Music },
      { name: '🔇 Noise Remover', href: '/dashboard/tools/noise-remover', icon: Volume2 },
      { name: '🎤 Voice Enhancer', href: '/dashboard/tools/voice-enhancer', icon: Mic },
    ]
  },
  {
    name: '👨‍🎓 Students & Teachers',
    href: '/dashboard/students-teachers',
    icon: GraduationCap,
    children: [
      { name: '📊 Presentation Maker', href: '/dashboard/tools/slides-maker', icon: Presentation },
      { name: '❓ Quiz Generator', href: '/dashboard/tools/quiz-maker', icon: Lightbulb },
      { name: '🎴 Flashcard Creator', href: '/dashboard/tools/learning-cards', icon: FlipVertical },
      { name: '📝 Study Notes Generator', href: '/dashboard/tools/study-notes', icon: FileText },
      { name: '📖 Research Summarizer', href: '/dashboard/tools/research-summarizer', icon: BookOpen },
      { name: '✍️ Essay Helper', href: '/dashboard/tools/essay-helper', icon: Edit3 },
    ]
  },
  {
    name: '💼 Jobs & Career',
    href: '/dashboard/jobs-career',
    icon: Briefcase,
    children: [
      { name: '📄 Resume Builder', href: '/dashboard/tools/resume-builder', icon: FileText },
      { name: '✉️ Cover Letter Generator', href: '/dashboard/tools/cover-letter', icon: MessageSquare },
      { name: '💼 LinkedIn Post Writer', href: '/dashboard/tools/linkedin-posts', icon: Users },
      { name: '🎤 Interview Prep Coach', href: '/dashboard/tools/interview-prep', icon: Mic },
      { name: '📧 Professional Email Writer', href: '/dashboard/tools/email-writer', icon: MessageSquare },
    ]
  },
  {
    name: '🏢 Business & Marketing',
    href: '/dashboard/business-ai',
    icon: TrendingUp,
    children: [
      { name: '📢 Ad Copy Generator', href: '/dashboard/tools/ad-copy', icon: Target },
      { name: '📅 Social Media Calendar', href: '/dashboard/tools/social-calendar', icon: Calendar },
      { name: '📧 Email Campaign Writer', href: '/dashboard/tools/email-campaigns', icon: MessageSquare },
      { name: '⭐ Review Responder', href: '/dashboard/tools/review-responder', icon: Star },
      { name: '📋 Business Plan Generator', href: '/dashboard/tools/business-plan', icon: FileText },
      { name: '🎯 Marketing Strategy', href: '/dashboard/tools/marketing-strategy', icon: Target },
    ]
  },
  {
    name: '🎮 Fun & Recreation',
    href: '/dashboard/fun-recreation',
    icon: GamepadIcon,
    children: [
      { name: '😂 Meme Generator', href: '/dashboard/tools/meme-generator', icon: Smile },
      { name: '🎭 AI Avatar Creator', href: '/dashboard/tools/avatar-creator', icon: User },
      { name: '📖 Story Writer', href: '/dashboard/tools/story-writer', icon: BookOpen },
      { name: '😄 Joke Generator', href: '/dashboard/tools/joke-generator', icon: Smile },
      { name: '🔮 Fortune Teller', href: '/dashboard/tools/fortune-teller', icon: Sparkles },
      { name: '💕 Love Letter Generator', href: '/dashboard/tools/love-letter', icon: Heart },
    ]
  },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  {
    name: 'Admin',
    icon: Settings,
    children: [
      { name: '📄 Page Manager', href: '/dashboard/admin/pages', icon: FileText },
      { name: '👥 User Management', href: '/dashboard/admin/users', icon: Users },
      { name: '🔒 Kill Switches', href: '/dashboard/admin/controls', icon: Shield },
      { name: '⚙️ Site Settings', href: '/dashboard/admin/site-settings', icon: Settings2 },
      { name: '📄 Policy Pages', href: '/dashboard/admin/policy-pages', icon: FileText },
      { name: '💰 Cost Analytics', href: '/dashboard/admin/costs', icon: TrendingUp },
      { name: '📝 System Prompts (Viral)', href: '/dashboard/admin/system-prompts', icon: Type },
      { name: '🎬 System Prompts (Quick Reels)', href: '/dashboard/admin/prompts', icon: Video },
      { name: '🎥 System Prompts (AI Video)', href: '/dashboard/admin/ai-video-prompts', icon: Film },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // First check localStorage for session
        const sessionToken = localStorage.getItem('sessionToken')
        if (sessionToken) {
          const res = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          const data = await res.json()
          if (data.success && data.user) {
            setUserEmail(data.user.email)
            // Check if user email is in admin list OR has admin role
            setIsAdmin(
              ADMIN_EMAILS.includes(data.user.email?.toLowerCase()) || 
              data.user.role === 'admin' ||
              data.user.isAdmin === true
            )
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }
    checkAdminStatus()
  }, [])

  // Filter navigation to hide Admin section for non-admin users
  const filteredNavigation = navigation.filter(item => {
    if (item.name === 'Admin') {
      return isAdmin
    }
    return true
  })

  const toggleSection = (name) => {
    setExpandedSections(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  return (
    <div className={cn(
      "relative flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-20 items-center justify-between border-b border-border px-4">
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
          {filteredNavigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  {/* Section with children - can also have an href for the section itself */}
                  {item.href ? (
                    // Section has both href and children - split functionality
                    <div className="flex items-center gap-1">
                      <Link href={item.href} className="flex-1">
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                          {!collapsed && (
                            <>
                              <span className="truncate">{item.name}</span>
                              {item.badge && (
                                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Button>
                      </Link>
                      {!collapsed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleSection(item.name)}
                        >
                          <ChevronRight 
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedSections[item.name] && "rotate-90"
                            )} 
                          />
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Section only has children, no direct link
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        collapsed && "justify-center px-2"
                      )}
                      onClick={() => toggleSection(item.name)}
                    >
                      <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight 
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              expandedSections[item.name] && "rotate-90"
                            )} 
                          />
                        </>
                      )}
                    </Button>
                  )}
                  {!collapsed && expandedSections[item.name] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.name} href={child.href}>
                          <Button
                            variant={pathname === child.href ? "secondary" : "ghost"}
                            className="w-full justify-start text-sm"
                          >
                            <child.icon className="mr-2 h-3 w-3" />
                            <span className="truncate">{child.name}</span>
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
