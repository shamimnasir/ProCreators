'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Video, Download, Globe, Play, FilmIcon , Wand2, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function ScriptToAdPage() {
  const [productName, setProductName] = useState('')
  const [offer, setOffer] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [language, setLanguage] = useState('english')
  const [loading, setLoading] = useState(false)
  const [generatedScripts, setGeneratedScripts] = useState(null)
  const [selectedScript, setSelectedScript] = useState(0)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const scriptTypes = [
    { type: 'ugc', label: 'UGC Style', icon: '🗣️', description: 'User-generated content feel, authentic and relatable' },
    { type: 'emotional', label: 'Emotional', icon: '❤️', description: 'Touches hearts, creates connection' },
    { type: 'problem-solution', label: 'Problem-Solution', icon: '✅', description: 'Identifies pain point and offers solution' }
  ]

  const handleGenerateScripts = async () => {
    if (!productName.trim() || !offer.trim() || !targetAudience.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate 3 different ad scripts ${languageText} for:
Product: ${productName}
Offer: ${offer}
Target Audience: ${targetAudience}

Create:
1. UGC Style script (authentic, user-generated feel)
2. Emotional script (touching, creates connection)
3. Problem-Solution script (identifies pain, offers solution)

For each script include:
- Hook (first 3 seconds)
- Main message (10-15 seconds)
- Call to action
- B-roll suggestions for each scene`,
          type: 'ad-scripts',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        // Parse the response into structured scripts
        const scripts = {
          ugc: {
            script: data.content.split('UGC')[1]?.split('Emotional')[0] || data.content,
            broll: ['Close-up of product', 'User testimonial footage', 'Product in use'],
            voice: 'Casual, friendly tone'
          },
          emotional: {
            script: data.content.split('Emotional')[1]?.split('Problem')[0] || data.content,
            broll: ['Emotional moments', 'Family scenes', 'Product benefits'],
            voice: 'Warm, empathetic tone'
          },
          problemSolution: {
            script: data.content.split('Problem')[1] || data.content,
            broll: ['Problem scenario', 'Product introduction', 'Happy outcome'],
            voice: 'Authoritative, confident tone'
          }
        }
        
        setGeneratedScripts(scripts)
        toast({
          title: "Success",
          description: `3 ad scripts generated in ${language === 'bengali' ? 'Bengali' : 'English'}!`
        })
      }
    } catch (error) {
      await refund(creditResult.transactionId, error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFullVideo = async (scriptKey) => {
    setGeneratingVideo(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: "Video Generation Started",
        description: "Your full ad video is being created. This may take 2-5 minutes."
      })
      
      // Simulate video generation completion
      setTimeout(() => {
        toast({
          title: "Video Ready!",
          description: "Your ad video has been generated successfully."
        })
      }, 5000)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setGeneratingVideo(false)
    }
  }

  const getScriptData = (index) => {
    if (!generatedScripts) return null
    const keys = ['ugc', 'emotional', 'problemSolution']
    return generatedScripts[keys[index]]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Script-to-Ad Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate professional ad scripts with storyboards and B-roll suggestions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
            <CardDescription>Enter your product information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="bengali">Bengali (বাংলা)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                placeholder="e.g., Premium Coffee Blend"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Offer/USP</Label>
              <Textarea
                placeholder="e.g., 50% off for first-time buyers, Free shipping"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea
                placeholder="e.g., Young professionals, 25-35, health-conscious"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <CreditCostBadge toolId="script-to-ad" />
              <Button
                onClick={handleGenerateScripts}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Wand2 className="mr-2 h-4 w-4" />
                Generate 3 Ad Scripts
              </Button>
            </div>

            {generatedScripts && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Generated Script Types:</p>
                <div className="space-y-2">
                  {scriptTypes.map((type, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Area */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Scripts</CardTitle>
            <CardDescription>Review and select your preferred ad script</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedScripts ? (
              <Tabs value={selectedScript.toString()} onValueChange={(v) => setSelectedScript(parseInt(v))}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="0">UGC</TabsTrigger>
                  <TabsTrigger value="1">Emotional</TabsTrigger>
                  <TabsTrigger value="2">Problem-Solution</TabsTrigger>
                </TabsList>
                
                {[0, 1, 2].map((index) => (
                  <TabsContent key={index} value={index.toString()} className="space-y-4">
                    <div className="space-y-4">
                      {/* Script */}
                      <div>
                        <Label className="text-sm font-semibold">Script</Label>
                        <div className="mt-2 p-4 rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap">{getScriptData(index)?.script}</p>
                        </div>
                      </div>

                      {/* B-Roll Suggestions */}
                      <div>
                        <Label className="text-sm font-semibold">B-Roll Suggestions</Label>
                        <div className="mt-2 space-y-2">
                          {getScriptData(index)?.broll.map((broll, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <FilmIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm">{broll}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Voice Style */}
                      <div>
                        <Label className="text-sm font-semibold">Voice Style</Label>
                        <div className="mt-2 p-3 rounded-lg bg-muted/50">
                          <p className="text-sm">{getScriptData(index)?.voice}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleGenerateFullVideo(index)}
                          disabled={generatingVideo}
                          className="flex-1"
                        >
                          {generatingVideo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Video className="mr-2 h-4 w-4" />
                          Generate Full Video
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          Export Script
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Fill in the details to generate scripts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storyboard Preview */}
      {generatedScripts && (
        <Card>
          <CardHeader>
            <CardTitle>Storyboard Preview</CardTitle>
            <CardDescription>Visual breakdown of your ad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {['Hook Scene', 'Main Message', 'Call to Action'].map((scene, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Play className="h-12 w-12 text-purple-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{scene}</p>
                    <p className="text-xs text-muted-foreground">Scene {i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
