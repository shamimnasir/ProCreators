'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Upload, Download, Play, Pause, Scissors, Video,
  RefreshCw, X, FileVideo, Clock, Zap, Plus, Trash2,
  FastForward, Rewind, SkipBack, SkipForward, Split
} from 'lucide-react'

export default function VideoTrimmerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Video state
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoInfo, setVideoInfo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Trim state
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  
  // Clips state (for multi-clip mode)
  const [clips, setClips] = useState([])
  const [mode, setMode] = useState('trim') // 'trim' or 'clips'
  
  // Output state
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)
  const [processedClips, setProcessedClips] = useState([])
  
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

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
    
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }
    
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB')
      return
    }
    
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setProcessedVideoUrl(null)
    setProcessedClips([])
    setClips([])
    setTrimStart(0)
    setTrimEnd(100)
    
    // Get video info
    try {
      const formData = new FormData()
      formData.append('action', 'info')
      formData.append('video', file)
      
      const response = await fetch('/api/video-tools', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setVideoInfo(data)
        setDuration(data.duration)
        toast.success(`Loaded: ${file.name}`)
      }
    } catch (error) {
      console.error('Info error:', error)
    }
  }

  // Video playback controls
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadedMetadata = () => setDuration(video.duration)
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoUrl])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value) => {
    if (!videoRef.current) return
    const time = (value[0] / 100) * duration
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  // Set trim point from current position
  const setStartFromCurrent = () => {
    const percentage = (currentTime / duration) * 100
    setTrimStart(percentage)
  }

  const setEndFromCurrent = () => {
    const percentage = (currentTime / duration) * 100
    setTrimEnd(percentage)
  }

  // Add clip at current position
  const addClipAtCurrent = () => {
    const startTime = currentTime
    const endTime = Math.min(currentTime + 10, duration) // Default 10 second clip
    setClips(prev => [...prev, { start: startTime, end: endTime }])
  }

  const removeClip = (index) => {
    setClips(prev => prev.filter((_, i) => i !== index))
  }

  const updateClip = (index, field, value) => {
    setClips(prev => prev.map((clip, i) => 
      i === index ? { ...clip, [field]: parseFloat(value) } : clip
    ))
  }

  // Trim video
  const handleTrim = async () => {
    if (!videoFile) {
      toast.error('Please upload a video first')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', 'trim')
      formData.append('video', videoFile)
      formData.append('startTime', ((trimStart / 100) * duration).toString())
      formData.append('endTime', ((trimEnd / 100) * duration).toString())
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90))
      }, 1000)
      
      const response = await fetch('/api/video-tools', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const data = await response.json()
      
      if (data.success) {
        setProcessedVideoUrl(data.videoUrl)
        toast.success(data.message || 'Video trimmed!')
      } else {
        toast.error(data.error || 'Trimming failed')
      }
    } catch (error) {
      console.error('Trim error:', error)
      toast.error('Failed to trim video')
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  // Create clips
  const handleCreateClips = async () => {
    if (!videoFile || clips.length === 0) {
      toast.error('Please add at least one clip')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', 'clip')
      formData.append('video', videoFile)
      formData.append('clips', JSON.stringify(clips))
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90))
      }, 1000)
      
      const response = await fetch('/api/video-tools', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const data = await response.json()
      
      if (data.success) {
        setProcessedClips(data.clips)
        toast.success(data.message || 'Clips created!')
      } else {
        toast.error(data.error || 'Clip creation failed')
      }
    } catch (error) {
      console.error('Clip error:', error)
      toast.error('Failed to create clips')
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  // Download video
  const downloadVideo = (url, name = 'trimmed-video') => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${name}-${Date.now()}.mp4`
    link.click()
    toast.success('Video downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Scissors className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Video Trimmer
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">Fast</Badge>
                </h1>
                <p className="text-white/80 text-sm">Cut and trim videos quickly</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="hidden md:flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setMode('trim')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'trim' ? 'bg-white text-rose-600' : 'hover:bg-white/10'
                }`}
              >
                <Scissors className="h-4 w-4 inline mr-1" />
                Trim
              </button>
              <button
                onClick={() => setMode('clips')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'clips' ? 'bg-white text-rose-600' : 'hover:bg-white/10'
                }`}
              >
                <Split className="h-4 w-4 inline mr-1" />
                Multi-Clip
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Scissors className="h-3 w-3" /> Quick Cut
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Split className="h-3 w-3" /> Multiple Clips
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Zap className="h-3 w-3" /> Fast Export
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
                <Video className="h-5 w-5" /> 
                {mode === 'trim' ? 'Trim Video' : 'Create Clips'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  videoFile ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'border-border hover:border-rose-300'
                }`}
              >
                {videoFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileVideo className="h-10 w-10 text-rose-600" />
                    <div className="text-left">
                      <p className="font-medium">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {videoInfo ? `${formatTime(videoInfo.duration)} • ${(videoInfo.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Loading...'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setVideoFile(null); setVideoUrl(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Upload video to trim</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, AVI, WebM (max 100MB)</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {/* Video Preview */}
              {videoUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full"
                      onClick={togglePlay}
                    />
                    {/* Play overlay */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
                        <div className="p-4 bg-white/90 rounded-full">
                          <Play className="h-8 w-8 text-rose-600 fill-rose-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">{formatTime(currentTime)}</span>
                      <Slider
                        value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12">{formatTime(duration)}</span>
                    </div>
                    
                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0 }}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 5 }}>
                        <Rewind className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-10 w-10 rounded-full bg-rose-600 hover:bg-rose-700" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 5 }}>
                        <FastForward className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (videoRef.current) videoRef.current.currentTime = duration }}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Trim Mode */}
                  {mode === 'trim' && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Trim Range</Label>
                        <span className="text-sm text-muted-foreground">
                          Duration: {formatTime(((trimEnd - trimStart) / 100) * duration)}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12">Start:</span>
                          <span className="text-sm font-mono w-16">{formatTime((trimStart / 100) * duration)}</span>
                          <Slider
                            value={[trimStart]}
                            onValueChange={([v]) => setTrimStart(Math.min(v, trimEnd - 1))}
                            max={100}
                            step={0.1}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm" onClick={setStartFromCurrent}>
                            Set
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12">End:</span>
                          <span className="text-sm font-mono w-16">{formatTime((trimEnd / 100) * duration)}</span>
                          <Slider
                            value={[trimEnd]}
                            onValueChange={([v]) => setTrimEnd(Math.max(v, trimStart + 1))}
                            max={100}
                            step={0.1}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm" onClick={setEndFromCurrent}>
                            Set
                          </Button>
                        </div>
                      </div>
                      
                      <Button onClick={handleTrim} disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-700">
                        {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Scissors className="h-4 w-4 mr-2" />}
                        Trim Video
                      </Button>
                    </div>
                  )}

                  {/* Clips Mode */}
                  {mode === 'clips' && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Clips ({clips.length})</Label>
                        <Button variant="outline" size="sm" onClick={addClipAtCurrent}>
                          <Plus className="h-3 w-3 mr-1" /> Add at {formatTime(currentTime)}
                        </Button>
                      </div>
                      
                      {clips.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Click "Add" to create clips at specific timestamps
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {clips.map((clip, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                              <span className="text-xs font-medium text-muted-foreground w-6">#{i + 1}</span>
                              <Input
                                type="number"
                                value={clip.start.toFixed(1)}
                                onChange={(e) => updateClip(i, 'start', e.target.value)}
                                className="w-20 h-8 text-xs"
                                step="0.1"
                                min="0"
                                max={duration}
                              />
                              <span className="text-xs">to</span>
                              <Input
                                type="number"
                                value={clip.end.toFixed(1)}
                                onChange={(e) => updateClip(i, 'end', e.target.value)}
                                className="w-20 h-8 text-xs"
                                step="0.1"
                                min="0"
                                max={duration}
                              />
                              <span className="text-xs text-muted-foreground flex-1">
                                ({formatTime(clip.end - clip.start)})
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeClip(i)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button onClick={handleCreateClips} disabled={isLoading || clips.length === 0} className="w-full bg-rose-600 hover:bg-rose-700">
                        {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Split className="h-4 w-4 mr-2" />}
                        Create {clips.length} Clip{clips.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {isLoading && (
                <div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground mt-2">Processing video...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trimmed Video */}
          {processedVideoUrl && mode === 'trim' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" /> Trimmed Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
                  <video src={processedVideoUrl} controls className="w-full h-full" />
                </div>
                <Button onClick={() => downloadVideo(processedVideoUrl, 'trimmed')} className="w-full bg-rose-600 hover:bg-rose-700">
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Created Clips */}
          {processedClips.length > 0 && mode === 'clips' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Split className="h-4 w-4" /> Created Clips ({processedClips.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processedClips.map((clip, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Clip #{clip.index}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(clip.start)} - {formatTime(clip.end)} ({formatTime(clip.duration)})
                      </span>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-black aspect-video mb-2">
                      <video src={clip.videoUrl} controls className="w-full h-full" />
                    </div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => downloadVideo(clip.videoUrl, `clip-${clip.index}`)}>
                      <Download className="h-3 w-3 mr-1" /> Download Clip #{clip.index}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-rose-800 dark:text-rose-200">
                <Zap className="h-4 w-4" /> Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-rose-700 dark:text-rose-300">
              <p>• Use <strong>Trim</strong> for single cut operations</p>
              <p>• Use <strong>Multi-Clip</strong> to extract multiple segments</p>
              <p>• Click "Set" buttons to mark current position</p>
              <p>• Max file size: 100MB</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
