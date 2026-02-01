'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { 
  Wand2, Upload, Download, ImageIcon, Type, Sparkles, RefreshCw,
  Camera, Zap, Target, Eye, Palette, Layout, X, Check, Copy,
  Youtube, Instagram, Facebook, Twitter, Linkedin, MonitorPlay,
  Plus, Trash2, Move, Bold, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react'

// Bengali-friendly fonts available in most systems
const TEXT_FONTS = [
  { id: 'impact', name: 'Impact', css: 'Impact, sans-serif', style: 'Bold YouTube' },
  { id: 'arial-black', name: 'Arial Black', css: '"Arial Black", sans-serif', style: 'Bold Clean' },
  { id: 'noto-sans-bengali', name: 'Noto Sans Bengali', css: '"Noto Sans Bengali", sans-serif', style: 'Bengali' },
  { id: 'hind-siliguri', name: 'Hind Siliguri', css: '"Hind Siliguri", sans-serif', style: 'Bengali' },
  { id: 'kalpurush', name: 'Kalpurush', css: 'Kalpurush, "Noto Sans Bengali", sans-serif', style: 'Bengali' },
  { id: 'roboto', name: 'Roboto', css: 'Roboto, sans-serif', style: 'Modern' },
  { id: 'oswald', name: 'Oswald', css: 'Oswald, sans-serif', style: 'Condensed' },
  { id: 'bebas', name: 'Bebas Neue', css: '"Bebas Neue", sans-serif', style: 'Display' },
]

// Preset text styles
const TEXT_PRESETS = [
  { id: 'youtube-yellow', name: 'YouTube Yellow', color: '#FFFF00', outline: '#000000', outlineWidth: 4 },
  { id: 'youtube-white', name: 'YouTube White', color: '#FFFFFF', outline: '#000000', outlineWidth: 4 },
  { id: 'youtube-red', name: 'YouTube Red', color: '#FF0000', outline: '#FFFFFF', outlineWidth: 3 },
  { id: 'gold-gradient', name: 'Gold', color: '#FFD700', outline: '#8B4513', outlineWidth: 3 },
  { id: 'neon-blue', name: 'Neon Blue', color: '#00FFFF', outline: '#000080', outlineWidth: 3 },
  { id: 'fire-orange', name: 'Fire Orange', color: '#FF6600', outline: '#000000', outlineWidth: 4 },
]

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

// High-CTR Style presets - 2025/2026 YouTube Best Practices with Color Psychology
const THUMBNAIL_STYLES = [
  { 
    id: 'blue-orange', 
    name: 'Tech/Education', 
    icon: '🔵',
    description: 'Blue + Orange complementary pair',
    colors: 'Blue, Orange, White',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Blue+Orange Complementary):
BACKGROUND: Deep DARK BLUE (#001133) to BLACK gradient as base. Add GLOWING ORANGE (#FF6600) accent elements in foreground.
LIGHTING: Dramatic orange rim light on subject from one side, cool blue fill light from other side.
EFFECTS: Subtle blue and orange lens flares, soft glow around bright elements.
COLORS: Limit to 3 colors - dark blue background, vibrant orange accents, white highlights.
STYLE: High-contrast, dark moody background with bright glowing foreground elements. Professional tech/education feel.`
  },
  { 
    id: 'purple-yellow', 
    name: 'Creative/Fun', 
    icon: '🟣',
    description: 'Purple + Yellow complementary pair',
    colors: 'Purple, Yellow, White',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Purple+Yellow Complementary):
BACKGROUND: Deep DARK PURPLE (#1a0033) to BLACK gradient as base. Add GLOWING YELLOW (#FFD700) accent elements.
LIGHTING: Dramatic yellow rim light creating glow effect, purple ambient fill.
EFFECTS: Sparkles, subtle magic/creative energy particles, soft glow halos.
COLORS: Limit to 3 colors - dark purple background, bright yellow accents, white text.
STYLE: High-contrast, mysterious dark background with eye-catching yellow highlights. Creative/educational feel.`
  },
  { 
    id: 'red-urgency', 
    name: 'Urgency/Action', 
    icon: '🔴',
    description: 'Warm colors for excitement',
    colors: 'Red, Orange, Yellow',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Warm Urgency Colors):
BACKGROUND: Deep DARK RED (#330000) to BLACK gradient as base. Add GLOWING ORANGE and YELLOW accent elements.
LIGHTING: Dramatic warm rim lighting (orange/red glow) creating urgency and excitement.
EFFECTS: Subtle fire-like glow, energy particles, dramatic shadows.
COLORS: Limit to 3 warm colors - dark red/black background, orange mid-tones, yellow highlights.
STYLE: High-contrast, dark dramatic background with hot glowing elements. Creates urgency and excitement.`
  },
  { 
    id: 'green-trust', 
    name: 'Money/Success', 
    icon: '💰',
    description: 'Green + Gold for trust & success',
    colors: 'Green, Gold, Black',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Trust & Success Colors):
BACKGROUND: Deep DARK GREEN (#002200) to BLACK gradient as base. Add GLOWING GOLD (#FFD700) accent elements.
LIGHTING: Golden rim light suggesting wealth/success, green ambient glow.
EFFECTS: Subtle sparkle effects, luxurious shine, professional polish.
COLORS: Limit to 3 colors - dark green/black background, gold accents, white highlights.
STYLE: High-contrast, sophisticated dark background with premium gold highlights. Finance/success feel.`
  },
  { 
    id: 'cyan-magenta', 
    name: 'Gaming/Neon', 
    icon: '🎮',
    description: 'Cyan + Magenta neon aesthetic',
    colors: 'Cyan, Magenta, Black',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Neon Gaming Aesthetic):
BACKGROUND: Pure BLACK (#000000) as base. Add GLOWING CYAN (#00FFFF) and MAGENTA (#FF00FF) neon accents.
LIGHTING: Dramatic neon rim lighting - cyan on one side, magenta on other.
EFFECTS: Neon glow trails, RGB light effects, cyberpunk energy.
COLORS: Limit to 3 colors - pure black background, neon cyan and magenta.
STYLE: High-contrast, dark black background with vibrant neon glowing elements. Gaming/tech aesthetic.`
  },
  { 
    id: 'split-compare', 
    name: 'Before/After', 
    icon: '⚡',
    description: 'Split comparison style',
    colors: 'Blue vs Red split',
    promptModifier: `PROFESSIONAL HIGH-CTR THUMBNAIL (Before/After Split):
BACKGROUND: DIAGONAL SPLIT - left side DARK BLUE (#001144), right side DARK RED (#330000).
DIVIDER: Glowing white/yellow lightning bolt or energy crack down the middle.
LIGHTING: Blue-tinted lighting on left, red/warm lighting on right - clear contrast.
EFFECTS: Each side has subtle glow emanating from center divide.
COLORS: Blue tones on left, red/warm tones on right, white divider.
STYLE: High-contrast split screen for dramatic comparisons or transformations.`
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
// For non-Latin scripts: Use ENGLISH power words instead (AI can render English properly)
const getLanguageTextInstructions = (langInfo, topic) => {
  if (!langInfo.hasNonLatin) return ''
  
  // Extract any English words/numbers from the topic
  const englishWords = topic.match(/[a-zA-Z]+/g) || []
  const numbers = topic.match(/\d+/g) || []
  
  let textSuggestions = ''
  if (englishWords.length > 0) {
    textSuggestions = englishWords.slice(0, 3).map(w => w.toUpperCase()).join(' ')
  }
  if (numbers.length > 0) {
    textSuggestions = numbers[0] + (textSuggestions ? ' ' + textSuggestions : '')
  }
  if (!textSuggestions) {
    textSuggestions = 'WOW or AMAZING or NEW'
  }
  
  return `

⚠️ NON-LATIN TEXT HANDLING:
The topic contains ${langInfo.primaryLanguage} characters which CANNOT be rendered by AI image generation.
DO NOT render any ${langInfo.primaryLanguage} script - it will appear as garbage/broken characters.

INSTEAD - ADD ENGLISH TEXT:
- Use bold ENGLISH words: ${textSuggestions}
- Maximum 3-5 English words or under 20 characters
- BRIGHT YELLOW text with thick BLACK outline (most visible)
- Large bold Impact or Arial Black style font
- Position text in CENTER-LEFT or LOWER-LEFT area (NOT top-left, looks amateur)
`
}

// Generate high-CTR prompt - Professional YouTube Thumbnail
const generateThumbnailPrompt = (topic, platform, style, includesFace = true, hasCustomFace = false) => {
  const platformConfig = PLATFORMS.find(p => p.id === platform)
  const styleConfig = THUMBNAIL_STYLES.find(s => s.id === style)
  
  // Detect language in topic
  const langInfo = detectLanguage(topic)
  const languageInstructions = getLanguageTextInstructions(langInfo, topic)
  
  // Professional thumbnail prompt
  let basePrompt = `Create a PROFESSIONAL high click-through rate YouTube thumbnail.

CRITICAL RULES - READ CAREFULLY:
1. NO random icons, emojis, or scattered graphics - keep it CLEAN and PROFESSIONAL
2. NO childish cartoon elements or clip art
3. Background should be a smooth, clean gradient - NOT cluttered with random objects
4. Focus on: clean composition, professional lighting, bold but tasteful colors

BACKGROUND STYLE:
${styleConfig?.promptModifier || 'clean professional gradient background, smooth color transition, no clutter'}

QUALITY:
- Professional studio photography quality
- Sharp, 4K resolution, perfect for ${platformConfig?.resolution || '1280x720'}
- Clean, uncluttered composition`

  // TEXT GUIDELINES - Following user's best practices
  if (languageInstructions) {
    basePrompt += languageInstructions
  } else {
    basePrompt += `

TEXT REQUIREMENTS (IMPORTANT):
- Add 3-5 bold power words (under 20 characters total)
- Use LARGE, BOLD sans-serif font (Impact, Arial Black style)
- HIGH CONTRAST: Yellow text with black outline OR white text with black outline
- Position text in CENTER-LEFT or LOWER-LEFT area of the frame (NOT top-left, looks amateur)
- Text should be vertically centered or slightly below center on the LEFT side
- NEVER place text in bottom-right corner (YouTube timestamp covers it)
- Text should complement the visual, not repeat the full title
- Use emotional or numbered words for curiosity (e.g., "5 TIPS", "SHOCKING", "NEW")`
  }
  
  // Handle face requirements
  if (hasCustomFace) {
    basePrompt += `

PERSON/FACE:
- User's face will be composited - create clean space on right side
- Background should complement a person positioned on the right
- Professional lighting setup for face integration`
  } else if (includesFace) {
    basePrompt += `

PERSON/FACE:
- Include ONE person with expressive face (surprised, excited, or shocked expression)
- Face should be well-lit with professional studio lighting
- Person positioned on RIGHT side of frame, occupying 40-50% of image
- Direct eye contact with camera
- Clean cutout-ready edges around person`
  }
  
  // Background specifics
  basePrompt += `

COMPOSITION:
- Clean gradient background (NO scattered icons or random elements)
- Smooth color transitions
- Professional depth with subtle bokeh if needed
- Rule of thirds composition
- High contrast between text/subject and background
- This should look like a $10,000 professional thumbnail, NOT a cheap amateur one`
  
  // Topic context
  if (topic) {
    const cleanTopic = langInfo.hasNonLatin ? 
      (topic.match(/[a-zA-Z0-9\s]+/g) || []).join(' ').trim() || 'engaging content' : 
      topic
    
    basePrompt += `

TOPIC/THEME: "${cleanTopic}"
Create visuals that represent this concept professionally.`
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
  
  // Text Overlay Editor state
  const [textLayers, setTextLayers] = useState([])
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  const [editorImage, setEditorImage] = useState(null)
  const canvasRef = useRef(null)
  const editorInputRef = useRef(null)
  
  const fileInputRef = useRef(null)

  // Get current platform config
  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0]
  
  // Detect language in topic for UI feedback
  const topicLangInfo = detectLanguage(topic)

  // Add new text layer
  const addTextLayer = () => {
    const newLayer = {
      id: Date.now(),
      text: 'Your Text Here',
      x: 50,
      y: 50,
      fontSize: 48,
      fontFamily: 'impact',
      color: '#FFFF00',
      outlineColor: '#000000',
      outlineWidth: 4,
      align: 'center',
      bold: true,
    }
    setTextLayers(prev => [...prev, newLayer])
    setSelectedLayerId(newLayer.id)
  }

  // Update text layer
  const updateTextLayer = (id, updates) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ))
  }

  // Delete text layer
  const deleteTextLayer = (id) => {
    setTextLayers(prev => prev.filter(layer => layer.id !== id))
    if (selectedLayerId === id) {
      setSelectedLayerId(null)
    }
  }

  // Apply preset to selected layer
  const applyPreset = (preset) => {
    if (!selectedLayerId) return
    updateTextLayer(selectedLayerId, {
      color: preset.color,
      outlineColor: preset.outline,
      outlineWidth: preset.outlineWidth,
    })
  }

  // Load image into editor
  const loadImageToEditor = (imageUrl) => {
    setEditorImage(imageUrl)
    setActiveTab('text-editor')
    toast.success('Image loaded into Text Editor!')
  }

  // Handle editor image upload
  const handleEditorImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setEditorImage(event.target.result)
      toast.success('Image loaded!')
    }
    reader.readAsDataURL(file)
  }

  // Export canvas with text overlays
  const exportWithText = useCallback(() => {
    if (!editorImage) {
      toast.error('Please load an image first')
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw base image
      ctx.drawImage(img, 0, 0)
      
      // Draw text layers
      textLayers.forEach(layer => {
        const font = TEXT_FONTS.find(f => f.id === layer.fontFamily)
        ctx.font = `${layer.bold ? 'bold' : 'normal'} ${layer.fontSize * (img.width / 400)}px ${font?.css || 'Impact'}`
        ctx.textAlign = layer.align
        ctx.textBaseline = 'middle'
        
        const x = (layer.x / 100) * img.width
        const y = (layer.y / 100) * img.height
        
        // Draw outline
        if (layer.outlineWidth > 0) {
          ctx.strokeStyle = layer.outlineColor
          ctx.lineWidth = layer.outlineWidth * (img.width / 400)
          ctx.lineJoin = 'round'
          ctx.strokeText(layer.text, x, y)
        }
        
        // Draw fill
        ctx.fillStyle = layer.color
        ctx.fillText(layer.text, x, y)
      })
      
      // Download
      const link = document.createElement('a')
      link.download = `thumbnail-with-text-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Thumbnail exported with text!')
    }
    
    img.src = editorImage
  }, [editorImage, textLayers])

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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent py-3 px-4"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="text-editor" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent py-3 px-4"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text Editor
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent py-3 px-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
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
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 text-lg">💡</span>
                          <div className="text-xs">
                            <p className="font-semibold text-blue-800 dark:text-blue-200">
                              {topicLangInfo.primaryLanguage} detected - Using English text
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                              AI will use ENGLISH power words (from your title) for better rendering. You can replace with {topicLangInfo.primaryLanguage} text in an editor afterward.
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
                  
                  {/* Face Options - Enhanced */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">Face in Thumbnail</Label>
                    
                    {/* Include face toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Include human face (gets +921K views)</span>
                      </div>
                      <Switch
                        checked={includeFace}
                        onCheckedChange={(checked) => {
                          setIncludeFace(checked)
                          if (!checked) {
                            setUseCustomFace(false)
                          }
                        }}
                      />
                    </div>
                    
                    {/* Custom face upload - only show when face is included */}
                    {includeFace && (
                      <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {customFace ? (
                                <div className="relative">
                                  <img 
                                    src={customFace} 
                                    alt="Your face" 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-violet-400"
                                  />
                                  <button
                                    onClick={() => {
                                      setCustomFace(null)
                                      setUseCustomFace(false)
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center">
                                  <Camera className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
                                {customFace ? 'Your Face Uploaded' : 'Use Your Own Face'}
                              </p>
                              <p className="text-xs text-violet-600 dark:text-violet-400">
                                {customFace ? 'Will be used in thumbnail' : 'Upload a photo of yourself'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={customFace ? "outline" : "default"}
                            size="sm"
                            onClick={() => customFaceInputRef.current?.click()}
                            className={customFace ? '' : 'bg-violet-600 hover:bg-violet-700'}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {customFace ? 'Change' : 'Upload'}
                          </Button>
                        </div>
                        <input
                          ref={customFaceInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCustomFaceUpload}
                          className="hidden"
                        />
                        {customFace && (
                          <div className="mt-2 flex items-center gap-2">
                            <Switch
                              checked={useCustomFace}
                              onCheckedChange={setUseCustomFace}
                              className="data-[state=checked]:bg-violet-600"
                            />
                            <span className="text-xs text-violet-700 dark:text-violet-300">
                              Use my face instead of AI-generated face
                            </span>
                          </div>
                        )}
                      </div>
                    )}
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

                {/* Text Editor Tab */}
                <TabsContent value="text-editor" className="mt-0 space-y-5">
                  {/* Info Banner */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Add Bengali/Custom Text</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Add text overlays with proper font rendering</p>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload/Load */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Base Image</Label>
                    {editorImage ? (
                      <div className="relative">
                        <div className="relative rounded-lg overflow-hidden border-2 border-border">
                          <img src={editorImage} alt="Editor" className="w-full" />
                          {/* Text Layer Preview */}
                          {textLayers.map(layer => {
                            const font = TEXT_FONTS.find(f => f.id === layer.fontFamily)
                            return (
                              <div
                                key={layer.id}
                                onClick={() => setSelectedLayerId(layer.id)}
                                className={`absolute cursor-pointer transition-all ${selectedLayerId === layer.id ? 'ring-2 ring-blue-500' : ''}`}
                                style={{
                                  left: `${layer.x}%`,
                                  top: `${layer.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  fontSize: `${layer.fontSize}px`,
                                  fontFamily: font?.css || 'Impact',
                                  fontWeight: layer.bold ? 'bold' : 'normal',
                                  color: layer.color,
                                  textShadow: `
                                    -${layer.outlineWidth}px -${layer.outlineWidth}px 0 ${layer.outlineColor},
                                    ${layer.outlineWidth}px -${layer.outlineWidth}px 0 ${layer.outlineColor},
                                    -${layer.outlineWidth}px ${layer.outlineWidth}px 0 ${layer.outlineColor},
                                    ${layer.outlineWidth}px ${layer.outlineWidth}px 0 ${layer.outlineColor}
                                  `,
                                  textAlign: layer.align,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {layer.text}
                              </div>
                            )
                          })}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setEditorImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          onClick={() => editorInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-all"
                        >
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Upload image to add text</p>
                          <p className="text-xs text-muted-foreground">Or use generated thumbnail</p>
                        </div>
                        {generatedThumbnail && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setEditorImage(generatedThumbnail)}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Use Generated Thumbnail
                          </Button>
                        )}
                      </div>
                    )}
                    <input
                      ref={editorInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditorImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Text Layers */}
                  {editorImage && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Text Layers</Label>
                        <Button size="sm" onClick={addTextLayer}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Text
                        </Button>
                      </div>

                      {/* Layer List */}
                      <div className="space-y-2">
                        {textLayers.map(layer => (
                          <div
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedLayerId === layer.id 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                                : 'border-border hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate flex-1">{layer.text}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteTextLayer(layer.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {textLayers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Click Add Text to create a text layer
                          </p>
                        )}
                      </div>

                      {/* Selected Layer Editor */}
                      {selectedLayerId && (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <Label className="text-sm font-semibold">Edit Selected Text</Label>
                          
                          {/* Text Input */}
                          <Input
                            value={textLayers.find(l => l.id === selectedLayerId)?.text || ''}
                            onChange={(e) => updateTextLayer(selectedLayerId, { text: e.target.value })}
                            placeholder="Enter your text..."
                            className="text-lg"
                          />

                          {/* Font Selection */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">Font</Label>
                              <Select
                                value={textLayers.find(l => l.id === selectedLayerId)?.fontFamily}
                                onValueChange={(v) => updateTextLayer(selectedLayerId, { fontFamily: v })}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEXT_FONTS.map(font => (
                                    <SelectItem key={font.id} value={font.id}>
                                      <span style={{ fontFamily: font.css }}>{font.name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">({font.style})</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Size: {textLayers.find(l => l.id === selectedLayerId)?.fontSize}px</Label>
                              <Slider
                                value={[textLayers.find(l => l.id === selectedLayerId)?.fontSize || 48]}
                                onValueChange={([v]) => updateTextLayer(selectedLayerId, { fontSize: v })}
                                min={16}
                                max={120}
                                step={2}
                              />
                            </div>
                          </div>

                          {/* Color Presets */}
                          <div>
                            <Label className="text-xs mb-2 block">Color Presets</Label>
                            <div className="flex gap-2 flex-wrap">
                              {TEXT_PRESETS.map(preset => (
                                <button
                                  key={preset.id}
                                  onClick={() => applyPreset(preset)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-border hover:scale-105 transition-transform"
                                  style={{
                                    color: preset.color,
                                    textShadow: `1px 1px 0 ${preset.outline}, -1px -1px 0 ${preset.outline}, 1px -1px 0 ${preset.outline}, -1px 1px 0 ${preset.outline}`,
                                  }}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">X Position: {textLayers.find(l => l.id === selectedLayerId)?.x}%</Label>
                              <Slider
                                value={[textLayers.find(l => l.id === selectedLayerId)?.x || 50]}
                                onValueChange={([v]) => updateTextLayer(selectedLayerId, { x: v })}
                                min={0}
                                max={100}
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Y Position: {textLayers.find(l => l.id === selectedLayerId)?.y}%</Label>
                              <Slider
                                value={[textLayers.find(l => l.id === selectedLayerId)?.y || 50]}
                                onValueChange={([v]) => updateTextLayer(selectedLayerId, { y: v })}
                                min={0}
                                max={100}
                              />
                            </div>
                          </div>

                          {/* Custom Colors */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs mb-1 block">Fill Color</Label>
                              <input
                                type="color"
                                value={textLayers.find(l => l.id === selectedLayerId)?.color || '#FFFF00'}
                                onChange={(e) => updateTextLayer(selectedLayerId, { color: e.target.value })}
                                className="w-full h-9 rounded cursor-pointer"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Outline Color</Label>
                              <input
                                type="color"
                                value={textLayers.find(l => l.id === selectedLayerId)?.outlineColor || '#000000'}
                                onChange={(e) => updateTextLayer(selectedLayerId, { outlineColor: e.target.value })}
                                className="w-full h-9 rounded cursor-pointer"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Outline: {textLayers.find(l => l.id === selectedLayerId)?.outlineWidth}px</Label>
                              <Slider
                                value={[textLayers.find(l => l.id === selectedLayerId)?.outlineWidth || 4]}
                                onValueChange={([v]) => updateTextLayer(selectedLayerId, { outlineWidth: v })}
                                min={0}
                                max={10}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Export Button */}
                      <Button 
                        onClick={exportWithText}
                        disabled={textLayers.length === 0}
                        className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        size="lg"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Export with Text
                      </Button>
                    </>
                  )}
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Result
                  {generatedThumbnail && (
                    <Badge variant="outline" className="ml-2">
                      {currentPlatform.aspectRatio}
                    </Badge>
                  )}
                </CardTitle>
                {generatedThumbnail && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={downloadThumbnail}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`relative rounded-xl overflow-hidden bg-muted ${
                currentPlatform.aspectRatio === '16:9' ? 'aspect-video' :
                currentPlatform.aspectRatio === '1:1' ? 'aspect-square' :
                currentPlatform.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                'aspect-video'
              }`}>
                {generatedThumbnail ? (
                  <img 
                    src={generatedThumbnail} 
                    alt="Generated thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-3">
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">Your thumbnail will appear here</p>
                    <p className="text-xs opacity-70">Optimized for high click-through rates</p>
                  </div>
                )}
              </div>
              {generatedThumbnail && (
                <div className="mt-3 space-y-2">
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
                  {/* Prominent Add Text Overlay Button */}
                  <Button
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => loadImageToEditor(generatedThumbnail)}
                  >
                    <Type className="h-5 w-5 mr-2" />
                    Add Bengali/Custom Text
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Add properly rendered Bengali or custom text overlay
                  </p>
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
                  {thumbnailHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGeneratedThumbnail(item.url)}
                      className="aspect-video rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTR Tips Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
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
               