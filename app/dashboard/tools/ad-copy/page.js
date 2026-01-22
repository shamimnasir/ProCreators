'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Target, Copy, Sparkles, Loader2, Wand2, RefreshCw,
  Check, ArrowLeft, Zap, Users, TrendingUp, BarChart3,
  Lightbulb, Info, Layers, Brain, Megaphone, Heart,
  Clock, DollarSign, Eye, MousePointer, Share2, Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

// Copywriting Frameworks
const FRAMEWORKS = [
  { 
    id: 'aida', 
    name: 'AIDA', 
    full: 'Attention → Interest → Desire → Action',
    description: 'Classic funnel: Hook attention, build interest, create desire, drive action',
    icon: '🎯',
    color: 'blue',
    bestFor: 'Awareness ads, product launches'
  },
  { 
    id: 'pas', 
    name: 'PAS', 
    full: 'Problem → Agitation → Solution',
    description: 'Identify pain, intensify it, present your product as the answer',
    icon: '🔥',
    color: 'red',
    bestFor: 'Pain-point targeting, service businesses'
  },
  { 
    id: 'bab', 
    name: 'BAB', 
    full: 'Before → After → Bridge',
    description: 'Show life before, paint the after, your product is the bridge',
    icon: '🌉',
    color: 'purple',
    bestFor: 'Transformation products, fitness, courses'
  },
  { 
    id: 'fourps', 
    name: '4Ps', 
    full: 'Picture → Promise → Proof → Push',
    description: 'Visualize outcome, promise results, show proof, push to act',
    icon: '📸',
    color: 'green',
    bestFor: 'B2B, high-ticket items, trust-building'
  },
  { 
    id: 'fab', 
    name: 'FAB', 
    full: 'Features → Advantages → Benefits',
    description: 'What it has, what it does better, how it improves life',
    icon: '⭐',
    color: 'orange',
    bestFor: 'Tech products, comparisons, features showcase'
  }
]

// Ad Platforms
const AD_PLATFORMS = [
  { id: 'facebook', name: 'Facebook/Instagram', icon: '📱', limits: '125 char primary, 40 char headline' },
  { id: 'google', name: 'Google Ads', icon: '🔍', limits: '30 char headlines, 90 char description' },
  { id: 'tiktok', name: 'TikTok Ads', icon: '🎵', limits: 'Short, punchy, trending' },
  { id: 'linkedin', name: 'LinkedIn Ads', icon: '💼', limits: 'Professional, 150 char intro' },
  { id: 'instagram', name: 'Instagram Stories', icon: '📸', limits: '1-2 lines, visual-first' },
  { id: 'youtube', name: 'YouTube Ads', icon: '🎥', limits: 'Hook in 5 seconds' },
  { id: 'email', name: 'Email Subject Lines', icon: '📧', limits: 'Under 50 characters' },
]

// Ad Goals
const AD_GOALS = [
  { id: 'awareness', name: 'Brand Awareness', icon: Eye, description: 'Introduce your brand' },
  { id: 'traffic', name: 'Website Traffic', icon: MousePointer, description: 'Drive clicks' },
  { id: 'leads', name: 'Lead Generation', icon: Users, description: 'Collect signups' },
  { id: 'sales', name: 'Direct Sales', icon: DollarSign, description: 'Drive purchases' },
  { id: 'engagement', name: 'Engagement', icon: Heart, description: 'Likes & shares' },
  { id: 'app', name: 'App Installs', icon: Play, description: 'Download app' },
]

// Ad Tones
const AD_TONES = [
  { id: 'professional', name: '💼 Professional' },
  { id: 'casual', name: '😊 Casual' },
  { id: 'urgent', name: '⚡ Urgent/FOMO' },
  { id: 'funny', name: '😂 Funny' },
  { id: 'emotional', name: '❤️ Emotional' },
  { id: 'luxurious', name: '✨ Premium' },
]

export default function AdCopyPage() {
  const [activeTab, setActiveTab] = useState('setup')
  const [mode, setMode] = useState('easy')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()

  // Form State
  const [framework, setFramework] = useState('aida')
  const [platform, setPlatform] = useState('facebook')
  const [goal, setGoal] = useState('sales')
  const [tone, setTone] = useState('casual')
  const [variationCount, setVariationCount] = useState('3')
  
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState('')
  const [painPoints, setPainPoints] = useState('')
  const [benefits, setBenefits] = useState('')
  const [socialProof, setSocialProof] = useState('')
  const [offer, setOffer] = useState('')

  // Results
  const [result, setResult] = useState(null)
  const [selectedAd, setSelectedAd] = useState(0)

  const handleGenerate = async () => {
    if (!productName) {
      toast({ title: 'Missing Information', description: 'Please enter your product/service name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/ad-copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productDescription,
          targetAudience,
          uniqueSellingPoints,
          platform,
          goal,
          tone,
          framework,
          painPoints,
          benefits,
          socialProof,
          offer,
          variationCount: parseInt(variationCount)
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('results')
        setSelectedAd(0)
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'ad-copy',
            category: 'text',
            title: `Ad Copy: ${productName.substring(0, 40)}`,
            description: `${data.data.framework} framework for ${platform} - ${goal}`,
            content: JSON.stringify(data.data),
            metadata: {
              framework: data.data.framework,
              platform,
              goal,
              tone,
              variationCount: data.data.ads?.length || 0,
              contentType: 'ad-copy'
            }
          })
          if (saveResult.success) {
            toast({ title: '🎯 Ad Copy Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '🎯 Ad Copy Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '🎯 Ad Copy Generated!' })
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

  const copyFullAd = (ad, idx) => {
    const fullAd = `HOOK:\n${ad.hook}\n\nHEADLINE:\n${ad.headline}\n\nPRIMARY TEXT:\n${ad.primaryText}\n\nDESCRIPTION:\n${ad.description}\n\nCTA: ${ad.cta}\nBUTTON: ${ad.ctaButton}`
    handleCopy(fullAd, `fullAd-${idx}`)
  }

  const selectedFramework = FRAMEWORKS.find(f => f.id === framework)
  const selectedPlatform = AD_PLATFORMS.find(p => p.id === platform)

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing-ads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-7 w-7 text-red-500" />
                AI Ad Copy Generator
              </h1>
              <Badge className="bg-red-500 text-white">Best Seller</Badge>
            </div>
            <p className="text-muted-foreground">High-converting ad copy using proven copywriting frameworks</p>
          </div>
        </div>

        {/* Framework Showcase Banner */}
        <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white border-0 overflow-hidden">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">5 Proven Copywriting Frameworks</h3>
                <p className="text-sm text-white/80">AIDA • PAS • BAB • 4Ps • FAB</p>
              </div>
              <div className="flex gap-2">
                {FRAMEWORKS.map((f) => (
                  <Tooltip key={f.id}>
                    <TooltipTrigger>
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-lg cursor-help">
                        {f.icon}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{f.name}</p>
                      <p className="text-xs">{f.full}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="setup">📝 Setup</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>🎯 Results</TabsTrigger>
            <TabsTrigger value="tips" disabled={!result}>💡 Tips</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button 
                variant={mode === 'easy' ? 'default' : 'outline'}
                onClick={() => setMode('easy')}
                className={mode === 'easy' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                🌟 Easy Mode
              </Button>
              <Button 
                variant={mode === 'pro' ? 'default' : 'outline'}
                onClick={() => setMode('pro')}
                className={mode === 'pro' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                🚀 Pro Mode
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Framework Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Copywriting Framework
                    </CardTitle>
                    <CardDescription>Choose your persuasion structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {FRAMEWORKS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFramework(f.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            framework === f.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                              : 'border-muted hover:border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{f.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {f.name}
                                <Badge variant="outline" className="text-[10px]">{f.full}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{f.description}</p>
                            </div>
                            {framework === f.id && <Check className="h-5 w-5 text-red-500" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-orange-500" />
                      What Are You Promoting?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Product/Service Name *</Label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., ProCreators AI Video Tool"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="What does it do? What problem does it solve?"
                        className="min-h-[80px]"
                      />
                    </div>
                    {mode === 'pro' && (
                      <>
                        <div>
                          <Label className="text-xs">Unique Selling Points</Label>
                          <Textarea
                            value={uniqueSellingPoints}
                            onChange={(e) => setUniqueSellingPoints(e.target.value)}
                            placeholder="What makes you different? Faster, cheaper, better results..."
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Special Offer (optional)</Label>
                          <Input
                            value={offer}
                            onChange={(e) => setOffer(e.target.value)}
                            placeholder="e.g., 50% off, Free trial, Buy 1 Get 1..."
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Platform & Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-500" />
                      Ad Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AD_PLATFORMS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.icon} {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">{selectedPlatform?.limits}</p>
                    </div>

                    <div>
                      <Label className="text-xs">Goal</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {AD_GOALS.map((g) => {
                          const Icon = g.icon
                          return (
                            <button
                              key={g.id}
                              onClick={() => setGoal(g.id)}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                goal === g.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                  : 'border-muted hover:border-blue-300'
                              }`}
                            >
                              <Icon className="h-4 w-4 mx-auto mb-1" />
                              <div className="text-[10px] font-medium">{g.name}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Tone</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {AD_TONES.map((t) => (
                          <Button
                            key={t.id}
                            variant={tone === t.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTone(t.id)}
                            className={tone === t.id ? 'bg-red-600 hover:bg-red-700' : ''}
                          >
                            {t.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Number of Variations</Label>
                      <Select value={variationCount} onValueChange={setVariationCount}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 variations</SelectItem>
                          <SelectItem value="5">5 variations</SelectItem>
                          <SelectItem value="7">7 variations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Pro Mode: Audience & Psychology */}
                {mode === 'pro' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-500" />
                        Audience & Psychology
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Target Audience</Label>
                        <Input
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g., Busy entrepreneurs aged 25-45"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pain Points</Label>
                        <Textarea
                          value={painPoints}
                          onChange={(e) => setPainPoints(e.target.value)}
                          placeholder="What frustrations does your audience have?"
                          className="min-h-[60px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Desired Benefits</Label>
                        <Textarea
                          value={benefits}
                          onChange={(e) => setBenefits(e.target.value)}
                          placeholder="What transformation do they want?"
                          className="min-h-[60px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Social Proof</Label>
                        <Textarea
                          value={socialProof}
                          onChange={(e) => setSocialProof(e.target.value)}
                          placeholder="e.g., 10,000+ customers, 4.9 star rating, featured in Forbes..."
                          className="min-h-[60px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  disabled={generating || !productName}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {variationCount} Ad Variations...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate {variationCount} Ad Variations</>  
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {result && result.data && (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      🎯 {result.data.ads?.length || 0} Ad Variations Generated
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Framework: {result.data.framework} • Platform: {selectedPlatform?.name}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                  </Button>
                </div>

                {/* Ad Selector Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {result.data.ads?.map((_, idx) => (
                    <Button
                      key={idx}
                      variant={selectedAd === idx ? 'default' : 'outline'}
                      onClick={() => setSelectedAd(idx)}
                      className={selectedAd === idx ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      Version {idx + 1}
                    </Button>
                  ))}
                </div>

                {/* Selected Ad Display */}
                {result.data.ads && result.data.ads[selectedAd] && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Ad Preview */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-red-500" />
                            Ad Version {selectedAd + 1}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{result.data.ads[selectedAd].emotionalTrigger}</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyFullAd(result.data.ads[selectedAd], selectedAd)}
                            >
                              {copied[`fullAd-${selectedAd}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Hook */}
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-medium text-red-700 dark:text-red-300">🎣 HOOK (Most Important)</Label>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(result.data.ads[selectedAd].hook, `hook-${selectedAd}`)}>
                              {copied[`hook-${selectedAd}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <p className="font-bold text-lg">{result.data.ads[selectedAd].hook}</p>
                        </div>

                        {/* Headline */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Headline</Label>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(result.data.ads[selectedAd].headline, `headline-${selectedAd}`)}>
                              {copied[`headline-${selectedAd}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <p className="font-semibold">{result.data.ads[selectedAd].headline}</p>
                        </div>

                        {/* Primary Text */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Primary Text ({result.data.framework})</Label>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(result.data.ads[selectedAd].primaryText, `primary-${selectedAd}`)}>
                              {copied[`primary-${selectedAd}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <ScrollArea className="h-[200px]">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed p-3 bg-muted/30 rounded-lg border">
                              {result.data.ads[selectedAd].primaryText}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Description */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(result.data.ads[selectedAd].description, `desc-${selectedAd}`)}>
                              {copied[`desc-${selectedAd}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.data.ads[selectedAd].description}</p>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">CTA</Label>
                            <p className="font-medium">{result.data.ads[selectedAd].cta}</p>
                          </div>
                          <Badge className="bg-red-600 text-white">{result.data.ads[selectedAd].ctaButton}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hook Alternatives for A/B Testing */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Hook Alternatives (A/B Test These!)
                          </CardTitle>
                          <CardDescription>Test different hooks to find your winner</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {result.data.ads[selectedAd].hookAlternatives?.map((hook, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200">
                              <span className="text-sm font-medium">{hook}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleCopy(hook, `altHook-${selectedAd}-${idx}`)}
                              >
                                {copied[`altHook-${selectedAd}-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* All Versions Quick Copy */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Layers className="h-5 w-5 text-blue-500" />
                            Quick Copy All Versions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {result.data.ads?.map((ad, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                <div>
                                  <span className="font-medium text-sm">Version {idx + 1}</span>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.hook}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyFullAd(ad, idx)}
                                >
                                  {copied[`fullAd-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            {result && result.data && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Platform Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Info className="h-5 w-5" />
                      {selectedPlatform?.name} Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.data.platformSpecificTips?.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* A/B Testing Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <BarChart3 className="h-5 w-5" />
                      A/B Testing Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.data.abTestSuggestions?.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Targeting Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Users className="h-5 w-5" />
                      Targeting Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.data.targetingRecommendations?.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Best Performing Elements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <Lightbulb className="h-5 w-5" />
                      Best Performing Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.data.bestPerformingElements && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Best Hook Style</Label>
                          <p className="text-sm mt-1">{result.data.bestPerformingElements.hook}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Recommended CTA</Label>
                          <p className="text-sm mt-1">{result.data.bestPerformingElements.cta}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Ideal Copy Length</Label>
                          <p className="text-sm mt-1">{result.data.bestPerformingElements.length}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Framework Guide */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Brain className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Framework Guide: {selectedFramework?.name}</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">{selectedFramework?.full}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{selectedFramework?.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">Best for: {selectedFramework?.bestFor}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              2026 Ad Copy Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Layer Frameworks</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">Combine AIDA structure with BAB story in Desire section</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Benefits Over Features</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">Focus on emotional and life-transforming impacts</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">A/B Test Hooks</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">Test multiple hooks to find what resonates most</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Social Proof</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">Numbers and testimonials dramatically increase trust</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
