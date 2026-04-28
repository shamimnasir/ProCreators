'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge, calculateDynamicCost, formatCredits } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import {
  Loader2,
  Video,
  Mic,
  Upload,
  Download,
  FileText,
  Film,
  Music,
  Type,
  Play,
  Edit,
  X,
  Check,
  Eye,
  GripVertical,
  Trash2,
  Plus,
  ImagePlus,
  Search,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Smile,
  Star,
  GraduationCap,
  Briefcase,
  Skull,
  Heart,
  PartyPopper,
  ShoppingBag,
  RefreshCw,
  Wand2,
  Clapperboard,
  Coins,
  MessageSquare,
  Clock,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Settings2,
  Square,
  StopCircle,
  Volume2,
  VolumeX
} from 'lucide-react'
import PreviewModal from './PreviewModal'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MusicPicker from './MusicPicker'

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
  'Clapperboard': Clapperboard,
  'Video': Video
}

// Helper to render icon from string name
function NicheIcon({ iconName, className = "h-8 w-8" }) {
  const IconComponent = ICON_COMPONENTS[iconName]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  return <Film className={className} />
}

// Sortable Video Item Component
function SortableVideoItem({ video, index, totalCount, onRemove, onTextChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  }

  const [showTextInput, setShowTextInput] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-2 rounded-lg transition-all ${isDragging ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/50'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 bg-black/70 text-white p-1 rounded cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="relative">
        {video.type === 'image' ? (
          <img 
            src={video.url} 
            alt={video.title || `Image ${index + 1}`}
            className="w-full h-24 object-cover rounded-lg"
          />
        ) : (
          <video 
            src={video.url} 
            className="w-full h-24 object-cover rounded-lg"
            muted
            onMouseEnter={(e) => e.target.play()}
            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
          />
        )}
        
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-bold">
          #{index + 1}
        </div>
        
        <button
          onClick={() => onRemove(index)}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove this clip"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// Step indicator component
function StepIndicator({ number, title, isActive, isComplete }) {
  return (
    <div className={`flex items-center gap-3 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
        isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <Check className="h-4 w-4" /> : number}
      </div>
      <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</span>
    </div>
  )
}

export default function StoryReelsPage({ 
  niche = 'story-reels', 
  nicheName = 'Story Video Reels', 
  nicheIcon = 'Film', 
  nicheDescription = 'Create engaging story-based video reels', 
  showCustomTopicInput = false,
  defaultVideoSource = null,
  pageTitle = null,
  pageSubtitle = null
}) {
  // Determine if we're in Stock mode (passed from parent) - skip template selection
  const isStockMode = defaultVideoSource === 'stock'
  
  // Template/Niche selection - skip for stock mode
  const [selectedTemplate, setSelectedTemplate] = useState(isStockMode ? 'stock' : null)
  const hasExternalTheme = niche && niche !== 'story-reels' // Theme was selected from Video Studio
  const [showTemplates, setShowTemplates] = useState(!isStockMode && !hasExternalTheme) // Hide templates when theme already selected
  
  // Template definitions - only for AI mode
  const TEMPLATES = [
    { id: 'custom', name: 'Custom Video', icon: '🎬', description: 'Full creative control', color: 'from-purple-500 to-pink-500' },
    { id: 'mini-stories', name: 'Mini Stories', icon: '📖', description: 'Short narrative videos', color: 'from-blue-500 to-cyan-500' },
    { id: 'motivational', name: 'Motivational', icon: '⚡', description: 'Inspiring content', color: 'from-amber-500 to-orange-500' },
    { id: 'facts-explainer', name: 'Facts & Explainers', icon: '🎓', description: 'Educational content', color: 'from-green-500 to-emerald-500' },
    { id: 'business-promo', name: 'Business Promo', icon: '💼', description: 'Product & service ads', color: 'from-slate-600 to-slate-800' },
    { id: 'comedy', name: 'Comedy & Memes', icon: '😂', description: 'Funny viral content', color: 'from-pink-500 to-rose-500' },
    { id: 'kids-stories', name: 'Kids Stories', icon: '🧸', description: 'Children\'s content', color: 'from-violet-500 to-purple-500' },
    { id: 'horror', name: 'Horror Stories', icon: '👻', description: 'Scary narratives', color: 'from-gray-800 to-black' },
  ]
  
  // Script state
  const [script, setScript] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [duration, setDuration] = useState(30)
  const [customTopic, setCustomTopic] = useState('')
  const [scriptFormat, setScriptFormat] = useState('auto')
  
  // Product review specific state
  const [productUrl, setProductUrl] = useState('')
  const [scrapingProduct, setScrapingProduct] = useState(false)
  const [productData, setProductData] = useState(null)
  const [productMedia, setProductMedia] = useState([])
  
  // Keywords & Videos (for Stock mode)
  const [keywords, setKeywords] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [stockVideos, setStockVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  
  // Scene Prompts (for AI mode)
  const [scenePrompts, setScenePrompts] = useState([])
  const [generatingPrompts, setGeneratingPrompts] = useState(false)
  
  // Voice state
  const [ttsLanguage, setTtsLanguage] = useState('en')
  const [voiceOption, setVoiceOption] = useState('tts')
  const [languageVariant, setLanguageVariant] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])
  const [voicesByVariant, setVoicesByVariant] = useState({})
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceFile, setVoiceFile] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  
  // Seed Image for character/scene consistency
  const [seedImage, setSeedImage] = useState(null)
  const [seedImagePreview, setSeedImagePreview] = useState(null)
  const [seedImageType, setSeedImageType] = useState('character')
  
  // Multi-Scene Reference Images
  const [sceneReferenceImages, setSceneReferenceImages] = useState([])
  
  // Visual References (@mentions) - Multiple images that can be referenced in prompts
  const [visualReferences, setVisualReferences] = useState([]) // [{id, file, preview, tag, name}]
  const [showReferenceUploader, setShowReferenceUploader] = useState(false)
  const referenceInputRef = useRef(null)
  
  // Composition state
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  const [captionFontSize, setCaptionFontSize] = useState('medium')
  const [captionPosition, setCaptionPosition] = useState('bottom')
  const [showCaptions, setShowCaptions] = useState(true) // New: option to disable captions
  const [useScenePrompts, setUseScenePrompts] = useState(true) // New: option to skip scene prompt generation
  const [customMusic, setCustomMusic] = useState(null)
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [resolution, setResolution] = useState('1080p')
  const [videoOrientation, setVideoOrientation] = useState('portrait') // portrait (9:16), landscape (16:9), square (1:1)
  const [composing, setComposing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null)
  const [currentJobId, setCurrentJobId] = useState(null)
  
  // Audio preview state
  const [previewingVoice, setPreviewingVoice] = useState(null)
  const [audioPreviewRef] = useState(() => typeof Audio !== 'undefined' ? new Audio() : null)
  
  const getInitialVideoSource = () => {
    if (defaultVideoSource === 'stock') return 'stock'
    if (defaultVideoSource === 'ai') return 'ai-standard'
    return 'stock'
  }
  const [videoSource, setVideoSource] = useState(getInitialVideoSource())
  
  // Character Consistency Mode
  const [consistencyMode, setConsistencyMode] = useState('seed-based') // Default to seed-based for better visual consistency
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  
  // Output state
  const [videoData, setVideoData] = useState(null)
  const [videoTimeoutOccurred, setVideoTimeoutOccurred] = useState(false)
  
  // UI State - Collapsible sections
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showSceneEditor, setShowSceneEditor] = useState(false)
  
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete, refresh: refreshCredits } = useCredits()
  const audioFileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoPreviewRef = useRef(null)

  // Determine if AI mode
  const isAIMode = videoSource && videoSource.startsWith('ai-')

  // Auto-scroll to video preview when video is ready
  useEffect(() => {
    if ((videoData?.videoUrl || videoTimeoutOccurred) && videoPreviewRef.current) {
      setTimeout(() => {
        videoPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [videoData?.videoUrl, videoTimeoutOccurred])

  // Draft Management Functions
  const getCurrentDraftData = useCallback(() => {
    return {
      title: customTopic || `${nicheName} Draft`,
      script,
      duration,
      customTopic,
      scriptFormat,
      scenePrompts,
      videoSource,
      ttsLanguage,
      languageVariant,
      selectedVoice,
      captionStyle,
      captionFontSize,
      captionPosition,
      resolution,
      keywords,
      stockVideos,
      selectedStockVideos: stockVideos.filter(v => v.selected).map(v => v.id)
    }
  }, [script, duration, customTopic, scriptFormat, scenePrompts, videoSource, 
      ttsLanguage, languageVariant, selectedVoice, captionStyle, captionFontSize, 
      captionPosition, resolution, keywords, stockVideos, nicheName])

  const loadDraftData = useCallback((data) => {
    // Use explicit undefined checks to handle empty strings properly
    setScript(data.script !== undefined ? data.script : '')
    setDuration(data.duration || 30)
    setCustomTopic(data.customTopic !== undefined ? data.customTopic : '')
    setScriptFormat(data.scriptFormat || 'auto')
    setScenePrompts(data.scenePrompts || [])
    setVideoSource(data.videoSource || 'stock')
    setTtsLanguage(data.ttsLanguage || 'en-US')
    setLanguageVariant(data.languageVariant || '')
    setSelectedVoice(data.selectedVoice || '')
    setCaptionStyle(data.captionStyle || 'centered')
    setCaptionFontSize(data.captionFontSize || 'medium')
    setCaptionPosition(data.captionPosition || 'center')
    setResolution(data.resolution || '1080p')
    setKeywords(data.keywords || [])
    if (data.stockVideos) {
      const restoredVideos = data.stockVideos.map(v => ({
        ...v,
        selected: data.selectedStockVideos?.includes(v.id) || false
      }))
      setStockVideos(restoredVideos)
    }
  }, [])

  const handleStartNew = useCallback(() => {
    setScript('')
    setDuration(30)
    setCustomTopic('')
    setScriptFormat('auto')
    setScenePrompts([])
    setKeywords([])
    setStockVideos([])
    setVideoData(null)
    setProgress(0)
    setProgressMessage('')
  }, [])

  // Load voices when language changes
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
      
      if (data.success && data.voices.length > 0) {
        setAvailableVoices(data.voices)
        
        const grouped = {}
        data.voices.forEach(voice => {
          const variant = voice.languageCodes[0]
          if (!grouped[variant]) {
            grouped[variant] = []
          }
          grouped[variant].push(voice)
        })
        
        setVoicesByVariant(grouped)
        
        const firstVariant = Object.keys(grouped)[0]
        if (!languageVariant && firstVariant) {
          setLanguageVariant(firstVariant)
        }
        
        if (!selectedVoice && firstVariant && grouped[firstVariant].length > 0) {
          setSelectedVoice(grouped[firstVariant][0].name)
        }
      } else {
        setAvailableVoices([])
        setVoicesByVariant({})
      }
    } catch (error) {
      console.error('Error loading voices:', error)
      setAvailableVoices([])
      setVoicesByVariant({})
    } finally {
      setLoadingVoices(false)
    }
  }

  const getVariantDisplayName = (variant) => {
    const names = {
      'en-US': 'American English',
      'en-GB': 'British English',
      'en-AU': 'Australian English',
      'en-IN': 'Indian English',
      'bn-IN': 'Bengali',
      'bn-BD': 'Bengali'
    }
    return names[variant] || variant
  }

  const getVoiceType = (voiceName) => {
    if (voiceName.includes('Neural2')) return 'Premium'
    if (voiceName.includes('Wavenet')) return 'High Quality'
    if (voiceName.includes('Studio')) return 'Studio'
    if (voiceName.includes('Chirp3-HD')) return 'Premium HD'
    if (voiceName.includes('Chirp')) return 'Premium'
    return 'Standard'
  }

  const getFriendlyVoiceName = (voiceName, gender) => {
    const voiceId = voiceName.split('-').pop()
    const isBengali = voiceName.startsWith('bn-')
    
    const englishMaleNames = { 'A': 'James', 'B': 'David', 'C': 'Michael', 'D': 'Robert', 'E': 'William', 'F': 'Thomas' }
    const englishFemaleNames = { 'A': 'Emily', 'B': 'Sarah', 'C': 'Jennifer', 'D': 'Emma', 'E': 'Jessica', 'F': 'Sophie' }
    const bengaliMaleNames = { 'A': 'Rahim', 'B': 'Karim', 'C': 'Salam', 'D': 'Jamal' }
    const bengaliFemaleNames = { 'A': 'Ruma', 'B': 'Suma', 'C': 'Nila', 'D': 'Mina' }
    
    if (isBengali) {
      return gender === 'MALE' ? (bengaliMaleNames[voiceId] || `Voice ${voiceId}`) : (bengaliFemaleNames[voiceId] || `Voice ${voiceId}`)
    }
    return gender === 'MALE' ? (englishMaleNames[voiceId] || `Voice ${voiceId}`) : (englishFemaleNames[voiceId] || `Voice ${voiceId}`)
  }

  // Generate AI Script
  const handleGenerateScript = async () => {
    if (!duration) {
      toast({ title: "Error", description: "Please select a duration first", variant: "destructive" })
      return
    }

    if (showCustomTopicInput && !customTopic.trim()) {
      toast({ title: "Error", description: "Please enter a topic for your video", variant: "destructive" })
      return
    }

    setScriptLoading(true)
    try {
      const userTopic = script.trim() || (showCustomTopicInput ? customTopic : undefined)
      const formatToSend = scriptFormat === 'auto' ? undefined : scriptFormat
      
      const response = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration, 
          language: ttsLanguage,
          niche,
          customTopic: userTopic,
          scriptFormat: formatToSend,
          videoSource
        })
      })

      const data = await response.json()
      if (data.success) {
        setScript(data.script)
        
        const wordCount = data.script.trim().split(/\s+/).length
        const estimatedSeconds = Math.ceil(wordCount / 2.5)
        
        if (estimatedSeconds > duration && estimatedSeconds <= 600) {
          setDuration(estimatedSeconds)
        }
        
        toast({ title: "Script Generated!", description: "Your script is ready. Review and edit if needed." })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setScriptLoading(false)
    }
  }

  // Extract Keywords
  const handleExtractKeywords = async () => {
    if (!script.trim()) {
      toast({ title: "Error", description: "Please enter or generate a script first", variant: "destructive" })
      return
    }

    setExtracting(true)
    try {
      const response = await fetch('/api/story-reels/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, duration })
      })

      const data = await response.json()
      if (data.success) {
        setKeywords(data.keywords)
        toast({ title: "Keywords Extracted!", description: `Found ${data.keywords.length} keywords` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setExtracting(false)
    }
  }

  // Handle Seed Image Upload
  const handleSeedImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file", variant: "destructive" })
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please upload an image smaller than 10MB", variant: "destructive" })
      return
    }
    
    setSeedImage(file)
    setSeedImagePreview(URL.createObjectURL(file))
    toast({ title: "Reference Image Added!", description: "Your image will guide the AI video style" })
  }
  
  const removeSeedImage = () => {
    if (seedImagePreview) URL.revokeObjectURL(seedImagePreview)
    setSeedImage(null)
    setSeedImagePreview(null)
  }

  // Handle Multi-Scene Reference Image Upload
  const handleSceneReferenceUpload = (event, sceneNumber) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file", variant: "destructive" })
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max 10MB", variant: "destructive" })
      return
    }
    
    const preview = URL.createObjectURL(file)
    
    setSceneReferenceImages(prev => {
      const filtered = prev.filter(img => img.sceneNumber !== sceneNumber)
      return [...filtered, { file, preview, sceneNumber, label: `Scene ${sceneNumber}` }].sort((a, b) => a.sceneNumber - b.sceneNumber)
    })
    
    toast({ title: `Scene ${sceneNumber} Image Added!` })
  }
  
  const removeSceneReferenceImage = (sceneNumber) => {
    setSceneReferenceImages(prev => {
      const toRemove = prev.find(img => img.sceneNumber === sceneNumber)
      if (toRemove?.preview) URL.revokeObjectURL(toRemove.preview)
      return prev.filter(img => img.sceneNumber !== sceneNumber)
    })
  }
  
  const clearAllSceneReferences = () => {
    sceneReferenceImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview) })
    setSceneReferenceImages([])
  }

  // Generate Scene Prompts
  const handleGenerateScenePrompts = async () => {
    if (!script.trim()) {
      toast({ title: "Error", description: "Please enter or generate a script first", variant: "destructive" })
      return
    }

    setGeneratingPrompts(true)
    try {
      const response = await fetch('/api/story-reels/generate-scene-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, duration })
      })

      const data = await response.json()
      if (data.success) {
        setScenePrompts(data.scenePrompts)
        setShowSceneEditor(true)
        toast({ title: "Scene Prompts Ready!", description: `Created ${data.scenePrompts.length} scenes` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingPrompts(false)
    }
  }

  const updateScenePrompt = (index, newPrompt) => {
    setScenePrompts(prev => prev.map((scene, i) => 
      i === index ? { ...scene, prompt: newPrompt, fullPrompt: `${newPrompt}, ${scene.cameraStyle}, ${scene.mood} mood, cinematic lighting, professional quality, 4K resolution` } : scene
    ))
  }

  const removeScenePrompt = (index) => {
    setScenePrompts(prev => prev.filter((_, i) => i !== index))
  }

  // Visual Reference Functions (@mentions)
  const handleAddVisualReference = (e) => {
    const files = Array.from(e.target.files)
    if (visualReferences.length + files.length > 5) {
      toast({ title: "Limit Reached", description: "Maximum 5 visual references allowed", variant: "destructive" })
      return
    }
    
    files.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newRef = {
          id: `ref_${Date.now()}_${idx}`,
          file: file,
          preview: event.target.result,
          tag: `@image${visualReferences.length + idx + 1}`,
          name: file.name.split('.')[0].substring(0, 10)
        }
        setVisualReferences(prev => [...prev, newRef])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    if (referenceInputRef.current) {
      referenceInputRef.current.value = ''
    }
  }
  
  const updateReferenceName = (id, newName) => {
    setVisualReferences(prev => prev.map(ref => 
      ref.id === id ? { ...ref, name: newName, tag: `@${newName.replace(/\s+/g, '')}` } : ref
    ))
  }
  
  const removeVisualReference = (id) => {
    setVisualReferences(prev => prev.filter(ref => ref.id !== id))
  }
  
  const insertReferenceTag = (tag) => {
    setScript(prev => prev + ` ${tag} `)
  }

  // Voice Preview Function
  const handleVoicePreview = async (voice) => {
    try {
      // Stop any currently playing audio
      if (audioPreviewRef) {
        audioPreviewRef.pause()
        audioPreviewRef.src = ''
      }
      
      setPreviewingVoice(voice.name)
      
      const response = await fetch('/api/story-reels/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voiceName: voice.name, 
          languageCode: voice.languageCodes?.[0] || `${ttsLanguage}-US`
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.audioUrl) {
        audioPreviewRef.src = data.audioUrl
        audioPreviewRef.play()
        audioPreviewRef.onended = () => setPreviewingVoice(null)
        audioPreviewRef.onerror = () => {
          setPreviewingVoice(null)
          toast({ title: "Error", description: "Failed to play audio", variant: "destructive" })
        }
      } else {
        throw new Error(data.error || 'Failed to generate preview')
      }
    } catch (error) {
      console.error('Voice preview error:', error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
      setPreviewingVoice(null)
    }
  }
  
  const stopVoicePreview = () => {
    if (audioPreviewRef) {
      audioPreviewRef.pause()
      audioPreviewRef.src = ''
    }
    setPreviewingVoice(null)
  }

  const addScenePrompt = () => {
    const newScene = {
      sceneNumber: scenePrompts.length + 1,
      prompt: '',
      mood: 'cinematic',
      cameraStyle: 'medium shot',
      fullPrompt: ''
    }
    setScenePrompts(prev => [...prev, newScene])
  }

  const handleUseCustomPrompts = () => {
    const userText = script.trim()
    if (!userText) {
      toast({ title: "Error", description: "Please enter your scene prompts first", variant: "destructive" })
      return
    }

    let lines = userText.split(/\n{2,}/).map(line => line.trim()).filter(line => line.length > 0)
    if (lines.length === 1) {
      lines = userText.split(/\n/).map(line => line.trim()).filter(line => line.length > 0)
    }

    const requiredClips = Math.ceil(duration / 10)
    const promptLines = lines.slice(0, Math.max(requiredClips, lines.length))

    const customScenes = promptLines.map((line, index) => ({
      sceneNumber: index + 1,
      prompt: line,
      mood: 'cinematic',
      cameraStyle: 'medium shot',
      fullPrompt: `${line}, cinematic lighting, professional quality, 4K resolution`
    }))

    setScenePrompts(customScenes)
    setShowSceneEditor(true)
    toast({ title: "Custom Prompts Added!", description: `Created ${customScenes.length} scenes from your text` })
  }

  // Search Stock Videos
  const handleSearchVideos = async () => {
    if (keywords.length === 0) {
      toast({ title: "Error", description: "Please extract keywords first", variant: "destructive" })
      return
    }

    setLoadingVideos(true)
    try {
      const existingClipCount = stockVideos.length
      const requiredClips = Math.ceil(duration / 3)
      const clipsNeeded = Math.max(0, requiredClips - existingClipCount)
      
      if (clipsNeeded === 0 && existingClipCount > 0) {
        toast({ title: "You have enough clips!", description: `${existingClipCount} clips ready` })
        setLoadingVideos(false)
        return
      }

      const response = await fetch('/api/story-reels/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, duration, maxClips: requiredClips })
      })

      const data = await response.json()
      if (data.success) {
        const videosWithIds = data.videos.map((video, idx) => ({
          ...video,
          id: `stock-${Date.now()}-${idx}`,
          isCustom: false
        }))
        setStockVideos(prev => [...prev, ...videosWithIds])
        toast({ title: "Videos Found!", description: `Added ${data.videos.length} video clips` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoadingVideos(false)
    }
  }

  const removeVideo = (index) => {
    const newVideos = stockVideos.filter((_, i) => i !== index)
    setStockVideos(newVideos)
  }

  const handleTextOverlayChange = (index, field, value) => {
    setStockVideos(prev => prev.map((video, i) => {
      if (i === index) {
        return { ...video, textOverlay: { ...video.textOverlay, [field]: value } }
      }
      return video
    }))
  }

  // Keyword management
  const updateKeyword = (index, value) => {
    setKeywords(prev => prev.map((k, i) => i === index ? value : k))
  }

  const removeKeyword = (index) => {
    setKeywords(prev => prev.filter((_, i) => i !== index))
  }

  const addKeyword = () => {
    setKeywords(prev => [...prev, ''])
  }

  // Product scraping
  const handleScrapeProduct = async () => {
    if (!productUrl.trim()) {
      toast({ title: "URL Required", description: "Please enter a product URL", variant: "destructive" })
      return
    }

    setScrapingProduct(true)
    try {
      const scrapeResponse = await fetch('/api/story-reels/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      })

      const scrapeData = await scrapeResponse.json()
      if (!scrapeData.success) throw new Error(scrapeData.error)

      setProductData(scrapeData.product)
      
      const allMedia = []
      if (scrapeData.product.images?.length > 0) {
        const imageMedia = scrapeData.product.images.slice(0, 10).map((url, index) => ({
          id: `product-image-${Date.now()}-${index}`,
          url, thumbnail: url,
          title: `Product Image ${index + 1}`,
          type: 'image', source: 'product'
        }))
        allMedia.push(...imageMedia)
      }
      
      if (scrapeData.product.videos?.length > 0) {
        const videoMedia = scrapeData.product.videos.map((videoData, index) => ({
          id: `ugc-video-${Date.now()}-${index}`,
          url: videoData.url, thumbnail: videoData.url,
          title: `User Review Video ${index + 1}`,
          type: 'ugc-video', source: 'ugc'
        }))
        allMedia.push(...videoMedia)
      }
      
      setProductMedia(allMedia)

      const productContext = `Product: ${scrapeData.product.name}\nBrand: ${scrapeData.product.brand}\nPrice: ${scrapeData.product.price}\n\n${scrapeData.product.description}\n\nFeatures:\n${scrapeData.product.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}`

      const scriptResponse = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: 'product-review', duration, language: ttsLanguage, customTopic: productContext, videoSource })
      })

      const scriptData = await scriptResponse.json()
      if (scriptData.success) {
        setScript(scriptData.script)
        setCustomTopic(scrapeData.product.name)
        toast({ title: "Product Loaded!", description: `Review generated for ${scrapeData.product.name}` })
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setScrapingProduct(false)
    }
  }

  const handleCustomVideoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newVideos = []
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue
      const url = URL.createObjectURL(file)
      newVideos.push({
        id: `custom-${Date.now()}-${Math.random()}`,
        url, file, isCustom: true, name: file.name
      })
    }

    if (newVideos.length > 0) {
      setStockVideos(prev => [...prev, ...newVideos])
      toast({ title: "Videos Added", description: `Added ${newVideos.length} custom video(s)` })
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setStockVideos((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      })
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(audioBlob)
        setVoiceFile(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      toast({ title: "Recording Started!", description: "Speak clearly..." })
    } catch (error) {
      toast({ title: "Microphone Error", description: "Could not access microphone", variant: "destructive" })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      toast({ title: "Recording Saved!" })
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File must be less than 10MB", variant: "destructive" })
        return
      }
      setVoiceFile(file)
      setRecordedBlob(null)
      toast({ title: "Audio Uploaded!" })
    }
  }

  // Poll job status
  const pollJobStatus = async (jobId) => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await fetch(`/api/story-reels/job-status?jobId=${jobId}`)
          const data = await response.json()
          
          if (!data.success) {
            reject(new Error(data.error || 'Failed to get job status'))
            return
          }
          
          setProgress(data.progress || 0)
          setProgressMessage(data.progressMessage || '')
          setEstimatedTimeRemaining(data.estimatedSecondsRemaining || null)
          
          if (data.status === 'completed') {
            resolve(data)
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Video generation failed'))
          } else if (data.status === 'cancelled') {
            reject(new Error('Video generation was cancelled'))
          } else {
            setTimeout(poll, 3000)
          }
        } catch (error) {
          reject(error)
        }
      }
      poll()
    })
  }

  // Cancel job
  const handleCancelJob = async () => {
    if (!currentJobId) return
    
    try {
      const response = await fetch(`/api/story-reels/cancel-job/${currentJobId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}` }
      })
      
      const data = await response.json()
      if (data.success) {
        toast({ title: "Video Generation Cancelled", description: data.refundMessage || "Your credits have been refunded" })
        setComposing(false)
        setProgress(0)
        setProgressMessage('')
        setCurrentJobId(null)
      } else {
        toast({ title: "Error", description: data.error || "Failed to cancel", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // Compose Final Video
  const handleCompose = async () => {
    if (!script.trim()) {
      toast({ title: "Error", description: "Script is required", variant: "destructive" })
      return
    }
    if (videoSource === 'stock' && stockVideos.length === 0) {
      toast({ title: "Error", description: "Please search and select stock videos", variant: "destructive" })
      return
    }
    if (voiceOption === 'tts' && !selectedVoice && availableVoices.length > 0) {
      toast({ title: "Error", description: "Please select a voice", variant: "destructive" })
      return
    }
    if (voiceOption === 'upload' && !voiceFile) {
      toast({ title: "Error", description: "Please record or upload your audio", variant: "destructive" })
      return
    }

    setComposing(true)
    setProgress(0)
    setProgressMessage('Preparing...')

    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) throw new Error('Session expired. Please log in again.')
      
      const sessionCheck = await fetch('/api/auth/session', { headers: { 'Authorization': `Bearer ${sessionToken}` } })
      const sessionData = await sessionCheck.json()
      if (!sessionData.success) {
        localStorage.removeItem('sessionToken')
        throw new Error('Session expired. Please log in again.')
      }
      
      // Calculate actual duration based on scene count for per-scene pricing
      const submitDuration = isAIMode && scenePrompts.length > 0 
        ? scenePrompts.length * 10  // Each AI scene is 10 seconds
        : duration
      
      const formData = new FormData()
      formData.append('script', script)
      formData.append('duration', submitDuration)  // Use scene-based duration for accurate billing
      formData.append('captionStyle', showCaptions ? captionStyle : 'none') // Disable captions if user opted out
      formData.append('captionFontSize', captionFontSize)
      formData.append('captionPosition', captionPosition)
      formData.append('showCaptions', showCaptions.toString())
      formData.append('videoSource', videoSource)
      formData.append('consistencyMode', consistencyMode)
      formData.append('useScenePrompts', useScenePrompts.toString()) // Whether to use scene prompts or raw prompt
      
      if (seedImage && videoSource.startsWith('ai-')) {
        formData.append('seedImage', seedImage)
        formData.append('seedImageType', seedImageType)
      }
      
      if (sceneReferenceImages.length > 0 && videoSource.startsWith('ai-')) {
        sceneReferenceImages.forEach((ref) => {
          formData.append(`sceneRefImage_${ref.sceneNumber}`, ref.file)
        })
        formData.append('sceneRefScenes', JSON.stringify(sceneReferenceImages.map(r => r.sceneNumber)))
      }
      
      if (customMusic) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', customMusic.path)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      formData.append('videoOrientation', videoOrientation) // portrait, landscape, square
      
      // Add visual references (multi-image with @mentions)
      if (visualReferences.length > 0) {
        visualReferences.forEach((ref, idx) => {
          formData.append(`visualRef_${idx}`, ref.file)
          formData.append(`visualRefTag_${idx}`, ref.tag)
          formData.append(`visualRefName_${idx}`, ref.name)
        })
        formData.append('visualReferencesCount', visualReferences.length.toString())
        formData.append('visualReferenceTags', JSON.stringify(visualReferences.map(r => ({ tag: r.tag, name: r.name }))))
      }
      
      const urlVideos = stockVideos.filter(v => !v.isCustom)
      const customVideos = stockVideos.filter(v => v.isCustom)
      
      formData.append('stockVideos', JSON.stringify(urlVideos))
      formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ 
        index: i, isCustom: !!v.isCustom, textOverlay: v.textOverlay || null
      }))))
      
      customVideos.forEach((video, idx) => {
        if (video.file) formData.append(`customVideo_${idx}`, video.file)
      })
      
      formData.append('keywords', JSON.stringify(keywords))
      formData.append('scenePrompts', JSON.stringify(scenePrompts))
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)

      if (voiceOption === 'tts') {
        formData.append('selectedVoice', selectedVoice || '')
      } else if (voiceOption === 'upload') {
        formData.append('voiceFile', voiceFile)
      }

      // Always use async mode for reliable processing
      // Stock video processing can take 60+ seconds even for short videos (downloads, concat, audio, captions)
      // AI video always needs async due to generation time
      const useAsync = true // Force async mode for all video generation
      const endpoint = '/api/story-reels/compose-async'

      // Note: The sync endpoint (/api/story-reels/compose) is kept for backward compatibility
      // but we use async for better UX with progress polling
      
      // Async mode - all video generation uses this
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) errorMessage = errorData.error
        } catch (e) {}
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.jobId) {
        setCurrentJobId(data.jobId)
        toast({ title: "Video Generation Started!", description: "This may take a few minutes..." })
        
        const result = await pollJobStatus(data.jobId)
        
        if (result.success) {
          setProgress(100)
          setProgressMessage('Video ready!')
          setVideoData(result)
          setCurrentJobId(null)
          refreshCredits() // Refresh credit balance after generation
          toast({ title: "Success!", description: "Your video is ready!" })
        }
      } else if (data.success) {
        setProgress(100)
        setVideoData(data)
        refreshCredits() // Refresh credit balance after generation
        toast({ title: "Success!", description: "Your video is ready!" })
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      const isTimeoutError = error.message?.includes('520') || error.message?.includes('504') || error.message?.includes('timeout')
      
      if (isTimeoutError) {
        setVideoTimeoutOccurred(true)
        setProgress(100)
        toast({ title: "Video Processing Complete!", description: "Check your Library for the video!" })
      } else if (!error.message?.includes('cancelled')) {
        toast({ title: "Error", description: error.message || "Failed to generate video", variant: "destructive" })
      }
    } finally {
      setComposing(false)
    }
  }

  // Calculate actual duration based on scene count (10s per scene)
  // This ensures per-scene pricing - deleting a scene reduces the cost
  const actualDuration = isAIMode && scenePrompts.length > 0 
    ? scenePrompts.length * 10  // Each scene is 10 seconds
    : duration  // Use selected duration for stock video mode or before scenes are generated

  // Calculate credits based on actual duration and selected model (per-scene pricing)
  const creditToolIdMap = {
    'ai-standard': 'quick-reels-ai-standard',
    'ai-professional': 'quick-reels-ai-professional',
    'ai-cinema': 'quick-reels-ai-cinema',
    'ai-wan': 'quick-reels-ai-wan',
    'ai-ltx': 'quick-reels-ai-ltx',
    'ai-essential': 'quick-reels-ai-essential',
  }
  const aiCreditToolId = creditToolIdMap[videoSource] || 'quick-reels-ai-standard'
  
  const estimatedCredits = isAIMode 
    ? calculateDynamicCost(aiCreditToolId, actualDuration, consistencyMode)
    : calculateDynamicCost('quick-reels-stock', duration)

  // Determine completion status for steps
  const hasScript = script.trim().length > 30
  const hasScenePrompts = scenePrompts.length > 0
  const hasStockVideos = stockVideos.length > 0
  // Fix: Include 'silent' option as valid voice selection
  const hasVoice = voiceOption === 'silent' ? true : (voiceOption === 'tts' ? !!selectedVoice : !!voiceFile)
  const isReadyToGenerate = hasScript && (isAIMode ? hasScenePrompts : hasStockVideos) && hasVoice

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${isStockMode ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-pink-500'} text-white`}>
              <Video className="h-6 w-6" />
            </div>
            {isStockMode ? 'Stock Video Studio' : (pageTitle || 'AI Video Studio')}
          </h1>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Coins className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            {isAIMode && scenePrompts.length > 0 
              ? `${scenePrompts.length} scenes × 10s = ${formatCredits(estimatedCredits)} credits`
              : `${formatCredits(estimatedCredits)} credits`
            }
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {isStockMode 
            ? 'HD Stock footage from Pexels • Fast & affordable • Full creative control'
            : pageSubtitle || 'Create any type of video with AI • Upload references, describe your vision, generate'
          }
        </p>
      </div>

      {/* Template Selector - Only show for AI mode */}
      {showTemplates && !selectedTemplate && !isStockMode && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Choose a Template or Start Custom</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedTemplate('custom')
                setShowTemplates(false)
              }}
            >
              Skip to Custom →
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id)
                  setShowTemplates(false)
                  // Set niche-specific defaults
                  if (template.id !== 'custom') {
                    toast({ 
                      title: `${template.name} Selected`, 
                      description: 'Template applied! Customize your video below.' 
                    })
                  }
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br ${template.color} text-white`}
              >
                <div className="text-2xl mb-2">{template.icon}</div>
                <div className="font-semibold">{template.name}</div>
                <div className="text-xs opacity-80">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Template Badge - only for AI mode */}
      {selectedTemplate && !isStockMode && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {TEMPLATES.find(t => t.id === selectedTemplate)?.icon} {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedTemplate(null)
              setShowTemplates(true)
            }}
          >
            Change Template
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* STEP 1: Your Story */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <CardTitle className="text-lg">What's Your Video About?</CardTitle>
                    <CardDescription>Describe your idea or let AI generate a script</CardDescription>
                  </div>
                </div>
                {hasScript && <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Ready</Badge>}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Topic Input (if generic/custom niche) */}
              {showCustomTopicInput && (
                <div className="space-y-2">
                  <Label>Video Topic</Label>
                  <Input
                    placeholder="e.g., productivity tips, fitness motivation, cooking tutorial..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="text-base"
                  />
                </div>
              )}

              {/* Product URL for product review */}
              {niche === 'product-review' && (
                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Label className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Product URL (Amazon, eBay, etc.)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://www.amazon.com/product/..."
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      disabled={scrapingProduct}
                    />
                    <Button onClick={handleScrapeProduct} disabled={scrapingProduct || !productUrl.trim()}>
                      {scrapingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  {productData && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Loaded: {productData.name}
                    </div>
                  )}
                </div>
              )}

              {/* Visual References Section (@mentions) - AI mode only */}
              {!isStockMode && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label className="text-base font-semibold">Visual References</Label>
                      <p className="text-xs text-muted-foreground">Add images and reference them in your prompt with @tags</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {visualReferences.length}/5
                  </Badge>
                </div>
                
                {/* Reference Images Grid */}
                {visualReferences.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {visualReferences.map((ref) => (
                      <div key={ref.id} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500/50 bg-background">
                          <img 
                            src={ref.preview} 
                            alt={ref.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Tag Badge */}
                        <div 
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-purple-700 whitespace-nowrap"
                          onClick={() => insertReferenceTag(ref.tag)}
                          title="Click to insert into prompt"
                        >
                          {ref.tag}
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={() => removeVisualReference(ref.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {/* Edit Name */}
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateReferenceName(ref.id, e.target.value)}
                          className="absolute top-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-center"
                          placeholder="Name"
                          maxLength={10}
                        />
                      </div>
                    ))}
                    
                    {/* Add More Button */}
                    {visualReferences.length < 5 && (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-purple-500/50 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/10 transition-colors">
                        <Plus className="h-6 w-6 text-purple-500" />
                        <span className="text-xs text-purple-500">Add</span>
                        <input
                          ref={referenceInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddVisualReference}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
                
                {/* Empty State - Upload Button */}
                {visualReferences.length === 0 && (
                  <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:bg-purple-500/5 transition-colors">
                    <ImagePlus className="h-8 w-8 text-purple-500" />
                    <div className="text-center">
                      <p className="font-medium text-purple-600">Upload Reference Images</p>
                      <p className="text-xs text-muted-foreground">People, products, or scenes to include in your video</p>
                    </div>
                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddVisualReference}
                      className="hidden"
                    />
                  </label>
                )}
                
                {/* Usage Hint */}
                {visualReferences.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Click on any @tag to insert it into your prompt. Example: "{visualReferences[0]?.tag} is walking in the park"
                  </p>
                )}
              </div>
              )}

              {/* Script Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Your Topic / Idea / Raw Prompt</Label>
                  <span className="text-xs text-muted-foreground">{script.length} characters</span>
                </div>
                <Textarea
                  placeholder={visualReferences.length > 0 
                    ? `Use @tags to reference your images! Example: "${visualReferences[0]?.tag} is holding a product and walking through a busy street..."`
                    : "Describe what you want in your video... You can generate an AI script or use your text directly as the scene prompt!"
                  }
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={6}
                  className="text-base resize-none"
                />
              </div>

              {/* Duration Quick Select */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Label className="whitespace-nowrap">Duration:</Label>
                <div className="flex gap-2 flex-wrap">
                  {[10, 15, 30, 45, 60].map(d => (
                    <Button
                      key={d}
                      variant={duration === d ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDuration(d)}
                      className="min-w-[50px]"
                    >
                      {d}s
                    </Button>
                  ))}
                  <Button
                    variant={duration > 60 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDuration(120)}
                  >
                    2min+
                  </Button>
                </div>
              </div>

              {/* Generate Script OR Use as Scene Prompt Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={handleGenerateScript} 
                  disabled={scriptLoading}
                  className="h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {scriptLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="mr-2 h-5 w-5" /> Generate AI Script</>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    if (script.trim().length < 20) {
                      toast({ title: "Too Short", description: "Please enter at least 20 characters for your prompt", variant: "destructive" })
                      return
                    }
                    // Calculate number of scenes based on duration
                    const numScenes = Math.ceil(duration / 10)
                    // Create scene prompts from the raw text
                    const rawScenePrompts = Array(numScenes).fill(script.trim())
                    setScenePrompts(rawScenePrompts)
                    setUseScenePrompts(false) // Disable AI scene prompt generation
                    setShowSceneEditor(true)
                    toast({ 
                      title: "Using Raw Prompt", 
                      description: `Your prompt will be used for all ${numScenes} scene(s). Same prompt = more consistent characters!` 
                    })
                  }}
                  disabled={scriptLoading || script.trim().length < 20}
                  variant="outline"
                  className="h-12 text-base border-2 hover:bg-accent"
                >
                  <FileText className="mr-2 h-5 w-5" /> Use as Scene Prompt
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                💡 <strong>Tip:</strong> "Use as Scene Prompt" gives better character consistency by using your exact text for all scenes
              </p>
            </CardContent>
          </Card>

          {/* STEP 2: Video Style (for AI mode) or Stock Videos */}
          {hasScript && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <CardTitle className="text-lg">
                        {isAIMode ? 'Generate Video Scenes' : 'Find Video Clips'}
                      </CardTitle>
                      <CardDescription>
                        {isAIMode ? 'AI will create unique video clips for each scene' : 'Search for matching stock footage'}
                      </CardDescription>
                    </div>
                  </div>
                  {(isAIMode ? hasScenePrompts : hasStockVideos) && (
                    <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Ready</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* AI Mode: Video Quality Selection */}
                {defaultVideoSource === 'ai' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        videoSource === 'ai-standard' || videoSource === 'ai-professional'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md'
                          : 'border-muted hover:border-purple-300'
                      }`}
                      onClick={() => setVideoSource('ai-standard')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🎬</span>
                        <Badge className="bg-purple-500 text-white text-[10px]">Premium</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">Kling v2.5</h4>
                      <p className="text-xs text-muted-foreground mt-1">Best quality & motion</p>
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1.5">~2,600 credits / 30s</p>
                    </div>
                    
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        videoSource === 'ai-wan'
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 shadow-md'
                          : 'border-muted hover:border-cyan-300'
                      }`}
                      onClick={() => setVideoSource('ai-wan')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🌊</span>
                        <Badge className="bg-cyan-500 text-white text-[10px]">Balanced</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">Wan 2.2</h4>
                      <p className="text-xs text-muted-foreground mt-1">Great quality, affordable</p>
                      <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mt-1.5">~1,900 credits / 30s</p>
                    </div>
                    
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        videoSource === 'ai-ltx'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md'
                          : 'border-muted hover:border-green-300'
                      }`}
                      onClick={() => setVideoSource('ai-ltx')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">⚡</span>
                        <Badge className="bg-green-500 text-white text-[10px]">Fast</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">LTX Video</h4>
                      <p className="text-xs text-muted-foreground mt-1">Fastest & budget</p>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1.5">~400 credits / 30s</p>
                    </div>
                  </div>
                )}

                {/* AI Mode: Generate Scene Prompts */}
                {isAIMode && (
                  <>
                    <Button 
                      onClick={handleGenerateScenePrompts} 
                      disabled={generatingPrompts}
                      className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {generatingPrompts ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Scenes...</>
                      ) : (
                        <><Play className="mr-2 h-5 w-5" /> Generate {Math.ceil(duration / 10)} Video Scenes</>
                      )}
                    </Button>

                    {/* Scene Prompts Editor */}
                    {scenePrompts.length > 0 && (
                      <Collapsible open={showSceneEditor} onOpenChange={setShowSceneEditor}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit {scenePrompts.length} Scene Prompts
                            </span>
                            {showSceneEditor ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4 space-y-3">
                          {scenePrompts.map((scene, index) => (
                            <div key={index} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                              <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {scene.sceneNumber}
                              </div>
                              <div className="flex-1">
                                <Textarea
                                  value={scene.prompt}
                                  onChange={(e) => updateScenePrompt(index, e.target.value)}
                                  placeholder="Describe this scene..."
                                  rows={2}
                                  className="text-sm resize-none"
                                />
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700 h-7 w-7"
                                onClick={() => removeScenePrompt(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={addScenePrompt} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Scene
                          </Button>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Reference Images (Simplified) */}
                    {scenePrompts.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Add Reference Images (Optional)
                              {sceneReferenceImages.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{sceneReferenceImages.length}</Badge>
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {scenePrompts.map((scene, index) => {
                              const existingRef = sceneReferenceImages.find(img => img.sceneNumber === index + 1)
                              return (
                                <div key={index} className="relative aspect-square">
                                  {existingRef ? (
                                    <div className="relative w-full h-full">
                                      <img 
                                        src={existingRef.preview} 
                                        alt={`Scene ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border-2 border-purple-500"
                                      />
                                      <button
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        onClick={() => removeSceneReferenceImage(index + 1)}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 rounded-b-lg">
                                        #{index + 1}
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleSceneReferenceUpload(e, index + 1)}
                                      />
                                      <Plus className="h-4 w-4 text-muted-foreground/50" />
                                      <span className="text-[10px] text-muted-foreground/50 mt-1">#{index + 1}</span>
                                    </label>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Upload images to guide how each scene should look
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </>
                )}

                {/* Stock Mode: Keywords and Search */}
                {!isAIMode && (
                  <>
                    <Button 
                      onClick={handleExtractKeywords} 
                      disabled={extracting}
                      className="w-full h-12 text-base"
                      variant="outline"
                    >
                      {extracting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Search className="mr-2 h-5 w-5" /> Find Keywords for Stock Videos</>
                      )}
                    </Button>

                    {/* Keywords Display */}
                    {keywords.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                              {keyword}
                              <button onClick={() => removeKeyword(index)} className="ml-2">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Button onClick={handleSearchVideos} disabled={loadingVideos} className="w-full">
                          {loadingVideos ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                          Search Stock Videos
                        </Button>
                      </div>
                    )}

                    {/* Stock Videos Preview */}
                    {stockVideos.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>{stockVideos.length} Clips Selected</Label>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              multiple
                              className="hidden"
                              onChange={handleCustomVideoUpload}
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span><Upload className="mr-2 h-3 w-3" /> Upload Custom</span>
                            </Button>
                          </label>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                          <SortableContext items={stockVideos.map(v => v.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {stockVideos.map((video, index) => (
                                <SortableVideoItem
                                  key={video.id}
                                  video={video}
                                  index={index}
                                  totalCount={stockVideos.length}
                                  onRemove={removeVideo}
                                  onTextChange={handleTextOverlayChange}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Voice Selection */}
          {(isAIMode ? hasScenePrompts : hasStockVideos) && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <CardTitle className="text-lg">Choose Voice</CardTitle>
                      <CardDescription>Select an AI voice or upload your own</CardDescription>
                    </div>
                  </div>
                  {hasVoice && <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Ready</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Voice Option Tabs */}
                <Tabs value={voiceOption} onValueChange={setVoiceOption} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tts" className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" /> AI Voice
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload
                    </TabsTrigger>
                    <TabsTrigger value="silent" className="flex items-center gap-2">
                      <VolumeX className="h-4 w-4" /> No Voice
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tts" className="pt-4 space-y-4">
                    {/* Language Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Accent</Label>
                        <Select value={languageVariant} onValueChange={(val) => {
                          setLanguageVariant(val)
                          if (voicesByVariant[val]?.length > 0) {
                            setSelectedVoice(voicesByVariant[val][0].name)
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select accent" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(voicesByVariant).map(variant => (
                              <SelectItem key={variant} value={variant}>
                                {getVariantDisplayName(variant)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Voice Selection */}
                    {loadingVoices ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : voicesByVariant[languageVariant]?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                        {voicesByVariant[languageVariant].map((voice) => (
                          <div
                            key={voice.name}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative group ${
                              selectedVoice === voice.name 
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                                : 'border-muted hover:border-green-300'
                            }`}
                            onClick={() => setSelectedVoice(voice.name)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{voice.ssmlGender === 'MALE' ? '👨' : '👩'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {getFriendlyVoiceName(voice.name, voice.ssmlGender)}
                                </div>
                                <div className="text-xs text-muted-foreground">{getVoiceType(voice.name)}</div>
                              </div>
                            </div>
                            {/* Voice Preview Button - Always visible */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (previewingVoice === voice.name) {
                                  stopVoicePreview()
                                } else {
                                  handleVoicePreview(voice)
                                }
                              }}
                              className={`absolute top-1.5 right-1.5 p-2 rounded-full transition-all shadow-sm border ${
                                previewingVoice === voice.name 
                                  ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                                  : 'bg-primary text-primary-foreground border-primary/80 hover:bg-primary/90'
                              }`}
                              title={previewingVoice === voice.name ? "Stop preview" : "Preview voice"}
                            >
                              {previewingVoice === voice.name ? (
                                <Square className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No voices available</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="upload" className="pt-4 space-y-4">
                    <div className="flex gap-3">
                      <Button 
                        onClick={recording ? stopRecording : startRecording}
                        variant={recording ? "destructive" : "outline"}
                        className="flex-1"
                      >
                        {recording ? (
                          <><Square className="mr-2 h-4 w-4" /> Stop Recording</>
                        ) : (
                          <><Mic className="mr-2 h-4 w-4" /> Record Voice</>
                        )}
                      </Button>
                      
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          ref={audioFileRef}
                        />
                        <Button variant="outline" className="w-full" asChild>
                          <span><Upload className="mr-2 h-4 w-4" /> Upload Audio</span>
                        </Button>
                      </label>
                    </div>
                    
                    {(recordedBlob || voiceFile) && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {recordedBlob ? 'Recording ready' : voiceFile?.name || 'Audio uploaded'}
                        </span>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="silent" className="pt-4">
                    <div className="text-center py-6 text-muted-foreground">
                      <VolumeX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Video will be generated without voice narration</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings (Collapsible) */}
          {hasScript && (
            <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                  </span>
                  {showAdvancedSettings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Show Captions Toggle */}
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Show Captions</Label>
                          <p className="text-xs text-muted-foreground">Display text captions on the video</p>
                        </div>
                        <Button
                          variant={showCaptions ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowCaptions(!showCaptions)}
                        >
                          {showCaptions ? <Type className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                          {showCaptions ? 'On' : 'Off'}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Caption Style (only if captions enabled) */}
                    {showCaptions && (
                      <div className="space-y-2">
                        <Label>Caption Style</Label>
                        <Select value={captionStyle} onValueChange={setCaptionStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bold-outline">Bold with Outline</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="shadow">Shadow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Caption Position (only if captions enabled) */}
                    {showCaptions && (
                      <div className="space-y-2">
                        <Label>Caption Position</Label>
                        <Select value={captionPosition} onValueChange={setCaptionPosition}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Use Scene Prompts Toggle (AI mode only) */}
                    {isAIMode && (
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Use Scene Prompts</Label>
                            <p className="text-xs text-muted-foreground">
                              {useScenePrompts 
                                ? 'AI generates unique visual prompts for each scene' 
                                : 'Use your raw prompt for all scenes (more consistent but less varied)'
                              }
                            </p>
                          </div>
                          <Button
                            variant={useScenePrompts ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setUseScenePrompts(!useScenePrompts)}
                          >
                            {useScenePrompts ? <Wand2 className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                            {useScenePrompts ? 'AI Prompts' : 'Raw Prompt'}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Resolution */}
                    <div className="space-y-2">
                      <Label>Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Video Orientation / Format */}
                    <div className="space-y-2">
                      <Label>Video Format</Label>
                      <Select value={videoOrientation} onValueChange={setVideoOrientation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">📱 Portrait (9:16) - TikTok/Reels</SelectItem>
                          <SelectItem value="landscape">🖥️ Landscape (16:9) - YouTube</SelectItem>
                          <SelectItem value="square">⬛ Square (1:1) - Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Background Music */}
                    <div className="space-y-2">
                      <Label>Background Music</Label>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setShowMusicPicker(true)}
                      >
                        <Music className="mr-2 h-4 w-4" />
                        {customMusic ? customMusic.name : 'Select Music'}
                      </Button>
                    </div>

                    {/* Character Consistency (AI mode only) */}
                    {isAIMode && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Character Consistency</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={consistencyMode === 'none' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConsistencyMode('none')}
                          >
                            ⚡ None
                          </Button>
                          <Button
                            variant={consistencyMode === 'seed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConsistencyMode('seed')}
                          >
                            🌱 Seed-Based
                          </Button>
                          <Button
                            variant={consistencyMode === 'frame-chain' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConsistencyMode('frame-chain')}
                          >
                            🔗 Frame Chain
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {consistencyMode === 'none' && 'Fastest generation, each scene independent'}
                          {consistencyMode === 'seed' && 'Same style seed for visual consistency'}
                          {consistencyMode === 'frame-chain' && 'Best consistency - links scenes visually'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Generate Button */}
          {isReadyToGenerate && !composing && !videoData && (
            <Button 
              onClick={handleCompose}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            >
              <Play className="mr-2 h-6 w-6" />
              {isAIMode && scenePrompts.length > 0 
                ? `Generate ${scenePrompts.length} Scenes (${actualDuration}s) - ${formatCredits(estimatedCredits)} credits`
                : `Generate Video (${formatCredits(estimatedCredits)} credits)`
              }
            </Button>
          )}

          {/* Progress Display */}
          {composing && (
            <Card className="border-2 border-primary">
              <CardContent className="py-8 space-y-4">
                <div className="text-center space-y-2">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Creating Your Video...</h3>
                  <p className="text-muted-foreground">{progressMessage || 'This may take a few minutes'}</p>
                </div>
                
                <Progress value={progress} className="h-3" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{Math.round(progress)}% complete</span>
                  {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {estimatedTimeRemaining >= 60 
                        ? `~${Math.ceil(estimatedTimeRemaining / 60)} min remaining`
                        : `~${Math.ceil(estimatedTimeRemaining)} sec remaining`
                      }
                    </span>
                  )}
                </div>
                
                {/* Engaging tips while waiting */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">
                    💡 <span className="font-medium">Tip:</span> {isAIMode 
                      ? `AI video generation takes ~2 min per scene. Your ${actualDuration}s video with ${scenePrompts.length || Math.ceil(actualDuration/10)} scenes is being crafted!`
                      : `Your ${actualDuration}s stock video is being assembled with voiceover, music, and captions!`
                    }
                  </p>
                </div>
                
                {currentJobId && (
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancelJob}
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Cancel Generation
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video Result */}
          {(videoData?.videoUrl || videoTimeoutOccurred) && (
            <Card className="border-2 border-green-500" ref={videoPreviewRef}>
              <CardHeader className="bg-green-50 dark:bg-green-950/30">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="h-5 w-5" />
                  Your Video is Ready!
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {videoData?.videoUrl ? (
                  <>
                    <video
                      src={videoData.videoUrl}
                      controls
                      className="w-full rounded-lg shadow-lg"
                      style={{ maxHeight: '400px' }}
                    />
                    <div className="flex gap-3">
                      <Button className="flex-1" asChild>
                        <a href={videoData.videoUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download Video
                        </a>
                      </Button>
                      <Button variant="outline" onClick={handleStartNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      Your video has been saved to your Library. Check there to download it!
                    </p>
                    <Button asChild>
                      <a href="/dashboard/library">Go to Library</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Drafts */}
        <div className="lg:col-span-1">
          <AutoSaveDraftsManager
            toolType="story-reels"
            getCurrentData={getCurrentDraftData}
            onLoadDraft={loadDraftData}
            onStartNew={handleStartNew}
            dependencies={[script, duration, customTopic, scenePrompts, videoSource, selectedVoice]}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          previewData={previewData}
          onGenerate={handleCompose}
          captionStyle={captionStyle}
          selectedVoice={selectedVoice}
        />
      )}

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <MusicPicker
          open={showMusicPicker}
          onClose={() => setShowMusicPicker(false)}
          onSelectMusic={(music) => {
            setCustomMusic(music)
            setShowMusicPicker(false)
            toast({ title: "Music Selected", description: music.name })
          }}
          videoDuration={duration}
        />
      )}
    </div>
  )
}
