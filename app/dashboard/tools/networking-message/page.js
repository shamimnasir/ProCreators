'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Users, Loader2, Target, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  Check, Mail, Send, Heart, UserPlus, Handshake,
  Linkedin, Twitter, Building, GraduationCap, Calendar,
  ArrowLeft, AlertCircle, ThumbsUp, Clock, Zap
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

// Message Types
const MESSAGE_TYPES = [
  { id: 'initial', name: 'Initial Outreach', icon: Send, description: 'First contact to establish connection' },
  { id: 'followup', name: 'Follow-Up', icon: RefreshCw, description: 'Gentle reminder after no response' },
  { id: 'thankyou', name: 'Thank You', icon: Heart, description: 'Express gratitude after receiving help' },
  { id: 'reconnect', name: 'Reconnect', icon: UserPlus, description: 'Re-establish an old connection' },
  { id: 'introduction', name: 'Introduction Request', icon: Handshake, description: 'Ask for an intro to someone' }
]

// Connection Contexts
const CONNECTION_CONTEXTS = [
  { id: 'mutual', name: 'Mutual Connection', icon: Users, hint: 'Mention who introduced you' },
  { id: 'event', name: 'Met at Event', icon: Calendar, hint: 'Reference the specific event' },
  { id: 'content', name: 'Their Content', icon: MessageSquare, hint: 'Mention their post/article you liked' },
  { id: 'alumni', name: 'Same School', icon: GraduationCap, hint: 'Reference shared alma mater' },
  { id: 'company', name: 'Same Company', icon: Building, hint: 'Current or former colleagues' },
  { id: 'industry', name: 'Same Industry', icon: Target, hint: 'Shared professional interests' },
  { id: 'cold', name: 'Cold Outreach', icon: Zap, hint: 'No prior connection - need strong hook' }
]

// Purpose Types
const PURPOSE_TYPES = [
  { id: 'informational', name: 'Informational Interview', description: 'Learn about their career path' },
  { id: 'advice', name: 'Career Advice', description: 'Seeking guidance on career decisions' },
  { id: 'collaboration', name: 'Collaboration', description: 'Explore working together' },
  { id: 'mentorship', name: 'Mentorship', description: 'Seeking ongoing guidance' },
  { id: 'referral', name: 'Job Referral', description: 'Ask about opportunities' },
  { id: 'introduction', name: 'Get Introduced', description: 'Request intro to someone else' },
  { id: 'general', name: 'General Networking', description: 'Build professional relationship' }
]

// Platform Options
const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter }
]

// Tone Options
const TONES = [
  { id: 'professional', name: 'Professional', desc: 'Formal but friendly' },
  { id: 'warm', name: 'Warm & Personal', desc: 'More casual and genuine' },
  { id: 'enthusiastic', name: 'Enthusiastic', desc: 'Energetic and eager' },
  { id: 'direct', name: 'Direct', desc: 'Straight to the point' }
]

export default function NetworkingMessagePage() {
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('setup')
  const [copied, setCopied] = useState({})
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Form state
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState('')
  const [recipientCompany, setRecipientCompany] = useState('')
  const [recipientAchievement, setRecipientAchievement] = useState('')
  const [connectionContext, setConnectionContext] = useState('content')
  const [connectionDetails, setConnectionDetails] = useState('')
  const [purpose, setPurpose] = useState('informational')
  const [specificAsk, setSpecificAsk] = useState('')
  const [yourBackground, setYourBackground] = useState('')
  const [valueOffer, setValueOffer] = useState('')
  const [messageType, setMessageType] = useState('initial')
  const [tone, setTone] = useState('professional')
  const [platform, setPlatform] = useState('linkedin')
  
  // Results
  const [result, setResult] = useState(null)
  const [outputTab, setOutputTab] = useState('main')

  const generateMessage = async () => {
    if (!recipientName.trim()) {
      toast({ title: 'Missing Information', description: 'Please enter the recipient\'s name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/networking-message/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientRole,
          recipientCompany,
          recipientAchievement,
          connectionContext,
          connectionDetails,
          purpose,
          specificAsk,
          yourBackground,
          valueOffer,
          messageType,
          tone,
          platform
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveTab('results')
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'networking-message',
            category: 'text',
            title: `Networking: ${recipientName} (${PURPOSE_TYPES.find(p => p.id === purpose)?.name || purpose})`,
            description: `${messageType} message for ${recipientRole || 'professional'} at ${recipientCompany || 'company'}`,
            content: JSON.stringify(data.data),
            metadata: {
              recipientName,
              recipientRole,
              recipientCompany,
              purpose,
              messageType,
              platform,
              contentType: 'networking-message'
            }
          })
          if (saveResult.success) {
            toast({ title: '✉️ Message Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '✉️ Message Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '✉️ Message Generated!' })
        }
      } else {
        await refund(creditResult.transactionId, data.error)
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }, [toast])

  const selectedContext = CONNECTION_CONTEXTS.find(c => c.id === connectionContext)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/jobs-career">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-7 w-7 text-blue-500" />
              Networking Message Generator
            </h1>
            <Badge className="bg-blue-500 text-white">Pro</Badge>
          </div>
          <p className="text-muted-foreground">Create personalized outreach messages that get responses</p>
        </div>
      </div>

      {/* Best Practices Banner */}
      <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">Personalize</div>
              <div className="text-xs text-blue-100">Research First</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Value</div>
              <div className="text-xs text-blue-100">Give Before Ask</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Brief</div>
              <div className="text-xs text-blue-100">2-3 Paragraphs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Clear CTA</div>
              <div className="text-xs text-blue-100">Small Ask</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="setup">📝 Setup</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>✉️ Message</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Recipient Info */}
            <div className="space-y-4">
              {/* Recipient Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Recipient Information
                  </CardTitle>
                  <CardDescription>Who are you reaching out to?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g., Sarah Johnson"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role/Title</Label>
                      <Input
                        value={recipientRole}
                        onChange={(e) => setRecipientRole(e.target.value)}
                        placeholder="e.g., Product Manager"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={recipientCompany}
                      onChange={(e) => setRecipientCompany(e.target.value)}
                      placeholder="e.g., Google"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Recent Achievement / Notable Work</Label>
                    <Textarea
                      value={recipientAchievement}
                      onChange={(e) => setRecipientAchievement(e.target.value)}
                      placeholder="e.g., Recently promoted, published article on AI, spoke at conference..."
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Connection Context */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-green-500" />
                    Connection Context
                  </CardTitle>
                  <CardDescription>How do you know them?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONNECTION_CONTEXTS.map((ctx) => {
                      const Icon = ctx.icon
                      return (
                        <button
                          key={ctx.id}
                          onClick={() => setConnectionContext(ctx.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            connectionContext === ctx.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-muted hover:border-blue-300'
                          }`}
                        >
                          <Icon className="h-4 w-4 mx-auto mb-1" />
                          <div className="text-[10px] font-medium">{ctx.name}</div>
                        </button>
                      )
                    })}
                  </div>
                  
                  {selectedContext && (
                    <div>
                      <Label className="text-xs">Details ({selectedContext.hint})</Label>
                      <Textarea
                        value={connectionDetails}
                        onChange={(e) => setConnectionDetails(e.target.value)}
                        placeholder={`e.g., ${selectedContext.hint}`}
                        className="min-h-[60px]"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Your Background */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Your Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Your Background (Brief)</Label>
                    <Textarea
                      value={yourBackground}
                      onChange={(e) => setYourBackground(e.target.value)}
                      placeholder="e.g., Software engineer with 3 years experience, currently transitioning into product..."
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Value You Can Offer</Label>
                    <Textarea
                      value={valueOffer}
                      onChange={(e) => setValueOffer(e.target.value)}
                      placeholder="e.g., Share relevant article, offer introduction, provide insights on a topic..."
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Message Settings */}
            <div className="space-y-4">
              {/* Message Type */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Message Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {MESSAGE_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setMessageType(type.id)}
                          className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                            messageType === type.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-muted hover:border-blue-300'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Purpose */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Purpose of Outreach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {PURPOSE_TYPES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          purpose === p.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                            : 'border-muted hover:border-orange-300'
                        }`}
                      >
                        <div className="text-xs font-medium">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.description}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div>
                    <Label className="text-xs">Specific Ask (Keep it small!)</Label>
                    <Input
                      value={specificAsk}
                      onChange={(e) => setSpecificAsk(e.target.value)}
                      placeholder="e.g., 15-min call, quick question about..., your perspective on..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Platform & Tone */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Platform & Tone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Platform</Label>
                    <div className="flex gap-2">
                      {PLATFORMS.map((p) => {
                        const Icon = p.icon
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                              platform === p.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                : 'border-muted hover:border-blue-300'
                            }`}
                          >
                            <Icon className="h-4 w-4 mx-auto mb-1" />
                            <div className="text-xs">{p.name}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-2 block">Tone</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            tone === t.id
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                              : 'border-muted hover:border-yellow-300'
                          }`}
                        >
                          <div className="text-xs font-medium">{t.name}</div>
                          <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex items-center gap-4">
                <CreditCostBadge toolId="networking-message" />
                <Button 
                  onClick={generateMessage} 
                  disabled={generating || !recipientName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Crafting Message...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate Networking Message</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              {/* Output Type Tabs */}
              <div className="flex gap-2 flex-wrap">
                {['main', 'alternatives', 'followup', 'tips'].map((tab) => (
                  <Button
                    key={tab}
                    variant={outputTab === tab ? 'default' : 'outline'}
                    onClick={() => setOutputTab(tab)}
                    className={outputTab === tab ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {tab === 'main' && <Mail className="h-4 w-4 mr-1" />}
                    {tab === 'alternatives' && <RefreshCw className="h-4 w-4 mr-1" />}
                    {tab === 'followup' && <Clock className="h-4 w-4 mr-1" />}
                    {tab === 'tips' && <Lightbulb className="h-4 w-4 mr-1" />}
                    {tab === 'main' ? 'Main Message' : tab === 'alternatives' ? 'Alternatives' : tab === 'followup' ? 'Follow-Up' : 'Tips'}
                  </Button>
                ))}
              </div>

              {/* Main Message */}
              {outputTab === 'main' && (
                <div className="space-y-4">
                  {/* Subject Line */}
                  {result.subjectLine && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-500" />
                            Subject Line
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(result.subjectLine, 'subject')}
                          >
                            {copied.subject ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 font-medium">
                          {result.subjectLine}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Main Message */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          Your Message
                        </CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCopy(result.message, 'message')}
                        >
                          {copied.message ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <CardDescription>Ready to send - personalized and concise</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border">
                        {result.message}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Alternative Versions */}
              {outputTab === 'alternatives' && result.alternativeVersions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-purple-500" />
                      Alternative Versions
                    </CardTitle>
                    <CardDescription>Different approaches to try</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.alternativeVersions.map((alt, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Badge className="mb-2">Version {idx + 1}</Badge>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{alt}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(alt, `alt-${idx}`)}
                          >
                            {copied[`alt-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Follow-Up & Thank You */}
              {outputTab === 'followup' && (
                <div className="space-y-4">
                  {result.followUpMessage && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Follow-Up Message
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(result.followUpMessage, 'followup')}
                          >
                            {copied.followup ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription>Send this if no response after 3-5 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                          {result.followUpMessage}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {result.thankYouTemplate && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-pink-500" />
                            Thank You Template
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(result.thankYouTemplate, 'thankyou')}
                          >
                            {copied.thankyou ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription>Send after they respond or help you</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200">
                          {result.thankYouTemplate}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Tips */}
              {outputTab === 'tips' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {result.tips && result.tips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <ThumbsUp className="h-5 w-5" />
                          Do's
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {result.doNots && result.doNots.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                          Don'ts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.doNots.map((dont, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{dont}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setResult(null); setActiveTab('setup') }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Start Over
                </Button>
                <Button 
                  onClick={generateMessage}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Regenerate
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Best Practices Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Lightbulb className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Networking Message Best Practices</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>Research First:</strong> Know their role, achievements, and interests before reaching out</li>
                <li>• <strong>Give Before Ask:</strong> Offer value (article, insight, introduction) before requesting anything</li>
                <li>• <strong>Keep it Brief:</strong> 2-3 short paragraphs max - respect their time</li>
                <li>• <strong>Small Ask:</strong> Start with a 15-min call or quick question, not a job request</li>
                <li>• <strong>Follow Up:</strong> Send a polite nudge after 3-5 days if no response</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
