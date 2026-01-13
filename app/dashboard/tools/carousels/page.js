'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Image as ImageIcon, Globe, ChevronLeft, ChevronRight, Upload, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

export default function CarouselsToolPage() {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('english')
  const [platform, setPlatform] = useState('instagram-square')
  const [generationMode, setGenerationMode] = useState('auto') // 'auto' or 'manual'
  const [manualSlides, setManualSlides] = useState([
    { slideNumber: 1, text: '' },
    { slideNumber: 2, text: '' },
    { slideNumber: 3, text: '' },
    { slideNumber: 4, text: '' },
    { slideNumber: 5, text: '' }
  ])
  const [uploadedLogo, setUploadedLogo] = useState(null)
  const [logoSize, setLogoSize] = useState(80)
  const [logoPosition, setLogoPosition] = useState('top-right')
  const [loading, setLoading] = useState(false)
  const [contentMap, setContentMap] = useState(null)
  const [showContentMap, setShowContentMap] = useState(false)
  const [carouselSlides, setCarouselSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const logoInputRef = useRef(null)
  const { toast } = useToast()

  // Platform size configurations
  const platformSizes = {
    'instagram-square': { width: 1080, height: 1080, name: 'Instagram Square (1:1)' },
    'instagram-portrait': { width: 1080, height: 1350, name: 'Instagram Portrait (4:5)' },
    'instagram-landscape': { width: 1080, height: 566, name: 'Instagram Landscape (1.91:1)' },
    'facebook-post': { width: 1200, height: 630, name: 'Facebook Post (1.91:1)' },
    'facebook-square': { width: 1080, height: 1080, name: 'Facebook Square (1:1)' },
    'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post (1.91:1)' },
    'linkedin-square': { width: 1104, height: 736, name: 'LinkedIn Square (3:2)' },
  }

  const updateManualSlide = (index, text) => {
    const updated = [...manualSlides]
    updated[index] = { ...updated[index], text }
    setManualSlides(updated)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedLogo(event.target.result)
      toast({
        title: "Success",
        description: "Logo uploaded successfully!"
      })
    }
    reader.readAsDataURL(file)
  }

  const handleGenerateContentMap = async () => {
    // Validation
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setContentMap(null)
    setShowContentMap(false)
    
    try {
      toast({
        title: "Creating Content Map...",
        description: "Analyzing your topic and planning carousel structure..."
      })

      // Step 1: Generate content map
      const response = await fetch('/api/generate/carousel/content-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          language,
          slideCount: 5
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.contentMap) {
        setContentMap(data.contentMap)
        setShowContentMap(true)
        toast({
          title: "Content Map Ready!",
          description: "Review your carousel structure below"
        })
      } else {
        throw new Error(data.error || 'Failed to generate content map')
      }
    } catch (error) {
      console.error('Content map error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    // Validation
    if (generationMode === 'auto') {
      if (!prompt.trim()) {
        toast({
          title: "Error",
          description: "Please enter a topic",
          variant: "destructive"
        })
        return
      }
    } else {
      // Manual mode - check if at least one slide has text
      const hasContent = manualSlides.some(slide => slide.text.trim())
      if (!hasContent) {
        toast({
          title: "Error",
          description: "Please enter text for at least one slide",
          variant: "destructive"
        })
        return
      }
    }

    setLoading(true)
    setCarouselSlides([])
    setCurrentSlide(0)
    setShowContentMap(false)
    
    try {
      toast({
        title: "Generating...",
        description: generationMode === 'auto' 
          ? "Creating carousel sequence and slides. This may take 30-60 seconds..."
          : "Generating images for your slides. This may take 30-60 seconds..."
      })

      const selectedSize = platformSizes[platform]
      
      const requestBody = {
        language,
        slideCount: 5,
        width: selectedSize.width,
        height: selectedSize.height,
        platform: platform,
        generationMode: generationMode
      }

      if (generationMode === 'auto') {
        requestBody.prompt = prompt
      } else {
        // Filter out empty slides in manual mode
        requestBody.manualSlides = manualSlides.filter(slide => slide.text.trim())
      }

      // Add logo data if uploaded
      if (uploadedLogo) {
        requestBody.logo = uploadedLogo
        requestBody.logoSize = logoSize
        requestBody.logoPosition = logoPosition
      }
      
      const response = await fetch('/api/generate/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.slides && Array.isArray(data.slides)) {
        console.log('Received slides:', data.slides.length)
        setCarouselSlides(data.slides)
        setCurrentSlide(0)
        
        // Auto-save to library
        try {
          const saveResponse = await fetch('/api/library/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: JSON.stringify(data.slides),
              type: 'carousel',
              title: `Carousel: ${generationMode === 'auto' ? prompt.substring(0, 50) : 'Custom carousel'}`,
              description: `${data.slides.length} slides for ${platform}`,
              metadata: {
                prompt: generationMode === 'auto' ? prompt : undefined,
                slideCount: data.slides.length,
                platform,
                language,
                generationMode,
                hasLogo: !!uploadedLogo
              }
            })
          })
          
          if (saveResponse.ok) {
            console.log('Carousel auto-saved to library')
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({
          title: "Success",
          description: `Generated ${data.slides.length} carousel slides successfully!`
        })
      } else {
        throw new Error(data.error || 'Failed to generate carousel')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
      setCarouselSlides([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (carouselSlides.length === 0) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(carouselSlides),
          type: 'carousel',
          title: `Carousel: ${prompt.substring(0, 50)}`,
          description: `${carouselSlides.length} slides`,
          metadata: {
            prompt,
            language,
            slideCount: carouselSlides.length
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "Carousel saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save carousel",
        variant: "destructive"
      })
    }
  }

  const handleDownloadAllImages = async () => {
    if (carouselSlides.length === 0) return
    
    toast({
      title: "Downloading...",
      description: `Preparing ${carouselSlides.length} images for download...`
    })
    
    // Download each slide image
    for (let i = 0; i < carouselSlides.length; i++) {
      const slide = carouselSlides[i]
      await downloadSingleImage(slide.imageUrl, `carousel-slide-${i + 1}-${Date.now()}.png`)
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    toast({
      title: "Downloaded",
      description: `All ${carouselSlides.length} images downloaded successfully!`
    })
  }

  const handleDownloadCurrentImage = async () => {
    if (carouselSlides.length === 0) return
    
    const currentSlideData = carouselSlides[currentSlide]
    await downloadSingleImage(currentSlideData.imageUrl, `carousel-slide-${currentSlide + 1}-${Date.now()}.png`)
    
    toast({
      title: "Downloaded",
      description: `Slide ${currentSlide + 1} downloaded successfully!`
    })
  }

  const downloadSingleImage = async (imageUrl, filename) => {
    try {
      // If it's a base64 data URL, convert directly
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // If it's a regular URL, fetch and download
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive"
      })
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
  }

  // AutoSave helper functions
  const getCurrentData = useCallback(() => ({
    title: prompt ? `Carousel: ${prompt.substring(0, 50)}` : 'Untitled Carousel',
    prompt,
    language,
    platform,
    generationMode,
    manualSlides,
    carouselSlides,
    uploadedLogo,
    logoSize,
    logoPosition
  }), [prompt, language, platform, generationMode, manualSlides, carouselSlides, uploadedLogo, logoSize, logoPosition])

  const loadDraftData = useCallback((data) => {
    if (data.prompt) setPrompt(data.prompt)
    if (data.language) setLanguage(data.language)
    if (data.platform) setPlatform(data.platform)
    if (data.generationMode) setGenerationMode(data.generationMode)
    if (data.manualSlides) setManualSlides(data.manualSlides)
    if (data.carouselSlides) setCarouselSlides(data.carouselSlides)
    if (data.uploadedLogo) setUploadedLogo(data.uploadedLogo)
    if (data.logoSize) setLogoSize(data.logoSize)
    if (data.logoPosition) setLogoPosition(data.logoPosition)
  }, [])

  const handleStartNew = useCallback(() => {
    setPrompt('')
    setLanguage('english')
    setPlatform('instagram-square')
    setGenerationMode('auto')
    setManualSlides([
      { slideNumber: 1, text: '' },
      { slideNumber: 2, text: '' },
      { slideNumber: 3, text: '' },
      { slideNumber: 4, text: '' },
      { slideNumber: 5, text: '' }
    ])
    setCarouselSlides([])
    setUploadedLogo(null)
    setLogoSize(80)
    setLogoPosition('top-right')
    setCurrentSlide(0)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Viral Carousel Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral carousel posts for Instagram, LinkedIn & Facebook in English/Bengali
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Describe your carousel topic - AI will create 5 slides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              <Select value={generationMode} onValueChange={setGenerationMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-Generate (AI creates content)</SelectItem>
                  <SelectItem value="manual">Manual (You provide text for each slide)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {generationMode === 'auto' 
                  ? 'AI will create text content for all 5 slides based on your topic'
                  : 'You define the exact text for each slide, AI generates images'}
              </p>
            </div>

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

            {/* Logo Upload Section */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Brand Logo (Optional)</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadedLogo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {uploadedLogo && (
                  <Button
                    type="button"
                    onClick={() => setUploadedLogo(null)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              {uploadedLogo && (
                <>
                  <div className="rounded-lg border overflow-hidden bg-white p-2">
                    <img src={uploadedLogo} alt="Logo" className="h-16 w-auto mx-auto" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="logoSize" className="text-sm">Logo Size</Label>
                      <span className="text-xs text-muted-foreground">{logoSize}px</span>
                    </div>
                    <Input
                      id="logoSize"
                      type="range"
                      min="40"
                      max="150"
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Logo Position</Label>
                    <Select value={logoPosition} onValueChange={setLogoPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Platform & Size
              </Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram-square">
                    <div className="flex flex-col">
                      <span>Instagram Square</span>
                      <span className="text-xs text-muted-foreground">1080x1080 (1:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram-portrait">
                    <div className="flex flex-col">
                      <span>Instagram Portrait</span>
                      <span className="text-xs text-muted-foreground">1080x1350 (4:5)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram-landscape">
                    <div className="flex flex-col">
                      <span>Instagram Landscape</span>
                      <span className="text-xs text-muted-foreground">1080x566 (1.91:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook-post">
                    <div className="flex flex-col">
                      <span>Facebook Post</span>
                      <span className="text-xs text-muted-foreground">1200x630 (1.91:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook-square">
                    <div className="flex flex-col">
                      <span>Facebook Square</span>
                      <span className="text-xs text-muted-foreground">1080x1080 (1:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="linkedin-post">
                    <div className="flex flex-col">
                      <span>LinkedIn Post</span>
                      <span className="text-xs text-muted-foreground">1200x627 (1.91:1)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="linkedin-square">
                    <div className="flex flex-col">
                      <span>LinkedIn Square</span>
                      <span className="text-xs text-muted-foreground">1104x736 (3:2)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optimized sizes for each platform
              </p>
            </div>

            {generationMode === 'auto' ? (
              <div className="space-y-2">
                <Label htmlFor="prompt">Carousel Topic</Label>
                <Textarea
                  id="prompt"
                  placeholder="E.g., '5 tips for productivity', 'How to start a business', 'Benefits of meditation'..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Slide Content (Enter text for each slide)</Label>
                {manualSlides.map((slide, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`slide-${index}`} className="text-xs text-muted-foreground">
                      Slide {index + 1}
                    </Label>
                    <Textarea
                      id={`slide-${index}`}
                      placeholder={`Text for slide ${index + 1}...`}
                      value={slide.text}
                      onChange={(e) => updateManualSlide(index, e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Leave slides empty if you want fewer than 5 slides
                </p>
              </div>
            )}
            
            {generationMode === 'auto' ? (
              <Button 
                onClick={handleGenerateContentMap} 
                disabled={loading || !prompt.trim()}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ImageIcon className="mr-2 h-4 w-4" />
                {loading ? 'Creating Content Map...' : 'Step 1: Generate Content Map'}
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ImageIcon className="mr-2 h-4 w-4" />
                {loading ? 'Generating Images...' : 'Generate Carousel Images'}
              </Button>
            )}
            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                This may take 30-60 seconds...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Carousel</CardTitle>
            <CardDescription>
              {carouselSlides.length > 0 
                ? `Slide ${currentSlide + 1} of ${carouselSlides.length}`
                : 'Your AI-generated carousel will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showContentMap && contentMap ? (
              <>
                <div className="rounded-lg border p-6 bg-gradient-to-b from-primary/10 to-transparent">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content Map - Review Your Carousel Structure
                  </h3>
                  <div className="space-y-3">
                    {contentMap.map((slide, index) => (
                      <div key={index} className="flex gap-3 p-3 rounded-lg bg-card border">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{slide.title}</h4>
                          <p className="text-xs text-muted-foreground">{slide.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-4">
                      Review the structure above. When ready, click below to generate images.
                    </p>
                    <Button 
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <ImageIcon className="mr-2 h-5 w-5" />
                      {loading ? 'Generating Images...' : 'Step 2: Generate Images'}
                    </Button>
                  </div>
                </div>
              </>
            ) : carouselSlides.length > 0 ? (
              <>
                <div className="space-y-4">
                  <div className="rounded-lg border overflow-hidden bg-black">
                    <Image
                      src={carouselSlides[currentSlide].imageUrl}
                      alt={`Slide ${currentSlide + 1}`}
                      width={500}
                      height={500}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-semibold mb-2">Slide {currentSlide + 1} Content:</h3>
                    <p className="text-sm whitespace-pre-wrap">{carouselSlides[currentSlide].text}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={prevSlide}
                      disabled={carouselSlides.length <= 1}
                      className="flex-1"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={nextSlide}
                      disabled={carouselSlides.length <= 1}
                      className="flex-1"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2">
                    {carouselSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Library
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleDownloadCurrentImage}>
                      <Download className="mr-2 h-4 w-4" />
                      Download This Image
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleDownloadAllImages}>
                      <Download className="mr-2 h-4 w-4" />
                      Download All ({carouselSlides.length})
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generated carousel slides will appear here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Each carousel will have 5 slides with images and text
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Sidebar - Drafts Manager */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <AutoSaveDraftsManager
              toolType="carousels"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[prompt, language, platform, generationMode, manualSlides, carouselSlides]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
