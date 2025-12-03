'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Image as ImageIcon, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

export default function PhotoCardsPage() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('english')
  const [style, setStyle] = useState('modern')
  const [loading, setLoading] = useState(false)
  const [generatedCard, setGeneratedCard] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text for the card",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setGeneratedCard(null)
    
    try {
      toast({
        title: "Generating...",
        description: "Creating your photo card with text overlay..."
      })

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Create a ${style} photo card with the text: "${text}". Language: ${language}. Make it visually appealing and shareable on social media.`,
          language,
          style
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        setGeneratedCard({
          imageUrl: data.imageUrl,
          text: text
        })
        toast({
          title: "Success",
          description: "Photo card generated successfully!"
        })
      } else {
        throw new Error(data.error || 'Failed to generate photo card')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedCard) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(generatedCard),
          type: 'photocard',
          title: `Photo Card: ${text.substring(0, 50)}`,
          description: text.substring(0, 100),
          metadata: {
            text,
            language,
            style
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "Photo card saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save photo card",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!generatedCard) return
    
    // Download the image
    const link = document.createElement('a')
    link.href = generatedCard.imageUrl
    link.download = `photocard-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Downloaded",
      description: "Photo card downloaded successfully"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Photo Card Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create beautiful photo cards with text overlays using AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your photo card parameters</CardDescription>
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
              <Label>Card Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Card Text</Label>
              <Textarea
                id="text"
                placeholder="Enter the text for your photo card (e.g., 'Stay Positive', 'Dream Big', a quote)..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ImageIcon className="mr-2 h-4 w-4" />
              {loading ? 'Generating Card...' : 'Generate Photo Card'}
            </Button>
            {loading && (
              <p className="text-xs text-muted-foreground text-center">
                This may take 15-30 seconds...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Card</CardTitle>
            <CardDescription>
              {generatedCard ? 'Your AI-generated photo card' : 'Your photo card will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedCard ? (
              <>
                <div className="rounded-lg border overflow-hidden bg-black">
                  <Image
                    src={generatedCard.imageUrl}
                    alt="Generated Photo Card"
                    width={500}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generated photo card will appear here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Perfect for social media sharing
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
