'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Download, Sparkles, Loader2, FileText, Clock, Target, Heart, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const PLANNER_TYPES = [
  { id: 'daily', name: 'Daily Planner', icon: '📅', description: 'Day-by-day planning with time blocks' },
  { id: 'weekly', name: 'Weekly Planner', icon: '📆', description: '7-day overview with goals' },
  { id: 'monthly', name: 'Monthly Calendar', icon: '🗓️', description: 'Full month view with notes' },
  { id: 'habit', name: 'Habit Tracker', icon: '✅', description: 'Track daily habits and streaks' },
  { id: 'budget', name: 'Budget Tracker', icon: '💰', description: 'Income, expenses, savings' },
  { id: 'meal', name: 'Meal Planner', icon: '🍽️', description: 'Weekly meals and grocery lists' },
  { id: 'fitness', name: 'Fitness Log', icon: '💪', description: 'Workout tracking and progress' },
  { id: 'gratitude', name: 'Gratitude Journal', icon: '🙏', description: 'Daily gratitude prompts' },
  { id: 'goals', name: 'Goal Setting', icon: '🎯', description: 'SMART goals and action plans' },
  { id: 'project', name: 'Project Planner', icon: '📊', description: 'Project timeline and tasks' },
]

const DESIGN_STYLES = [
  { id: 'minimal', name: 'Minimal Clean', colors: 'Black & White' },
  { id: 'pastel', name: 'Soft Pastel', colors: 'Pink, Blue, Lavender' },
  { id: 'boho', name: 'Boho Natural', colors: 'Earth tones, Beige' },
  { id: 'modern', name: 'Modern Bold', colors: 'Navy, Gold, White' },
  { id: 'floral', name: 'Floral Garden', colors: 'Florals, Greens' },
  { id: 'dark', name: 'Dark Mode', colors: 'Dark grays, Neon accents' },
]

const PAPER_SIZES = [
  { id: 'letter', name: 'US Letter (8.5 x 11")', ratio: '8.5:11' },
  { id: 'a4', name: 'A4 (210 x 297mm)', ratio: '210:297' },
  { id: 'a5', name: 'A5 Half Page', ratio: '148:210' },
  { id: 'happy', name: 'Happy Planner Classic', ratio: '7:9.25' },
]

export default function PlannerMakerPage() {
  const [mode, setMode] = useState('easy') // 'easy' or 'pro'
  const [plannerType, setPlannerType] = useState('weekly')
  const [designStyle, setDesignStyle] = useState('minimal')
  const [paperSize, setPaperSize] = useState('letter')
  const [pageCount, setPageCount] = useState(12)
  const [customTitle, setCustomTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPDF, setGeneratedPDF] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedPDF(null)
    try {
      const response = await fetch('/api/planner-maker/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plannerType,
          designStyle,
          paperSize,
          pageCount,
          customTitle: customTitle || undefined,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-500" />
            Digital Planner Maker
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful, sellable planners and trackers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Sell for $10-$30
          </Badge>
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
          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1: Choose Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                  Choose Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {PLANNER_TYPES.slice(0, 8).map((type) => (
                    <Button
                      key={type.id}
                      variant={plannerType === type.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setPlannerType(type.id)}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-xs text-center">{type.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Choose Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                  Choose Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DESIGN_STYLES.map((style) => (
                    <Button
                      key={style.id}
                      variant={designStyle === style.id ? 'default' : 'outline'}
                      className="w-full justify-start h-auto py-2"
                      onClick={() => setDesignStyle(style.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{style.name}</p>
                        <p className="text-xs text-muted-foreground">{style.colors}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">3</span>
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select value={paperSize} onValueChange={setPaperSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPER_SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Pages</Label>
                  <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 36, 52, 100].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} pages
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Title (Optional)</Label>
                  <Input 
                    placeholder="My 2025 Planner"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Generate */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedPlannerInfo?.icon}</div>
                  <div>
                    <h3 className="font-semibold">{selectedPlannerInfo?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {DESIGN_STYLES.find(s => s.id === designStyle)?.name} • {pageCount} pages • {PAPER_SIZES.find(s => s.id === paperSize)?.name}
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate Planner</>
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
              <CardTitle>Pro Mode - Full Customization</CardTitle>
              <CardDescription>Advanced options for complete control over your planner design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Design Style</Label>
                  <Select value={designStyle} onValueChange={setDesignStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGN_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea 
                  placeholder="Describe any specific customizations you want... (e.g., add inspirational quotes, include meal prep section, etc.)"
                  className="min-h-[100px]"
                />
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Custom Planner</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selling Tips */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Selling Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Bundle It</p>
              <p className="text-green-700 dark:text-green-300">Combine daily + weekly + monthly for $25-40</p>
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Seasonal Themes</p>
              <p className="text-green-700 dark:text-green-300">New Year planners sell best in December!</p>
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Niche Down</p>
              <p className="text-green-700 dark:text-green-300">"Busy Mom Planner" outperforms generic ones</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
