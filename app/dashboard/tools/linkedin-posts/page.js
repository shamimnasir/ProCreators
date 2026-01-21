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
import { 
  Linkedin, Sparkles, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  ThumbsUp, Share2, Eye, Zap, Flame, Award,
  ChevronDown, ChevronUp, Check, Edit3, Hash,
  Users, Briefcase, BookOpen, Heart, AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const POST_FORMATS = [
  {
    id: 'authority-builder',
    name: 'Authority Builder',
    icon: '🏆',
    desc: 'Share expertise with case studies & results',
    example: 'MOST PEOPLE ARE MISSING THIS...\n\nWe built X that generates $Y/month...',
    bestFor: 'Thought leadership, credibility',
    engagement: 'Very High'
  },
  {
    id: 'contrarian-take',
    name: 'Contrarian Take',
    icon: '🔥',
    desc: 'Challenge conventional wisdom',
    example: 'Unpopular opinion: [Bold statement]\n\nHere\'s why everyone is wrong...',
    bestFor: 'Sparking debate, virality',
    engagement: 'Very High'
  },
  {
    id: 'story-hook',
    name: 'Story Hook',
    icon: '📖',
    desc: 'Personal story with a lesson',
    example: 'I got fired 3 years ago.\n\nBest thing that ever happened to me...',
    bestFor: 'Emotional connection',
    engagement: 'High'
  },
  {
    id: 'listicle',
    name: 'Listicle / Framework',
    icon: '📋',
    desc: 'Actionable tips in list format',
    example: '10 things I wish I knew before [X]:\n\n1. [Tip]\n2. [Tip]...',
    bestFor: 'Saves, shares, bookmarks',
    engagement: 'High'
  },
  {
    id: 'before-after',
    name: 'Before/After',
    icon: '🔄',
    desc: 'Transformation stories',
    example: '2019: Broke, confused, lost\n2024: [Success metrics]\n\nHere\'s what changed...',
    bestFor: 'Inspiration, relatability',
    engagement: 'High'
  },
  {
    id: 'pattern-interrupt',
    name: 'Pattern Interrupt',
    icon: '⚡',
    desc: 'Unexpected opening that stops scroll',
    example: 'DELETE this from your resume immediately.\n\nHiring managers hate it...',
    bestFor: 'Stopping the scroll',
    engagement: 'Very High'
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    icon: '🎯',
    desc: 'Step-by-step tutorial',
    example: 'How I [achieved X] in [timeframe]:\n\nStep 1: ...\nStep 2: ...',
    bestFor: 'Value-driven engagement',
    engagement: 'Medium-High'
  },
  {
    id: 'hot-take',
    name: 'Hot Take',
    icon: '🌶️',
    desc: 'Bold opinion on trending topic',
    example: '[Industry trend] is overrated.\n\nHere\'s what actually works...',
    bestFor: 'Comments, debates',
    engagement: 'Very High'
  },
  {
    id: 'myth-buster',
    name: 'Myth Buster',
    icon: '💥',
    desc: 'Debunk common misconceptions',
    example: 'Stop believing these [X] myths:\n\nMyth 1: [Common belief]\nTruth: [Reality]...',
    bestFor: 'Education, authority',
    engagement: 'High'
  },
  {
    id: 'engagement-bait',
    name: 'Engagement Driver',
    icon: '💬',
    desc: 'Question-based posts that drive comments',
    example: 'Controversial question:\n\n[Question]?\n\nDrop your answer below 👇',
    bestFor: 'Algorithm boost',
    engagement: 'Very High'
  }
]

const HOOK_STYLES = [
  { id: 'shocking-stat', name: 'Shocking Statistic', example: '97% of people fail at this.' },
  { id: 'bold-statement', name: 'Bold Statement', example: 'MOST PEOPLE ARE MISSING THIS.' },
  { id: 'question', name: 'Provocative Question', example: 'Why are you still doing [X]?' },
  { id: 'story-opener', name: 'Story Opener', example: 'I almost quit last month.' },
  { id: 'contrarian', name: 'Contrarian', example: 'Unpopular opinion:' },
  { id: 'command', name: 'Command/Urgency', example: 'STOP doing this immediately.' },
  { id: 'curiosity-gap', name: 'Curiosity Gap', example: 'Nobody talks about this...' },
  { id: 'result-first', name: 'Result First', example: '$500K in 6 months. Here\'s how:' }
]

const TONES = [
  { id: 'professional', name: 'Professional', icon: '👔' },
  { id: 'casual', name: 'Casual & Friendly', icon: '😊' },
  { id: 'inspirational', name: 'Inspirational', icon: '✨' },
  { id: 'bold', name: 'Bold & Direct', icon: '💪' },
  { id: 'storytelling', name: 'Storytelling', icon: '📚' },
  { id: 'educational', name: 'Educational', icon: '🎓' }
]

const CTA_OPTIONS = [
  { id: 'comment', name: 'Ask for Comments', example: 'Comment "[word]" and I\'ll send you...' },
  { id: 'question', name: 'End with Question', example: 'What would you add to this list?' },
  { id: 'save-share', name: 'Save & Share', example: '♻️ Repost to help others | 💾 Save for later' },
  { id: 'follow', name: 'Follow CTA', example: 'Follow for more [topic] content' },
  { id: 'dm', name: 'DM Trigger', example: 'DM me "[word]" for the full guide' },
  { id: 'none', name: 'No CTA', example: '' }
]

const INDUSTRIES = [
  'Technology/SaaS', 'Marketing/Advertising', 'Finance/Investing', 
  'Entrepreneurship', 'Career Development', 'Leadership/Management',
  'Sales', 'AI/Machine Learning', 'Personal Development',
  'Health & Wellness', 'Real Estate', 'E-commerce', 'Consulting', 'Other'
]

export default function LinkedInPostsPage() {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState({})
  const [activeVariation, setActiveVariation] = useState(0)
  const { toast } = useToast()
  
  // Form state
  const [topic, setTopic] = useState('')
  const [postFormat, setPostFormat] = useState('authority-builder')
  const [hookStyle, setHookStyle] = useState('bold-statement')
  const [tone, setTone] = useState('professional')
  const [industry, setIndustry] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [personalStory, setPersonalStory] = useState('')
  const [ctaType, setCtaType] = useState('comment')
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [postLength, setPostLength] = useState('medium')
  const [specificNumbers, setSpecificNumbers] = useState('')

  const handleGenerate = async () => {
    if (!topic) {
      toast({ 
        title: 'Missing Topic', 
        description: 'Please enter a topic for your post', 
        variant: 'destructive' 
      })
      return
    }
    
    setGenerating(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/linkedin-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          postFormat,
          hookStyle,
          tone,
          industry,
          targetAudience,
          keyPoints,
          personalStory,
          ctaType,
          includeEmojis,
          includeHashtags,
          postLength,
          specificNumbers
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveVariation(0)
        toast({ title: '✨ LinkedIn Posts Generated!' })
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

  const selectedFormat = POST_FORMATS.find(f => f.id === postFormat)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Linkedin className="h-8 w-8 text-blue-600" />
            LinkedIn Post Writer
          </h1>
          <p className="text-muted-foreground mt-1">Create viral posts that grow your network</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <TrendingUp className="h-3 w-3 mr-1" />Viral Formats
        </Badge>
      </div>

      {!result ? (
        <>
          {/* Tips Banner */}
          <Alert className="bg-blue-50 border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Pro Tip:</strong> Posts with a strong hook get 3x more engagement. The first line must stop the scroll!
            </AlertDescription>
          </Alert>

          {/* Topic Input - Most Important */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">1</span>
                What's your post about?
              </CardTitle>
              <CardDescription>Enter your topic, idea, or message</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="e.g., How I built an AI-driven content business that generates $200K/month, or Career advice for software engineers, or Why most startups fail in the first year..."
                className="min-h-[100px] text-lg"
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
              />
            </CardContent>
          </Card>

          {/* Post Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">2</span>
                Choose Post Format
              </CardTitle>
              <CardDescription>Select the viral format that fits your message</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {POST_FORMATS.map(format => (
                  <Button
                    key={format.id}
                    variant={postFormat === format.id ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col items-center text-center ${postFormat === format.id ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setPostFormat(format.id)}
                  >
                    <span className="text-2xl mb-1">{format.icon}</span>
                    <span className="font-medium text-xs">{format.name}</span>
                    {postFormat === format.id && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">{format.engagement}</Badge>
                    )}
                  </Button>
                ))}
              </div>
              
              {selectedFormat && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFormat.icon} {selectedFormat.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedFormat.desc}</p>
                      <p className="text-xs text-gray-500 mt-2">Best for: {selectedFormat.bestFor}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{selectedFormat.engagement} Engagement</Badge>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border text-sm text-gray-700 font-mono">
                    {selectedFormat.example}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Hook Style */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">3</span>
                    Hook Style
                  </CardTitle>
                  <CardDescription>The first line that stops the scroll</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {HOOK_STYLES.map(hook => (
                      <Button
                        key={hook.id}
                        variant={hookStyle === hook.id ? 'default' : 'outline'}
                        size="sm"
                        className={`h-auto py-2 flex flex-col items-start text-left ${hookStyle === hook.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => setHookStyle(hook.id)}
                      >
                        <span className="font-medium text-xs">{hook.name}</span>
                        <span className="text-[10px] opacity-70 font-normal">{hook.example}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">4</span>
                    Tone & Voice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map(t => (
                      <Button
                        key={t.id}
                        variant={tone === t.id ? 'default' : 'outline'}
                        className={`h-auto py-2 flex flex-col ${tone === t.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => setTone(t.id)}
                      >
                        <span className="text-lg mb-1">{t.icon}</span>
                        <span className="text-xs">{t.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Industry & Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Target Audience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Who is this for?</Label>
                    <Input 
                      placeholder="e.g., Founders, marketers, job seekers, managers..."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Key Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">5</span>
                    Key Points to Include
                  </CardTitle>
                  <CardDescription>Main ideas or tips you want in the post</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="• Point 1\n• Point 2\n• Point 3\n\nOr just describe what you want to convey..."
                    className="min-h-[100px]"
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* CTA Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">6</span>
                    Call-to-Action
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {CTA_OPTIONS.map(cta => (
                      <Button
                        key={cta.id}
                        variant={ctaType === cta.id ? 'default' : 'outline'}
                        size="sm"
                        className={`h-auto py-2 flex flex-col items-start text-left ${ctaType === cta.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        onClick={() => setCtaType(cta.id)}
                      >
                        <span className="font-medium text-xs">{cta.name}</span>
                        {cta.example && <span className="text-[10px] opacity-70 font-normal">{cta.example}</span>}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="emojis"
                        checked={includeEmojis}
                        onChange={(e) => setIncludeEmojis(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="emojis">Include Emojis</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hashtags"
                        checked={includeHashtags}
                        onChange={(e) => setIncludeHashtags(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="hashtags">Include Hashtags</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Post Length</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { id: 'short', name: 'Short', desc: '~500 chars' },
                        { id: 'medium', name: 'Medium', desc: '~1000 chars' },
                        { id: 'long', name: 'Long', desc: '~1500 chars' }
                      ].map(len => (
                        <Button
                          key={len.id}
                          variant={postLength === len.id ? 'default' : 'outline'}
                          className={`h-auto py-2 flex flex-col ${postLength === len.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                          onClick={() => setPostLength(len.id)}
                        >
                          <span className="font-medium">{len.name}</span>
                          <span className="text-xs opacity-70">{len.desc}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Options */}
          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Personal Story/Experience (optional)</Label>
                  <Textarea 
                    placeholder="Share a personal anecdote or experience to make the post more authentic..."
                    value={personalStory}
                    onChange={(e) => setPersonalStory(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Specific Numbers/Results to Include</Label>
                  <Input 
                    placeholder="e.g., $200K revenue, 10x growth, 5 years experience, 1M followers..."
                    value={specificNumbers}
                    onChange={(e) => setSpecificNumbers(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Posts with specific numbers get 38% more engagement</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 text-lg"
            onClick={handleGenerate}
            disabled={generating || !topic}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Creating Viral Posts...</>
            ) : (
              <><Sparkles className="mr-2 h-6 w-6" />Generate LinkedIn Posts</>         
            )}
          </Button>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your LinkedIn Posts</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />Create New
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />Regenerate
              </Button>
            </div>
          </div>

          {/* Post Variations */}
          {result.posts && result.posts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Generated Posts
                  </CardTitle>
                  <div className="flex gap-1">
                    {result.posts.map((_, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={activeVariation === idx ? 'default' : 'outline'}
                        onClick={() => setActiveVariation(idx)}
                        className={activeVariation === idx ? 'bg-blue-600' : ''}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Active Post Preview */}
                  <div className="bg-white border rounded-xl p-6 shadow-lg">
                    {/* LinkedIn Post Header Mock */}
                    <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                        You
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Your Name</p>
                        <p className="text-sm text-gray-500">Your headline • 1st</p>
                        <p className="text-xs text-gray-400">Just now • 🌐</p>
                      </div>
                    </div>
                    
                    {/* Post Content */}
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed mb-4">
                      {result.posts[activeVariation]?.content}
                    </div>
                    
                    {/* Hashtags */}
                    {result.posts[activeVariation]?.hashtags && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {result.posts[activeVariation].hashtags.map((tag, i) => (
                          <span key={i} className="text-blue-600 text-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Engagement Preview */}
                    <div className="flex items-center gap-4 pt-4 border-t text-gray-500 text-sm">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> Like</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Comment</span>
                      <span className="flex items-center gap-1"><Share2 className="h-4 w-4" /> Repost</span>
                    </div>
                  </div>
                  
                  {/* Copy Button */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleCopy(
                        result.posts[activeVariation]?.content + 
                        (result.posts[activeVariation]?.hashtags ? '\n\n' + result.posts[activeVariation].hashtags.map(t => '#' + t).join(' ') : ''),
                        `post-${activeVariation}`
                      )}
                    >
                      {copied[`post-${activeVariation}`] ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied[`post-${activeVariation}`] ? 'Copied!' : 'Copy Post'}
                    </Button>
                    <Button variant="outline">
                      <Edit3 className="h-4 w-4 mr-2" />Edit
                    </Button>
                  </div>

                  {/* Post Analysis */}
                  {result.posts[activeVariation]?.analysis && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <Eye className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <p className="text-xs text-gray-600">Hook Strength</p>
                        <p className="font-bold text-blue-700">{result.posts[activeVariation].analysis.hookStrength || 'Strong'}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
                        <p className="text-xs text-gray-600">Viral Potential</p>
                        <p className="font-bold text-green-700">{result.posts[activeVariation].analysis.viralPotential || 'High'}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <MessageSquare className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-xs text-gray-600">Engagement Type</p>
                        <p className="font-bold text-purple-700">{result.posts[activeVariation].analysis.engagementType || 'Comments'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alternative Hooks */}
          {result.alternativeHooks && result.alternativeHooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Alternative Hooks
                </CardTitle>
                <CardDescription>Swap the opening line for different impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.alternativeHooks.map((hook, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-800">{hook}</p>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopy(hook, `hook-${idx}`)}
                      >
                        {copied[`hook-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {result.tips && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-5 w-5" />
                  Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-800">
                      <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-blue-600" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Best Posting Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Best Times to Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-700">Tuesday</p>
                  <p className="text-sm text-gray-600">7-8 AM</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-700">Wednesday</p>
                  <p className="text-sm text-gray-600">12 PM</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-700">Thursday</p>
                  <p className="text-sm text-gray-600">7-8 AM</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="font-bold text-amber-700">Avoid</p>
                  <p className="text-sm text-gray-600">Weekends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your posts are ready!</h3>
                  <p className="text-green-700">Copy, customize, and post during peak engagement hours.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
