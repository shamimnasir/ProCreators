'use client'

import { useState, useEffect } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Credit costs per tool - mirrors backend /lib/credits.js
// CREDIT SYSTEM v3 (Feb 2026 — Seedance 2 + Kling Pro repricing)
// 1 credit = $0.02 | Video tools rebuilt at 30% margin from fal.ai pricing
const TOOL_COSTS = {
  // ============= TEXT GENERATION (1-3 credits) =============
  'joke-generator': 1,
  'fortune-teller': 1,
  'grammar-checker': 1,
  'citation-generator': 1,
  'love-letter': 2,
  'story-writer': 3,
  'avatar-creator': 2,
  'meme-generator': 2,
  'ad-copy': 2,
  'professional-email': 2,
  'blog-creator': 3,
  'linkedin-posts': 2,
  'threads': 2,
  'quotes': 1,
  'news': 2,
  'tutorials': 3,
  'lists': 2,
  'landing-page-copy': 3,
  'email-campaigns': 2,
  'marketing-strategy': 3,
  'cover-letter': 2,
  'resume-builder': 3,
  'interview-prep': 2,
  'salary-negotiator': 2,
  'networking-message': 2,
  'job-matcher': 2,
  'essay-helper': 3,
  'study-notes': 2,
  'exam-prep': 3,
  'lesson-planner': 3,
  'ai-humanizer': 2,
  'content-humanizer': 2,
  'youtube-creator': 3,
  
  // ============= DIGITAL PRODUCTS — TEXT-ONLY (5-15 credits) =============
  'checklist-maker': 5,
  'worksheet-maker': 5,
  'quiz-maker': 5,
  'learning-cards': 5,
  'flashcards': 5,
  'swot-analysis': 5,
  'planner-maker': 8,
  'journal-maker': 8,
  'notion-templates': 8,
  'guide-maker': 10,
  'slides-maker': 12,
  'business-plan': 15,
  'pitch-deck': 15,
  
  // ============= DIGITAL PRODUCTS — WITH IMAGES (100-400 credits) =============
  'ebook-maker': 100,
  'recipe-book': 120,
  'storybook-maker': 200,
  'activity-book': 250,
  'coloring-book': 400,
  
  // ============= SINGLE IMAGE (15 credits) =============
  'image-editor': 15,
  'cover-image-creator': 15,
  'podcast-cover-maker': 15,
  'thumbnail-maker': 15,
  'photo-cards': 15,
  'carousels': 50,              // 10 credits/slide × 5 base
  
  // ============= VIDEO — STOCK (2-3 credits) =============
  'quick-reels': 3,
  'quick-reels-stock': 3,
  'auto-subtitles': 2,
  'reels': 3,
  
  // ============= VIDEO — AI (per 30s base, 30% margin) =============
  // Default engine = Seedance 2.0 Fast (720p) @ $0.2419/sec
  'ai-video-studio': 520,
  'story-reels': 520,
  'auto-reels': 520,
  'auto-longform': 800,
  'talking-head': 520,
  'transformation-video': 520,
  'script-to-ad': 520,
  
  // AI Video Model Tiers (per 30s, 30% margin)
  'quick-reels-ai-essential': 20,     // Pixverse $0.008/s
  'quick-reels-ai-standard': 110,     // Wan 2.2 $0.05/s
  'quick-reels-ai-seedance': 520,     // Seedance 2.0 Fast (DEFAULT) $0.2419/s
  'quick-reels-ai-professional': 150, // Kling 2.5 Pro $0.07/s
  'quick-reels-ai-cinema': 430,       // Veo 3.1 $0.20/s
  'quick-reels-ai-wan': 110,
  'quick-reels-ai-ltx': 25,
  
  // ============= UGC AD STUDIO (per generation, 30% margin) =============
  'ugc-talking-head-standard': 125,   // Kling Avatar v2 Std $0.0562/s × 30s
  'ugc-talking-head-pro': 250,        // Kling Avatar v2 Pro $0.115/s × 30s
  'ugc-broll': 140,                   // Seedance 2 Fast 8s clip
  'ugc-script': 3,
  'ugc-avatar-generate': 15,
  
  // ============= AUDIO (2-25 credits) =============
  'audio-editor': 2,
  'noise-remover': 2,
  'voice-enhancer': 2,
  'voice-clone': 25,
  
  // Default
  'default': 2
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
  'quick-reels-ai-cinema',
  'quick-reels-ai-wan',
  'quick-reels-ai-ltx'
]

// Stock video tools that scale by duration (cheaper)
const STOCK_VIDEO_TOOLS_WITH_SCALING = [
  'quick-reels',
  'quick-reels-stock',
  'story-reels-stock'
]

/**
 * Calculate dynamic cost based on video duration
 * 
 * SIMPLIFIED v2 PRICING:
 * - AI Video: Base cost for 30 seconds, scales linearly
 * - Stock Video: Base cost for 30 seconds, scales linearly
 * - Frame-chain adds 15% premium (AI only)
 * 
 * Example for ai-video-studio (base 520 credits for 30s):
 * - 15s video = 260 credits
 * - 30s video = 520 credits
 * - 60s video = 1,040 credits  
 * 
 * Example for stock video (base 3 credits for 30s):
 * - 30s = 3 credits
 * - 60s = 6 credits
 * - 180s (3 min) = 18 credits
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
  
  // Color coding based on cost (adjusted for simplified credits)
  let colorClass = 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
  if (cost >= 50) {
    colorClass = 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
  }
  if (cost >= 100) {
    colorClass = 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
  }
  if (cost >= 300) {
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
              <p className="text-xs text-muted-foreground">≈ ${(cost * 0.02).toFixed(2)} value</p>
              {consistencyMode === 'frame-chain' && (
                <p className="text-xs text-purple-400">+15% for Frame-Chain</p>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <p>This costs {cost.toLocaleString()} credits</p>
              <p className="text-xs text-muted-foreground">≈ ${(cost * 0.02).toFixed(2)} value</p>
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
