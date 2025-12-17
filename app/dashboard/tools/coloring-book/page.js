'use client'

import { useState, useEffect } from 'react'
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
  ChevronDown, ChevronUp, RefreshCw, Save, FolderOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import DraftsManager from '@/components/shared/DraftsManager'

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

export default function ColoringBookPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Step 1: Theme & Settings
  const [theme, setTheme] = useState('animals')
  const [customTheme, setCustomTheme] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [pageCount, setPageCount] = useState(10)
  const [bookTitle, setBookTitle] = useState('')
  const [authorName, setAuthorName] = useState('')

  // Step 2: Pages (editable)
  const [pages, setPages] = useState([])
  const [expandedPage, setExpandedPage] = useState(null)

  // Step 3: Result
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

  // Get current data for drafts
  const getCurrentData = () => ({
    title: bookTitle || `${customTheme || theme} Coloring Book`,
    theme,
    customTheme,
    difficulty,
    pageCount,
    bookTitle,
    authorName,
    pages,
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
    if (data.step && data.step > 1) setStep(Math.min(data.step, 2))
    setResult(null)
  }

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setTheme('animals')
    setCustomTheme('')
    setDifficulty('medium')
    setPageCount(10)
    setBookTitle('')
    setAuthorName('')
    setPages([])
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
          authorName
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setPages(data.pages || [])
      setStep(2)
      toast({ title: "Pages Generated!", description: `${data.pages?.length || pageCount} page ideas created. Edit them below!` })
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

    setLoading(true)
    try {
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
          authorName
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(3)
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
          <p className="text-muted-foreground">Create AI-generated coloring pages for all ages</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Sell for $5-$15
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-16 text-xs text-muted-foreground">
        <span>Theme</span>
        <span>Edit Pages</span>
        <span>Download</span>
      </div>

      {/* Step 1: Theme Selection */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Selection */}
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
                      className={`p-4 rounded-lg border text-center transition-all ${
                        theme === t.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{t.icon}</div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t.examples}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Theme Input */}
                {theme === 'custom' && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 space-y-3">
                    <Label className="text-purple-700 dark:text-purple-300 font-medium">
                      ✏️ Enter Your Custom Theme/Niche
                    </Label>
                    <Input
                      placeholder="e.g., Vintage Motorcycles, Japanese Gardens, African Wildlife, Steampunk Robots..."
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Be specific! The more detailed your niche, the better your coloring pages will be.
                    </p>
                  </div>
                )}

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
                            <span className="text-xs text-muted-foreground ml-2">- {level.description}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Pages: {pageCount}</Label>
                    <Slider
                      value={[pageCount]}
                      onValueChange={(v) => setPageCount(v[0])}
                      min={5}
                      max={50}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 pages</span>
                      <span>50 pages</span>
                    </div>
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
                    <Label>Author/Creator Name (Optional)</Label>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-green-500" />
                    Step 2: Edit Your Coloring Pages
                  </CardTitle>
                  <CardDescription>Customize titles and descriptions for each page. Add or remove pages as needed.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addPage}>
                    <Plus className="h-4 w-4 mr-1" /> Add Page
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePages} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Regenerate All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pages yet. Click "Add Page" to create one.</p>
                </div>
              ) : (
                pages.map((page, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                      onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="font-medium">{page.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); movePage(idx, -1) }}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); movePage(idx, 1) }}
                          disabled={idx === pages.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); removePage(idx) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedPage === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {expandedPage === idx && (
                      <div className="p-4 space-y-4 bg-background">
                        <div className="space-y-2">
                          <Label>Page Title</Label>
                          <Input
                            value={page.title}
                            onChange={(e) => updatePage(idx, 'title', e.target.value)}
                            placeholder="e.g., Majestic Lion in the Savanna"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (what should be drawn)</Label>
                          <Textarea
                            value={page.description}
                            onChange={(e) => updatePage(idx, 'description', e.target.value)}
                            placeholder="Describe the scene in detail: A powerful lion with a flowing mane, standing on a rocky outcrop overlooking the African savanna at sunset..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Elements (comma-separated)</Label>
                          <Input
                            value={page.elements?.join(', ') || ''}
                            onChange={(e) => updatePage(idx, 'elements', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="lion, rocks, sunset, savanna grass, trees"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Theme
                </Button>
                <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading || pages.length === 0}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating PDF...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Coloring Book PDF ({pages.length} pages)</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Download */}
      {step === 3 && result && (
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
                  💰 Where to Sell Your Coloring Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Amazon KDP</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Print-on-demand paperbacks. Upload PDF, set price, earn royalties!</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Etsy</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Instant download PDFs. Best for bundles and themed collections.</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Gumroad</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Direct sales with low fees. Great for building an email list.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(2) }}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Pages
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
