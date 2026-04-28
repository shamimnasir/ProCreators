'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import {
  Loader2,
  Film,
  Play,
  ArrowLeft,
  Star,
  Clock,
  Clapperboard
} from 'lucide-react'

// Import Story Reels component for video creation
import StoryReelsPage from '@/app/dashboard/tools/story-reels/page'

// Import the unified VideoThemeSelector
import VideoThemeSelector from '@/components/video/VideoThemeSelector'

// Import Cinematic Director
import CinematicDirector from '@/components/video/CinematicDirector'

function AIVideoStudioPageContent() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') || 'stock' // 'stock', 'ai', or 'cinematic'
  
  // Main state
  const [studioMode, setStudioMode] = useState(initialMode) // 'stock', 'ai', or 'cinematic'
  const [view, setView] = useState('themes') // 'themes' or 'create'
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [userCredits, setUserCredits] = useState(0)

  // Fetch user credits for cinematic mode
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const token = localStorage.getItem('sessionToken')
        if (!token) return
        const res = await fetch('/api/credits', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) setUserCredits(data.totalCredits || 0)
      } catch (e) { /* ignore */ }
    }
    fetchCredits()
  }, [])

  // Handle theme selection
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme)
    setView('create')
  }

  // Go back to theme selection
  const handleBackToThemes = () => {
    setView('themes')
    setSelectedTheme(null)
  }

  // ==================== CREATE VIEW (Video Creation with Selected Theme) ====================
  if (view === 'create' && selectedTheme) {
    const isAIMode = studioMode === 'ai'
    const isCustom = selectedTheme.isCustom || selectedTheme.id === 'custom'
    
    return (
      <div className="space-y-4">
        {/* Back Button Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={handleBackToThemes}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${isAIMode ? 'from-violet-500 to-purple-600' : 'from-emerald-500 to-teal-600'} text-white`}>
                {isAIMode ? <Play className="h-6 w-6" /> : <Film className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {selectedTheme.name} — {isAIMode ? 'AI Video' : 'Stock Video'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isAIMode 
                    ? 'AI-generated clips from your script • Full creative control • Premium quality'
                    : 'HD Stock footage • Full creative control with script, voice & music'}
                </p>
              </div>
            </div>
          </div>
          <CreditCostBadge toolId={isAIMode ? "story-reels" : "quick-reels-stock"} />
        </div>
        
        {/* Full Story Reels Interface - Pass the theme as niche */}
        <StoryReelsPage
          niche={selectedTheme.id}
          nicheName={selectedTheme.name}
          nicheIcon={isAIMode ? "Play" : "Film"}
          nicheDescription={selectedTheme.description || (isAIMode 
            ? "Create AI-powered videos with full creative control"
            : "Create videos with HD stock footage and full creative control")}
          showCustomTopicInput={true}
          defaultVideoSource={isAIMode ? 'ai' : 'stock'}
          pageTitle={`${selectedTheme.name} - ${isAIMode ? 'AI Video' : 'Stock Video'}`}
          pageSubtitle={isAIMode 
            ? 'AI generates video clips from your script • Premium quality'
            : 'HD stock footage from Pexels • Fast & reliable'}
        />
      </div>
    )
  }

  // ==================== THEMES VIEW (Main Landing) ====================
  return (
    <div className="space-y-6">
      {/* Hero Header with Mode Switcher */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Film className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Video Studio</h1>
              <p className="text-white/80">Create AI-Powered Videos for Any Platform</p>
            </div>
            <CreditCostBadge toolId={studioMode === 'stock' ? 'quick-reels' : 'ai-video-studio'} />
          </div>
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-3 mt-6 mb-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setStudioMode('stock')}
                className={`px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  studioMode === 'stock' 
                    ? 'bg-white text-purple-700 shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Film className="h-4 w-4" />
                Stock Video
              </button>
              <button
                onClick={() => setStudioMode('ai')}
                className={`px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  studioMode === 'ai' 
                    ? 'bg-white text-purple-700 shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Play className="h-4 w-4" />
                AI Video
              </button>
              <button
                onClick={() => setStudioMode('cinematic')}
                className={`px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  studioMode === 'cinematic' 
                    ? 'bg-white text-purple-700 shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Clapperboard className="h-4 w-4" />
                Cinematic Director
                <Badge className="bg-amber-400 text-amber-900 text-[10px] px-1.5 py-0">NEW</Badge>
              </button>
            </div>
            <div className="hidden md:block text-sm text-white/70 ml-2">
              {studioMode === 'stock' 
                ? 'Stock footage from Pexels • Fast & affordable' 
                : studioMode === 'cinematic'
                ? 'AI director plans your shots • Seedance 1.5 Pro quality'
                : 'AI-generated videos • Seedance 1.5 Pro default'}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studioMode === 'stock' ? (
              <>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Play className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">14+ Themes</p>
                  <p className="text-xs text-white/70">Content Types</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Clock className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">15s - 10m</p>
                  <p className="text-xs text-white/70">Video Length</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Play className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">AI Scripts</p>
                  <p className="text-xs text-white/70">Auto-Generated</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Star className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">1-Click</p>
                  <p className="text-xs text-white/70">Quick Export</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Play className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">Seedance 1.5</p>
                  <p className="text-xs text-white/70">Default AI Engine</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Clock className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">5s - 10m</p>
                  <p className="text-xs text-white/70">Video Duration</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Film className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">14+ Themes</p>
                  <p className="text-xs text-white/70">Video Themes</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <Star className="h-5 w-5 mb-2" />
                  <p className="text-2xl font-bold">4K</p>
                  <p className="text-xs text-white/70">Max Resolution</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Platform Badges */}
      <Card className="border-dashed bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Perfect for:
              </span>
              <div className="flex gap-2 flex-wrap">
                {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook Reels', 'YouTube Long-form'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-purple-900">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on mode */}
      {studioMode === 'cinematic' ? (
        <CinematicDirector 
          userCredits={userCredits}
          onStartGeneration={(data) => {
            // Handle cinematic generation - convert shot list to story-reels compatible format
            const { shotList: sl } = data
            // Navigate to create view with the cinematic shot list
            setSelectedTheme({
              id: 'cinematic-director',
              name: 'Cinematic Director',
              description: sl.concept,
              isCustom: true,
              cinematicData: data
            })
            setStudioMode('ai')
            setView('create')
          }}
        />
      ) : (
        <>
          {/* Theme Selector - Unified for both modes */}
          <VideoThemeSelector 
            onSelectTheme={handleThemeSelect} 
            videoType={studioMode}
          />
        </>
      )}

      {/* Pro Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Star className="h-5 w-5" />
            Pro Tips for {studioMode === 'ai' ? 'AI' : 'Stock'} Video Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">1</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {studioMode === 'ai' ? 'Choose a Theme' : 'Pick Your Niche'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Select a theme above to get AI-optimized prompts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">2</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {studioMode === 'ai' ? 'Generate Script' : 'Write or Generate Script'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Enter a topic and let AI write the script for you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                <span className="text-lg">3</span>
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Create & Export</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Add voice, music, captions and export your video
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap main page in Suspense for useSearchParams
export default function AIVideoStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AIVideoStudioPageContent />
    </Suspense>
  )
}
