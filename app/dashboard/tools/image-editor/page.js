'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { 
  Wand2, Upload, Download, Sparkles, Image as ImageIcon, Palette,
  Layers, Trash2, Copy, RefreshCw, Lightbulb, Plus, X, Camera,
  Pencil, Combine, Zap, User, ShoppingBag, Film, Smile, Target,
  ChevronRight, Check, Star, Heart
} from 'lucide-react'

// Style presets with detailed info - Combined with Quick Actions
const STYLE_PRESETS = [
  // Quick Templates (Popular Use Cases)
  { id: 'product-photo', name: 'Product Photo', icon: '📦', description: 'E-commerce ready product shots', category: 'template', prompt: 'Professional product photography, clean white background, soft studio lighting, e-commerce ready' },
  { id: 'headshot', name: 'AI Headshot', icon: '👔', description: 'Professional corporate portraits', category: 'template', prompt: 'Professional corporate headshot, neutral gray background, soft lighting, LinkedIn ready' },
  { id: 'logo-design', name: 'Logo Design', icon: '🎯', description: 'Clean, scalable logo designs', category: 'template', prompt: 'Modern minimalist logo design, clean lines, scalable vector style, no text' },
  { id: 'avatar', name: 'AI Avatar', icon: '🎭', description: 'Stylized cartoon avatars', category: 'template', prompt: 'Stylized cartoon avatar, friendly expression, colorful gradient background' },
  { id: 'social-post', name: 'Social Post', icon: '📱', description: 'Instagram-worthy images', category: 'template', prompt: 'Instagram-worthy photo, aesthetic composition, trending style, warm golden hour lighting' },
  { id: 'banner', name: 'Banner', icon: '🖼️', description: 'Social media banners', category: 'template', prompt: 'Professional social media banner, clean design, modern typography placeholder area, gradient background' },
  // Style Presets
  { id: 'none', name: 'No Style', icon: '✨', description: 'Use your prompt as-is', category: 'style' },
  { id: 'realistic', name: 'Realistic', icon: '📸', description: 'Photorealistic, natural lighting', category: 'style' },
  { id: 'portrait', name: 'Portrait', icon: '👤', description: 'Professional headshots', category: 'style' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Movie poster style, dramatic', category: 'style' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean, simple, white space', category: 'style' },
  { id: 'vintage', name: 'Vintage', icon: '📷', description: 'Retro, film grain, warm tones', category: 'style' },
  { id: '3d', name: '3D Render', icon: '🎮', description: 'High quality 3D graphics', category: 'style' },
  { id: 'illustration', name: 'Illustration', icon: '🎨', description: 'Digital art, vibrant colors', category: 'style' },
  { id: 'watercolor', name: 'Watercolor', icon: '🖌️', description: 'Soft, artistic painting', category: 'style' },
  { id: 'pixel-art', name: 'Pixel Art', icon: '👾', description: '16-bit retro game style', category: 'style' },
  { id: 'comic', name: 'Comic', icon: '💥', description: 'Bold lines, high contrast', category: 'style' },
  { id: 'infographic', name: 'Infographic', icon: '📊', description: 'Data visualization', category: 'style' },
]

// Platform-specific thumbnail configurations
const THUMBNAIL_PLATFORMS = [
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: '📺', 
    aspectRatio: '16:9',
    resolution: '1280x720',
    description: 'YouTube videos & Shorts'
  },
  { 
    id: 'instagram-post', 
    name: 'Instagram Post', 
    icon: '📸', 
    aspectRatio: '1:1',
    resolution: '1080x1080',
    description: 'Instagram feed posts'
  },
  { 
    id: 'instagram-story', 
    name: 'Story/Reels', 
    icon: '📱', 
    aspectRatio: '9:16',
    resolution: '1080x1920',
    description: 'Stories, Reels, TikTok'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: '👤', 
    aspectRatio: '16:9',
    resolution: '1200x628',
    description: 'Facebook posts & ads'
  },
  { 
    id: 'twitter', 
    name: 'X/Twitter', 
    icon: '🐦', 
    aspectRatio: '16:9',
    resolution: '1600x900',
    description: 'Twitter/X posts'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: '💼', 
    aspectRatio: '1.91:1',
    resolution: '1200x627',
    description: 'LinkedIn posts'
  },
]

// High-CTR Thumbnail prompt generator
const generateThumbnailPrompt = (topic, platform, language = 'en') => {
  const basePrompt = `High-CTR thumbnail design for ${platform}. 
COMPOSITION: Single dominant focal point using Rule of Thirds, close-up human face with exaggerated expression (surprise/excitement/shock) making direct eye contact with camera.
COLORS: High-contrast vibrant color palette (red/blue or yellow/purple or orange/teal), colors that pop against white/dark backgrounds.
TYPOGRAPHY: Maximum 3 bold power words in thick sans-serif font (like Impact/Montserrat) with drop shadow and outline for mobile readability. Avoid bottom-right corner for text (timestamp area).
STYLE: Professional, attention-grabbing, creates curiosity gap, tells micro-story in one frame.
BACKGROUND: Dynamic gradient or blurred action scene, not plain solid colors.`
  
  if (topic) {
    return `${basePrompt}\nTOPIC/SUBJECT: ${topic}`
  }
  return basePrompt
}

// Aspect ratio options - Extended for thumbnails
const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', icon: '⬜', use: 'Instagram, Profile' },
  { id: '16:9', name: 'Landscape', icon: '🖼️', use: 'YouTube, Desktop' },
  { id: '9:16', name: 'Portrait', icon: '📱', use: 'Stories, Reels, TikTok' },
  { id: '4:3', name: 'Standard', icon: '🖥️', use: 'Presentations' },
  { id: '3:4', name: 'Portrait 3:4', icon: '📋', use: 'Pinterest' },
  { id: '1.91:1', name: 'LinkedIn', icon: '💼', use: 'LinkedIn, Facebook Ads' },
]

// Prompt suggestions by use case
const PROMPT_LIBRARY = {
  product: [
    'Luxury skincare bottle on marble surface, soft diffused lighting, premium feel',
    'Wireless earbuds floating on gradient background, tech product photography',
    'Handmade jewelry on velvet cloth, macro shot, bokeh background',
    'Coffee mug with steam, cozy morning setting, lifestyle product shot',
  ],
  portrait: [
    'Professional business headshot, confident expression, studio lighting',
    'Creative portrait with colorful gel lights, artistic composition',
    'Natural outdoor portrait, golden hour, shallow depth of field',
    'Executive portrait, power pose, corporate environment',
  ],
  creative: [
    'Surreal floating islands in the sky, fantasy art, magical atmosphere',
    'Cyberpunk city at night, neon lights, rain reflections',
    'Enchanted forest with glowing mushrooms, fairy tale aesthetic',
    'Abstract geometric patterns, vibrant gradients, modern art',
  ],
  design: [
    'Modern tech company logo, clean typography, blue and white',
    'Vintage coffee shop logo, hand-drawn style, warm colors',
    'Minimalist app icon, flat design, single color',
    'Luxury brand logo, gold accents, elegant serif font',
  ],
}

// Edit suggestions
const EDIT_SUGGESTIONS = [
  { text: 'Remove background', icon: '✂️' },
  { text: 'Change to sunset lighting', icon: '🌅' },
  { text: 'Make it more vibrant', icon: '🌈' },
  { text: 'Add bokeh effect', icon: '✨' },
  { text: 'Convert to black and white', icon: '🖤' },
  { text: 'Change background to city', icon: '🌆' },
  { text: 'Make it look vintage', icon: '📷' },
  { text: 'Add soft glow effect', icon: '💫' },
]

export default function ImageEditorPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  
  // Generation state
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('none')
  const [selectedModel, setSelectedModel] = useState('nano-banana')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [showAllStyles, setShowAllStyles] = useState(false)
  
  // Thumbnail Creator state
  const [showThumbnailCreator, setShowThumbnailCreator] = useState(false)
  const [thumbnailPlatform, setThumbnailPlatform] = useState('youtube')
  const [thumbnailTopic, setThumbnailTopic] = useState('')
  
  // Edit state
  const [editPrompt, setEditPrompt] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  
  // Fusion state
  const [fusionImages, setFusionImages] = useState([])
  const [fusionPrompt, setFusionPrompt] = useState('')
  
  // Output state
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageHistory, setImageHistory] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  
  const fileInputRef = useRef(null)
  const fusionInputRef = useRef(null)

  // Handle image generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: prompt.trim(),
          model: selectedModel,
          style: selectedStyle,
          aspectRatio
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedImage(data.imageUrl)
        setImageHistory(prev => [
          { id: Date.now(), url: data.imageUrl, prompt, type: 'generated', style: selectedStyle },
          ...prev.slice(0, 19)
        ])
        if (data.savedToLibrary) {
          toast.success('Image generated and saved to Library!')
        } else {
          toast.success('Image generated successfully!')
        }
      } else {
        toast.error(data.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image editing
  const handleEdit = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first')
      return
    }
    if (!editPrompt.trim()) {
      toast.error('Please enter edit instructions')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          imageBase64: uploadedImage,
          editPrompt: editPrompt.trim(),
          model: selectedModel,
          mimeType: 'image/png'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedImage(data.imageUrl)
        setImageHistory(prev => [
          { id: Date.now(), url: data.imageUrl, prompt: editPrompt, type: 'edited' },
          ...prev.slice(0, 19)
        ])
        if (data.savedToLibrary) {
          toast.success('Image edited and saved to Library!')
        } else {
          toast.success('Image edited successfully!')
        }
      } else {
        toast.error(data.error || 'Failed to edit image')
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('Failed to edit image')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image fusion
  const handleFuse = async () => {
    if (fusionImages.length < 2) {
      toast.error('Please upload at least 2 images')
      return
    }
    if (!fusionPrompt.trim()) {
      toast.error('Please enter fusion instructions')
      return
    }
    
    setIsLoading(true)
    try {
      const images = fusionImages.map(img => ({
        data: img.data,
        mimeType: img.mimeType || 'image/png'
      }))
      
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fuse',
          images,
          fusionPrompt: fusionPrompt.trim(),
          model: 'nano-banana-pro'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedImage(data.imageUrl)
        setImageHistory(prev => [
          { id: Date.now(), url: data.imageUrl, prompt: fusionPrompt, type: 'fused' },
          ...prev.slice(0, 19)
        ])
        if (data.savedToLibrary) {
          toast.success('Images fused and saved to Library!')
        } else {
          toast.success('Images fused successfully!')
        }
      } else {
        toast.error(data.error || 'Failed to fuse images')
      }
    } catch (error) {
      console.error('Fusion error:', error)
      toast.error('Failed to fuse images')
    } finally {
      setIsLoading(false)
    }
  }

  // File upload handlers
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

  const handleFusionUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (fusionImages.length + files.length > 14) {
      toast.error('Maximum 14 images allowed')
      return
    }
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (event) => {
        setFusionImages(prev => [
          ...prev,
          { id: Date.now() + Math.random(), data: event.target.result, mimeType: file.type }
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  // Utility functions
  const removeFusionImage = (id) => setFusionImages(prev => prev.filter(img => img.id !== id))
  
  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-image-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded!')
  }

  const copyImage = async () => {
    if (!generatedImage) return
    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      toast.success('Image copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy image')
    }
  }

  const useForEditing = () => {
    if (!generatedImage) return
    setUploadedImage(generatedImage)
    setActiveTab('edit')
    toast.info('Image loaded for editing')
  }

  const applyPromptSuggestion = (suggestion) => {
    setPrompt(suggestion)
    toast.success('Prompt applied!')
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - Simplified */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Image Studio</h1>
                <p className="text-white/80 text-sm">Create, edit & transform images with Nano Banana AI</p>
              </div>
            </div>
            
            {/* Model Selector */}
            <div className="hidden md:flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setSelectedModel('nano-banana')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana' ? 'bg-white text-purple-600' : 'hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Fast
              </button>
              <button
                onClick={() => setSelectedModel('nano-banana-pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana-pro' ? 'bg-white text-purple-600' : 'hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Pro HD
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel - Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Tabs */}
          <Card className="overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b bg-muted/30">
                <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="generate" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fuse" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-6"
                  >
                    <Combine className="h-4 w-4 mr-2" />
                    Fuse
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="p-6">
                {/* Generate Tab */}
                <TabsContent value="generate" className="mt-0 space-y-6">
                  {/* Prompt Input */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Describe your image</Label>
                    <Textarea
                      placeholder="A professional product photo of wireless earbuds on a marble surface, soft studio lighting, clean white background..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] text-base resize-none"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Be specific for better results</span>
                      <span>{prompt.length} characters</span>
                    </div>
                  </div>
                  
                  {/* Templates & Styles - Unified Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-semibold">Templates & Styles</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllStyles(!showAllStyles)}
                        className="text-xs"
                      >
                        {showAllStyles ? 'Show Less' : 'Show All'}
                        <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${showAllStyles ? 'rotate-90' : ''}`} />
                      </Button>
                    </div>
                    
                    {/* Quick Templates - Always Show */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">🚀 Quick Templates</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {STYLE_PRESETS.filter(s => s.category === 'template').map((style) => (
                          <button
                            key={style.id}
                            onClick={() => {
                              setSelectedStyle(style.id)
                              if (style.isThumbnail) {
                                // Open thumbnail creator modal
                                setShowThumbnailCreator(true)
                              } else if (style.prompt) {
                                setPrompt(style.prompt)
                                toast.success(`${style.name} template applied!`)
                              }
                            }}
                            className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                              selectedStyle === style.id 
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg shadow-violet-500/20' 
                                : 'border-border hover:border-violet-300 bg-gradient-to-b from-violet-50/50 to-transparent dark:from-violet-950/20'
                            }`}
                            title={style.description}
                          >
                            <span className="text-2xl block mb-1">{style.icon}</span>
                            <span className="text-[10px] font-medium truncate block">{style.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Thumbnail Creator Panel */}
                    {showThumbnailCreator && (
                      <div className="mb-4 p-4 rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-violet-800 dark:text-violet-200 flex items-center gap-2">
                            🖼️ High-CTR Thumbnail Creator
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowThumbnailCreator(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-violet-600 dark:text-violet-300 mb-3">
                          Create thumbnails optimized for high click-through rates with proper composition, colors, and typography.
                        </p>
                        
                        {/* Platform Selection */}
                        <div className="mb-3">
                          <Label className="text-xs font-medium mb-2 block">Platform</Label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {THUMBNAIL_PLATFORMS.map((platform) => (
                              <button
                                key={platform.id}
                                onClick={() => {
                                  setThumbnailPlatform(platform.id)
                                  // Set aspect ratio based on platform
                                  const arMap = {
                                    'youtube': '16:9',
                                    'instagram-post': '1:1',
                                    'instagram-story': '9:16',
                                    'facebook': '16:9',
                                    'twitter': '16:9',
                                    'linkedin': '16:9'
                                  }
                                  setAspectRatio(arMap[platform.id] || '16:9')
                                }}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                  thumbnailPlatform === platform.id 
                                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/50' 
                                    : 'border-border hover:border-violet-300'
                                }`}
                              >
                                <span className="text-lg block">{platform.icon}</span>
                                <span className="text-[9px] font-medium block">{platform.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Topic Input */}
                        <div className="mb-3">
                          <Label className="text-xs font-medium mb-1 block">Video Topic / Title</Label>
                          <Textarea
                            placeholder="e.g., How to Learn Programming in 30 Days, Best Gaming Setup 2024, Cook Restaurant Quality Pasta..."
                            value={thumbnailTopic}
                            onChange={(e) => setThumbnailTopic(e.target.value)}
                            className="min-h-[60px] text-sm resize-none"
                          />
                        </div>
                        
                        {/* Apply Button */}
                        <Button
                          onClick={() => {
                            const platform = THUMBNAIL_PLATFORMS.find(p => p.id === thumbnailPlatform)
                            const thumbnailPrompt = generateThumbnailPrompt(thumbnailTopic, platform?.name || 'YouTube')
                            setPrompt(thumbnailPrompt)
                            setShowThumbnailCreator(false)
                            toast.success(`${platform?.name || 'YouTube'} thumbnail template applied!`)
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-700"
                          size="sm"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Apply High-CTR Template
                        </Button>
                        
                        {/* Tips */}
                        <div className="mt-3 p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                          <p className="text-[10px] text-violet-700 dark:text-violet-300">
                            <strong>Pro Tips:</strong> Thumbnails with faces get 921K+ more views. Use 3 words max. High contrast colors (red/blue, yellow/purple). Direct eye contact. Avoid text in bottom-right corner.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Style Presets */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">🎨 Style Presets</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {(showAllStyles 
                          ? STYLE_PRESETS.filter(s => s.category === 'style')
                          : STYLE_PRESETS.filter(s => s.category === 'style').slice(0, 6)
                        ).map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-2.5 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                              selectedStyle === style.id 
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            title={style.description}
                          >
                            <span className="text-xl block mb-0.5">{style.icon}</span>
                            <span className="text-[9px] font-medium truncate block">{style.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Aspect Ratio */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Aspect Ratio</Label>
                    <div className="flex gap-2 flex-wrap">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.id}
                          onClick={() => setAspectRatio(ar.id)}
                          className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            aspectRatio === ar.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span>{ar.icon}</span>
                          <span className="text-sm font-medium">{ar.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Prompt Suggestions */}
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Need inspiration?
                    </Label>
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2">
                        {PROMPT_LIBRARY.product.slice(0, 3).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => applyPromptSuggestion(suggestion)}
                            className="shrink-0 px-3 py-2 bg-muted rounded-lg text-xs text-left hover:bg-muted/80 transition-colors max-w-[200px]"
                          >
                            {suggestion.slice(0, 60)}...
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !prompt.trim()}
                    className="w-full h-12 text-lg"
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
                        Generate Image
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                {/* Edit Tab */}
                <TabsContent value="edit" className="mt-0 space-y-6">
                  {/* Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      uploadedImage 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {uploadedImage ? (
                      <div className="relative inline-block">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="max-h-48 rounded-lg shadow-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedImage(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium">Upload an image to edit</p>
                        <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WebP supported</p>
                      </div>
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
                    <Label className="text-base font-semibold mb-2 block">Edit Instructions</Label>
                    <Textarea
                      placeholder="Remove the background and replace with a sunset sky..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  
                  {/* Quick Edit Buttons */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Edits</Label>
                    <div className="flex flex-wrap gap-2">
                      {EDIT_SUGGESTIONS.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => setEditPrompt(suggestion.text)}
                          className="text-xs"
                        >
                          <span className="mr-1">{suggestion.icon}</span>
                          {suggestion.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleEdit} 
                    disabled={isLoading || !uploadedImage || !editPrompt.trim()}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Pencil className="h-5 w-5 mr-2" />
                        Apply Edit
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                {/* Fuse Tab */}
                <TabsContent value="fuse" className="mt-0 space-y-6">
                  <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500 text-white rounded-lg">
                        <Combine className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-violet-200">Multi-Image Fusion</p>
                        <p className="text-xs text-violet-600 dark:text-violet-300">
                          Upload 2-14 images and describe how to combine them
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fusion Images Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {fusionImages.map((img) => (
                      <div key={img.id} className="relative aspect-square group">
                        <img 
                          src={img.data} 
                          alt="Fusion" 
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFusionImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {fusionImages.length < 14 && (
                      <button
                        onClick={() => fusionInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-all"
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Add</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fusionInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFusionUpload}
                    className="hidden"
                  />
                  
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Fusion Instructions</Label>
                    <Textarea
                      placeholder="Combine these images into a seamless collage with a gradient transition..."
                      value={fusionPrompt}
                      onChange={(e) => setFusionPrompt(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleFuse} 
                    disabled={isLoading || fusionImages.length < 2 || !fusionPrompt.trim()}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Fusing...
                      </>
                    ) : (
                      <>
                        <Combine className="h-5 w-5 mr-2" />
                        Fuse Images ({fusionImages.length}/14)
                      </>
                    )}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Output (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Generated Image Display */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Result
              </CardTitle>
              {generatedImage && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFavorite(!isFavorite)}>
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadImage}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyImage}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={useForEditing}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="relative rounded-xl overflow-hidden bg-muted/30">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/30 rounded-xl">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
                    <ImageIcon className="h-10 w-10 opacity-50" />
                  </div>
                  <p className="font-medium">Your image will appear here</p>
                  <p className="text-xs mt-1">Enter a prompt and click Generate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {imageHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    History
                  </span>
                  <Badge variant="secondary">{imageHistory.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {imageHistory.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedImage(item.url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:scale-105"
                    >
                      <img 
                        src={item.url} 
                        alt={item.prompt} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Lightbulb className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-amber-700 dark:text-amber-300">
              <p>• <strong>Be specific</strong> about subjects, lighting, and composition</p>
              <p>• <strong>Use style presets</strong> for consistent results</p>
              <p>• <strong>For editing</strong>, use commands like "remove", "add", "change"</p>
              <p>• <strong>Pro model</strong> gives higher quality for detailed work</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
