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
  Zap, Target, X, Copy, Headphones, Mic, Radio, Music,
  Layers, Play, Volume2
, Wand2 , Zap } from 'lucide-react'

// Platform specifications
const PLATFORM_SPECS = [
  { 
    id: 'spotify', 
    name: 'Spotify', 
    icon: '🎧',
    resolution: '3000x3000',
    format: 'JPEG/PNG',
    maxSize: '200KB',
    description: 'Spotify podcast cover',
    tips: 'Avoid small text, looks like a 150x150 thumbnail'
  },
  { 
    id: 'apple-podcasts', 
    name: 'Apple Podcasts', 
    icon: '🍎',
    resolution: '3000x3000',
    format: 'JPEG/PNG',
    maxSize: '512KB',
    description: 'Apple Podcasts artwork',
    tips: 'RGB color space, square format only'
  },
  { 
    id: 'google-podcasts', 
    name: 'Google Podcasts', 
    icon: '🔵',
    resolution: '1400x1400',
    format: 'JPEG/PNG',
    maxSize: '—',
    description: 'Google Podcasts cover',
    tips: 'Minimum 1400x1400 for Google'
  },
  { 
    id: 'youtube-music', 
    name: 'YouTube Music', 
    icon: '📺',
    resolution: '1400x1400',
    format: 'PNG',
    maxSize: '2MB',
    description: 'YouTube Music podcast',
    tips: 'Works for video podcasts too'
  },
  { 
    id: 'amazon-music', 
    name: 'Amazon Music', 
    icon: '📦',
    resolution: '3000x3000',
    format: 'JPEG/PNG',
    maxSize: '—',
    description: 'Amazon Music / Audible',
    tips: 'High resolution required'
  },
  { 
    id: 'soundcloud', 
    name: 'SoundCloud', 
    icon: '☁️',
    resolution: '800x800',
    format: 'JPEG/PNG',
    maxSize: '2MB',
    description: 'SoundCloud track/podcast art',
    tips: 'Supports animated GIFs too'
  },
]

// Podcast genre styles
const GENRE_STYLES = [
  { 
    id: 'interview', 
    name: 'Interview/Talk', 
    icon: '🎙️',
    description: 'Conversational podcasts',
    prompt: 'Professional podcast cover design for interview/talk show format. Clean microphone imagery, warm inviting colors, professional studio aesthetic, conversation-focused visual elements, high-quality podcast artwork'
  },
  { 
    id: 'true-crime', 
    name: 'True Crime', 
    icon: '🔍',
    description: 'Mystery & crime stories',
    prompt: 'Dark atmospheric podcast cover for true crime series. Mysterious noir aesthetic, dramatic shadows, crime investigation elements, suspenseful mood, bold typography placeholder, thriller podcast artwork'
  },
  { 
    id: 'comedy', 
    name: 'Comedy', 
    icon: '😂',
    description: 'Humor & entertainment',
    prompt: 'Fun vibrant podcast cover for comedy show. Bright playful colors, energetic design, humorous visual elements, bold fun typography style, entertainment podcast artwork, cheerful mood'
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: '💼',
    description: 'Business & entrepreneurship',
    prompt: 'Professional corporate podcast cover for business show. Clean modern design, success-oriented imagery, professional color palette (blue, gray, gold), premium quality, business podcast artwork'
  },
  { 
    id: 'tech', 
    name: 'Technology', 
    icon: '💻',
    description: 'Tech news & innovation',
    prompt: 'Futuristic tech podcast cover design. Digital aesthetic, circuit patterns, neon accents on dark background, innovative technology feel, modern tech podcast artwork, cyberpunk influences'
  },
  { 
    id: 'wellness', 
    name: 'Health/Wellness', 
    icon: '🧘',
    description: 'Health & mindfulness',
    prompt: 'Calming wellness podcast cover design. Soft natural colors (greens, blues, earth tones), peaceful imagery, zen aesthetic, mindfulness elements, health podcast artwork, serene mood'
  },
  { 
    id: 'storytelling', 
    name: 'Storytelling', 
    icon: '📖',
    description: 'Narrative & fiction',
    prompt: 'Dramatic storytelling podcast cover. Cinematic composition, book-inspired imagery, immersive atmosphere, narrative visual elements, fiction podcast artwork, literary aesthetic'
  },
  { 
    id: 'news', 
    name: 'News/Politics', 
    icon: '📰',
    description: 'Current events & politics',
    prompt: 'Bold authoritative news podcast cover. Strong typography style, journalistic aesthetic, current events visual theme, credible professional look, news podcast artwork'
  },
  { 
    id: 'sports', 
    name: 'Sports', 
    icon: '⚽',
    description: 'Sports commentary',
    prompt: 'Dynamic sports podcast cover design. Athletic energy, bold action imagery, team colors inspiration, competitive spirit, sports podcast artwork, energetic composition'
  },
  { 
    id: 'music', 
    name: 'Music', 
    icon: '🎵',
    description: 'Music discussion & reviews',
    prompt: 'Artistic music podcast cover design. Musical elements (notes, instruments, soundwaves), rhythm-inspired composition, album art aesthetic, music podcast artwork'
  },
  { 
    id: 'education', 
    name: 'Educational', 
    icon: '🎓',
    description: 'Learning & how-to',
    prompt: 'Informative educational podcast cover. Clean organized design, knowledge-focused imagery, academic but approachable aesthetic, educational podcast artwork, learning theme'
  },
  { 
    id: 'culture', 
    name: 'Culture/Society', 
    icon: '🌍',
    description: 'Culture & lifestyle',
    prompt: 'Diverse cultural podcast cover design. Vibrant multicultural elements, social themes, community-focused imagery, inclusive aesthetic, culture podcast artwork'
  },
]

// Visual styles
const VISUAL_STYLES = [
  { id: 'minimal', name: 'Minimal Clean', icon: '⬜', prompt: 'Minimalist clean design with lots of whitespace, simple elegant composition' },
  { id: 'bold', name: 'Bold & Vibrant', icon: '🔥', prompt: 'Bold vibrant colors, high contrast, eye-catching dramatic design' },
  { id: 'dark', name: 'Dark Mode', icon: '🌙', prompt: 'Dark moody background, sophisticated noir aesthetic, neon or gold accents' },
  { id: 'gradient', name: 'Gradient', icon: '🌈', prompt: 'Beautiful smooth gradient background, modern mesh gradient style' },
  { id: 'illustrated', name: 'Illustrated', icon: '🎨', prompt: 'Custom illustration style, artistic hand-drawn aesthetic, unique artwork' },
  { id: 'photo', name: 'Photo-Based', icon: '📸', prompt: 'Professional photography-based design, high-quality photo with overlay text' },
  { id: 'retro', name: 'Retro/Vintage', icon: '📻', prompt: 'Retro vintage aesthetic, nostalgic radio era feel, classic podcast artwork' },
  { id: '3d', name: '3D Render', icon: '🎮', prompt: '3D rendered design elements, modern depth and dimension, premium 3D artwork' },
]

export default function PodcastCoverMakerPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isLoading, setIsLoading] = useState(false)
  
  // Generation state
  const [podcastName, setPodcastName] = useState('')
  const [hostName, setHostName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('spotify')
  const [selectedGenre, setSelectedGenre] = useState('interview')
  const [selectedVisual, setSelectedVisual] = useState('bold')
  const [selectedModel, setSelectedModel] = useState('nano-banana-pro')
  
  // Output state
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageHistory, setImageHistory] = useState([])
  
  // Upload state
  const [uploadedImage, setUploadedImage] = useState(null)
  const [editPrompt, setEditPrompt] = useState('')
  const { checkAndDeduct, refund, complete } = useCredits()
  const fileInputRef = useRef(null)

  // Get current configs
  const currentPlatform = PLATFORM_SPECS.find(p => p.id === selectedPlatform) || PLATFORM_SPECS[0]
  const currentGenre = GENRE_STYLES.find(g => g.id === selectedGenre) || GENRE_STYLES[0]
  const currentVisual = VISUAL_STYLES.find(v => v.id === selectedVisual) || VISUAL_STYLES[0]

  // Generate podcast cover
  const generatePodcastCover = async () => {
    if (!podcastName.trim()) {
      toast.error('Please enter your podcast name')
      return
    }
    
    setIsLoading(true)
    try {
      let prompt = `Create a professional podcast cover artwork for "${podcastName}".

PLATFORM REQUIREMENTS:
- Platform: ${currentPlatform.name}
- Resolution: Square format (${currentPlatform.resolution})
- Optimized for thumbnail visibility at small sizes

GENRE & STYLE:
${currentGenre.prompt}
${currentVisual.prompt}

DESIGN REQUIREMENTS:
- MUST be perfectly SQUARE (1:1 aspect ratio)
- Professional podcast cover artwork quality
- Clear focal point visible at any size
- Brand-ready professional design`

      if (hostName) {
        prompt += `\n- Host: ${hostName} (incorporate if appropriate)`
      }
      if (description) {
        prompt += `\n- Theme: ${description}`
      }
      
      prompt += `\n\nTEXT HANDLING:
- If including podcast name, make it bold and highly readable
- Text should be legible even at 150x150 thumbnail size
- Use high contrast text colors`

      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          model: selectedModel,
          style: selectedGenre,
          aspectRatio: '1:1'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedImage(data.imageUrl)
        setImageHistory(prev => [
          { id: Date.now(), url: data.imageUrl, name: podcastName, genre: selectedGenre },
          ...prev.slice(0, 9)
        ])
        toast.success('Podcast cover generated!')
      } else {
        toast.error(data.error || 'Failed to generate cover')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate podcast cover')
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
      let prompt = editPrompt || `Transform this image into a professional podcast cover for ${currentPlatform.name}. Apply ${currentGenre.prompt}. ${currentVisual.prompt}. Make it square format, professional podcast artwork quality.`
      
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
        toast.success('Podcast cover enhanced!')
      } else {
        toast.error(data.error || 'Failed to enhance cover')
      }
    } catch (error) {
      toast.error('Failed to enhance podcast cover')
    } finally {
      setIsLoading(false)
    }
  }

  // Download image
  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `${podcastName || 'podcast'}-cover-${Date.now()}.png`
    link.click()
    toast.success('Podcast cover downloaded!')
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Headphones className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Podcast Cover Maker
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">Pro</Badge>
                </h1>
                <p className="text-white/80 text-sm">Professional artwork for Spotify, Apple Podcasts & more</p>
              </div>
            </div>
            
            {/* Model Toggle */}
            <div className="hidden md:flex gap-2 bg-white/10 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setSelectedModel('nano-banana')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana' ? 'bg-white text-teal-600' : 'hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Fast
              </button>
              <button
                onClick={() => setSelectedModel('nano-banana-pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === 'nano-banana-pro' ? 'bg-white text-teal-600' : 'hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-1" />
                Pro HD
              </button>
            </div>
          </div>
          
          {/* Platform Icons */}
          <div className="flex flex-wrap gap-3 mt-4">
            {PLATFORM_SPECS.slice(0, 6).map((platform) => (
              <div key={platform.id} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs flex items-center gap-2">
                <span>{platform.icon}</span>
                {platform.name}
              </div>
            ))}
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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent py-3 px-4"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent py-3 px-4"
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
                      {PLATFORM_SPECS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedPlatform === platform.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-lg' 
                              : 'border-border hover:border-teal-300'
                          }`}
                        >
                          <span className="text-xl block mb-0.5">{platform.icon}</span>
                          <span className="text-[8px] font-medium block truncate">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Genre Selection */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Podcast Genre</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {GENRE_STYLES.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => setSelectedGenre(genre.id)}
                          className={`p-2 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                            selectedGenre === genre.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' 
                              : 'border-border hover:border-teal-300'
                          }`}
                          title={genre.description}
                        >
                          <span className="text-lg block mb-0.5">{genre.icon}</span>
                          <span className="text-[8px] font-medium block truncate">{genre.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Style */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Visual Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {VISUAL_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedVisual(style.id)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                            selectedVisual === style.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' 
                              : 'border-border hover:border-teal-300'
                          }`}
                        >
                          {style.icon} {style.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Podcast Details */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Podcast Name *</Label>
                      <Input
                        placeholder="The Daily Talk Show"
                        value={podcastName}
                        onChange={(e) => setPodcastName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Host Name (Optional)</Label>
                      <Input
                        placeholder="John Smith"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Description / Theme</Label>
                    <Textarea
                      placeholder="What's your podcast about? e.g., Weekly conversations about tech startups, entrepreneurship, and innovation..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: {currentPlatform.tips}
                    </p>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex items-center gap-4">
                    <CreditCostBadge toolId="podcast-cover-maker" />
                    <Button 
                      onClick={generatePodcastCover} 
                      disabled={isLoading || !podcastName.trim()}
                      className="flex-1 h-12 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
                          Generate Podcast Cover
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
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20' 
                        : 'border-border hover:border-teal-300'
                    }`}
                  >
                    {uploadedImage ? (
                      <div className="relative inline-block">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="max-h-40 rounded-lg shadow aspect-square object-cover"
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
                        <p className="font-medium">Upload your photo or artwork</p>
                        <p className="text-xs text-muted-foreground">Square images work best</p>
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
                    <div className="grid grid-cols-3 gap-2">
                      {PLATFORM_SPECS.slice(0, 6).map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-2 rounded-lg border-2 text-center ${
                            selectedPlatform === platform.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' 
                              : 'border-border hover:border-teal-300'
                          }`}
                        >
                          <span className="text-lg block">{platform.icon}</span>
                          <span className="text-[8px] font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Enhancement Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {GENRE_STYLES.slice(0, 6).map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => setSelectedGenre(genre.id)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-medium ${
                            selectedGenre === genre.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' 
                              : 'border-border hover:border-teal-300'
                          }`}
                        >
                          {genre.icon} {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Edit Instructions (Optional)</Label>
                    <Textarea
                      placeholder="Add text overlay, enhance colors, make it more professional..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleEditImage} 
                    disabled={isLoading || !uploadedImage}
                    className="w-full h-12 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
                        Create Podcast Cover
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
                  Preview
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
                    {currentGenre.icon} {currentGenre.name}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="relative rounded-xl overflow-hidden bg-muted/30 border aspect-square">
                  <img 
                    src={generatedImage} 
                    alt="Generated Podcast Cover" 
                    className="w-full h-full object-cover"
                  />
                  {/* Play button overlay for preview */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="p-4 bg-white/90 rounded-full">
                      <Play className="h-8 w-8 text-teal-600 fill-teal-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center aspect-square text-muted-foreground bg-muted/30 rounded-xl">
                  <Headphones className="h-12 w-12 opacity-50 mb-3" />
                  <p className="font-medium">Your cover will appear here</p>
                  <p className="text-xs mt-1">Enter details and generate</p>
                </div>
              )}
              
              {/* Size preview */}
              {generatedImage && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border mx-auto mb-1">
                      <img src={generatedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">App icon</span>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-md overflow-hidden border mx-auto mb-1">
                      <img src={generatedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Thumb</span>
                  </div>
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
                  Recent Covers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {imageHistory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedImage(item.url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-teal-500 transition-all"
                    >
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Specs */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-teal-800 dark:text-teal-200">
                <Radio className="h-4 w-4" />
                {currentPlatform.name} Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-teal-700 dark:text-teal-300">
              <p>• <strong>Size:</strong> {currentPlatform.resolution}</p>
              <p>• <strong>Format:</strong> {currentPlatform.format}</p>
              {currentPlatform.maxSize !== '—' && (
                <p>• <strong>Max Size:</strong> {currentPlatform.maxSize}</p>
              )}
              <p>• <strong>Tip:</strong> {currentPlatform.tips}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
