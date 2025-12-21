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
  Loader2, Download, ArrowLeft, ArrowRight, Sparkles, CheckCircle,
  FolderOpen, Save, Clock, Trash2, Edit3, FilePlus, BookMarked,
  LayoutGrid, List, Calendar, Kanban, Target, Heart, Briefcase,
  GraduationCap, Users, Palette, Eye, FileJson, FileText, Copy,
  Plus, Settings, Database, Table, LayoutDashboard, Zap, Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

// Template Categories based on Notion's marketplace
const TEMPLATE_CATEGORIES = [
  {
    id: 'work',
    name: 'Work Templates',
    icon: Briefcase,
    color: 'from-blue-500 to-cyan-500',
    subcategories: [
      { id: 'product', name: 'Product Management', icon: '📦', description: 'Roadmaps, sprints, feature tracking' },
      { id: 'marketing', name: 'Marketing', icon: '📢', description: 'Campaigns, content calendars, analytics' },
      { id: 'design', name: 'Design', icon: '🎨', description: 'Design systems, asset libraries, feedback' },
      { id: 'engineering', name: 'Engineering', icon: '⚙️', description: 'Bug tracking, documentation, sprints' },
      { id: 'startup', name: 'Startup', icon: '🚀', description: 'Pitch decks, investor tracking, OKRs' },
      { id: 'operations', name: 'Operations', icon: '📊', description: 'SOPs, processes, team management' },
      { id: 'hr', name: 'HR & People', icon: '👥', description: 'Hiring, onboarding, employee directory' },
      { id: 'crm', name: 'CRM & Sales', icon: '💰', description: 'Lead tracking, pipeline, client management' }
    ]
  },
  {
    id: 'school',
    name: 'School Templates',
    icon: GraduationCap,
    color: 'from-purple-500 to-pink-500',
    subcategories: [
      { id: 'student-life', name: 'Student Life', icon: '🎓', description: 'Schedule, assignments, grades' },
      { id: 'study-planner', name: 'Study Planner', icon: '📚', description: 'Study sessions, exam prep, notes' },
      { id: 'class-notes', name: 'Class Notes', icon: '📝', description: 'Lecture notes, summaries, flashcards' },
      { id: 'career', name: 'Career Building', icon: '💼', description: 'Job applications, interview prep' },
      { id: 'research', name: 'Research', icon: '🔬', description: 'Literature review, citations, thesis' },
      { id: 'teaching', name: 'Teaching', icon: '👨‍🏫', description: 'Lesson plans, grading, curriculum' }
    ]
  },
  {
    id: 'life',
    name: 'Life Templates',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    subcategories: [
      { id: 'health', name: 'Health & Fitness', icon: '💪', description: 'Workouts, meal plans, habits' },
      { id: 'finance', name: 'Personal Finance', icon: '💵', description: 'Budget, expenses, savings goals' },
      { id: 'productivity', name: 'Personal Productivity', icon: '⚡', description: 'Daily planner, goals, reviews' },
      { id: 'hobbies', name: 'Hobbies', icon: '🎯', description: 'Collections, projects, learning' },
      { id: 'travel', name: 'Travel', icon: '✈️', description: 'Trip planning, packing lists, itineraries' },
      { id: 'journal', name: 'Journal & Reflection', icon: '📓', description: 'Daily journal, gratitude, mood tracking' },
      { id: 'home', name: 'Home Management', icon: '🏠', description: 'Chores, inventory, maintenance' }
    ]
  }
]

// Color themes for templates
const COLOR_THEMES = [
  { id: 'default', name: 'Notion Default', colors: { primary: '#000000', accent: '#2383e2', bg: '#ffffff' } },
  { id: 'ocean', name: 'Ocean Blue', colors: { primary: '#1e3a5f', accent: '#3b82f6', bg: '#f0f9ff' } },
  { id: 'forest', name: 'Forest Green', colors: { primary: '#14532d', accent: '#22c55e', bg: '#f0fdf4' } },
  { id: 'sunset', name: 'Sunset Orange', colors: { primary: '#7c2d12', accent: '#f97316', bg: '#fff7ed' } },
  { id: 'lavender', name: 'Lavender Purple', colors: { primary: '#4c1d95', accent: '#8b5cf6', bg: '#faf5ff' } },
  { id: 'rose', name: 'Rose Pink', colors: { primary: '#9f1239', accent: '#f43f5e', bg: '#fff1f2' } },
  { id: 'dark', name: 'Dark Mode', colors: { primary: '#ffffff', accent: '#6366f1', bg: '#1f2937' } }
]

// View types for databases
const VIEW_TYPES = [
  { id: 'table', name: 'Table', icon: Table, description: 'Spreadsheet-like view' },
  { id: 'board', name: 'Board', icon: Kanban, description: 'Kanban-style columns' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Date-based calendar' },
  { id: 'gallery', name: 'Gallery', icon: LayoutGrid, description: 'Card-based gallery' },
  { id: 'list', name: 'List', icon: List, description: 'Simple list view' }
]

export default function NotionTemplateMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isHydrated, setIsHydrated] = useState(false)

  // Drafts
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [showDrafts, setShowDrafts] = useState(false)

  // Step 1: Category & Type Selection
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)

  // Step 2: Template Configuration
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [colorTheme, setColorTheme] = useState('default')
  const [selectedViews, setSelectedViews] = useState(['table'])
  const [includeEmoji, setIncludeEmoji] = useState(true)
  const [includeCover, setIncludeCover] = useState(true)

  // Step 3: Content Generation
  const [contentLevel, setContentLevel] = useState('structure') // 'structure' or 'full'
  const [generatedTemplate, setGeneratedTemplate] = useState(null)

  // Step 4: Export
  const [exportFormat, setExportFormat] = useState('json')
  const [result, setResult] = useState(null)

  // Get current template data
  const getCurrentTemplateData = () => ({
    selectedCategory,
    selectedSubcategory,
    templateName,
    templateDescription,
    colorTheme,
    selectedViews,
    includeEmoji,
    includeCover,
    contentLevel,
    generatedTemplate,
    step
  })

  // Load template data
  const loadTemplateData = (data) => {
    if (data.selectedCategory) setSelectedCategory(data.selectedCategory)
    if (data.selectedSubcategory) setSelectedSubcategory(data.selectedSubcategory)
    if (data.templateName) setTemplateName(data.templateName)
    if (data.templateDescription) setTemplateDescription(data.templateDescription)
    if (data.colorTheme) setColorTheme(data.colorTheme)
    if (data.selectedViews) setSelectedViews(data.selectedViews)
    if (data.includeEmoji !== undefined) setIncludeEmoji(data.includeEmoji)
    if (data.includeCover !== undefined) setIncludeCover(data.includeCover)
    if (data.contentLevel) setContentLevel(data.contentLevel)
    if (data.generatedTemplate) setGeneratedTemplate(data.generatedTemplate)
    if (data.step) setStep(data.step)
  }

  // Load drafts from DB
  useEffect(() => {
    const loadDraftsFromDB = async () => {
      try {
        const res = await fetch('/api/notion-templates/drafts')
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
    const currentProgress = localStorage.getItem('notion-template-progress')
    if (currentProgress) {
      try {
        const data = JSON.parse(currentProgress)
        loadTemplateData(data)
        if (data.draftId) setCurrentDraftId(data.draftId)
        if (data.templateName) {
          toast({ 
            title: "Progress Restored", 
            description: `Continuing "${data.templateName}"` 
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
      ...getCurrentTemplateData(),
      draftId: currentDraftId,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('notion-template-progress', JSON.stringify(saveData))
  }, [isHydrated, selectedCategory, selectedSubcategory, templateName, templateDescription, colorTheme, selectedViews, includeEmoji, includeCover, contentLevel, generatedTemplate, step, currentDraftId])

  // Save draft to DB
  const saveDraft = async () => {
    const draftTitle = templateName || 'Untitled Template'
    const draftData = {
      id: currentDraftId || undefined,
      title: draftTitle,
      subtitle: selectedSubcategory ? TEMPLATE_CATEGORIES.flatMap(c => c.subcategories).find(s => s.id === selectedSubcategory)?.name : '',
      step,
      data: getCurrentTemplateData()
    }
    
    try {
      const res = await fetch('/api/notion-templates/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      })
      
      const result = await res.json()
      
      if (result.success) {
        const draftsRes = await fetch('/api/notion-templates/drafts')
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
    loadTemplateData(draft.data)
    setCurrentDraftId(draft.id)
    setShowDrafts(false)
    toast({ title: "Draft Loaded", description: `Editing "${draft.title}"` })
  }

  // Delete draft
  const deleteDraft = async (draftId) => {
    try {
      await fetch(`/api/notion-templates/drafts?id=${draftId}`, { method: 'DELETE' })
      setDrafts(drafts.filter(d => d.id !== draftId))
      if (currentDraftId === draftId) setCurrentDraftId(null)
      toast({ title: "Draft Deleted" })
    } catch (error) {
      toast({ title: "Delete Failed", variant: "destructive" })
    }
  }

  // Start new template
  const startNew = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setTemplateName('')
    setTemplateDescription('')
    setColorTheme('default')
    setSelectedViews(['table'])
    setIncludeEmoji(true)
    setIncludeCover(true)
    setContentLevel('structure')
    setGeneratedTemplate(null)
    setResult(null)
    setStep(1)
    setCurrentDraftId(null)
    setShowDrafts(false)
    localStorage.removeItem('notion-template-progress')
    toast({ title: "Ready for New Template" })
  }

  // Handle category selection
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    setSelectedSubcategory(null)
  }

  // Handle subcategory selection and auto-fill name
  const handleSubcategorySelect = (subId) => {
    setSelectedSubcategory(subId)
    const sub = TEMPLATE_CATEGORIES.flatMap(c => c.subcategories).find(s => s.id === subId)
    if (sub && !templateName) {
      setTemplateName(`${sub.name} Dashboard`)
      setTemplateDescription(sub.description)
    }
  }

  // Toggle view selection
  const toggleView = (viewId) => {
    if (selectedViews.includes(viewId)) {
      if (selectedViews.length > 1) {
        setSelectedViews(selectedViews.filter(v => v !== viewId))
      }
    } else {
      setSelectedViews([...selectedViews, viewId])
    }
  }

  // Generate template structure
  const generateTemplate = async () => {
    if (!selectedSubcategory || !templateName) {
      toast({ title: "Missing Info", description: "Please select a category and enter a name", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notion-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          subcategory: selectedSubcategory,
          name: templateName,
          description: templateDescription,
          colorTheme,
          views: selectedViews,
          includeEmoji,
          includeCover,
          contentLevel
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setGeneratedTemplate(data.template)
      setStep(3)
      toast({ title: "Template Generated!", description: "Review and customize your template" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Export template
  const exportTemplate = async (format) => {
    if (!generatedTemplate) {
      toast({ title: "No Template", description: "Generate a template first", variant: "destructive" })
      return
    }

    setLoading(true)
    setExportFormat(format)
    try {
      const response = await fetch('/api/notion-templates/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: generatedTemplate,
          format,
          colorTheme: COLOR_THEMES.find(t => t.id === colorTheme)
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Export Ready!", description: `Your ${format.toUpperCase()} is ready for download` })
    } catch (error) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Copy JSON to clipboard
  const copyToClipboard = async () => {
    if (result?.json) {
      await navigator.clipboard.writeText(JSON.stringify(result.json, null, 2))
      toast({ title: "Copied!", description: "JSON copied to clipboard" })
    }
  }

  // Get selected category object
  const getCategoryObject = () => TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)
  const getSubcategoryObject = () => TEMPLATE_CATEGORIES.flatMap(c => c.subcategories).find(s => s.id === selectedSubcategory)

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
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Notion Template Maker
          </h1>
          <p className="text-muted-foreground">Create professional Notion templates to sell or use</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDrafts(!showDrafts)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Drafts {drafts.length > 0 && `(${drafts.length})`}
          </Button>
          {templateName && (
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
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => s < step && setStep(s)}
              disabled={s > step}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              } ${s < step ? 'cursor-pointer hover:scale-110' : s > step ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </button>
            {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-12 text-xs text-muted-foreground">
        {['Category', 'Configure', 'Preview', 'Export'].map((label, idx) => (
          <span key={label} className={step === idx + 1 ? 'text-primary font-medium' : ''}>{label}</span>
        ))}
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-blue-500" />
                Step 1: Choose Template Category
              </CardTitle>
              <CardDescription>Select a category and type for your Notion template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Categories */}
              <div className="grid md:grid-cols-3 gap-4">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        selectedCategory === cat.id 
                          ? 'border-primary bg-primary/10 shadow-lg' 
                          : 'border-border hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cat.subcategories.length} template types
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Subcategories */}
              {selectedCategory && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Template Type</Label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {getCategoryObject()?.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategorySelect(sub.id)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedSubcategory === sub.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{sub.icon}</span>
                          <span className="font-medium">{sub.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{sub.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(2)}
                disabled={!selectedSubcategory}
              >
                Continue to Configure <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Configure Template */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                Step 2: Configure Your Template
              </CardTitle>
              <CardDescription>Customize the name, theme, and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Ultimate Project Tracker"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="What this template helps with..."
                  />
                </div>
              </div>

              {/* Color Theme */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Color Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        colorTheme === theme.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: theme.colors.bg }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Database Views */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Database Views</Label>
                <p className="text-sm text-muted-foreground">Select which views to include in your template</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {VIEW_TYPES.map((view) => {
                    const IconComponent = view.icon
                    return (
                      <button
                        key={view.id}
                        onClick={() => toggleView(view.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          selectedViews.includes(view.id) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <IconComponent className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm font-medium">{view.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Include Emoji Icons</Label>
                    <p className="text-xs text-muted-foreground">Add emojis to pages and properties</p>
                  </div>
                  <Switch checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label>Include Cover Image</Label>
                    <p className="text-xs text-muted-foreground">Add decorative cover images</p>
                  </div>
                  <Switch checked={includeCover} onCheckedChange={setIncludeCover} />
                </div>
              </div>

              {/* Content Level */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">AI Content Generation</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setContentLevel('structure')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      contentLevel === 'structure' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5" />
                      <span className="font-semibold">Structure Only</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate database structure, properties, and views. You fill in the content.
                    </p>
                  </button>
                  <button
                    onClick={() => setContentLevel('full')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      contentLevel === 'full' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-semibold">Full Content</span>
                      <Badge variant="secondary">AI Powered</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate complete template with sample data, descriptions, and instructions.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={generateTemplate} disabled={loading || !templateName}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Template</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 3 && generatedTemplate && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                Step 3: Preview Your Template
              </CardTitle>
              <CardDescription>Review and customize before exporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Preview */}
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div 
                  className="p-6"
                  style={{ backgroundColor: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.bg }}
                >
                  {includeCover && (
                    <div 
                      className="h-32 rounded-lg mb-4 bg-gradient-to-r from-primary/20 to-primary/40"
                      style={{ backgroundColor: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent + '30' }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    {includeEmoji && <span className="text-4xl">{generatedTemplate.emoji}</span>}
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.primary }}>
                        {generatedTemplate.title}
                      </h2>
                      <p className="text-muted-foreground">{generatedTemplate.description}</p>
                    </div>
                  </div>
                </div>

                {/* Database Preview */}
                <div className="p-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" /> Database Structure
                  </h3>
                  
                  {/* Properties */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm">Properties ({generatedTemplate.properties?.length || 0})</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedTemplate.properties?.map((prop, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          <span>{prop.icon}</span>
                          <span>{prop.name}</span>
                          <span className="text-xs text-muted-foreground">({prop.type})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Views */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm">Views ({generatedTemplate.views?.length || 0})</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedTemplate.views?.map((view, idx) => (
                        <Badge key={idx} variant="secondary">
                          {VIEW_TYPES.find(v => v.id === view.type)?.name || view.type} - {view.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Sample Data */}
                  {contentLevel === 'full' && generatedTemplate.sampleData && (
                    <div className="space-y-2">
                      <Label className="text-sm">Sample Data ({generatedTemplate.sampleData.length} items)</Label>
                      <div className="max-h-48 overflow-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              {generatedTemplate.properties?.slice(0, 4).map((prop, idx) => (
                                <th key={idx} className="p-2 text-left font-medium">{prop.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {generatedTemplate.sampleData.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="border-t">
                                {generatedTemplate.properties?.slice(0, 4).map((prop, pIdx) => (
                                  <td key={pIdx} className="p-2">{row[prop.name] || '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Export Format</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => exportTemplate('json')}
                    disabled={loading}
                    className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">Notion JSON</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Import directly into Notion</p>
                  </button>
                  <button
                    onClick={() => exportTemplate('pdf')}
                    disabled={loading}
                    className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="font-semibold">PDF Preview</span>
                    </div>
                    <p className="text-sm text-muted-foreground">For showcasing/selling</p>
                  </button>
                  <button
                    onClick={() => exportTemplate('markdown')}
                    disabled={loading}
                    className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">Markdown</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Universal format</p>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Download */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Step 4: Download Your Template
            </CardTitle>
            <CardDescription>Your Notion template is ready!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{generatedTemplate?.title}</h3>
              <p className="text-muted-foreground mb-4">{generatedTemplate?.description}</p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Badge variant="secondary">{generatedTemplate?.properties?.length || 0} Properties</Badge>
                <Badge variant="secondary">{generatedTemplate?.views?.length || 0} Views</Badge>
                {contentLevel === 'full' && (
                  <Badge variant="secondary">{generatedTemplate?.sampleData?.length || 0} Sample Items</Badge>
                )}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.downloadUrl && (
                <a href={result.downloadUrl} download className="block">
                  <Button className="w-full" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download {exportFormat.toUpperCase()}
                  </Button>
                </a>
              )}
              
              {result.json && (
                <Button variant="outline" size="lg" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy JSON to Clipboard
                </Button>
              )}
            </div>

            {/* JSON Preview */}
            {result.json && (
              <div className="space-y-2">
                <Label>JSON Preview</Label>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(result.json, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Preview
              </Button>
              <Button variant="outline" onClick={() => exportTemplate(exportFormat === 'json' ? 'pdf' : 'json')}>
                <Zap className="mr-2 h-4 w-4" />
                Export as {exportFormat === 'json' ? 'PDF' : 'JSON'}
              </Button>
              <Button className="flex-1" onClick={startNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Another Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
