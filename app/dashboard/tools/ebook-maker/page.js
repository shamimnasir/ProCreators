'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Download, BookOpen, Globe, Sparkles, ArrowLeft,
  FileText, Palette, Clock, CheckCircle, User, Image
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

const EBOOK_GENRES = [
  { id: 'self-help', name: 'Self-Help', icon: '💪', description: 'Motivational content' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Professional strategies' },
  { id: 'how-to', name: 'How-To Guide', icon: '📋', description: 'Step-by-step tutorials' },
  { id: 'health', name: 'Health & Wellness', icon: '🏃', description: 'Wellness guides' },
  { id: 'finance', name: 'Finance', icon: '💰', description: 'Money management' },
  { id: 'cookbook', name: 'Cookbook', icon: '🍳', description: 'Recipe collections' },
  { id: 'fiction', name: 'Fiction', icon: '📖', description: 'Stories & narratives' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Travel guides' },
  { id: 'children', name: "Children's", icon: '🧒', description: 'Kids content' },
]

const COLOR_SCHEMES = [
  { id: 'ocean-blue', name: 'Ocean Blue', color: 'bg-blue-500' },
  { id: 'rose-gold', name: 'Rose Gold', color: 'bg-pink-400' },
  { id: 'forest-green', name: 'Forest Green', color: 'bg-green-600' },
  { id: 'lavender', name: 'Lavender', color: 'bg-purple-400' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
  { id: 'midnight', name: 'Midnight', color: 'bg-indigo-900' },
  { id: 'sage', name: 'Sage', color: 'bg-emerald-400' },
  { id: 'terracotta', name: 'Terracotta', color: 'bg-amber-600' },
]

const COVER_STYLES = [
  { id: 'elegant', name: 'Elegant', description: 'Classic with decorative borders' },
  { id: 'modern', name: 'Modern', description: 'Clean geometric accents' },
  { id: 'floral', name: 'Floral', description: 'Delicate floral corners' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple and clean' },
  { id: 'boho', name: 'Boho', description: 'Bohemian organic shapes' },
]

export default function EbookMakerPage() {
  const [mode, setMode] = useState('easy')
  const [title, setTitle] = useState('')
  const [outline, setOutline] = useState('')
  const [genre, setGenre] = useState('self-help')
  const [chapterCount, setChapterCount] = useState(5)
  const [language, setLanguage] = useState('english')
  const [colorScheme, setColorScheme] = useState('ocean-blue')
  const [coverStyle, setCoverStyle] = useState('elegant')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your ebook",
        variant: "destructive"
      })
      return
    }

    if (!outline.trim()) {
      toast({
        title: "Outline Required",
        description: "Please provide a brief outline or description",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setGenerated(null)
    
    try {
      const response = await fetch('/api/ebook-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          outline,
          genre,
          chapterCount,
          language,
          colorScheme,
          coverStyle,
          authorName
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate ebook')
      }
      
      setGenerated(data)
      toast({
        title: "Ebook Created!",
        description: `"${data.title}" with ${data.chapterCount} chapters is ready!`
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedGenre = EBOOK_GENRES.find(g => g.id === genre)
  const selectedColor = COLOR_SCHEMES.find(c => c.id === colorScheme)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/digital-products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Ebook Creator
          </h1>
          <p className="text-muted-foreground">Create professional ebooks with AI-generated content and beautiful covers</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={setMode} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="easy" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Easy Mode
          </TabsTrigger>
          <TabsTrigger value="pro" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Pro Mode
          </TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Create</CardTitle>
                <CardDescription>Enter your ebook details and let AI do the rest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ebook Title</Label>
                  <Input
                    placeholder="e.g., The Ultimate Guide to Productivity"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input
                    placeholder="Your name or pen name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>What should the ebook cover?</Label>
                  <Textarea
                    placeholder="Describe the main topics, target audience, and key points you want to cover..."
                    className="min-h-[100px]"
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EBOOK_GENRES.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <span className="flex items-center gap-2">
                            <span>{g.icon}</span>
                            <span>{g.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chapters: {chapterCount}</Label>
                  <Slider
                    value={[chapterCount]}
                    onValueChange={([v]) => setChapterCount(v)}
                    min={3}
                    max={15}
                    step={1}
                  />
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Ebook (30-60 sec)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Ebook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Your ebook will look like this</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 p-6 flex flex-col justify-between shadow-lg`}>
                  <div className="text-center pt-12">
                    <h3 className="text-lg font-bold text-blue-900">
                      {title || 'Your Ebook Title'}
                    </h3>
                    <p className="text-sm text-blue-700 mt-2">
                      {selectedGenre?.description}
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    {authorName && (
                      <p className="text-sm text-blue-800">by {authorName}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                      <FileText className="h-3 w-3" />
                      <span>{chapterCount} Chapters</span>
                    </div>
                  </div>
                </div>

                {generated && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Ebook Ready!</span>
                    </div>
                    <p className="text-sm text-green-600 mb-3">
                      {generated.pageCount} pages with AI-generated cover
                    </p>
                    <a href={generated.downloadUrl} download>
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
                <CardDescription>Full control over your ebook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ebook Title</Label>
                    <Input
                      placeholder="e.g., The Ultimate Guide to Productivity"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Author Name
                    </Label>
                    <Input
                      placeholder="Your name or pen name"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content Outline</Label>
                  <Textarea
                    placeholder="Describe topics, target audience, key points, chapter ideas..."
                    className="min-h-[120px]"
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EBOOK_GENRES.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            <span className="flex items-center gap-2">
                              <span>{g.icon}</span>
                              <span>{g.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            English
                          </span>
                        </SelectItem>
                        <SelectItem value="bengali">
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Bengali
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Number of Chapters: {chapterCount}</Label>
                  <Slider
                    value={[chapterCount]}
                    onValueChange={([v]) => setChapterCount(v)}
                    min={3}
                    max={20}
                    step={1}
                  />
                </div>

                {/* Color Scheme */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Scheme
                  </Label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {COLOR_SCHEMES.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setColorScheme(color.id)}
                        className={`h-10 rounded-lg ${color.color} transition-all ${
                          colorScheme === color.id 
                            ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                            : 'hover:scale-105'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedColor?.name}
                  </p>
                </div>

                {/* Cover Style */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Cover Style
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {COVER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setCoverStyle(style.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          coverStyle === style.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Ebook with AI Cover (45-90 sec)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Professional Ebook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Book cover preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`aspect-[3/4] rounded-lg ${selectedColor?.color || 'bg-blue-500'} p-4 flex flex-col justify-between shadow-xl text-white relative overflow-hidden`}>
                  {/* Decorative elements based on cover style */}
                  {coverStyle === 'floral' && (
                    <>
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/20" />
                      <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-white/30" />
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20" />
                      <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-white/30" />
                      <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white/20" />
                      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/20" />
                    </>
                  )}
                  {coverStyle === 'elegant' && (
                    <div className="absolute inset-4 border-2 border-white/30 rounded pointer-events-none" />
                  )}
                  {coverStyle === 'modern' && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-16 bg-white/10" />
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-white/10" />
                    </>
                  )}
                  
                  <div className="text-center pt-8 relative z-10">
                    <div className="text-xs opacity-70 mb-2">{selectedGenre?.icon}</div>
                    <h3 className="text-base font-bold leading-tight">
                      {title || 'Your Ebook Title'}
                    </h3>
                    <p className="text-xs opacity-80 mt-2">
                      {selectedGenre?.description}
                    </p>
                  </div>
                  
                  <div className="text-center space-y-1 relative z-10">
                    {authorName && (
                      <p className="text-xs opacity-90">by {authorName}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs opacity-70">
                      <FileText className="h-3 w-3" />
                      <span>{chapterCount} Chapters</span>
                    </div>
                    <p className="text-xs opacity-50">AI-Generated Cover</p>
                  </div>
                </div>

                {generated && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Ebook Ready!</span>
                    </div>
                    <p className="text-sm text-green-600 mb-3">
                      {generated.pageCount} pages with beautiful AI cover
                    </p>
                    <a href={generated.downloadUrl} download>
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>What You Get</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">AI-Generated Content</h4>
                <p className="text-sm text-muted-foreground">Professional chapters written by AI</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Image className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">AI Cover Art</h4>
                <p className="text-sm text-muted-foreground">Beautiful AI-generated cover images</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Professional Format</h4>
                <p className="text-sm text-muted-foreground">Table of contents, chapters, takeaways</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Instant Download</h4>
                <p className="text-sm text-muted-foreground">Get your PDF immediately</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
