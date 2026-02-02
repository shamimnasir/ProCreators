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
  Loader2, Download, Sparkles, ArrowLeft, ArrowRight,
  CheckCircle, Plus, Trash2, Save, FolderOpen, FilePlus, 
  Clock, BookOpen, ListChecks, FileText, Image
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

// Import shared components
import CoverImagePrompt from '@/components/shared/CoverImagePrompt'

const GUIDE_TYPES = [
  { id: 'how-to', name: 'How-To Guide', icon: '📖', description: 'Step-by-step tutorials' },
  { id: 'beginner', name: 'Beginner Guide', icon: '🎓', description: 'Introduction to a topic' },
  { id: 'ultimate', name: 'Ultimate Guide', icon: '🏆', description: 'Comprehensive resource' },
  { id: 'quick-start', name: 'Quick Start', icon: '⚡', description: 'Fast-track learning' },
  { id: 'checklist', name: 'Checklist Guide', icon: '✅', description: 'Action-oriented guide' },
  { id: 'reference', name: 'Reference Guide', icon: '📚', description: 'Look-up resource' },
  { id: 'troubleshoot', name: 'Troubleshooting', icon: '🔧', description: 'Problem-solving guide' },
  { id: 'best-practices', name: 'Best Practices', icon: '⭐', description: 'Expert recommendations' },
  { id: 'tutorial-series', name: 'Tutorial Series', icon: '📝', description: 'Multi-part lessons' },
  { id: 'blank', name: 'Blank Template', icon: '📄', description: 'Start from scratch' },
]

const COLOR_SCHEMES = [
  { id: 'professional', name: 'Professional', color: 'bg-slate-600', description: 'Clean blues & grays' },
  { id: 'modern', name: 'Modern', color: 'bg-indigo-500', description: 'Bold indigo & white' },
  { id: 'warm', name: 'Warm', color: 'bg-orange-500', description: 'Friendly oranges' },
  { id: 'fresh', name: 'Fresh', color: 'bg-emerald-500', description: 'Vibrant greens' },
  { id: 'creative', name: 'Creative', color: 'bg-purple-500', description: 'Creative purples' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-400', description: 'Black & white' },
]

const COVER_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean contemporary design' },
  { id: 'classic', name: 'Classic', description: 'Traditional book style' },
  { id: 'bold', name: 'Bold', description: 'Eye-catching design' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple & elegant' },
]

// KDP Trim Sizes
const KDP_GUIDE_SIZES = [
  { id: '8.5x11', name: '8.5" × 11"', width: 612, height: 792, recommended: true, description: 'Standard US Letter' },
  { id: '6x9', name: '6" × 9"', width: 432, height: 648, recommended: true, description: 'Popular book size' },
  { id: '7x10', name: '7" × 10"', width: 504, height: 720, description: 'Large format guide' },
  { id: '5.5x8.5', name: '5.5" × 8.5"', width: 396, height: 612, description: 'Compact handbook' },
  { id: '5x8', name: '5" × 8"', width: 360, height: 576, description: 'Pocket guide' },
]

const STEP_LABELS = ['Type', 'Details', 'Content', 'Design', 'Generate']

export default function TutorialsPage() {
  // Step management
  const [step, setStep] = useState(1)
  const [highestStep, setHighestStep] = useState(1)
  
  // Step 1: Guide type
  const [guideType, setGuideType] = useState('how-to')
  
  // Step 2: Guide details
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  
  // Step 3: Chapters/Sections
  const [chapters, setChapters] = useState([])
  const [chapterCount, setChapterCount] = useState(5)
  
  // Custom chapter editing state
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  
  // Step 4: Design
  const [colorScheme, setColorScheme] = useState('professional')
  const [coverStyle, setCoverStyle] = useState('modern')
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [coverImageStyle, setCoverImageStyle] = useState('professional')
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  const [includeImages, setIncludeImages] = useState(true)
  const [includeTips, setIncludeTips] = useState(true)
  
  // Generation state
  const [loading, setLoading] = useState(false)
  const [generatingStructure, setGeneratingStructure] = useState(false)
  const [generated, setGenerated] = useState(null)
  
  // Drafts state
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  
  const selectedType = GUIDE_TYPES.find(t => t.id === guideType)

  // Update highest step when moving forward
  useEffect(() => {
    if (step > highestStep) {
      setHighestStep(step)
    }
  }, [step, highestStep])

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/drafts?toolType=how-to-guide')
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

  // Get current form data for saving
  const getCurrentData = useCallback(() => ({
    guideType,
    title,
    subtitle,
    authorName,
    introduction,
    targetAudience,
    difficulty,
    chapters,
    chapterCount,
    colorScheme,
    coverStyle,
    paperSize,
    coverImageStyle,
    customImagePrompt,
    includeImages,
    includeTips,
    step,
    generated,
  }), [guideType, title, subtitle, authorName, introduction, targetAudience, difficulty, chapters, chapterCount, colorScheme, coverStyle, paperSize, coverImageStyle, customImagePrompt, includeImages, includeTips, step, generated])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!currentDraftId) return
    
    const autoSaveInterval = setInterval(async () => {
      try {
        const data = getCurrentData()
        await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data })
        })
        setLastSaved(new Date())
      } catch (e) {
        console.log('Auto-save failed:', e)
      }
    }, 30000)
    
    return () => clearInterval(autoSaveInterval)
  }, [currentDraftId, getCurrentData])

  // Save draft manually
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const data = getCurrentData()
      const draftTitle = title || `My ${selectedType?.name || 'How-To Guide'}`
      
      if (currentDraftId) {
        const res = await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: draftTitle, data })
        })
        if (res.ok) {
          setLastSaved(new Date())
          setDrafts(prev => prev.map(d => d.id === currentDraftId ? { ...d, title: draftTitle, data, updatedAt: new Date().toISOString() } : d))
          toast({ title: "Saved!", description: "Draft updated successfully" })
        }
      } else {
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolType: 'how-to-guide', title: draftTitle, data })
        })
        const result = await res.json()
        if (result.success) {
          setCurrentDraftId(result.id)
          setDrafts(prev => [{ id: result.id, title: draftTitle, data, updatedAt: new Date().toISOString() }, ...prev])
          setLastSaved(new Date())
          toast({ title: "Saved!", description: "New draft created" })
        }
      }
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Load draft
  const loadDraft = (draft) => {
    const data = draft.data
    if (data.guideType) setGuideType(data.guideType)
    if (data.title) setTitle(data.title)
    if (data.subtitle) setSubtitle(data.subtitle)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.introduction) setIntroduction(data.introduction)
    if (data.targetAudience) setTargetAudience(data.targetAudience)
    if (data.difficulty) setDifficulty(data.difficulty)
    if (data.chapters) setChapters(data.chapters)
    if (data.chapterCount) setChapterCount(data.chapterCount)
    if (data.colorScheme) setColorScheme(data.colorScheme)
    if (data.coverStyle) setCoverStyle(data.coverStyle)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.coverImageStyle) setCoverImageStyle(data.coverImageStyle)
    if (data.customImagePrompt) setCustomImagePrompt(data.customImagePrompt)
    if (data.includeImages !== undefined) setIncludeImages(data.includeImages)
    if (data.includeTips !== undefined) setIncludeTips(data.includeTips)
    if (data.step) {
      setStep(data.step)
      setHighestStep(data.step)
    }
    if (data.generated) setGenerated(data.generated)
    
    setCurrentDraftId(draft.id)
    toast({ title: "Draft loaded", description: `Continuing "${draft.title}"` })
  }

  // Delete draft
  const deleteDraft = async (draftId) => {
    try {
      await fetch(`/api/drafts/${draftId}`, { method: 'DELETE' })
      setDrafts(prev => prev.filter(d => d.id !== draftId))
      if (currentDraftId === draftId) {
        setCurrentDraftId(null)
        handleStartNew()
      }
      toast({ title: "Deleted", description: "Draft removed" })
    } catch (e) {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setHighestStep(1)
    setGuideType('how-to')
    setTitle('')
    setSubtitle('')
    setAuthorName('')
    setIntroduction('')
    setTargetAudience('')
    setDifficulty('beginner')
    setChapters([])
    setChapterCount(5)
    setColorScheme('professional')
    setCoverStyle('modern')
    setPaperSize('8.5x11')
    setCoverImageStyle('professional')
    setCustomImagePrompt('')
    setIncludeImages(true)
    setIncludeTips(true)
    setGenerated(null)
    setCurrentDraftId(null)
    setLastSaved(null)
  }

  // Generate structure with AI
  const generateStructure = async () => {
    setGeneratingStructure(true)
    try {
      const response = await fetch('/api/how-to-guide/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideType,
          title: title || `My ${selectedType?.name}`,
          chapterCount,
          targetAudience,
          difficulty,
        })
      })
      
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      // Set generated structure
      if (data.title && !title) setTitle(data.title)
      if (data.subtitle && !subtitle) setSubtitle(data.subtitle)
      if (data.introduction && !introduction) setIntroduction(data.introduction)
      if (data.chapters) setChapters(data.chapters)
      
      toast({ title: "Structure Generated!", description: "Review and customize your chapters" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingStructure(false)
    }
  }

  // Generate PDF
  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('guide-maker')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setLoading(true)
    setGenerated(null)
    
    try {
      const selectedPaperSize = KDP_GUIDE_SIZES.find(s => s.id === paperSize)
      
      const response = await fetch('/api/how-to-guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideType,
          title: title || `My ${selectedType?.name}`,
          subtitle,
          authorName,
          introduction,
          chapters,
          chapterCount,
          difficulty,
          colorScheme,
          coverStyle,
          coverImageStyle,
          customImagePrompt,
          includeImages,
          includeTips,
          paperSize: {
            id: paperSize,
            name: selectedPaperSize?.name || '8.5" × 11"',
            width: selectedPaperSize?.width || 612,
            height: selectedPaperSize?.height || 792
          }
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate guide')
      }
      
      setGenerated(data)
      toast({
        title: "Guide Created!",
        description: `"${data.title}" with ${data.pageCount} pages is ready!`
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Chapter management
  const addChapter = () => {
    const newChapters = [...chapters, { title: 'New Chapter', sections: [] }]
    setChapters(newChapters)
    setExpandedChapter(newChapters.length - 1)
  }

  const updateChapter = (idx, field, value) => {
    const updated = [...chapters]
    updated[idx] = { ...updated[idx], [field]: value }
    setChapters(updated)
  }

  const deleteChapter = (idx) => {
    setChapters(chapters.filter((_, i) => i !== idx))
    if (expandedChapter === idx) setExpandedChapter(null)
  }

  // Section management
  const addSectionToChapter = (chapterIdx) => {
    const updated = [...chapters]
    updated[chapterIdx].sections = [...(updated[chapterIdx].sections || []), {
      title: 'New Section',
      content: 'Add your content here...',
      steps: [],
      tips: ''
    }]
    setChapters(updated)
    setExpandedChapter(chapterIdx)
    setExpandedSection(`${chapterIdx}-${updated[chapterIdx].sections.length - 1}`)
  }

  const updateSection = (chapterIdx, sectionIdx, field, value) => {
    const updated = [...chapters]
    if (updated[chapterIdx]?.sections?.[sectionIdx]) {
      updated[chapterIdx].sections[sectionIdx] = {
        ...updated[chapterIdx].sections[sectionIdx],
        [field]: value
      }
      setChapters(updated)
    }
  }

  const deleteSection = (chapterIdx, sectionIdx) => {
    const updated = [...chapters]
    updated[chapterIdx].sections = updated[chapterIdx].sections.filter((_, i) => i !== sectionIdx)
    setChapters(updated)
    if (expandedSection === `${chapterIdx}-${sectionIdx}`) {
      setExpandedSection(null)
    }
  }

  // Import content from text
  const handleImportContent = () => {
    if (!importText.trim()) return
    
    // Parse the pasted text
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l)
    
    // Try to extract chapters and sections
    const newChapters = []
    let currentChapter = null
    let currentSection = null
    
    for (const line of lines) {
      // Check if it's a chapter heading (starts with # or "Chapter")
      if (line.startsWith('#') || line.toLowerCase().startsWith('chapter')) {
        if (currentChapter) {
          if (currentSection) {
            currentChapter.sections.push(currentSection)
          }
          newChapters.push(currentChapter)
        }
        currentChapter = {
          title: line.replace(/^#+\s*/, '').replace(/^chapter\s*\d*:?\s*/i, ''),
          sections: []
        }
        currentSection = null
      }
      // Check if it's a section heading (starts with ## or numbered)
      else if (line.startsWith('##') || /^\d+\./.test(line)) {
        if (currentSection && currentChapter) {
          currentChapter.sections.push(currentSection)
        }
        if (!currentChapter) {
          currentChapter = { title: 'Imported Content', sections: [] }
        }
        currentSection = {
          title: line.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, ''),
          content: '',
          steps: [],
          tips: ''
        }
      }
      // Otherwise it's content
      else if (currentSection) {
        if (line.startsWith('-') || line.startsWith('*')) {
          currentSection.steps.push(line.replace(/^[-*]\s*/, ''))
        } else {
          currentSection.content += (currentSection.content ? '\n' : '') + line
        }
      }
    }
    
    // Add last chapter/section
    if (currentSection && currentChapter) {
      currentChapter.sections.push(currentSection)
    }
    if (currentChapter) {
      newChapters.push(currentChapter)
    }
    
    // If no chapters found, create a single chapter with content
    if (newChapters.length === 0) {
      newChapters.push({
        title: 'Imported Content',
        sections: [{
          title: 'Main Content',
          content: importText,
          steps: [],
          tips: ''
        }]
      })
    }
    
    setChapters([...chapters, ...newChapters])
    setImportText('')
    setShowImport(false)
    toast({ title: "Content Imported!", description: `Added ${newChapters.length} chapter(s)` })
  }

  // Navigation
  const canGoToStep = (targetStep) => {
    if (targetStep <= highestStep) return true
    if (targetStep === step + 1) return true
    return false
  }

  const handleStepClick = (targetStep) => {
    if (canGoToStep(targetStep)) {
      setStep(targetStep)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">📖</span>
            How-To Guide Creator PRO
          </h1>
          <p className="text-muted-foreground mt-1">
            Create professional KDP-ready tutorials and guides
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="text-green-600 font-medium">$5-$30</span>
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Sell on:</span>
            {['Amazon KDP', 'Etsy', 'Gumroad', 'Teachable'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-blue-900/50">
                {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left sidebar - Drafts */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  My Drafts
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleStartNew}>
                  <FilePlus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Current
              </Button>
              
              {lastSaved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
              
              <div className="border-t pt-2 mt-2 max-h-[300px] overflow-y-auto space-y-1">
                {drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No drafts yet
                  </p>
                ) : (
                  drafts.map((draft) => (
                    <div 
                      key={draft.id} 
                      className={`p-2 rounded border text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                        currentDraftId === draft.id ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-medium truncate flex-1"
                          onClick={() => loadDraft(draft)}
                        >
                          {draft.title}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        Step {draft.data?.step || 1}/5
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const canNavigate = canGoToStep(s)
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(s)}
                    disabled={!canNavigate}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50' : 'cursor-not-allowed opacity-60'}`}
                  >
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </button>
                  {s < 5 && <div className={`w-8 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-6 text-sm">
            {STEP_LABELS.map((label, idx) => (
              <span 
                key={label}
                onClick={() => handleStepClick(idx + 1)}
                className={`cursor-pointer hover:text-primary transition-colors ${
                  step === idx + 1 ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Step 1: Guide Type */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Choose Your Guide Type
                </CardTitle>
                <CardDescription>
                  Select the type of tutorial or guide you want to create
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {GUIDE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setGuideType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        guideType === type.id 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setStep(2)}>
                    Next: Guide Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Guide Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Guide Details
                </CardTitle>
                <CardDescription>
                  Enter your guide information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Guide Title *</Label>
                    <Input
                      placeholder={`e.g., How to ${selectedType?.description || 'Master Any Skill'}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle (optional)</Label>
                    <Input
                      placeholder="e.g., A Complete Step-by-Step Guide"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Author Name</Label>
                    <Input
                      placeholder="Your name or pen name"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Input
                      placeholder="e.g., Beginners, Small business owners"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - No prior knowledge needed</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some basics required</SelectItem>
                      <SelectItem value="advanced">Advanced - Expert level content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Introduction (optional)</Label>
                  <Textarea
                    placeholder="Write a brief introduction about your guide..."
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Chapters: {chapterCount}</Label>
                  <Slider
                    value={[chapterCount]}
                    onValueChange={([v]) => setChapterCount(v)}
                    min={3}
                    max={20}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    More chapters = more comprehensive guide (KDP minimum 24 pages)
                  </p>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Next: Content <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Chapters & Content */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                  Your Content
                </CardTitle>
                <CardDescription>
                  Add your own content, generate with AI, or import from other sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={generateStructure} 
                    disabled={generatingStructure}
                    variant="secondary"
                    className="h-auto py-3"
                  >
                    {generatingStructure ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">Generate AI Content</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Create {chapterCount} chapters automatically</span>
                      </div>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-3"
                    onClick={addChapter}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Add Custom Chapter</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Create your own sections</span>
                    </div>
                  </Button>
                </div>

                {/* Import from text */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Quick Import (Paste Content)
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowImport(!showImport)}
                    >
                      {showImport ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showImport && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder={`Paste your content here in any format, e.g.:

# Chapter 1: Getting Started
## Introduction
Welcome to this guide...

## Step 1: Setting Up
- Download the software
- Install dependencies
- Configure settings`}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <Button onClick={handleImportContent} disabled={!importText.trim()}>
                        Import Content
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Chapters List */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">
                      Chapters ({chapters.length}) - {chapters.reduce((acc, c) => acc + (c.sections?.length || 0), 0)} sections total
                    </Label>
                  </div>
                  
                  {chapters.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No chapters yet</p>
                      <p className="text-sm text-muted-foreground">Generate AI content or add your own chapters above</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {chapters.map((chapter, chapterIdx) => (
                        <div key={chapterIdx} className="border rounded-lg overflow-hidden">
                          {/* Chapter Header */}
                          <div className="bg-muted/50 p-3 flex items-center gap-2">
                            <button
                              onClick={() => setExpandedChapter(expandedChapter === chapterIdx ? null : chapterIdx)}
                              className="flex-1 flex items-center gap-2 text-left"
                            >
                              <ListChecks className="h-4 w-4" />
                              <Input
                                value={chapter.title}
                                onChange={(e) => { e.stopPropagation(); updateChapter(chapterIdx, 'title', e.target.value) }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                              />
                            </button>
                            <Badge variant="secondary">{chapter.sections?.length || 0}</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => addSectionToChapter(chapterIdx)}
                              className="h-7 px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Section
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteChapter(chapterIdx)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Sections in Chapter */}
                          {expandedChapter === chapterIdx && (
                            <div className="p-3 space-y-3">
                              {(!chapter.sections || chapter.sections.length === 0) ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                  No sections in this chapter. Click &quot;+ Section&quot; to add one.
                                </div>
                              ) : (
                                chapter.sections.map((section, sectionIdx) => (
                                  <div key={sectionIdx} className="border rounded-lg p-3 bg-background">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <Input
                                        value={section.title}
                                        onChange={(e) => updateSection(chapterIdx, sectionIdx, 'title', e.target.value)}
                                        className="flex-1 font-medium"
                                        placeholder="Section Title"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedSection(expandedSection === `${chapterIdx}-${sectionIdx}` ? null : `${chapterIdx}-${sectionIdx}`)}
                                      >
                                        {expandedSection === `${chapterIdx}-${sectionIdx}` ? 'Collapse' : 'Edit'}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteSection(chapterIdx, sectionIdx)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    
                                    {/* Section Details (Expanded) */}
                                    {expandedSection === `${chapterIdx}-${sectionIdx}` && (
                                      <div className="space-y-3 pt-3 border-t">
                                        {/* Content */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Content</Label>
                                          <Textarea
                                            value={section.content || ''}
                                            onChange={(e) => updateSection(chapterIdx, sectionIdx, 'content', e.target.value)}
                                            placeholder="Main content for this section..."
                                            rows={4}
                                          />
                                        </div>
                                        
                                        {/* Steps */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Steps (one per line)</Label>
                                          <Textarea
                                            value={(section.steps || []).join('\n')}
                                            onChange={(e) => updateSection(chapterIdx, sectionIdx, 'steps', e.target.value.split('\n').filter(l => l.trim()))}
                                            placeholder="Step 1: Do this\nStep 2: Then do that\nStep 3: Finally..."
                                            rows={4}
                                            className="font-mono text-sm"
                                          />
                                        </div>
                                        
                                        {/* Tips */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Tips (optional)</Label>
                                          <Input
                                            value={section.tips || ''}
                                            onChange={(e) => updateSection(chapterIdx, sectionIdx, 'tips', e.target.value)}
                                            placeholder="Pro tip: ..."
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Section Preview (Collapsed) */}
                                    {expandedSection !== `${chapterIdx}-${sectionIdx}` && (
                                      <div className="text-xs text-muted-foreground">
                                        {section.content?.substring(0, 100)}{section.content?.length > 100 ? '...' : ''}
                                        {section.steps?.length > 0 && ` • ${section.steps.length} steps`}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                          
                          {/* Collapsed preview */}
                          {expandedChapter !== chapterIdx && chapter.sections?.length > 0 && (
                            <div className="px-3 pb-2 text-xs text-muted-foreground">
                              {chapter.sections.slice(0, 3).map(s => s.title).join(', ')}
                              {chapter.sections.length > 3 && ` +${chapter.sections.length - 3} more`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={chapters.length === 0}>
                    Next: Design <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Design */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                  Design Your Guide
                </CardTitle>
                <CardDescription>
                  Choose colors, style, and KDP paper size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Color Scheme</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_SCHEMES.map((scheme) => (
                          <button
                            key={scheme.id}
                            onClick={() => setColorScheme(scheme.id)}
                            className={`p-2 rounded-lg border-2 text-center transition-all ${
                              colorScheme === scheme.id 
                                ? 'border-primary' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full ${scheme.color} mx-auto mb-1`} />
                            <div className="text-xs font-medium">{scheme.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cover Style</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COVER_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setCoverStyle(style.id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              coverStyle === style.id 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="font-medium text-sm">{style.name}</div>
                            <p className="text-xs text-muted-foreground">{style.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Paper Size (KDP)</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KDP_GUIDE_SIZES.map((size) => (
                            <SelectItem key={size.id} value={size.id}>
                              <div className="flex items-center gap-2">
                                <span>{size.name}</span>
                                {size.recommended && <Badge variant="secondary" className="text-[10px]">Recommended</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {KDP_GUIDE_SIZES.find(s => s.id === paperSize)?.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <Label className="text-base font-medium mb-3 block">Cover Image</Label>
                      <CoverImagePrompt
                        coverImageStyle={coverImageStyle}
                        setCoverImageStyle={setCoverImageStyle}
                        customImagePrompt={customImagePrompt}
                        setCustomImagePrompt={setCustomImagePrompt}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeTips}
                          onChange={(e) => setIncludeTips(e.target.checked)}
                          className="rounded"
                        />
                        Include Pro Tips in each section
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(5)}>
                    Next: Generate <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Generate & Download */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                    Review & Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center space-y-4 p-6 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-6xl">{selectedType?.icon || '📖'}</div>
                      <div>
                        <h3 className="text-xl font-bold">{title || `My ${selectedType?.name}`}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                        {authorName && <p className="text-sm mt-1">by {authorName}</p>}
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="outline">{selectedType?.name}</Badge>
                        <Badge variant="outline">{KDP_GUIDE_SIZES.find(s => s.id === paperSize)?.name}</Badge>
                        <Badge variant="outline">{chapters.length} chapters</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{selectedType?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Chapters</span>
                          <span className="font-medium">{chapters.length}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Total Sections</span>
                          <span className="font-medium">{chapters.reduce((acc, c) => acc + (c.sections?.length || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Difficulty</span>
                          <span className="font-medium capitalize">{difficulty}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Color Scheme</span>
                          <span className="font-medium capitalize">{colorScheme}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Paper Size</span>
                          <span className="font-medium">{KDP_GUIDE_SIZES.find(s => s.id === paperSize)?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex items-center gap-3">

                <CreditCostBadge toolId="guide-maker" />

                <Button 
                size="lg" 
                className="flex-1 h-14 text-lg" 
                onClick={handleGenerate} 
                disabled={loading || chapters.length === 0}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Guide (30-60s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Generate How-To Guide</>                )}
              </Button>

              </div>
              
              {chapters.length === 0 && (
                <p className="text-center text-sm text-destructive">
                  Please add at least one chapter with sections before generating
                </p>
              )}

              {/* Download Section */}
              {generated && (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                          Your Guide is Ready!
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          &quot;{generated.title}&quot; - {generated.pageCount} pages
                        </p>
                      </div>
                    </div>
                    <a href={generated.downloadUrl} download target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg">
                        <Download className="mr-2 h-5 w-5" />
                        Download PDF
                      </Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      KDP-ready format - Upload directly to Amazon
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Design
                </Button>
              </div>
            </div>
          )}

          {/* Tips Card */}
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <BookOpen className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
              <p>• How-to guides in specific niches (tech, business) sell well on Amazon KDP</p>
              <p>• Include actionable steps and checklists for higher value</p>
              <p>• Bundle multiple related guides into a series for recurring sales</p>
              <p>• Add QR codes linking to video tutorials as premium content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
