'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Sparkles, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ThreadsToolPage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [language, setLanguage] = useState('english')
  const [loading, setLoading] = useState(false)
  const [generatedThread, setGeneratedThread] = useState('')
  const { toast } = useToast()

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
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a viral Twitter/X thread about: ${topic}. Tone: ${tone}. Generate the content ${languageText}. Make it engaging and shareable.`,
          type: 'thread',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedThread(data.content)
        
        // Auto-save to library
        try {
          await fetch('/api/library/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: data.content,
              type: 'text',
              title: `Thread: ${topic.substring(0, 50)}`,
              description: data.content.substring(0, 100),
              metadata: { topic, tone, language, contentType: 'thread' }
            })
          })
          console.log('Thread auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({
          title: "Success",
          description: `Thread generated successfully in ${language === 'bengali' ? 'Bengali' : 'English'}!`
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
    if (!generatedThread) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedThread,
          type: 'thread',
          title: `Thread: ${topic.substring(0, 50)}`,
          description: generatedThread.substring(0, 100),
          metadata: {
            topic,
            tone,
            language
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "Thread saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save thread",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!generatedThread) return
    
    const blob = new Blob([generatedThread], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thread-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Thread downloaded successfully"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thread Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral Twitter/X threads with AI in Bengali or English
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your thread parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
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
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                placeholder="Enter the topic for your thread..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Thread
            </Button>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Thread</CardTitle>
            <CardDescription>Your AI-generated content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedThread ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{generatedThread}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  ✓ Automatically saved to Library
                </p>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Generated thread will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
