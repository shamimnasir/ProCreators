'use client'

import { saveToLibrary } from '@/lib/secure-api'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Quote, Globe, Save, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function QuotesPage() {
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('english')
  const [loading, setLoading] = useState(false)
  const [generatedQuote, setGeneratedQuote] = useState('')
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('quotes')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setLoading(true)
    try {
      const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate an inspiring quote about: ${topic}. Generate the content ${languageText}.`,
          type: 'quote',
          language: language
        })
      })
      const data = await response.json()
      if (data.success) {
        setGeneratedQuote(data.content)
        
        // Auto-save to library using secure API
        try {
          await saveToLibrary({
            content: data.content,
            type: 'text',
            title: `Quote: ${topic.substring(0, 50)}`,
            description: data.content.substring(0, 100),
            metadata: { topic, language, contentType: 'quote' }
          })
          console.log('Quote auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
        }
        
        toast({ title: "Success", description: `Quote generated in ${language === 'bengali' ? 'Bengali' : 'English'}!` })
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedQuote) return
    
    try {
      const data = await saveToLibrary({
        content: generatedQuote,
        type: 'quote',
        title: `Quote: ${topic.substring(0, 50)}`,
        description: generatedQuote.substring(0, 100),
        metadata: {
          topic,
          language
        }
      })
      
      if (data.success) {
        toast({
          title: "Saved",
          description: "Quote saved to library successfully!"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save quote",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!generatedQuote) return
    
    const blob = new Blob([generatedQuote], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quote-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Quote downloaded successfully"
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Viral Quote Generator</h1>
        <p className="text-muted-foreground mt-1">Create viral quotes for Instagram, Facebook, LinkedIn & X/Twitter in English/Bengali</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
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
              <Label>Topic</Label>
              <Textarea
                placeholder="Enter topic for quote..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-3">

              <CreditCostBadge toolId="quotes" />

              <Button onClick={handleGenerate} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Quote className="mr-2 h-4 w-4" />
              Generate Quote
            </Button>

            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated Quote</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedQuote ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-6">
                  <p className="text-lg italic text-center">{generatedQuote}</p>
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
