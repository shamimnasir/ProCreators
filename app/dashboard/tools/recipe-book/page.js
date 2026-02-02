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
  Clock, ChefHat, UtensilsCrossed, BookOpen, Image
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

// Import shared components
import CoverImagePrompt from '@/components/shared/CoverImagePrompt'
import PaperSizeSelector from '@/components/shared/PaperSizeSelector'
import { getSizeById } from '@/lib/paper-sizes'

const RECIPE_BOOK_TYPES = [
  { id: 'general', name: 'General Cookbook', icon: '📖', description: 'Collection of various recipes' },
  { id: 'family', name: 'Family Recipes', icon: '👨‍👩‍👧‍👦', description: 'Treasured family favorites' },
  { id: 'baking', name: 'Baking & Desserts', icon: '🧁', description: 'Sweet treats & baked goods' },
  { id: 'healthy', name: 'Healthy Eating', icon: '🥗', description: 'Nutritious & wholesome meals' },
  { id: 'quick', name: 'Quick & Easy', icon: '⏱️', description: '30-minute meals' },
  { id: 'vegan', name: 'Vegan/Vegetarian', icon: '🌱', description: 'Plant-based recipes' },
  { id: 'international', name: 'International Cuisine', icon: '🌍', description: 'Recipes from around the world' },
  { id: 'keto', name: 'Keto/Low-Carb', icon: '🥩', description: 'Low-carb & keto-friendly' },
  { id: 'meal-prep', name: 'Meal Prep', icon: '📦', description: 'Batch cooking & prep ahead' },
  { id: 'holiday', name: 'Holiday & Special', icon: '🎄', description: 'Festive & celebration recipes' },
  { id: 'blank', name: 'Blank Recipe Book', icon: '📝', description: 'Empty templates to fill in' },
]

const COLOR_SCHEMES = [
  { id: 'warm', name: 'Warm Kitchen', color: 'bg-orange-400', description: 'Warm oranges & browns' },
  { id: 'fresh', name: 'Fresh Garden', color: 'bg-green-500', description: 'Fresh greens & herbs' },
  { id: 'elegant', name: 'Elegant', color: 'bg-amber-700', description: 'Rich golds & creams' },
  { id: 'modern', name: 'Modern', color: 'bg-slate-600', description: 'Clean grays & whites' },
  { id: 'rustic', name: 'Rustic', color: 'bg-amber-800', description: 'Earthy tones' },
  { id: 'pastel', name: 'Pastel', color: 'bg-pink-300', description: 'Soft pastels' },
]

const COVER_STYLES = [
  { id: 'classic', name: 'Classic', description: 'Traditional cookbook style' },
  { id: 'modern', name: 'Modern', description: 'Clean contemporary design' },
  { id: 'rustic', name: 'Rustic', description: 'Farmhouse & vintage' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple & elegant' },
]

// KDP Trim Sizes for cookbooks
const KDP_COOKBOOK_SIZES = [
  { id: '8.5x11', name: '8.5" × 11"', width: 612, height: 792, recommended: true, description: 'Best for cookbooks with photos' },
  { id: '8x10', name: '8" × 10"', width: 576, height: 720, recommended: true, description: 'Popular cookbook size' },
  { id: '7x10', name: '7" × 10"', width: 504, height: 720, description: 'Standard cookbook' },
  { id: '6x9', name: '6" × 9"', width: 432, height: 648, description: 'Compact cookbook' },
  { id: '5.5x8.5', name: '5.5" × 8.5"', width: 396, height: 612, description: 'Pocket recipe book' },
]

const STEP_LABELS = ['Type', 'Details', 'Recipes', 'Design', 'Generate']

export default function RecipeBookPage() {
  // Step management
  const [step, setStep] = useState(1)
  const [highestStep, setHighestStep] = useState(1)
  
  // Step 1: Book type
  const [bookType, setBookType] = useState('general')
  
  // Step 2: Book details
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  
  // Step 3: Recipes & Categories
  const [categories, setCategories] = useState([])
  const [recipeCount, setRecipeCount] = useState(30)
  const [includeNutrition, setIncludeNutrition] = useState(true)
  const [includePhotos, setIncludePhotos] = useState(true)
  
  // Custom recipe editing state
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedRecipe, setExpandedRecipe] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importCategory, setImportCategory] = useState('')
  
  // Step 4: Design
  const [colorScheme, setColorScheme] = useState('warm')
  const [coverStyle, setCoverStyle] = useState('classic')
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [coverImageStyle, setCoverImageStyle] = useState('food')
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  
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
  
  const selectedType = RECIPE_BOOK_TYPES.find(t => t.id === bookType)

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
        const res = await fetch('/api/drafts?toolType=recipe-book')
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
    bookType,
    title,
    subtitle,
    authorName,
    introduction,
    targetAudience,
    categories,
    recipeCount,
    includeNutrition,
    includePhotos,
    colorScheme,
    coverStyle,
    paperSize,
    coverImageStyle,
    customImagePrompt,
    step,
    generated,
  }), [bookType, title, subtitle, authorName, introduction, targetAudience, categories, recipeCount, includeNutrition, includePhotos, colorScheme, coverStyle, paperSize, coverImageStyle, customImagePrompt, step, generated])

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
      const draftTitle = title || `My ${selectedType?.name || 'Recipe Book'}`
      
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
          body: JSON.stringify({ toolType: 'recipe-book', title: draftTitle, data })
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
    if (data.bookType) setBookType(data.bookType)
    if (data.title) setTitle(data.title)
    if (data.subtitle) setSubtitle(data.subtitle)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.introduction) setIntroduction(data.introduction)
    if (data.targetAudience) setTargetAudience(data.targetAudience)
    if (data.categories) setCategories(data.categories)
    if (data.recipeCount) setRecipeCount(data.recipeCount)
    if (data.includeNutrition !== undefined) setIncludeNutrition(data.includeNutrition)
    if (data.includePhotos !== undefined) setIncludePhotos(data.includePhotos)
    if (data.colorScheme) setColorScheme(data.colorScheme)
    if (data.coverStyle) setCoverStyle(data.coverStyle)
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
    setHighestStep(1)
    setBookType('general')
    setTitle('')
    setSubtitle('')
    setAuthorName('')
    setIntroduction('')
    setTargetAudience('')
    setCategories([])
    setRecipeCount(30)
    setIncludeNutrition(true)
    setIncludePhotos(true)
    setColorScheme('warm')
    setCoverStyle('classic')
    setPaperSize('8.5x11')
    setCoverImageStyle('food')
    setCustomImagePrompt('')
    setGenerated(null)
    setCurrentDraftId(null)
    setLastSaved(null)
  }

  // Generate structure with AI
  const generateStructure = async () => {
    setGeneratingStructure(true)
    try {
      const response = await fetch('/api/recipe-book/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookType,
          title: title || `My ${selectedType?.name}`,
          recipeCount,
          targetAudience,
        })
      })
      
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      // Set generated structure
      if (data.title && !title) setTitle(data.title)
      if (data.subtitle && !subtitle) setSubtitle(data.subtitle)
      if (data.introduction && !introduction) setIntroduction(data.introduction)
      if (data.categories) setCategories(data.categories)
      
      toast({ title: "Structure Generated!", description: "Review and customize your recipes" })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingStructure(false)
    }
  }

  // Generate PDF
  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('recipe-book')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setLoading(true)
    setGenerated(null)
    
    try {
      const selectedPaperSize = KDP_COOKBOOK_SIZES.find(s => s.id === paperSize)
      
      const response = await fetch('/api/recipe-book/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookType,
          title: title || `My ${selectedType?.name}`,
          subtitle,
          authorName,
          introduction,
          categories,
          recipeCount,
          includeNutrition,
          includePhotos,
          colorScheme,
          coverStyle,
          coverImageStyle,
          customImagePrompt,
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
        throw new Error(data.error || 'Failed to generate recipe book')
      }
      
      setGenerated(data)
      toast({
        title: "Recipe Book Created!",
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

  // Category management
  const addCategory = () => {
    const newCategories = [...categories, { name: 'New Category', recipes: [] }]
    setCategories(newCategories)
    setExpandedCategory(newCategories.length - 1)
  }

  const updateCategory = (idx, field, value) => {
    const updated = [...categories]
    updated[idx] = { ...updated[idx], [field]: value }
    setCategories(updated)
  }

  const deleteCategory = (idx) => {
    setCategories(categories.filter((_, i) => i !== idx))
    if (expandedCategory === idx) setExpandedCategory(null)
  }

  // Recipe management
  const addRecipeToCategory = (categoryIdx) => {
    const updated = [...categories]
    updated[categoryIdx].recipes = [...(updated[categoryIdx].recipes || []), {
      name: 'New Recipe',
      servings: 4,
      prepTime: '15 mins',
      cookTime: '30 mins',
      ingredients: ['Add your ingredients here'],
      instructions: ['Add your instructions here'],
      tips: ''
    }]
    setCategories(updated)
    setExpandedCategory(categoryIdx)
    setExpandedRecipe(`${categoryIdx}-${updated[categoryIdx].recipes.length - 1}`)
  }

  const updateRecipe = (categoryIdx, recipeIdx, field, value) => {
    const updated = [...categories]
    if (updated[categoryIdx]?.recipes?.[recipeIdx]) {
      updated[categoryIdx].recipes[recipeIdx] = {
        ...updated[categoryIdx].recipes[recipeIdx],
        [field]: value
      }
      setCategories(updated)
    }
  }

  const deleteRecipe = (categoryIdx, recipeIdx) => {
    const updated = [...categories]
    updated[categoryIdx].recipes = updated[categoryIdx].recipes.filter((_, i) => i !== recipeIdx)
    setCategories(updated)
    if (expandedRecipe === `${categoryIdx}-${recipeIdx}`) {
      setExpandedRecipe(null)
    }
  }

  // Import recipe from text
  const handleImportRecipe = () => {
    if (!importText.trim()) return
    
    // Parse the pasted text
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l)
    
    // Try to extract recipe components
    let recipeName = lines[0] || 'Imported Recipe'
    let servings = 4
    let prepTime = '15 mins'
    let cookTime = '30 mins'
    let ingredients = []
    let instructions = []
    let tips = ''
    
    let currentSection = ''
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const lowerLine = line.toLowerCase()
      
      // Check for meta info
      if (lowerLine.includes('serving')) {
        const match = line.match(/(\d+)/);
        if (match) servings = parseInt(match[1])
      }
      if (lowerLine.includes('prep')) {
        const match = line.match(/prep[:\s]*(.+)/i)
        if (match) prepTime = match[1].trim()
      }
      if (lowerLine.includes('cook') && !lowerLine.includes('cooking')) {
        const match = line.match(/cook[:\s]*(.+)/i)
        if (match) cookTime = match[1].trim()
      }
      
      // Detect sections
      if (lowerLine.includes('ingredient')) {
        currentSection = 'ingredients'
        continue
      }
      if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('method') || lowerLine.includes('step')) {
        currentSection = 'instructions'
        continue
      }
      if (lowerLine.includes('tip') || lowerLine.includes('note')) {
        currentSection = 'tips'
        continue
      }
      
      // Add to appropriate section
      if (currentSection === 'ingredients' && line.length > 1) {
        // Remove common prefixes like -, *, •, numbers
        const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim()
        if (cleaned) ingredients.push(cleaned)
      } else if (currentSection === 'instructions' && line.length > 1) {
        const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim()
        if (cleaned) instructions.push(cleaned)
      } else if (currentSection === 'tips') {
        tips += (tips ? ' ' : '') + line
      }
    }
    
    // Create the recipe object
    const newRecipe = {
      name: recipeName,
      servings,
      prepTime,
      cookTime,
      ingredients: ingredients.length > 0 ? ingredients : ['Add ingredients'],
      instructions: instructions.length > 0 ? instructions : ['Add instructions'],
      tips
    }
    
    // Add to category
    let targetCategoryIdx
    if (importCategory === 'new' || !importCategory) {
      // Create new category
      const newCategories = [...categories, { name: 'Imported Recipes', recipes: [newRecipe] }]
      setCategories(newCategories)
      targetCategoryIdx = newCategories.length - 1
    } else {
      targetCategoryIdx = parseInt(importCategory)
      const updated = [...categories]
      updated[targetCategoryIdx].recipes = [...(updated[targetCategoryIdx].recipes || []), newRecipe]
      setCategories(updated)
    }
    
    // Reset and show success
    setImportText('')
    setImportCategory('')
    setExpandedCategory(targetCategoryIdx)
    toast({ title: "Recipe Imported!", description: `"${recipeName}" has been added.` })
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
            <span className="text-4xl">🍳</span>
            Recipe Book Maker PRO
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful KDP-ready cookbooks with AI-generated recipes
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="text-green-600 font-medium">$15-$40</span>
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Sell on:</span>
            {['Amazon KDP', 'Etsy', 'Gumroad', 'Creative Market'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-orange-900/50">
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

          {/* Step 1: Book Type */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Choose Your Recipe Book Type
                </CardTitle>
                <CardDescription>
                  Select a cookbook style that matches your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {RECIPE_BOOK_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBookType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        bookType === type.id 
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
                    Next: Book Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Book Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Book Details
                </CardTitle>
                <CardDescription>
                  Enter your cookbook information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Book Title *</Label>
                    <Input
                      placeholder={`e.g., ${selectedType?.name || 'My Recipe Collection'}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle (optional)</Label>
                    <Input
                      placeholder="e.g., 100 Delicious Family Favorites"
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
                      placeholder="e.g., Busy parents, Beginners, Health-conscious"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Introduction (optional)</Label>
                  <Textarea
                    placeholder="Write a brief introduction about your cookbook..."
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Recipes: {recipeCount}</Label>
                  <Slider
                    value={[recipeCount]}
                    onValueChange={([v]) => setRecipeCount(v)}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    More recipes = longer book (KDP minimum 24 pages)
                  </p>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Next: Recipes <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Recipes & Categories */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                  Your Recipes
                </CardTitle>
                <CardDescription>
                  Add your own recipes, generate with AI, or import from other sources
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
                          <span className="font-medium">Generate AI Recipes</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Create {recipeCount} recipes automatically</span>
                      </div>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-3"
                    onClick={addCategory}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Add Custom Category</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Create your own recipe sections</span>
                    </div>
                  </Button>
                </div>

                {/* Import from text */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Quick Import (Paste Recipe)
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
                        placeholder={`Paste a recipe here in any format, e.g.:

Chocolate Chip Cookies
Servings: 24 | Prep: 15 mins | Cook: 12 mins

Ingredients:
- 2 cups flour
- 1 cup sugar
- 1 cup butter
- 2 eggs

Instructions:
1. Preheat oven to 350°F
2. Mix dry ingredients
3. Add wet ingredients
4. Bake for 12 minutes`}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Select value={importCategory} onValueChange={setImportCategory}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select category to import into" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat, idx) => (
                              <SelectItem key={idx} value={String(idx)}>{cat.name}</SelectItem>
                            ))}
                            <SelectItem value="new">+ Create New Category</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleImportRecipe} disabled={!importText.trim()}>
                          Import Recipe
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Categories List */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">
                      Categories ({categories.length}) - {categories.reduce((acc, c) => acc + (c.recipes?.length || 0), 0)} recipes total
                    </Label>
                  </div>
                  
                  {categories.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No categories yet</p>
                      <p className="text-sm text-muted-foreground">Generate AI recipes or add your own categories above</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {categories.map((category, catIdx) => (
                        <div key={catIdx} className="border rounded-lg overflow-hidden">
                          {/* Category Header */}
                          <div className="bg-muted/50 p-3 flex items-center gap-2">
                            <button
                              onClick={() => setExpandedCategory(expandedCategory === catIdx ? null : catIdx)}
                              className="flex-1 flex items-center gap-2 text-left"
                            >
                              <ChefHat className="h-4 w-4" />
                              <Input
                                value={category.name}
                                onChange={(e) => { e.stopPropagation(); updateCategory(catIdx, 'name', e.target.value) }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                              />
                            </button>
                            <Badge variant="secondary">{category.recipes?.length || 0}</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => addRecipeToCategory(catIdx)}
                              className="h-7 px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Recipe
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteCategory(catIdx)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Recipes in Category */}
                          {expandedCategory === catIdx && (
                            <div className="p-3 space-y-3">
                              {(!category.recipes || category.recipes.length === 0) ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                  No recipes in this category. Click "+ Recipe" to add one.
                                </div>
                              ) : (
                                category.recipes.map((recipe, recipeIdx) => (
                                  <div key={recipeIdx} className="border rounded-lg p-3 bg-background">
                                    {/* Recipe Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <Input
                                        value={recipe.name}
                                        onChange={(e) => updateRecipe(catIdx, recipeIdx, 'name', e.target.value)}
                                        className="flex-1 font-medium"
                                        placeholder="Recipe Name"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedRecipe(expandedRecipe === `${catIdx}-${recipeIdx}` ? null : `${catIdx}-${recipeIdx}`)}
                                      >
                                        {expandedRecipe === `${catIdx}-${recipeIdx}` ? 'Collapse' : 'Edit'}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteRecipe(catIdx, recipeIdx)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    
                                    {/* Recipe Details (Expanded) */}
                                    {expandedRecipe === `${catIdx}-${recipeIdx}` && (
                                      <div className="space-y-3 pt-3 border-t">
                                        {/* Meta info */}
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <Label className="text-xs">Servings</Label>
                                            <Input
                                              type="number"
                                              value={recipe.servings || 4}
                                              onChange={(e) => updateRecipe(catIdx, recipeIdx, 'servings', parseInt(e.target.value) || 4)}
                                              className="h-8"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Prep Time</Label>
                                            <Input
                                              value={recipe.prepTime || ''}
                                              onChange={(e) => updateRecipe(catIdx, recipeIdx, 'prepTime', e.target.value)}
                                              placeholder="15 mins"
                                              className="h-8"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Cook Time</Label>
                                            <Input
                                              value={recipe.cookTime || ''}
                                              onChange={(e) => updateRecipe(catIdx, recipeIdx, 'cookTime', e.target.value)}
                                              placeholder="30 mins"
                                              className="h-8"
                                            />
                                          </div>
                                        </div>
                                        
                                        {/* Ingredients */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Ingredients (one per line)</Label>
                                          <Textarea
                                            value={(recipe.ingredients || []).join('\n')}
                                            onChange={(e) => updateRecipe(catIdx, recipeIdx, 'ingredients', e.target.value.split('\n').filter(l => l.trim()))}
                                            placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup sugar"
                                            rows={4}
                                            className="font-mono text-sm"
                                          />
                                        </div>
                                        
                                        {/* Instructions */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Instructions (one step per line)</Label>
                                          <Textarea
                                            value={(recipe.instructions || []).join('\n')}
                                            onChange={(e) => updateRecipe(catIdx, recipeIdx, 'instructions', e.target.value.split('\n').filter(l => l.trim()))}
                                            placeholder="Preheat oven to 350F&#10;Mix dry ingredients&#10;Add wet ingredients&#10;Bake for 25 minutes"
                                            rows={4}
                                            className="font-mono text-sm"
                                          />
                                        </div>
                                        
                                        {/* Tips */}
                                        <div>
                                          <Label className="text-xs mb-1 block">Tips (optional)</Label>
                                          <Input
                                            value={recipe.tips || ''}
                                            onChange={(e) => updateRecipe(catIdx, recipeIdx, 'tips', e.target.value)}
                                            placeholder="Any helpful tips for this recipe..."
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Recipe Preview (Collapsed) */}
                                    {expandedRecipe !== `${catIdx}-${recipeIdx}` && (
                                      <div className="text-xs text-muted-foreground">
                                        {recipe.servings && `${recipe.servings} servings`}
                                        {recipe.prepTime && ` • Prep: ${recipe.prepTime}`}
                                        {recipe.cookTime && ` • Cook: ${recipe.cookTime}`}
                                        {recipe.ingredients?.length > 0 && ` • ${recipe.ingredients.length} ingredients`}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                          
                          {/* Collapsed preview */}
                          {expandedCategory !== catIdx && category.recipes?.length > 0 && (
                            <div className="px-3 pb-2 text-xs text-muted-foreground">
                              {category.recipes.slice(0, 3).map(r => r.name).join(', ')}
                              {category.recipes.length > 3 && ` +${category.recipes.length - 3} more`}
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
                  <Button onClick={() => setStep(4)} disabled={categories.length === 0}>
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
                  Design Your Cookbook
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
                          {KDP_COOKBOOK_SIZES.map((size) => (
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
                        {KDP_COOKBOOK_SIZES.find(s => s.id === paperSize)?.description}
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
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                    Review & Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center space-y-4 p-6 bg-white/50 dark:bg-black/20 rounded-lg">
                      <div className="text-6xl">🍳</div>
                      <div>
                        <h3 className="text-xl font-bold">{title || `My ${selectedType?.name}`}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                        {authorName && <p className="text-sm mt-1">by {authorName}</p>}
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="outline">{selectedType?.name}</Badge>
                        <Badge variant="outline">{KDP_COOKBOOK_SIZES.find(s => s.id === paperSize)?.name}</Badge>
                        <Badge variant="outline">{categories.length} categories</Badge>
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
                          <span className="text-muted-foreground">Categories</span>
                          <span className="font-medium">{categories.length}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Total Recipes</span>
                          <span className="font-medium">{categories.reduce((acc, c) => acc + (c.recipes?.length || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Color Scheme</span>
                          <span className="font-medium capitalize">{colorScheme}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Paper Size</span>
                          <span className="font-medium">{KDP_COOKBOOK_SIZES.find(s => s.id === paperSize)?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex items-center gap-3">

                <CreditCostBadge toolId="recipe-book" />

                <Button 
                size="lg" 
                className="flex-1 h-14 text-lg" 
                onClick={handleGenerate} 
                disabled={loading || categories.length === 0}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Recipe Book (30-60s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Generate Recipe Book</>
                )}
              </Button>

              </div>
              
              {categories.length === 0 && (
                <p className="text-center text-sm text-destructive">
                  Please add at least one category with recipes before generating
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
                          Your Recipe Book is Ready!
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          "{generated.title}" - {generated.pageCount} pages
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
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <ChefHat className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
              <p>• Cookbooks with photos sell for 2-3x more on Amazon KDP</p>
              <p>• Niche cookbooks (Keto, Vegan) have less competition</p>
              <p>• Bundle themed recipes (Holiday, Quick Meals) for higher prices</p>
              <p>• Include meal plans and shopping lists as bonus content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
