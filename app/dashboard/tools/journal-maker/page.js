'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Download, Sparkles, ArrowLeft,
  Clock, CheckCircle, DollarSign, BookOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

const JOURNAL_TYPES = [
  { id: 'gratitude', name: 'Gratitude Journal', icon: '🙏', description: 'Daily thankfulness practice', color: 'bg-yellow-100' },
  { id: 'bullet', name: 'Bullet Journal', icon: '📓', description: 'Task and habit tracking', color: 'bg-gray-100' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', description: 'Present moment awareness', color: 'bg-purple-100' },
  { id: 'self-discovery', name: 'Self-Discovery', icon: '🔍', description: 'Know yourself better', color: 'bg-blue-100' },
  { id: 'dream', name: 'Dream Journal', icon: '💭', description: 'Record and analyze dreams', color: 'bg-indigo-100' },
  { id: 'fitness', name: 'Fitness Journal', icon: '💪', description: 'Track workouts & health', color: 'bg-green-100' },
  { id: 'reading', name: 'Reading Journal', icon: '📚', description: 'Book notes & reviews', color: 'bg-amber-100' },
  { id: 'travel', name: 'Travel Journal', icon: '✈️', description: 'Document adventures', color: 'bg-cyan-100' },
]

const DESIGN_STYLES = [
  { id: 'elegant', name: 'Elegant', preview: 'from-slate-100 to-slate-50' },
  { id: 'minimal', name: 'Minimal', preview: 'from-gray-50 to-white' },
  { id: 'nature', name: 'Nature', preview: 'from-green-100 to-emerald-50' },
  { id: 'ocean', name: 'Ocean', preview: 'from-blue-100 to-cyan-50' },
  { id: 'sunset', name: 'Sunset', preview: 'from-orange-100 to-amber-50' },
]

const PAPER_SIZES = [
  { id: 'letter', name: 'US Letter', size: '8.5 x 11"' },
  { id: 'a4', name: 'A4', size: '210 x 297mm' },
  { id: 'a5', name: 'A5', size: '148 x 210mm' },
]

export default function JournalMakerPage() {
  const [mode, setMode] = useState('easy')
  const [journalType, setJournalType] = useState('gratitude')
  const [pageCount, setPageCount] = useState(30)
  const [designStyle, setDesignStyle] = useState('elegant')
  const [paperSize, setPaperSize] = useState('letter')
  const [customTheme, setCustomTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    setGenerated(null)
    
    try {
      const response = await fetch('/api/journal-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalType,
          pageCount,
          designStyle,
          paperSize,
          customTheme: customTheme || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate journal')
      }
      
      setGenerated(data)
      toast({
        title: "🎉 Journal Created!",
        description: `"${data.title}" with ${data.pageCount} pages is ready!`
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

  const selectedJournal = JOURNAL_TYPES.find(j => j.id === journalType)

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
            <span className="text-4xl">📓</span>
            Journal & Diary Maker
          </h1>
          <p className="text-muted-foreground mt-1">
            Create guided journals with AI-generated prompts
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $10-$25
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Perfect for:</span>
            {['Amazon KDP', 'Gumroad', 'Etsy', 'Print-on-Demand'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-purple-900/50">
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
            {/* Left: Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Choose Journal Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {JOURNAL_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setJournalType(type.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          journalType === type.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{type.icon}</span>
                        <span className="font-medium text-sm block">{type.name}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Customize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Number of Pages: {pageCount}</Label>
                    <Slider
                      value={[pageCount]}
                      onValueChange={([v]) => setPageCount(v)}
                      min={15}
                      max={90}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 30-60 pages for sellable journals
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Design Style</Label>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_STYLES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Paper Size</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPER_SIZES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview & Generate */}
            <div className="space-y-6">
              <Card className={`bg-gradient-to-br ${DESIGN_STYLES.find(s => s.id === designStyle)?.preview} dark:from-gray-900 dark:to-gray-800`}>
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{selectedJournal?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedJournal?.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pageCount} pages • {PAPER_SIZES.find(s => s.id === paperSize)?.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {selectedJournal?.description}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Journal (20-40s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Journal</>
                )}
              </Button>

              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Journal Ready!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {generated.pageCount} pages with unique prompts
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
                  <CardTitle>Journal Configuration</CardTitle>
                  <CardDescription>Full control over your journal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Journal Type</Label>
                      <Select value={journalType} onValueChange={setJournalType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOURNAL_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.icon} {type.name}
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
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Theme (Optional)</Label>
                    <Input
                      placeholder="e.g., 'for busy moms', 'for entrepreneurs', 'for students'"
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add a niche focus to make your journal unique
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pages: {pageCount}</Label>
                      <Slider
                        value={[pageCount]}
                        onValueChange={([v]) => setPageCount(v)}
                        min={15}
                        max={120}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paper Size</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPER_SIZES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.size})</SelectItem>
                          ))}
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
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Journal</>
                )}
              </Button>
            </div>

            {/* Tips sidebar */}
            <div className="space-y-4">
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-purple-800 dark:text-purple-200">💡 Selling Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-purple-700 dark:text-purple-300">
                  <p>• Gratitude journals sell year-round</p>
                  <p>• Add niche focus (for moms, students, etc.)</p>
                  <p>• 60+ pages feels more "premium"</p>
                  <p>• Create seasonal versions (New Year, etc.)</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Best Sellers</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>🙏 Gratitude</span>
                    <Badge variant="outline">High Demand</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>🧘 Mindfulness</span>
                    <Badge variant="outline">Trending</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>💪 Fitness</span>
                    <Badge variant="outline">Popular</Badge>
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
