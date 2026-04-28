'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Video,
  Upload,
  Wand2,
  Play,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Mic,
  Film,
  Type,
  ChevronDown,
  ChevronUp,
  Volume2,
  Loader2,
  Download,
  Eye,
  RefreshCw,
  User,
  Check,
  AlertCircle,
  X,
  FileText,
  Camera,
  Clapperboard,
  Star,
  Settings
} from 'lucide-react'

// =============================================================
// UGC AD STUDIO — Main Page Component
// =============================================================
// Multi-step wizard for creating AI-powered UGC advertisements
// Steps: 1) Avatar Setup → 2) Script → 3) Generate Clips → 4) Preview

const STEPS = [
  { id: 'avatar', label: 'Avatar', icon: User, description: 'Set up your AI avatar' },
  { id: 'script', label: 'Script', icon: FileText, description: 'Generate ad script' },
  { id: 'generate', label: 'Generate', icon: Film, description: 'Create video clips' },
  { id: 'preview', label: 'Preview', icon: Eye, description: 'Review & download' }
]

export default function UGCStudioPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Avatar state
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [newAvatarName, setNewAvatarName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // AI Avatar generation state
  const [avatarMode, setAvatarMode] = useState('upload') // 'upload' or 'ai'
  const [aiAvatarPrompt, setAiAvatarPrompt] = useState('')
  const [aiAvatarPreset, setAiAvatarPreset] = useState('custom')
  const [aiAvatarPresets, setAiAvatarPresets] = useState([])
  const [aiAvatarName, setAiAvatarName] = useState('')
  const [generatingAiAvatar, setGeneratingAiAvatar] = useState(false)

  // Script state
  const [scriptFormats, setScriptFormats] = useState({})
  const [scriptTones, setScriptTones] = useState([])
  const [scriptPlatforms, setScriptPlatforms] = useState({})
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [productImageUrl, setProductImageUrl] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState(null)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)
  const [adFormat, setAdFormat] = useState('hook-story-cta')
  const [adTone, setAdTone] = useState('casual')
  const [adPlatform, setAdPlatform] = useState('tiktok')
  const [adDuration, setAdDuration] = useState(30)
  const [generatingScript, setGeneratingScript] = useState(false)
  const [script, setScript] = useState(null)

  // Voice state
  const [voicePresets, setVoicePresets] = useState([])
  const [voicePresetsByLanguage, setVoicePresetsByLanguage] = useState({})
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [selectedVoice, setSelectedVoice] = useState('en-US-female-casual')

  // Generation state
  const [generatingSegments, setGeneratingSegments] = useState({}) // { segmentUuid: 'audio' | 'video' }
  const [generatedClips, setGeneratedClips] = useState({})
  const [generatedAudios, setGeneratedAudios] = useState({})
  const [clipTier, setClipTier] = useState('pro')
  const [motionStyle, setMotionStyle] = useState('strict') // 'strict' = Kling Avatar v2 (exact lip-sync) | 'natural' = Seedance 2 Reference (more body motion)
  const [batchProgress, setBatchProgress] = useState(null) // { total, completed, type }

  // Project state
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [showProjectList, setShowProjectList] = useState(false)

  // Final render state
  const [rendering, setRendering] = useState(false)
  const [renderJobId, setRenderJobId] = useState(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState(null)
  const [renderError, setRenderError] = useState('')

  // Script edit state
  const [scriptEditMode, setScriptEditMode] = useState(false)

  // Recalculate wordCount + duration when a segment's text changes (matches backend rule: ≥4s, ~2.5 wps)
  const recomputeSegment = (seg) => {
    const text = seg.text || ''
    const cleanedText = text.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '').trim()
    const words = cleanedText.length === 0 ? 0 : cleanedText.split(/\s+/).length
    const duration = Math.max(4, Math.round(words / 2.5))
    return { ...seg, wordCount: words, duration }
  }

  const updateSegment = (uuid, updates) => {
    setScript(prev => {
      if (!prev) return prev
      const segments = prev.segments.map(s => {
        if (s.uuid !== uuid) return s
        const merged = { ...s, ...updates }
        return updates.text !== undefined ? recomputeSegment(merged) : merged
      })
      const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 4), 0)
      return { ...prev, segments, totalDuration }
    })
  }

  const addSegment = (afterIdx, type = 'talking') => {
    setScript(prev => {
      if (!prev) return prev
      const newSeg = recomputeSegment({
        uuid: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `seg-${Date.now()}`,
        id: 0,
        type,
        text: type === 'talking' ? 'Add your line here...' : 'Product showcase',
        brollCue: type === 'broll' ? 'Product on table, hands reaching in' : '',
        emotion: 'genuine',
        cameraNote: 'selfie-angle'
      })
      const segments = [...prev.segments]
      segments.splice(afterIdx + 1, 0, newSeg)
      // Re-id sequentially
      segments.forEach((s, i) => { s.id = i + 1 })
      const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 4), 0)
      return { ...prev, segments, totalDuration }
    })
  }

  const deleteSegment = (uuid) => {
    setScript(prev => {
      if (!prev || prev.segments.length <= 1) return prev
      const segments = prev.segments.filter(s => s.uuid !== uuid)
      segments.forEach((s, i) => { s.id = i + 1 })
      const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 4), 0)
      // Also clear any generated audio/clip for the deleted segment
      setGeneratedAudios(prev => {
        const next = { ...prev }
        delete next[uuid]
        return next
      })
      setGeneratedClips(prev => {
        const next = { ...prev }
        delete next[uuid]
        return next
      })
      return { ...prev, segments, totalDuration }
    })
  }

  // Helper to get auth headers
  const getAuthHeaders = (isJson = true) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (isJson) headers['Content-Type'] = 'application/json'
    return headers
  }

  // Fetch initial data
  useEffect(() => {
    fetchAvatars()
    fetchScriptOptions()
    fetchVoicePresets()
    fetchAiAvatarPresets()
  }, [])

  const fetchAvatars = async () => {
    try {
      const res = await fetch('/api/ugc-studio/avatars', { headers: getAuthHeaders(false) })
      const data = await res.json()
      if (data.success) setAvatars(data.avatars || [])
    } catch (e) {
      console.error('Failed to fetch avatars:', e)
    }
  }

  const fetchScriptOptions = async () => {
    try {
      const res = await fetch('/api/ugc-studio/generate-script')
      const data = await res.json()
      if (data.success) {
        setScriptFormats(data.formats || {})
        setScriptTones(data.tones || [])
        setScriptPlatforms(data.platforms || {})
      }
    } catch (e) {
      console.error('Failed to fetch script options:', e)
    }
  }

  const fetchVoicePresets = async () => {
    try {
      const res = await fetch('/api/ugc-studio/generate-audio')
      const data = await res.json()
      if (data.success) {
        setVoicePresets(data.voicePresets || [])
        setVoicePresetsByLanguage(data.voicePresetsByLanguage || {})
      }
    } catch (e) {
      console.error('Failed to fetch voice presets:', e)
    }
  }

  // Auto-select a voice that matches the avatar's gender + currently picked language.
  // Runs whenever the avatar OR the language changes.
  useEffect(() => {
    if (!selectedAvatar || voicePresets.length === 0) return
    const desiredGender = selectedAvatar.gender // 'male' | 'female' | null
    const langVoices = voicePresetsByLanguage[selectedLanguage] || []
    if (langVoices.length === 0) return

    // Prefer matching gender; fall back to first voice in that language.
    const match = (desiredGender && langVoices.find(v => v.gender === desiredGender)) || langVoices[0]
    if (match && match.id !== selectedVoice) {
      setSelectedVoice(match.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAvatar?._id, selectedLanguage, voicePresets.length])

  const fetchAiAvatarPresets = async () => {
    try {
      const res = await fetch('/api/ugc-studio/generate-avatar')
      const data = await res.json()
      if (data.success) setAiAvatarPresets(data.presets || [])
    } catch (e) {
      console.error('Failed to fetch AI avatar presets:', e)
    }
  }

  // =================== AI AVATAR GENERATION ===================

  const handleGenerateAiAvatar = async () => {
    const prompt = aiAvatarPreset === 'custom' ? aiAvatarPrompt.trim() : ''
    
    if (aiAvatarPreset === 'custom' && !prompt) {
      setError('Please describe your avatar or select a preset')
      return
    }

    setGeneratingAiAvatar(true)
    setError('')

    try {
      const res = await fetch('/api/ugc-studio/generate-avatar', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt,
          preset: aiAvatarPreset,
          name: aiAvatarName.trim() || (aiAvatarPreset !== 'custom' 
            ? aiAvatarPresets.find(p => p.id === aiAvatarPreset)?.name || 'AI Avatar'
            : 'AI Avatar'),
          additionalDetails: ''
        })
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate AI avatar')
      }

      if (data.avatar) {
        setAvatars(prev => [data.avatar, ...prev])
        setSelectedAvatar(data.avatar)
      }

      setAiAvatarPrompt('')
      setAiAvatarName('')
      setSuccess(`AI Avatar generated! (${data.creditsUsed} credits used)`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e.message)
    } finally {
      setGeneratingAiAvatar(false)
    }
  }

  // =================== AVATAR HANDLERS ===================

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
    setError('')
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile || !newAvatarName.trim()) {
      setError('Please provide both a name and image for your avatar')
      return
    }

    setUploadingAvatar(true)
    setError('')

    try {
      // Upload the image first
      const formData = new FormData()
      formData.append('file', avatarFile)

      const uploadRes = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // Save as UGC avatar
      const saveRes = await fetch('/api/ugc-studio/avatars', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newAvatarName.trim(),
          imageUrl: uploadData.url,
          type: 'uploaded'
        })
      })
      const saveData = await saveRes.json()

      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to save avatar')
      }

      setAvatars(prev => [saveData.avatar, ...prev])
      setSelectedAvatar(saveData.avatar)
      setNewAvatarName('')
      setAvatarFile(null)
      setAvatarPreview(null)
      setSuccess('Avatar created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async (avatarId) => {
    try {
      const res = await fetch(`/api/ugc-studio/avatars?avatarId=${avatarId}`, { method: 'DELETE', headers: getAuthHeaders(false) })
      const data = await res.json()
      if (data.success) {
        setAvatars(prev => prev.filter(a => a._id !== avatarId))
        if (selectedAvatar?._id === avatarId) setSelectedAvatar(null)
      }
    } catch (e) {
      setError('Failed to delete avatar')
    }
  }

  // =================== PRODUCT IMAGE HANDLER ===================

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Product image must be less than 10MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setProductImagePreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploadingProductImage(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setProductImageUrl(data.url)
      setSuccess('Product image uploaded!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
      setProductImagePreview(null)
    } finally {
      setUploadingProductImage(false)
    }
  }

  const handleRemoveProductImage = () => {
    setProductImageUrl(null)
    setProductImagePreview(null)
  }

  // =================== SCRIPT HANDLERS ===================

  const handleGenerateScript = async () => {
    if (!productName.trim() || !productDescription.trim()) {
      setError('Please provide product name and description')
      return
    }

    setGeneratingScript(true)
    setError('')

    try {
      const res = await fetch('/api/ugc-studio/generate-script', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          targetAudience: targetAudience.trim(),
          format: adFormat,
          tone: adTone,
          platform: adPlatform,
          duration: adDuration
        })
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate script')
      }

      setScript(data.script)
      setGeneratedClips({})
      setGeneratedAudios({})
      setSuccess(`Script generated! (${data.creditsUsed} credits used)`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setGeneratingScript(false)
    }
  }

  // =================== AUDIO/VIDEO GENERATION HANDLERS ===================

  const handleGenerateAudio = async (segment) => {
    if (!segment.text) return

    setGeneratingSegments(prev => ({ ...prev, [segment.uuid]: 'audio' }))
    setError('')

    try {
      const res = await fetch('/api/ugc-studio/generate-audio', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: segment.text,
          voicePreset: selectedVoice,
          emotion: segment.emotion || '',
          segmentId: segment.uuid
        })
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio')
      }

      setGeneratedAudios(prev => ({
        ...prev,
        [segment.uuid]: data.audio
      }))
    } catch (e) {
      setError(`Audio generation failed: ${e.message}`)
    } finally {
      setGeneratingSegments(prev => {
        const next = { ...prev }
        delete next[segment.uuid]
        return next
      })
    }
  }

  // =================== POLLING HELPER (supports parallel) ===================

  const pollJobStatus = async (endpoint, jobId, segmentUuid, clipType) => {
    const maxAttempts = 120 // 10 minutes (5s * 120)
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

      try {
        const res = await fetch(`${endpoint}?jobId=${jobId}`, {
          headers: getAuthHeaders(false)
        })
        const data = await res.json()

        if (!data.success) continue

        if (data.job.status === 'completed' && data.job.videoUrl) {
          setGeneratedClips(prev => ({
            ...prev,
            [segmentUuid]: {
              id: jobId,
              url: data.job.videoUrl,
              type: clipType,
              creditsCost: data.job.creditsCost || 0,
              engine: data.job.engine || ''
            }
          }))
          setGeneratingSegments(prev => {
            const next = { ...prev }
            delete next[segmentUuid]
            return next
          })
          return 'completed'
        }

        if (data.job.status === 'failed') {
          setGeneratingSegments(prev => {
            const next = { ...prev }
            delete next[segmentUuid]
            return next
          })
          setError(`Segment failed: ${data.job.error || 'Unknown error'}`)
          return 'failed'
        }
      } catch (e) {
        console.warn('Poll error:', e)
      }
    }

    // Timeout
    setGeneratingSegments(prev => {
      const next = { ...prev }
      delete next[segmentUuid]
      return next
    })
    return 'timeout'
  }

  const handleGenerateTalkingHead = async (segment) => {
    if (!selectedAvatar?.imageUrl) {
      setError('Please select an avatar first')
      return
    }

    const audio = generatedAudios[segment.uuid]
    if (!audio?.url) {
      setError('Please generate audio for this segment first')
      return
    }

    setGeneratingSegments(prev => ({ ...prev, [segment.uuid]: 'video' }))
    setError('')

    try {
      const baseUrl = window.location.origin
      const absoluteAudioUrl = audio.url.startsWith('http') ? audio.url : `${baseUrl}${audio.url}`

      const res = await fetch('/api/ugc-studio/generate-talking-head', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          avatarImageUrl: selectedAvatar.imageUrl.startsWith('http') 
            ? selectedAvatar.imageUrl 
            : `${baseUrl}${selectedAvatar.imageUrl}`,
          audioUrl: absoluteAudioUrl,
          // Pass raw scene guidance from B-roll cue — keep it minimal
          prompt: segment.brollCue 
            ? segment.brollCue.replace(/[{}]/g, '').trim()
            : '',
          tier: clipTier,
          motionStyle,
          aspectRatio: script?.aspectRatio || '9:16',
          estimatedDuration: segment.duration || 5,
          avatarId: selectedAvatar._id
        })
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to start talking head generation')
      }

      pollJobStatus('/api/ugc-studio/generate-talking-head', data.jobId, segment.uuid, 'talking-head')
    } catch (e) {
      setError(`Talking head generation failed: ${e.message}`)
      setGeneratingSegments(prev => {
        const next = { ...prev }
        delete next[segment.uuid]
        return next
      })
    }
  }

  const handleGenerateBroll = async (segment) => {
    setGeneratingSegments(prev => ({ ...prev, [segment.uuid]: 'video' }))
    setError('')

    try {
      const baseUrl = window.location.origin
      let refImageUrl = null
      if (productImageUrl) {
        refImageUrl = productImageUrl.startsWith('http') ? productImageUrl : `${baseUrl}${productImageUrl}`
      }

      const res = await fetch('/api/ugc-studio/generate-broll', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: segment.brollCue || segment.text || 'Product showcase',
          template: 'product-closeup',
          duration: Math.min(12, Math.max(4, segment.duration || 5)),
          aspectRatio: script?.aspectRatio || '9:16',
          referenceImageUrl: refImageUrl
        })
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to start B-roll generation')
      }

      pollJobStatus('/api/ugc-studio/generate-broll', data.jobId, segment.uuid, 'broll')
    } catch (e) {
      setError(`B-roll generation failed: ${e.message}`)
      setGeneratingSegments(prev => {
        const next = { ...prev }
        delete next[segment.uuid]
        return next
      })
    }
  }

  // =================== BATCH GENERATION ===================

  const handleGenerateAllAudio = async () => {
    if (!script?.segments) return
    const talkingSegments = script.segments.filter(s => s.type === 'talking' && !generatedAudios[s.uuid])
    if (talkingSegments.length === 0) {
      setSuccess('All audio already generated!')
      setTimeout(() => setSuccess(''), 2000)
      return
    }

    setBatchProgress({ total: talkingSegments.length, completed: 0, type: 'audio' })

    for (const seg of talkingSegments) {
      await handleGenerateAudio(seg)
      setBatchProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null)
    }

    setBatchProgress(null)
    setSuccess(`All ${talkingSegments.length} audio clips generated!`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleGenerateAllVideos = async () => {
    if (!script?.segments || !selectedAvatar) return
    
    const segmentsToGenerate = script.segments.filter(s => !generatedClips[s.uuid])
    if (segmentsToGenerate.length === 0) {
      setSuccess('All videos already generated!')
      setTimeout(() => setSuccess(''), 2000)
      return
    }

    // First, ensure all talking segments have audio
    const talkingWithoutAudio = segmentsToGenerate.filter(s => s.type === 'talking' && !generatedAudios[s.uuid])
    if (talkingWithoutAudio.length > 0) {
      setBatchProgress({ total: talkingWithoutAudio.length, completed: 0, type: 'audio' })
      for (const seg of talkingWithoutAudio) {
        await handleGenerateAudio(seg)
        setBatchProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null)
      }
    }

    // Now launch all video generations in parallel
    setBatchProgress({ total: segmentsToGenerate.length, completed: 0, type: 'video' })

    const promises = segmentsToGenerate.map(async (seg) => {
      if (seg.type === 'talking') {
        // Need to wait for audio state to be available
        await new Promise(resolve => setTimeout(resolve, 500))
        await handleGenerateTalkingHead(seg)
      } else {
        await handleGenerateBroll(seg)
      }
    })

    // Launch all, don't await them (they're polling in background)
    await Promise.allSettled(promises)
  }

  // Track batch progress from generatedClips changes
  useEffect(() => {
    if (batchProgress && batchProgress.type === 'video' && script?.segments) {
      const total = script.segments.filter(s => !generatedClips[s.uuid]).length
      const activeGenerating = Object.keys(generatingSegments).length
      
      if (activeGenerating === 0 && batchProgress.total > 0) {
        setBatchProgress(null)
      }
    }
  }, [generatedClips, generatingSegments])

  // =================== NAVIGATION ===================

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!selectedAvatar
      case 1: return !!script && script.segments?.length > 0
      case 2: return true // Always allow proceeding — user decides when enough clips are done
      default: return true
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setError('')
    }
  }

  // =================== RENDER HELPERS ===================

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep
        const isCompleted = idx < currentStep
        const StepIcon = step.icon

        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <div className={`h-0.5 w-8 md:w-16 transition-colors ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
            )}
            <button
              onClick={() => idx <= currentStep ? setCurrentStep(idx) : null}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
                ${isActive ? 'bg-primary text-primary-foreground shadow-md' : ''}
                ${isCompleted ? 'bg-primary/10 text-primary cursor-pointer' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                ${isActive ? 'bg-primary-foreground text-primary' : ''}
                ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                ${!isActive && !isCompleted ? 'bg-background text-muted-foreground border' : ''}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden md:inline font-medium">{step.label}</span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )

  // =================== STEP 1: AVATAR ===================

  const renderAvatarStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose Your AI Avatar</h2>
        <p className="text-muted-foreground mt-1">Upload a photo or generate a realistic AI avatar from a description</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setAvatarMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${avatarMode === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          <Upload className="w-4 h-4" /> Upload Photo
        </button>
        <button
          onClick={() => setAvatarMode('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${avatarMode === 'ai' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          <Wand2 className="w-4 h-4" /> Generate with AI
        </button>
      </div>

      {/* Upload Mode */}
      {avatarMode === 'upload' && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <label
                  htmlFor="avatar-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer
                    bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="h-full w-auto max-w-full object-contain rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Click to upload avatar photo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP — Max 5MB</p>
                    </>
                  )}
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                </label>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Avatar Name</label>
                  <Input
                    placeholder="e.g., Sarah - Casual"
                    value={newAvatarName}
                    onChange={(e) => setNewAvatarName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground">📸 Tips for natural UGC results:</p>
                  <p className="text-muted-foreground">• <b>Half-body or full-body</b> photo (not just face)</p>
                  <p className="text-muted-foreground">• Hands and arms visible for natural gestures</p>
                  <p className="text-muted-foreground">• Good lighting, plain background</p>
                  <p className="text-muted-foreground">• Natural pose — as if talking to camera</p>
                </div>
                <Button
                  onClick={handleUploadAvatar}
                  disabled={!avatarFile || !newAvatarName.trim() || uploadingAvatar}
                  className="w-full"
                >
                  {uploadingAvatar ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Create Avatar</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Generate Mode */}
      {avatarMode === 'ai' && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" /> AI Avatar Generator
            </CardTitle>
            <CardDescription>
              Generate a realistic, natural-looking avatar portrait — perfect for talking-head videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Grid */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Presets</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {aiAvatarPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setAiAvatarPreset(preset.id)}
                    className={`text-left p-3 rounded-lg border transition-all text-sm
                      ${aiAvatarPreset === preset.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                    `}
                  >
                    <p className="font-medium text-xs">{preset.name}</p>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{preset.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt (shown when custom is selected) */}
            {aiAvatarPreset === 'custom' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Describe Your Avatar</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., A friendly woman in her late 20s with dark curly hair, warm brown eyes, wearing a casual blue top, genuine smile..."
                  value={aiAvatarPrompt}
                  onChange={(e) => setAiAvatarPrompt(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific about appearance, age, expression, and clothing. Our AI enhances your prompt for photorealistic results.
                </p>
              </div>
            )}

            {/* Avatar Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Avatar Name (optional)</label>
              <Input
                placeholder="e.g., AI Sarah"
                value={aiAvatarName}
                onChange={(e) => setAiAvatarName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-foreground">✨ AI Enhancement Applied Automatically:</p>
              <p className="text-muted-foreground">• Professional headshot framing</p>
              <p className="text-muted-foreground">• Studio lighting & clean background</p>
              <p className="text-muted-foreground">• Natural skin texture & photorealistic quality</p>
              <p className="text-muted-foreground">• Optimized for talking-head video generation</p>
            </div>

            <Button
              onClick={handleGenerateAiAvatar}
              disabled={generatingAiAvatar || (aiAvatarPreset === 'custom' && !aiAvatarPrompt.trim())}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generatingAiAvatar ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating AI Avatar (~30s)...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Generate AI Avatar (15 credits)</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved Avatars */}
      {avatars.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Avatars</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {avatars.map(avatar => (
              <div
                key={avatar._id}
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                  ${selectedAvatar?._id === avatar._id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                `}
              >
                <div className="aspect-square bg-muted">
                  <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{avatar.name}</p>
                  <p className="text-xs text-muted-foreground">Used {avatar.usageCount || 0} times</p>
                </div>
                {selectedAvatar?._id === avatar._id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(avatar._id) }}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // =================== STEP 2: SCRIPT ===================

  const renderScriptStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Generate Your Ad Script</h2>
        <p className="text-muted-foreground mt-1">Tell us about your product and we'll create a high-converting UGC script</p>
      </div>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Product Name *</label>
              <Input
                placeholder="e.g., GlowSkin Serum"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Audience</label>
              <Input
                placeholder="e.g., Women 25-35 interested in skincare"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Product Description *</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe your product, its benefits, what makes it special..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Product Image Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Product Image (optional but recommended)</label>
            <p className="text-xs text-muted-foreground mb-2">Upload a real product photo — it will be used as a reference for B-roll clips to make your ads more authentic</p>
            
            {productImagePreview || productImageUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative group w-32 h-32 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                  <img 
                    src={productImagePreview || productImageUrl} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                  {uploadingProductImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={handleRemoveProductImage}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Product image uploaded
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This image will be used as a reference when generating B-roll clips for product close-ups, unboxing shots, and lifestyle visuals.
                  </p>
                  <label htmlFor="product-image-replace" className="inline-flex items-center gap-1 text-xs text-primary cursor-pointer mt-2 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Replace image
                  </label>
                  <input id="product-image-replace" type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                </div>
              </div>
            ) : (
              <label
                htmlFor="product-image-upload"
                className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload product photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP — Max 10MB</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Used for realistic B-roll generation</p>
                </div>
                <input id="product-image-upload" type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Script Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> Script Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Format */}
            <div>
              <label className="text-sm font-medium mb-1 block">Ad Format</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adFormat}
                onChange={(e) => setAdFormat(e.target.value)}
              >
                {Object.entries(scriptFormats).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
            {/* Tone */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tone</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adTone}
                onChange={(e) => setAdTone(e.target.value)}
              >
                {scriptTones.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            {/* Platform + Format (with aspect ratio) */}
            <div>
              <label className="text-sm font-medium mb-1 block">Platform & Format</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adPlatform}
                onChange={(e) => setAdPlatform(e.target.value)}
              >
                {Object.entries(scriptPlatforms || {}).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label || key} ({cfg.aspectRatio || '9:16'})
                  </option>
                ))}
              </select>
              {scriptPlatforms?.[adPlatform] && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Aspect ratio: <span className="font-medium">{scriptPlatforms[adPlatform].aspectRatio}</span>
                  {' · '}
                  Recommended: {scriptPlatforms[adPlatform].minDuration}–{scriptPlatforms[adPlatform].maxDuration}s
                </p>
              )}
            </div>
            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-1 block">Duration (seconds)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adDuration}
                onChange={(e) => setAdDuration(parseInt(e.target.value))}
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerateScript}
            disabled={!productName.trim() || !productDescription.trim() || generatingScript}
            className="w-full mt-6"
          >
            {generatingScript ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Script...</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" /> Generate Ad Script (3 credits)</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Script Display + Inline Editor */}
      {script && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 flex-shrink-0" />
                {scriptEditMode ? (
                  <Input
                    value={script.title || ''}
                    onChange={(e) => setScript(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Script title"
                    className="h-7 text-sm flex-1 max-w-[300px]"
                  />
                ) : (
                  <span className="truncate">{script.title || 'Generated Script'}</span>
                )}
              </CardTitle>
              <div className="flex gap-2 items-center">
                <Badge variant="outline">{script.format}</Badge>
                <Badge variant="secondary">{script.totalDuration}s</Badge>
                {script.aspectRatio && <Badge variant="outline">{script.aspectRatio}</Badge>}
                <Button
                  size="sm"
                  variant={scriptEditMode ? 'default' : 'outline'}
                  onClick={() => setScriptEditMode(v => !v)}
                  className="h-7"
                >
                  {scriptEditMode ? '✓ Done Editing' : '✏️ Edit Script'}
                </Button>
              </div>
            </div>

            {/* Hook (editable) */}
            <div className="mt-3">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">🎣 Hook</label>
              {scriptEditMode ? (
                <Input
                  value={script.hook || ''}
                  onChange={(e) => setScript(prev => ({ ...prev, hook: e.target.value }))}
                  placeholder="Opening mid-thought line"
                  className="mt-1"
                />
              ) : (
                <CardDescription className="text-sm font-medium text-primary mt-1">
                  "{script.hook || '—'}"
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {script.segments?.map((seg, idx) => (
                <div key={seg.uuid || idx} className={`p-3 rounded-lg
                  ${seg.type === 'broll' ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50 border border-border'}
                `}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${seg.type === 'broll' ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'}
                    `}>
                      {seg.type === 'broll' ? <Camera className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {scriptEditMode ? (
                          <select
                            value={seg.type}
                            onChange={(e) => updateSegment(seg.uuid, { type: e.target.value })}
                            className="h-6 text-[10px] rounded border border-input bg-background px-1"
                          >
                            <option value="talking">Talking</option>
                            <option value="broll">B-Roll</option>
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {seg.type === 'broll' ? 'B-Roll' : 'Talking'}
                          </Badge>
                        )}
                        {seg.emotion && <Badge variant="secondary" className="text-[10px]">{seg.emotion}</Badge>}
                        <span className="text-xs text-muted-foreground">~{seg.duration}s ({seg.wordCount || 0} words)</span>
                      </div>

                      {scriptEditMode ? (
                        <textarea
                          value={seg.text || ''}
                          onChange={(e) => updateSegment(seg.uuid, { text: e.target.value })}
                          rows={2}
                          className="w-full mt-1 rounded-md border border-input bg-background px-2 py-1 text-sm resize-y"
                          placeholder="Segment text..."
                        />
                      ) : (
                        <p className="text-sm">{seg.text}</p>
                      )}

                      {scriptEditMode ? (
                        <div className="mt-2 space-y-1">
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">🎬 B-Roll Cue / Action</label>
                            <Input
                              value={seg.brollCue || ''}
                              onChange={(e) => updateSegment(seg.uuid, { brollCue: e.target.value })}
                              placeholder="What's shown visually (camera move, action, product shot)"
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">📷 Camera Note</label>
                            <Input
                              value={seg.cameraNote || ''}
                              onChange={(e) => updateSegment(seg.uuid, { cameraNote: e.target.value })}
                              placeholder="selfie-angle / POV / fast-zoom / etc."
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {seg.brollCue && <p className="text-xs text-muted-foreground mt-1 italic">🎬 {seg.brollCue}</p>}
                          {seg.cameraNote && <p className="text-xs text-muted-foreground">📷 {seg.cameraNote}</p>}
                        </>
                      )}
                    </div>

                    {scriptEditMode && (
                      <button
                        onClick={() => deleteSegment(seg.uuid)}
                        className="flex-shrink-0 text-destructive hover:bg-destructive/10 p-1 rounded"
                        title="Delete segment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {scriptEditMode && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => addSegment(idx, 'talking')}>
                        + Talking after
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => addSegment(idx, 'broll')}>
                        + B-Roll after
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA (editable) */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <label className="text-[10px] uppercase tracking-wide text-green-700 font-semibold block mb-1">📢 CTA</label>
              {scriptEditMode ? (
                <Input
                  value={script.cta || ''}
                  onChange={(e) => setScript(prev => ({ ...prev, cta: e.target.value }))}
                  placeholder="Soft, non-salesy closing line"
                  className="bg-white"
                />
              ) : (
                <p className="text-sm font-medium text-green-700">{script.cta || '—'}</p>
              )}
            </div>

            {/* Hashtags (editable as comma-separated) */}
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold block mb-1">Hashtags</label>
              {scriptEditMode ? (
                <Input
                  value={(script.hashtags || []).join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`)
                    setScript(prev => ({ ...prev, hashtags: tags }))
                  }}
                  placeholder="#tag1, #tag2, #tag3"
                  className="text-xs"
                />
              ) : script.hashtags?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {script.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-primary">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No hashtags</p>
              )}
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleGenerateScript} disabled={generatingScript || scriptEditMode}>
                <RefreshCw className={`w-3 h-3 mr-1 ${generatingScript ? 'animate-spin' : ''}`} /> Regenerate
              </Button>
              {scriptEditMode && (
                <p className="text-[11px] text-muted-foreground self-center italic">
                  Edits are saved live. Durations auto-update as you type.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // =================== STEP 3: GENERATE CLIPS ===================

  const renderGenerateStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Generate Video Clips</h2>
        <p className="text-muted-foreground mt-1">Generate audio and video for each segment of your script</p>
      </div>

      {/* Settings Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avatar:</span>
              <div className="flex items-center gap-1.5">
                <img src={selectedAvatar?.imageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm">{selectedAvatar?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Language:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {Object.keys(voicePresetsByLanguage).length > 0
                  ? Object.keys(voicePresetsByLanguage).map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))
                  : <option value="en-US">en-US</option>
                }
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Voice:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm min-w-[220px]"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {(() => {
                  const langVoices = voicePresetsByLanguage[selectedLanguage] || voicePresets
                  const female = langVoices.filter(v => v.gender === 'female')
                  const male = langVoices.filter(v => v.gender === 'male')
                  const other = langVoices.filter(v => v.gender !== 'female' && v.gender !== 'male')
                  return (
                    <>
                      {female.length > 0 && (
                        <optgroup label="Female">
                          {female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      )}
                      {male.length > 0 && (
                        <optgroup label="Male">
                          {male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      )}
                      {other.length > 0 && (
                        <optgroup label="Other">
                          {other.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      )}
                    </>
                  )
                })()}
              </select>
              {selectedAvatar?.gender && (
                <span className="text-xs text-muted-foreground italic">
                  auto-matched to {selectedAvatar.gender} avatar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quality:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={clipTier}
                onChange={(e) => setClipTier(e.target.value)}
              >
                <option value="standard">Standard 720p (63 cr / 15s · scales)</option>
                <option value="pro">Pro 1080p · 48fps (125 cr / 15s · scales)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Motion:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={motionStyle}
                onChange={(e) => setMotionStyle(e.target.value)}
                title="Strict = exact lip-sync to your script. Natural = more body motion but may rephrase slightly."
              >
                <option value="strict">🎯 Strict — exact lip-sync</option>
                <option value="natural">💃 Natural — more body motion</option>
              </select>
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                {motionStyle === 'strict' ? 'Kling Avatar v2 (recommended for talking heads)' : 'Seedance 2 Ref (cinematic motion)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions + Progress */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateAllAudio}
                disabled={Object.keys(generatingSegments).length > 0}
              >
                <Volume2 className="w-3.5 h-3.5 mr-1.5" /> Generate All Audio
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateAllVideos}
                disabled={Object.keys(generatingSegments).length > 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" /> Generate All Clips
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{Object.keys(generatedClips).length}</span>
              /{script?.segments?.length || 0} clips ready
              {Object.keys(generatingSegments).length > 0 && (
                <span className="ml-2 text-primary">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  {Object.keys(generatingSegments).length} generating...
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(Object.keys(generatingSegments).length > 0 || batchProgress) && (
            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, (Object.keys(generatedClips).length / Math.max(1, script?.segments?.length || 1)) * 100)}%`
                  }}
                />
              </div>
              {batchProgress && (
                <p className="text-xs text-muted-foreground mt-1">
                  {batchProgress.type === 'audio' ? '🎙️' : '🎬'} Batch {batchProgress.type}: {batchProgress.completed}/{batchProgress.total} complete
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Image Reference Indicator */}
      {productImageUrl && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <img src={productImagePreview || productImageUrl} alt="Product" className="w-10 h-10 rounded-md object-cover border" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Product image will be used for B-roll</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Your uploaded product photo will serve as a reference for generating realistic B-roll clips</p>
          </div>
          <Camera className="w-4 h-4 text-blue-500" />
        </div>
      )}

      {/* Segments */}
      <div className="space-y-4">
        {script?.segments?.map((seg, idx) => {
          const hasAudio = !!generatedAudios[seg.uuid]
          const hasVideo = !!generatedClips[seg.uuid]
          const isGeneratingAudio = generatingSegments[seg.uuid] === 'audio'
          const isGeneratingVideo = generatingSegments[seg.uuid] === 'video'
          const isTalking = seg.type === 'talking'

          return (
            <Card key={seg.uuid || idx} className={hasVideo ? 'border-green-300 dark:border-green-700' : ''}>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Segment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${seg.type === 'broll' ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'}
                      `}>
                        {idx + 1}
                      </span>
                      <Badge variant={seg.type === 'broll' ? 'default' : 'outline'}>
                        {seg.type === 'broll' ? '🎬 B-Roll' : '🗣️ Talking'}
                      </Badge>
                      {seg.emotion && <Badge variant="secondary" className="text-xs">{seg.emotion}</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">~{seg.duration}s · {seg.wordCount || '?'}w</span>
                    </div>
                    <p className="text-sm mb-2">{seg.text}</p>
                    {seg.brollCue && (
                      <p className="text-xs text-muted-foreground italic mb-2">🎬 {seg.brollCue}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {isTalking ? (
                        <>
                          {/* Step 1: Generate Audio */}
                          <Button
                            size="sm"
                            variant={hasAudio ? 'outline' : 'default'}
                            onClick={() => handleGenerateAudio(seg)}
                            disabled={isGeneratingAudio || isGeneratingVideo}
                          >
                            {isGeneratingAudio ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating Audio...</>
                            ) : hasAudio ? (
                              <><Check className="w-3 h-3 mr-1" /> Audio Ready</>
                            ) : (
                              <><Volume2 className="w-3 h-3 mr-1" /> Generate Audio</>
                            )}
                          </Button>

                          {/* Step 2: Generate Talking Head (needs audio first) */}
                          <Button
                            size="sm"
                            variant={hasVideo ? 'outline' : 'default'}
                            onClick={() => handleGenerateTalkingHead(seg)}
                            disabled={!hasAudio || isGeneratingAudio || isGeneratingVideo}
                          >
                            {isGeneratingVideo ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating (~2 min)...</>
                            ) : hasVideo ? (
                              <><Check className="w-3 h-3 mr-1" /> Video Ready</>
                            ) : (
                              <><Video className="w-3 h-3 mr-1" /> Generate Talking Head</>
                            )}
                          </Button>
                        </>
                      ) : (
                        /* B-Roll: Direct generation */
                        <Button
                          size="sm"
                          variant={hasVideo ? 'outline' : 'default'}
                          onClick={() => handleGenerateBroll(seg)}
                          disabled={isGeneratingVideo}
                        >
                          {isGeneratingVideo ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating (~2 min)...</>
                          ) : hasVideo ? (
                            <><Check className="w-3 h-3 mr-1" /> B-Roll Ready</>
                          ) : (
                            <><Film className="w-3 h-3 mr-1" /> Generate B-Roll</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview Column */}
                  <div className="w-full md:w-48 flex-shrink-0">
                    {hasVideo && generatedClips[seg.uuid]?.url ? (
                      <div className="rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[200px]">
                        <video
                          src={generatedClips[seg.uuid].url}
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      </div>
                    ) : hasAudio && generatedAudios[seg.uuid]?.url ? (
                      <div className="rounded-lg bg-muted p-3 flex flex-col items-center justify-center gap-2 aspect-[9/16] max-h-[200px]">
                        <Volume2 className="w-8 h-8 text-muted-foreground" />
                        <audio src={generatedAudios[seg.uuid].url} controls className="w-full" />
                        <p className="text-xs text-muted-foreground">Audio ready</p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted flex items-center justify-center aspect-[9/16] max-h-[200px]">
                        <div className="text-center p-3">
                          {seg.type === 'broll' ? (
                            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                          )}
                          <p className="text-xs text-muted-foreground">Not generated</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  // =================== STEP 4: PREVIEW ===================

  const renderPreviewStep = () => {
    const completedClips = script?.segments
      ?.filter(seg => generatedClips[seg.uuid]?.url)
      ?.map(seg => ({
        ...seg,
        clip: generatedClips[seg.uuid]
      })) || []

    const totalCreditsUsed = completedClips.reduce((sum, c) => sum + (c.clip.creditsCost || 0), 0)
    const allClipsReady = completedClips.length > 0 && completedClips.length === (script?.segments?.length || 0)

    const handleRenderFinal = async () => {
      if (completedClips.length === 0) return
      setRendering(true)
      setRenderError('')
      setFinalVideoUrl(null)
      try {
        const baseUrl = window.location.origin
        const clipsPayload = completedClips.map(c => ({
          url: c.clip.url.startsWith('http') ? c.clip.url : `${baseUrl}${c.clip.url}`,
          duration: c.duration || 5,
          type: c.clip.type || 'unknown'
        }))

        const res = await fetch('/api/ugc-studio/render', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            clips: clipsPayload,
            projectId: currentProject?._id || null,
            aspectRatio: script?.aspectRatio || '9:16'
          })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to start render')

        setRenderJobId(data.jobId)

        // Poll for completion (max ~5 min)
        const maxAttempts = 60
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(r => setTimeout(r, 5000))
          const sRes = await fetch(`/api/ugc-studio/render?jobId=${data.jobId}`, {
            headers: getAuthHeaders(false)
          })
          const sData = await sRes.json()
          if (sData.success && sData.job.status === 'completed' && sData.job.videoUrl) {
            setFinalVideoUrl(sData.job.videoUrl)
            setRendering(false)
            setSuccess('Final video rendered successfully!')
            return
          }
          if (sData.success && sData.job.status === 'failed') {
            throw new Error(sData.job.error || 'Render failed')
          }
        }
        throw new Error('Render timed out after 5 minutes')
      } catch (e) {
        setRenderError(e.message || 'Render failed')
        setRendering(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Preview Your Ad</h2>
          <p className="text-muted-foreground mt-1">
            {completedClips.length} of {script?.segments?.length || 0} clips generated
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-primary">{completedClips.length}</p>
              <p className="text-xs text-muted-foreground">Clips Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {completedClips.reduce((sum, c) => sum + (c.duration || 5), 0)}s
              </p>
              <p className="text-xs text-muted-foreground">Total Duration</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalCreditsUsed}</p>
              <p className="text-xs text-muted-foreground">Credits Used</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {completedClips.filter(c => c.clip.type === 'talking-head').length}
              </p>
              <p className="text-xs text-muted-foreground">Talking Head Clips</p>
            </CardContent>
          </Card>
        </div>

        {/* ============= FINAL RENDER SECTION ============= */}
        {completedClips.length > 0 && (
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="pt-5 pb-5">
              {!finalVideoUrl && !rendering && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">🎬 Stitch into one final ad</h3>
                    <p className="text-sm text-muted-foreground">
                      Combine all {completedClips.length} clips in script order into a single ready-to-share UGC ad video.
                      {!allClipsReady && ' (Some segments are not yet generated — they will be skipped.)'}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleRenderFinal}
                    className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Render Final Video
                  </Button>
                </div>
              )}

              {rendering && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="flex items-center gap-3 mb-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <p className="font-semibold">Stitching your final video...</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Downloading clips, normalizing, and concatenating with ffmpeg. This usually takes 30 seconds to 2 minutes.
                  </p>
                </div>
              )}

              {renderError && !rendering && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive flex-1">{renderError}</p>
                  <Button size="sm" variant="outline" onClick={handleRenderFinal}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {finalVideoUrl && !rendering && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">✅ Final Ad Ready</h3>
                      <p className="text-xs text-muted-foreground">Saved to your Library for 30 days.</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={finalVideoUrl}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <Button size="sm" variant="outline" onClick={handleRenderFinal}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Re-render
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden bg-black mx-auto" style={{ maxWidth: script?.aspectRatio === '16:9' ? '640px' : '400px', aspectRatio: (script?.aspectRatio || '9:16').replace(':', ' / ') }}>
                    <video
                      src={finalVideoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedClips.map((item, idx) => (
            <Card key={item.uuid || idx}>
              <CardContent className="pt-4">
                <div className="rounded-lg overflow-hidden bg-black aspect-[9/16] mb-3">
                  <video
                    src={item.clip.url}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Segment {item.id}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {item.clip.type === 'talking-head' ? '🗣️ Talking' : '🎬 B-Roll'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">{item.duration}s</Badge>
                    </div>
                  </div>
                  <a
                    href={item.clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {completedClips.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No clips generated yet.</p>
            <p className="text-sm text-muted-foreground">Go back to the Generate step to create clips.</p>
            <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Generate
            </Button>
          </div>
        )}
      </div>
    )
  }

  // =================== MAIN RENDER ===================

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">UGC Ad Studio</h1>
            <p className="text-sm text-muted-foreground">Create AI-powered UGC advertisements with talking-head avatars</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-destructive" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && renderAvatarStep()}
        {currentStep === 1 && renderScriptStep()}
        {currentStep === 2 && renderGenerateStep()}
        {currentStep === 3 && renderPreviewStep()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <Check className="w-4 h-4 mr-2" /> Complete
          </Button>
        )}
      </div>
    </div>
  )
}
