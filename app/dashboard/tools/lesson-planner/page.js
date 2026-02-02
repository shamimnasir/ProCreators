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
  FileText, Download, Sparkles, Loader2, Clock,
  ArrowLeft, ArrowRight, Plus, Trash2, Edit3, CheckCircle,
  ChevronDown, ChevronUp, RefreshCw, BookOpen, Brain,
  GraduationCap, Target, Users, Lightbulb, ClipboardList,
  PenTool, PlayCircle, CheckSquare, Palette
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Grade Levels
const GRADE_LEVELS = [
  { id: 'pre-k', name: 'Pre-K' },
  { id: 'kindergarten', name: 'Kindergarten' },
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
  { id: 'college', name: 'College/University' },
  { id: 'adult', name: 'Adult Education' }
]

// Subjects
const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: '🔢' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'english', name: 'English/Language Arts', icon: '📖' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'geography', name: 'Geography', icon: '🌍' },
  { id: 'biology', name: 'Biology', icon: '🧬' },
  { id: 'chemistry', name: 'Chemistry', icon: '⚗️' },
  { id: 'physics', name: 'Physics', icon: '⚛️' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'pe', name: 'Physical Education', icon: '🏃' },
  { id: 'computer-science', name: 'Computer Science', icon: '💻' },
  { id: 'social-studies', name: 'Social Studies', icon: '👥' },
  { id: 'foreign-language', name: 'Foreign Language', icon: '🗣️' },
  { id: 'economics', name: 'Economics', icon: '📊' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'other', name: 'Other', icon: '📚' }
]

// Lesson Duration Options
const DURATION_OPTIONS = [
  { id: '30', name: '30 minutes' },
  { id: '45', name: '45 minutes' },
  { id: '50', name: '50 minutes' },
  { id: '60', name: '1 hour' },
  { id: '90', name: '1.5 hours' },
  { id: '120', name: '2 hours' },
  { id: 'custom', name: 'Custom' }
]

// Teaching Strategies
const TEACHING_STRATEGIES = [
  { id: 'direct-instruction', name: 'Direct Instruction', description: 'Teacher-led explicit teaching' },
  { id: 'collaborative', name: 'Collaborative Learning', description: 'Group work and peer learning' },
  { id: 'inquiry-based', name: 'Inquiry-Based', description: 'Student-led exploration' },
  { id: 'project-based', name: 'Project-Based', description: 'Hands-on projects' },
  { id: 'flipped', name: 'Flipped Classroom', description: 'Pre-class content, in-class practice' },
  { id: 'differentiated', name: 'Differentiated', description: 'Tailored to student needs' },
  { id: 'game-based', name: 'Game-Based', description: 'Learning through games' },
  { id: 'discussion', name: 'Discussion-Based', description: 'Socratic method and dialogue' }
]

// Assessment Types
const ASSESSMENT_TYPES = [
  { id: 'formative', name: 'Formative', description: 'During instruction checks' },
  { id: 'summative', name: 'Summative', description: 'End of lesson evaluation' },
  { id: 'peer', name: 'Peer Assessment', description: 'Student-to-student feedback' },
  { id: 'self', name: 'Self-Assessment', description: 'Student reflection' },
  { id: 'observation', name: 'Observation', description: 'Teacher observation' },
  { id: 'quiz', name: 'Quiz/Test', description: 'Written assessment' },
  { id: 'project', name: 'Project/Portfolio', description: 'Work collection' },
  { id: 'exit-ticket', name: 'Exit Ticket', description: 'Quick end-of-class check' }
]

// Standards Options
const STANDARDS = [
  { id: 'common-core', name: 'Common Core' },
  { id: 'ngss', name: 'NGSS (Science)' },
  { id: 'state', name: 'State Standards' },
  { id: 'iste', name: 'ISTE (Technology)' },
  { id: 'custom', name: 'Custom Standards' },
  { id: 'none', name: 'No Specific Standards' }
]

// Color presets
const COLOR_PRESETS = [
  { id: 'blue', name: 'Professional Blue', primary: '#1e40af', secondary: '#3b82f6' },
  { id: 'green', name: 'Fresh Green', primary: '#166534', secondary: '#22c55e' },
  { id: 'purple', name: 'Creative Purple', primary: '#6b21a8', secondary: '#a855f7' },
  { id: 'teal', name: 'Calm Teal', primary: '#0f766e', secondary: '#14b8a6' },
  { id: 'orange', name: 'Energetic Orange', primary: '#c2410c', secondary: '#f97316' },
  { id: 'pink', name: 'Soft Pink', primary: '#be185d', secondary: '#ec4899' }
]

// Paper sizes
const PAPER_SIZES = [
  { id: '8.5x11', name: '8.5" × 11"', description: 'US Letter' },
  { id: 'a4', name: 'A4', description: 'International' }
]

export default function LessonPlannerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Step 1: Basic Info
  const [lessonTitle, setLessonTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [duration, setDuration] = useState('50')
  const [customDuration, setCustomDuration] = useState('')
  const [unitName, setUnitName] = useState('')
  const [lessonNumber, setLessonNumber] = useState('')

  // Step 2: Content & Objectives
  const [topic, setTopic] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [objectives, setObjectives] = useState([])
  const [standardsType, setStandardsType] = useState('none')
  const [customStandards, setCustomStandards] = useState('')
  const [priorKnowledge, setPriorKnowledge] = useState('')
  const [vocabularyTerms, setVocabularyTerms] = useState('')

  // Step 3: Teaching & Activities
  const [selectedStrategies, setSelectedStrategies] = useState(['direct-instruction'])
  const [selectedAssessments, setSelectedAssessments] = useState(['formative', 'exit-ticket'])
  const [includeDifferentiation, setIncludeDifferentiation] = useState(true)
  const [includeAccommodations, setIncludeAccommodations] = useState(true)
  const [includeExtensions, setIncludeExtensions] = useState(true)
  const [includeMaterials, setIncludeMaterials] = useState(true)
  const [includeHomework, setIncludeHomework] = useState(true)

  // Step 4: Design & Export
  const [paperSize, setPaperSize] = useState('8.5x11')
  const [selectedPreset, setSelectedPreset] = useState('blue')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#1e40af')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#3b82f6')

  // Generated content
  const [lessonPlan, setLessonPlan] = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)

  // Result
  const [result, setResult] = useState(null)

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: lessonTitle || `${topic || subject} Lesson Plan`,
    lessonTitle,
    subject,
    customSubject,
    gradeLevel,
    duration,
    customDuration,
    unitName,
    lessonNumber,
    topic,
    customPrompt,
    objectives,
    standardsType,
    customStandards,
    priorKnowledge,
    vocabularyTerms,
    selectedStrategies,
    selectedAssessments,
    includeDifferentiation,
    includeAccommodations,
    includeExtensions,
    includeMaterials,
    includeHomework,
    paperSize,
    selectedPreset,
    useCustomColor,
    customPrimaryColor,
    customSecondaryColor,
    lessonPlan,
    step
  }), [lessonTitle, subject, customSubject, gradeLevel, duration, customDuration, unitName, lessonNumber, topic, customPrompt, objectives, standardsType, customStandards, priorKnowledge, vocabularyTerms, selectedStrategies, selectedAssessments, includeDifferentiation, includeAccommodations, includeExtensions, includeMaterials, includeHomework, paperSize, selectedPreset, useCustomColor, customPrimaryColor, customSecondaryColor, lessonPlan, step])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.lessonTitle) setLessonTitle(data.lessonTitle)
    if (data.subject) setSubject(data.subject)
    if (data.customSubject) setCustomSubject(data.customSubject)
    if (data.gradeLevel) setGradeLevel(data.gradeLevel)
    if (data.duration) setDuration(data.duration)
    if (data.customDuration) setCustomDuration(data.customDuration)
    if (data.unitName) setUnitName(data.unitName)
    if (data.lessonNumber) setLessonNumber(data.lessonNumber)
    if (data.topic) setTopic(data.topic)
    if (data.customPrompt) setCustomPrompt(data.customPrompt)
    if (data.objectives) setObjectives(data.objectives)
    if (data.standardsType) setStandardsType(data.standardsType)
    if (data.customStandards) setCustomStandards(data.customStandards)
    if (data.priorKnowledge) setPriorKnowledge(data.priorKnowledge)
    if (data.vocabularyTerms) setVocabularyTerms(data.vocabularyTerms)
    if (data.selectedStrategies) setSelectedStrategies(data.selectedStrategies)
    if (data.selectedAssessments) setSelectedAssessments(data.selectedAssessments)
    if (typeof data.includeDifferentiation === 'boolean') setIncludeDifferentiation(data.includeDifferentiation)
    if (typeof data.includeAccommodations === 'boolean') setIncludeAccommodations(data.includeAccommodations)
    if (typeof data.includeExtensions === 'boolean') setIncludeExtensions(data.includeExtensions)
    if (typeof data.includeMaterials === 'boolean') setIncludeMaterials(data.includeMaterials)
    if (typeof data.includeHomework === 'boolean') setIncludeHomework(data.includeHomework)
    if (data.paperSize) setPaperSize(data.paperSize)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (typeof data.useCustomColor === 'boolean') setUseCustomColor(data.useCustomColor)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.lessonPlan) setLessonPlan(data.lessonPlan)
    if (data.step) setStep(data.step)
  }

  // Toggle strategy
  const toggleStrategy = (strategyId) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(s => s !== strategyId)
        : [...prev, strategyId]
    )
  }

  // Toggle assessment
  const toggleAssessment = (assessmentId) => {
    setSelectedAssessments(prev => 
      prev.includes(assessmentId) 
        ? prev.filter(a => a !== assessmentId)
        : [...prev, assessmentId]
    )
  }

  // Generate lesson plan
  const generateLessonPlan = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-content',
          lessonTitle,
          subject: subject === 'other' ? customSubject : SUBJECTS.find(s => s.id === subject)?.name,
          gradeLevel: GRADE_LEVELS.find(g => g.id === gradeLevel)?.name,
          duration: duration === 'custom' ? customDuration : DURATION_OPTIONS.find(d => d.id === duration)?.name,
          unitName,
          lessonNumber,
          topic,
          customPrompt,
          standardsType,
          customStandards,
          priorKnowledge,
          vocabularyTerms,
          strategies: selectedStrategies.map(s => TEACHING_STRATEGIES.find(ts => ts.id === s)?.name),
          assessments: selectedAssessments.map(a => ASSESSMENT_TYPES.find(at => at.id === a)?.name),
          includeDifferentiation,
          includeAccommodations,
          includeExtensions,
          includeMaterials,
          includeHomework
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setLessonPlan(data.lessonPlan)
        setObjectives(data.lessonPlan.objectives || [])
        setStep(4)
        await complete(creditResult.transactionId)
        toast({
          title: "Lesson Plan Generated!",
          description: "Review and customize your lesson plan.",
        })
      } else {
        throw new Error(data.error || 'Failed to generate lesson plan')
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
    setLoading(true)
    try {
      const colors = useCustomColor 
        ? { primary: customPrimaryColor, secondary: customSecondaryColor }
        : COLOR_PRESETS.find(p => p.id === selectedPreset)

      const response = await fetch('/api/lesson-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-pdf',
          lessonPlan,
          lessonTitle: lessonTitle || lessonPlan?.title || `${topic} Lesson Plan`,
          subject: subject === 'other' ? customSubject : SUBJECTS.find(s => s.id === subject)?.name,
          gradeLevel: GRADE_LEVELS.find(g => g.id === gradeLevel)?.name,
          duration: duration === 'custom' ? customDuration : DURATION_OPTIONS.find(d => d.id === duration)?.name,
          paperSize,
          colors
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        setStep(5)
        toast({
          title: "PDF Generated!",
          description: "Your lesson plan PDF is ready for download.",
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

  // Update objective
  const updateObjective = (index, value) => {
    const newObjectives = [...objectives]
    newObjectives[index] = value
    setObjectives(newObjectives)
    if (lessonPlan) {
      setLessonPlan({ ...lessonPlan, objectives: newObjectives })
    }
  }

  // Add objective
  const addObjective = () => {
    setObjectives([...objectives, ''])
  }

  // Remove objective
  const removeObjective = (index) => {
    const newObjectives = objectives.filter((_, i) => i !== index)
    setObjectives(newObjectives)
    if (lessonPlan) {
      setLessonPlan({ ...lessonPlan, objectives: newObjectives })
    }
  }

  // Update section content
  const updateSectionContent = (sectionKey, value) => {
    if (lessonPlan) {
      setLessonPlan({ ...lessonPlan, [sectionKey]: value })
    }
  }

  const canProceedStep1 = subject && gradeLevel && duration
  const canProceedStep2 = topic || customPrompt
  const canProceedStep3 = selectedStrategies.length > 0 && selectedAssessments.length > 0

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
              Lesson Plan Generator
            </h1>
            <p className="text-muted-foreground">Create comprehensive AI-powered lesson plans</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="lesson-planner"
          getCurrentData={getCurrentData}
          onLoadDraft={loadDraftData}
        />
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { num: 1, label: 'Basics', icon: BookOpen },
          { num: 2, label: 'Content', icon: Target },
          { num: 3, label: 'Activities', icon: PlayCircle },
          { num: 4, label: 'Review', icon: Edit3 },
          { num: 5, label: 'Download', icon: Download }
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
            {i < 4 && <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Set up the foundation of your lesson plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lesson Title */}
            <div className="space-y-2">
              <Label>Lesson Title (Optional)</Label>
              <Input
                placeholder="e.g., Introduction to Fractions"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate based on topic</p>
            </div>

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label>Subject *</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {SUBJECTS.map((subj) => (
                  <div
                    key={subj.id}
                    onClick={() => setSubject(subj.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all hover:border-primary/50 ${
                      subject === subj.id ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                  >
                    <div className="text-2xl mb-1">{subj.icon}</div>
                    <div className="text-xs font-medium truncate">{subj.name}</div>
                  </div>
                ))}
              </div>
              {subject === 'other' && (
                <Input
                  placeholder="Enter custom subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>Grade Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Lesson Duration *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((dur) => (
                    <SelectItem key={dur.id} value={dur.id}>
                      {dur.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {duration === 'custom' && (
                <Input
                  placeholder="e.g., 75 minutes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Unit Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Name (Optional)</Label>
                <Input
                  placeholder="e.g., Fractions and Decimals"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lesson # in Unit (Optional)</Label>
                <Input
                  placeholder="e.g., 3 of 10"
                  value={lessonNumber}
                  onChange={(e) => setLessonNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Next: Content <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Content & Objectives */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content & Objectives
            </CardTitle>
            <CardDescription>Define what students will learn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label>Topic/Concept *</Label>
              <Input
                placeholder="e.g., Adding fractions with unlike denominators"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
              <Label>Additional Instructions (Optional)</Label>
              <Textarea
                placeholder="Add any specific requirements, focus areas, or context for the lesson..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Include special considerations, real-world examples to use, or specific skills to emphasize
              </p>
            </div>

            {/* Standards */}
            <div className="space-y-2">
              <Label>Standards Alignment</Label>
              <Select value={standardsType} onValueChange={setStandardsType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select standards type" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARDS.map((std) => (
                    <SelectItem key={std.id} value={std.id}>
                      {std.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {standardsType === 'custom' && (
                <Textarea
                  placeholder="Enter specific standards (e.g., CCSS.MATH.CONTENT.5.NF.A.1)"
                  value={customStandards}
                  onChange={(e) => setCustomStandards(e.target.value)}
                  className="mt-2"
                  rows={2}
                />
              )}
            </div>

            {/* Prior Knowledge */}
            <div className="space-y-2">
              <Label>Prior Knowledge Required (Optional)</Label>
              <Textarea
                placeholder="What should students already know before this lesson?"
                value={priorKnowledge}
                onChange={(e) => setPriorKnowledge(e.target.value)}
                rows={2}
              />
            </div>

            {/* Vocabulary */}
            <div className="space-y-2">
              <Label>Key Vocabulary Terms (Optional)</Label>
              <Textarea
                placeholder="List important terms to teach (separate with commas)"
                value={vocabularyTerms}
                onChange={(e) => setVocabularyTerms(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Next: Activities <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Teaching Strategies & Activities */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Teaching Strategies & Assessment
            </CardTitle>
            <CardDescription>Choose how to deliver and assess the lesson</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Teaching Strategies */}
            <div className="space-y-3">
              <Label>Teaching Strategies (Select at least one)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEACHING_STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => toggleStrategy(strategy.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStrategies.includes(strategy.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-xs text-muted-foreground">{strategy.description}</div>
                      </div>
                      {selectedStrategies.includes(strategy.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment Types */}
            <div className="space-y-3">
              <Label>Assessment Methods (Select at least one)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ASSESSMENT_TYPES.map((assessment) => (
                  <div
                    key={assessment.id}
                    onClick={() => toggleAssessment(assessment.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      selectedAssessments.includes(assessment.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{assessment.name}</div>
                    <div className="text-xs text-muted-foreground">{assessment.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <Label>Include in Lesson Plan</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Differentiation</div>
                    <div className="text-xs text-muted-foreground">Activities for different learning levels</div>
                  </div>
                  <Switch checked={includeDifferentiation} onCheckedChange={setIncludeDifferentiation} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Accommodations</div>
                    <div className="text-xs text-muted-foreground">Support for special needs students</div>
                  </div>
                  <Switch checked={includeAccommodations} onCheckedChange={setIncludeAccommodations} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Extensions</div>
                    <div className="text-xs text-muted-foreground">Enrichment for advanced learners</div>
                  </div>
                  <Switch checked={includeExtensions} onCheckedChange={setIncludeExtensions} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Materials List</div>
                    <div className="text-xs text-muted-foreground">Required resources and supplies</div>
                  </div>
                  <Switch checked={includeMaterials} onCheckedChange={setIncludeMaterials} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Homework/Follow-up</div>
                    <div className="text-xs text-muted-foreground">Practice activities for home</div>
                  </div>
                  <Switch checked={includeHomework} onCheckedChange={setIncludeHomework} />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={generateLessonPlan} disabled={!canProceedStep3 || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Edit */}
      {step === 4 && lessonPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Review & Edit Lesson Plan
              </CardTitle>
              <CardDescription>Customize your AI-generated lesson plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Lesson Title</Label>
                <Input
                  value={lessonPlan.title || lessonTitle}
                  onChange={(e) => updateSectionContent('title', e.target.value)}
                />
              </div>

              {/* Objectives */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Learning Objectives</Label>
                  <Button variant="outline" size="sm" onClick={addObjective}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {objectives.map((obj, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={obj}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeObjective(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Expandable Sections */}
              {[
                { key: 'materials', label: 'Materials Needed', icon: ClipboardList },
                { key: 'introduction', label: 'Introduction/Hook', icon: Lightbulb },
                { key: 'instruction', label: 'Direct Instruction', icon: BookOpen },
                { key: 'guidedPractice', label: 'Guided Practice', icon: Users },
                { key: 'independentPractice', label: 'Independent Practice', icon: PenTool },
                { key: 'closure', label: 'Closure', icon: CheckSquare },
                { key: 'assessment', label: 'Assessment', icon: Target },
                { key: 'differentiation', label: 'Differentiation', icon: Users },
                { key: 'accommodations', label: 'Accommodations', icon: Users },
                { key: 'extensions', label: 'Extensions', icon: Sparkles },
                { key: 'homework', label: 'Homework/Follow-up', icon: FileText },
                { key: 'reflection', label: 'Teacher Reflection Notes', icon: Brain }
              ].filter(section => lessonPlan[section.key]).map((section) => (
                <div key={section.key} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{section.label}</span>
                    </div>
                    {expandedSection === section.key ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                  {expandedSection === section.key && (
                    <div className="p-4 pt-0">
                      <Textarea
                        value={lessonPlan[section.key] || ''}
                        onChange={(e) => updateSectionContent(section.key, e.target.value)}
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              ))}
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
              {/* Paper Size */}
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <div className="flex gap-3">
                  {PAPER_SIZES.map((size) => (
                    <div
                      key={size.id}
                      onClick={() => setPaperSize(size.id)}
                      className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        paperSize === size.id ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="text-xs text-muted-foreground">{size.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id)
                        setUseCustomColor(false)
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPreset === preset.id && !useCustomColor
                          ? 'border-primary'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="w-full h-6 rounded mb-2"
                        style={{ background: `linear-gradient(to right, ${preset.primary}, ${preset.secondary})` }}
                      />
                      <div className="text-xs font-medium truncate">{preset.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="flex items-center gap-4">
                <Switch checked={useCustomColor} onCheckedChange={setUseCustomColor} />
                <Label>Use Custom Colors</Label>
              </div>
              {useCustomColor && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customPrimaryColor}
                        onChange={(e) => setCustomPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={customPrimaryColor}
                        onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customSecondaryColor}
                        onChange={(e) => setCustomSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={customSecondaryColor}
                        onChange={(e) => setCustomSecondaryColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={generatePDF} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Download */}
      {step === 5 && result && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Your Lesson Plan is Ready!</CardTitle>
            <CardDescription>Download your professionally formatted lesson plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">{lessonPlan?.title || lessonTitle}</div>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  {SUBJECTS.find(s => s.id === subject)?.name || customSubject}
                </Badge>
                <Badge variant="secondary">
                  {GRADE_LEVELS.find(g => g.id === gradeLevel)?.name}
                </Badge>
                <Badge variant="secondary">
                  {duration === 'custom' ? customDuration : DURATION_OPTIONS.find(d => d.id === duration)?.name}
                </Badge>
              </div>
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
                  setLessonPlan(null)
                  setResult(null)
                  setLessonTitle('')
                  setTopic('')
                  setObjectives([])
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
