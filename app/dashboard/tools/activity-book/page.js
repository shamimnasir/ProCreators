'use client'

import { useState, useCallback } from 'react'
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
  Puzzle, Download, Sparkles, Loader2, DollarSign, Image,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  ChevronDown, ChevronUp, RefreshCw, Save, AlertTriangle,
  FileText, Grid3X3, Search, BookOpen, Gamepad2, Brain,
  Baby, GraduationCap, Users, Target, Palette
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Activity Book Types
const ACTIVITY_TYPES = [
  { id: 'puzzle', name: 'Puzzle Book', icon: Puzzle, description: 'Sudokus, crosswords, word searches' },
  { id: 'educational', name: 'Educational Workbook', icon: GraduationCap, description: 'Learning activities, math, spelling' },
  { id: 'game', name: 'Game Book', icon: Gamepad2, description: 'Would You Rather, travel games' },
  { id: 'coloring-activity', name: 'Coloring & Activity', icon: Palette, description: 'Mixed coloring and activities' },
  { id: 'brain', name: 'Brain Teasers', icon: Brain, description: 'Logic puzzles, riddles, mazes' },
  { id: 'mixed', name: 'Mixed Activities', icon: Target, description: 'Variety of different activities' }
]

// Activity Categories by Type
const ACTIVITIES_BY_TYPE = {
  puzzle: [
    { id: 'word-search', name: 'Word Search', icon: '🔍' },
    { id: 'crossword', name: 'Crossword Puzzle', icon: '✏️' },
    { id: 'sudoku', name: 'Sudoku', icon: '🔢' },
    { id: 'maze', name: 'Maze', icon: '🌀' },
    { id: 'spot-difference', name: 'Spot the Difference', icon: '👀' },
    { id: 'connect-dots', name: 'Connect the Dots', icon: '⭐' }
  ],
  educational: [
    { id: 'math', name: 'Math Problems', icon: '➕' },
    { id: 'spelling', name: 'Spelling Practice', icon: '📝' },
    { id: 'tracing', name: 'Letter/Number Tracing', icon: '✍️' },
    { id: 'matching', name: 'Matching Games', icon: '🎯' },
    { id: 'counting', name: 'Counting Activities', icon: '🔢' },
    { id: 'patterns', name: 'Pattern Recognition', icon: '🔷' }
  ],
  game: [
    { id: 'would-you-rather', name: 'Would You Rather', icon: '🤔' },
    { id: 'trivia', name: 'Trivia Questions', icon: '❓' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe Grids', icon: '⭕' },
    { id: 'hangman', name: 'Hangman', icon: '🎯' },
    { id: 'bingo', name: 'Bingo Cards', icon: '🎱' },
    { id: 'travel-games', name: 'Travel Games', icon: '✈️' }
  ],
  'coloring-activity': [
    { id: 'color-by-number', name: 'Color by Number', icon: '🎨' },
    { id: 'doodle-complete', name: 'Complete the Doodle', icon: '✏️' },
    { id: 'drawing-prompts', name: 'Drawing Prompts', icon: '🖼️' },
    { id: 'connect-color', name: 'Connect & Color', icon: '🔗' }
  ],
  brain: [
    { id: 'logic-puzzle', name: 'Logic Puzzles', icon: '🧠' },
    { id: 'riddles', name: 'Riddles', icon: '💭' },
    { id: 'maze-complex', name: 'Complex Mazes', icon: '🏰' },
    { id: 'memory', name: 'Memory Games', icon: '🃏' },
    { id: 'sequences', name: 'Number Sequences', icon: '📊' },
    { id: 'visual-puzzles', name: 'Visual Puzzles', icon: '👁️' }
  ],
  mixed: [
    { id: 'word-search', name: 'Word Search', icon: '🔍' },
    { id: 'maze', name: 'Maze', icon: '🌀' },
    { id: 'math', name: 'Math Problems', icon: '➕' },
    { id: 'trivia', name: 'Trivia', icon: '❓' },
    { id: 'color-by-number', name: 'Color by Number', icon: '🎨' },
    { id: 'riddles', name: 'Riddles', icon: '💭' }
  ]
}

// Themes/Niches
const THEMES = [
  { id: 'animals', name: 'Animals', icon: '🦁' },
  { id: 'nature', name: 'Nature & Outdoors', icon: '🌳' },
  { id: 'space', name: 'Space & Science', icon: '🚀' },
  { id: 'ocean', name: 'Ocean & Sea Life', icon: '🐠' },
  { id: 'dinosaurs', name: 'Dinosaurs', icon: '🦕' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗' },
  { id: 'fantasy', name: 'Fantasy & Magic', icon: '🧚' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'food', name: 'Food & Cooking', icon: '🍕' },
  { id: 'holidays', name: 'Holiday & Seasonal', icon: '🎄' },
  { id: 'travel', name: 'Travel & Adventure', icon: '✈️' },
  { id: 'custom', name: 'Custom Theme', icon: '✨' }
]

// Age Groups
const AGE_GROUPS = [
  { id: 'toddler', name: 'Toddlers (2-4)', icon: Baby, description: 'Simple, large activities' },
  { id: 'preschool', name: 'Preschool (4-6)', icon: Users, description: 'Basic puzzles, tracing' },
  { id: 'early', name: 'Early Elementary (6-8)', icon: BookOpen, description: 'Word searches, mazes' },
  { id: 'kids', name: 'Kids (8-12)', icon: Target, description: 'Moderate difficulty' },
  { id: 'teens', name: 'Teens (12+)', icon: GraduationCap, description: 'Challenging puzzles' },
  { id: 'adults', name: 'Adults', icon: Brain, description: 'Complex brain teasers' }
]

// KDP Paper Sizes
const PAPER_SIZES = [
  { id: '8.5x11', name: '8.5" × 11"', width: 612, height: 792, recommended: true, description: 'Standard - Best for activity books' },
  { id: '8x10', name: '8" × 10"', width: 576, height: 720, recommended: true, description: 'Premium feel' },
  { id: '8.5x8.5', name: '8.5" × 8.5" (Square)', width: 612, height: 612, recommended: false, description: 'Square format' },
  { id: '6x9', name: '6" × 9"', width: 432, height: 648, recommended: false, description: 'Compact travel size' },
  { id: '7x10', name: '7" × 10"', width: 504, height: 720, recommended: false, description: 'Common KDP size' }
]

// Color Themes
const COLOR_PRESETS = [
  { id: 'blue', name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6' },
  { id: 'purple', name: 'Royal Purple', primary: '#6b21a8', secondary: '#a855f7' },
  { id: 'green', name: 'Forest Green', primary: '#166534', secondary: '#22c55e' },
  { id: 'orange', name: 'Sunset Orange', primary: '#c2410c', secondary: '#f97316' },
  { id: 'pink', name: 'Candy Pink', primary: '#be185d', secondary: '#ec4899' },
  { id: 'teal', name: 'Ocean Teal', primary: '#0f766e', secondary: '#14b8a6' }
]

// KDP Requirements
const KDP_MIN_PAGES = 24

export default function ActivityBookPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const { toast } = useToast()

  // Step 1: Book Setup
  const [bookTitle, setBookTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [activityType, setActivityType] = useState('mixed')
  const [selectedActivities, setSelectedActivities] = useState([])
  const [theme, setTheme] = useState('animals')
  const [customTheme, setCustomTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('kids')
  const [pageCount, setPageCount] = useState(30)

  // Step 2: Pages (editable)
  const [pages, setPages] = useState([])
  const [expandedPage, setExpandedPage] = useState(null)

  // Step 3: Design
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [selectedPreset, setSelectedPreset] = useState('blue')
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#1e40af')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#3b82f6')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [generateCoverImage, setGenerateCoverImage] = useState(true)
  const [customCoverPrompt, setCustomCoverPrompt] = useState('')
  const [useBleed, setUseBleed] = useState(true)
  const [includeAnswers, setIncludeAnswers] = useState(true)

  // Result
  const [result, setResult] = useState(null)

  // Get available activities based on type
  const availableActivities = ACTIVITIES_BY_TYPE[activityType] || ACTIVITIES_BY_TYPE.mixed

  // Get current data for drafts
  const getCurrentData = () => ({
    title: bookTitle || `${customTheme || theme} Activity Book`,
    bookTitle,
    authorName,
    activityType,
    selectedActivities,
    theme,
    customTheme,
    ageGroup,
    pageCount,
    pages,
    paperSize,
    selectedPreset,
    customPrimaryColor,
    customSecondaryColor,
    useCustomColor,
    generateCoverImage,
    customCoverPrompt,
    useBleed,
    includeAnswers,
    step
  })

  // Load draft data
  const loadDraftData = (data) => {
    if (data.bookTitle) setBookTitle(data.bookTitle)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.activityType) setActivityType(data.activityType)
    if (data.selectedActivities) setSelectedActivities(data.selectedActivities)
    if (data.theme) setTheme(data.theme)
    if (data.customTheme !== undefined) setCustomTheme(data.customTheme)
    if (data.ageGroup) setAgeGroup(data.ageGroup)
    if (data.pageCount) setPageCount(data.pageCount)
    if (data.pages) setPages(data.pages)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.useCustomColor !== undefined) setUseCustomColor(data.useCustomColor)
    if (data.generateCoverImage !== undefined) setGenerateCoverImage(data.generateCoverImage)
    if (data.customCoverPrompt !== undefined) setCustomCoverPrompt(data.customCoverPrompt)
    if (data.useBleed !== undefined) setUseBleed(data.useBleed)
    if (data.includeAnswers !== undefined) setIncludeAnswers(data.includeAnswers)
    if (data.step && data.step > 1) setStep(Math.min(data.step, 3))
    setResult(null)
  }

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setBookTitle('')
    setAuthorName('')
    setActivityType('mixed')
    setSelectedActivities([])
    setTheme('animals')
    setCustomTheme('')
    setAgeGroup('kids')
    setPageCount(30)
    setPages([])
    setPaperSize('8.5x11')
    setSelectedPreset('blue')
    setUseCustomColor(false)
    setGenerateCoverImage(true)
    setCustomCoverPrompt('')
    setUseBleed(true)
    setIncludeAnswers(true)
    setResult(null)
  }

  // Toggle activity selection
  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => {
      // If nothing selected (all selected by default), clicking one means "select all except this"
      if (prev.length === 0) {
        return availableActivities.filter(a => a.id !== activityId).map(a => a.id)
      }
      // Otherwise toggle as normal
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId)
      }
      return [...prev, activityId]
    })
  }

  // Generate activity pages with AI
  const generatePages = async () => {
    if (theme === 'custom' && !customTheme.trim()) {
      toast({ title: "Custom Theme Required", description: "Please enter your custom theme", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/activity-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pages',
          activityType,
          selectedActivities: selectedActivities.length > 0 ? selectedActivities : availableActivities.map(a => a.id),
          theme,
          customTheme: theme === 'custom' ? customTheme : null,
          ageGroup,
          pageCount,
          bookTitle
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setPages(data.pages || [])
      setStep(2)
      toast({ title: "Activities Generated!", description: `${data.pages?.length || pageCount} activity pages created. Edit them below!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate final PDF
  const generatePDF = async () => {
    if (pages.length === 0) {
      toast({ title: "No Pages", description: "Please add at least one page", variant: "destructive" })
      return
    }

    if (pages.length < KDP_MIN_PAGES) {
      const proceed = confirm(`Your book has ${pages.length} pages. Amazon KDP requires minimum 24 pages. Continue anyway?`)
      if (!proceed) return
    }

    setLoading(true)
    try {
      const primaryColor = useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af')
      const secondaryColor = useCustomColor ? customSecondaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.secondary || '#3b82f6')
      const selectedSize = PAPER_SIZES.find(s => s.id === paperSize)

      const response = await fetch('/api/activity-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          activityType,
          selectedActivities,
          theme,
          customTheme: theme === 'custom' ? customTheme : null,
          ageGroup,
          pages,
          title: bookTitle || `${customTheme || THEMES.find(t => t.id === theme)?.name || theme} Activity Book`,
          authorName,
          primaryColor,
          secondaryColor,
          generateCover: generateCoverImage,
          customCoverPrompt: customCoverPrompt.trim() || null,
          paperSize: {
            id: paperSize,
            width: selectedSize?.width || 612,
            height: selectedSize?.height || 792,
            name: selectedSize?.name || '8.5" × 11"'
          },
          useBleed,
          bleed: useBleed ? 0.125 : 0,
          includeAnswers
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Activity Book Ready!", description: `${data.pageCount} page activity book created!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Page management
  const addPage = () => {
    const defaultActivity = availableActivities[0] || { id: 'puzzle', name: 'Puzzle' }
    setPages([...pages, {
      title: `Activity ${pages.length + 1}`,
      activityType: defaultActivity.id,
      description: 'Describe the activity...',
      difficulty: 'medium',
      content: {}
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

  const selectedTheme = THEMES.find(t => t.id === theme)
  const ActivityTypeIcon = ACTIVITY_TYPES.find(t => t.id === activityType)?.icon || Puzzle

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-blue-500" />
            Activity Book Creator
          </h1>
          <p className="text-muted-foreground">Create KDP-ready activity books with puzzles, games & educational content</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Sell for $8-$20
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => {
          const canNavigate = s < step || 
            (s === 2 && pages.length > 0) || 
            (s === 3 && pages.length > 0) ||
            (s === 4 && result)
          
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
              {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        {['Setup', 'Edit Activities', 'Design', 'Download'].map((label, idx) => (
          <span key={label} className={step === idx + 1 ? 'text-primary font-medium' : ''}>{label}</span>
        ))}
      </div>

      {/* Step 1: Book Setup */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Step 1: Activity Book Setup
                </CardTitle>
                <CardDescription>Configure your activity book type and theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Book Title & Author */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Book Title (Optional)</Label>
                    <Input
                      placeholder="e.g., Amazing Animals Activity Fun"
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

                {/* Activity Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Activity Book Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ACTIVITY_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            setActivityType(type.id)
                            setSelectedActivities([])
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            activityType === type.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="h-6 w-6 mb-2 text-muted-foreground" />
                          <div className="font-medium text-sm">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Activity Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Activities to Include</Label>
                  <p className="text-sm text-muted-foreground">
                    Click to select/deselect. Selected activities will be distributed across pages.
                    {selectedActivities.length === 0 && <span className="text-blue-600 ml-1">(All activities selected by default)</span>}
                    {selectedActivities.length > 0 && selectedActivities.length < 3 && (
                      <span className="text-amber-600 ml-1">(Select at least 3 for variety)</span>
                    )}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedActivities(availableActivities.map(a => a.id))}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedActivities([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableActivities.map((activity) => {
                      const isSelected = selectedActivities.length === 0 || selectedActivities.includes(activity.id)
                      return (
                        <button
                          key={activity.id}
                          onClick={() => toggleActivity(activity.id)}
                          className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 opacity-60'
                          }`}
                        >
                          <span className="text-lg">{activity.icon}</span>
                          <span className="text-sm font-medium">{activity.name}</span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Theme / Niche</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          theme === t.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{t.icon}</div>
                        <div className="text-xs font-medium truncate">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Theme Input */}
                {theme === 'custom' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 space-y-3">
                    <Label className="text-blue-700 dark:text-blue-300 font-medium">
                      Enter Your Custom Theme/Niche
                    </Label>
                    <Input
                      placeholder="e.g., Baseball, Princesses, Construction Vehicles..."
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Be specific! The more detailed your niche, the better your activities will be.
                    </p>
                  </div>
                )}

                {/* Age Group & Page Count */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Age Group</Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((age) => (
                          <SelectItem key={age.id} value={age.id}>
                            <span className="font-medium">{age.name}</span>
                            <span className="text-muted-foreground ml-2">- {age.description}</span>
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
                      max={60}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amazon KDP requires minimum 24 pages for activity books
                    </p>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={generatePages} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Activities...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate {pageCount} Activity Pages</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Drafts Panel */}
          <div className="lg:col-span-1">
            <AutoSaveDraftsManager
              toolType="activity-book"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[bookTitle, authorName, activityType, selectedActivities, theme, customTheme, ageGroup, pageCount, pages, selectedPreset, step]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={step}
            />
          </div>
        </div>
      )}

      {/* Step 2: Edit Activities */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-green-500" />
                    Step 2: Edit Your Activities
                  </CardTitle>
                  <CardDescription>Customize each activity page</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addPage}>
                    <Plus className="h-4 w-4 mr-1" /> Add Activity
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
                  <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activities yet. Click &quot;Add Activity&quot; to create one.</p>
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
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            {availableActivities.find(a => a.id === page.activityType)?.name || page.activityType}
                          </Badge>
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
                                <Label>Activity Title</Label>
                                <Input
                                  value={page.title}
                                  onChange={(e) => updatePage(idx, 'title', e.target.value)}
                                  placeholder="e.g., Animal Word Search"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Activity Type</Label>
                                <Select 
                                  value={page.activityType} 
                                  onValueChange={(v) => updatePage(idx, 'activityType', v)}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {availableActivities.map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.icon} {a.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select 
                                  value={page.difficulty} 
                                  onValueChange={(v) => updatePage(idx, 'difficulty', v)}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Activity Description / Instructions</Label>
                              <Textarea
                                value={page.description}
                                onChange={(e) => updatePage(idx, 'description', e.target.value)}
                                placeholder="Describe the activity or add custom instructions..."
                                rows={6}
                              />
                            </div>
                          </div>

                          {/* Activity-specific content preview */}
                          {page.content && Object.keys(page.content).length > 0 && (
                            <div className="p-3 bg-muted rounded-lg">
                              <Label className="text-sm">Generated Content Preview</Label>
                              <pre className="text-xs mt-2 overflow-auto max-h-32">
                                {JSON.stringify(page.content, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
              Step 3: Design & Settings
            </CardTitle>
            <CardDescription>Configure paper size, colors, and export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Paper Size Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paper Size (KDP Standard)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
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
                    <Label>Custom Colors</Label>
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

                {/* Options */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Generate AI Cover Image</Label>
                        <p className="text-sm text-muted-foreground">Create a themed cover image</p>
                      </div>
                      <Switch checked={generateCoverImage} onCheckedChange={setGenerateCoverImage} />
                    </div>
                    
                    {generateCoverImage && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-sm">Custom Cover Prompt (Optional)</Label>
                        <Textarea
                          placeholder="e.g., A colorful puzzle book cover with animals and fun patterns..."
                          value={customCoverPrompt}
                          onChange={(e) => setCustomCoverPrompt(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Include Answer Pages</Label>
                      <p className="text-sm text-muted-foreground">Add answer key at the end</p>
                    </div>
                    <Switch checked={includeAnswers} onCheckedChange={setIncludeAnswers} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                    <div>
                      <Label className="text-blue-800 dark:text-blue-200">Enable Bleed (KDP Recommended)</Label>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Add 0.125&quot; bleed for printing</p>
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
                    backgroundColor: useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af'),
                    aspectRatio: `${PAPER_SIZES.find(s => s.id === paperSize)?.width || 612} / ${PAPER_SIZES.find(s => s.id === paperSize)?.height || 792}`
                  }}
                >
                  <div className="text-center pt-8">
                    <div className="text-5xl mb-4">{selectedTheme?.icon || '🎯'}</div>
                    <h3 className="text-lg font-bold drop-shadow">
                      {bookTitle || `${customTheme || selectedTheme?.name} Activity Book`}
                    </h3>
                    <p className="text-sm opacity-80 mt-2">{pages.length} Activities</p>
                    {authorName && <p className="text-xs opacity-70 mt-3">By {authorName}</p>}
                  </div>
                  <div className="text-center space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {PAPER_SIZES.find(s => s.id === paperSize)?.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {AGE_GROUPS.find(a => a.id === ageGroup)?.name}
                    </Badge>
                    {useBleed && <Badge variant="secondary" className="text-xs ml-2">With Bleed</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {ACTIVITY_TYPES.find(t => t.id === activityType)?.name}</p>
                  <p><strong>Paper:</strong> {PAPER_SIZES.find(s => s.id === paperSize)?.name}</p>
                  <p><strong>Pages:</strong> {pages.length} {pages.length >= KDP_MIN_PAGES ? '✓ KDP Compliant' : `(Need ${KDP_MIN_PAGES - pages.length} more for KDP)`}</p>
                  <p><strong>Answer Key:</strong> {includeAnswers ? 'Included' : 'Not included'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Activity Book PDF...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Activity Book PDF</>
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
              Your Activity Book is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedTheme?.icon || '🎯'}</div>
              <h3 className="text-xl font-bold">{result.title}</h3>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{ACTIVITY_TYPES.find(t => t.id === activityType)?.name}</span>
                <span>•</span>
                <span>{AGE_GROUPS.find(a => a.id === ageGroup)?.name}</span>
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
                  Where to Sell Your Activity Book
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
                    <p className="text-sm text-amber-700 dark:text-amber-300">Digital downloads (PDFs)</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Teachers Pay Teachers</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Educational activities</p>
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
