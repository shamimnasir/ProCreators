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
  Loader2,
  Wand2,
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
  Eye
} from 'lucide-react'
import PreviewModal from '@/app/dashboard/tools/story-reels/PreviewModal'
import MusicPicker from '@/app/dashboard/tools/story-reels/MusicPicker'

export default function ReelGenerator({ 
  niche = 'story-reels',
  nicheName = 'Story Reels',
  nicheIcon = '🎬',
  nicheDescription = 'Create engaging story-based video reels',
  showCustomTopicInput = false
}) {
  // Script state
  const [script, setScript] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [duration, setDuration] = useState(30)
  const [customTopic, setCustomTopic] = useState('')
  
  // Keywords & Videos
  const [keywords, setKeywords] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [stockVideos, setStockVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  
  // Voice state
  const [ttsLanguage, setTtsLanguage] = useState('bn')
  const [voiceOption, setVoiceOption] = useState('tts')
  const [languageVariant, setLanguageVariant] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])
  const [voicesByVariant, setVoicesByVariant] = useState({})
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
  const [customMusic, setCustomMusic] = useState(null)
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

  // Load available voices from Google Cloud TTS
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

  const getVoiceType = (voiceName) => {
    if (voiceName.includes('Neural2')) return 'Premium (Best Quality)'
    if (voiceName.includes('Wavenet')) return 'High Quality'
    if (voiceName.includes('Studio')) return 'Studio (Premium)'
    if (voiceName.includes('Standard')) return 'Standard'
    if (voiceName.includes('Chirp3-HD')) return 'Premium HD (Best)'
    if (voiceName.includes('Chirp')) return 'Premium'
    return 'Standard'
  }

  const getFriendlyVoiceName = (voiceName, gender) => {
    const voiceId = voiceName.split('-').pop()
    const isBengali = voiceName.startsWith('bn-')
    
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
      const response = await fetch('/api/story-reels/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration, 
          language: ttsLanguage,
          niche,
          customTopic: showCustomTopicInput ? customTopic : undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        setScript(data.script)
        toast({
          title: "Success",
          description: `${nicheName} script generated successfully!`
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
        body: JSON.stringify({ keywords, duration })
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(audioBlob)
        setVoiceFile(null)
        
        const file = new File([audioBlob], 'recorded-voice.webm', { type: 'audio/webm' })
        setVoiceFile(file)
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
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
      
      try {
        const audio = new Audio(URL.createObjectURL(file))
        audio.addEventListener('loadedmetadata', () => {
          const audioDuration = Math.ceil(audio.duration)
          if (audioDuration > duration) {
            setDuration(Math.min(audioDuration, 60))
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
      formData.append('niche', niche) // Pass niche for library categorization
      
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
      formData.append('voiceOption', voiceOption)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('selectedVoice', previewSettings.selectedVoice || selectedVoice)
      
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
          description: `Your ${nicheName} video is ready!`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate final video",
        variant: "destructive"
      })
      setProgress(0)
    } finally {
      setComposing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{nicheIcon}</span>
          <h1 className="text-3xl font-bold">{nicheName}</h1>
        </div>
        <p className="text-muted-foreground">{nicheDescription}</p>
      </div>

      {/* Rest of the UI - I'll create a simplified version for now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Script & Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Script */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 1: Generate Script
              </CardTitle>
              <CardDescription>
                AI will create a {nicheName.toLowerCase()} script optimized for engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Video Duration (seconds)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[duration]}
                      onValueChange={(value) => setDuration(value[0])}
                      min={10}
                      max={60}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground mt-1">{duration} seconds</p>
                  </div>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showCustomTopicInput && (
                <div>
                  <Label>Video Topic</Label>
                  <Input
                    placeholder="e.g., productivity tips, climate change, fitness motivation..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              <Button 
                onClick={handleGenerateScript}
                disabled={scriptLoading}
                className="w-full"
              >
                {scriptLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate AI Script
                  </>
                )}
              </Button>

              <div>
                <Label>Script</Label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={`Your ${nicheName.toLowerCase()} script will appear here...`}
                  className="mt-2 min-h-[200px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for remaining steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Extract keywords from script</p>
                <p>✓ Search and select stock videos</p>
                <p>✓ Choose voice (AI or upload)</p>
                <p>✓ Preview and generate final video</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {videoData ? (
                <div className="space-y-4">
                  <video
                    src={videoData.videoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                  <Button
                    onClick={() => window.open(videoData.videoUrl, '_blank')}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                </div>
              ) : (
                <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Video will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
