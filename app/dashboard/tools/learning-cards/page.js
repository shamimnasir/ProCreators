'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Download, ArrowLeft, ArrowRight, Sparkles, CheckCircle,
  FolderOpen, Save, Clock, Trash2, Edit3, FilePlus, BookMarked,
  Plus, FlipVertical, Layers, Palette, BookOpen, GraduationCap,
  Brain, Target, Lightbulb, X, Copy, Eye, RotateCcw, Scissors,
  FileText, AlignLeft, Grid, Minus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Pack Creation Modes
const CREATION_MODES = [
  {
    id: 'educational',
    name: 'Educational Flashcards',
    icon: GraduationCap,
    description: 'Create flashcards with Q&A content using AI or manual input',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'blank-template',
    name: 'Blank/Lined Templates',
    icon: FileText,
    description: 'Generate 300-1000+ pages of blank or lined flashcard templates for KDP',
    color: 'from-emerald-500 to-teal-600'
  }
]

// Blank/Lined Template Styles
const TEMPLATE_STYLES = [
  { id: 'blank', name: 'Blank', description: 'Completely blank cards', icon: Grid },
  { id: 'lined', name: 'Lined', description: 'Horizontal lines on both sides', icon: AlignLeft },
  { id: 'ruled-blank', name: 'Ruled Front / Blank Back', description: 'Lines on front, blank on back', icon: FileText },
  { id: 'dotted', name: 'Dotted Grid', description: 'Dot grid pattern for flexibility', icon: Grid }
]

// Card Colors for Templates
const CARD_COLORS = [
  { id: 'white', name: 'White', hex: '#ffffff', border: '#e5e7eb' },
  { id: 'cream', name: 'Cream', hex: '#fef9e7', border: '#fde68a' },
  { id: 'pink', name: 'Pastel Pink', hex: '#fce7f3', border: '#f9a8d4' },
  { id: 'blue', name: 'Pastel Blue', hex: '#dbeafe', border: '#93c5fd' },
  { id: 'green', name: 'Pastel Green', hex: '#dcfce7', border: '#86efac' },
  { id: 'yellow', name: 'Pastel Yellow', hex: '#fef9c3', border: '#fde047' },
  { id: 'purple', name: 'Pastel Purple', hex: '#f3e8ff', border: '#d8b4fe' },
  { id: 'assorted', name: 'Assorted Colors', hex: 'assorted', border: '#94a3b8' }
]

// Index Card Sizes (for blank templates)
const INDEX_CARD_SIZES = [
  { id: '3x5', name: '3" x 5"', width: 3, height: 5, description: 'Standard index card size', popular: true },
  { id: '4x6', name: '4" x 6"', width: 4, height: 6, description: 'Larger index card size', popular: true },
  { id: '5x7', name: '5" x 7"', width: 5, height: 7, description: 'Extra large cards', popular: false }
]

// KDP Compliant Sizes for Flashcard Books
const KDP_SIZES = [
  { 
    id: '6x9', 
    name: '6" x 9" (Standard)', 
    width: 6, 
    height: 9,
    description: 'Multiple smaller flashcards per page',
    cardsPerPage: 4,
    recommended: true
  },
  { 
    id: '8.5x11', 
    name: '8.5" x 11" (Letter)', 
    width: 8.5, 
    height: 11,
    description: 'Ideal for larger cards, classroom use',
    cardsPerPage: 4,
    recommended: false
  },
  { 
    id: '5x8', 
    name: '5" x 8" (Compact)', 
    width: 5, 
    height: 8,
    description: 'Portable size, 2 cards per page',
    cardsPerPage: 2,
    recommended: false
  }
]

// Paper/Ink Options
const PAPER_OPTIONS = [
  {
    id: 'black-white',
    name: 'Black Ink on White Paper',
    description: 'Most cost-effective, ideal for text-based cards',
    minPages: 24,
    color: false
  },
  {
    id: 'standard-color',
    name: 'Standard Color',
    description: 'Affordable color, 50-61 lb paper',
    minPages: 72,
    color: true
  },
  {
    id: 'premium-color',
    name: 'Premium Color',
    description: 'Best quality, 60-71 lb paper, vibrant images',
    minPages: 24,
    color: true,
    recommended: true
  }
]

// Color Themes
const COLOR_THEMES = [
  { id: 'classic', name: 'Classic Blue', front: '#1e40af', back: '#3b82f6', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'forest', name: 'Forest Green', front: '#166534', back: '#22c55e', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'sunset', name: 'Sunset Orange', front: '#c2410c', back: '#f97316', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'royal', name: 'Royal Purple', front: '#6b21a8', back: '#a855f7', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'rose', name: 'Rose Pink', front: '#be185d', back: '#ec4899', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'slate', name: 'Slate Gray', front: '#334155', back: '#64748b', textFront: '#ffffff', textBack: '#ffffff' },
  { id: 'minimal', name: 'Minimal B&W', front: '#1a1a1a', back: '#ffffff', textFront: '#ffffff', textBack: '#1a1a1a' }
]

// Background Designs for Educational Cards
const BACKGROUND_DESIGNS = [
  { id: 'solid', name: 'Solid Color', description: 'Clean solid background' },
  { id: 'gradient', name: 'Gradient', description: 'Smooth color gradient' },
  { id: 'dots', name: 'Dotted Pattern', description: 'Subtle dot pattern' },
  { id: 'lines', name: 'Line Pattern', description: 'Horizontal line pattern' },
  { id: 'grid', name: 'Grid Pattern', description: 'Subtle grid pattern' },
  { id: 'stars', name: 'Stars (Kids)', description: 'Star pattern for children' },
  { id: 'hearts', name: 'Hearts', description: 'Heart pattern design' },
  { id: 'nature', name: 'Nature', description: 'Leaf/nature pattern' },
  { id: 'science', name: 'Science', description: 'Atom/science pattern' },
  { id: 'math', name: 'Math Symbols', description: 'Math symbol pattern' }
]

// Flashcard Categories
const FLASHCARD_CATEGORIES = [
  { id: 'vocabulary', name: 'Vocabulary', icon: '📚', description: 'Word definitions and meanings' },
  { id: 'language', name: 'Language Learning', icon: '🌍', description: 'Foreign language practice' },
  { id: 'math', name: 'Math & Numbers', icon: '🔢', description: 'Math facts and formulas' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Scientific concepts and facts' },
  { id: 'history', name: 'History', icon: '📜', description: 'Historical events and dates' },
  { id: 'trivia', name: 'Trivia & Fun', icon: '🎯', description: 'Fun facts and general knowledge' },
  { id: 'study', name: 'Study Guide', icon: '📖', description: 'Custom study material' },
  { id: 'kids', name: 'Kids Learning', icon: '🧒', description: 'Educational content for children' }
]

export default function FlashcardMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  const [isHydrated, setIsHydrated] = useState(false)

  // Drafts
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [showDrafts, setShowDrafts] = useState(false)

  // Step 1: Pack Configuration
  const [packTitle, setPackTitle] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [category, setCategory] = useState('')
  const [kdpSize, setKdpSize] = useState('6x9')
  const [paperOption, setPaperOption] = useState('premium-color')
  const [colorTheme, setColorTheme] = useState('classic')

  // Step 2: Flashcards
  const [flashcards, setFlashcards] = useState([{ front: '', back: '', id: Date.now() }])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  // Step 3: AI Generation
  const [aiTopic, setAiTopic] = useState('')
  const [aiCount, setAiCount] = useState(20)
  const [aiDifficulty, setAiDifficulty] = useState('medium')

  // Step 4: Preview & Export
  const [includeInstructions, setIncludeInstructions] = useState(true)
  const [includeCutGuides, setIncludeCutGuides] = useState(true)
  const [result, setResult] = useState(null)

  // Creation Mode Selection
  const [creationMode, setCreationMode] = useState('educational')
  
  // Blank Template Settings
  const [templateStyle, setTemplateStyle] = useState('blank')
  const [cardColor, setCardColor] = useState('white')
  const [indexCardSize, setIndexCardSize] = useState('3x5')
  const [pageCount, setPageCount] = useState(300)
  const [includeTitle, setIncludeTitle] = useState(true)
  const [customTitle, setCustomTitle] = useState('')
  const [backgroundDesign, setBackgroundDesign] = useState('solid')

  // Get current template data
  const getCurrentData = () => ({
    packTitle,
    packDescription,
    category,
    kdpSize,
    paperOption,
    colorTheme,
    flashcards,
    includeInstructions,
    includeCutGuides,
    step,
    creationMode,
    templateStyle,
    cardColor,
    indexCardSize,
    pageCount,
    includeTitle,
    customTitle,
    backgroundDesign
  })

  // Load template data
  const loadData = (data) => {
    if (data.packTitle) setPackTitle(data.packTitle)
    if (data.packDescription) setPackDescription(data.packDescription)
    if (data.category) setCategory(data.category)
    if (data.kdpSize) setKdpSize(data.kdpSize)
    if (data.paperOption) setPaperOption(data.paperOption)
    if (data.colorTheme) setColorTheme(data.colorTheme)
    if (data.flashcards?.length) setFlashcards(data.flashcards)
    if (data.includeInstructions !== undefined) setIncludeInstructions(data.includeInstructions)
    if (data.includeCutGuides !== undefined) setIncludeCutGuides(data.includeCutGuides)
    if (data.step) setStep(data.step)
    if (data.creationMode) setCreationMode(data.creationMode)
    if (data.templateStyle) setTemplateStyle(data.templateStyle)
    if (data.cardColor) setCardColor(data.cardColor)
    if (data.indexCardSize) setIndexCardSize(data.indexCardSize)
    if (data.pageCount) setPageCount(data.pageCount)
    if (data.includeTitle !== undefined) setIncludeTitle(data.includeTitle)
    if (data.customTitle) setCustomTitle(data.customTitle)
    if (data.backgroundDesign) setBackgroundDesign(data.backgroundDesign)
  }

  // Load drafts from DB
  useEffect(() => {
    const loadDraftsFromDB = async () => {
      try {
        const res = await fetch('/api/flashcards/drafts')
        const data = await res.json()
        if (data.success && data.drafts) {
          setDrafts(data.drafts)
        }
      } catch (e) {
        console.log('Failed to load drafts:', e)
      }
    }
    
    loadDraftsFromDB()

    // Load current progress from localStorage
    const currentProgress = localStorage.getItem('flashcard-progress')
    if (currentProgress) {
      try {
        const data = JSON.parse(currentProgress)
        loadData(data)
        if (data.draftId) setCurrentDraftId(data.draftId)
        if (data.packTitle) {
          toast({ 
            title: "Progress Restored", 
            description: `Continuing "${data.packTitle}"` 
          })
        }
      } catch (e) {
        console.log('Failed to restore progress:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Auto-save progress
  useEffect(() => {
    if (!isHydrated) return
    const saveData = {
      ...getCurrentData(),
      draftId: currentDraftId,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('flashcard-progress', JSON.stringify(saveData))
  }, [isHydrated, packTitle, packDescription, category, kdpSize, paperOption, colorTheme, flashcards, includeInstructions, includeCutGuides, step, currentDraftId, creationMode, templateStyle, cardColor, indexCardSize, pageCount, includeTitle, customTitle])

  // Save draft to DB
  const saveDraft = async () => {
    const draftTitle = packTitle || 'Untitled Flashcard Pack'
    const draftData = {
      id: currentDraftId || undefined,
      title: draftTitle,
      subtitle: `${flashcards.length} cards`,
      step,
      data: getCurrentData()
    }
    
    try {
      const res = await fetch('/api/flashcards/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      })
      
      const result = await res.json()
      
      if (result.success) {
        const draftsRes = await fetch('/api/flashcards/drafts')
        const draftsData = await draftsRes.json()
        if (draftsData.success) setDrafts(draftsData.drafts)
        setCurrentDraftId(result.id)
        toast({ title: "Draft Saved!", description: `"${draftTitle}" saved.` })
      }
    } catch (error) {
      toast({ title: "Save Failed", variant: "destructive" })
    }
  }

  // Load draft
  const loadDraft = (draft) => {
    loadData(draft.data)
    setCurrentDraftId(draft.id)
    setShowDrafts(false)
    toast({ title: "Draft Loaded", description: `Editing "${draft.title}"` })
  }

  // Delete draft
  const deleteDraft = async (draftId) => {
    try {
      await fetch(`/api/flashcards/drafts?id=${draftId}`, { method: 'DELETE' })
      setDrafts(drafts.filter(d => d.id !== draftId))
      if (currentDraftId === draftId) setCurrentDraftId(null)
      toast({ title: "Draft Deleted" })
    } catch (error) {
      toast({ title: "Delete Failed", variant: "destructive" })
    }
  }

  // Start new
  const startNew = () => {
    localStorage.removeItem('flashcard-progress')
    setPackTitle('')
    setPackDescription('')
    setCategory('')
    setKdpSize('6x9')
    setPaperOption('premium-color')
    setColorTheme('classic')
    setFlashcards([{ front: '', back: '', id: Date.now() }])
    setCurrentCardIndex(0)
    setShowBack(false)
    setAiTopic('')
    setAiCount(20)
    setResult(null)
    setStep(1)
    setCurrentDraftId(null)
    setShowDrafts(false)
    setCreationMode('educational')
    setTemplateStyle('blank')
    setCardColor('white')
    setIndexCardSize('3x5')
    setPageCount(300)
    setIncludeTitle(true)
    setCustomTitle('')
    setTimeout(() => localStorage.removeItem('flashcard-progress'), 100)
    toast({ title: "Ready for New Pack", description: "Starting fresh!" })
  }

  // Add flashcard
  const addFlashcard = () => {
    setFlashcards([...flashcards, { front: '', back: '', id: Date.now() }])
    setCurrentCardIndex(flashcards.length)
    setShowBack(false)
  }

  // Remove flashcard
  const removeFlashcard = (index) => {
    if (flashcards.length <= 1) return
    const updated = flashcards.filter((_, i) => i !== index)
    setFlashcards(updated)
    if (currentCardIndex >= updated.length) {
      setCurrentCardIndex(updated.length - 1)
    }
  }

  // Update flashcard
  const updateFlashcard = (index, field, value) => {
    const updated = [...flashcards]
    updated[index] = { ...updated[index], [field]: value }
    setFlashcards(updated)
  }

  // Duplicate flashcard
  const duplicateFlashcard = (index) => {
    const card = flashcards[index]
    const newCard = { ...card, id: Date.now() }
    const updated = [...flashcards]
    updated.splice(index + 1, 0, newCard)
    setFlashcards(updated)
    toast({ title: "Card Duplicated" })
  }

  // Generate flashcards with AI
  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          count: aiCount,
          difficulty: aiDifficulty,
          category,
          useAI: true
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Add generated cards to existing cards
      const newCards = data.flashcards.map(card => ({
        ...card,
        id: Date.now() + Math.random()
      }))
      
      setFlashcards([...flashcards.filter(c => c.front || c.back), ...newCards])
      
      const sourceText = data.source === 'ai' ? 'AI-generated' : 'curated'
      toast({ 
        title: "Cards Generated!", 
        description: `Added ${newCards.length} ${sourceText} flashcards on "${aiTopic}"` 
      })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate PDF
  const generatePDF = async () => {
    const validCards = flashcards.filter(c => c.front.trim() && c.back.trim())
    if (validCards.length < 1) {
      toast({ title: "Add flashcards first", variant: "destructive" })
      return
    }

    // Check minimum page requirement - show warning but don't block
    const selectedPaper = PAPER_OPTIONS.find(p => p.id === paperOption)
    const selectedSize = KDP_SIZES.find(s => s.id === kdpSize)
    const cardsPerPage = selectedSize?.cardsPerPage || 4
    const totalPages = Math.ceil(validCards.length * 2 / cardsPerPage) + 4 // +4 for cover, instructions, etc.
    
    if (totalPages < selectedPaper.minPages) {
      const neededCards = Math.ceil((selectedPaper.minPages - 4) * cardsPerPage / 2)
      toast({ 
        title: "Note: Below KDP minimum", 
        description: `${selectedPaper.name} typically requires ${selectedPaper.minPages} pages. Your PDF will have ${totalPages} pages. You may need to add more content for KDP publishing.`,
        variant: "default",
        duration: 5000
      })
    }

    setLoading(true)
    try {
      const response = await fetch('/api/flashcards/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: packTitle || 'Flashcard Pack',
          description: packDescription,
          category,
          flashcards: validCards,
          kdpSize,
          paperOption,
          colorTheme: COLOR_THEMES.find(t => t.id === colorTheme),
          backgroundDesign,
          includeInstructions,
          includeCutGuides
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      await complete(creditResult.transactionId)
        toast({ title: "PDF Generated!", description: "Your KDP-ready flashcard book is ready" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate Blank Template PDF
  const generateBlankTemplate = async () => {
    if (!packTitle.trim() && !customTitle.trim()) {
      toast({ title: "Enter a title", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/flashcards/generate-blank-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle || packTitle || 'Blank Flashcard Templates',
          templateStyle,
          cardColor: CARD_COLORS.find(c => c.id === cardColor),
          indexCardSize: INDEX_CARD_SIZES.find(s => s.id === indexCardSize),
          pageCount,
          includeTitle,
          kdpSize,
          paperOption
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Template Generated!", description: `${pageCount} pages of ${templateStyle} templates ready` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const selectedSize = KDP_SIZES.find(s => s.id === kdpSize)
  const selectedPaper = PAPER_OPTIONS.find(p => p.id === paperOption)
  const selectedTheme = COLOR_THEMES.find(t => t.id === colorTheme)
  const validCardCount = flashcards.filter(c => c.front.trim() && c.back.trim()).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/students-teachers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlipVertical className="h-6 w-6 text-primary" />
            Flashcard Pack Creator
          </h1>
          <p className="text-muted-foreground">Create KDP-compliant flashcard books for learning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDrafts(!showDrafts)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Drafts {drafts.length > 0 && `(${drafts.length})`}
          </Button>
          {packTitle && (
            <Button variant="outline" size="sm" onClick={saveDraft}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          )}
          <Button variant="default" size="sm" onClick={startNew}>
            <FilePlus className="h-4 w-4 mr-2" /> New
          </Button>
        </div>
      </div>

      {/* Drafts Panel */}
      {showDrafts && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" /> Saved Drafts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDrafts(false)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved drafts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div key={draft.id} className={`p-4 rounded-lg border bg-card hover:bg-muted/50 ${currentDraftId === draft.id ? 'border-primary ring-1 ring-primary' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => loadDraft(draft)}>
                        <h4 className="font-semibold">{draft.title}</h4>
                        {draft.subtitle && <p className="text-sm text-muted-foreground">{draft.subtitle}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </span>
                          <Badge variant="secondary">Step {draft.step}/4</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => loadDraft(draft)}>
                          <Edit3 className="h-3 w-3 mr-1" /> Open
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDraft(draft.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {(creationMode === 'educational' ? [1, 2, 3, 4] : [1, 4]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => s < step && creationMode === 'educational' && setStep(s)}
              disabled={s > step || creationMode === 'blank-template'}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              } ${s < step && creationMode === 'educational' ? 'cursor-pointer hover:scale-110' : s > step || creationMode === 'blank-template' ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </button>
            {idx < (creationMode === 'educational' ? 3 : 1) && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-12 text-xs text-muted-foreground">
        {(creationMode === 'educational' ? ['Setup', 'Cards', 'Generate', 'Export'] : ['Setup', 'Export']).map((label, idx) => {
          const stepNum = creationMode === 'educational' ? idx + 1 : (idx === 0 ? 1 : 4)
          return (
            <span key={label} className={step === stepNum ? 'text-primary font-medium' : ''}>{label}</span>
          )
        })}
      </div>

      {/* Step 1: Setup */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Step 1: Pack Configuration
            </CardTitle>
            <CardDescription>Configure your flashcard book settings for KDP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Creation Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choose Creation Mode</Label>
              <div className="grid md:grid-cols-2 gap-4">
                {CREATION_MODES.map((mode) => {
                  const IconComponent = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setCreationMode(mode.id)}
                      className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                        creationMode === mode.id 
                          ? 'border-primary bg-gradient-to-br ' + mode.color + ' text-white shadow-lg' 
                          : 'border-gray-200 hover:border-primary/50 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${creationMode === mode.id ? 'bg-white/20' : 'bg-primary/10'}`}>
                          <IconComponent className={`h-6 w-6 ${creationMode === mode.id ? 'text-white' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg mb-2 ${creationMode === mode.id ? 'text-white' : 'text-gray-900'}`}>
                            {mode.name}
                          </h3>
                          <p className={`text-sm ${creationMode === mode.id ? 'text-white/90' : 'text-gray-600'}`}>
                            {mode.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Show different content based on creation mode */}
            {creationMode === 'educational' && (
              <>
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pack Title *</Label>
                <Input
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  placeholder="e.g., Spanish Vocabulary Flashcards"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  placeholder="Learn 500 essential Spanish words"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label>Category</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {FLASHCARD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      category === cat.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="font-medium text-sm mt-1">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* KDP Size */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Scissors className="h-4 w-4" /> KDP Book Size
              </Label>
              <div className="grid md:grid-cols-3 gap-3">
                {KDP_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setKdpSize(size.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      kdpSize === size.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{size.name}</span>
                      {size.recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{size.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{size.cardsPerPage} cards per page</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Option */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Paper & Ink Option
              </Label>
              <div className="grid md:grid-cols-3 gap-3">
                {PAPER_OPTIONS.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setPaperOption(paper.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      paperOption === paper.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{paper.name}</span>
                      {paper.recommended && <Badge variant="secondary" className="text-xs">Best</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{paper.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Min: {paper.minPages} pages</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Card Color Theme
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      colorTheme === theme.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex">
                      <div className="w-4 h-4 rounded-l" style={{ backgroundColor: theme.front }} />
                      <div className="w-4 h-4 rounded-r" style={{ backgroundColor: theme.back }} />
                    </div>
                    <span className="text-sm">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Design */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Background Design
              </Label>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_DESIGNS.map((design) => (
                  <button
                    key={design.id}
                    onClick={() => setBackgroundDesign(design.id)}
                    className={`px-3 py-2 rounded-lg border transition-all ${
                      backgroundDesign === design.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm">{design.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a background pattern for your flashcards. Patterns like Stars, Hearts, and Math Symbols are great for themed decks.
              </p>
            </div>
              </>
            )}

            {/* Blank Template Configuration */}
            {creationMode === 'blank-template' && (
              <>
                {/* Template Title */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Title *</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Blank Index Cards for Study"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Page Count</Label>
                    <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">300 pages</SelectItem>
                        <SelectItem value="500">500 pages</SelectItem>
                        <SelectItem value="750">750 pages</SelectItem>
                        <SelectItem value="1000">1000 pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Template Style */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Grid className="h-4 w-4" /> Template Style
                  </Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {TEMPLATE_STYLES.map((style) => {
                      const IconComponent = style.icon
                      return (
                        <button
                          key={style.id}
                          onClick={() => setTemplateStyle(style.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            templateStyle === style.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{style.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{style.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Index Card Size */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" /> Index Card Size
                  </Label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {INDEX_CARD_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setIndexCardSize(size.id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          indexCardSize === size.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{size.name}</span>
                          {size.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{size.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Colors */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Card Colors
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setCardColor(color.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          cardColor === color.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ 
                            backgroundColor: color.hex === 'assorted' ? '#f3f4f6' : color.hex,
                            borderColor: color.border,
                            backgroundImage: color.hex === 'assorted' ? 'linear-gradient(45deg, #fce7f3 25%, #dbeafe 25%, #dbeafe 50%, #dcfce7 50%, #dcfce7 75%, #fef9c3 75%)' : 'none'
                          }} 
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => {
                if (creationMode === 'educational') {
                  setStep(2)
                } else {
                  generateBlankTemplate()
                }
              }}
              disabled={loading || (creationMode === 'educational' ? !packTitle : !customTitle)}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : creationMode === 'educational' ? (
                <>Continue to Add Cards <ArrowRight className="ml-2 h-4 w-4" /></>
              ) : (
                <>Generate Template PDF <Download className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Cards */}
      {step === 2 && creationMode === 'educational' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlipVertical className="h-5 w-5 text-purple-500" />
                Step 2: Create Flashcards
              </CardTitle>
              <CardDescription>
                Add your flashcards manually or generate with AI. You have {validCardCount} valid cards.
                {selectedPaper && <span className="ml-1">Need at least {Math.ceil((selectedPaper.minPages - 4) * (selectedSize?.cardsPerPage || 4) / 2)} cards for {selectedPaper.name}.</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card Navigator */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))} disabled={currentCardIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="font-medium">Card {currentCardIndex + 1} of {flashcards.length}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentCardIndex(Math.min(flashcards.length - 1, currentCardIndex + 1))} disabled={currentCardIndex === flashcards.length - 1}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={addFlashcard}>
                  <Plus className="h-4 w-4 mr-1" /> Add Card
                </Button>
              </div>

              {/* Card Preview & Edit */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Flip Card Preview */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Preview
                    <Button variant="ghost" size="sm" onClick={() => setShowBack(!showBack)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Flip
                    </Button>
                  </Label>
                  <div 
                    className="aspect-[3/2] rounded-xl p-6 flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: showBack ? selectedTheme?.back : selectedTheme?.front,
                      color: showBack ? selectedTheme?.textBack : selectedTheme?.textFront
                    }}
                    onClick={() => setShowBack(!showBack)}
                  >
                    <div className="text-center">
                      <div className="text-xs opacity-60 mb-2">{showBack ? 'BACK' : 'FRONT'}</div>
                      <div className="text-xl font-medium">
                        {showBack 
                          ? (flashcards[currentCardIndex]?.back || 'Answer goes here')
                          : (flashcards[currentCardIndex]?.front || 'Question goes here')
                        }
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Click card to flip</p>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Front (Question)</Label>
                    <Textarea
                      value={flashcards[currentCardIndex]?.front || ''}
                      onChange={(e) => updateFlashcard(currentCardIndex, 'front', e.target.value)}
                      placeholder="Enter the question or term..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Back (Answer)</Label>
                    <Textarea
                      value={flashcards[currentCardIndex]?.back || ''}
                      onChange={(e) => updateFlashcard(currentCardIndex, 'back', e.target.value)}
                      placeholder="Enter the answer or definition..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => duplicateFlashcard(currentCardIndex)}>
                      <Copy className="h-3 w-3 mr-1" /> Duplicate
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => removeFlashcard(currentCardIndex)} disabled={flashcards.length <= 1}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card List */}
              <div className="space-y-2">
                <Label>All Cards ({flashcards.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-auto p-2 border rounded-lg">
                  {flashcards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => { setCurrentCardIndex(idx); setShowBack(false); }}
                      className={`p-2 rounded-lg border text-xs text-left transition-all ${
                        currentCardIndex === idx ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                      } ${!card.front && !card.back ? 'opacity-50' : ''}`}
                    >
                      <div className="font-medium truncate">{card.front || 'Empty'}</div>
                      <div className="text-muted-foreground truncate">{card.back || '...'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue to AI Generation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: AI Generation */}
      {step === 3 && creationMode === 'educational' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Step 3: AI-Powered Content Generation
            </CardTitle>
            <CardDescription>
              Generate custom flashcards on any topic using AI. Enter your topic and we&apos;ll create professional, educational content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Badge */}
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-sm">Powered by AI</p>
                <p className="text-xs text-muted-foreground">Using Gemini 2.0 Flash for intelligent content generation</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Topic *</Label>
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Spanish vocabulary for beginners, US Presidents, Chemistry formulas, Calculus derivatives..."
                />
                <p className="text-xs text-muted-foreground">Be specific for better results. Example: &quot;French phrases for travel&quot; or &quot;World War 2 key events&quot;</p>
              </div>
              <div className="space-y-2">
                <Label>Number of Cards</Label>
                <Select value={aiCount.toString()} onValueChange={(v) => setAiCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 cards</SelectItem>
                    <SelectItem value="20">20 cards</SelectItem>
                    <SelectItem value="30">30 cards</SelectItem>
                    <SelectItem value="50">50 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <Button
                    key={level}
                    variant={aiDifficulty === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAiDifficulty(level)}
                    className="capitalize"
                  >
                    {level === 'easy' && <Lightbulb className="h-3 w-3 mr-1" />}
                    {level === 'medium' && <Target className="h-3 w-3 mr-1" />}
                    {level === 'hard' && <Brain className="h-3 w-3 mr-1" />}
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={generateWithAI} disabled={loading || !aiTopic.trim()} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate {aiCount} Flashcards</>
              )}
            </Button>

            {/* Generated Flashcards Preview & Edit */}
            {flashcards.filter(c => c.front || c.back).length > 0 && (
              <div className="space-y-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Preview & Edit Your Flashcards</h3>
                    <Badge variant="secondary">{flashcards.filter(c => c.front && c.back).length} cards</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setFlashcards([{ front: '', back: '', id: Date.now() }])}>
                    <Trash2 className="h-3 w-3 mr-1" /> Clear All
                  </Button>
                </div>
                
                {/* Card Grid with Edit Capability */}
                <div className="grid gap-3 max-h-[400px] overflow-auto pr-2">
                  {flashcards.filter(c => c.front || c.back).map((card, idx) => {
                    const actualIndex = flashcards.findIndex(c => c.id === card.id)
                    return (
                      <div key={card.id} className="p-4 bg-white dark:bg-gray-900 rounded-lg border shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Front (Question/Term)</Label>
                              <Textarea
                                value={card.front}
                                onChange={(e) => updateFlashcard(actualIndex, 'front', e.target.value)}
                                placeholder="Question or term..."
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Back (Answer/Definition)</Label>
                              <Textarea
                                value={card.back}
                                onChange={(e) => updateFlashcard(actualIndex, 'back', e.target.value)}
                                placeholder="Answer or definition..."
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => duplicateFlashcard(actualIndex)}
                              title="Duplicate card"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeFlashcard(actualIndex)}
                              title="Delete card"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Add Card */}
                <Button variant="outline" className="w-full" onClick={addFlashcard}>
                  <Plus className="h-4 w-4 mr-2" /> Add Another Card Manually
                </Button>
              </div>
            )}

            {/* Current Status */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Current Pack Status</span>
                <Badge variant={validCardCount >= 1 ? 'default' : 'secondary'}>
                  {validCardCount} valid cards
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {validCardCount >= Math.ceil((selectedPaper?.minPages - 4) * (selectedSize?.cardsPerPage || 4) / 2) 
                  ? `✅ Ready for ${selectedPaper?.name} (${selectedPaper?.minPages}+ pages)`
                  : `ℹ️ ${selectedPaper?.name} typically needs ${selectedPaper?.minPages}+ pages for KDP. You can still generate your PDF now.`
                }
              </p>
            </div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Include Instructions Page</Label>
                  <p className="text-xs text-muted-foreground">How to cut and use the flashcards</p>
                </div>
                <Switch checked={includeInstructions} onCheckedChange={setIncludeInstructions} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Include Cut Guides</Label>
                  <p className="text-xs text-muted-foreground">Dotted lines for easy cutting</p>
                </div>
                <Switch checked={includeCutGuides} onCheckedChange={setIncludeCutGuides} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cards
              </Button>
              <Button className="flex-1" onClick={generatePDF} disabled={loading || validCardCount < 1}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Generate KDP-Ready PDF</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Export */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" />
              Step 4: Download Your {creationMode === 'educational' ? 'Flashcard Book' : 'Template Pack'}
            </CardTitle>
            <CardDescription>
              Your KDP-compliant {creationMode === 'educational' ? 'flashcard book' : 'template pack'} is ready!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {creationMode === 'educational' ? packTitle : (customTitle || packTitle)}
              </h3>
              <p className="text-muted-foreground mb-4">
                {creationMode === 'educational' ? packDescription : `${pageCount} pages of ${templateStyle} templates`}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {creationMode === 'educational' ? (
                  <>
                    <Badge variant="secondary">{validCardCount} Flashcards</Badge>
                    <Badge variant="secondary">{selectedSize?.name}</Badge>
                    <Badge variant="secondary">{selectedPaper?.name}</Badge>
                    <Badge variant="secondary">{result.pageCount} Pages</Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">{pageCount} Pages</Badge>
                    <Badge variant="secondary">{INDEX_CARD_SIZES.find(s => s.id === indexCardSize)?.name}</Badge>
                    <Badge variant="secondary">{TEMPLATE_STYLES.find(s => s.id === templateStyle)?.name}</Badge>
                    <Badge variant="secondary">{CARD_COLORS.find(c => c.id === cardColor)?.name}</Badge>
                  </>
                )}
              </div>
            </div>

            {/* KDP Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📘 KDP Upload Instructions</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to <strong>kdp.amazon.com</strong> and sign in</li>
                <li>Click &quot;Create&quot; → &quot;Paperback&quot;</li>
                <li>Fill in book details (title, description, etc.)</li>
                <li>Upload this PDF as your interior file</li>
                <li>Create or upload a cover (use KDP Cover Calculator for dimensions)</li>
                <li>Set pricing and publish!</li>
              </ol>
            </div>

            {/* Download */}
            {result.downloadUrl && (
              <a href={result.downloadUrl} download className="block">
                <Button className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Download KDP-Ready PDF
                </Button>
              </a>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button variant="outline" className="flex-1" onClick={startNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Another Pack
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
