'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Video, Upload, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Scissors, Type, Wand2, Music, Palette, Download, Loader2, Check, X,
  Trash2, Zap, Clock, FileText, Mic, Settings, Sparkles, Film, Plus,
  HardDrive, FolderOpen, Save, FilePlus, Info, ShieldAlert, Layers,
  MoveUp, MoveDown, Timer, Waves, Library, CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { videoStorage } from '@/lib/video-storage'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

export default function VideoEditorPage() {
  const { toast } = useToast()
  
  // Project State
  const [projectId, setProjectId] = useState(null)
  const [projectName, setProjectName] = useState('Untitled Video')
  const [projects, setProjects] = useState([])
  const [storageInfo, setStorageInfo] = useState({ usedMB: 0, quotaMB: 0, percentUsed: 0 })
  const [showStorageWarning, setShowStorageWarning] = useState(true)
  const [savedToLibrary, setSavedToLibrary] = useState(false)
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef(null)
  
  // Multi-Clip State
  const [clips, setClips] = useState([]) // Array of { id, file, url, name, duration, analyzed }
  const [selectedClipIndex, setSelectedClipIndex] = useState(0)
  const [isMultiClipMode, setIsMultiClipMode] = useState(false)
  
  // Video playback
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  
  // Analysis State with Real-time Progress
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ 
    step: '', 
    progress: 0, 
    estimatedTime: 0,
    currentClip: 0,
    totalClips: 0
  })
  const [transcript, setTranscript] = useState(null)
  const [fillerWords, setFillerWords] = useState([])
  const [silences, setSilences] = useState([])
  const [scenes, setScenes] = useState([])
  
  // Transition Settings (for multi-clip)
  const [transitionType, setTransitionType] = useState('fade')
  const [transitionDuration, setTransitionDuration] = useState(0.5)
  const [transitionSound, setTransitionSound] = useState('whoosh')
  
  // Processing Settings
  const [applyNoiseReduction, setApplyNoiseReduction] = useState(true)
  const [removeFillerWords, setRemoveFillerWords] = useState(true)
  const [colorGrade, setColorGrade] = useState('neutral')
  const [addCaptions, setAddCaptions] = useState(true)
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ 
    step: '', 
    progress: 0, 
    estimatedTime: 0,
    elapsedTime: 0 
  })
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)
  const [exportFormat, setExportFormat] = useState('mp4')
  const processingTimerRef = useRef(null)
  
  // UI State
  const [activeTab, setActiveTab] = useState('upload')
  const [processingMode, setProcessingMode] = useState('standard')
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  
  const FILE_LIMITS = {
    standard: { maxMB: 500, maxMin: 15 },
    pro: { maxMB: 2048, maxMin: 60 }
  }

  // Initialize storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        await videoStorage.init()
        const savedProjects = await videoStorage.getAllProjects()
        setProjects(savedProjects)
        const usage = await videoStorage.getStorageUsage()
        setStorageInfo(usage)
        await videoStorage.cleanupOldProjects()
      } catch (error) {
        console.error('Storage init error:', error)
      }
    }
    initStorage()
  }, [])

  // AutoSaveDraftsManager callbacks
  const getCurrentDraftData = useCallback(() => ({
    name: projectName,
    clipNames: clips.map(c => c.name),
    clipCount: clips.length,
    totalDuration: clips.reduce((sum, c) => sum + (c.duration || 0), 0),
    transitionType,
    transitionDuration,
    transitionSound,
    applyNoiseReduction,
    removeFillerWords,
    colorGrade,
    addCaptions,
    captionStyle,
    processedVideoUrl,
    savedToLibrary
  }), [projectName, clips, transitionType, transitionDuration, transitionSound, 
      applyNoiseReduction, removeFillerWords, colorGrade, addCaptions, captionStyle, processedVideoUrl, savedToLibrary])

  const loadDraftData = useCallback((data) => {
    if (data.name) setProjectName(data.name)
    if (data.transitionType) setTransitionType(data.transitionType)
    if (data.transitionDuration) setTransitionDuration(data.transitionDuration)
    if (data.transitionSound) setTransitionSound(data.transitionSound)
    if (data.applyNoiseReduction !== undefined) setApplyNoiseReduction(data.applyNoiseReduction)
    if (data.removeFillerWords !== undefined) setRemoveFillerWords(data.removeFillerWords)
    if (data.colorGrade) setColorGrade(data.colorGrade)
    if (data.addCaptions !== undefined) setAddCaptions(data.addCaptions)
    if (data.captionStyle) setCaptionStyle(data.captionStyle)
    if (data.processedVideoUrl) setProcessedVideoUrl(data.processedVideoUrl)
  }, [])

  const handleStartNewProject = useCallback(() => {
    setProjectId(null)
    setProjectName('Untitled Video')
    setClips([])
    setSelectedClipIndex(0)
    setTranscript(null)
    setFillerWords([])
    setSilences([])
    setScenes([])
    setProcessedVideoUrl(null)
    setSavedToLibrary(false)
    setActiveTab('upload')
  }, [])

  // Save to Library function
  const saveToLibrary = async (videoPath) => {
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          title: projectName || 'Edited Video',
          description: `${clips.length} clips merged with ${transitionType} transitions`,
          filePath: videoPath,
          videoUrl: videoPath,
          metadata: {
            clipCount: clips.length,
            transition: transitionType,
            colorGrade,
            features: {
              noiseReduction: applyNoiseReduction,
              fillerRemoval: removeFillerWords,
              captions: addCaptions
            }
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSavedToLibrary(true)
        toast({ 
          title: '✅ Saved to Library!', 
          description: 'Your video has been saved to the Library for 30 days.' 
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Library save error:', error)
      return false
    }
  }

  // Process video files (shared by upload and drag-drop)
  const processVideoFiles = async (files) => {
    const videoFiles = files.filter(f => f.type.startsWith('video/'))
    if (videoFiles.length === 0) {
      toast({ title: 'Invalid Files', description: 'Please upload video files.', variant: 'destructive' })
      return
    }
    
    if (videoFiles.length > 1) {
      setIsMultiClipMode(true)
    }
    
    const limits = FILE_LIMITS[processingMode]
    const newClips = []
    
    for (const file of videoFiles) {
      if (file.size > limits.maxMB * 1024 * 1024) {
        toast({ 
          title: 'File Too Large', 
          description: `${file.name} exceeds ${limits.maxMB}MB limit.`,
          variant: 'destructive'
        })
        continue
      }
      
      const clipId = crypto.randomUUID()
      const url = URL.createObjectURL(file)
      
      newClips.push({
        id: clipId,
        file,
        url,
        name: file.name,
        size: file.size,
        duration: 0,
        analyzed: false
      })
    }
    
    if (newClips.length > 0) {
      setClips(prev => [...prev, ...newClips])
      if (!projectId) {
        setProjectId(crypto.randomUUID())
      }
      setActiveTab('edit')
      toast({ title: `${newClips.length} clip(s) added`, description: 'Ready for editing!' })
    }
  }

  // Handle file input upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    await processVideoFiles(files)
  }

  // Drag and Drop Handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if leaving the dropzone entirely
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      await processVideoFiles(files)
    }
  }

  // Get duration when video loads
  const handleVideoLoaded = (clipId, videoDuration) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, duration: videoDuration } : c
    ))
  }

  // Remove clip
  const removeClip = (clipId) => {
    setClips(prev => {
      const newClips = prev.filter(c => c.id !== clipId)
      if (selectedClipIndex >= newClips.length) {
        setSelectedClipIndex(Math.max(0, newClips.length - 1))
      }
      return newClips
    })
  }

  // Move clip up/down
  const moveClip = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= clips.length) return
    
    setClips(prev => {
      const newClips = [...prev]
      const temp = newClips[index]
      newClips[index] = newClips[newIndex]
      newClips[newIndex] = temp
      return newClips
    })
  }

  // Current clip
  const currentClip = clips[selectedClipIndex]

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
      const dur = videoRef.current.duration
      setDuration(dur)
      if (currentClip) {
        handleVideoLoaded(currentClip.id, dur)
      }
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

  // Analyze all clips with real-time progress
  const analyzeClips = async () => {
    if (clips.length === 0) return
    
    setIsAnalyzing(true)
    const totalClips = clips.length
    let allFillers = []
    let allSilences = []
    let allScenes = []
    let fullTranscript = { segments: [], text: '' }
    
    try {
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const clipNum = i + 1
        
        // Estimate time based on clip duration
        const estimatedSeconds = Math.max(10, Math.ceil((clip.duration || 30) * 0.5))
        
        setAnalysisProgress({
          step: `Uploading clip ${clipNum}/${totalClips}...`,
          progress: (i / totalClips) * 100,
          estimatedTime: estimatedSeconds,
          currentClip: clipNum,
          totalClips
        })
        
        // Upload clip
        const formData = new FormData()
        formData.append('file', clip.file)
        formData.append('fileId', clip.id)
        formData.append('fileName', clip.name)
        formData.append('chunkIndex', '0')
        formData.append('totalChunks', '1')
        formData.append('processingMode', processingMode)
        
        const uploadRes = await fetch('/api/video-editor/upload', {
          method: 'POST',
          body: formData
        })
        
        const uploadResult = await uploadRes.json()
        if (!uploadResult.success) {
          console.error(`Upload failed for clip ${clipNum}:`, uploadResult.error)
          continue
        }
        
        // Transcribe
        setAnalysisProgress({
          step: `Transcribing clip ${clipNum}/${totalClips}...`,
          progress: ((i + 0.3) / totalClips) * 100,
          estimatedTime: Math.ceil(estimatedSeconds * 0.7),
          currentClip: clipNum,
          totalClips
        })
        
        const transcribeRes = await fetch('/api/video-editor/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: clip.id, filePath: uploadResult.filePath })
        })
        
        const transcribeData = await transcribeRes.json()
        if (transcribeData.success) {
          if (transcribeData.transcript?.segments) {
            fullTranscript.segments.push(...transcribeData.transcript.segments)
            fullTranscript.text += ' ' + (transcribeData.transcript.text || '')
          }
          if (transcribeData.analysis?.fillerWords) {
            allFillers.push(...transcribeData.analysis.fillerWords)
          }
          if (transcribeData.analysis?.silences) {
            allSilences.push(...transcribeData.analysis.silences)
          }
        }
        
        // Fast scene detection with timeout
        setAnalysisProgress({
          step: `Detecting scenes in clip ${clipNum}/${totalClips}...`,
          progress: ((i + 0.7) / totalClips) * 100,
          estimatedTime: 5,
          currentClip: clipNum,
          totalClips
        })
        
        // Use fast-analyze endpoint
        const sceneRes = await fetch('/api/video-editor/fast-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: clip.id, filePath: uploadResult.filePath, skipThumbnails: true })
        })
        
        const sceneData = await sceneRes.json()
        if (sceneData.success && sceneData.scenes) {
          allScenes.push(...sceneData.scenes.map(s => ({ ...s, clipId: clip.id })))
        }
        
        // Mark clip as analyzed
        setClips(prev => prev.map(c => 
          c.id === clip.id ? { ...c, analyzed: true, filePath: uploadResult.filePath } : c
        ))
      }
      
      setTranscript(fullTranscript)
      setFillerWords(allFillers)
      setSilences(allSilences)
      setScenes(allScenes)
      
      setAnalysisProgress({
        step: 'Analysis complete!',
        progress: 100,
        estimatedTime: 0,
        currentClip: totalClips,
        totalClips
      })
      
      toast({ title: 'Analysis Complete', description: `Analyzed ${totalClips} clip(s) successfully!` })
      
    } catch (error) {
      console.error('Analysis error:', error)
      toast({ title: 'Analysis Error', description: error.message, variant: 'destructive' })
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1000)
    }
  }

  // Process and merge all clips
  const processClips = async () => {
    if (clips.length === 0) return
    
    setIsProcessing(true)
    
    // Calculate estimated time based on total duration and number of clips
    // Roughly: 5 seconds per clip for processing + 10 seconds per clip for encoding
    const estimatedTotalSeconds = Math.max(30, clips.length * 15 + (totalDuration * 0.5))
    let startTime = Date.now()
    
    // Start progress timer
    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const estimatedProgress = Math.min(95, (elapsed / estimatedTotalSeconds) * 100)
      const remainingTime = Math.max(0, Math.ceil(estimatedTotalSeconds - elapsed))
      
      setProcessingProgress(prev => ({
        ...prev,
        progress: Math.max(prev.progress, estimatedProgress),
        elapsedTime: Math.floor(elapsed),
        estimatedTime: remainingTime
      }))
    }
    
    processingTimerRef.current = setInterval(updateProgress, 500)
    
    try {
      if (clips.length === 1) {
        // Single clip processing
        setProcessingProgress({ 
          step: 'Processing video...', 
          progress: 5,
          estimatedTime: estimatedTotalSeconds,
          elapsedTime: 0
        })
        
        const clip = clips[0]
        const operations = []
        
        if (addCaptions && transcript) {
          operations.push({ type: 'add_captions', transcript, style: { preset: captionStyle } })
        }
        
        if (applyNoiseReduction) {
          operations.push({ type: 'enhance_audio', settings: { normalize: true, noiseReduction: true } })
        }
        
        if (colorGrade !== 'neutral') {
          operations.push({ type: 'color_grade', preset: colorGrade })
        }
        
        const response = await fetch('/api/video-editor/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: clip.id,
            filePath: clip.filePath,
            operations
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          setProcessedVideoUrl(result.outputPath)
          setActiveTab('export')
          
          // Auto-save to Library
          await saveToLibrary(result.outputPath)
        } else {
          throw new Error(result.error)
        }
      } else {
        // Multi-clip merge with transitions
        setProcessingProgress({ 
          step: `Merging ${clips.length} clips with ${transitionType} transitions...`, 
          progress: 5,
          estimatedTime: estimatedTotalSeconds,
          elapsedTime: 0
        })
        
        const clipData = clips.map(c => ({
          filePath: c.filePath || `/video-editor/uploads/${c.id}.mp4`
        }))
        
        const response = await fetch('/api/video-editor/merge-clips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clips: clipData,
            transition: transitionType,
            transitionDuration,
            transitionSound,
            applyNoiseReduction,
            removeFillers: removeFillerWords,
            colorGrade,
            addCaptions,
            outputResolution: '1080p'
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          setProcessedVideoUrl(result.outputPath)
          setActiveTab('export')
          
          // Auto-save to Library
          await saveToLibrary(result.outputPath)
          
          toast({ 
            title: 'Video Created!', 
            description: `Merged ${clips.length} clips with ${transitionType} transitions.` 
          })
        } else {
          throw new Error(result.error)
        }
      }
      
      setProcessingProgress({ step: 'Complete!', progress: 100, estimatedTime: 0, elapsedTime: 0 })
      
    } catch (error) {
      console.error('Processing error:', error)
      toast({ title: 'Processing Failed', description: error.message, variant: 'destructive' })
    } finally {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current)
        processingTimerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  // Export
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
          quality: 'high'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `final-video.${exportFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({ title: 'Download Started!' })
      }
    } catch (error) {
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate total duration
  const totalDuration = clips.reduce((sum, c) => sum + (c.duration || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Video Editor</h1>
                <p className="text-sm text-muted-foreground">
                  Multi-clip editing with auto transitions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                <Layers className="h-4 w-4" />
                <span>{clips.length} clips</span>
                {totalDuration > 0 && (
                  <span className="text-muted-foreground">• {formatTime(totalDuration)}</span>
                )}
              </div>
              
              <Select value={processingMode} onValueChange={setProcessingMode}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (500MB)</SelectItem>
                  <SelectItem value="pro">Pro (2GB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Project Name Input */}
            <div className="mb-4 flex items-center gap-3">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className="text-xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 max-w-md"
              />
              {savedToLibrary && (
                <Badge variant="outline" className="text-green-600 border-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Saved to Library
                </Badge>
              )}
            </div>
            
            {/* Storage Warning - Compact */}
            {showStorageWarning && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 py-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm flex items-center justify-between">
                  <span><strong>Browser Storage:</strong> Don't clear cache • Download final videos</span>
                  <Button variant="ghost" size="sm" className="text-amber-600 h-6 px-2" onClick={() => setShowStorageWarning(false)}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={clips.length === 0} className="flex items-center gap-2">
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
            <Card 
              ref={dropZoneRef}
              className={`border-2 border-dashed transition-all duration-200 ${
                isDragging 
                  ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-purple-500/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className={`p-4 rounded-full mb-4 transition-all duration-200 ${
                    isDragging 
                      ? 'bg-purple-500/30 scale-110' 
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                  }`}>
                    <Upload className={`h-10 w-10 transition-colors ${
                      isDragging ? 'text-purple-600' : 'text-purple-500'
                    }`} />
                  </div>
                  
                  {isDragging ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2 text-purple-600">Drop Your Videos Here!</h3>
                      <p className="text-purple-500 mb-2">Release to add clips</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mb-2">Drag & Drop Your Clips</h3>
                      <p className="text-muted-foreground mb-2 text-center max-w-md">
                        Or click to browse • Multiple clips supported
                      </p>
                    </>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-6">
                    Max: {FILE_LIMITS[processingMode].maxMB}MB per clip • MP4, MOV, WebM
                  </p>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <FolderOpen className="h-4 w-4" />
                        Browse Files
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
            
            {/* Comprehensive Features Grid */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Professional Features
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Multi-Clip Merge */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-center hover:border-purple-500/40 transition-colors">
                  <div className="p-2 bg-purple-500/20 rounded-lg mb-2">
                    <Layers className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium">Multi-Clip Merge</span>
                </div>
                
                {/* Auto Transitions */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 text-center hover:border-pink-500/40 transition-colors">
                  <div className="p-2 bg-pink-500/20 rounded-lg mb-2">
                    <Waves className="h-5 w-5 text-pink-500" />
                  </div>
                  <span className="text-xs font-medium">Auto Transitions</span>
                </div>
                
                {/* Filler Removal */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-center hover:border-orange-500/40 transition-colors">
                  <div className="p-2 bg-orange-500/20 rounded-lg mb-2">
                    <Mic className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium">Filler Removal</span>
                </div>
                
                {/* Noise Reduction */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 text-center hover:border-green-500/40 transition-colors">
                  <div className="p-2 bg-green-500/20 rounded-lg mb-2">
                    <Volume2 className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-xs font-medium">Noise Reduction</span>
                </div>
                
                {/* Auto Captions */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-center hover:border-blue-500/40 transition-colors">
                  <div className="p-2 bg-blue-500/20 rounded-lg mb-2">
                    <Type className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium">Auto Captions</span>
                </div>
                
                {/* Color Grading */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center hover:border-amber-500/40 transition-colors">
                  <div className="p-2 bg-amber-500/20 rounded-lg mb-2">
                    <Palette className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium">Color Grading</span>
                </div>
                
                {/* Scene Detection */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center hover:border-cyan-500/40 transition-colors">
                  <div className="p-2 bg-cyan-500/20 rounded-lg mb-2">
                    <Scissors className="h-5 w-5 text-cyan-500" />
                  </div>
                  <span className="text-xs font-medium">Scene Detection</span>
                </div>
                
                {/* Beat Sync */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 text-center hover:border-violet-500/40 transition-colors">
                  <div className="p-2 bg-violet-500/20 rounded-lg mb-2">
                    <Music className="h-5 w-5 text-violet-500" />
                  </div>
                  <span className="text-xs font-medium">Beat Sync</span>
                </div>
                
                {/* Sound Effects */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 text-center hover:border-rose-500/40 transition-colors">
                  <div className="p-2 bg-rose-500/20 rounded-lg mb-2">
                    <Zap className="h-5 w-5 text-rose-500" />
                  </div>
                  <span className="text-xs font-medium">Whoosh FX</span>
                </div>
                
                {/* Silence Removal */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/20 text-center hover:border-teal-500/40 transition-colors">
                  <div className="p-2 bg-teal-500/20 rounded-lg mb-2">
                    <VolumeX className="h-5 w-5 text-teal-500" />
                  </div>
                  <span className="text-xs font-medium">Silence Removal</span>
                </div>
                
                {/* AI Transcription */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 text-center hover:border-indigo-500/40 transition-colors">
                  <div className="p-2 bg-indigo-500/20 rounded-lg mb-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <span className="text-xs font-medium">AI Transcript</span>
                </div>
                
                {/* Auto Save */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center hover:border-emerald-500/40 transition-colors">
                  <div className="p-2 bg-emerald-500/20 rounded-lg mb-2">
                    <Library className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium">Auto Save</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* EDIT TAB */}
          <TabsContent value="edit">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Preview & Clips List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Video Preview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      {currentClip ? (
                        <video
                          ref={videoRef}
                          src={currentClip.url}
                          className="w-full h-full object-contain"
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No clip selected
                        </div>
                      )}
                    </div>
                    
                    {/* Playback Controls */}
                    <div className="mt-4 space-y-3">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seekTo(parseFloat(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      
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
                        
                        <Button variant="outline" size="icon" onClick={() => {
                          setIsMuted(!isMuted)
                          if (videoRef.current) videoRef.current.muted = !isMuted
                        }}>
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Clips Timeline */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Clips Timeline
                      </CardTitle>
                      <label>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span><Plus className="h-4 w-4 mr-1" /> Add Clips</span>
                        </Button>
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {clips.map((clip, index) => (
                          <div
                            key={clip.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedClipIndex === index ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedClipIndex(index)}
                          >
                            <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveClip(index, 'up') }} disabled={index === 0}>
                                <MoveUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveClip(index, 'down') }} disabled={index === clips.length - 1}>
                                <MoveDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                                <span className="font-medium truncate">{clip.name}</span>
                                {clip.analyzed && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <Check className="h-3 w-3 mr-1" /> Analyzed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Timer className="h-3 w-3" />
                                {clip.duration > 0 ? formatTime(clip.duration) : 'Loading...'}
                                <span>•</span>
                                {Math.round(clip.size / 1024 / 1024)}MB
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeClip(clip.id) }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {clips.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No clips added yet. Upload videos to get started.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              {/* Settings Panel */}
              <div className="space-y-4">
                {/* Analyze Button with Progress */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      size="lg"
                      onClick={analyzeClips}
                      disabled={isAnalyzing || clips.length === 0}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {analysisProgress.step}
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Analyze All Clips
                        </>
                      )}
                    </Button>
                    
                    {isAnalyzing && (
                      <div className="mt-4 space-y-2">
                        <Progress value={analysisProgress.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Clip {analysisProgress.currentClip}/{analysisProgress.totalClips}</span>
                          {analysisProgress.estimatedTime > 0 && (
                            <span>~{analysisProgress.estimatedTime}s remaining</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Analysis Stats */}
                    {transcript && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-muted rounded">
                          <div className="text-lg font-bold text-orange-500">{fillerWords.length}</div>
                          <div className="text-xs text-muted-foreground">Fillers Found</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-lg font-bold text-blue-500">{scenes.length}</div>
                          <div className="text-xs text-muted-foreground">Scenes</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Transition Settings (for multi-clip) */}
                {clips.length > 1 && (
                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Waves className="h-4 w-4 text-purple-500" />
                        Transitions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Transition Type</Label>
                        <Select value={transitionType} onValueChange={setTransitionType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Fade</SelectItem>
                            <SelectItem value="dissolve">Dissolve</SelectItem>
                            <SelectItem value="wipe">Wipe</SelectItem>
                            <SelectItem value="slide">Slide</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Duration: {transitionDuration}s</Label>
                        <input
                          type="range"
                          min={0.2}
                          max={2}
                          step={0.1}
                          value={transitionDuration}
                          onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Sound Effect</Label>
                        <Select value={transitionSound} onValueChange={setTransitionSound}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whoosh">Whoosh</SelectItem>
                            <SelectItem value="swoosh">Swoosh</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Auto Processing Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Auto Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Noise Reduction
                      </Label>
                      <Switch checked={applyNoiseReduction} onCheckedChange={setApplyNoiseReduction} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Remove "um/uh/like"
                      </Label>
                      <Switch checked={removeFillerWords} onCheckedChange={setRemoveFillerWords} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Add Captions
                      </Label>
                      <Switch checked={addCaptions} onCheckedChange={setAddCaptions} />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Color Grade</Label>
                      <Select value={colorGrade} onValueChange={setColorGrade}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cool">Cool</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                          <SelectItem value="vibrant">Vibrant</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Process Button with Progress */}
                <Card className={isProcessing ? 'border-green-500/50' : ''}>
                  <CardContent className="pt-6">
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      size="lg"
                      onClick={processClips}
                      disabled={isProcessing || clips.length === 0 || !clips.some(c => c.analyzed)}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {clips.length > 1 ? `Merge ${clips.length} Clips` : 'Process Video'}
                        </>
                      )}
                    </Button>
                    
                    {/* Progress Display */}
                    {isProcessing && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{processingProgress.step}</span>
                          <span className="font-mono text-green-600">
                            {Math.round(processingProgress.progress)}%
                          </span>
                        </div>
                        
                        <Progress value={processingProgress.progress} className="h-3" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            <span>Elapsed: {Math.floor(processingProgress.elapsedTime / 60)}:{String(processingProgress.elapsedTime % 60).padStart(2, '0')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>~{Math.floor(processingProgress.estimatedTime / 60)}:{String(processingProgress.estimatedTime % 60).padStart(2, '0')} remaining</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {clips.map((clip, i) => (
                            <Badge 
                              key={clip.id} 
                              variant={processingProgress.progress > (i / clips.length) * 80 ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              Clip {i + 1}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* EXPORT TAB */}
          <TabsContent value="export">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {processedVideoUrl && (
                    <video src={processedVideoUrl} controls className="w-full rounded-lg" />
                  )}
                </CardContent>
              </Card>
              
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
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                    size="lg"
                    onClick={exportVideo}
                    disabled={isProcessing}
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
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Always download your final video. Browser storage is temporary.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
          </div>
          
          {/* Right Sidebar - AutoSaveDraftsManager */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <AutoSaveDraftsManager
                toolType="video-editor"
                currentData={getCurrentDraftData()}
                onLoadDraft={loadDraftData}
                onStartNew={handleStartNewProject}
                autoSaveInterval={60000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
