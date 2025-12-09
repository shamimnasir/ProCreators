'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { QUICK_REELS_NICHES } from '@/config/quick-reels-niches'

export default function QuickReelsHub() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            AI-Powered Video Creation
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Quick Video Reels & Shorts
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create engaging short-form videos for any niche with AI-powered scripts, 
          professional voiceovers, and stunning visuals—all in minutes.
        </p>
      </div>

      {/* Niches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUICK_REELS_NICHES.map((niche) => (
          <Link 
            key={niche.id} 
            href={`/dashboard/tools/quick-reels/${niche.slug}`}
            className="group"
          >
            <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary ${niche.cardBg}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`text-5xl mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    {niche.icon}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    AI Powered
                  </Badge>
                </div>
                
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {niche.name}
                </CardTitle>
                
                <CardDescription className="text-sm mt-2">
                  {niche.tagline}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {niche.description}
                </p>
                
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                  Create Video
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold mb-2">AI-Generated Scripts</h3>
          <p className="text-sm text-muted-foreground">
            Each niche has specialized prompts for high-quality, engaging content
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎙️</span>
          </div>
          <h3 className="font-semibold mb-2">Professional Voiceovers</h3>
          <p className="text-sm text-muted-foreground">
            AI voices or upload your own for personalized narration
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎬</span>
          </div>
          <h3 className="font-semibold mb-2">Auto-Saved Library</h3>
          <p className="text-sm text-muted-foreground">
            All videos are automatically saved to your library for 30 days
          </p>
        </div>
      </div>
    </div>
  )
}
