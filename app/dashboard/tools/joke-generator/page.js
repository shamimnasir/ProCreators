'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Laugh, Loader2, Copy, RefreshCw, Share2, Wand2, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const JOKE_TYPES = [
  { id: 'one-liner', name: 'One-Liner', icon: '💬' },
  { id: 'pun', name: 'Puns', icon: '🎭' },
  { id: 'knock-knock', name: 'Knock-Knock', icon: '🚪' },
  { id: 'observational', name: 'Observational', icon: '👀' },
  { id: 'dad-joke', name: 'Dad Jokes', icon: '👨' },
  { id: 'any', name: 'Surprise Me!', icon: '🎲' }
]

const TONES = [
  { id: 'funny', name: 'Classic Funny' },
  { id: 'clever', name: 'Clever & Witty' },
  { id: 'silly', name: 'Silly & Absurd' },
  { id: 'wholesome', name: 'Wholesome' },
  { id: 'sarcastic', name: 'Sarcastic' }
]

const TOPICS = [
  'Work & Office', 'Technology', 'Relationships', 'Food', 'Animals',
  'Sports', 'School', 'Parents', 'Weather', 'Monday Blues'
]

export default function JokeGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [jokeType, setJokeType] = useState('any')
  const [tone, setTone] = useState('funny')
  const [count, setCount] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [jokes, setJokes] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    const finalTopic = customTopic || topic
    if (!finalTopic) {
      toast({
        title: 'Topic Required',
        description: 'Please select or enter a topic for jokes',
        variant: 'destructive'
      })
      return
    }

    setGenerating(true)
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('joke-generator', { count })
    if (!creditResult.success) {
      setGenerating(false)
      toast({
        title: 'Insufficient Credits',
        description: creditResult.error || 'You need more credits to generate jokes.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'joke',
          topic: finalTopic,
          jokeType,
          tone,
          count
        })
      })

      const data = await response.json()
      if (data.success) {
        // Mark transaction as complete
        await complete(creditResult.transactionId)
        setJokes(data.data)
        toast({
          title: '🤣 Jokes Generated!',
          description: `${count} jokes ready! Used ${creditResult.cost} credits.`
        })
      } else {
        // Refund on failure
        await refund(creditResult.transactionId, data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message + ' (Credits refunded)',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyJoke = (joke) => {
    const text = joke.punchline 
      ? `${joke.setup}\n${joke.punchline}`
      : joke
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: 'Joke copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Laugh className="h-8 w-8 text-yellow-500" />
            Joke Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate hilarious jokes on any topic with AI
          </p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800">
          <Zap className="h-3 w-3 mr-1" />
          Instant Laughs
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>What makes you laugh?</CardTitle>
            <CardDescription>Pick a topic and style for your jokes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quick Topics</Label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <Button
                    key={t}
                    variant={topic === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTopic(t); setCustomTopic(''); }}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or Enter Custom Topic</Label>
              <Input
                placeholder="e.g., programmers, cats, coffee addicts..."
                value={customTopic}
                onChange={(e) => { setCustomTopic(e.target.value); setTopic(''); }}
              />
            </div>

            <div className="space-y-2">
              <Label>Joke Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {JOKE_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={jokeType === type.id ? 'default' : 'outline'}
                    className="h-auto py-2 flex flex-col items-center gap-1"
                    onClick={() => setJokeType(type.id)}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Jokes</Label>
                <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 3, 5, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} jokes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <CreditCostBadge toolId="joke-generator" />
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={handleGenerate} 
                disabled={generating || (!topic && !customTopic)}
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Jokes...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate Jokes</>  
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <div className="space-y-4">
          {jokes?.jokes?.map((joke, index) => (
            <Card key={index} className="group">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-lg">{joke.setup}</p>
                    <p className="text-primary mt-2 text-lg font-bold">{joke.punchline}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{joke.type}</Badge>
                      <Badge variant="secondary">{joke.rating}</Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyJoke(joke)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {jokes?.bonusJoke && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <span className="text-xl">🎁</span> Bonus Joke!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-900 dark:text-yellow-100">{jokes.bonusJoke}</p>
              </CardContent>
            </Card>
          )}

          {!jokes && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Laugh className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your jokes will appear here</p>
                <p className="text-sm">Pick a topic and generate some laughs!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Pro Comedy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Timing is Everything</p>
              <p className="text-yellow-700 dark:text-yellow-300">Pause before the punchline for maximum effect</p>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Know Your Audience</p>
              <p className="text-yellow-700 dark:text-yellow-300">Tailor jokes to who you are sharing with</p>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Less is More</p>
              <p className="text-yellow-700 dark:text-yellow-300">Short, punchy jokes often land better</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
