'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { MobileSidebar } from './MobileSidebar'
import { CreditBalance } from '@/components/CreditBalance'

// All searchable tools with their paths and keywords
const allTools = [
  { name: 'Dashboard', href: '/dashboard', keywords: ['home', 'main', 'overview'] },
  { name: 'AI Video Studio', href: '/dashboard/tools/ai-video-studio', keywords: ['video', 'ai', 'create', 'generate', 'movie', 'clip'] },
  { name: 'Social Media Posts', href: '/dashboard/tools/linkedin-posts', keywords: ['linkedin', 'social', 'post', 'twitter', 'facebook'] },
  { name: 'Content Humanizer', href: '/dashboard/tools/content-humanizer', keywords: ['humanize', 'ai detector', 'rewrite', 'human'] },
  { name: 'Blog Creator', href: '/dashboard/tools/blog-creator', keywords: ['blog', 'article', 'write', 'content', 'seo'] },
  { name: 'Quotes Generator', href: '/dashboard/tools/quotes', keywords: ['quote', 'inspiration', 'motivational'] },
  { name: 'Carousels', href: '/dashboard/tools/carousels', keywords: ['carousel', 'instagram', 'slides', 'swipe'] },
  { name: 'Lists Generator', href: '/dashboard/tools/lists', keywords: ['list', 'top 10', 'ranking', 'bullet'] },
  { name: 'Photo Cards', href: '/dashboard/tools/photo-cards', keywords: ['photo', 'card', 'news', 'viral', 'image'] },
  { name: 'News Generator', href: '/dashboard/tools/news', keywords: ['news', 'article', 'headline', 'breaking'] },
  { name: 'Planner Maker', href: '/dashboard/tools/planner-maker', keywords: ['planner', 'schedule', 'organize', 'calendar'] },
  { name: 'Worksheet Generator', href: '/dashboard/tools/worksheet-maker', keywords: ['worksheet', 'exercise', 'practice', 'printable'] },
  { name: 'Coloring Book Creator', href: '/dashboard/tools/coloring-book', keywords: ['coloring', 'book', 'kids', 'art', 'drawing'] },
  { name: 'Journal Maker', href: '/dashboard/tools/journal-maker', keywords: ['journal', 'diary', 'writing', 'daily'] },
  { name: 'Checklist Maker', href: '/dashboard/tools/checklist-maker', keywords: ['checklist', 'todo', 'tasks', 'list'] },
  { name: 'Ebook Creator', href: '/dashboard/tools/ebook-maker', keywords: ['ebook', 'book', 'publish', 'kindle', 'pdf'] },
  { name: 'Notion Templates', href: '/dashboard/tools/notion-templates', keywords: ['notion', 'template', 'productivity'] },
  { name: 'Storybook Maker', href: '/dashboard/tools/storybook-maker', keywords: ['story', 'book', 'children', 'kids', 'tale'] },
  { name: 'Learning Cards', href: '/dashboard/tools/learning-cards', keywords: ['flashcard', 'learn', 'study', 'memory', 'cards'] },
  { name: 'Slides Maker', href: '/dashboard/tools/slides-maker', keywords: ['slides', 'presentation', 'powerpoint', 'pitch', 'deck'] },
  { name: 'Image Studio', href: '/dashboard/tools/image-editor', keywords: ['image', 'edit', 'photo', 'picture', 'graphics'] },
  { name: 'Thumbnail Maker', href: '/dashboard/tools/thumbnail-maker', keywords: ['thumbnail', 'youtube', 'video', 'cover'] },
  { name: 'Cover Image Creator', href: '/dashboard/tools/cover-image-creator', keywords: ['cover', 'image', 'banner', 'header'] },
  { name: 'Podcast Cover Maker', href: '/dashboard/tools/podcast-cover-maker', keywords: ['podcast', 'cover', 'audio', 'show'] },
  { name: 'Audio Editor', href: '/dashboard/tools/audio-editor', keywords: ['audio', 'edit', 'sound', 'music', 'mp3'] },
  { name: 'Noise Remover', href: '/dashboard/tools/noise-remover', keywords: ['noise', 'remove', 'clean', 'audio', 'background'] },
  { name: 'Voice Enhancer', href: '/dashboard/tools/voice-enhancer', keywords: ['voice', 'enhance', 'audio', 'quality', 'improve'] },
  { name: 'Auto Subtitles', href: '/dashboard/tools/auto-subtitles', keywords: ['subtitle', 'caption', 'video', 'transcribe'] },
  { name: 'Quiz Generator', href: '/dashboard/tools/quiz-maker', keywords: ['quiz', 'test', 'exam', 'question', 'trivia'] },
  { name: 'Study Notes Generator', href: '/dashboard/tools/study-notes', keywords: ['study', 'notes', 'summary', 'learn'] },
  { name: 'Essay Helper', href: '/dashboard/tools/essay-helper', keywords: ['essay', 'write', 'academic', 'paper', 'thesis'] },
  { name: 'Resume Builder', href: '/dashboard/tools/resume-builder', keywords: ['resume', 'cv', 'job', 'career', 'work'] },
  { name: 'Cover Letter Generator', href: '/dashboard/tools/cover-letter', keywords: ['cover letter', 'job', 'application', 'hire'] },
  { name: 'Interview Prep Coach', href: '/dashboard/tools/interview-prep', keywords: ['interview', 'job', 'prepare', 'practice', 'questions'] },
  { name: 'Professional Email Writer', href: '/dashboard/tools/professional-email', keywords: ['email', 'professional', 'business', 'write'] },
  { name: 'Ad Copy Generator', href: '/dashboard/tools/ad-copy', keywords: ['ad', 'copy', 'advertising', 'marketing', 'sales'] },
  { name: 'Email Campaign Writer', href: '/dashboard/tools/email-campaigns', keywords: ['email', 'campaign', 'marketing', 'newsletter'] },
  { name: 'Business Plan Generator', href: '/dashboard/tools/business-plan', keywords: ['business', 'plan', 'startup', 'strategy', 'investor'] },
  { name: 'Marketing Strategy', href: '/dashboard/tools/marketing-strategy', keywords: ['marketing', 'strategy', 'plan', 'growth'] },
  { name: 'Pitch Deck Creator', href: '/dashboard/tools/pitch-deck', keywords: ['pitch', 'deck', 'investor', 'startup', 'presentation'] },
  { name: 'Landing Page Copy', href: '/dashboard/tools/landing-page-copy', keywords: ['landing', 'page', 'copy', 'website', 'conversion'] },
  { name: 'SWOT Analysis', href: '/dashboard/tools/swot-analysis', keywords: ['swot', 'analysis', 'business', 'strategy'] },
  { name: 'Meme Generator', href: '/dashboard/tools/meme-generator', keywords: ['meme', 'funny', 'joke', 'viral', 'humor'] },
  { name: 'AI Avatar Creator', href: '/dashboard/tools/avatar-creator', keywords: ['avatar', 'profile', 'picture', 'ai', 'character'] },
  { name: 'Story Writer', href: '/dashboard/tools/story-writer', keywords: ['story', 'write', 'fiction', 'creative', 'narrative'] },
  { name: 'Joke Generator', href: '/dashboard/tools/joke-generator', keywords: ['joke', 'funny', 'humor', 'comedy', 'laugh'] },
  { name: 'Fortune Teller', href: '/dashboard/tools/fortune-teller', keywords: ['fortune', 'predict', 'future', 'horoscope', 'astrology'] },
  { name: 'Love Letter Generator', href: '/dashboard/tools/love-letter', keywords: ['love', 'letter', 'romantic', 'valentine', 'heart'] },
  { name: 'YouTube Creator', href: '/dashboard/tools/youtube-creator', keywords: ['youtube', 'video', 'script', 'content', 'channel'] },
  { name: 'Activity Book', href: '/dashboard/tools/activity-book', keywords: ['activity', 'book', 'kids', 'games', 'puzzles'] },
  { name: 'Grammar Checker', href: '/dashboard/tools/grammar-checker', keywords: ['grammar', 'spell', 'check', 'writing', 'proofread'] },
  { name: 'AI Humanizer', href: '/dashboard/tools/ai-humanizer', keywords: ['humanize', 'ai', 'detector', 'bypass', 'rewrite'] },
  { name: 'Citation Generator', href: '/dashboard/tools/citation-generator', keywords: ['citation', 'reference', 'bibliography', 'apa', 'mla'] },
  { name: 'Exam Prep', href: '/dashboard/tools/exam-prep', keywords: ['exam', 'test', 'prepare', 'study', 'practice'] },
  { name: 'Lesson Planner', href: '/dashboard/tools/lesson-planner', keywords: ['lesson', 'plan', 'teacher', 'class', 'curriculum'] },
  { name: 'Job Matcher', href: '/dashboard/tools/job-matcher', keywords: ['job', 'match', 'career', 'skills', 'employment'] },
  { name: 'Salary Negotiator', href: '/dashboard/tools/salary-negotiator', keywords: ['salary', 'negotiate', 'raise', 'compensation', 'pay'] },
  { name: 'Networking Message', href: '/dashboard/tools/networking-message', keywords: ['network', 'message', 'connect', 'linkedin', 'outreach'] },
  { name: 'Reels Creator', href: '/dashboard/tools/reels', keywords: ['reels', 'short', 'video', 'tiktok', 'instagram'] },
  { name: 'Story Reels', href: '/dashboard/tools/story-reels', keywords: ['story', 'reels', 'video', 'narrative', 'short'] },
  { name: 'Quick Reels', href: '/dashboard/tools/quick-reels', keywords: ['quick', 'reels', 'fast', 'video', 'short'] },
  { name: 'Auto Reels', href: '/dashboard/tools/auto-reels', keywords: ['auto', 'reels', 'automatic', 'video', 'generate'] },
  { name: 'Long Form Video', href: '/dashboard/tools/long-form', keywords: ['long', 'form', 'video', 'documentary', 'extended'] },
  { name: 'Library', href: '/dashboard/library', keywords: ['library', 'saved', 'history', 'content', 'files'] },
  { name: 'Profile', href: '/dashboard/profile', keywords: ['profile', 'account', 'settings', 'user', 'personal'] },
  { name: 'Billing', href: '/dashboard/billing', keywords: ['billing', 'credits', 'payment', 'subscription', 'plan'] },
]

export function TopBar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  // Filter tools based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase()
      const filtered = allTools.filter(tool => {
        const nameMatch = tool.name.toLowerCase().includes(query)
        const keywordMatch = tool.keywords.some(kw => kw.includes(query))
        return nameMatch || keywordMatch
      }).slice(0, 8) // Limit to 8 results
      setSearchResults(filtered)
      setShowResults(true)
      setSelectedIndex(-1)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        navigateToTool(searchResults[selectedIndex].href)
      } else if (searchResults.length > 0) {
        navigateToTool(searchResults[0].href)
      }
    } else if (e.key === 'Escape') {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const navigateToTool = (href) => {
    router.push(href)
    setSearchQuery('')
    setShowResults(false)
    inputRef.current?.blur()
  }

  return (
    <div className="flex h-16 md:h-20 items-center gap-2 md:gap-4 glass-surface px-3 md:px-6">
      {/* Mobile Menu Button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <MobileSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1" ref={searchRef}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            placeholder="Search tools..."
            className="pl-10 bg-muted/50 border-border text-sm h-9 md:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowResults(true)}
            onKeyDown={handleKeyDown}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden">
              {searchResults.map((tool, index) => (
                <button
                  key={tool.href}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    index === selectedIndex ? 'bg-muted/70' : ''
                  }`}
                  onClick={() => navigateToTool(tool.href)}
                >
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{tool.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {showResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4">
              <p className="text-sm text-muted-foreground text-center">No tools found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Credit Balance - hidden on very small screens */}
        <div className="hidden sm:block">
          <CreditBalance compact />
        </div>
        
        {/* Notifications or other actions could go here */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full">
              <Avatar className="h-8 w-8 md:h-9 md:w-9">
                <AvatarFallback className="text-sm">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
              Billing & Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/login')}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
