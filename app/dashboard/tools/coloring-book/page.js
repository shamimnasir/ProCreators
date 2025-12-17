'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Palette, Download, Sparkles, Loader2, DollarSign, Image,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  ChevronDown, ChevronUp, RefreshCw, Save, Pipette, ImagePlus,
  FileText, AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import DraftsManager from '@/components/shared/DraftsManager'

// KDP Coloring Book Paper Sizes
const PAPER_SIZES = [
  { 
    id: '8.5x11', 
    name: '8.5" × 11"', 
    width: 612, 
    height: 792,
    recommended: true,
    description: 'Gold standard for coloring books'
  },
  { 
    id: '8x10', 
    name: '8" × 10"', 
    width: 576, 
    height: 720,
    recommended: true,
    description: 'Premium feel, slightly smaller'
  },
  { 
    id: '8.5x8.5', 
    name: '8.5" × 8.5" (Square)', 
    width: 612, 
    height: 612,
    recommended: true,
    description: 'Perfect for mandalas & patterns'
  },
  { 
    id: '7x10', 
    name: '7" × 10"', 
    width: 504, 
    height: 720,
    description: 'Common choice for B&W books'
  },
  { 
    id: '8.25x8.25', 
    name: '8.25" × 8.25" (Square)', 
    width: 594, 
    height: 594,
    description: 'Square format for designs'
  },
]

// KDP Requirements
const KDP_MIN_PAGES = 24
const KDP_BLEED = 0.125 // inches

const COLORING_THEMES = [
  { id: 'animals', name: 'Animals', icon: '🦁', examples: 'Lions, elephants, butterflies' },
  { id: 'nature', name: 'Nature & Flowers', icon: '🌸', examples: 'Gardens, trees, landscapes' },
  { id: 'mandala', name: 'Mandalas', icon: '✨', examples: 'Geometric patterns, zen designs' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉', examples: 'Dragons, unicorns, fairies' },
  { id: 'ocean', name: 'Ocean & Sea Life', icon: '🐠', examples: 'Fish, dolphins, coral reefs' },
  { id: 'space', name: 'Space & Planets', icon: '🚀', examples: 'Astronauts, rockets, galaxies' },
  { id: 'holiday', name: 'Holiday & Seasonal', icon: '🎄', examples: 'Christmas, Halloween, Easter' },
  { id: 'patterns', name: 'Abstract Patterns', icon: '🎨', examples: 'Doodles, swirls, geometric' },
  { id: 'characters', name: 'Cute Characters', icon: '🧸', examples: 'Kawaii, chibi, cartoon animals' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', examples: 'Cars, planes, trains' },
  { id: 'custom', name: 'Custom Theme', icon: '✏️', examples: 'Create your own niche!' },
]

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy (Kids 3-6)', description: 'Large shapes, simple lines' },
  { id: 'medium', name: 'Medium (Kids 7-12)', description: 'More detail, smaller areas' },
  { id: 'hard', name: 'Hard (Teens & Adults)', description: 'Intricate details, fine lines' },
  { id: 'expert', name: 'Expert (Adults)', description: 'Maximum detail, mandala-level' },
]

const COLOR_PRESETS = [
  { id: 'purple', name: 'Royal Purple', primary: '#6b21a8', secondary: '#a855f7' },
  { id: 'blue', name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6' },
  { id: 'green', name: 'Forest Green', primary: '#166534', secondary: '#22c55e' },
  { id: 'pink', name: 'Rose Pink', primary: '#be185d', secondary: '#ec4899' },
  { id: 'orange', name: 'Sunset Orange', primary: '#c2410c', secondary: '#f97316' },
  { id: 'teal', name: 'Ocean Teal', primary: '#0f766e', secondary: '#14b8a6' },
]

export default function ColoringBookPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const { toast } = useToast()

  // Step 1: Theme & Settings
  const [theme, setTheme] = useState('animals')
  const [customTheme, setCustomTheme] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [pageCount, setPageCount] = useState(24) // KDP minimum is 24 pages
  const [bookTitle, setBookTitle] = useState('')
  const [authorName, setAuthorName] = useState('')

  // Step 2: Pages (editable)
  const [pages, setPages] = useState([])
  const [expandedPage, setExpandedPage] = useState(null)

  // Step 3: Design
  const [selectedPreset, setSelectedPreset] = useState('purple')
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#6b21a8')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#a855f7')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [generateCoverImage, setGenerateCoverImage] = useState(true)
  const [generatePageImages, setGeneratePageImages] = useState(false)
  
  // Paper Size & KDP Settings
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [useBleed, setUseBleed] = useState(true) // Recommended for coloring books

  // Result
  const [result, setResult] = useState(null)

  // Drafts
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/drafts?toolType=coloring-book')
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

  // Auto-save draft when data changes (debounced)
  const autoSaveDraft = useCallback(async () => {
    if (pages.length === 0 && !bookTitle && !customTheme) return
    
    const draftData = {
      id: currentDraftId || undefined,
      toolType: 'coloring-book',
      title: bookTitle || `${customTheme || theme} Coloring Book`,
      data: {
        theme,
        customTheme,
        difficulty,
        pageCount,
        bookTitle,
        authorName,
        pages,
        selectedPreset,
        customPrimaryColor,
        customSecondaryColor,
        useCustomColor,
        generateCoverImage,
        generatePageImages,
        step,
      }
    }
    
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      })
      const result = await res.json()
      if (result.success && !currentDraftId) {
        setCurrentDraftId(result.id)
      }
    } catch (e) {
      console.log('Auto-save failed:', e)
    }
  }, [theme, customTheme, difficulty, pageCount, bookTitle, authorName, pages, selectedPreset, customPrimaryColor, customSecondaryColor, useCustomColor, generateCoverImage, generatePageImages, step, currentDraftId])

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pages.length > 0 || bookTitle || customTheme) {
        autoSaveDraft()
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [pages, bookTitle, customTheme, autoSaveDraft])

  // Get current data for manual save
  const getCurrentData = () => ({
    title: bookTitle || `${customTheme || theme} Coloring Book`,
    theme,
    customTheme,
    difficulty,
    pageCount,
    bookTitle,
    authorName,
    pages,
    selectedPreset,
    customPrimaryColor,
    customSecondaryColor,
    useCustomColor,
    generateCoverImage,
    generatePageImages,
    paperSize,
    useBleed,
    step,
  })

  // Load draft data
  const loadDraftData = (data) => {
    if (data.theme) setTheme(data.theme)
    if (data.customTheme !== undefined) setCustomTheme(data.customTheme)
    if (data.difficulty) setDifficulty(data.difficulty)
    if (data.pageCount) setPageCount(data.pageCount)
    if (data.bookTitle) setBookTitle(data.bookTitle)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.pages) setPages(data.pages)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.useCustomColor !== undefined) setUseCustomColor(data.useCustomColor)
    if (data.generateCoverImage !== undefined) setGenerateCoverImage(data.generateCoverImage)
    if (data.generatePageImages !== undefined) setGeneratePageImages(data.generatePageImages)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.useBleed !== undefined) setUseBleed(data.useBleed)
    if (data.step && data.step > 1) setStep(Math.min(data.step, 3))
    setResult(null)
  }

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setTheme('animals')
    setCustomTheme('')
    setDifficulty('medium')
    setPageCount(24) // KDP minimum
    setBookTitle('')
    setAuthorName('')
    setPages([])
    setSelectedPreset('purple')
    setCustomPrimaryColor('#6b21a8')
    setCustomSecondaryColor('#a855f7')
    setUseCustomColor(false)
    setGenerateCoverImage(true)
    setGeneratePageImages(false)
    setPaperSize('8.5x11')
    setUseBleed(true)
    setCurrentDraftId(null)
    setResult(null)
  }

  // Generate page ideas with AI
  const generatePages = async () => {
    if (theme === 'custom' && !customTheme.trim()) {
      toast({ title: "Custom Theme Required", description: "Please enter your custom theme/niche", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/coloring-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          customTheme: theme === 'custom' ? customTheme : null,
          difficulty,
          pageCount,
          title: bookTitle,
          authorName,
          generateImages: false, // Just get ideas first
          generateCover: false
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setPages(data.pages || [])
      setStep(2)
      toast({ title: "Page Ideas Generated!", description: `${data.pages?.length || pageCount} page ideas created. Edit them below!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate images for pages
  const generateImagesForPages = async () => {
    if (pages.length === 0) return
    
    setGeneratingImages(true)
    toast({ title: "Generating Images...", description: "This may take a few minutes. Please wait." })
    
    try {
      const primaryColor = useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#6b21a8')
      const secondaryColor = useCustomColor ? customSecondaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.secondary || '#a855f7')
      
      const response = await fetch('/api/coloring-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          customTheme: theme === 'custom' ? customTheme : null,
          difficulty,
          pageCount: pages.length,
          pages,
          title: bookTitle || `${customTheme || COLORING_THEMES.find(t => t.id === theme)?.name} Coloring Book`,
          authorName,
          generateImages: true,
          generateCover: generateCoverImage,
          primaryColor,
          secondaryColor
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Update pages with generated images
      if (data.pages) {
        setPages(data.pages)
      }
      
      toast({ title: "Images Generated!", description: `${data.pages?.filter(p => p.imageUrl).length || 0} coloring pages created!` })
    } catch (error) {
      toast({ title: "Image Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingImages(false)
    }
  }

  // Generate final PDF
  const generatePDF = async () => {
    if (pages.length === 0) {
      toast({ title: "No Pages", description: "Please add at least one page", variant: "destructive" })
      return
    }

    // Warn about KDP compliance
    if (pages.length < KDP_MIN_PAGES) {
      const proceed = confirm(`Your book has ${pages.length} pages. Amazon KDP requires minimum 24 pages. Continue anyway?`)
      if (!proceed) return
    }

    setLoading(true)
    try {
      const primaryColor = useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#6b21a8')
      const secondaryColor = useCustomColor ? customSecondaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.secondary || '#a855f7')
      const selectedSize = PAPER_SIZES.find(s => s.id === paperSize)
      
      const response = await fetch('/api/coloring-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          customTheme: theme === 'custom' ? customTheme : null,
          difficulty,
          pageCount: pages.length,
          pages,
          title: bookTitle || `${customTheme || COLORING_THEMES.find(t => t.id === theme)?.name} Coloring Book`,
          authorName,
          generateImages: generatePageImages,
          generateCover: generateCoverImage,
          primaryColor,
          secondaryColor,
          // KDP Settings
          paperSize: {
            id: paperSize,
            width: selectedSize?.width || 612,
            height: selectedSize?.height || 792,
            name: selectedSize?.name || '8.5" × 11"'
          },
          useBleed,
          bleed: useBleed ? KDP_BLEED : 0
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Coloring Book Ready!", description: `${data.pageCount} pages generated!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Page management
  const addPage = () => {
    setPages([...pages, {
      title: `Page ${pages.length + 1}`,
      description: 'Describe what should be on this coloring page...',
      elements: []
    }])
  }

  const updatePage = (idx, field, value) => {
    const updated = [...pages]
    updated[idx] = { ...updated[idx], [field]: value }
    setPages(updated)
  }

  const removePage = (idx) => {
    setPages(pages.filter((_, i) => i !== idx))
    if (expandedPage === idx) setExpandedPage(null)
  }

  const movePage = (idx, direction) => {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= pages.length) return
    const updated = [...pages]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setPages(updated)
    setExpandedPage(newIdx)
  }

  const selectedTheme = COLORING_THEMES.find(t => t.id === theme)
  const pagesWithImages = pages.filter(p => p.imageUrl).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-500" />
            Coloring Book Creator Pro
          </h1>
          <p className="text-muted-foreground">Create AI-generated coloring pages with real line art</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Sell for $5-$15
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        <span>Theme</span>
        <span>Edit Pages</span>
        <span>Design</span>
        <span>Download</span>
      </div>

      {/* Step 1: Theme Selection */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Step 1: Choose Your Theme
                </CardTitle>
                <CardDescription>Select a preset theme or create your own custom niche</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLORING_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        theme === t.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.examples}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Theme Input */}
                {theme === 'custom' && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 space-y-3">
                    <Label className="text-purple-700 dark:text-purple-300 font-medium">
                      Enter Your Custom Theme/Niche
                    </Label>
                    <Input
                      placeholder="e.g., Vintage Motorcycles, Japanese Gardens, African Wildlife..."
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Be specific! The more detailed your niche, the better your coloring pages will be.
                    </p>
                  </div>
                )}

                {/* Paper Size Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paper Size (KDP Standard)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPaperSize(size.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          paperSize === size.id 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{size.name}</span>
                          {size.recommended && (
                            <Badge className="text-xs bg-green-100 text-green-800">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{size.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            <span className="font-medium">{level.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Number of Pages: {pageCount}
                      {pageCount < KDP_MIN_PAGES && (
                        <Badge className="text-xs bg-amber-100 text-amber-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Min 24 for KDP
                        </Badge>
                      )}
                    </Label>
                    <Slider
                      value={[pageCount]}
                      onValueChange={(v) => setPageCount(v[0])}
                      min={10}
                      max={50}
                      step={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amazon KDP requires minimum 24 pages for coloring books
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Book Title (Optional)</Label>
                    <Input
                      placeholder="e.g., Amazing Animals Coloring Fun"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author/Creator Name</Label>
                    <Input
                      placeholder="Your name or brand"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={generatePages} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Page Ideas...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate {pageCount} Page Ideas</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Drafts Panel */}
          <div className="lg:col-span-1">
            <DraftsManager
              toolType="coloring-book"
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

      {/* Step 2: Edit Pages */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-green-500" />
                    Step 2: Edit Your Coloring Pages
                  </CardTitle>
                  <CardDescription>Customize titles and descriptions for each page</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addPage}>
                    <Plus className="h-4 w-4 mr-1" /> Add Page
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePages} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pages yet. Click &quot;Add Page&quot; to create one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pages.map((page, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                        onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <span className="font-medium">{page.title}</span>
                          {page.imageUrl && <Badge className="bg-green-100 text-green-800 text-xs">Has Image</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); movePage(idx, -1) }} disabled={idx === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); movePage(idx, 1) }} disabled={idx === pages.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); removePage(idx) }}>
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
                                <Label>Page Title</Label>
                                <Input
                                  value={page.title}
                                  onChange={(e) => updatePage(idx, 'title', e.target.value)}
                                  placeholder="e.g., Majestic Lion"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description (what should be drawn)</Label>
                                <Textarea
                                  value={page.description}
                                  onChange={(e) => updatePage(idx, 'description', e.target.value)}
                                  placeholder="Describe the scene in detail..."
                                  rows={4}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Key Elements (comma-separated)</Label>
                                <Input
                                  value={page.elements?.join(', ') || ''}
                                  onChange={(e) => updatePage(idx, 'elements', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                  placeholder="lion, rocks, sunset"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Preview</Label>
                              {page.imageUrl ? (
                                <img src={page.imageUrl} alt={page.title} className="w-full rounded-lg border" />
                              ) : (
                                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                  <div className="text-center">
                                    <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No image generated yet</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Generate Images Button */}
              {pages.length > 0 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200">Generate AI Coloring Page Images</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {pagesWithImages > 0 
                          ? `${pagesWithImages}/${pages.length} pages have images` 
                          : 'Create actual line art images for your pages'}
                      </p>
                    </div>
                    <Button onClick={generateImagesForPages} disabled={generatingImages} variant="secondary">
                      {generatingImages ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Images...</>
                      ) : (
                        <><ImagePlus className="mr-2 h-4 w-4" /> Generate Images</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={pages.length === 0}>
                  Continue to Design <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Design */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Step 3: Design Settings
            </CardTitle>
            <CardDescription>Customize colors and cover options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Color Presets */}
                <div className="space-y-3">
                  <Label>Cover Color Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id)
                          setCustomPrimaryColor(preset.primary)
                          setCustomSecondaryColor(preset.secondary)
                          setUseCustomColor(false)
                        }}
                        className={`p-3 rounded-lg text-white text-xs font-medium transition-all ${
                          selectedPreset === preset.id && !useCustomColor ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''
                        }`}
                        style={{ backgroundColor: preset.primary }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Pipette className="h-4 w-4" />
                      Custom Colors
                    </Label>
                    <Switch checked={useCustomColor} onCheckedChange={setUseCustomColor} />
                  </div>
                  
                  {useCustomColor && (
                    <div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customPrimaryColor}
                          onChange={(e) => setCustomPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={customPrimaryColor}
                          onChange={(e) => setCustomPrimaryColor(e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customSecondaryColor}
                          onChange={(e) => setCustomSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={customSecondaryColor}
                          onChange={(e) => setCustomSecondaryColor(e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Generation Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Generate AI Cover Image</Label>
                      <p className="text-sm text-muted-foreground">Create a themed cover image</p>
                    </div>
                    <Switch checked={generateCoverImage} onCheckedChange={setGenerateCoverImage} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Generate Page Images</Label>
                      <p className="text-sm text-muted-foreground">Create AI line art for all pages (slower)</p>
                    </div>
                    <Switch checked={generatePageImages} onCheckedChange={setGeneratePageImages} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                    <div>
                      <Label className="text-blue-800 dark:text-blue-200">Enable Bleed (KDP Recommended)</Label>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Add 0.125&quot; bleed for edge-to-edge printing</p>
                    </div>
                    <Switch checked={useBleed} onCheckedChange={setUseBleed} />
                  </div>
                </div>

                {/* KDP Compliance Warning */}
                {pages.length < KDP_MIN_PAGES && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">KDP Page Count Warning</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Your book has {pages.length} pages. Amazon KDP requires minimum 24 pages.
                        Add {KDP_MIN_PAGES - pages.length} more pages to be KDP compliant.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <Label>Preview</Label>
                <div 
                  className="rounded-lg p-6 text-white flex flex-col justify-between shadow-xl"
                  style={{ 
                    backgroundColor: useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#6b21a8'),
                    aspectRatio: `${PAPER_SIZES.find(s => s.id === paperSize)?.width || 612} / ${PAPER_SIZES.find(s => s.id === paperSize)?.height || 792}`
                  }}
                >
                  <div className="text-center pt-8">
                    <h3 className="text-lg font-bold drop-shadow">{bookTitle || `${customTheme || selectedTheme?.name} Coloring Book`}</h3>
                    <p className="text-sm opacity-80 mt-2">{pages.length} Pages</p>
                    {authorName && <p className="text-xs opacity-70 mt-3">By {authorName}</p>}
                  </div>
                  <div className="text-center space-y-2">
                    <Badge variant="secondary" className="text-xs">{PAPER_SIZES.find(s => s.id === paperSize)?.name}</Badge>
                    <Badge variant="secondary" className="text-xs ml-2">{DIFFICULTY_LEVELS.find(l => l.id === difficulty)?.name}</Badge>
                    {useBleed && <Badge variant="secondary" className="text-xs ml-2">With Bleed</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Paper:</strong> {PAPER_SIZES.find(s => s.id === paperSize)?.name}</p>
                  <p><strong>Bleed:</strong> {useBleed ? '0.125" (KDP Standard)' : 'None'}</p>
                  <p><strong>Pages:</strong> {pages.length} {pages.length >= KDP_MIN_PAGES ? '✓ KDP Compliant' : `(Need ${KDP_MIN_PAGES - pages.length} more for KDP)`}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating PDF...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Coloring Book PDF</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Download */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Your Coloring Book is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedTheme?.icon || '🎨'}</div>
              <h3 className="text-xl font-bold">{result.title}</h3>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{DIFFICULTY_LEVELS.find(l => l.id === difficulty)?.name}</span>
              </div>
              
              <a href={result.downloadUrl} download className="inline-block">
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </Button>
              </a>
            </div>

            {/* Selling Tips */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Where to Sell Your Coloring Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Amazon KDP</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Print-on-demand paperbacks</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Etsy</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Instant download PDFs</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Gumroad</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Direct sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
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
