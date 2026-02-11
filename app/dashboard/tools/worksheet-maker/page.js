'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Download, ArrowLeft, ArrowRight,
  FileText, Palette, CheckCircle, Edit3, Plus, Trash2,
  GraduationCap, ChevronDown, ChevronUp, BookOpen, Globe,
  Pipette
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

// Import shared components
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: '🔢' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'english', name: 'English/Language Arts', icon: '📖' },
  { id: 'history', name: 'History/Social Studies', icon: '🏛️' },
  { id: 'geography', name: 'Geography', icon: '🌍' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'computer', name: 'Computer Science', icon: '💻' },
]

const GRADE_LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade', 'College'
]

const QUESTION_TYPES = [
  { id: 'multiple-choice', name: 'Multiple Choice' },
  { id: 'fill-blank', name: 'Fill in the Blank' },
  { id: 'short-answer', name: 'Short Answer' },
  { id: 'true-false', name: 'True/False' },
  { id: 'matching', name: 'Matching' },
]

// Custom color presets for the design step
const COLOR_PRESETS = [
  { id: 'ocean-blue', name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6' },
  { id: 'forest-green', name: 'Forest Green', primary: '#166534', secondary: '#22c55e' },
  { id: 'sunset-orange', name: 'Sunset Orange', primary: '#c2410c', secondary: '#f97316' },
  { id: 'royal-purple', name: 'Royal Purple', primary: '#7c3aed', secondary: '#a78bfa' },
  { id: 'rose-pink', name: 'Rose Pink', primary: '#be185d', secondary: '#ec4899' },
  { id: 'slate-gray', name: 'Slate Gray', primary: '#334155', secondary: '#64748b' },
]

export default function WorksheetMakerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Step 1 - Topic & Language
  const [subject, setSubject] = useState('math')
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('6th Grade')
  const [questionCount, setQuestionCount] = useState(10)
  const [language, setLanguage] = useState('') // Free text input for any language

  // Step 2: Worksheet content (editable)
  const [cover, setCover] = useState({ title: '', subtitle: '', instructions: '', teacherName: '', subject: '', gradeLevel: '' })
  const [sections, setSections] = useState([])
  const [bonusQuestions, setBonusQuestions] = useState([])
  const [expandedSection, setExpandedSection] = useState(null)

  // Step 3: Design Settings
  const [selectedPreset, setSelectedPreset] = useState('ocean-blue')
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#1e40af')
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#3b82f6')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [coverStyle, setCoverStyle] = useState('modern')
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true)

  // Drafts management
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)

  // Result
  const [result, setResult] = useState(null)
  
  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('/api/drafts?toolType=worksheet')
        const data = await res.json()
        if (data.success && data.drafts) {
          setDrafts(data.drafts)
        }
      } catch (e) {
        console.log('Failed to load drafts:', e)
      }
    }
    loadDrafts()
  }, [])
  
  // Get current form data for saving
  const getCurrentData = () => ({
    title: cover.title || `${topic} Worksheet`,
    subject,
    topic,
    gradeLevel,
    questionCount,
    language,
    cover,
    sections,
    bonusQuestions,
    selectedPreset,
    customPrimaryColor,
    customSecondaryColor,
    useCustomColor,
    coverStyle,
    includeAnswerKey,
    step,
  })
  
  // Load draft data into form
  const loadDraftData = (data) => {
    if (data.subject) setSubject(data.subject)
    if (data.topic) setTopic(data.topic)
    if (data.gradeLevel) setGradeLevel(data.gradeLevel)
    if (data.questionCount) setQuestionCount(data.questionCount)
    if (data.language !== undefined) setLanguage(data.language)
    if (data.cover) setCover(data.cover)
    if (data.sections) setSections(data.sections)
    if (data.bonusQuestions) setBonusQuestions(data.bonusQuestions)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (data.customPrimaryColor) setCustomPrimaryColor(data.customPrimaryColor)
    if (data.customSecondaryColor) setCustomSecondaryColor(data.customSecondaryColor)
    if (data.useCustomColor !== undefined) setUseCustomColor(data.useCustomColor)
    if (data.coverStyle) setCoverStyle(data.coverStyle)
    if (data.includeAnswerKey !== undefined) setIncludeAnswerKey(data.includeAnswerKey)
    if (data.step && data.step > 1) setStep(Math.min(data.step, 3))
    setResult(null)
  }
  
  // Start new worksheet
  const handleStartNew = () => {
    setStep(1)
    setSubject('math')
    setTopic('')
    setGradeLevel('6th Grade')
    setQuestionCount(10)
    setLanguage('')
    setCover({ title: '', subtitle: '', instructions: '', teacherName: '', subject: '', gradeLevel: '' })
    setSections([])
    setBonusQuestions([])
    setSelectedPreset('ocean-blue')
    setCustomPrimaryColor('#1e40af')
    setCustomSecondaryColor('#3b82f6')
    setUseCustomColor(false)
    setCoverStyle('modern')
    setIncludeAnswerKey(true)
    setCurrentDraftId(null)
    setResult(null)
  }

  // Generate structure
  const generateStructure = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic Required", description: "Please enter a topic", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/worksheet-maker/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, gradeLevel, questionCount, language })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      const w = data.worksheet
      setCover({
        title: w.title,
        subtitle: `${w.subject} - ${w.gradeLevel}`,
        instructions: w.instructions,
        teacherName: cover.teacherName || '', // Preserve teacher name if already entered
        subject: w.subject,
        gradeLevel: w.gradeLevel
      })
      setSections(w.sections || [])
      setBonusQuestions(w.bonusQuestions || [])
      
      setStep(2)
      toast({ title: "Worksheet Generated!", description: "Review and customize your questions." })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Generate PDF
  const generatePDF = async () => {
    if (!cover.title || sections.length === 0) {
      toast({ title: "Missing Content", description: "Please add a title and questions", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Determine colors to use
      const primaryColor = useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af')
      const secondaryColor = useCustomColor ? customSecondaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.secondary || '#3b82f6')
      
      const response = await fetch('/api/worksheet-maker/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover,
          sections,
          bonusQuestions,
          includeAnswerKey,
          language: language || 'English',
          settings: { 
            colorScheme: selectedPreset, 
            customPrimaryColor: primaryColor,
            customSecondaryColor: secondaryColor,
            coverStyle, 
            subject, 
            generateCoverImage: true 
          }
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setResult(data)
      setStep(4)
      toast({ title: "Worksheet Created!", description: `${data.pageCount} pages ready!` })
    } catch (error) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Section management
  const addSection = () => {
    setSections([...sections, { name: 'New Section', type: 'multiple-choice', instructions: '', questions: [] }])
  }

  const updateSection = (idx, field, value) => {
    const updated = [...sections]
    updated[idx] = { ...updated[idx], [field]: value }
    setSections(updated)
  }

  const addQuestion = (sectionIdx) => {
    const updated = [...sections]
    updated[sectionIdx].questions = [...(updated[sectionIdx].questions || []), 
      { question: '', options: ['A) ', 'B) ', 'C) ', 'D) '], answer: '', points: 1 }
    ]
    setSections(updated)
  }

  const updateQuestion = (sectionIdx, qIdx, field, value) => {
    const updated = [...sections]
    updated[sectionIdx].questions[qIdx] = { ...updated[sectionIdx].questions[qIdx], [field]: value }
    setSections(updated)
  }

  const selectedSubject = SUBJECTS.find(s => s.id === subject)
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            Worksheet Generator Pro
          </h1>
          <p className="text-muted-foreground">Create educational worksheets with AI-generated questions</p>
        </div>
      </div>

      {/* Progress Steps - Clickable */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => {
          // Can navigate if it's a previous step OR we have required data
          const canNavigate = s < step || 
            (s === 2 && sections.length > 0) || 
            (s === 3 && sections.length > 0) ||
            (s === 4 && result)
          
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => canNavigate && setStep(s)}
                disabled={!canNavigate && s > step}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                } ${canNavigate ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2' : s > step ? 'cursor-not-allowed opacity-60' : ''}`}
                title={canNavigate ? `Go to Step ${s}` : s > step ? 'Complete current step first' : ''}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </button>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-12 text-xs text-muted-foreground">
        {['Topic', 'Questions', 'Design', 'Download'].map((label, idx) => (
          <button
            key={label}
            onClick={() => {
              const targetStep = idx + 1
              const canGo = targetStep <= step || 
                (targetStep === 2 && sections.length > 0) || 
                (targetStep === 3 && sections.length > 0) ||
                (targetStep === 4 && result)
              if (canGo) setStep(targetStep)
            }}
            className={`hover:text-primary transition-colors ${step === idx + 1 ? 'text-primary font-medium' : ''} ${
              idx + 1 <= step ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step 1: Subject & Topic */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Step 1: What Would You Like to Teach?
                </CardTitle>
                <CardDescription>Select subject and topic for AI-generated questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubject(s.id)}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        subject === s.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="font-medium text-sm">{s.name}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g., Fractions and Decimals, World War II, Photosynthesis"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Questions: {questionCount}</Label>
                    <Slider
                      value={[questionCount]}
                      onValueChange={([v]) => setQuestionCount(v)}
                      min={5}
                      max={30}
                      step={5}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teacher / Institute Name</Label>
                    <Input
                      placeholder="e.g., Mrs. Smith or ABC Academy"
                      value={cover.teacherName}
                      onChange={(e) => setCover({ ...cover, teacherName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Language (Optional)
                    </Label>
                    <Input
                      placeholder="e.g., Bengali, Hindi, Spanish, French..."
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for English. Enter any language name for worksheets in that language.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <CreditCostBadge toolId="worksheet-maker" />
                  <Button className="flex-1" size="lg" onClick={generateStructure} disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Questions...</>
                    ) : (
                      <><Wand2 className="mr-2 h-4 w-4" /> Generate Worksheet</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drafts Panel */}
          <div className="lg:col-span-1">
            <AutoSaveDraftsManager
              toolType="worksheet"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[cover, subject, topic, gradeLevel, questionCount, language, sections, bonusQuestions, step]}
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-green-500" />
                Step 2: Edit Questions
              </CardTitle>
              <CardDescription>Review, edit, or add your own questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Worksheet Info
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={cover.title} onChange={(e) => setCover({ ...cover, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher / Institute Name</Label>
                    <Input 
                      value={cover.teacherName} 
                      onChange={(e) => setCover({ ...cover, teacherName: e.target.value })}
                      placeholder="e.g., Mrs. Smith or ABC Academy"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={cover.instructions}
                    onChange={(e) => setCover({ ...cover, instructions: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Question Sections</h4>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>

                {sections.map((section, sIdx) => (
                  <div key={sIdx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                      onClick={() => setExpandedSection(expandedSection === sIdx ? null : sIdx)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge>{section.type}</Badge>
                        <span className="font-medium">{section.name}</span>
                        <span className="text-sm text-muted-foreground">({section.questions?.length || 0} questions)</span>
                      </div>
                      {expandedSection === sIdx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>

                    {expandedSection === sIdx && (
                      <div className="p-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Section Name</Label>
                            <Input
                              value={section.name}
                              onChange={(e) => updateSection(sIdx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select 
                              value={section.type} 
                              onValueChange={(v) => updateSection(sIdx, 'type', v)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {QUESTION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Questions</Label>
                            <Button variant="ghost" size="sm" onClick={() => addQuestion(sIdx)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Question
                            </Button>
                          </div>
                          
                          {(section.questions || []).map((q, qIdx) => (
                            <div key={qIdx} className="p-3 bg-muted/50 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{qIdx + 1}</Badge>
                                <Input
                                  value={q.question}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'question', e.target.value)}
                                  placeholder="Enter question..."
                                  className="flex-1"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    const updated = [...sections]
                                    updated[sIdx].questions = updated[sIdx].questions.filter((_, i) => i !== qIdx)
                                    setSections(updated)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              
                              {section.type === 'multiple-choice' && (
                                <div className="grid grid-cols-2 gap-2 pl-8">
                                  {(q.options || []).map((opt, oIdx) => (
                                    <Input
                                      key={oIdx}
                                      value={opt}
                                      onChange={(e) => {
                                        const updated = [...sections]
                                        updated[sIdx].questions[qIdx].options[oIdx] = e.target.value
                                        setSections(updated)
                                      }}
                                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                      className="text-sm"
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 pl-8">
                                <Label className="text-sm">Answer:</Label>
                                <Input
                                  value={q.answer}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, 'answer', e.target.value)}
                                  placeholder="Correct answer"
                                  className="flex-1 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
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
              Step 3: Design Settings
            </CardTitle>
            <CardDescription>Customize the look and feel of your worksheet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Color Presets */}
                <div className="space-y-3">
                  <Label>Color Presets</Label>
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

                {/* Custom Color Picker */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Pipette className="h-4 w-4" />
                      Custom Colors
                    </Label>
                    <Switch checked={useCustomColor} onCheckedChange={setUseCustomColor} />
                  </div>
                  
                  {useCustomColor && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Primary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customPrimaryColor}
                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={customPrimaryColor}
                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                            placeholder="#1e40af"
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Secondary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customSecondaryColor}
                            onChange={(e) => setCustomSecondaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={customSecondaryColor}
                            onChange={(e) => setCustomSecondaryColor(e.target.value)}
                            placeholder="#3b82f6"
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer Key Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Include Answer Key</Label>
                    <p className="text-sm text-muted-foreground">Add answer key page at the end</p>
                  </div>
                  <Switch checked={includeAnswerKey} onCheckedChange={setIncludeAnswerKey} />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <Label>Preview</Label>
                <div 
                  className="aspect-[3/4] rounded-lg p-6 text-white flex flex-col justify-between shadow-xl"
                  style={{ backgroundColor: useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary || '#1e40af') }}
                >
                  <div className="text-center pt-8">
                    <h3 className="text-lg font-bold drop-shadow">{cover.title || 'Worksheet Title'}</h3>
                    <p className="text-sm opacity-80 mt-2">{cover.gradeLevel}</p>
                    {cover.teacherName && (
                      <p className="text-xs opacity-70 mt-4">{cover.teacherName}</p>
                    )}
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs opacity-70">{totalQuestions} questions • {sections.length} sections</p>
                    {language && <Badge variant="secondary" className="text-xs">{language}</Badge>}
                    {includeAnswerKey && <Badge variant="secondary" className="text-xs">+ Answer Key</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Colors: Primary {useCustomColor ? customPrimaryColor : (COLOR_PRESETS.find(p => p.id === selectedPreset)?.primary)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={generatePDF} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> Generate Worksheet PDF</>
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
              Your Worksheet is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 rounded-lg p-6 text-center space-y-4">
              <div className="text-6xl">{selectedSubject?.icon || '📝'}</div>
              <h3 className="text-xl font-bold">{cover.title}</h3>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{result.pageCount} pages</span>
                <span>•</span>
                <span>{totalQuestions} questions</span>
                {includeAnswerKey && <><span>•</span><span>Answer Key included</span></>}
              </div>
              
              <a href={result.downloadUrl} download>
                <Button size="lg" className="mt-4">
                  <Download className="mr-2 h-5 w-5" /> Download PDF
                </Button>
              </a>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(1); setResult(null); }}>
                Create Another Worksheet
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
