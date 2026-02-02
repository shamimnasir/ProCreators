'use client'

import { useState, useEffect } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Credit costs per tool (matches backend)
const TOOL_COSTS = {
  // Text Generation (Low cost)
  'joke-generator': 8,
  'fortune-teller': 8,
  'love-letter': 10,
  'story-writer': 15,
  'avatar-creator': 12,
  'meme-generator': 10,
  'ad-copy': 15,
  'professional-email': 10,
  'blog-creator': 20,
  'linkedin-posts': 10,
  'threads': 10,
  'quotes': 8,
  'news': 12,
  'tutorials': 15,
  'lists': 10,
  
  // PDF Generation (Medium cost)
  'planner-maker': 25,
  'worksheet-maker': 25,
  'coloring-book': 30,
  'journal-maker': 25,
  'checklist-maker': 20,
  'ebook-maker': 40,
  'recipe-book': 30,
  'guide-maker': 35,
  'storybook-maker': 35,
  'activity-book': 30,
  'quiz-maker': 20,
  'learning-cards': 20,
  'slides-maker': 30,
  'notion-templates': 25,
  'business-plan': 35,
  'pitch-deck': 40,
  'swot-analysis': 25,
  'marketing-strategy': 30,
  
  // Image Generation (Medium-High cost)
  'image-editor': 35,
  'cover-image-creator': 30,
  'podcast-cover-maker': 30,
  'thumbnail-maker': 25,
  'photo-cards': 25,
  'carousels': 30,
  
  // Video Processing (High cost)
  'video-editor': 60,
  'ai-video-studio': 80,
  'quick-reels': 70,
  'auto-subtitles': 40,
  'auto-reels': 80,
  'auto-longform': 100,
  'talking-head': 90,
  'transformation-video': 75,
  'script-to-ad': 85,
  'story-reels': 70,
  'reels': 60,
  
  // Audio Processing (Medium cost)
  'audio-editor': 30,
  'noise-remover': 25,
  'voice-enhancer': 30,
  'voice-clone': 50,
  
  // Default
  'default': 20
}

export function CreditCostBadge({ toolId, className = '' }) {
  const cost = TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 ${className}`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="font-semibold">{cost}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This generation costs {cost} credits</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Hook version for dynamic cost fetching
export function useCreditCost(toolId) {
  const [cost, setCost] = useState(TOOL_COSTS[toolId] || TOOL_COSTS['default'])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Use local costs for instant display
    setCost(TOOL_COSTS[toolId] || TOOL_COSTS['default'])
  }, [toolId])
  
  return { cost, loading }
}

export { TOOL_COSTS }
