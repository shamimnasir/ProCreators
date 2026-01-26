'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Video, Upload, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Scissors, Type, Wand2, Music, Palette, Download, Loader2, Check, X,
  Trash2, RefreshCw, Zap, Clock, FileText, Mic, AlertCircle, Settings,
  ChevronRight, Eye, EyeOff, Maximize2, Minimize2, RotateCcw
} from 'lucide-react'

export default function VideoEditorPage() {
  // State
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [fileId, setFileId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [processingMode, setProcessingMode] = useState('fast')
  
  // Video playback
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  
  // Transcript & Analysis
  const [transcript, setTranscript] = useState(null)
  const [fillerWords, setFillerWords] = useState([])
  const [silences, setSilences] = useState([])
  const [scenes, setScenes] = useState([])
  const [beats, setBeats] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ step: '', progress: 0 })
  
  // Editing
  const [selectedSegments, setSelectedSegments] = useState([])
  const [removedSegments, setRemovedSegments] = useState([])
  const [captionStyle, setCaptionStyle] = useState('default')
  const [audioEnhancements, setAudioEnhancements] = useState({
    normalize: true,
    noiseReduction: true,
    volume: 1.0
  })
  const [colorGrade, setColorGrade] = useState('neutral')
  
  // Processing & Export
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)
  const [exportFormat, setExportFormat] = useState('mp4')
  const [exportQuality, setExportQuality] = useState('high')
  
  // UI State
  const [activeTab, setActiveTab] = useState('upload')
  const [showCaptions, setShowCaptions] = useState(true)
  
  // Upload handler with chunked upload support
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file')
      return
    }
    
    // Validate file size based on mode
    const maxSizes = { fast: 100, medium: 500 }
    const maxMB = maxSizes[processingMode]
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File too large for ${processingMode} mode. Max: ${maxMB}MB`)
      return
    }
    
    setVideoFile(file)
    setIsUploading(true)
    setUploadProgress(0)
    
    const newFileId = crypto.randomUUID()
    setFileId(newFileId)
    
    try {
      // Chunked upload for larger files
      const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        
        const formData = new FormData()
        formData.append('file', chunk)
        formData.append('fileId', newFileId)
        formData.append('fileName', file.name)
        formData.append('chunkIndex', i.toString())
        formData.append('totalChunks', totalChunks.toString())
        formData.append('processingMode', processingMode)
        
        const response = await fetch('/api/video-editor/upload', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }
        
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100))
        
        if (result.complete) {
          setVideoUrl(result.filePath)
          setActiveTab('edit')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }
  
  // Create local preview URL
  useEffect(() => {
    if (videoFile && !videoUrl) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [videoFile, videoUrl])
  
  // Video playback controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }
  
  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Analyze video (transcribe + detect)
  const analyzeVideo = async () => {
    if (!fileId && !videoUrl) return
    
    setIsAnalyzing(true)
    setAnalysisProgress({ step: 'Initializing...', progress: 0 })
    
    try {
      // Step 1: Transcribe
      setAnalysisProgress({ step: 'Transcribing audio...', progress: 10 })
      
      const transcribeRes = await fetch('/api/video-editor/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId,
          filePath: videoUrl?.startsWith('/') ? videoUrl : null
        })
      })
      
      const transcribeData = await transcribeRes.json()
      
      if (transcribeData.success) {
        setTranscript(transcribeData.transcript)
        setFillerWords(transcribeData.analysis?.fillerWords || [])
        setSilences(transcribeData.analysis?.silences || [])
      }
      
      setAnalysisProgress({ step: 'Detecting scenes...', progress: 50 })
      
      // Step 2: Detect scenes
      const scenesRes = await fetch('/api/video-editor/detect-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId,
          filePath: videoUrl?.startsWith('/') ? videoUrl : null
        })
      })
      
      const scenesData = await scenesRes.json()
      
      if (scenesData.success) {
        setScenes(scenesData.scenes || [])
      }
      
      setAnalysisProgress({ step: 'Analyzing audio...', progress: 75 })
      
      // Step 3: Analyze audio for beats
      const audioRes = await fetch('/api/video-editor/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId,
          filePath: videoUrl?.startsWith('/') ? videoUrl : null,
          detectBeats: true,
          detectSilences: true
        })
      })
      
      const audioData = await audioRes.json()
      
      if (audioData.success) {
        setBeats(audioData.beats || [])
        // Merge silences if more detected
        if (audioData.silences?.length > silences.length) {
          setSilences(audioData.silences)
        }
      }
      
      setAnalysisProgress({ step: 'Complete!', progress: 100 })
      
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Analysis failed: ' + error.message)
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1000)
    }
  }
  
  // Process video with selected operations
  const processVideo = async () => {
    if (!fileId && !videoUrl) return
    
    setIsProcessing(true)
    
    try {
      const operations = []
      
      // Add filler/silence removal if segments selected
      if (removedSegments.length > 0) {
        operations.push({
          type: 'remove_segments',
          segments: removedSegments
        })
      }
      
      // Add captions if enabled
      if (showCaptions && transcript) {
        operations.push({
          type: 'add_captions',
          transcript,
          style: { preset: captionStyle }
        })
      }
      
      // Add audio enhancement
      if (audioEnhancements.normalize || audioEnhancements.noiseReduction) {
        operations.push({
          type: 'enhance_audio',
          settings: audioEnhancements
        })
      }
      
      // Add color grading
      if (colorGrade !== 'neutral') {
        operations.push({
          type: 'color_grade',
          preset: colorGrade
        })
      }
      
      const response = await fetch('/api/video-editor/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          filePath: videoUrl?.startsWith('/') ? videoUrl : null,
          operations
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProcessedVideoUrl(result.outputPath)
        setActiveTab('export')
      } else {
        throw new Error(result.error || 'Processing failed')
      }
      
    } catch (error) {
      console.error('Processing error:', error)
      alert('Processing failed: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Export video
  const exportVideo = async () => {
    if (!processedVideoUrl) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/video-editor/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: processedVideoUrl,
          format: exportFormat,
          quality: exportQuality
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Trigger download
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `edited-video.${exportFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error(result.error || 'Export failed')
      }
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Toggle segment removal
  const toggleSegmentRemoval = (segment) => {
    const exists = removedSegments.find(s => s.start === segment.start && s.end === segment.end)
    if (exists) {
      setRemovedSegments(removedSegments.filter(s => s.start !== segment.start || s.end !== segment.end))
    } else {
      setRemovedSegments([...removedSegments, segment])
    }
  }
  
  // Remove all fillers
  const removeAllFillers = () => {
    const fillerSegments = fillerWords.map(fw => ({
      start: fw.start,
      end: fw.end,
      type: 'filler',
      word: fw.word
    }))
    setRemovedSegments([...removedSegments, ...fillerSegments])
  }
  
  // Remove all silences
  const removeAllSilences = () => {
    const silenceSegments = silences.map(s => ({
      start: s.start,
      end: s.end,
      type: 'silence',
      duration: s.duration
    }))
    setRemovedSegments([...removedSegments, ...silenceSegments])
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Video Editor</h1>
                <p className="text-sm text-muted-foreground">
                  Auto-captions, filler removal, scene detection & more
                </p>
              </div>
            </div>
            
            {/* Processing Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Mode:</Label>
                <Select value={processingMode} onValueChange={setProcessingMode}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Fast (100MB)
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Medium (500MB)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!videoUrl} className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!processedVideoUrl} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>
          
          {/* UPLOAD TAB */}
          <TabsContent value="upload">
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Support for MP4, MOV, WebM. Max {processingMode === 'fast' ? '100MB / 5 min' : '500MB / 15 min'}
                  </p>
                  
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="max-w-xs"
                  />
                  
                  {isUploading && (
                    <div className="mt-6 w-full max-w-xs">
                      <Progress value={uploadProgress} className="mb-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Features Overview */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <Type className="h-8 w-8 text-blue-500 mb-3" />
                  <h4 className="font-semibold mb-1">Auto-Captions</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-powered transcription with styled captions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Mic className="h-8 w-8 text-green-500 mb-3" />
                  <h4 className="font-semibold mb-1">Filler Removal</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-detect and remove "um", "uh", pauses
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Music className="h-8 w-8 text-purple-500 mb-3" />
                  <h4 className="font-semibold mb-1">Beat Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Sync cuts to music beats automatically
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* EDIT TAB */}
          <TabsContent value="edit">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Preview */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {/* Video Player */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      {videoUrl ? (
                        <video
                          ref={videoRef}
                          src={videoUrl.startsWith('/') ? videoUrl : videoUrl}
                          className="w-full h-full object-contain"
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No video loaded</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Playback Controls */}
                    <div className="mt-4 space-y-3">
                      {/* Progress Bar */}
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => seekTo(parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        
                        {/* Markers for scenes/beats */}
                        <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                          {scenes.map((scene, i) => (
                            <div
                              key={`scene-${i}`}
                              className="absolute top-0 w-0.5 h-full bg-blue-500 opacity-50"
                              style={{ left: `${(scene.start / duration) * 100}%` }}
                            />
                          ))}
                          {beats.slice(0, 50).map((beat, i) => (
                            <div
                              key={`beat-${i}`}
                              className="absolute bottom-0 w-0.5 h-1 bg-purple-500"
                              style={{ left: `${(beat.time / duration) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => seekTo(Math.max(0, currentTime - 5))}>
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button size="icon" onClick={togglePlay}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => seekTo(Math.min(duration, currentTime + 5))}>
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-mono ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setIsMuted(!isMuted)
                              if (videoRef.current) videoRef.current.muted = !isMuted
                            }}
                          >
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Transcript / Text-Based Editing */}
                {transcript && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Transcript
                        </CardTitle>
                        <Badge variant="secondary">{transcript.segments?.length || 0} segments</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {transcript.segments?.map((seg, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                currentTime >= seg.start && currentTime <= seg.end
                                  ? 'bg-primary/20 border-l-2 border-primary'
                                  : 'hover:bg-muted'
                              } ${
                                removedSegments.some(r => r.start === seg.start)
                                  ? 'opacity-50 line-through'
                                  : ''
                              }`}
                              onClick={() => seekTo(seg.start)}
                            >
                              <span className="text-xs text-muted-foreground mr-2">
                                {formatTime(seg.start)}
                              </span>
                              {seg.text}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Tools Panel */}
              <div className="space-y-4">
                {/* Analyze Button */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={analyzeVideo}
                      disabled={isAnalyzing || !videoUrl}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {analysisProgress.step}
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Analyze Video
                        </>
                      )}
                    </Button>
                    {isAnalyzing && (
                      <Progress value={analysisProgress.progress} className="mt-3" />
                    )}
                  </CardContent>
                </Card>
                
                {/* Filler Words */}
                {fillerWords.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Filler Words</CardTitle>
                        <Button variant="ghost" size="sm" onClick={removeAllFillers}>
                          Remove All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {fillerWords.slice(0, 20).map((fw, i) => (
                          <Badge
                            key={i}
                            variant={removedSegments.some(r => r.start === fw.start) ? 'destructive' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleSegmentRemoval(fw)}
                          >
                            "{fw.word}" @ {formatTime(fw.start)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Silences */}
                {silences.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Silences</CardTitle>
                        <Button variant="ghost" size="sm" onClick={removeAllSilences}>
                          Remove All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {silences.slice(0, 10).map((s, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded ${
                              removedSegments.some(r => r.start === s.start)
                                ? 'bg-destructive/20'
                                : 'bg-muted'
                            }`}
                          >
                            <span className="text-sm">
                              {formatTime(s.start)} - {formatTime(s.end)} ({s.duration.toFixed(1)}s)
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSegmentRemoval(s)}
                            >
                              {removedSegments.some(r => r.start === s.start) ? (
                                <RotateCcw className="h-4 w-4" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Captions */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Captions
                      </CardTitle>
                      <Switch checked={showCaptions} onCheckedChange={setShowCaptions} />
                    </div>
                  </CardHeader>
                  {showCaptions && (
                    <CardContent>
                      <Select value={captionStyle} onValueChange={setCaptionStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Caption Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (White)</SelectItem>
                          <SelectItem value="bold">Bold Outline</SelectItem>
                          <SelectItem value="neon">Neon Glow</SelectItem>
                          <SelectItem value="yellow">Yellow Highlight</SelectItem>
                          <SelectItem value="tiktok">TikTok Style</SelectItem>
                          <SelectItem value="minimal">Minimal Clean</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  )}
                </Card>
                
                {/* Audio Enhancement */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Audio Enhancement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Normalize Audio</Label>
                      <Switch
                        checked={audioEnhancements.normalize}
                        onCheckedChange={(v) => setAudioEnhancements({ ...audioEnhancements, normalize: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Noise Reduction</Label>
                      <Switch
                        checked={audioEnhancements.noiseReduction}
                        onCheckedChange={(v) => setAudioEnhancements({ ...audioEnhancements, noiseReduction: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Volume: {Math.round(audioEnhancements.volume * 100)}%</Label>
                      <Slider
                        value={[audioEnhancements.volume * 100]}
                        onValueChange={([v]) => setAudioEnhancements({ ...audioEnhancements, volume: v / 100 })}
                        min={50}
                        max={200}
                        step={10}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Color Grading */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Grading
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={colorGrade} onValueChange={setColorGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral (None)</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cool">Cool</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="bw">Black & White</SelectItem>
                        <SelectItem value="highcontrast">High Contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {/* Process Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={processVideo}
                  disabled={isProcessing || (!transcript && removedSegments.length === 0)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* EXPORT TAB */}
          <TabsContent value="export">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {processedVideoUrl && (
                    <video
                      src={processedVideoUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>
              
              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                        <SelectItem value="mov">MOV</SelectItem>
                        <SelectItem value="gif">GIF (No Audio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select value={exportQuality} onValueChange={setExportQuality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Smaller file)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Best quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={exportVideo}
                    disabled={isProcessing || !processedVideoUrl}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Video
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
