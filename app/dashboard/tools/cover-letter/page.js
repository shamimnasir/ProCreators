'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, Download, Sparkles, Loader2, Briefcase, 
  CheckCircle, Copy, RefreshCw, User, Building2,
  FileText, Target, Award, Lightbulb, ChevronDown, ChevronUp,
  Phone, MapPin, Linkedin, Edit3, Check, X, AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const TONE_OPTIONS = [
  { id: 'professional', name: 'Professional', icon: '👔', desc: 'Formal and business-appropriate' },
  { id: 'enthusiastic', name: 'Enthusiastic', icon: '🚀', desc: 'Energetic and passionate' },
  { id: 'confident', name: 'Confident', icon: '💪', desc: 'Self-assured and assertive' },
  { id: 'conversational', name: 'Conversational', icon: '💬', desc: 'Friendly yet professional' }
]

const LENGTH_OPTIONS = [
  { id: 'concise', name: 'Concise', words: '250-300 words' },
  { id: 'standard', name: 'Standard', words: '300-400 words' },
  { id: 'detailed', name: 'Detailed', words: '400-500 words' }
]

const TEMPLATE_THEMES = [
  { id: 'modern', name: 'Modern', color: 'from-blue-600 to-indigo-600', accent: '#2563eb' },
  { id: 'classic', name: 'Classic', color: 'from-gray-700 to-gray-900', accent: '#374151' },
  { id: 'creative', name: 'Creative', color: 'from-purple-600 to-pink-600', accent: '#9333ea' },
  { id: 'elegant', name: 'Elegant', color: 'from-emerald-600 to-teal-600', accent: '#059669' }
]

// Editable field component
function EditableField({ value, onChange, multiline = false, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  const handleSave = () => {
    onChange(tempValue)
    setEditing(false)
  }
  
  if (editing) {
    if (multiline) {
      return (
        <div className="relative">
          <textarea 
            value={tempValue} 
            onChange={(e) => setTempValue(e.target.value)}
            className={`w-full p-2 border rounded bg-white text-gray-900 ${className}`}
            autoFocus
            rows={4}
          />
          <div className="flex gap-1 mt-1">
            <Button size="sm" onClick={handleSave}><Check className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
          </div>
        </div>
      )
    }
    return (
      <input 
        value={tempValue} 
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        className={`px-2 py-1 border rounded bg-white text-gray-900 ${className}`}
        autoFocus
      />
    )
  }
  
  return (
    <span 
      onClick={() => { setTempValue(value); setEditing(true) }}
      className={`cursor-pointer hover:bg-yellow-100 rounded px-1 transition-all ${className}`}
      title="Click to edit"
    >
      {value || '[Click to add]'} <Edit3 className="inline h-3 w-3 ml-1 opacity-30 edit-icon" />
    </span>
  )
}

// Cover Letter Preview Component
function CoverLetterPreview({ data, setData, theme }) {
  const selectedTheme = TEMPLATE_THEMES.find(t => t.id === theme) || TEMPLATE_THEMES[0]
  
  if (!data || !data.coverLetter) return null
  
  const cl = data.coverLetter
  const header = cl.header || {}
  
  const updateField = (section, field, value) => {
    setData({
      ...data,
      coverLetter: {
        ...data.coverLetter,
        [section]: field ? { ...data.coverLetter[section], [field]: value } : value
      }
    })
  }
  
  const updateBody = (index, value) => {
    const newBody = [...(data.coverLetter.body || [])]
    newBody[index] = value
    setData({
      ...data,
      coverLetter: { ...data.coverLetter, body: newBody }
    })
  }

  return (
    <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-3xl mx-auto p-8" id="cover-letter-preview">
      {/* Applicant Header */}
      <div className="text-center mb-6 pb-6 border-b-2" style={{ borderColor: selectedTheme.accent }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <EditableField 
            value={header.applicantName} 
            onChange={(v) => updateField('header', 'applicantName', v)} 
          />
        </h1>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          {header.applicantEmail && (
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" style={{ color: selectedTheme.accent }} />
              <EditableField value={header.applicantEmail} onChange={(v) => updateField('header', 'applicantEmail', v)} />
            </span>
          )}
          {header.applicantPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" style={{ color: selectedTheme.accent }} />
              <EditableField value={header.applicantPhone} onChange={(v) => updateField('header', 'applicantPhone', v)} />
            </span>
          )}
          {header.applicantAddress && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" style={{ color: selectedTheme.accent }} />
              <EditableField value={header.applicantAddress} onChange={(v) => updateField('header', 'applicantAddress', v)} />
            </span>
          )}
          {header.applicantLinkedIn && (
            <span className="flex items-center gap-1">
              <Linkedin className="h-4 w-4" style={{ color: selectedTheme.accent }} />
              <EditableField value={header.applicantLinkedIn} onChange={(v) => updateField('header', 'applicantLinkedIn', v)} />
            </span>
          )}
        </div>
      </div>
      
      {/* Date and Recipient */}
      <div className="mb-6 text-gray-700">
        <p className="mb-4">
          <EditableField value={header.date} onChange={(v) => updateField('header', 'date', v)} />
        </p>
        <div className="space-y-1">
          {header.recipientName && (
            <p className="font-medium">
              <EditableField value={header.recipientName} onChange={(v) => updateField('header', 'recipientName', v)} />
            </p>
          )}
          {header.recipientTitle && (
            <p>
              <EditableField value={header.recipientTitle} onChange={(v) => updateField('header', 'recipientTitle', v)} />
            </p>
          )}
          <p className="font-medium" style={{ color: selectedTheme.accent }}>
            <EditableField value={header.companyName} onChange={(v) => updateField('header', 'companyName', v)} />
          </p>
          {header.companyAddress && (
            <p>
              <EditableField value={header.companyAddress} onChange={(v) => updateField('header', 'companyAddress', v)} />
            </p>
          )}
        </div>
      </div>
      
      {/* Salutation */}
      <p className="mb-4 font-medium text-gray-800">
        <EditableField value={cl.salutation} onChange={(v) => updateField('salutation', null, v)} />
      </p>
      
      {/* Opening */}
      <p className="mb-4 text-gray-700 leading-relaxed">
        <EditableField value={cl.opening} onChange={(v) => updateField('opening', null, v)} multiline />
      </p>
      
      {/* Body Paragraphs */}
      {cl.body && cl.body.map((para, idx) => (
        <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
          <EditableField value={para} onChange={(v) => updateBody(idx, v)} multiline />
        </p>
      ))}
      
      {/* Closing */}
      <p className="mb-6 text-gray-700 leading-relaxed">
        <EditableField value={cl.closing} onChange={(v) => updateField('closing', null, v)} multiline />
      </p>
      
      {/* Sign-off */}
      <div className="mt-8">
        <p className="text-gray-800">
          <EditableField value={cl.signOff} onChange={(v) => updateField('signOff', null, v)} />
        </p>
        <p className="font-semibold text-gray-900 mt-4">
          <EditableField value={cl.signature} onChange={(v) => updateField('signature', null, v)} />
        </p>
      </div>
    </div>
  )
}

export default function CoverLetterPage() {
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [coverLetterData, setCoverLetterData] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  
  const [currentRole, setCurrentRole] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [keySkills, setKeySkills] = useState('')
  const [relevantAchievements, setRelevantAchievements] = useState('')
  const [whyInterested, setWhyInterested] = useState('')
  
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('standard')
  const [theme, setTheme] = useState('modern')
  const [focusAreas, setFocusAreas] = useState('')

  const handleGenerate = async () => {
    if (!fullName || !jobTitle || !companyName) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide your name, job title, and company name', 
        variant: 'destructive' 
      })
      return
    }
    
    setGenerating(true)
    setCoverLetterData(null)
    
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, email, phone, address, linkedinUrl,
          jobTitle, companyName, hiringManagerName, jobDescription,
          currentRole, yearsExperience, keySkills, relevantAchievements, whyInterested,
          tone, length, focusAreas
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setCoverLetterData(data.data)
        toast({ title: '✉️ Cover Letter Generated!' })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = useCallback(() => {
    if (coverLetterData?.fullText) {
      navigator.clipboard.writeText(coverLetterData.fullText)
      setCopied(true)
      toast({ title: 'Copied to clipboard!' })
      setTimeout(() => setCopied(false), 2000)
    }
  }, [coverLetterData, toast])

  const handleDownloadPDF = useCallback(async () => {
    const element = document.getElementById('cover-letter-preview')
    if (!element) return
    
    setDownloading(true)
    toast({ title: 'Generating PDF...', description: 'Please wait' })
    
    try {
      // Hide edit icons
      element.querySelectorAll('.edit-icon').forEach(el => el.style.display = 'none')
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      // Show edit icons again
      element.querySelectorAll('.edit-icon').forEach(el => el.style.display = '')
      
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
      
      const fileName = `${fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cover_Letter'}_${companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company'}.pdf`
      pdf.save(fileName)
      
      toast({ title: '✅ PDF Downloaded!', description: `Saved as ${fileName}` })
    } catch (error) {
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' })
    } finally {
      setDownloading(false)
    }
  }, [fullName, companyName, toast])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-purple-500" />
            Cover Letter Generator
          </h1>
          <p className="text-muted-foreground mt-1">Create personalized, compelling cover letters</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">
          <Sparkles className="h-3 w-3 mr-1" />ATS-Optimized
        </Badge>
      </div>

      {!coverLetterData ? (
        <>
          {/* Tips Banner */}
          <Alert className="bg-purple-50 border-purple-200">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>Pro Tip:</strong> Paste the job description to help us match keywords and tailor your cover letter for ATS systems.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Your Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">1</span>
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input 
                        placeholder="John Smith" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        placeholder="john@example.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        placeholder="+1 234 567 8900" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <Input 
                        placeholder="City, State" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>LinkedIn URL</Label>
                      <Input 
                        placeholder="linkedin.com/in/yourprofile" 
                        value={linkedinUrl} 
                        onChange={(e) => setLinkedinUrl(e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">2</span>
                    Your Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Current/Recent Role</Label>
                      <Input 
                        placeholder="Software Engineer" 
                        value={currentRole} 
                        onChange={(e) => setCurrentRole(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input 
                        placeholder="5" 
                        value={yearsExperience} 
                        onChange={(e) => setYearsExperience(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Key Skills</Label>
                    <Input 
                      placeholder="Python, Project Management, Leadership..." 
                      value={keySkills} 
                      onChange={(e) => setKeySkills(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Key Achievements (use numbers when possible)</Label>
                    <Textarea 
                      placeholder="• Led a team of 5 engineers to deliver a $2M project on time
• Increased sales by 40% through new marketing strategy
• Reduced costs by 25% through process optimization"
                      className="min-h-[100px]"
                      value={relevantAchievements} 
                      onChange={(e) => setRelevantAchievements(e.target.value)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Job Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">3</span>
                    Target Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Job Title *</Label>
                      <Input 
                        placeholder="Senior Software Engineer" 
                        value={jobTitle} 
                        onChange={(e) => setJobTitle(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Company Name *</Label>
                      <Input 
                        placeholder="Google" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Hiring Manager Name (if known)</Label>
                    <Input 
                      placeholder="Jane Doe" 
                      value={hiringManagerName} 
                      onChange={(e) => setHiringManagerName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Job Description (paste from posting)</Label>
                    <Textarea 
                      placeholder="Paste the full job description here to help match keywords..."
                      className="min-h-[150px]"
                      value={jobDescription} 
                      onChange={(e) => setJobDescription(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Why are you interested in this role?</Label>
                    <Textarea 
                      placeholder="What excites you about this company and position?"
                      className="min-h-[80px]"
                      value={whyInterested} 
                      onChange={(e) => setWhyInterested(e.target.value)} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">4</span>
                    Style & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tone</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TONE_OPTIONS.map(t => (
                        <Button
                          key={t.id}
                          variant={tone === t.id ? 'default' : 'outline'}
                          className={`h-auto py-3 flex flex-col items-start text-left ${tone === t.id ? 'ring-2 ring-purple-500' : ''}`}
                          onClick={() => setTone(t.id)}
                        >
                          <span className="text-lg mb-1">{t.icon} {t.name}</span>
                          <span className="text-xs opacity-70 font-normal">{t.desc}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Length</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {LENGTH_OPTIONS.map(l => (
                        <Button
                          key={l.id}
                          variant={length === l.id ? 'default' : 'outline'}
                          className={`h-auto py-2 flex flex-col ${length === l.id ? 'ring-2 ring-purple-500' : ''}`}
                          onClick={() => setLength(l.id)}
                        >
                          <span>{l.name}</span>
                          <span className="text-xs opacity-70">{l.words}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Visual Theme</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {TEMPLATE_THEMES.map(t => (
                        <Button
                          key={t.id}
                          variant={theme === t.id ? 'default' : 'outline'}
                          className={`h-auto py-2 flex flex-col ${theme === t.id ? 'ring-2 ring-purple-500' : ''}`}
                          onClick={() => setTheme(t.id)}
                        >
                          <div className={`w-6 h-6 rounded bg-gradient-to-r ${t.color} mb-1`} />
                          <span className="text-xs">{t.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Focus Areas (what to emphasize)</Label>
                  <Input 
                    placeholder="Leadership skills, technical expertise, cultural fit..."
                    value={focusAreas}
                    onChange={(e) => setFocusAreas(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14 text-lg"
            onClick={handleGenerate}
            disabled={generating || !fullName || !jobTitle || !companyName}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Creating Cover Letter...</>
            ) : (
              <><Sparkles className="mr-2 h-6 w-6" />Generate Cover Letter</>
            )}
          </Button>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your Cover Letter</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCoverLetterData(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />Start Over
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700" disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {downloading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>

          {/* Theme Selector */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Label>Theme:</Label>
              <div className="flex gap-2">
                {TEMPLATE_THEMES.map(t => (
                  <Button
                    key={t.id}
                    variant={theme === t.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(t.id)}
                  >
                    <div className={`w-4 h-4 rounded bg-gradient-to-r ${t.color} mr-2`} />
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Cover Letter Preview */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-center text-sm text-gray-500 mb-4">💡 Click any text to edit</p>
            <CoverLetterPreview data={coverLetterData} setData={setCoverLetterData} theme={theme} />
          </div>

          {/* Metadata & Tips */}
          {coverLetterData.metadata && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Target className="h-5 w-5" />
                  Cover Letter Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700 font-medium mb-2">Keywords Matched:</p>
                    <div className="flex flex-wrap gap-1">
                      {coverLetterData.metadata.keywordsUsed?.slice(0, 8).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium mb-2">Strengths:</p>
                    <ul className="text-sm text-purple-800 space-y-1">
                      {coverLetterData.metadata.strengthAreas?.slice(0, 3).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {coverLetterData.metadata.wordCount && (
                  <p className="text-sm text-purple-600">
                    Word Count: {coverLetterData.metadata.wordCount} words
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Success Card */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your cover letter is ready!</h3>
                  <p className="text-green-700">Edit any text by clicking, then copy or download as PDF.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
