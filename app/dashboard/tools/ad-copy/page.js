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
import { Target, Copy, Sparkles, Loader2, Wand2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const AD_PLATFORMS = [
  { id: 'facebook', name: 'Facebook/Instagram', icon: '📱', limits: '125 char headline, 27 char link' },
  { id: 'google', name: 'Google Ads', icon: '🔍', limits: '30 char headlines, 90 char description' },
  { id: 'tiktok', name: 'TikTok Ads', icon: '🎵', limits: 'Short, punchy, trending' },
  { id: 'linkedin', name: 'LinkedIn Ads', icon: '💼', limits: 'Professional tone, B2B focus' },
  { id: 'youtube', name: 'YouTube Ads', icon: '🎥', limits: 'Hook in 5 seconds' },
  { id: 'email', name: 'Email Subject Lines', icon: '📧', limits: 'Under 50 characters ideal' },
]

const AD_GOALS = [
  { id: 'awareness', name: 'Brand Awareness', description: 'Introduce your brand' },
  { id: 'traffic', name: 'Website Traffic', description: 'Drive clicks to your site' },
  { id: 'leads', name: 'Lead Generation', description: 'Collect emails/signups' },
  { id: 'sales', name: 'Direct Sales', description: 'Sell products/services' },
  { id: 'engagement', name: 'Engagement', description: 'Likes, comments, shares' },
  { id: 'app', name: 'App Installs', description: 'Download your app' },
]

const AD_TONES = [
  { id: 'professional', name: '💼 Professional' },
  { id: 'casual', name: '😊 Casual & Friendly' },
  { id: 'urgent', name: '⚡ Urgent/FOMO' },
  { id: 'funny', name: '😂 Funny/Witty' },
  { id: 'emotional', name: '❤️ Emotional' },
  { id: 'luxurious', name: '✨ Luxurious/Premium' },
]

export default function AdCopyPage() {
  const [mode, setMode] = useState('easy')
  const [platform, setPlatform] = useState('facebook')
  const [goal, setGoal] = useState('sales')
  const [tone, setTone] = useState('casual')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedAds, setGeneratedAds] = useState([])
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!productName) {
      toast({ title: 'Please enter product/service name', variant: 'destructive' })
      return
    }
    setGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate generated ads
      const mockAds = [
        {
          headline: `🔥 ${productName} - Limited Time Offer!`,
          description: `Transform your life with ${productName}. Thousands of happy customers can't be wrong!`,
          cta: 'Shop Now'
        },
        {
          headline: `Why Everyone's Talking About ${productName}`,
          description: `Discover the secret that's changing everything. Join 10,000+ satisfied customers today.`,
          cta: 'Learn More'
        },
        {
          headline: `Stop Scrolling! ${productName} is Here 🚀`,
          description: `The solution you've been waiting for. Fast shipping, easy returns, 5-star reviews.`,
          cta: 'Get Yours'
        },
      ]
      
      setGeneratedAds(mockAds)
      toast({
        title: '🎉 Ad Copy Generated!',
        description: '3 variations ready to use'
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard!' })
  }

  const selectedPlatform = AD_PLATFORMS.find(p => p.id === platform)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-red-500" />
            AI Ad Copy Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create high-converting ad copy for any platform
          </p>
        </div>
        <Badge className="bg-red-100 text-red-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Marketing Power
        </Badge>
      </div>

      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="easy">🌟 Easy Mode</TabsTrigger>
          <TabsTrigger value="pro">🚀 Pro Mode</TabsTrigger>
        </TabsList>

        {/* Easy Mode */}
        <TabsContent value="easy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>1️⃣ What Are You Promoting?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product/Service Name</Label>
                  <Input
                    placeholder="e.g., ProCreators AI Video Tool"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brief Description</Label>
                  <Textarea
                    placeholder="What does it do? What problem does it solve?"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2️⃣ Ad Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
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
                  <p className="text-xs text-muted-foreground">{selectedPlatform?.limits}</p>
                </div>

                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_GOALS.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <div className="flex flex-wrap gap-2">
                    {AD_TONES.map((t) => (
                      <Button
                        key={t.id}
                        variant={tone === t.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTone(t.id)}
                      >
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Ad Copy...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Generate 3 Ad Variations</>
            )}
          </Button>
        </TabsContent>

        {/* Pro Mode */}
        <TabsContent value="pro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Ad Settings</CardTitle>
              <CardDescription>Fine-tune your ad copy generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product/Service Name</Label>
                  <Input
                    placeholder="Your product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input
                    placeholder="e.g., Busy entrepreneurs aged 25-45"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Unique Selling Points</Label>
                <Textarea
                  placeholder="What makes your product special? Key benefits, features, social proof..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AD_PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AD_GOALS.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variations</Label>
                  <Select defaultValue="3">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 variations</SelectItem>
                      <SelectItem value="5">5 variations</SelectItem>
                      <SelectItem value="10">10 variations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="mr-2 h-4 w-4" /> Generate Ad Copy</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Ads */}
      {generatedAds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🎉 Generated Ad Variations</h2>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {generatedAds.map((ad, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Version {idx + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.description}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Headline</Label>
                    <p className="font-semibold">{ad.headline}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm text-muted-foreground">{ad.description}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CTA</Label>
                    <Badge className="mt-1">{ad.cta}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">💡 Ad Copy Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Strong Hook</p>
              <p className="text-red-700 dark:text-red-300">First 3 words must grab attention</p>
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Clear CTA</p>
              <p className="text-red-700 dark:text-red-300">Tell people exactly what to do next</p>
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Social Proof</p>
              <p className="text-red-700 dark:text-red-300">Numbers and testimonials convert</p>
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">A/B Test</p>
              <p className="text-red-700 dark:text-red-300">Test all 3 variations to find winners</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
