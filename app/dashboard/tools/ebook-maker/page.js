'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Download, BookOpen, Sparkles, ArrowLeft, ArrowRight,
  FileText, Palette, CheckCircle, User, Edit3, Plus, Trash2,
  RefreshCw, Eye, Save, List, BookMarked, ChevronDown, ChevronUp,
  Type, Image, Layout, FolderOpen, Clock, FilePlus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

const GENRES = [
  { id: 'self-help', name: 'Self-Help' },
  { id: 'business', name: 'Business' },
  { id: 'how-to', name: 'How-To Guide' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'finance', name: 'Finance' },
  { id: 'fiction', name: 'Fiction' },
  { id: 'non-fiction', name: 'Non-Fiction' },
]

const COLOR_SCHEMES = [
  { id: 'ocean-blue', name: 'Ocean Blue', color: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'rose-gold', name: 'Rose Gold', color: 'bg-pink-400', hex: '#f472b6' },
  { id: 'forest-green', name: 'Forest Green', color: 'bg-green-600', hex: '#16a34a' },
  { id: 'lavender', name: 'Lavender', color: 'bg-purple-400', hex: '#c084fc' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-500', hex: '#f97316' },
  { id: 'midnight', name: 'Midnight', color: 'bg-indigo-900', hex: '#312e81' },
  { id: 'custom', name: 'Custom', color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500', hex: null },
]

const COVER_STYLES = [
  { id: 'elegant', name: 'Elegant', description: 'Classic with decorative elements' },
  { id: 'modern', name: 'Modern', description: 'Clean geometric design' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple and clean' },
  { id: 'bold', name: 'Bold', description: 'High contrast dramatic' },
  { id: 'artistic', name: 'Artistic', description: 'Creative with textures' },
]

const FONT_STYLES = [
  { id: 'serif', name: 'Classic Serif', font: 'Times New Roman', description: 'Traditional book style' },
  { id: 'sans', name: 'Modern Sans', font: 'Helvetica', description: 'Clean and modern' },
  { id: 'elegant', name: 'Elegant', font: 'Georgia', description: 'Sophisticated look' },
]

const COVER_IMAGE_STYLES = [
  { id: 'abstract', name: 'Abstract Art', description: 'Geometric shapes and colors' },
  { id: 'nature', name: 'Nature Scene', description: 'Landscapes and natural elements' },
  { id: 'minimal', name: 'Minimal Pattern', description: 'Simple subtle pattern' },
  { id: 'gradient', name: 'Gradient Only', description: 'No image, just color gradient' },
  { id: 'custom', name: 'Custom Prompt', description: 'Describe your own image' },
]

export default function EbookMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatingChapter, setGeneratingChapter] = useState(null)
  const { toast } = useToast()
  const [isHydrated, setIsHydrated] = useState(false)

  // Drafts management
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [showDrafts, setShowDrafts] = useState(false)

  // Step 1: Topic input
  const [topic, setTopic] = useState('')
  const [genre, setGenre] = useState('self-help')
  const [targetAudience, setTargetAudience] = useState('')
  const [chapterCount, setChapterCount] = useState(5)

  // Step 2: Outline (editable)
  const [outline, setOutline] = useState(null)

  // Step 3: Full content (editable)
  const [cover, setCover] = useState({
    title: '',
    subtitle: '',
    authorName: '',
    authorBio: '',
    year: new Date().getFullYear()
  })
  const [introduction, setIntroduction] = useState({ content: '' })
  const [chapters, setChapters] = useState([])
  const [conclusion, setConclusion] = useState({ content: '' })
  const [expandedChapter, setExpandedChapter] = useState(null)

  // Step 4: Design settings
  const [colorScheme, setColorScheme] = useState('ocean-blue')
  const [customColor, setCustomColor] = useState('#6366f1')
  const [coverStyle, setCoverStyle] = useState('elegant')
  const [fontStyle, setFontStyle] = useState('serif')
  const [coverImageStyle, setCoverImageStyle] = useState('abstract')
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  const [internalPageColor, setInternalPageColor] = useState('same') // 'same' or 'custom'
  const [internalCustomColor, setInternalCustomColor] = useState('#ffffff')

  // Generated result
  const [result, setResult] = useState(null)

  // Get current ebook data as an object
  const getCurrentEbookData = () => ({
    topic,
    genre,
    targetAudience,
    chapterCount,
    outline,
    cover,
    introduction,
    chapters,
    conclusion,
    colorScheme,
    customColor,
    coverStyle,
    fontStyle,
    coverImageStyle,
    customImagePrompt,
    internalPageColor,
    internalCustomColor,
    step
  })

  // Load ebook data from object
  const loadEbookData = (data) => {
    if (data.topic) setTopic(data.topic)
    if (data.genre) setGenre(data.genre)
    if (data.targetAudience) setTargetAudience(data.targetAudience)
    if (data.chapterCount) setChapterCount(data.chapterCount)
    if (data.outline) setOutline(data.outline)
    if (data.cover) setCover(data.cover)
    if (data.introduction) setIntroduction(data.introduction)
    if (data.chapters) setChapters(data.chapters)
    if (data.conclusion) setConclusion(data.conclusion)
    if (data.colorScheme) setColorScheme(data.colorScheme)
    if (data.customColor) setCustomColor(data.customColor)
    if (data.coverStyle) setCoverStyle(data.coverStyle)
    if (data.fontStyle) setFontStyle(data.fontStyle)
    if (data.coverImageStyle) setCoverImageStyle(data.coverImageStyle)
    if (data.customImagePrompt) setCustomImagePrompt(data.customImagePrompt)
    if (data.internalPageColor) setInternalPageColor(data.internalPageColor)
    if (data.internalCustomColor) setInternalCustomColor(data.internalCustomColor)
    if (data.step) setStep(data.step)
  }

  // LOAD DRAFTS on mount
  useEffect(() => {
    // Load all drafts
    const savedDrafts = localStorage.getItem('ebook-maker-drafts')
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts))
      } catch (e) {
        console.log('Failed to load drafts:', e)
      }
    }

    // Load current working progress
    const currentProgress = localStorage.getItem('ebook-maker-progress')
    if (currentProgress) {
      try {
        const data = JSON.parse(currentProgress)
        loadEbookData(data)
        if (data.draftId) setCurrentDraftId(data.draftId)
        
        if (data.cover?.title) {
          toast({ 
            title: "Progress Restored", 
            description: `Continuing "${data.cover.title}". View drafts to switch.` 
          })
        }
      } catch (e) {
        console.log('Failed to restore progress:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // AUTO-SAVE current progress
  useEffect(() => {
    if (!isHydrated) return
    
    const saveData = {
      ...getCurrentEbookData(),
      draftId: currentDraftId,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('ebook-maker-progress', JSON.stringify(saveData))
  }, [isHydrated, topic, genre, targetAudience, chapterCount, outline, cover, introduction, chapters, conclusion, colorScheme, customColor, coverStyle, fontStyle, coverImageStyle, customImagePrompt, internalPageColor, internalCustomColor, step, currentDraftId])

  // Save current work as a draft
  const saveDraft = () => {
    const draftId = currentDraftId || `draft-${Date.now()}`
    const draftTitle = cover.title || topic || 'Untitled Draft'
    
    const newDraft = {
      id: draftId,
      title: draftTitle,
      subtitle: cover.subtitle || '',
      step,
      chaptersCount: chapters.length,
      chaptersComplete: chapters.filter(ch => ch.content && ch.content.trim().length > 50).length,
      createdAt: currentDraftId ? drafts.find(d => d.id === draftId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: getCurrentEbookData()
    }
    
    // Update or add draft
    const updatedDrafts = currentDraftId 
      ? drafts.map(d => d.id === draftId ? newDraft : d)
      : [newDraft, ...drafts]
    
    setDrafts(updatedDrafts)
    setCurrentDraftId(draftId)
    localStorage.setItem('ebook-maker-drafts', JSON.stringify(updatedDrafts))
    
    toast({ title: "Draft Saved!", description: `"${draftTitle}" has been saved to your drafts.` })
  }

  // Load a draft
  const loadDraft = (draft) => {
    loadEbookData(draft.data)
    setCurrentDraftId(draft.id)
    setShowDrafts(false)
    toast({ title: "Draft Loaded", description: `Now editing "${draft.title}"` })
  }

  // Delete a draft
  const deleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId)
    setDrafts(updatedDrafts)
    localStorage.setItem('ebook-maker-drafts', JSON.stringify(updatedDrafts))
    
    if (currentDraftId === draftId) {
      setCurrentDraftId(null)
    }
    toast({ title: "Draft Deleted" })
  }

  // Start new ebook (clear current and optionally save first)
  const startNewEbook = (saveCurrent = false) => {
    if (saveCurrent && (cover.title || topic)) {
      saveDraft()
    }
    
    // Reset all state
    setTopic('')
    setGenre('self-help')
    setTargetAudience('')
    setChapterCount(5)
    setOutline(null)
    setCover({ title: '', subtitle: '', authorName: '', authorBio: '', year: new Date().getFullYear() })
    setIntroduction({ content: '' })
    setChapters([])
    setConclusion({ content: '' })
    setColorScheme('ocean-blue')
    setCustomColor('#6366f1')
    setCoverStyle('elegant')
    setFontStyle('serif')
    setCoverImageStyle('abstract')
    setCustomImagePrompt('')
    setInternalPageColor('same')
    setInternalCustomColor('#ffffff')
    setStep(1)
    setResult(null)
    setCurrentDraftId(null)
    setShowDrafts(false)
    
    localStorage.removeItem('ebook-maker-progress')
    toast({ title: "Ready for New Ebook", description: "Start creating your new book!" })
  }

  // Clear saved progress (legacy - now starts new)
  const clearProgress = () => startNewEbook(false)

  // Helper to check if content is complete
  const getContentStatus = () => {
    const chaptersWithContent = chapters.filter(ch => ch.content && ch.content.trim().length > 50)
    return {
      hasIntro: introduction.content && introduction.content.trim().length > 50,
      hasConclusion: conclusion.content && conclusion.content.trim().length > 50,
      chaptersComplete: chaptersWithContent.length,
      totalChapters: chapters.length,
      allChaptersComplete: chaptersWithContent.length === chapters.length
    }
  }

  // Navigate to design with content check
  const goToDesign = () => {
    const status = getContentStatus()
    if (!status.allChaptersComplete) {
      const missing = status.totalChapters - status.chaptersComplete
      toast({
        title: "Content Missing",
        description: `${missing} chapter(s) have no content. Click "Generate All Content" or write your own content before proceeding.`,
        variant: "destructive"
      })
      return
    }
    setStep(4)
  }

  // Step 1: Generate Outline
  const generateOutline = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic Required", description: "Please enter a topic for your ebook", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ebook-maker/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, genre, targetAudience, chapterCount })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setOutline(data.outline)
      setCover({
        title: data.outline.title,
        subtitle: data.outline.subtitle,
        authorName: '',
        authorBio: '',
        year: new Date().getFullYear()
      })
      setIntroduction({ 
        content: data.outline.introduction?.summary || '',
        keyPoints: data.outline.introduction?.keyPoints || []
      })
      setChapters(data.outline.chapters.map(ch => ({
        title: ch.title,
        summary: ch.summary,
        keyPoints: ch.keyPoints || [],
        content: '',
        sections: [],
        keyTakeaways: []
      })))
      setConclusion({ 
        content: data.outline.conclusion?.summary || '',
        keyPoints: data.outline.conclusion?.keyPoints || []
      })
      
      setStep(2)
      toast({ title: "Outline Generated!", description: "Review and edit the outline before generating content." })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Generate content for a specific chapter
  const generateChapterContent = async (chapterIndex) => {
    const chapter = chapters[chapterIndex]
    setGeneratingChapter(chapterIndex)
    
    try {
      const response = await fetch('/api/ebook-maker/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: chapter.title,
          chapterSummary: chapter.summary,
          keyPoints: chapter.keyPoints,
          bookTitle: cover.title,
          bookContext: outline?.description,
          targetAudience,
          wordCount: 1500
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Use functional update to get latest state
      setChapters(prevChapters => prevChapters.map((ch, idx) => 
        idx === chapterIndex ? {
          ...ch,
          content: data.chapter.content,
          sections: data.chapter.sections || [],
          keyTakeaways: data.chapter.keyTakeaways || []
        } : ch
      ))
      
      toast({ title: "Chapter Generated!", description: `"${chapter.title}" content is ready.` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingChapter(null)
    }
  }

  // Generate all chapter content
  const generateAllChapters = async () => {
    setLoading(true)
    
    // Get current chapters state fresh
    let currentChapters = [...chapters]
    
    for (let i = 0; i < currentChapters.length; i++) {
      // Check if chapter already has content
      if (currentChapters[i].content && currentChapters[i].content.trim().length > 50) {
        continue // Skip already generated chapters
      }
      
      const chapter = currentChapters[i]
      setGeneratingChapter(i)
      
      try {
        const response = await fetch('/api/ebook-maker/generate-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterTitle: chapter.title,
            chapterSummary: chapter.summary,
            keyPoints: chapter.keyPoints,
            bookTitle: cover.title,
            bookContext: outline?.description,
            targetAudience,
            wordCount: 1500
          })
        })

        const data = await response.json()
        if (!data.success) throw new Error(data.error)

        // Update the chapter with generated content
        currentChapters = currentChapters.map((ch, idx) => 
          idx === i ? {
            ...ch,
            content: data.chapter.content,
            sections: data.chapter.sections || [],
            keyTakeaways: data.chapter.keyTakeaways || []
          } : ch
        )
        
        // Update state with each chapter - this ensures content persists
        setChapters([...currentChapters])
        
        toast({ title: `Chapter ${i + 1} Generated!`, description: `"${chapter.title}" is ready.` })
      } catch (error) {
        toast({ title: "Generation Failed", description: `Chapter ${i + 1}: ${error.message}`, variant: "destructive" })
      }
    }
    
    setGeneratingChapter(null)
    setLoading(false)
    toast({ title: "All Chapters Generated!", description: "Review and edit the content before generating PDF." })
  }

  // Helper to detect if text is in Bengali/non-English
  const isNonEnglish = (text) => {
    if (!text) return false
    return /[\u0980-\u09FF\u0900-\u097F\u4E00-\u9FFF\u0600-\u06FF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text)
  }

  // Generate introduction content
  const generateIntroduction = async () => {
    setLoading(true)
    try {
      // Use Bengali title for introduction if book is in Bengali
      const introTitle = isNonEnglish(cover.title) ? 'ভূমিকা' : 'Introduction'
      const introSummary = isNonEnglish(cover.title) 
        ? `${cover.title} বইয়ের ভূমিকা` 
        : `Introduction to ${cover.title}`
      
      const response = await fetch('/api/ebook-maker/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: introTitle,
          chapterSummary: introduction.content || introSummary,
          keyPoints: introduction.keyPoints || (isNonEnglish(cover.title) 
            ? ['বইয়ের সারসংক্ষেপ', 'পাঠক কী শিখবেন'] 
            : ['Overview of the book', 'What readers will learn']),
          bookTitle: cover.title,
          bookContext: outline?.description,
          wordCount: 800
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setIntroduction({ 
        ...introduction, 
        content: data.chapter.content,
        sections: data.chapter.sections 
      })
      toast({ title: "Introduction Generated!" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate conclusion content
  const generateConclusion = async () => {
    setLoading(true)
    try {
      // Use Bengali title for conclusion if book is in Bengali
      const conclusionTitle = isNonEnglish(cover.title) ? 'উপসংহার' : 'Conclusion'
      const conclusionSummary = isNonEnglish(cover.title)
        ? `${cover.title} বইয়ের উপসংহার ও চূড়ান্ত চিন্তাভাবনা`
        : `Conclusion and final thoughts on ${cover.title}`
      
      const response = await fetch('/api/ebook-maker/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: conclusionTitle,
          chapterSummary: conclusion.content || conclusionSummary,
          keyPoints: conclusion.keyPoints || (isNonEnglish(cover.title)
            ? ['মূল ধারণার সারসংক্ষেপ', 'পাঠকদের জন্য পরবর্তী পদক্ষেপ']
            : ['Summary of key concepts', 'Next steps for readers']),
          bookTitle: cover.title,
          bookContext: outline?.description,
          wordCount: 600
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setConclusion({ ...conclusion, content: data.chapter.content })
      toast({ title: "Conclusion Generated!" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Generate final PDF
  const generatePDF = async () => {
    if (!cover.title || chapters.length === 0) {
      toast({ title: "Missing Content", description: "Please complete the ebook content first", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ebook-maker/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover,
          introduction,
          chapters,
          conclusion,
          settings: { 
            colorScheme, 
            customColor: colorScheme === 'custom' ? customColor : null,
            coverStyle,
            fontStyle,
            coverImageStyle,
            customImagePrompt: coverImageStyle === 'custom' ? customImagePrompt : null,
            internalPageColor,
            internalCustomColor: internalPageColor === 'custom' ? internalCustomColor : null,
            genre, 
            generateCoverImage: coverImageStyle !== 'gradient'
          }
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(5)
      toast({ title: "Ebook Created!", description: `${data.pageCount} pages ready for download!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Add new chapter
  const addChapter = () => {
    setChapters([...chapters, {
      title: `New Chapter ${chapters.length + 1}`,
      summary: '',
      keyPoints: [],
      content: '',
      sections: [],
      keyTakeaways: []
    }])
  }

  // Remove chapter
  const removeChapter = (index) => {
    setChapters(chapters.filter((_, i) => i !== index))
  }

  // Update chapter
  const updateChapter = (index, field, value) => {
    const updated = [...chapters]
    updated[index] = { ...updated[index], [field]: value }
    setChapters(updated)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Ebook Creator Pro
          </h1>
          <p className="text-muted-foreground">Create professional ebooks with AI-powered content generation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDrafts(!showDrafts)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            My Drafts {drafts.length > 0 && `(${drafts.length})`}
          </Button>
          {(cover.title || topic) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveDraft}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm"
            onClick={() => startNewEbook(true)}
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            New Ebook
          </Button>
        </div>
      </div>

      {/* Drafts Panel */}
      {showDrafts && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                My Saved Drafts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDrafts(false)}>
                Close
              </Button>
            </div>
            <CardDescription>Continue working on your saved ebooks</CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved drafts yet.</p>
                <p className="text-sm">Click "Save Draft" to save your current work.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div 
                    key={draft.id}
                    className={`p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                      currentDraftId === draft.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{draft.title}</h4>
                        {draft.subtitle && <p className="text-sm text-muted-foreground">{draft.subtitle}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <List className="h-3 w-3" />
                            {draft.chaptersComplete}/{draft.chaptersCount} chapters
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </span>
                          <Badge variant={draft.step >= 4 ? "default" : "secondary"} className="text-xs">
                            Step {draft.step}/5
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {currentDraftId === draft.id ? (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        ) : (
                          <Button size="sm" onClick={() => loadDraft(draft)}>
                            <Edit3 className="h-3 w-3 mr-1" /> Open
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDraft(draft.id)}
                        >
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

      {/* Current Draft Indicator */}
      {currentDraftId && cover.title && !showDrafts && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 text-sm">
            <BookMarked className="h-4 w-4 text-primary" />
            <span>Editing: <strong>{cover.title}</strong></span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowDrafts(true)}>
            Switch Draft
          </Button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 5 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        <span>Topic</span>
        <span>Outline</span>
        <span>Content</span>
        <span>Design</span>
        <span>Download</span>
      </div>

      {/* Step 1: Topic Input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Step 1: What is Your Ebook About?
            </CardTitle>
            <CardDescription>Enter your topic and AI will create a detailed outline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ebook Topic / Title Idea</Label>
              <Input
                placeholder="e.g., How to Build a Successful Online Business from Scratch"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., Entrepreneurs, Students"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Number of Chapters: {chapterCount}</Label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={chapterCount}
                  onChange={(e) => setChapterCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={generateOutline}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Outline...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Outline</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Edit Outline */}
      {step === 2 && outline && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5 text-blue-500" />
                Step 2: Review & Edit Outline
              </CardTitle>
              <CardDescription>Edit chapter titles and structure before generating content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Book Title</Label>
                  <Input
                    value={cover.title}
                    onChange={(e) => setCover({ ...cover, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={cover.subtitle}
                    onChange={(e) => setCover({ ...cover, subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Book Description</Label>
                <Textarea
                  value={outline.description}
                  onChange={(e) => setOutline({ ...outline, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Chapters</h4>
                  <Button variant="outline" size="sm" onClick={addChapter}>
                    <Plus className="h-4 w-4 mr-1" /> Add Chapter
                  </Button>
                </div>
                
                {chapters.map((chapter, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Badge variant="secondary">{idx + 1}</Badge>
                    <Input
                      value={chapter.title}
                      onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeChapter(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Continue to Content <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Edit Content */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-green-500" />
                Step 3: Generate & Edit Content
              </CardTitle>
              <CardDescription>Generate AI content for each section or write your own</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookMarked className="h-4 w-4" /> Cover Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Author Name</Label>
                    <Input
                      value={cover.authorName}
                      onChange={(e) => setCover({ ...cover, authorName: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={cover.year}
                      onChange={(e) => setCover({ ...cover, year: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Author Bio (optional)</Label>
                  <Textarea
                    value={cover.authorBio}
                    onChange={(e) => setCover({ ...cover, authorBio: e.target.value })}
                    placeholder="Brief author biography..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Introduction */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Introduction</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateIntroduction}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={introduction.content}
                  onChange={(e) => setIntroduction({ ...introduction, content: e.target.value })}
                  placeholder="Write or generate introduction content..."
                  rows={4}
                />
              </div>

              {/* Chapters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Chapters</h4>
                  <Button 
                    variant="outline" 
                    onClick={generateAllChapters}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Generate All Content
                  </Button>
                </div>

                {chapters.map((chapter, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                      onClick={() => setExpandedChapter(expandedChapter === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge>{idx + 1}</Badge>
                        <span className="font-medium">{chapter.title}</span>
                        {chapter.content && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); generateChapterContent(idx); }}
                          disabled={generatingChapter === idx}
                        >
                          {generatingChapter === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        {expandedChapter === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    
                    {expandedChapter === idx && (
                      <div className="p-4 space-y-3">
                        <div className="space-y-2">
                          <Label>Chapter Title</Label>
                          <Input
                            value={chapter.title}
                            onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <Textarea
                            value={chapter.content}
                            onChange={(e) => updateChapter(idx, 'content', e.target.value)}
                            placeholder="Chapter content..."
                            rows={8}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Takeaways (one per line)</Label>
                          <Textarea
                            value={(chapter.keyTakeaways || []).join('\n')}
                            onChange={(e) => updateChapter(idx, 'keyTakeaways', e.target.value.split('\n').filter(t => t.trim()))}
                            placeholder="Enter key takeaways..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conclusion */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Conclusion</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateConclusion}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={conclusion.content}
                  onChange={(e) => setConclusion({ ...conclusion, content: e.target.value })}
                  placeholder="Write or generate conclusion content..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outline
                </Button>
                <Button className="flex-1" onClick={goToDesign}>
                  Continue to Design <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Content Status Indicator */}
              {(() => {
                const status = getContentStatus()
                return (
                  <div className={`p-3 rounded-lg text-sm ${status.allChaptersComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {status.allChaptersComplete ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        All {status.totalChapters} chapters have content. Ready to design!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        {status.chaptersComplete}/{status.totalChapters} chapters have content. 
                        Generate or write content for remaining chapters.
                      </span>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Design Settings */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Step 4: Design Your Ebook
            </CardTitle>
            <CardDescription>Customize colors, fonts, cover image, and internal page styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="cover" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cover" className="flex items-center gap-2">
                  <Image className="h-4 w-4" /> Cover Design
                </TabsTrigger>
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Layout className="h-4 w-4" /> Internal Pages
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </TabsTrigger>
              </TabsList>

              {/* Cover Design Tab */}
              <TabsContent value="cover" className="space-y-6 mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Color Scheme */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Color Scheme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_SCHEMES.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setColorScheme(color.id)}
                          className={`p-3 rounded-lg ${color.color} text-white text-sm font-medium transition-all ${
                            colorScheme === color.id ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-102'
                          }`}
                        >
                          {color.name}
                        </button>
                      ))}
                    </div>

                    {/* Custom Color Picker */}
                    {colorScheme === 'custom' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                        <Label className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Pick Your Custom Color
                        </Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-16 h-12 rounded-lg cursor-pointer border-2 border-border"
                          />
                          <div className="flex-1">
                            <Input
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              placeholder="#6366f1"
                              className="font-mono uppercase"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map((hex) => (
                            <button
                              key={hex}
                              onClick={() => setCustomColor(hex)}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Style */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Cover Layout Style</Label>
                    <div className="space-y-2">
                      {COVER_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setCoverStyle(style.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            coverStyle === style.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cover Image Style */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Cover Image Style</Label>
                  <p className="text-sm text-muted-foreground">Choose what type of AI-generated image appears on your cover</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {COVER_IMAGE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setCoverImageStyle(style.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          coverImageStyle === style.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Image Prompt */}
                  {coverImageStyle === 'custom' && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <Label>Describe Your Cover Image</Label>
                      <Textarea
                        value={customImagePrompt}
                        onChange={(e) => setCustomImagePrompt(e.target.value)}
                        placeholder="e.g., A serene mountain landscape at sunset with warm golden hues..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Be specific about colors, mood, and style you want</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Internal Pages Tab */}
              <TabsContent value="internal" className="space-y-6 mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Font Style */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4" /> Font Style
                    </Label>
                    <div className="space-y-2">
                      {FONT_STYLES.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontStyle(font.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            fontStyle === font.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium" style={{ fontFamily: font.font }}>{font.name}</div>
                          <div className="text-xs text-muted-foreground">{font.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Internal Page Colors */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4" /> Internal Page Color
                    </Label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setInternalPageColor('same')}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          internalPageColor === 'same' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">Match Cover Theme</div>
                        <div className="text-xs text-muted-foreground">Use same color palette as cover</div>
                      </button>
                      <button
                        onClick={() => setInternalPageColor('clean')}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          internalPageColor === 'clean' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">Clean White</div>
                        <div className="text-xs text-muted-foreground">White background with black text</div>
                      </button>
                      <button
                        onClick={() => setInternalPageColor('custom')}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          internalPageColor === 'custom' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">Custom Background</div>
                        <div className="text-xs text-muted-foreground">Choose your own page color</div>
                      </button>
                    </div>

                    {/* Custom Internal Color Picker */}
                    {internalPageColor === 'custom' && (
                      <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                        <Label>Page Background Color</Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={internalCustomColor}
                            onChange={(e) => setInternalCustomColor(e.target.value)}
                            className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                          />
                          <Input
                            value={internalCustomColor}
                            onChange={(e) => setInternalCustomColor(e.target.value)}
                            placeholder="#ffffff"
                            className="font-mono uppercase flex-1"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {['#ffffff', '#fef9e7', '#f5f5dc', '#f0f8ff', '#faf0e6', '#fffacd'].map((hex) => (
                            <button
                              key={hex}
                              onClick={() => setInternalCustomColor(hex)}
                              className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm hover:scale-110 transition-transform"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Light colors work best for readability</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Elements */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Page Elements</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" defaultChecked id="showPageNumbers" className="h-4 w-4" />
                      <label htmlFor="showPageNumbers" className="text-sm">Show Page Numbers</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" defaultChecked id="showChapterHeaders" className="h-4 w-4" />
                      <label htmlFor="showChapterHeaders" className="text-sm">Chapter Header Decorations</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" defaultChecked id="showKeyTakeaways" className="h-4 w-4" />
                      <label htmlFor="showKeyTakeaways" className="text-sm">Key Takeaway Boxes</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" defaultChecked id="showDividers" className="h-4 w-4" />
                      <label htmlFor="showDividers" className="text-sm">Section Dividers</label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Cover Preview */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Cover Preview</Label>
                    <div 
                      className="aspect-[3/4] rounded-lg p-6 text-white flex flex-col justify-between shadow-xl"
                      style={{ 
                        backgroundColor: colorScheme === 'custom' 
                          ? customColor 
                          : COLOR_SCHEMES.find(c => c.id === colorScheme)?.hex || '#3b82f6'
                      }}
                    >
                      <div className="h-1/2 bg-black/10 rounded-lg flex items-center justify-center text-xs opacity-50">
                        {coverImageStyle === 'gradient' ? 'Gradient Only' : `AI ${coverImageStyle} Image`}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold leading-tight">{cover.title || 'Your Ebook Title'}</h3>
                        <p className="text-sm opacity-80">{cover.subtitle}</p>
                        {cover.authorName && <p className="text-xs opacity-60">by {cover.authorName}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Internal Page Preview */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Internal Page Preview</Label>
                    <div 
                      className="aspect-[3/4] rounded-lg p-4 shadow-xl border flex flex-col"
                      style={{ 
                        backgroundColor: internalPageColor === 'clean' ? '#ffffff' 
                          : internalPageColor === 'custom' ? internalCustomColor 
                          : '#fafafa',
                        fontFamily: FONT_STYLES.find(f => f.id === fontStyle)?.font || 'Times New Roman'
                      }}
                    >
                      <div 
                        className="text-xs font-bold mb-2 px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: colorScheme === 'custom' ? customColor : COLOR_SCHEMES.find(c => c.id === colorScheme)?.hex || '#3b82f6',
                          color: 'white'
                        }}
                      >
                        Chapter 1
                      </div>
                      <h3 
                        className="text-sm font-bold mb-2"
                        style={{ 
                          color: colorScheme === 'custom' ? customColor : COLOR_SCHEMES.find(c => c.id === colorScheme)?.hex || '#3b82f6'
                        }}
                      >
                        Sample Chapter Title
                      </h3>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-2 bg-gray-300 rounded w-4/5"></div>
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                      </div>
                      <div 
                        className="mt-2 p-2 rounded text-xs"
                        style={{ 
                          backgroundColor: (colorScheme === 'custom' ? customColor : COLOR_SCHEMES.find(c => c.id === colorScheme)?.hex || '#3b82f6') + '20',
                          borderLeft: `3px solid ${colorScheme === 'custom' ? customColor : COLOR_SCHEMES.find(c => c.id === colorScheme)?.hex || '#3b82f6'}`
                        }}
                      >
                        Key Takeaway Box
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content
              </Button>
              <Button 
                className="flex-1" 
                size="lg"
                onClick={generatePDF}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF (30-60 sec)...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> Generate Ebook PDF</>
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
              Your Ebook is Ready!
            </CardTitle>
            <CardDescription>Download your professionally formatted ebook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">📚</div>
              <h3 className="text-xl font-bold">{cover.title}</h3>
              <p className="text-muted-foreground">{cover.subtitle}</p>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{chapters.length} chapters</span>
                {cover.authorName && <><span>•</span><span>by {cover.authorName}</span></>}
              </div>
              
              <a href={result.downloadUrl} download>
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
              </a>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(1); setOutline(null); setResult(null); }}>
                Create Another Ebook
              </Button>
              <Link href="/dashboard/library" className="flex-1">
                <Button variant="outline" className="w-full">
                  View in Library
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
