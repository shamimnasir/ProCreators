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
import { Switch } from '@/components/ui/switch'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  HelpCircle, Download, Loader2, DollarSign,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  ChevronDown, ChevronUp, RefreshCw, BookOpen, Brain,
  GraduationCap, Palette, FileText, Zap
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Quiz Types
const QUIZ_TYPES = [
  { id: 'academic', name: 'Academic Test', icon: GraduationCap, description: 'Educational assessments for students' },
  { id: 'trivia', name: 'Trivia Quiz', icon: Zap, description: 'Fun knowledge quizzes' },
  { id: 'personality', name: 'Personality Quiz', icon: Brain, description: 'Self-discovery quizzes' },
  { id: 'assessment', name: 'Knowledge Assessment', icon: FileText, description: 'Professional skill evaluation' },
  { id: 'practice', name: 'Practice Exam', icon: BookOpen, description: 'Exam preparation material' },
  { id: 'custom', name: 'Custom Quiz', icon: description: 'Create from your own prompt' }
]

// Topics from the image - organized by category
const QUIZ_TOPICS = {
  academic: [
    { id: 'math', name: 'Math', icon: '🔢' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📜' },
    { id: 'geography', name: 'Geography', icon: '🌍' },
    { id: 'english', name: 'English', icon: '📖' },
    { id: 'biology', name: 'Biology', icon: '🧬' },
    { id: 'chemistry', name: 'Chemistry', icon: '⚗️' },
    { id: 'computer-science', name: 'Computer Science', icon: '💻' }
  ],
  entertainment: [
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'movie', name: 'Movies', icon: '🎬' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
    { id: 'technology', name: 'Technology', icon: '📱' },
    { id: 'celebrity', name: 'Celebrity', icon: '⭐' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'game', name: 'Video Games', icon: '🎮' },
    { id: 'book', name: 'Books & Literature', icon: '📚' }
  ],
  general: [
    { id: 'animal', name: 'Animals', icon: '🦁' },
    { id: 'food', name: 'Food & Cooking', icon: '🍕' },
    { id: 'country', name: 'Countries & Flags', icon: '🏳️' },
    { id: 'art', name: 'Art & Culture', icon: '🎨' }
  ],
  personality: [
    { id: 'relationship', name: 'Relationship', icon: '❤️' },
    { id: 'personality', name: 'Personality', icon: '🧠' }
  ]
}

// Grade levels
const GRADE_LEVELS = [
  { id: 'grade-1', name: 'Grade 1' },
  { id: 'grade-2', name: 'Grade 2' },
  { id: 'grade-3', name: 'Grade 3' },
  { id: 'grade-4', name: 'Grade 4' },
  { id: 'grade-5', name: 'Grade 5' },
  { id: 'grade-6', name: 'Grade 6' },
  { id: 'grade-7', name: 'Grade 7' },
  { id: 'grade-8', name: 'Grade 8' },
  { id: 'grade-9', name: 'Grade 9' },
  { id: 'grade-10', name: 'Grade 10' },
  { id: 'grade-11', name: 'Grade 11' },
  { id: 'grade-12', name: 'Grade 12' },
  { id: 'college', name: 'College' },
  { id: 'general', name: 'General Audience' }
]

// Question types
const QUESTION_TYPES = [
  { id: 'multiple-choice', name: 'Multiple Choice', icon: '🔘' },
  { id: 'true-false', name: 'True/False', icon: '✓✗' },
  { id: 'fill-blank', name: 'Fill in the Blank', icon: '___' },
  { id: 'short-answer', name: 'Short Answer', icon: '📝' },
  { id: 'matching', name: 'Matching', icon: '🔗' }
]

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', description: 'Basic concepts' },
  { id: 'medium', name: 'Medium', description: 'Moderate complexity' },
  { id: 'hard', name: 'Hard', description: 'Advanced concepts' },
  { id: 'mixed', name: 'Mixed', description: 'Variety of levels' }
]

// Color presets
const COLOR_PRESETS = [
  { id: 'blue', name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6' },
  { id: 'purple', name: 'Royal Purple', primary: '#6b21a8', secondary: '#a855f7' },
  { id: 'green', name: 'Forest Green', primary: '#166534', secondary: '#22c55e' },
  { id: 'orange', name: 'Sunset Orange', primary: '#c2410c', secondary: '#f97316' },
  { id: 'pink', name: 'Candy Pink', primary: '#be185d', secondary: '#ec4899' },
  { id: 'teal', name: 'Ocean Teal', primary: '#0f766e', secondary: '#14b8a6' }
]

// Paper sizes
const PAPER_SIZES = [
  { id: '8.5x11', name: '8.5" × 11"', description: 'US Letter' },
  { id: '8x10', name: '8" × 10"', description: 'Photo size' },
  { id: '6x9', name: '6" × 9"', description: 'Book size' },
  { id: 'a4', name: 'A4', description: 'International' }
]

export default function QuizMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Step 1: Quiz Setup
  const [quizTitle, setQuizTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [quizType, setQuizType] = useState('academic')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [gradeLevel, setGradeLevel] = useState('general')
  const [questionCount, setQuestionCount] = useState(10)
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(['multiple-choice'])
  const [difficulty, setDifficulty] = useState('medium')

  // Step 2: Questions (editable)
  const [questions, setQuestions] = useState([])
  const [quizContent, setQuizContent] = useState(null)
  const [expandedQuestion, setExpandedQuestion] = useState(null)

  // Step 3: Design
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [selectedPreset, setSelectedPreset] = useState('blue')
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#1e40af')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#3b82f6')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [generateCoverImage, setGenerateCoverImage] = useState(true)
  const [customCoverPrompt, setCustomCoverPrompt] = useState('')
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true)

  // Result
  const [result, setResult] = useState(null)

  // Get available topics based on quiz type
  const getAvailableTopics = () => {
    if (quizType === 'academic' || quizType === 'practice' || quizType === 'assessment') {
      return [...QUIZ_TOPICS.academic]
    } else if (quizType === 'trivia') {
      return [...QUIZ_TOPICS.academic, ...QUIZ_TOPICS.entertainment, ...QUIZ_TOPICS.general]
    } else if (quizType === 'personality') {
      return [...QUIZ_TOPICS.personality]
    } else {
      return [] // Custom quiz doesn't need predefined topics
    }
  }

  const availableTopics = getAvailableTopics()

  // Get current data for drafts
  const getCurrentData = () => ({
    title: quizTitle || `${customTopic || selectedTopic} Quiz`,
    quizTitle,
    authorName,
    quizType,
    selectedTopic,
    customTopic,
    customPrompt,
    gradeLevel,
    questionCount,
    selectedQuestionTypes,
    difficulty,
    questions,
    quizContent,
    paperSize,
    selectedPreset,
    customPrimaryColor,
    customSecondaryColor,
    useCustomColor,
    generateCoverImage,
    customCoverPrompt,
    includeAnswerKey,
    step
  })

  // Load draft data
  const loadDraftData = (data) => {
    if (data.quizTitle) setQuizTitle(data.quizTitle)
    if (data.authorName) setAuthorName(data.authorName)
    if (data.quizType) setQuizType(data.quizType)
    if (data.selectedTopic) setSelectedTopic(data.selectedTopic)
    if (data.customTopic) setCustomTopic(data.customTopic)
    if (data.customPrompt) setCustomPrompt(data.customPrompt)
    if (data.gradeLevel) setGradeLevel(data.gradeLevel)
    if (data.questionCount) setQuestionCount(data.questionCount)
    if (data.selectedQuestionTypes) setSelectedQuestionTypes(data.selectedQuestionTypes)
    if (data.difficulty) setDifficulty(data.difficulty)
    if (data.questions) setQuestions(data.questions)
    if (data.quizContent) setQuizContent(data.quizContent)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.useCustomColor !== undefined) setUseCustomColor(data.useCustomColor)
    if (data.generateCoverImage !== undefined) setGenerateCoverImage(data.generateCoverImage)
    if (data.customCoverPrompt) setCustomCoverPrompt(data.customCoverPrompt)
    if (data.includeAnswerKey !== undefined) setIncludeAnswerKey(data.includeAnswerKey)
    if (data.step && data.step > 1) setStep(Math.min(data.step, 3))
    setResult(null)
  }

  // Start new
  const handleStartNew = () => {
    setStep(1)
    setQuizTitle('')
    setAuthorName('')
    setQuizType('academic')
    setSelectedTopic('')
    setCustomTopic('')
    setCustomPrompt('')
    setGradeLevel('general')
    setQuestionCount(10)
    setSelectedQuestionTypes(['multiple-choice'])
    setDifficulty('medium')
    setQuestions([])
    setQuizContent(null)
    setPaperSize('8.5x11')
    setSelectedPreset('blue')
    setUseCustomColor(false)
    setGenerateCoverImage(true)
    setCustomCoverPrompt('')
    setIncludeAnswerKey(true)
    setResult(null)
  }

  // Toggle question type selection
  const toggleQuestionType = (typeId) => {
    setSelectedQuestionTypes(prev => {
      if (prev.includes(typeId)) {
        if (prev.length === 1) return prev // Keep at least one
        return prev.filter(id => id !== typeId)
      }
      return [...prev, typeId]
    })
  }

  // Generate quiz questions with AI
  const generateQuestions = async () => {
    if (quizType === 'custom' && !customPrompt.trim()) {
      toast({ title: "Custom Prompt Required", description: "Please enter your quiz requirements", variant: "destructive" })
      return
    }

    if (quizType !== 'custom' && !selectedTopic && !customTopic.trim()) {
      toast({ title: "Topic Required", description: "Please select or enter a topic", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/quiz-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-structure',
          topic: selectedTopic || customTopic,
          customTopic: customTopic || null,
          quizType,
          gradeLevel,
          questionCount,
          questionTypes: selectedQuestionTypes,
          difficulty,
          customPrompt: quizType === 'custom' ? customPrompt : null
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setQuizContent(data.quiz)
      setQuestions(data.quiz?.questions || [])
      setStep(2)
      toast({ title: "Questions Generated!", description: `${data.quiz?.questions?.length || questionCount} questions created. Edit them below!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate final PDF
  const generatePDF = async () => {
    if (questions.length === 0) {
      toast({ title: "No Questions", description: "Please add at least one question", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const primaryColor = useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af')
      const secondaryColor = useCustomColor ? customSecondaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.secondary || '#3b82f6')

      const response = await fetch('/api/quiz-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          topic: selectedTopic || customTopic,
          customTopic: customTopic || null,
          quizType,
          gradeLevel,
          questionTypes: selectedQuestionTypes,
          difficulty,
          customPrompt: quizType === 'custom' ? customPrompt : null,
          quizContent: {
            ...quizContent,
            questions,
            title: quizTitle || quizContent?.title
          },
          title: quizTitle || quizContent?.title,
          authorName,
          primaryColor,
          secondaryColor,
          generateCover: generateCoverImage,
          customCoverPrompt: customCoverPrompt.trim() || null,
          paperSize,
          includeAnswerKey
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Quiz Ready!", description: `${data.questionCount} question quiz created!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Question management
  const addQuestion = () => {
    setQuestions([...questions, {
      number: questions.length + 1,
      type: selectedQuestionTypes[0] || 'multiple-choice',
      question: '',
      options: ['A) ', 'B) ', 'C) ', 'D) '],
      answer: '',
      explanation: ''
    }])
  }

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 })))
    if (expandedQuestion === idx) setExpandedQuestion(null)
  }

  const moveQuestion = (idx, direction) => {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= questions.length) return
    const updated = [...questions]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    updated.forEach((q, i) => q.number = i + 1)
    setQuestions(updated)
    setExpandedQuestion(newIdx)
  }

  const selectedTopicInfo = availableTopics.find(t => t.id === selectedTopic)
  const QuizTypeIcon = QUIZ_TYPES.find(t => t.id === quizType)?.icon || HelpCircle

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-red-500" />
            Quiz & Test Creator
          </h1>
          <p className="text-muted-foreground">Create educational quizzes and assessments with AI</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Sell for $5-$20
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => {
          const canNavigate = s < step || 
            (s === 2 && questions.length > 0) || 
            (s === 3 && questions.length > 0) ||
            (s === 4 && result)
          
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => canNavigate && setStep(s)}
                disabled={!canNavigate && s > step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50' : s > step ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </button>
              {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        {['Setup', 'Edit Questions', 'Design', 'Download'].map((label, idx) => (
          <span key={label} className={step === idx + 1 ? 'text-primary font-medium' : ''}>{label}</span>
        ))}
      </div>

      {/* Step 1: Quiz Setup */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Step 1: Quiz Setup
                </CardTitle>
                <CardDescription>Configure your quiz type, topic, and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quiz Title & Author */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiz Title (Optional)</Label>
                    <Input
                      placeholder="e.g., World History Challenge"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author/Creator Name</Label>
                    <Input
                      placeholder="Your name or brand"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quiz Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Quiz Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {QUIZ_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            setQuizType(type.id)
                            setSelectedTopic('')
                            setCustomTopic('')
                            setQuestions([])
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            quizType === type.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="h-6 w-6 mb-2 text-muted-foreground" />
                          <div className="font-medium text-sm">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Quiz Prompt */}
                {quizType === 'custom' && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 space-y-3">
                    <Label className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Describe Your Quiz
                    </Label>
                    <Textarea
                      placeholder="Example: Create a quiz about famous inventions of the 20th century, focusing on technology and medicine. Include questions about who invented them and their impact on society."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Be specific! Include the topic, focus areas, and any special requirements.
                    </p>
                  </div>
                )}

                {/* Topic Selection - for non-custom types */}
                {quizType !== 'custom' && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select Topic</Label>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {availableTopics.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTopic(t.id)
                            setCustomTopic('')
                          }}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            selectedTopic === t.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{t.icon}</div>
                          <div className="text-xs font-medium truncate">{t.name}</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Topic Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Or enter custom topic:</span>
                      <Input
                        placeholder="e.g., Ancient Rome, Quantum Physics..."
                        value={customTopic}
                        onChange={(e) => {
                          setCustomTopic(e.target.value)
                          setSelectedTopic('')
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {/* Question Types */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Question Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => toggleQuestionType(type.id)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                          selectedQuestionTypes.includes(type.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                        {selectedQuestionTypes.includes(type.id) && <CheckCircle className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade Level, Question Count, Difficulty */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Grade Level / Audience</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRADE_LEVELS.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Questions: {questionCount}</Label>
                    <Slider
                      value={[questionCount]}
                      onValueChange={(v) => setQuestionCount(v[0])}
                      min={5}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <span className="font-medium">{d.name}</span>
                            <span className="text-muted-foreground ml-2">- {d.description}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <CreditCostBadge toolId="quiz-maker" />
                  <Button className="flex-1" size="lg" onClick={generateQuestions} disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Questions...</>
                    ) : (
                      <><Wand2 className="mr-2 h-4 w-4" /> Generate {questionCount} Questions</>  
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drafts Panel */}
          <div className="lg:col-span-1">
            <AutoSaveDraftsManager
              toolType="quiz-maker"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[quizTitle, authorName, quizType, selectedTopic, customTopic, customPrompt, gradeLevel, questionCount, selectedQuestionTypes, difficulty, questions, selectedPreset, step]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={step}
            />
          </div>
        </div>
      )}

      {/* Step 2: Edit Questions */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-green-500" />
                    Step 2: Edit Your Questions
                  </CardTitle>
                  <CardDescription>Review and customize each question</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1" /> Add Question
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateQuestions} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions yet. Click &quot;Add Question&quot; to create one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                        onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <span className="font-medium truncate max-w-md">
                            {q.question ? q.question.substring(0, 60) + (q.question.length > 60 ? '...' : '') : 'New Question'}
                          </span>
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            {QUESTION_TYPES.find(t => t.id === q.type)?.name || q.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, -1) }} disabled={idx === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 1) }} disabled={idx === questions.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); removeQuestion(idx) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedQuestion === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {expandedQuestion === idx && (
                        <div className="p-4 space-y-4 bg-background">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select 
                                  value={q.type} 
                                  onValueChange={(v) => updateQuestion(idx, 'type', v)}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {QUESTION_TYPES.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>
                                        {t.icon} {t.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Textarea
                                  value={q.question}
                                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                  placeholder="Enter your question..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              {/* Options for multiple choice */}
                              {q.type === 'multiple-choice' && (
                                <div className="space-y-2">
                                  <Label>Options</Label>
                                  {(q.options || ['A) ', 'B) ', 'C) ', 'D) ']).map((opt, oIdx) => (
                                    <Input
                                      key={oIdx}
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...(q.options || [])]
                                        newOpts[oIdx] = e.target.value
                                        updateQuestion(idx, 'options', newOpts)
                                      }}
                                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Input
                                  value={q.answer}
                                  onChange={(e) => updateQuestion(idx, 'answer', e.target.value)}
                                  placeholder="Enter the correct answer"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Explanation (Optional)</Label>
                                <Textarea
                                  value={q.explanation || ''}
                                  onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                                  placeholder="Why is this the correct answer?"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={questions.length === 0}>
                  Continue to Design <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Design */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Step 3: Design & Settings
            </CardTitle>
            <CardDescription>Configure paper size, colors, and export options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Paper Size Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Paper Size
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setPaperSize(size.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          paperSize === size.id 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{size.name}</div>
                        <p className="text-xs text-muted-foreground">{size.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-3">
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id)
                          setCustomPrimaryColor(preset.primary)
                          setCustomSecondaryColor(preset.secondary)
                          setUseCustomColor(false)
                        }}
                        className={`p-3 rounded-lg text-white text-xs font-medium transition-all ${
                          selectedPreset === preset.id && !useCustomColor ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''
                        }`}
                        style={{ backgroundColor: preset.primary }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Custom Colors</Label>
                    <Switch checked={useCustomColor} onCheckedChange={setUseCustomColor} />
                  </div>
                  
                  {useCustomColor && (
                    <div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customPrimaryColor}
                          onChange={(e) => setCustomPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={customPrimaryColor}
                          onChange={(e) => setCustomPrimaryColor(e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customSecondaryColor}
                          onChange={(e) => setCustomSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={customSecondaryColor}
                          onChange={(e) => setCustomSecondaryColor(e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Generate AI Cover Image</Label>
                        <p className="text-sm text-muted-foreground">Create a themed cover image</p>
                      </div>
                      <Switch checked={generateCoverImage} onCheckedChange={setGenerateCoverImage} />
                    </div>
                    
                    {generateCoverImage && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-sm">Custom Cover Prompt (Optional)</Label>
                        <Textarea
                          placeholder="e.g., A professional quiz cover with science and technology elements..."
                          value={customCoverPrompt}
                          onChange={(e) => setCustomCoverPrompt(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Include Answer Key</Label>
                      <p className="text-sm text-muted-foreground">Add answers at the end</p>
                    </div>
                    <Switch checked={includeAnswerKey} onCheckedChange={setIncludeAnswerKey} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <Label>Preview</Label>
                <div 
                  className="rounded-lg p-6 text-white flex flex-col justify-between shadow-xl"
                  style={{ 
                    backgroundColor: useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af'),
                    aspectRatio: paperSize === 'a4' ? '210 / 297' : '8.5 / 11'
                  }}
                >
                  <div className="text-center pt-8">
                    <div className="text-5xl mb-4">{selectedTopicInfo?.icon || '📝'}</div>
                    <h3 className="text-lg font-bold drop-shadow">
                      {quizTitle || quizContent?.title || `${customTopic || selectedTopicInfo?.name || 'Custom'} Quiz`}
                    </h3>
                    <p className="text-sm opacity-80 mt-2">{questions.length} Questions</p>
                    {authorName && <p className="text-xs opacity-70 mt-3">By {authorName}</p>}
                  </div>
                  <div className="text-center space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {PAPER_SIZES.find(s => s.id === paperSize)?.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {GRADE_LEVELS.find(g => g.id === gradeLevel)?.name}
                    </Badge>
                    {includeAnswerKey && <Badge variant="secondary" className="text-xs ml-2">+ Answer Key</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {QUIZ_TYPES.find(t => t.id === quizType)?.name}</p>
                  <p><strong>Questions:</strong> {questions.length}</p>
                  <p><strong>Difficulty:</strong> {DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Quiz PDF...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate Quiz PDF</>  
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Download */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Your Quiz is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedTopicInfo?.icon || '📝'}</div>
              <h3 className="text-xl font-bold">{result.title}</h3>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{result.questionCount} questions</span>
                <span>•</span>
                <span>{QUIZ_TYPES.find(t => t.id === quizType)?.name}</span>
              </div>
              
              <a href={result.downloadUrl} download className="inline-block">
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </Button>
              </a>
            </div>

            {/* Selling Tips */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Where to Sell Your Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Teachers Pay Teachers</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Educational resources marketplace</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Etsy</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Digital downloads</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
                    <p className="font-bold text-amber-800 dark:text-amber-200">Gumroad</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Direct digital sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Design
              </Button>
              <Button variant="outline" onClick={handleStartNew}>
                <Plus className="mr-2 h-4 w-4" /> Create Another
              </Button>
              <Link href="/dashboard/library" className="flex-1">
                <Button variant="outline" className="w-full">View in Library</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
