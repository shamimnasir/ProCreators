'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Video, Play, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ReelsPage() {
  const [script, setScript] = useState('')
  const [language, setLanguage] = useState('english')
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const languageText = language === 'bengali' ? 'in Bengali language' : 'in English language'
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${script}. Generate video ${languageText}.`,
          language: language
        })
      })

      const data = await response.json()
      if (data.success) {
        setVideoUrl(data.videoUrl)
        toast({
          title: "Success",
          description: data.message || "Video generated!"
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
        <h1 className="text-3xl font-bold tracking-tight">Reels / Shorts Creator</h1>
        <p className="text-muted-foreground mt-1">
          Create engaging short-form videos in Bengali or English
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Video Script</CardTitle>
            <CardDescription>Enter your video script or idea</CardDescription>
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
              <Label>Script</Label>
              <Textarea
                placeholder="Enter your video script..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={10}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Video className="mr-2 h-4 w-4" />
              Generate Video
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
            <CardDescription>Your generated video</CardDescription>
          </CardHeader>
          <CardContent>
            {videoUrl ? (
              <div className="space-y-4">
                <video className="w-full rounded-lg" controls>
                  <source src={videoUrl} type="video/mp4" />
                </video>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ This is a placeholder video. Integrate with video APIs for production.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <Play className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Video will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
