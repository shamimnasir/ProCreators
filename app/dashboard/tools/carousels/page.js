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
  const [loading, setLoading] = useState(false)
  const [carouselSlides, setCarouselSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // For image generation, language mainly affects any text in the image
      const languageText = language === 'bengali' ? 'with Bengali text if any text is included' : 'with English text if any text is included'
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${prompt}. ${languageText}`,
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedImages([data.imageUrl])
        toast({
          title: "Success",
          description: `Image generated successfully!`
        })
      } else {
        throw new Error(data.error || 'Failed to generate')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carousel Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create stunning carousel images with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Describe the image you want to create</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Text Language (if applicable)
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
              <Label htmlFor="prompt">Image Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the carousel image you want to generate..."
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
              Generate Image
            </Button>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>Your AI-generated carousel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedImages.length > 0 ? (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Image
                    src={generatedImages[0]}
                    alt="Generated carousel"
                    width={500}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generated image will appear here
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
