'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Upload, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PhotoCardsPage() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedLogo, setUploadedLogo] = useState(null)
  const [brandName, setBrandName] = useState('বাংলা সংবাদ')
  const [date, setDate] = useState(new Date().toLocaleDateString('bn-BD'))
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [language, setLanguage] = useState('bengali')
  const [textColor, setTextColor] = useState('#ffffff')
  const [bgColor, setBgColor] = useState('#dc2626')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [generatedCard, setGeneratedCard] = useState(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const { toast } = useToast()

  const handleImageUpload = (e) => {
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
      setUploadedImage(event.target.result)
      toast({
        title: "Success",
        description: "Image uploaded successfully!"
      })
    }
    reader.readAsDataURL(file)
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

  const generateCard = () => {
    if (!uploadedImage) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      })
      return
    }

    if (!headline.trim()) {
      toast({
        title: "Error",
        description: "Please enter a headline",
        variant: "destructive"
      })
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = new window.Image()

    img.onload = () => {
      // Set canvas size (Instagram/Facebook post size)
      canvas.width = 1080
      canvas.height = 1080

      // Draw background
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw top bar with brand and date
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, 80)
      
      // Brand name
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.fillText(brandName, 30, 52)
      
      // Date
      ctx.font = '24px Arial, sans-serif'
      ctx.fillText(date, canvas.width - 250, 52)

      // Calculate image dimensions to fit nicely
      const maxImageHeight = 700
      const imageAspect = img.width / img.height
      let drawWidth = canvas.width - 60
      let drawHeight = drawWidth / imageAspect
      
      if (drawHeight > maxImageHeight) {
        drawHeight = maxImageHeight
        drawWidth = drawHeight * imageAspect
      }

      const imageX = (canvas.width - drawWidth) / 2
      const imageY = 100

      // Draw uploaded image
      ctx.drawImage(img, imageX, imageY, drawWidth, drawHeight)

      // Draw text overlay box at bottom
      const textBoxHeight = 200
      const textBoxY = canvas.height - textBoxHeight
      
      // Gradient or solid background
      const gradient = ctx.createLinearGradient(0, textBoxY, 0, canvas.height)
      gradient.addColorStop(0, bgColor + 'dd')
      gradient.addColorStop(1, bgColor)
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, textBoxY, canvas.width, textBoxHeight)

      // Draw headline
      ctx.fillStyle = textColor
      ctx.font = 'bold 42px Arial, sans-serif'
      ctx.textAlign = 'center'
      
      // Word wrap for headline
      const maxWidth = canvas.width - 60
      const words = headline.split(' ')
      let line = ''
      let y = textBoxY + 60
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y)
          line = words[i] + ' '
          y += 50
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, canvas.width / 2, y)

      // Draw subheadline if exists
      if (subheadline) {
        ctx.font = '28px Arial, sans-serif'
        y += 50
        ctx.fillText(subheadline, canvas.width / 2, y)
      }

      // Convert canvas to data URL
      const cardDataUrl = canvas.toDataURL('image/png', 0.95)
      setGeneratedCard(cardDataUrl)
      
      toast({
        title: "Success",
        description: "Photo card generated successfully!"
      })
    }

    img.src = uploadedImage
  }

  const handleSave = async () => {
    if (!generatedCard) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedCard,
          type: 'photocard',
          title: `Photo Card: ${headline.substring(0, 50)}`,
          description: headline,
          metadata: {
            brandName,
            headline,
            subheadline,
            date,
            language
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
    
    const link = document.createElement('a')
    link.href = generatedCard
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
        <h1 className="text-3xl font-bold tracking-tight">Viral Photo Card Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral Facebook/Instagram news-style photo cards with custom text overlay
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card Editor</CardTitle>
            <CardDescription>Upload image and customize your viral news card</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadedImage ? 'Change Image' : 'Upload Image'}
              </Button>
              {uploadedImage && (
                <div className="rounded-lg border overflow-hidden">
                  <img src={uploadedImage} alt="Preview" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>

            {/* Language */}
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

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand/Channel Name</Label>
              <Input
                id="brand"
                placeholder="e.g., বাংলা সংবাদ or News24"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                placeholder="e.g., ০৪ ডিসেম্বর ২০২৫"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <Label htmlFor="headline">Main Headline</Label>
              <Textarea
                id="headline"
                placeholder="Enter main headline text..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                rows={3}
              />
            </div>

            {/* Subheadline */}
            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline (Optional)</Label>
              <Input
                id="subheadline"
                placeholder="Additional text..."
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor">Overlay Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={generateCard} 
              disabled={!uploadedImage || !headline.trim()}
              className="w-full"
            >
              Generate Card
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {generatedCard ? 'Your viral news card is ready!' : 'Card preview will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedCard ? (
              <>
                <div className="rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={generatedCard}
                    alt="Generated Card"
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
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload an image and fill in the details
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Perfect for viral Facebook & Instagram posts
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
