'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Sparkles, Loader2, Copy, Download, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const GENRES = [
  { id: 'fantasy', name: 'Fantasy', icon: '🧙', desc: 'Magic, dragons, epic quests' },
  { id: 'scifi', name: 'Sci-Fi', icon: '🚀', desc: 'Space, future tech, aliens' },
  { id: 'romance', name: 'Romance', icon: '💕', desc: 'Love stories, relationships' },
  { id: 'mystery', name: 'Mystery', icon: '🔍', desc: 'Whodunits, suspense' },
  { id: 'horror', name: 'Horror', icon: '👻', desc: 'Scary, supernatural' },
  { id: 'adventure', name: 'Adventure', icon: '🗺️', desc: 'Exploration, action' },
  { id: 'comedy', name: 'Comedy', icon: '😄', desc: 'Funny, lighthearted' },
  { id: 'drama', name: 'Drama', icon: '🎭', desc: 'Emotional, realistic' }
]

const AUDIENCES = [
  { id: 'kids', name: 'Kids (5-12)', icon: '🧒' },
  { id: 'teen', name: 'Teens (13-17)', icon: '🎒' },
  { id: 'adult', name: 'Adults', icon: '📚' },
  { id: 'all', name: 'All Ages', icon: '👨‍👩‍👧‍👦' }
]

const LENGTHS = [
  { id: 'flash', name: 'Flash Fiction', desc: '~500 words' },
  { id: 'short', name: 'Short Story', desc: '~1000 words' },
  { id: 'medium', name: 'Medium Story', desc: '~2000 words' },
  { id: 'long', name: 'Long Story', desc: '~3000+ words' }
]

export default function StoryWriterPage() {
  const [genre, setGenre] = useState('fantasy')
  const [audience, setAudience] = useState('all')
  const [length, setLength] = useState('short')
  const [character, setCharacter] = useState('')
  const [setting, setSetting] = useState('')
  const [theme, setTheme] = useState('')
  const [elements, setElements] = useState('')
  const [generating, setGenerating] = useState(false)
  const [story, setStory] = useState(null)
  const [expandedChapter, setExpandedChapter] = useState(0)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('story-writer')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'story',
          genre,
          audience,
          length,
          character,
          setting,
          theme,
          elements
        })
      })

      const data = await response.json()
      if (data.success) {
        setStory(data.data)
        setExpandedChapter(0)
        await complete(creditResult.transactionId)
        toast({
          title: '📖 Story Created!',
          description: 'Your unique tale has been written'
        })
      } else {
        await refund(creditResult.transactionId, data.error)
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

  const copyStory = () => {
    let fullStory = `${story.title}\n\n`
    fullStory += `${story.opening}\n\n`
    story.chapters?.forEach(ch => {
      fullStory += `${ch.title}\n${ch.content}\n\n`
    })
    fullStory += `${story.climax}\n\n`
    fullStory += `${story.resolution}`
    if (story.moral) fullStory += `\n\nMoral: ${story.moral}`
    
    navigator.clipboard.writeText(fullStory)
    toast({ title: 'Copied!', description: 'Story copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-4 left-8 text-2xl animate-pulse">📚</div>
          <div className="absolute top-12 right-12 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>✨</div>
          <div className="absolute bottom-8 left-1/4 text-lg animate-pulse" style={{animationDelay: '1s'}}>🖋️</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Story Writer</h1>
              <p className="text-white/80">Create captivating stories with AI imagination</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎭</span> Story Settings
            </CardTitle>
            <CardDescription>Define your story's world and characters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Genre</Label>
              <div className="grid grid-cols-4 gap-2">
                {GENRES.map((g) => (
                  <Button
                    key={g.id}
                    variant={genre === g.id ? 'default' : 'outline'}
                    className="h-auto py-2 flex flex-col items-center gap-1"
                    onClick={() => setGenre(g.id)}
                  >
                    <span className="text-lg">{g.icon}</span>
                    <span className="text-[10px]">{g.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Story Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTHS.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Main Character (Optional)</Label>
              <Input
                placeholder="e.g., A young wizard named Luna, A brave knight, A curious scientist..."
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Setting (Optional)</Label>
              <Input
                placeholder="e.g., A floating city in the clouds, Ancient Egypt, Year 3000..."
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Theme (Optional)</Label>
              <Input
                placeholder="e.g., Friendship conquers all, Finding courage, The power of kindness..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Special Elements (Optional)</Label>
              <Textarea
                placeholder="e.g., Include a talking cat, a magical sword, a plot twist, a happy ending..."
                value={elements}
                onChange={(e) => setElements(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Crafting Your Story...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Story</>  
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Story Display */}
        <div className="space-y-4">
          {story ? (
            <>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <Badge className="mb-2">{GENRES.find(g => g.id === genre)?.icon} {GENRES.find(g => g.id === genre)?.name}</Badge>
                    <CardTitle className="text-amber-800 dark:text-amber-200 text-2xl">
                      {story.title}
                    </CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyStory}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Opening */}
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-inner">
                    <p className="text-amber-900 dark:text-amber-100 leading-relaxed italic">
                      {story.opening}
                    </p>
                  </div>

                  {/* Chapters */}
                  {story.chapters?.map((chapter, idx) => (
                    <Collapsible key={idx} open={expandedChapter === idx} onOpenChange={() => setExpandedChapter(expandedChapter === idx ? -1 : idx)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          <span className="font-medium">{chapter.title}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedChapter === idx ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg mt-2">
                          <p className="text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-line">
                            {chapter.content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}

                  {/* Climax */}
                  <div className="p-4 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg border-l-4 border-orange-500">
                    <p className="font-medium text-orange-800 dark:text-orange-200 mb-2">⚡ The Climax</p>
                    <p className="text-orange-900 dark:text-orange-100 leading-relaxed">
                      {story.climax}
                    </p>
                  </div>

                  {/* Resolution */}
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-inner">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">✨ The End</p>
                    <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
                      {story.resolution}
                    </p>
                  </div>

                  {/* Moral */}
                  {story.moral && (
                    <div className="p-4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg text-center">
                      <p className="text-sm text-amber-600 dark:text-amber-400">The Moral</p>
                      <p className="text-amber-900 dark:text-amber-100 font-medium italic">
                        "{story.moral}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed h-full min-h-[500px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50 text-amber-300" />
                <p className="text-lg">Your story will appear here</p>
                <p className="text-sm">Set your preferences and let AI weave a tale</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Storytelling Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Be Specific</p>
              <p className="text-amber-700 dark:text-amber-300">Unique details make stories memorable</p>
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Mix Genres</p>
              <p className="text-amber-700 dark:text-amber-300">Try combining fantasy with mystery!</p>
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Iterate</p>
              <p className="text-amber-700 dark:text-amber-300">Generate multiple versions to find your favorite</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
