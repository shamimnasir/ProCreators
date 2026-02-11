'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  FileText, Download, Loader2, 
  ArrowLeft, ArrowRight, CheckCircle, Copy,
  BookOpen, Brain, Target, Lightbulb, PenTool,
  ListOrdered, AlignLeft, RefreshCw, Eye,
  Wand2, FileEdit, Quote, Layers, GraduationCap,
  Upload, FileUp, X, File
, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Essay Types
const ESSAY_TYPES = [
  { 
    id: 'argumentative', 
    name: 'Argumentative', 
    icon: '⚔️',
    description: 'Take a stance and defend it with evidence',
    structure: ['Introduction + Thesis', 'Supporting Arguments', 'Counterargument & Rebuttal', 'Conclusion']
  },
  { 
    id: 'persuasive', 
    name: 'Persuasive', 
    icon: '🎯',
    description: 'Convince the reader to accept your viewpoint',
    structure: ['Hook + Thesis', 'Emotional Appeals', 'Logical Arguments', 'Call to Action']
  },
  { 
    id: 'expository', 
    name: 'Expository', 
    icon: '📊',
    description: 'Explain a topic objectively with facts',
    structure: ['Introduction', 'Main Points with Evidence', 'Analysis', 'Conclusion']
  },
  { 
    id: 'narrative', 
    name: 'Narrative', 
    icon: '📖',
    description: 'Tell a story with a clear point',
    structure: ['Setting & Characters', 'Rising Action', 'Climax', 'Resolution & Reflection']
  },
  { 
    id: 'compare-contrast', 
    name: 'Compare & Contrast', 
    icon: '⚖️',
    description: 'Analyze similarities and differences',
    structure: ['Introduction', 'Subject A Analysis', 'Subject B Analysis', 'Comparison & Conclusion']
  },
  { 
    id: 'research', 
    name: 'Research Paper', 
    icon: '🔬',
    description: 'In-depth analysis with citations',
    structure: ['Abstract', 'Introduction & Literature Review', 'Methodology', 'Findings & Discussion', 'Conclusion']
  },
  { 
    id: 'descriptive', 
    name: 'Descriptive', 
    icon: '🎨',
    description: 'Paint a vivid picture with words',
    structure: ['Introduction', 'Sensory Details', 'Emotional Impact', 'Conclusion']
  }
]

// Academic Levels
const ACADEMIC_LEVELS = [
  { id: 'high-school', name: 'High School', wordRange: '500-800' },
  { id: 'undergraduate', name: 'Undergraduate', wordRange: '1000-1500' },
  { id: 'graduate', name: 'Graduate', wordRange: '2000-3000' },
  { id: 'professional', name: 'Professional', wordRange: '1500-2500' }
]

// Essay Lengths
const ESSAY_LENGTHS = [
  { id: 'short', name: 'Short', words: '500-700', paragraphs: '4-5' },
  { id: 'medium', name: 'Medium', words: '1000-1200', paragraphs: '6-8' },
  { id: 'long', name: 'Long', words: '1500-2000', paragraphs: '8-12' },
  { id: 'extended', name: 'Extended', words: '2500+', paragraphs: '12+' }
]

// Citation Styles
const CITATION_STYLES = [
  { id: 'none', name: 'No Citations' },
  { id: 'apa', name: 'APA 7th Edition' },
  { id: 'mla', name: 'MLA 9th Edition' },
  { id: 'chicago', name: 'Chicago Style' },
  { id: 'harvard', name: 'Harvard Style' }
]

// Writing Modes
const WRITING_MODES = [
  { id: 'brainstorm', name: 'Topic Brainstorming', icon: Lightbulb, description: 'Generate essay topic ideas' },
  { id: 'thesis', name: 'Thesis Generator', icon: Target, description: 'Create a strong thesis statement' },
  { id: 'outline', name: 'Outline Builder', icon: ListOrdered, description: 'Generate structured outline' },
  { id: 'introduction', name: 'Introduction Writer', icon: BookOpen, description: 'Write compelling introduction' },
  { id: 'body', name: 'Body Paragraphs', icon: AlignLeft, description: 'Expand points into paragraphs' },
  { id: 'conclusion', name: 'Conclusion Writer', icon: CheckCircle, description: 'Write strong conclusion' },
  { id: 'full-essay', name: 'Full Essay', icon: FileText, description: 'Generate complete essay' },
  { id: 'improve', name: 'Essay Improver', icon: Wand2, description: 'Analyze and improve existing essay' }
]

export default function EssayHelperPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Configuration
  const [essayType, setEssayType] = useState('')
  const [writingMode, setWritingMode] = useState('outline')
  const [academicLevel, setAcademicLevel] = useState('undergraduate')
  const [essayLength, setEssayLength] = useState('medium')
  const [citationStyle, setCitationStyle] = useState('none')
  
  // Input
  const [topic, setTopic] = useState('')
  const [thesis, setThesis] = useState('')
  const [existingContent, setExistingContent] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [outlinePoints, setOutlinePoints] = useState(['', '', ''])
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [inputMethod, setInputMethod] = useState('paste') // 'paste' or 'upload'
  
  // Output
  const [generatedContent, setGeneratedContent] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: topic || 'Essay Helper',
    essayType,
    writingMode,
    academicLevel,
    essayLength,
    citationStyle,
    topic,
    thesis,
    existingContent,
    additionalInstructions,
    outlinePoints,
    generatedContent,
    step
  }), [essayType, writingMode, academicLevel, essayLength, citationStyle, topic, thesis, existingContent, additionalInstructions, outlinePoints, generatedContent, step])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.essayType) setEssayType(data.essayType)
    if (data.writingMode) setWritingMode(data.writingMode)
    if (data.academicLevel) setAcademicLevel(data.academicLevel)
    if (data.essayLength) setEssayLength(data.essayLength)
    if (data.citationStyle) setCitationStyle(data.citationStyle)
    if (data.topic) setTopic(data.topic)
    if (data.thesis) setThesis(data.thesis)
    if (data.existingContent) setExistingContent(data.existingContent)
    if (data.additionalInstructions) setAdditionalInstructions(data.additionalInstructions)
    if (data.outlinePoints) setOutlinePoints(data.outlinePoints)
    if (data.generatedContent) setGeneratedContent(data.generatedContent)
    if (data.step) setStep(Math.min(data.step, 2))
  }

  // Update outline point
  const updateOutlinePoint = (index, value) => {
    const newPoints = [...outlinePoints]
    newPoints[index] = value
    setOutlinePoints(newPoints)
  }

  // Add outline point
  const addOutlinePoint = () => {
    setOutlinePoints([...outlinePoints, ''])
  }

  // Remove outline point
  const removeOutlinePoint = (index) => {
    if (outlinePoints.length > 1) {
      setOutlinePoints(outlinePoints.filter((_, i) => i !== index))
    }
  }

  // Handle file upload for Essay Improver
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOC, DOCX, or TXT file',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      })
      return
    }

    setUploadingFile(true)
    setUploadedFile({ name: file.name, size: file.size })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/essay-helper/extract-text', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success && data.text) {
        setExistingContent(data.text)
        toast({
          title: 'File uploaded successfully!',
          description: `Extracted ${data.wordCount || 'text'} from ${file.name}`
        })
      } else {
        throw new Error(data.error || 'Failed to extract text')
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      })
      setUploadedFile(null)
    } finally {
      setUploadingFile(false)
    }
  }

  // Clear uploaded file
  const clearUploadedFile = () => {
    setUploadedFile(null)
    setExistingContent('')
    // Reset file input
    const fileInput = document.getElementById('essay-file-upload')
    if (fileInput) fileInput.value = ''
  }

  // Generate content
  const generateContent = async () => {
    if (!topic && writingMode !== 'brainstorm') {
      toast({ title: 'Please enter a topic', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/essay-helper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          essayType,
          writingMode,
          academicLevel,
          essayLength,
          citationStyle,
          topic,
          thesis,
          existingContent,
          additionalInstructions,
          outlinePoints: outlinePoints.filter(p => p.trim())
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedContent(data.content)
        setStep(3)
        toast({
          title: 'Content Generated!',
          description: `Your ${WRITING_MODES.find(m => m.id === writingMode)?.name || 'content'} is ready`
        })
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copied to clipboard!' })
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' })
    }
  }

  // Generate PDF
  const generatePDF = async () => {
    if (!generatedContent) return

    setLoading(true)
    try {
      const response = await fetch('/api/essay-helper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          content: generatedContent,
          topic,
          essayType,
          academicLevel,
          citationStyle
        })
      })

      const data = await response.json()
      if (data.success) {
        setPdfUrl(data.pdfUrl)
        await complete(creditResult.transactionId)
        toast({ title: 'PDF Ready!', description: 'Your essay PDF is ready for download' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'PDF Generation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Reset
  const resetForm = () => {
    setStep(1)
    setGeneratedContent(null)
    setPdfUrl(null)
  }

  const selectedEssayType = ESSAY_TYPES.find(t => t.id === essayType)
  const selectedMode = WRITING_MODES.find(m => m.id === writingMode)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
              <PenTool className="h-6 w-6 text-primary" />
              Essay Helper
            </h1>
            <p className="text-muted-foreground">AI-powered essay writing assistant</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="essay-helper"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={step}
        />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { num: 1, label: 'Select Type', icon: FileText },
          { num: 2, label: 'Configure', icon: Target },
          { num: 3, label: 'Result', icon: CheckCircle }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                step === s.num 
                  ? 'bg-primary text-primary-foreground' 
                  : step > s.num 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => step > s.num && setStep(s.num)}
            >
              <s.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Essay Type & Mode */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Writing Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                What would you like help with?
              </CardTitle>
              <CardDescription>Choose the type of assistance you need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WRITING_MODES.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setWritingMode(mode.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        writingMode === mode.id 
                          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-2 ${writingMode === mode.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-medium text-sm">{mode.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{mode.description}</div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Essay Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Essay Type
              </CardTitle>
              <CardDescription>Select the type of essay you're writing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ESSAY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setEssayType(type.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      essayType === type.id 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{type.description}</div>
                  </button>
                ))}
              </div>
              
              {/* Essay Structure Preview */}
              {selectedEssayType && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Typical Structure for {selectedEssayType.name}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEssayType.structure.map((section, idx) => (
                      <Badge key={idx} variant="outline">
                        {idx + 1}. {section}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => setStep(2)}
            disabled={!essayType}
          >
            Continue to Configuration <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Configure & Input */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedMode?.name || 'Configure'}
            </CardTitle>
            <CardDescription>
              {selectedMode?.description} for your {selectedEssayType?.name || 'essay'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Input */}
            {writingMode !== 'brainstorm' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Essay Topic / Subject *
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The impact of social media on modern communication"
                  className="text-lg"
                />
              </div>
            )}

            {/* Brainstorm specific */}
            {writingMode === 'brainstorm' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  General Subject Area
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Technology, Environment, Education, Social Issues..."
                />
                <p className="text-xs text-muted-foreground">Leave empty for random topic suggestions</p>
              </div>
            )}

            {/* Thesis Input for relevant modes */}
            {['outline', 'body', 'full-essay'].includes(writingMode) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Thesis Statement (Optional)
                </Label>
                <Textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Your main argument or central idea..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Leave empty to have AI generate one</p>
              </div>
            )}

            {/* Outline Points for body paragraphs */}
            {writingMode === 'body' && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Key Points to Expand
                </Label>
                {outlinePoints.map((point, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={(e) => updateOutlinePoint(idx, e.target.value)}
                      placeholder={`Point ${idx + 1}: e.g., Social media increases connectivity`}
                    />
                    {outlinePoints.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeOutlinePoint(idx)}>
                        <ArrowLeft className="h-4 w-4 rotate-45" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOutlinePoint}>
                  + Add Point
                </Button>
              </div>
            )}

            {/* Existing Content for Improve mode */}
            {writingMode === 'improve' && (
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4" />
                  Your Existing Essay
                </Label>
                
                {/* Input Method Tabs */}
                <Tabs value={inputMethod} onValueChange={setInputMethod} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full max-w-sm">
                    <TabsTrigger value="paste" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="mt-4">
                    <Textarea
                      value={existingContent}
                      onChange={(e) => setExistingContent(e.target.value)}
                      placeholder="Paste your essay here for analysis and improvement suggestions..."
                      rows={10}
                      className="min-h-[250px]"
                    />
                    {existingContent && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Word count: ~{existingContent.split(/\s+/).filter(w => w).length} words
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <div className="space-y-4">
                      {/* File Upload Area */}
                      {!uploadedFile ? (
                        <label 
                          htmlFor="essay-file-upload"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingFile ? (
                              <>
                                <Loader2 className="h-10 w-10 mb-3 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Extracting text...</p>
                              </>
                            ) : (
                              <>
                                <FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDF, DOC, DOCX, or TXT (max 10MB)
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            id="essay-file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                        </label>
                      ) : (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <File className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{uploadedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(uploadedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={clearUploadedFile}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {existingContent && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground">Extracted Text Preview:</p>
                                <Badge variant="secondary" className="text-xs">
                                  ~{existingContent.split(/\s+/).filter(w => w).length} words
                                </Badge>
                              </div>
                              <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground bg-background/50 p-2 rounded border">
                                {existingContent.substring(0, 500)}
                                {existingContent.length > 500 && '...'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, Microsoft Word (.doc, .docx), Plain Text (.txt)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Configuration Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name} ({level.wordRange} words)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Essay Length</Label>
                <Select value={essayLength} onValueChange={setEssayLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESSAY_LENGTHS.map((length) => (
                      <SelectItem key={length.id} value={length.id}>
                        {length.name} ({length.words} words)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Citation Style</Label>
                <Select value={citationStyle} onValueChange={setCitationStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITATION_STYLES.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Additional Instructions (Optional)
              </Label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Any specific requirements, focus areas, or style preferences..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CreditCostBadge toolId="essay-helper" />
              <Button 
                className="flex-1" 
                onClick={generateContent} 
                disabled={loading || (writingMode !== 'brainstorm' && !topic) || (writingMode === 'improve' && !existingContent)}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate {selectedMode?.name}</>                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && generatedContent && (
        <div className="space-y-4">
          {/* Result Header */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedMode?.name} Generated</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedEssayType?.name} • {ACADEMIC_LEVELS.find(l => l.id === academicLevel)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedContent.fullText || generatedContent.content || JSON.stringify(generatedContent, null, 2))}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePDF} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    PDF
                  </Button>
                  {pdfUrl && (
                    <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Content Display */}
          <Card>
            <CardContent className="py-6">
              {/* Brainstorm Results */}
              {writingMode === 'brainstorm' && generatedContent.topics && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Topic Ideas
                  </h3>
                  <div className="grid gap-3">
                    {generatedContent.topics.map((topicItem, idx) => (
                      <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{topicItem.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{topicItem.description}</p>
                            {topicItem.angle && (
                              <p className="text-xs text-primary mt-2">Angle: {topicItem.angle}</p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setTopic(topicItem.title)
                              setWritingMode('outline')
                              setStep(2)
                            }}
                          >
                            Use This <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thesis Results */}
              {writingMode === 'thesis' && generatedContent.thesis && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Thesis Statements
                  </h3>
                  {generatedContent.thesis.map((t, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Option {idx + 1}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setThesis(t.statement)
                          toast({ title: 'Thesis saved!' })
                        }}>
                          Use This
                        </Button>
                      </div>
                      <p className="font-medium text-lg">"{t.statement}"</p>
                      {t.explanation && (
                        <p className="text-sm text-muted-foreground mt-2">{t.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Outline Results */}
              {writingMode === 'outline' && generatedContent.outline && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-primary" />
                    Essay Outline
                  </h3>
                  {generatedContent.thesis && (
                    <div className="p-3 bg-primary/5 border-l-4 border-primary rounded">
                      <p className="text-sm font-medium text-primary">Thesis Statement:</p>
                      <p className="mt-1">{generatedContent.thesis}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {generatedContent.outline.map((section, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="font-semibold">{section.title}</h4>
                        </div>
                        {section.points && (
                          <ul className="ml-8 space-y-1">
                            {section.points.map((point, pIdx) => (
                              <li key={pIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Introduction/Conclusion/Body Results */}
              {['introduction', 'conclusion', 'body'].includes(writingMode) && generatedContent.content && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 text-primary" />
                    {selectedMode?.name}
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {generatedContent.content.split('\n\n').map((para, idx) => (
                      <p key={idx} className="mb-4 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Essay Results */}
              {writingMode === 'full-essay' && generatedContent.essay && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Complete Essay
                  </h3>
                  {generatedContent.title && (
                    <h2 className="text-2xl font-bold text-center">{generatedContent.title}</h2>
                  )}
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {generatedContent.essay.split('\n\n').map((para, idx) => (
                      <p key={idx} className="mb-4 leading-relaxed indent-8 first:indent-0">{para}</p>
                    ))}
                  </div>
                  {generatedContent.wordCount && (
                    <div className="text-sm text-muted-foreground text-right">
                      Word Count: ~{generatedContent.wordCount}
                    </div>
                  )}
                </div>
              )}

              {/* Improve Results */}
              {writingMode === 'improve' && generatedContent.analysis && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Essay Analysis & Improvements
                  </h3>
                  
                  {/* Score */}
                  {generatedContent.score && (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${
                          generatedContent.score >= 80 ? 'text-green-500' :
                          generatedContent.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {generatedContent.score}/100
                        </div>
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                      </div>
                      <div className="flex-1">
                        <Progress value={generatedContent.score} className="h-3" />
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {generatedContent.analysis.strengths && (
                    <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">✓ Strengths</h4>
                      <ul className="space-y-1">
                        {generatedContent.analysis.strengths.map((s, idx) => (
                          <li key={idx} className="text-sm text-green-600 dark:text-green-400">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {generatedContent.analysis.improvements && (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">⚡ Suggested Improvements</h4>
                      <ul className="space-y-1">
                        {generatedContent.analysis.improvements.map((s, idx) => (
                          <li key={idx} className="text-sm text-yellow-600 dark:text-yellow-400">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Revised Version */}
                  {generatedContent.revisedEssay && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Improved Version:</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert p-4 border rounded-lg bg-muted/30">
                        {generatedContent.revisedEssay.split('\n\n').map((para, idx) => (
                          <p key={idx} className="mb-4 leading-relaxed">{para}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={resetForm}>
              <RefreshCw className="h-4 w-4 mr-2" /> Start Over
            </Button>
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Modify & Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
