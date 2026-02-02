'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Sparkles, Loader2, Copy, Palette } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const STYLES = [
  { id: 'anime', name: 'Anime/Manga', icon: '🎌', desc: 'Japanese animation style' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎨', desc: 'Fun, stylized look' },
  { id: 'realistic', name: 'Realistic', icon: '📸', desc: 'Photo-realistic style' },
  { id: 'pixel', name: 'Pixel Art', icon: '👾', desc: 'Retro gaming style' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧝', desc: 'Magical, ethereal look' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', desc: 'Futuristic, neon style' },
  { id: 'chibi', name: 'Chibi', icon: '🥺', desc: 'Cute, exaggerated style' },
  { id: 'minimalist', name: 'Minimalist', icon: '◯', desc: 'Simple, clean lines' }
]

const MOODS = [
  { id: 'confident', name: 'Confident', icon: '😎' },
  { id: 'friendly', name: 'Friendly', icon: '😊' },
  { id: 'mysterious', name: 'Mysterious', icon: '🌙' },
  { id: 'fierce', name: 'Fierce', icon: '🔥' },
  { id: 'cute', name: 'Cute', icon: '🥰' },
  { id: 'cool', name: 'Cool', icon: '❄️' },
  { id: 'elegant', name: 'Elegant', icon: '✨' },
  { id: 'playful', name: 'Playful', icon: '🎉' }
]

const COLOR_SCHEMES = [
  { id: 'vibrant', name: 'Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'pastel', name: 'Pastel', colors: ['#FFB5E8', '#B5DEFF', '#BFFCC6'] },
  { id: 'dark', name: 'Dark/Moody', colors: ['#2C3E50', '#8E44AD', '#1ABC9C'] },
  { id: 'warm', name: 'Warm', colors: ['#FF7F50', '#FFD700', '#FF6347'] },
  { id: 'cool', name: 'Cool', colors: ['#00CED1', '#4169E1', '#9370DB'] },
  { id: 'monochrome', name: 'Monochrome', colors: ['#2C3E50', '#7F8C8D', '#BDC3C7'] },
  { id: 'neon', name: 'Neon', colors: ['#FF00FF', '#00FF00', '#00FFFF'] }
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Androgynous', 'Robot/AI', 'Creature']

export default function AvatarCreatorPage() {
  const [style, setStyle] = useState('anime')
  const [mood, setMood] = useState('confident')
  const [colors, setColors] = useState('vibrant')
  const [gender, setGender] = useState('')
  const [accessories, setAccessories] = useState('')
  const [features, setFeatures] = useState('')
  const [generating, setGenerating] = useState(false)
  const [avatar, setAvatar] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'avatar',
          style,
          mood,
          colors,
          gender,
          accessories,
          features
        })
      })

      const data = await response.json()
      if (data.success) {
        setAvatar(data.data)
        toast({
          title: '🎭 Avatar Concept Created!',
          description: 'Your unique avatar description is ready'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(avatar?.prompt || avatar?.description)
    toast({ title: 'Copied!', description: 'Avatar prompt copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-4 left-8 text-2xl animate-pulse">🎭</div>
          <div className="absolute top-12 right-12 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>✨</div>
          <div className="absolute bottom-8 left-1/4 text-lg animate-pulse" style={{animationDelay: '1s'}}>🎨</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Avatar Creator</h1>
              <p className="text-white/80">Design unique avatar concepts with AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎨</span> Design Your Avatar
            </CardTitle>
            <CardDescription>Customize every aspect of your avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Art Style</Label>
              <div className="grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={style === s.id ? 'default' : 'outline'}
                    className="h-auto py-2 flex flex-col items-center gap-1"
                    onClick={() => setStyle(s.id)}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-[10px]">{s.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mood/Expression</Label>
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map((m) => (
                  <Button
                    key={m.id}
                    variant={mood === m.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMood(m.id)}
                  >
                    {m.icon} {m.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <Button
                    key={scheme.id}
                    variant={colors === scheme.id ? 'default' : 'outline'}
                    className="h-auto py-2 justify-start gap-2"
                    onClick={() => setColors(scheme.id)}
                  >
                    <div className="flex gap-1">
                      {scheme.colors.map((color, i) => (
                        <div 
                          key={i}
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs">{scheme.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Character Type (Optional)</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accessories (Optional)</Label>
              <Input
                placeholder="e.g., glasses, headphones, crown, wings, sword..."
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Special Features (Optional)</Label>
              <Textarea
                placeholder="e.g., glowing eyes, unusual hair color, scars, tattoos, horns..."
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Avatar Concept...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Avatar Concept</>  
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Avatar Display */}
        <div className="space-y-4">
          {avatar ? (
            <>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <span className="text-2xl">🎭</span> Your Avatar Concept
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={copyPrompt}>
                    <Copy className="h-4 w-4 mr-1" /> Copy Prompt
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visual Description */}
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-inner">
                    <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">Visual Description</p>
                    <p className="text-purple-900 dark:text-purple-100 leading-relaxed">
                      {avatar.description}
                    </p>
                  </div>

                  {/* AI Image Prompt */}
                  {avatar.prompt && (
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                      <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">🤖 AI Image Prompt</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-mono bg-white dark:bg-gray-900 p-3 rounded">
                        {avatar.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this prompt in Midjourney, DALL-E, or Stable Diffusion
                      </p>
                    </div>
                  )}

                  {/* Color Palette */}
                  {avatar.colorPalette && (
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Color Palette
                      </p>
                      <div className="flex gap-2">
                        {avatar.colorPalette.map((color, idx) => (
                          <div 
                            key={idx}
                            className="flex-1 h-12 rounded-lg shadow-inner flex items-end justify-center pb-1"
                            style={{ backgroundColor: color }}
                          >
                            <span className="text-[10px] font-mono text-white bg-black/30 px-1 rounded">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Features */}
                  {avatar.keyFeatures && (
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">✨ Key Features</p>
                      <div className="flex flex-wrap gap-2">
                        {avatar.keyFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="secondary">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variations */}
                  {avatar.variations && avatar.variations.length > 0 && (
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">🎨 Variation Ideas</p>
                      <div className="space-y-2">
                        {avatar.variations.map((v, idx) => (
                          <div key={idx} className="p-2 bg-muted rounded-lg text-sm">
                            <span className="font-medium">{v.name}:</span> {v.changes}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed h-full min-h-[500px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <User className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-300" />
                <p className="text-lg">Your avatar concept will appear here</p>
                <p className="text-sm">Customize your preferences and generate!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardHeader>
          <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Avatar Creation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-purple-800 dark:text-purple-200">Use the Prompt</p>
              <p className="text-purple-700 dark:text-purple-300">Copy the AI prompt to use in image generators like Midjourney or DALL-E</p>
            </div>
            <div>
              <p className="font-medium text-purple-800 dark:text-purple-200">Mix & Match</p>
              <p className="text-purple-700 dark:text-purple-300">Try unexpected combinations for unique results</p>
            </div>
            <div>
              <p className="font-medium text-purple-800 dark:text-purple-200">Iterate</p>
              <p className="text-purple-700 dark:text-purple-300">Generate multiple concepts and pick your favorite</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
