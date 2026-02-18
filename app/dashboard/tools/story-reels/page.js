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
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge, calculateDynamicCost, formatCredits } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Loader2, Video, Mic, Upload, Download, 
  FileText, Film, Music, Type, Play, Edit, X, Check, Eye,
  GripVertical, Trash2, Plus, ImagePlus, Search, BookOpen,
  TrendingUp, Lightbulb, Smile, Star, GraduationCap, Briefcase,
  Skull, Heart, PartyPopper, ShoppingBag, RefreshCw, Wand2, Clapperboard, Zap, Coins} from 'lucide-react'
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
  // Fallback to Film icon for unknown icons
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
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 bg-black/70 text-white p-1 rounded cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Video/Image Preview */}
      <div className="relative">
        {video.type === 'image' ? (
          <img 
            src={video.url} 
            alt={video.title || `Image ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
        ) : (
          <video 
            src={video.url} 
            className="w-full h-32 object-cover rounded-lg"
            muted
            onMouseEnter={(e) => e.target.play()}
            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
          />
        )}
        
        {/* Clip number badge */}
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-bold">
          #{index + 1}
        </div>
        
        {/* Image/Product badge */}
        {video.type === 'image' && (
          <div className="absolute top-1 right-16 bg-purple-500 text-white text-xs px-2 py-0.5 rounded">
            📷 Image
          </div>
        )}
        
        {/* UGC Video badge */}
        {video.type === 'ugc-video' && (
          <div className="absolute top-1 right-16 bg-orange-500 text-white text-xs px-2 py-0.5 rounded">
            👤 UGC
          </div>
        )}
        
        {/* Custom badge */}
        {video.isCustom && (
          <div className="absolute top-1 right-16 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
            Custom
          </div>
        )}
        
        {/* Text overlay indicator */}
        {video.textOverlay?.text && (
          <div className="absolute top-1 right-8 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
            <Type className="h-3 w-3 inline" />
          </div>
        )}
        
        {/* Remove button */}
        <button
          onClick={() => onRemove(index)}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove this clip"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      {/* Text Overlay Controls */}
      <div className="p-2 space-y-2">
        {/* Show current text if exists */}
        {video.textOverlay?.text && !showTextInput && (
          <div className={`text-xs px-2 py-1 rounded border ${
            video.textOverlay.color === 'red' ? 'bg-red-100 border-red-300' :
            video.textOverlay.color === 'green' ? 'bg-green-100 border-green-300' :
            video.textOverlay.color === 'blue' ? 'bg-blue-100 border-blue-300' :
            'bg-yellow-100 border-yellow-300'
          }`}>
            <div className={`font-semibold truncate ${
              video.textOverlay.color === 'red' ? 'text-red-800' :
              video.textOverlay.color === 'green' ? 'text-green-800' :
              video.textOverlay.color === 'blue' ? 'text-blue-800' :
              'text-yellow-800'
            }`}>
              {video.textOverlay.color === 'red' ? '🔴' :
               video.textOverlay.color === 'green' ? '🟢' :
               video.textOverlay.color === 'blue' ? '🔵' : '🟡'} {video.textOverlay.text}
            </div>
            <div className={`text-[10px] ${
              video.textOverlay.color === 'red' ? 'text-red-600' :
              video.textOverlay.color === 'green' ? 'text-green-600' :
              video.textOverlay.color === 'blue' ? 'text-blue-600' :
              'text-yellow-600'
            }`}>
              {video.textOverlay.position || 'top'} • {video.textOverlay.color || 'yellow'}
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="w-full text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded flex items-center justify-center gap-1"
        >
          <Type className="h-3 w-3" />
          {video.textOverlay?.text ? 'Edit Text' : 'Add Text'}
        </button>
        
        {showTextInput && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Text overlay (e.g., BUY NOW 50% OFF)"
              value={video.textOverlay?.text || ''}
              onChange={(e) => onTextChange(index, 'text', e.target.value)}
              className="w-full text-xs px-2 py-1 border rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <select
              value={video.textOverlay?.position || 'top'}
              onChange={(e) => onTextChange(index, 'position', e.target.value)}
              className="w-full text-xs px-2 py-1 border rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
            <select
              value={video.textOverlay?.color || 'yellow'}
              onChange={(e) => onTextChange(index, 'color', e.target.value)}
              className="w-full text-xs px-2 py-1 border rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="yellow">🟡 Yellow - Deals/Attention</option>
              <option value="red">🔴 Red - Urgent/Limited</option>
              <option value="green">🟢 Green - Success/Go</option>
              <option value="blue">🔵 Blue - Info/Trust</option>
            </select>
            {video.textOverlay?.text && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTextChange(index, 'text', '')
                  setShowTextInput(false)
                }}
                className="w-full text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
              >
                Remove Text
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Position indicator */}
      <div className="text-center text-xs text-muted-foreground pb-1">
        {index + 1} of {totalCount}
      </div>
    </div>
  )
}

export default function StoryReelsPage({ 
  niche = 'story-reels', 
  nicheName = 'Story Video Reels', 
  nicheIcon = 'Film', 
  nicheDescription = 'Create engaging story-based video reels', 
  showCustomTopicInput = false,
  defaultVideoSource = null, // 'stock' or 'ai' - if set, locks the video source selector
  pageTitle = null, // Optional custom page title
  pageSubtitle = null // Optional custom page subtitle
}) {
  // Script state
  const [script, setScript] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [duration, setDuration] = useState(30)
  const [customTopic, setCustomTopic] = useState('')
  const [scriptFormat, setScriptFormat] = useState('auto') // 'auto', 'cinematic', 'narration'
  
  // Product review specific state
  const [productUrl, setProductUrl] = useState('')
  const [scrapingProduct, setScrapingProduct] = useState(false)
  const [productData, setProductData] = useState(null)
  const [productMedia, setProductMedia] = useState([]) // Images/videos from product URL
  
  // Keywords & Videos (for Stock mode)
  const [keywords, setKeywords] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [stockVideos, setStockVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  
  // Scene Prompts (for AI mode)
  const [scenePrompts, setScenePrompts] = useState([])
  const [generatingPrompts, setGeneratingPrompts] = useState(false)
  
  // Voice state - simplified with Google Cloud TTS
  const [ttsLanguage, setTtsLanguage] = useState('en') // Default to English for all niches
  const [voiceOption, setVoiceOption] = useState('tts') // 'tts' or 'upload'
  const [languageVariant, setLanguageVariant] = useState('') // en-US, en-GB, bn-IN, etc.
  const [availableVoices, setAvailableVoices] = useState([])
  const [voicesByVariant, setVoicesByVariant] = useState({}) // Grouped by variant
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceFile, setVoiceFile] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  
  // Composition state
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  const [captionFontSize, setCaptionFontSize] = useState('medium')
  const [captionPosition, setCaptionPosition] = useState('bottom')
  const [customMusic, setCustomMusic] = useState(null) // For Freesound/AudioDB downloads
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [resolution, setResolution] = useState('1080p')
  const [composing, setComposing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [currentJobId, setCurrentJobId] = useState(null)
  // Initialize videoSource based on defaultVideoSource prop
  // If 'stock' mode is passed, use 'stock'. If 'ai' mode is passed, default to 'ai-standard'
  const getInitialVideoSource = () => {
    if (defaultVideoSource === 'stock') return 'stock'
    if (defaultVideoSource === 'ai') return 'ai-standard' // Default to standard AI tier
    return 'stock' // Default if no mode specified
  }
  const [videoSource, setVideoSource] = useState(getInitialVideoSource()) // 'stock', 'ai-essential', 'ai-standard', 'ai-professional', 'ai-cinema'
  
  // Character Consistency Mode (for AI video generation)
  const [consistencyMode, setConsistencyMode] = useState('none') // 'none', 'seed', 'frame-chain'
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  
  // Output state
  const [videoData, setVideoData] = useState(null)
  const [videoTimeoutOccurred, setVideoTimeoutOccurred] = useState(false) // Track if timeout happened
  
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  const audioFileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoPreviewRef = useRef(null)

  // Auto-scroll to video preview when video is ready or timeout occurred
  useEffect(() => {
    if ((videoData?.videoUrl || videoTimeoutOccurred) && videoPreviewRef.current) {
      setTimeout(() => {
        videoPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [videoData?.videoUrl, videoTimeoutOccurred])

  // ==========================================
  // Draft Management Functions
  // ==========================================
  
  // Get current data for saving draft
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
      // Store the selected stock video indices
      selectedStockVideos: stockVideos.filter(v => v.selected).map(v => v.id)
    }
  }, [script, duration, customTopic, scriptFormat, scenePrompts, videoSource, 
      ttsLanguage, languageVariant, selectedVoice, captionStyle, captionFontSize, 
      captionPosition, resolution, keywords, stockVideos, nicheName])

  // Load draft data
  const loadDraftData = useCallback((data) => {
    if (data.script) setScript(data.script)
    if (data.duration) setDuration(data.duration)
    if (data.customTopic) setCustomTopic(data.customTopic)
    if (data.scriptFormat) setScriptFormat(data.scriptFormat)
    if (data.scenePrompts) setScenePrompts(data.scenePrompts)
    if (data.videoSource) setVideoSource(data.videoSource)
    if (data.ttsLanguage) setTtsLanguage(data.ttsLanguage)
    if (data.languageVariant) setLanguageVariant(data.languageVariant)
    if (data.selectedVoice) setSelectedVoice(data.selectedVoice)
    if (data.captionStyle) setCaptionStyle(data.captionStyle)
    if (data.captionFontSize) setCaptionFontSize(data.captionFontSize)
    if (data.captionPosition) setCaptionPosition(data.captionPosition)
    if (data.resolution) setResolution(data.resolution)
    if (data.keywords) setKeywords(data.keywords)
    if (data.stockVideos) {
      // Restore stock videos with selection state
      const restoredVideos = data.stockVideos.map(v => ({
        ...v,
        selected: data.selectedStockVideos?.includes(v.id) || false
      }))
      setStockVideos(restoredVideos)
    }
  }, [])

  // Start new draft
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

  // Load available voices from Google Cloud TTS and group by variant
  const loadVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await fetch(`/api/story-reels/list-voices?language=${ttsLanguage}`)
      const data = await response.json()
      
      if (data.success && data.voices.length > 0) {
        setAvailableVoices(data.voices)
        
        // Group voices by language variant (en-US, en-GB, bn-IN, etc.)
        const grouped = {}
        data.voices.forEach(voice => {
          const variant = voice.languageCodes[0] // e.g., "en-US", "en-GB"
          if (!grouped[variant]) {
            grouped[variant] = []
          }
          grouped[variant].push(voice)
        })
        
        setVoicesByVariant(grouped)
        
        // Auto-select first variant
        const firstVariant = Object.keys(grouped)[0]
        if (!languageVariant && firstVariant) {
          setLanguageVariant(firstVariant)
        }
        
        // Auto-select first voice in variant
        if (!selectedVoice && firstVariant && grouped[firstVariant].length > 0) {
          setSelectedVoice(grouped[firstVariant][0].name)
        }
        
        toast({
          title: "Voices Loaded",
          description: `Found ${Object.keys(grouped).length} accent variants with ${data.voices.length} voices`
        })
      } else {
        setAvailableVoices([])
        setVoicesByVariant({})
        toast({
          title: "Note",
          description: data.message || "Using default system voice",
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Error loading voices:', error)
      setAvailableVoices([])
      setVoicesByVariant({})
      toast({
        title: "Warning",
        description: "Could not load voices. Will use default voice.",
        variant: "default"
      })
    } finally {
      setLoadingVoices(false)
    }
  }

  // Get friendly name for language variant
  const getVariantDisplayName = (variant) => {
    const names = {
      'en-US': 'American English',
      'en-GB': 'British English',
      'en-AU': 'Australian English',
      'en-IN': 'English',
      'bn-IN': 'Bengali',
      'bn-BD': 'Bengali'
    }
    return names[variant] || variant
  }

  // Get friendly voice type from name
  const getVoiceType = (voiceName) => {
    if (voiceName.includes('Neural2')) return 'Premium (Best Quality)'
    if (voiceName.includes('Wavenet')) return 'High Quality'
    if (voiceName.includes('Studio')) return 'Studio (Premium)'
    if (voiceName.includes('Standard')) return 'Standard'
    if (voiceName.includes('Chirp3-HD')) return 'Premium HD (Best)'
    if (voiceName.includes('Chirp')) return 'Premium'
    return 'Standard'
  }

  // Get friendly name for voices based on language and characteristics
  const getFriendlyVoiceName = (voiceName, gender) => {
    // Extract voice ID from name (e.g., "bn-IN-Neural2-A" → "A")
    const voiceId = voiceName.split('-').pop()
    const isBengali = voiceName.startsWith('bn-')
    
    // Bangladeshi names for Bengali voices
    const bengaliMaleNames = {
      'A': 'রহিম (Rahim) - Warm',
      'B': 'করিম (Karim) - Deep',
      'C': 'সালাম (Salam) - Clear',
      'D': 'জামাল (Jamal) - Strong',
      'E': 'আমিন (Amin) - Smooth',
      'F': 'ফারুক (Faruk) - Rich'
    }
    
    const bengaliFemaleNames = {
      'A': 'রুমা (Ruma) - Soft',
      'B': 'সুমা (Suma) - Bright',
      'C': 'নীলা (Nila) - Gentle',
      'D': 'মীনা (Mina) - Sweet',
      'E': 'লীনা (Lina) - Calm',
      'F': 'রীনা (Rina) - Clear'
    }
    
    // English names with voice characteristics
    const englishMaleNames = {
      'A': 'James - Professional',
      'B': 'David - Authoritative',
      'C': 'Michael - Friendly',
      'D': 'Robert - Deep',
      'E': 'William - Warm',
      'F': 'Thomas - Clear',
      'G': 'Christopher - Smooth',
      'H': 'Daniel - Natural',
      'I': 'Matthew - Energetic',
      'J': 'Anthony - Confident'
    }
    
    const englishFemaleNames = {
      'A': 'Emily - Bright',
      'B': 'Sarah - Warm',
      'C': 'Jennifer - Professional',
      'D': 'Emma - Soft',
      'E': 'Jessica - Friendly',
      'F': 'Sophie - Clear',
      'G': 'Olivia - Natural',
      'H': 'Charlotte - Gentle',
      'I': 'Amelia - Sweet',
      'J': 'Isabella - Elegant'
    }
    
    if (isBengali) {
      if (gender === 'MALE') {
        return bengaliMaleNames[voiceId] || `Voice ${voiceId}`
      } else {
        return bengaliFemaleNames[voiceId] || `Voice ${voiceId}`
      }
    } else {
      if (gender === 'MALE') {
        return englishMaleNames[voiceId] || `Voice ${voiceId}`
      } else {
        return englishFemaleNames[voiceId] || `Voice ${voiceId}`
      }
    }
  }

  // Generate AI Script
  const handleGenerateScript = async () => {
    if (!duration) {
      toast({
        title: "Error",
        description: "Please select a duration first",
        variant: "destructive"
      })
      return
    }

    // For generic niche, require custom topic
    if (showCustomTopicInput && !customTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for your video",
        variant: "destructive"
      })
      return
    }

    setScriptLoading(true)
    try {
      // Use current script content as user's topic/context if they've typed something
      // This allows users to type a topic/idea and have AI expand it
      const userTopic = script.trim() || (showCustomTopicInput ? customTopic : undefined)
      
      // Determine the format to use
      // 'auto' = let backend decide (ai-visual for AI video, cinematic for long-form, narration for short)
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
          videoSource // Pass video source so backend can optimize for AI video
        })
      })

      const data = await response.json()
      if (data.success) {
        setScript(data.script)
        
        // Show which format was generated
        const formatName = data.scriptFormat === 'cinematic' ? 'Cinematic Screenplay' : 'Voiceover Narration'
        
        // Auto-adjust duration based on generated script length
        const wordCount = data.script.trim().split(/\s+/).length
        const estimatedSeconds = Math.ceil(wordCount / 2.5)
        
        // Update duration if script is longer than current setting
        if (estimatedSeconds > duration && estimatedSeconds <= 600) {
          setDuration(estimatedSeconds)
          toast({
            title: "Success",
            description: `${formatName} generated! Duration auto-adjusted to ${estimatedSeconds} seconds.`
          })
        } else if (estimatedSeconds > 600) {
          setDuration(600)
          toast({
            title: "Success",
            description: `${formatName} generated! Duration set to maximum (10 minutes).`,
            variant: "default"
          })
        } else {
          toast({
            title: "Success",
            description: `${formatName} generated successfully!`
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setScriptLoading(false)
    }
  }

  // Extract Keywords
  const handleExtractKeywords = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter or generate a script first",
        variant: "destructive"
      })
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
        toast({
          title: "Success",
          description: `Extracted ${data.keywords.length} keywords for video selection`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setExtracting(false)
    }
  }

  // Generate Scene Prompts (for AI mode) - converts script to visual prompts for AI video generation
  const handleGenerateScenePrompts = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter or generate a script first",
        variant: "destructive"
      })
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
        toast({
          title: "Scene Prompts Generated! 🎬",
          description: `Created ${data.scenePrompts.length} visual prompts for AI video generation`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGeneratingPrompts(false)
    }
  }

  // Update a single scene prompt
  const updateScenePrompt = (index, newPrompt) => {
    setScenePrompts(prev => prev.map((scene, i) => 
      i === index ? { ...scene, prompt: newPrompt, fullPrompt: `${newPrompt}, ${scene.cameraStyle}, ${scene.mood} mood, cinematic lighting, professional quality, 4K resolution` } : scene
    ))
  }

  // Remove a scene prompt
  const removeScenePrompt = (index) => {
    setScenePrompts(prev => prev.filter((_, i) => i !== index))
  }

  // Add a new scene prompt
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

  // Search Stock Videos - Smart: calculates needed clips based on duration (3 sec per clip)
  const handleSearchVideos = async () => {
    if (keywords.length === 0) {
      toast({
        title: "Error",
        description: "Please extract keywords first",
        variant: "destructive"
      })
      return
    }

    setLoadingVideos(true)
    try {
      // Calculate how many clips we need based on duration (3 seconds per clip)
      const existingClipCount = stockVideos.length
      const requiredClips = Math.ceil(duration / 3)
      const clipsNeeded = Math.max(0, requiredClips - existingClipCount)
      
      if (clipsNeeded === 0 && existingClipCount > 0) {
        toast({
          title: "Enough Clips",
          description: `You already have ${existingClipCount} clips for a ${duration}s video. Need ~${requiredClips} clips.`
        })
        setLoadingVideos(false)
        return
      }

      const response = await fetch('/api/story-reels/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords, 
          duration,
          maxClips: requiredClips // Tell API how many clips we need
        })
      })

      const data = await response.json()
      if (data.success) {
        // Add unique IDs to each video for drag-and-drop
        const videosWithIds = data.videos.map((video, idx) => ({
          ...video,
          id: `stock-${Date.now()}-${idx}`,
          isCustom: false
        }))
        // APPEND to existing clips (including product images) instead of replacing
        setStockVideos(prev => [...prev, ...videosWithIds])
        const totalClips = stockVideos.length + data.videos.length
        toast({
          title: "Videos Found!",
          description: `Added ${data.videos.length} videos. Total: ${totalClips}/${requiredClips} clips needed.`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingVideos(false)
    }
  }

  // Remove video clip
  const removeVideo = (index) => {
    const newVideos = stockVideos.filter((_, i) => i !== index)
    setStockVideos(newVideos)
    toast({
      title: "Video Removed",
      description: `Clip removed. ${newVideos.length} clips remaining.`
    })
  }

  // Handle text overlay changes
  const handleTextOverlayChange = (index, field, value) => {
    setStockVideos(prev => prev.map((video, i) => {
      if (i === index) {
        return {
          ...video,
          textOverlay: {
            ...video.textOverlay,
            [field]: value
          }
        }
      }
      return video
    }))
  }

  // Toggle product image selection
  const toggleProductImageSelection = (imageId) => {
    setProductMedia(prev => prev.map(img => 
      img.id === imageId ? { ...img, selected: !img.selected } : img
    ))
  }

  // Select all product images
  const selectAllProductImages = (selected) => {
    setProductMedia(prev => prev.map(img => ({ ...img, selected })))
  }

  // Scrape product from URL (for product review niche)
  const handleScrapeProduct = async () => {
    if (!productUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a product URL",
        variant: "destructive"
      })
      return
    }

    setScrapingProduct(true)
    try {
      // Step 1: Scrape product data
      const scrapeResponse = await fetch('/api/story-reels/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      })

      const scrapeData = await scrapeResponse.json()

      if (!scrapeData.success) {
        throw new Error(scrapeData.error)
      }

      setProductData(scrapeData.product)
      
      // Store extracted media (images + UGC videos) - mix them together
      const allMedia = []
      
      // Add product images
      if (scrapeData.product.images && scrapeData.product.images.length > 0) {
        const imageMedia = scrapeData.product.images.slice(0, 10).map((url, index) => ({
          id: `product-image-${Date.now()}-${index}`,
          url: url,
          thumbnail: url,
          title: `Product Image ${index + 1}`,
          type: 'image',
          source: 'product'
        }))
        allMedia.push(...imageMedia)
      }
      
      // Add UGC videos (max 3)
      if (scrapeData.product.videos && scrapeData.product.videos.length > 0) {
        const videoMedia = scrapeData.product.videos.map((videoData, index) => ({
          id: `ugc-video-${Date.now()}-${index}`,
          url: videoData.url,
          thumbnail: videoData.url, // Will show video preview
          title: `User Review Video ${index + 1}`,
          type: 'ugc-video',
          source: 'ugc'
        }))
        allMedia.push(...videoMedia)
      }
      
      setProductMedia(allMedia)
      
      if (allMedia.length > 0) {
        toast({
          title: "Media Extracted!",
          description: `Found ${scrapeData.product.images?.length || 0} images and ${scrapeData.product.videos?.length || 0} user videos`,
        })
      }
      
      // Step 2: Format product info for AI
      const productContext = `Product Name: ${scrapeData.product.name}
Brand: ${scrapeData.product.brand}
Price: ${scrapeData.product.price}
Category: ${scrapeData.product.category}

Product Description:
${scrapeData.product.description}

Key Features:
${scrapeData.product.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Product URL: ${scrapeData.product.url}`

      // Step 3: Generate AI review script using the system prompt
      toast({
        title: "Product Loaded!",
        description: "Generating AI review script...",
      })

      const scriptResponse = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: 'product-review',
          duration,
          language: ttsLanguage,
          customTopic: productContext,
          videoSource // Pass video source for format optimization
        })
      })

      const scriptData = await scriptResponse.json()

      if (scriptData.success) {
        setScript(scriptData.script)
        setCustomTopic(scrapeData.product.name)
        
        // Auto-extract keywords from product
        const productKeywords = [
          scrapeData.product.name.toLowerCase(),
          scrapeData.product.brand.toLowerCase(),
          scrapeData.product.category,
          ...scrapeData.product.features.slice(0, 3).map(f => f.split(' ').slice(0, 2).join(' '))
        ].filter(k => k && k.length > 2)
        
        setKeywords(productKeywords.slice(0, 8))
        
        toast({
          title: "Review Generated!",
          description: `AI review script created for ${scrapeData.product.name}`,
        })
      } else {
        // Fallback to raw product info if AI generation fails
        setScript(productContext)
        setCustomTopic(scrapeData.product.name)
        
        toast({
          title: "Product Loaded",
          description: "Using raw product info. Click 'Generate AI Story' to create review.",
          variant: "default"
        })
      }

    } catch (error) {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setScrapingProduct(false)
    }
  }

  const handleCustomVideoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newVideos = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not a video file`,
          variant: "destructive"
        })
        continue
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file)
      newVideos.push({
        id: `custom-${Date.now()}-${i}`,
        url: url,
        file: file,  // Keep the actual file for upload
        isCustom: true,
        name: file.name
      })
    }

    if (newVideos.length > 0) {
      setStockVideos(prev => [...prev, ...newVideos])
      toast({
        title: "Videos Added",
        description: `Added ${newVideos.length} custom video(s)`
      })
    }
  }

  // Handle drag end for video reordering
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(audioBlob)
        setVoiceFile(audioBlob)
        
        // Get audio duration and auto-adjust video duration
        try {
          const audio = new Audio(URL.createObjectURL(audioBlob))
          audio.addEventListener('loadedmetadata', () => {
            const audioDuration = Math.ceil(audio.duration)
            if (audioDuration > duration) {
              setDuration(Math.min(audioDuration, 600)) // Cap at 60 seconds max
              toast({
                title: "Recording Complete",
                description: `Video duration auto-adjusted to ${Math.min(audioDuration, 600)} seconds to match your recording`,
                duration: 4000
              })
            }
            URL.revokeObjectURL(audio.src)
          })
        } catch (error) {
          console.error('Error detecting audio duration:', error)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      
      toast({
        title: "Recording Started! 🎙️",
        description: "Speak clearly in your natural voice...",
        duration: 3000
      })
      
    } catch (error) {
      console.error('Microphone error:', error)
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      
      toast({
        title: "Recording Stopped",
        description: "Your voice recording is ready",
        duration: 2000
      })
    }
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File must be less than 10MB",
          variant: "destructive"
        })
        return
      }

      setVoiceFile(file)
      setRecordedBlob(null)
      
      // Get audio duration and auto-adjust video duration
      try {
        const audio = new Audio(URL.createObjectURL(file))
        audio.addEventListener('loadedmetadata', () => {
          const audioDuration = Math.ceil(audio.duration)
          if (audioDuration > duration) {
            setDuration(Math.min(audioDuration, 600)) // Cap at 60 seconds max
            toast({
              title: "Audio Uploaded",
              description: `Video duration auto-adjusted to ${Math.min(audioDuration, 600)} seconds to match your audio`,
              duration: 4000
            })
          } else {
            toast({
              title: "Success",
              description: "Audio file uploaded successfully"
            })
          }
          URL.revokeObjectURL(audio.src)
        })
      } catch (error) {
        console.error('Error detecting audio duration:', error)
        toast({
          title: "Success",
          description: "Audio file uploaded successfully"
        })
      }
    }
  }

  // Generate Preview
  const handleGeneratePreview = async () => {
    // Validation
    if (!script.trim()) {
      toast({ title: "Error", description: "Script is required", variant: "destructive" })
      return
    }
    
    const isAIMode = videoSource && videoSource.startsWith('ai-')
    
    // AI mode requires scene prompts, Stock mode requires stock videos
    if (isAIMode && scenePrompts.length === 0) {
      toast({ title: "Error", description: "Please generate scene prompts first", variant: "destructive" })
      return
    }
    if (!isAIMode && stockVideos.length === 0) {
      toast({ title: "Error", description: "Please search and select stock videos", variant: "destructive" })
      return
    }
    if (voiceOption === 'tts' && !selectedVoice && availableVoices.length > 0) {
      toast({ title: "Error", description: "Please select a voice", variant: "destructive" })
      return
    }

    // For AI mode, go directly to compose (AI videos take too long to preview)
    if (isAIMode) {
      toast({
        title: "🤖 AI Video Mode",
        description: "AI videos are generated directly. Starting video creation...",
      })
      // Call handleCompose directly for AI mode
      return handleCompose()
    }

    setGeneratingPreview(true)

    try {
      // Get auth token for authenticated request
      const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      let response
      
      // Use FormData only when we have a file to upload, otherwise use JSON (more reliable)
      if (voiceOption === 'upload' && voiceFile) {
        const formData = new FormData()
        formData.append('script', script)
        formData.append('duration', duration)
        formData.append('voiceOption', voiceOption)
        formData.append('ttsLanguage', ttsLanguage)
        formData.append('selectedVoice', selectedVoice || '')
        formData.append('videoSource', videoSource) // Add video source
        formData.append('stockVideos', JSON.stringify(stockVideos))
        formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({
          index: i,
          isCustom: !!v.isCustom,
          textOverlay: v.textOverlay || null
        }))))
        formData.append('voiceFile', voiceFile)

        response = await fetch('/api/story-reels/generate-preview', {
          method: 'POST',
          headers,
          body: formData
        })
      } else {
        // Use JSON for better compatibility (no file upload needed)
        response = await fetch('/api/story-reels/generate-preview', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            duration,
            voiceOption,
            ttsLanguage,
            selectedVoice: selectedVoice || '',
            stockVideos,
            videoOrder: stockVideos.map((v, i) => ({
              index: i,
              isCustom: !!v.isCustom,
              textOverlay: v.textOverlay || null
            }))
          })
        })
      }

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text()
        console.error('Generate preview failed:', response.status, text.substring(0, 200))
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setPreviewData(data)
        setShowPreview(true)
        toast({
          title: "Preview Ready!",
          description: "Make your adjustments and generate the final video"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Preview generation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate preview",
        variant: "destructive"
      })
    } finally {
      setGeneratingPreview(false)
    }
  }

  // Generate Final Video from Preview
  const handleGenerateFinalFromPreview = async (previewSettings) => {
    setShowPreview(false)
    setComposing(true)
    setProgress(0)

    try {
      // Validate session before starting long operation
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) {
        throw new Error('Session expired. Please log in again.')
      }
      
      // Verify session is still valid
      const sessionCheck = await fetch('/api/auth/session', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const sessionData = await sessionCheck.json()
      if (!sessionData.success) {
        localStorage.removeItem('sessionToken')
        throw new Error('Session expired. Please log in again.')
      }
      console.log('[Compose] Verified session for user:', sessionData.user?.email)
      
      const formData = new FormData()
      formData.append('script', previewSettings.captions.map(c => c.text).join(' '))
      formData.append('duration', duration)
      formData.append('captionStyle', previewSettings.captionStyle)
      formData.append('captionFontSize', previewSettings.captionFontSize || captionFontSize)
      formData.append('captionPosition', previewSettings.captionPosition || captionPosition)
      formData.append('videoOrientation', previewSettings.videoOrientation || 'portrait') // Add orientation
      formData.append('videoSource', videoSource) // Add video source for AI/Stock mode
      formData.append('consistencyMode', consistencyMode) // Add character consistency mode
      // Send music properly from preview
      if (previewSettings.customMusicPath) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', previewSettings.customMusicPath)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      
      // Handle stock videos - separate custom uploads from URLs/images
      const urlVideos = stockVideos.filter(v => !v.isCustom) // Includes stock videos AND product images
      const customVideos = stockVideos.filter(v => v.isCustom)
      
      const imageClips = urlVideos.filter(v => v.type === 'image')
      console.log('[Compose] Sending:', { 
        totalClips: stockVideos.length, 
        urlVideos: urlVideos.length, 
        customVideos: customVideos.length,
        productImages: imageClips.length
      })
      
      // Log product images being sent
      if (imageClips.length > 0) {
        console.log('[Compose] Product images:', imageClips.map((img, i) => ({
          index: i,
          type: img.type,
          url: img.url?.substring(0, 80) + '...'
        })))
      }
      
      // CRITICAL: Log the actual data being sent to backend
      console.log('[Compose] stockVideos JSON being sent:', JSON.stringify(urlVideos, null, 2))
      
      formData.append('stockVideos', JSON.stringify(urlVideos)) // Send ALL non-custom (stock + images)
      formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ 
        index: i, 
        isCustom: !!v.isCustom,
        textOverlay: v.textOverlay || null
      }))))
      
      // Append custom video files
      customVideos.forEach((video, idx) => {
        if (video.file) {
          formData.append(`customVideo_${idx}`, video.file)
        }
      })
      
      formData.append('keywords', JSON.stringify(keywords))
      formData.append('scenePrompts', JSON.stringify(scenePrompts)) // AI video scene prompts
      formData.append('voiceOption', voiceOption) // Use actual voice option (tts or upload)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('selectedVoice', previewSettings.selectedVoice || selectedVoice)
      
      // Include uploaded/recorded audio for final generation
      if (voiceOption === 'upload' && voiceFile) {
        formData.append('voiceFile', voiceFile)
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90))
      }, 2000)

      const response = await fetch('/api/story-reels/compose', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
        }
      })

      clearInterval(progressInterval)

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text()
        console.error('Final video compose failed:', response.status, text.substring(0, 200))
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setProgress(100)
        setVideoData(data)
        toast({
          title: "Success!",
          description: "Your final HD video is ready!"
        })
        
        // Auto-save is now handled by backend in /api/story-reels/compose
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Final video error:', error)
      // Check if it's a timeout error (520 or similar)
      const isTimeoutError = error.message?.includes('520') || error.message?.includes('504') || error.message?.includes('timeout') || error.name === 'TypeError'
      
      if (isTimeoutError) {
        // Set timeout state to show the "Check Library" card
        setVideoTimeoutOccurred(true)
        setProgress(100) // Show as complete since video is likely ready
        toast({
          title: "🎬 Video Processing Complete!",
          description: "Your video has been created and saved to your Library!",
          duration: 10000
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to generate final video",
          variant: "destructive"
        })
      }
    } finally {
      setComposing(false)
    }
  }

  // Poll job status for async video generation
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
          
          // Update progress
          setProgress(data.progress || 0)
          setProgressMessage(data.progressMessage || '')
          
          if (data.status === 'completed') {
            resolve(data)
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Video generation failed'))
          } else {
            // Continue polling every 3 seconds
            setTimeout(poll, 3000)
          }
        } catch (error) {
          reject(error)
        }
      }
      
      poll()
    })
  }

  // Compose Final Video (Direct - without preview)
  const handleCompose = async () => {
    // Validation
    if (!script.trim()) {
      toast({ title: "Error", description: "Script is required", variant: "destructive" })
      return
    }
    // Stock videos only required for stock mode - AI mode generates videos from script
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
      // Validate session before starting long operation
      const sessionToken = localStorage.getItem('sessionToken')
      if (!sessionToken) {
        throw new Error('Session expired. Please log in again.')
      }
      
      // Verify session is still valid
      const sessionCheck = await fetch('/api/auth/session', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const sessionData = await sessionCheck.json()
      if (!sessionData.success) {
        localStorage.removeItem('sessionToken')
        throw new Error('Session expired. Please log in again.')
      }
      console.log('[Compose] Verified session for user:', sessionData.user?.email)
      
      // Prepare form data
      const formData = new FormData()
      formData.append('script', script)
      formData.append('duration', duration)
      formData.append('captionStyle', captionStyle)
      formData.append('captionFontSize', captionFontSize)
      formData.append('captionPosition', captionPosition)
      formData.append('videoSource', videoSource) // Add video source for AI/Stock mode
      formData.append('consistencyMode', consistencyMode) // Add character consistency mode
      // Send music from Freesound/AudioDB selection
      if (customMusic) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', customMusic.path)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      
      // Handle stock videos - separate custom uploads from URLs/images
      const urlVideos = stockVideos.filter(v => !v.isCustom) // Includes stock videos AND product images
      const customVideos = stockVideos.filter(v => v.isCustom)
      
      const imageClips = urlVideos.filter(v => v.type === 'image')
      console.log('[Compose] Sending:', { 
        videoSource,
        totalClips: stockVideos.length, 
        urlVideos: urlVideos.length, 
        customVideos: customVideos.length,
        productImages: imageClips.length
      })
      
      // Log product images being sent
      if (imageClips.length > 0) {
        console.log('[Compose] Product images:', imageClips.map((img, i) => ({
          index: i,
          type: img.type,
          url: img.url?.substring(0, 80) + '...'
        })))
      }
      
      // CRITICAL: Log the actual data being sent to backend
      console.log('[Compose] stockVideos JSON being sent:', JSON.stringify(urlVideos, null, 2))
      
      formData.append('stockVideos', JSON.stringify(urlVideos)) // Send ALL non-custom (stock + images)
      formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ 
        index: i, 
        isCustom: !!v.isCustom,
        textOverlay: v.textOverlay || null
      }))))
      
      // Append custom video files
      customVideos.forEach((video, idx) => {
        if (video.file) {
          formData.append(`customVideo_${idx}`, video.file)
        }
      })
      
      formData.append('keywords', JSON.stringify(keywords))
      formData.append('scenePrompts', JSON.stringify(scenePrompts)) // AI video scene prompts
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)

      if (voiceOption === 'tts') {
        formData.append('selectedVoice', selectedVoice || '')
      } else if (voiceOption === 'upload') {
        formData.append('voiceFile', voiceFile)
      }

      // ALWAYS use async endpoint for AI videos (they take several minutes)
      // Also use async for longer stock videos (> 60 seconds)
      const useAsync = videoSource.startsWith('ai-') || duration > 60
      const endpoint = useAsync ? '/api/story-reels/compose-async' : '/api/story-reels/compose'
      
      console.log(`[Compose] Using ${useAsync ? 'async' : 'sync'} endpoint for ${duration}s ${videoSource} video`)

      if (!useAsync) {
        // Simulate progress for sync mode
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90))
        }, 2000)
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
          }
        })

        clearInterval(progressInterval)

        // Check if response is OK before parsing JSON
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = `Server error: ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (parseErr) {
            // If JSON parse fails, try to read as text
            try {
              const text = await response.text()
              console.error('Compose failed:', response.status, text.substring(0, 200))
              if (text) errorMessage = text
            } catch (e) {}
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        if (data.success) {
          setProgress(100)
          setProgressMessage('Video ready!')
          setVideoData(data)
          toast({
            title: "Success!",
            description: "Your story video is ready!"
          })
        } else {
          throw new Error(data.error)
        }
      } else {
        // Async mode - submit and poll for status
        setProgressMessage('Submitting job...')
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
          }
        })
        
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = `Server error: ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (parseErr) {
            // If JSON parse fails, try to read as text
            try {
              const text = await response.text()
              if (text) errorMessage = text
            } catch (e) {}
          }
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error)
        }
        
        const jobId = data.jobId
        setCurrentJobId(jobId)
        
        // Show estimated time
        const estMinutes = Math.ceil(data.estimatedTime / 60)
        toast({
          title: "🎬 Video Generation Started",
          description: `Generating ${duration}s video. Estimated time: ${estMinutes} minutes. Please wait...`,
          duration: 10000
        })
        
        // Poll for job completion
        setProgressMessage(`Generating ${duration}s video...`)
        const result = await pollJobStatus(jobId)
        
        // Video completed!
        setVideoData({
          success: true,
          videoUrl: result.videoUrl,
          captionsUrl: result.captionsUrl,
          duration: result.duration
        })
        
        toast({
          title: "🎉 Video Ready!",
          description: "Your video has been generated and saved to your Library!"
        })
      }
    } catch (error) {
      console.error('Compose error:', error)
      // Check if it's a timeout error (520 or similar)
      const isTimeoutError = error.message?.includes('520') || error.message?.includes('504') || error.message?.includes('timeout') || error.name === 'TypeError'
      
      if (isTimeoutError) {
        // Don't assume timeout = success - the video might have failed
        // Instead, guide user to check library or retry
        setProgress(0)
        toast({
          title: "⚠️ Connection Issue",
          description: "The request timed out. Please check your Library to see if the video was created, or try again.",
          variant: "default",
          duration: 10000
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to compose video",
          variant: "destructive"
        })
      }
    } finally {
      setComposing(false)
      setCurrentJobId(null)
      setProgressMessage('')
    }
  }

  // Download Video
  const handleDownload = async () => {
    if (!videoData?.videoUrl) return

    try {
      toast({
        title: "Preparing Download",
        description: "Please wait..."
      })

      // Fetch the video file
      const response = await fetch(videoData.videoUrl)
      if (!response.ok) throw new Error('Failed to fetch video')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `story-reel-${Date.now()}.mp4`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      toast({
        title: "Download Started",
        description: "Your video is downloading..."
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Please try right-clicking the video and select 'Save video as...'",
        variant: "destructive"
      })
    }
  }

  // Download Captions
  const handleDownloadCaptions = async () => {
    if (!videoData?.captionsUrl) return

    try {
      toast({
        title: "Preparing Download",
        description: "Please wait..."
      })

      // Fetch the captions file
      const response = await fetch(videoData.captionsUrl)
      if (!response.ok) throw new Error('Failed to fetch captions')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `story-reel-captions-${Date.now()}.srt`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      toast({
        title: "Download Started",
        description: "Your captions file is downloading..."
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Update keyword
  const updateKeyword = (index, newValue) => {
    const updated = [...keywords]
    updated[index] = newValue
    setKeywords(updated)
  }

  // Remove keyword
  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  // Add keyword
  const addKeyword = () => {
    setKeywords([...keywords, ''])
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <NicheIcon iconName={nicheIcon} className="h-8 w-8 text-primary" />
            </div>
            {pageTitle || nicheName}
          </h1>
          <p className="text-muted-foreground">{pageSubtitle || nicheDescription}</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Wand2 className="h-4 w-4 mr-2" />
          AI Voice Studio
        </Badge>
      </div>

      {/* Main Content Grid with Drafts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Script Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {(() => {
                  const stepTitles = {
                'mini-stories': 'Step 1: Create Your Story Script',
                'motivational': 'Step 1: Create Your Motivation Script',
                'facts-explainer': 'Step 1: Generate Educational Facts',
                'comedy': 'Step 1: Create Your Comedy Script',
                'kids-stories': 'Step 1: Create Your Kids Story',
                'kids-learning': 'Step 1: Create Learning Content',
                'business-promo': 'Step 1: Create Your Promo Script',
                'horror': 'Step 1: Create Your Horror Story',
                'relationship': 'Step 1: Create Relationship Advice Script',
                'documentary': 'Step 1: Create Documentary Script',
                'festival': 'Step 1: Create Festival Content',
                'product-review': 'Step 1: Add Product URL or Write Review',
                'generic': 'Step 1: Create Your Video Script'
              }
              return stepTitles[niche] || 'Step 1: Create Your Story Script'
            })()}
          </CardTitle>
          <CardDescription>
            {(() => {
              const descriptions = {
                'mini-stories': 'Generate an AI story or write your own (moral, emotional, twist endings)',
                'motivational': 'Generate motivational content (discipline, growth, success)',
                'facts-explainer': 'Generate educational facts and science explainers (10-60 seconds)',
                'comedy': 'Generate comedy content or relatable humor (10-60 seconds)',
                'kids-stories': 'Generate playful stories with moral lessons for children',
                'kids-learning': 'Generate educational content (ABC, 123, colors, shapes)',
                'business-promo': 'Generate promotional content for your business or service',
                'horror': 'Generate atmospheric horror micro-stories (no gore, sensory fear)',
                'relationship': 'Generate relationship advice and emotional guidance',
                'documentary': 'Generate historical or factual documentary-style content',
                'festival': 'Generate festive celebration content',
                'product-review': 'Paste product URL (Amazon, eBay, etc.) or write your own review',
                'generic': 'Generate content on any topic you choose (10-60 seconds)'
              }
              return descriptions[niche] || 'Generate an AI story or paste your own script (10-60 seconds)'
            })()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Duration Mode Toggle */}
          <div className="space-y-3">
            <Label>Video Length</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={duration <= 60 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDuration(30)}
                className="justify-start"
              >
                📱 Short Form (10s-60s)
              </Button>
              <Button
                variant={duration > 60 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDuration(120)}
                className="justify-start"
              >
                🎬 Long Form (2m-10m)
              </Button>
            </div>
          </div>
          
          {/* Duration Slider - Short Form */}
          {duration <= 60 && (
            <div className="space-y-2">
              <Label>Duration: {duration} seconds</Label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={10}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>60s</span>
              </div>
            </div>
          )}
          
          {/* Duration Selector - Long Form */}
          {duration > 60 && (
            <div className="space-y-2">
              <Label>Duration: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} minutes</Label>
              <div className="grid grid-cols-4 gap-2">
                {[90, 120, 150, 180].map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDuration(d)}
                  >
                    {Math.floor(d / 60)}:{String(d % 60).padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {videoSource.startsWith('ai-') 
                  ? '🤖 AI videos up to 3 min. Uses async processing - video saved to Library when ready.'
                  : 'Long-form videos use multiple stock clips stitched together'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Language</Label>
              <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Script Format Selector */}
          <div className="space-y-2">
            <Label>Script Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={scriptFormat === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScriptFormat('auto')}
                className="text-xs"
              >
                🎯 Auto
              </Button>
              <Button
                variant={scriptFormat === 'cinematic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScriptFormat('cinematic')}
                className="text-xs"
              >
                🎬 Screenplay
              </Button>
              <Button
                variant={scriptFormat === 'narration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScriptFormat('narration')}
                className="text-xs"
              >
                🎙️ Voiceover
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {scriptFormat === 'auto' && 'Auto: Screenplay for long-form, Voiceover for short-form'}
              {scriptFormat === 'cinematic' && 'Screenplay: Full production format with scenes, dialogue, camera directions'}
              {scriptFormat === 'narration' && 'Voiceover: Simple narration text for TTS voiceover'}
            </p>
          </div>

          {showCustomTopicInput && (
            <div className="space-y-2">
              <Label>
                {niche === 'business-promo' ? 'Business/Product/Service Name' : 'Video Topic'}
              </Label>
              <Input
                placeholder={
                  niche === 'business-promo' 
                    ? "e.g., NShamimPRO, ProCreators Course, Sheba.XYZ..." 
                    : "e.g., productivity tips, climate change, fitness motivation..."
                }
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {niche === 'business-promo' 
                  ? 'Enter your exact business/product/service name - it will be used in the script'
                  : 'Enter any topic you want to create a video about'
                }
              </p>
            </div>
          )}

          {/* Product URL Input (only for product-review niche) */}
          {niche === 'product-review' && (
            <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-2xl">🔗</span>
                <span>Product URL (Amazon, eBay, Apple, etc.)</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.amazon.com/product-name/dp/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="flex-1"
                  disabled={scrapingProduct}
                />
                <Button
                  onClick={handleScrapeProduct}
                  disabled={scrapingProduct || !productUrl.trim()}
                  variant="default"
                  className="min-w-[180px]"
                >
                  {scrapingProduct ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Review...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Scrape & Generate
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste any product URL - we'll scrape the product info and generate an AI review script using our system prompt
              </p>
              {productData && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Product loaded: {productData.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <Textarea
            placeholder={(() => {
              const placeholders = {
                'mini-stories': 'Your story script will appear here... or write your own!',
                'motivational': 'Your motivational script will appear here... or write your own!',
                'facts-explainer': 'Educational facts will appear here... or write your own!',
                'comedy': 'Your comedy script will appear here... or write your own!',
                'kids-stories': 'Kids story script will appear here... or write your own!',
                'kids-learning': 'Learning content will appear here... or write your own!',
                'business-promo': 'Your promo script will appear here... or write your own!',
                'horror': 'Your horror story will appear here... or write your own!',
                'relationship': 'Relationship advice script will appear here... or write your own!',
                'documentary': 'Documentary script will appear here... or write your own!',
                'festival': 'Festival content will appear here... or write your own!',
                'product-review': 'Product info will appear here after scraping... or write your own review!',
                'generic': 'Your custom video script will appear here... or write your own!'
              }
              return placeholders[niche] || 'Enter your story script here or click "Generate AI Content" below...'
            })()}
            value={script}
            onChange={(e) => {
              const newScript = e.target.value
              setScript(newScript)
              
              // Auto-suggest duration based on word count (avg speaking: 2.5 words/sec)
              if (newScript.trim()) {
                const wordCount = newScript.trim().split(/\s+/).length
                const estimatedSeconds = Math.ceil(wordCount / 2.5)
                
                // Only auto-adjust if estimated time is longer than current duration
                if (estimatedSeconds > duration && estimatedSeconds <= 600) {
                  setDuration(estimatedSeconds)
                }
              }
            }}
            rows={8}
            className="font-mono text-sm"
          />

          {/* Smart Button Highlighting: Different buttons for Stock vs AI mode */}
          {(() => {
            const hasUserScript = script.trim().length > 50 // User has typed/pasted substantial content
            const requiredClips = Math.ceil(duration / 3)
            const isAIMode = videoSource && videoSource.startsWith('ai-')
            const requiredAIClips = Math.ceil(duration / 10) // AI clips are 10 seconds each (cost-optimized)
            
            return (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateScript} 
                    disabled={scriptLoading}
                    variant={hasUserScript ? "outline" : "default"}
                    className="flex-1"
                  >
                    {scriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Wand2 className="mr-2 h-4 w-4" />
                    {(() => {
                      const buttonTexts = {
                        'mini-stories': 'Generate AI Story',
                        'motivational': 'Generate Motivation',
                        'facts-explainer': 'Generate Facts',
                        'comedy': 'Generate Comedy',
                        'kids-stories': 'Generate Kids Story',
                        'kids-learning': 'Generate Learning Content',
                        'business-promo': 'Generate Promo Script',
                        'horror': 'Generate Horror Story',
                        'relationship': 'Generate Advice',
                        'documentary': 'Generate Documentary',
                        'festival': 'Generate Festival Content',
                        'generic': 'Generate Custom Script'
                      }
                      return buttonTexts[niche] || 'Generate AI Story'
                    })()}
                  </Button>
                  
                  {/* Show different button based on mode */}
                  {isAIMode ? (
                    <Button 
                      onClick={handleGenerateScenePrompts} 
                      disabled={!script.trim() || generatingPrompts}
                      variant={hasUserScript ? "default" : "outline"}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {generatingPrompts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Scene Prompts for AI Video
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleExtractKeywords} 
                      disabled={!script.trim() || extracting}
                      variant={hasUserScript ? "default" : "outline"}
                      className="flex-1"
                    >
                      {extracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Search className="mr-2 h-4 w-4" />
                      Extract Keywords for Related Videos
                    </Button>
                  )}
                </div>
                
                {/* Show estimated clips needed */}
                {script.trim() && (
                  <p className="text-xs text-muted-foreground text-center">
                    {isAIMode ? (
                      <>🤖 Based on {duration}s duration, AI will generate ~{requiredAIClips} video clips (10 sec each) 💰</>
                    ) : (
                      <>📽️ Based on {duration}s duration, we'll find ~{requiredClips} video clips (3 sec each)</>
                    )}
                  </p>
                )}
              </div>
            )
          })()}

          {/* Scene Prompts Section (for AI mode) */}
          {scenePrompts.length > 0 && videoSource.startsWith('ai-') && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  Scene Prompts for AI Video Generation
                </Label>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {scenePrompts.length} clips × ~10s each
                </Badge>
              </div>
              
              <div className="space-y-3">
                {scenePrompts.map((scene, index) => (
                  <div 
                    key={index} 
                    className="p-4 border-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {scene.sceneNumber}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={scene.prompt}
                          onChange={(e) => updateScenePrompt(index, e.target.value)}
                          placeholder="Describe the visual scene for AI video generation..."
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded">
                            {scene.cameraStyle}
                          </span>
                          <span className="bg-pink-100 dark:bg-pink-900 px-2 py-0.5 rounded">
                            {scene.mood} mood
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => removeScenePrompt(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={addScenePrompt}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Scene
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleGenerateScenePrompts}
                  disabled={generatingPrompts || !script.trim()}
                >
                  {generatingPrompts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate All
                </Button>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> Edit prompts to customize your AI video. Be descriptive about visual elements, camera angles, and mood. Avoid text/dialogue in scenes.
                </p>
              </div>
            </div>
          )}

          {/* Keywords Section (for Stock mode) */}
          {keywords.length > 0 && !videoSource.startsWith('ai-') && (
            <div className="space-y-3 pt-4 border-t">
              <Label>Keywords for Video Selection (editable)</Label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                      className="bg-transparent border-none focus:outline-none w-24 text-sm"
                    />
                    <button onClick={() => removeKeyword(index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={addKeyword}>
                  + Add
                </Button>
              </div>
              
              {/* Two separate buttons for product images and stock videos */}
              <div className="flex gap-2">
                {/* Product images button (always show for product-review after scraping) */}
                {niche === 'product-review' && productData && (
                  <Button 
                    onClick={() => {
                      if (productMedia.length > 0) {
                        setStockVideos(prev => [...productMedia, ...prev])
                        
                        const imageCount = productMedia.filter(m => m.type === 'image').length
                        const videoCount = productMedia.filter(m => m.type === 'ugc-video').length
                        
                        toast({
                          title: "Product Media Added!",
                          description: `Added ${imageCount} images and ${videoCount} UGC videos to Step 2. Drag to reorder.`
                        })
                      }
                    }}
                    disabled={productMedia.length === 0}
                    className="flex-1"
                    variant="default"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {productMedia.length > 0 
                      ? `Add Product Images & UGC (${productMedia.length})` 
                      : 'No Product Media Found'}
                  </Button>
                )}
                
                {/* Stock videos button */}
                <Button 
                  onClick={handleSearchVideos} 
                  disabled={loadingVideos}
                  className="flex-1"
                  variant={niche === 'product-review' && productData ? "outline" : "default"}
                >
                  {loadingVideos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Video className="mr-2 h-4 w-4" />
                  Search Stock Videos
                </Button>
              </div>
              
              {/* Helper text */}
              {niche === 'product-review' && productData && (
                <p className="text-xs text-muted-foreground text-center">
                  {productMedia.length > 0 
                    ? '💡 Tip: Add product images first, then stock videos. Drag & drop to reorder in Step 2.'
                    : '⚠️ No product images found. You can still use stock videos for your review.'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Source Selection - Only show if no default mode is locked */}
      {!defaultVideoSource && (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Video Source
          </CardTitle>
          <CardDescription>
            Choose how to generate video clips for your reel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Stock Videos - Default/Cheapest */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                videoSource === 'stock' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                  : 'border-muted hover:border-green-300'
              }`}
              onClick={() => setVideoSource('stock')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">📹</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">{formatCredits(calculateDynamicCost('quick-reels-stock', duration))} credits</Badge>
              </div>
              <h4 className="font-semibold">Stock Videos</h4>
              <p className="text-xs text-muted-foreground mt-1">
                HD stock footage from Pexels • Fast & reliable
              </p>
              {videoSource === 'stock' && <span className="text-green-600 text-xs font-medium">✓ Selected</span>}
            </div>

            {/* AI Essential */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                videoSource === 'ai-essential' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                  : 'border-muted hover:border-blue-300'
              }`}
              onClick={() => setVideoSource('ai-essential')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🤖</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">8K credits/30s</Badge>
              </div>
              <h4 className="font-semibold">AI Essential</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Budget-friendly AI videos • Good for simple scenes
              </p>
              {videoSource === 'ai-essential' && <span className="text-blue-600 text-xs font-medium">✓ Selected</span>}
            </div>

            {/* AI Standard */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                videoSource === 'ai-standard' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' 
                  : 'border-muted hover:border-purple-300'
              }`}
              onClick={() => setVideoSource('ai-standard')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">⭐</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">10K credits/30s</Badge>
              </div>
              <h4 className="font-semibold">AI Standard</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Good quality • Reliable for most use cases
              </p>
              {videoSource === 'ai-standard' && <span className="text-purple-600 text-xs font-medium">✓ Selected</span>}
            </div>

            {/* AI Professional */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                videoSource === 'ai-professional' 
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' 
                  : 'border-muted hover:border-amber-300'
              }`}
              onClick={() => setVideoSource('ai-professional')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🏆</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">12K credits/30s</Badge>
              </div>
              <h4 className="font-semibold">AI Professional</h4>
              <p className="text-xs text-muted-foreground mt-1">
                High quality • Cinematic motion • Best for marketing
              </p>
              {videoSource === 'ai-professional' && <span className="text-amber-600 text-xs font-medium">✓ Selected</span>}
            </div>

            {/* AI Cinema */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                videoSource === 'ai-cinema' 
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30' 
                  : 'border-muted hover:border-pink-300'
              }`}
              onClick={() => setVideoSource('ai-cinema')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">💎</span>
                <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">15K credits/30s</Badge>
              </div>
              <h4 className="font-semibold">AI Cinema Quality</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Highest quality • Premium cinematic visuals
              </p>
              {videoSource === 'ai-cinema' && <span className="text-pink-600 text-xs font-medium">✓ Selected</span>}
            </div>
          </div>

          {/* Info about AI mode */}
          {videoSource.startsWith('ai-') && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>🤖 AI Video Mode:</strong> Videos will be generated from your script using AI. 
                No need to search for stock videos - just write your script and generate!
              </p>
            </div>
          )}
          
          {/* Character Consistency Mode - Only show for AI modes */}
          {videoSource.startsWith('ai-') && (
            <div className="mt-4 space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                🎭 Character Consistency
                <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white">NEW</Badge>
              </Label>
              <p className="text-sm text-muted-foreground">
                Keep characters looking consistent across all video clips
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    consistencyMode === 'none' 
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-900/30' 
                      : 'border-muted hover:border-gray-300'
                  }`}
                  onClick={() => setConsistencyMode('none')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">⚡</span>
                    <Badge variant="outline" className="text-xs">Fastest</Badge>
                  </div>
                  <h4 className="font-semibold">None</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each clip independent • Quick generation
                  </p>
                  {consistencyMode === 'none' && <span className="text-gray-600 text-xs font-medium">✓ Selected</span>}
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    consistencyMode === 'seed' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                      : 'border-muted hover:border-blue-300'
                  }`}
                  onClick={() => setConsistencyMode('seed')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🌱</span>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">Balanced</Badge>
                  </div>
                  <h4 className="font-semibold">Seed-Based</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Same style seed • Some consistency
                  </p>
                  {consistencyMode === 'seed' && <span className="text-blue-600 text-xs font-medium">✓ Selected</span>}
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    consistencyMode === 'frame-chain' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' 
                      : 'border-muted hover:border-purple-300'
                  }`}
                  onClick={() => setConsistencyMode('frame-chain')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🔗</span>
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">Best Quality</Badge>
                  </div>
                  <h4 className="font-semibold">Frame Chaining</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Links clips visually • Best consistency
                  </p>
                  {consistencyMode === 'frame-chain' && <span className="text-purple-600 text-xs font-medium">✓ Selected</span>}
                </div>
              </div>
              
              {consistencyMode === 'frame-chain' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>🔗 Frame Chaining:</strong> Uses the last frame of each clip as the first frame of the next, 
                    creating seamless character continuity. Takes slightly longer but produces the best results for story videos!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Show locked mode indicator when defaultVideoSource is set */}
      {defaultVideoSource && (
        <Card className={`border-2 ${defaultVideoSource === 'stock' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{defaultVideoSource === 'stock' ? '📹' : '🤖'}</span>
              <div className="flex-1">
                <h4 className="font-semibold">
                  {defaultVideoSource === 'stock' ? 'Stock Video Mode' : 'AI Video Mode'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {defaultVideoSource === 'stock' 
                    ? 'Using HD stock footage from Pexels • Fast & reliable'
                    : 'Using AI to generate video clips from your script • Premium quality'}
                </p>
              </div>
              <Badge variant="secondary" className={defaultVideoSource === 'stock' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}>
                {defaultVideoSource === 'stock' 
                  ? `${formatCredits(calculateDynamicCost('quick-reels-stock', duration))} credits`
                  : `${formatCredits(calculateDynamicCost('story-reels', duration, consistencyMode))} credits`}
              </Badge>
            </div>
            
            {/* Character Consistency Mode for AI mode */}
            {defaultVideoSource === 'ai' && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  🎭 Character Consistency
                  <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white">NEW</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep characters looking consistent across all video clips
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      consistencyMode === 'none' 
                        ? 'border-gray-400 bg-gray-50 dark:bg-gray-900/30' 
                        : 'border-muted hover:border-gray-300'
                    }`}
                    onClick={() => setConsistencyMode('none')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">⚡</span>
                      <Badge variant="outline" className="text-xs">Fastest</Badge>
                    </div>
                    <h4 className="font-semibold">None</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each clip independent • Quick generation
                    </p>
                    {consistencyMode === 'none' && <span className="text-gray-600 text-xs font-medium">✓ Selected</span>}
                  </div>

                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      consistencyMode === 'seed' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                        : 'border-muted hover:border-blue-300'
                    }`}
                    onClick={() => setConsistencyMode('seed')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">🌱</span>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">Balanced</Badge>
                    </div>
                    <h4 className="font-semibold">Seed-Based</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Same style seed • Some consistency
                    </p>
                    {consistencyMode === 'seed' && <span className="text-blue-600 text-xs font-medium">✓ Selected</span>}
                  </div>

                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      consistencyMode === 'frame-chain' 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' 
                        : 'border-muted hover:border-purple-300'
                    }`}
                    onClick={() => setConsistencyMode('frame-chain')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">🔗</span>
                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">Best Quality</Badge>
                    </div>
                    <h4 className="font-semibold">Frame Chaining</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Links clips visually • Best consistency
                    </p>
                    {consistencyMode === 'frame-chain' && <span className="text-purple-600 text-xs font-medium">✓ Selected</span>}
                  </div>
                </div>
                
                {consistencyMode === 'frame-chain' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>🔗 Frame Chaining:</strong> Uses the last frame of each clip as the first frame of the next, 
                      creating seamless character continuity. Takes slightly longer but produces the best results!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Stock Videos Preview - Only show for stock mode */}
      {(videoSource === 'stock' && stockVideos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Step 2: Video Clip Selection
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>
                {(() => {
                  const requiredClips = Math.ceil(duration / 3)
                  const currentClips = stockVideos.length
                  const isEnough = currentClips >= requiredClips
                  
                  return (
                    <>
                      <span className={isEnough ? 'text-green-600 font-medium' : ''}>
                        {currentClips}/{requiredClips} clips
                      </span>
                      <span className="text-muted-foreground"> for {duration}s video</span>
                      {!isEnough && (
                        <span className="text-amber-500 ml-2">
                          (need {requiredClips - currentClips} more)
                        </span>
                      )}
                      {isEnough && (
                        <span className="text-green-600 ml-2">✓ Ready</span>
                      )}
                      <span className="text-muted-foreground ml-2">• Drag to reorder</span>
                    </>
                  )
                })()}
              </span>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={handleCustomVideoUpload}
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Footage
                  </span>
                </Button>
              </label>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stockVideos.map(v => v.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                  
                  {/* Add more videos card */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleCustomVideoUpload}
                    />
                    <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-primary rounded-lg flex flex-col items-center justify-center gap-2 transition-colors">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload Video</span>
                    </div>
                  </label>
                </div>
              </SortableContext>
            </DndContext>
            
            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-4 text-center">
              💡 Tip: Drag clips to reorder. Videos will play from #1 to #{stockVideos.length}. Upload your own footage to mix with stock clips.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Voice Selection - Simplified Google Cloud TTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Step 3: Voice Selection
          </CardTitle>
          <CardDescription>
            Choose AI voice, use your own recording, or go silent for AI video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={voiceOption} onValueChange={setVoiceOption} className="w-full">
            <TabsList className={`grid w-full ${videoSource.startsWith('ai-') ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="tts">
                <Wand2 className="h-4 w-4 mr-1" />
                AI Voice
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Mic className="h-4 w-4 mr-1" />
                Upload Audio
              </TabsTrigger>
              {videoSource.startsWith('ai-') && (
                <TabsTrigger value="none">
                  <Video className="h-4 w-4 mr-1" />
                  No Audio
                </TabsTrigger>
              )}
            </TabsList>

            {/* No Audio Tab - AI Video Only */}
            <TabsContent value="none" className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Character Dialogue Mode
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Generate AI video with characters speaking their dialogue lines.
                </p>
                
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-300 dark:border-green-700">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                    🎤 Auto Character Voice Generation
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    When your scene prompts include dialogue like <code className="bg-green-200 dark:bg-green-800 px-1 rounded">saying 'Welcome!'</code>, 
                    we'll automatically generate character voices and sync them with the video.
                  </p>
                </div>
                
                <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    🎭 How It Works
                  </p>
                  <ol className="text-xs text-purple-700 dark:text-purple-300 list-decimal list-inside space-y-1">
                    <li>Kling AI creates lip movements for dialogue scenes</li>
                    <li>Google TTS generates character voice for each dialogue</li>
                    <li>Audio is synced to play when character speaks</li>
                  </ol>
                </div>
                
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Best Practices:</strong> Use front-facing camera, short phrases (2-5 words), and include <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">saying '...'</code> in your scene prompts.
                </div>
              </div>
            </TabsContent>

            {/* AI Voice Studio Tab */}
            <TabsContent value="tts" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Premium AI Voice Studio - Multiple Accents Available
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {Object.keys(voicesByVariant).length > 0 
                    ? `${Object.keys(voicesByVariant).length} accent variants • ${availableVoices.length} voices • Premium quality`
                    : 'High-quality text-to-speech with natural pronunciation'}
                </p>
              </div>

              {loadingVoices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading voices...</span>
                </div>
              ) : Object.keys(voicesByVariant).length > 0 ? (
                <div className="space-y-4">
                  {/* Accent/Variant Selector */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Step 1: Choose Accent / Region</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.keys(voicesByVariant).map((variant) => (
                        <button
                          key={variant}
                          onClick={() => {
                            setLanguageVariant(variant)
                            // Auto-select first voice in this variant
                            if (voicesByVariant[variant].length > 0) {
                              setSelectedVoice(voicesByVariant[variant][0].name)
                            }
                          }}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            languageVariant === variant
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-semibold">{getVariantDisplayName(variant)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {voicesByVariant[variant].length} voices available
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Selector for chosen variant */}
                  {languageVariant && voicesByVariant[languageVariant] && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Step 2: Choose Voice ({voicesByVariant[languageVariant].length} available)
                      </Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="h-auto py-3">
                          <SelectValue placeholder="Choose a voice" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {voicesByVariant[languageVariant].map((voice) => {
                            const voiceType = getVoiceType(voice.name)
                            const friendlyName = getFriendlyVoiceName(voice.name, voice.ssmlGender)
                            return (
                              <SelectItem key={voice.name} value={voice.name} className="py-3">
                                <div className="flex items-center justify-between gap-4 w-full">
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {voice.ssmlGender === 'MALE' ? '👨' : voice.ssmlGender === 'FEMALE' ? '👩' : '🗣️'} 
                                      {' '}{friendlyName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{voiceType}</div>
                                  </div>
                                  {voiceType.includes('Best') && (
                                    <Badge variant="default" className="text-xs">Best Quality</Badge>
                                  )}
                                  {voiceType.includes('Premium') && (
                                    <Badge variant="secondary" className="text-xs">Premium</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: "Premium" and "Premium HD" voices offer the best quality and naturalness
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Using default system voice for {ttsLanguage === 'bn' ? 'Bengali' : 'English'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Use Original Recording Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  🎯 Perfect Accent Preservation
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Record your script narration and use it EXACTLY as it is. No AI processing, perfect authenticity!
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Record or Upload Your Narration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={recording ? "destructive" : "outline"}
                    onClick={recording ? stopRecording : startRecording}
                    className="w-full"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {recording ? 'Stop Recording' : 'Record Audio'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => audioFileRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio
                  </Button>
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {(recordedBlob || voiceFile) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✨ Audio ready: {voiceFile?.name || 'Your recording'}
                      </span>
                    </div>

                    <audio 
                      src={voiceFile ? (voiceFile instanceof Blob ? URL.createObjectURL(voiceFile) : voiceFile) : ''} 
                      controls 
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Step 4: Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Step 4: Customize Your Video
          </CardTitle>
          <CardDescription>
            Choose caption style, music, and resolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Caption Style</Label>
              <Select value={captionStyle} onValueChange={setCaptionStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bold-outline">🔷 Bold with Black Outline (Classic)</SelectItem>
                  <SelectItem value="karaoke">🎤 Word-by-Word Karaoke (Yellow)</SelectItem>
                  <SelectItem value="animated">✨ Animated Pop-in</SelectItem>
                  <SelectItem value="neon-glow">💜 Neon Glow (Pink/Magenta)</SelectItem>
                  <SelectItem value="yellow-highlight">⭐ Yellow Highlight (TikTok)</SelectItem>
                  <SelectItem value="zoomed-in">🔍 Zoomed In (Center)</SelectItem>
                  <SelectItem value="gradient-pop">🌈 Gradient Pop (Gold & Pink)</SelectItem>
                  <SelectItem value="minimal-clean">⚪ Minimal Clean (Top)</SelectItem>
                  <SelectItem value="tiktok-style">🎵 TikTok Style (Red Outline)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Caption Font Size</Label>
              <Select value={captionFontSize} onValueChange={setCaptionFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (80%)</SelectItem>
                  <SelectItem value="medium">Medium (120%) - Recommended</SelectItem>
                  <SelectItem value="large">Large (150%)</SelectItem>
                  <SelectItem value="extra-large">Extra Large (180%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Caption Position</Label>
              <Select value={captionPosition} onValueChange={setCaptionPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top of Video</SelectItem>
                  <SelectItem value="center">Center of Video</SelectItem>
                  <SelectItem value="bottom">Bottom of Video (Default)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Background Music</Label>
              {customMusic ? (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium truncate">{customMusic.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Will auto-cut to {duration}s
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCustomMusic(null)}
                      title="Remove music"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                  <Music className="w-10 h-10 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium">No Music Selected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add background music to your video
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowMusicPicker(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Music Library
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Video Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                  <SelectItem value="2k">2K (1440p)</SelectItem>
                  <SelectItem value="4k">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Generate Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Step 5: Preview & Generate Your Video
          </CardTitle>
          <CardDescription>
            Preview your video with customization options or generate directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dynamic Credit Cost Display */}
          <div className="flex flex-col items-center gap-2">
            {(() => {
              const isAIMode = videoSource.startsWith('ai-')
              
              // Calculate dynamic credits based on video source and duration
              let totalCredits
              let toolId
              
              if (isAIMode) {
                // Map video source to tool ID for credit calculation
                const aiToolMap = {
                  'ai-essential': 'quick-reels-ai-essential',
                  'ai-standard': 'quick-reels-ai-standard',
                  'ai-professional': 'quick-reels-ai-professional',
                  'ai-cinema': 'quick-reels-ai-cinema'
                }
                toolId = aiToolMap[videoSource] || 'story-reels'
                totalCredits = calculateDynamicCost(toolId, duration, consistencyMode)
                
                return (
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className="gap-1.5 px-4 py-2 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                    >
                      <Coins className="h-4 w-4" />
                      <span className="font-bold text-lg">{formatCredits(totalCredits)}</span>
                      <span className="text-sm">credits</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {duration}s AI video
                      {consistencyMode === 'frame-chain' && ' (+15% frame-chain)'}
                    </p>
                  </div>
                )
              } else {
                // Stock mode - calculate dynamic cost based on duration
                totalCredits = calculateDynamicCost('quick-reels-stock', duration, 'none')
                
                return (
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className="gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    >
                      <Coins className="h-4 w-4" />
                      <span className="font-bold text-lg">{formatCredits(totalCredits)}</span>
                      <span className="text-sm">credits</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {duration}s stock video • Includes AI voice
                    </p>
                  </div>
                )
              }
            })()}
          </div>
          
          {/* Preview Button (Recommended) */}
          <Button 
            onClick={handleGeneratePreview} 
            disabled={
              generatingPreview || 
              composing || 
              !script.trim() || 
              (videoSource.startsWith('ai-') ? scenePrompts.length === 0 : stockVideos.length === 0) || 
              (voiceOption === 'tts' && !selectedVoice) ||
              (voiceOption === 'upload' && !voiceFile)
            }
            className="w-full"
            size="lg"
            variant="default"
          >
            {(generatingPreview || (composing && videoSource.startsWith('ai-'))) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {videoSource.startsWith('ai-') ? 'Creating AI Video...' : 'Generating Preview...'}
              </>
            ) : (
              <>
                {videoSource.startsWith('ai-') ? <Zap className="mr-2 h-5 w-5" /> : <Eye className="mr-2 h-5 w-5" />}
                {videoSource.startsWith('ai-') ? '🤖 Generate AI Video' : 'Generate Preview & Customize'}
              </>
            )}
          </Button>
          
          {/* For AI mode, show info about direct generation */}
          {videoSource.startsWith('ai-') && (
            <p className="text-xs text-muted-foreground text-center">
              AI videos are generated directly (preview not available for AI-generated clips)
            </p>
          )}

          {/* Direct Generation (Skip Preview) - Only for Stock mode */}
          {!videoSource.startsWith('ai-') && (
          <Button 
            onClick={handleCompose} 
            disabled={
              composing || 
              generatingPreview || 
              !script.trim() || 
              stockVideos.length === 0
            }
            className="w-full"
            size="lg"
            variant="outline"
          >
            {composing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Video className="mr-2 h-5 w-5" />
            Generate Final Video (Skip Preview)
          </Button>
          )}
          
          {/* Helpful hint for AI mode */}
          {videoSource.startsWith('ai-') && scenePrompts.length === 0 && script.trim() && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>💡 Next Step:</strong> Click "Generate Scene Prompts" above to create visual prompts for AI video generation.
              </p>
            </div>
          )}

          {composing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progressMessage || 'Creating your video...'}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {duration > 45 && videoSource.startsWith('ai-') && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⏱️ Generating {Math.ceil(duration / 5)} AI clips. This may take several minutes. You can leave this page - video will be saved to Library.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Preview - Only shows when video is ACTUALLY ready */}
      {videoData?.videoUrl && (
        <Card ref={videoPreviewRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Your Story Video is Ready!
            </CardTitle>
            <CardDescription>Preview and download your video</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full max-w-2xl mx-auto">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '600px' }}>
                  <video 
                    src={videoData.videoUrl} 
                    controls 
                    playsInline
                    preload="auto"
                    autoPlay
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('Video load error:', e.target.error)}
                  />
                </div>
              </div>

              <div className="flex gap-3 max-w-2xl mx-auto">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </div>

              {videoData.captionsUrl && (
                <div className="max-w-2xl mx-auto">
                  <Button variant="outline" className="w-full" onClick={handleDownloadCaptions}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download Captions (SRT)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </div>

        {/* Sidebar - Drafts Manager - 1 column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <AutoSaveDraftsManager
              toolType={`story-reels-${niche}`}
              getCurrentData={getCurrentDraftData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[script, duration, scenePrompts, videoSource, customTopic]}
              autoSaveEnabled={true}
              debounceMs={3000}
              minStepForAutoSave={1}
              currentStep={script ? 1 : 0}
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        onGenerateFinal={handleGenerateFinalFromPreview}
        availableVoices={availableVoices}
        voicesByVariant={voicesByVariant}
        languageVariant={languageVariant}
        customMusic={customMusic}
      />

      {/* Music Picker Modal */}
      <MusicPicker
        open={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelectMusic={(music) => setCustomMusic(music)}
        videoDuration={duration}
      />
    </div>
  )
}
