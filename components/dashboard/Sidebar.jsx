'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/ui/Logo'
import {
  Wand2,
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
  Play,
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
  Settings2,
  Ticket,
  BookMarked,
  Puzzle,
  Layout,
  Baby,
  FileQuestion
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
    // === CORE FOCUS: Digital Publishing (KDP & Etsy) ===
    // Kept at the top and auto-expanded by default so publishers see it first.
    name: 'Digital Products',
    href: '/dashboard/digital-products',
    icon: ShoppingBag,
    badge: 'CORE',
    highlight: true,
    description: 'For Amazon KDP and Etsy sellers',
    children: [
      { name: 'Ebook Creator', href: '/dashboard/tools/ebook-maker', icon: BookOpen },
      { name: 'Planner Maker', href: '/dashboard/tools/planner-maker', icon: Calendar },
      { name: 'Journal Maker', href: '/dashboard/tools/journal-maker', icon: BookText },
      { name: 'Coloring Book Creator', href: '/dashboard/tools/coloring-book', icon: Palette },
      { name: 'Worksheet Generator', href: '/dashboard/tools/worksheet-maker', icon: FileText },
      { name: 'Checklist Maker', href: '/dashboard/tools/checklist-maker', icon: List },
      { name: 'Recipe Book', href: '/dashboard/tools/recipe-book', icon: BookMarked },
      { name: 'Puzzle Book', href: '/dashboard/tools/puzzle-book', icon: Puzzle },
      { name: 'AI Prompt Pack', href: '/dashboard/tools/ai-prompt-pack', icon: Wand2 },
      { name: 'Spreadsheet Template', href: '/dashboard/tools/spreadsheet-template', icon: Layout },
      { name: 'Wedding Suite', href: '/dashboard/tools/wedding-suite', icon: Heart },
      { name: 'Notion Templates', href: '/dashboard/tools/notion-templates', icon: Presentation },
      { name: "Children's Storybook", href: '/dashboard/tools/storybook-maker', icon: Baby },
      { name: 'Activity Book', href: '/dashboard/tools/activity-book', icon: FileQuestion },
      { name: 'Flashcards / Learning Cards', href: '/dashboard/tools/learning-cards', icon: FlipVertical },
      { name: 'Quiz & Test Creator', href: '/dashboard/tools/quiz-maker', icon: Lightbulb },
      { name: 'Presentation Templates', href: '/dashboard/tools/slides-maker', icon: Presentation },
      { name: 'Amazon Listing Writer', href: '/dashboard/tools/blog-creator?type=amazon-listing', icon: ShoppingBag },
      { name: 'Etsy Listing Writer', href: '/dashboard/tools/blog-creator?type=etsy-listing', icon: ShoppingBag },
      { name: 'KDP Cover Designer', href: '/dashboard/tools/cover-image-creator', icon: ImageIcon },
    ]
  },
  {
    // === MARKETING TOOLS ===
    // Everything else (video, UGC, viral posts, media edit, business, career, students, fun)
    // is grouped here so the sidebar stays focused on the KDP/Etsy publishing core.
    name: 'Marketing Tools',
    icon: Target,
    description: 'Promote your published products',
    children: [
      { name: 'Video Studio', href: '/dashboard/tools/ai-video-studio', icon: Film },
      { name: 'UGC Ad Studio', href: '/dashboard/tools/ugc-studio', icon: Wand2 },
      { name: 'Quick Reels', href: '/dashboard/tools/quick-reels', icon: Play },
      { name: 'Reels Creator', href: '/dashboard/tools/reels', icon: Video },
      { name: 'Blog / SEO Writer', href: '/dashboard/tools/blog-creator', icon: FileText },
      { name: 'Content Humanizer', href: '/dashboard/tools/content-humanizer', icon: Edit3 },
      { name: 'Social Media Posts', href: '/dashboard/tools/linkedin-posts', icon: MessageSquare },
      { name: 'Carousels', href: '/dashboard/tools/carousels', icon: ImageIcon },
      { name: 'Quotes', href: '/dashboard/tools/quotes', icon: Quote },
      { name: 'Photo Cards', href: '/dashboard/tools/photo-cards', icon: CreditCard },
      { name: 'Lists', href: '/dashboard/tools/lists', icon: List },
      { name: 'News Generator', href: '/dashboard/tools/news', icon: Newspaper },
      { name: 'Thumbnail Maker', href: '/dashboard/tools/thumbnail-maker', icon: ImageIcon },
      { name: 'Cover Image Creator', href: '/dashboard/tools/cover-image-creator', icon: ImageIcon },
      { name: 'Podcast Cover Maker', href: '/dashboard/tools/podcast-cover-maker', icon: Mic },
      { name: 'Image Studio', href: '/dashboard/tools/image-editor', icon: Camera },
      { name: 'Audio Editor', href: '/dashboard/tools/audio-editor', icon: Music },
      { name: 'Voice Enhancer', href: '/dashboard/tools/voice-enhancer', icon: Mic },
      { name: 'Noise Remover', href: '/dashboard/tools/noise-remover', icon: Volume2 },
      { name: 'Ad Copy Generator', href: '/dashboard/tools/ad-copy', icon: Target },
      { name: 'Email Campaigns', href: '/dashboard/tools/email-campaigns', icon: MessageSquare },
      { name: 'Business Plan', href: '/dashboard/tools/business-plan', icon: FileText },
      { name: 'Marketing Strategy', href: '/dashboard/tools/marketing-strategy', icon: Target },
      { name: 'Resume Builder', href: '/dashboard/tools/resume-builder', icon: FileText },
      { name: 'Cover Letter', href: '/dashboard/tools/cover-letter', icon: MessageSquare },
      { name: 'Interview Prep', href: '/dashboard/tools/interview-prep', icon: Mic },
      { name: 'Study Notes', href: '/dashboard/tools/study-notes', icon: FileText },
      { name: 'Essay Helper', href: '/dashboard/tools/essay-helper', icon: Edit3 },
      { name: 'Meme Generator', href: '/dashboard/tools/meme-generator', icon: Smile },
      { name: 'AI Avatar Creator', href: '/dashboard/tools/avatar-creator', icon: User },
      { name: 'Story Writer', href: '/dashboard/tools/story-writer', icon: BookOpen },
    ]
  },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  {
    name: 'Admin',
    icon: Settings,
    children: [
      { name: 'Page Manager', href: '/dashboard/admin/page-manager', icon: FileText },
      { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
      { name: 'Coupons & Promos', href: '/dashboard/admin/coupons', icon: Ticket },
      { name: 'Kill Switches', href: '/dashboard/admin/controls', icon: Shield },
      { name: 'Site Settings', href: '/dashboard/admin/site-settings', icon: Settings2 },
      { name: 'Cost Analytics', href: '/dashboard/admin/costs', icon: TrendingUp },
      { name: 'System Prompts (Viral)', href: '/dashboard/admin/system-prompts', icon: Type },
      { name: 'System Prompts (Quick Reels)', href: '/dashboard/admin/prompts', icon: Video },
      { name: 'System Prompts (AI Video)', href: '/dashboard/admin/ai-video-prompts', icon: Film },
      { name: 'Video Themes', href: '/dashboard/admin/video-themes', icon: Palette },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  // Auto-expand the "Digital Products" section by default so publishers land on it.
  const [expandedSections, setExpandedSections] = useState({ 'Digital Products': true })
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
      "relative flex h-screen flex-col glass-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-20 items-center justify-between border-b border-white/30 px-4">
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
                    <div className={cn(
                      "flex items-center gap-1",
                      item.highlight && "rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 ring-1 ring-orange-200/70"
                    )}>
                      <Link href={item.href} className="flex-1">
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            collapsed && "justify-center px-2",
                            item.highlight && "font-semibold text-orange-800 hover:bg-orange-100/60"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", !collapsed && "mr-2", item.highlight && "text-orange-600")} />
                          {!collapsed && (
                            <>
                              <span className="truncate">{item.name}</span>
                              {item.badge && (
                                <span className={cn(
                                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  item.highlight
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                    : "bg-primary text-primary-foreground"
                                )}>
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
                          className="h-7 w-7 shrink-0 rounded-md hover:bg-sidebar-accent"
                          onClick={() => toggleSection(item.name)}
                        >
                          <ChevronRight 
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
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
                              "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
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
