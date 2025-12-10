'use client'

import React, { useState, useRef, useEffect } from 'react'
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
import { 
  Loader2, Sparkles, Video, Mic, Upload, Download, 
  FileText, Film, Music, Type, Play, Edit, X, Check, Eye,
  GripVertical, Trash2, Plus, ImagePlus, Search
} from 'lucide-react'
import PreviewModal from './PreviewModal'
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

// Sortable Video Item Component
function SortableVideoItem({ video, index, totalCount, onRemove }) {
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
          <div className="absolute top-1 right-8 bg-purple-500 text-white text-xs px-2 py-0.5 rounded">
            📷 Image
          </div>
        )}
        
        {/* Custom badge */}
        {video.isCustom && (
          <div className="absolute top-1 right-8 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
            Custom
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
      
      {/* Position indicator */}
      <div className="text-center text-xs text-muted-foreground mt-1">
        {index + 1} of {totalCount}
      </div>
    </div>
  )
}

export default function StoryReelsPage({ niche = 'story-reels', nicheName = 'Story Video Reels', nicheIcon = '🎬', nicheDescription = 'Create engaging story-based video reels', showCustomTopicInput = false }) {
  // Script state
  const [script, setScript] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [duration, setDuration] = useState(30)
  const [customTopic, setCustomTopic] = useState('')
  
  // Product review specific state
  const [productUrl, setProductUrl] = useState('')
  const [scrapingProduct, setScrapingProduct] = useState(false)
  const [productData, setProductData] = useState(null)
  const [productMedia, setProductMedia] = useState([]) // Images/videos from product URL
  
  // Keywords & Videos
  const [keywords, setKeywords] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [stockVideos, setStockVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  
  // Voice state - simplified with Google Cloud TTS
  const [ttsLanguage, setTtsLanguage] = useState(niche === 'product-review' ? 'en' : 'bn')
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
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  
  // Output state
  const [videoData, setVideoData] = useState(null)
  
  const { toast } = useToast()
  const audioFileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoPreviewRef = useRef(null)

  // Auto-scroll to video preview when video is ready
  useEffect(() => {
    if (videoData?.videoUrl && videoPreviewRef.current) {
      setTimeout(() => {
        videoPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [videoData?.videoUrl])

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
      
      const response = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration, 
          language: ttsLanguage,
          niche,
          customTopic: userTopic
        })
      })

      const data = await response.json()
      if (data.success) {
        setScript(data.script)
        
        // Auto-adjust duration based on generated script length
        const wordCount = data.script.trim().split(/\s+/).length
        const estimatedSeconds = Math.ceil(wordCount / 2.5)
        
        // Update duration if script is longer than current setting
        if (estimatedSeconds > duration && estimatedSeconds <= 60) {
          setDuration(estimatedSeconds)
          toast({
            title: "Success",
            description: `${nicheName} script generated! Duration auto-adjusted to ${estimatedSeconds} seconds.`
          })
        } else if (estimatedSeconds > 60) {
          setDuration(60)
          toast({
            title: "Success",
            description: `${nicheName} script generated! Duration set to maximum (60 seconds). Note: Script is longer than 60 seconds.`,
            variant: "default"
          })
        } else {
          toast({
            title: "Success",
            description: `${nicheName} script generated successfully!`
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

  // Search Stock Videos
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
      const response = await fetch('/api/story-reels/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      })

      const data = await response.json()
      if (data.success) {
        // Add unique IDs to each video for drag-and-drop
        const videosWithIds = data.videos.map((video, idx) => ({
          ...video,
          id: `stock-${Date.now()}-${idx}`,
          isCustom: false
        }))
        setStockVideos(videosWithIds)
        toast({
          title: "Success",
          description: `Found ${data.videos.length} stock videos`
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
      
      // Store extracted media (images and videos) - limit to top 10
      if (scrapeData.product.images && scrapeData.product.images.length > 0) {
        const media = scrapeData.product.images.slice(0, 10).map((url, index) => ({
          id: `product-media-${Date.now()}-${index}`,
          url: url,
          thumbnail: url,
          title: `Product Image ${index + 1}`,
          type: 'image',
          source: 'product'
        }))
        setProductMedia(media)
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
          customTopic: productContext
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
              setDuration(Math.min(audioDuration, 60)) // Cap at 60 seconds max
              toast({
                title: "Recording Complete",
                description: `Video duration auto-adjusted to ${Math.min(audioDuration, 60)} seconds to match your recording`,
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
            setDuration(Math.min(audioDuration, 60)) // Cap at 60 seconds max
            toast({
              title: "Audio Uploaded",
              description: `Video duration auto-adjusted to ${Math.min(audioDuration, 60)} seconds to match your audio`,
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
    if (stockVideos.length === 0) {
      toast({ title: "Error", description: "Please search and select stock videos", variant: "destructive" })
      return
    }
    if (voiceOption === 'tts' && !selectedVoice && availableVoices.length > 0) {
      toast({ title: "Error", description: "Please select a voice", variant: "destructive" })
      return
    }

    setGeneratingPreview(true)

    try {
      const formData = new FormData()
      formData.append('script', script)
      formData.append('duration', duration)
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('selectedVoice', selectedVoice || '')
      formData.append('stockVideos', JSON.stringify(stockVideos))
      
      // Include uploaded/recorded audio for preview
      if (voiceOption === 'upload' && voiceFile) {
        formData.append('voiceFile', voiceFile)
      }

      const response = await fetch('/api/story-reels/generate-preview', {
        method: 'POST',
        body: formData
      })

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
      const formData = new FormData()
      formData.append('script', previewSettings.captions.map(c => c.text).join(' '))
      formData.append('duration', duration)
      formData.append('captionStyle', previewSettings.captionStyle)
      formData.append('captionFontSize', previewSettings.captionFontSize || captionFontSize)
      formData.append('captionPosition', previewSettings.captionPosition || captionPosition)
      // Send music properly from preview
      if (previewSettings.customMusicPath) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', previewSettings.customMusicPath)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      
      // Handle stock videos - separate URLs from custom uploads
      const urlVideos = stockVideos.filter(v => !v.isCustom)
      const customVideos = stockVideos.filter(v => v.isCustom)
      
      formData.append('stockVideos', JSON.stringify(urlVideos))
      formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ index: i, isCustom: !!v.isCustom }))))
      
      // Append custom video files
      customVideos.forEach((video, idx) => {
        if (video.file) {
          formData.append(`customVideo_${idx}`, video.file)
        }
      })
      
      formData.append('keywords', JSON.stringify(keywords))
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
        body: formData
      })

      clearInterval(progressInterval)

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
      toast({
        title: "Error",
        description: error.message || "Failed to generate final video",
        variant: "destructive"
      })
    } finally {
      setComposing(false)
    }
  }

  // Compose Final Video (Direct - without preview)
  const handleCompose = async () => {
    // Validation
    if (!script.trim()) {
      toast({ title: "Error", description: "Script is required", variant: "destructive" })
      return
    }
    if (stockVideos.length === 0) {
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

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('script', script)
      formData.append('duration', duration)
      formData.append('captionStyle', captionStyle)
      formData.append('captionFontSize', captionFontSize)
      formData.append('captionPosition', captionPosition)
      // Send music from Freesound/AudioDB selection
      if (customMusic) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', customMusic.path)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      
      // Handle stock videos - separate URLs from custom uploads
      const urlVideos = stockVideos.filter(v => !v.isCustom)
      const customVideos = stockVideos.filter(v => v.isCustom)
      
      formData.append('stockVideos', JSON.stringify(urlVideos))
      formData.append('videoOrder', JSON.stringify(stockVideos.map((v, i) => ({ index: i, isCustom: !!v.isCustom }))))
      
      // Append custom video files
      customVideos.forEach((video, idx) => {
        if (video.file) {
          formData.append(`customVideo_${idx}`, video.file)
        }
      })
      
      formData.append('keywords', JSON.stringify(keywords))
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)

      if (voiceOption === 'tts') {
        formData.append('selectedVoice', selectedVoice || '')
      } else if (voiceOption === 'upload') {
        formData.append('voiceFile', voiceFile)
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90))
      }, 2000)

      const response = await fetch('/api/story-reels/compose', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      const data = await response.json()
      if (data.success) {
        setProgress(100)
        setVideoData(data)
        toast({
          title: "Success!",
          description: "Your story video is ready!"
        })
        
        // Auto-save is now handled by backend in /api/story-reels/compose
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to compose video",
        variant: "destructive"
      })
    } finally {
      setComposing(false)
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
            <span className="text-4xl">{nicheIcon}</span>
            {nicheName}
          </h1>
          <p className="text-muted-foreground">{nicheDescription}</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Voice Studio
        </Badge>
      </div>

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
          <div className="space-y-2">
            <Label>Target Duration: {duration} seconds</Label>
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
                      <Sparkles className="mr-2 h-4 w-4" />
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
                if (estimatedSeconds > duration && estimatedSeconds <= 60) {
                  setDuration(estimatedSeconds)
                }
              }
            }}
            rows={8}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateScript} 
              disabled={scriptLoading}
              className="flex-1"
            >
              {scriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
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
            <Button 
              onClick={handleExtractKeywords} 
              disabled={!script.trim() || extracting}
              variant="outline"
              className="flex-1"
            >
              {extracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Film className="mr-2 h-4 w-4" />
              Extract Keywords
            </Button>
          </div>

          {keywords.length > 0 && (
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
                {/* Product images button (only for product-review niche with images) */}
                {niche === 'product-review' && productData && productMedia.length > 0 && (
                  <Button 
                    onClick={() => {
                      setStockVideos(prev => [...productMedia, ...prev])
                      toast({
                        title: "Product Images Added!",
                        description: `${productMedia.length} product images added to Step 2. Drag to reorder.`
                      })
                    }}
                    className="flex-1"
                    variant="default"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Add Product Images ({productMedia.length})
                  </Button>
                )}
                
                {/* Stock videos button */}
                <Button 
                  onClick={handleSearchVideos} 
                  disabled={loadingVideos}
                  className="flex-1"
                  variant={niche === 'product-review' && productMedia.length > 0 ? "outline" : "default"}
                >
                  {loadingVideos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Video className="mr-2 h-4 w-4" />
                  Search Stock Videos
                </Button>
              </div>
              
              {/* Helper text */}
              {niche === 'product-review' && productData && productMedia.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Add product images first, then stock videos. Drag & drop to reorder in Step 2.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Stock Videos Preview */}
      {stockVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Step 2: Video Clip Selection
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{stockVideos.length} clips selected • Drag to reorder • Click ✕ to remove</span>
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
            Choose AI voice or use your own recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={voiceOption} onValueChange={setVoiceOption} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tts">
                <Sparkles className="h-4 w-4 mr-1" />
                AI Voice Studio
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Mic className="h-4 w-4 mr-1" />
                Use Original Recording
              </TabsTrigger>
            </TabsList>

            {/* AI Voice Studio Tab */}
            <TabsContent value="tts" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
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
          {/* Preview Button (Recommended) */}
          <Button 
            onClick={handleGeneratePreview} 
            disabled={generatingPreview || composing || !script.trim() || stockVideos.length === 0 || (voiceOption === 'tts' && !selectedVoice)}
            className="w-full"
            size="lg"
            variant="default"
          >
            {generatingPreview ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-5 w-5" />
                Generate Preview & Customize
              </>
            )}
          </Button>

          {/* Direct Generation (Skip Preview) */}
          <Button 
            onClick={handleCompose} 
            disabled={composing || generatingPreview || !script.trim() || stockVideos.length === 0}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {composing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Video className="mr-2 h-5 w-5" />
            Generate Final Video (Skip Preview)
          </Button>

          {composing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Creating your video...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Preview */}
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
