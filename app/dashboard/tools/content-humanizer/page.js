'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Sparkles, Loader2, ArrowLeft, Copy, RefreshCw,
  FileText, Upload, FileUp, File, X, Wand2,
  Bot, User, Shield, Zap, Settings2,
  CheckCircle, AlertTriangle, ArrowRight, Eye,
  Shuffle, PenTool, Brain, Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import { saveToLibrary } from '@/lib/library-utils'

// Humanization levels
const HUMANIZATION_LEVELS = [
  { 
    id: 'light', 
    name: 'Light Touch', 
    description: 'Minor adjustments, keeps most structure',
    icon: '✨',
    changes: 'Subtle word changes, natural transitions'
  },
  { 
    id: 'medium', 
    name: 'Balanced', 
    description: 'Good balance of changes and meaning',
    icon: '⚖️',
    changes: 'Varied sentence structure, idioms, personal touches'
  },
  { 
    id: 'heavy', 
    name: 'Deep Rewrite', 
    description: 'Significant restructuring, very human',
    icon: '🔄',
    changes: 'Complete restructure, unique voice, conversational flow'
  }
]

// Writing tones
const WRITING_TONES = [
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Business-appropriate' },
  { id: 'casual', name: 'Casual', icon: '💬', description: 'Friendly & relaxed' },
  { id: 'academic', name: 'Academic', icon: '🎓', description: 'Scholarly & formal' },
  { id: 'conversational', name: 'Conversational', icon: '🗣️', description: 'Like talking to a friend' },
  { id: 'authoritative', name: 'Authoritative', icon: '📢', description: 'Expert & confident' },
  { id: 'storytelling', name: 'Storytelling', icon: '📖', description: 'Narrative & engaging' }
]

// Humanization techniques
const TECHNIQUES = [
  { id: 'vary_sentences', name: 'Vary Sentence Length', description: 'Mix short and long sentences' },
  { id: 'add_transitions', name: 'Natural Transitions', description: 'Add human-like connectors' },
  { id: 'use_contractions', name: 'Use Contractions', description: "Change 'do not' to 'don't'" },
  { id: 'add_personality', name: 'Add Personality', description: 'Include opinions & asides' },
  { id: 'simplify_vocab', name: 'Simplify Vocabulary', description: 'Use everyday words' },
  { id: 'add_examples', name: 'Add Examples', description: 'Include relatable examples' },
  { id: 'rhetorical_questions', name: 'Rhetorical Questions', description: 'Engage the reader' },
  { id: 'imperfections', name: 'Minor Imperfections', description: 'Add natural quirks' }
]

export default function ContentHumanizerPage() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Input state
  const [inputText, setInputText] = useState('')
  const [humanizationLevel, setHumanizationLevel] = useState('medium')
  const [writingTone, setWritingTone] = useState('professional')
  const [inputMethod, setInputMethod] = useState('paste')
  const [uploadedFile, setUploadedFile] = useState(null)
  
  // Technique toggles
  const [enabledTechniques, setEnabledTechniques] = useState([
    'vary_sentences', 'add_transitions', 'use_contractions', 'add_personality'
  ])

  // Results state
  const [humanizedText, setHumanizedText] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [comparison, setComparison] = useState(null)

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: 'Content Humanizer',
    inputText,
    humanizationLevel,
    writingTone,
    humanizedText
  }), [inputText, humanizationLevel, writingTone, humanizedText])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.inputText) setInputText(data.inputText)
    if (data.humanizationLevel) setHumanizationLevel(data.humanizationLevel)
    if (data.writingTone) setWritingTone(data.writingTone)
    if (data.humanizedText) setHumanizedText(data.humanizedText)
  }

  // Toggle technique
  const toggleTechnique = (id) => {
    setEnabledTechniques(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

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
        setInputText(data.text)
        toast({ title: 'File uploaded successfully!' })
      } else {
        throw new Error(data.error || 'Failed to extract text')
      }
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' })
      setUploadedFile(null)
    } finally {
      setUploadingFile(false)
    }
  }

  // Clear uploaded file
  const clearUploadedFile = () => {
    setUploadedFile(null)
    setInputText('')
  }

  // Analyze AI probability
  const analyzeText = async (text) => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai-humanizer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await response.json()
      if (data.success) {
        return data.analysis
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
    return null
  }

  // Humanize text
  const humanizeText = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Please enter some text', variant: 'destructive' })
      return
    }

    if (inputText.trim().split(/\s+/).length < 20) {
      toast({ title: 'Please enter at least 20 words', variant: 'destructive' })
      return
    }

    setLoading(true)
    setHumanizedText('')
    setComparison(null)

    try {
      // First analyze original text
      const originalAnalysis = await analyzeText(inputText)
      
      // Then humanize
      const response = await fetch('/api/ai-humanizer/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          level: humanizationLevel,
          tone: writingTone,
          techniques: enabledTechniques
        })
      })

      const data = await response.json()
      if (data.success) {
        setHumanizedText(data.humanizedText)
        
        // Analyze humanized text
        const humanizedAnalysis = await analyzeText(data.humanizedText)
        
        setComparison({
          original: originalAnalysis,
          humanized: humanizedAnalysis
        })
        
        setAnalysisResult(data.analysis)
        
        // Auto-save to library
        try {
          const titlePreview = inputText.substring(0, 50).trim() + (inputText.length > 50 ? '...' : '')
          await saveToLibrary({
            type: 'humanized-content',
            category: 'text',
            title: `Humanized: ${titlePreview}`,
            description: `Humanized content with ${humanizationLevel} level, ${writingTone} tone`,
            content: data.humanizedText,
            metadata: {
              humanizationLevel,
              writingTone,
              techniques: enabledTechniques,
              originalAiScore: originalAnalysis?.aiProbability || null,
              humanizedAiScore: humanizedAnalysis?.aiProbability || null,
              improvement: data.analysis?.improvement || null,
              wordCount: data.humanizedText.split(/\s+/).filter(w => w).length,
              contentType: 'humanized-text'
            }
          })
          console.log('Humanized content auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save to library:', saveError)
        }
        
        toast({
          title: 'Text Humanized!',
          description: `AI detection reduced by ${data.analysis?.improvement || 'significant'}%`
        })
      } else {
        throw new Error(data.error || 'Humanization failed')
      }
    } catch (error) {
      toast({
        title: 'Humanization Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Copy text
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copied to clipboard!' })
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' })
    }
  }

  // Reset
  const resetAll = () => {
    setInputText('')
    setHumanizedText('')
    setAnalysisResult(null)
    setComparison(null)
    setUploadedFile(null)
  }

  // Use humanized as input for another round
  const refineAgain = () => {
    setInputText(humanizedText)
    setHumanizedText('')
    setComparison(null)
  }

  const wordCount = inputText.trim().split(/\s+/).filter(w => w).length
  const selectedLevel = HUMANIZATION_LEVELS.find(l => l.id === humanizationLevel)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/viral-posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-purple-500" />
                AI Content Humanizer
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                Pro Tool
              </Badge>
            </div>
            <p className="text-muted-foreground">Transform AI text into natural, human-sounding content that bypasses AI detection</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="content-humanizer"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={1}
        />
      </div>

      {/* Use Case Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Perfect for:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Blog Articles', 'LinkedIn Posts', 'Social Media Content', 'SEO Articles', 'Product Descriptions', 'Email Copy'].map((useCase) => (
                <Badge key={useCase} variant="secondary" className="bg-white dark:bg-purple-900">
                  {useCase}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input & Settings */}
        <div className="space-y-4">
          {/* Humanization Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Humanization Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {HUMANIZATION_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setHumanizationLevel(level.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      humanizationLevel === level.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-muted hover:border-purple-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{level.icon}</div>
                    <div className="text-sm font-medium">{level.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{level.description}</div>
                  </button>
                ))}
              </div>
              {selectedLevel && (
                <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
                  <strong>What changes:</strong> {selectedLevel.changes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Writing Tone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Target Tone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {WRITING_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setWritingTone(tone.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      writingTone === tone.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-muted hover:border-purple-300'
                    }`}
                  >
                    <div className="text-lg">{tone.icon}</div>
                    <div className="text-xs font-medium">{tone.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI-Generated Text
              </CardTitle>
              <CardDescription>Paste your AI-generated content to humanize it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={inputMethod} onValueChange={setInputMethod}>
                <TabsList className="grid grid-cols-2 w-full max-w-xs">
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="mt-4">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your AI-generated text here...\n\nThis tool will rewrite it to sound more natural and human-written, helping it bypass AI detection tools."
                    className="min-h-[200px] text-sm"
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  {!uploadedFile ? (
                    <label 
                      htmlFor="humanizer-file-upload"
                      className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : (
                        <>
                          <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload PDF, DOC, or TXT</p>
                        </>
                      )}
                      <input
                        id="humanizer-file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  ) : (
                    <div className="p-3 border rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearUploadedFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span>Min: 20 words</span>
              </div>

              <Button 
                onClick={humanizeText} 
                disabled={loading || wordCount < 20}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Humanizing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Humanize Text</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Techniques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Humanization Techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {TECHNIQUES.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => toggleTechnique(tech.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      enabledTechniques.includes(tech.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-muted opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        enabledTechniques.includes(tech.id) ? 'bg-purple-500' : 'bg-muted'
                      }`} />
                      <span className="font-medium">{tech.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-4">
          {!humanizedText ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <Bot className="absolute inset-0 h-20 w-20 text-muted-foreground/20" />
                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-500" />
                  <User className="absolute right-0 bottom-0 h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">AI → Human</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Transform robotic AI text into natural, engaging content that reads like it was written by a human.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">Bypass AI Detection</Badge>
                  <Badge variant="outline">Natural Flow</Badge>
                  <Badge variant="outline">Human Voice</Badge>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* AI Detection Comparison */}
              {comparison && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      AI Detection Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Original</span>
                        </div>
                        <div className="text-3xl font-bold text-red-600">
                          {comparison.original?.aiProbability || 95}%
                        </div>
                        <div className="text-xs text-red-600">AI Detected</div>
                        <Progress value={comparison.original?.aiProbability || 95} className="mt-2 h-2 bg-red-200" />
                      </div>
                      
                      {/* Humanized */}
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Humanized</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                          {comparison.humanized?.aiProbability || 15}%
                        </div>
                        <div className="text-xs text-green-600">AI Detected</div>
                        <Progress value={comparison.humanized?.aiProbability || 15} className="mt-2 h-2 bg-green-200" />
                      </div>
                    </div>
                    
                    {/* Improvement Badge */}
                    <div className="mt-4 text-center">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-1">
                        🎉 {(comparison.original?.aiProbability || 95) - (comparison.humanized?.aiProbability || 15)}% Improvement
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Humanized Text */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5 text-green-500" />
                      Humanized Text
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copyText(humanizedText)}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={refineAgain}>
                        <Shuffle className="h-4 w-4 mr-1" /> Refine More
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-sm leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {humanizedText}
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <span>{humanizedText.split(/\s+/).filter(w => w).length} words</span>
                    <span>Tone: {WRITING_TONES.find(t => t.id === writingTone)?.name}</span>
                  </div>
                </CardContent>
              </Card>

              {/* What Changed */}
              {analysisResult?.changes && (
                <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <Brain className="h-5 w-5" />
                      What Was Changed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysisResult.changes.map((change, idx) => (
                        <li key={idx} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetAll}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Start Over
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={refineAgain}
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Humanize Again
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Tips for Best Results</h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• For heavily AI-detected text, try "Deep Rewrite" level</li>
                <li>• Use "Conversational" tone for blog posts and articles</li>
                <li>• Run multiple passes for stubborn AI-detected content</li>
                <li>• Review and add your own personal touches after humanization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
