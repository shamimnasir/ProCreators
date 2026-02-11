'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, Moon, Star, Sun, Heart, Briefcase, Coins } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

const CATEGORIES = [
  { id: 'love', name: 'Love & Relationships', icon: '💕', lucideIcon: Heart },
  { id: 'career', name: 'Career & Success', icon: '💼', lucideIcon: Briefcase },
  { id: 'money', name: 'Money & Fortune', icon: '💰', lucideIcon: Coins },
  { id: 'health', name: 'Health & Wellness', icon: '🌿', lucideIcon: Sun },
  { id: 'general', name: 'General Life', icon: '✨', lucideIcon: Star }
]

const STYLES = [
  { id: 'mystical', name: 'Mystical Oracle', icon: '🔮' },
  { id: 'zodiac', name: 'Zodiac Reading', icon: '⭐' },
  { id: 'tarot', name: 'Tarot Inspired', icon: '🎴' },
  { id: 'crystal', name: 'Crystal Ball', icon: '💎' }
]

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
  { id: 'taurus', name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
  { id: 'gemini', name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
  { id: 'cancer', name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
  { id: 'leo', name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
  { id: 'virgo', name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
  { id: 'libra', name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22' },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
  { id: 'pisces', name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20' }
]

export default function FortuneTellerPage() {
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')
  const [style, setStyle] = useState('mystical')
  const [zodiacSign, setZodiacSign] = useState('')
  const [generating, setGenerating] = useState(false)
  const [fortune, setFortune] = useState(null)
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  const handleGenerate = async () => {
    setGenerating(true)
    
    // Deduct credits first
    const creditResult = await checkAndDeduct('fortune-teller')
    if (!creditResult.success) {
      setGenerating(false)
      toast({
        title: 'Insufficient Credits',
        description: creditResult.error || 'You need more credits.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch('/api/fun-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'fortune',
          category,
          question,
          style,
          zodiacSign
        })
      })

      const data = await response.json()
      if (data.success) {
        await complete(creditResult.transactionId)
        setFortune(data.data)
        toast({
          title: '🔮 The Spirits Have Spoken!',
          description: `Fortune revealed! Used ${creditResult.cost} credits.`
        })
      } else {
        await refund(creditResult.transactionId, data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'The Spirits Are Silent',
        description: error.message + ' (Credits refunded)',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mystical Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-4 left-8 text-2xl animate-pulse">✨</div>
          <div className="absolute top-12 right-12 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>⭐</div>
          <div className="absolute bottom-8 left-1/4 text-lg animate-pulse" style={{animationDelay: '1s'}}>🌙</div>
          <div className="absolute top-6 right-1/3 text-sm animate-bounce">💫</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Moon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Fortune Teller</h1>
              <p className="text-white/80">Gaze into the mystical realm of possibilities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🎴</span> Choose Your Reading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What area of life interests you?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={category === cat.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => setCategory(cat.id)}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs">{cat.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reading Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <Button
                      key={s.id}
                      variant={style === s.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStyle(s.id)}
                    >
                      {s.icon} {s.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Zodiac Sign (Optional)</Label>
                <Select value={zodiacSign} onValueChange={setZodiacSign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ZODIAC_SIGNS.map((sign) => (
                      <SelectItem key={sign.id} value={sign.id}>
                        {sign.symbol} {sign.name} ({sign.dates})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ask a Question (Optional)</Label>
                <Textarea
                  placeholder="What does the future hold for my career? Will I find love soon?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <CreditCostBadge toolId="fortune-teller" />
                <Button 
                  size="lg" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
                  onClick={handleGenerate} 
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Consulting the Spirits...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Reveal My Fortune</>  
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fortune Display */}
        <div className="space-y-4">
          {fortune ? (
            <>
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <span className="text-2xl">🔮</span> Your Fortune
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg text-purple-900 dark:text-purple-100 italic">
                    "{fortune.mainPrediction}"
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">🍀</span> Lucky Elements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{fortune.luckyElements?.number || '7'}</p>
                      <p className="text-xs text-muted-foreground">Lucky Number</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-lg font-bold text-primary">{fortune.luckyElements?.color || 'Gold'}</p>
                      <p className="text-xs text-muted-foreground">Lucky Color</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-lg font-bold text-primary">{fortune.luckyElements?.day || 'Friday'}</p>
                      <p className="text-xs text-muted-foreground">Lucky Day</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="font-medium flex items-center gap-2"><span>💡</span> Mystical Advice</p>
                    <p className="text-muted-foreground mt-1">{fortune.advice}</p>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2"><span>⚠️</span> Cosmic Warning</p>
                    <p className="text-muted-foreground mt-1">{fortune.warning}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">✨ Daily Affirmation</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1 italic">"{fortune.affirmation}"</p>
                  </div>
                </CardContent>
              </Card>

              {fortune.mysticalMessage && (
                <Card className="border-dashed border-purple-300">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">A Message from the Cosmos</p>
                    <p className="text-lg italic text-purple-700 dark:text-purple-300">
                      "{fortune.mysticalMessage}"
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <Moon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">The crystal ball awaits...</p>
                <p className="text-sm">Choose your reading and reveal your destiny</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          <p>🎭 This is for entertainment purposes only. The AI generates creative, fun fortunes inspired by mystical traditions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
