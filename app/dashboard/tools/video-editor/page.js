'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Video, Upload, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Scissors, Type, Wand2, Music, Palette, Download, Loader2, Check, X,
  Trash2, RefreshCw, Zap, Clock, FileText, Mic, AlertCircle, Settings,
  ChevronRight, Eye, EyeOff, Sparkles, Film, ImagePlus, Search,
  HardDrive, FolderOpen, Save, FilePlus, Cloud, Info, ShieldAlert
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { videoStorage } from '@/lib/video-storage'

export default function VideoEditorPage() {
  const { toast } = useToast()
  
  // Project & Storage State
  const [projectId, setProjectId] = useState(null)
  const [projects, setProjects] = useState([])
  const [storageInfo, setStorageInfo] = useState({ usedMB: 0, quotaMB: 0, percentUsed: 0 })
  const [showStorageWarning, setShowStorageWarning] = useState(true)
  
  // Video State
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [processingMode, setProcessingMode] = useState('standard') // 'standard' (500MB), 'pro' (2GB)
  
  // Video playback
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  
  // Transcript & Analysis
  const [transcript, setTranscript] = useState(null)
  const [fillerWords, setFillerWords] = useState([])
  const [silences, setSilences] = useState([])
  const [scenes, setScenes] = useState([])
  const [beats, setBeats] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ step: '', progress: 0 })
  
  // Editing Options
  const [removedSegments, setRemovedSegments] = useState([])
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  const [audioEnhancements, setAudioEnhancements] = useState({
    normalize: true,
    noiseReduction: true,
    volume: 1.0
  })
  const [colorGrade, setColorGrade] = useState('neutral')
  
  // PRO MODE
  const [proModeEnabled, setProModeEnabled] = useState(false)
  const [addBroll, setAddBroll] = useState(false)
  const [brollKeywords, setBrollKeywords] = useState('')
  const [brollStyle, setBrollStyle] = useState('intercut')
  const [musicTrack, setMusicTrack] = useState('none')
  const [removeFillers, setRemoveFillers] = useState(false)
  const [removeSilences, setRemoveSilences] = useState(false)
  
  // Processing & Export
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null)
  const [exportFormat, setExportFormat] = useState('mp4')
  const [exportQuality, setExportQuality] = useState('high')
  const [processingStatus, setProcessingStatus] = useState('')
  
  // UI State
  const [activeTab, setActiveTab] = useState('upload')
  const [showCaptions, setShowCaptions] = useState(true)
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  
  // File size limits based on mode
  const FILE_LIMITS = {
    standard: { maxMB: 500, maxMin: 15, label: 'Standard (500MB / 15 min)' },
    pro: { maxMB: 2048, maxMin: 60, label: 'Pro (2GB / 60 min)' }
  }

  // Initialize storage and load projects on mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        await videoStorage.init()
        const savedProjects = await videoStorage.getAllProjects()
        setProjects(savedProjects)
        
        const usage = await videoStorage.getStorageUsage()
        setStorageInfo(usage)
        
        // Cleanup old projects
        await videoStorage.cleanupOldProjects()
      } catch (error) {
        console.error('Storage init error:', error)
      }
    }
    initStorage()
  }, [])

  // Get current project data for saving
  const getCurrentProjectData = useCallback(() => ({
    name: videoFile?.name || 'Untitled Project',
    transcript,
    fillerWords,
    silences,
    scenes,
    beats,
    removedSegments,
    captionStyle,
    audioEnhancements,
    colorGrade,
    proModeEnabled,
    addBroll,
    brollKeywords,
    brollStyle,
    musicTrack,
    removeFillers,
    removeSilences,
    showCaptions,
    hasVideo: !!videoUrl,
    hasProcessedVideo: !!processedVideoUrl
  }), [transcript, fillerWords, silences, scenes, beats, removedSegments, captionStyle, 
      audioEnhancements, colorGrade, proModeEnabled, addBroll, brollKeywords, brollStyle,
      musicTrack, removeFillers, removeSilences, showCaptions, videoFile, videoUrl, processedVideoUrl])

  // Save project to browser storage
  const saveProject = async () => {
    if (!projectId) {
      const newId = crypto.randomUUID()
      setProjectId(newId)
      
      const projectData = {
        id: newId,
        ...getCurrentProjectData()
      }
      
      await videoStorage.saveProject(projectData)
      
      // Save video file if exists
      if (videoFile) {
        await videoStorage.saveVideo(newId, videoFile)
      }
      
      const savedProjects = await videoStorage.getAllProjects()
      setProjects(savedProjects)
      
      toast({ title: 'Project Saved', description: 'Your project has been saved to browser storage.' })
    } else {
      const projectData = {
        id: projectId,
        ...getCurrentProjectData()
      }
      
      await videoStorage.saveProject(projectData)
      
      const savedProjects = await videoStorage.getAllProjects()
      setProjects(savedProjects)
      
      toast({ title: 'Project Updated', description: 'Your changes have been saved.' })
    }
    
    // Update storage info
    const usage = await videoStorage.getStorageUsage()
    setStorageInfo(usage)
  }

  // Load project from browser storage
  const loadProject = async (project) => {
    setProjectId(project.id)
    
    // Load project metadata
    setTranscript(project.transcript || null)
    setFillerWords(project.fillerWords || [])
    setSilences(project.silences || [])
    setScenes(project.scenes || [])
    setBeats(project.beats || [])
    setRemovedSegments(project.removedSegments || [])
    setCaptionStyle(project.captionStyle || 'bold-outline')
    setAudioEnhancements(project.audioEnhancements || { normalize: true, noiseReduction: true, volume: 1.0 })
    setColorGrade(project.colorGrade || 'neutral')
    setProModeEnabled(project.proModeEnabled || false)
    setAddBroll(project.addBroll || false)
    setBrollKeywords(project.brollKeywords || '')
    setBrollStyle(project.brollStyle || 'intercut')
    setMusicTrack(project.musicTrack || 'none')
    setRemoveFillers(project.removeFillers || false)
    setRemoveSilences(project.removeSilences || false)
    setShowCaptions(project.showCaptions !== false)
    
    // Load video from storage
    if (project.hasVideo) {
      const videoResult = await videoStorage.loadVideo(project.id)
      if (videoResult.success) {
        setVideoUrl(videoResult.url)
        setVideoFile({ name: videoResult.name, size: videoResult.size, type: videoResult.type })
        setActiveTab('edit')
      }
    }
    
    // Load processed video if exists
    if (project.hasProcessedVideo) {
      const processedResult = await videoStorage.loadProcessedVideo(project.id)
      if (processedResult.success) {
        setProcessedVideoUrl(processedResult.url)
      }
    }
    
    setShowProjectPanel(false)
    toast({ title: 'Project Loaded', description: `Loaded "${project.name}"` })
  }

  // Delete project
  const deleteProject = async (id, e) => {
    e.stopPropagation()
    
    await videoStorage.deleteProject(id)
    
    if (projectId === id) {
      startNewProject()
    }
    
    const savedProjects = await videoStorage.getAllProjects()
    setProjects(savedProjects)
    
    const usage = await videoStorage.getStorageUsage()
    setStorageInfo(usage)
    
    toast({ title: 'Project Deleted' })
  }

  // Start new project
  const startNewProject = () => {
    setProjectId(null)
    setVideoFile(null)
    setVideoUrl(null)
    setTranscript(null)
    setFillerWords([])
    setSilences([])
    setScenes([])
    setBeats([])
    setRemovedSegments([])
    setProcessedVideoUrl(null)
    setActiveTab('upload')
    toast({ title: 'New Project', description: 'Started a new project.' })
  }

  // Handle file upload - stores in browser
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Invalid File', description: 'Please upload a video file.', variant: 'destructive' })
      return
    }
    
    const limits = FILE_LIMITS[processingMode]
    if (file.size > limits.maxMB * 1024 * 1024) {
      toast({ 
        title: 'File Too Large', 
        description: `Max file size for ${processingMode} mode is ${limits.maxMB}MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`,
        variant: 'destructive'
      })
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Create new project ID
      const newProjectId = crypto.randomUUID()
      setProjectId(newProjectId)
      
      // Create object URL for preview
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setVideoFile(file)
      
      // Simulate progress for UX
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(r => setTimeout(r, 50))
      }
      
      // Save to IndexedDB
      await videoStorage.saveVideo(newProjectId, file, setUploadProgress)
      
      // Save project metadata
      await videoStorage.saveProject({
        id: newProjectId,
        name: file.name,
        hasVideo: true,
        createdAt: new Date().toISOString()
      })
      
      // Update projects list
      const savedProjects = await videoStorage.getAllProjects()
      setProjects(savedProjects)
      
      // Update storage info
      const usage = await videoStorage.getStorageUsage()
      setStorageInfo(usage)
      
      setActiveTab('edit')
      toast({ title: 'Video Loaded', description: 'Your video is ready for editing.' })
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }
  
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
  
  // Extract keywords from transcript
  const extractKeywords = (text) => {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'that', 'this', 'my', 'your', 'me', 'him', 'us', 'them']
    
    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w))
    
    const wordCount = {}
    words.forEach(w => { wordCount[w] = (wordCount[w] || 0) + 1 })
    
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }
  
  // Analyze video - now uploads to server for processing
  const analyzeVideo = async () => {
    if (!videoFile) return
    
    setIsAnalyzing(true)
    setAnalysisProgress({ step: 'Preparing video for analysis...', progress: 0 })
    
    try {
      // Upload video to server temporarily for processing
      setAnalysisProgress({ step: 'Uploading video for transcription...', progress: 10 })
      
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('fileId', projectId)
      formData.append('fileName', videoFile.name)
      formData.append('chunkIndex', '0')
      formData.append('totalChunks', '1')
      formData.append('processingMode', processingMode)
      
      const uploadRes = await fetch('/api/video-editor/upload', {
        method: 'POST',
        body: formData
      })
      
      const uploadResult = await uploadRes.json()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }
      
      setAnalysisProgress({ step: 'Transcribing audio with Whisper AI...', progress: 30 })
      
      const transcribeRes = await fetch('/api/video-editor/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: projectId,
          filePath: uploadResult.filePath
        })
      })
      
      const transcribeData = await transcribeRes.json()
      
      if (transcribeData.success) {
        setTranscript(transcribeData.transcript)
        setFillerWords(transcribeData.analysis?.fillerWords || [])
        setSilences(transcribeData.analysis?.silences || [])
        
        if (transcribeData.transcript?.text) {
          const keywords = extractKeywords(transcribeData.transcript.text)
          setBrollKeywords(keywords.join(', '))
        }
      }
      
      setAnalysisProgress({ step: 'Detecting scene changes...', progress: 60 })
      
      const scenesRes = await fetch('/api/video-editor/detect-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: projectId,
          filePath: uploadResult.filePath
        })
      })
      
      const scenesData = await scenesRes.json()
      
      if (scenesData.success) {
        setScenes(scenesData.scenes || [])
      }
      
      setAnalysisProgress({ step: 'Analyzing audio for beat detection...', progress: 80 })
      
      const audioRes = await fetch('/api/video-editor/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: projectId,
          filePath: uploadResult.filePath,
          detectBeats: true,
          detectSilences: true
        })
      })
      
      const audioData = await audioRes.json()
      
      if (audioData.success) {
        setBeats(audioData.beats || [])
        if (audioData.silences?.length > silences.length) {
          setSilences(audioData.silences)
        }
      }
      
      setAnalysisProgress({ step: 'Analysis complete!', progress: 100 })
      
      // Auto-save project with analysis data
      await saveProject()
      
    } catch (error) {
      console.error('Analysis error:', error)
      toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' })
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1000)
    }
  }
  
  // Process video
  const processVideo = async () => {
    if (!projectId || !videoFile) return
    
    setIsProcessing(true)
    setProcessingStatus('Starting processing...')
    
    try {
      // Ensure video is uploaded to server
      setProcessingStatus('Preparing video...')
      
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('fileId', projectId)
      formData.append('fileName', videoFile.name)
      formData.append('chunkIndex', '0')
      formData.append('totalChunks', '1')
      formData.append('processingMode', processingMode)
      
      const uploadRes = await fetch('/api/video-editor/upload', {
        method: 'POST',
        body: formData
      })
      
      const uploadResult = await uploadRes.json()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }
      
      if (proModeEnabled) {
        setProcessingStatus('Activating Pro Mode transformation...')
        
        const keywords = brollKeywords.split(',').map(k => k.trim()).filter(k => k)
        
        const response = await fetch('/api/video-editor/pro-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: uploadResult.filePath,
            transcript,
            brollKeywords: keywords,
            addBroll: addBroll && keywords.length > 0,
            brollStyle,
            musicTrack,
            captionStyle: showCaptions ? captionStyle : null,
            colorGrade,
            audioEnhance: audioEnhancements.normalize || audioEnhancements.noiseReduction,
            removeFillers,
            removeSilences,
            fillerWords,
            silences,
            beats,
            scenes,
            resolution: '1080p'
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          setProcessedVideoUrl(result.outputPath)
          setActiveTab('export')
          setProcessingStatus('Pro Mode complete!')
          
          // Update project
          await saveProject()
        } else {
          throw new Error(result.error || 'Processing failed')
        }
      } else {
        setProcessingStatus('Applying edits...')
        
        const operations = []
        
        if (removedSegments.length > 0) {
          operations.push({ type: 'remove_segments', segments: removedSegments })
        }
        
        if (showCaptions && transcript) {
          operations.push({ type: 'add_captions', transcript, style: { preset: captionStyle } })
        }
        
        if (audioEnhancements.normalize || audioEnhancements.noiseReduction) {
          operations.push({ type: 'enhance_audio', settings: audioEnhancements })
        }
        
        if (colorGrade !== 'neutral') {
          operations.push({ type: 'color_grade', preset: colorGrade })
        }
        
        const response = await fetch('/api/video-editor/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: projectId,
            filePath: uploadResult.filePath,
            operations
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          setProcessedVideoUrl(result.outputPath)
          setActiveTab('export')
          
          await saveProject()
        } else {
          throw new Error(result.error || 'Processing failed')
        }
      }
      
    } catch (error) {
      console.error('Processing error:', error)
      toast({ title: 'Processing Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
      setProcessingStatus('')
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
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `edited-video.${exportFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({ title: 'Download Started', description: 'Your video is being downloaded.' })
      } else {
        throw new Error(result.error || 'Export failed')
      }
      
    } catch (error) {
      console.error('Export error:', error)
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

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
                  Transform raw footage into professional videos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Storage Info */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>{storageInfo.usedMB}MB / {storageInfo.quotaMB}MB</span>
              </div>
              
              {/* Project Management */}
              <Button variant="outline" size="sm" onClick={() => setShowProjectPanel(!showProjectPanel)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects ({projects.length})
              </Button>
              
              <Button variant="outline" size="sm" onClick={saveProject}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              
              {/* Pro Mode */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <Label className="text-sm font-medium">Pro Mode</Label>
                <Switch checked={proModeEnabled} onCheckedChange={setProModeEnabled} />
              </div>
              
              {/* Processing Mode */}
              <Select value={processingMode} onValueChange={setProcessingMode}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Standard (500MB)
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Pro (2GB)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        {/* Browser Storage Warning */}
        {showStorageWarning && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600">Important: Browser Storage Notice</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <p className="mb-2">
                Your videos are stored locally in your browser for privacy and faster processing. To keep your projects safe:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Do NOT clear browser cache/data</strong> - This will delete all your video projects</li>
                <li><strong>Use the same browser</strong> - Projects are not synced across browsers</li>
                <li><strong>Download final videos</strong> - Always export and save your finished videos</li>
                <li><strong>Projects auto-delete after 30 days</strong> of inactivity</li>
              </ul>
              <Button variant="ghost" size="sm" className="mt-2 text-amber-600" onClick={() => setShowStorageWarning(false)}>
                Got it, don't show again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Projects Panel */}
        {showProjectPanel && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  My Projects
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={startNewProject}>
                    <FilePlus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowProjectPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved projects yet. Upload a video to get started!
                </p>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                        projectId === project.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => loadProject(project)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{project.name}</span>
                          {projectId === project.id && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(project.updatedAt).toLocaleDateString()}
                          {project.transcript && <Badge variant="outline" className="text-xs">Analyzed</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => deleteProject(project.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Storage Usage */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Browser Storage Used</span>
                  <span className="font-medium">{storageInfo.usedMB}MB / {storageInfo.quotaMB}MB</span>
                </div>
                <Progress value={storageInfo.percentUsed} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
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
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
                    <Upload className="h-12 w-12 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Your Raw Video</h3>
                  <p className="text-muted-foreground mb-2 text-center max-w-md">
                    Videos are stored locally in your browser - no server upload needed!
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Max: {FILE_LIMITS[processingMode].maxMB}MB / {FILE_LIMITS[processingMode].maxMin} minutes ({processingMode} mode)
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
                        Saving to browser... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <Type className="h-8 w-8 text-blue-500 mb-3" />
                  <h4 className="font-semibold mb-1">Auto-Captions</h4>
                  <p className="text-sm text-muted-foreground">
                    AI transcription with multiple caption styles
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <Mic className="h-8 w-8 text-green-500 mb-3" />
                  <h4 className="font-semibold mb-1">Smart Cleanup</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove filler words, silences & enhance audio
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                <CardContent className="pt-6">
                  <Film className="h-8 w-8 text-purple-500 mb-3" />
                  <h4 className="font-semibold mb-1">B-Roll Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-insert stock footage at scene changes
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-500/5 to-pink-500/10 border-pink-500/20">
                <CardContent className="pt-6">
                  <Music className="h-8 w-8 text-pink-500 mb-3" />
                  <h4 className="font-semibold mb-1">Background Music</h4>
                  <p className="text-sm text-muted-foreground">
                    Add royalty-free music with auto-fade
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                <CardContent className="pt-6">
                  <Palette className="h-8 w-8 text-orange-500 mb-3" />
                  <h4 className="font-semibold mb-1">Color Grading</h4>
                  <p className="text-sm text-muted-foreground">
                    Cinematic presets: warm, cool, vintage & more
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border-cyan-500/20">
                <CardContent className="pt-6">
                  <HardDrive className="h-8 w-8 text-cyan-500 mb-3" />
                  <h4 className="font-semibold mb-1">Local Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Videos stored in browser - no server uploads
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
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      {videoUrl ? (
                        <video
                          ref={videoRef}
                          src={videoUrl}
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
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={(e) => seekTo(parseFloat(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        
                        <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                          {scenes.map((scene, i) => (
                            <div
                              key={`scene-${i}`}
                              className="absolute top-0 w-0.5 h-full bg-blue-500 opacity-50"
                              style={{ left: `${(scene.start / duration) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      
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
                  </CardContent>
                </Card>
                
                {/* Transcript */}
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
                    
                    {transcript && (
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted rounded">
                          <div className="text-lg font-bold">{fillerWords.length}</div>
                          <div className="text-xs text-muted-foreground">Fillers</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-lg font-bold">{silences.length}</div>
                          <div className="text-xs text-muted-foreground">Silences</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-lg font-bold">{scenes.length}</div>
                          <div className="text-xs text-muted-foreground">Scenes</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* PRO MODE Panel */}
                {proModeEnabled && (
                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Pro Mode Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Film className="h-4 w-4" />
                            Add B-Roll
                          </Label>
                          <Switch checked={addBroll} onCheckedChange={setAddBroll} />
                        </div>
                        {addBroll && (
                          <>
                            <Textarea
                              placeholder="Keywords for stock videos (comma-separated)"
                              value={brollKeywords}
                              onChange={(e) => setBrollKeywords(e.target.value)}
                              className="text-sm"
                              rows={2}
                            />
                            <Select value={brollStyle} onValueChange={setBrollStyle}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="B-Roll Style" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="intercut">Intercut (at scene changes)</SelectItem>
                                <SelectItem value="overlay">Overlay (picture-in-picture)</SelectItem>
                                <SelectItem value="beat-sync">Beat Sync (on music beats)</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Background Music
                        </Label>
                        <Select value={musicTrack} onValueChange={setMusicTrack}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Music</SelectItem>
                            <SelectItem value="upbeat">Upbeat</SelectItem>
                            <SelectItem value="calm">Calm</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                            <SelectItem value="emotional">Emotional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Remove Fillers ({fillerWords.length})</Label>
                          <Switch checked={removeFillers} onCheckedChange={setRemoveFillers} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Remove Silences ({silences.length})</Label>
                          <Switch checked={removeSilences} onCheckedChange={setRemoveSilences} />
                        </div>
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
                          <SelectItem value="bold-outline">Bold Outline</SelectItem>
                          <SelectItem value="neon-glow">Neon Glow</SelectItem>
                          <SelectItem value="yellow-highlight">Yellow Highlight</SelectItem>
                          <SelectItem value="tiktok-style">TikTok Style</SelectItem>
                          <SelectItem value="minimal-clean">Minimal Clean</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  )}
                </Card>
                
                {/* Audio */}
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral (None)</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cool">Cool</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="bw">Black & White</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {/* Process Button */}
                <Button
                  className={`w-full ${proModeEnabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                  size="lg"
                  onClick={processVideo}
                  disabled={isProcessing || !transcript}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processingStatus || 'Processing...'}
                    </>
                  ) : (
                    <>
                      {proModeEnabled ? <Sparkles className="h-4 w-4 mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      {proModeEnabled ? 'Create Pro Video' : 'Apply Changes'}
                    </>
                  )}
                </Button>
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
                    <video
                      src={processedVideoUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Export Settings</CardTitle>
                  <CardDescription>Choose format and quality for your final video</CardDescription>
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
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
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
                  
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Tip:</strong> Always download and save your final video. Browser storage is temporary and can be cleared.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
