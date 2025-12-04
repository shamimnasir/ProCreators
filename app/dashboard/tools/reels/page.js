'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Loader2, Video, Play, Globe, Upload, Sparkles, Download, Scissors, Crop, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ReelsPage() {
  const [topic, setTopic] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [language, setLanguage] = useState('english')
  const [mode, setMode] = useState('budget')
  const [duration, setDuration] = useState(15)
  const [loading, setLoading] = useState(false)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')
  const [videoData, setVideoData] = useState(null)
  const { toast } = useToast()
  const fileInputRef = useRef(null)

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

      setUploadedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateScript = async () => {
    if (!topic.trim() && !uploadedImage) {
      toast({
        title: "Error",
        description: "Please enter a topic or upload an image",
        variant: "destructive"
      })
      return
    }

    setScriptLoading(true)
    try {
      const formData = {
        topic: topic.trim(),
        imageDescription: uploadedImage ? `Image uploaded for reel generation` : null,
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
          description: "Viral script generated! Review and generate video."
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
    try {
      const response = await fetch('/api/generate/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: generatedScript,
          mode,
          duration,
          language
        })
      })

      const data = await response.json()
      if (data.success) {
        setVideoData(data)
        toast({
          title: "Video Generation Started",
          description: data.message
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
      setLoading(false)
    }
  }

  const getModeDetails = (selectedMode) => {
    const modes = {
      pro: {
        name: 'Pro Edit / Quality Mode',
        provider: 'Runway Gen-3',
        quality: 'Highest Quality',
        time: '2-3 minutes',
        description: 'Best quality, cinematic results with advanced controls'
      },
      fast: {
        name: 'Fast Social Mode',
        provider: 'Pika Labs',
        quality: 'High Quality',
        time: '1-2 minutes',
        description: 'Quick generation with great quality for social media'
      },
      budget: {
        name: 'Budget Mode',
        provider: 'Stability AI (SVD)',
        quality: 'Good Quality',
        time: '40-100 seconds',
        description: 'Cost-effective, good quality for high volume content'
      }
    }
    return modes[selectedMode]
  }

  const currentMode = getModeDetails(mode)

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
            <CardDescription>Provide a topic or upload an image to generate a viral script</CardDescription>
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

            <Tabs defaultValue="topic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topic">Topic/Idea</TabsTrigger>
                <TabsTrigger value="image">Upload Image</TabsTrigger>
              </TabsList>
              
              <TabsContent value="topic" className="space-y-2 mt-4">
                <Label>Video Topic or Idea</Label>
                <Textarea
                  placeholder="e.g., 'How to make money with AI in 2025' or '5 productivity hacks for entrepreneurs'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                />
              </TabsContent>
              
              <TabsContent value="image" className="space-y-2 mt-4">
                <Label>Upload Image (Object or Person)</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                      <p className="text-sm text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload image (max 10MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleGenerateScript} 
              disabled={scriptLoading || (!topic.trim() && !uploadedImage)} 
              className="w-full"
            >
              {scriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Viral Script
            </Button>

            {generatedScript && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Generated Script</Label>
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
                        <div className="text-xs text-muted-foreground">Runway Gen-3 - Highest Quality</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="fast">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <div>
                        <div className="font-semibold">Fast Social Mode</div>
                        <div className="text-xs text-muted-foreground">Pika Labs - Quick & High Quality</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="budget">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <div>
                        <div className="font-semibold">Budget Mode</div>
                        <div className="text-xs text-muted-foreground">Stability AI - Cost Effective</div>
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

            {videoData && (
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">{videoData.message}</p>
                  <p className="text-xs text-muted-foreground">Job ID: {videoData.jobId}</p>
                  <p className="text-xs text-muted-foreground">Estimated: {videoData.estimatedTime}</p>
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
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1">
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

                <Button className="w-full">
                  <Crop className="mr-2 h-4 w-4" />
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
