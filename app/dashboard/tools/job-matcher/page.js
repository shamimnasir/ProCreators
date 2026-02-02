'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Target, Sparkles, Loader2, CheckCircle, XCircle, AlertTriangle,
  FileText, Briefcase, TrendingUp, Lightbulb, RefreshCw, Upload,
  ChevronRight, Award, Zap, Shield, ArrowUp, ArrowDown, Minus,
  Copy, Check, FileUp, X, ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Score color helper
function getScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getScoreBg(score) {
  if (score >= 80) return 'bg-green-100 border-green-200'
  if (score >= 60) return 'bg-yellow-100 border-yellow-200'
  if (score >= 40) return 'bg-orange-100 border-orange-200'
  return 'bg-red-100 border-red-200'
}

function getScoreGradient(score) {
  if (score >= 80) return 'from-green-500 to-emerald-500'
  if (score >= 60) return 'from-yellow-500 to-amber-500'
  if (score >= 40) return 'from-orange-500 to-red-400'
  return 'from-red-500 to-red-600'
}

// Priority badge
function PriorityBadge({ priority }) {
  const colors = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return (
    <Badge className={`${colors[priority] || colors.Medium} border`}>
      {priority}
    </Badge>
  )
}

// Skills Section Component
function SkillsSection({ title, skills, type }) {
  if (!skills) return null
  
  const matched = skills.matched || []
  const missing = skills.missing || []
  const score = skills.score || 0
  
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score}%
        </div>
      </div>
      <Progress value={score} className="h-2 mb-3" />
      
      {matched.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Matched:</p>
          <div className="flex flex-wrap gap-1">
            {matched.map((skill, i) => (
              <Badge key={i} className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {missing.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Missing:</p>
          <div className="flex flex-wrap gap-1">
            {missing.map((skill, i) => (
              <Badge key={i} variant="outline" className="border-red-200 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Analysis Results Component
function AnalysisResults({ data }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  if (!data) return null
  
  const handleCopyMissing = () => {
    const missingSkills = data.missingKeywords?.map(k => k.keyword).join(', ') || ''
    navigator.clipboard.writeText(missingSkills)
    setCopied(true)
    toast({ title: 'Missing keywords copied!' })
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={`${getScoreBg(data.matchScore)} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Match Score</p>
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-bold ${getScoreColor(data.matchScore)}`}>
                  {data.matchScore}%
                </span>
                <Badge className={`bg-gradient-to-r ${getScoreGradient(data.matchScore)} text-white text-lg px-3 py-1`}>
                  {data.matchLevel}
                </Badge>
              </div>
              <p className="text-gray-700 mt-2">{data.summary}</p>
            </div>
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getScoreGradient(data.matchScore)} flex items-center justify-center`}>
              <Target className="h-12 w-12 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="keywords" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="ats">ATS Tips</TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Matching Keywords */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Matching Keywords ({data.matchingKeywords?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.matchingKeywords && data.matchingKeywords.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.matchingKeywords.map((item, i) => (
                      <div key={i} className="p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-800">{item.keyword}</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                        {item.foundIn && (
                          <p className="text-xs text-green-600 mt-1">{item.foundIn}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No matching keywords found</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Keywords */}
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between text-red-700">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Missing Keywords ({data.missingKeywords?.length || 0})
                  </span>
                  <Button size="sm" variant="outline" onClick={handleCopyMissing}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.missingKeywords && data.missingKeywords.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.missingKeywords.map((item, i) => (
                      <div key={i} className="p-2 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-800">{item.keyword}</span>
                          <Badge variant="outline" className={item.importance === 'Required' ? 'border-red-300 text-red-700' : 'border-yellow-300 text-yellow-700'}>
                            {item.importance}
                          </Badge>
                        </div>
                        {item.suggestion && (
                          <p className="text-xs text-red-600 mt-1">💡 {item.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 text-sm">Great! No critical keywords missing</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Analysis Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {data.skillsAnalysis?.technical && (
              <SkillsSection title="Technical Skills" skills={data.skillsAnalysis.technical} type="technical" />
            )}
            {data.skillsAnalysis?.soft && (
              <SkillsSection title="Soft Skills" skills={data.skillsAnalysis.soft} type="soft" />
            )}
            {data.skillsAnalysis?.experience && (
              <SkillsSection title="Experience" skills={data.skillsAnalysis.experience} type="experience" />
            )}
            {data.skillsAnalysis?.education && (
              <SkillsSection title="Education" skills={data.skillsAnalysis.education} type="education" />
            )}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {data.recommendations && data.recommendations.length > 0 ? (
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <Card key={i} className="border-l-4" style={{ borderLeftColor: rec.priority === 'High' ? '#ef4444' : rec.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={rec.priority} />
                        <span className="font-medium text-gray-900">{rec.area}</span>
                      </div>
                      {rec.impact && (
                        <Badge variant="outline" className="text-green-700 border-green-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {rec.impact}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{rec.issue}</p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Lightbulb className="h-4 w-4 inline mr-1" />
                        <strong>Action:</strong> {rec.action}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700">Your resume looks great! No major recommendations.</p>
              </CardContent>
            </Card>
          )}

          {/* Competitive Analysis */}
          {data.competitiveAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Competitive Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.competitiveAnalysis.strongPoints?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                      <ArrowUp className="h-4 w-4" /> Strong Points
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.competitiveAnalysis.strongPoints.map((point, i) => (
                        <Badge key={i} className="bg-green-100 text-green-800">{point}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {data.competitiveAnalysis.weakPoints?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                      <ArrowDown className="h-4 w-4" /> Areas to Improve
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.competitiveAnalysis.weakPoints.map((point, i) => (
                        <Badge key={i} variant="outline" className="border-red-200 text-red-700">{point}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {data.competitiveAnalysis.standoutOpportunities?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4" /> Stand Out Opportunities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.competitiveAnalysis.standoutOpportunities.map((point, i) => (
                        <Badge key={i} className="bg-purple-100 text-purple-800">{point}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ATS Tips Tab */}
        <TabsContent value="ats" className="space-y-4">
          {data.atsOptimization && (
            <>
              <Card className={getScoreBg(data.atsOptimization.score)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">ATS Compatibility Score</p>
                      <span className={`text-3xl font-bold ${getScoreColor(data.atsOptimization.score)}`}>
                        {data.atsOptimization.score}%
                      </span>
                    </div>
                    <Shield className={`h-12 w-12 ${getScoreColor(data.atsOptimization.score)}`} />
                  </div>
                  <Progress value={data.atsOptimization.score} className="h-2" />
                </CardContent>
              </Card>

              {data.atsOptimization.issues?.length > 0 && (
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      ATS Issues to Fix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.atsOptimization.issues.map((item, i) => (
                        <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="font-medium text-orange-800">{item.issue}</p>
                          <p className="text-sm text-orange-600 mt-1">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Fix: {item.fix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.atsOptimization.tips?.length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      ATS Optimization Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.atsOptimization.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function JobMatcherPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const router = useRouter()
  
  // Form state
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Navigate to Resume Builder with analysis data
  const goToResumeBuilder = () => {
    // Prepare keywords to add
    const missingKeywords = analysisData?.missingKeywords?.map(k => k.keyword).join(', ') || ''
    const recommendations = analysisData?.recommendations?.map(r => `• ${r.action}`).join('\n') || ''
    
    // Store data in localStorage for the Resume Builder to pick up
    const dataToPass = {
      source: 'job-analyzer',
      resumeText: resumeText,
      targetJob: jobTitle,
      companyName: companyName,
      missingKeywords: missingKeywords,
      recommendations: recommendations,
      matchScore: analysisData?.matchScore,
      timestamp: Date.now()
    }
    
    localStorage.setItem('resumeBuilderData', JSON.stringify(dataToPass))
    
    toast({ 
      title: 'Opening Resume Builder', 
      description: 'Your analysis data has been transferred' 
    })
    
    router.push('/dashboard/tools/resume-builder')
  }

  // Navigate to Cover Letter Generator with job data
  const goToCoverLetter = () => {
    // Store data in localStorage for the Cover Letter Generator to pick up
    const dataToPass = {
      source: 'job-analyzer',
      jobTitle: jobTitle,
      companyName: companyName,
      jobDescription: jobDescription,
      matchingKeywords: analysisData?.matchingKeywords?.map(k => k.keyword).join(', ') || '',
      strongPoints: analysisData?.competitiveAnalysis?.strongPoints?.join(', ') || '',
      timestamp: Date.now()
    }
    
    localStorage.setItem('coverLetterData', JSON.stringify(dataToPass))
    
    toast({ 
      title: 'Opening Cover Letter Generator', 
      description: 'Job details have been transferred' 
    })
    
    router.push('/dashboard/tools/cover-letter')
  }

  // Copy all missing keywords
  const copyMissingKeywords = () => {
    const keywords = analysisData?.missingKeywords?.map(k => k.keyword).join(', ') || ''
    navigator.clipboard.writeText(keywords)
    toast({ title: 'Keywords copied!', description: 'Add these to your resume' })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast({ title: 'Invalid File', description: 'Please upload PDF, DOC, DOCX, or TXT', variant: 'destructive' })
      return
    }
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch('/api/resume-builder/extract-text', { method: 'POST', body: formData })
      const data = await res.json()
      
      if (data.success) {
        setResumeText(data.text)
        setUploadedFileName(file.name)
        toast({ title: 'Resume Uploaded!', description: 'Text extracted successfully' })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide both your resume and the job description', 
        variant: 'destructive' 
      })
      return
    }
    
    setAnalyzing(true)
    setAnalysisData(null)
    
    try {
      const res = await fetch('/api/job-matcher/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription, jobTitle, companyName })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setAnalysisData(data.data)
        toast({ title: '🎯 Analysis Complete!' })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-500" />
            Job Description Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">Match your resume to job requirements & optimize for ATS</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <Sparkles className="h-3 w-3 mr-1" />Smart Match
        </Badge>
      </div>

      {!analysisData ? (
        <>
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Target className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How it works:</strong> Paste your resume and job description below. Our AI will analyze keyword matches, 
              identify gaps, and provide specific recommendations to increase your chances of getting past ATS and landing interviews.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resume Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">1</span>
                  Your Resume
                </CardTitle>
                <CardDescription>Upload or paste your resume content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".pdf,.doc,.docx,.txt" 
                    className="hidden" 
                    id="resume-upload" 
                  />
                  
                  {uploadedFileName ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">{uploadedFileName}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setUploadedFileName(''); setResumeText('') }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="resume-upload" className="flex flex-col items-center justify-center cursor-pointer py-4">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      ) : (
                        <FileUp className="h-8 w-8 text-gray-400" />
                      )}
                      <span className="mt-2 text-sm font-medium">
                        {uploading ? 'Extracting text...' : 'Upload Resume'}
                      </span>
                      <span className="text-xs text-gray-500">PDF, DOC, DOCX, TXT</span>
                    </label>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or paste content</span>
                  </div>
                </div>

                <Textarea 
                  placeholder="Paste your resume text here...

Example:
John Smith
Software Engineer

EXPERIENCE
Senior Developer at TechCorp (2020-Present)
- Led development of microservices architecture
- Improved system performance by 40%

SKILLS
Python, JavaScript, AWS, Docker, Kubernetes..."
                  className="min-h-[250px]"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Job Description Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">2</span>
                  Job Description
                </CardTitle>
                <CardDescription>Paste the job posting you want to apply for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Job Title</Label>
                    <Input 
                      placeholder="e.g., Senior Software Engineer" 
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <Input 
                      placeholder="e.g., Google" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Job Description *</Label>
                  <Textarea 
                    placeholder="Paste the full job description here...

Example:
We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience in software development
- Proficiency in Python and JavaScript
- Experience with AWS and cloud services
- Strong problem-solving skills
- Experience with Agile methodologies

Nice to have:
- Experience with machine learning
- Kubernetes and Docker expertise"
                    className="min-h-[280px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyze Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 text-lg"
            onClick={handleAnalyze}
            disabled={analyzing || !resumeText || !jobDescription}
          >
            {analyzing ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Analyzing Match...</>
            ) : (
              <><Target className="mr-2 h-6 w-6" />Analyze Job Match</>
            )}
          </Button>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <Button variant="outline" onClick={() => setAnalysisData(null)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze Another Job
            </Button>
          </div>

          <AnalysisResults data={analysisData} />

          {/* Next Steps */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Next Steps
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button 
                  onClick={goToResumeBuilder}
                  className="bg-white p-4 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer text-left border-2 border-transparent hover:border-blue-300 group"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <p className="font-medium group-hover:text-blue-600">Update Resume</p>
                  <p className="text-sm text-gray-600">Add {analysisData?.missingKeywords?.length || 0} missing keywords</p>
                  <div className="flex items-center gap-1 text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Resume Builder <ExternalLink className="h-3 w-3" />
                  </div>
                </button>
                <button 
                  onClick={goToCoverLetter}
                  className="bg-white p-4 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer text-left border-2 border-transparent hover:border-purple-300 group"
                >
                  <div className="text-2xl mb-2">✉️</div>
                  <p className="font-medium group-hover:text-purple-600">Write Cover Letter</p>
                  <p className="text-sm text-gray-600">Pre-filled with job details</p>
                  <div className="flex items-center gap-1 text-xs text-purple-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Cover Letter Generator <ExternalLink className="h-3 w-3" />
                  </div>
                </button>
                <button 
                  onClick={copyMissingKeywords}
                  className="bg-white p-4 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer text-left border-2 border-transparent hover:border-green-300 group"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <p className="font-medium group-hover:text-green-600">Copy Keywords</p>
                  <p className="text-sm text-gray-600">Copy all missing keywords</p>
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Copy to clipboard <Copy className="h-3 w-3" />
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
