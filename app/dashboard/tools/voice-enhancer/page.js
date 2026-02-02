'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Upload, Download, Play, Pause, Volume2, Mic,
  RefreshCw, X, FileAudio, Waves, Sparkles, Zap,
  FastForward, Rewind, Radio, Podcast, Speech, Music2, Video
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'

// Voice enhancement presets
const VOICE_PRESETS = [
  { 
    id: 'podcast', 
    name: 'Podcast', 
    icon: '🎙️',
    description: 'Warm, professional sound for podcasts',
    features: ['Bass boost', 'Clarity enhancement', 'Normalization to -16 LUFS'],
    bestFor: 'Podcasts, audio shows'
  },
  { 
    id: 'voiceover', 
    name: 'Voice-Over', 
    icon: '🎬',
    description: 'Clear, present voice for narration',
    features: ['High clarity', 'Compression', 'De-essing'],
    bestFor: 'Video narration, commercials'
  },
  { 
    id: 'interview', 
    name: 'Interview', 
    icon: '🎤',
    description: 'Natural sound for conversations',
    features: ['Gentle enhancement', 'Room tone reduction'],
    bestFor: 'Interviews, conversations'
  },
  { 
    id: 'speech', 
    name: 'Speech/Lecture', 
    icon: '📢',
    description: 'Optimized for spoken word clarity',
    features: ['Speech intelligibility', 'Dynamic range control'],
    bestFor: 'Lectures, presentations, meetings'
  },
  { 
    id: 'music', 
    name: 'Music', 
    icon: '🎵',
    description: 'Balanced enhancement for music',
    features: ['Full frequency enhancement', 'Stereo widening'],
    bestFor: 'Music recordings, singing'
  },
]

export default function VoiceEnhancerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Audio state
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioInfo, setAudioInfo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Settings
  const [selectedPreset, setSelectedPreset] = useState('podcast')
  
  // Output state
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  
  const audioRef = useRef(null)
  const processedAudioRef = useRef(null)
  const fileInputRef = useRef(null)

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }
    
    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setProcessedAudioUrl(null)
    
    // Get audio info
    try {
      const formData = new FormData()
      formData.append('action', 'info')
      formData.append('audio', file)
      
      const response = await fetch('/api/audio-editor', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setAudioInfo(data)
        setDuration(data.duration)
        toast.success(`Loaded: ${file.name}`)
      }
    } catch (error) {
      console.error('Info error:', error)
    }
  }

  // Audio controls
  useEffect(() => {
    const audio = isComparing ? processedAudioRef.current : audioRef.current
    if (!audio) return
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleDurationChange = () => setDuration(audio.duration)
    
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('durationchange', handleDurationChange)
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('durationchange', handleDurationChange)
    }
  }, [audioUrl, processedAudioUrl, isComparing])

  const togglePlay = () => {
    const audio = isComparing ? processedAudioRef.current : audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value) => {
    const audio = isComparing ? processedAudioRef.current : audioRef.current
    if (!audio) return
    const time = (value[0] / 100) * duration
    audio.currentTime = time
    setCurrentTime(time)
  }

  // Enhance voice
  const handleEnhance = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file first')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', 'enhance-voice')
      formData.append('audio', audioFile)
      formData.append('preset', selectedPreset)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 90))
      }, 500)
      
      const response = await fetch('/api/audio-editor', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const data = await response.json()
      
      if (data.success) {
        setProcessedAudioUrl(data.audioUrl)
        toast.success('Voice enhanced successfully!')
      } else {
        toast.error(data.error || 'Enhancement failed')
      }
    } catch (error) {
      console.error('Enhancement error:', error)
      toast.error('Failed to enhance audio')
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  // Download
  const downloadAudio = () => {
    if (!processedAudioUrl) return
    const link = document.createElement('a')
    link.href = processedAudioUrl
    link.download = `enhanced-${selectedPreset}-${Date.now()}.mp3`
    link.click()
    toast.success('Audio downloaded!')
  }

  const currentPreset = VOICE_PRESETS.find(p => p.id === selectedPreset)

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Mic className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Voice Enhancer
                <Badge className="bg-white/20 text-white text-xs">Pro Audio</Badge>
              </h1>
              <p className="text-white/80 text-sm">Improve voice clarity and quality with AI</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Podcast className="h-3 w-3" /> Podcast Ready
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Video className="h-3 w-3" /> Voice-Over
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Radio className="h-3 w-3" /> Broadcast Quality
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Voice Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  audioFile ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border hover:border-orange-300'
                }`}
              >
                {audioFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileAudio className="h-12 w-12 text-orange-600" />
                    <div className="text-left">
                      <p className="font-medium">{audioFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {audioInfo ? `${formatTime(audioInfo.duration)} • ${(audioInfo.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Loading...'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setAudioFile(null); setAudioUrl(null); setProcessedAudioUrl(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium text-lg">Upload voice recording</p>
                    <p className="text-sm text-muted-foreground">MP3, WAV, OGG, AAC, FLAC</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {/* Preset Selection */}
              <div>
                <Label className="text-sm font-semibold mb-4 block">Enhancement Preset</Label>
                <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset} className="space-y-3">
                  {VOICE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPreset === preset.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                          : 'border-border hover:border-orange-300'
                      }`}
                      onClick={() => setSelectedPreset(preset.id)}
                    >
                      <RadioGroupItem value={preset.id} id={preset.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{preset.icon}</span>
                          <Label htmlFor={preset.id} className="font-semibold cursor-pointer">{preset.name}</Label>
                          {preset.id === 'podcast' && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {preset.features.map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Process Button */}
              <Button
                onClick={handleEnhance}
                disabled={isLoading || !audioFile}
                className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Enhance Voice ({currentPreset?.name})
                  </>
                )}
              </Button>

              {/* Progress */}
              {isLoading && (
                <div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground mt-2">Applying {currentPreset?.name} enhancement...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Player */}
          {(audioUrl || processedAudioUrl) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    {processedAudioUrl ? 'Compare' : 'Preview'}
                  </CardTitle>
                  {processedAudioUrl && (
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={!isComparing ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => { setIsComparing(false); setIsPlaying(false) }}
                      >
                        Original
                      </Button>
                      <Button
                        variant={isComparing ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => { setIsComparing(true); setIsPlaying(false) }}
                      >
                        Enhanced
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <audio ref={audioRef} src={audioUrl} className="hidden" />
                {processedAudioUrl && <audio ref={processedAudioRef} src={processedAudioUrl} className="hidden" />}
                
                {/* Visual */}
                <div className={`h-24 rounded-lg mb-4 flex items-center justify-center transition-colors ${
                  isComparing
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30'
                    : 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30'
                }`}>
                  <div className="text-center">
                    <Mic className={`h-8 w-8 mx-auto ${isComparing ? 'text-orange-500' : 'text-gray-500'}`} />
                    <p className="text-xs mt-1 text-muted-foreground">
                      {isComparing ? `✨ ${currentPreset?.name} Enhanced` : '🎤 Original Recording'}
                    </p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="mb-4">
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => {
                    const audio = isComparing ? processedAudioRef.current : audioRef.current
                    if (audio) audio.currentTime -= 10
                  }}>
                    <Rewind className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className={`h-14 w-14 rounded-full ${isComparing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const audio = isComparing ? processedAudioRef.current : audioRef.current
                    if (audio) audio.currentTime += 10
                  }}>
                    <FastForward className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download */}
          {processedAudioUrl && (
            <Card>
              <CardContent className="pt-6">
                <Button onClick={downloadAudio} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  <Download className="h-4 w-4 mr-2" />
                  Download Enhanced Audio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Zap className="h-4 w-4" /> Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-orange-700 dark:text-orange-300">
              <p>• <strong>Podcast</strong> - Best for spoken content</p>
              <p>• <strong>Voice-Over</strong> - Clear, professional narration</p>
              <p>• <strong>Interview</strong> - Natural conversation sound</p>
              <p>• Compare A/B to hear the difference</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
