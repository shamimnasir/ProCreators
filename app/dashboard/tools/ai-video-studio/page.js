'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Video, Image as ImageIcon, Upload, Download, 
  Play, Wand2, Monitor, Smartphone, Clock, Zap, Film, ArrowLeft,
  Type, Music, Mic, ChevronRight, Info, Search, Grid, Star, X, Library,
  TrendingUp, ArrowRight, Users, Rocket, BookOpen, Lightbulb, Smile,
  GraduationCap, Briefcase, Skull, Heart, PartyPopper, ShoppingBag, RefreshCw,
  Flame, FileText, Clapperboard, Gift, Camera, Globe, MessageSquare, ShoppingCart, Bot
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

// Import friendly names and voice config
import { VIDEO_SOURCE_NAMES, PROCESSING_STEP_NAMES, getProgressMessage } from '@/config/friendly-names'
import { 
  formatVoiceForDisplay, 
  getVoiceGender, 
  getVoiceType, 
  getFriendlyVoiceName,
  getGenderIcon,
  groupVoicesForUI,
  SUPPORTED_TTS_LANGUAGES 
} from '@/config/voice-config'

// Import Quick Reels niches
import { QUICK_REELS_NICHES, NICHE_ICON_MAP } from '@/config/quick-reels-niches'

// Icon component mapping for professional Lucide icons
const ICON_COMPONENTS = {
  'BookOpen': BookOpen,
  'TrendingUp': TrendingUp,
  'Lightbulb': Lightbulb,
  'Smile': Smile,
  'Star': Star,
  'GraduationCap': GraduationCap,
  'Briefcase': Briefcase,
  'Skull': Skull,
  'Heart': Heart,
  'Film': Film,
  'PartyPopper': PartyPopper,
  'Wand2': Wand2,
  'ShoppingBag': ShoppingBag,
  'RefreshCw': RefreshCw,
  'Zap': Zap,
  'Users': Users,
  'Rocket': Rocket,
  'Flame': Flame,
  'Smartphone': Smartphone,
  'FileText': FileText,
  'Clapperboard': Clapperboard,
  'Gift': Gift,
  'Camera': Camera,
  'Globe': Globe,
  'Music': Music,
  'MessageSquare': MessageSquare,
  'Search': Search,
  'ShoppingCart': ShoppingCart,
  'Bot': Bot
}

// Helper to render icon from string name
function NicheIcon({ iconName, className = "h-6 w-6" }) {
  const IconComponent = ICON_COMPONENTS[iconName]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  return <Wand2 className={className} />
}

// Quick Mode Categories
const NICHE_CATEGORIES = [
  {
    id: 'storytelling',
    name: 'Storytelling',
    icon: 'BookOpen',
    description: 'Captivating narratives and tales',
    color: 'from-purple-500 to-pink-500',
    niches: ['mini-stories', 'horror', 'kids-stories', 'transformation']
  },
  {
    id: 'educational',
    name: 'Educational',
    icon: 'Lightbulb',
    description: 'Learn and teach with engaging content',
    color: 'from-blue-500 to-cyan-500',
    niches: ['facts-explainer', 'kids-learning', 'documentary']
  },
  {
    id: 'emotional',
    name: 'Emotional & Lifestyle',
    icon: 'Heart',
    description: 'Connect with hearts and minds',
    color: 'from-red-500 to-pink-500',
    niches: ['motivational', 'relationship', 'gratitude']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'PartyPopper',
    description: 'Fun content that entertains',
    color: 'from-yellow-500 to-orange-500',
    niches: ['comedy', 'festival', 'generic']
  },
  {
    id: 'business',
    name: 'Business & Marketing',
    icon: 'Briefcase',
    description: 'Promote and grow your brand',
    color: 'from-indigo-500 to-purple-500',
    niches: ['business-promo', 'product-review']
  }
]

// Niche Card Component for Quick Mode
function NicheCard({ niche, categoryColor, expanded = false }) {
  const href = niche.customPage || `/dashboard/tools/quick-reels/${niche.slug}`
  
  return (
    <Link href={href}>
      <Card className={`group h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 ${niche.cardBg}`}>
        <CardHeader className={expanded ? "pb-2" : "pb-1"}>
          <div className="flex items-start justify-between">
            <div className={`mb-2 group-hover:scale-110 transition-transform p-2 rounded-lg bg-gradient-to-br ${categoryColor || 'from-primary/20 to-primary/10'}`}>
              <NicheIcon iconName={niche.icon} className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <CardTitle className={`group-hover:text-primary transition-colors ${expanded ? "text-lg" : "text-base"}`}>
            {niche.name}
          </CardTitle>
          <CardDescription className={expanded ? "" : "text-xs line-clamp-2"}>
            {niche.tagline}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {expanded && (
            <p className="text-sm text-muted-foreground mb-3">
              {niche.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Create Video <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function AIVideoStudioPageContent() {
  // Read mode from URL params
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'quick' ? 'quick' : 'quick'  // Default to quick mode
  
  // Mode state: 'quick' or 'ai'
  const [studioMode, setStudioMode] = useState(initialMode)
  const [quickModeCategory, setQuickModeCategory] = useState('all')
  
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
  const [videoSource, setVideoSource] = useState('ai') // 'ai' or 'hybrid' (removed 'stock')
  
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
        
        // Group voices using the new voice config utility
        const grouped = groupVoicesForUI(data.voices)
        setVoicesByVariant(grouped)
        
        // Select first voice if none selected - prefer Premium HD
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

  // Get credit hooks
  const { checkAndDeduct, refund, complete } = useCredits()

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
    
    // Deduct credits first (video is expensive)
    const creditResult = await checkAndDeduct('ai-video-studio', { duration })
    if (!creditResult.success) {
      toast({
        title: 'Insufficient Credits',
        description: creditResult.error || 'Video generation requires more credits.',
        variant: 'destructive'
      })
      return
    }
    
    setGenerating(true)
    setProgress(0)
    setProgressMessage(
      videoSource === 'ai' ? '🎨 Starting AI video creation...' :
      videoSource === 'hybrid' ? '🎬 Creating AI + Stock mix...' :
      '🔍 Finding best footage...'
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
      
      // Calculate estimated processing time based on script length and video options
      const scriptLength = (enhancedPrompt || prompt).length
      const estimatedTTSDuration = Math.ceil(scriptLength / 12) // ~12 chars per second for TTS
      const hasTTS = voiceOption === 'tts'
      const hasCaptions = captionStyle !== 'none'
      
      // Warn if script is very long
      if (hasTTS && estimatedTTSDuration > duration * 2) {
        console.log(`Warning: Script (${scriptLength} chars) may produce ~${estimatedTTSDuration}s of audio for ${duration}s video`)
      }
      
      // Progress simulation with better time estimates
      const segments = Math.ceil(duration / 5)
      let currentProgress = 0
      let elapsedTime = 0
      const aiModels = ['Pixverse v5.5', 'LongCat', 'Wan 2.5', 'Hunyuan', 'Kling']
      let modelIndex = 0
      
      // Processing steps for progress messages - user-friendly
      const processingSteps = [
        { at: 5, msg: hasTTS ? '🎙️ Creating voiceover...' : '📹 Preparing video clips...' },
        { at: 20, msg: '📥 Loading video content...' },
        { at: 35, msg: '🔧 Optimizing quality...' },
        { at: 50, msg: '🎬 Assembling video...' },
        { at: 65, msg: hasTTS ? '🔊 Adding voiceover...' : '⚡ Processing...' },
        { at: 80, msg: hasCaptions ? '📝 Adding captions...' : '💾 Finalizing...' },
        { at: 90, msg: '💾 Saving to library...' }
      ]
      
      const progressInterval = setInterval(() => {
        elapsedTime += 1
        // Slower progress for longer operations
        const baseSpeed = videoSource === 'ai' ? 50 : videoSource === 'hybrid' ? 40 : 25
        const adjustedSpeed = hasTTS ? baseSpeed * 1.5 : baseSpeed // TTS takes longer
        currentProgress += 100 / (segments * adjustedSpeed)
        
        if (currentProgress < 95) {
          setProgress(Math.min(currentProgress, 95))
          
          // Find current step message
          const currentStep = processingSteps.filter(s => currentProgress >= s.at).pop()
          if (currentStep) {
            const timeStr = elapsedTime > 60 ? `${Math.floor(elapsedTime/60)}m ${elapsedTime%60}s` : `${elapsedTime}s`
            setProgressMessage(`${currentStep.msg} (${timeStr})`)
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
        setProgressMessage('✅ Complete!')
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
            duration: data.duration || duration,
            format,
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name
          }
        })
        
        const actualDuration = data.duration ? Math.round(data.duration) : duration
        if (libraryResult.success) {
          await complete(creditResult.transactionId)
          toast({ 
            title: '🎬 Video Generated & Saved!', 
            description: `${actualDuration}s video saved to your library (${creditResult.cost} credits used)`
          })
        } else {
          await complete(creditResult.transactionId)
          toast({ title: '🎬 Video Generated!', description: `${actualDuration}s video ready (${creditResult.cost} credits)` })
        }
      } else {
        await refund(creditResult.transactionId, data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Generation Failed', description: error.message + ' (Credits refunded)', variant: 'destructive' })
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

  // Helper function to get niches for quick mode category
  const getNichesForCategory = (categoryId) => {
    const category = NICHE_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return []
    return category.niches.map(nicheId => QUICK_REELS_NICHES.find(n => n.id === nicheId)).filter(Boolean)
  }
  
  // ==================== GALLERY VIEW ====================
  if (view === 'gallery') {
    return (
      <div className="space-y-6">
        {/* Unified Hero Header with Mode Switcher */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                <Film className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Video Studio</h1>
                <p className="text-white/80">Create AI-Powered Videos for Any Platform</p>
              </div>
              <CreditCostBadge toolId={studioMode === 'quick' ? 'quick-reels' : 'ai-video-studio'} />
            </div>
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-3 mt-6 mb-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-1 flex gap-1">
                <button
                  onClick={() => setStudioMode('quick')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    studioMode === 'quick' 
                      ? 'bg-white text-purple-700 shadow-lg' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Quick Mode
                </button>
                <button
                  onClick={() => setStudioMode('ai')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    studioMode === 'ai' 
                      ? 'bg-white text-purple-700 shadow-lg' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  AI Mode
                </button>
              </div>
              <div className="hidden md:block text-sm text-white/70 ml-2">
                {studioMode === 'quick' 
                  ? '1-click preset videos • Best for beginners' 
                  : 'Full control • Custom templates'}
              </div>
            </div>
            
            {/* Stats - Change based on mode */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {studioMode === 'quick' ? (
                <>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Play className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">13 Niches</p>
                    <p className="text-xs text-white/70">Content Types</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Clock className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">15s - 2m</p>
                    <p className="text-xs text-white/70">Video Length</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Zap className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">AI Scripts</p>
                    <p className="text-xs text-white/70">Auto-Generated</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Zap className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">1-Click</p>
                    <p className="text-xs text-white/70">Quick Export</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Wand2 className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">AI Engine</p>
                    <p className="text-xs text-white/70">Cinema Quality</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Clock className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">5s - 2m</p>
                    <p className="text-xs text-white/70">Video Duration</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Grid className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">{AI_VIDEO_TEMPLATES.length}+</p>
                    <p className="text-xs text-white/70">Templates</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <Zap className="h-5 w-5 mb-2" />
                    <p className="text-2xl font-bold">4K</p>
                    <p className="text-xs text-white/70">Max Resolution</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* ==================== QUICK MODE CONTENT ==================== */}
        {studioMode === 'quick' && (
          <>
            {/* Platform Badges */}
            <Card className="border-dashed bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Perfect for:
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook Reels'].map((platform) => (
                        <Badge key={platform} variant="secondary" className="bg-white dark:bg-purple-900">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Tabs */}
            <Tabs defaultValue="all" onValueChange={setQuickModeCategory}>
              <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  All Videos
                </TabsTrigger>
                {NICHE_CATEGORIES.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                  >
                    <NicheIcon iconName={cat.icon} className="h-4 w-4" /> {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* All Videos View */}
              <TabsContent value="all" className="mt-6">
                <div className="space-y-8">
                  {NICHE_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                          <NicheIcon iconName={category.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">{category.name}</h2>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {getNichesForCategory(category.id).map((niche) => (
                          <NicheCard key={niche.id} niche={niche} categoryColor={category.color} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Individual Category Views */}
              {NICHE_CATEGORIES.map((category) => (
                <TabsContent key={category.id} value={category.id} className="mt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                      <NicheIcon iconName={category.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category.name}</h2>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getNichesForCategory(category.id).map((niche) => (
                      <NicheCard key={niche.id} niche={niche} categoryColor={category.color} expanded />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Pro Tips Section */}
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Pro Tips for Viral Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                      <span className="text-lg">1️⃣</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">Hook in 3 Seconds</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Grab attention immediately</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                      <span className="text-lg">2️⃣</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">Post Consistently</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">3-5 videos per week</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                      <span className="text-lg">3️⃣</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">Trending Audio</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Boost discoverability</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ==================== AI MODE CONTENT ==================== */}
        {studioMode === 'ai' && (
          <>
            {/* Custom Creation CTA - Highlighted at top */}
        <Card 
          className="border-2 border-primary/50 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
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
          <CardContent className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-violet-900 dark:text-violet-100">
                    Create Custom Video from Scratch
                  </h3>
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    Full control • Any style • Your imagination
                  </p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                <Play className="h-4 w-4 mr-2" />
                Start Creating
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Badges */}
        <Card className="border-dashed bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                  Perfect for:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {['TikTok', 'Instagram', 'YouTube', 'Ads', 'E-commerce'].map((platform) => (
                    <Badge key={platform} variant="secondary" className="bg-white dark:bg-indigo-900">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                >
                  <NicheIcon iconName={cat.icon} className="h-4 w-4" /> {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayTemplates.map((template) => (
            <Card 
              key={template.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 bg-card border hover:border-primary/50 overflow-hidden group"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${template.color} text-white`}>
                    <NicheIcon iconName={template.icon} className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    {template.isPopular && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" /> Popular
                      </Badge>
                    )}
                    {template.isNew && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> New
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">{template.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {template.perfectFor.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.defaultSettings.duration}s
                  </span>
                  <span className="flex items-center gap-1">
                    {template.defaultSettings.format === 'portrait' ? <Smartphone className="h-3 w-3" /> : template.defaultSettings.format === 'square' ? <Grid className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {template.defaultSettings.format === 'portrait' ? '9:16' : template.defaultSettings.format === 'square' ? '1:1' : '16:9'}
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

        {/* Pro Tips Section - AI Mode specific */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Star className="h-5 w-5" />
              Pro Tips for AI Video Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                  <span className="text-lg">1️⃣</span>
                </div>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Detailed Prompts</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Describe camera angles, lighting, mood, and style</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                  <span className="text-lg">2️⃣</span>
                </div>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Use Templates</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Start with templates for faster, optimized results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600 dark:text-amber-300">
                  <span className="text-lg">3️⃣</span>
                </div>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Iterate & Refine</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Generate variations and pick the best one</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
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
          {format === 'portrait' ? <Smartphone className="h-3 w-3" /> : format === 'square' ? <span className="text-xs">⬜</span> : <Monitor className="h-3 w-3" />}
          {format === 'portrait' ? '9:16' : format === 'square' ? '1:1' : '16:9'}
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
                  <Zap className="h-4 w-4" />
                  Video Scene Source
                </Label>
                <RadioGroup value={videoSource} onValueChange={setVideoSource} className="space-y-3">
                  {/* Hidden stock option - removed from UI but kept for compatibility */}
                  <RadioGroupItem value="stock" id="stock" className="hidden" />
                  
                  <div 
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      videoSource === 'ai' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setVideoSource('ai')}
                  >
                    <RadioGroupItem value="ai" id="ai" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">🤖</span>
                        <Label htmlFor="ai" className="font-semibold cursor-pointer">AI-Generated Video</Label>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">⚡ Quick</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">🎬 Cinema</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">💎 Ultra</Badge>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        100% AI-generated video • Auto-selects best available quality
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
                        <Label htmlFor="hybrid" className="font-semibold cursor-pointer">AI + Stock Mix</Label>
                        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500">Best Value</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI video for key scenes + HD stock footage (auto-searched by keywords)
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        📹 3-second auto-trim • 🔍 Smart keyword search • 📝 Text overlay
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Video Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className={`p-4 rounded-lg border ${
                  videoSource === 'ai' ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800' :
                  'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {videoSource === 'ai' ? '🤖' : '✨'}
                    </span>
                    <div>
                      <p className={`font-semibold ${
                        videoSource === 'ai' ? 'text-purple-900 dark:text-purple-100' :
                        'text-cyan-900 dark:text-cyan-100'
                      }`}>
                        {videoSource === 'ai' ? 'AI Video Generation' : 
                         'AI + Stock Mix (Best Value)'}
                      </p>
                      <p className={`text-xs ${
                        videoSource === 'ai' ? 'text-purple-700 dark:text-purple-300' :
                        'text-cyan-700 dark:text-cyan-300'
                      }`}>
                        {videoSource === 'ai' ? 'Quick → Standard → Cinema → Ultra quality cascade' : 
                         'AI scenes + 3s auto-trim stock clips (keyword-searched)'}
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
                      <div className="space-y-2">
                        <Label className="text-sm">Voice {loadingVoices && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={loadingVoices || availableVoices.length === 0}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Object.entries(voicesByVariant).map(([category, voices]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted sticky top-0">
                                  {category === 'Premium HD' ? '💎 ' : category === 'Premium' ? '⭐ ' : category === 'Natural' ? '🎙️ ' : '📢 '}
                                  {category}
                                </div>
                                {voices.map(voice => (
                                  <SelectItem key={voice.name} value={voice.name}>
                                    <div className="flex items-center gap-2">
                                      <span>{voice.genderIcon}</span>
                                      <span>{voice.friendlyName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({voice.gender}{voice.accent ? `, ${voice.accent}` : ''})
                                      </span>
                                    </div>
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
              
              <div className="flex items-center justify-center gap-3 mb-2">
                <CreditCostBadge toolId="ai-video-studio" className="bg-white/20 border-white/40 text-white" />
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
                    <Wand2 className="mr-2 h-5 w-5" />
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
                  format === 'portrait' ? 'aspect-[9/16]' : format === 'square' ? 'aspect-square' : 'aspect-video'
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
      
      {/* My Recent AI Video Creations - Instagram-style Feed */}
      <RecentCreationsFeed toolType="ai-video-studio" />
    </div>
  )
}

// Recent Creations Feed Component
function RecentCreationsFeed({ toolType }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecentItems()
  }, [toolType])

  const fetchRecentItems = async () => {
    try {
      const response = await fetch(`/api/library/list?tool=${toolType}&limit=6`)
      const data = await response.json()
      if (data.success) {
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load recent items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (item) => {
    if (item.videoUrl) {
      const a = document.createElement('a')
      a.href = item.videoUrl
      a.download = `ai-video-${Date.now()}.mp4`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: 'Download Started' })
    }
  }

  if (loading) {
    return (
      <Card className="mt-8">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return null // Don't show section if no items
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Library className="h-5 w-5" />
            My Recent Creations
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/library?tool=ai-video-studio'}>
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <CardDescription>Your recent AI Video Studio creations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setPlayingVideo(playingVideo === item.id ? null : item.id)}
            >
              <video 
                src={item.videoUrl} 
                className="w-full h-full object-cover"
                controls={playingVideo === item.id}
                muted={playingVideo !== item.id}
                autoPlay={playingVideo === item.id}
                loop
                preload="metadata"
              />
              {playingVideo !== item.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                  <Play className="h-8 w-8 text-white" fill="currentColor" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs line-clamp-1">{item.title}</p>
                <p className="text-white/60 text-[10px]">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              {/* Download button on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <Download className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Wrap main page in Suspense for useSearchParams
export default function AIVideoStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AIVideoStudioPageContent />
    </Suspense>
  )
}
