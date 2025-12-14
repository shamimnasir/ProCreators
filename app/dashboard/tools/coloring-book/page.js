'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Palette, Download, Sparkles, Loader2, DollarSign, Image } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const COLORING_THEMES = [
  { id: 'animals', name: 'Animals', icon: '🦁', examples: 'Lions, elephants, butterflies' },
  { id: 'nature', name: 'Nature & Flowers', icon: '🌸', examples: 'Gardens, trees, landscapes' },
  { id: 'mandala', name: 'Mandalas', icon: '✨', examples: 'Geometric patterns, zen designs' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉', examples: 'Dragons, unicorns, fairies' },
  { id: 'ocean', name: 'Ocean & Sea Life', icon: '🐠', examples: 'Fish, dolphins, coral reefs' },
  { id: 'space', name: 'Space & Planets', icon: '🚀', examples: 'Astronauts, rockets, galaxies' },
  { id: 'holiday', name: 'Holiday & Seasonal', icon: '🎄', examples: 'Christmas, Halloween, Easter' },
  { id: 'patterns', name: 'Abstract Patterns', icon: '🎨', examples: 'Doodles, swirls, geometric' },
  { id: 'characters', name: 'Cute Characters', icon: '🧸', examples: 'Kawaii, chibi, cartoon animals' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', examples: 'Cars, planes, trains' },
]

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy (Kids 3-6)', description: 'Large shapes, simple lines' },
  { id: 'medium', name: 'Medium (Kids 7-12)', description: 'More detail, smaller areas' },
  { id: 'hard', name: 'Hard (Teens & Adults)', description: 'Intricate details, fine lines' },
  { id: 'expert', name: 'Expert (Adults)', description: 'Maximum detail, mandala-level' },
]

const PAGE_OPTIONS = [10, 20, 30, 50, 100]

export default function ColoringBookPage() {
  const [mode, setMode] = useState('easy')
  const [theme, setTheme] = useState('animals')
  const [difficulty, setDifficulty] = useState('medium')
  const [pageCount, setPageCount] = useState(20)
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPages, setGeneratedPages] = useState([])
  const { toast } = useToast()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: 'Coloring Book Generated!',
        description: `${pageCount} ${COLORING_THEMES.find(t => t.id === theme)?.name} pages ready!`
      })
      
      setGeneratedPages(['page1.png', 'page2.png', 'page3.png'])
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

  const selectedTheme = COLORING_THEMES.find(t => t.id === theme)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-purple-500" />
            Coloring Book Creator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create AI-generated coloring pages for all ages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Sell for $5-$15
          </Badge>
          <Badge variant="outline">Amazon KDP • Etsy</Badge>
        </div>
      </div>

      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="easy">🌟 Easy Mode</TabsTrigger>
          <TabsTrigger value="pro">🚀 Pro Mode</TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">1</span>
                  Choose Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {COLORING_THEMES.map((t) => (
                    <Button
                      key={t.id}
                      variant={theme === t.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setTheme(t.id)}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-xs font-medium">{t.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">2</span>
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          <div>
                            <span className="font-medium">{level.name}</span>
                            <p className="text-xs text-muted-foreground">{level.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Pages: {pageCount}</Label>
                  <Slider
                    value={[pageCount]}
                    onValueChange={(v) => setPageCount(v[0])}
                    min={10}
                    max={100}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 pages</span>
                    <span>100 pages</span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">💡 Pro Tip</p>
                  <p className="text-xs text-muted-foreground">
                    20-30 page books sell best on Etsy. Bundle multiple themes for higher prices!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Generate */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedTheme?.icon}</div>
                  <div>
                    <h3 className="font-semibold">{selectedTheme?.name} Coloring Book</h3>
                    <p className="text-sm text-muted-foreground">
                      {pageCount} pages • {DIFFICULTY_LEVELS.find(l => l.id === difficulty)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Examples: {selectedTheme?.examples}
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating {pageCount} Pages...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Coloring Book</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pro Mode - Custom Coloring Pages</CardTitle>
              <CardDescription>Describe exactly what you want to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Describe Your Coloring Page</Label>
                <Input
                  placeholder="e.g., A magical unicorn in a flower garden with butterflies"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Base Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORING_THEMES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.icon} {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pages</Label>
                  <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} pages
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Custom Coloring Book</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selling Platforms */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            💰 Where to Sell Your Coloring Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
              <p className="font-bold text-amber-800 dark:text-amber-200">Amazon KDP</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Print-on-demand paperbacks. Upload PDF, set price, earn royalties!</p>
            </div>
            <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
              <p className="font-bold text-amber-800 dark:text-amber-200">Etsy</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Instant download PDFs. Best for bundles and themed collections.</p>
            </div>
            <div className="p-4 bg-white dark:bg-amber-900/30 rounded-lg">
              <p className="font-bold text-amber-800 dark:text-amber-200">Gumroad</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Direct sales with low fees. Great for building an email list.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
