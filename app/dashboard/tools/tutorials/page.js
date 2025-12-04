'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Sparkles, Globe, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TutorialsPage() {
  const [topic, setTopic] = useState('')
  const [contextUrl, setContextUrl] = useState('')
  const [language, setLanguage] = useState('english')
  const [level, setLevel] = useState('beginner')
  const [loading, setLoading] = useState(false)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [generatedTutorial, setGeneratedTutorial] = useState('')
  const [urlContext, setUrlContext] = useState('')
  const { toast } = useToast()

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
          prompt: `Create a detailed step-by-step tutorial about: ${topic}. Level: ${level}. ${languageText}. Make it clear, educational, and easy to follow with numbered steps.${contextText}`,
          type: 'tutorial',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedTutorial(data.content)
        
        // Auto-save to library
        try {
          const saveResponse = await fetch('/api/library/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: data.content,
              type: 'tutorial',
              title: `Tutorial: ${topic.substring(0, 50)}`,
              description: data.content.substring(0, 100),
              metadata: {
                topic,
                level,
                language,
                contextUrl
              }
            })
          })
          
          const saveData = await saveResponse.json()
          
          if (saveData.success) {
            toast({
              title: "Success",
              description: `Tutorial generated and saved to library!`
            })
          } else {
            toast({
              title: "Generated",
              description: `Tutorial generated but couldn't save to library`,
              variant: "destructive"
            })
          }
        } catch (saveError) {
          toast({
            title: "Generated",
            description: `Tutorial generated but couldn't save to library`,
            variant: "destructive"
          })
        }
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

  const handleDownload = () => {
    if (!generatedTutorial) return
    
    const blob = new Blob([generatedTutorial], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tutorial-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Tutorial downloaded successfully"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Viral Tutorial Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral step-by-step tutorials for YouTube, LinkedIn & blogs in English/Bengali
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your tutorial parameters</CardDescription>
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
              <Label>Difficulty Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
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
                  placeholder="https://example.com/reference"
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
              <Label htmlFor="topic">Tutorial Topic</Label>
              <Textarea
                id="topic"
                placeholder="Enter the topic for your tutorial (e.g., 'How to build a React app', 'Photography basics')..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Tutorial
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Tutorial</CardTitle>
            <CardDescription>Your AI-generated step-by-step guide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedTutorial ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{generatedTutorial}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Generated tutorial will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
