'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, AlertCircle, AlertTriangle, Info,
  Sparkles, Loader2, ArrowLeft, Copy, RefreshCw,
  FileText, Upload, FileUp, File, X, Wand2,
  BookOpen, Lightbulb, Target, BarChart3,
  Type, AlignLeft, Zap, Eye, PenTool
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Writing styles
const WRITING_STYLES = [
  { id: 'academic', name: 'Academic', description: 'Formal, scholarly writing', icon: '🎓' },
  { id: 'business', name: 'Business', description: 'Professional, corporate tone', icon: '💼' },
  { id: 'casual', name: 'Casual', description: 'Informal, conversational', icon: '💬' },
  { id: 'creative', name: 'Creative', description: 'Expressive, artistic writing', icon: '🎨' },
  { id: 'technical', name: 'Technical', description: 'Precise, documentation style', icon: '⚙️' },
  { id: 'journalistic', name: 'Journalistic', description: 'News and article writing', icon: '📰' }
]

// Issue severity colors
const SEVERITY_CONFIG = {
  error: { color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle, label: 'Error' },
  warning: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle, label: 'Warning' },
  suggestion: { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Lightbulb, label: 'Suggestion' },
  style: { color: 'text-purple-600 bg-purple-50 border-purple-200', icon: PenTool, label: 'Style' }
}

// Issue categories
const ISSUE_CATEGORIES = {
  grammar: { name: 'Grammar', icon: '📝', description: 'Subject-verb agreement, tense, articles' },
  spelling: { name: 'Spelling', icon: '🔤', description: 'Misspelled words and typos' },
  punctuation: { name: 'Punctuation', icon: '❗', description: 'Commas, periods, apostrophes' },
  style: { name: 'Style', icon: '✨', description: 'Word choice, clarity, conciseness' },
  readability: { name: 'Readability', icon: '👁️', description: 'Sentence length, complexity' },
  tone: { name: 'Tone', icon: '🎭', description: 'Voice consistency, formality' }
}

export default function GrammarCheckerPage() {
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const { toast } = useToast()

  // Input state
  const [inputText, setInputText] = useState('')
  const [writingStyle, setWritingStyle] = useState('academic')
  const [inputMethod, setInputMethod] = useState('paste')
  const [uploadedFile, setUploadedFile] = useState(null)

  // Results state
  const [results, setResults] = useState(null)
  const [correctedText, setCorrectedText] = useState('')
  const [activeIssue, setActiveIssue] = useState(null)

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: 'Grammar Check',
    inputText,
    writingStyle,
    results,
    correctedText
  }), [inputText, writingStyle, results, correctedText])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.inputText) setInputText(data.inputText)
    if (data.writingStyle) setWritingStyle(data.writingStyle)
    if (data.results) setResults(data.results)
    if (data.correctedText) setCorrectedText(data.correctedText)
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
        setInputText(data.text)
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
    setInputText('')
    const fileInput = document.getElementById('grammar-file-upload')
    if (fileInput) fileInput.value = ''
  }

  // Check grammar and style
  const checkGrammar = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Please enter some text to check', variant: 'destructive' })
      return
    }

    if (inputText.trim().split(/\s+/).length < 10) {
      toast({ title: 'Please enter at least 10 words', variant: 'destructive' })
      return
    }

    setLoading(true)
    setResults(null)
    setActiveIssue(null)

    try {
      const response = await fetch('/api/grammar-checker/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          writingStyle
        })
      })

      const data = await response.json()
      if (data.success) {
        setResults(data.results)
        setCorrectedText(data.correctedText || inputText)
        toast({
          title: 'Analysis Complete!',
          description: `Found ${data.results.issues?.length || 0} issues`
        })
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Apply single correction
  const applyCorrection = (issue) => {
    if (!issue.replacement) return
    
    const newText = inputText.substring(0, issue.offset) + 
                    issue.replacement + 
                    inputText.substring(issue.offset + issue.length)
    setInputText(newText)
    
    // Update results to remove the applied issue
    if (results) {
      setResults({
        ...results,
        issues: results.issues.filter(i => i.id !== issue.id)
      })
    }
    
    toast({ title: 'Correction applied!' })
  }

  // Apply all corrections
  const applyAllCorrections = () => {
    if (correctedText) {
      setInputText(correctedText)
      setResults(prev => prev ? { ...prev, issues: [] } : null)
      toast({ title: 'All corrections applied!' })
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
  const resetChecker = () => {
    setInputText('')
    setResults(null)
    setCorrectedText('')
    setUploadedFile(null)
    setActiveIssue(null)
  }

  // Calculate stats
  const wordCount = inputText.trim().split(/\s+/).filter(w => w).length
  const charCount = inputText.length
  const sentenceCount = inputText.split(/[.!?]+/).filter(s => s.trim()).length

  // Group issues by category
  const issuesByCategory = results?.issues?.reduce((acc, issue) => {
    const cat = issue.category || 'grammar'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(issue)
    return acc
  }, {}) || {}

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
              <CheckCircle className="h-6 w-6 text-green-500" />
              Grammar & Style Checker
            </h1>
            <p className="text-muted-foreground">Polish your writing with AI-powered analysis</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="grammar-checker"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={1}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-4">
          {/* Writing Style Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5" />
                Writing Style
              </CardTitle>
              <CardDescription>Select the style to check against</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {WRITING_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setWritingStyle(style.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      writingStyle === style.id
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="text-xl mb-1">{style.icon}</div>
                    <div className="text-sm font-medium">{style.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{style.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Text
              </CardTitle>
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
                    placeholder="Paste or type your text here for grammar and style checking...\n\nTip: For best results, paste at least a few paragraphs."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  {!uploadedFile ? (
                    <label 
                      htmlFor="grammar-file-upload"
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
                            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, or TXT</p>
                          </>
                        )}
                      </div>
                      <input
                        id="grammar-file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
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
                        <Button variant="ghost" size="icon" onClick={clearUploadedFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {inputText && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                          <div className="max-h-24 overflow-y-auto text-sm bg-background/50 p-2 rounded border">
                            {inputText.substring(0, 300)}...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                <span>{sentenceCount} sentences</span>
              </div>

              {/* Check Button */}
              <Button 
                onClick={checkGrammar} 
                disabled={loading || wordCount < 10}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Check Grammar & Style</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-4">
          {!results ? (
            <Card className="h-full flex items-center justify-center min-h-[500px]">
              <div className="text-center p-8">
                <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">Ready to Check</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enter your text and click "Check Grammar & Style" to get detailed analysis and suggestions.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Score Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analysis Results
                    </span>
                    <Button variant="ghost" size="sm" onClick={resetChecker}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Reset
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Overall Score */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className={`text-3xl font-bold ${
                        results.score >= 80 ? 'text-green-500' :
                        results.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {results.score || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Overall Score</div>
                    </div>
                    
                    {/* Readability */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-500">
                        {results.readability?.gradeLevel || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">Grade Level</div>
                    </div>
                    
                    {/* Issues Count */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className={`text-3xl font-bold ${
                        (results.issues?.length || 0) === 0 ? 'text-green-500' :
                        (results.issues?.length || 0) <= 5 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {results.issues?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Issues Found</div>
                    </div>
                  </div>

                  {/* Progress bars for categories */}
                  {results.categoryScores && (
                    <div className="space-y-2">
                      {Object.entries(results.categoryScores).map(([cat, score]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs w-24 truncate">{ISSUE_CATEGORIES[cat]?.name || cat}</span>
                          <Progress value={score} className="flex-1 h-2" />
                          <span className="text-xs w-8 text-right">{score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Issues List */}
              {results.issues && results.issues.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Issues & Suggestions
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={applyAllCorrections}>
                        <Wand2 className="h-4 w-4 mr-1" /> Fix All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {results.issues.map((issue, idx) => {
                          const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion
                          const Icon = config.icon
                          return (
                            <div
                              key={issue.id || idx}
                              className={`p-3 rounded-lg border ${config.color} cursor-pointer transition-all ${
                                activeIssue === idx ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => setActiveIssue(activeIssue === idx ? null : idx)}
                            >
                              <div className="flex items-start gap-2">
                                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px]">
                                      {ISSUE_CATEGORIES[issue.category]?.name || issue.category}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium">{issue.message}</p>
                                  {issue.context && (
                                    <p className="text-xs mt-1 font-mono bg-white/50 dark:bg-black/20 p-1 rounded">
                                      ...{issue.context}...
                                    </p>
                                  )}
                                  {issue.replacement && activeIssue === idx && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-xs">Suggestion:</span>
                                      <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                                        {issue.replacement}
                                      </code>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          applyCorrection(issue)
                                        }}
                                      >
                                        Apply
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Corrected Text */}
              {correctedText && correctedText !== inputText && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Corrected Version
                      </CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => copyText(correctedText)}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm leading-relaxed max-h-[200px] overflow-y-auto">
                      {correctedText}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Writing Tips */}
              {results.tips && results.tips.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Lightbulb className="h-5 w-5" />
                      Writing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {results.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <span>•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* No Issues Found */}
              {results.issues?.length === 0 && (
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Excellent!</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">No issues found in your text.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
