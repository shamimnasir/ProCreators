'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Image as ImageIcon, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

export default function CarouselsToolPage() {
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('english')
  const [platform, setPlatform] = useState('instagram-square')
  const [loading, setLoading] = useState(false)
  const [carouselSlides, setCarouselSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setCarouselSlides([])
    setCurrentSlide(0)
    
    try {
      toast({
        title: "Generating...",
        description: "Creating carousel sequence and slides. This may take 30-60 seconds..."
      })

      const response = await fetch('/api/generate/carousel', {
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
      
      if (data.success && data.slides && Array.isArray(data.slides)) {
        console.log('Received slides:', data.slides.length)
        setCarouselSlides(data.slides)
        setCurrentSlide(0)
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

  const handleDownload = () => {
    if (carouselSlides.length === 0) return
    
    const dataStr = JSON.stringify(carouselSlides, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carousel-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Carousel data downloaded successfully"
    })
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carousel Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create 5-slide carousels with AI-generated images and content
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Describe your carousel topic - AI will create 5 slides</CardDescription>
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
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ImageIcon className="mr-2 h-4 w-4" />
              {loading ? 'Generating 5 Slides...' : 'Generate Carousel (5 Slides)'}
            </Button>
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
            {carouselSlides.length > 0 ? (
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
                    <Button variant="outline" className="flex-1" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
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
    </div>
  )
}
