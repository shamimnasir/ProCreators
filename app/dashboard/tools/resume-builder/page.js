'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Sparkles, Loader2, Briefcase, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [mode, setMode] = useState('easy')
  const [template, setTemplate] = useState('modern')
  const [industry, setIndustry] = useState('tech')
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  // Easy mode - just paste info
  const [rawInfo, setRawInfo] = useState('')
  const [targetJob, setTargetJob] = useState('')

  // Pro mode - structured input
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experiences: [{ title: '', company: '', duration: '', description: '' }],
    education: [{ degree: '', school: '', year: '' }],
    skills: ''
  })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast({
        title: 'Resume Generated!',
        description: 'Your professional resume is ready to download.'
      })
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
    setFormData({
      ...formData,
      experiences: [...formData.experiences, { title: '', company: '', duration: '', description: '' }]
    })
  }

  const selectedTemplate = RESUME_TEMPLATES.find(t => t.id === template)

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

      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="easy">🌟 Easy Mode - Just Paste</TabsTrigger>
          <TabsTrigger value="pro">🚀 Pro Mode - Detailed</TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>1️⃣ Your Information</CardTitle>
                <CardDescription>Paste your LinkedIn summary, old resume, or just describe yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your LinkedIn profile, old resume text, or describe your experience:

Example:
John Smith - Software Engineer with 5 years experience.
Worked at Google and Microsoft.
Skills: Python, JavaScript, React, AWS
Stanford University, Computer Science degree 2019"
                  className="min-h-[250px]"
                  value={rawInfo}
                  onChange={(e) => setRawInfo(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2️⃣ Target Job & Style</CardTitle>
                <CardDescription>AI will optimize your resume for this role</CardDescription>
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
                  <div className="grid grid-cols-2 gap-2">
                    {RESUME_TEMPLATES.slice(0, 4).map((t) => (
                      <Button
                        key={t.id}
                        variant={template === t.id ? 'default' : 'outline'}
                        className="h-auto py-2 flex flex-col items-center"
                        onClick={() => setTemplate(t.id)}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-xs">{t.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating || !rawInfo}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Resume...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Professional Resume</>
            )}
          </Button>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input placeholder="John Smith" />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input placeholder="john@email.com" type="email" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input placeholder="+1 234 567 8900" />
                  </div>
                  <div className="space-y-1">
                    <Label>Location</Label>
                    <Input placeholder="San Francisco, CA" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>LinkedIn URL</Label>
                  <Input placeholder="linkedin.com/in/johnsmith" />
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Style & Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {RESUME_TEMPLATES.map((t) => (
                    <Button
                      key={t.id}
                      variant={template === t.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setTemplate(t.id)}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-xs text-center">{t.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Experience</CardTitle>
                <Button variant="outline" size="sm" onClick={addExperience}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.experiences.map((exp, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Job Title" />
                    <Input placeholder="Company" />
                    <Input placeholder="Duration (e.g., 2020-2023)" />
                  </div>
                  <Textarea placeholder="Describe your responsibilities and achievements..." className="min-h-[80px]" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="List your skills separated by commas: Python, JavaScript, Project Management, Leadership, Data Analysis..."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Resume</>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Tips */}
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
              <p className="font-medium text-indigo-800 dark:text-indigo-200">Multiple Formats</p>
              <p className="text-indigo-700 dark:text-indigo-300">Download as PDF, Word, or plain text</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
