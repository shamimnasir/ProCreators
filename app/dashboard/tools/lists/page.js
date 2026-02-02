'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Save, Sparkles, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function ListsPage() {
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('english')
  const [listType, setListType] = useState('top10')
  const [loading, setLoading] = useState(false)
  const [generatedList, setGeneratedList] = useState('')
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
      const listFormat = {
        'top10': 'Top 10 list',
        'top5': 'Top 5 list',
        'checklist': 'Checklist format',
        'tips': 'Tips and tricks format',
        'reasons': 'Reasons list'
      }[listType]

      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a ${listFormat} about: ${topic}. ${languageText}. Make it engaging, informative, and well-structured with clear points.`,
          type: 'list',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedList(data.content)
        
        // Auto-save to library
        try {
          await fetch('/api/library/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: data.content,
              type: 'text',
              title: `List: ${topic.substring(0, 50)}`,
              description: data.content.substring(0, 100),
              metadata: { topic, listType, language, contentType: 'list' }
            })
          })
          console.log('List auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({
          title: "Success",
          description: `List generated successfully in ${language === 'bengali' ? 'Bengali' : 'English'}!`
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
    if (!generatedList) return
    
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedList,
          type: 'list',
          title: `List: ${topic.substring(0, 50)}`,
          description: generatedList.substring(0, 100),
          metadata: {
            topic,
            listType,
            language
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "List saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save list",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!generatedList) return
    
    const blob = new Blob([generatedList], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `list-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "List downloaded successfully"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Viral Listicle Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create viral list posts for Facebook, LinkedIn, X/Twitter & blogs in English/Bengali
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your list parameters</CardDescription>
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
              <Label>List Type</Label>
              <Select value={listType} onValueChange={setListType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top10">Top 10 List</SelectItem>
                  <SelectItem value="top5">Top 5 List</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="tips">Tips & Tricks</SelectItem>
                  <SelectItem value="reasons">Reasons List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">List Topic</Label>
              <Textarea
                id="topic"
                placeholder="Enter the topic for your list (e.g., 'Best productivity apps', 'Ways to improve health')..."
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
              Generate List
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated List</CardTitle>
            <CardDescription>Your AI-generated list content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedList ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{generatedList}</p>
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
                  Generated list will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
