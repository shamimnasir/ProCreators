'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Download,
  Save,
  Image as ImageIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Palette,
  Plus,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { saveToLibrary } from '@/lib/secure-api'

export default function CarouselsToolPage() {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('english')
  const [platform, setPlatform] = useState('instagram-square')
  const [generationMode, setGenerationMode] = useState('auto') // 'auto' or 'manual'
  const [manualSlides, setManualSlides] = useState([
    { slideNumber: 1, text: '', isTitle: true },
    { slideNumber: 2, text: '' },
    { slideNumber: 3, text: '' },
    { slideNumber: 4, text: '' },
    { slideNumber: 5, text: '' }
  ])
  const [slideCount, setSlideCount] = useState(5)
  const [carouselTitle, setCarouselTitle] = useState('') // Title for the carousel
  const [uploadedLogo, setUploadedLogo] = useState(null)
  const [logoSize, setLogoSize] = useState(80)
  const [logoPosition, setLogoPosition] = useState('top-right')
  const [backgroundStyle, setBackgroundStyle] = useState('gradient') // New state for background style
  const [loading, setLoading] = useState(false)
  const [contentMap, setContentMap] = useState(null)
  const [showContentMap, setShowContentMap] = useState(false)
  const [carouselSlides, setCarouselSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const logoInputRef = useRef(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete, refresh: refreshCredits } = useCredits()
  
  // Calculate credit cost based on slide count (100 credits per slide)
  const estimatedCreditCost = slideCount * 100

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

  // Handle slide count change - always keep title slide as first
  const handleSlideCountChange = (newCount) => {
    const count = parseInt(newCount)
    setSlideCount(count)
    
    const newSlides = []
    // First slide is always title
    newSlides.push({ 
      slideNumber: 1, 
      text: manualSlides[0]?.text || '', 
      isTitle: true 
    })
    
    // Add remaining slides
    for (let i = 2; i <= count; i++) {
      newSlides.push({
        slideNumber: i,
        text: manualSlides[i - 1]?.text || '',
        isTitle: false
      })
    }
    
    setManualSlides(newSlides)
  }

  // Add a new slide
  const addSlide = () => {
    if (manualSlides.length >= 15) {
      toast({
        title: "Maximum slides reached",
        description: "You can have up to 15 slides",
        variant: "destructive"
      })
      return
    }
    setManualSlides([...manualSlides, { 
      slideNumber: manualSlides.length + 1, 
      text: '', 
      isTitle: false 
    }])
    setSlideCount(manualSlides.length + 1)
  }

  // Remove a slide (but not the title slide)
  const removeSlide = (index) => {
    if (index === 0) {
      toast({
        title: "Cannot remove title slide",
        description: "The title slide is required",
        variant: "destructive"
      })
      return
    }
    if (manualSlides.length <= 3) {
      toast({
        title: "Minimum slides required",
        description: "You need at least 3 slides",
        variant: "destructive"
      })
      return
    }
    const newSlides = manualSlides.filter((_, i) => i !== index)
      .map((slide, i) => ({ ...slide, slideNumber: i + 1 }))
    setManualSlides(newSlides)
    setSlideCount(newSlides.length)
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
          slideCount: slideCount, // Use user-selected slide count
          backgroundStyle
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
        generationMode: generationMode,
        backgroundStyle: backgroundStyle
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken') || ''}`
        },
        credentials: 'include',  // Include cookies
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      let data
      try {
        data = await response.json()
        console.log('Response received, parsing JSON...')
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        throw new Error('Failed to parse server response')
      }
      
      console.log('Data parsed:', data?.success, 'slides:', data?.slides?.length)
      
      if (data.success && data.slides && Array.isArray(data.slides)) {
        console.log('Received slides:', data.slides.length, 'images')
        // Hide content map and show carousel slides
        setShowContentMap(false)
        setContentMap(null)
        setCarouselSlides(data.slides)
        setCurrentSlide(0)
        console.log('State updated with', data.slides.length, 'slides')
        
        // Auto-save to library using secure API
        try {
          const saveData = await saveToLibrary({
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
          
          if (saveData.success) {
            console.log('Carousel auto-saved to library')
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({
          title: "Success",
          description: `Generated ${data.slides.length} carousel slides successfully!`
        })
        
        // Refresh credit balance in the header
        if (refreshCredits) {
          refreshCredits()
        }
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
      // Save only metadata (not full base64 images to avoid size limit)
      const slidesMetadata = carouselSlides.map(slide => ({
        slideNumber: slide.slideNumber,
        text: slide.text,
        imagePrompt: slide.imagePrompt
      }))
      
      // Use carousel title if provided, otherwise use prompt
      const saveTitle = carouselTitle || (prompt ? `Carousel: ${prompt.substring(0, 50)}` : 'Untitled Carousel')
      
      const data = await saveToLibrary({
        content: JSON.stringify(slidesMetadata),
        type: 'carousel',
        title: saveTitle,
        description: `${carouselSlides.length} slides - ${prompt ? prompt.substring(0, 100) : 'Custom carousel'}`,
        metadata: {
          carouselTitle,
          prompt,
          language,
          slideCount: carouselSlides.length,
          platform,
          backgroundStyle
        }
      })
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "Carousel saved to library successfully!"
        })
      } else {
        throw new Error(data.error || 'Failed to save to library')
      }
    } catch (error) {
      console.error('Save error:', error)
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
    title: carouselTitle || (prompt ? `Carousel: ${prompt.substring(0, 50)}` : 'Untitled Carousel'),
    carouselTitle,
    prompt,
    language,
    platform,
    generationMode,
    manualSlides,
    carouselSlides,
    uploadedLogo,
    logoSize,
    logoPosition,
    backgroundStyle
  }), [carouselTitle, prompt, language, platform, generationMode, manualSlides, carouselSlides, uploadedLogo, logoSize, logoPosition, backgroundStyle])

  const loadDraftData = useCallback((data) => {
    // Use explicit undefined checks to handle empty strings properly
    setCarouselTitle(data.carouselTitle !== undefined ? data.carouselTitle : '')
    setPrompt(data.prompt !== undefined ? data.prompt : '')
    setLanguage(data.language || 'english')
    setPlatform(data.platform || 'instagram-square')
    setGenerationMode(data.generationMode || 'auto')
    setBackgroundStyle(data.backgroundStyle || 'gradient')
    setManualSlides(data.manualSlides || [
      { slideNumber: 1, text: '', isTitle: true },
      { slideNumber: 2, text: '' },
      { slideNumber: 3, text: '' },
      { slideNumber: 4, text: '' },
      { slideNumber: 5, text: '' }
    ])
    setCarouselSlides(data.carouselSlides || [])
    setUploadedLogo(data.uploadedLogo || null)
    setLogoSize(data.logoSize || 80)
    setLogoPosition(data.logoPosition || 'top-right')
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
          Create viral carousel posts for Instagram, LinkedIn & Facebook in 15+ languages
        </p>
      </div>

      {/* Generated Carousel - Show prominently at TOP when slides exist */}
      {(carouselSlides.length > 0 || showContentMap) && (
        <Card className="border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Generated Carousel
            </CardTitle>
            <CardDescription>
              {carouselSlides.length > 0 
                ? `Slide ${currentSlide + 1} of ${carouselSlides.length} - Your carousel is ready!`
                : showContentMap ? 'Review content map below' : 'Your AI-generated carousel will appear here'}
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
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Review the structure above. When ready, click below to generate images.
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                        💰 {contentMap ? contentMap.length * 100 : slideCount * 100} credits
                      </span>
                    </div>
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
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Image Preview */}
                <div className="space-y-4">
                  <div className="rounded-lg border overflow-hidden bg-black aspect-square relative">
                    <Image
                      src={carouselSlides[currentSlide].imageUrl}
                      alt={`Slide ${currentSlide + 1}`}
                      fill
                      className="object-contain"
                    />
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
                </div>

                {/* Content and Actions */}
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-semibold mb-2">Slide {currentSlide + 1} Content:</h3>
                    <p className="text-sm whitespace-pre-wrap">{carouselSlides[currentSlide].text}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save to Library
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleDownloadCurrentImage}>
                        <Download className="mr-2 h-4 w-4" />
                        Download This
                      </Button>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={handleDownloadAllImages}>
                      <Download className="mr-2 h-4 w-4" />
                      Download All Images ({carouselSlides.length})
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Describe your carousel topic - AI will create 5 slides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Carousel Title */}
            <div className="space-y-2">
              <Label htmlFor="carouselTitle">Carousel Title</Label>
              <Input
                id="carouselTitle"
                placeholder="E.g., '5 Tips for Productivity', 'Morning Routine Guide'..."
                value={carouselTitle}
                onChange={(e) => setCarouselTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give your carousel a memorable name for easy reference
              </p>
            </div>

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
                  <SelectItem value="hindi">Hindi (हिन्दी)</SelectItem>
                  <SelectItem value="spanish">Spanish (Español)</SelectItem>
                  <SelectItem value="french">French (Français)</SelectItem>
                  <SelectItem value="german">German (Deutsch)</SelectItem>
                  <SelectItem value="portuguese">Portuguese (Português)</SelectItem>
                  <SelectItem value="arabic">Arabic (العربية)</SelectItem>
                  <SelectItem value="chinese">Chinese (中文)</SelectItem>
                  <SelectItem value="japanese">Japanese (日本語)</SelectItem>
                  <SelectItem value="korean">Korean (한국어)</SelectItem>
                  <SelectItem value="russian">Russian (Русский)</SelectItem>
                  <SelectItem value="italian">Italian (Italiano)</SelectItem>
                  <SelectItem value="dutch">Dutch (Nederlands)</SelectItem>
                  <SelectItem value="turkish">Turkish (Türkçe)</SelectItem>
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

            {/* Background Style Selector */}
            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Background Style
              </Label>
              <Select value={backgroundStyle} onValueChange={setBackgroundStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {/* Gradient Styles */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🎨 Gradients</div>
                  <SelectItem value="gradient">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500"></div>
                      <span>Vibrant Gradients</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-yellow-400"></div>
                      <span>Warm Sunset</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ocean">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-emerald-400"></div>
                      <span>Ocean Breeze</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="aurora">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 via-purple-500 to-pink-500"></div>
                      <span>Aurora</span>
                    </div>
                  </SelectItem>
                  
                  {/* Solid & Minimal */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">✨ Clean & Minimal</div>
                  <SelectItem value="minimal">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-100 border"></div>
                      <span>Clean White</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-900"></div>
                      <span>Dark Mode</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-600 to-slate-800"></div>
                      <span>Professional Navy</span>
                    </div>
                  </SelectItem>
                  
                  {/* Photo-Based Backgrounds */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">📷 Stock Photo Styles</div>
                  <SelectItem value="office">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-200 to-blue-100"></div>
                      <span>Modern Office</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="coffee">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-800 to-amber-500"></div>
                      <span>Coffee Shop Vibes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="nature">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-teal-500"></div>
                      <span>Nature & Outdoors</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="city">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-700 to-indigo-900"></div>
                      <span>City Skyline</span>
                    </div>
                  </SelectItem>
                  
                  {/* AI Artistic Styles */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">🤖 AI Artistic</div>
                  <SelectItem value="abstract">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-rose-500 via-violet-500 to-cyan-400"></div>
                      <span>Abstract Art</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="geometric">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                      <span>Geometric Patterns</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3d">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-600 to-fuchsia-500"></div>
                      <span>3D Rendered</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="watercolor">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-pink-200 via-blue-200 to-green-200"></div>
                      <span>Watercolor Art</span>
                    </div>
                  </SelectItem>
                  
                  {/* Tech & Industry */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">💼 Industry Themes</div>
                  <SelectItem value="tech">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-600 to-cyan-500"></div>
                      <span>Tech & Digital</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="finance">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-600 to-teal-500"></div>
                      <span>Finance & Growth</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="health">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-cyan-400"></div>
                      <span>Health & Wellness</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="education">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-orange-500"></div>
                      <span>Education & Learning</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a visual style for your carousel backgrounds
              </p>
            </div>

            {generationMode === 'auto' ? (
              <div className="space-y-4">
                {/* Slide Count Selector for Auto Mode */}
                <div className="space-y-2">
                  <Label>Number of Slides</Label>
                  <Select value={slideCount.toString()} onValueChange={(val) => setSlideCount(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 slides (Quick)</SelectItem>
                      <SelectItem value="7">7 slides (Standard)</SelectItem>
                      <SelectItem value="10">10 slides (Detailed)</SelectItem>
                      <SelectItem value="12">12 slides (Comprehensive)</SelectItem>
                      <SelectItem value="15">15 slides (Maximum)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    More slides = more detailed content (will include title + CTA slides)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Carousel Topic</Label>
                  <Textarea
                    id="prompt"
                    placeholder="E.g., '5 tips for productivity', 'How to start a business', 'Benefits of meditation'..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Slide Count Selector */}
                <div className="flex items-center justify-between">
                  <Label>Slide Content</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{manualSlides.length} slides</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSlide}
                      disabled={manualSlides.length >= 15}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slide
                    </Button>
                  </div>
                </div>

                {/* Slides List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {manualSlides.map((slide, index) => (
                    <div key={index} className={`space-y-1 p-3 rounded-lg border ${slide.isTitle ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`slide-${index}`} className={`text-xs font-medium ${slide.isTitle ? 'text-purple-700' : 'text-muted-foreground'}`}>
                          {slide.isTitle ? '🎯 Title Slide (Hook)' : `Slide ${index + 1}`}
                        </Label>
                        {!slide.isTitle && manualSlides.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSlide(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id={`slide-${index}`}
                        placeholder={slide.isTitle 
                          ? "Enter your attention-grabbing title/hook..." 
                          : `Content for slide ${index + 1}...`}
                        value={slide.text}
                        onChange={(e) => updateManualSlide(index, e.target.value)}
                        rows={slide.isTitle ? 2 : 2}
                        className={`resize-none ${slide.isTitle ? 'border-purple-300 focus:border-purple-500' : ''}`}
                      />
                      {slide.isTitle && (
                        <p className="text-[10px] text-purple-600">
                          This is your first impression - make it count!
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  💡 Tip: You can have 3-15 slides. Title slide is always required.
                </p>
              </div>
            )}
            
            {generationMode === 'auto' ? (
              <div className="space-y-3">
                {/* Credit cost display for auto mode */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estimated Cost:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                      💰 {slideCount * 100}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {slideCount} slides × 100 credits
                  </span>
                </div>
                <Button 
                  onClick={handleGenerateContentMap} 
                  disabled={loading || !prompt.trim()}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Creating Content Map...' : 'Step 1: Generate Content Map'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Credit cost display for manual mode */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estimated Cost:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                      💰 {manualSlides.length * 100}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {manualSlides.length} slides × 100 credits
                  </span>
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Generating Images...' : 'Generate Carousel Images'}
                </Button>
              </div>
            )}
            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                This may take 30-60 seconds...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Empty placeholder card - only show when no carousel generated yet */}
        {!carouselSlides.length && !showContentMap && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Carousel</CardTitle>
              <CardDescription>Your AI-generated carousel will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generated carousel slides will appear here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Fill in the form and click generate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
