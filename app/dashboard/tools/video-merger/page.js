'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Upload, Download, Play, Merge, Video,
  RefreshCw, X, FileVideo, Zap, Plus, GripVertical,
  ArrowUp, ArrowDown, Trash2, Film
} from 'lucide-react'

export default function VideoMergerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Videos state
  const [videos, setVideos] = useState([])
  
  // Output state
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null)
  const [mergedInfo, setMergedInfo] = useState(null)
  
  const fileInputRef = useRef(null)

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // Handle file upload
  const handleFilesUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    const videoFiles = files.filter(f => f.type.startsWith('video/'))
    
    if (videoFiles.length === 0) {
      toast.error('Please upload video files')
      return
    }
    
    // Check total size
    const totalSize = videoFiles.reduce((acc, f) => acc + f.size, 0)
    if (totalSize > 200 * 1024 * 1024) {
      toast.error('Total file size must be under 200MB')
      return
    }
    
    // Process each video
    const newVideos = []
    for (const file of videoFiles) {
      const url = URL.createObjectURL(file)
      
      // Get video duration
      const duration = await new Promise((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          resolve(video.duration)
        }
        video.onerror = () => resolve(0)
        video.src = url
      })
      
      newVideos.push({
        id: Date.now() + Math.random(),
        file,
        url,
        name: file.name,
        size: file.size,
        duration
      })
    }
    
    setVideos(prev => [...prev, ...newVideos])
    setMergedVideoUrl(null)
    toast.success(`Added ${videoFiles.length} video(s)`)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove video
  const removeVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  // Move video up/down
  const moveVideo = (index, direction) => {
    const newVideos = [...videos]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= videos.length) return
    [newVideos[index], newVideos[newIndex]] = [newVideos[newIndex], newVideos[index]]
    setVideos(newVideos)
  }

  // Merge videos
  const handleMerge = async () => {
    if (videos.length < 2) {
      toast.error('Add at least 2 videos to merge')
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('action', 'merge')
      
      // Add videos in order
      videos.forEach(v => {
        formData.append('video', v.file)
      })
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90))
      }, 1000)
      
      const response = await fetch('/api/video-tools', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const data = await response.json()
      
      if (data.success) {
        setMergedVideoUrl(data.videoUrl)
        setMergedInfo(data)
        toast.success(data.message || 'Videos merged!')
      } else {
        toast.error(data.error || 'Merge failed')
      }
    } catch (error) {
      console.error('Merge error:', error)
      toast.error('Failed to merge videos')
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  // Download merged video
  const downloadVideo = () => {
    if (!mergedVideoUrl) return
    const link = document.createElement('a')
    link.href = mergedVideoUrl
    link.download = `merged-video-${Date.now()}.mp4`
    link.click()
    toast.success('Video downloaded!')
  }

  // Calculate totals
  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0)
  const totalSize = videos.reduce((acc, v) => acc + v.size, 0)

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Merge className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Video Merger
                <Badge className="bg-yellow-400 text-yellow-900 text-xs">Pro</Badge>
              </h1>
              <p className="text-white/80 text-sm">Combine multiple clips into one video</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Merge className="h-3 w-3" /> Seamless Merge
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <GripVertical className="h-3 w-3" /> Reorder Clips
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Zap className="h-3 w-3" /> Auto Normalize
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Film className="h-5 w-5" /> Videos to Merge
                </CardTitle>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Videos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFilesUpload}
                className="hidden"
              />

              {/* Empty State */}
              {videos.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-indigo-300 transition-all"
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-lg">Add videos to merge</p>
                  <p className="text-sm text-muted-foreground mt-1">MP4, MOV, AVI, WebM (total max 200MB)</p>
                  <p className="text-xs text-muted-foreground mt-3">Videos will be merged in the order shown</p>
                </div>
              )}

              {/* Video List */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border"
                    >
                      {/* Order number */}
                      <div className="flex flex-col items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => moveVideo(index, -1)}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === videos.length - 1}
                          onClick={() => moveVideo(index, 1)}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Preview thumbnail */}
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <video src={video.url} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(video.duration)} • {formatSize(video.size)}
                        </p>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {videos.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                  <div className="text-sm">
                    <span className="font-medium">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                    <span className="text-muted-foreground"> • {formatTime(totalDuration)} total • {formatSize(totalSize)}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setVideos([])}>
                    Clear All
                  </Button>
                </div>
              )}

              {/* Merge Button */}
              {videos.length >= 2 && (
                <Button
                  onClick={handleMerge}
                  disabled={isLoading}
                  className="w-full h-12 text-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Merging Videos...
                    </>
                  ) : (
                    <>
                      <Merge className="h-5 w-5 mr-2" />
                      Merge {videos.length} Videos
                    </>
                  )}
                </Button>
              )}

              {/* Progress */}
              {isLoading && (
                <div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground mt-2">Processing and merging videos...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Result */}
        <div className="lg:col-span-2 space-y-4">
          {/* Merged Video */}
          {mergedVideoUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4" /> Merged Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video src={mergedVideoUrl} controls className="w-full h-full" />
                </div>
                
                {mergedInfo && (
                  <div className="text-sm text-muted-foreground">
                    Duration: {formatTime(mergedInfo.duration)} • Size: {formatSize(mergedInfo.fileSize)}
                  </div>
                )}
                
                <Button onClick={downloadVideo} className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600">
                  <Download className="h-4 w-4 mr-2" /> Download Merged Video
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                <Zap className="h-4 w-4" /> How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-indigo-700 dark:text-indigo-300">
              <p>• <strong>Add videos</strong> in any order</p>
              <p>• <strong>Reorder</strong> using up/down arrows</p>
              <p>• Videos are <strong>auto-scaled</strong> to 1080p</p>
              <p>• Audio is <strong>normalized</strong> for consistency</p>
              <p>• Max total size: 200MB</p>
            </CardContent>
          </Card>

          {/* Empty Result State */}
          {!mergedVideoUrl && videos.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Merge className="h-12 w-12 mx-auto opacity-50 mb-3" />
                  <p className="font-medium">Ready to merge</p>
                  <p className="text-xs mt-1">Click "Merge Videos" to combine</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
