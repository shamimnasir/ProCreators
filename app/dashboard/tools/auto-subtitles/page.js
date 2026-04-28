'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Upload,
  Download,
  Subtitles,
  Globe,
  Play,
  Pause,
  Edit2,
  Save
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function AutoSubtitlesPage() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [language, setLanguage] = useState('english')
  const [captionStyle, setCaptionStyle] = useState('bold')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [captions, setCaptions] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const captionStyles = [
    { value: 'bold', label: 'Bold White', preview: 'bg-black text-white font-bold text-2xl' },
    { value: 'neon', label: 'Neon Glow', preview: 'text-[#0ff] font-bold text-2xl' },
    { value: 'kinetic', label: 'Kinetic Pop', preview: 'bg-yellow-400 text-black font-black text-2xl' },
    { value: 'blackbar', label: 'Black Bar', preview: 'bg-black/80 text-white font-semibold text-xl' }
  ]

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      toast({
        title: "Video uploaded",
        description: `${file.name} ready for processing`
      })
    } else {
      toast({
        title: "Error",
        description: "Please upload a valid video file",
        variant: "destructive"
      })
    }
  }

  const handleGenerateCaptions = async () => {
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Please upload a video first",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setLoading(true)

    try {
      // Simulating speech-to-text processing
      // In production, integrate with speech-to-text API
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Demo captions
      const demoCaptions = [
        { start: 0, end: 3, text: language === 'bengali' ? 'স্বাগতম আমার ভিডিওতে' : 'Welcome to my video' },
        { start: 3, end: 6, text: language === 'bengali' ? 'আজ আমরা কথা বলব' : 'Today we will talk about' },
        { start: 6, end: 9, text: language === 'bengali' ? 'কৃত্রিম বুদ্ধিমত্তা সম্পর্কে' : 'artificial intelligence' },
        { start: 9, end: 12, text: language === 'bengali' ? 'এবং এটি কীভাবে কাজ করে' : 'and how it works' },
        { start: 12, end: 15, text: language === 'bengali' ? 'শেষ পর্যন্ত দেখুন' : 'Watch till the end' },
      ]

      setCaptions(demoCaptions)
      toast({
        title: "Success",
        description: `Captions generated in ${language === 'bengali' ? 'Bengali' : 'English'}!`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  const handleExport = async () => {
    if (captions.length === 0) {
      toast({
        title: "Error",
        description: "No captions to export",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // In production, this would process video with burned-in captions
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Export started",
        description: "Your video with captions is being processed. This may take a few minutes."
      })

      // Simulate download
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: "Video with captions is ready for download!"
        })
      }, 5000)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCaption = (index, newText) => {
    const updated = [...captions]
    updated[index].text = newText
    setCaptions(updated)
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto Subtitles & Captions</h1>
        <p className="text-muted-foreground mt-1">
          Add professional subtitles to your videos in Bengali or English
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Video Upload & Settings</CardTitle>
            <CardDescription>Upload your video and configure caption settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Video</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {videoFile ? videoFile.name : 'Choose Video File'}
                </Button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Speech Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="bengali">Bengali (বাংলা)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Caption Style */}
            <div className="space-y-2">
              <Label>Caption Style</Label>
              <Select value={captionStyle} onValueChange={setCaptionStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {captionStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 p-4 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
                <span className={captionStyles.find(s => s.value === captionStyle)?.preview}>
                  Sample Text
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex items-center gap-4">
              <CreditCostBadge toolId="auto-subtitles" />
              <Button
                onClick={handleGenerateCaptions}
                disabled={!videoFile || loading}
                className="flex-1"
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Subtitles className="mr-2 h-4 w-4" />
                Generate Captions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Video Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
            <CardDescription>Preview your video with captions</CardDescription>
          </CardHeader>
          <CardContent>
            {videoUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Button
                      size="lg"
                      onClick={togglePlay}
                      className="rounded-full"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                  </div>
                </div>
                
                {captions.length > 0 && (
                  <Button onClick={handleExport} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Download className="mr-2 h-4 w-4" />
                    Export Video with Captions
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload a video to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Caption Editor */}
      {captions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Captions</CardTitle>
            <CardDescription>Click on any caption to edit the text</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {captions.map((caption, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <div className="text-sm text-muted-foreground w-24">
                    {caption.start}s - {caption.end}s
                  </div>
                  {editingIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={caption.text}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => setEditingIndex(null)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 text-sm">{caption.text}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
