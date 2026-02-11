'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Download, BookOpen, Sparkles, ArrowLeft, ArrowRight,
  FileText, Palette, CheckCircle, User, Edit3, Plus, Trash2,
  RefreshCw, Heart, ChevronDown, ChevronUp, Image
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

// Import shared components for Pro features
import RichTextEditor from '@/components/shared/RichTextEditor'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import CoverImagePrompt from '@/components/shared/CoverImagePrompt'

const JOURNAL_TYPES = [
  { id: 'gratitude', name: 'Gratitude Journal', icon: '🙏', description: 'Daily thankfulness practice' },
  { id: 'mindfulness', name: 'Mindfulness Journal', icon: '🧘', description: 'Present moment awareness' },
  { id: 'self-discovery', name: 'Self-Discovery', icon: '🔮', description: 'Personal growth & insights' },
  { id: 'dream', name: 'Dream Journal', icon: '🌙', description: 'Record & analyze dreams' },
  { id: 'fitness', name: 'Fitness Journal', icon: '💪', description: 'Track workouts & health' },
  { id: 'bullet', name: 'Bullet Journal', icon: '📝', description: 'Organized task tracking' },
  { id: 'reading', name: 'Reading Journal', icon: '📚', description: 'Book notes & reviews' },
  { id: 'travel', name: 'Travel Journal', icon: '✈️', description: 'Document adventures' },
]

const COLOR_SCHEMES = [
  { id: 'lavender', name: 'Lavender', color: 'bg-purple-400' },
  { id: 'rose-gold', name: 'Rose Gold', color: 'bg-pink-400' },
  { id: 'sage', name: 'Sage', color: 'bg-emerald-400' },
  { id: 'ocean-blue', name: 'Ocean Blue', color: 'bg-blue-500' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-400' },
  { id: 'midnight', name: 'Midnight', color: 'bg-indigo-900' },
]

const COVER_STYLES = [
  { id: 'floral', name: 'Floral', description: 'Delicate flower patterns' },
  { id: 'elegant', name: 'Elegant', description: 'Classic decorative borders' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple' },
  { id: 'boho', name: 'Boho', description: 'Bohemian organic shapes' },
]

// KDP Journal Trim Sizes (Interior Dimensions)
const KDP_JOURNAL_SIZES = [
  { 
    id: '6x9', 
    name: '6" × 9"', 
    width: 432,  // 6 * 72
    height: 648, // 9 * 72
    recommended: true,
    description: 'Most popular for journals & non-fiction'
  },
  { 
    id: '5.5x8.5', 
    name: '5.5" × 8.5"', 
    width: 396,  // 5.5 * 72
    height: 612, // 8.5 * 72
    recommended: true,
    description: 'Portable & compact - great for on-the-go'
  },
  { 
    id: '5x8', 
    name: '5" × 8"', 
    width: 360,  // 5 * 72
    height: 576, // 8 * 72
    description: 'Pocket-sized journal'
  },
  { 
    id: '6.14x9.21', 
    name: '6.14" × 9.21"', 
    width: 442,  // 6.14 * 72
    height: 663, // 9.21 * 72
    description: 'Slightly larger variant'
  },
  { 
    id: '8.5x11', 
    name: '8.5" × 11"', 
    width: 612,  // 8.5 * 72
    height: 792, // 11 * 72
    largeTrim: true,
    description: 'Large format - higher print cost'
  },
  { 
    id: '7x10', 
    name: '7" × 10"', 
    width: 504,  // 7 * 72
    height: 720, // 10 * 72
    largeTrim: true,
    description: 'Large format journal'
  },
]

export default function JournalMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Step 1: Basic info
  const [journalType, setJournalType] = useState('gratitude')
  const [purpose, setPurpose] = useState('')
  const [duration, setDuration] = useState('90')

  // Step 2: Structure (editable)
  const [cover, setCover] = useState({ title: '', subtitle: '', authorName: '', year: new Date().getFullYear() })
  const [introduction, setIntroduction] = useState('')
  const [sections, setSections] = useState([])
  const [weeklyReflection, setWeeklyReflection] = useState({ title: 'Weekly Reflection', questions: [] })
  const [monthlyReview, setMonthlyReview] = useState({ title: 'Monthly Review', questions: [] })
  const [affirmations, setAffirmations] = useState([])
  const [quotes, setQuotes] = useState([])
  const [expandedSection, setExpandedSection] = useState(null)

  // Step 3: Design settings
  const [colorScheme, setColorScheme] = useState('lavender')
  const [coverStyle, setCoverStyle] = useState('floral')
  const [pageCount, setPageCount] = useState(90)
  const [paperSize, setPaperSize] = useState('6x9') // KDP most popular
  
  // NEW: Cover image customization
  const [coverImageStyle, setCoverImageStyle] = useState('abstract')
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  
  // NEW: Drafts management
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)

  // Result
  const [result, setResult] = useState(null)
  
  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/drafts?toolType=journal')
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
  const getCurrentData = () => ({
    title: cover.title || `My ${JOURNAL_TYPES.find(j => j.id === journalType)?.name}`,
    journalType,
    purpose,
    duration,
    cover,
    introduction,
    sections,
    weeklyReflection,
    monthlyReview,
    affirmations,
    quotes,
    colorScheme,
    coverStyle,
    pageCount,
    paperSize,
    coverImageStyle,
    customImagePrompt,
    step,
  })
  
  // Load draft data into form
  const loadDraftData = (data) => {
    if (data.journalType) setJournalType(data.journalType)
    if (data.purpose) setPurpose(data.purpose)
    if (data.duration) setDuration(data.duration)
    if (data.cover) setCover(data.cover)
    if (data.introduction) setIntroduction(data.introduction)
    if (data.sections) setSections(data.sections)
    if (data.weeklyReflection) setWeeklyReflection(data.weeklyReflection)
    if (data.monthlyReview) setMonthlyReview(data.monthlyReview)
    if (data.affirmations) setAffirmations(data.affirmations)
    if (data.quotes) setQuotes(data.quotes)
    if (data.colorScheme) setColorScheme(data.colorScheme)
    if (data.coverStyle) setCoverStyle(data.coverStyle)
    if (data.pageCount) setPageCount(data.pageCount)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.coverImageStyle) setCoverImageStyle(data.coverImageStyle)
    if (data.customImagePrompt) setCustomImagePrompt(data.customImagePrompt)
    if (data.step && data.step > 1) setStep(Math.min(data.step, 3))
    setResult(null)
  }
  
  // Start new journal
  const handleStartNew = () => {
    setStep(1)
    setJournalType('gratitude')
    setPurpose('')
    setDuration('90')
    setCover({ title: '', subtitle: '', authorName: '', year: new Date().getFullYear() })
    setIntroduction('')
    setSections([])
    setWeeklyReflection({ title: 'Weekly Reflection', questions: [] })
    setMonthlyReview({ title: 'Monthly Review', questions: [] })
    setAffirmations([])
    setQuotes([])
    setColorScheme('lavender')
    setCoverStyle('floral')
    setPageCount(90)
    setPaperSize('6x9') // KDP most popular
    setCoverImageStyle('abstract')
    setCustomImagePrompt('')
    setResult(null)
  }

  // Generate structure
  const generateStructure = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/journal-maker/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalType, purpose, duration, targetAudience: 'Adults' })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      const s = data.structure
      setCover({ title: s.title, subtitle: s.subtitle, authorName: '', year: new Date().getFullYear() })
      setIntroduction(s.introduction)
      setSections(s.sections || [])
      setWeeklyReflection(s.weeklyReflection || { title: 'Weekly Reflection', questions: [] })
      setMonthlyReview(s.monthlyReview || { title: 'Monthly Review', questions: [] })
      setAffirmations(s.affirmations || [])
      setQuotes(s.quotes || [])
      
      setStep(2)
      toast({ title: "Structure Generated!", description: "Review and customize your journal." })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate PDF
  const generatePDF = async () => {
    if (!cover.title) {
      toast({ title: "Missing Title", description: "Please enter a journal title", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Get selected paper size dimensions
      const selectedPaperSize = KDP_JOURNAL_SIZES.find(s => s.id === paperSize)
      
      const response = await fetch('/api/journal-maker/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover,
          introduction,
          sections,
          weeklyReflection,
          monthlyReview,
          affirmations,
          quotes,
          settings: { 
            colorScheme, 
            coverStyle, 
            journalType, 
            pageCount, 
            generateCoverImage: true,
            coverImageStyle,
            customImagePrompt,
            // KDP Paper Size
            paperSize: {
              id: paperSize,
              name: selectedPaperSize?.name || '6" × 9"',
              width: selectedPaperSize?.width || 432,
              height: selectedPaperSize?.height || 648
            }
          }
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Journal Created!", description: `${data.pageCount} pages ready!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Section management
  const addSection = () => {
    setSections([...sections, { name: 'New Section', description: '', frequency: 'daily', prompts: [] }])
  }

  const updateSection = (idx, field, value) => {
    const updated = [...sections]
    updated[idx] = { ...updated[idx], [field]: value }
    setSections(updated)
  }

  const addPrompt = (sectionIdx) => {
    const updated = [...sections]
    updated[sectionIdx].prompts = [...(updated[sectionIdx].prompts || []), { question: '', lines: 3 }]
    setSections(updated)
  }

  const selectedType = JOURNAL_TYPES.find(t => t.id === journalType)
  const selectedColor = COLOR_SCHEMES.find(c => c.id === colorScheme)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            Journal Maker Pro
          </h1>
          <p className="text-muted-foreground">Create beautiful guided journals with AI-generated prompts</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left sidebar - Drafts */}
        <div className="lg:col-span-1">
          <AutoSaveDraftsManager
            toolType="journal"
            getCurrentData={getCurrentData}
            loadDraftData={loadDraftData}
            onStartNew={handleStartNew}
            dependencies={[cover, journalType, purpose, duration, sections, step]}
            autoSaveEnabled={true}
            debounceMs={2000}
            minStepForAutoSave={1}
            currentStep={step}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">

      {/* Progress Steps - Clickable */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => {
          // Can navigate if it's a previous step OR we have required data
          const canNavigate = s < step || 
            (s === 2 && sections.length > 0) || 
            (s === 3 && sections.length > 0) ||
            (s === 4 && result)
          
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => canNavigate && setStep(s)}
                disabled={!canNavigate && s > step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2' : s > step ? 'cursor-not-allowed opacity-60' : ''}`}
                title={canNavigate ? `Go to Step ${s}` : s > step ? 'Complete current step first' : ''}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </button>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-12 text-xs text-muted-foreground">
        {['Type', 'Customize', 'Design', 'Download'].map((label, idx) => (
          <button
            key={label}
            onClick={() => {
              const targetStep = idx + 1
              const canGo = targetStep <= step || 
                (targetStep === 2 && sections.length > 0) || 
                (targetStep === 3 && sections.length > 0) ||
                (targetStep === 4 && result)
              if (canGo) setStep(targetStep)
            }}
            className={`hover:text-primary transition-colors ${step === idx + 1 ? 'text-primary font-medium' : ''} ${
              idx + 1 <= step ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step 1: Journal Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Step 1: Choose Your Journal Type
            </CardTitle>
            <CardDescription>Select a journal style and AI will create the perfect prompts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {JOURNAL_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setJournalType(type.id)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    journalType === type.id 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-sm">{type.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Journal Purpose (optional)</Label>
                <Input
                  placeholder="e.g., Building a daily gratitude habit"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration: {duration} days</Label>
                <Slider
                  value={[Number(duration)]}
                  onValueChange={([v]) => setDuration(String(v))}
                  min={30}
                  max={365}
                  step={30}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <CreditCostBadge toolId="journal-maker" />
              <Button className="flex-1" size="lg" onClick={generateStructure} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Structure...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate Journal Structure</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Customize Content */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-green-500" />
                Step 2: Customize Your Journal
              </CardTitle>
              <CardDescription>Edit prompts, sections, and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Cover Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Journal Title</Label>
                    <Input value={cover.title} onChange={(e) => setCover({ ...cover, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input value={cover.subtitle} onChange={(e) => setCover({ ...cover, subtitle: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Name</Label>
                    <Input 
                      placeholder="Optional" 
                      value={cover.authorName} 
                      onChange={(e) => setCover({ ...cover, authorName: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Introduction */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Welcome Message</h4>
                <Textarea
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  rows={3}
                  placeholder="Introduction message for your journal..."
                />
              </div>

              {/* Sections */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Journal Sections & Prompts</h4>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>

                {sections.map((section, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                      onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{section.frequency}</Badge>
                        <span className="font-medium">{section.name}</span>
                        <span className="text-sm text-muted-foreground">({section.prompts?.length || 0} prompts)</span>
                      </div>
                      {expandedSection === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    {expandedSection === idx && (
                      <div className="p-4 space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Section Name</Label>
                            <Input
                              value={section.name}
                              onChange={(e) => updateSection(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select 
                              value={section.frequency} 
                              onValueChange={(v) => updateSection(idx, 'frequency', v)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Prompts</Label>
                            <Button variant="ghost" size="sm" onClick={() => addPrompt(idx)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Prompt
                            </Button>
                          </div>
                          {(section.prompts || []).map((prompt, pIdx) => (
                            <div key={pIdx} className="flex gap-2">
                              <Input
                                value={prompt.question}
                                onChange={(e) => {
                                  const updated = [...sections]
                                  updated[idx].prompts[pIdx].question = e.target.value
                                  setSections(updated)
                                }}
                                placeholder="Enter prompt question..."
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={prompt.lines}
                                onChange={(e) => {
                                  const updated = [...sections]
                                  updated[idx].prompts[pIdx].lines = Number(e.target.value)
                                  setSections(updated)
                                }}
                                className="w-16"
                                min={1}
                                max={10}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  const updated = [...sections]
                                  updated[idx].prompts = updated[idx].prompts.filter((_, i) => i !== pIdx)
                                  setSections(updated)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Affirmations */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Daily Affirmations</h4>
                <Textarea
                  value={affirmations.join('\n')}
                  onChange={(e) => setAffirmations(e.target.value.split('\n').filter(a => a.trim()))}
                  rows={4}
                  placeholder="One affirmation per line..."
                />
              </div>

              {/* Quotes */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Inspirational Quotes</h4>
                <div className="text-sm text-muted-foreground mb-2">Format: &quot;Quote text&quot; - Author</div>
                <Textarea
                  value={quotes.map(q => `"${q.text}" - ${q.author}`).join('\n')}
                  onChange={(e) => {
                    const parsed = e.target.value.split('\n').map(line => {
                      const match = line.match(/"([^"]+)"\s*-\s*(.+)/)
                      return match ? { text: match[1], author: match[2] } : null
                    }).filter(Boolean)
                    setQuotes(parsed)
                  }}
                  rows={4}
                  placeholder='"The only way to do great work is to love what you do." - Steve Jobs'
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
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
              Step 3: Design Your Journal
            </CardTitle>
            <CardDescription>Choose colors, style, and page count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_SCHEMES.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setColorScheme(color.id)}
                        className={`p-3 rounded-lg ${color.color} text-white text-sm font-medium transition-all ${
                          colorScheme === color.id ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Cover Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COVER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setCoverStyle(style.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          coverStyle === style.id ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.name}</div>
                        <div className="text-xs text-muted-foreground">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Journal Pages: {pageCount} days</Label>
                  <Slider
                    value={[pageCount]}
                    onValueChange={([v]) => setPageCount(v)}
                    min={30}
                    max={365}
                    step={30}
                  />
                </div>

                {/* KDP Paper Size Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paper Size (KDP Standard)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {KDP_JOURNAL_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPaperSize(size.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          paperSize === size.id 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{size.name}</span>
                          {size.recommended && (
                            <Badge className="text-xs bg-green-100 text-green-800">Popular</Badge>
                          )}
                          {size.largeTrim && (
                            <Badge className="text-xs bg-amber-100 text-amber-800">Large</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{size.description}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Large trim sizes (7"+ wide or 9"+ tall) have higher print costs on KDP
                  </p>
                </div>
                
                {/* Cover Image Customization */}
                <div className="border rounded-lg p-4 space-y-3">
                  <CoverImagePrompt
                    coverImageStyle={coverImageStyle}
                    setCoverImageStyle={setCoverImageStyle}
                    customImagePrompt={customImagePrompt}
                    setCustomImagePrompt={setCustomImagePrompt}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Preview</Label>
                <div className={`aspect-[3/4] rounded-lg ${selectedColor?.color} p-6 text-white flex flex-col justify-between shadow-xl`}>
                  <div className="text-center pt-8">
                    <h3 className="text-lg font-bold">{cover.title || 'Your Journal Title'}</h3>
                    <p className="text-sm opacity-80 mt-2">{cover.subtitle}</p>
                  </div>
                  <div className="text-center space-y-1">
                    {cover.authorName && <p className="text-sm">by {cover.authorName}</p>}
                    <p className="text-xs opacity-60">{pageCount} days • {sections.length} sections</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Journal (30-60 sec)...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> Generate Journal PDF</>
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
              Your Journal is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedType?.icon || '📓'}</div>
              <h3 className="text-xl font-bold">{cover.title}</h3>
              <p className="text-muted-foreground">{cover.subtitle}</p>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{pageCount} days</span>
              </div>
              
              <a href={result.downloadUrl} download>
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </Button>
              </a>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(1); setResult(null); }}>
                Create Another Journal
              </Button>
              <Link href="/dashboard/library" className="flex-1">
                <Button variant="outline" className="w-full">View in Library</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  )
}
