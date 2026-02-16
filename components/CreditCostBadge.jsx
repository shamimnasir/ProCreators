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
  
  // Video Processing (High cost) - Base costs for 30s duration
  'video-editor': 60,
  'ai-video-studio': 80,  // Base for 30s, scales with duration
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

// Video tools that scale by duration (base = 30s)
const VIDEO_TOOLS_WITH_SCALING = [
  'ai-video-studio',
  'auto-reels', 
  'auto-longform',
  'story-reels',
  'transformation-video',
  'script-to-ad',
  'talking-head'
]

// Calculate dynamic cost based on duration
function calculateDynamicCost(toolId, duration = 30, consistencyMode = 'none') {
  const baseCost = TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
  if (!VIDEO_TOOLS_WITH_SCALING.includes(toolId)) {
    return baseCost
  }
  
  // Scale by duration (base = 30s)
  const durationMultiplier = duration / 30
  let cost = Math.ceil(baseCost * durationMultiplier)
  
  // Minimum 25% of base cost
  cost = Math.max(cost, Math.ceil(baseCost * 0.25))
  
  // Frame-chain premium (15%)
  if (consistencyMode === 'frame-chain') {
    cost = Math.ceil(cost * 1.15)
  }
  
  return cost
}

export function CreditCostBadge({ toolId, duration, consistencyMode, className = '' }) {
  const cost = duration 
    ? calculateDynamicCost(toolId, duration, consistencyMode)
    : TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
  const isScaled = VIDEO_TOOLS_WITH_SCALING.includes(toolId) && duration
  const baseCost = TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
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
          {isScaled ? (
            <div className="text-sm">
              <p className="font-medium">{cost} credits for {duration}s video</p>
              <p className="text-xs text-muted-foreground">Base: {baseCost} credits for 30s</p>
              {consistencyMode === 'frame-chain' && (
                <p className="text-xs text-purple-400">+15% for Frame-Chain consistency</p>
              )}
            </div>
          ) : (
            <p>This generation costs {cost} credits</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Hook version for dynamic cost fetching
export function useCreditCost(toolId, duration = 30, consistencyMode = 'none') {
  const [cost, setCost] = useState(calculateDynamicCost(toolId, duration, consistencyMode))
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    setCost(calculateDynamicCost(toolId, duration, consistencyMode))
  }, [toolId, duration, consistencyMode])
  
  return { cost, loading }
}

export { TOOL_COSTS, calculateDynamicCost }
