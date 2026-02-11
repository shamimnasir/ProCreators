'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Sparkles, ArrowLeft, ArrowRight, CheckCircle, DollarSign, Plus, Trash2, Save, FolderOpen, FilePlus, Clock, Edit3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

// Import shared components for Pro features
import CoverImagePrompt from '@/components/shared/CoverImagePrompt'
import PaperSizeSelector from '@/components/shared/PaperSizeSelector'
import { getSizeById } from '@/lib/paper-sizes'

const CHECKLIST_TYPES = [
  { id: 'habit', name: 'Habit Tracker', icon: '✓', description: '30-day habit tracking grid', isTracker: true },
  { id: 'goal', name: 'Goal Tracker', icon: '🎯', description: 'Track progress towards goals', isTracker: true },
  { id: 'fitness', name: 'Fitness Tracker', icon: '💪', description: 'Workout & exercise log', isTracker: true },
  { id: 'savings', name: 'Savings Tracker', icon: '💰', description: 'Money saving challenges', isTracker: true },
  { id: 'cleaning', name: 'Cleaning Checklist', icon: '🧹', description: 'Home cleaning tasks', isTracker: false },
  { id: 'travel', name: 'Travel Packing', icon: '✈️', description: 'Packing list template', isTracker: false },
  { id: 'grocery', name: 'Grocery List', icon: '🛒', description: 'Shopping list by category', isTracker: false },
  { id: 'project', name: 'Project Checklist', icon: '📋', description: 'Task tracking', isTracker: false },
  { id: 'morning', name: 'Morning Routine', icon: '☀️', description: 'Daily morning routine', isTracker: true },
  { id: 'evening', name: 'Evening Routine', icon: '🌙', description: 'Evening wind-down', isTracker: true },
  { id: 'custom', name: 'Custom', icon: '✏️', description: 'Create your own tracker or checklist', isTracker: null },
]

const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean lines and bold colors' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  { id: 'colorful', name: 'Colorful', description: 'Vibrant and playful' },
  { id: 'nature', name: 'Nature', description: 'Earthy and calming' },
]

const STEP_LABELS = ['Type', 'Content', 'Design', 'Generate']

export default function ChecklistMakerPage() {
  // Core state
  const [step, setStep] = useState(1)
  const [checklistType, setChecklistType] = useState('habit')
  const [isCustomTracker, setIsCustomTracker] = useState(true) // For custom type: true=tracker, false=checklist
  const [customTitle, setCustomTitle] = useState('')
  const [customItems, setCustomItems] = useState('')
  const [trackingDays, setTrackingDays] = useState(30)
  const [designStyle, setDesignStyle] = useState('colorful')
  const [paperSize, setPaperSize] = useState('8.5x11')
  
  // Cover customization
  const [coverImageStyle, setCoverImageStyle] = useState('abstract')
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  
  // Generation state
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  
  // Drafts state
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  
  const selectedType = CHECKLIST_TYPES.find(c => c.id === checklistType)
  const isTracker = checklistType === 'custom' ? isCustomTracker : selectedType?.isTracker

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/drafts?toolType=checklist')
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
    checklistType,
    isCustomTracker,
    customTitle,
    customItems,
    trackingDays,
    designStyle,
    paperSize,
    coverImageStyle,
    customImagePrompt,
    step,
    generated,
  }), [checklistType, isCustomTracker, customTitle, customItems, trackingDays, designStyle, paperSize, coverImageStyle, customImagePrompt, step, generated])

  // Auto-save every 30 seconds if there are changes
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
      const title = customTitle || `My ${selectedType?.name || 'Checklist'}`
      
      if (currentDraftId) {
        // Update existing draft
        const res = await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, data })
        })
        if (res.ok) {
          setLastSaved(new Date())
          setDrafts(prev => prev.map(d => d.id === currentDraftId ? { ...d, title, data, updatedAt: new Date().toISOString() } : d))
          toast({ title: "Saved!", description: "Draft updated successfully" })
        }
      } else {
        // Create new draft
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolType: 'checklist', title, data })
        })
        const result = await res.json()
        if (result.success) {
          setCurrentDraftId(result.draft.id)
          setDrafts(prev => [result.draft, ...prev])
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

  // Load draft data into form
  const loadDraft = (draft) => {
    const data = draft.data
    if (data.checklistType) setChecklistType(data.checklistType)
    if (data.isCustomTracker !== undefined) setIsCustomTracker(data.isCustomTracker)
    if (data.customTitle) setCustomTitle(data.customTitle)
    if (data.customItems) setCustomItems(data.customItems)
    if (data.trackingDays) setTrackingDays(data.trackingDays)
    if (data.designStyle) setDesignStyle(data.designStyle)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.coverImageStyle) setCoverImageStyle(data.coverImageStyle)
    if (data.customImagePrompt) setCustomImagePrompt(data.customImagePrompt)
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
    setChecklistType('habit')
    setIsCustomTracker(true)
    setCustomTitle('')
    setCustomItems('')
    setTrackingDays(30)
    setDesignStyle('colorful')
    setPaperSize('8.5x11')
    setCoverImageStyle('abstract')
    setCustomImagePrompt('')
    setGenerated(null)
    setCurrentDraftId(null)
    setLastSaved(null)
  }

  // Generate checklist
  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('checklist-maker')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setLoading(true)
    setGenerated(null)
    
    try {
      const response = await fetch('/api/checklist-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistType: checklistType === 'custom' ? (isCustomTracker ? 'habit' : 'cleaning') : checklistType,
          customItems: customItems || undefined,
          itemCount: customItems ? customItems.split('\n').filter(l => l.trim()).length : 15,
          designStyle,
          paperSize,
          trackingDays: isTracker ? trackingDays : undefined,
          coverImageStyle,
          customImagePrompt: customImagePrompt || undefined,
          customTitle: customTitle || undefined,
          isCustomType: checklistType === 'custom',
          isTracker
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate checklist')
      }
      
      setGenerated(data)
      toast({
        title: "Checklist Created!",
        description: `"${data.title}" is ready to download!`
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

  // Track highest step reached for navigation
  const [highestStep, setHighestStep] = useState(1)
  
  // Update highest step when moving forward
  useEffect(() => {
    if (step > highestStep) {
      setHighestStep(step)
    }
  }, [step, highestStep])

  // Navigation helpers - allow going back to any visited step
  const canGoToStep = (targetStep) => {
    // Can always go to current or previous steps
    if (targetStep <= highestStep) return true
    // Can go to next step if requirements met
    if (targetStep === step + 1) {
      if (targetStep === 2 && checklistType) return true
      if (targetStep === 3) return true  // Can always go to design after content
      if (targetStep === 4) return true  // Can always go to generate after design
    }
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
            <span className="text-4xl">✅</span>
            Checklist & Tracker Maker PRO
          </h1>
          <p className="text-muted-foreground mt-1">
            Create habit trackers, checklists, and goal trackers with AI-generated covers
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $3-$15
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Perfect for:</span>
            {['Etsy', 'Gumroad', 'Creative Market', 'Amazon KDP'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-green-900/50">
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
                    No drafts yet. Click "Save" to save your progress.
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
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          Step {draft.data?.step || 1}/4
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(draft.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Progress Steps - Clickable */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => {
              const canNavigate = canGoToStep(s)
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(s)}
                    disabled={!canNavigate}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2' : 'cursor-not-allowed opacity-60'}`}
                    title={canNavigate ? `Go to Step ${s}` : 'Complete previous steps first'}
                  >
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </button>
                  {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-8 text-sm">
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

          {/* Step 1: Choose Type */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Choose Your Tracker or Checklist Type
                </CardTitle>
                <CardDescription>
                  Select a pre-built template or create a custom one from scratch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CHECKLIST_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setChecklistType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        checklistType === type.id 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      {type.isTracker !== null && (
                        <Badge variant="outline" className="text-[10px] mt-2">
                          {type.isTracker ? 'Grid Tracker' : 'Checklist'}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom type options */}
                {checklistType === 'custom' && (
                  <Card className="mt-4 bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">What type do you want to create?</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Trackers have daily/weekly grids. Checklists have checkboxes.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={!isCustomTracker ? 'font-medium' : 'text-muted-foreground'}>Checklist</span>
                          <Switch 
                            checked={isCustomTracker} 
                            onCheckedChange={setIsCustomTracker}
                          />
                          <span className={isCustomTracker ? 'font-medium' : 'text-muted-foreground'}>Tracker</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setStep(2)}>
                    Next: Add Content <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content/Items */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Add Your Content
                </CardTitle>
                <CardDescription>
                  {isTracker 
                    ? 'Enter the habits or items you want to track. Leave empty for AI suggestions.'
                    : 'Enter your checklist items. Leave empty for AI-generated items.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder={`e.g., My ${isTracker ? '30-Day Habit Challenge' : 'Ultimate Travel Checklist'}`}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {isTracker ? 'Your Habits/Items to Track' : 'Checklist Items'}
                    <Badge variant="secondary" className="text-xs">One per line</Badge>
                  </Label>
                  <Textarea
                    placeholder={isTracker 
                      ? "Enter your habits, one per line:\n\nExercise 30 mins\nRead 20 pages\nDrink 8 glasses water\nMeditate 10 mins\nNo junk food\nSleep by 10pm"
                      : "Enter your checklist items, one per line:\n\nPassport\nTickets\nChargers\nToiletries\nClothes"}
                    value={customItems}
                    onChange={(e) => setCustomItems(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {customItems 
                      ? `${customItems.split('\n').filter(l => l.trim()).length} items added`
                      : 'Leave empty to let AI generate relevant items for you'
                    }
                  </p>
                </div>

                {isTracker && (
                  <div className="space-y-2">
                    <Label>Tracking Duration: {trackingDays} days</Label>
                    <Slider
                      value={[trackingDays]}
                      onValueChange={([v]) => setTrackingDays(v)}
                      min={7}
                      max={365}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 week</span>
                      <span>1 month</span>
                      <span>3 months</span>
                      <span>1 year</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Next: Design <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Design */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                  Customize Design
                </CardTitle>
                <CardDescription>
                  Choose your visual style, paper size, and cover image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Design Style</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DESIGN_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setDesignStyle(style.id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              designStyle === style.id 
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
                      <Label>Paper Size (KDP Compatible)</Label>
                      <PaperSizeSelector
                        value={paperSize}
                        onChange={setPaperSize}
                        toolType="checklist"
                        showDescription={true}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-3">
                      <Label className="text-base font-medium">Cover Image</Label>
                      <CoverImagePrompt
                        coverImageStyle={coverImageStyle}
                        setCoverImageStyle={setCoverImageStyle}
                        customImagePrompt={customImagePrompt}
                        setCustomImagePrompt={setCustomImagePrompt}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)}>
                    Next: Generate <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Generate & Download */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                    Review & Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Preview */}
                    <div className="text-center space-y-4 p-6 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-6xl">
                        {checklistType === 'custom' ? '✏️' : selectedType?.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {customTitle || `My ${selectedType?.name || (isTracker ? 'Custom Tracker' : 'Custom Checklist')}`}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isTracker 
                            ? `${trackingDays}-day tracking grid`
                            : `${customItems ? customItems.split('\n').filter(l => l.trim()).length : 'AI-generated'} items`
                          }
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="outline">{DESIGN_STYLES.find(s => s.id === designStyle)?.name}</Badge>
                        <Badge variant="outline">{getSizeById(paperSize)?.name || '8.5" x 11"'}</Badge>
                        <Badge variant="outline">{isTracker ? 'Tracker' : 'Checklist'}</Badge>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{selectedType?.name || (isTracker ? 'Custom Tracker' : 'Custom Checklist')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Items</span>
                          <span className="font-medium">
                            {customItems ? customItems.split('\n').filter(l => l.trim()).length : 'AI Generated'}
                          </span>
                        </div>
                        {isTracker && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-medium">{trackingDays} days</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Design</span>
                          <span className="font-medium">{DESIGN_STYLES.find(s => s.id === designStyle)?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Cover Style</span>
                          <span className="font-medium capitalize">{coverImageStyle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex items-center gap-3">

                <CreditCostBadge toolId="checklist-maker" />

                <Button 
                size="lg" 
                className="flex-1 h-14 text-lg" 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating (15-30s)...</>
                ) : (
                  <><Wand2 className="mr-2 h-5 w-5" /> Generate {isTracker ? 'Tracker' : 'Checklist'}</>
                )}
              </Button>

              </div>

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
                          Your {isTracker ? 'Tracker' : 'Checklist'} is Ready!
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          "{generated.title}" - {generated.pageCount || 'Multiple'} pages
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
                      Ready for Amazon KDP, Etsy, or any print-on-demand platform
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Back button */}
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Design
                </Button>
              </div>
            </div>
          )}

          {/* Tips Card */}
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Sparkles className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
              <p>• Habit trackers are evergreen bestsellers on Etsy & Gumroad</p>
              <p>• Bundle 5-10 different trackers together for $10-20</p>
              <p>• Seasonal themes (New Year, Summer) sell exceptionally well</p>
              <p>• Niche trackers (fitness, moms, students) have less competition</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
