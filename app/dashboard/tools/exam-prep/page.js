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
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, Download, Sparkles, Loader2, Clock,
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Edit3,
  BookOpen, Brain, Target, Trophy, Search, Globe,
  FileText, Timer, Play, RotateCcw, Eye, RefreshCw,
  AlertCircle, BookMarked, Award, Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Predefined Exam Categories
const EXAM_CATEGORIES = [
  {
    id: 'board-exams',
    name: 'Board Exams',
    icon: '🎓',
    description: 'School & college board examinations',
    exams: [
      { id: 'ssc-bangladesh', name: 'SSC (Bangladesh)', country: 'BD' },
      { id: 'hsc-bangladesh', name: 'HSC (Bangladesh)', country: 'BD' },
      { id: 'cbse-10', name: 'CBSE Class 10', country: 'IN' },
      { id: 'cbse-12', name: 'CBSE Class 12', country: 'IN' },
      { id: 'icse', name: 'ICSE', country: 'IN' },
      { id: 'state-board', name: 'State Board', country: 'IN' },
    ]
  },
  {
    id: 'competitive',
    name: 'Competitive Exams',
    icon: '🏆',
    description: 'Government & civil service exams',
    exams: [
      { id: 'bcs-bangladesh', name: 'BCS (Bangladesh Civil Service)', country: 'BD' },
      { id: 'bank-job-bd', name: 'Bank Job Exam (Bangladesh)', country: 'BD' },
      { id: 'upsc', name: 'UPSC (India)', country: 'IN' },
      { id: 'ssc-cgl', name: 'SSC CGL (India)', country: 'IN' },
      { id: 'bank-po', name: 'Bank PO (India)', country: 'IN' },
      { id: 'railway', name: 'Railway Exams', country: 'IN' },
    ]
  },
  {
    id: 'language',
    name: 'Language & Aptitude',
    icon: '🌍',
    description: 'English proficiency & aptitude tests',
    exams: [
      { id: 'ielts', name: 'IELTS', country: 'Global' },
      { id: 'toefl', name: 'TOEFL', country: 'Global' },
      { id: 'gre', name: 'GRE', country: 'Global' },
      { id: 'gmat', name: 'GMAT', country: 'Global' },
      { id: 'sat', name: 'SAT', country: 'Global' },
    ]
  },
  {
    id: 'professional',
    name: 'Professional Certifications',
    icon: '💼',
    description: 'IT, Medical & professional certifications',
    exams: [
      { id: 'aws', name: 'AWS Certification', country: 'Global' },
      { id: 'pmp', name: 'PMP', country: 'Global' },
      { id: 'cfa', name: 'CFA', country: 'Global' },
      { id: 'medical-entrance', name: 'Medical Entrance', country: 'Various' },
      { id: 'engineering-entrance', name: 'Engineering Entrance', country: 'Various' },
    ]
  },
  {
    id: 'custom',
    name: 'Custom Exam',
    icon: '✨',
    description: 'Enter any exam name',
    exams: []
  }
]

// Practice Modes
const PRACTICE_MODES = [
  { id: 'quick', name: 'Quick Practice', icon: Zap, questions: 10, time: null, description: '10 questions, no time limit' },
  { id: 'timed', name: 'Timed Practice', icon: Timer, questions: 20, time: 30, description: '20 questions in 30 minutes' },
  { id: 'mock-test', name: 'Full Mock Test', icon: Trophy, questions: 50, time: 60, description: '50 questions in 60 minutes' },
  { id: 'topic-wise', name: 'Topic Practice', icon: Target, questions: 15, time: null, description: 'Focus on specific topics' },
]

// Difficulty Levels
const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', color: 'bg-green-500' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-500' },
  { id: 'hard', name: 'Hard', color: 'bg-red-500' },
  { id: 'mixed', name: 'Mixed', color: 'bg-purple-500' },
]

export default function ExamPrepPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchingExam, setSearchingExam] = useState(false)
  const { toast } = useToast()

  // Step 1: Exam Selection
  const [examCategory, setExamCategory] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [customExamName, setCustomExamName] = useState('')
  const [examInfo, setExamInfo] = useState(null)
  
  // Step 2: Practice Configuration
  const [practiceMode, setPracticeMode] = useState('quick')
  const [difficulty, setDifficulty] = useState('medium')
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState(null)
  const [includeExplanations, setIncludeExplanations] = useState(true)
  
  // Step 3: Practice Session
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [showAnswer, setShowAnswer] = useState(false)
  const [practiceStarted, setPracticeStarted] = useState(false)
  const [practiceCompleted, setPracticeCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const timerRef = useRef(null)
  
  // Results
  const [results, setResults] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Get available exams for selected category
  const getAvailableExams = () => {
    const category = EXAM_CATEGORIES.find(c => c.id === examCategory)
    return category?.exams || []
  }

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: customExamName || selectedExam || 'Exam Prep',
    examCategory,
    selectedExam,
    customExamName,
    examInfo,
    practiceMode,
    difficulty,
    subject,
    customSubject,
    questionCount,
    timeLimit,
    includeExplanations,
    questions,
    userAnswers,
    results,
    step
  }), [examCategory, selectedExam, customExamName, examInfo, practiceMode, difficulty, subject, customSubject, questionCount, timeLimit, includeExplanations, questions, userAnswers, results, step])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.examCategory) setExamCategory(data.examCategory)
    if (data.selectedExam) setSelectedExam(data.selectedExam)
    if (data.customExamName) setCustomExamName(data.customExamName)
    if (data.examInfo) setExamInfo(data.examInfo)
    if (data.practiceMode) setPracticeMode(data.practiceMode)
    if (data.difficulty) setDifficulty(data.difficulty)
    if (data.subject) setSubject(data.subject)
    if (data.customSubject) setCustomSubject(data.customSubject)
    if (data.questionCount) setQuestionCount(data.questionCount)
    if (data.timeLimit !== undefined) setTimeLimit(data.timeLimit)
    if (typeof data.includeExplanations === 'boolean') setIncludeExplanations(data.includeExplanations)
    if (data.questions) setQuestions(data.questions)
    if (data.userAnswers) setUserAnswers(data.userAnswers)
    if (data.results) setResults(data.results)
    if (data.step) setStep(Math.min(data.step, 2))
  }

  // Search for exam information
  const searchExamInfo = async () => {
    const examName = customExamName || EXAM_CATEGORIES.flatMap(c => c.exams).find(e => e.id === selectedExam)?.name
    if (!examName) return

    setSearchingExam(true)
    try {
      const response = await fetch('/api/exam-prep/search-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName })
      })
      
      const data = await response.json()
      if (data.success) {
        setExamInfo(data.examInfo)
        toast({
          title: 'Exam Info Found!',
          description: `Found pattern and details for ${examName}`
        })
      } else {
        toast({
          title: 'Search Complete',
          description: 'Proceeding with general exam format'
        })
      }
    } catch (error) {
      console.error('Exam search error:', error)
    } finally {
      setSearchingExam(false)
    }
  }

  // Generate practice questions
  const generateQuestions = async () => {
    const examName = customExamName || EXAM_CATEGORIES.flatMap(c => c.exams).find(e => e.id === selectedExam)?.name
    if (!examName) {
      toast({ title: 'Select an exam', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/exam-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-questions',
          examName,
          examInfo,
          practiceMode,
          difficulty,
          subject: customSubject || subject,
          questionCount,
          includeExplanations
        })
      })

      const data = await response.json()
      if (data.success) {
        setQuestions(data.questions)
        setUserAnswers({})
        setCurrentQuestionIndex(0)
        setShowAnswer(false)
        setPracticeStarted(false)
        setPracticeCompleted(false)
        setResults(null)
        setStep(3)
        toast({
          title: 'Questions Generated!',
          description: `${data.questions.length} questions ready for practice`
        })
      } else {
        throw new Error(data.error || 'Failed to generate questions')
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

  // Start practice session
  const startPractice = () => {
    setPracticeStarted(true)
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
    
    // Set timer if timed mode
    const mode = PRACTICE_MODES.find(m => m.id === practiceMode)
    if (mode?.time || timeLimit) {
      const minutes = timeLimit || mode.time
      setTimeRemaining(minutes * 60)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            submitPractice()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  // Answer a question
  const answerQuestion = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  // Navigate questions
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
      setShowAnswer(false)
    }
  }

  // Submit practice
  const submitPractice = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Calculate results
    let correct = 0
    let incorrect = 0
    let unanswered = 0
    
    questions.forEach((q, idx) => {
      const userAnswer = userAnswers[idx]
      if (!userAnswer) {
        unanswered++
      } else if (userAnswer === q.correctAnswer || userAnswer === q.answer) {
        correct++
      } else {
        incorrect++
      }
    })
    
    const score = Math.round((correct / questions.length) * 100)
    
    setResults({
      correct,
      incorrect,
      unanswered,
      total: questions.length,
      score,
      timeSpent: timeLimit ? (timeLimit * 60 - (timeRemaining || 0)) : null
    })
    
    setPracticeCompleted(true)
    setStep(4)
  }

  // Generate PDF
  const generatePDF = async () => {
    const examName = customExamName || EXAM_CATEGORIES.flatMap(c => c.exams).find(e => e.id === selectedExam)?.name
    
    setLoading(true)
    try {
      const response = await fetch('/api/exam-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          examName,
          questions,
          userAnswers,
          results,
          difficulty,
          subject: customSubject || subject
        })
      })

      const data = await response.json()
      if (data.success) {
        setPdfUrl(data.pdfUrl)
        toast({
          title: 'PDF Ready!',
          description: 'Your practice paper is ready for download'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'PDF Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset practice
  const resetPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setUserAnswers({})
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
    setPracticeStarted(false)
    setPracticeCompleted(false)
    setResults(null)
    setTimeRemaining(null)
    setStep(3)
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const selectedCategory = EXAM_CATEGORIES.find(c => c.id === examCategory)
  const selectedExamInfo = EXAM_CATEGORIES.flatMap(c => c.exams).find(e => e.id === selectedExam)

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
              <GraduationCap className="h-6 w-6 text-primary" />
              Exam Prep Assistant
            </h1>
            <p className="text-muted-foreground">Practice questions for any exam with AI-powered generation</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="exam-prep"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={step}
        />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { num: 1, label: 'Select Exam', icon: BookOpen },
          { num: 2, label: 'Configure', icon: Target },
          { num: 3, label: 'Practice', icon: Brain },
          { num: 4, label: 'Results', icon: Trophy }
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

      {/* Step 1: Select Exam */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Step 1: Choose Your Exam
              </CardTitle>
              <CardDescription>
                Select from popular exams or enter any exam name - we'll search for the pattern and generate relevant questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exam Categories */}
              <div className="space-y-3">
                <Label>Exam Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {EXAM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setExamCategory(cat.id)
                        setSelectedExam('')
                        setCustomExamName('')
                        setExamInfo(null)
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        examCategory === cat.id 
                          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="font-medium text-sm">{cat.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{cat.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Selection or Custom Input */}
              {examCategory && examCategory !== 'custom' && (
                <div className="space-y-3">
                  <Label>Select Exam</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getAvailableExams().map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => {
                          setSelectedExam(exam.id)
                          setCustomExamName('')
                          setExamInfo(null)
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedExam === exam.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{exam.name}</div>
                        <Badge variant="secondary" className="text-xs mt-1">{exam.country}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Exam Input */}
              {(examCategory === 'custom' || examCategory) && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {examCategory === 'custom' ? 'Enter Exam Name' : 'Or enter a custom exam'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={customExamName}
                      onChange={(e) => {
                        setCustomExamName(e.target.value)
                        if (e.target.value) setSelectedExam('')
                        setExamInfo(null)
                      }}
                      placeholder="e.g., NEET, JEE Main, CA Foundation, Bar Exam..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={searchExamInfo} 
                      disabled={searchingExam || (!customExamName && !selectedExam)}
                      variant="secondary"
                    >
                      {searchingExam ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Globe className="h-4 w-4 mr-1" /> Search Pattern</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll search the web to find the exam pattern, question types, and marking scheme
                  </p>
                </div>
              )}

              {/* Exam Info Preview */}
              {examInfo && (
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-800 dark:text-green-200 text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Exam Pattern Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2 text-green-700 dark:text-green-300">
                      {examInfo.pattern && <p><strong>Pattern:</strong> {examInfo.pattern}</p>}
                      {examInfo.sections && <p><strong>Sections:</strong> {examInfo.sections}</p>}
                      {examInfo.questionTypes && <p><strong>Question Types:</strong> {examInfo.questionTypes}</p>}
                      {examInfo.duration && <p><strong>Duration:</strong> {examInfo.duration}</p>}
                      {examInfo.totalMarks && <p><strong>Total Marks:</strong> {examInfo.totalMarks}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(2)}
                disabled={!selectedExam && !customExamName}
              >
                Continue to Configuration <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Configure Practice */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Step 2: Configure Your Practice
            </CardTitle>
            <CardDescription>
              Customize your practice session for {customExamName || selectedExamInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Practice Mode */}
            <div className="space-y-3">
              <Label>Practice Mode</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRACTICE_MODES.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setPracticeMode(mode.id)
                        setQuestionCount(mode.questions)
                        setTimeLimit(mode.time)
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        practiceMode === mode.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-2 ${practiceMode === mode.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="font-medium text-sm">{mode.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mode.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <Label>Difficulty Level</Label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      difficulty === level.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${level.color} mx-auto mb-2`} />
                    <div className="font-medium text-sm text-center">{level.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject/Topic */}
            <div className="space-y-3">
              <Label>Subject / Topic (Optional)</Label>
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g., Mathematics, General Knowledge, English Grammar..."
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for a mixed practice covering all subjects
              </p>
            </div>

            {/* Custom Settings */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Questions: {questionCount}</Label>
                <Input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Time Limit (minutes): {timeLimit || 'No limit'}</Label>
                <Input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={timeLimit || 0}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || null)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Include Explanations</Label>
                <p className="text-xs text-muted-foreground">Show detailed explanations for each answer</p>
              </div>
              <Switch checked={includeExplanations} onCheckedChange={setIncludeExplanations} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={generateQuestions} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Questions...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Practice Questions</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Practice Session */}
      {step === 3 && questions.length > 0 && (
        <div className="space-y-4">
          {/* Practice Header */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {customExamName || selectedExamInfo?.name}
                  </Badge>
                  <span className="text-muted-foreground">
                    {currentQuestionIndex + 1} / {questions.length}
                  </span>
                </div>
                
                {timeRemaining !== null && practiceStarted && (
                  <div className={`flex items-center gap-2 text-lg font-mono ${
                    timeRemaining < 60 ? 'text-red-500' : timeRemaining < 300 ? 'text-yellow-500' : ''
                  }`}>
                    <Timer className="h-5 w-5" />
                    {formatTime(timeRemaining)}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!practiceStarted ? (
                    <Button onClick={startPractice}>
                      <Play className="h-4 w-4 mr-2" /> Start Practice
                    </Button>
                  ) : (
                    <Button onClick={submitPractice} variant="destructive">
                      <CheckCircle className="h-4 w-4 mr-2" /> Submit
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <Progress 
                value={(Object.keys(userAnswers).length / questions.length) * 100} 
                className="mt-4"
              />
            </CardContent>
          </Card>

          {/* Question Card */}
          {practiceStarted && currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge className={DIFFICULTY_LEVELS.find(d => d.id === (currentQuestion.difficulty || difficulty))?.color}>
                    {currentQuestion.difficulty || difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div className="text-lg leading-relaxed">
                  {currentQuestion.question}
                </div>

                {/* Options */}
                {currentQuestion.type === 'multiple-choice' || currentQuestion.options ? (
                  <div className="space-y-3">
                    {(currentQuestion.options || []).map((option, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const isSelected = userAnswers[currentQuestionIndex] === letter
                      const isCorrect = showAnswer && (letter === currentQuestion.correctAnswer || letter === currentQuestion.answer)
                      const isWrong = showAnswer && isSelected && !isCorrect
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !showAnswer && answerQuestion(letter)}
                          disabled={showAnswer}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                            isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                            isWrong ? 'border-red-500 bg-red-50 dark:bg-red-950/30' :
                            isSelected ? 'border-primary bg-primary/10' :
                            'border-muted hover:border-primary/50'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isCorrect ? 'bg-green-500 text-white' :
                            isWrong ? 'bg-red-500 text-white' :
                            isSelected ? 'bg-primary text-primary-foreground' :
                            'bg-muted'
                          }`}>
                            {letter}
                          </span>
                          <span className="flex-1">{option.replace(/^[A-D]\)\s*/, '')}</span>
                          {isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {isWrong && <XCircle className="h-5 w-5 text-red-500" />}
                        </button>
                      )
                    })}
                  </div>
                ) : currentQuestion.type === 'true-false' ? (
                  <div className="flex gap-4">
                    {['True', 'False'].map((opt) => {
                      const isSelected = userAnswers[currentQuestionIndex] === opt
                      const isCorrect = showAnswer && opt === currentQuestion.correctAnswer
                      const isWrong = showAnswer && isSelected && !isCorrect
                      
                      return (
                        <button
                          key={opt}
                          onClick={() => !showAnswer && answerQuestion(opt)}
                          disabled={showAnswer}
                          className={`flex-1 p-4 rounded-lg border-2 text-center font-medium transition-all ${
                            isCorrect ? 'border-green-500 bg-green-50' :
                            isWrong ? 'border-red-500 bg-red-50' :
                            isSelected ? 'border-primary bg-primary/10' :
                            'border-muted hover:border-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {/* Show Answer Button */}
                {!showAnswer && userAnswers[currentQuestionIndex] && (
                  <Button variant="outline" onClick={() => setShowAnswer(true)}>
                    <Eye className="h-4 w-4 mr-2" /> Show Answer
                  </Button>
                )}

                {/* Explanation */}
                {showAnswer && currentQuestion.explanation && (
                  <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                    <CardContent className="py-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Explanation</h4>
                      <p className="text-blue-700 dark:text-blue-300">{currentQuestion.explanation}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                  
                  <div className="flex gap-1 flex-wrap justify-center max-w-md">
                    {questions.slice(0, 20).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToQuestion(idx)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                          idx === currentQuestionIndex ? 'bg-primary text-primary-foreground' :
                          userAnswers[idx] ? 'bg-green-500 text-white' :
                          'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    {questions.length > 20 && <span className="px-2">...</span>}
                  </div>
                  
                  <Button 
                    onClick={() => {
                      setShowAnswer(false)
                      goToQuestion(currentQuestionIndex + 1)
                    }}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && results && (
        <Card>
          <CardHeader className="text-center">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              results.score >= 70 ? 'bg-green-100 dark:bg-green-900/30' :
              results.score >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              <span className={`text-3xl font-bold ${
                results.score >= 70 ? 'text-green-600' :
                results.score >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>{results.score}%</span>
            </div>
            <CardTitle className="text-2xl">
              {results.score >= 70 ? 'Excellent!' : results.score >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
            </CardTitle>
            <CardDescription>
              {customExamName || selectedExamInfo?.name} Practice Complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{results.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{results.incorrect}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">{results.unanswered}</div>
                <div className="text-sm text-muted-foreground">Unanswered</div>
              </div>
            </div>

            {results.timeSpent && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-lg font-semibold">
                  Time Spent: {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={generatePDF} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Download PDF
              </Button>
              {pdfUrl && (
                <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary">
                    <FileText className="h-4 w-4 mr-2" /> Open PDF
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={resetPractice}>
                <RotateCcw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => {
                setQuestions([])
                setStep(2)
              }}>
                <RefreshCw className="h-4 w-4 mr-2" /> New Questions
              </Button>
            </div>

            {/* Review Answers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Your Answers</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto space-y-3">
                {questions.map((q, idx) => {
                  const userAnswer = userAnswers[idx]
                  const isCorrect = userAnswer === q.correctAnswer || userAnswer === q.answer
                  
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      !userAnswer ? 'bg-gray-50 dark:bg-gray-900/30' :
                      isCorrect ? 'bg-green-50 dark:bg-green-950/30 border-green-200' :
                      'bg-red-50 dark:bg-red-950/30 border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          !userAnswer ? 'bg-gray-200' :
                          isCorrect ? 'bg-green-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{q.question}</p>
                          <div className="text-xs mt-1 space-x-3">
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              Your answer: {userAnswer || 'Not answered'}
                            </span>
                            {!isCorrect && (
                              <span className="text-green-600">
                                Correct: {q.correctAnswer || q.answer}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
