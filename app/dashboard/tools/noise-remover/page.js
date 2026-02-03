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
  Upload, Download, Play, Pause, Volume2, VolumeX, Wand2,
  RefreshCw, X, FileAudio, Waves, Sparkles, Zap, CheckCircle,
  FastForward, Rewind, ArrowRight
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'

// Noise reduction levels
const NOISE_LEVELS = [
  { 
    id: 'light', 
    name: 'Light', 
    icon: '✨',
    description: 'Gentle cleanup - preserves natural sound',
    bestFor: 'Professional recordings with minor background noise'
  },
  { 
    id: 'medium', 
    name: 'Medium', 
    icon: '🎯',
    description: 'Balanced noise reduction - recommended',
    bestFor: 'Most audio recordings, podcasts, interviews'
  },
  { 
    id: 'heavy', 
    name: 'Heavy', 
    icon: '💪',
    description: 'Aggressive cleanup - may affect voice quality',
    bestFor: 'Very noisy environments, old recordings'
  },
]

export default function NoiseRemoverPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Audio state
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioInfo, setAudioInfo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  
  // Settings
  const [noiseLevel, setNoiseLevel] = useState('medium')
  
  // Output state
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null)
  const [isComparing, setIsComparing] = useState(false)
  const { checkAndDeduct, refund, complete } = useCredits()
  
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
    const audio = audioRef.current
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

  // Remove noise
  const handleRemoveNoise = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file first')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', 'noise-reduce')
      formData.append('audio', audioFile)
      formData.append('noiseLevel', noiseLevel)
      
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
        toast.success('Noise removed successfully!')
      } else {
        toast.error(data.error || 'Processing failed')
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error('Failed to process audio')
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
    link.download = `noise-removed-${Date.now()}.mp3`
    link.click()
    toast.success('Audio downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Noise Remover
                <Badge className="bg-yellow-400 text-yellow-900 text-xs">AI Magic</Badge>
              </h1>
              <p className="text-white/80 text-sm">Remove background noise with AI-powered filtering</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-3 w-3" /> Background noise
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-3 w-3" /> Room echo
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-3 w-3" /> Hum & buzz
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="h-3 w-3" /> HVAC noise
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
                <Wand2 className="h-5 w-5" /> Noise Removal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  audioFile ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-border hover:border-purple-300'
                }`}
              >
                {audioFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileAudio className="h-12 w-12 text-purple-600" />
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
                    <p className="font-medium text-lg">Upload audio with background noise</p>
                    <p className="text-sm text-muted-foreground">MP3, WAV, OGG, AAC, FLAC</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {/* Noise Level Selection */}
              <div>
                <Label className="text-sm font-semibold mb-4 block">Noise Reduction Level</Label>
                <RadioGroup value={noiseLevel} onValueChange={setNoiseLevel} className="space-y-3">
                  {NOISE_LEVELS.map((level) => (
                    <div
                      key={level.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        noiseLevel === level.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-border hover:border-purple-300'
                      }`}
                      onClick={() => setNoiseLevel(level.id)}
                    >
                      <RadioGroupItem value={level.id} id={level.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{level.icon}</span>
                          <Label htmlFor={level.id} className="font-semibold cursor-pointer">{level.name}</Label>
                          {level.id === 'medium' && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Best for: {level.bestFor}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Process Button */}
              <div className="flex items-center gap-4">
                <CreditCostBadge toolId="noise-remover" />
                <Button
                  onClick={handleRemoveNoise}
                  disabled={isLoading || !audioFile}
                  className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Remove Background Noise
                    </>
                  )}
                </Button>
              </div>

              {/* Progress */}
              {isLoading && (
                <div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground mt-2">AI is cleaning your audio...</p>
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
                    {processedAudioUrl ? 'Compare Audio' : 'Preview'}
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
                        Cleaned
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <audio ref={audioRef} src={audioUrl} className="hidden" />
                {processedAudioUrl && <audio ref={processedAudioRef} src={processedAudioUrl} className="hidden" />}
                
                {/* Visual indicator */}
                <div className={`h-24 rounded-lg mb-4 flex items-center justify-center transition-colors ${
                  isComparing
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30'
                    : 'bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-950/30 dark:to-violet-950/30'
                }`}>
                  <div className="text-center">
                    <Waves className={`h-8 w-8 mx-auto ${isComparing ? 'text-green-500' : 'text-purple-500'}`} />
                    <p className="text-xs mt-1 text-muted-foreground">
                      {isComparing ? '✨ Noise Removed' : '🔊 Original Audio'}
                    </p>
                  </div>
                </div>
                
                {/* Progress slider */}
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
                    className={`h-14 w-14 rounded-full ${isComparing ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
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
                <Button onClick={downloadAudio} className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                  <Download className="h-4 w-4 mr-2" />
                  Download Clean Audio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Zap className="h-4 w-4" /> Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-purple-700 dark:text-purple-300">
              <p>• Start with <strong>Medium</strong> for most recordings</p>
              <p>• <strong>Light</strong> preserves natural ambiance</p>
              <p>• <strong>Heavy</strong> for very noisy recordings</p>
              <p>• Compare before/after to check quality</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
