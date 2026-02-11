'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  FileText, Download, Sparkles, Loader2, Briefcase, Plus, Trash2, 
  Upload, CheckCircle, X, ChevronDown, ChevronUp, FileUp, Copy, RefreshCw,
  Mail, Phone, MapPin, Linkedin, Award, GraduationCap, Wrench, Camera,
  Edit3, Check, User, AlertCircle, Users, Target
, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const RESUME_TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: '💼' },
  { id: 'classic', name: 'Classic', icon: '📜' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'minimal', name: 'Minimal', icon: '✨' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'executive', name: 'Executive', icon: '👔' },
]

const LAYOUT_STYLES = [
  { id: 'standard', name: 'Standard', icon: '📄' },
  { id: 'sidebar', name: 'Sidebar', icon: '📊' },
  { id: 'two-column', name: 'Two Col', icon: '📰' },
  { id: 'compact', name: 'Compact', icon: '📋' },
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
  { id: 'other', name: 'Other' },
]

const TEMPLATE_STYLES = {
  modern: { accent: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50', headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
  classic: { accent: 'text-gray-800', border: 'border-gray-300', bg: 'bg-gray-50', headerBg: 'bg-gradient-to-r from-gray-800 to-gray-900' },
  creative: { accent: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50', headerBg: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  minimal: { accent: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50', headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800' },
  tech: { accent: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-600' },
  executive: { accent: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', headerBg: 'bg-gradient-to-r from-amber-700 to-orange-700' }
}

// Editable Text Component
function EditableText({ value, onChange, className = '', multiline = false, placeholder = 'Click to edit' }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  const handleSave = () => { onChange(tempValue); setEditing(false) }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) handleSave()
    if (e.key === 'Escape') { setTempValue(value); setEditing(false) }
  }
  
  if (editing) {
    return multiline ? (
      <div className="relative">
        <textarea value={tempValue} onChange={(e) => setTempValue(e.target.value)} onKeyDown={handleKeyDown}
          className={`w-full p-2 border rounded bg-white text-gray-900 ${className}`} autoFocus rows={3} />
        <div className="flex gap-1 mt-1">
          <Button size="sm" variant="default" onClick={handleSave}><Check className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setTempValue(value); setEditing(false) }}><X className="h-3 w-3" /></Button>
        </div>
      </div>
    ) : (
      <input value={tempValue} onChange={(e) => setTempValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleSave}
        className={`px-2 py-1 border rounded bg-white text-gray-900 ${className}`} autoFocus />
    )
  }
  
  return (
    <span onClick={() => { setTempValue(value); setEditing(true) }}
      className={`cursor-pointer hover:bg-white/20 hover:outline hover:outline-2 hover:outline-dashed hover:outline-white/50 rounded px-1 transition-all ${className}`}
      title="Click to edit">
      {value || placeholder} <Edit3 className="inline h-3 w-3 ml-1 opacity-50 edit-icon print:hidden" />
    </span>
  )
}

// Editable List Item
function EditableListItem({ value, onChange, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  
  if (editing) {
    return (
      <li className="flex items-start gap-2">
        <span className="mt-2">•</span>
        <div className="flex-1">
          <textarea value={tempValue} onChange={(e) => setTempValue(e.target.value)}
            className="w-full p-1 border rounded bg-white text-gray-900 text-sm" autoFocus rows={2} />
          <div className="flex gap-1 mt-1">
            <Button size="sm" variant="default" onClick={() => { onChange(tempValue); setEditing(false) }}><Check className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
            <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
      </li>
    )
  }
  
  return (
    <li className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 rounded px-1"
      onClick={() => { setTempValue(value); setEditing(true) }} title="Click to edit">
      <span className="mt-0.5">•</span>
      <span className="flex-1">{value}</span>
      <Edit3 className="h-3 w-3 opacity-30 mt-1 edit-icon" />
    </li>
  )
}

// Visual Resume Component with References
function VisualResume({ data, setData, template, layout, headshot }) {
  const style = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.modern
  if (!data) return null

  const updateField = (field, value) => setData({ ...data, [field]: value })
  const updateExperience = (idx, field, value) => {
    const newExp = [...data.experience]; newExp[idx] = { ...newExp[idx], [field]: value }; setData({ ...data, experience: newExp })
  }
  const updateAchievement = (expIdx, achIdx, value) => {
    const newExp = [...data.experience]; newExp[expIdx].achievements[achIdx] = value; setData({ ...data, experience: newExp })
  }
  const deleteAchievement = (expIdx, achIdx) => {
    const newExp = [...data.experience]; newExp[expIdx].achievements = newExp[expIdx].achievements.filter((_, i) => i !== achIdx); setData({ ...data, experience: newExp })
  }
  const addAchievement = (expIdx) => {
    const newExp = [...data.experience]; newExp[expIdx].achievements = [...(newExp[expIdx].achievements || []), 'New achievement']; setData({ ...data, experience: newExp })
  }
  const updateEducation = (idx, field, value) => {
    const newEdu = [...data.education]; newEdu[idx] = { ...newEdu[idx], [field]: value }; setData({ ...data, education: newEdu })
  }
  const updateReference = (idx, field, value) => {
    const newRefs = [...(data.references || [])]; newRefs[idx] = { ...newRefs[idx], [field]: value }; setData({ ...data, references: newRefs })
  }
  const addReference = () => {
    setData({ ...data, references: [...(data.references || []), { name: 'Reference Name', designation: 'Job Title', company: 'Company', email: '', phone: '' }] })
  }
  const deleteReference = (idx) => {
    setData({ ...data, references: (data.references || []).filter((_, i) => i !== idx) })
  }

  // Standard Layout
  if (layout === 'standard' || !layout) {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto" id="resume-preview">
        {/* Header */}
        <div className={`${style.headerBg} text-white p-8`}>
          <div className="flex items-start gap-6">
            {headshot && <img src={headshot} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-lg" />}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1"><EditableText value={data.name} onChange={(v) => updateField('name', v)} /></h1>
              <p className="text-xl opacity-90 mb-4"><EditableText value={data.title} onChange={(v) => updateField('title', v)} /></p>
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                {data.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /><EditableText value={data.email} onChange={(v) => updateField('email', v)} /></span>}
                {data.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /><EditableText value={data.phone} onChange={(v) => updateField('phone', v)} /></span>}
                {data.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /><EditableText value={data.location} onChange={(v) => updateField('location', v)} /></span>}
                {data.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-4 w-4" /><EditableText value={data.linkedin} onChange={(v) => updateField('linkedin', v)} /></span>}
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
                <EditableText value={data.summary} onChange={(v) => updateField('summary', v)} multiline className="w-full" />
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
                        <h3 className="font-bold text-gray-900"><EditableText value={exp.title} onChange={(v) => updateExperience(idx, 'title', v)} /></h3>
                        <p className={`${style.accent} font-medium`}><EditableText value={exp.company} onChange={(v) => updateExperience(idx, 'company', v)} /></p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <EditableText value={exp.duration} onChange={(v) => updateExperience(idx, 'duration', v)} />
                        {exp.location && <div><EditableText value={exp.location} onChange={(v) => updateExperience(idx, 'location', v)} /></div>}
                      </div>
                    </div>
                    {exp.achievements && (
                      <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                        {exp.achievements.map((achievement, aidx) => (
                          <EditableListItem key={aidx} value={achievement} onChange={(v) => updateAchievement(idx, aidx, v)} onDelete={() => deleteAchievement(idx, aidx)} />
                        ))}
                        <li><Button size="sm" variant="ghost" className="text-xs" onClick={() => addAchievement(idx)}><Plus className="h-3 w-3 mr-1" /> Add</Button></li>
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
                      <h3 className="font-bold text-gray-900"><EditableText value={edu.degree} onChange={(v) => updateEducation(idx, 'degree', v)} /></h3>
                      <p className="text-gray-700"><EditableText value={edu.school} onChange={(v) => updateEducation(idx, 'school', v)} /></p>
                      <p className="text-sm text-gray-500"><EditableText value={edu.year} onChange={(v) => updateEducation(idx, 'year', v)} /></p>
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
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Technical</h4>
                      <div className="flex flex-wrap gap-1">
                        {data.skills.technical.map((skill, idx) => (
                          <span key={idx} className={`${style.bg} ${style.accent} text-xs px-2 py-1 rounded`}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.skills.tools && data.skills.tools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Tools</h4>
                      <div className="flex flex-wrap gap-1">
                        {data.skills.tools.map((tool, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{tool}</span>
                        ))}
                      </div>
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
                  <span key={idx} className={`${style.bg} ${style.accent} text-sm px-3 py-1 rounded-full`}>{cert}</span>
                ))}
              </div>
            </div>
          )}

          {/* References Section */}
          <div className="mt-6">
            <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3 flex items-center justify-between`}>
              <span className="flex items-center gap-2"><Users className="h-5 w-5" /> REFERENCES</span>
              <Button size="sm" variant="outline" onClick={addReference}><Plus className="h-3 w-3 mr-1" /> Add Reference</Button>
            </h2>
            {data.references && data.references.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {data.references.map((ref, idx) => (
                  <div key={idx} className="p-3 border rounded-lg relative group">
                    <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteReference(idx)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                    <h4 className="font-bold text-gray-900">
                      <EditableText value={ref.name} onChange={(v) => updateReference(idx, 'name', v)} placeholder="Reference Name" />
                    </h4>
                    <p className={`${style.accent} text-sm`}>
                      <EditableText value={ref.designation} onChange={(v) => updateReference(idx, 'designation', v)} placeholder="Job Title" />
                    </p>
                    <p className="text-gray-600 text-sm">
                      <EditableText value={ref.company} onChange={(v) => updateReference(idx, 'company', v)} placeholder="Company" />
                    </p>
                    {(ref.email || ref.phone) && (
                      <div className="mt-1 text-xs text-gray-500">
                        {ref.email && <span className="mr-3">{ref.email}</span>}
                        {ref.phone && <span>{ref.phone}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Click "Add Reference" to include professional references</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Sidebar Layout
  if (layout === 'sidebar') {
    return (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-4xl mx-auto flex" id="resume-preview">
        <div className={`${style.headerBg} text-white w-1/3 p-6`}>
          {headshot && <img src={headshot} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg mx-auto mb-4" />}
          <h1 className="text-2xl font-bold text-center mb-1">{data.name}</h1>
          <p className="text-center opacity-90 mb-6">{data.title}</p>
          <div className="space-y-2 text-sm mb-6">
            <h3 className="font-bold border-b border-white/30 pb-1 mb-2">CONTACT</h3>
            {data.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {data.email}</p>}
            {data.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {data.phone}</p>}
            {data.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {data.location}</p>}
          </div>
          {data.skills && (
            <div className="text-sm">
              <h3 className="font-bold border-b border-white/30 pb-1 mb-2">SKILLS</h3>
              {data.skills.technical && <div className="flex flex-wrap gap-1 mb-2">{data.skills.technical.map((s, i) => <span key={i} className="bg-white/20 px-2 py-0.5 rounded text-xs">{s}</span>)}</div>}
            </div>
          )}
          {data.education && data.education.length > 0 && (
            <div className="text-sm mt-6">
              <h3 className="font-bold border-b border-white/30 pb-1 mb-2">EDUCATION</h3>
              {data.education.map((edu, idx) => <div key={idx} className="mb-2"><p className="font-medium">{edu.degree}</p><p className="text-xs opacity-75">{edu.school}</p></div>)}
            </div>
          )}
        </div>
        <div className="w-2/3 p-6">
          {data.summary && <div className="mb-6"><h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3`}>SUMMARY</h2><p className="text-gray-700 text-sm">{data.summary}</p></div>}
          {data.experience && data.experience.length > 0 && (
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-4`}>EXPERIENCE</h2>
              {data.experience.map((exp, idx) => (
                <div key={idx} className="mb-4 pl-4 border-l-2 border-gray-200">
                  <div className="flex justify-between"><div><h3 className="font-bold text-sm">{exp.title}</h3><p className={`${style.accent} text-sm`}>{exp.company}</p></div><span className="text-xs text-gray-500">{exp.duration}</span></div>
                  {exp.achievements && <ul className="text-xs text-gray-600 mt-1">{exp.achievements.slice(0, 3).map((a, i) => <li key={i}>• {a}</li>)}</ul>}
                </div>
              ))}
            </div>
          )}
          {/* References in Sidebar Layout */}
          {data.references && data.references.length > 0 && (
            <div>
              <h2 className={`text-lg font-bold ${style.accent} border-b-2 ${style.border} pb-2 mb-3`}>REFERENCES</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {data.references.map((ref, idx) => (
                  <div key={idx}><p className="font-bold">{ref.name}</p><p className={`${style.accent} text-xs`}>{ref.designation}</p><p className="text-gray-500 text-xs">{ref.company}</p></div>
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
        <div className={`${style.headerBg} text-white p-6`}>
          <div className="flex items-center gap-4">
            {headshot && <img src={headshot} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />}
            <div><h1 className="text-2xl font-bold">{data.name}</h1><p className="opacity-90">{data.title}</p>
              <div className="flex gap-4 text-xs mt-2 opacity-80">{data.email && <span>{data.email}</span>}{data.phone && <span>{data.phone}</span>}{data.location && <span>{data.location}</span>}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 p-6">
          <div>
            {data.summary && <div className="mb-4"><h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>SUMMARY</h2><p className="text-xs text-gray-600">{data.summary}</p></div>}
            {data.experience && data.experience.length > 0 && (
              <div><h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>EXPERIENCE</h2>
                {data.experience.slice(0, 2).map((exp, idx) => (
                  <div key={idx} className="mb-3"><h3 className="font-bold text-xs">{exp.title}</h3><p className={`${style.accent} text-xs`}>{exp.company} | {exp.duration}</p>
                    {exp.achievements && <ul className="text-xs text-gray-600 mt-1">{exp.achievements.slice(0, 3).map((a, i) => <li key={i}>• {a}</li>)}</ul>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            {data.skills && <div className="mb-4"><h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>SKILLS</h2>
              {data.skills.technical && <p className="text-xs text-gray-600">{data.skills.technical.join(', ')}</p>}</div>}
            {data.education && <div className="mb-4"><h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>EDUCATION</h2>
              {data.education.map((edu, idx) => <p key={idx} className="text-xs">{edu.degree}, {edu.school}</p>)}</div>}
            {data.references && data.references.length > 0 && (
              <div><h2 className={`text-sm font-bold ${style.accent} border-b ${style.border} pb-1 mb-2`}>REFERENCES</h2>
                {data.references.map((ref, idx) => <div key={idx} className="text-xs mb-2"><p className="font-bold">{ref.name}</p><p className="text-gray-500">{ref.designation}, {ref.company}</p></div>)}
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
        <div className={`${style.headerBg} text-white px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headshot && <img src={headshot} alt="Profile" className="w-12 h-12 rounded-full object-cover" />}
              <div><h1 className="text-lg font-bold">{data.name}</h1><p className="opacity-90 text-sm">{data.title}</p></div>
            </div>
            <div className="text-right text-xs opacity-80">{data.email && <p>{data.email}</p>}{data.phone && <p>{data.phone}</p>}</div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {data.summary && <p className="text-gray-600 border-l-2 border-gray-200 pl-2">{data.summary}</p>}
          {data.experience && <div><h2 className={`font-bold ${style.accent} text-sm mb-1`}>EXPERIENCE</h2>
            {data.experience.map((exp, idx) => <div key={idx} className="border-l-2 border-gray-100 pl-2 mb-2"><span className="font-medium">{exp.title} @ {exp.company}</span> <span className="text-gray-500">({exp.duration})</span></div>)}
          </div>}
          <div className="grid grid-cols-4 gap-4">
            {data.education && <div><h2 className={`font-bold ${style.accent} text-sm mb-1`}>EDUCATION</h2>{data.education.map((e, i) => <p key={i}>{e.degree}</p>)}</div>}
            {data.skills?.technical && <div><h2 className={`font-bold ${style.accent} text-sm mb-1`}>SKILLS</h2><p>{data.skills.technical.slice(0, 5).join(', ')}</p></div>}
            {data.certifications && <div><h2 className={`font-bold ${style.accent} text-sm mb-1`}>CERTS</h2><p>{data.certifications.slice(0, 2).join(', ')}</p></div>}
            {data.references && data.references.length > 0 && <div><h2 className={`font-bold ${style.accent} text-sm mb-1`}>REFS</h2>{data.references.slice(0, 2).map((r, i) => <p key={i}>{r.name}</p>)}</div>}
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
  const [linkedInWarning, setLinkedInWarning] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  const fileInputRef = useRef(null)
  const headshotInputRef = useRef(null)

  const [rawInfo, setRawInfo] = useState('')
  const [targetJob, setTargetJob] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', location: '', linkedin: '' })
  const [experiences, setExperiences] = useState([{ title: '', company: '', duration: '', description: '' }])
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }])
  const [skills, setSkills] = useState('')
  const [references, setReferences] = useState([{ name: '', designation: '', company: '', email: '', phone: '' }])
  const [prefilledFrom, setPrefilledFrom] = useState(null)
  const [missingKeywordsInfo, setMissingKeywordsInfo] = useState(null)

  // Check for prefilled data from Job Analyzer on mount
  useEffect(() => {
    const loadPrefilledData = () => {
      try {
        const savedData = localStorage.getItem('resumeBuilderData')
        if (savedData) {
          const data = JSON.parse(savedData)
          console.log('Found prefilled data:', data)
          // Only use data if it's recent (within 10 minutes)
          if (data.timestamp && Date.now() - data.timestamp < 10 * 60 * 1000) {
            if (data.resumeText) setRawInfo(data.resumeText)
            if (data.targetJob) setTargetJob(data.targetJob)
            if (data.missingKeywords && data.missingKeywords.length > 0) {
              setMissingKeywordsInfo({
                keywords: data.missingKeywords,
                recommendations: data.recommendations || '',
                matchScore: data.matchScore || 0
              })
            }
            setPrefilledFrom('Job Description Analyzer')
          }
          // Clear the data after reading
          localStorage.removeItem('resumeBuilderData')
        }
      } catch (e) {
        console.log('Error loading prefilled data:', e)
      }
    }
    
    loadPrefilledData()
  }, [])

  const handleHeadshotUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => { setHeadshot(event.target.result); toast({ title: 'Photo Added!' }) }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) { toast({ title: 'Invalid File', variant: 'destructive' }); return }
    setUploading(true)
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await fetch('/api/resume-builder/extract-text', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) { setRawInfo(data.text); setUploadedFileName(file.name); await complete(creditResult.transactionId)
        toast({ title: 'CV Uploaded!' }) }
      else throw new Error(data.error)
    } catch (err) { toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' }) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleGenerate = async () => {
    if (!rawInfo && !personalInfo.name) { toast({ title: 'Missing Info', description: 'Please provide your information', variant: 'destructive' }); return }
    setGenerating(true); setResumeData(null); setLinkedInWarning(null)
    try {
      const res = await fetch('/api/resume-builder/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInfo, targetJob, industry, template, personalInfo: showAdvanced ? personalInfo : null, experiences: showAdvanced ? experiences : null, education: showAdvanced ? education : null, skills: showAdvanced ? skills : null, references: showAdvanced ? references.filter(r => r.name) : null })
      })
      const data = await res.json()
      if (data.success) {
        setResumeData(data.resumeData)
        if (data.linkedInWarning) setLinkedInWarning(data.linkedInWarning)
        
        // Auto-save to library
        try {
          const resumeName = data.resumeData?.name || personalInfo?.name || 'Untitled'
          await saveToLibrary({
            type: 'resume',
            category: 'text',
            title: `Resume: ${resumeName}`,
            description: `${targetJob || 'Professional'} resume for ${industry || 'general'} industry`,
            content: JSON.stringify(data.resumeData),
            metadata: {
              targetJob,
              industry,
              template,
              layout,
              name: resumeName,
              contentType: 'resume'
            }
          })
          console.log('Resume auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save resume:', saveError)
        }
        
        toast({ title: '🎉 Resume Generated!' })
      } else throw new Error(data.error)
    } catch (err) { toast({ title: 'Failed', description: err.message, variant: 'destructive' }) }
    finally { setGenerating(false) }
  }

  const addExperience = () => setExperiences([...experiences, { title: '', company: '', duration: '', description: '' }])
  const removeExperience = (idx) => experiences.length > 1 && setExperiences(experiences.filter((_, i) => i !== idx))
  const updateExperience = (idx, field, value) => { const u = [...experiences]; u[idx][field] = value; setExperiences(u) }
  const addEducation = () => setEducation([...education, { degree: '', school: '', year: '' }])
  const removeEducation = (idx) => education.length > 1 && setEducation(education.filter((_, i) => i !== idx))
  const updateEducation = (idx, field, value) => { const u = [...education]; u[idx][field] = value; setEducation(u) }
  const addReference = () => setReferences([...references, { name: '', designation: '', company: '', email: '', phone: '' }])
  const removeReference = (idx) => references.length > 1 && setReferences(references.filter((_, i) => i !== idx))
  const updateReference = (idx, field, value) => { const u = [...references]; u[idx][field] = value; setReferences(u) }

  const [downloading, setDownloading] = useState(false)

  const downloadResume = useCallback(async () => {
    if (!resumeData) return
    
    const resumeElement = document.getElementById('resume-preview')
    if (!resumeElement) {
      toast({ title: 'Error', description: 'Resume preview not found', variant: 'destructive' })
      return
    }

    setDownloading(true)
    toast({ title: 'Generating PDF...', description: 'Please wait while we create your resume' })

    try {
      // Hide edit icons before capture
      const editIcons = resumeElement.querySelectorAll('.edit-icon, [class*="Edit3"]')
      editIcons.forEach(icon => icon.style.visibility = 'hidden')

      // Capture the resume with high quality
      const canvas = await html2canvas(resumeElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Remove hover effects and edit indicators in cloned document
          const clonedElement = clonedDoc.getElementById('resume-preview')
          if (clonedElement) {
            clonedElement.querySelectorAll('[title="Click to edit"]').forEach(el => {
              el.removeAttribute('title')
              el.style.cursor = 'default'
            })
            clonedElement.querySelectorAll('.lucide-edit-3, .lucide-edit').forEach(el => {
              el.style.display = 'none'
            })
            // Remove any dashed outlines
            clonedElement.querySelectorAll('*').forEach(el => {
              if (el.style) {
                el.style.outline = 'none'
              }
            })
          }
        }
      })

      // Show edit icons again
      editIcons.forEach(icon => icon.style.visibility = 'visible')

      // Calculate PDF dimensions (A4)
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // If the content is longer than one page, we need to handle multi-page
      let heightLeft = imgHeight
      let position = 0
      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Generate filename
      const fileName = `${resumeData.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_Resume.pdf`
      
      // Direct download - no print dialog
      pdf.save(fileName)
      
      toast({ title: '✅ PDF Downloaded!', description: `Saved as ${fileName}` })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' })
    } finally {
      setDownloading(false)
    }
  }, [resumeData, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-indigo-500" />AI Resume Builder</h1>
          <p className="text-muted-foreground mt-1">Create ATS-friendly, professional resumes</p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800"><Briefcase className="h-3 w-3 mr-1" />Job-Ready</Badge>
      </div>

      {!resumeData ? (
        <>
          {/* Pre-filled from Job Analyzer */}
          {prefilledFrom && missingKeywordsInfo && (
            <Card className="bg-blue-50 border-blue-300 border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  ✨ Imported from {prefilledFrom}!
                  <Badge className="bg-blue-200 text-blue-800 ml-2">{missingKeywordsInfo.matchScore}% Match</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-blue-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Missing Keywords to Add:
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(missingKeywordsInfo.keywords)
                        toast({ title: 'Keywords copied!' })
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </Button>
                  </div>
                  <p className="text-blue-700 font-medium text-lg">{missingKeywordsInfo.keywords}</p>
                </div>
                {missingKeywordsInfo.recommendations && (
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Recommendations:</p>
                    <p className="whitespace-pre-line opacity-90">{missingKeywordsInfo.recommendations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warning about LinkedIn */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Important:</strong> LinkedIn blocks direct access to profiles. For best results, please <strong>copy and paste your LinkedIn profile text</strong> (About section, Experience, etc.) instead of just the URL. Go to your LinkedIn profile → Click "More" → "Save to PDF" → Then paste the content here.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">1</span>Your Information</CardTitle>
                <CardDescription>Paste your CV text, LinkedIn profile content, or describe your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input type="file" ref={headshotInputRef} onChange={handleHeadshotUpload} accept="image/*" className="hidden" id="headshot-upload" />
                    <label htmlFor="headshot-upload" className="cursor-pointer">
                      {headshot ? (
                        <div className="relative group">
                          <img src={headshot} alt="Headshot" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"><Camera className="h-6 w-6 text-white" /></div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-indigo-400">
                          <User className="h-6 w-6 text-gray-400" /><span className="text-xs text-gray-500">Photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="text-sm"><p className="font-medium">Add Your Headshot</p><p className="text-xs text-gray-500">Optional professional photo</p>
                    {headshot && <Button variant="ghost" size="sm" className="text-xs mt-1 h-6 px-2" onClick={() => setHeadshot(null)}><X className="h-3 w-3 mr-1" />Remove</Button>}
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-indigo-400">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" className="hidden" id="cv-upload" />
                  {uploadedFileName ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-green-800 font-medium">{uploadedFileName}</span></div>
                      <Button variant="ghost" size="sm" onClick={() => { setUploadedFileName(''); setRawInfo('') }}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <label htmlFor="cv-upload" className="flex flex-col items-center justify-center cursor-pointer py-3">
                      {uploading ? <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /> : <FileUp className="h-8 w-8 text-gray-400" />}
                      <span className="mt-2 text-sm font-medium">{uploading ? 'Extracting...' : 'Upload Existing CV'}</span>
                      <span className="text-xs text-gray-500">PDF, DOC, DOCX, TXT</span>
                    </label>
                  )}
                </div>

                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or paste your info</span></div></div>

                <Textarea
                  placeholder="Paste your actual LinkedIn profile content here (copy from your profile page), or describe your experience:

Example:
John Smith
Software Engineer at Google

About:
10+ years of experience in full-stack development...

Experience:
Senior Software Engineer at Google (2020 - Present)
- Led team of 5 engineers...
- Increased performance by 40%..."
                  className="min-h-[180px]"
                  value={rawInfo}
                  onChange={(e) => setRawInfo(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">2</span>Target Job & Design</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Target Job Title</Label><Input placeholder="e.g., Senior Software Engineer" value={targetJob} onChange={(e) => setTargetJob(e.target.value)} /></div>
                <div className="space-y-2"><Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JOB_INDUSTRIES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Color Theme</Label>
                  <div className="grid grid-cols-6 gap-2">{RESUME_TEMPLATES.map(t => <Button key={t.id} variant={template === t.id ? 'default' : 'outline'} className={`h-auto py-2 flex flex-col items-center text-xs ${template === t.id ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => setTemplate(t.id)}><span className="text-lg">{t.icon}</span><span>{t.name}</span></Button>)}</div>
                </div>
                <div className="space-y-2"><Label>Layout</Label>
                  <div className="grid grid-cols-4 gap-2">{LAYOUT_STYLES.map(l => <Button key={l.id} variant={layout === l.id ? 'default' : 'outline'} className={`h-auto py-2 flex flex-col items-center text-xs ${layout === l.id ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => setLayout(l.id)}><span className="text-lg">{l.icon}</span><span>{l.name}</span></Button>)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options (Personal Info, Experience, References)
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
                  <div className="flex items-center justify-between"><CardTitle className="text-lg">Work Experience</CardTitle><Button variant="outline" size="sm" onClick={addExperience}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                      {experiences.length > 1 && <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => removeExperience(idx)}><Trash2 className="h-3 w-3" /></Button>}
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

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between"><CardTitle className="text-lg">Education</CardTitle><Button variant="outline" size="sm" onClick={addEducation}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {education.map((edu, idx) => (
                    <div key={idx} className="p-3 border rounded-lg relative">
                      {education.length > 1 && <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => removeEducation(idx)}><Trash2 className="h-3 w-3" /></Button>}
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
                        <Input placeholder="School" value={edu.school} onChange={(e) => updateEducation(idx, 'school', e.target.value)} />
                        <Input placeholder="Year" value={edu.year} onChange={(e) => updateEducation(idx, 'year', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* References Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> References</CardTitle>
                      <CardDescription>Add professional references with their designation</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addReference}><Plus className="h-4 w-4 mr-1" />Add Reference</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {references.map((ref, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2 relative">
                      {references.length > 1 && <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => removeReference(idx)}><Trash2 className="h-3 w-3" /></Button>}
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Reference Name" value={ref.name} onChange={(e) => updateReference(idx, 'name', e.target.value)} />
                        <Input placeholder="Job Title / Designation" value={ref.designation} onChange={(e) => updateReference(idx, 'designation', e.target.value)} />
                        <Input placeholder="Company" value={ref.company} onChange={(e) => updateReference(idx, 'company', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Email (optional)" value={ref.email} onChange={(e) => updateReference(idx, 'email', e.target.value)} />
                        <Input placeholder="Phone (optional)" value={ref.phone} onChange={(e) => updateReference(idx, 'phone', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Skills</CardTitle></CardHeader>
                <CardContent>
                  <Textarea placeholder="List your skills: Python, JavaScript, Project Management, Leadership..." className="min-h-[80px]" value={skills} onChange={(e) => setSkills(e.target.value)} />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex items-center gap-3">


            <CreditCostBadge toolId="resume-builder" />


            <Button size="lg" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-14 text-lg" onClick={handleGenerate} disabled={generating || (!rawInfo && !personalInfo.name)}>
            {generating ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Creating Resume...</> : <><Wand2 className="mr-2 h-6 w-6" />Generate Professional Resume</>}
          </Button>


          </div>
        </>
      ) : (
        <div className="space-y-6">
          {linkedInWarning && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">{linkedInWarning} Please edit the resume below to add your actual information.</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your Professional Resume</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResumeData(null); setLinkedInWarning(null) }}><RefreshCw className="h-4 w-4 mr-2" />Start Over</Button>
              <Button onClick={downloadResume} className="bg-green-600 hover:bg-green-700" disabled={downloading}>
                {downloading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating PDF...</> : <><Download className="h-4 w-4 mr-2" />Download PDF</>}
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2"><Label className="text-sm">Theme:</Label>
                <div className="flex gap-1">{RESUME_TEMPLATES.map(t => <Button key={t.id} variant={template === t.id ? 'default' : 'outline'} size="sm" onClick={() => setTemplate(t.id)}>{t.icon}</Button>)}</div>
              </div>
              <div className="flex items-center gap-2"><Label className="text-sm">Layout:</Label>
                <div className="flex gap-1">{LAYOUT_STYLES.map(l => <Button key={l.id} variant={layout === l.id ? 'default' : 'outline'} size="sm" onClick={() => setLayout(l.id)}>{l.icon}</Button>)}</div>
              </div>
              <input type="file" ref={headshotInputRef} onChange={handleHeadshotUpload} accept="image/*" className="hidden" id="headshot-change" />
              <label htmlFor="headshot-change"><Button variant="outline" size="sm" asChild><span><Camera className="h-4 w-4 mr-1" />{headshot ? 'Change' : 'Add'} Photo</span></Button></label>
            </div>
          </Card>

          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-center text-sm text-gray-500 mb-4">💡 Click any text to edit • Add references at the bottom</p>
            <VisualResume data={resumeData} setData={setResumeData} template={template} layout={layout} headshot={headshot} />
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div><h3 className="font-bold text-green-800">Your resume is ready!</h3><p className="text-green-700">Edit any text by clicking, add references, then download.</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
