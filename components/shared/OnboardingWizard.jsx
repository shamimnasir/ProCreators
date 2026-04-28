'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Video,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Briefcase,
  GraduationCap,
  Megaphone,
  Palette,
  ArrowRight,
  Check,
  Wand2,
  X
} from 'lucide-react'
import Link from 'next/link'

const CREATOR_TYPES = [
  {
    id: 'content',
    label: 'Content Creator',
    description: 'YouTube, TikTok, Instagram',
    icon: Video,
    color: 'from-pink-500 to-rose-600',
    tools: [
      { name: 'AI Video Studio', href: '/dashboard/tools/ai-video-studio', desc: 'Complete videos with voiceover & captions' },
      { name: 'Thumbnail Maker', href: '/dashboard/tools/thumbnail-maker', desc: 'Click-worthy thumbnails for YouTube' },
      { name: 'Quick Reels', href: '/dashboard/tools/quick-reels', desc: 'Short-form video content' },
      { name: 'Carousel Creator', href: '/dashboard/tools/carousels', desc: 'Swipe-worthy Instagram carousels' },
    ]
  },
  {
    id: 'writer',
    label: 'Writer / Blogger',
    description: 'Blog posts, articles, newsletters',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    tools: [
      { name: 'Blog Creator', href: '/dashboard/tools/blog-creator', desc: 'SEO-optimized articles in minutes' },
      { name: 'Thread Creator', href: '/dashboard/tools/thread-creator', desc: 'Twitter/X thread generator' },
      { name: 'Newsletter Writer', href: '/dashboard/tools/newsletter-writer', desc: 'Engaging email newsletters' },
      { name: 'AI Humanizer', href: '/dashboard/tools/ai-humanizer', desc: 'Make AI content sound natural' },
    ]
  },
  {
    id: 'seller',
    label: 'Digital Product Seller',
    description: 'Etsy, Amazon KDP, Gumroad',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    tools: [
      { name: 'Ebook Maker', href: '/dashboard/tools/ebook-maker', desc: 'Full ebooks with cover design' },
      { name: 'Planner Maker', href: '/dashboard/tools/planner-maker', desc: 'Printable planners people buy' },
      { name: 'Coloring Book', href: '/dashboard/tools/coloring-book', desc: 'Kids & adult coloring books' },
      { name: 'Journal Maker', href: '/dashboard/tools/journal-maker', desc: 'Guided journals and diaries' },
    ]
  },
  {
    id: 'marketer',
    label: 'Marketer',
    description: 'Ad copy, campaigns, social',
    icon: Megaphone,
    color: 'from-orange-500 to-amber-600',
    tools: [
      { name: 'Ad Copy Generator', href: '/dashboard/tools/ad-copy', desc: 'High-converting ad copy' },
      { name: 'Landing Page Copy', href: '/dashboard/tools/landing-page-copy', desc: 'Sales page copy that converts' },
      { name: 'Marketing Strategy', href: '/dashboard/tools/marketing-strategy', desc: 'Complete marketing plans' },
      { name: 'Social Media Posts', href: '/dashboard/viral-posts', desc: 'Viral social content' },
    ]
  },
  {
    id: 'business',
    label: 'Business Owner',
    description: 'Plans, pitches, proposals',
    icon: Briefcase,
    color: 'from-violet-500 to-purple-600',
    tools: [
      { name: 'Business Plan', href: '/dashboard/tools/business-plan', desc: 'Professional business plans' },
      { name: 'Pitch Deck', href: '/dashboard/tools/pitch-deck-creator', desc: 'Investor-ready pitch decks' },
      { name: 'Slideshow Maker', href: '/dashboard/tools/slideshow-maker', desc: 'Professional presentations' },
      { name: 'Email Template', href: '/dashboard/tools/email-template', desc: 'Business email templates' },
    ]
  },
  {
    id: 'educator',
    label: 'Educator / Coach',
    description: 'Courses, lessons, worksheets',
    icon: GraduationCap,
    color: 'from-cyan-500 to-blue-600',
    tools: [
      { name: 'Lesson Planner', href: '/dashboard/tools/lesson-planner', desc: 'Structured lesson plans' },
      { name: 'Worksheet Creator', href: '/dashboard/tools/worksheet-creator', desc: 'Printable worksheets' },
      { name: 'Quiz Maker', href: '/dashboard/tools/quiz-maker', desc: 'Interactive quizzes' },
      { name: 'Flashcards', href: '/dashboard/tools/flashcards', desc: 'Study flashcard sets' },
    ]
  },
]

export function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [selectedTypes, setSelectedTypes] = useState([])

  const toggleType = (id) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const recommendedTools = CREATOR_TYPES
    .filter(t => selectedTypes.includes(t.id))
    .flatMap(t => t.tools)
    .slice(0, 8)

  const handleComplete = () => {
    try {
      localStorage.setItem('onboarding_complete', 'true')
      localStorage.setItem('creator_types', JSON.stringify(selectedTypes))
    } catch (e) {
      // localStorage might not be available
    }
    onComplete()
  }

  const handleSkip = () => {
    try {
      localStorage.setItem('onboarding_complete', 'true')
    } catch (e) {}
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-background rounded-2xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close/Skip button */}
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 md:p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm font-medium text-purple-500 mb-4">
                  <Wand2 className="h-4 w-4" />
                  Welcome to ProCreators
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">What do you create?</h2>
                <p className="text-muted-foreground">Pick all that apply. We'll show you the best tools for your workflow.</p>
              </div>

              {/* Creator type cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {CREATOR_TYPES.map((type) => {
                  const isSelected = selectedTypes.includes(type.id)
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                          : 'border-border hover:border-purple-500/50 hover:bg-muted/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${type.color} text-white mb-2`}>
                        <type.icon className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                    </button>
                  )
                })}
              </div>

              {/* Next button */}
              <div className="flex justify-between items-center">
                <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground">
                  Skip for now
                </button>
                <Button 
                  onClick={() => setStep(2)}
                  disabled={selectedTypes.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Show My Tools
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 md:p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-4 py-2 text-sm font-medium text-green-500 mb-4">
                  <Check className="h-4 w-4" />
                  Your Recommended Tools
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Here's your starter kit</h2>
                <p className="text-muted-foreground">Based on what you create, these tools will be most useful to you.</p>
              </div>

              {/* Recommended tools */}
              <div className="grid gap-3 mb-8">
                {recommendedTools.map((tool, i) => (
                  <Link 
                    key={i} 
                    href={tool.href}
                    onClick={handleComplete}
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl border hover:border-purple-500/50 hover:bg-muted/50 transition-all group cursor-pointer">
                      <div className="flex-1">
                        <div className="font-semibold group-hover:text-purple-500 transition-colors">{tool.name}</div>
                        <div className="text-sm text-muted-foreground">{tool.desc}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
