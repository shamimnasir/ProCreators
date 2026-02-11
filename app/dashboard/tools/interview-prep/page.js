'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Mic, Sparkles, Loader2, CheckCircle, XCircle, AlertTriangle,
  Play, Pause, SkipForward, RotateCcw, Target, TrendingUp, 
  Lightbulb, Clock, Award, MessageSquare, ChevronRight, ChevronDown,
  ThumbsUp, ThumbsDown, Copy, Check, HelpCircle, Briefcase,
  Star, BookOpen, Volume2, Timer, ArrowRight, RefreshCw
, Wand2 , Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'

// Question category colors
const CATEGORY_COLORS = {
  'Opening': 'bg-blue-100 text-blue-800 border-blue-200',
  'Behavioral': 'bg-purple-100 text-purple-800 border-purple-200',
  'Situational': 'bg-orange-100 text-orange-800 border-orange-200',
  'Technical': 'bg-green-100 text-green-800 border-green-200',
  'Role-Specific': 'bg-green-100 text-green-800 border-green-200',
  'Culture Fit': 'bg-pink-100 text-pink-800 border-pink-200'
}

const DIFFICULTY_COLORS = {
  'Easy': 'bg-green-100 text-green-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'Hard': 'bg-red-100 text-red-700'
}

// Score display helper
function ScoreDisplay({ score, label, size = 'md' }) {
  const getColor = (s) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    return 'text-red-500'
  }
  
  return (
    <div className="text-center">
      <div className={`font-bold ${size === 'lg' ? 'text-4xl' : 'text-2xl'} ${getColor(score)}`}>
        {score}%
      </div>
      {label && <div className="text-xs text-gray-500">{label}</div>}
    </div>
  )
}

// STAR Method Guide Component
function STARGuide({ starPrompt }) {
  const [expanded, setExpanded] = useState(false)
  
  if (!starPrompt) return null
  
  return (
    <div className="bg-purple-50 rounded-lg p-4 mt-4">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-purple-800 flex items-center gap-2">
          <Star className="h-4 w-4" />
          STAR Method Guide
        </span>
        <ChevronDown className={`h-4 w-4 text-purple-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="bg-white p-2 rounded border-l-4 border-blue-400">
            <span className="font-semibold text-blue-700">S - Situation:</span>
            <p className="text-gray-600">{starPrompt.situation}</p>
          </div>
          <div className="bg-white p-2 rounded border-l-4 border-green-400">
            <span className="font-semibold text-green-700">T - Task:</span>
            <p className="text-gray-600">{starPrompt.task}</p>
          </div>
          <div className="bg-white p-2 rounded border-l-4 border-orange-400">
            <span className="font-semibold text-orange-700">A - Action:</span>
            <p className="text-gray-600">{starPrompt.action}</p>
          </div>
          <div className="bg-white p-2 rounded border-l-4 border-purple-400">
            <span className="font-semibold text-purple-700">R - Result:</span>
            <p className="text-gray-600">{starPrompt.result}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Feedback Display Component
function FeedbackDisplay({ feedback, onClose }) {
  const [copied, setCopied] = useState(false)
  
  if (!feedback) return null
  
  const copyImproved = () => {
    navigator.clipboard.writeText(feedback.improvedAnswer || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Score</p>
              <div className="flex items-center gap-3">
                <ScoreDisplay score={feedback.overallScore} size="lg" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    {feedback.overallScore >= 80 ? 'Excellent!' : 
                     feedback.overallScore >= 60 ? 'Good, with room to improve' : 
                     'Needs more work'}
                  </p>
                </div>
              </div>
            </div>
            <Award className={`h-16 w-16 ${feedback.overallScore >= 80 ? 'text-green-500' : feedback.overallScore >= 60 ? 'text-yellow-500' : 'text-red-400'}`} />
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      {feedback.scoreBreakdown && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(feedback.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600 capitalize">{key}</span>
                  <Progress value={value} className="flex-1 h-2" />
                  <span className="w-10 text-sm font-medium">{value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STAR Analysis */}
      {feedback.starAnalysis && (
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Star className="h-5 w-5" />
              STAR Method Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(feedback.starAnalysis).map(([key, data]) => (
                <div key={key} className={`p-3 rounded-lg ${data.present ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {data.present ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-semibold capitalize">{key}</span>
                  </div>
                  <p className="text-xs text-gray-600">{data.feedback}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths?.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.improvements?.map((item, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{item.issue}</p>
                      <p className="text-gray-600 text-xs">{item.suggestion}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Improved Answer */}
      {feedback.improvedAnswer && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Improved Answer
              </span>
              <Button size="sm" variant="outline" onClick={copyImproved}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.improvedAnswer}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Takeaways */}
      {feedback.keyTakeaways && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {feedback.keyTakeaways.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <ChevronRight className="h-4 w-4 text-indigo-500 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={onClose}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Practice Another Answer
      </Button>
    </div>
  )
}

// Question Card Component
function QuestionCard({ question, index, isActive, onSelect, onAnswer }) {
  const [showTips, setShowTips] = useState(false)
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
      onClick={() => onSelect(index)}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center justify-center">
              {index + 1}
            </span>
            <Badge className={CATEGORY_COLORS[question.category] || 'bg-gray-100'}>
              {question.category}
            </Badge>
            <Badge className={DIFFICULTY_COLORS[question.difficulty] || 'bg-gray-100'}>
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Timer className="h-3 w-3" />
            {question.timeLimit || 2} min
          </div>
        </div>
        
        <p className="font-medium text-gray-900 mb-2">{question.question}</p>
        
        {question.tips && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTips(!showTips) }}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Lightbulb className="h-3 w-3" />
            {showTips ? 'Hide tip' : 'Show tip'}
          </button>
        )}
        
        {showTips && question.tips && (
          <p className="text-xs text-gray-600 mt-2 p-2 bg-yellow-50 rounded">{question.tips}</p>
        )}

        {question.starPrompt && <STARGuide starPrompt={question.starPrompt} />}
        
        {isActive && (
          <Button 
            className="w-full mt-4" 
            onClick={(e) => { e.stopPropagation(); onAnswer(question) }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Practice This Question
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Main Interview Prep Component
export default function InterviewPrepPage() {
  const [generating, setGenerating] = useState(false)
  const [gettingFeedback, setGettingFeedback] = useState(false)
  const [interviewData, setInterviewData] = useState(null)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [mode, setMode] = useState('setup') // setup, questions, practice, feedback
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  
  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [interviewType, setInterviewType] = useState('general')
  const [focusAreas, setFocusAreas] = useState('')

  // Timer state for practice mode
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isTimerRunning])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGenerate = async () => {
    if (!jobTitle) {
      toast({ title: 'Missing Information', description: 'Please enter the job title', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    
    try {
      const res = await fetch('/api/interview-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle, companyName, jobDescription, experienceLevel, interviewType, focusAreas
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setInterviewData(data.data)
        setMode('questions')
        
        // Auto-save to library
        try {
          const questionsList = data.data.questions?.map(q => q.question || q).join('\n\n') || ''
          await saveToLibrary({
            type: 'interview-prep',
            category: 'text',
            title: `Interview Prep: ${jobTitle}`,
            description: `Interview preparation questions for ${jobTitle}${company ? ` at ${company}` : ''}`,
            content: questionsList,
            metadata: {
              jobTitle,
              company,
              experienceLevel,
              interviewType,
              focusAreas,
              questionCount: data.data.questions?.length || 0,
              contentType: 'interview-prep'
            }
          })
          console.log('Interview prep auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save interview prep:', saveError)
        }
        
        toast({ title: '🎤 Questions Generated!', description: `${data.data.questions?.length || 0} questions ready` })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const startPractice = (question) => {
    setCurrentQuestion(question)
    setUserAnswer('')
    setFeedback(null)
    setTimeElapsed(0)
    setIsTimerRunning(true)
    setMode('practice')
  }

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({ title: 'Empty Answer', description: 'Please type your answer before submitting', variant: 'destructive' })
      return
    }
    
    setIsTimerRunning(false)
    setGettingFeedback(true)
    
    try {
      const res = await fetch('/api/interview-prep/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: userAnswer,
          jobTitle,
          category: currentQuestion.category
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setFeedback(data.data)
        setMode('feedback')
        await complete(creditResult.transactionId)
        toast({ title: '✅ Feedback Ready!' })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Failed to get feedback', description: err.message, variant: 'destructive' })
    } finally {
      setGettingFeedback(false)
    }
  }

  const resetToQuestions = () => {
    setCurrentQuestion(null)
    setUserAnswer('')
    setFeedback(null)
    setMode('questions')
  }

  const startOver = () => {
    setInterviewData(null)
    setMode('setup')
    setActiveQuestion(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mic className="h-8 w-8 text-green-500" />
            Interview Prep Coach
          </h1>
          <p className="text-muted-foreground mt-1">Practice with AI-generated questions & get instant feedback</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Zap className="h-3 w-3 mr-1" />STAR Method
        </Badge>
      </div>

      {/* Setup Mode */}
      {mode === 'setup' && (
        <>
          <Alert className="bg-green-50 border-green-200">
            <Target className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>How it works:</strong> Enter your target job details. We'll generate realistic interview questions, 
              help you practice with STAR method guidance, and give AI feedback on your answers.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">1</span>
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Job Title *</Label>
                  <Input 
                    placeholder="e.g., Software Engineer, Product Manager, Marketing Director" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Company Name (optional)</Label>
                  <Input 
                    placeholder="e.g., Google, Amazon, Microsoft" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Job Description (optional but recommended)</Label>
                  <Textarea 
                    placeholder="Paste the job description for more targeted questions..."
                    className="min-h-[120px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">2</span>
                  Interview Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead/Manager (10+ years)</SelectItem>
                      <SelectItem value="executive">Executive/Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interview Type</Label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General/Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="case">Case Study</SelectItem>
                      <SelectItem value="panel">Panel Interview</SelectItem>
                      <SelectItem value="phone">Phone Screen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Focus Areas (optional)</Label>
                  <Input 
                    placeholder="e.g., Leadership, Problem-solving, Technical skills" 
                    value={focusAreas}
                    onChange={(e) => setFocusAreas(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">


            <CreditCostBadge toolId="interview-prep" />


            <Button 
            size="lg" 
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg"
            onClick={handleGenerate}
            disabled={generating || !jobTitle}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Generating Questions...</>
            ) : (
              <><Wand2 className="mr-2 h-6 w-6" />Generate Interview Questions</>
            )}
          </Button>


          </div>

          {/* Quick Tips */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Interview Preparation Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-amber-900">Before the Interview:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Research the company thoroughly</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Review the job description</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Prepare 3-5 STAR stories</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Quantify your achievements</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-amber-900">During the Interview:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Use the STAR method</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Be specific with examples</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Ask thoughtful questions</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600" /> Show enthusiasm</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Questions Mode */}
      {mode === 'questions' && interviewData && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Interview Questions for {jobTitle}</h2>
              {companyName && <p className="text-gray-500">at {companyName}</p>}
            </div>
            <Button variant="outline" onClick={startOver}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Interview
            </Button>
          </div>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="questions">Questions ({interviewData.questions?.length || 0})</TabsTrigger>
              <TabsTrigger value="ask">Questions to Ask</TabsTrigger>
              <TabsTrigger value="tips">Prep Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {['All', 'Opening', 'Behavioral', 'Situational', 'Technical', 'Role-Specific'].map(cat => (
                  <Badge 
                    key={cat} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    {cat}
                  </Badge>
                ))}
              </div>

              {/* Questions List */}
              <div className="grid gap-4">
                {interviewData.questions?.map((q, i) => (
                  <QuestionCard 
                    key={i}
                    question={q}
                    index={i}
                    isActive={activeQuestion === i}
                    onSelect={setActiveQuestion}
                    onAnswer={startPractice}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ask" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Always prepare 2-3 thoughtful questions to ask your interviewer. It shows engagement and helps you evaluate if the role is right for you.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                {interviewData.questionsToAsk?.map((q, i) => (
                  <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{q.question}</p>
                          <p className="text-sm text-gray-500 mt-1">{q.purpose}</p>
                        </div>
                        <Badge variant="outline">{q.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              {interviewData.prepTips?.map((tip, i) => (
                <Card key={i} className={tip.priority === 'High' ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${tip.priority === 'High' ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <Lightbulb className={`h-5 w-5 ${tip.priority === 'High' ? 'text-red-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{tip.category}</Badge>
                          {tip.priority === 'High' && <Badge className="bg-red-100 text-red-700">High Priority</Badge>}
                        </div>
                        <p className="text-gray-800">{tip.tip}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Practice Mode */}
      {mode === 'practice' && currentQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={resetToQuestions}>
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Questions
            </Button>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${timeElapsed > (currentQuestion.timeLimit || 2) * 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeElapsed)}</span>
                <span className="text-xs text-gray-500">/ {currentQuestion.timeLimit || 2}:00</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <Badge className={CATEGORY_COLORS[currentQuestion.category] || 'bg-gray-100'}>
                  {currentQuestion.category}
                </Badge>
                <Badge className={DIFFICULTY_COLORS[currentQuestion.difficulty] || 'bg-gray-100'}>
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.question}</h2>
              
              {currentQuestion.tips && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{currentQuestion.tips}</p>
                </div>
              )}

              {currentQuestion.starPrompt && <STARGuide starPrompt={currentQuestion.starPrompt} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Your Answer
              </CardTitle>
              <CardDescription>
                Type your answer as you would speak it. Aim for 1-2 minutes of speaking time (150-300 words).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Start typing your answer... Use the STAR method for behavioral questions:

S - Situation: Describe the context
T - Task: Explain your responsibility  
A - Action: Detail what you did
R - Result: Share the outcome (use numbers!)"
                className="min-h-[250px] text-base"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {userAnswer.split(/\s+/).filter(Boolean).length} words
                  {userAnswer.split(/\s+/).filter(Boolean).length < 50 && ' (aim for 150-300)'}
                </p>
                <Button 
                  onClick={submitAnswer}
                  disabled={gettingFeedback || !userAnswer.trim()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {gettingFeedback ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting Feedback...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" />Submit for Feedback</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Mode */}
      {mode === 'feedback' && feedback && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">AI Feedback on Your Answer</h2>
            <Button variant="outline" onClick={resetToQuestions}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Next Question
            </Button>
          </div>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500 mb-2">Question:</p>
              <p className="font-medium">{currentQuestion?.question}</p>
            </CardContent>
          </Card>

          <FeedbackDisplay feedback={feedback} onClose={resetToQuestions} />
        </div>
      )}
    </div>
  )
}
