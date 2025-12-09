'use client'

/**
 * Quick Reels - Dynamic Niche Page
 * 
 * This page displays the full Story Reels interface but with niche-specific
 * AI prompts for script generation. Each niche (Horror, Motivational, etc.)
 * uses the same UI and complete workflow but generates contextually appropriate content.
 */

import React from 'react'
import { useParams } from 'next/navigation'
import { getNicheBySlug } from '@/config/quick-reels-niches'
import StoryReelsPage from '@/app/dashboard/tools/story-reels/page'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NichePage() {
  const params = useParams()
  const nicheSlug = params.niche
  
  const nicheConfig = getNicheBySlug(nicheSlug)
  
  if (!nicheConfig) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h2 className="text-2xl font-bold">Niche Not Found</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              The niche "{nicheSlug}" doesn't exist or has been removed.
            </p>
            <Link href="/dashboard/tools/quick-reels">
              <Button>
                Back to Quick Reels Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Use the full Story Reels component with niche-specific props
  return (
    <StoryReelsPage
      niche={nicheConfig.slug}
      nicheName={nicheConfig.name}
      nicheIcon={nicheConfig.icon}
      nicheDescription={nicheConfig.description}
      showCustomTopicInput={nicheConfig.slug === 'generic'}
    />
  )
}
