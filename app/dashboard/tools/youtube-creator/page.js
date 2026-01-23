'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Youtube, Sparkles, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  Play, Clock, FileText, Zap, ChevronDown, ChevronUp,
  Check, Edit3, Hash, Eye, ThumbsUp, AlertCircle,
  Video, Mic, PenTool, BookOpen, ArrowLeft, Timer
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

// Hook Types based on vidIQ strategies
const HOOK_TYPES = [
  { 
    id: 'curiosity', 
    name: 'The Curiosity Hook', 
    icon: '🤔',
    template: '"I thought I knew [topic], until I found out [surprising twist]."',
    description: 'Creates open loops that viewers need to close',
    example: 'I thought I knew how to edit videos, until I found out this $0 trick beats $300 software.'
  },
  { 
    id: 'action', 
    name: 'Drop Into Action', 
    icon: '🎬',
    template: '"It\'s [time]. I\'m [in the middle of problem]. Here\'s what I did next."',
    description: 'Skip the buildup, start where it hurts',
    example: "It's 2am. I'm staring at $50,000 in debt. Here's what I did next."
  },
  { 
    id: 'audience', 
    name: 'Audience-Centric Hook', 
    icon: '👤',
    template: '"You\'re doing [common mistake], and it\'s costing you [pain]. Let\'s fix it."',
    description: 'Call out a problem they didn\'t know they had',
    example: "You're doing keyword research wrong, and it's costing you thousands of views. Let's fix it."
  },
  { 
    id: 'time-promise', 
    name: 'Time-Promise Hook', 
    icon: '⏱️',
    template: '"In the next [X] minutes, you\'ll learn [specific outcome] so you can [benefit]."',
    description: 'Set clear expectations for what they\'ll get',
    example: "In the next 8 minutes, you'll learn my exact editing workflow so you can cut your editing time in half."
  },
  { 
    id: 'stakes', 
    name: 'Raise the Stakes', 
    icon: '🎯',
    template: '"If you don\'t fix [problem], you\'ll keep [bad outcome]. Here\'s the workaround."',
    description: 'Put something on the line, make it emotional',
    example: "If you don't fix your lighting, you'll keep losing subscribers. Here's the $20 solution."
  },
  { 
    id: 'contrarian', 
    name: 'Contrarian Hook', 
    icon: '🔥',
    template: '"Stop doing [popular advice]. Do this instead, and here\'s why."',
    description: 'Challenge what people think they know',
    example: "Stop posting daily on YouTube. Post THIS way instead, and here's why it works better."
  },
  { 
    id: 'conflict-tease', 
    name: 'Conflict Tease', 
    icon: '⚡',
    template: '"Everything was going perfectly... until [unexpected turn]. What happened next changed everything."',
    description: 'Tease the central conflict to hook viewers into the story',
    example: "Everything was going perfectly with my business... until I got a call that changed everything. What happened next nearly broke me."
  },
  { 
    id: 'transformation', 
    name: 'Transformation Hook', 
    icon: '🦋',
    template: '"[X time] ago, I was [bad state]. Today, I\'m [transformed state]. Here\'s the moment that changed it all."',
    description: 'Show the before/after to promise a transformation story',
    example: "2 years ago, I was $100K in debt. Today, I'm financially free. Here's the moment that changed it all."
  }
]

// Script Structure Options
const SCRIPT_STRUCTURES = [
  {
    id: 'bens',
    name: 'BENS Structure',
    description: 'Hook → Re-hook → Content → Loop → Payoff',
    icon: '📋',
    bestFor: 'Tutorials, Educational, How-To',
    sections: [
      { name: 'Hook', time: '0-15s', desc: 'Grab attention immediately' },
      { name: 'Re-hook', time: '15-30s', desc: 'Why they should keep watching' },
      { name: 'Content', time: 'Body', desc: 'Deliver value with pattern interrupts' },
      { name: 'Loop', time: 'Mid', desc: 'Tease upcoming climax' },
      { name: 'Payoff + CTA', time: 'End', desc: 'Close the loop, call to action' }
    ]
  },
  {
    id: 'conflict-arc',
    name: 'Conflict Arc',
    description: 'Hook → Rising Action → Conflict → Comeback → Payoff',
    icon: '🎭',
    bestFor: 'Storytelling, Vlogs, Personal Stories',
    sections: [
      { name: 'Hook', time: '0-15s', desc: 'Start with tension or tease the conflict', color: 'bg-green-500' },
      { name: 'Rising Action', time: 'Act 1', desc: 'Build context, introduce stakes', color: 'bg-orange-500' },
      { name: 'Conflict', time: 'Peak 1', desc: 'The main problem/challenge hits', color: 'bg-red-500' },
      { name: 'Comeback', time: 'Valley', desc: 'The turning point, finding hope', color: 'bg-teal-500' },
      { name: 'Rising Action 2', time: 'Act 2', desc: 'Build toward resolution', color: 'bg-orange-500' },
      { name: 'Payoff', time: 'Climax', desc: 'Resolution + emotional peak + CTA', color: 'bg-purple-500' }
    ]
  },
  {
    id: 'hero-journey',
    name: 'Mini Hero Journey',
    description: 'Call → Challenge → Transformation → Return',
    icon: '🦸',
    bestFor: 'Personal Development, Success Stories',
    sections: [
      { name: 'The Call', time: 'Opening', desc: 'The problem that demanded action', color: 'bg-blue-500' },
      { name: 'Refusal/Doubt', time: 'Act 1', desc: 'Initial hesitation or failure', color: 'bg-gray-500' },
      { name: 'The Challenge', time: 'Mid', desc: 'Facing the main obstacle', color: 'bg-red-500' },
      { name: 'Transformation', time: 'Climax', desc: 'The breakthrough moment', color: 'bg-yellow-500' },
      { name: 'The Return', time: 'End', desc: 'Sharing wisdom + CTA', color: 'bg-green-500' }
    ]
  }
]

// Video Categories/Niches
const VIDEO_CATEGORIES = [
  { id: 'tutorial', name: 'Tutorial/How-To', icon: '📚' },
  { id: 'review', name: 'Product Review', icon: '⭐' },
  { id: 'listicle', name: 'Listicle/Top X', icon: '📋' },
  { id: 'story', name: 'Story/Vlog', icon: '📖' },
  { id: 'educational', name: 'Educational', icon: '🎓' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'commentary', name: 'Commentary', icon: '💬' },
  { id: 'shorts', name: 'YouTube Shorts', icon: '📱' }
]

// Video Lengths
const VIDEO_LENGTHS = [
  { id: 'short', name: 'Short (1-3 min)', words: '150-450', icon: '⚡' },
  { id: 'medium', name: 'Medium (5-8 min)', words: '750-1200', icon: '📺' },
  { id: 'long', name: 'Long (10-15 min)', words: '1500-2250', icon: '🎬' },
  { id: 'extended', name: 'Extended (20+ min)', words: '3000+', icon: '🎥' }
]

// Content Tones
const CONTENT_TONES = [
  { id: 'energetic', name: 'Energetic', icon: '⚡', desc: 'High energy, exciting' },
  { id: 'conversational', name: 'Conversational', icon: '💬', desc: 'Casual, like talking to a friend' },
  { id: 'professional', name: 'Professional', icon: '💼', desc: 'Expert, authoritative' },
  { id: 'storytelling', name: 'Storytelling', icon: '📖', desc: 'Narrative, engaging' },
  { id: 'educational', name: 'Educational', icon: '🎓', desc: 'Clear, informative' },
  { id: 'entertaining', name: 'Entertaining', icon: '🎭', desc: 'Fun, humorous' }
]

export default function YouTubeCreatorPage() {
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('setup')
  const [copied, setCopied] = useState({})
  const { toast } = useToast()

  // Form state
  const [videoTopic, setVideoTopic] = useState('')
  const [videoCategory, setVideoCategory] = useState('tutorial')
  const [videoLength, setVideoLength] = useState('medium')
  const [contentTone, setContentTone] = useState('conversational')
  const [hookType, setHookType] = useState('curiosity')
  const [targetAudience, setTargetAudience] = useState('')
  const [mainKeyword, setMainKeyword] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  
  // Output tabs
  const [outputTab, setOutputTab] = useState('script')
  
  // Results
  const [result, setResult] = useState(null)

  const generateContent = async () => {
    if (!videoTopic.trim()) {
      toast({ title: 'Missing Topic', description: 'Please enter your video topic', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/youtube-creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTopic,
          videoCategory,
          videoLength,
          contentTone,
          hookType,
          targetAudience,
          mainKeyword,
          keyPoints
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveTab('results')
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'youtube-content',
            category: 'text',
            title: `YouTube: ${videoTopic.substring(0, 50)}${videoTopic.length > 50 ? '...' : ''}`,
            description: `YouTube ${videoCategory} content - ${videoLength} video`,
            content: JSON.stringify(data.data),
            metadata: {
              videoTopic,
              videoCategory,
              videoLength,
              contentTone,
              hookType,
              mainKeyword,
              contentType: 'youtube-creator'
            }
          })
          if (saveResult.success) {
            toast({ title: '🎬 YouTube Content Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '🎬 YouTube Content Generated!', description: '⚠️ Could not save to library' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '🎬 YouTube Content Generated!' })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }, [toast])

  const selectedHook = HOOK_TYPES.find(h => h.id === hookType)
  const selectedLength = VIDEO_LENGTHS.find(l => l.id === videoLength)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tools/linkedin-posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Youtube className="h-7 w-7 text-red-500" />
              YouTube Script & Content Creator
            </h1>
            <Badge className="bg-red-500 text-white">New</Badge>
          </div>
          <p className="text-muted-foreground">Create high-retention scripts, viral titles, hooks & descriptions</p>
        </div>
      </div>

      {/* Stats Banner */}
      <Card className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">BENS</div>
              <div className="text-xs text-red-100">Script Method</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">6</div>
              <div className="text-xs text-red-100">Hook Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">High</div>
              <div className="text-xs text-red-100">CTR Titles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">SEO</div>
              <div className="text-xs text-red-100">Optimized</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="setup">📝 Setup</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>🎬 Results</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              {/* Video Topic */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Topic
                  </CardTitle>
                  <CardDescription>What's your video about?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={videoTopic}
                    onChange={(e) => setVideoTopic(e.target.value)}
                    placeholder="e.g., How I grew my YouTube channel from 0 to 100K subscribers in 6 months using these 5 strategies"
                    className="min-h-[100px]"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Main Keyword (SEO)</Label>
                      <Input
                        value={mainKeyword}
                        onChange={(e) => setMainKeyword(e.target.value)}
                        placeholder="e.g., grow YouTube channel"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Target Audience</Label>
                      <Input
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., beginner YouTubers"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Category */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Video Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {VIDEO_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setVideoCategory(cat.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          videoCategory === cat.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                            : 'border-muted hover:border-red-300'
                        }`}
                      >
                        <div className="text-lg">{cat.icon}</div>
                        <div className="text-[10px] font-medium truncate">{cat.name}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Video Length & Tone */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Length & Tone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Video Length</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {VIDEO_LENGTHS.map((len) => (
                        <button
                          key={len.id}
                          onClick={() => setVideoLength(len.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            videoLength === len.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                              : 'border-muted hover:border-red-300'
                          }`}
                        >
                          <div className="text-lg">{len.icon}</div>
                          <div className="text-[10px] font-medium">{len.name}</div>
                        </button>
                      ))}
                    </div>
                    {selectedLength && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Script length: ~{selectedLength.words} words
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-2 block">Content Tone</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CONTENT_TONES.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setContentTone(tone.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            contentTone === tone.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                              : 'border-muted hover:border-red-300'
                          }`}
                        >
                          <div className="text-lg">{tone.icon}</div>
                          <div className="text-[10px] font-medium">{tone.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Hook & Key Points */}
            <div className="space-y-4">
              {/* Hook Type Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Hook Type
                  </CardTitle>
                  <CardDescription>Choose your opening hook strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {HOOK_TYPES.map((hook) => (
                      <button
                        key={hook.id}
                        onClick={() => setHookType(hook.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          hookType === hook.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                            : 'border-muted hover:border-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{hook.icon}</span>
                          <span className="text-sm font-medium">{hook.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{hook.description}</p>
                      </button>
                    ))}
                  </div>
                  
                  {/* Selected Hook Preview */}
                  {selectedHook && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg border border-red-200">
                      <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">Template:</p>
                      <p className="text-sm italic text-red-700 dark:text-red-300">{selectedHook.template}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Example:</strong> {selectedHook.example}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Points */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Key Points (Optional)
                  </CardTitle>
                  <CardDescription>Main points to cover in the video</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    placeholder="Enter key points you want to cover, one per line:&#10;- Point 1: Consistency is key&#10;- Point 2: Optimize thumbnails&#10;- Point 3: Engage with comments"
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

              {/* Script Structure Info */}
              <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-800 dark:text-red-200">
                    <Target className="h-5 w-5" />
                    High-Retention Script Structure (BENS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs text-red-700 dark:text-red-300">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">0-15s</Badge>
                      <span><strong>Hook:</strong> Grab attention immediately</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">15-30s</Badge>
                      <span><strong>Re-hook:</strong> Why they should keep watching</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">Body</Badge>
                      <span><strong>Story/Content:</strong> Deliver value with pattern interrupts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">Mid</Badge>
                      <span><strong>Loop:</strong> Tease upcoming climax</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">End</Badge>
                      <span><strong>Payoff + CTA:</strong> Close the loop, call to action</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                onClick={generateContent} 
                disabled={generating || !videoTopic.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                size="lg"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Content...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate YouTube Content</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              {/* Output Type Tabs */}
              <div className="flex gap-2 flex-wrap">
                {['script', 'titles', 'hooks', 'description', 'tags'].map((tab) => (
                  <Button
                    key={tab}
                    variant={outputTab === tab ? 'default' : 'outline'}
                    onClick={() => setOutputTab(tab)}
                    className={outputTab === tab ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {tab === 'script' && <FileText className="h-4 w-4 mr-1" />}
                    {tab === 'titles' && <PenTool className="h-4 w-4 mr-1" />}
                    {tab === 'hooks' && <Zap className="h-4 w-4 mr-1" />}
                    {tab === 'description' && <MessageSquare className="h-4 w-4 mr-1" />}
                    {tab === 'tags' && <Hash className="h-4 w-4 mr-1" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Script Output */}
              {outputTab === 'script' && result.script && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-500" />
                        Full Video Script
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{result.script.split(/\s+/).length} words</Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCopy(result.script, 'script')}
                        >
                          {copied.script ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg">
                        {result.script}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Titles Output */}
              {outputTab === 'titles' && result.titles && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5 text-red-500" />
                      High-CTR Title Options
                    </CardTitle>
                    <CardDescription>Front-loaded keywords, 40-60 characters, curiosity-driven</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.titles.map((title, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-muted/30 rounded-lg border hover:border-red-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-base">{title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {title.length} characters
                              {title.length <= 60 && <Badge variant="outline" className="ml-2 text-[10px]">✓ Good length</Badge>}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(title, `title-${idx}`)}
                          >
                            {copied[`title-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Hooks Output */}
              {outputTab === 'hooks' && result.hooks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Opening Hook Variations
                    </CardTitle>
                    <CardDescription>First 15 seconds - grab attention immediately</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.hooks.map((hook, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Badge className="mb-2 bg-yellow-500">{HOOK_TYPES[idx % HOOK_TYPES.length]?.name || `Hook ${idx + 1}`}</Badge>
                            <p className="text-sm leading-relaxed">{hook}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(hook, `hook-${idx}`)}
                          >
                            {copied[`hook-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Description Output */}
              {outputTab === 'description' && result.description && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-red-500" />
                        Video Description
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopy(result.description, 'description')}
                      >
                        {copied.description ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <CardDescription>SEO-optimized with timestamps, links, and CTAs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg">
                      {result.description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags Output */}
              {outputTab === 'tags' && result.tags && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-red-500" />
                        Video Tags
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopy(result.tags.join(', '), 'tags')}
                      >
                        {copied.tags ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <CardDescription>SEO tags for discoverability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setResult(null); setActiveTab('setup') }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Start Over
                </Button>
                <Button 
                  onClick={generateContent}
                  disabled={generating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Regenerate
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Youtube className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">YouTube Success Tips</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• <strong>No-Filler Rule:</strong> Skip long intros, start with the topic immediately</li>
                <li>• <strong>Pattern Interrupts:</strong> Change visuals every 5-10 seconds (B-roll, text, zoom)</li>
                <li>• <strong>Open Loops:</strong> Tease upcoming content to prevent mid-video drops</li>
                <li>• <strong>Title + Thumbnail:</strong> They must tell a cohesive story together</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
