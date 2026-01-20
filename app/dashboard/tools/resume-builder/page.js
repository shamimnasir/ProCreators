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
  Upload, CheckCircle, X, ChevronDown, ChevronUp, FileUp, Copy, RefreshCw,
  Mail, Phone, MapPin, Linkedin, Award, GraduationCap, Wrench
} from 'lucide-react'
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

const TEMPLATE_STYLES = {
  modern: {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    accent: 'text-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600'
  },
  classic: {
    primary: 'bg-gradient-to-r from-gray-800 to-gray-900',
    accent: 'text-gray-800',
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    headerBg: 'bg-gradient-to-r from-gray-800 to-gray-900'
  },
  creative: {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
    accent: 'text-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    headerBg: 'bg-gradient-to-r from-purple-600 to-pink-600'
  },
  minimal: {
    primary: 'bg-gradient-to-r from-slate-700 to-slate-800',
    accent: 'text-slate-700',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800'
  },
  tech: {
    primary: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    accent: 'text-emerald-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600'
  },
  executive: {
    primary: 'bg-gradient-to-r from-amber-700 to-orange-700',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    headerBg: 'bg-gradient-to-r from-amber-700 to-orange-700'
  }
}

// Visual Resume Component
function VisualResume({ data, template }) {
  const style = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.modern
  
  if (!data) return null

  return (
    <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto" id="resume-preview">
      {/* Header Section */}
      <div className={`${style.headerBg} text-white p-8`}>
        <h1 className="text-3xl font-bold mb-1">{data.name || 'Your Name'}</h1>
        <p className="text-xl opacity-90 mb-4">{data.title || 'Professional Title'}</p>
        <div className="flex flex-wrap gap-4 text-sm opacity-90">
          {data.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" /> {data.email}
            </span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" /> {data.phone}
            </span>
          )}
          {data.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {data.location}
            </span>
          )}
          {data.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="h-4 w-4" /> {data.linkedin}
            </span>
          )}
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.summary && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center gap-2`}>
              <Briefcase className="h-5 w-5" /> PROFESSIONAL SUMMARY
            </h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-4 flex items-center gap-2`}>
              <Briefcase className="h-5 w-5" /> PROFESSIONAL EXPERIENCE
            </h2>
            <div className="space-y-5">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-gray-200">
                  <div className="flex flex-wrap justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900">{exp.title}</h3>
                      <p className={`${style.accent} font-medium`}>{exp.company}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{exp.duration}</p>
                      {exp.location && <p>{exp.location}</p>}
                    </div>
                  </div>
                  {exp.achievements && (
                    <ul className="mt-2 space-y-1">
                      {exp.achievements.map((achievement, aidx) => (
                        <li key={aidx} className="text-gray-700 text-sm flex items-start gap-2">
                          <span className={`${style.accent} mt-1`}>•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div>
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center gap-2`}>
                <GraduationCap className="h-5 w-5" /> EDUCATION
              </h2>
              <div className="space-y-3">
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-700">{edu.school}</p>
                    <p className="text-sm text-gray-500">{edu.year}</p>
                    {edu.details && <p className="text-sm text-gray-600 mt-1">{edu.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills && (
            <div>
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center gap-2`}>
                <Wrench className="h-5 w-5" /> SKILLS
              </h2>
              <div className="space-y-3">
                {data.skills.technical && data.skills.technical.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Technical Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.skills.technical.map((skill, idx) => (
                        <span key={idx} className={`${style.bg} ${style.accent} text-xs px-2 py-1 rounded`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.skills.tools && data.skills.tools.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Tools & Technologies</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.skills.tools.map((tool, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.skills.soft && data.skills.soft.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Soft Skills</h4>
                    <p className="text-sm text-gray-600">{data.skills.soft.join(' • ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mt-6">
            <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center gap-2`}>
              <Award className="h-5 w-5" /> CERTIFICATIONS
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.certifications.map((cert, idx) => (
                <span key={idx} className={`${style.bg} ${style.accent} text-sm px-3 py-1 rounded-full`}>
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResumeBuilderPage() {
  const [template, setTemplate] = useState('modern')
  const [industry, setIndustry] = useState('tech')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const resumeRef = useRef(null)

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
        description: 'Please upload your CV, paste your LinkedIn URL, or enter your details',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    setResumeData(null)

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
        setResumeData(data.resumeData)
        toast({
          title: '🎉 Resume Generated!',
          description: 'Your professional resume is ready to download'
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

  const downloadResume = async () => {
    if (!resumeRef.current) return
    
    // For now, we'll create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const styles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
          .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 40px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { font-size: 18px; opacity: 0.9; margin-bottom: 15px; }
          .contact { display: flex; flex-wrap: wrap; gap: 15px; font-size: 13px; }
          .content { padding: 30px 40px; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #2563eb; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
          .exp-item { margin-bottom: 20px; padding-left: 15px; border-left: 2px solid #e5e7eb; }
          .exp-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .exp-title { font-weight: bold; }
          .exp-company { color: #2563eb; }
          .exp-date { color: #6b7280; font-size: 13px; }
          .achievements { margin-top: 8px; }
          .achievements li { margin-bottom: 4px; font-size: 13px; color: #374151; }
          .skills-group { margin-bottom: 10px; }
          .skills-label { font-weight: 600; font-size: 12px; color: #374151; margin-bottom: 5px; }
          .skill-tags { display: flex; flex-wrap: wrap; gap: 5px; }
          .skill-tag { background: #eff6ff; color: #2563eb; padding: 3px 10px; border-radius: 12px; font-size: 11px; }
          .cert-tag { background: #eff6ff; color: #2563eb; padding: 5px 12px; border-radius: 15px; font-size: 12px; display: inline-block; margin: 3px; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      `
      
      const headerBg = template === 'modern' ? 'linear-gradient(135deg, #2563eb, #4f46e5)' :
                       template === 'classic' ? 'linear-gradient(135deg, #1f2937, #111827)' :
                       template === 'creative' ? 'linear-gradient(135deg, #9333ea, #db2777)' :
                       template === 'minimal' ? 'linear-gradient(135deg, #475569, #334155)' :
                       template === 'tech' ? 'linear-gradient(135deg, #059669, #0d9488)' :
                       'linear-gradient(135deg, #b45309, #c2410c)'
      
      const accentColor = template === 'modern' ? '#2563eb' :
                          template === 'classic' ? '#1f2937' :
                          template === 'creative' ? '#9333ea' :
                          template === 'minimal' ? '#475569' :
                          template === 'tech' ? '#059669' :
                          '#b45309'
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${resumeData.name} - Resume</title>
          ${styles.replace(/#2563eb/g, accentColor)}
          <style>
            .header { background: ${headerBg}; }
            .section h2 { color: ${accentColor}; }
            .exp-company { color: ${accentColor}; }
            .skill-tag, .cert-tag { background: ${accentColor}15; color: ${accentColor}; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${resumeData.name || 'Your Name'}</h1>
            <p>${resumeData.title || 'Professional'}</p>
            <div class="contact">
              ${resumeData.email ? `<span>📧 ${resumeData.email}</span>` : ''}
              ${resumeData.phone ? `<span>📱 ${resumeData.phone}</span>` : ''}
              ${resumeData.location ? `<span>📍 ${resumeData.location}</span>` : ''}
              ${resumeData.linkedin ? `<span>🔗 ${resumeData.linkedin}</span>` : ''}
            </div>
          </div>
          <div class="content">
            ${resumeData.summary ? `
              <div class="section">
                <h2>Professional Summary</h2>
                <p>${resumeData.summary}</p>
              </div>
            ` : ''}
            ${resumeData.experience && resumeData.experience.length > 0 ? `
              <div class="section">
                <h2>Professional Experience</h2>
                ${resumeData.experience.map(exp => `
                  <div class="exp-item">
                    <div class="exp-header">
                      <div>
                        <div class="exp-title">${exp.title}</div>
                        <div class="exp-company">${exp.company}</div>
                      </div>
                      <div class="exp-date">
                        ${exp.duration}<br/>
                        ${exp.location || ''}
                      </div>
                    </div>
                    ${exp.achievements ? `
                      <ul class="achievements">
                        ${exp.achievements.map(a => `<li>• ${a}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="two-col">
              ${resumeData.education && resumeData.education.length > 0 ? `
                <div class="section">
                  <h2>Education</h2>
                  ${resumeData.education.map(edu => `
                    <div style="margin-bottom: 12px;">
                      <div style="font-weight: bold;">${edu.degree}</div>
                      <div>${edu.school}</div>
                      <div style="color: #6b7280; font-size: 13px;">${edu.year}</div>
                      ${edu.details ? `<div style="font-size: 12px; color: #6b7280;">${edu.details}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${resumeData.skills ? `
                <div class="section">
                  <h2>Skills</h2>
                  ${resumeData.skills.technical && resumeData.skills.technical.length > 0 ? `
                    <div class="skills-group">
                      <div class="skills-label">Technical Skills</div>
                      <div class="skill-tags">
                        ${resumeData.skills.technical.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${resumeData.skills.tools && resumeData.skills.tools.length > 0 ? `
                    <div class="skills-group">
                      <div class="skills-label">Tools & Technologies</div>
                      <div class="skill-tags">
                        ${resumeData.skills.tools.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${resumeData.skills.soft && resumeData.skills.soft.length > 0 ? `
                    <div class="skills-group">
                      <div class="skills-label">Soft Skills</div>
                      <div style="font-size: 12px; color: #374151;">${resumeData.skills.soft.join(' • ')}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            ${resumeData.certifications && resumeData.certifications.length > 0 ? `
              <div class="section">
                <h2>Certifications</h2>
                <div>
                  ${resumeData.certifications.map(c => `<span class="cert-tag">${c}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const copyAsText = () => {
    if (!resumeData) return
    
    let text = `${resumeData.name}\n${resumeData.title}\n\n`
    text += `Email: ${resumeData.email} | Phone: ${resumeData.phone}\n`
    text += `Location: ${resumeData.location} | LinkedIn: ${resumeData.linkedin}\n\n`
    
    if (resumeData.summary) {
      text += `PROFESSIONAL SUMMARY\n${resumeData.summary}\n\n`
    }
    
    if (resumeData.experience) {
      text += `PROFESSIONAL EXPERIENCE\n`
      resumeData.experience.forEach(exp => {
        text += `\n${exp.title} at ${exp.company}\n${exp.duration} | ${exp.location}\n`
        if (exp.achievements) {
          exp.achievements.forEach(a => {
            text += `• ${a}\n`
          })
        }
      })
      text += '\n'
    }
    
    if (resumeData.education) {
      text += `EDUCATION\n`
      resumeData.education.forEach(edu => {
        text += `${edu.degree} - ${edu.school} (${edu.year})\n`
      })
      text += '\n'
    }
    
    if (resumeData.skills) {
      text += `SKILLS\n`
      if (resumeData.skills.technical) text += `Technical: ${resumeData.skills.technical.join(', ')}\n`
      if (resumeData.skills.tools) text += `Tools: ${resumeData.skills.tools.join(', ')}\n`
      if (resumeData.skills.soft) text += `Soft Skills: ${resumeData.skills.soft.join(', ')}\n`
    }
    
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: 'Resume copied to clipboard as text' })
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

      {!resumeData ? (
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
                  Upload CV, paste LinkedIn URL, or describe your experience
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
                    <span className="bg-white px-2 text-gray-500">Or enter details below</span>
                  </div>
                </div>

                {/* Text Area */}
                <Textarea
                  placeholder="Paste your LinkedIn profile URL, resume text, or describe your experience:

Examples:
• https://linkedin.com/in/yourprofile
• John Smith - Software Engineer at Google...
• 5 years experience in Python, AWS, leading teams..."
                  className="min-h-[180px]"
                  value={rawInfo}
                  onChange={(e) => setRawInfo(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  💡 Tip: Just paste your LinkedIn URL and we'll create a complete professional resume!
                </p>
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
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-14 text-lg" 
            onClick={handleGenerate} 
            disabled={generating || (!rawInfo && !personalInfo.name)}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Creating Your Professional Resume...</>
            ) : (
              <><Sparkles className="mr-2 h-6 w-6" /> Generate Professional Resume</>
            )}
          </Button>

          {/* Tips */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <CardHeader>
              <CardTitle className="text-indigo-800 dark:text-indigo-200">💡 What You'll Get</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">✅ ATS-Friendly</p>
                  <p className="text-indigo-700 dark:text-indigo-300">Passes Applicant Tracking Systems</p>
                </div>
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">✅ Visually Appealing</p>
                  <p className="text-indigo-700 dark:text-indigo-300">Professional design templates</p>
                </div>
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">✅ Ready to Use</p>
                  <p className="text-indigo-700 dark:text-indigo-300">No placeholders, fully completed</p>
                </div>
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">✅ Download & Print</p>
                  <p className="text-indigo-700 dark:text-indigo-300">Export as PDF instantly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Generated Resume Display */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Professional Resume</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResumeData(null)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Start Over
              </Button>
              <Button variant="outline" onClick={copyAsText}>
                <Copy className="h-4 w-4 mr-2" /> Copy Text
              </Button>
              <Button onClick={downloadResume} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <Label>Change Template:</Label>
            <div className="flex gap-2">
              {RESUME_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  variant={template === t.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTemplate(t.id)}
                >
                  {t.icon} {t.name}
                </Button>
              ))}
            </div>
          </div>

          <div ref={resumeRef}>
            <VisualResume data={resumeData} template={template} />
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your resume is ready!</h3>
                  <p className="text-green-700">Click "Download PDF" to save your professional resume. You can also change the template style above.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
