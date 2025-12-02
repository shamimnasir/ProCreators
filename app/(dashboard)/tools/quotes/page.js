'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Quote } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function QuotesPage() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedQuote, setGeneratedQuote] = useState('')
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate an inspiring quote about: ${topic}`,
          type: 'quote'
        })
      })
      const data = await response.json()
      if (data.success) {
        setGeneratedQuote(data.content)
        toast({ title: "Success", description: "Quote generated!" })
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quote Generator</h1>
        <p className="text-muted-foreground mt-1">Create viral quotes with AI</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Textarea
                placeholder="Enter topic for quote..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Quote className="mr-2 h-4 w-4" />
              Generate Quote
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated Quote</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedQuote ? (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-lg italic">{generatedQuote}</p>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Quote will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
