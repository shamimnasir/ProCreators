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
import { Smile, Download, Sparkles, Loader2, Image, Type, Upload, Wand2, Copy, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const MEME_TEMPLATES = [
  { id: 'drake', name: 'Drake Hotline', icon: '👉', description: 'Yes/No comparison' },
  { id: 'distracted', name: 'Distracted Boyfriend', icon: '👀', description: 'Three-way attention' },
  { id: 'change-mind', name: 'Change My Mind', icon: '🤔', description: 'Hot take statement' },
  { id: 'expanding-brain', name: 'Expanding Brain', icon: '🧠', description: 'Escalating ideas' },
  { id: 'two-buttons', name: 'Two Buttons', icon: '🔘', description: 'Difficult choice' },
  { id: 'woman-cat', name: 'Woman Yelling at Cat', icon: '🐱', description: 'Argument meme' },
  { id: 'is-this', name: 'Is This a Pigeon?', icon: '🦋', description: 'Misidentification' },
  { id: 'stonks', name: 'Stonks', icon: '📈', description: 'Success/failure' },
  { id: 'custom', name: 'Custom/AI Generated', icon: '🎨', description: 'Create your own' },
]

const MEME_TOPICS = [
  { id: 'work', name: 'Work/Office Life', emoji: '💼' },
  { id: 'relationships', name: 'Relationships', emoji: '💕' },
  { id: 'tech', name: 'Tech/Programming', emoji: '💻' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'school', name: 'School/College', emoji: '🎓' },
  { id: 'parenting', name: 'Parenting', emoji: '👶' },
  { id: 'fitness', name: 'Fitness/Diet', emoji: '💪' },
  { id: 'money', name: 'Money/Finance', emoji: '💰' },
  { id: 'general', name: 'General Humor', emoji: '😂' },
]

export default function MemeGeneratorPage() {
  const [mode, setMode] = useState('easy')
  const [template, setTemplate] = useState('drake')
  const [topic, setTopic] = useState('work')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [ideaPrompt, setIdeaPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedMeme, setGeneratedMeme] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('meme-generator')
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
          toolType: 'meme-text',
          template,
          topic,
          context: ideaPrompt,
          style: mode === 'ai' ? 'relatable' : 'custom'
        })
      })
      
      const data = await response.json()
      if (data.success && data.data.variations) {
        const firstVariation = data.data.variations[0]
        setTopText(firstVariation.topText || topText)
        setBottomText(firstVariation.bottomText || bottomText)
        toast({
          title: '😂 Meme Text Generated!',
          description: 'Your meme text is ready!'
        })
        setGeneratedMeme(data.data)
      } else if (!data.success) {
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

  const handleAIIdea = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'meme-text',
          template,
          topic,
          context: '',
          style: 'relatable'
        })
      })
      
      const data = await response.json()
      if (data.success && data.data.variations) {
        const firstVariation = data.data.variations[0]
        setTopText(firstVariation.topText || '')
        setBottomText(firstVariation.bottomText || '')
        toast({ title: '💡 AI Generated Idea!' })
      } else {
        await refund(creditResult.transactionId, data.error)
        throw new Error(data.error || 'Failed to generate idea')
      }
    } catch (error) {
      toast({
        title: 'Idea Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smile className="h-8 w-8 text-yellow-500" />
            AI Meme Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create viral memes with AI assistance
          </p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Fun & Viral
        </Badge>
      </div>

      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="easy">🌟 Easy - Pick Template</TabsTrigger>
          <TabsTrigger value="ai">🤖 AI - Generate Ideas</TabsTrigger>
          <TabsTrigger value="custom">🎨 Custom - Upload Image</TabsTrigger>
        </TabsList>

        {/* Easy Mode - Template Selection */}
        <TabsContent value="easy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>1️⃣ Choose Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {MEME_TEMPLATES.slice(0, 8).map((t) => (
                    <Button
                      key={t.id}
                      variant={template === t.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setTemplate(t.id)}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-xs text-center">{t.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2️⃣ Add Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Top Text</Label>
                  <Input
                    placeholder="When you..."
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bottom Text</Label>
                  <Input
                    placeholder="But then..."
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full" onClick={handleAIIdea} disabled={generating}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Suggest Text
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">


            <CreditCostBadge toolId="meme-generator" />


            <Button size="lg" className="flex-1" onClick={handleGenerate} disabled={generating || (!topText && !bottomText)}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Meme...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Meme</>
            )}
          </Button>


          </div>
        </TabsContent>

        {/* AI Mode - Let AI Generate Everything */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Let AI Create Your Meme</CardTitle>
              <CardDescription>Just describe what you want or pick a topic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Topic/Category</Label>
                <div className="flex flex-wrap gap-2">
                  {MEME_TOPICS.map((t) => (
                    <Button
                      key={t.id}
                      variant={topic === t.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTopic(t.id)}
                    >
                      {t.emoji} {t.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Describe Your Meme Idea (Optional)</Label>
                <Textarea
                  placeholder="e.g., A meme about programmers and debugging code at 3am"
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                />
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is Thinking...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate AI Meme</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Mode - Upload Image */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Own Image</CardTitle>
              <CardDescription>Add meme text to any image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Top Text</Label>
                  <Input placeholder="Top text..." />
                </div>
                <div className="space-y-2">
                  <Label>Bottom Text</Label>
                  <Input placeholder="Bottom text..." />
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Create Custom Meme</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Meme Preview */}
      {generatedMeme && generatedMeme.variations && (
        <Card>
          <CardHeader>
            <CardTitle>🎉 Your Meme Text is Ready!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedMeme.variations.map((variation, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                  <div className="p-4 text-center">
                    <p className="text-white font-bold text-xl uppercase tracking-wide" style={{textShadow: '2px 2px 0 #000'}}>
                      {variation.topText}
                    </p>
                    <div className="py-8">
                      <Smile className="h-16 w-16 mx-auto text-white/30" />
                      <p className="text-white/50 text-sm mt-2">Your meme image here</p>
                    </div>
                    <p className="text-white font-bold text-xl uppercase tracking-wide" style={{textShadow: '2px 2px 0 #000'}}>
                      {variation.bottomText}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center italic">{variation.explanation}</p>
              </div>
            ))}
            {generatedMeme.hashtags && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Suggested hashtags:</p>
                <p className="text-primary">{generatedMeme.hashtags.map(h => `#${h}`).join(' ')}</p>
              </div>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <Button onClick={() => {
                const text = `${topText}\\n${bottomText}`
                navigator.clipboard.writeText(text)
                toast({ title: 'Copied!', description: 'Meme text copied to clipboard' })
              }}>
                <Copy className="mr-2 h-4 w-4" /> Copy Text
              </Button>
              <Button variant="outline" onClick={() => setGeneratedMeme(null)}>
                <RefreshCw className="mr-2 h-4 w-4" /> New Meme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200">💡 Viral Meme Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Keep it Relatable</p>
              <p className="text-yellow-700 dark:text-yellow-300">The best memes tap into shared experiences</p>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Short & Punchy</p>
              <p className="text-yellow-700 dark:text-yellow-300">Less text = more impact and shareability</p>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Timing Matters</p>
              <p className="text-yellow-700 dark:text-yellow-300">Trending topics get more engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
