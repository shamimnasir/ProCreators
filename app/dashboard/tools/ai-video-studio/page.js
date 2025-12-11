'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { 
  Loader2, Sparkles, Video, Image as ImageIcon, Upload, Download, 
  Play, Wand2, Monitor, Smartphone, Clock, Zap, Film,
  Type, Music, Mic, ChevronRight, Info
} from 'lucide-react'

// Import configurations
import { AI_VIDEO_USECASES, DURATION_OPTIONS, FORMAT_OPTIONS, getUseCaseById } from '@/config/ai-video-usecases'

export default function AIVideoStudioPage() {
  // Mode: image-to-video or text-to-video
  const [mode, setMode] = useState('image-to-video')
  
  // Use case selection
  const [selectedUseCase, setSelectedUseCase] = useState('make-anything')
  
  // Input state
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Output settings
  const [duration, setDuration] = useState(5)
  const [format, setFormat] = useState('portrait')
  
  // Voice & Audio (for future integration)
  const [voiceOption, setVoiceOption] = useState('none')
  const [textOverlay, setTextOverlay] = useState({ text: '', position: 'bottom', color: 'yellow' })
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  
  // Output
  const [videoResult, setVideoResult] = useState(null)
  
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  // Get current use case config
  const currentUseCase = getUseCaseById(selectedUseCase)
  const currentDuration = DURATION_OPTIONS.find(d => d.value === duration)
  const currentFormat = FORMAT_OPTIONS.find(f => f.value === format)

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image file (JPG, PNG, WebP)',
          variant: 'destructive'
        })
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image must be less than 10MB',
          variant: 'destructive'
        })
        return
      }
      
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      
      toast({
        title: 'Image Uploaded',
        description: 'Ready for video generation'
      })
    }
  }

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Enter a description to enhance',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch('/api/ai-video-studio/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          useCaseId: selectedUseCase,
          platform: format === 'portrait' ? 'instagram' : 'youtube',
          duration,
          format
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEnhancedPrompt(data.enhancedPrompt)
        toast({
          title: 'Prompt Enhanced!',
          description: `Optimized for ${currentUseCase.name}`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Enhancement Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Generate video
  const handleGenerate = async () => {
    // Validation
    if (mode === 'image-to-video' && !imageFile) {
      toast({
        title: 'Image Required',
        description: 'Please upload an image to animate',
        variant: 'destructive'
      })
      return
    }
    
    if (mode === 'text-to-video' && !prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your video',
        variant: 'destructive'
      })
      return
    }
    
    setGenerating(true)
    setProgress(0)
    setProgressMessage('Initializing AI models...')
    setVideoResult(null)
    
    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('mode', mode)
      formData.append('prompt', enhancedPrompt || prompt)
      formData.append('duration', duration)
      formData.append('format', format)
      formData.append('useCaseId', selectedUseCase)
      
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      if (textOverlay.text) {
        formData.append('textOverlay', JSON.stringify(textOverlay))
      }
      
      // Simulate progress for UX
      const segments = currentDuration.segments
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += 100 / (segments * 30) // ~30 updates per segment
        if (currentProgress < 90) {
          setProgress(currentProgress)
          const currentSegment = Math.floor((currentProgress / 100) * segments) + 1
          setProgressMessage(`Generating segment ${currentSegment}/${segments}...`)
        }
      }, 1000)
      
      // Make API call
      const response = await fetch('/api/ai-video-studio/generate', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      
      const data = await response.json()
      
      if (data.success) {
        setProgress(100)
        setProgressMessage('Complete!')
        setVideoResult(data)
        
        toast({
          title: '🎬 Video Generated!',
          description: `${duration}s ${format === 'portrait' ? '9:16' : '16:9'} video ready`
        })
      } else {
        throw new Error(data.error)
      }
      
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  // Download video
  const handleDownload = async () => {
    if (!videoResult?.videoUrl) return
    
    try {
      const response = await fetch(videoResult.videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-video-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Download Started',
        description: 'Your video is downloading...'
      })
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🎬</span>
            AI Video Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate stunning AI videos from images or text prompts
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Powered by AI
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Generation Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={setMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image-to-video" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image to Video
                  </TabsTrigger>
                  <TabsTrigger value="text-to-video" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text to Video
                  </TabsTrigger>
                </TabsList>

                {/* Image to Video */}
                <TabsContent value="image-to-video" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Upload Image to Animate</Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        imagePreview 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      
                      {imagePreview ? (
                        <div className="space-y-3">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-48 mx-auto rounded-lg shadow-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-medium">Drop an image or click to upload</p>
                            <p className="text-sm text-muted-foreground">
                              JPG, PNG, WebP up to 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Motion Description (Optional)</Label>
                    <Textarea
                      placeholder="Describe how you want the image to animate... (e.g., 'gentle zoom with floating particles', 'dramatic camera rotation')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Text to Video */}
                <TabsContent value="text-to-video" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Video Description</Label>
                    <Textarea
                      placeholder="Describe your video in detail... (e.g., 'A majestic eagle soaring through golden clouds at sunset, cinematic slow motion')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim()}
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Enhance with AI
                      </Button>
                    </div>
                  </div>
                  
                  {enhancedPrompt && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <Label className="text-green-700 dark:text-green-300">Enhanced Prompt:</Label>
                      <p className="text-sm mt-1">{enhancedPrompt}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Use Case Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Use Case
              </CardTitle>
              <CardDescription>
                Select a preset optimized for your content type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AI_VIDEO_USECASES.filter(uc => ['make-anything', 'social-media-ads'].includes(uc.id)).map((useCase) => (
                  <div
                    key={useCase.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUseCase === useCase.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50 hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedUseCase(useCase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{useCase.icon}</span>
                      <div>
                        <p className="font-medium">{useCase.name}</p>
                        <p className="text-xs text-muted-foreground">{useCase.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Output Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Film className="h-5 w-5" />
                Output Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </Label>
                <RadioGroup 
                  value={duration.toString()} 
                  onValueChange={(v) => setDuration(parseInt(v))}
                  className="grid grid-cols-3 gap-3"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <div key={opt.value} className="relative">
                      <RadioGroupItem
                        value={opt.value.toString()}
                        id={`duration-${opt.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`duration-${opt.value}`}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                          peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                          hover:border-primary/50
                          ${opt.isPremium ? 'border-amber-300' : 'border-muted'}
                        `}
                      >
                        <span className="font-bold text-lg">{opt.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          {opt.description}
                        </span>
                        {opt.isPremium && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Long Form
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Format
                </Label>
                <RadioGroup 
                  value={format} 
                  onValueChange={setFormat}
                  className="grid grid-cols-2 gap-3"
                >
                  {FORMAT_OPTIONS.map((opt) => (
                    <div key={opt.value}>
                      <RadioGroupItem
                        value={opt.value}
                        id={`format-${opt.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`format-${opt.value}`}
                        className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                          peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                          border-muted hover:border-primary/50
                        "
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <p className="font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Text Overlay (Optional) */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Overlay (Optional)
                </Label>
                <Input
                  placeholder="Add text to your video (e.g., 'SALE 50% OFF')"
                  value={textOverlay.text}
                  onChange={(e) => setTextOverlay({ ...textOverlay, text: e.target.value })}
                />
                {textOverlay.text && (
                  <div className="flex gap-2">
                    <Select 
                      value={textOverlay.position} 
                      onValueChange={(v) => setTextOverlay({ ...textOverlay, position: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={textOverlay.color} 
                      onValueChange={(v) => setTextOverlay({ ...textOverlay, color: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yellow">🟡 Yellow</SelectItem>
                        <SelectItem value="red">🔴 Red</SelectItem>
                        <SelectItem value="green">🟢 Green</SelectItem>
                        <SelectItem value="blue">🔵 Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview & Generate */}
        <div className="space-y-6">
          {/* Generate Button */}
          <Card className={`${currentUseCase.cardBg}`}>
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <span className="text-4xl">{currentUseCase.icon}</span>
                <h3 className="font-bold text-lg">{currentUseCase.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentDuration?.label} • {currentFormat?.label}
                </p>
              </div>
              
              <Button
                className="w-full h-14 text-lg"
                size="lg"
                disabled={generating || (mode === 'image-to-video' && !imageFile) || (mode === 'text-to-video' && !prompt.trim())}
                onClick={handleGenerate}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Video
                  </>
                )}
              </Button>
              
              {generating && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {progressMessage}
                  </p>
                </div>
              )}
              
              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Estimated time: {currentDuration?.segments * 30}s - {currentDuration?.segments * 60}s</span>
                </div>
                {duration === 60 && (
                  <p className="text-amber-600 dark:text-amber-400">
                    ⚡ Long-form videos use advanced chaining technology
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Result */}
          {videoResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Generated Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`relative rounded-lg overflow-hidden bg-black ${
                  format === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
                }`}>
                  <video
                    ref={videoRef}
                    src={videoResult.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVideoResult(null)
                      setProgress(0)
                    }}
                  >
                    New Video
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Duration: {videoResult.duration}s</p>
                  <p>Format: {videoResult.format === 'portrait' ? '9:16 Portrait' : '16:9 Landscape'}</p>
                  <p>Segments: {videoResult.segments}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• <strong>Image-to-Video:</strong> Works best with clear, high-quality images</p>
              <p>• <strong>Text-to-Video:</strong> Be specific about motion, lighting, and style</p>
              <p>• <strong>Social Ads:</strong> Keep text short and impactful</p>
              <p>• <strong>Long Form:</strong> Uses AI chaining for seamless transitions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
