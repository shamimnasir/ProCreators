'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Globe, Link as LinkIcon , Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function NewsPage() {
  const [topic, setTopic] = useState('')
  const [contextUrl, setContextUrl] = useState('')
  const [language, setLanguage] = useState('english')
  const [style, setStyle] = useState('viral')
  const [loading, setLoading] = useState(false)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [generatedNews, setGeneratedNews] = useState('')
  const [urlContext, setUrlContext] = useState('')
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleFetchContext = async () => {
    if (!contextUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      })
      return
    }

    setLoadingUrl(true)
    try {
      const response = await fetch('/api/scrape/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: contextUrl })
      })

      const data = await response.json()
      if (data.success) {
        setUrlContext(data.content)
        await complete(creditResult.transactionId)
        toast({
          title: "Success",
          description: "URL content fetched successfully!"
        })
      } else {
        throw new Error(data.error || 'Failed to fetch URL')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoadingUrl(false)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
      const contextText = urlContext ? `\n\nContext from URL: ${urlContext}` : ''
      
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a ${style} news article about: ${topic}. ${languageText}. Make it engaging and shareable.${contextText}`,
          type: 'news',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedNews(data.content)
        
        // Auto-save to library
        try {
          await fetch('/api/library/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: data.content,
              type: 'text',
              title: `News: ${topic.substring(0, 50)}`,
              description: data.content.substring(0, 100),
              metadata: { topic, style, language, contextUrl, contentType: 'news' }
            })
          })
          console.log('News auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({
          title: "Success",
          description: `News article generated successfully in ${language === 'bengali' ? 'Bengali' : 'English'}!`
        })
      } else {
        throw new Error(data.error || 'Failed to generate')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedNews) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedNews,
          type: 'news',
          title: `News: ${topic.substring(0, 50)}`,
          description: generatedNews.substring(0, 100),
          metadata: {
            topic,
            style,
            language,
            contextUrl
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "News article saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save news article",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!generatedNews) return
    
    const blob = new Blob([generatedNews], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `news-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "News article downloaded successfully"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Viral News Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral news articles for Facebook, LinkedIn & news platforms in English/Bengali
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your news article parameters</CardDescription>
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
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viral">Viral</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="breaking">Breaking News</SelectItem>
                  <SelectItem value="opinion">Opinion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextUrl" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                URL Context (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="contextUrl"
                  placeholder="https://example.com/article"
                  value={contextUrl}
                  onChange={(e) => setContextUrl(e.target.value)}
                />
                <Button 
                  onClick={handleFetchContext} 
                  disabled={loadingUrl || !contextUrl.trim()}
                  variant="outline"
                >
                  {loadingUrl && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Fetch
                </Button>
              </div>
              {urlContext && (
                <p className="text-xs text-green-600">✓ Context loaded ({urlContext.length} chars)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">News Topic</Label>
              <Textarea
                id="topic"
                placeholder="Enter the topic for your news article..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">


              <CreditCostBadge toolId="news" />


              <Button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Wand2 className="mr-2 h-4 w-4" />
              Generate News Article
            </Button>


            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated News</CardTitle>
            <CardDescription>Your AI-generated news article</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedNews ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{generatedNews}</p>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    ✓ Automatically saved to Library
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Generated news article will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
