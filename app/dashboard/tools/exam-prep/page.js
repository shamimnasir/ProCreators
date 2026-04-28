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
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import {
  GraduationCap,
  Download,
  Loader2,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Edit3,
  BookOpen,
  Brain,
  Target,
  Trophy,
  Search,
  Globe,
  FileText,
  Timer,
  Play,
  RotateCcw,
  Eye,
  RefreshCw,
  AlertCircle,
  BookMarked,
  Award,
  Wand2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Predefined Exam Categories
const EXAM_CATEGORIES = [
  {
    id: 'study-abroad',
    name: 'Study Abroad & Academia',
    icon: '🌍',
    description: 'International tests for study abroad',
    exams: [
      { id: 'ielts', name: 'IELTS', country: 'Global', description: 'English proficiency for non-native speakers' },
      { id: 'toefl', name: 'TOEFL', country: 'Global', description: 'English proficiency for US universities' },
      { id: 'gre', name: 'GRE', country: 'Global', description: 'Graduate Record Exam for Masters/PhD' },
      { id: 'gmat', name: 'GMAT', country: 'Global', description: 'MBA & business program admissions' },
      { id: 'sat', name: 'SAT', country: 'Global', description: 'US undergraduate admissions' },
      { id: 'act', name: 'ACT', country: 'Global', description: 'US college admissions test' },
      { id: 'duolingo', name: 'Duolingo English Test', country: 'Global', description: 'Online English proficiency' },
      { id: 'pte', name: 'PTE Academic', country: 'Global', description: 'Pearson English test for study abroad' },
    ]
  },
  {
    id: 'university-entrance',
    name: 'University Entrance',
    icon: '🎓',
    description: 'National university admission exams',
    exams: [
      { id: 'gaokao', name: 'Gaokao (高考)', country: 'CN', description: 'China National College Entrance Exam' },
      { id: 'suneung', name: 'Suneung (수능)', country: 'KR', description: 'Korea College Scholastic Ability Test' },
      { id: 'jee-main', name: 'JEE Main', country: 'IN', description: 'Joint Entrance Exam for NITs, IIITs' },
      { id: 'jee-advanced', name: 'JEE Advanced (IIT)', country: 'IN', description: 'IIT entrance examination' },
      { id: 'neet', name: 'NEET', country: 'IN', description: 'Medical college entrance (MBBS/BDS)' },
      { id: 'cuet', name: 'CUET', country: 'IN', description: 'Central Universities Entrance Test' },
      { id: 'hsc-bangladesh', name: 'HSC (Bangladesh)', country: 'BD', description: 'Higher Secondary Certificate' },
      { id: 'ssc-bangladesh', name: 'SSC (Bangladesh)', country: 'BD', description: 'Secondary School Certificate' },
      { id: 'cbse-12', name: 'CBSE Class 12', country: 'IN', description: 'Central Board Senior Secondary' },
      { id: 'cbse-10', name: 'CBSE Class 10', country: 'IN', description: 'Central Board Secondary' },
      { id: 'icse', name: 'ICSE/ISC', country: 'IN', description: 'Indian Certificate examinations' },
    ]
  },
  {
    id: 'civil-service',
    name: 'Civil Service & Government',
    icon: '🏛️',
    description: 'Government & civil service exams',
    exams: [
      { id: 'upsc-cse', name: 'UPSC CSE (IAS/IPS)', country: 'IN', description: 'Indian Administrative/Police Service' },
      { id: 'upsc-prelims', name: 'UPSC Prelims', country: 'IN', description: 'Civil Services Preliminary Exam' },
      { id: 'bcs-bangladesh', name: 'BCS (বিসিএস)', country: 'BD', description: 'Bangladesh Civil Service' },
      { id: 'ssc-cgl', name: 'SSC CGL', country: 'IN', description: 'Staff Selection Commission' },
      { id: 'ssc-chsl', name: 'SSC CHSL', country: 'IN', description: 'Combined Higher Secondary Level' },
      { id: 'bank-po', name: 'IBPS PO', country: 'IN', description: 'Bank Probationary Officer' },
      { id: 'bank-clerk', name: 'IBPS Clerk', country: 'IN', description: 'Bank Clerk examination' },
      { id: 'bank-job-bd', name: 'Bank Job (Bangladesh)', country: 'BD', description: 'Bangladesh bank recruitment' },
      { id: 'railway', name: 'Railway (RRB)', country: 'IN', description: 'Indian Railway recruitment' },
      { id: 'state-psc', name: 'State PSC', country: 'IN', description: 'State Public Service Commission' },
    ]
  },
  {
    id: 'google-certifications',
    name: 'Google Certifications',
    icon: '🔵',
    description: 'Google Career & Education certificates',
    exams: [
      // Google Career Certificates
      { id: 'google-data-analytics', name: 'Google Data Analytics', country: 'Global', description: 'Data analysis, visualization & AI tools' },
      { id: 'google-it-support', name: 'Google IT Support', country: 'Global', description: 'IT troubleshooting & networking' },
      { id: 'google-cybersecurity', name: 'Google Cybersecurity', country: 'Global', description: 'Security fundamentals & threat detection' },
      { id: 'google-project-management', name: 'Google Project Management', country: 'Global', description: 'Agile/Scrum & project planning' },
      { id: 'google-ux-design', name: 'Google UX Design', country: 'Global', description: 'User research & prototyping (Figma)' },
      { id: 'google-digital-marketing', name: 'Google Digital Marketing', country: 'Global', description: 'Digital marketing & e-commerce' },
      { id: 'google-ai-essentials', name: 'Google AI Essentials', country: 'Global', description: 'AI fundamentals & applications' },
      // Google Cloud Certifications
      { id: 'google-cloud-digital-leader', name: 'Google Cloud Digital Leader', country: 'Global', description: 'Cloud concepts & GCP basics' },
      { id: 'google-cloud-associate', name: 'Google Cloud Associate Engineer', country: 'Global', description: 'GCP infrastructure & deployment' },
      { id: 'google-cloud-professional', name: 'Google Cloud Professional Architect', country: 'Global', description: 'Advanced cloud architecture' },
      // Google Education Certifications  
      { id: 'google-educator-l1', name: 'Google Certified Educator Level 1', country: 'Global', description: 'Google Workspace for classroom' },
      { id: 'google-educator-l2', name: 'Google Certified Educator Level 2', country: 'Global', description: 'Advanced education technology' },
      { id: 'google-gemini-educator', name: 'Gemini Certified Educator', country: 'Global', description: 'AI mastery for lesson plans' },
      { id: 'google-gemini-student', name: 'Gemini Certified Student', country: 'Global', description: 'AI skills for university students' },
      { id: 'google-certified-trainer', name: 'Google Certified Trainer', country: 'Global', description: 'Train educators on Google tools' },
      { id: 'google-certified-coach', name: 'Google Certified Coach', country: 'Global', description: 'One-to-one coaching support' },
      { id: 'google-certified-innovator', name: 'Google Certified Innovator', country: 'Global', description: 'Transform teaching with technology' },
    ]
  },
  {
    id: 'professional',
    name: 'Professional Certifications',
    icon: '💼',
    description: 'Career & professional certifications',
    exams: [
      { id: 'cfa', name: 'CFA', country: 'Global', description: 'Chartered Financial Analyst' },
      { id: 'cpa', name: 'CPA', country: 'Global', description: 'Certified Public Accountant' },
      { id: 'acca', name: 'ACCA', country: 'Global', description: 'Association of Chartered Accountants' },
      { id: 'frm', name: 'FRM', country: 'Global', description: 'Financial Risk Manager' },
      { id: 'usmle', name: 'USMLE', country: 'US', description: 'US Medical Licensing Examination' },
      { id: 'plab', name: 'PLAB', country: 'UK', description: 'UK Medical Licensing Assessment' },
      { id: 'bar-exam', name: 'Bar Exam', country: 'Various', description: 'Legal profession licensing' },
      { id: 'ca', name: 'CA (Chartered Accountant)', country: 'IN', description: 'Indian Chartered Accountancy' },
    ]
  },
  {
    id: 'tech-certifications',
    name: 'Tech & IT Certifications',
    icon: '💻',
    description: 'Technology & IT certifications',
    exams: [
      { id: 'aws-saa', name: 'AWS Solutions Architect', country: 'Global', description: 'Amazon Web Services certification' },
      { id: 'aws-dev', name: 'AWS Developer', country: 'Global', description: 'AWS Developer Associate' },
      { id: 'azure', name: 'Microsoft Azure', country: 'Global', description: 'Azure cloud certifications' },
      { id: 'pmp', name: 'PMP', country: 'Global', description: 'Project Management Professional' },
      { id: 'cissp', name: 'CISSP', country: 'Global', description: 'Cybersecurity certification' },
      { id: 'comptia', name: 'CompTIA A+/Network+', country: 'Global', description: 'IT fundamentals certifications' },
      { id: 'ccna', name: 'Cisco CCNA', country: 'Global', description: 'Networking certification' },
      { id: 'scrum-master', name: 'Certified Scrum Master', country: 'Global', description: 'Agile Scrum certification' },
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
  { id: 'quick', name: 'Quick Practice', icon: Play, questions: 10, time: null, description: '10 questions, no time limit' },
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
  const { checkAndDeduct, refund, complete } = useCredits()

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

  // Search for exam information (HYBRID: Web + AI)
  const searchExamInfo = async () => {
    const examName = customExamName || EXAM_CATEGORIES.flatMap(c => c.exams).find(e => e.id === selectedExam)?.name
    if (!examName) return

    setSearchingExam(true)
    try {
      const response = await fetch('/api/exam-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'search-exam',
          examName,
          examId: selectedExam || null // Pass exam ID for official source lookup
        })
      })
      
      const data = await response.json()
      if (data.success && data.examInfo) {
        setExamInfo(data.examInfo)
        
        // Show appropriate toast based on source
        const officialCount = data.examInfo.sources?.officialSources?.length || 0
        const webCount = data.examInfo.sources?.webSearchSources?.length || 0
        
        if (officialCount > 0) {
          toast({
            title: '✅ Official Sources Found!',
            description: `Found ${officialCount} official + ${webCount} web sources for ${examName}`
          })
        } else if (webCount > 0) {
          toast({
            title: '🔍 Web Search Complete',
            description: `Found ${webCount} web sources for ${examName}`
          })
        } else {
          toast({
            title: '🤖 AI Knowledge Used',
            description: `Using AI knowledge base for ${examName}`
          })
        }
      } else {
        toast({
          title: 'Search Complete',
          description: 'Proceeding with AI-generated exam format'
        })
      }
    } catch (error) {
      console.error('Exam search error:', error)
      toast({
        title: 'Search Error',
        description: 'Proceeding with AI knowledge base',
        variant: 'destructive'
      })
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
          examId: selectedExam || null,
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
          description: `${data.questions.length} AI-generated practice questions ready`
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
        await complete(creditResult.transactionId)
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                      <div className="font-medium text-sm leading-tight">{cat.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Selection or Custom Input */}
              {examCategory && examCategory !== 'custom' && (
                <div className="space-y-3">
                  <Label>Select Exam ({getAvailableExams().length} available)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getAvailableExams().map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => {
                          setSelectedExam(exam.id)
                          setCustomExamName('')
                          setExamInfo(null)
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedExam === exam.id 
                            ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm">{exam.name}</div>
                          <Badge variant="secondary" className="text-xs shrink-0">{exam.country}</Badge>
                        </div>
                        {exam.description && (
                          <div className="text-xs text-muted-foreground mt-1">{exam.description}</div>
                        )}
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
                    We'll search official websites and the web to find the exam pattern, question types, and marking scheme
                  </p>
                </div>
              )}

              {/* Exam Info Preview - Enhanced with Source Attribution */}
              {examInfo && (
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-800 dark:text-green-200 text-base flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Exam Pattern Found
                      </CardTitle>
                      {/* Data Freshness Badge */}
                      {examInfo.sources && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            examInfo.sources.officialSources?.length > 0 
                              ? 'border-green-500 text-green-700' 
                              : examInfo.sources.webSearchSources?.length > 0
                                ? 'border-blue-500 text-blue-700'
                                : 'border-yellow-500 text-yellow-700'
                          }`}
                        >
                          {examInfo.sources.officialSources?.length > 0 
                            ? `✓ ${examInfo.sources.officialSources.length} Official Sources` 
                            : examInfo.sources.webSearchSources?.length > 0
                              ? `🔍 ${examInfo.sources.webSearchSources.length} Web Sources`
                              : '🤖 AI Knowledge'
                          }
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-2 text-green-700 dark:text-green-300">
                      {examInfo.examName && examInfo.examName !== (customExamName || selectedExamInfo?.name) && (
                        <p><strong>Full Name:</strong> {examInfo.examName}</p>
                      )}
                      {examInfo.authority && <p><strong>Authority:</strong> {examInfo.authority}</p>}
                      {examInfo.pattern && <p><strong>Pattern:</strong> {typeof examInfo.pattern === 'string' ? examInfo.pattern : JSON.stringify(examInfo.pattern)}</p>}
                      {examInfo.sections && <p><strong>Sections:</strong> {Array.isArray(examInfo.sections) ? examInfo.sections.join(', ') : examInfo.sections}</p>}
                      {examInfo.questionTypes && <p><strong>Question Types:</strong> {Array.isArray(examInfo.questionTypes) ? examInfo.questionTypes.join(', ') : examInfo.questionTypes}</p>}
                      {examInfo.duration && <p><strong>Duration:</strong> {typeof examInfo.duration === 'string' ? examInfo.duration : JSON.stringify(examInfo.duration)}</p>}
                      {examInfo.totalMarks && <p><strong>Total Marks:</strong> {typeof examInfo.totalMarks === 'string' ? examInfo.totalMarks : JSON.stringify(examInfo.totalMarks)}</p>}
                      {examInfo.recentChanges && (
                        <p className="text-blue-700 dark:text-blue-300">
                          <strong>Recent Updates:</strong> {typeof examInfo.recentChanges === 'string' ? examInfo.recentChanges : JSON.stringify(examInfo.recentChanges)}
                        </p>
                      )}
                    </div>
                    
                    {/* Source Links */}
                    {examInfo.sources && (examInfo.sources.officialSources?.length > 0 || examInfo.sources.webSearchSources?.length > 0) && (
                      <div className="pt-3 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">Sources Referenced:</p>
                        <div className="flex flex-wrap gap-2">
                          {examInfo.sources.officialSources?.map((source, idx) => (
                            <a 
                              key={`official-${idx}`}
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded hover:bg-green-200 transition-colors"
                            >
                              ✓ {source.authority || 'Official'}
                            </a>
                          ))}
                          {examInfo.sources.webSearchSources?.slice(0, 3).map((source, idx) => (
                            <a 
                              key={`web-${idx}`}
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded hover:bg-blue-200 transition-colors truncate max-w-32"
                              title={source.title}
                            >
                              🔗 {source.title?.substring(0, 20) || 'Web'}...
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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

            <div className="flex gap-2 items-center">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CreditCostBadge toolId="exam-prep" />
              <Button className="flex-1" onClick={generateQuestions} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching Web & Generating...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate Practice Questions</>
                )}
              </Button>
            </div>
            
            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Questions are AI-generated based on official exam patterns from web search. 
                They are for practice purposes only and may not represent actual exam questions.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Practice Session */}
      {step === 3 && questions.length > 0 && (
        <div className="space-y-4">
          {/* AI Disclaimer Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5">
              <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">AI-Generated Practice Questions</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Based on {examInfo?.sources?.officialSources?.length > 0 ? 'official sources & ' : ''}web search • For practice only
              </p>
            </div>
            {examInfo?.authority && (
              <Badge variant="outline" className="text-xs border-blue-300">
                {examInfo.authority} Pattern
              </Badge>
            )}
          </div>
          
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
