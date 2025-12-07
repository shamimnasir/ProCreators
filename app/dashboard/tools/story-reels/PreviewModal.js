'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Play, Pause, Volume2, VolumeX, Edit2, Check, X, 
  Sparkles, Download, Loader2, AlertCircle
} from 'lucide-react'

export default function PreviewModal({ 
  open, 
  onClose, 
  previewData,
  onGenerateFinal,
  availableVoices,
  voicesByVariant,
  languageVariant,
  musicTracks
}) {
  const { toast } = useToast()
  const videoRef = useRef(null)
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  
  // Caption state
  const [captions, setCaptions] = useState(previewData?.captionData || [])
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1)
  const [editingCaptionIndex, setEditingCaptionIndex] = useState(-1)
  const [editingText, setEditingText] = useState('')
  
  // Customization state
  const [captionStyle, setCaptionStyle] = useState('bold-outline')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [selectedMusic, setSelectedMusic] = useState('upbeat')
  const [isRegeneratingVoice, setIsRegeneratingVoice] = useState(false)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)

  // Update captions from preview data
  useEffect(() => {
    if (previewData?.captionData) {
      setCaptions(previewData.captionData)
    }
  }, [previewData])

  // Video time update handler
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      
      // Find active caption
      const activeIndex = captions.findIndex(
        cap => time >= cap.startTime && time < cap.endTime
      )
      setActiveCaptionIndex(activeIndex)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      video.currentTime = 0
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [captions])

  // Playback controls
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !video.muted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value) => {
    const video = videoRef.current
    if (!video) return
    
    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  // Caption editing
  const startEditingCaption = (index) => {
    setEditingCaptionIndex(index)
    setEditingText(captions[index].text)
  }

  const saveCaption = () => {
    const newCaptions = [...captions]
    newCaptions[editingCaptionIndex].text = editingText
    setCaptions(newCaptions)
    setEditingCaptionIndex(-1)
    
    toast({
      title: "Caption Updated",
      description: "Your changes have been saved"
    })
  }

  const cancelEdit = () => {
    setEditingCaptionIndex(-1)
    setEditingText('')
  }

  // Get caption style CSS
  const getCaptionStyleCSS = (style) => {
    const baseStyles = {
      fontSize: '28px',
      fontWeight: 'bold',
      padding: '8px 16px',
      borderRadius: '4px',
      display: 'inline-block',
      maxWidth: '90%',
      lineHeight: '1.4',
      textAlign: 'center',
    }

    switch (style) {
      case 'bold-outline':
        return {
          ...baseStyles,
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8), 2px -2px 4px rgba(0,0,0,0.8), -2px 2px 4px rgba(0,0,0,0.8)',
        }
      case 'karaoke':
        return {
          ...baseStyles,
          color: '#ffff00',
          textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9)',
        }
      case 'neon-glow':
        return {
          ...baseStyles,
          color: '#ff00ff',
          textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, 2px 2px 4px rgba(0,0,0,0.8)',
        }
      case 'yellow-highlight':
        return {
          ...baseStyles,
          color: '#000000',
          backgroundColor: '#ffff00',
          textShadow: 'none',
        }
      case 'zoomed-in':
        return {
          ...baseStyles,
          fontSize: '42px',
          color: '#ffffff',
          textShadow: '3px 3px 6px rgba(0,0,0,0.9), -3px -3px 6px rgba(0,0,0,0.9)',
        }
      case 'gradient-pop':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ffd700 0%, #ff1493 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }
      case 'minimal-clean':
        return {
          ...baseStyles,
          color: '#ffffff',
          fontWeight: '500',
          textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
        }
      case 'tiktok-style':
        return {
          ...baseStyles,
          color: '#ffffff',
          textShadow: '2px 2px 0 #ff0000, -2px -2px 0 #00ffff, 2px 2px 6px rgba(0,0,0,0.8)',
        }
      default:
        return baseStyles
    }
  }

  const handleGenerateFinal = () => {
    setIsGeneratingFinal(true)
    onGenerateFinal({
      captions,
      captionStyle,
      selectedVoice,
      selectedMusic
    })
  }

  if (!previewData) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Preview & Customize Your Video
          </DialogTitle>
          <DialogDescription>
            Make adjustments before generating the final HD video. Changes are applied in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Video Preview - Left Side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-300">Preview Quality: 720p</p>
                <p className="text-blue-600 dark:text-blue-400">Final video will be rendered in full HD quality</p>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={previewData.videoUrl}
                className="w-full h-full"
                preload="auto"
              />
              
              {/* Caption Overlay */}
              {activeCaptionIndex >= 0 && (
                <div 
                  className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10"
                  style={getCaptionStyleCSS(captionStyle)}
                >
                  {captions[activeCaptionIndex].text}
                </div>
              )}

              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button
                    size="lg"
                    onClick={togglePlay}
                    className="rounded-full w-16 h-16"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                  <div 
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${(currentTime / (previewData.duration || 1)) * 100}%` }}
                  />
                </div>
                
                <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                  {Math.floor(currentTime)}s / {Math.floor(previewData.duration || 0)}s
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-32"
                />
              </div>
            </div>

            {/* Caption Editor */}
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Captions
              </h3>
              <div className="space-y-2">
                {captions.map((caption, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border ${
                      activeCaptionIndex === index 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-border'
                    }`}
                  >
                    {editingCaptionIndex === index ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveCaption}>
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{caption.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {caption.startTime.toFixed(1)}s - {caption.endTime.toFixed(1)}s
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingCaption(index)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customization Panel - Right Side */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Customization</h3>
              
              {/* Caption Style */}
              <div className="space-y-2">
                <Label>Caption Style</Label>
                <Select value={captionStyle} onValueChange={setCaptionStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bold-outline">🔷 Bold Outline</SelectItem>
                    <SelectItem value="karaoke">🎤 Karaoke</SelectItem>
                    <SelectItem value="neon-glow">💜 Neon Glow</SelectItem>
                    <SelectItem value="yellow-highlight">⭐ Yellow Highlight</SelectItem>
                    <SelectItem value="zoomed-in">🔍 Zoomed In</SelectItem>
                    <SelectItem value="gradient-pop">🌈 Gradient Pop</SelectItem>
                    <SelectItem value="minimal-clean">⚪ Minimal Clean</SelectItem>
                    <SelectItem value="tiktok-style">🎵 TikTok Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Background Music */}
              <div className="space-y-2">
                <Label>Background Music</Label>
                <Select value={selectedMusic} onValueChange={setSelectedMusic}>
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

              <div className="pt-4 border-t space-y-2">
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Duration: {Math.floor(previewData.duration || 0)}s
                </Badge>
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Resolution: {previewData.resolution} (Preview)
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleGenerateFinal}
                disabled={isGeneratingFinal}
                className="w-full"
                size="lg"
              >
                {isGeneratingFinal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Final Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Final HD Video
                  </>
                )}
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                disabled={isGeneratingFinal}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
