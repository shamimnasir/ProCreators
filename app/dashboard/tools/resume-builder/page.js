'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, Download, Sparkles, Loader2, Briefcase, Plus, Trash2, 
  Upload, CheckCircle, X, ChevronDown, ChevronUp, FileUp, Copy, RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'

const RESUME_TEMPLATES = [
  { id: 'modern', name: 'Modern Professional', icon: '💼', description: 'Clean, contemporary design' },
  { id: 'classic', name: 'Classic Traditional', icon: '📜', description: 'Timeless, formal layout' },
  { id: 'creative', name: 'Creative Bold', icon: '🎨', description: 'Eye-catching, unique design' },
  { id: 'minimal', name: 'Minimal Clean', icon: '✨', description: 'Simple, elegant layout' },
  { id: 'tech', name: 'Tech/IT Focused', icon: '💻', description: 'Perfect for developers' },
  { id: 'executive', name: 'Executive Level', icon: '👔', description: 'Senior leadership style' },
]

const JOB_INDUSTRIES = [
  { id: 'tech', name: 'Technology/IT' },
  { id: 'finance', name: 'Finance/Banking' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'marketing', name: 'Marketing/Sales' },
  { id: 'education', name: 'Education' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'creative', name: 'Creative/Design' },
  { id: 'legal', name: 'Legal' },
  { id: 'hospitality', name: 'Hospitality' },
  { id: 'other', name: 'Other' },
]

export default function ResumeBuilderPage() {
  const [template, setTemplate] = useState('modern')
  const [industry, setIndustry] = useState('tech')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generatedResume, setGeneratedResume] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  // Combined input
  const [rawInfo, setRawInfo] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Advanced/Pro fields
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: ''
  })
  const [experiences, setExperiences] = useState([{ title: '', company: '', duration: '', description: '' }])
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }])
  const [skills, setSkills] = useState('')

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, DOC, DOCX, or TXT file',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/resume-builder/extract-text', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setRawInfo(data.text)
        setUploadedFileName(file.name)
        toast({
          title: 'CV Uploaded Successfully!',
          description: `Extracted content from ${file.name}`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to extract text from file',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearUploadedFile = () => {
    setUploadedFileName('')
    setRawInfo('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    if (!rawInfo && !personalInfo.name) {
      toast({
        title: 'Missing Information',
        description: 'Please upload your CV, paste your info, or fill in your details',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    setGeneratedResume(null)
    setSuggestions(null)

    try {
      const response = await fetch('/api/resume-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInfo,
          targetJob,
          industry,
          template,
          personalInfo: showAdvanced ? personalInfo : null,
          experiences: showAdvanced ? experiences : null,
          education: showAdvanced ? education : null,
          skills: showAdvanced ? skills : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedResume(data.resume)
        setSuggestions(data.suggestions)
        toast({
          title: 'Resume Generated!',
          description: 'Your professional resume is ready'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const addExperience = () => {
    setExperiences([...experiences, { title: '', company: '', duration: '', description: '' }])
  }

  const removeExperience = (index) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index))
    }
  }

  const updateExperience = (index, field, value) => {
    const updated = [...experiences]
    updated[index][field] = value
    setExperiences(updated)
  }

  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', year: '' }])
  }

  const removeEducation = (index) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index))
    }
  }

  const updateEducation = (index, field, value) => {
    const updated = [...education]
    updated[index][field] = value
    setEducation(updated)
  }

  const copyToClipboard = () => {
    if (generatedResume) {
      navigator.clipboard.writeText(generatedResume)
      toast({ title: 'Copied!', description: 'Resume copied to clipboard' })
    }
  }

  const downloadAsText = () => {
    if (generatedResume) {
      const blob = new Blob([generatedResume], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${targetJob?.replace(/\s+/g, '_') || 'professional'}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-500" />
            AI Resume Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create ATS-friendly, professional resumes in minutes
          </p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800">
          <Briefcase className="h-3 w-3 mr-1" />
          Job-Ready
        </Badge>
      </div>

      {!generatedResume ? (
        <>
          {/* Main Input Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Your Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">1</span>
                  Your Information
                </CardTitle>
                <CardDescription>
                  Upload your existing CV or paste/describe your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="cv-upload"
                  />
                  
                  {uploadedFileName ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">{uploadedFileName}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearUploadedFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="cv-upload" 
                      className="flex flex-col items-center justify-center cursor-pointer py-4"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                      ) : (
                        <FileUp className="h-8 w-8 text-gray-400" />
                      )}
                      <span className="mt-2 text-sm font-medium text-gray-700">
                        {uploading ? 'Extracting text...' : 'Upload Existing CV'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, or TXT (max 10MB)
                      </span>
                    </label>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or paste/type below</span>
                  </div>
                </div>

                {/* Text Area */}
                <Textarea
                  placeholder="Paste your LinkedIn profile, old resume text, or describe your experience:

Example:
John Smith - Software Engineer with 5 years experience.
Worked at Google and Microsoft.
Skills: Python, JavaScript, React, AWS
Stanford University, Computer Science degree 2019"
                  className="min-h-[200px]"
                  value={rawInfo}
                  onChange={(e) => setRawInfo(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Right Column - Target & Style */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">2</span>
                  Target Job & Style
                </CardTitle>
                <CardDescription>
                  AI will optimize your resume for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Job Title</Label>
                  <Input
                    placeholder="e.g., Senior Software Engineer"
                    value={targetJob}
                    onChange={(e) => setTargetJob(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id}>
                          {ind.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resume Template</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {RESUME_TEMPLATES.map((t) => (
                      <Button
                        key={t.id}
                        variant={template === t.id ? 'default' : 'outline'}
                        className={`h-auto py-3 flex flex-col items-center gap-1 ${template === t.id ? 'ring-2 ring-indigo-500' : ''}`}
                        onClick={() => setTemplate(t.id)}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-xs text-center leading-tight">{t.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Options Toggle */}
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options (Add More Details)
          </Button>

          {/* Advanced/Pro Options */}
          {showAdvanced && (
            <div className="space-y-4">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information (Optional)</CardTitle>
                  <CardDescription>Override or add to the info extracted above</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name</Label>
                      <Input 
                        placeholder="John Smith" 
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input 
                        placeholder="john@email.com" 
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input 
                        placeholder="+1 234 567 8900"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <Input 
                        placeholder="San Francisco, CA"
                        value={personalInfo.location}
                        onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">LinkedIn URL</Label>
                      <Input 
                        placeholder="linkedin.com/in/johnsmith"
                        value={personalInfo.linkedin}
                        onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Experience */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Work Experience (Optional)</CardTitle>
                      <CardDescription>Add specific job details</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addExperience}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                      {experiences.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeExperience(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          placeholder="Job Title" 
                          value={exp.title}
                          onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                        />
                        <Input 
                          placeholder="Company" 
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                        />
                        <Input 
                          placeholder="Duration (e.g., 2020-2023)" 
                          value={exp.duration}
                          onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                        />
                      </div>
                      <Textarea 
                        placeholder="Describe your responsibilities and achievements..." 
                        className="min-h-[60px]"
                        value={exp.description}
                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Education (Optional)</CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addEducation}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {education.map((edu, idx) => (
                    <div key={idx} className="p-3 border rounded-lg relative">
                      {education.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeEducation(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          placeholder="Degree" 
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                        />
                        <Input 
                          placeholder="School/University" 
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                        />
                        <Input 
                          placeholder="Year" 
                          value={edu.year}
                          onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills (Optional)</CardTitle>
                  <CardDescription>List your key skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="List your skills separated by commas: Python, JavaScript, Project Management, Leadership, Data Analysis..."
                    className="min-h-[80px]"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
            onClick={handleGenerate} 
            disabled={generating || (!rawInfo && !personalInfo.name)}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your Resume...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generate Professional Resume</>
            )}
          </Button>
        </>
      ) : (
        /* Generated Resume Display */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Generated Resume</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGeneratedResume(null)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Start Over
              </Button>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button onClick={downloadAsText}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Resume Preview */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{generatedResume}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions Sidebar */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader>
                  <CardTitle className="text-amber-800 dark:text-amber-200 text-lg">💡 Improvement Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-amber-900 dark:text-amber-100 prose prose-sm max-w-none">
                    <ReactMarkdown>{suggestions}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resume Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Job:</span>
                    <span className="font-medium">{targetJob || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry:</span>
                    <span className="font-medium">{JOB_INDUSTRIES.find(i => i.id === industry)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Template:</span>
                    <span className="font-medium">{RESUME_TEMPLATES.find(t => t.id === template)?.name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tips - Only show when not showing result */}
      {!generatedResume && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardHeader>
            <CardTitle className="text-indigo-800 dark:text-indigo-200">💡 Resume Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-indigo-800 dark:text-indigo-200">ATS-Friendly</p>
                <p className="text-indigo-700 dark:text-indigo-300">Our resumes pass Applicant Tracking Systems</p>
              </div>
              <div>
                <p className="font-medium text-indigo-800 dark:text-indigo-200">Keyword Optimized</p>
                <p className="text-indigo-700 dark:text-indigo-300">AI adds relevant keywords for your target job</p>
              </div>
              <div>
                <p className="font-medium text-indigo-800 dark:text-indigo-200">Upload & Improve</p>
                <p className="text-indigo-700 dark:text-indigo-300">Upload your existing CV to get an improved version</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
