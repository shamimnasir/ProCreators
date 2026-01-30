'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Wand2, Upload, Download, ImageIcon, Type, Sparkles, RefreshCw,
  Camera, Zap, Target, Eye, Palette, Layout, X, Check, Copy,
  Youtube, Instagram, Facebook, Twitter, Linkedin, MonitorPlay
} from 'lucide-react'

// Platform configurations with CTR-optimized settings
const PLATFORMS = [
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: '📺',
    aspectRatio: '16:9',
    resolution: '1280x720',
    description: 'YouTube videos & Shorts',
    tips: 'Use surprised face, 3 words max, avoid bottom-right'
  },
  { 
    id: 'instagram-post', 
    name: 'Instagram', 
    icon: '📸',
    aspectRatio: '1:1',
    resolution: '1080x1080',
    description: 'Instagram feed posts',
    tips: 'Clean composition, vibrant colors'
  },
  { 
    id: 'instagram-story', 
    name: 'Stories/Reels', 
    icon: '📱',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: 'Stories, Reels, TikTok',
    tips: 'Vertical focus, text in safe zones'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: '👤',
    aspectRatio: '16:9',
    resolution: '1200x628',
    description: 'Facebook posts & ads',
    tips: 'Engaging imagery, minimal text'
  },
  { 
    id: 'twitter', 
    name: 'X/Twitter', 
    icon: '🐦',
    aspectRatio: '16:9',
    resolution: '1600x900',
    description: 'Twitter/X posts',
    tips: 'Bold visuals, high contrast'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: '💼',
    aspectRatio: '1.91:1',
    resolution: '1200x627',
    description: 'LinkedIn posts',
    tips: 'Professional look, clear message'
  },
]

// High-CTR Style presets
const THUMBNAIL_STYLES = [
  { 
    id: 'high-ctr', 
    name: 'High CTR', 
    icon: '🎯',
    description: 'Optimized for maximum clicks',
    colors: 'High contrast, vibrant',
    promptModifier: 'dramatic lighting, high contrast colors, attention-grabbing composition'
  },
  { 
    id: 'drama', 
    name: 'Drama', 
    icon: '🔥',
    description: 'Red/Orange dramatic style',
    colors: 'Red, Orange, High contrast',
    promptModifier: 'dramatic red and orange gradient background, intense lighting, cinematic'
  },
  { 
    id: 'news', 
    name: 'News/Info', 
    icon: '📰',
    description: 'Professional news style',
    colors: 'Blue, White, Clean',
    promptModifier: 'professional blue and white color scheme, clean layout, news broadcast style'
  },
  { 
    id: 'educational', 
    name: 'Educational', 
    icon: '📚',
    description: 'Clean learning style',
    colors: 'Light, Minimal, Clear',
    promptModifier: 'clean minimalist design, educational look, clear visual hierarchy'
  },
  { 
    id: 'gaming', 
    name: 'Gaming', 
    icon: '🎮',
    description: 'Bold gaming aesthetic',
    colors: 'Neon, Dark, Electric',
    promptModifier: 'neon colors, dark background, gaming aesthetic, electric blue and purple'
  },
  { 
    id: 'lifestyle', 
    name: 'Lifestyle', 
    icon: '✨',
    description: 'Warm aesthetic style',
    colors: 'Warm, Golden, Soft',
    promptModifier: 'warm golden tones, lifestyle aesthetic, soft lighting, Instagram-worthy'
  },
]

// Niche-specific CTR tips
const NICHE_TIPS = {
  gaming: ['Show gameplay moment', 'Use neon colors', 'Add reaction face'],
  finance: ['Use graphs/charts', 'Green = gains', 'Professional headshot'],
  education: ['Before/After', 'Step numbers', 'Clean background'],
  vlog: ['Authentic expression', 'Location hint', 'Personal connection'],
  tech: ['Product close-up', 'Futuristic feel', 'Clean minimal'],
}

// Language detection for non-Latin scripts
const detectLanguage = (text) => {
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliRegex = /[\u0980-\u09FF]/
  // Hindi/Devanagari Unicode range: \u0900-\u097F
  const hindiRegex = /[\u0900-\u097F]/
  // Arabic Unicode range: \u0600-\u06FF
  const arabicRegex = /[\u0600-\u06FF]/
  // Chinese Unicode range
  const chineseRegex = /[\u4e00-\u9fff]/
  // Japanese Unicode ranges (Hiragana, Katakana)
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/
  // Korean Unicode range
  const koreanRegex = /[\uac00-\ud7af\u1100-\u11ff]/
  // Thai Unicode range
  const thaiRegex = /[\u0e00-\u0e7f]/
  
  const detectedLanguages = []
  
  if (bengaliRegex.test(text)) detectedLanguages.push('Bengali')
  if (hindiRegex.test(text)) detectedLanguages.push('Hindi')
  if (arabicRegex.test(text)) detectedLanguages.push('Arabic')
  if (chineseRegex.test(text)) detectedLanguages.push('Chinese')
  if (japaneseRegex.test(text)) detectedLanguages.push('Japanese')
  if (koreanRegex.test(text)) detectedLanguages.push('Korean')
  if (thaiRegex.test(text)) detectedLanguages.push('Thai')
  
  return {
    hasNonLatin: detectedLanguages.length > 0,
    languages: detectedLanguages,
    primaryLanguage: detectedLanguages[0] || 'English'
  }
}

// Language-specific text rendering instructions
const getLanguageTextInstructions = (langInfo, text) => {
  if (!langInfo.hasNonLatin) return ''
  
  const langInstructions = {
    Bengali: `
TEXT RENDERING CRITICAL:
- The title contains Bengali (বাংলা) text: "${text}"
- DO NOT attempt to render Bengali text inside the image as it will appear garbled
- Instead, create a visually appealing thumbnail with strong imagery and composition
- Leave clean space where text overlay can be added later
- Use visual elements (arrows, icons, emoji-style graphics) to convey the message
- If text is essential, use only ENGLISH power words (1-3 words max)`,
    Hindi: `
TEXT RENDERING CRITICAL:
- The title contains Hindi (हिंदी) text
- DO NOT render Hindi/Devanagari text inside the image
- Create strong visual composition with clean text areas
- Use visual elements to convey the message instead of text
- If text is essential, use only ENGLISH power words`,
    Arabic: `
TEXT RENDERING CRITICAL:
- The title contains Arabic (العربية) text
- DO NOT render Arabic text inside the image
- Create strong visual composition with clean areas for text overlay
- Use visual elements to convey the message`,
    Chinese: `
TEXT RENDERING CRITICAL:
- The title contains Chinese (中文) text
- Be extremely careful with Chinese character rendering
- Use simple, bold Chinese characters if needed
- Prefer visual communication over text`,
    Japanese: `
TEXT RENDERING CRITICAL:
- The title contains Japanese (日本語) text
- Be careful with Japanese character rendering
- Use simple characters if text is necessary`,
    Korean: `
TEXT RENDERING CRITICAL:
- The title contains Korean (한국어) text
- Be careful with Korean character rendering`,
    Thai: `
TEXT RENDERING CRITICAL:
- The title contains Thai (ไทย) text
- DO NOT render Thai text inside the image`
  }
  
  return langInstructions[langInfo.primaryLanguage] || ''
}

// Generate high-CTR prompt
const generateThumbnailPrompt = (topic, platform, style, includesFace = true) => {
  const platformConfig = PLATFORMS.find(p => p.id === platform)
  const styleConfig = THUMBNAIL_STYLES.find(s => s.id === style)
  
  let basePrompt = `Create a high click-through rate thumbnail for ${platformConfig?.name || 'YouTube'}.`
  
  // CTR best practices
  basePrompt += `
COMPOSITION: Single dominant focal point using Rule of Thirds.`
  
  if (includesFace) {
    basePrompt += ` Close-up human face with exaggerated expression (surprise/excitement/shock) making direct eye contact with camera - faces get 921K+ more views.`
  }
  
  basePrompt += `
COLORS: High-contrast vibrant color palette that pops against white/dark backgrounds. ${styleConfig?.promptModifier || 'Use red/blue or yellow/purple or orange/teal color combinations.'}
TYPOGRAPHY: If text needed, use maximum 3 bold power words in thick sans-serif font with drop shadow for mobile readability. Never place text in bottom-right corner (timestamp area).
BACKGROUND: Dynamic gradient or contextual scene, NOT plain solid colors.
QUALITY: Sharp, professional, 4K quality, perfect for ${platformConfig?.resolution || '1280x720'} resolution.`
  
  if (topic) {
    basePrompt += `\nTOPIC: ${topic}`
  }
  
  return basePrompt
}

export default function ThumbnailMakerPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  
  // AI Generation state
  const [topic, setTopic] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [selectedStyle, setSelectedStyle] = useState('high-ctr')
  const [includeFace, setIncludeFace] = useState(true)
  const [selectedModel, setSelectedModel] = useState('nano-banana')
  
  // Upload/Edit state
  const [uploadedImage, setUploadedImage] = useState(null)
  const [overlayText, setOverlayText] = useState('')
  const [textPosition, setTextPosition] = useState('center')
  
  // Output state
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null)
  const [thumbnailHistory, setThumbnailHistory] = useState([])
  
  const fileInputRef = useRef(null)

  // Get current platform config
  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0]

  // Handle AI thumbnail generation
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a video topic or title')
      return
    }
    
    setIsLoading(true)
    try {
      const prompt = generateThumbnailPrompt(topic, selectedPlatform, selectedStyle, includeFace)
      
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          model: selectedModel,
          style: selectedStyle,
          aspectRatio: currentPlatform.aspectRatio
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedThumbnail(data.imageUrl)
        setThumbnailHistory(prev => [
          { id: Date.now(), url: data.imageUrl, topic, platform: selectedPlatform },
          ...prev.slice(0, 9)
        ])
        if (data.savedToLibrary) {
          toast.success('Thumbnail generated and saved to Library!')
        } else {
          toast.success('Thumbnail generated successfully!')
        }
      } else {
        toast.error(data.error || 'Failed to generate thumbnail')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate thumbnail')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image upload for editing
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target.result)
      toast.success('Image uploaded!')
    }
    reader.readAsDataURL(file)
  }

  // Handle image editing
  const handleEditImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first')
      return
    }
    
    setIsLoading(true)
    try {
      const styleConfig = THUMBNAIL_STYLES.find(s => s.id === selectedStyle)
      let editPrompt = `Transform this image into a high-CTR thumbnail. Apply ${styleConfig?.promptModifier || 'vibrant colors and high contrast'}. Make it attention-grabbing for ${currentPlatform.name}.`
      
      if (overlayText) {
        editPrompt += ` The thumbnail should visually suggest: "${overlayText}"`
      }
      
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          imageBase64: uploadedImage,
          editPrompt,
          model: selectedModel
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedThumbnail(data.imageUrl)
        toast.success('Thumbnail enhanced!')
      } else {
        toast.error(data.error || 'Failed to enhance thumbnail')
      }
    } catch (error) {
      toast.error('Failed to enhance thumbnail')
    } finally {
      setIsLoading(false)
    }
  }

  // Download thumbnail
  const downloadThumbnail = () => {
    if (!generatedThumbnail) return
    const link = document.createElement('a')
    link.href = generatedThumbnail
    link.download = `thumbnail-${selectedPlatform}-${Date.now()}.png`
    link.click()
    toast.success('Thumbnail downloaded!')
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!generatedThumbnail) return
    try {
      const response = await fetch(generatedThumbnail)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  High-CTR Thumbnail Maker
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">CTR Booster</Badge>
                </h1>
                <p className="text-white/80 text-sm">Create thumbnails that get clicks with AI</p>
              </div>
            </div>
            
            {/* Model Toggle */}
            <div className="hidden md:flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setSelectedModel('nano-banana')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana' ? 'bg-white text-red-600' : 'hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Fast
              </button>
              <button
                onClick={() => setSelectedModel('nano-banana-pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana-pro' ? 'bg-white text-red-600' : 'hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Pro HD
              </button>
            </div>
          </div>
          
          {/* CTR Stats */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Faces = +921K views
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Type className="h-3 w-3" />
              3 words max
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Palette className="h-3 w-3" />
              High contrast colors
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Layout className="h-3 w-3" />
              Rule of Thirds
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b bg-muted/30">
                <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="generate" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent py-3 px-6"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent py-3 px-6"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Edit
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="p-6">
                {/* AI Generate Tab */}
                <TabsContent value="generate" className="mt-0 space-y-5">
                  {/* Platform Selection */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Platform</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedPlatform === platform.id 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30 shadow-lg' 
                              : 'border-border hover:border-red-300'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{platform.icon}</span>
                          <span className="text-[10px] font-medium block">{platform.name}</span>
                          <span className="text-[8px] text-muted-foreground">{platform.aspectRatio}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Topic Input */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Video Topic / Title</Label>
                    <Textarea
                      placeholder="e.g., How I Made $10K in One Month, Ultimate Gaming Setup Tour 2024, Learn Python in 24 Hours..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: {currentPlatform.tips}
                    </p>
                  </div>
                  
                  {/* Style Selection */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Thumbnail Style</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {THUMBNAIL_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedStyle === style.id 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
                              : 'border-border hover:border-red-300'
                          }`}
                        >
                          <span className="text-xl block mb-0.5">{style.icon}</span>
                          <span className="text-[9px] font-medium block">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Options */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Include human face (gets +921K views)</span>
                    </div>
                    <Switch
                      checked={includeFace}
                      onCheckedChange={setIncludeFace}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !topic.trim()}
                    className="w-full h-12 text-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Generate High-CTR Thumbnail
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                {/* Upload Tab */}
                <TabsContent value="upload" className="mt-0 space-y-5">
                  {/* Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      uploadedImage 
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                        : 'border-border hover:border-red-300'
                    }`}
                  >
                    {uploadedImage ? (
                      <div className="relative inline-block">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="max-h-40 rounded-lg shadow"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedImage(null)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="font-medium">Upload image to enhance</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Platform for upload */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Target Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.icon} {p.name} ({p.aspectRatio})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Style for upload */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Enhancement Style</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THUMBNAIL_STYLES.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.icon} {s.name} - {s.colors}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Optional text hint */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Text/Theme (Optional)</Label>
                    <Input
                      placeholder="e.g., SHOCKING RESULTS, HOW TO..."
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleEditImage} 
                    disabled={isLoading || !uploadedImage}
                    className="w-full h-12 text-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Enhance to High-CTR
                      </>
                    )}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Result */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Result
                {generatedThumbnail && (
                  <Badge variant="secondary" className="text-[10px]">
                    {currentPlatform.aspectRatio}
                  </Badge>
                )}
              </CardTitle>
              {generatedThumbnail && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadThumbnail}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedThumbnail ? (
                <div className="space-y-3">
                  <div className={`relative rounded-xl overflow-hidden bg-muted ${
                    currentPlatform.aspectRatio === '16:9' ? 'aspect-video' :
                    currentPlatform.aspectRatio === '1:1' ? 'aspect-square' :
                    currentPlatform.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                    'aspect-video'
                  }`}>
                    <img 
                      src={generatedThumbnail} 
                      alt="Generated thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {currentPlatform.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentPlatform.resolution}
                    </Badge>
                    <Badge className="text-xs bg-green-500">
                      CTR Optimized
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground bg-muted/30 rounded-xl">
                  <Target className="h-12 w-12 opacity-30 mb-3" />
                  <p className="font-medium">Your thumbnail will appear here</p>
                  <p className="text-xs">Optimized for high click-through rates</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {thumbnailHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {thumbnailHistory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedThumbnail(item.url)}
                      className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 transition-all"
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTR Tips Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Target className="h-4 w-4" />
                CTR Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5 text-amber-700 dark:text-amber-300">
              <p>• <strong>Faces with expressions</strong> get 921K+ more views</p>
              <p>• <strong>3 words maximum</strong> - power words like "NEVER", "STOP"</p>
              <p>• <strong>High contrast colors</strong> - red/blue, yellow/purple</p>
              <p>• <strong>Avoid bottom-right</strong> - timestamp covers it</p>
              <p>• <strong>Mobile-first</strong> - 70% views are mobile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
