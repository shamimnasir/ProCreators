'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, Sparkles, Video, Mic, Upload, Download, 
  FileText, Film, Music, Type, Play, Edit, X, Check 
} from 'lucide-react'

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
  
  // Voice state
  const [voiceOption, setVoiceOption] = useState('tts') // 'tts', 'upload', 'clone'
  const [voiceFile, setVoiceFile] = useState(null)
  const [voiceFilePreview, setVoiceFilePreview] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [ttsProvider, setTtsProvider] = useState('elevenlabs')
  const [ttsLanguage, setTtsLanguage] = useState('bn')
  const [bengaliVoice, setBengaliVoice] = useState('female-1') // Bengali voice selection
  
  // Composition state
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  const [musicTrack, setMusicTrack] = useState('upbeat')
  const [resolution, setResolution] = useState('1080p')
  const [composing, setComposing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Output state
  const [videoData, setVideoData] = useState(null)
  
  const { toast } = useToast()
  const audioFileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

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

  // Handle Voice File Upload
  const handleVoiceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Voice file must be less than 50MB",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setVoiceFile(file)
        setVoiceFilePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudio(audioUrl)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      toast({
        title: "Recording Started",
        description: "Speak your narration clearly..."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      })
    }
  }

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      toast({
        title: "Recording Stopped",
        description: "Your narration has been recorded"
      })
    }
  }

  // Compose Final Video
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
    if (voiceOption === 'upload' && !voiceFile) {
      toast({ title: "Error", description: "Please upload your voice file", variant: "destructive" })
      return
    }
    if (voiceOption === 'clone' && !recordedAudio) {
      toast({ title: "Error", description: "Please record your voice sample", variant: "destructive" })
      return
    }

    setComposing(true)
    setProgress(0)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('script', script)
      formData.append('duration', duration)
      formData.append('voiceOption', voiceOption)
      formData.append('ttsProvider', ttsProvider)
      formData.append('ttsLanguage', ttsLanguage)
      formData.append('captionStyle', captionStyle)
      formData.append('musicTrack', musicTrack)
      formData.append('resolution', resolution)
      formData.append('stockVideos', JSON.stringify(stockVideos))
      formData.append('keywords', JSON.stringify(keywords))

      if (voiceOption === 'upload' && voiceFile) {
        formData.append('voiceFile', voiceFile)
      } else if (voiceOption === 'clone' && recordedAudio) {
        // Convert recorded audio blob to file
        const audioBlob = await fetch(recordedAudio).then(r => r.blob())
        formData.append('voiceFile', audioBlob, 'recording.wav')
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
        
        // Auto-save to library
        await fetch('/api/library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'story-reel',
            title: script.substring(0, 50) + '...',
            content: data.videoUrl,
            metadata: {
              duration,
              resolution,
              captionStyle,
              voiceOption,
              keywords: keywords.slice(0, 5)
            }
          })
        })
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
  const handleDownload = () => {
    if (!videoData?.videoUrl) return

    const link = document.createElement('a')
    link.href = videoData.videoUrl
    link.download = `story-reel-${Date.now()}.mp4`
    link.target = '_blank'
    
    if (videoData.videoUrl.startsWith('http') && !videoData.videoUrl.startsWith(window.location.origin)) {
      window.open(videoData.videoUrl, '_blank')
      toast({
        title: "Opening Video",
        description: "Right-click and select 'Save video as...' to download"
      })
    } else {
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Download Started",
        description: "Your video is downloading..."
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
          <p className="text-muted-foreground">Create engaging story videos with AI-powered narration and stock footage</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          New Feature
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
            onChange={(e) => setScript(e.target.value)}
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

      {/* Step 3: Voice Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Step 3: Choose Voice/Narration
          </CardTitle>
          <CardDescription>
            Select how you want to narrate your story
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={voiceOption} onValueChange={setVoiceOption}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tts">
                <Type className="h-4 w-4 mr-2" />
                TTS Voice
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Voice
              </TabsTrigger>
              <TabsTrigger value="clone">
                <Mic className="h-4 w-4 mr-2" />
                Voice Clone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tts" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TTS Provider</Label>
                  <Select value={ttsProvider} onValueChange={setTtsProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevenlabs">ElevenLabs (Recommended - Standard Plan)</SelectItem>
                      <SelectItem value="google">Google TTS (Free)</SelectItem>
                      <SelectItem value="openai">OpenAI TTS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Voice Language</Label>
                  <Select value={ttsLanguage} onValueChange={setTtsLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Bengali Voice Selection - Only show for ElevenLabs + Bengali */}
              {ttsProvider === 'elevenlabs' && ttsLanguage === 'bn' && (
                <div className="space-y-2">
                  <Label>Bengali Voice (Bangladeshi Accent)</Label>
                  <Select value={bengaliVoice} onValueChange={setBengaliVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female-1">Bengali Female 1 (Natural, Expressive)</SelectItem>
                      <SelectItem value="female-2">Bengali Female 2 (Soft, Calm)</SelectItem>
                      <SelectItem value="male-1">Bengali Male 1 (Clear, Professional)</SelectItem>
                      <SelectItem value="male-2">Bengali Male 2 (Deep, Storytelling)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Using Eleven Multilingual v2 model optimized for Bengali (Bangladeshi) accent
                  </p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                AI will generate voice narration for your script using {ttsProvider === 'elevenlabs' ? 'ElevenLabs' : ttsProvider === 'openai' ? 'OpenAI TTS' : 'Google TTS'}
              </p>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Upload Your Voice Recording</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => audioFileRef.current?.click()}
                >
                  {voiceFilePreview ? (
                    <div className="space-y-2">
                      <Check className="mx-auto h-8 w-8 text-green-500" />
                      <p className="text-sm font-medium">{voiceFile?.name}</p>
                      <audio src={voiceFilePreview} controls className="mx-auto mt-2" />
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload voice file (MP3, WAV)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceUpload}
                  className="hidden"
                />
              </div>
            </TabsContent>

            <TabsContent value="clone" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Record Voice Sample (30 seconds)</Label>
                <div className="flex gap-2">
                  {!recording && !recordedAudio && (
                    <Button onClick={startRecording} className="flex-1">
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                  )}
                  {recording && (
                    <Button onClick={stopRecording} variant="destructive" className="flex-1">
                      <div className="mr-2 h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                      Stop Recording
                    </Button>
                  )}
                  {recordedAudio && (
                    <div className="flex-1 space-y-2">
                      <audio src={recordedAudio} controls className="w-full" />
                      <Button 
                        onClick={() => { setRecordedAudio(null); setRecording(false); }} 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                      >
                        Re-record
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Record a 30-second sample of your voice. AI will clone it for the full narration.
                </p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Caption Style</Label>
              <Select value={captionStyle} onValueChange={setCaptionStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bold-outline">Bold with Black Outline</SelectItem>
                  <SelectItem value="karaoke">Word-by-Word Karaoke</SelectItem>
                  <SelectItem value="animated">Animated Pop-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Background Music</Label>
              <Select value={musicTrack} onValueChange={setMusicTrack}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Music</SelectItem>
                  <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                  <SelectItem value="calm">Calm & Peaceful</SelectItem>
                  <SelectItem value="epic">Epic & Dramatic</SelectItem>
                  <SelectItem value="emotional">Emotional</SelectItem>
                </SelectContent>
              </Select>
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
            Step 5: Generate Your Story Video
          </CardTitle>
          <CardDescription>
            Create the final video with all your settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleCompose} 
            disabled={composing || !script.trim() || stockVideos.length === 0}
            className="w-full"
            size="lg"
          >
            {composing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Video className="mr-2 h-5 w-5" />
            Generate Story Video
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
                  <Button variant="outline" className="w-full" asChild>
                    <a href={videoData.captionsUrl} download>
                      <FileText className="mr-2 h-4 w-4" />
                      Download Captions (SRT)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
