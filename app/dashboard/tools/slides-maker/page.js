'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Presentation, Download, Sparkles, Loader2, 
  ArrowLeft, ArrowRight, CheckCircle, Eye,
  ChevronLeft, ChevronRight, Edit3, RefreshCw,
  Palette, Users, Target, FileText, Layout,
  Quote, BarChart3, Columns, ListChecks
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

export default function SlidesMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  // Step 1: Topic & Type
  const [topic, setTopic] = useState('')
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

  // Auto-save data getter
  const getCurrentData = useCallback(() => ({
    topic,
    presentationType,
    slideCount,
    language,
    audience,
    additionalContext,
    theme,
    aspectRatio,
    presentation
  }), [topic, presentationType, slideCount, language, audience, additionalContext, theme, aspectRatio, presentation])

  // Load draft data
  const loadDraftData = useCallback((data) => {
    if (data.topic) setTopic(data.topic)
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
  }, [])

  // Start new
  const handleStartNew = useCallback(() => {
    setTopic('')
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
        description: "AI is creating your slides. This may take a moment."
      })

      const response = await fetch('/api/slides-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          presentationType,
          slideCount,
          language,
          audience,
          additionalContext
        })
      })

      const data = await response.json()

      if (data.success && data.presentation) {
        setPresentation(data.presentation)
        setCurrentSlideIndex(0)
        setStep(3)
        toast({
          title: "Presentation Created!",
          description: `Generated ${data.presentation.slides.length} slides successfully.`
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
        
        // Trigger download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `${presentation.title || 'presentation'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "PDF Downloaded!",
          description: "Your presentation has been saved."
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

  // Regenerate presentation
  const handleRegenerate = () => {
    setPresentation(null)
    setStep(1)
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
            <p className="text-muted-foreground">Create professional slides in minutes</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="slides-maker"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          onStartNew={handleStartNew}
          dependencies={[topic, presentationType, slideCount, theme]}
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
        {step === 3 && "Step 3: Review & Download"}
      </div>

      {/* Step 1: Topic & Content */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  What's your presentation about?
                </CardTitle>
                <CardDescription>
                  Enter your topic and AI will create a complete slide deck
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Presentation Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Introduction to Machine Learning, Q4 Sales Report, Climate Change Solutions..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                  />
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
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI-Powered Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Smart content structure</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Multiple slide layouts</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Speaker notes included</span>
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
                <CardDescription>Select a color scheme for your presentation</CardDescription>
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
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Download */}
      {step === 3 && presentation && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Slide Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Slide Preview
                  </CardTitle>
                  <Badge variant="outline">
                    {currentSlideIndex + 1} / {presentation.slides.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Slide Preview Area */}
                <div className={`relative rounded-lg overflow-hidden border shadow-lg ${
                  aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
                }`}>
                  <div className={`absolute inset-0 p-6 ${
                    theme === 'corporate-dark' ? 'bg-gray-900 text-white' : 'bg-white'
                  }`}>
                    {/* Top accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-2 ${THEMES.find(t => t.id === theme)?.preview}`} />
                    
                    {currentSlide && (
                      <div className="h-full flex flex-col">
                        {/* Slide Type Badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary" className="text-xs">
                            {SLIDE_TYPE_ICONS[currentSlide.type] || <FileText className="h-3 w-3" />}
                            <span className="ml-1 capitalize">{currentSlide.type}</span>
                          </Badge>
                        </div>

                        {/* Title */}
                        {currentSlide.title && (
                          <h2 className={`text-xl md:text-2xl font-bold mb-4 ${
                            theme === 'corporate-dark' ? 'text-white' : ''
                          }`} style={{ color: theme !== 'corporate-dark' ? THEMES.find(t => t.id === theme)?.color : undefined }}>
                            {currentSlide.title}
                          </h2>
                        )}

                        {/* Subtitle for title slides */}
                        {currentSlide.subtitle && (
                          <p className="text-lg text-muted-foreground mb-4">{currentSlide.subtitle}</p>
                        )}

                        {/* Bullets */}
                        {currentSlide.bullets && (
                          <ul className="space-y-2 flex-1">
                            {currentSlide.bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-2 ${THEMES.find(t => t.id === theme)?.preview}`} />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Quote */}
                        {currentSlide.quote && (
                          <div className="flex-1 flex flex-col justify-center">
                            <blockquote className="text-xl italic border-l-4 pl-4" style={{ borderColor: THEMES.find(t => t.id === theme)?.color }}>
                              "{currentSlide.quote}"
                            </blockquote>
                            {currentSlide.attribution && (
                              <p className="mt-2 text-muted-foreground">— {currentSlide.attribution}</p>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        {currentSlide.stats && (
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            {currentSlide.stats.map((stat, idx) => (
                              <div key={idx} className="text-center p-4 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold" style={{ color: THEMES.find(t => t.id === theme)?.color }}>
                                  {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Two Column */}
                        {currentSlide.leftColumn && currentSlide.rightColumn && (
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2 p-2 rounded text-white" style={{ backgroundColor: THEMES.find(t => t.id === theme)?.color }}>
                                {currentSlide.leftColumn.heading}
                              </h4>
                              <ul className="space-y-1 text-sm">
                                {currentSlide.leftColumn.points?.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 p-2 rounded text-white bg-gray-500">
                                {currentSlide.rightColumn.heading}
                              </h4>
                              <ul className="space-y-1 text-sm">
                                {currentSlide.rightColumn.points?.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
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

            {/* Speaker Notes */}
            {currentSlide?.speakerNotes && (
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

          {/* Sidebar */}
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
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        idx === currentSlideIndex 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{idx + 1}.</span>
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
                onClick={handleRegenerate}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Create New Presentation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
