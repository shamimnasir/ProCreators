'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Download, Sparkles, Loader2, Clock,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  BookOpen, Brain, Target, Lightbulb, Upload,
  PenTool, Copy, Eye, RefreshCw, Palette, GraduationCap,
  FileUp, X, ListOrdered, AlignLeft, Hash
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Note Styles
const NOTE_STYLES = [
  { 
    id: 'cornell', 
    name: 'Cornell Method', 
    icon: '📋',
    description: 'Questions, notes, and summary sections',
    features: ['Main notes area', 'Cue column for questions', 'Summary section']
  },
  { 
    id: 'outline', 
    name: 'Outline Method', 
    icon: '📑',
    description: 'Hierarchical bullet points',
    features: ['Main topics', 'Sub-topics', 'Supporting details']
  },
  { 
    id: 'mindmap', 
    name: 'Mind Map Style', 
    icon: '🧠',
    description: 'Visual concept connections',
    features: ['Central concept', 'Connected branches', 'Visual hierarchy']
  },
  { 
    id: 'summary', 
    name: 'Summary Notes', 
    icon: '📝',
    description: 'Condensed key points',
    features: ['Key takeaways', 'Important facts', 'Quick review']
  },
  { 
    id: 'flashcard', 
    name: 'Q&A Format', 
    icon: '🎴',
    description: 'Question and answer pairs',
    features: ['Questions', 'Answers', 'Self-testing ready']
  }
]

// Academic Subjects
const SUBJECTS = [
  { id: 'general', name: 'General', icon: '📚' },
  { id: 'math', name: 'Mathematics', icon: '🔢' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'biology', name: 'Biology', icon: '🧬' },
  { id: 'chemistry', name: 'Chemistry', icon: '⚗️' },
  { id: 'physics', name: 'Physics', icon: '⚛️' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'literature', name: 'Literature', icon: '📖' },
  { id: 'language', name: 'Language', icon: '🗣️' },
  { id: 'computer-science', name: 'Computer Science', icon: '💻' },
  { id: 'economics', name: 'Economics', icon: '📊' },
  { id: 'psychology', name: 'Psychology', icon: '🧠' },
  { id: 'philosophy', name: 'Philosophy', icon: '💭' },
  { id: 'law', name: 'Law', icon: '⚖️' },
  { id: 'medicine', name: 'Medicine', icon: '🏥' }
]

// Grade Levels
const GRADE_LEVELS = [
  { id: 'middle-school', name: 'Middle School' },
  { id: 'high-school', name: 'High School' },
  { id: 'undergraduate', name: 'Undergraduate' },
  { id: 'graduate', name: 'Graduate' },
  { id: 'professional', name: 'Professional' }
]

// Color Themes
const COLOR_THEMES = [
  { id: 'classic', name: 'Classic Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#dbeafe' },
  { id: 'forest', name: 'Forest Green', primary: '#166534', secondary: '#22c55e', accent: '#dcfce7' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#c2410c', secondary: '#f97316', accent: '#ffedd5' },
  { id: 'royal', name: 'Royal Purple', primary: '#6b21a8', secondary: '#a855f7', accent: '#f3e8ff' },
  { id: 'rose', name: 'Rose Pink', primary: '#be185d', secondary: '#ec4899', accent: '#fce7f3' },
  { id: 'slate', name: 'Minimal Gray', primary: '#334155', secondary: '#64748b', accent: '#f1f5f9' }
]

export default function StudyNotesPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  // Step 1: Input Source
  const [inputMode, setInputMode] = useState('topic') // 'topic' or 'upload'
  const [topic, setTopic] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedContent, setUploadedContent] = useState('')
  
  // Step 1: Configuration
  const [noteStyle, setNoteStyle] = useState('outline')
  const [subject, setSubject] = useState('general')
  const [gradeLevel, setGradeLevel] = useState('undergraduate')
  const [detailLevel, setDetailLevel] = useState('medium') // 'brief', 'medium', 'detailed'
  
  // Step 1: Author Info (for teachers)
  const [authorName, setAuthorName] = useState('')
  const [instituteName, setInstituteName] = useState('')
  
  // Step 2: Generation Options
  const [includeKeyTerms, setIncludeKeyTerms] = useState(true)
  const [includeExamples, setIncludeExamples] = useState(true)
  const [includeQuestions, setIncludeQuestions] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)

  // Step 3: Design
  const [colorTheme, setColorTheme] = useState('classic')
  const [paperSize, setPaperSize] = useState('letter')

  // Generated Content
  const [generatedNotes, setGeneratedNotes] = useState(null)
  const [result, setResult] = useState(null)

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: generatedNotes?.title || topic || 'Study Notes',
    topic,
    customNotes,
    inputMode,
    noteStyle,
    subject,
    gradeLevel,
    detailLevel,
    authorName,
    instituteName,
    includeKeyTerms,
    includeExamples,
    includeQuestions,
    includeSummary,
    colorTheme,
    paperSize,
    generatedNotes: generatedNotes || null,
    step
  }), [topic, customNotes, inputMode, noteStyle, subject, gradeLevel, detailLevel, authorName, instituteName, includeKeyTerms, includeExamples, includeQuestions, includeSummary, colorTheme, paperSize, generatedNotes, step])

  // Load draft data
  const loadDraftData = (data) => {
    // First, set all the configuration data
    if (data.topic) setTopic(data.topic)
    if (data.customNotes) setCustomNotes(data.customNotes)
    if (data.inputMode) setInputMode(data.inputMode)
    if (data.noteStyle) setNoteStyle(data.noteStyle)
    if (data.subject) setSubject(data.subject)
    if (data.gradeLevel) setGradeLevel(data.gradeLevel)
    if (data.detailLevel) setDetailLevel(data.detailLevel)
    if (typeof data.includeKeyTerms === 'boolean') setIncludeKeyTerms(data.includeKeyTerms)
    if (typeof data.includeExamples === 'boolean') setIncludeExamples(data.includeExamples)
    if (typeof data.includeQuestions === 'boolean') setIncludeQuestions(data.includeQuestions)
    if (typeof data.includeSummary === 'boolean') setIncludeSummary(data.includeSummary)
    if (data.colorTheme) setColorTheme(data.colorTheme)
    if (data.paperSize) setPaperSize(data.paperSize)
    
    // Set generated notes first
    if (data.generatedNotes && typeof data.generatedNotes === 'object' && data.generatedNotes.content) {
      setGeneratedNotes(data.generatedNotes)
      // Only go to step 3 if we have valid generated notes
      setStep(3)
    } else if (data.step && data.step <= 2) {
      // For steps 1 and 2, use the saved step
      setStep(data.step)
    } else {
      // Default to step 1 if no valid data
      setStep(1)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ['text/plain', 'application/pdf', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const ext = file.name.split('.').pop().toLowerCase()
    const validExtensions = ['txt', 'pdf', 'md', 'docx']
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .pdf, .md, or .docx file",
        variant: "destructive"
      })
      return
    }

    setUploadedFile(file)

    // For text files, read content directly
    if (file.type === 'text/plain' || ext === 'txt' || ext === 'md') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedContent(e.target?.result || '')
      }
      reader.readAsText(file)
    } else {
      // For PDF/DOCX, we'll extract on the backend
      setUploadedContent(`[File: ${file.name}] - Content will be extracted during generation`)
    }

    toast({
      title: "File uploaded",
      description: `${file.name} ready for processing`
    })
  }

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null)
    setUploadedContent('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Generate notes
  const generateNotes = async () => {
    if (inputMode === 'topic' && !topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" })
      return
    }
    if (inputMode === 'upload' && !customNotes.trim() && !uploadedFile) {
      toast({ title: "Add your notes or upload a file", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('action', 'generate')
      formData.append('inputMode', inputMode)
      formData.append('topic', topic)
      formData.append('customNotes', customNotes)
      formData.append('noteStyle', noteStyle)
      formData.append('subject', subject)
      formData.append('gradeLevel', gradeLevel)
      formData.append('detailLevel', detailLevel)
      formData.append('includeKeyTerms', includeKeyTerms.toString())
      formData.append('includeExamples', includeExamples.toString())
      formData.append('includeQuestions', includeQuestions.toString())
      formData.append('includeSummary', includeSummary.toString())
      
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }

      const response = await fetch('/api/study-notes/generate', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedNotes(data.notes)
        setStep(3)
        toast({
          title: "Notes Generated!",
          description: "Review and customize your study notes."
        })
      } else {
        throw new Error(data.error || 'Failed to generate notes')
      }
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

  // Generate PDF
  const generatePDF = async () => {
    if (!generatedNotes) return

    setLoading(true)
    try {
      const response = await fetch('/api/study-notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          notes: generatedNotes,
          topic,
          noteStyle,
          colorTheme: COLOR_THEMES.find(t => t.id === colorTheme),
          paperSize
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        setStep(4)
        toast({
          title: "PDF Ready!",
          description: "Your study notes PDF is ready for download."
        })
      } else {
        throw new Error(data.error || 'Failed to generate PDF')
      }
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update notes content
  const updateNotesSection = (key, value) => {
    if (generatedNotes) {
      setGeneratedNotes({ ...generatedNotes, [key]: value })
    }
  }

  // Check if can proceed
  const canProceedStep1 = inputMode === 'topic' ? topic.trim() : (customNotes.trim() || uploadedFile)
  const selectedStyle = NOTE_STYLES.find(s => s.id === noteStyle)
  const selectedTheme = COLOR_THEMES.find(t => t.id === colorTheme)

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
              <FileText className="h-6 w-6 text-primary" />
              Study Notes Generator
            </h1>
            <p className="text-muted-foreground">AI-powered notes from any topic or your own content</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="study-notes"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={step}
        />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { num: 1, label: 'Input', icon: BookOpen },
          { num: 2, label: 'Options', icon: Target },
          { num: 3, label: 'Review', icon: Edit3 },
          { num: 4, label: 'Download', icon: Download }
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
            {i < 3 && <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Input & Configuration */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Step 1: Choose Your Input
              </CardTitle>
              <CardDescription>Generate notes from a topic or use your own content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Mode Tabs */}
              <Tabs value={inputMode} onValueChange={setInputMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="topic" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate from Topic
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Use Your Own Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="topic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Topic or Subject *</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Photosynthesis, World War II, Calculus Derivatives, Machine Learning Basics..."
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific for better results. Example: "The French Revolution - Causes and Effects" instead of just "History"
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Paste Your Notes</Label>
                    <Textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Paste your lecture notes, textbook excerpts, or any content you want to convert into organized study notes..."
                      rows={6}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or upload a file</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Document</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      {uploadedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileUp className="h-8 w-8 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={removeFile}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports: .txt, .pdf, .docx, .md
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.docx,.md,text/plain,application/pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Note Style */}
              <div className="space-y-3">
                <Label>Note-Taking Style</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {NOTE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setNoteStyle(style.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        noteStyle === style.id 
                          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <div className="font-medium text-sm">{style.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject & Level */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject Area</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span>{s.icon}</span>
                            {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Detail Level */}
              <div className="space-y-3">
                <Label>Level of Detail</Label>
                <div className="flex gap-3">
                  {[
                    { id: 'brief', name: 'Brief', icon: Hash, desc: 'Key points only' },
                    { id: 'medium', name: 'Standard', icon: ListOrdered, desc: 'Balanced coverage' },
                    { id: 'detailed', name: 'Comprehensive', icon: AlignLeft, desc: 'In-depth notes' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setDetailLevel(level.id)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        detailLevel === level.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <level.icon className={`h-5 w-5 mx-auto mb-2 ${detailLevel === level.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-medium text-sm">{level.name}</div>
                      <div className="text-xs text-muted-foreground">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Continue to Options <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Generation Options */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Step 2: Content Options
            </CardTitle>
            <CardDescription>Customize what to include in your notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Style Preview */}
            <div className="p-4 bg-primary/5 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedStyle?.icon}</span>
                <div>
                  <h3 className="font-semibold">{selectedStyle?.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStyle?.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedStyle?.features.map((feature, i) => (
                  <Badge key={i} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>

            {/* Content Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    Key Terms & Definitions
                  </Label>
                  <p className="text-xs text-muted-foreground">Highlight important vocabulary</p>
                </div>
                <Switch checked={includeKeyTerms} onCheckedChange={setIncludeKeyTerms} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Examples & Illustrations
                  </Label>
                  <p className="text-xs text-muted-foreground">Real-world examples</p>
                </div>
                <Switch checked={includeExamples} onCheckedChange={setIncludeExamples} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Review Questions
                  </Label>
                  <p className="text-xs text-muted-foreground">Self-testing questions</p>
                </div>
                <Switch checked={includeQuestions} onCheckedChange={setIncludeQuestions} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Summary Section
                  </Label>
                  <p className="text-xs text-muted-foreground">Condensed overview</p>
                </div>
                <Switch checked={includeSummary} onCheckedChange={setIncludeSummary} />
              </div>
            </div>

            {/* Topic Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">You're creating notes for:</h4>
              <p className="text-lg">
                {inputMode === 'topic' ? (
                  <span className="text-primary font-semibold">{topic}</span>
                ) : (
                  <span className="text-primary font-semibold">
                    {uploadedFile ? uploadedFile.name : 'Your custom notes'}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{SUBJECTS.find(s => s.id === subject)?.name}</Badge>
                <Badge variant="outline">{GRADE_LEVELS.find(g => g.id === gradeLevel)?.name}</Badge>
                <Badge variant="outline">{detailLevel} detail</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={generateNotes} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Notes...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Study Notes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Edit */}
      {step === 3 && generatedNotes && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Step 3: Review & Edit Notes
              </CardTitle>
              <CardDescription>Review and customize your generated notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={generatedNotes.title || ''}
                  onChange={(e) => updateNotesSection('title', e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Main Content */}
              <div className="space-y-2">
                <Label>Main Notes</Label>
                <Textarea
                  value={generatedNotes.content || ''}
                  onChange={(e) => updateNotesSection('content', e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* Key Terms */}
              {generatedNotes.keyTerms && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    Key Terms
                  </Label>
                  <Textarea
                    value={generatedNotes.keyTerms}
                    onChange={(e) => updateNotesSection('keyTerms', e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Examples */}
              {generatedNotes.examples && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Examples
                  </Label>
                  <Textarea
                    value={generatedNotes.examples}
                    onChange={(e) => updateNotesSection('examples', e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Review Questions */}
              {generatedNotes.questions && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Review Questions
                  </Label>
                  <Textarea
                    value={generatedNotes.questions}
                    onChange={(e) => updateNotesSection('questions', e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Summary */}
              {generatedNotes.summary && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Summary
                  </Label>
                  <Textarea
                    value={generatedNotes.summary}
                    onChange={(e) => updateNotesSection('summary', e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Design Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Theme */}
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        colorTheme === theme.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                      />
                      <span className="text-sm">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper Size */}
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <div className="flex gap-3">
                  {[
                    { id: 'letter', name: 'US Letter (8.5" x 11")' },
                    { id: 'a4', name: 'A4 (210mm x 297mm)' }
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setPaperSize(size.id)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        paperSize === size.id ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="flex-1" onClick={generatePDF} disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating PDF...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Generate PDF</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Download */}
      {step === 4 && result && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Your Study Notes are Ready!</CardTitle>
            <CardDescription>Download your professionally formatted study notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">{generatedNotes?.title || topic}</div>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  {NOTE_STYLES.find(s => s.id === noteStyle)?.name}
                </Badge>
                <Badge variant="secondary">
                  {SUBJECTS.find(s => s.id === subject)?.name}
                </Badge>
                <Badge variant="secondary">
                  {GRADE_LEVELS.find(g => g.id === gradeLevel)?.name}
                </Badge>
              </div>
            </div>

            {/* Study Tips */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" /> Study Tips
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Review your notes within 24 hours of creating them</li>
                <li>Use the review questions for active recall practice</li>
                <li>Highlight or annotate the printed version</li>
                <li>Create flashcards from key terms for memorization</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <a href={result.pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
              </a>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setStep(1)
                  setGeneratedNotes(null)
                  setResult(null)
                  setTopic('')
                  setCustomNotes('')
                  setUploadedFile(null)
                  setUploadedContent('')
                }}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
