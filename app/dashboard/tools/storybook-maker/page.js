'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  BookOpen, Download, Sparkles, Loader2, DollarSign, Image,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  ChevronDown, ChevronUp, RefreshCw, Save, Palette, ImagePlus,
  FileText, Wand2, BookMarked, Baby, GraduationCap, Users, Upload
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import DraftsManager from '@/components/shared/DraftsManager'

// Story Genres
const STORY_GENRES = [
  { id: 'adventure', name: 'Adventure', icon: '🗺️', description: 'Exciting journeys and discoveries' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧚', description: 'Magical worlds and creatures' },
  { id: 'animals', name: 'Animals', icon: '🐻', description: 'Animal characters and nature' },
  { id: 'educational', name: 'Educational', icon: '📚', description: 'Learning concepts through stories' },
  { id: 'bedtime', name: 'Bedtime', icon: '🌙', description: 'Calm, soothing stories' },
  { id: 'friendship', name: 'Friendship', icon: '💝', description: 'Stories about friends and kindness' },
  { id: 'nature', name: 'Nature', icon: '🌳', description: 'Exploring the natural world' },
  { id: 'custom', name: 'Custom', icon: '✨', description: 'Create your own theme' }
]

// Age Groups
const AGE_GROUPS = [
  { id: 'toddler', name: 'Toddlers (1-3)', icon: Baby, description: 'Simple words, short sentences' },
  { id: 'preschool', name: 'Preschool (3-5)', icon: Users, description: 'Rhyming, repetition, fun' },
  { id: 'early-reader', name: 'Early Reader (5-7)', icon: BookOpen, description: 'Beginning chapter style' },
  { id: 'middle-grade', name: 'Middle Grade (8-12)', icon: GraduationCap, description: 'Complex stories' }
]

// Illustration Styles
const ILLUSTRATION_STYLES = [
  { id: 'cartoon', name: 'Cartoon', description: 'Bright, playful cartoon style' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft, dreamy watercolor art' },
  { id: 'digital', name: 'Digital Art', description: 'Modern, clean digital illustrations' },
  { id: 'classic', name: 'Classic', description: 'Traditional storybook style' },
  { id: 'whimsical', name: 'Whimsical', description: 'Magical, fantasy-inspired' }
]

// Paper Sizes
const PAPER_SIZES = [
  { id: '8.5x8.5', name: '8.5" × 8.5" (Square)', recommended: true, description: 'Perfect for picture books' },
  { id: '8x10', name: '8" × 10"', recommended: true, description: 'Popular children\'s book size' },
  { id: '8.5x11', name: '8.5" × 11" (Letter)', recommended: false, description: 'Standard letter size' },
  { id: '6x9', name: '6" × 9"', recommended: false, description: 'Compact chapter book size' }
]

// Color Themes
const COLOR_THEMES = [
  { id: 'storybook', name: 'Classic Storybook', primary: '#4f46e5', secondary: '#818cf8' },
  { id: 'forest', name: 'Enchanted Forest', primary: '#166534', secondary: '#4ade80' },
  { id: 'ocean', name: 'Ocean Dreams', primary: '#0369a1', secondary: '#38bdf8' },
  { id: 'sunset', name: 'Sunset Magic', primary: '#c2410c', secondary: '#fb923c' },
  { id: 'pink', name: 'Cotton Candy', primary: '#be185d', secondary: '#f472b6' },
  { id: 'purple', name: 'Royal Purple', primary: '#7c3aed', secondary: '#a78bfa' }
]

export default function StorybookMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingIllustrations, setGeneratingIllustrations] = useState(false)
  const { toast } = useToast()

  // Step 1: Story Setup
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('adventure')
  const [customGenre, setCustomGenre] = useState('')
  const [ageGroup, setAgeGroup] = useState('preschool')
  const [pageCount, setPageCount] = useState(10)
  const [authorName, setAuthorName] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')

  // Step 2: Story Content
  const [story, setStory] = useState(null)
  const [expandedPage, setExpandedPage] = useState(null)

  // Step 3: Illustrations
  const [illustrationStyle, setIllustrationStyle] = useState('cartoon')
  const [generateIllustrations, setGenerateIllustrations] = useState(true)

  // Step 4: Design & Export
  const [paperSize, setPaperSize] = useState('8.5x8.5')
  const [selectedTheme, setSelectedTheme] = useState('storybook')
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#4f46e5')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#818cf8')
  const [useCustomColors, setUseCustomColors] = useState(false)

  // Result
  const [result, setResult] = useState(null)

  // Drafts
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/storybook-maker/drafts?toolType=storybook')
        const data = await res.json()
        if (data.success && data.drafts) {
          setDrafts(data.drafts)
        }
      } catch (e) {
        console.log('Failed to load drafts:', e)
      }
    }
    loadDrafts()
  }, [])

  // Get current data for drafts
  const getCurrentData = () => ({
    title: title || 'Untitled Storybook',
    genre,
    customGenre,
    ageGroup,
    pageCount,
    authorName,
    customPrompt,
    story,
    illustrationStyle,
    generateIllustrations,
    paperSize,
    selectedTheme,
    customPrimaryColor,
    customSecondaryColor,
    useCustomColors,
    step
  })

  // Load draft data
  const loadDraftData = (data) => {
    if (data.title) setTitle(data.title)
    if (data.genre) setGenre(data.genre)
    if (data.customGenre !== undefined) setCustomGenre(data.customGenre)
    if (data.ageGroup) setAgeGroup(data.ageGroup)
    if (data.pageCount) setPageCount(data.pageCount)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.customPrompt !== undefined) setCustomPrompt(data.customPrompt)
    if (data.story) setStory(data.story)
    if (data.illustrationStyle) setIllustrationStyle(data.illustrationStyle)
    if (data.generateIllustrations !== undefined) setGenerateIllustrations(data.generateIllustrations)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.selectedTheme) setSelectedTheme(data.selectedTheme)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.useCustomColors !== undefined) setUseCustomColors(data.useCustomColors)
    if (data.step && data.step > 1) setStep(Math.min(data.step, story ? 4 : 1))
    setResult(null)
  }

  // Auto-save draft function
  const autoSaveDraft = useCallback(async (dataOverrides = {}) => {
    try {
      const saveData = { 
        title: title || 'Untitled Storybook',
        genre,
        customGenre,
        ageGroup,
        pageCount,
        authorName,
        customPrompt,
        story,
        illustrationStyle,
        generateIllustrations,
        paperSize,
        selectedTheme,
        customPrimaryColor,
        customSecondaryColor,
        useCustomColors,
        step,
        ...dataOverrides 
      }
      
      // Only save if we have meaningful content (title or story)
      if (!saveData.title && !saveData.story) return
      
      const response = await fetch('/api/storybook-maker/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          toolType: 'storybook',
          title: saveData.title || 'Untitled Storybook',
          data: saveData
        })
      })
      
      const result = await response.json()
      if (result.success) {
        if (!currentDraftId && result.id) {
          setCurrentDraftId(result.id)
        }
        // Refresh drafts list
        const draftsRes = await fetch('/api/storybook-maker/drafts?toolType=storybook')
        const draftsData = await draftsRes.json()
        if (draftsData.success && draftsData.drafts) {
          setDrafts(draftsData.drafts)
        }
        console.log('Draft auto-saved successfully')
      }
    } catch (e) {
      console.log('Auto-save failed:', e)
    }
  }, [title, genre, customGenre, ageGroup, pageCount, authorName, customPrompt, story, illustrationStyle, generateIllustrations, paperSize, selectedTheme, customPrimaryColor, customSecondaryColor, useCustomColors, step, currentDraftId])

  // Debounced auto-save when story content changes
  const autoSaveTimeoutRef = useRef(null)
  
  useEffect(() => {
    // Only auto-save if we have a story and are past step 1
    if (!story || step < 2) return
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set a new timeout for debounced save (2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveDraft({ story, step })
    }, 2000)
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [story, step, autoSaveDraft]) // Trigger when story or step changes

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setTitle('')
    setGenre('adventure')
    setCustomGenre('')
    setAgeGroup('preschool')
    setPageCount(10)
    setAuthorName('')
    setCustomPrompt('')
    setStory(null)
    setIllustrationStyle('cartoon')
    setGenerateIllustrations(true)
    setPaperSize('8.5x8.5')
    setSelectedTheme('storybook')
    setUseCustomColors(false)
    setCurrentDraftId(null)
    setResult(null)
  }

  // Generate story with AI
  const generateStory = async () => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a story title", variant: "destructive" })
      return
    }

    if (genre === 'custom' && !customGenre.trim()) {
      toast({ title: "Custom Genre Required", description: "Please enter your custom genre/theme", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/storybook-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-story',
          title,
          genre: genre === 'custom' ? customGenre : genre,
          ageGroup,
          pageCount,
          customPrompt
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setStory(data.story)
      setStep(2)
      
      // Auto-save after story generation
      await autoSaveDraft({ story: data.story, step: 2 })
      
      toast({ title: "Story Generated!", description: `Created ${data.story?.pages?.length || pageCount} pages. Edit them below!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate illustrations
  const handleGenerateIllustrations = async () => {
    if (!story) return

    setGeneratingIllustrations(true)
    toast({ title: "Generating Illustrations...", description: "This may take a few minutes. Please wait." })

    try {
      const response = await fetch('/api/storybook-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-illustrations',
          story,
          illustrationStyle
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setStory(data.story)
      
      // Auto-save after illustrations generation
      await autoSaveDraft({ story: data.story, step: 3 })
      
      toast({ title: "Illustrations Generated!", description: `${data.illustratedCount} illustrations created!` })
    } catch (error) {
      toast({ title: "Illustration Failed", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingIllustrations(false)
    }
  }

  // Generate PDF
  const generatePDF = async () => {
    if (!story) {
      toast({ title: "No Story", description: "Please create a story first", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const theme = COLOR_THEMES.find(t => t.id === selectedTheme)
      const primaryColor = useCustomColors ? customPrimaryColor : theme?.primary
      const secondaryColor = useCustomColors ? customSecondaryColor : theme?.secondary

      const response = await fetch('/api/storybook-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          story,
          paperSize,
          primaryColor,
          secondaryColor,
          authorName,
          illustrationStyle,
          generateIllustrations,
          genre: genre === 'custom' ? customGenre : genre,
          ageGroup
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      if (data.story) setStory(data.story)
      setStep(5)
      
      // Auto-save after PDF generation (final state)
      await autoSaveDraft({ 
        story: data.story || story, 
        step: 5,
        result: { downloadUrl: data.downloadUrl, pageCount: data.pageCount }
      })
      
      toast({ title: "Storybook Ready!", description: `${data.pageCount} page illustrated storybook created!` })
    } catch (error) {
      toast({ title: "PDF Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Page management
  const updatePage = (idx, field, value) => {
    if (!story) return
    const updatedPages = [...story.pages]
    updatedPages[idx] = { ...updatedPages[idx], [field]: value }
    setStory({ ...story, pages: updatedPages })
  }

  const addPage = () => {
    if (!story) return
    const newPage = {
      pageNumber: story.pages.length + 1,
      text: 'Enter your story text here...',
      illustrationPrompt: 'Describe what should be illustrated on this page...'
    }
    setStory({ ...story, pages: [...story.pages, newPage] })
  }

  const removePage = (idx) => {
    if (!story || story.pages.length <= 1) return
    const updatedPages = story.pages.filter((_, i) => i !== idx)
    setStory({ ...story, pages: updatedPages })
    if (expandedPage === idx) setExpandedPage(null)
  }

  const selectedGenre = STORY_GENRES.find(g => g.id === genre)
  const pagesWithImages = story?.pages?.filter(p => p.imageUrl).length || 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-500" />
            Illustrated Storybook Creator
          </h1>
          <p className="text-muted-foreground">Create AI-generated children&apos;s storybooks with illustrations</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Sell for $10-$25
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => {
          const canNavigate = s < step || 
            (s === 2 && story) || 
            (s === 3 && story) ||
            (s === 4 && story) ||
            (s === 5 && result)
          
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => canNavigate && setStep(s)}
                disabled={!canNavigate && s > step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50' : s > step ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </button>
              {s < 5 && <div className={`w-8 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        {['Setup', 'Story', 'Illustrations', 'Design', 'Download'].map((label, idx) => (
          <span key={label} className={step === idx + 1 ? 'text-primary font-medium' : ''}>{label}</span>
        ))}
      </div>

      {/* Step 1: Story Setup */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-indigo-500" />
                  Step 1: Story Setup
                </CardTitle>
                <CardDescription>Define your storybook&apos;s theme and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Story Title *</Label>
                  <Input
                    placeholder="e.g., The Magic Forest Adventure"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {/* Genre Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Story Genre</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STORY_GENRES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGenre(g.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          genre === g.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{g.icon}</div>
                        <div className="font-medium text-sm">{g.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Genre */}
                {genre === 'custom' && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 space-y-2">
                    <Label>Custom Genre/Theme</Label>
                    <Input
                      placeholder="e.g., Space Exploration, Dinosaur Friends..."
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                    />
                  </div>
                )}

                {/* Age Group */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Target Age Group</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {AGE_GROUPS.map((ag) => {
                      const Icon = ag.icon
                      return (
                        <button
                          key={ag.id}
                          onClick={() => setAgeGroup(ag.id)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            ageGroup === ag.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                          <div className="font-medium text-sm">{ag.name}</div>
                          <div className="text-xs text-muted-foreground">{ag.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Page Count & Author */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Pages</Label>
                    <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 pages (Short)</SelectItem>
                        <SelectItem value="10">10 pages (Standard)</SelectItem>
                        <SelectItem value="15">15 pages (Medium)</SelectItem>
                        <SelectItem value="20">20 pages (Long)</SelectItem>
                        <SelectItem value="24">24 pages (KDP Min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Author Name (Optional)</Label>
                    <Input
                      placeholder="Your name or pen name"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label>Additional Instructions (Optional)</Label>
                  <Textarea
                    placeholder="e.g., Include a character named Luna the Rabbit, set in a magical garden, teach about sharing..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button className="w-full" size="lg" onClick={generateStory} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Story...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Story with AI</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Drafts Panel */}
          <div className="lg:col-span-1">
            <DraftsManager
              toolType="storybook"
              drafts={drafts}
              setDrafts={setDrafts}
              currentDraftId={currentDraftId}
              setCurrentDraftId={setCurrentDraftId}
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
            />
          </div>
        </div>
      )}

      {/* Step 2: Edit Story */}
      {step === 2 && story && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-green-500" />
                    Step 2: Edit Your Story
                  </CardTitle>
                  <CardDescription>Review and customize each page&apos;s text</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addPage}>
                    <Plus className="h-4 w-4 mr-1" /> Add Page
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateStory} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Story Overview */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border">
                <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-200">{story.title}</h3>
                {story.summary && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">{story.summary}</p>}
                {story.characters && story.characters.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Characters:</span>
                    {story.characters.map((char, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{char}</Badge>
                    ))}
                  </div>
                )}
                {story.moral && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 italic">&quot;{story.moral}&quot;</p>
                )}
              </div>

              {/* Pages */}
              <div className="space-y-2">
                {story.pages.map((page, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                      onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Page {idx + 1}</Badge>
                        <span className="font-medium text-sm truncate max-w-[300px]">
                          {page.text?.substring(0, 50)}...
                        </span>
                        {page.imageUrl && <Badge className="bg-green-100 text-green-800 text-xs">Has Image</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); removePage(idx) }} disabled={story.pages.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedPage === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {expandedPage === idx && (
                      <div className="p-4 space-y-4 bg-background">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Story Text</Label>
                              <Textarea
                                value={page.text}
                                onChange={(e) => updatePage(idx, 'text', e.target.value)}
                                rows={5}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Illustration Description</Label>
                              <Textarea
                                value={page.illustrationPrompt}
                                onChange={(e) => updatePage(idx, 'illustrationPrompt', e.target.value)}
                                placeholder="Describe what should be illustrated..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label>Page Illustration</Label>
                            {page.imageUrl ? (
                              <div className="relative group">
                                <img src={page.imageUrl} alt={`Page ${idx + 1}`} className="w-full rounded-lg border" />
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => updatePage(idx, 'imageUrl', null)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground border-2 border-dashed">
                                <div className="text-center p-4">
                                  <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm mb-3">No illustration yet</p>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          const reader = new FileReader()
                                          reader.onloadend = () => {
                                            updatePage(idx, 'imageUrl', reader.result)
                                            toast({ title: "Image Uploaded", description: `Custom image added to page ${idx + 1}` })
                                          }
                                          reader.readAsDataURL(file)
                                        }
                                      }}
                                    />
                                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
                                      <Upload className="h-4 w-4" />
                                      Upload Custom Image
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}
                            {page.imageUrl && (
                              <label className="cursor-pointer block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const reader = new FileReader()
                                      reader.onloadend = () => {
                                        updatePage(idx, 'imageUrl', reader.result)
                                        toast({ title: "Image Replaced", description: `Custom image updated for page ${idx + 1}` })
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                />
                                <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm">
                                  <Upload className="h-4 w-4" />
                                  Replace with Custom Image
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue to Illustrations <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Illustrations */}
      {step === 3 && story && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-purple-500" />
              Step 3: Generate Illustrations
            </CardTitle>
            <CardDescription>Choose your illustration style and generate images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Illustration Style */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Illustration Style</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ILLUSTRATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setIllustrationStyle(style.id)}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      illustrationStyle === style.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Palette className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Illustration Status */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-medium text-purple-800 dark:text-purple-200">Generate AI Illustrations</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {pagesWithImages > 0 
                      ? `${pagesWithImages}/${story.pages.length} pages have illustrations` 
                      : `Create illustrations for all ${story.pages.length} pages`}
                  </p>
                </div>
                <Button onClick={handleGenerateIllustrations} disabled={generatingIllustrations} size="lg">
                  {generatingIllustrations ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate All Illustrations</>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview Grid */}
            {pagesWithImages > 0 && (
              <div className="space-y-3">
                <Label>Generated Illustrations</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {story.pages.filter(p => p.imageUrl).map((page, idx) => (
                    <div key={idx} className="relative group">
                      <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full aspect-square object-cover rounded-lg border" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center rounded-b-lg">
                        Page {page.pageNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(4)}>
                Continue to Design <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Design & Export */}
      {step === 4 && story && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Step 4: Design & Export
            </CardTitle>
            <CardDescription>Choose paper size and colors for your storybook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Paper Size */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Paper Size (KDP)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPaperSize(size.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          paperSize === size.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{size.name}</div>
                        <div className="text-xs text-muted-foreground">{size.description}</div>
                        {size.recommended && <Badge className="mt-1 text-xs">Recommended</Badge>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Color Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setSelectedTheme(theme.id)
                          setUseCustomColors(false)
                        }}
                        className={`p-3 rounded-lg text-white text-xs font-medium transition-all ${
                          selectedTheme === theme.id && !useCustomColors ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''
                        }`}
                        style={{ backgroundColor: theme.primary }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Custom Colors</Label>
                    <Switch checked={useCustomColors} onCheckedChange={setUseCustomColors} />
                  </div>
                  
                  {useCustomColors && (
                    <div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <input type="color" value={customPrimaryColor} onChange={(e) => setCustomPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={customPrimaryColor} onChange={(e) => setCustomPrimaryColor(e.target.value)} className="flex-1 font-mono" />
                      </div>
                      <div className="flex gap-2">
                        <input type="color" value={customSecondaryColor} onChange={(e) => setCustomSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={customSecondaryColor} onChange={(e) => setCustomSecondaryColor(e.target.value)} className="flex-1 font-mono" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Illustrations Option */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Generate Missing Illustrations</Label>
                    <p className="text-sm text-muted-foreground">Auto-create images during PDF generation</p>
                  </div>
                  <Switch checked={generateIllustrations} onCheckedChange={setGenerateIllustrations} />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <Label>Cover Preview</Label>
                <div 
                  className="rounded-lg p-6 text-white flex flex-col justify-between shadow-xl"
                  style={{ 
                    backgroundColor: useCustomColors ? customPrimaryColor : COLOR_THEMES.find(t => t.id === selectedTheme)?.primary,
                    aspectRatio: paperSize === '8.5x8.5' ? '1/1' : '3/4'
                  }}
                >
                  <div className="text-center pt-8">
                    <h3 className="text-xl font-bold drop-shadow">{story.title}</h3>
                    <p className="text-sm opacity-80 mt-2">{story.pages.length} Pages</p>
                    {authorName && <p className="text-xs opacity-70 mt-3">By {authorName}</p>}
                  </div>
                  <div className="text-center space-y-1">
                    <Badge variant="secondary" className="text-xs">{PAPER_SIZES.find(s => s.id === paperSize)?.name}</Badge>
                    <Badge variant="secondary" className="text-xs ml-2">{AGE_GROUPS.find(a => a.id === ageGroup)?.name}</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Genre:</strong> {genre === 'custom' ? customGenre : selectedGenre?.name}</p>
                  <p><strong>Pages:</strong> {story.pages.length} story pages + cover + back</p>
                  <p><strong>Illustrations:</strong> {pagesWithImages}/{story.pages.length} pages</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Storybook PDF...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Storybook PDF</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Download */}
      {step === 5 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Your Storybook is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedGenre?.icon || '📚'}</div>
              <h3 className="text-xl font-bold">{result.title}</h3>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{genre === 'custom' ? customGenre : selectedGenre?.name}</span>
                <span>•</span>
                <span>{AGE_GROUPS.find(a => a.id === ageGroup)?.name}</span>
              </div>
              
              <a href={result.downloadUrl} download className="inline-block">
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" /> Download Storybook PDF
                </Button>
              </a>
            </div>

            {/* Selling Tips */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Where to Sell Your Storybook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Amazon KDP</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Print-on-demand children&apos;s books</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Etsy</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Digital download PDFs</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">IngramSpark</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Wide distribution</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Design
              </Button>
              <Button variant="outline" onClick={handleStartNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Another
              </Button>
              <Link href="/dashboard/library" className="flex-1">
                <Button variant="outline" className="w-full">View in Library</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
