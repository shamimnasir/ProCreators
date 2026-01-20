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
  Mail, Phone, MapPin, Linkedin, Award, GraduationCap, Wrench, Camera,
  Edit3, Check, User, LayoutGrid
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

const LAYOUT_STYLES = [
  { id: 'standard', name: 'Standard', icon: '📄', description: 'Traditional single column' },
  { id: 'sidebar', name: 'Sidebar', icon: '📊', description: 'Skills sidebar on left' },
  { id: 'two-column', name: 'Two Column', icon: '📰', description: 'Balanced two columns' },
  { id: 'compact', name: 'Compact', icon: '📋', description: 'Dense, space-efficient' },
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

// Editable Text Component
function EditableText({ value, onChange, className = '', multiline = false, placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  const handleSave = () => {
    onChange(tempValue)
    setEditing(false)
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave()
    }
    if (e.key === 'Escape') {
      setTempValue(value)
      setEditing(false)
    }
  }
  
  if (editing) {
    return multiline ? (
      <div className="relative">
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full p-2 border rounded bg-white text-gray-900 ${className}`}
          autoFocus
          rows={3}
        />
        <div className="flex gap-1 mt-1">
          <Button size="sm" variant="default" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setTempValue(value); setEditing(false) }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-1">
        <input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`px-2 py-1 border rounded bg-white text-gray-900 ${className}`}
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
      </div>
    )
  }
  
  return (
    <span 
      onClick={() => { setTempValue(value); setEditing(true) }}
      className={`cursor-pointer hover:bg-white/20 hover:outline hover:outline-2 hover:outline-dashed hover:outline-white/50 rounded px-1 transition-all ${className}`}
      title="Click to edit"
    >
      {value || placeholder}
      <Edit3 className="inline h-3 w-3 ml-1 opacity-50" />
    </span>
  )
}

// Editable List Item
function EditableListItem({ value, onChange, onDelete, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  if (editing) {
    return (
      <li className="flex items-start gap-2">
        <span className="mt-2">•</span>
        <div className="flex-1">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="w-full p-1 border rounded bg-white text-gray-900 text-sm"
            autoFocus
            rows={2}
          />
          <div className="flex gap-1 mt-1">
            <Button size="sm" variant="default" onClick={() => { onChange(tempValue); setEditing(false) }}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </li>
    )
  }
  
  return (
    <li 
      className={`flex items-start gap-2 cursor-pointer hover:bg-gray-100 rounded px-1 ${className}`}
      onClick={() => { setTempValue(value); setEditing(true) }}
      title="Click to edit"
    >
      <span className="mt-0.5">•</span>
      <span className="flex-1">{value}</span>
      <Edit3 className="h-3 w-3 opacity-30 mt-1" />
    </li>
  )
}

// Visual Resume Component with Editing
function VisualResume({ data, setData, template, layout, headshot }) {
  const style = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.modern
  
  if (!data) return null

  const updateField = (field, value) => {
    setData({ ...data, [field]: value })
  }

  const updateExperience = (expIdx, field, value) => {
    const newExp = [...data.experience]
    newExp[expIdx] = { ...newExp[expIdx], [field]: value }
    setData({ ...data, experience: newExp })
  }

  const updateAchievement = (expIdx, achIdx, value) => {
    const newExp = [...data.experience]
    newExp[expIdx].achievements[achIdx] = value
    setData({ ...data, experience: newExp })
  }

  const deleteAchievement = (expIdx, achIdx) => {
    const newExp = [...data.experience]
    newExp[expIdx].achievements = newExp[expIdx].achievements.filter((_, i) => i !== achIdx)
    setData({ ...data, experience: newExp })
  }

  const addAchievement = (expIdx) => {
    const newExp = [...data.experience]
    newExp[expIdx].achievements = [...(newExp[expIdx].achievements || []), 'New achievement - click to edit']
    setData({ ...data, experience: newExp })
  }

  const updateEducation = (eduIdx, field, value) => {
    const newEdu = [...data.education]
    newEdu[eduIdx] = { ...newEdu[eduIdx], [field]: value }
    setData({ ...data, education: newEdu })
  }

  const updateSkill = (category, idx, value) => {
    const newSkills = { ...data.skills }
    newSkills[category][idx] = value
    setData({ ...data, skills: newSkills })
  }

  const deleteSkill = (category, idx) => {
    const newSkills = { ...data.skills }
    newSkills[category] = newSkills[category].filter((_, i) => i !== idx)
    setData({ ...data, skills: newSkills })
  }

  const addSkill = (category) => {
    const newSkills = { ...data.skills }
    newSkills[category] = [...(newSkills[category] || []), 'New Skill']
    setData({ ...data, skills: newSkills })
  }

  // Standard Layout
  if (layout === 'standard' || !layout) {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto" id="resume-preview">
        {/* Header Section */}
        <div className={`${style.headerBg} text-white p-8`}>
          <div className="flex items-start gap-6">
            {headshot && (
              <img 
                src={headshot} 
                alt="Profile" 
                className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">
                <EditableText value={data.name} onChange={(v) => updateField('name', v)} />
              </h1>
              <p className="text-xl opacity-90 mb-4">
                <EditableText value={data.title} onChange={(v) => updateField('title', v)} />
              </p>
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                {data.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <EditableText value={data.email} onChange={(v) => updateField('email', v)} />
                  </span>
                )}
                {data.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <EditableText value={data.phone} onChange={(v) => updateField('phone', v)} />
                  </span>
                )}
                {data.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <EditableText value={data.location} onChange={(v) => updateField('location', v)} />
                  </span>
                )}
                {data.linkedin && (
                  <span className="flex items-center gap-1">
                    <Linkedin className="h-4 w-4" />
                    <EditableText value={data.linkedin} onChange={(v) => updateField('linkedin', v)} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Summary */}
          {data.summary && (
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center gap-2`}>
                <Briefcase className="h-5 w-5" /> PROFESSIONAL SUMMARY
              </h2>
              <div className="text-gray-700 leading-relaxed">
                <EditableText 
                  value={data.summary} 
                  onChange={(v) => updateField('summary', v)} 
                  multiline 
                  className="w-full"
                />
              </div>
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
                        <h3 className="font-bold text-gray-900">
                          <EditableText value={exp.title} onChange={(v) => updateExperience(idx, 'title', v)} />
                        </h3>
                        <p className={`${style.accent} font-medium`}>
                          <EditableText value={exp.company} onChange={(v) => updateExperience(idx, 'company', v)} />
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <EditableText value={exp.duration} onChange={(v) => updateExperience(idx, 'duration', v)} />
                        {exp.location && (
                          <div>
                            <EditableText value={exp.location} onChange={(v) => updateExperience(idx, 'location', v)} />
                          </div>
                        )}
                      </div>
                    </div>
                    {exp.achievements && (
                      <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                        {exp.achievements.map((achievement, aidx) => (
                          <EditableListItem
                            key={aidx}
                            value={achievement}
                            onChange={(v) => updateAchievement(idx, aidx, v)}
                            onDelete={() => deleteAchievement(idx, aidx)}
                          />
                        ))}
                        <li>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs"
                            onClick={() => addAchievement(idx)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Achievement
                          </Button>
                        </li>
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
                      <h3 className="font-bold text-gray-900">
                        <EditableText value={edu.degree} onChange={(v) => updateEducation(idx, 'degree', v)} />
                      </h3>
                      <p className="text-gray-700">
                        <EditableText value={edu.school} onChange={(v) => updateEducation(idx, 'school', v)} />
                      </p>
                      <p className="text-sm text-gray-500">
                        <EditableText value={edu.year} onChange={(v) => updateEducation(idx, 'year', v)} />
                      </p>
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
                          <span 
                            key={idx} 
                            className={`${style.bg} ${style.accent} text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 group`}
                            onClick={() => {
                              const newValue = prompt('Edit skill:', skill)
                              if (newValue !== null) {
                                if (newValue === '') {
                                  deleteSkill('technical', idx)
                                } else {
                                  updateSkill('technical', idx, newValue)
                                }
                              }
                            }}
                            title="Click to edit, enter empty to delete"
                          >
                            {skill}
                          </span>
                        ))}
                        <button 
                          className={`${style.bg} ${style.accent} text-xs px-2 py-1 rounded opacity-50 hover:opacity-100`}
                          onClick={() => addSkill('technical')}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}
                  {data.skills.tools && data.skills.tools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Tools & Technologies</h4>
                      <div className="flex flex-wrap gap-1">
                        {data.skills.tools.map((tool, idx) => (
                          <span 
                            key={idx} 
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                              const newValue = prompt('Edit tool:', tool)
                              if (newValue !== null) {
                                if (newValue === '') {
                                  deleteSkill('tools', idx)
                                } else {
                                  updateSkill('tools', idx, newValue)
                                }
                              }
                            }}
                          >
                            {tool}
                          </span>
                        ))}
                        <button 
                          className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded hover:bg-gray-200"
                          onClick={() => addSkill('tools')}
                        >
                          + Add
                        </button>
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

  // Sidebar Layout
  if (layout === 'sidebar') {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto flex" id="resume-preview">
        {/* Sidebar */}
        <div className={`${style.headerBg} text-white w-1/3 p-6`}>
          {headshot && (
            <img 
              src={headshot} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-center mb-1">
            <EditableText value={data.name} onChange={(v) => updateField('name', v)} />
          </h1>
          <p className="text-center opacity-90 mb-6">
            <EditableText value={data.title} onChange={(v) => updateField('title', v)} />
          </p>
          
          {/* Contact */}
          <div className="space-y-2 text-sm mb-6">
            <h3 className="font-bold border-b border-white/30 pb-1 mb-2">CONTACT</h3>
            {data.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {data.email}</p>}
            {data.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {data.phone}</p>}
            {data.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {data.location}</p>}
            {data.linkedin && <p className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> {data.linkedin}</p>}
          </div>

          {/* Skills in Sidebar */}
          {data.skills && (
            <div className="text-sm">
              <h3 className="font-bold border-b border-white/30 pb-1 mb-2">SKILLS</h3>
              {data.skills.technical && (
                <div className="mb-3">
                  <h4 className="font-medium text-xs opacity-75 mb-1">Technical</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.technical.map((skill, idx) => (
                      <span key={idx} className="bg-white/20 px-2 py-0.5 rounded text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.skills.tools && (
                <div className="mb-3">
                  <h4 className="font-medium text-xs opacity-75 mb-1">Tools</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.tools.map((tool, idx) => (
                      <span key={idx} className="bg-white/20 px-2 py-0.5 rounded text-xs">{tool}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education in Sidebar */}
          {data.education && data.education.length > 0 && (
            <div className="text-sm mt-6">
              <h3 className="font-bold border-b border-white/30 pb-1 mb-2">EDUCATION</h3>
              {data.education.map((edu, idx) => (
                <div key={idx} className="mb-2">
                  <p className="font-medium">{edu.degree}</p>
                  <p className="text-xs opacity-75">{edu.school}</p>
                  <p className="text-xs opacity-75">{edu.year}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-2/3 p-6">
          {/* Summary */}
          {data.summary && (
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3`}>
                PROFESSIONAL SUMMARY
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-4`}>
                EXPERIENCE
              </h2>
              <div className="space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                        <p className={`${style.accent} text-sm`}>{exp.company}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{exp.duration}</p>
                        <p>{exp.location}</p>
                      </div>
                    </div>
                    {exp.achievements && (
                      <ul className="mt-1 space-y-0.5 text-gray-600 text-xs">
                        {exp.achievements.map((a, aidx) => (
                          <li key={aidx}>• {a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Two Column Layout
  if (layout === 'two-column') {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto" id="resume-preview">
        {/* Header */}
        <div className={`${style.headerBg} text-white p-6`}>
          <div className="flex items-center gap-4">
            {headshot && (
              <img src={headshot} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <p className="opacity-90">{data.title}</p>
              <div className="flex gap-4 text-xs mt-2 opacity-80">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Content */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div>
            {data.summary && (
              <div className="mb-4">
                <h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>SUMMARY</h2>
                <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.experience && data.experience.length > 0 && (
              <div>
                <h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>EXPERIENCE</h2>
                <div className="space-y-3">
                  {data.experience.slice(0, 2).map((exp, idx) => (
                    <div key={idx}>
                      <h3 className="font-bold text-xs text-gray-900">{exp.title}</h3>
                      <p className={`${style.accent} text-xs`}>{exp.company} | {exp.duration}</p>
                      {exp.achievements && (
                        <ul className="text-xs text-gray-600 mt-1">
                          {exp.achievements.slice(0, 3).map((a, aidx) => (
                            <li key={aidx}>• {a}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {data.skills && (
              <div className="mb-4">
                <h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>SKILLS</h2>
                {data.skills.technical && (
                  <div className="mb-2">
                    <h4 className="text-xs font-medium text-gray-700">Technical</h4>
                    <p className="text-xs text-gray-600">{data.skills.technical.join(', ')}</p>
                  </div>
                )}
                {data.skills.tools && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700">Tools</h4>
                    <p className="text-xs text-gray-600">{data.skills.tools.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {data.education && data.education.length > 0 && (
              <div className="mb-4">
                <h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>EDUCATION</h2>
                {data.education.map((edu, idx) => (
                  <div key={idx} className="mb-2">
                    <p className="font-medium text-xs text-gray-900">{edu.degree}</p>
                    <p className="text-xs text-gray-600">{edu.school}, {edu.year}</p>
                  </div>
                ))}
              </div>
            )}

            {data.certifications && data.certifications.length > 0 && (
              <div>
                <h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>CERTIFICATIONS</h2>
                <ul className="text-xs text-gray-600">
                  {data.certifications.map((cert, idx) => (
                    <li key={idx}>• {cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Compact Layout
  if (layout === 'compact') {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto text-xs" id="resume-preview">
        {/* Compact Header */}
        <div className={`${style.headerBg} text-white px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headshot && (
                <img src={headshot} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
              )}
              <div>
                <h1 className="text-lg font-bold">{data.name}</h1>
                <p className="opacity-90 text-sm">{data.title}</p>
              </div>
            </div>
            <div className="text-right text-xs opacity-80">
              {data.email && <p>{data.email}</p>}
              {data.phone && <p>{data.phone}</p>}
              {data.location && <p>{data.location}</p>}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Summary */}
          {data.summary && (
            <p className="text-gray-600 border-l-2 border-gray-200 pl-2">{data.summary}</p>
          )}

          {/* Experience - Compact */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h2 className={`font-bold ${style.accent} text-sm mb-1`}>EXPERIENCE</h2>
              <div className="space-y-2">
                {data.experience.map((exp, idx) => (
                  <div key={idx} className="border-l-2 border-gray-100 pl-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{exp.title} @ {exp.company}</span>
                      <span className="text-gray-500">{exp.duration}</span>
                    </div>
                    {exp.achievements && (
                      <p className="text-gray-600">{exp.achievements.slice(0, 2).join(' | ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {data.education && data.education.length > 0 && (
              <div>
                <h2 className={`font-bold ${style.accent} text-sm mb-1`}>EDUCATION</h2>
                {data.education.map((edu, idx) => (
                  <p key={idx}>{edu.degree}, {edu.school} ({edu.year})</p>
                ))}
              </div>
            )}
            {data.skills && data.skills.technical && (
              <div>
                <h2 className={`font-bold ${style.accent} text-sm mb-1`}>SKILLS</h2>
                <p>{data.skills.technical.join(', ')}</p>
              </div>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <div>
                <h2 className={`font-bold ${style.accent} text-sm mb-1`}>CERTIFICATIONS</h2>
                <p>{data.certifications.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function ResumeBuilderPage() {
  const [template, setTemplate] = useState('modern')
  const [layout, setLayout] = useState('standard')
  const [industry, setIndustry] = useState('tech')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const [headshot, setHeadshot] = useState(null)
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const headshotInputRef = useRef(null)
  const resumeRef = useRef(null)

  // Input states
  const [rawInfo, setRawInfo] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Advanced fields
  const [personalInfo, setPersonalInfo] = useState({
    name: '', email: '', phone: '', location: '', linkedin: ''
  })
  const [experiences, setExperiences] = useState([{ title: '', company: '', duration: '', description: '' }])
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }])
  const [skills, setSkills] = useState('')

  // Handle headshot upload
  const handleHeadshotUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file', variant: 'destructive' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setHeadshot(event.target.result)
      toast({ title: 'Photo Uploaded!', description: 'Your headshot has been added' })
    }
    reader.readAsDataURL(file)
  }

  // Handle CV file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      toast({ title: 'Invalid File Type', description: 'Please upload PDF, DOC, DOCX, or TXT', variant: 'destructive' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/resume-builder/extract-text', { method: 'POST', body: formData })
      const data = await response.json()

      if (data.success) {
        setRawInfo(data.text)
        setUploadedFileName(file.name)
        toast({ title: 'CV Uploaded!', description: `Extracted content from ${file.name}` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })
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
      toast({ title: 'Missing Information', description: 'Please provide your information', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResumeData(null)

    try {
      const response = await fetch('/api/resume-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInfo, targetJob, industry, template,
          personalInfo: showAdvanced ? personalInfo : null,
          experiences: showAdvanced ? experiences : null,
          education: showAdvanced ? education : null,
          skills: showAdvanced ? skills : null
        })
      })

      const data = await response.json()

      if (data.success) {
        setResumeData(data.resumeData)
        toast({ title: '🎉 Resume Generated!', description: 'Click any text to edit it' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const addExperience = () => setExperiences([...experiences, { title: '', company: '', duration: '', description: '' }])
  const removeExperience = (idx) => experiences.length > 1 && setExperiences(experiences.filter((_, i) => i !== idx))
  const updateExperience = (idx, field, value) => {
    const updated = [...experiences]
    updated[idx][field] = value
    setExperiences(updated)
  }

  const addEducation = () => setEducation([...education, { degree: '', school: '', year: '' }])
  const removeEducation = (idx) => education.length > 1 && setEducation(education.filter((_, i) => i !== idx))
  const updateEducation = (idx, field, value) => {
    const updated = [...education]
    updated[idx][field] = value
    setEducation(updated)
  }

  const downloadResume = () => {
    if (!resumeData) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const accentColor = template === 'modern' ? '#2563eb' : template === 'classic' ? '#1f2937' : 
                          template === 'creative' ? '#9333ea' : template === 'minimal' ? '#475569' :
                          template === 'tech' ? '#059669' : '#b45309'
      const headerBg = template === 'modern' ? 'linear-gradient(135deg, #2563eb, #4f46e5)' :
                       template === 'classic' ? 'linear-gradient(135deg, #1f2937, #111827)' :
                       template === 'creative' ? 'linear-gradient(135deg, #9333ea, #db2777)' :
                       template === 'minimal' ? 'linear-gradient(135deg, #475569, #334155)' :
                       template === 'tech' ? 'linear-gradient(135deg, #059669, #0d9488)' :
                       'linear-gradient(135deg, #b45309, #c2410c)'

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${resumeData.name} - Resume</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.5; font-size: 11pt; }
            .header { background: ${headerBg}; color: white; padding: 30px; display: flex; gap: 20px; align-items: center; }
            .headshot { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); }
            .header h1 { font-size: 24pt; margin-bottom: 4px; }
            .header p { opacity: 0.9; font-size: 14pt; margin-bottom: 10px; }
            .contact { display: flex; flex-wrap: wrap; gap: 15px; font-size: 10pt; opacity: 0.85; }
            .content { padding: 25px 30px; }
            .section { margin-bottom: 20px; }
            .section h2 { color: ${accentColor}; font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
            .exp-item { margin-bottom: 15px; padding-left: 12px; border-left: 2px solid #e5e7eb; }
            .exp-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .exp-title { font-weight: bold; }
            .exp-company { color: ${accentColor}; }
            .achievements li { margin-bottom: 3px; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
            .skill-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
            .skill-tag { background: ${accentColor}15; color: ${accentColor}; padding: 2px 8px; border-radius: 10px; font-size: 9pt; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${headshot ? `<img src="${headshot}" class="headshot" />` : ''}
            <div>
              <h1>${resumeData.name}</h1>
              <p>${resumeData.title}</p>
              <div class="contact">
                ${resumeData.email ? `<span>📧 ${resumeData.email}</span>` : ''}
                ${resumeData.phone ? `<span>📱 ${resumeData.phone}</span>` : ''}
                ${resumeData.location ? `<span>📍 ${resumeData.location}</span>` : ''}
                ${resumeData.linkedin ? `<span>🔗 ${resumeData.linkedin}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="content">
            ${resumeData.summary ? `<div class="section"><h2>Professional Summary</h2><p>${resumeData.summary}</p></div>` : ''}
            ${resumeData.experience?.length > 0 ? `
              <div class="section">
                <h2>Professional Experience</h2>
                ${resumeData.experience.map(exp => `
                  <div class="exp-item">
                    <div class="exp-header">
                      <div><span class="exp-title">${exp.title}</span><br/><span class="exp-company">${exp.company}</span></div>
                      <div style="text-align:right;font-size:10pt;color:#666">${exp.duration}<br/>${exp.location || ''}</div>
                    </div>
                    ${exp.achievements?.length > 0 ? `<ul class="achievements">${exp.achievements.map(a => `<li>• ${a}</li>`).join('')}</ul>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="two-col">
              ${resumeData.education?.length > 0 ? `
                <div class="section">
                  <h2>Education</h2>
                  ${resumeData.education.map(edu => `<p><strong>${edu.degree}</strong><br/>${edu.school} (${edu.year})</p>`).join('')}
                </div>
              ` : ''}
              ${resumeData.skills ? `
                <div class="section">
                  <h2>Skills</h2>
                  ${resumeData.skills.technical?.length > 0 ? `<p><strong>Technical:</strong><div class="skill-tags">${resumeData.skills.technical.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></p>` : ''}
                  ${resumeData.skills.tools?.length > 0 ? `<p style="margin-top:8px"><strong>Tools:</strong><div class="skill-tags">${resumeData.skills.tools.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></p>` : ''}
                </div>
              ` : ''}
            </div>
            ${resumeData.certifications?.length > 0 ? `
              <div class="section">
                <h2>Certifications</h2>
                <div class="skill-tags">${resumeData.certifications.map(c => `<span class="skill-tag">${c}</span>`).join('')}</div>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const copyAsText = () => {
    if (!resumeData) return
    let text = `${resumeData.name}\n${resumeData.title}\n\n`
    text += `Email: ${resumeData.email} | Phone: ${resumeData.phone}\n`
    text += `Location: ${resumeData.location} | LinkedIn: ${resumeData.linkedin}\n\n`
    if (resumeData.summary) text += `SUMMARY\n${resumeData.summary}\n\n`
    if (resumeData.experience) {
      text += `EXPERIENCE\n`
      resumeData.experience.forEach(exp => {
        text += `\n${exp.title} at ${exp.company} (${exp.duration})\n`
        exp.achievements?.forEach(a => { text += `• ${a}\n` })
      })
    }
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: 'Resume copied to clipboard' })
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
          <p className="text-muted-foreground mt-1">Create ATS-friendly, professional resumes in minutes</p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800">
          <Briefcase className="h-3 w-3 mr-1" /> Job-Ready
        </Badge>
      </div>

      {!resumeData ? (
        <>
          {/* Main Input Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">1</span>
                  Your Information
                </CardTitle>
                <CardDescription>Upload CV, paste LinkedIn URL, or describe your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Headshot Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      ref={headshotInputRef}
                      onChange={handleHeadshotUpload}
                      accept="image/*"
                      className="hidden"
                      id="headshot-upload"
                    />
                    <label htmlFor="headshot-upload" className="cursor-pointer">
                      {headshot ? (
                        <div className="relative group">
                          <img src={headshot} alt="Headshot" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-indigo-400 transition-colors">
                          <User className="h-6 w-6 text-gray-400" />
                          <span className="text-xs text-gray-500">Photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Add Your Headshot</p>
                    <p className="text-xs text-gray-500">Optional - Click to upload a professional photo</p>
                    {headshot && (
                      <Button variant="ghost" size="sm" className="text-xs mt-1 h-6 px-2" onClick={() => setHeadshot(null)}>
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* CV Upload */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" className="hidden" id="cv-upload" />
                  {uploadedFileName ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">{uploadedFileName}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearUploadedFile}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <label htmlFor="cv-upload" className="flex flex-col items-center justify-center cursor-pointer py-3">
                      {uploading ? <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /> : <FileUp className="h-8 w-8 text-gray-400" />}
                      <span className="mt-2 text-sm font-medium text-gray-700">{uploading ? 'Extracting...' : 'Upload Existing CV'}</span>
                      <span className="text-xs text-gray-500">PDF, DOC, DOCX, TXT</span>
                    </label>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or enter details</span></div>
                </div>

                <Textarea
                  placeholder="Paste your LinkedIn URL or describe your experience..."
                  className="min-h-[150px]"
                  value={rawInfo}
                  onChange={(e) => setRawInfo(e.target.value)}
                />
                <p className="text-xs text-gray-500">💡 Just paste your LinkedIn URL!</p>
              </CardContent>
            </Card>

            {/* Right Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">2</span>
                  Target Job & Design
                </CardTitle>
                <CardDescription>Choose your target role and CV style</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Job Title</Label>
                  <Input placeholder="e.g., Senior Software Engineer" value={targetJob} onChange={(e) => setTargetJob(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JOB_INDUSTRIES.map((ind) => (<SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {RESUME_TEMPLATES.map((t) => (
                      <Button
                        key={t.id}
                        variant={template === t.id ? 'default' : 'outline'}
                        className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${template === t.id ? 'ring-2 ring-indigo-500' : ''}`}
                        onClick={() => setTemplate(t.id)}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <span className="leading-tight">{t.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {LAYOUT_STYLES.map((l) => (
                      <Button
                        key={l.id}
                        variant={layout === l.id ? 'default' : 'outline'}
                        className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${layout === l.id ? 'ring-2 ring-indigo-500' : ''}`}
                        onClick={() => setLayout(l.id)}
                      >
                        <span className="text-lg">{l.icon}</span>
                        <span className="leading-tight">{l.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Toggle */}
          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input placeholder="Full Name" value={personalInfo.name} onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})} />
                    <Input placeholder="Email" value={personalInfo.email} onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})} />
                    <Input placeholder="Phone" value={personalInfo.phone} onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})} />
                    <Input placeholder="Location" value={personalInfo.location} onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})} />
                    <Input placeholder="LinkedIn URL" className="col-span-2" value={personalInfo.linkedin} onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Work Experience</CardTitle>
                    <Button variant="outline" size="sm" onClick={addExperience}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                      {experiences.length > 1 && (
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => removeExperience(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Job Title" value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)} />
                        <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)} />
                        <Input placeholder="Duration" value={exp.duration} onChange={(e) => updateExperience(idx, 'duration', e.target.value)} />
                      </div>
                      <Textarea placeholder="Achievements..." className="min-h-[60px]" value={exp.description} onChange={(e) => updateExperience(idx, 'description', e.target.value)} />
                    </div>
                  ))}
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
            {generating ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Creating Resume...</> : <><Sparkles className="mr-2 h-6 w-6" /> Generate Professional Resume</>}
          </Button>

          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div><p className="font-medium text-indigo-800">✅ ATS-Friendly</p><p className="text-indigo-700">Passes tracking systems</p></div>
                <div><p className="font-medium text-indigo-800">✅ Editable</p><p className="text-indigo-700">Click any text to edit</p></div>
                <div><p className="font-medium text-indigo-800">✅ Multiple Layouts</p><p className="text-indigo-700">4 different designs</p></div>
                <div><p className="font-medium text-indigo-800">✅ Photo Support</p><p className="text-indigo-700">Add your headshot</p></div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Result View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your Professional Resume</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResumeData(null)}><RefreshCw className="h-4 w-4 mr-2" /> Start Over</Button>
              <Button variant="outline" onClick={copyAsText}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
              <Button onClick={downloadResume} className="bg-green-600 hover:bg-green-700"><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Theme:</Label>
                <div className="flex gap-1">
                  {RESUME_TEMPLATES.map((t) => (
                    <Button key={t.id} variant={template === t.id ? 'default' : 'outline'} size="sm" onClick={() => setTemplate(t.id)}>
                      {t.icon}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Layout:</Label>
                <div className="flex gap-1">
                  {LAYOUT_STYLES.map((l) => (
                    <Button key={l.id} variant={layout === l.id ? 'default' : 'outline'} size="sm" onClick={() => setLayout(l.id)}>
                      {l.icon}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={headshotInputRef} onChange={handleHeadshotUpload} accept="image/*" className="hidden" id="headshot-change" />
                <label htmlFor="headshot-change">
                  <Button variant="outline" size="sm" asChild><span><Camera className="h-4 w-4 mr-1" /> {headshot ? 'Change' : 'Add'} Photo</span></Button>
                </label>
              </div>
            </div>
          </Card>

          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-center text-sm text-gray-500 mb-4">💡 Click any text in the resume to edit it directly</p>
            <div ref={resumeRef}>
              <VisualResume data={resumeData} setData={setResumeData} template={template} layout={layout} headshot={headshot} />
            </div>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your resume is ready!</h3>
                  <p className="text-green-700">Edit any text by clicking on it, then download when ready.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
