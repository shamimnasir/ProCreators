'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Mic, Volume2, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function VoiceClonePage() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('english')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text,
          type: 'generate',
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setAudioUrl(data.audioUrl)
        await complete(creditResult.transactionId)
        toast({
          title: "Success",
          description: data.message || "Voice generated!"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voice Cloning</h1>
        <p className="text-muted-foreground mt-1">
          Generate realistic voice-overs in Bengali or English
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Text Input</CardTitle>
            <CardDescription>Enter text to convert to speech</CardDescription>
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
              <Label>Text</Label>
              <Textarea
                placeholder="Enter the text you want to convert to speech..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
              />
            </div>
            <div className="flex items-center gap-3">

              <CreditCostBadge toolId="voice-clone" />

              <Button onClick={handleGenerate} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mic className="mr-2 h-4 w-4" />
              Generate Voice
            </Button>

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Output</CardTitle>
            <CardDescription>Your generated audio</CardDescription>
          </CardHeader>
          <CardContent>
            {audioUrl ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-6 text-center">
                  <Volume2 className="mx-auto h-12 w-12 text-primary mb-4" />
                  <audio className="w-full" controls>
                    <source src={audioUrl} type="audio/wav" />
                  </audio>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ This is a placeholder audio. Integrate with voice APIs for production.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <Volume2 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Audio will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
