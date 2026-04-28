'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Smartphone,
  PenTool,
  FileText,
  MessageSquare,
  ListOrdered,
  Image,
  Sunset,
  Newspaper,
  Video,
  Film,
  Mic,
  Music,
  Scissors,
  Wand2,
  Volume2,
  Subtitles,
  BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Lightbulb,
  Smile,
  TrendingUp,
  Users,
  Target,
  Mail,
  Palette,
  Layout,
  Layers,
  Camera,
  Share2,
  Globe,
  Play,
  Award,
  Gift,
  Coffee,
  Gamepad2,
  Dumbbell,
  Calendar,
  ClipboardList,
  Brain,
  Rocket,
  FileCheck,
  PenLine,
  MessageCircle,
  Send,
  ShoppingBag,
  DollarSign,
  Building2,
  Presentation,
  BarChart3,
  PieChart,
  LineChart,
  Megaphone,
  Search,
  CheckSquare,
  BookMarked,
  FileQuestion,
  Calculator,
  Puzzle,
  Baby,
  Palette as ColorPalette,
  StickyNote,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon mapping from string names to Lucide components
const ICON_MAP = {
  // Social & Content
  'Smartphone': Smartphone,
  'PenTool': PenTool,
  'FileText': FileText,
  'MessageSquare': MessageSquare,
  'ListOrdered': ListOrdered,
  'Image': Image,
  'Sunset': Sunset,
  'Newspaper': Newspaper,
  'Layers': Layers,
  'Share2': Share2,
  
  // Video & Media
  'Video': Video,
  'Film': Film,
  'Mic': Mic,
  'Music': Music,
  'Scissors': Scissors,
  'Camera': Camera,
  'Subtitles': Subtitles,
  'Volume2': Volume2,
  
  // AI & Creative
  'Wand2': Wand2,
  'Wand2': Wand2,
  'Brain': Brain,
  'Rocket': Rocket,
  'Play': Play,
  
  // Business
  'Briefcase': Briefcase,
  'Building2': Building2,
  'Presentation': Presentation,
  'BarChart3': BarChart3,
  'PieChart': PieChart,
  'LineChart': LineChart,
  'Target': Target,
  'DollarSign': DollarSign,
  'Megaphone': Megaphone,
  'ShoppingBag': ShoppingBag,
  
  // Education
  'GraduationCap': GraduationCap,
  'BookOpen': BookOpen,
  'BookMarked': BookMarked,
  'FileQuestion': FileQuestion,
  'Calculator': Calculator,
  'Puzzle': Puzzle,
  'ClipboardList': ClipboardList,
  'CheckSquare': CheckSquare,
  'FileCheck': FileCheck,
  
  // Communication
  'Mail': Mail,
  'Send': Send,
  'MessageCircle': MessageCircle,
  'PenLine': PenLine,
  
  // Lifestyle & Fun
  'Heart': Heart,
  'Star': Star,
  'Lightbulb': Lightbulb,
  'Smile': Smile,
  'TrendingUp': TrendingUp,
  'Users': Users,
  'Award': Award,
  'Gift': Gift,
  'Coffee': Coffee,
  'Gamepad2': Gamepad2,
  'Dumbbell': Dumbbell,
  'Calendar': Calendar,
  'Baby': Baby,
  'StickyNote': StickyNote,
  'Receipt': Receipt,
  
  // Design
  'Palette': Palette,
  'Layout': Layout,
  'Globe': Globe,
  'Search': Search,
  'ColorPalette': ColorPalette
}

// Helper to render icon - supports both Lucide icon names and emojis (for backwards compat)
function ToolIcon({ icon, className = "h-6 w-6" }) {
  // If it's a Lucide icon name (string starting with uppercase letter)
  if (typeof icon === 'string' && ICON_MAP[icon]) {
    const IconComponent = ICON_MAP[icon]
    return <IconComponent className={className} />
  }
  // If icon is already a React element
  if (typeof icon === 'object' && icon !== null) {
    return icon
  }
  // Fallback to displaying as-is (for emojis or other strings)
  return <span className="text-2xl">{icon}</span>
}

// Modern Tool Card with gradient border and hover effects
export function ToolCard({ tool, gradient = 'from-blue-500 to-purple-500', expanded = false }) {
  const gradientClasses = {
    'from-blue-500 to-indigo-500': 'group-hover:shadow-blue-500/20',
    'from-pink-500 to-rose-500': 'group-hover:shadow-pink-500/20',
    'from-orange-500 to-amber-500': 'group-hover:shadow-orange-500/20',
    'from-green-500 to-emerald-500': 'group-hover:shadow-green-500/20',
    'from-purple-500 to-violet-500': 'group-hover:shadow-purple-500/20',
    'from-red-500 to-orange-500': 'group-hover:shadow-red-500/20',
    'from-cyan-500 to-blue-500': 'group-hover:shadow-cyan-500/20',
    'from-yellow-500 to-orange-500': 'group-hover:shadow-yellow-500/20',
    'from-purple-500 to-pink-500': 'group-hover:shadow-purple-500/20',
    'from-rose-500 to-pink-500': 'group-hover:shadow-rose-500/20',
    'from-amber-500 to-yellow-500': 'group-hover:shadow-amber-500/20',
    'from-violet-500 to-purple-500': 'group-hover:shadow-violet-500/20',
  }

  const shadowClass = gradientClasses[gradient] || 'group-hover:shadow-primary/20'

  return (
    <Link href={tool.href} className="block">
      <div className={cn(
        "group relative h-full transition-all duration-300 hover:-translate-y-1",
        "glass-card hover:bg-white/80 hover:shadow-xl hover:shadow-blue-100/50"
      )}>
        <div className="relative h-full overflow-hidden rounded-[16px]">
          <div className="relative p-5">
            {/* Icon Row */}
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                `bg-gradient-to-br ${gradient}`,
                "text-white group-hover:scale-110 transition-transform duration-300",
                "shadow-sm"
              )}>
                <ToolIcon icon={tool.icon} className="h-5 w-5" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className={cn(
              "font-semibold mb-2 group-hover:text-primary transition-colors",
              expanded ? "text-lg" : "text-base"
            )}>
              {tool.name}
            </h3>
            
            {/* Description */}
            <p className={cn(
              "text-muted-foreground mb-4 leading-relaxed",
              expanded ? "text-sm" : "text-xs line-clamp-2"
            )}>
              {tool.description}
            </p>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              {tool.useCase && (
                <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                  {tool.useCase}
                </span>
              )}
              <span className={cn(
                "flex items-center gap-1.5 text-xs font-medium ml-auto",
                "text-muted-foreground group-hover:text-primary transition-colors"
              )}>
                Open
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Featured Tool Card with larger design and more details
export function FeaturedToolCard({ tool }) {
  return (
    <Link href={tool.href} className="block">
      <div className={cn(
        "group relative h-full transition-all duration-300 hover:-translate-y-1",
        "glass-card-elevated hover:bg-white/85 hover:shadow-2xl hover:shadow-purple-100/50"
      )}>
        <div className="relative h-full overflow-hidden rounded-[20px]">
          {/* Gradient accent line */}
          <div className={cn(
            "h-1 w-full",
            `bg-gradient-to-r ${tool.gradient || 'from-purple-500 to-purple-600'}`
          )} />
          
          <div className="p-6">
            {/* Icon Row */}
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                `bg-gradient-to-br ${tool.gradient || 'from-purple-500 to-purple-600'}`,
                "text-white group-hover:scale-110 transition-transform duration-300",
                "shadow-md"
              )}>
                <ToolIcon icon={tool.icon} className="h-6 w-6" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {tool.description}
            </p>
            
            {/* Features */}
            {tool.features && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tool.features.map((feature) => (
                  <span 
                    key={feature} 
                    className="px-2 py-0.5 rounded-md text-[10px] bg-white/50 text-muted-foreground backdrop-blur-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {tool.useCase}
              </span>
              <span className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                "text-muted-foreground group-hover:text-primary transition-colors"
              )}>
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Category Header with icon
export function CategoryHeader({ category }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        `bg-gradient-to-br ${category.color}`,
        "text-white shadow-sm"
      )}>
        <ToolIcon icon={category.icon} className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold">{category.name}</h2>
        <p className="text-xs text-muted-foreground">{category.description}</p>
      </div>
    </div>
  )
}

// Page Hero Header
export function PageHero({ 
  title, 
  subtitle, 
  icon, 
  gradient = 'from-purple-600 via-violet-600 to-indigo-600',
  stats = []
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-8 text-white",
      `bg-gradient-to-r ${gradient}`,
      "shadow-xl"
    )}>
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <p className="text-white/80 text-sm md:text-base">{subtitle}</p>
          </div>
        </div>
        
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <div className="text-lg md:text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Decorations */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
    </div>
  )
}
