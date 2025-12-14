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
  Loader2, Download, Sparkles, ArrowLeft, Calendar, 
  CheckCircle, DollarSign, Palette, User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'

const PLANNER_TYPES = [
  { id: 'daily', name: 'Daily Planner', icon: '📅', description: 'Day-by-day planning' },
  { id: 'weekly', name: 'Weekly Planner', icon: '📆', description: 'Week at a glance' },
  { id: 'monthly', name: 'Monthly Planner', icon: '🗓️', description: 'Monthly overview' },
  { id: 'habit', name: 'Habit Tracker', icon: '✓', description: '30-day tracking' },
  { id: 'budget', name: 'Budget Planner', icon: '💰', description: 'Financial planning' },
  { id: 'meal', name: 'Meal Planner', icon: '🍽️', description: 'Weekly meals' },
  { id: 'fitness', name: 'Fitness Planner', icon: '💪', description: 'Workout logs' },
  { id: 'goals', name: 'Goal Planner', icon: '🎯', description: 'Goal setting' },
  { id: 'project', name: 'Project Planner', icon: '📋', description: 'Project tracking' },
  { id: 'gratitude', name: 'Gratitude Planner', icon: '🙏', description: 'Daily gratitude' },
]

const COLOR_SCHEMES = [
  { id: 'rose-gold', name: 'Rose Gold', preview: 'bg-gradient-to-r from-pink-300 to-rose-300' },
  { id: 'ocean-blue', name: 'Ocean Blue', preview: 'bg-gradient-to-r from-blue-400 to-cyan-300' },
  { id: 'forest-green', name: 'Forest Green', preview: 'bg-gradient-to-r from-green-500 to-emerald-400' },
  { id: 'lavender', name: 'Lavender Dream', preview: 'bg-gradient-to-r from-purple-400 to-violet-300' },
  { id: 'sunset', name: 'Sunset Glow', preview: 'bg-gradient-to-r from-orange-400 to-amber-300' },
  { id: 'midnight', name: 'Midnight', preview: 'bg-gradient-to-r from-slate-700 to-slate-500' },
  { id: 'blush-pink', name: 'Blush Pink', preview: 'bg-gradient-to-r from-pink-400 to-rose-200' },
  { id: 'sage', name: 'Sage', preview: 'bg-gradient-to-r from-green-400 to-emerald-300' },
  { id: 'terracotta', name: 'Terracotta', preview: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { id: 'minimal', name: 'Minimal Black', preview: 'bg-gradient-to-r from-gray-800 to-gray-600' },
]

const COVER_STYLES = [
  { id: 'elegant', name: 'Elegant', description: 'Classic with decorative borders' },
  { id: 'modern', name: 'Modern', description: 'Clean geometric accents' },
  { id: 'floral', name: 'Floral', description: 'Delicate floral corners' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple and clean' },
  { id: 'boho', name: 'Boho', description: 'Bohemian organic shapes' },
]

const PAPER_SIZES = [
  { id: 'letter', name: 'US Letter', size: '8.5 x 11"' },
  { id: 'a4', name: 'A4', size: '210 x 297mm' },
  { id: 'a5', name: 'A5', size: '148 x 210mm' },
]

export default function PlannerMakerPage() {
  const [mode, setMode] = useState('easy')
  const [plannerType, setPlannerType] = useState('weekly')
  const [colorScheme, setColorScheme] = useState('rose-gold')
  const [coverStyle, setCoverStyle] = useState('elegant')
  const [paperSize, setPaperSize] = useState('letter')
  const [pageCount, setPageCount] = useState(12)
  const [customTitle, setCustomTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [customInstructions, setCustomInstructions] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPDF, setGeneratedPDF] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedPDF(null)
    try {
      const response = await fetch('/api/planner-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannerType,
          colorScheme,
          coverStyle,
          paperSize,
          pageCount,
          customTitle: customTitle || undefined,
          authorName: authorName || undefined,
          year: year ? parseInt(year) : undefined,
          customInstructions: customInstructions || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate planner')
      }
      
      toast({
        title: '🎉 Planner Generated!',
        description: `"${data.title}" with ${data.pageCount} pages is ready to download.`
      })
      
      setGeneratedPDF(data.downloadUrl)
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const selectedPlannerInfo = PLANNER_TYPES.find(p => p.id === plannerType)
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">📅</span>
            Planner Maker
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful, printable planners with AI
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $5-$25
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-pink-700 dark:text-pink-300">Perfect for:</span>
            {['Etsy', 'Amazon KDP', 'Gumroad', 'Creative Market'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-pink-900/50">
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
              {/* Planner Type */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Choose Planner Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {PLANNER_TYPES.slice(0, 6).map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPlannerType(type.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          plannerType === type.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{type.icon}</span>
                        <span className="font-medium text-sm block">{type.name}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Color Scheme */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_SCHEMES.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setColorScheme(color.id)}
                        className={`relative aspect-square rounded-lg ${color.preview} transition-all hover:scale-105 ${
                          colorScheme === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedColor?.name}
                  </p>
                </CardContent>
              </Card>

              {/* Author & Customization */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personalization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Author Name</Label>
                      <Input
                        placeholder="Your name"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        placeholder="2025"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Title (Optional)</Label>
                    <Input
                      placeholder="e.g., My Productivity Planner"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pages: {pageCount}</Label>
                      <Slider
                        value={[pageCount]}
                        onValueChange={([v]) => setPageCount(v)}
                        min={4}
                        max={200}
                        step={4}
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
              {/* Preview Card */}
              <Card className={`${selectedColor?.preview} text-white overflow-hidden`}>
                <CardContent className="py-12">
                  <div className="text-center space-y-4 bg-white/90 dark:bg-black/50 rounded-lg p-8 mx-4">
                    <div className="text-5xl">{selectedPlannerInfo?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {customTitle || `My ${selectedPlannerInfo?.name}`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {selectedPlannerInfo?.description}
                      </p>
                    </div>
                    {year && (
                      <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">{year}</p>
                    )}
                    {authorName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {authorName}</p>
                    )}
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
                      <span>{pageCount} pages</span>
                      <span>•</span>
                      <span>{PAPER_SIZES.find(s => s.id === paperSize)?.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={generating}
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Planner (15-30s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Planner</>
                )}
              </Button>

              {/* Download Result */}
              {generatedPDF && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Planner Ready!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Beautiful cover + {pageCount} pages
                        </p>
                      </div>
                    </div>
                    <a href={generatedPDF} download target="_blank" rel="noopener noreferrer">
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
                  <CardTitle>Full Configuration</CardTitle>
                  <CardDescription>Complete control over your planner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Planner Type</Label>
                      <Select value={plannerType} onValueChange={setPlannerType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLANNER_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.icon} {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Style</Label>
                      <Select value={coverStyle} onValueChange={setCoverStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COVER_STYLES.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name} - {style.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Author Name</Label>
                      <Input
                        placeholder="Your name for the cover"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        placeholder="2025"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Title</Label>
                    <Input
                      placeholder="Give your planner a unique name..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_SCHEMES.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setColorScheme(color.id)}
                          className={`relative h-10 rounded-lg ${color.preview} transition-all hover:scale-105 ${
                            colorScheme === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Special Instructions (Optional)</Label>
                    <Textarea
                      placeholder="Any special customizations... (e.g., 'Include meal prep tips', 'Add motivational quotes about fitness')"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Pages: {pageCount}</Label>
                      <Slider
                        value={[pageCount]}
                        onValueChange={([v]) => setPageCount(v)}
                        min={4}
                        max={200}
                        step={4}
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

              {generatedPDF && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <p className="font-medium text-green-800">Planner is ready!</p>
                    </div>
                    <a href={generatedPDF} download target="_blank" rel="noopener noreferrer">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Planner</>
                )}
              </Button>
            </div>

            {/* Tips sidebar */}
            <div className="space-y-4">
              <Card className="bg-pink-50 dark:bg-pink-950/30 border-pink-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-pink-800 dark:text-pink-200">💡 Selling Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-pink-700 dark:text-pink-300">
                  <p>• Planners sell best in Q4 & January</p>
                  <p>• Add your brand name as author</p>
                  <p>• Bundle different types for higher prices</p>
                  <p>• Undated planners are evergreen</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Popular Combos</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Weekly + Habit</span>
                    <Badge variant="outline">Best Seller</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget + Goal</span>
                    <Badge variant="outline">Popular</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Meal + Fitness</span>
                    <Badge variant="outline">Trending</Badge>
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
