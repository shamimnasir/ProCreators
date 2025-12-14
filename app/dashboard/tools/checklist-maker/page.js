'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Download, Sparkles, ArrowLeft, CheckCircle, DollarSign, ListChecks } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

const CHECKLIST_TYPES = [
  { id: 'habit', name: 'Habit Tracker', icon: '✓', description: '30-day habit tracking grid', isTracker: true },
  { id: 'goal', name: 'Goal Tracker', icon: '🎯', description: 'Track progress towards goals', isTracker: true },
  { id: 'fitness', name: 'Fitness Tracker', icon: '💪', description: 'Workout & exercise log', isTracker: true },
  { id: 'savings', name: 'Savings Tracker', icon: '💰', description: 'Money saving challenges', isTracker: true },
  { id: 'cleaning', name: 'Cleaning Checklist', icon: '🧹', description: 'Home cleaning tasks', isTracker: false },
  { id: 'travel', name: 'Travel Packing', icon: '✈️', description: 'Packing list template', isTracker: false },
  { id: 'grocery', name: 'Grocery List', icon: '🛒', description: 'Shopping list by category', isTracker: false },
  { id: 'project', name: 'Project Checklist', icon: '📋', description: 'Task tracking', isTracker: false },
  { id: 'morning', name: 'Morning Routine', icon: '☀️', description: 'Daily morning routine', isTracker: true },
  { id: 'evening', name: 'Evening Routine', icon: '🌙', description: 'Evening wind-down', isTracker: true },
]

const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'colorful', name: 'Colorful' },
  { id: 'nature', name: 'Nature' },
]

const PAPER_SIZES = [
  { id: 'letter', name: 'US Letter' },
  { id: 'a4', name: 'A4' },
  { id: 'a5', name: 'A5' },
]

export default function ChecklistMakerPage() {
  const [mode, setMode] = useState('easy')
  const [checklistType, setChecklistType] = useState('habit')
  const [customItems, setCustomItems] = useState('')
  const [itemCount, setItemCount] = useState(15)
  const [designStyle, setDesignStyle] = useState('modern')
  const [paperSize, setPaperSize] = useState('letter')
  const [trackingDays, setTrackingDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    setGenerated(null)
    
    try {
      const response = await fetch('/api/checklist-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistType,
          customItems: customItems || undefined,
          itemCount,
          designStyle,
          paperSize,
          trackingDays: selectedType?.isTracker ? trackingDays : undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate checklist')
      }
      
      setGenerated(data)
      toast({
        title: "✅ Checklist Created!",
        description: `"${data.title}" is ready to download!`
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

  const selectedType = CHECKLIST_TYPES.find(c => c.id === checklistType)

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
            <span className="text-4xl">✅</span>
            Checklist & Tracker Maker
          </h1>
          <p className="text-muted-foreground mt-1">
            Create habit trackers, checklists, and goal trackers
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $3-$10
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Perfect for:</span>
            {['Etsy', 'Gumroad', 'Creative Market', 'Print-on-Demand'].map((platform) => (
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
            <div className="space-y-6">
              {/* Type Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Choose Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECKLIST_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setChecklistType(type.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          checklistType === type.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{type.icon}</span>
                          <span className="font-medium text-sm">{type.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-1">{type.description}</span>
                        {type.isTracker && (
                          <Badge variant="outline" className="text-[10px] mt-2">Grid Tracker</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customization */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Customize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedType?.isTracker && (
                    <div className="space-y-2">
                      <Label>Tracking Days: {trackingDays}</Label>
                      <Slider
                        value={[trackingDays]}
                        onValueChange={([v]) => setTrackingDays(v)}
                        min={7}
                        max={31}
                        step={1}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Design</Label>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

            {/* Preview & Generate */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{selectedType?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedType?.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedType?.isTracker 
                          ? `${trackingDays}-day tracking grid`
                          : 'Organized checklist'
                        }
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline">{DESIGN_STYLES.find(s => s.id === designStyle)?.name}</Badge>
                      <Badge variant="outline">{PAPER_SIZES.find(s => s.id === paperSize)?.name}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating (10-20s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Checklist</>
                )}
              </Button>

              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Ready!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {generated.title}
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
                  <CardTitle>Full Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={checklistType} onValueChange={setChecklistType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_TYPES.map((type) => (
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
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DESIGN_STYLES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Items (Optional)</Label>
                    <Textarea
                      placeholder="Add your own items, one per line...&#10;e.g., Exercise 30 mins&#10;Read 20 pages&#10;Drink 8 glasses water"
                      value={customItems}
                      onChange={(e) => setCustomItems(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Items: {itemCount}</Label>
                      <Slider
                        value={[itemCount]}
                        onValueChange={([v]) => setItemCount(v)}
                        min={5}
                        max={25}
                        step={5}
                      />
                    </div>
                    {selectedType?.isTracker && (
                      <div className="space-y-2">
                        <Label>Days: {trackingDays}</Label>
                        <Slider
                          value={[trackingDays]}
                          onValueChange={([v]) => setTrackingDays(v)}
                          min={7}
                          max={31}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Paper Size</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <p className="font-medium text-green-800">"{generated.title}" is ready!</p>
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
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Checklist</>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-800 dark:text-green-200">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-green-700 dark:text-green-300">
                  <p>• Habit trackers are evergreen sellers</p>
                  <p>• Bundle 5-10 trackers for $8-15</p>
                  <p>• Seasonal checklists sell well</p>
                  <p>• Add niche focus (fitness, moms, etc.)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
