'use client'

import React, { useState, useRef, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, Sparkles, Video, Image as ImageIcon, Upload, Download, 
  Play, Wand2, Monitor, Smartphone, Clock, Zap, Film, ArrowLeft,
  Type, Music, Mic, ChevronRight, Info, Search, Grid, Star, X, Library
} from 'lucide-react'

// Import configurations
import { DURATION_OPTIONS, FORMAT_OPTIONS } from '@/config/ai-video-usecases'
import { 
  AI_VIDEO_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getTemplateById, 
  getTemplatesByCategory,
  getPopularTemplates,
  searchTemplates 
} from '@/config/ai-video-templates'

// Import library utility
import { saveToLibrary } from '@/lib/library-utils'

export default function AIVideoStudioPage() {
  // View state: 'gallery' or 'create'
  const [view, setView] = useState('gallery')
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [activeCategory, setActiveCategory] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Input state
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [photos, setPhotos] = useState([])
  
  // Output settings (from template defaults)
  const [duration, setDuration] = useState(30)
  const [format, setFormat] = useState('portrait')
  const [language, setLanguage] = useState('en')
  const [videoSource, setVideoSource] = useState('stock') // 'stock', 'ai', 'hybrid'
  
  // Voice/TTS state (reused from Quick Reels Hub)
  const [ttsLanguage, setTtsLanguage] = useState('en')
  const [voiceOption, setVoiceOption] = useState('tts') // 'tts', 'upload', 'none'
  const [availableVoices, setAvailableVoices] = useState([])
  const [voicesByVariant, setVoicesByVariant] = useState({})
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceFile, setVoiceFile] = useState(null)
  const [narrationMode, setNarrationMode] = useState('dialogue-only') // 'dialogue-only', 'full'
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [captionStyle, setCaptionStyle] = useState('bold-outline') // Caption style
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const voiceFileInputRef = useRef(null)
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  
  // Output
  const [videoResult, setVideoResult] = useState(null)
  
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const multiFileInputRef = useRef(null)

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
        
        // Group voices by variant
        const grouped = {}
        data.voices.forEach(voice => {
          const variant = voice.name.split('-').slice(2, 3).join('-') || 'Standard'
          if (!grouped[variant]) grouped[variant] = []
          grouped[variant].push(voice)
        })
        setVoicesByVariant(grouped)
        
        // Select first voice if none selected
        const variants = Object.keys(grouped)
        if (variants.length > 0 && !selectedVoice) {
          const firstVariant = variants[0]
          if (grouped[firstVariant]?.length > 0) {
            setSelectedVoice(grouped[firstVariant][0].name)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error)
    } finally {
      setLoadingVoices(false)
    }
  }

  // Voice recording handlers
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

  // Get templates to display
  const displayTemplates = searchQuery 
    ? searchTemplates(searchQuery)
    : getTemplatesByCategory(activeCategory)

  // Select a template and go to create view
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setDuration(template.defaultSettings.duration)
    setFormat(template.defaultSettings.format)
    if (template.defaultSettings.language) {
      setLanguage(template.defaultSettings.language)
    }
    setPrompt('')
    setEnhancedPrompt('')
    setImageFile(null)
    setImagePreview(null)
    setPhotos([])
    setVideoResult(null)
    setVideoSource('stock') // Reset to stock
    setView('create')
  }

  // Go back to gallery
  const handleBackToGallery = () => {
    setView('gallery')
    setSelectedTemplate(null)
  }

  // Handle single image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File', description: 'Please upload an image file', variant: 'destructive' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File Too Large', description: 'Image must be less than 10MB', variant: 'destructive' })
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle multiple photos upload
  const handlePhotosUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024).slice(0, 10)
    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 10))
    toast({ title: 'Photos Added', description: `${newPhotos.length} photos uploaded` })
  }

  // Remove a photo
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Input Required', description: 'Enter something to enhance', variant: 'destructive' })
      return
    }
    
    try {
      const response = await fetch('/api/ai-video-studio/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          useCaseId: selectedTemplate?.id || 'make-anything',
          duration,
          format,
          language
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setEnhancedPrompt(data.enhancedPrompt)
        toast({ title: 'Prompt Enhanced!', description: 'Optimized for better results' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Enhancement Failed', description: error.message, variant: 'destructive' })
    }
  }

  // Generate video
  const handleGenerate = async () => {
    // Validation based on input type
    const inputType = selectedTemplate?.inputType || 'prompt'
    
    if (['image', 'photos'].includes(inputType) && !imageFile && photos.length === 0) {
      toast({ title: 'Image Required', description: 'Please upload an image', variant: 'destructive' })
      return
    }
    
    if (['prompt', 'script', 'story-script', 'quote', 'topic', 'facts', 'chat'].includes(inputType) && !prompt.trim()) {
      toast({ title: 'Input Required', description: 'Please enter your content', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    setProgress(0)
    setProgressMessage(
      videoSource === 'ai' ? '🎨 Starting AI video generation with Fal.ai...' :
      videoSource === 'hybrid' ? '🎬 Creating AI + Stock hybrid...' :
      'Finding best stock videos...'
    )
    setVideoResult(null)
    
    try {
      const formData = new FormData()
      formData.append('mode', selectedTemplate?.defaultSettings.mode || 'text-to-video')
      formData.append('prompt', enhancedPrompt || prompt)
      formData.append('duration', duration)
      formData.append('format', format)
      formData.append('templateId', selectedTemplate?.id || 'make-anything')
      formData.append('language', language)
      formData.append('videoSource', videoSource)
      
      // Voice/TTS parameters
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('selectedVoice', selectedVoice || '')
      formData.append('narrationMode', narrationMode)
      
      // Upload voice file if available
      if (voiceOption === 'upload' && voiceFile) {
        formData.append('voiceFile', voiceFile)
      }
      
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      if (photos.length > 0) {
        photos.forEach((photo, idx) => {
          formData.append(`photo_${idx}`, photo.file)
        })
        formData.append('photoCount', photos.length)
      }
      
      // Caption style
      formData.append('captionStyle', captionStyle)
      
      // Progress simulation with Fal.ai model names
      const segments = Math.ceil(duration / 5)
      let currentProgress = 0
      const aiModels = ['Pixverse v5.5', 'LongCat', 'Wan 2.5', 'Hunyuan', 'Kling']
      let modelIndex = 0
      const progressInterval = setInterval(() => {
        currentProgress += 100 / (segments * (videoSource === 'ai' ? 50 : videoSource === 'hybrid' ? 40 : 25))
        if (currentProgress < 90) {
          setProgress(currentProgress)
          // Rotate through model names in progress message
          if (videoSource === 'ai') {
            const currentModel = aiModels[modelIndex % aiModels.length]
            setProgressMessage(`🎨 Generating with ${currentModel} (Fal.ai)...`)
            if (currentProgress > 20 * (modelIndex + 1)) modelIndex++
          } else if (videoSource === 'hybrid') {
            setProgressMessage('🎬 Mixing AI video + stock footage...')
          } else {
            setProgressMessage('📹 Composing video with stock footage...')
          }
        }
      }, 1000)
      
      const response = await fetch('/api/ai-video-studio/generate', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      const data = await response.json()
      
      if (data.success) {
        setProgress(100)
        setProgressMessage('Saving to library...')
        setVideoResult(data)
        
        // Auto-save to user library
        const libraryResult = await saveToLibrary({
          type: 'ai-video-studio',
          category: 'video',
          title: `${selectedTemplate?.name || 'AI Video'} - ${new Date().toLocaleDateString()}`,
          description: (enhancedPrompt || prompt).substring(0, 200),
          videoUrl: data.videoUrl,
          filePath: data.videoUrl,
          metadata: {
            duration,
            format,
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name
          }
        })
        
        if (libraryResult.success) {
          toast({ 
            title: '🎬 Video Generated & Saved!', 
            description: `${duration}s video saved to your library`
          })
        } else {
          toast({ title: '🎬 Video Generated!', description: `${duration}s video ready` })
        }
      } else {
        throw new Error(data.error)
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
      link.download = `${selectedTemplate?.shortName || 'ai-video'}-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast({ title: 'Download Started' })
    } catch (error) {
      toast({ title: 'Download Failed', description: error.message, variant: 'destructive' })
    }
  }

  // Render input based on template type
  const renderInput = () => {
    const inputType = selectedTemplate?.inputType || 'prompt'
    
    switch (inputType) {
      case 'image':
        return (
          <div className="space-y-4">
            <Label>Upload Image</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                imagePreview ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                  <p className="text-sm text-muted-foreground">Click to change</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">Drop an image or click to upload</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, WebP up to 10MB</p>
                </div>
              )}
            </div>
            <Textarea
              placeholder={selectedTemplate?.inputPlaceholder || 'Describe what you want...'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>
        )
      
      case 'photos':
        return (
          <div className="space-y-4">
            <Label>Upload Photos (up to 10)</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50"
              onClick={() => multiFileInputRef.current?.click()}
            >
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotosUpload}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Add Photos</p>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Textarea
              placeholder={selectedTemplate?.inputPlaceholder || 'Describe the vibe...'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
            />
          </div>
        )
      
      case 'url':
        return (
          <div className="space-y-4">
            <Label>Product URL</Label>
            <Input
              placeholder="Paste Amazon, eBay, or product URL..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <Label>{inputType === 'chat' ? 'Chat Conversation' : inputType === 'facts' ? 'Enter Facts' : 'Your Content'}</Label>
            <Textarea
              placeholder={selectedTemplate?.inputPlaceholder || 'Enter your content...'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={inputType === 'chat' || inputType === 'facts' ? 8 : 5}
              className="font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleEnhancePrompt} disabled={!prompt.trim()}>
                <Wand2 className="h-4 w-4 mr-1" />
                Enhance with AI
              </Button>
            </div>
            {enhancedPrompt && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <Label className="text-green-700 dark:text-green-300 text-xs">Enhanced:</Label>
                <p className="text-sm mt-1">{enhancedPrompt}</p>
              </div>
            )}
          </div>
        )
    }
  }

  // ==================== GALLERY VIEW ====================
  if (view === 'gallery') {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">🎬</span>
              AI Video Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Choose a template to create stunning AI videos in minutes
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            {AI_VIDEO_TEMPLATES.length} Templates
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates... (e.g., 'story', 'business', 'meme')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex gap-2 flex-wrap">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="gap-2"
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${template.color} text-white overflow-hidden`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex gap-1">
                    {template.isPopular && (
                      <Badge className="bg-white/20 text-white text-xs">🔥 Popular</Badge>
                    )}
                    {template.isNew && (
                      <Badge className="bg-white/20 text-white text-xs">✨ New</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.perfectFor.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-white/20 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.defaultSettings.duration}s
                  </span>
                  <span className="flex items-center gap-1">
                    {template.defaultSettings.format === 'portrait' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {template.defaultSettings.format === 'portrait' ? '9:16' : '16:9'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {displayTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates found for &quot;{searchQuery}&quot;</p>
            <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
          </div>
        )}

        {/* Custom Creation Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-all"
          onClick={() => handleSelectTemplate({
            id: 'custom',
            name: 'Custom Creation',
            shortName: 'Custom',
            description: 'Start from scratch with full control',
            icon: '✨',
            category: 'custom',
            color: 'from-gray-500 to-gray-600',
            perfectFor: ['Advanced users', 'Custom projects'],
            defaultSettings: { mode: 'text-to-video', duration: 15, format: 'portrait' },
            inputType: 'prompt',
            inputPlaceholder: 'Describe your video in detail...'
          })}
        >
          <CardContent className="flex items-center justify-center py-8 gap-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">Can&apos;t find what you need?</p>
              <p className="text-sm text-muted-foreground">Create a custom video from scratch</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== CREATE VIEW ====================
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToGallery}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedTemplate?.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{selectedTemplate?.name}</h1>
              <p className="text-muted-foreground text-sm">{selectedTemplate?.description}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {duration}s
        </Badge>
        <Badge variant="outline" className="gap-1">
          {format === 'portrait' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
          {format === 'portrait' ? '9:16' : '16:9'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Content</CardTitle>
            </CardHeader>
            <CardContent>
              {renderInput()}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Film className="h-5 w-5" />
                Output Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration */}
              <div className="space-y-3">
                <Label>Duration</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DURATION_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                        duration === opt.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => setDuration(opt.value)}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.segments} segment{opt.segments > 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <Label>Format</Label>
                <div className="grid grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                        format === opt.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => setFormat(opt.value)}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language (for explainers) */}
              {selectedTemplate?.defaultSettings?.language && (
                <div className="space-y-3">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="hi">হिंদी (Hindi)</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Video Source Selection */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Video Scene Source
                </Label>
                <RadioGroup value={videoSource} onValueChange={setVideoSource} className="space-y-3">
                  <div 
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      videoSource === 'stock' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setVideoSource('stock')}
                  >
                    <RadioGroupItem value="stock" id="stock" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📹</span>
                        <Label htmlFor="stock" className="font-semibold cursor-pointer">Stock Videos</Label>
                        <Badge variant="secondary" className="text-xs">Fast</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        High-quality HD footage from Pexels • ~30s render
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      videoSource === 'ai' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setVideoSource('ai')}
                  >
                    <RadioGroupItem value="ai" id="ai" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">🎨</span>
                        <Label htmlFor="ai" className="font-semibold cursor-pointer">AI-Generated Video</Label>
                        <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">Fal.ai</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">💰 Ovi $0.04/s</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">💰 Pixverse $0.04/s</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">⭐ Wan $0.05/s</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">⭐ Minimax $0.05/s</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">🏆 Kling $0.07/s</Badge>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Auto-selects cheapest working model • Real AI video with motion
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      videoSource === 'hybrid' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setVideoSource('hybrid')}
                  >
                    <RadioGroupItem value="hybrid" id="hybrid" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <Label htmlFor="hybrid" className="font-semibold cursor-pointer">Hybrid Mix</Label>
                        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500">Best Value</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI video for key moments + HD stock B-roll • ~1-2min render
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Video Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className={`p-4 rounded-lg border ${
                  videoSource === 'ai' ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800' :
                  videoSource === 'hybrid' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800' :
                  'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {videoSource === 'ai' ? '🎨' : videoSource === 'hybrid' ? '✨' : '📹'}
                    </span>
                    <div>
                      <p className={`font-semibold ${
                        videoSource === 'ai' ? 'text-purple-900 dark:text-purple-100' :
                        videoSource === 'hybrid' ? 'text-cyan-900 dark:text-cyan-100' :
                        'text-blue-900 dark:text-blue-100'
                      }`}>
                        {videoSource === 'ai' ? 'AI Video Generation (Fal.ai)' : 
                         videoSource === 'hybrid' ? 'Hybrid: AI Video + Stock' : 
                         'Cinematic Stock Videos'}
                      </p>
                      <p className={`text-xs ${
                        videoSource === 'ai' ? 'text-purple-700 dark:text-purple-300' :
                        videoSource === 'hybrid' ? 'text-cyan-700 dark:text-cyan-300' :
                        'text-blue-700 dark:text-blue-300'
                      }`}>
                        {videoSource === 'ai' ? 'Pixverse → LongCat → Wan → Hunyuan → Kling → Veo' : 
                         videoSource === 'hybrid' ? 'AI video clips + HD stock B-roll footage' : 
                         'Real HD footage from Pexels • Renders in ~30s'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Library className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-700 dark:text-green-300">Auto-saves to your library</p>
                  </div>
                </div>
              </div>

              {/* Voice/TTS Settings */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice & Narration
                </Label>
                
                {/* Voice Option Toggle */}
                <RadioGroup value={voiceOption} onValueChange={setVoiceOption} className="grid grid-cols-3 gap-2">
                  <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                    voiceOption === 'tts' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`} onClick={() => setVoiceOption('tts')}>
                    <RadioGroupItem value="tts" id="tts" />
                    <Label htmlFor="tts" className="cursor-pointer text-sm">🎙️ AI Voice (TTS)</Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                    voiceOption === 'upload' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`} onClick={() => setVoiceOption('upload')}>
                    <RadioGroupItem value="upload" id="upload" />
                    <Label htmlFor="upload" className="cursor-pointer text-sm">🎤 Record/Upload</Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                    voiceOption === 'none' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`} onClick={() => setVoiceOption('none')}>
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer text-sm">🔇 No Voice</Label>
                  </div>
                </RadioGroup>

                {/* TTS Settings */}
                {voiceOption === 'tts' && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                    {/* Narration Mode */}
                    <div className="space-y-2">
                      <Label className="text-sm">Narration Mode</Label>
                      <Select value={narrationMode} onValueChange={setNarrationMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dialogue-only">
                            <div className="flex items-center gap-2">
                              <span>💬</span>
                              <div>
                                <p>Dialogue Only</p>
                                <p className="text-xs text-muted-foreground">Speaks only quoted text (~70% cost savings)</p>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="full">
                            <div className="flex items-center gap-2">
                              <span>📜</span>
                              <div>
                                <p>Full Script</p>
                                <p className="text-xs text-muted-foreground">Narrates entire script</p>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">TTS Language</Label>
                        <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                            <SelectItem value="bn">🇧🇩 Bengali</SelectItem>
                            <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                            <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                            <SelectItem value="fr">🇫🇷 French</SelectItem>
                            <SelectItem value="de">🇩🇪 German</SelectItem>
                            <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                            <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                            <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                            <SelectItem value="ar">🇸🇦 Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Voice {loadingVoices && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={loadingVoices || availableVoices.length === 0}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(voicesByVariant).map(([variant, voices]) => (
                              <div key={variant}>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">{variant}</div>
                                {voices.map(voice => (
                                  <SelectItem key={voice.name} value={voice.name}>
                                    {voice.ssmlGender === 'MALE' ? '👨' : '👩'} {voice.name.split('-').slice(-1)[0]}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload/Record Voice */}
                {voiceOption === 'upload' && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex gap-2">
                      <Button
                        variant={isRecording ? 'destructive' : 'outline'}
                        onClick={isRecording ? stopRecording : startRecording}
                        className="flex-1"
                      >
                        {isRecording ? (
                          <>🔴 Stop ({recordingTime}s)</>
                        ) : (
                          <>🎤 Record Voice</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => voiceFileInputRef.current?.click()} className="flex-1">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Audio
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

                {/* Caption Style Selector */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Caption Style
                  </Label>
                  <Select value={captionStyle} onValueChange={setCaptionStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span>🚫</span> No Captions
                        </div>
                      </SelectItem>
                      <SelectItem value="bold-outline">
                        <div className="flex items-center gap-2">
                          <span>✨</span> Bold Outline (Default)
                        </div>
                      </SelectItem>
                      <SelectItem value="karaoke">
                        <div className="flex items-center gap-2">
                          <span>🎤</span> Karaoke (Word by Word)
                        </div>
                      </SelectItem>
                      <SelectItem value="neon-glow">
                        <div className="flex items-center gap-2">
                          <span>💜</span> Neon Glow
                        </div>
                      </SelectItem>
                      <SelectItem value="yellow-highlight">
                        <div className="flex items-center gap-2">
                          <span>💛</span> Yellow Highlight
                        </div>
                      </SelectItem>
                      <SelectItem value="tiktok-style">
                        <div className="flex items-center gap-2">
                          <span>📱</span> TikTok Style
                        </div>
                      </SelectItem>
                      <SelectItem value="minimal-clean">
                        <div className="flex items-center gap-2">
                          <span>🤍</span> Minimal Clean
                        </div>
                      </SelectItem>
                      <SelectItem value="zoomed-in">
                        <div className="flex items-center gap-2">
                          <span>🔍</span> Zoomed In (Center)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Generate & Preview */}
        <div className="space-y-6">
          <Card className={`bg-gradient-to-br ${selectedTemplate?.color || 'from-violet-500 to-purple-500'} text-white`}>
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <span className="text-4xl">{selectedTemplate?.icon}</span>
                <h3 className="font-bold mt-2">{selectedTemplate?.shortName || selectedTemplate?.name}</h3>
              </div>
              
              <Button
                className="w-full h-12 text-lg bg-white text-black hover:bg-white/90"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Video
                  </>
                )}
              </Button>
              
              {generating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2 bg-white/20" />
                  <p className="text-xs text-center text-white/80">{progressMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Result */}
          {videoResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Your Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`relative rounded-lg overflow-hidden bg-black ${
                  format === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
                }`}>
                  <video
                    src={videoResult.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => setVideoResult(null)}>
                    New
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Perfect For */}
          {selectedTemplate?.perfectFor && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">✨ Perfect For</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.perfectFor.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
