'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  Wand2, 
  Upload, 
  Download, 
  Sparkles, 
  Image as ImageIcon, 
  Palette,
  Layers,
  Trash2,
  Copy,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Plus,
  X,
  Camera,
  Pencil,
  Combine,
  ChevronDown,
  Check
} from 'lucide-react'

// Style presets with icons
const STYLE_PRESETS = [
  { id: 'none', name: 'No Style', icon: '🎯', description: 'Use your prompt as-is' },
  { id: 'realistic', name: 'Realistic', icon: '📸', description: 'Photorealistic, natural lighting' },
  { id: 'product', name: 'Product', icon: '🛍️', description: 'E-commerce ready, clean background' },
  { id: 'illustration', name: 'Illustration', icon: '🎨', description: 'Digital art, vibrant colors' },
  { id: 'portrait', name: 'Portrait', icon: '👤', description: 'Professional headshots' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Movie poster style, dramatic' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean, simple, white space' },
  { id: 'vintage', name: 'Vintage', icon: '📷', description: 'Retro, film grain, warm tones' },
  { id: '3d', name: '3D Render', icon: '🎮', description: 'High quality 3D graphics' },
  { id: 'watercolor', name: 'Watercolor', icon: '🖌️', description: 'Soft, artistic painting' },
  { id: 'pixel-art', name: 'Pixel Art', icon: '👾', description: '16-bit retro game style' },
  { id: 'comic', name: 'Comic', icon: '💥', description: 'Bold lines, high contrast' },
  { id: 'infographic', name: 'Infographic', icon: '📊', description: 'Data visualization' }
]

// Aspect ratio options
const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', icon: '⬜', description: 'Instagram, Profile' },
  { id: '16:9', name: 'Landscape', icon: '🖼️', description: 'YouTube, Desktop' },
  { id: '9:16', name: 'Portrait', icon: '📱', description: 'Stories, Reels, TikTok' },
  { id: '4:3', name: 'Standard', icon: '🖥️', description: 'Presentations' },
  { id: '3:4', name: 'Portrait 3:4', icon: '📋', description: 'Pinterest' }
]

// Prompt suggestions by category
const PROMPT_SUGGESTIONS = {
  product: [
    'Premium wireless earbuds on marble surface, soft studio lighting',
    'Luxury watch on black reflective surface, dramatic lighting',
    'Skincare bottle on sandy beach, golden hour, lifestyle shot'
  ],
  portrait: [
    'Professional headshot, neutral background, soft key light',
    'Creative portrait with colorful gel lights, artistic composition',
    'Natural outdoor portrait, golden hour backlight, shallow depth of field'
  ],
  illustration: [
    'Whimsical forest with glowing mushrooms, fantasy art style',
    'Futuristic cityscape with flying cars, neon lights, cyberpunk',
    'Cute animal characters having tea party, children book illustration'
  ],
  general: [
    'Cozy coffee shop interior, warm lighting, hygge aesthetic',
    'Abstract geometric patterns, vibrant gradients, modern art',
    'Serene mountain lake at sunrise, misty atmosphere, nature photography'
  ]
}

// Edit suggestions
const EDIT_SUGGESTIONS = [
  'Change background to a modern city skyline',
  'Make the lighting warmer and more dramatic',
  'Remove all background distractions',
  'Convert to black and white with high contrast',
  'Add a soft bokeh effect to the background',
  'Change the color scheme to blue and orange tones',
  'Make it look like a vintage film photograph',
  'Add subtle lens flare effect'
]

export default function ImageEditorPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  
  // Generation state
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('none')
  const [selectedModel, setSelectedModel] = useState('nano-banana')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  
  // Edit state
  const [editPrompt, setEditPrompt] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  
  // Fusion state
  const [fusionImages, setFusionImages] = useState([])
  const [fusionPrompt, setFusionPrompt] = useState('')
  
  // Output state
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageHistory, setImageHistory] = useState([])
  
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
          { id: Date.now(), url: data.imageUrl, prompt, type: 'generated' },
          ...prev.slice(0, 19)
        ])
        toast.success('Image generated successfully!')
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
        toast.success('Image edited successfully!')
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
        toast.success('Images fused successfully!')
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

  // Handle file upload for editing
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
    }
    reader.readAsDataURL(file)
  }

  // Handle fusion image upload
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

  // Remove fusion image
  const removeFusionImage = (id) => {
    setFusionImages(prev => prev.filter(img => img.id !== id))
  }

  // Download image
  const downloadImage = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-image-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded!')
  }

  // Copy image to clipboard
  const copyImage = async () => {
    if (!generatedImage) return
    
    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      toast.success('Image copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy image')
    }
  }

  // Use generated image for editing
  const useForEditing = () => {
    if (!generatedImage) return
    setUploadedImage(generatedImage)
    setActiveTab('edit')
    toast.info('Image loaded for editing')
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Image Editor</h1>
              <p className="text-white/80 text-sm">Generate, edit & combine images with Nano Banana AI</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className="bg-white/20 hover:bg-white/30">✨ Text-to-Image</Badge>
            <Badge className="bg-white/20 hover:bg-white/30">🎨 Style Presets</Badge>
            <Badge className="bg-white/20 hover:bg-white/30">✏️ Natural Language Editing</Badge>
            <Badge className="bg-white/20 hover:bg-white/30">🔀 Multi-Image Fusion</Badge>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-4">
          {/* Model Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={selectedModel === 'nano-banana' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('nano-banana')}
                  className="flex-1"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Nano Banana
                </Button>
                <Button
                  variant={selectedModel === 'nano-banana-pro' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel('nano-banana-pro')}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Pro
                  <Badge className="ml-2 text-[10px]" variant="secondary">HD</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="generate" className="text-xs">
                    <Camera className="h-3 w-3 mr-1" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="text-xs">
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="fuse" className="text-xs">
                    <Combine className="h-3 w-3 mr-1" />
                    Fuse
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-4">
                {/* Generate Tab */}
                <TabsContent value="generate" className="mt-0 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Prompt</Label>
                    <Textarea
                      placeholder="Describe the image you want to create..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-1.5 min-h-[100px]"
                    />
                  </div>
                  
                  {/* Style Presets */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Style Preset</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {STYLE_PRESETS.slice(0, 12).map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`p-2 rounded-lg border text-center transition-all hover:scale-105 ${
                            selectedStyle === style.id 
                              ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          title={style.description}
                        >
                          <span className="text-lg">{style.icon}</span>
                          <p className="text-[10px] mt-1 truncate">{style.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Aspect Ratio */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
                    <div className="flex gap-2 flex-wrap">
                      {ASPECT_RATIOS.map((ar) => (
                        <Button
                          key={ar.id}
                          variant={aspectRatio === ar.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAspectRatio(ar.id)}
                          title={ar.description}
                        >
                          {ar.icon} {ar.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Prompt Suggestions */}
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Quick Ideas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_SUGGESTIONS.general.map((suggestion, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => setPrompt(suggestion)}
                        >
                          {suggestion.slice(0, 30)}...
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                {/* Edit Tab */}
                <TabsContent value="edit" className="mt-0 space-y-4">
                  {/* Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadedImage ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {uploadedImage ? (
                      <div className="relative">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedImage(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WebP supported</p>
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
                    <Label className="text-sm font-medium">Edit Instructions</Label>
                    <Textarea
                      placeholder="Describe how you want to edit the image..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="mt-1.5 min-h-[80px]"
                    />
                  </div>
                  
                  {/* Edit Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {EDIT_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 text-xs"
                        onClick={() => setEditPrompt(suggestion)}
                      >
                        {suggestion.slice(0, 25)}...
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleEdit} 
                    disabled={isLoading || !uploadedImage || !editPrompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        Apply Edit
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                {/* Fuse Tab */}
                <TabsContent value="fuse" className="mt-0 space-y-4">
                  <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 text-sm">
                    <p className="font-medium text-violet-800 dark:text-violet-200">Multi-Image Fusion</p>
                    <p className="text-xs text-violet-600 dark:text-violet-300">
                      Upload 2-14 images and describe how to combine them
                    </p>
                  </div>
                  
                  {/* Fusion Images Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {fusionImages.map((img) => (
                      <div key={img.id} className="relative aspect-square">
                        <img 
                          src={img.data} 
                          alt="Fusion" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 -right-1 h-5 w-5"
                          onClick={() => removeFusionImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {fusionImages.length < 14 && (
                      <button
                        onClick={() => fusionInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors"
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
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
                    <Label className="text-sm font-medium">Fusion Instructions</Label>
                    <Textarea
                      placeholder="Describe how to combine these images..."
                      value={fusionPrompt}
                      onChange={(e) => setFusionPrompt(e.target.value)}
                      className="mt-1.5 min-h-[80px]"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleFuse} 
                    disabled={isLoading || fusionImages.length < 2 || !fusionPrompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fusing...
                      </>
                    ) : (
                      <>
                        <Combine className="h-4 w-4 mr-2" />
                        Fuse Images ({fusionImages.length}/14)
                      </>
                    )}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-4">
          {/* Generated Image Display */}
          <Card className="min-h-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Result
                </span>
                {generatedImage && (
                  <div className="flex gap-1">
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="relative">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-sm">Your generated image will appear here</p>
                  <p className="text-xs mt-1">Enter a prompt and click Generate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {imageHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Recent ({imageHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {imageHistory.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedImage(item.url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
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
          <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-violet-200 dark:border-violet-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-violet-800 dark:text-violet-200">
                <Lightbulb className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-violet-700 dark:text-violet-300">
              <p>• <strong>Be specific</strong> about subjects, lighting, and composition</p>
              <p>• <strong>Use style presets</strong> for consistent results</p>
              <p>• <strong>For editing</strong>, give clear instructions like "remove", "add", "change"</p>
              <p>• <strong>Pro model</strong> works best for complex multi-image fusion</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
