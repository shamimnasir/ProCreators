'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, Sparkles, Video, Image as ImageIcon, Upload, Download, 
  Play, Wand2, Clock, Zap, Film, ArrowLeft, ArrowRight,
  Type, Music, Mic, ChevronRight, Info, X, Library, Trash2,
  RefreshCw, Eye, Plus, GripVertical, ImagePlus
} from 'lucide-react'
import { saveToLibrary } from '@/lib/library-utils'
import { 
  SUPPORTED_TTS_LANGUAGES,
  groupVoicesForUI 
} from '@/config/voice-config'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import MusicPicker from './MusicPicker'

// Transformation Themes - Updated for Progressive Construction videos
const TRANSFORMATION_THEMES = [
  {
    id: 'historical-evolution',
    name: 'Historical Evolution',
    icon: '🏛️',
    description: 'Monuments, landmarks built from scratch',
    color: 'from-amber-500 to-orange-600',
    examplePrompt: 'Show the construction of the Pyramids of Giza from the first stone being laid to the final magnificent structure, with workers, scaffolding, and construction activity throughout'
  },
  {
    id: 'religious-sites',
    name: 'Religious Sites',
    icon: '🕌',
    description: 'Temples, mosques, churches being built',
    color: 'from-emerald-500 to-teal-600',
    examplePrompt: 'Show the evolution and construction of the Holy Kaaba and Masjid al-Haram in Mecca from ancient times to the modern magnificent complex, with pilgrims and construction workers in each era'
  },
  {
    id: 'urban-development',
    name: 'Urban Development',
    icon: '🌆',
    description: 'Cities rising from villages',
    color: 'from-purple-500 to-pink-600',
    examplePrompt: 'Show a small fishing village transforming into a modern metropolis like Dubai, with construction workers building skyscrapers, cranes operating, and infrastructure developing'
  },
  {
    id: 'renovation',
    name: 'Before/After Renovation',
    icon: '🏠',
    description: 'Buildings being restored/renovated',
    color: 'from-blue-500 to-cyan-600',
    examplePrompt: 'Show an abandoned Victorian mansion being renovated into a beautiful modern home, with workers repairing, painting, and restoring each part of the building'
  },
  {
    id: 'nature-transformation',
    name: 'Nature & Infrastructure',
    icon: '🌿',
    description: 'Land development, reforestation',
    color: 'from-green-500 to-emerald-600',
    examplePrompt: 'Show a barren desert transforming into a green oasis city, with workers planting trees, installing irrigation, and building sustainable structures'
  },
  {
    id: 'iconic-structures',
    name: 'Iconic Structures',
    icon: '🗼',
    description: 'Famous buildings being constructed',
    color: 'from-rose-500 to-red-600',
    examplePrompt: 'Show the construction of the Eiffel Tower from the first iron beams to the final completed tower, with workers on scaffolding, cranes lifting materials, and Parisians watching'
  },
  {
    id: 'custom',
    name: 'Custom Transformation',
    icon: '✨',
    description: 'Create your own construction story',
    color: 'from-gray-500 to-slate-600',
    examplePrompt: 'Describe any construction or transformation you want to visualize...'
  }
]

// Caption style options
const CAPTION_STYLES = [
  { value: 'none', label: '🚫 No Captions' },
  { value: 'bold-outline', label: '✨ Bold Outline (Default)' },
  { value: 'karaoke', label: '🎤 Karaoke (Word by Word)' },
  { value: 'neon-glow', label: '💜 Neon Glow' },
  { value: 'minimal-clean', label: '🤍 Minimal Clean' },
  { value: 'cinematic', label: '🎬 Cinematic (Bottom)' }
]

export default function TransformationVideoPage() {
  const { toast } = useToast()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1) // 1: Theme, 2: Scenes, 3: Generate
  
  // Theme & Topic
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('en')
  
  // Image source
  const [imageSource, setImageSource] = useState('ai') // 'ai' or 'upload'
  const [uploadedImages, setUploadedImages] = useState([]) // Array of {file, preview, description}
  
  // AI-generated scenes
  const [scenes, setScenes] = useState([])
  const [generatingScenes, setGeneratingScenes] = useState(false)
  
  // Video settings - Default to 8 scenes for more realistic progressive transformation
  const [sceneCount, setSceneCount] = useState(8)
  const [videoDuration, setVideoDuration] = useState([25]) // Target 15-35 seconds
  const [format, setFormat] = useState('portrait')
  
  // Voice settings - Default to 'none' for pure visual transformation videos
  const [voiceOption, setVoiceOption] = useState('none') // 'tts', 'upload', 'none'
  const [ttsLanguage, setTtsLanguage] = useState('en')
  const [availableVoices, setAvailableVoices] = useState([])
  const [voicesByVariant, setVoicesByVariant] = useState({})
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceFile, setVoiceFile] = useState(null)
  const [captionStyle, setCaptionStyle] = useState('none') // Default to no captions for pure visual transformation
  
  // Background music
  const [backgroundMusic, setBackgroundMusic] = useState(null)
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  
  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const voiceFileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  
  // Output
  const [videoResult, setVideoResult] = useState(null)

  // Load voices when TTS language changes
  useEffect(() => {
    if (voiceOption === 'tts') {
      loadVoices()
    }
  }, [ttsLanguage, voiceOption])

  const loadVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await fetch(`/api/story-reels/list-voices?language=${ttsLanguage}`)
      const data = await response.json()
      if (data.success && data.voices) {
        setAvailableVoices(data.voices)
        const grouped = groupVoicesForUI(data.voices)
        setVoicesByVariant(grouped)
        
        const categories = Object.keys(grouped)
        if (categories.length > 0 && !selectedVoice) {
          const preferredCategory = categories.find(c => c === 'Premium HD') || categories[0]
          if (grouped[preferredCategory]?.length > 0) {
            setSelectedVoice(grouped[preferredCategory][0].name)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error)
    } finally {
      setLoadingVoices(false)
    }
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        setVoiceFile(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      toast({ title: 'Recording Started', description: 'Speak your narration' })
    } catch (error) {
      toast({ title: 'Recording Failed', description: error.message, variant: 'destructive' })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
      toast({ title: 'Recording Saved', description: `${recordingTime}s of audio recorded` })
    }
  }

  const handleVoiceFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({ title: 'Invalid File', description: 'Please upload an audio file', variant: 'destructive' })
        return
      }
      setVoiceFile(file)
      toast({ title: 'Audio Uploaded', description: file.name })
    }
  }

  // Image upload handling
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    
    if (validFiles.length === 0) {
      toast({ title: 'Invalid Files', description: 'Please upload valid images (max 10MB each)', variant: 'destructive' })
      return
    }
    
    const newImages = validFiles.map((file, idx) => ({
      id: `img-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file),
      description: '',
      order: uploadedImages.length + idx
    }))
    
    setUploadedImages(prev => [...prev, ...newImages].slice(0, 6))
    toast({ title: 'Images Added', description: `${newImages.length} images uploaded` })
  }

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const updateImageDescription = (id, description) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === id ? { ...img, description } : img
    ))
  }

  // Generate scenes with AI
  const generateScenes = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic Required', description: 'Please enter a transformation topic', variant: 'destructive' })
      return
    }
    
    setGeneratingScenes(true)
    try {
      const response = await fetch('/api/transformation-video/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          theme: selectedTheme?.id || 'custom',
          sceneCount,
          language
        })
      })
      
      const data = await response.json()
      if (data.success && data.scenes) {
        setScenes(data.scenes)
        setCurrentStep(2)
        toast({ title: 'Scenes Generated!', description: `${data.scenes.length} transformation scenes created` })
      } else {
        throw new Error(data.error || 'Failed to generate scenes')
      }
    } catch (error) {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setGeneratingScenes(false)
    }
  }

  // Update scene prompt
  const updateScenePrompt = (index, field, value) => {
    setScenes(prev => prev.map((scene, i) => 
      i === index ? { ...scene, [field]: value } : scene
    ))
  }

  // Generate final video
  const generateVideo = async () => {
    // Validation
    if (imageSource === 'upload' && uploadedImages.length < 2) {
      toast({ title: 'More Images Needed', description: 'Please upload at least 2 images for transformation', variant: 'destructive' })
      return
    }
    
    if (imageSource === 'ai' && scenes.length === 0) {
      toast({ title: 'Scenes Required', description: 'Please generate scenes first', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    setProgress(0)
    setProgressMessage('🚀 Starting AI video generation...')
    setVideoResult(null)
    
    try {
      const formData = new FormData()
      formData.append('topic', topic)
      formData.append('theme', selectedTheme?.id || 'custom')
      formData.append('language', language)
      formData.append('imageSource', imageSource)
      formData.append('targetDuration', videoDuration[0])
      formData.append('format', format)
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('selectedVoice', selectedVoice || '')
      formData.append('captionStyle', captionStyle)
      
      if (imageSource === 'ai') {
        formData.append('scenes', JSON.stringify(scenes))
      } else {
        // Upload images
        uploadedImages.forEach((img, idx) => {
          formData.append(`image_${idx}`, img.file)
          formData.append(`image_${idx}_description`, img.description || '')
        })
        formData.append('imageCount', uploadedImages.length)
      }
      
      if (voiceOption === 'upload' && voiceFile) {
        formData.append('voiceFile', voiceFile)
      }
      
      // Add background music if selected
      if (backgroundMusic) {
        formData.append('backgroundMusic', JSON.stringify(backgroundMusic))
      }
      
      // Start async job
      const startResponse = await fetch('/api/transformation-video/generate-async', {
        method: 'POST',
        body: formData
      })
      
      if (!startResponse.ok) {
        const errorData = await startResponse.json()
        throw new Error(errorData.error || 'Failed to start video generation')
      }
      
      const { jobId, estimatedTime } = await startResponse.json()
      console.log(`Job started: ${jobId}, estimated time: ${estimatedTime}`)
      
      setProgressMessage(`🎬 AI video generation started (est. ${estimatedTime})...`)
      
      // Poll for status
      let pollCount = 0
      const maxPolls = 600 // 10 minutes max (1 poll per second)
      
      while (pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Poll every 2 seconds
        pollCount++
        
        try {
          const statusResponse = await fetch(`/api/transformation-video/status?jobId=${jobId}`)
          const status = await statusResponse.json()
          
          if (status.error && statusResponse.status === 404) {
            throw new Error('Job not found')
          }
          
          setProgress(status.progress || 0)
          setProgressMessage(status.message || 'Processing...')
          
          // Update scenes with image URLs if available (for draft saving)
          if (status.updatedScenes && status.updatedScenes.length > 0) {
            setScenes(status.updatedScenes)
          }
          
          if (status.status === 'complete') {
            setProgress(100)
            setProgressMessage('✅ AI Video Complete!')
            setVideoResult({
              videoUrl: status.videoUrl,
              duration: status.duration,
              clipCount: status.clipCount
            })
            setCurrentStep(3)
            
            // Final update of scenes with image URLs
            if (status.updatedScenes && status.updatedScenes.length > 0) {
              setScenes(status.updatedScenes)
            }
            
            toast({ 
              title: '🎬 AI Transformation Video Created!', 
              description: `${Math.round(status.duration || videoDuration[0])}s cinematic AI video ready`
            })
            break
          }
          
          if (status.status === 'failed') {
            throw new Error(status.error || 'Video generation failed')
          }
          
        } catch (pollError) {
          if (pollError.message === 'Job not found') {
            throw pollError
          }
          console.warn('Poll error:', pollError.message)
          // Continue polling on network errors
        }
      }
      
      if (pollCount >= maxPolls) {
        throw new Error('Video generation timed out. Please try again.')
      }
      
    } catch (error) {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  // Download video
  const handleDownload = async () => {
    if (!videoResult?.videoUrl) return
    try {
      const response = await fetch(videoResult.videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `transformation-${selectedTheme?.id || 'custom'}-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast({ title: 'Download Started' })
    } catch (error) {
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' })
    }
  }

  // Reset to start
  const resetAll = () => {
    setCurrentStep(1)
    setSelectedTheme(null)
    setTopic('')
    setScenes([])
    setUploadedImages([])
    setVideoResult(null)
    setProgress(0)
  }

  // AutoSave helper functions
  const getCurrentData = useCallback(() => ({
    title: topic || selectedTheme?.name || 'Untitled Transformation',
    topic,
    selectedTheme,
    language,
    imageSource,
    scenes,
    sceneCount,
    videoDuration: videoDuration[0],
    format,
    voiceOption,
    ttsLanguage,
    selectedVoice,
    captionStyle,
    backgroundMusic,
    currentStep
  }), [topic, selectedTheme, language, imageSource, scenes, sceneCount, videoDuration, format, voiceOption, ttsLanguage, selectedVoice, captionStyle, backgroundMusic, currentStep])

  const loadDraftData = useCallback((data) => {
    console.log('Loading draft data:', data)
    if (data.topic !== undefined) setTopic(data.topic)
    if (data.selectedTheme !== undefined) setSelectedTheme(data.selectedTheme)
    if (data.language !== undefined) setLanguage(data.language)
    if (data.imageSource !== undefined) setImageSource(data.imageSource)
    if (data.scenes !== undefined && Array.isArray(data.scenes)) setScenes(data.scenes)
    if (data.sceneCount !== undefined) setSceneCount(data.sceneCount)
    if (data.videoDuration !== undefined) setVideoDuration([data.videoDuration])
    if (data.format !== undefined) setFormat(data.format)
    if (data.voiceOption !== undefined) setVoiceOption(data.voiceOption)
    if (data.ttsLanguage !== undefined) setTtsLanguage(data.ttsLanguage)
    if (data.selectedVoice !== undefined) setSelectedVoice(data.selectedVoice)
    if (data.captionStyle !== undefined) setCaptionStyle(data.captionStyle)
    if (data.backgroundMusic !== undefined) setBackgroundMusic(data.backgroundMusic)
    
    // Determine the correct step to show based on loaded data
    // If we have scenes, show step 2 (scene review) instead of step 3 (which requires videoResult)
    // This ensures users can resume from where they left off
    if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
      // We have scenes, go to step 2 so user can review and generate
      setCurrentStep(2)
    } else if (data.topic && data.selectedTheme) {
      // We have topic but no scenes yet, stay on step 1
      setCurrentStep(1)
    } else if (data.currentStep !== undefined && data.currentStep <= 2) {
      setCurrentStep(data.currentStep)
    } else {
      setCurrentStep(1)
    }
  }, [])

  const handleStartNew = useCallback(() => {
    resetAll()
    setVoiceOption('none') // Default to no voice for pure visual transformation
    setCaptionStyle('none')
    setLanguage('en')
    setTtsLanguage('en')
    setSceneCount(4)
    setVideoDuration([25])
    setFormat('portrait')
  }, [])

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <RefreshCw className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Construction/Transformation Video</h1>
              <p className="text-white/80">Create realistic progressive building videos with workers & construction</p>
            </div>
            <Badge className="ml-auto bg-white/20 text-white border-0">🏗️ Kling AI</Badge>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  {step === 1 ? '🎯' : step === 2 ? '🎨' : '🎬'}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded ${
                    currentStep > step ? 'bg-white' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2 text-sm text-white/80">
            <span>Theme & Topic</span>
            <span>Scenes</span>
            <span>Generate</span>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Theme Selection & Topic */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Choose Transformation Theme
              </CardTitle>
              <CardDescription>Select a theme or create your own custom transformation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {TRANSFORMATION_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme)
                      if (theme.id !== 'custom' && !topic) {
                        setTopic(theme.examplePrompt)
                      }
                    }}
                    className={`relative cursor-pointer rounded-xl p-4 transition-all hover:scale-105 ${
                      selectedTheme?.id === theme.id
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-md'
                    } bg-gradient-to-br ${theme.color} text-white`}
                  >
                    <span className="text-3xl">{theme.icon}</span>
                    <h3 className="font-bold mt-2">{theme.name}</h3>
                    <p className="text-xs text-white/80 mt-1">{theme.description}</p>
                    {selectedTheme?.id === theme.id && (
                      <div className="absolute top-2 right-2 bg-white text-green-600 rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topic Input */}
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Construction/Transformation</CardTitle>
              <CardDescription>Describe what you want to see being built - from ground up to completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: Show the construction of the Holy Kaaba and Mecca from ancient times to modern day. Start with the empty desert and early builders laying the first stones. Show workers constructing the initial structure, then the city growing around it through different eras. End with the magnificent modern Masjid al-Haram surrounded by the developed city of Mecca with millions of pilgrims..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                className="resize-none"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="bn">🇧🇩 বাংলা</SelectItem>
                      <SelectItem value="hi">🇮🇳 हिंदी</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Number of Scenes</Label>
                  <Select value={String(sceneCount)} onValueChange={(v) => setSceneCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 Scenes (Quick)</SelectItem>
                      <SelectItem value="6">6 Scenes</SelectItem>
                      <SelectItem value="8">8 Scenes (Recommended)</SelectItem>
                      <SelectItem value="10">10 Scenes (Detailed)</SelectItem>
                      <SelectItem value="12">12 Scenes (Ultra-Detailed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Target Duration</Label>
                  <div className="pt-2">
                    <Slider
                      value={videoDuration}
                      onValueChange={setVideoDuration}
                      min={15}
                      max={35}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{videoDuration[0]} seconds</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">📱 Portrait (9:16)</SelectItem>
                      <SelectItem value="landscape">🖥️ Landscape (16:9)</SelectItem>
                      <SelectItem value="square">⬜ Square (1:1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Image Source</CardTitle>
              <CardDescription>Choose how to create transformation images</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={imageSource} onValueChange={setImageSource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    imageSource === 'ai' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setImageSource('ai')}
                >
                  <RadioGroupItem value="ai" id="ai-images" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-purple-500" />
                      <Label htmlFor="ai-images" className="font-semibold cursor-pointer">AI Generated Images</Label>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI will generate all transformation stages based on your topic
                    </p>
                  </div>
                </div>
                
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    imageSource === 'upload' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setImageSource('upload')}
                >
                  <RadioGroupItem value="upload" id="upload-images" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-500" />
                      <Label htmlFor="upload-images" className="font-semibold cursor-pointer">Upload Your Images</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload 3-6 images showing the transformation stages
                    </p>
                  </div>
                </div>
              </RadioGroup>
              
              {/* Image Upload Section */}
              {imageSource === 'upload' && (
                <div className="mt-6 space-y-4">
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Click to upload transformation images</p>
                    <p className="text-sm text-muted-foreground">Upload 3-6 images in order (before → middle stages → after)</p>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={img.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted">
                            <img src={img.preview} alt={`Stage ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-bold">
                            #{idx + 1}
                          </div>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <Input
                            placeholder="Describe this stage..."
                            value={img.description}
                            onChange={(e) => updateImageDescription(img.id, e.target.value)}
                            className="mt-2 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice & Captions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={voiceOption} onValueChange={setVoiceOption} className="grid grid-cols-3 gap-2">
                <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                  voiceOption === 'tts' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                }`} onClick={() => setVoiceOption('tts')}>
                  <RadioGroupItem value="tts" id="tts" />
                  <Label htmlFor="tts" className="cursor-pointer text-sm">🎙️ AI Voice</Label>
                </div>
                <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                  voiceOption === 'upload' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                }`} onClick={() => setVoiceOption('upload')}>
                  <RadioGroupItem value="upload" id="voice-upload" />
                  <Label htmlFor="voice-upload" className="cursor-pointer text-sm">🎤 Record/Upload</Label>
                </div>
                <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                  voiceOption === 'none' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                }`} onClick={() => setVoiceOption('none')}>
                  <RadioGroupItem value="none" id="no-voice" />
                  <Label htmlFor="no-voice" className="cursor-pointer text-sm">🔇 No Voice</Label>
                </div>
              </RadioGroup>

              {voiceOption === 'tts' && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm">Language</Label>
                    <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_TTS_LANGUAGES.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Voice {loadingVoices && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={loadingVoices}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(voicesByVariant).map(([category, voices]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted sticky top-0">
                              {category}
                            </div>
                            {voices.map(voice => (
                              <SelectItem key={voice.name} value={voice.name}>
                                <span>{voice.genderIcon} {voice.friendlyName}</span>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {voiceOption === 'upload' && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex gap-2">
                    <Button
                      variant={isRecording ? 'destructive' : 'outline'}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex-1"
                    >
                      {isRecording ? <>🔴 Stop ({recordingTime}s)</> : <>🎤 Record</>}
                    </Button>
                    <Button variant="outline" onClick={() => voiceFileInputRef.current?.click()} className="flex-1">
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                    <input
                      type="file"
                      ref={voiceFileInputRef}
                      className="hidden"
                      accept="audio/*"
                      onChange={handleVoiceFileUpload}
                    />
                  </div>
                  {voiceFile && (
                    <div className="flex items-center gap-2 p-2 rounded bg-green-100 dark:bg-green-900/30 text-sm">
                      <span>✅</span>
                      <span>{voiceFile.name || 'Recording ready'}</span>
                      <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={() => setVoiceFile(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm">Caption Style</Label>
                <Select value={captionStyle} onValueChange={setCaptionStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPTION_STYLES.map(style => (
                      <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Background Music - NEW */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Background Music
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {backgroundMusic ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{backgroundMusic.name}</p>
                    <p className="text-xs text-muted-foreground">Selected track</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBackgroundMusic(null)}
                    title="Remove music"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <Music className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-medium mb-1">No Music Selected</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add epic background music to enhance your transformation video
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowMusicPicker(true)}
                  >
                    🎵 Browse Music Library
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-end gap-4">
            {/* Show different button based on whether scenes already exist */}
            {imageSource === 'ai' && scenes.length > 0 ? (
              <Button
                size="lg"
                onClick={() => setCurrentStep(2)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                <ArrowRight className="mr-2 h-5 w-5" /> Review {scenes.length} Scenes & Generate
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={imageSource === 'ai' ? generateScenes : () => setCurrentStep(2)}
                disabled={!topic.trim() || generatingScenes || (imageSource === 'upload' && uploadedImages.length < 2)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {generatingScenes ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Scenes...</>
                ) : imageSource === 'ai' ? (
                  <><Wand2 className="mr-2 h-5 w-5" /> Generate Scenes with AI</>
                ) : (
                  <><ArrowRight className="mr-2 h-5 w-5" /> Continue to Generate</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Scene Review & Edit */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    {imageSource === 'ai' ? 'Review & Edit Scenes' : 'Your Transformation Images'}
                  </CardTitle>
                  <CardDescription>
                    {imageSource === 'ai' 
                      ? 'Edit the AI-generated scene prompts before generating videos'
                      : 'Review your uploaded images in transformation order'
                    }
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {imageSource === 'ai' ? (
                scenes.length > 0 ? (
                  <div className="space-y-4">
                    {scenes.map((scene, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{scene.title || `Construction Stage ${idx + 1}`}</h4>
                            <p className="text-xs text-muted-foreground">5 seconds • Kling AI Motion</p>
                          </div>
                          {scene.imageUrl && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              ✅ Image Cached
                            </Badge>
                          )}
                        </div>
                        
                        {/* Show cached image preview if available */}
                        {scene.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden border bg-black/5">
                            <img 
                              src={scene.imageUrl} 
                              alt={`Scene ${idx + 1} preview`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Visual Description (for image generation)</Label>
                            <Textarea
                              value={scene.visualPrompt || ''}
                              onChange={(e) => updateScenePrompt(idx, 'visualPrompt', e.target.value)}
                              rows={2}
                              className="text-sm mt-1"
                              placeholder="Describe the visual for this scene..."
                            />
                          </div>
                          
                          {/* Motion Prompt for video generation */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Motion Description (for AI video - workers, activity)</Label>
                            <Textarea
                              value={scene.motionPrompt || ''}
                              onChange={(e) => updateScenePrompt(idx, 'motionPrompt', e.target.value)}
                              rows={2}
                              className="text-sm mt-1"
                              placeholder="Describe the movement: workers walking, cranes operating, materials being lifted..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show summary of cached images */}
                    {scenes.some(s => s.imageUrl) && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                          <span>✅</span>
                          <span>
                            {scenes.filter(s => s.imageUrl).length} of {scenes.length} images cached - 
                            these won't need to be regenerated!
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Scenes Generated Yet</h3>
                    <p className="text-muted-foreground mb-4">Go back to Step 1 and click "Generate Scenes with AI" to create transformation scenes.</p>
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Step 1
                    </Button>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {uploadedImages.map((img, idx) => (
                    <div key={img.id} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted">
                        <img src={img.preview} alt={`Stage ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-bold">
                        #{idx + 1}
                      </div>
                      <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                        {img.description || `Stage ${idx + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Video Button */}
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
            </Button>
            <Button
              size="lg"
              onClick={generateVideo}
              disabled={generating}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {generating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating AI Video with Kling...</>
              ) : (
                <><Film className="mr-2 h-5 w-5" /> Generate Realistic AI Video</>
              )}
            </Button>
          </div>

          {/* Progress - Enhanced with detailed time estimates */}
          {generating && (
            <Card className="border-primary/20">
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge variant="secondary" className="mb-2 px-3 py-1">🎬 Powered by Kling v2.1 AI</Badge>
                    <p className="text-sm font-medium mt-2">Creating Realistic AI Motion Videos</p>
                  </div>
                  
                  {/* Main progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-4" />
                  </div>
                  
                  {/* Current status message */}
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm font-medium text-foreground">{progressMessage}</p>
                  </div>
                  
                  {/* Detailed time estimate */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30">
                      <p className="text-lg font-bold text-blue-600">{scenes.length || sceneCount}</p>
                      <p className="text-xs text-muted-foreground">Total Scenes</p>
                    </div>
                    <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                      <p className="text-lg font-bold text-amber-600">~2-3 min</p>
                      <p className="text-xs text-muted-foreground">Per Scene</p>
                    </div>
                    <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/30">
                      <p className="text-lg font-bold text-purple-600">~{Math.ceil((scenes.length || sceneCount) * 2.5)} min</p>
                      <p className="text-xs text-muted-foreground">Est. Total</p>
                    </div>
                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/30">
                      <p className="text-lg font-bold text-green-600">{videoDuration[0]}s</p>
                      <p className="text-xs text-muted-foreground">Final Video</p>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="text-center p-3 rounded bg-muted/30 border border-dashed">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">⏱️ Why does it take time?</span><br/>
                      Kling AI creates realistic motion by analyzing each scene and generating fluid movement frame-by-frame. 
                      More scenes = smoother transformation = better quality!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Video Result */}
      {currentStep === 3 && videoResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎬</span>
                    Your AI Transformation Video
                  </CardTitle>
                  <CardDescription>Your realistic AI-powered transformation video (Kling v2.1) is ready!</CardDescription>
                </div>
                <Button variant="outline" onClick={resetAll}>
                  <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`relative rounded-xl overflow-hidden bg-black mx-auto ${
                format === 'portrait' ? 'max-w-sm aspect-[9/16]' : format === 'square' ? 'max-w-lg aspect-square' : 'max-w-3xl aspect-video'
              }`}>
                <video
                  src={videoResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={handleDownload} size="lg">
                  <Download className="mr-2 h-5 w-5" /> Download Video
                </Button>
                <Button variant="outline" size="lg" onClick={resetAll}>
                  <RefreshCw className="mr-2 h-5 w-5" /> Create Another
                </Button>
              </div>
              
              {/* Video Info */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 flex items-center justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold">{Math.round(videoResult.duration || videoDuration[0])}s</p>
                  <p className="text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{videoResult.clipCount || scenes.length || uploadedImages.length}</p>
                  <p className="text-muted-foreground">Scenes</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{format === 'portrait' ? '9:16' : format === 'square' ? '1:1' : '16:9'}</p>
                  <p className="text-muted-foreground">Format</p>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Library className="h-4 w-4" />
                  <span>Auto-saved to Library</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </div>

        {/* Sidebar - AutoSave Drafts Manager */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <AutoSaveDraftsManager
              toolType="transformation-video"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[topic, selectedTheme, language, imageSource, scenes, sceneCount, videoDuration, format, voiceOption, ttsLanguage, selectedVoice, captionStyle, backgroundMusic, currentStep]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={currentStep}
            />
          </div>
        </div>
      </div>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <MusicPicker
          open={showMusicPicker}
          onClose={() => setShowMusicPicker(false)}
          onSelectMusic={(music) => {
            setBackgroundMusic(music)
            setShowMusicPicker(false)
          }}
          videoDuration={videoDuration[0]}
        />
      )}
    </div>
  )
}
