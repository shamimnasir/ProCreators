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

// High-CTR Style presets - Inspired by top YouTubers (MrBeast, Mark Rober, BlackPink)
const THUMBNAIL_STYLES = [
  { 
    id: 'high-ctr', 
    name: 'High CTR', 
    icon: '🎯',
    description: 'MrBeast style - Maximum clicks',
    colors: 'Bold, Saturated, Electric',
    promptModifier: 'ULTRA VIBRANT saturated colors, electric blue and hot pink and bright yellow color explosion, dramatic rim lighting with colored gels, bold visual impact like MrBeast thumbnails, dynamic diagonal composition, eye-popping contrast, glossy professional finish'
  },
  { 
    id: 'drama', 
    name: 'Drama', 
    icon: '🔥',
    description: 'Mark Rober style - Explosive drama',
    colors: 'Fire, Orange, Explosion',
    promptModifier: 'EXPLOSIVE dramatic background with fire orange and red gradients, cinematic lighting, sparks and energy effects, bold dramatic shadows, intense visual storytelling like Mark Rober science thumbnails, dynamic action composition'
  },
  { 
    id: 'news', 
    name: 'News/Info', 
    icon: '📰',
    description: 'Clean professional breaking news',
    colors: 'Red, White, Bold',
    promptModifier: 'BOLD red and white color scheme, clean professional layout, breaking news energy, spotlight effect, strong visual hierarchy, sharp shadows, modern broadcast style'
  },
  { 
    id: 'educational', 
    name: 'Educational', 
    icon: '📚',
    description: 'Bright engaging learning style',
    colors: 'Bright, Colorful, Fun',
    promptModifier: 'BRIGHT cheerful colors with teal and orange and purple accents, fun engaging educational style, clean bold composition, friendly professional look, colorful gradient backgrounds like top education channels'
  },
  { 
    id: 'gaming', 
    name: 'Gaming', 
    icon: '🎮',
    description: 'Neon cyberpunk gaming aesthetic',
    colors: 'Neon Pink, Electric Blue, Purple',
    promptModifier: 'NEON CYBERPUNK aesthetic with electric blue and hot pink and purple glow effects, dark background with dramatic colored lighting, gaming energy, RGB light trails, bold futuristic style'
  },
  { 
    id: 'lifestyle', 
    name: 'Lifestyle', 
    icon: '✨',
    description: 'BlackPink K-pop style glamour',
    colors: 'Pink, Gold, Glamorous',
    promptModifier: 'GLAMOROUS K-pop aesthetic with hot pink and rose gold and black color scheme, sparkle effects, luxury fashion style, beautiful lighting, BlackPink music video inspired, stunning visual impact'
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

// Language-specific text rendering instructions - AGGRESSIVE NO TEXT POLICY
const getLanguageTextInstructions = (langInfo, text) => {
  if (!langInfo.hasNonLatin) return ''
  
  // Universal aggressive no-text instruction for all non-Latin scripts
  return `

⚠️ CRITICAL TEXT PROHIBITION ⚠️
The user's topic contains ${langInfo.primaryLanguage} script which CANNOT be rendered by AI.
YOU MUST NOT RENDER ANY TEXT IN THIS IMAGE - NO LETTERS, NO WORDS, NO CHARACTERS.
- DO NOT write any ${langInfo.primaryLanguage} text - it will look like garbage
- DO NOT write any English text either - keep the image TEXT-FREE
- Create a PURELY VISUAL thumbnail with NO TEXT WHATSOEVER
- Focus 100% on: dramatic faces, vivid colors, visual icons, arrows, emojis, graphics
- Leave clean space where the user can add their own text later using proper fonts

THIS IS A TEXT-FREE THUMBNAIL. ZERO TEXT. ONLY VISUALS.
`
}

// Generate high-CTR prompt - MrBeast/Top YouTuber Inspired
const generateThumbnailPrompt = (topic, platform, style, includesFace = true, hasCustomFace = false) => {
  const platformConfig = PLATFORMS.find(p => p.id === platform)
  const styleConfig = THUMBNAIL_STYLES.find(s => s.id === style)
  
  // Detect language in topic
  const langInfo = detectLanguage(topic)
  const languageInstructions = getLanguageTextInstructions(langInfo, topic)
  
  // Start with MrBeast-style base prompt
  let basePrompt = `Create an ULTRA HIGH CLICK-THROUGH RATE YouTube thumbnail inspired by MrBeast, Mark Rober, and top viral channels.

STYLE REQUIREMENTS:
- ${styleConfig?.promptModifier || 'ULTRA VIBRANT saturated colors, electric blue and hot pink and bright yellow color explosion, dramatic rim lighting'}
- EXTREMELY SATURATED and BOLD colors - nothing subtle, everything POP
- Professional studio quality, 4K sharp, perfect for ${platformConfig?.resolution || '1280x720'}
- Dynamic diagonal composition with strong visual flow`

  // Add language-specific instructions if non-Latin text detected
  if (languageInstructions) {
    basePrompt += languageInstructions
  } else {
    // For English content, allow minimal bold text
    basePrompt += `
TEXT: Maximum 2-3 BOLD power words only. Large thick sans-serif font with strong drop shadow. Place text in upper-left or center, NEVER bottom-right.`
  }
  
  // Handle face requirements
  if (hasCustomFace) {
    basePrompt += `

FACE/PERSON: The user has provided their own face image. Integrate this person as the main subject with:
- Professional studio lighting on face
- Dramatic colored rim lighting (matching the style colors)
- Eye-catching expression enhancement
- Person should occupy 40-60% of frame on the right side`
  } else if (includesFace) {
    basePrompt += `

FACE/PERSON: Include a human face as the main subject:
- EXAGGERATED shocked/surprised/excited expression with wide eyes and open mouth
- Direct eye contact with camera (breaks fourth wall)
- Close-up occupying 40-60% of frame, positioned on right side
- Professional makeup and lighting
- Dramatic colored rim lighting matching the style`
  }
  
  // Background and composition
  basePrompt += `

BACKGROUND:
- NEVER plain solid colors - always dynamic gradients, patterns, or scenes
- Bold color gradients (red-to-yellow, blue-to-purple, pink-to-orange)
- Can include: burst effects, light rays, sparkles, energy effects
- Depth with bokeh or motion blur on background elements

COMPOSITION:
- Rule of thirds with main subject on right
- Clear visual hierarchy
- High contrast between subject and background
- Professional thumbnail that looks like it cost $10,000 to make`
  
  // Topic context
  if (topic) {
    if (langInfo.hasNonLatin) {
      basePrompt += `

VISUAL CONCEPT (NO TEXT): The thumbnail should visually represent this concept through imagery, expressions, and visual metaphors: "${topic}"
Use icons, arrows, visual cues - but ABSOLUTELY NO TEXT of any kind.`
    } else {
      basePrompt += `

TOPIC: ${topic}`
    }
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
  
  // Custom face upload state
  const [customFace, setCustomFace] = useState(null)
  const [useCustomFace, setUseCustomFace] = useState(false)
  const customFaceInputRef = useRef(null)
  
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
  
  // Detect language in topic for UI feedback
  const topicLangInfo = detectLanguage(topic)

  // Handle custom face upload
  const handleCustomFaceUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setCustomFace(event.target.result)
      setUseCustomFace(true)
      setIncludeFace(true)
      toast.success('Your face image uploaded! It will be used in the thumbnail.')
    }
    reader.readAsDataURL(file)
  }

  // Handle AI thumbnail generation
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a video topic or title')
      return
    }
    
    setIsLoading(true)
    try {
      const hasCustomFaceImage = useCustomFace && customFace
      const prompt = generateThumbnailPrompt(topic, selectedPlatform, selectedStyle, includeFace, hasCustomFaceImage)
      
      // If using custom face, send as edit request to blend face with generated background
      if (hasCustomFaceImage) {
        // First generate the background/scene
        const bgPrompt = generateThumbnailPrompt(topic, selectedPlatform, selectedStyle, false, false) + '\nCreate this as a BACKGROUND SCENE only, with empty space on the right side for a person to be added.'
        
        const bgResponse = await fetch('/api/image-editor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            prompt: bgPrompt,
            model: selectedModel,
            style: selectedStyle,
            aspectRatio: currentPlatform.aspectRatio
          })
        })
        
        const bgData = await bgResponse.json()
        
        if (bgData.success) {
          // Now fuse the custom face with the background
          const fuseResponse = await fetch('/api/image-editor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'fuse',
              images: [
                { data: bgData.imageUrl, mimeType: 'image/png' },
                { data: customFace, mimeType: 'image/png' }
              ],
              fusionPrompt: `Combine these images into a professional YouTube thumbnail. Place the person from the second image on the right side of the first image (the background). Make sure the person is well-lit and blends naturally with the vibrant background. Apply dramatic rim lighting to the person. The person should occupy about 40-50% of the frame. Professional composite result.`,
              model: 'nano-banana-pro'
            })
          })
          
          const fuseData = await fuseResponse.json()
          
          if (fuseData.success) {
            setGeneratedThumbnail(fuseData.imageUrl)
            setThumbnailHistory(prev => [
              { id: Date.now(), url: fuseData.imageUrl, topic, platform: selectedPlatform },
              ...prev.slice(0, 9)
            ])
            toast.success('Thumbnail with your face generated!')
          } else {
            // Fallback to just the background
            setGeneratedThumbnail(bgData.imageUrl)
            toast.warning('Could not blend face - showing background. Try the Upload & Edit tab.')
          }
        } else {
          toast.error(bgData.error || 'Failed to generate thumbnail')
        }
      } else {
        // Standard generation without custom face
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
      
      // Detect language in overlay text
      const langInfo = overlayText ? detectLanguage(overlayText) : { hasNonLatin: false }
      
      let editPrompt = `Transform this image into a high-CTR thumbnail. Apply ${styleConfig?.promptModifier || 'vibrant colors and high contrast'}. Make it attention-grabbing for ${currentPlatform.name}.`
      
      if (overlayText) {
        if (langInfo.hasNonLatin) {
          // For non-Latin text, use visual storytelling approach
          editPrompt += ` The thumbnail should visually represent the concept: "${overlayText}" - Use visual elements, arrows, icons rather than attempting to render ${langInfo.primaryLanguage} text which may appear garbled.`
        } else {
          editPrompt += ` The thumbnail should visually suggest: "${overlayText}"`
        }
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
                    
                    {/* Language Detection Warning */}
                    {topicLangInfo.hasNonLatin && (
                      <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 text-lg">🌐</span>
                          <div className="text-xs">
                            <p className="font-semibold text-amber-800 dark:text-amber-200">
                              {topicLangInfo.primaryLanguage} text detected
                            </p>
                            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                              AI will generate a visual concept instead of text. You can add {topicLangInfo.primaryLanguage} text using an editor later for best results.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
              <p>• <strong>3 words maximum</strong> - power words like NEVER, STOP</p>
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
