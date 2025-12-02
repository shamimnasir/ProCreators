'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ThreadsToolPage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
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
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a viral Twitter/X thread about: ${topic}. Tone: ${tone}. Make it engaging and shareable.`,
          type: 'thread'
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedThread(data.content)
        toast({
          title: "Success",
          description: "Thread generated successfully!"
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
    
    // TODO: Implement save to library
    toast({
      title: "Saved",
      description: "Thread saved to library"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thread Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral Twitter/X threads with AI
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
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm">{generatedThread}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
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
