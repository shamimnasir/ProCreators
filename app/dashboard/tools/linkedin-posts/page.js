'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import { 
  Share2, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  ThumbsUp, Eye, Zap, Flame, Award,
  ChevronDown, ChevronUp, Check, Edit3, Hash,
  Users, Briefcase, BookOpen, Heart, AlertTriangle, ExternalLink
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

const PLATFORMS = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: '💼', 
    color: 'from-blue-600 to-blue-800',
    charLimit: 3000,
    description: 'Professional networking & thought leadership',
    bestFor: 'B2B, Career, Professional content'
  },
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: '𝕏', 
    color: 'from-gray-800 to-black',
    charLimit: 280,
    description: 'Short, punchy content & threads',
    bestFor: 'News, Hot takes, Viral threads'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: '📘', 
    color: 'from-blue-500 to-blue-700',
    charLimit: 63206,
    description: 'Community engagement & storytelling',
    bestFor: 'Stories, Community, Longer posts'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: '📸', 
    color: 'from-pink-500 via-purple-500 to-orange-500',
    charLimit: 2200,
    description: 'Theme pages, captions & Reels scripts',
    bestFor: 'Theme pages, Visual content, Reels'
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: '🎬', 
    color: 'from-red-600 to-red-700',
    charLimit: 5000,
    description: 'Scripts, titles, hooks & descriptions',
    bestFor: 'Video scripts, SEO titles, Hooks',
    isAdvanced: true,
    advancedLink: '/dashboard/tools/youtube-creator'
  },
  { 
    id: 'threads', 
    name: 'Threads', 
    icon: '🧵', 
    color: 'from-purple-600 to-pink-600',
    charLimit: 500,
    description: 'Conversational, casual content',
    bestFor: 'Casual takes, Conversations'
  },
  { 
    id: 'reddit', 
    name: 'Reddit', 
    icon: '🤖', 
    color: 'from-orange-500 to-red-500',
    charLimit: 40000,
    description: 'Community discussions & value posts',
    bestFor: 'Deep dives, AMAs, Value posts'
  },
  { 
    id: 'quora', 
    name: 'Quora', 
    icon: '❓', 
    color: 'from-red-600 to-red-800',
    charLimit: 10000,
    description: 'Expert answers & thought leadership',
    bestFor: 'Q&A, Expert positioning'
  }
]

const POST_FORMATS = {
  linkedin: [
    { id: 'authority-builder', name: 'Authority Builder', icon: '🏆', desc: 'Share expertise with case studies', engagement: 'Very High' },
    { id: 'contrarian-take', name: 'Contrarian Take', icon: '🔥', desc: 'Challenge conventional wisdom', engagement: 'Very High' },
    { id: 'story-hook', name: 'Story Hook', icon: '📖', desc: 'Personal story with a lesson', engagement: 'High' },
    { id: 'listicle', name: 'Listicle', icon: '📋', desc: 'Actionable tips in list format', engagement: 'High' },
    { id: 'before-after', name: 'Before/After', icon: '🔄', desc: 'Transformation stories', engagement: 'High' },
    { id: 'hot-take', name: 'Hot Take', icon: '🌶️', desc: 'Bold opinion on trending topic', engagement: 'Very High' }
  ],
  twitter: [
    { id: 'thread-starter', name: 'Thread Starter', icon: '🧵', desc: 'Viral thread opening', engagement: 'Very High' },
    { id: 'hot-take', name: 'Hot Take', icon: '🔥', desc: 'Controversial opinion', engagement: 'Very High' },
    { id: 'tip-thread', name: 'Tip Thread', icon: '💡', desc: 'Value-packed tips', engagement: 'High' },
    { id: 'story-thread', name: 'Story Thread', icon: '📖', desc: 'Engaging narrative', engagement: 'High' },
    { id: 'breakdown', name: 'Breakdown', icon: '🔍', desc: 'Analyze trending topic', engagement: 'High' },
    { id: 'engagement-bait', name: 'Ratio Bait', icon: '💬', desc: 'Drive replies & quotes', engagement: 'Very High' }
  ],
  facebook: [
    { id: 'story-post', name: 'Story Post', icon: '📖', desc: 'Emotional storytelling', engagement: 'Very High' },
    { id: 'question-post', name: 'Question Post', icon: '❓', desc: 'Drive comments', engagement: 'High' },
    { id: 'value-post', name: 'Value Post', icon: '💎', desc: 'Tips & how-tos', engagement: 'High' },
    { id: 'behind-scenes', name: 'Behind the Scenes', icon: '🎬', desc: 'Personal/authentic content', engagement: 'High' },
    { id: 'controversial', name: 'Controversial', icon: '🔥', desc: 'Spark debate', engagement: 'Very High' },
    { id: 'nostalgia', name: 'Nostalgia Post', icon: '📸', desc: 'Throwback content', engagement: 'High' }
  ],
  threads: [
    { id: 'hot-take', name: 'Hot Take', icon: '🔥', desc: 'Quick opinion', engagement: 'Very High' },
    { id: 'question', name: 'Question', icon: '❓', desc: 'Start conversation', engagement: 'High' },
    { id: 'tip', name: 'Quick Tip', icon: '💡', desc: 'Bite-sized value', engagement: 'High' },
    { id: 'story', name: 'Mini Story', icon: '📖', desc: 'Short narrative', engagement: 'High' },
    { id: 'unpopular-opinion', name: 'Unpopular Opinion', icon: '🌶️', desc: 'Contrarian view', engagement: 'Very High' },
    { id: 'this-or-that', name: 'This or That', icon: '⚖️', desc: 'Choice post', engagement: 'High' }
  ],
  reddit: [
    { id: 'value-post', name: 'Value Post', icon: '💎', desc: 'Helpful detailed content', engagement: 'High' },
    { id: 'story-time', name: 'Story Time', icon: '📖', desc: 'Personal experience', engagement: 'Very High' },
    { id: 'discussion', name: 'Discussion Starter', icon: '💬', desc: 'Community debate', engagement: 'High' },
    { id: 'guide', name: 'Ultimate Guide', icon: '📚', desc: 'Comprehensive how-to', engagement: 'Very High' },
    { id: 'ama-style', name: 'AMA Style', icon: '🎤', desc: 'Q&A format', engagement: 'High' },
    { id: 'unpopular-opinion', name: 'Unpopular Opinion', icon: '🔥', desc: 'Hot take', engagement: 'Very High' }
  ],
  quora: [
    { id: 'expert-answer', name: 'Expert Answer', icon: '🎓', desc: 'Authoritative response', engagement: 'High' },
    { id: 'story-answer', name: 'Story Answer', icon: '📖', desc: 'Personal experience', engagement: 'Very High' },
    { id: 'contrarian', name: 'Contrarian Answer', icon: '🔥', desc: 'Different perspective', engagement: 'High' },
    { id: 'step-by-step', name: 'Step-by-Step', icon: '📋', desc: 'Actionable guide', engagement: 'High' },
    { id: 'myth-buster', name: 'Myth Buster', icon: '💥', desc: 'Debunk misconceptions', engagement: 'High' },
    { id: 'data-driven', name: 'Data-Driven', icon: '📊', desc: 'Facts & statistics', engagement: 'High' }
  ],
  instagram: [
    { id: 'motivation-quote', name: 'Motivation Quote', icon: '💪', desc: 'Inspirational text overlay', engagement: 'Very High' },
    { id: 'carousel-tips', name: 'Carousel Tips', icon: '📚', desc: 'Swipe-through value', engagement: 'Very High' },
    { id: 'reel-script', name: 'Reel Script', icon: '🎬', desc: 'Hook + body + CTA', engagement: 'Very High' },
    { id: 'story-caption', name: 'Story Caption', icon: '📖', desc: 'Engaging narrative', engagement: 'High' },
    { id: 'educational', name: 'Educational Post', icon: '🎓', desc: 'Teach something valuable', engagement: 'High' },
    { id: 'relatable', name: 'Relatable Content', icon: '😂', desc: 'This is so me...', engagement: 'Very High' },
    { id: 'transformation', name: 'Transformation', icon: '✨', desc: 'Before/after story', engagement: 'High' },
    { id: 'question-hook', name: 'Question Hook', icon: '❓', desc: 'Engage with questions', engagement: 'High' }
  ]
}

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
  { id: 'educational', name: 'Educational', icon: '🎓' },
  { id: 'humorous', name: 'Humorous', icon: '😂' },
  { id: 'controversial', name: 'Controversial', icon: '🔥' }
]

const CTA_OPTIONS = [
  { id: 'comment', name: 'Ask for Comments', example: 'Comment "[word]" and I\'ll send you...' },
  { id: 'question', name: 'End with Question', example: 'What would you add to this list?' },
  { id: 'save-share', name: 'Save & Share', example: '♻️ Repost to help others | 💾 Save for later' },
  { id: 'follow', name: 'Follow CTA', example: 'Follow for more [topic] content' },
  { id: 'dm', name: 'DM Trigger', example: 'DM me "[word]" for the full guide' },
  { id: 'link', name: 'Link CTA', example: 'Link in bio/comments for more' },
  { id: 'none', name: 'No CTA', example: '' }
]

const INDUSTRIES = [
  'Technology/SaaS', 'Marketing/Advertising', 'Finance/Investing', 
  'Entrepreneurship', 'Career Development', 'Leadership/Management',
  'Sales', 'AI/Machine Learning', 'Personal Development',
  'Health & Wellness', 'Real Estate', 'E-commerce', 'Consulting', 
  'Entertainment', 'Education', 'Lifestyle', 'Other'
]

export default function SocialMediaPostCreator() {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState({})
  const [activeVariation, setActiveVariation] = useState(0)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  
  // Form state
  const [platform, setPlatform] = useState('linkedin')
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
  const [subreddit, setSubreddit] = useState('')
  // Instagram theme page fields
  const [themePageNiche, setThemePageNiche] = useState('')
  const [instagramStyle, setInstagramStyle] = useState('motivational')
  const [generateImage, setGenerateImage] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

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
      // Get session token for authentication
      const sessionToken = localStorage.getItem('sessionToken')
      
      const res = await fetch('/api/linkedin-posts/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        },
        body: JSON.stringify({
          platform,
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
          specificNumbers,
          subreddit,
          // Instagram fields
          themePageNiche,
          instagramStyle,
          generateImage,
          logoUrl
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveVariation(0)
        
        // Auto-save to library
        try {
          const posts = data.data?.posts || []
          // Save the first (main) post variation
          if (posts.length > 0) {
            const mainPost = posts[0]
            const selectedPlatformData = PLATFORMS.find(p => p.id === platform)
            
            // Format all posts as a complete thread for library
            const fullThreadContent = posts.map((post, idx) => {
              let text = posts.length > 1 ? `${idx + 1}/ ` : ''
              text += post.content || post
              // Add hashtags only to the last post
              if (post.hashtags?.length && idx === posts.length - 1) {
                text += '\n\n' + post.hashtags.map(t => '#' + t).join(' ')
              }
              return text
            }).join('\n\n---\n\n')
            
            await saveToLibrary({
              type: 'social-media-post',
              category: 'text',
              title: `${selectedPlatformData?.name || platform} ${posts.length > 1 ? 'Thread' : 'Post'}: ${topic.substring(0, 40)}${topic.length > 40 ? '...' : ''}`,
              description: `${selectedPlatformData?.name || platform} ${posts.length > 1 ? `thread (${posts.length} posts)` : 'post'} about ${topic.substring(0, 100)}`,
              content: fullThreadContent,
              metadata: {
                platform,
                postFormat,
                topic,
                tone,
                hashtags: mainPost.hashtags || [],
                postsCount: posts.length,
                isThread: posts.length > 1,
                contentType: 'social-post'
              }
            })
            console.log('Social media post auto-saved to library')
          }
        } catch (saveError) {
          console.error('Failed to auto-save to library:', saveError)
        }
        
        toast({ title: '✨ Posts Generated!' })
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

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)
  const platformFormats = POST_FORMATS[platform] || POST_FORMATS.linkedin

  // Reset post format when platform changes
  const handlePlatformChange = (newPlatform) => {
    setPlatform(newPlatform)
    const formats = POST_FORMATS[newPlatform] || POST_FORMATS.linkedin
    setPostFormat(formats[0]?.id || 'authority-builder')
  }

  return (
    <div className="space-y-6">
      {/* Auto-save Drafts Manager */}
      <AutoSaveDraftsManager
        toolType="social-media-posts"
        getCurrentData={() => ({
          platform,
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
          specificNumbers,
          subreddit,
          themePageNiche,
          instagramStyle,
          generateImage,
          logoUrl,
          title: topic || 'Social Media Post'
        })}
        loadDraftData={(draft) => {
          if (draft.platform) setPlatform(draft.platform)
          if (draft.topic) setTopic(draft.topic)
          if (draft.postFormat) setPostFormat(draft.postFormat)
          if (draft.hookStyle) setHookStyle(draft.hookStyle)
          if (draft.tone) setTone(draft.tone)
          if (draft.industry) setIndustry(draft.industry)
          if (draft.targetAudience) setTargetAudience(draft.targetAudience)
          if (draft.keyPoints) setKeyPoints(draft.keyPoints)
          if (draft.personalStory) setPersonalStory(draft.personalStory)
          if (draft.ctaType) setCtaType(draft.ctaType)
          if (draft.includeEmojis !== undefined) setIncludeEmojis(draft.includeEmojis)
          if (draft.includeHashtags !== undefined) setIncludeHashtags(draft.includeHashtags)
          if (draft.postLength) setPostLength(draft.postLength)
          if (draft.specificNumbers) setSpecificNumbers(draft.specificNumbers)
          if (draft.subreddit) setSubreddit(draft.subreddit)
          if (draft.themePageNiche) setThemePageNiche(draft.themePageNiche)
          if (draft.instagramStyle) setInstagramStyle(draft.instagramStyle)
          if (draft.generateImage !== undefined) setGenerateImage(draft.generateImage)
          if (draft.logoUrl) setLogoUrl(draft.logoUrl)
        }}
        onStartNew={() => {
          setPlatform('linkedin')
          setTopic('')
          setPostFormat('authority-builder')
          setHookStyle('bold-statement')
          setTone('professional')
          setIndustry('')
          setTargetAudience('')
          setKeyPoints('')
          setPersonalStory('')
          setCtaType('comment')
          setIncludeEmojis(true)
          setIncludeHashtags(true)
          setPostLength('medium')
          setSpecificNumbers('')
          setSubreddit('')
          setThemePageNiche('')
          setInstagramStyle('motivational')
          setGenerateImage(false)
          setLogoUrl('')
        }}
        dependencies={[topic, platform, tone, industry, keyPoints]}
        autoSaveEnabled={true}
        debounceMs={3000}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Share2 className="h-8 w-8 text-purple-600" />
            Social Media Post Creator
          </h1>
          <p className="text-muted-foreground mt-1">Create viral posts for any platform</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">
          <TrendingUp className="h-3 w-3 mr-1" />7 Platforms
        </Badge>
      </div>

      {!result ? (
        <>
          {/* Platform Selection */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">1</span>
                Choose Platform
              </CardTitle>
              <CardDescription>Select where you want to post</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {PLATFORMS.map(p => (
                  p.isAdvanced ? (
                    <Link key={p.id} href={p.advancedLink}>
                      <Button
                        variant="outline"
                        className={`h-auto py-4 w-full flex flex-col items-center bg-gradient-to-r ${p.color} text-white hover:opacity-90 relative`}
                      >
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px]">Pro</Badge>
                        <span className="text-2xl mb-1">{p.icon}</span>
                        <span className="font-medium text-sm">{p.name}</span>
                        <ExternalLink className="h-3 w-3 mt-1 opacity-70" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      key={p.id}
                      variant={platform === p.id ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col items-center ${platform === p.id ? `bg-gradient-to-r ${p.color} text-white ring-2 ring-offset-2` : ''}`}
                      onClick={() => handlePlatformChange(p.id)}
                    >
                      <span className="text-2xl mb-1">{p.icon}</span>
                      <span className="font-medium text-sm">{p.name}</span>
                    </Button>
                  )
                ))}
              </div>
              
              {selectedPlatform && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedPlatform.icon} {selectedPlatform.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPlatform.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{selectedPlatform.charLimit.toLocaleString()} chars max</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Best for: {selectedPlatform.bestFor}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic Input */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">2</span>
                What's your post about?
              </CardTitle>
              <CardDescription>Enter your topic, idea, or message</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder={platform === 'reddit' 
                  ? "e.g., How I built a SaaS to $10K MRR, Best productivity tools for developers, My experience switching careers to tech..."
                  : platform === 'quora'
                  ? "e.g., What's the best way to learn programming? How do successful entrepreneurs think? What are common investing mistakes?"
                  : "e.g., How I built an AI-driven content business that generates $200K/month, Career advice for software engineers, Why most startups fail..."}
                className="min-h-[100px] text-lg"
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
              />
              {platform === 'reddit' && (
                <div className="mt-3">
                  <Label>Target Subreddit (optional)</Label>
                  <Input 
                    placeholder="e.g., r/entrepreneur, r/programming, r/personalfinance"
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                  />
                </div>
              )}
              {platform === 'instagram' && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>Theme Page Niche *</Label>
                    <Select value={themePageNiche} onValueChange={setThemePageNiche}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your niche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motivation">💪 Motivation & Success</SelectItem>
                        <SelectItem value="fitness">🏋️ Fitness & Health</SelectItem>
                        <SelectItem value="wealth">💰 Wealth & Finance</SelectItem>
                        <SelectItem value="quotes">💬 Quotes & Wisdom</SelectItem>
                        <SelectItem value="mindset">🧠 Mindset & Growth</SelectItem>
                        <SelectItem value="business">📈 Business & Entrepreneurship</SelectItem>
                        <SelectItem value="lifestyle">✨ Lifestyle & Luxury</SelectItem>
                        <SelectItem value="relationships">❤️ Relationships & Love</SelectItem>
                        <SelectItem value="spirituality">🙏 Spirituality & Mindfulness</SelectItem>
                        <SelectItem value="humor">😂 Humor & Memes</SelectItem>
                        <SelectItem value="facts">🤓 Facts & Knowledge</SelectItem>
                        <SelectItem value="nature">🌿 Nature & Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content Style</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { id: 'motivational', name: 'Motivational', icon: '🔥' },
                        { id: 'educational', name: 'Educational', icon: '📚' },
                        { id: 'relatable', name: 'Relatable', icon: '😅' }
                      ].map(style => (
                        <Button
                          key={style.id}
                          variant={instagramStyle === style.id ? 'default' : 'outline'}
                          size="sm"
                          className={`h-auto py-2 flex flex-col ${instagramStyle === style.id ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                          onClick={() => setInstagramStyle(style.id)}
                        >
                          <span>{style.icon}</span>
                          <span className="text-xs">{style.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Image Generation Section */}
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="generate-image"
                        checked={generateImage}
                        onChange={(e) => setGenerateImage(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="generate-image" className="cursor-pointer font-medium text-pink-800">
                        🖼️ Generate Image for Post
                      </Label>
                    </div>
                    {generateImage && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Your Logo URL (optional)</Label>
                          <Input 
                            placeholder="https://example.com/your-logo.png"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Logo will be placed in the corner of generated images
                          </p>
                        </div>
                        <Alert className="bg-pink-100 border-pink-300">
                          <AlertDescription className="text-pink-800 text-sm">
                            ✨ AI will generate a themed image matching your niche and content style
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">3</span>
                Choose Post Format
              </CardTitle>
              <CardDescription>Select the viral format for {selectedPlatform?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platformFormats.map(format => (
                  <Button
                    key={format.id}
                    variant={postFormat === format.id ? 'default' : 'outline'}
                    className={`h-auto py-3 flex flex-col items-center text-center ${postFormat === format.id ? 'ring-2 ring-purple-500 bg-purple-600 hover:bg-purple-700' : ''}`}
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
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Hook Style */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">4</span>
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
                        className={`h-auto py-2 flex flex-col items-start text-left ${hookStyle === hook.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
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
                    <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">5</span>
                    Tone & Voice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {TONES.map(t => (
                      <Button
                        key={t.id}
                        variant={tone === t.id ? 'default' : 'outline'}
                        className={`h-auto py-2 flex flex-col ${tone === t.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={() => setTone(t.id)}
                      >
                        <span className="text-lg mb-1">{t.icon}</span>
                        <span className="text-[10px]">{t.name}</span>
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
                    <Label>Industry/Niche</Label>
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
                      placeholder="e.g., Founders, marketers, job seekers, developers..."
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
                    <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">6</span>
                    Key Points to Include
                  </CardTitle>
                  <CardDescription>Main ideas or tips you want in the post</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="• Point 1&#10;• Point 2&#10;• Point 3&#10;&#10;Or just describe what you want to convey..."
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
                    <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm">7</span>
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
                        className={`h-auto py-2 flex flex-col items-start text-left ${ctaType === cta.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
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
                        { id: 'short', name: 'Short', desc: platform === 'twitter' ? '~200 chars' : '~500 chars' },
                        { id: 'medium', name: 'Medium', desc: platform === 'twitter' ? '~280 chars' : '~1000 chars' },
                        { id: 'long', name: 'Long', desc: platform === 'twitter' ? 'Thread' : '~1500+ chars' }
                      ].map(len => (
                        <Button
                          key={len.id}
                          variant={postLength === len.id ? 'default' : 'outline'}
                          className={`h-auto py-2 flex flex-col ${postLength === len.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
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
          <div className="flex items-center gap-4">
            <CreditCostBadge toolId="linkedin-posts" />
            <Button 
              size="lg" 
              className={`flex-1 bg-gradient-to-r ${selectedPlatform?.color || 'from-purple-600 to-pink-600'} hover:opacity-90 h-14 text-lg`}
              onClick={handleGenerate}
              disabled={generating || !topic}
            >
              {generating ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Creating {selectedPlatform?.name} Posts...</>
              ) : (
                <><Wand2 className="mr-2 h-6 w-6" />Generate {selectedPlatform?.name} Posts</>         
              )}
            </Button>
          </div>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedPlatform?.icon}</span>
              <h2 className="text-2xl font-bold">Your {selectedPlatform?.name} Posts</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />Create New
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <Wand2 className="h-4 w-4 mr-2" />Regenerate
              </Button>
            </div>
          </div>

          {/* Post Variations - Now as Thread View */}
          {result.posts && result.posts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    {result.posts.length > 1 ? `Thread (${result.posts.length} posts)` : 'Generated Post'}
                  </CardTitle>
                  <Button 
                    className={`bg-gradient-to-r ${selectedPlatform?.color}`}
                    onClick={() => {
                      // Copy all posts as a thread
                      const fullThread = result.posts.map((post, idx) => {
                        let text = result.posts.length > 1 ? `${idx + 1}/ ` : ''
                        text += post.content
                        if (post.hashtags?.length && idx === result.posts.length - 1) {
                          text += '\n\n' + post.hashtags.map(t => '#' + t).join(' ')
                        }
                        return text
                      }).join('\n\n---\n\n')
                      handleCopy(fullThread, 'full-thread')
                    }}
                  >
                    {copied['full-thread'] ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied['full-thread'] ? 'Copied!' : 'Copy All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* All Posts in Thread View */}
                  {result.posts.map((post, idx) => (
                    <div key={idx} className={`bg-white border rounded-xl p-6 shadow-sm ${idx > 0 ? 'border-l-4 border-l-purple-500' : 'shadow-lg'}`}>
                      {/* Post Number Badge for Threads */}
                      {result.posts.length > 1 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-purple-600 text-white">{idx + 1}/{result.posts.length}</Badge>
                          {idx === 0 && <Badge variant="outline" className="text-purple-600">Thread Start</Badge>}
                          {idx === result.posts.length - 1 && result.posts.length > 1 && <Badge variant="outline" className="text-green-600">Final Post</Badge>}
                        </div>
                      )}
                      
                      {/* Platform Header Mock - Only on first post */}
                      {idx === 0 && (
                        <div className="flex items-start gap-3 mb-4 pb-4 border-b">
                          <div className={`w-12 h-12 bg-gradient-to-br ${selectedPlatform?.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                            {selectedPlatform?.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Your Name</p>
                            <p className="text-sm text-gray-500">Your headline • {selectedPlatform?.name}</p>
                            <p className="text-xs text-gray-400">Just now</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Post Content */}
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed mb-4">
                        {result.posts.length > 1 && <span className="text-purple-600 font-semibold">{idx + 1}/ </span>}
                        {post.content}
                      </div>
                      
                      {/* Hashtags - Only on last post */}
                      {post.hashtags && post.hashtags.length > 0 && idx === result.posts.length - 1 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.hashtags.map((tag, i) => (
                            <span key={i} className="text-purple-600 text-sm">#{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      {/* Copy Individual Post Button */}
                      <div className="flex justify-end">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(
                            (result.posts.length > 1 ? `${idx + 1}/ ` : '') + post.content + 
                            (post.hashtags?.length && idx === result.posts.length - 1 ? '\n\n' + post.hashtags.map(t => '#' + t).join(' ') : ''),
                            `post-${idx}`
                          )}
                        >
                          {copied[`post-${idx}`] ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copied[`post-${idx}`] ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Engagement Preview */}
                  <div className="flex items-center gap-4 pt-4 border-t text-gray-500 text-sm">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> Like</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Comment</span>
                    <span className="flex items-center gap-1"><Share2 className="h-4 w-4" /> Share</span>
                  </div>

                  {/* Post Analysis - Show for first post */}
                  {result.posts[0]?.analysis && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <Eye className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-xs text-gray-600">Hook Strength</p>
                        <p className="font-bold text-purple-700">{result.posts[0].analysis.hookStrength || 'Strong'}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
                        <p className="text-xs text-gray-600">Viral Potential</p>
                        <p className="font-bold text-green-700">{result.posts[0].analysis.viralPotential || 'High'}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <MessageSquare className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <p className="text-xs text-gray-600">Engagement Type</p>
                        <p className="font-bold text-blue-700">{result.posts[0].analysis.engagementType || 'Comments'}</p>
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
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Lightbulb className="h-5 w-5" />
                  {selectedPlatform?.name} Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-purple-800">
                      <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-purple-600" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your {selectedPlatform?.name} posts are ready!</h3>
                  <p className="text-green-700">Copy and post during peak engagement hours for best results.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
