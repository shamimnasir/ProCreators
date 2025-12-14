'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Sparkles, Loader2, DollarSign, GraduationCap, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const WORKSHEET_SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: '📊', topics: 'Addition, subtraction, multiplication, fractions' },
  { id: 'reading', name: 'Reading & Writing', icon: '📚', topics: 'Comprehension, vocabulary, grammar' },
  { id: 'science', name: 'Science', icon: '🧪', topics: 'Biology, chemistry, physics basics' },
  { id: 'language', name: 'Language Learning', icon: '🌍', topics: 'Spanish, French, vocabulary practice' },
  { id: 'handwriting', name: 'Handwriting', icon: '✏️', topics: 'Letter tracing, cursive practice' },
  { id: 'phonics', name: 'Phonics', icon: '🔤', topics: 'Letter sounds, blending, sight words' },
  { id: 'social', name: 'Social Studies', icon: '🌎', topics: 'Geography, history, civics' },
  { id: 'art', name: 'Art & Creativity', icon: '🎨', topics: 'Drawing prompts, color theory' },
]

const GRADE_LEVELS = [
  { id: 'prek', name: 'Pre-K (Ages 3-4)', ageRange: '3-4' },
  { id: 'kindergarten', name: 'Kindergarten (Ages 5-6)', ageRange: '5-6' },
  { id: 'grade1-2', name: '1st-2nd Grade (Ages 6-8)', ageRange: '6-8' },
  { id: 'grade3-5', name: '3rd-5th Grade (Ages 8-11)', ageRange: '8-11' },
  { id: 'grade6-8', name: '6th-8th Grade (Ages 11-14)', ageRange: '11-14' },
  { id: 'highschool', name: 'High School (Ages 14-18)', ageRange: '14-18' },
]

const WORKSHEET_TYPES = [
  { id: 'practice', name: 'Practice Problems', description: 'Repetitive exercises for skill building' },
  { id: 'quiz', name: 'Quiz/Test', description: 'Assessment with answer key' },
  { id: 'activity', name: 'Activity Sheet', description: 'Fun, engaging activities' },
  { id: 'tracing', name: 'Tracing/Writing', description: 'Handwriting and tracing practice' },
  { id: 'coloring', name: 'Color by Number/Answer', description: 'Learning through coloring' },
  { id: 'puzzle', name: 'Puzzles & Games', description: 'Word searches, crosswords' },
]

export default function WorksheetMakerPage() {
  const [mode, setMode] = useState('easy')
  const [subject, setSubject] = useState('math')
  const [gradeLevel, setGradeLevel] = useState('kindergarten')
  const [worksheetType, setWorksheetType] = useState('practice')
  const [pageCount, setPageCount] = useState(10)
  const [customTopic, setCustomTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast({
        title: 'Worksheets Generated!',
        description: `${pageCount} ${WORKSHEET_SUBJECTS.find(s => s.id === subject)?.name} worksheets ready!`
      })
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

  const selectedSubject = WORKSHEET_SUBJECTS.find(s => s.id === subject)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-500" />
            Worksheet Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create educational worksheets for all grade levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Sell for $5-$20
          </Badge>
          <Badge variant="outline">Teachers Pay Teachers • Etsy</Badge>
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
            {/* Subject Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                  Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {WORKSHEET_SUBJECTS.map((s) => (
                    <Button
                      key={s.id}
                      variant={subject === s.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setSubject(s.id)}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs">{s.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grade Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                  Grade Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {GRADE_LEVELS.map((grade) => (
                    <Button
                      key={grade.id}
                      variant={gradeLevel === grade.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setGradeLevel(grade.id)}
                    >
                      <GraduationCap className="mr-2 h-4 w-4" />
                      {grade.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Worksheet Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">3</span>
                  Worksheet Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {WORKSHEET_TYPES.map((type) => (
                    <Button
                      key={type.id}
                      variant={worksheetType === type.id ? 'default' : 'outline'}
                      className="w-full justify-start h-auto py-2"
                      onClick={() => setWorksheetType(type.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{type.name}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Section */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedSubject?.icon}</div>
                  <div>
                    <h3 className="font-semibold">{selectedSubject?.name} Worksheets</h3>
                    <p className="text-sm text-muted-foreground">
                      {GRADE_LEVELS.find(g => g.id === gradeLevel)?.name} • {WORKSHEET_TYPES.find(t => t.id === worksheetType)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 30, 50].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} pages
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="lg" onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pro Mode - Custom Worksheets</CardTitle>
              <CardDescription>Create worksheets for specific topics or requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Specific Topic</Label>
                <Input
                  placeholder="e.g., Two-digit addition with regrouping, or Sight words for kindergarten"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORKSHEET_SUBJECTS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
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
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={worksheetType} onValueChange={setWorksheetType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORKSHEET_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pages</Label>
                  <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 30, 50].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n} pages</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Custom Worksheets</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selling Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Best Selling Worksheet Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Name Tracing</p>
              <p className="text-blue-700 dark:text-blue-300">Personalized worksheets with kids' names - high demand!</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Sight Words</p>
              <p className="text-blue-700 dark:text-blue-300">Dolch word lists for kindergarten and 1st grade</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Math Facts</p>
              <p className="text-blue-700 dark:text-blue-300">Addition/multiplication drill sheets sell year-round</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Seasonal Bundles</p>
              <p className="text-blue-700 dark:text-blue-300">Back-to-school, holiday-themed worksheet packs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
