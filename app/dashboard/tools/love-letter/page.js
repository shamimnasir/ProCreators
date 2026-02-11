'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, Sparkles, Loader2, Copy, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const OCCASIONS = [
  { id: 'just-because', name: 'Just Because', icon: '💕' },
  { id: 'anniversary', name: 'Anniversary', icon: '💍' },
  { id: 'valentines', name: "Valentine's Day", icon: '💝' },
  { id: 'birthday', name: 'Birthday', icon: '🎂' },
  { id: 'apology', name: 'Apology/Making Up', icon: '🙏' },
  { id: 'long-distance', name: 'Long Distance', icon: '✈️' },
  { id: 'proposal', name: 'Before Proposal', icon: '💎' },
  { id: 'first-love', name: 'First Love Letter', icon: '🌹' }
]

const TONES = [
  { id: 'romantic', name: 'Deeply Romantic', icon: '💗' },
  { id: 'playful', name: 'Playful & Fun', icon: '😊' },
  { id: 'passionate', name: 'Passionate', icon: '🔥' },
  { id: 'sweet', name: 'Sweet & Tender', icon: '🍯' },
  { id: 'poetic', name: 'Poetic & Literary', icon: '📜' }
]

const RELATIONSHIPS = [
  'Boyfriend/Girlfriend',
  'Husband/Wife', 
  'Fiancé/Fiancée',
  'Crush',
  'Long-term Partner',
  'New Relationship'
]

export default function LoveLetterPage() {
  const [recipientName, setRecipientName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [occasion, setOccasion] = useState('just-because')
  const [tone, setTone] = useState('romantic')
  const [details, setDetails] = useState('')
  const [length, setLength] = useState('medium')
  const [generating, setGenerating] = useState(false)
  const [letter, setLetter] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('love-letter')
    if (!creditResult.success) {
      toast({ title: 'Insufficient Credits', description: creditResult.error || 'You need more credits.', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'love-letter',
          recipientName,
          relationship,
          occasion,
          tone,
          details,
          length
        })
      })

      const data = await response.json()
      if (data.success) {
        setLetter(data.data)
        await complete(creditResult.transactionId)
        toast({
          title: '💕 Love Letter Created!',
          description: 'A heartfelt letter crafted just for you'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyLetter = () => {
    const fullLetter = `${letter.greeting}\n\n${letter.body}\n\n${letter.closing}\n${letter.signature}${letter.ps ? `\n\nP.S. ${letter.ps}` : ''}`
    navigator.clipboard.writeText(fullLetter)
    toast({ title: 'Copied!', description: 'Letter copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      {/* Romantic Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-4 left-8 text-2xl animate-pulse">💕</div>
          <div className="absolute top-12 right-12 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>💗</div>
          <div className="absolute bottom-8 left-1/4 text-lg animate-pulse" style={{animationDelay: '1s'}}>💝</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Love Letter Generator</h1>
              <p className="text-white/80">Express your heart with beautiful words</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💌</span> Craft Your Letter
            </CardTitle>
            <CardDescription>Tell us about your special someone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Their Name (Optional)</Label>
                <Input
                  placeholder="My Love, Darling, etc."
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Occasion</Label>
              <div className="grid grid-cols-4 gap-2">
                {OCCASIONS.map((occ) => (
                  <Button
                    key={occ.id}
                    variant={occasion === occ.id ? 'default' : 'outline'}
                    className="h-auto py-2 flex flex-col items-center gap-1"
                    onClick={() => setOccasion(occ.id)}
                  >
                    <span className="text-lg">{occ.icon}</span>
                    <span className="text-[10px] text-center leading-tight">{occ.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tone & Style</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <Button
                    key={t.id}
                    variant={tone === t.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTone(t.id)}
                  >
                    {t.icon} {t.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Memories or Details (Optional)</Label>
              <Textarea
                placeholder="Our first date at the beach, how they laugh at my jokes, their beautiful smile..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Add personal details to make it unique</p>
            </div>

            <div className="space-y-2">
              <Label>Letter Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short & Sweet</SelectItem>
                  <SelectItem value="medium">Medium (Recommended)</SelectItem>
                  <SelectItem value="long">Long & Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">


              <CreditCostBadge toolId="love-letter" />


              <Button 
              size="lg" 
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600" 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing with Love...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> Generate Love Letter</>  
              )}
            </Button>


            </div>
          </CardContent>
        </Card>

        {/* Letter Display */}
        <div className="space-y-4">
          {letter ? (
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-pink-800 dark:text-pink-200 flex items-center gap-2">
                  <span className="text-2xl">💌</span> Your Love Letter
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyLetter}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-inner border border-pink-200 dark:border-pink-800">
                  <p className="font-serif text-lg text-pink-900 dark:text-pink-100 mb-4">
                    {letter.greeting}
                  </p>
                  <div className="font-serif text-pink-800 dark:text-pink-200 whitespace-pre-line leading-relaxed">
                    {letter.body}
                  </div>
                  <p className="font-serif text-pink-900 dark:text-pink-100 mt-4">
                    {letter.closing}
                  </p>
                  <p className="font-serif text-pink-900 dark:text-pink-100 italic mt-2">
                    {letter.signature}
                  </p>
                  {letter.ps && (
                    <p className="font-serif text-pink-700 dark:text-pink-300 mt-4 text-sm">
                      P.S. {letter.ps}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed h-full min-h-[500px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <Heart className="h-16 w-16 mx-auto mb-4 opacity-50 text-pink-300" />
                <p className="text-lg">Your love letter will appear here</p>
                <p className="text-sm">Fill in the details and let AI help express your heart</p>
              </CardContent>
            </Card>
          )}

          {letter?.alternateVersions && letter.alternateVersions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alternative Versions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {letter.alternateVersions.map((alt, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <Badge variant="outline" className="mb-2">{alt.tone}</Badge>
                    <p className="text-sm">{alt.snippet}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
        <CardHeader>
          <CardTitle className="text-pink-800 dark:text-pink-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tips for the Perfect Love Letter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-pink-800 dark:text-pink-200">Be Specific</p>
              <p className="text-pink-700 dark:text-pink-300">Mention real memories and details they'll recognize</p>
            </div>
            <div>
              <p className="font-medium text-pink-800 dark:text-pink-200">Handwrite It</p>
              <p className="text-pink-700 dark:text-pink-300">Copy to paper for a personal touch</p>
            </div>
            <div>
              <p className="font-medium text-pink-800 dark:text-pink-200">Add Your Voice</p>
              <p className="text-pink-700 dark:text-pink-300">Edit to include your unique expressions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
