'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Upload, Download, Play, Pause, Scissors, Volume2, Music,
  RefreshCw, X, Plus, Clock, Zap, FileAudio, Layers, Wand2,
  FastForward, Rewind, VolumeX, Waves, Merge, ArrowRight
, Wand2 , Zap } from 'lucide-react'

// Format options
const FORMATS = [
  { id: 'mp3', name: 'MP3', description: 'Most compatible, good quality' },
  { id: 'wav', name: 'WAV', description: 'Lossless, large files' },
  { id: 'ogg', name: 'OGG', description: 'Open format, good quality' },
  { id: 'aac', name: 'AAC', description: 'Apple preferred, efficient' },
  { id: 'flac', name: 'FLAC', description: 'Lossless, smaller than WAV' },
]

const BITRATES = [
  { id: '128k', name: '128 kbps', quality: 'Standard' },
  { id: '192k', name: '192 kbps', quality: 'Good' },
  { id: '256k', name: '256 kbps', quality: 'High' },
  { id: '320k', name: '320 kbps', quality: 'Best' },
]

export default function AudioEditorPage() {
  const [activeTab, setActiveTab] = useState('edit')
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
  
  // Trim state
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  
  // Effects state
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [preservePitch, setPreservePitch] = useState(true)
  const [volumeAdjust, setVolumeAdjust] = useState(100)
  const [normalize, setNormalize] = useState(false)
  
  // Convert state
  const [outputFormat, setOutputFormat] = useState('mp3')
  const [bitrate, setBitrate] = useState('192k')
  
  // Merge state
  const [mergeFiles, setMergeFiles] = useState([])
  
  // Output state
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null)
  const { checkAndDeduct, refund, complete } = useCredits()
  
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const mergeInputRef = useRef(null)

  // Format time display
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
    
    // Get audio info from API
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

  // Handle merge files
  const handleMergeFilesUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const audioFiles = files.filter(f => f.type.startsWith('audio/'))
    
    if (audioFiles.length === 0) {
      toast.error('Please upload audio files')
      return
    }
    
    setMergeFiles(prev => [...prev, ...audioFiles.map(f => ({
      file: f,
      name: f.name,
      url: URL.createObjectURL(f)
    }))])
    toast.success(`Added ${audioFiles.length} file(s)`)
  }

  // Remove merge file
  const removeMergeFile = (index) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Audio playback controls
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
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value) => {
    if (!audioRef.current) return
    const time = (value[0] / 100) * duration
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (value) => {
    if (!audioRef.current) return
    audioRef.current.volume = value[0]
    setVolume(value[0])
  }

  // Process audio
  const processAudio = async (action, params = {}) => {
    if (!audioFile && action !== 'merge') {
      toast.error('Please upload an audio file first')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', action)
      
      if (action === 'merge') {
        if (mergeFiles.length < 2) {
          toast.error('Add at least 2 files to merge')
          setIsLoading(false)
          return
        }
        mergeFiles.forEach(f => formData.append('audio', f.file))
      } else {
        formData.append('audio', audioFile)
      }
      
      // Add params
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
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
        toast.success(data.message || 'Audio processed successfully!')
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

  // Trim audio
  const handleTrim = () => {
    const startTime = (trimStart / 100) * duration
    const endTime = (trimEnd / 100) * duration
    processAudio('trim', { startTime, endTime })
  }

  // Add fade
  const handleFade = () => {
    processAudio('fade', { fadeIn, fadeOut })
  }

  // Change speed
  const handleSpeed = () => {
    processAudio('speed', { speed, preservePitch })
  }

  // Adjust volume
  const handleVolumeAdjust = () => {
    processAudio('adjust-volume', { volume: volumeAdjust / 100, normalize })
  }

  // Convert format
  const handleConvert = () => {
    processAudio('convert', { format: outputFormat, bitrate })
  }

  // Merge files
  const handleMerge = () => {
    processAudio('merge')
  }

  // Download processed audio
  const downloadAudio = () => {
    if (!processedAudioUrl) return
    const link = document.createElement('a')
    link.href = processedAudioUrl
    link.download = `edited-audio-${Date.now()}.${outputFormat}`
    link.click()
    toast.success('Audio downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Music className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Audio Editor
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">Pro</Badge>
                </h1>
                <p className="text-white/80 text-sm">Cut, trim, merge, and edit audio files</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Scissors className="h-3 w-3" /> Trim & Cut
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Merge className="h-3 w-3" /> Merge Files
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <RefreshCw className="h-3 w-3" /> Convert Format
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <FastForward className="h-3 w-3" /> Speed Control
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b bg-muted/30">
                <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0 flex-wrap">
                  <TabsTrigger value="edit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent py-3 px-4">
                    <Scissors className="h-4 w-4 mr-2" /> Edit
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent py-3 px-4">
                    <Wand2 className="h-4 w-4 mr-2" /> Effects
                  </TabsTrigger>
                  <TabsTrigger value="merge" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent py-3 px-4">
                    <Layers className="h-4 w-4 mr-2" /> Merge
                  </TabsTrigger>
                  <TabsTrigger value="convert" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent py-3 px-4">
                    <RefreshCw className="h-4 w-4 mr-2" /> Convert
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="p-6">
                {/* Upload Area - Common for edit/effects/convert */}
                {activeTab !== 'merge' && (
                  <div className="mb-6">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        audioFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border hover:border-green-300'
                      }`}
                    >
                      {audioFile ? (
                        <div className="flex items-center justify-center gap-4">
                          <FileAudio className="h-10 w-10 text-green-600" />
                          <div className="text-left">
                            <p className="font-medium">{audioFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {audioInfo ? `${formatTime(audioInfo.duration)} • ${(audioInfo.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Loading...'}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setAudioFile(null); setAudioUrl(null); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="font-medium">Upload audio file</p>
                          <p className="text-xs text-muted-foreground">MP3, WAV, OGG, AAC, FLAC</p>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </div>
                )}

                {/* Edit Tab */}
                <TabsContent value="edit" className="mt-0 space-y-6">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Trim Audio</Label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-20">Start: {formatTime((trimStart / 100) * duration)}</span>
                        <Slider
                          value={[trimStart]}
                          onValueChange={([v]) => setTrimStart(v)}
                          max={100}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-20">End: {formatTime((trimEnd / 100) * duration)}</span>
                        <Slider
                          value={[trimEnd]}
                          onValueChange={([v]) => setTrimEnd(v)}
                          max={100}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <CreditCostBadge toolId="audio-editor" />
                      <Button onClick={handleTrim} disabled={isLoading || !audioFile} className="flex-1 bg-green-600 hover:bg-green-700">
                        {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Scissors className="h-4 w-4 mr-2" />}
                        Trim Audio
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="mt-0 space-y-6">
                  {/* Fade */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Fade In/Out</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Fade In: {fadeIn}s</Label>
                        <Slider value={[fadeIn]} onValueChange={([v]) => setFadeIn(v)} max={10} step={0.5} />
                      </div>
                      <div>
                        <Label className="text-xs">Fade Out: {fadeOut}s</Label>
                        <Slider value={[fadeOut]} onValueChange={([v]) => setFadeOut(v)} max={10} step={0.5} />
                      </div>
                    </div>
                    <Button onClick={handleFade} disabled={isLoading || !audioFile || (fadeIn === 0 && fadeOut === 0)} className="mt-3 w-full" variant="outline">
                      Apply Fade
                    </Button>
                  </div>

                  {/* Speed */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Playback Speed</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-16">{speed}x</span>
                        <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={0.5} max={2} step={0.1} className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={preservePitch} onCheckedChange={setPreservePitch} />
                        <Label className="text-xs">Preserve pitch</Label>
                      </div>
                    </div>
                    <Button onClick={handleSpeed} disabled={isLoading || !audioFile} className="mt-3 w-full" variant="outline">
                      <FastForward className="h-4 w-4 mr-2" /> Change Speed
                    </Button>
                  </div>

                  {/* Volume */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Volume Adjustment</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-16">{volumeAdjust}%</span>
                        <Slider value={[volumeAdjust]} onValueChange={([v]) => setVolumeAdjust(v)} min={0} max={200} step={5} className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={normalize} onCheckedChange={setNormalize} />
                        <Label className="text-xs">Normalize audio level</Label>
                      </div>
                    </div>
                    <Button onClick={handleVolumeAdjust} disabled={isLoading || !audioFile} className="mt-3 w-full" variant="outline">
                      <Volume2 className="h-4 w-4 mr-2" /> Adjust Volume
                    </Button>
                  </div>
                </TabsContent>

                {/* Merge Tab */}
                <TabsContent value="merge" className="mt-0 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">Files to Merge</Label>
                      <Button size="sm" onClick={() => mergeInputRef.current?.click()}>
                        <Plus className="h-4 w-4 mr-1" /> Add Files
                      </Button>
                    </div>
                    <input ref={mergeInputRef} type="file" accept="audio/*" multiple onChange={handleMergeFilesUpload} className="hidden" />
                    
                    <div className="space-y-2">
                      {mergeFiles.length === 0 ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Add at least 2 audio files to merge</p>
                        </div>
                      ) : (
                        mergeFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                            <FileAudio className="h-5 w-5 text-green-600" />
                            <span className="flex-1 truncate text-sm">{file.name}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMergeFile(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {mergeFiles.length >= 2 && (
                      <div className="flex items-center justify-center gap-2 my-4 text-sm text-muted-foreground">
                        {mergeFiles.map((_, i) => (
                          <span key={i} className="flex items-center">
                            {i + 1} {i < mergeFiles.length - 1 && <ArrowRight className="h-3 w-3 mx-1" />}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Button onClick={handleMerge} disabled={isLoading || mergeFiles.length < 2} className="w-full bg-green-600 hover:bg-green-700">
                      {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
                      Merge {mergeFiles.length} Files
                    </Button>
                  </div>
                </TabsContent>

                {/* Convert Tab */}
                <TabsContent value="convert" className="mt-0 space-y-6">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Output Format</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {FORMATS.map(format => (
                        <button
                          key={format.id}
                          onClick={() => setOutputFormat(format.id)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            outputFormat === format.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                              : 'border-border hover:border-green-300'
                          }`}
                        >
                          <span className="text-sm font-bold">{format.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Quality (Bitrate)</Label>
                    <Select value={bitrate} onValueChange={setBitrate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BITRATES.map(br => (
                          <SelectItem key={br.id} value={br.id}>
                            {br.name} - {br.quality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleConvert} disabled={isLoading || !audioFile} className="w-full bg-green-600 hover:bg-green-700">
                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Convert to {outputFormat.toUpperCase()}
                  </Button>
                </TabsContent>

                {/* Progress */}
                {isLoading && (
                  <div className="mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground mt-2">Processing audio...</p>
                  </div>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Player & Output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Audio Player */}
          {(audioUrl || processedAudioUrl) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Waves className="h-4 w-4" />
                  {processedAudioUrl ? 'Processed Audio' : 'Original Audio'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <audio
                  ref={audioRef}
                  src={processedAudioUrl || audioUrl}
                  className="hidden"
                />
                
                {/* Waveform placeholder */}
                <div className="h-20 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg mb-4 flex items-center justify-center">
                  <Waves className="h-8 w-8 text-green-500 opacity-50" />
                </div>
                
                {/* Time & Progress */}
                <div className="mb-3">
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
                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}>
                    <Rewind className="h-4 w-4" />
                  </Button>
                  <Button size="icon" className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}>
                    <FastForward className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Volume */}
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setVolume(volume === 0 ? 1 : 0)}>
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-24"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download */}
          {processedAudioUrl && (
            <Card>
              <CardContent className="pt-6">
                <Button onClick={downloadAudio} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download Processed Audio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                <Zap className="h-4 w-4" /> Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-green-700 dark:text-green-300">
              <p>• Use <strong>Trim</strong> to cut unwanted parts</p>
              <p>• <strong>Fade</strong> creates smooth transitions</p>
              <p>• <strong>Normalize</strong> for consistent volume</p>
              <p>• MP3 at 192kbps is ideal for most uses</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
