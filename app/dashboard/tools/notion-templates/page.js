'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Download, ArrowLeft, ArrowRight, CheckCircle,
  FolderOpen, Save, Clock, Trash2, Edit3, FilePlus, BookMarked,
  LayoutGrid, List, Calendar, Kanban, Target, Heart, Briefcase,
  GraduationCap, Users, Palette, Eye, FileJson, FileText, Copy,
  Plus, Settings, Database, Table, LayoutDashboard, Zap, Globe
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
  const { checkAndDeduct, refund, complete } = useCredits()
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
    // First, remove localStorage to prevent it from being restored
    localStorage.removeItem('notion-template-progress')
    
    // Reset all state
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
    
    // Clear localStorage again after state reset to prevent auto-save from restoring old data
    setTimeout(() => {
      localStorage.removeItem('notion-template-progress')
    }, 100)
    
    toast({ title: "Ready for New Template", description: "Starting fresh!" })
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
                      <Zap className="h-5 w-5" />
                      <span className="font-semibold">Full Content</span>
                      <Badge variant="secondary">AI Powered</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate complete template with sample data, descriptions, and instructions.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <CreditCostBadge toolId="notion-templates" />
                <Button className="flex-1" onClick={generateTemplate} disabled={loading || !templateName}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Generate Template</>
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
              <CardDescription>Preview your premium template - ready for Notion or selling on Gumroad/Etsy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Premium Template Preview - Like Notion Marketplace */}
              <div className="border-2 rounded-xl overflow-hidden shadow-lg">
                {/* Gradient Banner */}
                <div 
                  className="h-36 bg-gradient-to-r flex items-end p-6"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent || '#3b82f6'}, ${COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent || '#3b82f6'}dd)` 
                  }}
                >
                  <div className="flex items-center gap-4 text-white">
                    <span className="text-5xl bg-white/20 p-3 rounded-xl">{includeEmoji ? generatedTemplate.emoji : '📋'}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{generatedTemplate.title}</h2>
                      {generatedTemplate.tagline && (
                        <p className="text-white/90 text-sm">{generatedTemplate.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-card">
                  {/* Database Navigation Tabs */}
                  {generatedTemplate.databases?.length > 0 && (
                    <div className="border-b px-4 py-2 flex gap-1 overflow-x-auto bg-muted/30">
                      {generatedTemplate.databases.map((db, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${idx === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                          <span>{db.emoji || '📊'}</span>
                          <span>{db.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid lg:grid-cols-4 gap-0">
                    {/* Left Sidebar - Quick Actions */}
                    <div className="border-r p-4 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h4>
                      <div className="space-y-1.5">
                        {generatedTemplate.databases?.slice(0, 8).map((db, idx) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                            <span>New {db.name.replace(/s$/, '').replace(' Database', '').replace(' Pipeline', '').split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Dashboard Area */}
                    <div className="lg:col-span-3 p-4">
                      {/* Dashboard Widgets Grid */}
                      {generatedTemplate.dashboardSections?.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          {generatedTemplate.dashboardSections.slice(0, 4).map((section, idx) => (
                            <div key={idx} className="border rounded-lg p-4 bg-card">
                              <h5 className="text-sm font-semibold mb-3">{section.title}</h5>
                              
                              {/* Mock Chart Visualizations */}
                              {section.type === 'chart' && (
                                <div className="flex items-end gap-2 h-24 px-4">
                                  {[65, 45, 80, 35, 90, 55].map((h, i) => (
                                    <div 
                                      key={i} 
                                      className="flex-1 rounded-t transition-all hover:opacity-80"
                                      style={{ 
                                        height: `${h}%`, 
                                        backgroundColor: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent || '#3b82f6',
                                        opacity: 0.7 + (i * 0.05)
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {section.type === 'funnel' && (
                                <div className="flex flex-col items-center gap-1">
                                  {['Lead', 'Qualified', 'Proposal', 'Closed'].map((stage, i) => (
                                    <div 
                                      key={i}
                                      className="rounded text-xs text-white text-center py-1 transition-all"
                                      style={{ 
                                        width: `${100 - (i * 20)}%`,
                                        backgroundColor: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent || '#3b82f6',
                                        opacity: 1 - (i * 0.15)
                                      }}
                                    >
                                      {stage}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {section.type === 'metric' && (
                                <div className="flex items-center justify-center h-20">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold" style={{ color: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent }}>
                                      {idx === 0 ? '$127K' : idx === 1 ? '68%' : '24'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{section.description}</div>
                                  </div>
                                </div>
                              )}
                              
                              {section.type === 'progress' && (
                                <div className="space-y-2">
                                  {['Q1 Goals', 'Q2 Goals', 'Team OKRs'].map((item, i) => (
                                    <div key={i}>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>{item}</span>
                                        <span>{70 + (i * 10)}%</span>
                                      </div>
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full transition-all"
                                          style={{ 
                                            width: `${70 + (i * 10)}%`,
                                            backgroundColor: COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {(section.type === 'list' || section.type === 'table') && (
                                <div className="space-y-2">
                                  {['Item 1 - In Progress', 'Item 2 - Review', 'Item 3 - Done'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                      <span className="text-muted-foreground">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {section.type === 'calendar' && (
                                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} className="text-muted-foreground font-medium">{d}</div>
                                  ))}
                                  {Array.from({length: 14}, (_, i) => (
                                    <div 
                                      key={i} 
                                      className={`p-1 rounded ${[2, 5, 9, 12].includes(i) ? 'text-white' : ''}`}
                                      style={{ backgroundColor: [2, 5, 9, 12].includes(i) ? COLOR_THEMES.find(t => t.id === colorTheme)?.colors.accent : 'transparent' }}
                                    >
                                      {i + 1}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {section.type === 'metrics' && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  {[{label: 'Total', value: '156'}, {label: 'Active', value: '42'}, {label: 'Done', value: '114'}].map((m, i) => (
                                    <div key={i} className="p-2 bg-muted rounded">
                                      <div className="text-lg font-bold">{m.value}</div>
                                      <div className="text-xs text-muted-foreground">{m.label}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Active Items Preview */}
                      {contentLevel === 'full' && generatedTemplate.databases?.[0]?.sampleData?.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                            <h5 className="text-sm font-semibold">Active {generatedTemplate.databases[0].name}</h5>
                            <Badge variant="secondary" className="text-xs">{generatedTemplate.databases[0].sampleData.length} items</Badge>
                          </div>
                          <div className="divide-y">
                            {generatedTemplate.databases[0].sampleData.slice(0, 4).map((item, idx) => {
                              const titleProp = generatedTemplate.databases[0].properties.find(p => p.type === 'title')
                              const statusProp = generatedTemplate.databases[0].properties.find(p => p.name === 'Status' || p.name === 'Stage')
                              const title = titleProp ? item[titleProp.name] : Object.values(item)[0]
                              const status = statusProp ? item[statusProp.name] : null
                              
                              return (
                                <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                    {status && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          status.includes('Progress') || status.includes('Active') ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                          status.includes('Done') || status.includes('Won') || status.includes('Completed') ? 'border-green-500 text-green-600 bg-green-50' :
                                          status.includes('Review') || status.includes('Negotiation') ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                                          'border-gray-300'
                                        }`}
                                      >
                                        {status}
                                      </Badge>
                                    )}
                                    <span className="text-sm font-medium">{String(title).substring(0, 40)}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Inside Section */}
              <div className="border rounded-lg p-5 bg-gradient-to-br from-muted/30 to-muted/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" /> What&apos;s Inside?
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedTemplate.databases?.map((db, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                      <span className="text-2xl">{db.emoji || '📊'}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{db.name}</h4>
                        <p className="text-xs text-muted-foreground">{db.description || `Manage your ${db.name.toLowerCase()}`}</p>
                      </div>
                    </div>
                  ))}
                  {generatedTemplate.dashboardSections?.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h4 className="font-semibold text-sm">Visual Dashboard</h4>
                        <p className="text-xs text-muted-foreground">{generatedTemplate.dashboardSections.length} widgets with charts & metrics</p>
                      </div>
                    </div>
                  )}
                  {generatedTemplate.gettingStarted?.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                      <span className="text-2xl">📖</span>
                      <div>
                        <h4 className="font-semibold text-sm">Getting Started Guide</h4>
                        <p className="text-xs text-muted-foreground">{generatedTemplate.gettingStarted.length}-step setup walkthrough</p>
                      </div>
                    </div>
                  )}
                  {contentLevel === 'full' && (
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h4 className="font-semibold text-sm">Sample Data</h4>
                        <p className="text-xs text-muted-foreground">Pre-filled examples to get started fast</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories/Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Categories:</span>
                <Badge variant="secondary">{selectedCategory}</Badge>
                <Badge variant="outline">{getSubcategoryObject()?.name}</Badge>
                <Badge variant="outline">Productivity</Badge>
                {generatedTemplate.databases?.length >= 3 && <Badge variant="outline">Multi-Database</Badge>}
                {contentLevel === 'full' && <Badge variant="outline">Sample Data</Badge>}
              </div>

              {/* Getting Started Guide */}
              {generatedTemplate.gettingStarted?.length > 0 && (
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                    <BookMarked className="h-4 w-4" /> Getting Started Guide
                  </h3>
                  <div className="space-y-2 text-sm text-green-700">
                    {generatedTemplate.gettingStarted.slice(0, 4).map((step, idx) => (
                      <p key={idx}>{step}</p>
                    ))}
                    {generatedTemplate.gettingStarted.length > 4 && (
                      <p className="text-green-600">+ {generatedTemplate.gettingStarted.length - 4} more steps in full template</p>
                    )}
                  </div>
                </div>
              )}

              {/* Dashboard Sections Preview */}
              {generatedTemplate.dashboardSections?.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-purple-500" /> Dashboard Widgets
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {generatedTemplate.dashboardSections.map((section, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{section.description}</div>
                        <Badge variant="outline" className="mt-2 text-xs">{section.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Databases */}
              {generatedTemplate.databases?.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" /> Databases ({generatedTemplate.databases.length})
                  </h3>
                  <div className="space-y-4">
                    {generatedTemplate.databases.map((db, dbIdx) => (
                      <div key={dbIdx} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{db.emoji || '📊'}</span>
                          <div>
                            <h4 className="font-semibold">{db.name}</h4>
                            {db.description && <p className="text-xs text-muted-foreground">{db.description}</p>}
                          </div>
                        </div>
                        
                        {/* Properties */}
                        <div className="mb-3">
                          <Label className="text-xs mb-2 block">Properties ({db.properties?.length || 0})</Label>
                          <div className="flex flex-wrap gap-1">
                            {db.properties?.slice(0, 8).map((prop, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {prop.icon} {prop.name}
                              </Badge>
                            ))}
                            {(db.properties?.length || 0) > 8 && (
                              <Badge variant="secondary" className="text-xs">+{db.properties.length - 8} more</Badge>
                            )}
                          </div>
                        </div>

                        {/* Sample Data Preview */}
                        {contentLevel === 'full' && db.sampleData?.length > 0 && (
                          <div>
                            <Label className="text-xs mb-2 block">Sample Data ({db.sampleData.length} items)</Label>
                            <div className="overflow-auto max-h-32 border rounded">
                              <table className="w-full text-xs">
                                <thead className="bg-muted">
                                  <tr>
                                    {db.properties?.slice(0, 3).map((prop, idx) => (
                                      <th key={idx} className="p-2 text-left">{prop.name}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {db.sampleData.slice(0, 3).map((row, idx) => (
                                    <tr key={idx} className="border-t">
                                      {db.properties?.slice(0, 3).map((prop, pIdx) => (
                                        <td key={pIdx} className="p-2">
                                          {Array.isArray(row[prop.name]) 
                                            ? row[prop.name].slice(0, 2).join(', ')
                                            : String(row[prop.name] || '-').substring(0, 25)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pre-configured Views */}
              {(generatedTemplate.allViews?.length > 0 || generatedTemplate.views?.length > 0) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-purple-500" /> Pre-configured Views
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(generatedTemplate.allViews || generatedTemplate.views || []).map((view, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {view.type === 'board' && <Kanban className="h-3 w-3" />}
                        {view.type === 'calendar' && <Calendar className="h-3 w-3" />}
                        {view.type === 'table' && <Table className="h-3 w-3" />}
                        {view.type === 'gallery' && <LayoutGrid className="h-3 w-3" />}
                        {view.type === 'list' && <List className="h-3 w-3" />}
                        {view.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="space-y-4">
                {/* Important Notice */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span> Important: About Exports
                  </h4>
                  <p className="text-sm text-amber-700 mb-2">
                    The preview above shows what your template <strong>can look like</strong> after setup. 
                    Notion&apos;s import creates the basic structure - you&apos;ll need to add the visual polish manually.
                  </p>
                  <p className="text-xs text-amber-600">
                    The Markdown export includes a complete setup guide with step-by-step instructions.
                  </p>
                </div>

                <Label className="text-base font-semibold">Choose Export Format</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => exportTemplate('markdown')}
                    disabled={loading}
                    className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all text-left relative"
                  >
                    <Badge className="absolute -top-2 -right-2 bg-blue-500">Recommended</Badge>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Setup Guide</span>
                    </div>
                    <p className="text-sm text-blue-700 font-medium mb-1">Complete Blueprint</p>
                    <p className="text-xs text-blue-600">
                      Step-by-step instructions to recreate the full template with all {generatedTemplate.databases?.length || 1} databases, views, and dashboard
                    </p>
                  </button>
                  <button
                    onClick={() => exportTemplate('csv')}
                    disabled={loading}
                    className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Table className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">CSV Data</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Quick Database Import</p>
                    <p className="text-xs text-muted-foreground">
                      Imports main database with data directly. Good for quick start but only 1 database.
                    </p>
                  </button>
                  <button
                    onClick={() => exportTemplate('pdf')}
                    disabled={loading}
                    className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="h-5 w-5 text-red-500" />
                      <span className="font-semibold">PDF Preview</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">For Selling</p>
                    <p className="text-xs text-muted-foreground">
                      Visual preview to showcase/sell your template on Gumroad or Etsy
                    </p>
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
            <CardDescription>Your Notion template is ready for import!</CardDescription>
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

            {/* Download Button */}
            {result.downloadUrl && (
              <a href={result.downloadUrl} download className="block">
                <Button className="w-full" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download {exportFormat.toUpperCase()} File
                </Button>
              </a>
            )}

            {/* Import Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">How to Import into Notion:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                {exportFormat === 'csv' && (
                  <>
                    <li>Open Notion and go to your workspace</li>
                    <li>Click &quot;Import&quot; from the sidebar (or ... menu → Import)</li>
                    <li>Select &quot;CSV&quot; and upload the downloaded file</li>
                    <li>Notion will create a new database with your data!</li>
                  </>
                )}
                {exportFormat === 'markdown' && (
                  <>
                    <li>Open Notion and go to your workspace</li>
                    <li>Click &quot;Import&quot; from the sidebar (or ... menu → Import)</li>
                    <li>Select &quot;Text &amp; Markdown&quot; and upload the .md file</li>
                    <li>Notion will create a new page with your template structure!</li>
                  </>
                )}
                {exportFormat === 'pdf' && (
                  <>
                    <li>This PDF is a preview/showcase of your template</li>
                    <li>Use it to sell on Gumroad, Etsy, or share with clients</li>
                    <li>For actual Notion import, use CSV or Markdown format</li>
                  </>
                )}
              </ol>
            </div>

            {/* Markdown/CSV Preview */}
            {result.markdown && (
              <div className="space-y-2">
                <Label>Markdown Preview</Label>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                  {result.markdown}
                </pre>
              </div>
            )}
            
            {result.csv && (
              <div className="space-y-2">
                <Label>CSV Preview (first few rows)</Label>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                  {result.csv.split('\n').slice(0, 6).join('\n')}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Preview
              </Button>
              {exportFormat !== 'csv' && (
                <Button variant="outline" onClick={() => exportTemplate('csv')}>
                  <Table className="mr-2 h-4 w-4" /> Export as CSV
                </Button>
              )}
              {exportFormat !== 'markdown' && (
                <Button variant="outline" onClick={() => exportTemplate('markdown')}>
                  <FileText className="mr-2 h-4 w-4" /> Export as Markdown
                </Button>
              )}
              {exportFormat !== 'pdf' && (
                <Button variant="outline" onClick={() => exportTemplate('pdf')}>
                  <FileJson className="mr-2 h-4 w-4" /> Export as PDF
                </Button>
              )}
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
