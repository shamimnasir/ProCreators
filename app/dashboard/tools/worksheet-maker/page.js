'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Download, Sparkles, ArrowLeft, CheckCircle, DollarSign, GraduationCap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

const WORKSHEET_TYPES = [
  { id: 'math', name: 'Math Practice', icon: '🔢', description: 'Addition, subtraction, etc.' },
  { id: 'reading', name: 'Reading Comprehension', icon: '📖', description: 'Passages & questions' },
  { id: 'writing', name: 'Writing Practice', icon: '✍️', description: 'Prompts & exercises' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Biology, chemistry, etc.' },
  { id: 'language', name: 'Language Learning', icon: '🌍', description: 'Vocabulary & grammar' },
  { id: 'social-studies', name: 'Social Studies', icon: '🌎', description: 'History & geography' },
  { id: 'critical-thinking', name: 'Critical Thinking', icon: '🧩', description: 'Logic & puzzles' },
]

const GRADE_LEVELS = [
  { id: 'pre-k', name: 'Pre-K' },
  { id: 'k', name: 'Kindergarten' },
  { id: '1st', name: '1st Grade' },
  { id: '2nd', name: '2nd Grade' },
  { id: '3rd', name: '3rd Grade' },
  { id: '4th', name: '4th Grade' },
  { id: '5th', name: '5th Grade' },
  { id: '6th', name: '6th Grade' },
  { id: '7th', name: '7th Grade' },
  { id: '8th', name: '8th Grade' },
  { id: 'high-school', name: 'High School' },
  { id: 'adult', name: 'Adult' },
]

export default function WorksheetMakerPage() {
  const [mode, setMode] = useState('easy')
  const [worksheetType, setWorksheetType] = useState('math')
  const [gradeLevel, setGradeLevel] = useState('3rd')
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the worksheet",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setGenerated(null)
    
    try {
      const response = await fetch('/api/worksheet-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worksheetType,
          gradeLevel,
          topic,
          questionCount,
          includeAnswerKey
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate worksheet')
      }
      
      setGenerated(data)
      toast({
        title: "📝 Worksheet Created!",
        description: `"${data.title}" with ${data.questionCount} questions is ready!`
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

  const selectedType = WORKSHEET_TYPES.find(w => w.id === worksheetType)

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
            <span className="text-4xl">📝</span>
            Worksheet Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create educational worksheets for any grade level
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Sell for $5-$20
        </Badge>
      </div>

      {/* Platform badges */}
      <Card className="border-dashed bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Perfect for:</span>
            {['Teachers Pay Teachers', 'Etsy', 'Gumroad', 'Homeschool Markets'].map((platform) => (
              <Badge key={platform} variant="outline" className="bg-white dark:bg-blue-900/50">
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
              {/* Subject Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Choose Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {WORKSHEET_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setWorksheetType(type.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          worksheetType === type.id 
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

              {/* Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Worksheet Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Topic / Skill</Label>
                    <Input
                      placeholder={worksheetType === 'math' ? 'e.g., Multiplication tables 1-10' : 'e.g., Main idea and details'}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Grade Level</Label>
                      <Select value={gradeLevel} onValueChange={setGradeLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Questions: {questionCount}</Label>
                      <Slider
                        value={[questionCount]}
                        onValueChange={([v]) => setQuestionCount(v)}
                        min={5}
                        max={25}
                        step={5}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include Answer Key</Label>
                    <Switch checked={includeAnswerKey} onCheckedChange={setIncludeAnswerKey} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Generate */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{selectedType?.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{topic || 'Your Worksheet'}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {GRADE_LEVELS.find(g => g.id === gradeLevel)?.name} • {questionCount} questions
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Badge variant="outline">{selectedType?.name}</Badge>
                      {includeAnswerKey && <Badge variant="outline">+ Answer Key</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Worksheet (15-30s)...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Worksheet</>
                )}
              </Button>

              {generated && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Worksheet Ready!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {generated.questionCount} questions{includeAnswerKey ? ' + answer key' : ''}
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
                  <CardTitle>Worksheet Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={worksheetType} onValueChange={setWorksheetType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORKSHEET_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.icon} {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grade Level</Label>
                      <Select value={gradeLevel} onValueChange={setGradeLevel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Topic / Skill Focus</Label>
                    <Input
                      placeholder="Be specific for better results..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Questions: {questionCount}</Label>
                      <Slider
                        value={[questionCount]}
                        onValueChange={([v]) => setQuestionCount(v)}
                        min={5}
                        max={30}
                        step={5}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <Switch checked={includeAnswerKey} onCheckedChange={setIncludeAnswerKey} />
                      <Label>Include Answer Key</Label>
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
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Worksheet</>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-800 dark:text-blue-200">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-blue-700 dark:text-blue-300">
                  <p>• Bundle 10+ worksheets for $15-20</p>
                  <p>• Seasonal themes sell well</p>
                  <p>• Math & reading have highest demand</p>
                  <p>• Answer keys add perceived value</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
