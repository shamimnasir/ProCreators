'use client'

import { saveToLibrary } from '@/lib/secure-api'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import {
  Presentation,
  Download,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit3,
  RefreshCw,
  Palette,
  Users,
  Target,
  FileText,
  Layout,
  Quote,
  BarChart3,
  Columns,
  ListChecks,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Wand2,
  Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Presentation Types
const PRESENTATION_TYPES = [
  { id: 'business', name: 'Business', icon: '💼', description: 'Professional business presentations' },
  { id: 'educational', name: 'Educational', icon: '📚', description: 'Teaching and learning content' },
  { id: 'pitch', name: 'Pitch Deck', icon: '🚀', description: 'Startup and investor pitches' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'Artistic and design-focused' },
  { id: 'report', name: 'Report', icon: '📊', description: 'Data and analysis reports' },
  { id: 'training', name: 'Training', icon: '🎓', description: 'Employee and skill training' },
  { id: 'marketing', name: 'Marketing', icon: '📣', description: 'Marketing and sales decks' },
  { id: 'research', name: 'Research', icon: '🔬', description: 'Academic and research presentations' }
]

// Design Themes
const THEMES = [
  { id: 'modern-blue', name: 'Modern Blue', color: '#1e40af', preview: 'bg-blue-600' },
  { id: 'corporate-dark', name: 'Corporate Dark', color: '#1f1f2e', preview: 'bg-gray-900' },
  { id: 'fresh-green', name: 'Fresh Green', color: '#16a34a', preview: 'bg-green-600' },
  { id: 'elegant-purple', name: 'Elegant Purple', color: '#7c3aed', preview: 'bg-purple-600' },
  { id: 'warm-orange', name: 'Warm Orange', color: '#ea580c', preview: 'bg-orange-600' },
  { id: 'minimal-gray', name: 'Minimal Gray', color: '#525252', preview: 'bg-gray-600' }
]

// Audience Options
const AUDIENCES = [
  { id: 'general', name: 'General Audience' },
  { id: 'executives', name: 'Executives/C-Suite' },
  { id: 'investors', name: 'Investors' },
  { id: 'students', name: 'Students' },
  { id: 'technical', name: 'Technical Team' },
  { id: 'sales', name: 'Sales Team' },
  { id: 'clients', name: 'Clients/Customers' }
]

// Languages
const LANGUAGES = [
  { id: 'english', name: 'English' },
  { id: 'bengali', name: 'বাংলা (Bengali)' }
]

// Slide type icons
const SLIDE_TYPE_ICONS = {
  'title': <Presentation className="h-4 w-4" />,
  'content': <ListChecks className="h-4 w-4" />,
  'section': <Layout className="h-4 w-4" />,
  'quote': <Quote className="h-4 w-4" />,
  'stats': <BarChart3 className="h-4 w-4" />,
  'two-column': <Columns className="h-4 w-4" />,
  'conclusion': <Target className="h-4 w-4" />,
  'cta': <Target className="h-4 w-4" />
}

// Slide Editor Component
function SlideEditor({ slide, onUpdate, onRegenerateImage, isGeneratingImage, topic, theme }) {
  const fileInputRef = useRef(null)
  
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      onUpdate({ ...slide, backgroundImage: event.target.result, customImage: true })
    }
    reader.readAsDataURL(file)
  }
  
  const updateSlideField = (field, value) => {
    onUpdate({ ...slide, [field]: value })
  }
  
  const updateSlideStyle = (styleField, value) => {
    onUpdate({ 
      ...slide, 
      style: { ...slide.style, [styleField]: value } 
    })
  }
  
  const updateBullet = (index, value) => {
    const newBullets = [...(slide.bullets || [])]
    newBullets[index] = value
    onUpdate({ ...slide, bullets: newBullets })
  }
  
  const addBullet = () => {
    const newBullets = [...(slide.bullets || []), 'New point']
    onUpdate({ ...slide, bullets: newBullets })
  }
  
  const removeBullet = (index) => {
    const newBullets = (slide.bullets || []).filter((_, i) => i !== index)
    onUpdate({ ...slide, bullets: newBullets })
  }

  return (
    <div className="space-y-4">
      {/* Image Section */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Background Image
        </Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegenerateImage(slide)}
            disabled={isGeneratingImage}
            className="flex-1"
          >
            {isGeneratingImage ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            AI Generate
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={slide.title || ''}
          onChange={(e) => updateSlideField('title', e.target.value)}
          placeholder="Slide title"
        />
      </div>

      {/* Subtitle (for title slides) */}
      {slide.type === 'title' && (
        <>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={slide.subtitle || ''}
              onChange={(e) => updateSlideField('subtitle', e.target.value)}
              placeholder="Slide subtitle"
            />
          </div>
          <div className="space-y-2">
            <Label>Author / Presenter Name</Label>
            <Input
              value={slide.authorName || ''}
              onChange={(e) => updateSlideField('authorName', e.target.value)}
              placeholder="Your name"
            />
          </div>
        </>
      )}

      {/* Bullets (for content slides) */}
      {slide.bullets && (
        <div className="space-y-2">
          <Label className="flex items-center justify-between">
            <span>Bullet Points</span>
            <Button variant="ghost" size="sm" onClick={addBullet}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </Label>
          {slide.bullets.map((bullet, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={bullet}
                onChange={(e) => updateBullet(idx, e.target.value)}
                placeholder={`Point ${idx + 1}`}
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => removeBullet(idx)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Quote (for quote slides) */}
      {slide.type === 'quote' && (
        <>
          <div className="space-y-2">
            <Label>Quote</Label>
            <Textarea
              value={slide.quote || ''}
              onChange={(e) => updateSlideField('quote', e.target.value)}
              placeholder="Enter the quote"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Attribution</Label>
            <Input
              value={slide.attribution || ''}
              onChange={(e) => updateSlideField('attribution', e.target.value)}
              placeholder="Quote author"
            />
          </div>
        </>
      )}

      {/* Stats (for stats slides) */}
      {slide.stats && (
        <div className="space-y-2">
          <Label>Statistics</Label>
          {slide.stats.map((stat, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2">
              <Input
                value={stat.value}
                onChange={(e) => {
                  const newStats = [...slide.stats]
                  newStats[idx] = { ...stat, value: e.target.value }
                  updateSlideField('stats', newStats)
                }}
                placeholder="Value (e.g., 85%)"
              />
              <Input
                value={stat.label}
                onChange={(e) => {
                  const newStats = [...slide.stats]
                  newStats[idx] = { ...stat, label: e.target.value }
                  updateSlideField('stats', newStats)
                }}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      )}

      {/* Speaker Notes */}
      <div className="space-y-2">
        <Label>Speaker Notes</Label>
        <Textarea
          value={slide.speakerNotes || ''}
          onChange={(e) => updateSlideField('speakerNotes', e.target.value)}
          placeholder="Notes for the presenter..."
          rows={2}
        />
      </div>

      {/* Style Controls */}
      <div className="border-t pt-4 mt-4">
        <Label className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4" />
          Slide Style
        </Label>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={slide.style?.backgroundColor || '#1e40af'}
                onChange={(e) => updateSlideStyle('backgroundColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={slide.style?.backgroundColor || '#1e40af'}
                onChange={(e) => updateSlideStyle('backgroundColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-xs">Text Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={slide.style?.textColor || '#ffffff'}
                onChange={(e) => updateSlideStyle('textColor', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={slide.style?.textColor || '#ffffff'}
                onChange={(e) => updateSlideStyle('textColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        {/* Text Alignment */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs">Text Alignment</Label>
          <div className="flex gap-2">
            {[
              { value: 'left', icon: <AlignLeft className="h-4 w-4" /> },
              { value: 'center', icon: <AlignCenter className="h-4 w-4" /> },
              { value: 'right', icon: <AlignRight className="h-4 w-4" /> }
            ].map(align => (
              <Button
                key={align.value}
                variant={slide.style?.textAlign === align.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSlideStyle('textAlign', align.value)}
              >
                {align.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SlidesMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingImageIndex, setGeneratingImageIndex] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Step 1: Topic & Type
  const [topic, setTopic] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [presentationType, setPresentationType] = useState('business')
  const [slideCount, setSlideCount] = useState(8)
  const [language, setLanguage] = useState('english')
  const [audience, setAudience] = useState('general')
  const [additionalContext, setAdditionalContext] = useState('')

  // Step 2: Design
  const [theme, setTheme] = useState('modern-blue')
  const [aspectRatio, setAspectRatio] = useState('16:9')

  // Generated content
  const [presentation, setPresentation] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [editMode, setEditMode] = useState(false)

  // Auto-save data getter - FIXED to include all presentation data
  const getCurrentData = useCallback(() => {
    // Only return data if there's meaningful content
    if (!topic && !presentation) return null
    
    // When there's a presentation, use its title; otherwise use topic
    // Include 'content' field so auto-save recognizes there's data to save
    return {
      // Title field for the draft manager
      title: presentation?.title || topic || 'Untitled Presentation',
      // Content field - triggers auto-save when there's any meaningful data
      content: topic || null,
      // Slides field checked by auto-save
      slides: presentation?.slides || null,
      // All the form data
      topic,
      authorName,
      presentationType,
      slideCount,
      language,
      audience,
      additionalContext,
      theme,
      aspectRatio,
      presentation,
      currentSlideIndex,
      step
    }
  }, [topic, authorName, presentationType, slideCount, language, audience, additionalContext, theme, aspectRatio, presentation, currentSlideIndex, step])

  // Load draft data
  const loadDraftData = useCallback((data) => {
    if (data.topic) setTopic(data.topic)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.presentationType) setPresentationType(data.presentationType)
    if (data.slideCount) setSlideCount(data.slideCount)
    if (data.language) setLanguage(data.language)
    if (data.audience) setAudience(data.audience)
    if (data.additionalContext) setAdditionalContext(data.additionalContext)
    if (data.theme) setTheme(data.theme)
    if (data.aspectRatio) setAspectRatio(data.aspectRatio)
    if (data.presentation) {
      setPresentation(data.presentation)
      setStep(3)
    }
    if (data.currentSlideIndex !== undefined) setCurrentSlideIndex(data.currentSlideIndex)
    if (data.step && !data.presentation) setStep(data.step)
  }, [])

  // Start new
  const handleStartNew = useCallback(() => {
    setTopic('')
    setAuthorName('')
    setPresentationType('business')
    setSlideCount(8)
    setLanguage('english')
    setAudience('general')
    setAdditionalContext('')
    setTheme('modern-blue')
    setAspectRatio('16:9')
    setPresentation(null)
    setCurrentSlideIndex(0)
    setDownloadUrl(null)
    setEditMode(false)
    setStep(1)
  }, [])

  // Generate presentation content
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a presentation topic",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      toast({
        title: "Generating Presentation...",
        description: "AI is creating slides with background images. This may take 1-2 minutes."
      })

      const response = await fetch('/api/slides-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          authorName,
          presentationType,
          slideCount,
          language,
          audience,
          additionalContext,
          theme,
          generateImages: true
        })
      })

      const data = await response.json()

      if (data.success && data.presentation) {
        // Add author name to title slide if provided
        if (authorName && data.presentation.slides?.length > 0) {
          data.presentation.slides[0].authorName = authorName
        }
        setPresentation(data.presentation)
        setCurrentSlideIndex(0)
        setStep(3)
        
        // Save to library automatically using secure API
        try {
          await saveToLibrary({
            type: 'slides-maker',
            title: data.presentation.title || topic,
            description: `${data.presentation.slides.length} slides about "${topic}"`,
            content: JSON.stringify(data.presentation),
            metadata: {
              slideCount: data.presentation.slides.length,
              presentationType,
              theme,
              language,
              audience,
              authorName
            }
          })
          console.log('Presentation saved to library')
        } catch (libError) {
          console.error('Failed to save to library:', libError)
        }
        
        toast({
          title: "Presentation Created!",
          description: `Generated ${data.presentation.slides.length} slides with AI backgrounds. Saved to Library.`
        })
      } else {
        throw new Error(data.error || 'Failed to generate presentation')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  // Update a specific slide
  const handleUpdateSlide = (updatedSlide) => {
    if (!presentation) return
    
    const newSlides = presentation.slides.map((slide, idx) => 
      idx === currentSlideIndex ? updatedSlide : slide
    )
    
    setPresentation({
      ...presentation,
      slides: newSlides
    })
  }

  // Regenerate image for current slide
  const handleRegenerateImage = async (slide) => {
    setGeneratingImageIndex(currentSlideIndex)
    
    try {
      const response = await fetch('/api/slides-maker/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideTitle: slide.title || slide.quote,
          slideType: slide.type,
          topic,
          theme
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        handleUpdateSlide({
          ...slide,
          backgroundImage: data.imageUrl,
          customImage: false
        })
        toast({
          title: "Image Generated",
          description: "New background image created successfully."
        })
      } else {
        throw new Error(data.error || 'Failed to generate image')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGeneratingImageIndex(null)
    }
  }

  // Add new slide
  const handleAddSlide = () => {
    if (!presentation) return
    
    const newSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: presentation.slides.length + 1,
      type: 'content',
      title: 'New Slide',
      bullets: ['Point 1', 'Point 2', 'Point 3'],
      speakerNotes: '',
      style: {
        backgroundColor: THEMES.find(t => t.id === theme)?.color || '#1e40af',
        textColor: '#ffffff',
        textAlign: 'left'
      }
    }
    
    setPresentation({
      ...presentation,
      slides: [...presentation.slides, newSlide]
    })
    setCurrentSlideIndex(presentation.slides.length)
  }

  // Delete current slide
  const handleDeleteSlide = () => {
    if (!presentation || presentation.slides.length <= 1) return
    
    const newSlides = presentation.slides.filter((_, idx) => idx !== currentSlideIndex)
    // Renumber slides
    newSlides.forEach((slide, idx) => {
      slide.slideNumber = idx + 1
    })
    
    setPresentation({
      ...presentation,
      slides: newSlides
    })
    setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1))
  }

  // Generate PDF
  const handleDownloadPDF = async () => {
    if (!presentation) return

    setLoading(true)
    try {
      toast({
        title: "Creating PDF...",
        description: "Generating your presentation file."
      })

      const response = await fetch('/api/slides-maker/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation,
          theme,
          aspectRatio
        })
      })

      const data = await response.json()

      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl)
        
        // Save updated presentation to library with PDF path using secure API
        try {
          await saveToLibrary({
            type: 'slides-maker',
            title: presentation.title || topic,
            description: `${presentation.slides.length} slides - PDF generated`,
            content: JSON.stringify(presentation),
            filePath: data.downloadUrl,
            metadata: {
              slideCount: presentation.slides.length,
              presentationType,
              theme,
              language,
              audience,
              authorName,
              pdfGenerated: true
            }
          })
          console.log('Presentation with PDF saved to library')
        } catch (libError) {
          console.error('Failed to save to library:', libError)
        }
        
        // Trigger download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `${presentation.title || 'presentation'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "PDF Downloaded!",
          description: "Your presentation has been saved to Library."
        })
      } else {
        throw new Error(data.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Current slide for preview
  const currentSlide = presentation?.slides?.[currentSlideIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/students-teachers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Presentation className="h-7 w-7 text-blue-500" />
              AI Presentation Maker
            </h1>
            <p className="text-muted-foreground">Create beautiful slides with AI-generated backgrounds</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="slides-maker"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          onStartNew={handleStartNew}
          dependencies={[topic, authorName, presentationType, slideCount, theme, presentation, currentSlideIndex]}
          minStepForAutoSave={1}
          currentStep={step}
        />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              step >= s 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-20 h-1 mx-2 rounded ${
                step > s ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {step === 1 && "Step 1: Topic & Content"}
        {step === 2 && "Step 2: Design & Style"}
        {step === 3 && "Step 3: Edit, Customize & Download"}
      </div>

      {/* Step 1: Topic & Content */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-yellow-500" />
                  What's your presentation about?
                </CardTitle>
                <CardDescription>
                  Enter your topic and AI will create slides with beautiful backgrounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Presentation Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Introduction to Machine Learning, জলবায়ু পরিবর্তন, Q4 Sales Report..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Type in any language - slides will be generated in that language
                  </p>
                </div>

                <div>
                  <Label htmlFor="authorName">Your Name / Presenter (Optional)</Label>
                  <Input
                    id="authorName"
                    placeholder="e.g., John Doe, রহিম উদ্দিন..."
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Displayed on the title slide
                  </p>
                </div>

                <div>
                  <Label htmlFor="context">Additional Details (Optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Add specific points to cover, key messages, or any requirements..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map(aud => (
                          <SelectItem key={aud.id} value={aud.id}>{aud.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Number of Slides: {slideCount}</Label>
                  <Slider
                    value={[slideCount]}
                    onValueChange={([val]) => setSlideCount(val)}
                    min={5}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 slides</span>
                    <span>15 slides</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Presentation Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Presentation Type</CardTitle>
                <CardDescription>Choose the style that best fits your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRESENTATION_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setPresentationType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        presentationType === type.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-500" />
                  AI-Powered Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>AI-generated background images</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Editable text & content</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Custom colors & styling</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Upload your own images</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Professional PDF export</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full" 
              size="lg"
              disabled={!topic.trim()}
            >
              Next: Choose Design
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Design Selection */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Choose Your Theme
                </CardTitle>
                <CardDescription>This will influence AI-generated background colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        theme === t.id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`h-20 rounded-md ${t.preview} mb-3 flex items-center justify-center`}>
                        <Presentation className="h-8 w-8 text-white/80" />
                      </div>
                      <div className="font-medium text-sm">{t.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card>
              <CardHeader>
                <CardTitle>Slide Format</CardTitle>
                <CardDescription>Choose the aspect ratio for your slides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      aspectRatio === '16:9' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-full aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">16:9</span>
                    </div>
                    <div className="font-medium text-sm">Widescreen</div>
                    <div className="text-xs text-muted-foreground">Best for modern displays</div>
                  </button>
                  <button
                    onClick={() => setAspectRatio('4:3')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      aspectRatio === '4:3' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-full aspect-[4/3] bg-muted rounded mb-2 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">4:3</span>
                    </div>
                    <div className="font-medium text-sm">Standard</div>
                    <div className="text-xs text-muted-foreground">Classic format</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Topic:</span>
                  <span className="font-medium truncate ml-2 max-w-[150px]">{topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{PRESENTATION_TYPES.find(t => t.id === presentationType)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slides:</span>
                  <span className="font-medium">{slideCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium">{THEMES.find(t => t.id === theme)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">{aspectRatio}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CreditCostBadge toolId="slides-maker" />
              <Button 
                onClick={handleGenerate} 
                className="flex-1"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
            
            {generating && (
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                    Generating slides and AI backgrounds... This may take 1-2 minutes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Edit, Preview & Download */}
      {step === 3 && presentation && (
        <div className={`grid gap-6 ${editMode ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {/* Slide Preview */}
          <div className={`${editMode ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-4`}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Slide Preview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentSlideIndex + 1} / {presentation.slides.length}
                    </Badge>
                    <Button
                      variant={editMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      {editMode ? 'Done Editing' : 'Edit Slide'}
                    </Button>
                  </div>
                </div>
                {!editMode && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Edit Slide" to change text, images, or background
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {/* Slide Preview Area */}
                <div className={`relative rounded-lg overflow-hidden border shadow-lg ${
                  aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
                }`} style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}>
                  {/* Background Image or Color */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundColor: currentSlide?.style?.backgroundColor || '#1e40af',
                      backgroundImage: currentSlide?.backgroundImage ? `url(${currentSlide.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Overlay for text readability */}
                    {currentSlide?.backgroundImage && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div 
                    className={`absolute inset-0 p-6 flex flex-col ${
                      ['title', 'section', 'quote'].includes(currentSlide?.type) ? 'items-center justify-center text-center' : ''
                    }`}
                    style={{ 
                      color: currentSlide?.style?.textColor || '#ffffff',
                      fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif"
                    }}
                  >
                    {/* Slide Type Badge */}
                    <div className={`flex items-center gap-2 mb-4 ${['title', 'section', 'quote'].includes(currentSlide?.type) ? 'absolute top-4 left-4' : ''}`}>
                      <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                        {SLIDE_TYPE_ICONS[currentSlide?.type] || <FileText className="h-3 w-3" />}
                        <span className="ml-1 capitalize">{currentSlide?.type}</span>
                      </Badge>
                    </div>

                    {/* Title - Center for title/section slides */}
                    {currentSlide?.title && (
                      <h2 className={`text-2xl md:text-3xl font-bold mb-3 drop-shadow-lg ${
                        ['title', 'section'].includes(currentSlide?.type) ? 'text-center' : ''
                      }`} style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}>
                        {currentSlide.title}
                      </h2>
                    )}

                    {/* Subtitle for title slides */}
                    {currentSlide?.subtitle && (
                      <p className="text-lg md:text-xl opacity-90 mb-3 drop-shadow text-center">{currentSlide.subtitle}</p>
                    )}

                    {/* Author Name for title slides */}
                    {currentSlide?.type === 'title' && currentSlide?.authorName && (
                      <p className="text-base opacity-80 mt-4 drop-shadow font-medium text-center">
                        — {currentSlide.authorName}
                      </p>
                    )}

                    {/* Bullets - Infographic Style */}
                    {currentSlide?.bullets && currentSlide.bullets.length > 0 && (
                      <div className="flex-1 grid gap-2 mt-4 w-full">
                        {currentSlide.bullets.map((bullet, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 drop-shadow border border-white/10"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                              {idx + 1}
                            </div>
                            <span className="text-sm md:text-base">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quote */}
                    {currentSlide?.quote && (
                      <div className="flex-1 flex flex-col justify-center">
                        <blockquote className="text-xl italic drop-shadow-lg">
                          "{currentSlide.quote}"
                        </blockquote>
                        {currentSlide.attribution && (
                          <p className="mt-2 opacity-80 drop-shadow">— {currentSlide.attribution}</p>
                        )}
                      </div>
                    )}

                    {/* Stats - Infographic Style */}
                    {currentSlide?.stats && currentSlide.stats.length > 0 && (
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 items-center mt-4">
                        {currentSlide.stats.map((stat, idx) => (
                          <div 
                            key={idx} 
                            className="text-center p-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg"
                          >
                            <div className="text-3xl md:text-4xl font-bold drop-shadow-lg mb-1">
                              {stat.value}
                            </div>
                            <div className="text-sm opacity-90 font-medium">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Two Column - Infographic Style */}
                    {currentSlide?.leftColumn && currentSlide?.rightColumn && (
                      <div className="flex-1 grid grid-cols-2 gap-4 mt-4">
                        {/* Left Column */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <h3 className="font-bold text-lg mb-3 drop-shadow">
                            {currentSlide.leftColumn.heading}
                          </h3>
                          <div className="space-y-2">
                            {currentSlide.leftColumn.points?.map((point, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs mt-0.5 shrink-0">
                                  {idx + 1}
                                </div>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Right Column */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <h3 className="font-bold text-lg mb-3 drop-shadow">
                            {currentSlide.rightColumn.heading}
                          </h3>
                          <div className="space-y-2">
                            {currentSlide.rightColumn.points?.map((point, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs mt-0.5 shrink-0">
                                  {idx + 1}
                                </div>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {presentation.slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentSlideIndex 
                            ? 'w-6 bg-primary' 
                            : 'bg-muted hover:bg-muted-foreground/50'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentSlideIndex(Math.min(presentation.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Speaker Notes - Shows when not in edit mode */}
            {!editMode && currentSlide?.speakerNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Speaker Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{currentSlide.speakerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Edit Panel - Shows as sidebar when in edit mode */}
          {editMode && currentSlide && (
            <div className="space-y-4">
              <Card className="border-primary">
                <CardHeader className="pb-2 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-primary" />
                      Edit Slide {currentSlideIndex + 1}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Change text, upload images, or generate new backgrounds
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  <SlideEditor
                    slide={currentSlide}
                    onUpdate={handleUpdateSlide}
                    onRegenerateImage={handleRegenerateImage}
                    isGeneratingImage={generatingImageIndex === currentSlideIndex}
                    topic={topic}
                    theme={theme}
                  />
                  
                  {/* Slide Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={handleAddSlide} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" /> Add Slide
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDeleteSlide}
                      disabled={presentation.slides.length <= 1}
                      className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sidebar - Shows when NOT in edit mode */}
          {!editMode && (
            <div className="space-y-4">
            {/* Presentation Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{presentation.title}</CardTitle>
                {presentation.subtitle && (
                  <CardDescription>{presentation.subtitle}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Slides:</span>
                  <span className="font-medium">{presentation.slides.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium">{THEMES.find(t => t.id === theme)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">{aspectRatio}</span>
                </div>
              </CardContent>
            </Card>

            {/* Slide List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Slides</CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {presentation.slides.map((slide, idx) => (
                    <button
                      key={slide.id || idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors flex items-center gap-2 ${
                        idx === currentSlideIndex 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div 
                        className="w-10 h-6 rounded flex-shrink-0 border"
                        style={{
                          backgroundColor: slide.style?.backgroundColor || '#1e40af',
                          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                          backgroundSize: 'cover'
                        }}
                      />
                      <div className="flex-1 truncate">
                        <span className="font-medium">{idx + 1}.</span>{' '}
                        <span className="truncate">{slide.title || `Slide ${idx + 1}`}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={handleDownloadPDF} 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleStartNew}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Create New Presentation
              </Button>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  )
}
