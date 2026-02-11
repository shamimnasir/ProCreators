'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Wand2, Upload, Download, ImageIcon, Sparkles, RefreshCw,
  Zap, Target, Palette, X, Copy, FrameIcon, Layers,
  Facebook, Twitter, Linkedin, Youtube, Instagram, Plus, Globe
} from 'lucide-react'

// Platform presets with exact dimensions
const PLATFORM_PRESETS = [
  { 
    id: 'facebook-cover', 
    name: 'Facebook Cover', 
    icon: '👤',
    platform: 'Facebook',
    aspectRatio: '2.7:1',
    resolution: '820x312',
    description: 'Facebook profile cover photo',
    tips: 'Keep text/logo in center safe zone'
  },
  { 
    id: 'facebook-page', 
    name: 'Facebook Page', 
    icon: '📘',
    platform: 'Facebook',
    aspectRatio: '16:9',
    resolution: '1200x628',
    description: 'Facebook page cover',
    tips: 'High-quality, engaging imagery'
  },
  { 
    id: 'twitter-header', 
    name: 'X/Twitter Header', 
    icon: '🐦',
    platform: 'Twitter',
    aspectRatio: '3:1',
    resolution: '1500x500',
    description: 'Twitter/X profile header',
    tips: 'Avoid text at edges - cropped on mobile'
  },
  { 
    id: 'linkedin-banner', 
    name: 'LinkedIn Banner', 
    icon: '💼',
    platform: 'LinkedIn',
    aspectRatio: '4:1',
    resolution: '1584x396',
    description: 'LinkedIn personal/company banner',
    tips: 'Professional, clean design'
  },
  { 
    id: 'linkedin-company', 
    name: 'LinkedIn Company', 
    icon: '🏢',
    platform: 'LinkedIn',
    aspectRatio: '4:1',
    resolution: '1128x191',
    description: 'LinkedIn company page cover',
    tips: 'Brand colors and messaging'
  },
  { 
    id: 'youtube-banner', 
    name: 'YouTube Banner', 
    icon: '📺',
    platform: 'YouTube',
    aspectRatio: '16:9',
    resolution: '2560x1440',
    description: 'YouTube channel art',
    tips: 'Safe area is 1546x423 in center'
  },
  { 
    id: 'twitch-banner', 
    name: 'Twitch Banner', 
    icon: '🎮',
    platform: 'Twitch',
    aspectRatio: '10:3',
    resolution: '1200x480',
    description: 'Twitch profile banner',
    tips: 'Gaming aesthetic, vibrant colors'
  },
  { 
    id: 'etsy-banner', 
    name: 'Etsy Shop', 
    icon: '🛍️',
    platform: 'Etsy',
    aspectRatio: '1200:300',
    resolution: '1200x300',
    description: 'Etsy shop cover photo',
    tips: 'Showcase your brand/products'
  },
  { 
    id: 'email-header', 
    name: 'Email Header', 
    icon: '📧',
    platform: 'Email',
    aspectRatio: '3:1',
    resolution: '600x200',
    description: 'Newsletter/email header',
    tips: 'Keep under 100KB for fast loading'
  },
  { 
    id: 'blog-header', 
    name: 'Blog Header', 
    icon: '📝',
    platform: 'Blog',
    aspectRatio: '16:9',
    resolution: '1200x675',
    description: 'Blog post featured image',
    tips: 'Compelling imagery with text space'
  },
  { 
    id: 'website-hero', 
    name: 'Website Hero', 
    icon: '🌐',
    platform: 'Website',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    description: 'Full-width hero section',
    tips: 'High-res, impactful visuals'
  },
  { 
    id: 'event-banner', 
    name: 'Event Banner', 
    icon: '🎉',
    platform: 'Events',
    aspectRatio: '2:1',
    resolution: '1920x1005',
    description: 'Event cover (Eventbrite, etc)',
    tips: 'Include event name and date'
  },
]

// Style presets
const STYLE_PRESETS = [
  { 
    id: 'professional', 
    name: 'Professional', 
    icon: '💼',
    description: 'Clean, corporate look',
    colors: 'Blue, White, Gray',
    prompt: 'Clean professional design, minimalist, corporate aesthetic, subtle gradients, premium quality, sophisticated color palette'
  },
  { 
    id: 'creative', 
    name: 'Creative', 
    icon: '🎨',
    description: 'Artistic, colorful design',
    colors: 'Vibrant, Multi-color',
    prompt: 'Creative artistic design, vibrant colors, dynamic composition, artistic elements, modern creative aesthetic'
  },
  { 
    id: 'modern', 
    name: 'Modern Minimal', 
    icon: '⬜',
    description: 'Clean, contemporary style',
    colors: 'Black, White, Accent',
    prompt: 'Modern minimalist design, clean lines, generous whitespace, contemporary aesthetic, elegant simplicity'
  },
  { 
    id: 'gradient', 
    name: 'Gradient Flow', 
    icon: '🌈',
    description: 'Smooth gradient backgrounds',
    colors: 'Gradient transitions',
    prompt: 'Beautiful smooth gradient background, flowing color transitions, soft blur effects, modern gradient mesh'
  },
  { 
    id: 'tech', 
    name: 'Tech/Digital', 
    icon: '💻',
    description: 'Technology-focused design',
    colors: 'Blue, Purple, Cyan',
    prompt: 'Futuristic tech design, digital aesthetic, geometric patterns, circuit-like elements, technology themed'
  },
  { 
    id: 'nature', 
    name: 'Nature', 
    icon: '🌿',
    description: 'Organic, natural feel',
    colors: 'Green, Earth tones',
    prompt: 'Natural organic design, earth tones, botanical elements, eco-friendly aesthetic, serene natural background'
  },
  { 
    id: 'luxury', 
    name: 'Luxury', 
    icon: '✨',
    description: 'Premium, elegant style',
    colors: 'Gold, Black, White',
    prompt: 'Luxury premium design, gold accents, elegant sophistication, high-end aesthetic, luxurious feel'
  },
  { 
    id: 'retro', 
    name: 'Retro/Vintage', 
    icon: '📻',
    description: 'Nostalgic vintage look',
    colors: 'Warm, Muted tones',
    prompt: 'Retro vintage design, nostalgic aesthetic, muted warm tones, classic typography style, vintage feel'
  },
  { 
    id: 'neon', 
    name: 'Neon Glow', 
    icon: '💜',
    description: 'Vibrant neon aesthetic',
    colors: 'Neon Pink, Cyan, Purple',
    prompt: 'Neon glow design, dark background with vibrant neon colors, cyberpunk aesthetic, glowing elements'
  },
  { 
    id: 'geometric', 
    name: 'Geometric', 
    icon: '🔷',
    description: 'Abstract geometric patterns',
    colors: 'Bold, Contrasting',
    prompt: 'Abstract geometric design, bold shapes, modern patterns, dynamic composition, geometric art'
  },
]

// Quick templates
const QUICK_TEMPLATES = [
  { id: 'personal-brand', name: 'Personal Brand', emoji: '👤', desc: 'For individuals & influencers' },
  { id: 'business', name: 'Business/Company', emoji: '🏢', desc: 'Corporate & professional' },
  { id: 'ecommerce', name: 'E-commerce', emoji: '🛒', desc: 'Online stores & products' },
  { id: 'event', name: 'Event/Promotion', emoji: '🎉', desc: 'Sales, launches, events' },
  { id: 'portfolio', name: 'Portfolio/Creative', emoji: '🎨', desc: 'Artists & creators' },
  { id: 'tech-startup', name: 'Tech/Startup', emoji: '🚀', desc: 'Tech companies & apps' },
]

export default function CoverImageCreatorPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  
  // Generation state
  const [topic, setTopic] = useState('')
  const [brandName, setBrandName] = useState('')
  const [tagline, setTagline] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('facebook-cover')
  const [selectedStyle, setSelectedStyle] = useState('professional')
  const [selectedModel, setSelectedModel] = useState('nano-banana-pro')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  
  // Output state
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageHistory, setImageHistory] = useState([])
  
  // Upload state
  const [uploadedImage, setUploadedImage] = useState(null)
  const [editPrompt, setEditPrompt] = useState('')
  const { checkAndDeduct, refund, complete } = useCredits()
  const fileInputRef = useRef(null)

  // Get current platform config
  const currentPlatform = PLATFORM_PRESETS.find(p => p.id === selectedPlatform) || PLATFORM_PRESETS[0]
  const currentStyle = STYLE_PRESETS.find(s => s.id === selectedStyle) || STYLE_PRESETS[0]

  // Generate cover image
  const generateCoverImage = async () => {
    if (!topic.trim() && !brandName.trim()) {
      toast.error('Please enter a topic or brand name')
      return
    }
    
    setIsLoading(true)
    try {
      // Build comprehensive prompt
      let prompt = `Create a professional ${currentPlatform.name} cover image (${currentPlatform.resolution}).

STYLE: ${currentStyle.prompt}

COMPOSITION:
- Perfect for ${currentPlatform.platform} ${currentPlatform.name}
- Aspect ratio: ${currentPlatform.aspectRatio}
- High-quality, ${currentPlatform.resolution} resolution
- ${currentPlatform.tips}

CONTENT:`

      if (brandName) {
        prompt += `\n- Brand/Name: "${brandName}" (incorporate elegantly if possible)`
      }
      if (tagline) {
        prompt += `\n- Tagline: "${tagline}"`
      }
      if (topic) {
        prompt += `\n- Theme/Topic: ${topic}`
      }
      
      prompt += `\n\nDESIGN REQUIREMENTS:
- Clean, professional composition
- Visually striking and memorable
- Appropriate safe zones for text/avatars
- Optimized for ${currentPlatform.platform} display
- High contrast and legibility`

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
        setGeneratedImage(data.imageUrl)
        setImageHistory(prev => [
          { id: Date.now(), url: data.imageUrl, platform: selectedPlatform, style: selectedStyle },
          ...prev.slice(0, 9)
        ])
        toast.success('Cover image generated!')
      } else {
        toast.error(data.error || 'Failed to generate cover')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate cover image')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => setUploadedImage(event.target.result)
    reader.readAsDataURL(file)
  }

  // Edit uploaded image
  const handleEditImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first')
      return
    }
    
    setIsLoading(true)
    try {
      let prompt = editPrompt || `Transform this image into a professional ${currentPlatform.name} cover. Apply ${currentStyle.prompt}. Maintain ${currentPlatform.aspectRatio} aspect ratio. ${currentPlatform.tips}.`
      
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          imageBase64: uploadedImage,
          editPrompt: prompt,
          model: selectedModel
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedImage(data.imageUrl)
        toast.success('Cover image enhanced!')
      } else {
        toast.error(data.error || 'Failed to enhance cover')
      }
    } catch (error) {
      toast.error('Failed to enhance cover image')
    } finally {
      setIsLoading(false)
    }
  }

  // Download image
  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `${currentPlatform.id}-cover-${Date.now()}.png`
    link.click()
    toast.success('Cover image downloaded!')
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!generatedImage) return
    try {
      const response = await fetch(generatedImage)
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FrameIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Cover Image Creator
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">Pro</Badge>
                </h1>
                <p className="text-white/80 text-sm">Professional covers & banners for all platforms</p>
              </div>
            </div>
            
            {/* Model Toggle */}
            <div className="hidden md:flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setSelectedModel('nano-banana')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana' ? 'bg-white text-indigo-600' : 'hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Fast
              </button>
              <button
                onClick={() => setSelectedModel('nano-banana-pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana-pro' ? 'bg-white text-indigo-600' : 'hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Pro HD
              </button>
            </div>
          </div>
          
          {/* Platform Icons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Facebook className="h-3 w-3" />
              Facebook
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Twitter className="h-3 w-3" />
              Twitter/X
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Youtube className="h-3 w-3" />
              YouTube
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Website & More
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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent py-3 px-4"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent py-3 px-4"
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
                    <Label className="text-sm font-semibold mb-3 block">Platform / Size</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PLATFORM_PRESETS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedPlatform === platform.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg' 
                              : 'border-border hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-xl block mb-0.5">{platform.icon}</span>
                          <span className="text-[9px] font-medium block truncate">{platform.name}</span>
                          <span className="text-[8px] text-muted-foreground">{platform.resolution}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Style Selection */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Design Style</Label>
                    <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                      {STYLE_PRESETS.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`p-2 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedStyle === style.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' 
                              : 'border-border hover:border-indigo-300'
                          }`}
                          title={style.description}
                        >
                          <span className="text-lg block mb-0.5">{style.icon}</span>
                          <span className="text-[8px] font-medium block truncate">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Quick Templates</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template.id)
                            setTopic(template.desc)
                          }}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                            selectedTemplate === template.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' 
                              : 'border-border hover:border-indigo-300'
                          }`}
                        >
                          {template.emoji} {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Brand Name & Tagline */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Brand/Page Name</Label>
                      <Input
                        placeholder="Your Brand Name"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Tagline (Optional)</Label>
                      <Input
                        placeholder="Your tagline or slogan"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Topic/Theme */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Topic / Description</Label>
                    <Textarea
                      placeholder="Describe your cover image... e.g., A tech startup focusing on AI solutions, modern and innovative feel, blue and white colors..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: {currentPlatform.tips}
                    </p>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex items-center gap-4">
                    <CreditCostBadge toolId="cover-image-creator" />
                    <Button 
                      onClick={generateCoverImage} 
                      disabled={isLoading || (!topic.trim() && !brandName.trim())}
                      className="flex-1 h-12 text-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
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
                          Generate {currentPlatform.name}
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Upload Tab */}
                <TabsContent value="upload" className="mt-0 space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      uploadedImage 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                        : 'border-border hover:border-indigo-300'
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
                        <p className="font-medium">Upload image to convert</p>
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
                  
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Target Platform</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PLATFORM_PRESETS.slice(0, 8).map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-2 rounded-lg border-2 text-center ${
                            selectedPlatform === platform.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' 
                              : 'border-border hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-lg block">{platform.icon}</span>
                          <span className="text-[8px] font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Edit Instructions (Optional)</Label>
                    <Textarea
                      placeholder="Add any specific changes you want... e.g., Add gradient overlay, enhance colors, add professional look..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleEditImage} 
                    disabled={isLoading || !uploadedImage}
                    className="w-full h-12 text-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Convert to {currentPlatform.name}
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Result
                </CardTitle>
                {generatedImage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadImage}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {generatedImage && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {currentPlatform.icon} {currentPlatform.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentPlatform.resolution}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="relative rounded-xl overflow-hidden bg-muted/30 border">
                  <img 
                    src={generatedImage} 
                    alt="Generated Cover" 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground bg-muted/30 rounded-xl">
                  <FrameIcon className="h-12 w-12 opacity-50 mb-3" />
                  <p className="font-medium">Your cover will appear here</p>
                  <p className="text-xs mt-1">Select a platform and generate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {imageHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Recent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {imageHistory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedImage(item.url)}
                      className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all"
                    >
                      <img 
                        src={item.url} 
                        alt="History" 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                <Target className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-indigo-700 dark:text-indigo-300">
              <p>• <strong>Keep text in safe zones</strong> - Mobile crops vary</p>
              <p>• <strong>High contrast</strong> works best across devices</p>
              <p>• <strong>Brand consistency</strong> - Use same style everywhere</p>
              <p>• <strong>Update regularly</strong> - Keep covers fresh</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
