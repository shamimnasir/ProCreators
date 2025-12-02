'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EbookMakerPage() {
  const [title, setTitle] = useState('')
  const [outline, setOutline] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!title.trim() || !outline.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
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
          prompt: `Create an ebook outline and content for: "${title}". Chapters: ${outline}`,
          type: 'ebook'
        })
      })

      const data = await response.json()
      if (data.success) {
        setGenerated(data.content)
        toast({
          title: "Success",
          description: "Ebook content generated!"
        })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ebook Maker</h1>
        <p className="text-muted-foreground mt-1">
          Create professional ebooks with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ebook Details</CardTitle>
            <CardDescription>Configure your ebook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter ebook title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chapter Outline</Label>
              <Textarea
                placeholder="Chapter 1: Introduction\nChapter 2: ...\n"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                rows={8}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <BookOpen className="mr-2 h-4 w-4" />
              Generate Ebook
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>Your ebook preview</CardDescription>
          </CardHeader>
          <CardContent>
            {generated ? (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm">{generated}</p>
                </div>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Ebook content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
