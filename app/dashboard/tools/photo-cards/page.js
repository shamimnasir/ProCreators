'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Download,
  Upload,
  Globe,
  Wand2,
  Image as ImageIcon,
  Type,
  Layout,
  Palette,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Instagram,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { saveToLibrary } from '@/lib/secure-api'

// Template configurations
const TEMPLATES = {
  'breaking-news': {
    name: 'Breaking News',
    description: 'Urgent news style with red accents',
    headerBg: '#dc2626',
    headerText: '#ffffff',
    overlayBg: '#1a1a1a',
    overlayText: '#ffffff',
    accentColor: '#dc2626',
    style: 'news'
  },
  'quote-card': {
    name: 'Quote Card',
    description: 'Elegant minimal design for quotes',
    headerBg: '#1f2937',
    headerText: '#ffffff',
    overlayBg: '#ffffff',
    overlayText: '#1f2937',
    accentColor: '#6366f1',
    style: 'quote'
  },
  'announcement': {
    name: 'Announcement',
    description: 'Corporate clean announcement style',
    headerBg: '#0f172a',
    headerText: '#ffffff',
    overlayBg: '#f8fafc',
    overlayText: '#0f172a',
    accentColor: '#0ea5e9',
    style: 'corporate'
  },
  'social-vibrant': {
    name: 'Social Vibrant',
    description: 'Colorful social media style',
    headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    headerText: '#ffffff',
    overlayBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    overlayText: '#ffffff',
    accentColor: '#ec4899',
    style: 'social'
  },
  'event-promo': {
    name: 'Event Promo',
    description: 'Dynamic event promotion style',
    headerBg: '#000000',
    headerText: '#fbbf24',
    overlayBg: '#fbbf24',
    overlayText: '#000000',
    accentColor: '#fbbf24',
    style: 'event'
  },
  'minimal-dark': {
    name: 'Minimal Dark',
    description: 'Clean dark professional look',
    headerBg: '#111827',
    headerText: '#f9fafb',
    overlayBg: '#1f2937e6',
    overlayText: '#f9fafb',
    accentColor: '#10b981',
    style: 'minimal'
  }
}

// Size configurations for different social media platforms
const SIZES = {
  'square': {
    name: 'Square',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platforms: ['Instagram', 'Facebook'],
    icon: Square
  },
  'story': {
    name: 'Story',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platforms: ['Instagram Stories', 'TikTok'],
    icon: RectangleVertical
  },
  'landscape': {
    name: 'Landscape',
    width: 1920,
    height: 1080,
    ratio: '16:9',
    platforms: ['Twitter', 'LinkedIn', 'YouTube'],
    icon: RectangleHorizontal
  },
  'portrait': {
    name: 'Portrait',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platforms: ['Pinterest', 'Instagram Feed'],
    icon: RectangleVertical
  }
}

// Language configurations
const LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', rtl: false, font: 'Inter, sans-serif' },
  'es': { name: 'Spanish', nativeName: 'Español', rtl: false, font: 'Inter, sans-serif' },
  'fr': { name: 'French', nativeName: 'Français', rtl: false, font: 'Inter, sans-serif' },
  'de': { name: 'German', nativeName: 'Deutsch', rtl: false, font: 'Inter, sans-serif' },
  'zh': { name: 'Chinese', nativeName: '中文', rtl: false, font: 'Noto Sans SC, sans-serif' },
  'ja': { name: 'Japanese', nativeName: '日本語', rtl: false, font: 'Noto Sans JP, sans-serif' },
  'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true, font: 'Noto Sans Arabic, sans-serif' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false, font: 'Noto Sans Devanagari, sans-serif' },
  'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false, font: 'Inter, sans-serif' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা', rtl: false, font: 'Noto Sans Bengali, sans-serif' }
}

export default function PhotoCardsPage() {
  // Image states
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedLogo, setUploadedLogo] = useState(null)
  
  // Content states
  const [brandName, setBrandName] = useState('Your Brand')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  
  // Configuration states
  const [template, setTemplate] = useState('breaking-news')
  const [size, setSize] = useState('square')
  const [language, setLanguage] = useState('en')
  const [inputMode, setInputMode] = useState('manual') // 'manual' or 'ai'
  
  // Customization states
  const [logoSize, setLogoSize] = useState(50)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  
  // Generation states
  const [generatedCard, setGeneratedCard] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [transactionId, setTransactionId] = useState(null)
  
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const TOOL_ID = 'photo-cards'

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

  // AI Text Generation
  const generateAIText = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for AI generation",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingText(true)
    try {
      const langConfig = LANGUAGES[language]
      const templateConfig = TEMPLATES[template]
      
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a compelling headline and subheadline for a ${templateConfig.style} style photo card about: "${aiTopic}". 
          
Language: ${langConfig.name}
Style: ${templateConfig.name} - ${templateConfig.description}

Respond in exactly this JSON format:
{
  "headline": "Main headline text (max 80 characters)",
  "subheadline": "Supporting text (max 120 characters)"
}

Make it engaging, shareable, and suitable for social media. The tone should match a ${templateConfig.style} style.`,
          type: 'photo-cards'
        })
      })

      const data = await response.json()
      if (data.success) {
        try {
          // Try to parse JSON from the response
          const content = data.content.trim()
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            setHeadline(parsed.headline || '')
            setSubheadline(parsed.subheadline || '')
            toast({
              title: "Text Generated!",
              description: "AI has created headline and subheadline for your card"
            })
          } else {
            // Fallback: use the content as headline
            setHeadline(content.substring(0, 100))
            toast({
              title: "Text Generated!",
              description: "AI text applied to headline"
            })
          }
        } catch (parseError) {
          setHeadline(data.content.substring(0, 100))
          toast({
            title: "Text Generated!",
            description: "AI text applied to headline"
          })
        }
      } else {
        throw new Error(data.error || 'Failed to generate text')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsGeneratingText(false)
    }
  }

  const generateCard = async () => {
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

    setIsGenerating(true)
    const creditResult = await checkAndDeduct(TOOL_ID)
    
    if (!creditResult.success) {
      setIsGenerating(false)
      toast({
        title: "Insufficient Credits",
        description: creditResult.error,
        variant: "destructive"
      })
      return
    }
    
    setTransactionId(creditResult.transactionId)

    const canvas = canvasRef.current
    if (!canvas) {
      if (creditResult.transactionId) {
        await refund(creditResult.transactionId, 'Canvas initialization failed')
      }
      setIsGenerating(false)
      return
    }

    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    const templateConfig = TEMPLATES[template]
    const sizeConfig = SIZES[size]
    const langConfig = LANGUAGES[language]

    img.onload = async () => {
      // Set canvas size based on selected size
      canvas.width = sizeConfig.width
      canvas.height = sizeConfig.height

      // Calculate layout proportions
      const headerHeight = Math.round(canvas.height * 0.08)
      const textBoxHeight = Math.round(canvas.height * 0.22)
      const imageAreaHeight = canvas.height - headerHeight - textBoxHeight

      // Draw background
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply image filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`

      // Calculate image dimensions to cover the image area
      const imageAspect = img.width / img.height
      const areaAspect = canvas.width / imageAreaHeight
      
      let drawWidth, drawHeight, imageX, imageY
      
      if (imageAspect > areaAspect) {
        drawHeight = imageAreaHeight
        drawWidth = drawHeight * imageAspect
        imageX = (canvas.width - drawWidth) / 2
        imageY = headerHeight
      } else {
        drawWidth = canvas.width
        drawHeight = drawWidth / imageAspect
        imageX = 0
        imageY = headerHeight + (imageAreaHeight - drawHeight) / 2
      }

      // Clip to image area and draw
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, headerHeight, canvas.width, imageAreaHeight)
      ctx.clip()
      ctx.drawImage(img, imageX, imageY, drawWidth, drawHeight)
      ctx.restore()

      // Reset filter
      ctx.filter = 'none'

      // Draw header bar
      if (templateConfig.headerBg.includes('gradient')) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = templateConfig.headerBg
      }
      ctx.fillRect(0, 0, canvas.width, headerHeight)

      // Draw logo if exists
      const fontSize = Math.round(canvas.width * 0.033)
      const padding = Math.round(canvas.width * 0.025)
      
      const drawHeaderContent = (actualLogoWidth = 0) => {
        ctx.fillStyle = templateConfig.headerText
        
        if (langConfig.rtl) {
          // RTL layout
          ctx.font = `bold ${fontSize}px ${langConfig.font}`
          ctx.textAlign = 'right'
          ctx.fillText(brandName, canvas.width - padding, headerHeight / 2 + fontSize / 3)
          
          ctx.font = `${Math.round(fontSize * 0.7)}px ${langConfig.font}`
          ctx.textAlign = 'left'
          ctx.fillText(date, padding, headerHeight / 2 + fontSize / 3)
        } else {
          // LTR layout
          let textStartX = padding
          
          if (uploadedLogo && actualLogoWidth > 0) {
            // Logo was drawn, offset text accordingly
            textStartX = padding + actualLogoWidth + 15
          }
          
          ctx.font = `bold ${fontSize}px ${langConfig.font}`
          ctx.textAlign = 'left'
          ctx.fillText(brandName, textStartX, headerHeight / 2 + fontSize / 3)
          
          ctx.font = `${Math.round(fontSize * 0.7)}px ${langConfig.font}`
          ctx.textAlign = 'right'
          ctx.fillText(date, canvas.width - padding, headerHeight / 2 + fontSize / 3)
        }
      }

      if (uploadedLogo) {
        const logoImg = new window.Image()
        logoImg.onload = () => {
          // Calculate logo dimensions preserving aspect ratio
          const maxLogoHeight = headerHeight - 10 // Leave some padding
          const scaledLogoHeight = Math.min(Math.round(logoSize * (canvas.width / 1080)), maxLogoHeight)
          
          // Preserve aspect ratio
          const logoAspect = logoImg.width / logoImg.height
          const scaledLogoWidth = Math.round(scaledLogoHeight * logoAspect)
          
          const logoPadding = Math.round(canvas.width * 0.015)
          const logoY = (headerHeight - scaledLogoHeight) / 2
          
          if (langConfig.rtl) {
            ctx.drawImage(logoImg, canvas.width - logoPadding - scaledLogoWidth, logoY, scaledLogoWidth, scaledLogoHeight)
          } else {
            ctx.drawImage(logoImg, logoPadding, logoY, scaledLogoWidth, scaledLogoHeight)
          }
          
          // Update text start position based on actual logo width
          drawHeaderContent(scaledLogoWidth)
          drawTextOverlay()
        }
        logoImg.src = uploadedLogo
      } else {
        drawHeaderContent(0)
        drawTextOverlay()
      }

      async function drawTextOverlay() {
        const textBoxY = canvas.height - textBoxHeight
        
        // Draw overlay background
        if (templateConfig.overlayBg.includes('gradient')) {
          const gradient = ctx.createLinearGradient(0, textBoxY, canvas.width, canvas.height)
          gradient.addColorStop(0, '#f093fb')
          gradient.addColorStop(1, '#f5576c')
          ctx.fillStyle = gradient
        } else if (templateConfig.overlayBg.includes('e6')) {
          // Semi-transparent
          ctx.fillStyle = templateConfig.overlayBg
        } else {
          const gradient = ctx.createLinearGradient(0, textBoxY, 0, canvas.height)
          gradient.addColorStop(0, templateConfig.overlayBg + 'dd')
          gradient.addColorStop(1, templateConfig.overlayBg)
          ctx.fillStyle = gradient
        }
        ctx.fillRect(0, textBoxY, canvas.width, textBoxHeight)

        // Add accent line for certain templates
        if (['breaking-news', 'announcement', 'event-promo'].includes(template)) {
          ctx.fillStyle = templateConfig.accentColor
          ctx.fillRect(0, textBoxY, canvas.width, 4)
        }

        // Draw headline
        ctx.fillStyle = templateConfig.overlayText
        const headlineFontSize = Math.round(canvas.width * 0.042)
        ctx.font = `bold ${headlineFontSize}px ${langConfig.font}`
        ctx.textAlign = langConfig.rtl ? 'right' : 'center'
        
        // Word wrap for headline
        const maxWidth = canvas.width - (padding * 2)
        const words = headline.split(' ')
        let line = ''
        let y = textBoxY + Math.round(textBoxHeight * 0.35)
        const lineHeight = headlineFontSize * 1.2
        
        const textX = langConfig.rtl ? canvas.width - padding : canvas.width / 2
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), textX, y)
            line = words[i] + ' '
            y += lineHeight
          } else {
            line = testLine
          }
        }
        ctx.fillText(line.trim(), textX, y)

        // Draw subheadline
        if (subheadline) {
          const subFontSize = Math.round(canvas.width * 0.028)
          ctx.font = `${subFontSize}px ${langConfig.font}`
          ctx.globalAlpha = 0.9
          y += lineHeight * 1.2
          ctx.fillText(subheadline, textX, y)
          ctx.globalAlpha = 1
        }

        // Convert canvas to data URL
        const cardDataUrl = canvas.toDataURL('image/png', 0.95)
        setGeneratedCard(cardDataUrl)
        
        // Auto-save to library
        try {
          const saveData = await saveToLibrary({
            content: cardDataUrl,
            type: 'photocard',
            title: `Photo Card: ${headline.substring(0, 50)}`,
            description: headline,
            metadata: {
              brandName,
              headline,
              subheadline,
              date,
              language: langConfig.name,
              template: templateConfig.name,
              size: `${sizeConfig.width}x${sizeConfig.height}`,
              platforms: sizeConfig.platforms.join(', ')
            }
          })
          
          if (saveData.success) {
            if (transactionId) {
              await complete(transactionId)
            }
            toast({
              title: "Success!",
              description: "Photo card generated and saved to library!"
            })
          } else {
            if (transactionId) {
              await complete(transactionId)
            }
            toast({
              title: "Generated",
              description: "Photo card created but couldn't save to library",
              variant: "destructive"
            })
          }
        } catch (saveError) {
          if (transactionId) {
            await complete(transactionId)
          }
          toast({
            title: "Generated",
            description: "Photo card created but couldn't save to library"
          })
        }
        
        setIsGenerating(false)
        setTransactionId(null)
      }
    }

    img.onerror = async () => {
      if (transactionId) {
        await refund(transactionId, 'Image failed to load')
      }
      setIsGenerating(false)
      setTransactionId(null)
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive"
      })
    }

    img.src = uploadedImage
  }

  const handleDownload = () => {
    if (!generatedCard) return
    
    const sizeConfig = SIZES[size]
    const link = document.createElement('a')
    link.href = generatedCard
    link.download = `photocard-${template}-${sizeConfig.ratio.replace(':', 'x')}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Downloaded",
      description: `Photo card downloaded (${sizeConfig.width}x${sizeConfig.height})`
    })
  }

  const resetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
  }

  const selectedTemplate = TEMPLATES[template]
  const selectedSize = SIZES[size]
  const selectedLang = LANGUAGES[language]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Professional Photo Card Creator</h1>
        <p className="text-muted-foreground mt-1">
          Create stunning photo cards for social media with professional templates, AI-powered text, and multi-language support
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-2 space-y-4">
          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Template Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => setTemplate(key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      template === key 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div 
                      className="h-2 rounded mb-2" 
                      style={{ background: tmpl.headerBg.includes('gradient') ? tmpl.headerBg : tmpl.headerBg }}
                    />
                    <p className="font-medium text-sm">{tmpl.name}</p>
                    <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Size Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Output Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SIZES).map(([key, sizeOpt]) => {
                  const IconComponent = sizeOpt.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setSize(key)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        size === key 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{sizeOpt.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{sizeOpt.ratio}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{sizeOpt.platforms.join(', ')}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-muted-foreground">({lang.name})</span>
                        {lang.rtl && <Badge variant="outline" className="text-xs">RTL</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Background Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg border overflow-hidden bg-muted" style={{ aspectRatio: selectedSize.width / selectedSize.height, maxHeight: '300px' }}>
                    <img 
                      src={uploadedImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Change Image
                  </Button>
                  
                  {/* Image Filters */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <Input
                        type="range" min="50" max="150" value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <Input
                        type="range" min="50" max="150" value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <Input
                        type="range" min="0" max="200" value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Blur</span>
                        <span>{blur}px</span>
                      </div>
                      <Input
                        type="range" min="0" max="10" value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors"
                >
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="font-medium">Upload Background Image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Text Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Card Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Mode Tabs */}
              <Tabs value={inputMode} onValueChange={setInputMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Manual Input
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Generate
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label>Topic for AI Generation</Label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="e.g., 'Tech startup announces revolutionary AI product' or 'Motivational quote about success'"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button 
                        onClick={generateAIText}
                        disabled={isGeneratingText || !aiTopic.trim()}
                        className="px-6"
                      >
                        {isGeneratingText ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI will generate headline and subheadline in {selectedLang.name}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your headline and subheadline manually below
                  </p>
                </TabsContent>
              </Tabs>

              {/* Brand & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Brand Logo (Optional)</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => logoInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadedLogo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {uploadedLogo && (
                    <>
                      <div className="px-3 py-2 border rounded-md bg-muted">
                        <img src={uploadedLogo} alt="Logo" className="h-6 w-auto" />
                      </div>
                      <Button
                        onClick={() => setUploadedLogo(null)}
                        variant="ghost"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                {uploadedLogo && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs whitespace-nowrap">Logo Size:</Label>
                    <Input
                      type="range" min="30" max="80" value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10">{logoSize}px</span>
                  </div>
                )}
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label>Headline *</Label>
                <Textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Enter your main headline..."
                  rows={2}
                  dir={selectedLang.rtl ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Subheadline */}
              <div className="space-y-2">
                <Label>Subheadline (Optional)</Label>
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Supporting text..."
                  dir={selectedLang.rtl ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CreditCostBadge toolId="photo-cards" />
                <Button 
                  onClick={generateCard} 
                  disabled={!uploadedImage || !headline.trim() || isGenerating}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Photo Card
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {selectedSize.width} × {selectedSize.height}px • {selectedTemplate.name} • {selectedLang.name}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {generatedCard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Generated Photo Card
            </CardTitle>
            <CardDescription>
              Your card is ready! Download or share on {selectedSize.platforms.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div 
                className="rounded-lg border overflow-hidden bg-muted shadow-lg"
                style={{ 
                  maxWidth: '600px',
                  aspectRatio: selectedSize.width / selectedSize.height
                }}
              >
                <img
                  src={generatedCard}
                  alt="Generated Card"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={handleDownload} size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download PNG
              </Button>
            </div>

            {/* Platform recommendations */}
            <div className="flex justify-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">Perfect for:</p>
              {selectedSize.platforms.map((platform, idx) => (
                <Badge key={idx} variant="outline">{platform}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
