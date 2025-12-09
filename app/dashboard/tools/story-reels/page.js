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
  FileText, Film, Music, Type, Play, Edit, X, Check, Eye 
} from 'lucide-react'
import PreviewModal from './PreviewModal'
import MusicPicker from './MusicPicker'

export default function StoryReelsPage() {
  // Script state
  const [script, setScript] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [duration, setDuration] = useState(30)
  
  // Keywords & Videos
  const [keywords, setKeywords] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [stockVideos, setStockVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  
  // Voice state - simplified with Google Cloud TTS
  const [ttsLanguage, setTtsLanguage] = useState('bn')
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
  const [musicTrack, setMusicTrack] = useState('none')
  const [customMusic, setCustomMusic] = useState(null) // For Freesound downloads
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

    setScriptLoading(true)
    try {
      const response = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, language: ttsLanguage })
      })

      const data = await response.json()
      if (data.success) {
        setScript(data.script)
        toast({
          title: "Success",
          description: "Story script generated successfully!"
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
        setStockVideos(data.videos)
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
      } else if (previewSettings.selectedMusic && previewSettings.selectedMusic !== 'none') {
        formData.append('musicTrack', previewSettings.selectedMusic)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      formData.append('stockVideos', JSON.stringify(stockVideos))
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
      // Send proper music track value
      if (customMusic) {
        formData.append('musicTrack', 'custom')
        formData.append('customMusicPath', customMusic.path)
      } else {
        formData.append('musicTrack', 'none')
      }
      formData.append('resolution', resolution)
      formData.append('stockVideos', JSON.stringify(stockVideos))
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
          <h1 className="text-3xl font-bold">Story Video Reels</h1>
          <p className="text-muted-foreground">Create engaging story videos with authentic Bengali narration powered by AI voice synthesis</p>
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
            Step 1: Create Your Story Script
          </CardTitle>
          <CardDescription>
            Generate an AI story or paste your own script (10-60 seconds)
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

          <Textarea
            placeholder="Enter your story script here or click 'Generate AI Story' below..."
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
              Generate AI Story
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
            <div className="space-y-2 pt-4 border-t">
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
              <Button 
                onClick={handleSearchVideos} 
                disabled={loadingVideos}
                className="w-full"
              >
                {loadingVideos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Video className="mr-2 h-4 w-4" />
                Search Stock Videos
              </Button>
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
              Step 2: Stock Video Selection
            </CardTitle>
            <CardDescription>
              {stockVideos.length} videos selected (3 seconds each)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stockVideos.map((video, index) => (
                <div key={index} className="relative group">
                  <video 
                    src={video.url} 
                    className="w-full h-24 object-cover rounded-lg"
                    muted
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
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
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customMusic.name}</p>
                      <p className="text-xs text-muted-foreground">From Audio Library</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCustomMusic(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Music className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No music selected</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowMusicPicker(true)}
                  >
                    <Music className="w-3 h-3 mr-2" />
                    Browse Audio Library
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
        <Card>
          <CardHeader>
            <CardTitle>Your Story Video is Ready!</CardTitle>
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
                    preload="metadata"
                    className="w-full h-full object-contain"
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
