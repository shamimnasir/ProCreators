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
  FileText, Palette, Clock, CheckCircle, DollarSign
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
  { id: 'children', name: 'Children\'s', icon: '🧒', description: 'Kids content' },
]

const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern', color: 'bg-indigo-500' },
  { id: 'classic', name: 'Classic', color: 'bg-amber-700' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-600' },
  { id: 'vibrant', name: 'Vibrant', color: 'bg-pink-500' },
]

export default function EbookMakerPage() {
  const [mode, setMode] = useState('easy')
  const [title, setTitle] = useState('')
  const [outline, setOutline] = useState('')
  const [genre, setGenre] = useState('self-help')
  const [chapterCount, setChapterCount] = useState(5)
  const [language, setLanguage] = useState('english')
  const [designStyle, setDesignStyle] = useState('modern')
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
          designStyle
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate ebook')
      }
      
      setGenerated(data)
      toast({
        title: "🎉 Ebook Created!",
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">📖</span>
            Ebook Creator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create professional ebooks with AI in minutes
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $10-$50
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Perfect for:</span>
            {['Amazon KDP', 'Gumroad', 'Etsy', 'Your Website'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-green-900/50">
                {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="easy">✨ Easy Mode</TabsTrigger>
          <TabsTrigger value="pro">⚙️ Pro Mode</TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="space-y-6">
              {/* Genre Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">What type of ebook?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {EBOOK_GENRES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGenre(g.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                          genre === g.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{g.icon}</span>
                        <span className="text-xs font-medium">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Title & Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ebook Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g., The Ultimate Guide to Productivity"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What should the ebook cover?</Label>
                    <Textarea
                      placeholder="Describe the topics, chapters, or key points you want covered..."
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Chapters</Label>
                      <Select value={chapterCount.toString()} onValueChange={(v) => setChapterCount(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 5, 7, 10].map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} chapters</SelectItem>
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
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="bengali">Bengali (বাংলা)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview & Generate */}
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className={`bg-gradient-to-br from-${designStyle === 'modern' ? 'indigo' : designStyle === 'classic' ? 'amber' : designStyle === 'minimal' ? 'gray' : 'pink'}-50 to-white dark:from-gray-900 dark:to-gray-800`}>
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{selectedGenre?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{title || 'Your Ebook Title'}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {chapterCount} chapters • {language === 'bengali' ? 'Bengali' : 'English'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        ~{chapterCount * 8} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        ~2 min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Ebook (30-60s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Ebook</>
                )}
              </Button>

              {/* Result */}
              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Ebook Ready!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {generated.pageCount} pages • {generated.chapterCount} chapters
                        </p>
                      </div>
                    </div>
                    <a href={generated.downloadUrl} download target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ebook Configuration</CardTitle>
                  <CardDescription>Full control over your ebook generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Select value={genre} onValueChange={setGenre}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EBOOK_GENRES.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.icon} {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Design Style</Label>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_STYLES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Your ebook title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chapter Outline / Topics</Label>
                    <Textarea
                      placeholder="Chapter 1: Introduction to the topic
Chapter 2: Key concepts and fundamentals
Chapter 3: Advanced strategies
Chapter 4: Real-world examples
Chapter 5: Conclusion and next steps"
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="bengali">Bengali</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">"{generated.title}" is ready!</p>
                        <p className="text-sm text-green-600">{generated.pageCount} pages</p>
                      </div>
                    </div>
                    <a href={generated.downloadUrl} download target="_blank" rel="noopener noreferrer">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Ebook</>
                )}
              </Button>
            </div>

            {/* Tips sidebar */}
            <div className="space-y-4">
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800 dark:text-amber-200">💡 Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-amber-700 dark:text-amber-300">
                  <p>• More chapters = higher perceived value</p>
                  <p>• Add specific topics in outline for better AI content</p>
                  <p>• Self-help and how-to ebooks sell best</p>
                  <p>• Bundle 3-5 ebooks for $30-50 packages</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pricing Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>3-5 chapters</span>
                    <span className="text-green-600 font-medium">$5-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>7-10 chapters</span>
                    <span className="text-green-600 font-medium">$15-30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bundle (5+ ebooks)</span>
                    <span className="text-green-600 font-medium">$30-100</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
