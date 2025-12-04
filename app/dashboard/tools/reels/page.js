'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Loader2, Video, Globe, Upload, Sparkles, Download, Scissors, Wand2, User, Image as ImageIconLucide, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ReelsPage() {
  const [topic, setTopic] = useState('')
  
  // Single image state for main visual
  const [objectImage, setObjectImage] = useState(null)
  const [objectImagePreview, setObjectImagePreview] = useState(null)
  
  const [language, setLanguage] = useState('english')
  const [mode, setMode] = useState('budget')
  const [duration, setDuration] = useState(15)
  const [platform, setPlatform] = useState('instagram') // instagram, tiktok, youtube, facebook
  const [loading, setLoading] = useState(false)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')
  const [videoData, setVideoData] = useState(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  
  const objectFileRef = useRef(null)

  // Video editing states
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 10MB",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setObjectImage(file)
        setObjectImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateScript = async () => {
    if (!topic.trim() && !objectImage) {
      toast({
        title: "Error",
        description: "Please provide at least a topic or upload an image",
        variant: "destructive"
      })
      return
    }

    setScriptLoading(true)
    try {
      const formData = {
        topic: topic.trim(),
        hasObjectImage: !!objectImage,
        objectImageUrl: objectImagePreview,
        language
      }

      const response = await fetch('/api/generate/video/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedScript(data.script)
        toast({
          title: "Success",
          description: data.scriptType || "Viral script generated!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setScriptLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!generatedScript.trim()) {
      toast({
        title: "Error",
        description: "Please generate a script first",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setVideoData(null) // Clear previous video
    setProgress(0)
    
    try {
      // Show progress notification
      toast({
        title: "Generating Video",
        description: "This may take 1-3 minutes depending on the mode selected..."
      })
      
      // Simulate progress bar
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 1000)
      
      const response = await fetch('/api/generate/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: generatedScript,
          mode,
          duration,
          platform,
          language,
          image: objectImagePreview,
          hasObjectImage: !!objectImage
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()
      if (data.success) {
        setVideoData(data)
        
        if (data.videoUrl) {
          // Auto-save to library
          try {
            const saveResponse = await fetch('/api/library/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                videoUrl: data.videoUrl,
                script: generatedScript,
                type: 'video',
                title: `Viral Reel - ${topic.substring(0, 50) || 'Generated Video'}`,
                description: generatedScript.substring(0, 150),
                metadata: {
                  mode,
                  duration,
                  language,
                  provider: data.provider,
                  hasObjectImage: !!objectImage
                }
              })
            })
            
            const saveData = await saveResponse.json()
            
            toast({
              title: "Video Ready & Saved!",
              description: saveData.success ? "Video generated and saved to library!" : "Video generated! (Save to library manually)"
            })
          } catch (saveError) {
            console.error('Auto-save failed:', saveError)
            toast({
              title: "Video Ready!",
              description: "Video generated. Scroll down to preview and save."
            })
          }
        } else {
          toast({
            title: "Processing",
            description: data.message || "Video generation in progress..."
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setProgress(0)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!videoData?.videoUrl) return
    
    try {
      toast({
        title: "Preparing Download",
        description: "Fetching your video..."
      })
      
      // Fetch the video as a blob to trigger proper download
      const response = await fetch(videoData.videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `viral-reel-${platform}-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Started",
        description: "Your video is downloading..."
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Please try again or right-click the video to save.",
        variant: "destructive"
      })
    }
  }

  const handleSaveToLibrary = async () => {
    if (!videoData?.videoUrl) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoData.videoUrl,
          script: generatedScript,
          type: 'video',
          title: `Viral Reel - ${topic.substring(0, 50) || 'Generated Video'}`,
          description: generatedScript.substring(0, 150),
          metadata: {
            mode,
            duration,
            language,
            provider: videoData.provider
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved!",
          description: "Video saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleApplyChanges = async () => {
    if (!videoData?.videoUrl) return
    
    // Check if any changes were made
    const hasChanges = trimStart !== 0 || trimEnd !== 100 || 
                       brightness !== 100 || contrast !== 100 || saturation !== 100
    
    if (!hasChanges) {
      toast({
        title: "No Changes",
        description: "Please adjust the sliders to make changes to your video."
      })
      return
    }
    
    setLoading(true)
    try {
      toast({
        title: "Applying Changes",
        description: "Processing video with your edits... This may take 30-60 seconds."
      })
      
      const response = await fetch('/api/generate/video/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoData.videoUrl,
          trimStart,
          trimEnd,
          brightness,
          contrast,
          saturation,
          platform
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update video with edited version
        setVideoData({
          ...videoData,
          videoUrl: data.videoUrl,
          isEdited: true
        })
        
        toast({
          title: "Changes Applied!",
          description: "Your video has been edited. You can download the edited version now."
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply changes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getModeDetails = (selectedMode) => {
    const modes = {
      pro: {
        name: 'Pro Edit / Quality Mode',
        provider: 'Premium Models',
        quality: 'Highest Quality',
        time: '2-3 minutes',
        description: 'Best quality, cinematic results with advanced controls'
      },
      fast: {
        name: 'Fast Social Mode',
        provider: 'Optimized Models',
        quality: 'High Quality',
        time: '1-2 minutes',
        description: 'Quick generation with great quality for social media'
      },
      budget: {
        name: 'Budget Mode',
        provider: 'Cost-Effective Models',
        quality: 'Good Quality',
        time: '40-100 seconds',
        description: 'Cost-effective, good quality for high volume content'
      }
    }
    return modes[selectedMode]
  }

  const currentMode = getModeDetails(mode)
  
  // Determine script type for display
  const getScriptTypeLabel = () => {
    if (talkingHeadImage && objectImage) return 'Talking Head + Object'
    if (talkingHeadImage) return 'Talking Head Script'
    if (objectImage) return 'Object-Based Script'
    return 'Text-Based Script'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Viral Reels / Shorts Creator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral short-form videos for TikTok, Instagram Reels & YouTube Shorts in English/Bengali
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Input & Script Generation</CardTitle>
            <CardDescription>Provide topic and/or upload images to generate a viral script</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
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

            {/* Topic/Idea Input */}
            <div className="space-y-2">
              <Label>Video Topic or Idea</Label>
              <Textarea
                placeholder="e.g., 'How to make money with AI in 2025' or '5 productivity hacks for entrepreneurs'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
              />
            </div>

            {/* Image Uploads - Three Options */}
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-base font-semibold">Visual Elements (Optional)</Label>
              
              {/* Object/Main Character Image */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIconLucide className="h-4 w-4" />
                  <Label className="text-sm">Main Object/Character Image</Label>
                </div>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => objectFileRef.current?.click()}
                >
                  {objectImagePreview ? (
                    <div className="space-y-2">
                      <img src={objectImagePreview} alt="Object" className="mx-auto max-h-32 rounded-lg" />
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Upload main visual element</p>
                    </div>
                  )}
                </div>
                <input
                  ref={objectFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Info Box */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> Upload an image to use image-to-video generation for better quality videos, or leave empty for text-only video generation.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={handleGenerateScript} 
              disabled={scriptLoading || (!topic.trim() && !objectImage && !talkingHeadImage)} 
              className="w-full"
            >
              {scriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Viral Script
            </Button>

            {generatedScript && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Generated Script</Label>
                  <Badge variant="outline">{getScriptTypeLabel()}</Badge>
                </div>
                <Textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">You can edit the script before generating video</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Video Generation</CardTitle>
            <CardDescription>Choose quality mode and generate your video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      <div>
                        <div className="font-semibold">Pro Edit / Quality Mode</div>
                        <div className="text-xs text-muted-foreground">Premium Models - Highest Quality</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="fast">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <div>
                        <div className="font-semibold">Fast Social Mode</div>
                        <div className="text-xs text-muted-foreground">Optimized Models - Quick & High Quality</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="budget">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-semibold">Budget Mode</div>
                        <div className="text-xs text-muted-foreground">Cost-Effective Models</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{currentMode.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quality:</span>
                      <span className="font-medium">{currentMode.quality}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">{currentMode.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{currentMode.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>Target Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Instagram Reels</div>
                        <div className="text-xs text-muted-foreground">9:16 vertical • Max 90s</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="tiktok">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-medium">TikTok</div>
                        <div className="text-xs text-muted-foreground">9:16 vertical • Max 60s</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-medium">YouTube Shorts</div>
                        <div className="text-xs text-muted-foreground">9:16 vertical • Max 60s</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Facebook Reels</div>
                        <div className="text-xs text-muted-foreground">9:16 vertical • Max 90s</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Video Duration: {duration} seconds</Label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={5}
                max={30}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Recommended: 15-30 seconds for best engagement</p>
            </div>

            <Button 
              onClick={handleGenerateVideo} 
              disabled={loading || !generatedScript} 
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Video className="mr-2 h-4 w-4" />
              Generate Video
            </Button>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generating video...</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  This may take 1-3 minutes depending on video complexity
                </p>
              </div>
            )}

            {videoData && !loading && (
              <Card className={videoData.videoUrl ? "bg-green-500/10 border-green-500/20" : "bg-blue-500/10 border-blue-500/20"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {videoData.videoUrl && <CheckCircle className="h-5 w-5 text-green-500" />}
                    <p className="text-sm font-medium">{videoData.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Job ID: {videoData.jobId}</p>
                  <p className="text-xs text-muted-foreground">Mode: {videoData.provider}</p>
                  {videoData.note && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ℹ️ {videoData.note}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Preview & Editing Section */}
      {videoData?.videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Preview & Edit</CardTitle>
            <CardDescription>Trim, crop, and apply filters to your video</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <video className="w-full rounded-lg" controls style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                }}>
                  <source src={videoData.videoUrl} type="video/mp4" />
                </video>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSaveToLibrary}>
                    <Upload className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    <Label>Trim Video</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Start: {trimStart}%</Label>
                    <Slider
                      value={[trimStart]}
                      onValueChange={(value) => setTrimStart(value[0])}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End: {trimEnd}%</Label>
                    <Slider
                      value={[trimEnd]}
                      onValueChange={(value) => setTrimEnd(value[0])}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    <Label>Filters</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Brightness: {brightness}%</Label>
                    <Slider
                      value={[brightness]}
                      onValueChange={(value) => setBrightness(value[0])}
                      min={50}
                      max={150}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Contrast: {contrast}%</Label>
                    <Slider
                      value={[contrast]}
                      onValueChange={(value) => setContrast(value[0])}
                      min={50}
                      max={150}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Saturation: {saturation}%</Label>
                    <Slider
                      value={[saturation]}
                      onValueChange={(value) => setSaturation(value[0])}
                      min={0}
                      max={200}
                      step={10}
                    />
                  </div>
                </div>

                <Button className="w-full" onClick={handleApplyChanges} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Wand2 className="mr-2 h-4 w-4" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
