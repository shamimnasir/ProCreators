'use client'

import { useState, useEffect } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Credit costs per tool - matches backend /lib/credits.js
// PRICING MODEL: Based on actual API costs + profit margins
// - Text tools (Gemini): 55% margin
// - Image tools (Nano Banana): 55% margin - $0.134/image = 300 credits
// - Video tools (Kling): 20% margin - ~$2.80/10s clip = 10,000 credits for 30s
const TOOL_COSTS = {
  // ============= TEXT GENERATION (Very Cheap - Gemini) =============
  'joke-generator': 5,
  'fortune-teller': 5,
  'love-letter': 8,
  'story-writer': 15,
  'avatar-creator': 8,
  'meme-generator': 8,
  'ad-copy': 10,
  'professional-email': 8,
  'blog-creator': 20,
  'linkedin-posts': 8,
  'threads': 8,
  'quotes': 5,
  'news': 10,
  'tutorials': 15,
  'lists': 8,
  'landing-page-copy': 15,
  'email-campaigns': 12,
  'marketing-strategy': 20,
  'cover-letter': 10,
  'resume-builder': 15,
  'interview-prep': 12,
  'salary-negotiator': 10,
  'networking-message': 8,
  'job-matcher': 10,
  'essay-helper': 15,
  'study-notes': 12,
  'exam-prep': 15,
  'lesson-planner': 15,
  'grammar-checker': 5,
  'citation-generator': 5,
  'ai-humanizer': 10,
  'content-humanizer': 10,
  'youtube-creator': 15,
  
  // ============= PDF (Text-only - Cheap) =============
  'planner-maker': 20,
  'worksheet-maker': 20,
  'checklist-maker': 15,
  'journal-maker': 20,
  'quiz-maker': 18,
  'learning-cards': 18,
  'slides-maker': 25,
  'notion-templates': 20,
  'business-plan': 30,
  'pitch-deck': 35,
  'swot-analysis': 20,
  'guide-maker': 25,
  
  // ============= PDF WITH IMAGES (Expensive - Nano Banana @ $0.134/image) =============
  // 300 credits per image
  'coloring-book': 7500,      // ~25 images
  'storybook-maker': 3000,    // ~10 images
  'activity-book': 4500,      // ~15 images
  'recipe-book': 2000,        // ~6-7 images
  'ebook-maker': 1500,        // ~5 images
  
  // ============= SINGLE IMAGE GENERATION ($0.134 = 300 credits) =============
  'image-editor': 300,
  'cover-image-creator': 300,
  'podcast-cover-maker': 300,
  'thumbnail-maker': 300,
  'photo-cards': 300,
  'carousels': 600,           // 2 images avg
  
  // ============= VIDEO - STOCK (Pexels FREE + TTS) =============
  'video-editor': 50,
  'quick-reels': 40,          // Stock videos only
  'quick-reels-stock': 40,
  'auto-subtitles': 30,
  'reels': 40,
  
  // ============= VIDEO - AI (Kling @ $2.80/10s clip) =============
  // 20% margin: 10,000 credits for 30s (3 clips)
  'ai-video-studio': 10000,
  'story-reels': 10000,
  'auto-reels': 10000,
  'auto-longform': 15000,
  'talking-head': 10000,
  'transformation-video': 10000,
  'script-to-ad': 10000,
  
  // AI Video Tiers
  'quick-reels-ai-essential': 8000,
  'quick-reels-ai-standard': 10000,
  'quick-reels-ai-professional': 12000,
  'quick-reels-ai-cinema': 15000,
  
  // ============= AUDIO =============
  'audio-editor': 25,
  'noise-remover': 20,
  'voice-enhancer': 25,
  'voice-clone': 500,
  
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
  'talking-head',
  'quick-reels-ai-essential',
  'quick-reels-ai-standard',
  'quick-reels-ai-professional',
  'quick-reels-ai-cinema'
]

// Stock video tools that scale by duration (cheaper)
const STOCK_VIDEO_TOOLS_WITH_SCALING = [
  'quick-reels',
  'quick-reels-stock',
  'story-reels-stock',
  'video-editor'
]

/**
 * Calculate dynamic cost based on video duration
 * 
 * PRICING:
 * - AI Video: Base cost is 10,000 for 30 seconds, scales linearly
 * - Stock Video: Base cost is 40 for 30 seconds, scales linearly (much cheaper)
 * - Frame-chain adds 15% premium (AI only)
 * 
 * Example for ai-video-studio (base 10,000 credits for 30s):
 * - 15s video = 5,000 credits
 * - 30s video = 10,000 credits
 * - 60s video = 20,000 credits  
 * - 120s video = 40,000 credits
 * 
 * Example for stock video (base 40 credits for 30s):
 * - 30s = 40 credits
 * - 60s = 80 credits
 * - 180s (3 min) = 240 credits
 */
function calculateDynamicCost(toolId, duration = 30, consistencyMode = 'none') {
  const baseCost = TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
  // Check if it's a stock video tool
  if (STOCK_VIDEO_TOOLS_WITH_SCALING.includes(toolId)) {
    const baseDuration = 30
    const durationMultiplier = duration / baseDuration
    let cost = Math.ceil(baseCost * durationMultiplier)
    // Minimum cost is base cost
    cost = Math.max(cost, baseCost)
    return cost
  }
  
  // Check if it's an AI video tool
  if (!VIDEO_TOOLS_WITH_SCALING.includes(toolId)) {
    return baseCost
  }
  
  // Scale linearly with duration (base is 30 seconds)
  const baseDuration = 30
  const durationMultiplier = duration / baseDuration
  let cost = Math.ceil(baseCost * durationMultiplier)
  
  // Minimum cost is 25% of base (for very short videos)
  cost = Math.max(cost, Math.ceil(baseCost * 0.25))
  
  // Frame-chain adds 15% premium (more API calls for frame extraction)
  if (consistencyMode === 'frame-chain') {
    cost = Math.ceil(cost * 1.15)
  }
  
  return cost
}

/**
 * Format large numbers with K/M suffixes
 */
function formatCredits(credits) {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`
  }
  if (credits >= 10000) {
    return `${(credits / 1000).toFixed(0)}K`
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`
  }
  return credits.toString()
}

export function CreditCostBadge({ toolId, duration, consistencyMode, className = '' }) {
  const isAIVideo = VIDEO_TOOLS_WITH_SCALING.includes(toolId) && duration
  
  const cost = duration 
    ? calculateDynamicCost(toolId, duration, consistencyMode)
    : TOOL_COSTS[toolId] || TOOL_COSTS['default']
  
  const baseCost = TOOL_COSTS[toolId] || TOOL_COSTS['default']
  const formattedCost = formatCredits(cost)
  
  // Color coding based on cost
  let colorClass = 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
  if (cost >= 1000) {
    colorClass = 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
  }
  if (cost >= 5000) {
    colorClass = 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
  }
  if (cost >= 10000) {
    colorClass = 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1.5 px-2.5 py-1 ${colorClass} ${className}`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="font-semibold">{formattedCost}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isAIVideo ? (
            <div className="text-sm">
              <p className="font-medium">{cost.toLocaleString()} credits for {duration}s video</p>
              <p className="text-xs text-muted-foreground">Base: {baseCost.toLocaleString()} credits for 30s</p>
              <p className="text-xs text-muted-foreground">≈ ${(cost * 0.001).toFixed(2)} value</p>
              {consistencyMode === 'frame-chain' && (
                <p className="text-xs text-purple-400">+15% for Frame-Chain</p>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <p>This costs {cost.toLocaleString()} credits</p>
              <p className="text-xs text-muted-foreground">≈ ${(cost * 0.001).toFixed(2)} value</p>
            </div>
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

export { TOOL_COSTS, VIDEO_TOOLS_WITH_SCALING, STOCK_VIDEO_TOOLS_WITH_SCALING, calculateDynamicCost, formatCredits }
