'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Mail, Sparkles, Loader2, Target, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  Check, Send, Clock, AlertCircle, FileText,
  ArrowLeft, Zap, User, Building, Calendar,
  ThumbsUp, Bell, Heart, Users, XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

// Email Types
const EMAIL_TYPES = [
  { id: 'request', name: 'Request/Ask', icon: Send, description: 'Ask for meeting, info, approval', color: 'blue' },
  { id: 'update', name: 'Status Update', icon: FileText, description: 'Share progress or information', color: 'green' },
  { id: 'followup', name: 'Follow-Up', icon: RefreshCw, description: 'After meeting or conversation', color: 'purple' },
  { id: 'introduction', name: 'Introduction', icon: Users, description: 'Introduce yourself or others', color: 'cyan' },
  { id: 'thankyou', name: 'Thank You', icon: Heart, description: 'Express gratitude', color: 'pink' },
  { id: 'announcement', name: 'Announcement', icon: Bell, description: 'Share news or updates', color: 'orange' },
  { id: 'apology', name: 'Apology', icon: AlertCircle, description: 'Address a mistake or issue', color: 'red' },
  { id: 'reminder', name: 'Reminder', icon: Clock, description: 'Nudge about deadline/task', color: 'yellow' },
  { id: 'feedback', name: 'Feedback Request', icon: MessageSquare, description: 'Ask for input or review', color: 'indigo' },
  { id: 'decline', name: 'Decline/Reject', icon: XCircle, description: 'Politely say no', color: 'gray' }
]

// Tone Options
const TONES = [
  { id: 'formal', name: 'Formal', desc: 'Traditional business' },
  { id: 'professional', name: 'Professional', desc: 'Standard workplace' },
  { id: 'friendly', name: 'Friendly Professional', desc: 'Warm but appropriate' },
  { id: 'direct', name: 'Direct', desc: 'Straightforward' },
  { id: 'diplomatic', name: 'Diplomatic', desc: 'Careful and tactful' }
]

// Urgency Levels
const URGENCY_LEVELS = [
  { id: 'low', name: 'Low', desc: 'No rush, FYI', icon: '🟢' },
  { id: 'normal', name: 'Normal', desc: 'Standard timeline', icon: '🔵' },
  { id: 'high', name: 'High', desc: 'Needs attention soon', icon: '🟠' },
  { id: 'urgent', name: 'Urgent', desc: 'Immediate action', icon: '🔴' }
]

export default function ProfessionalEmailPage() {
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('setup')
  const [copied, setCopied] = useState({})
  const { toast } = useToast()

  // Form state
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState('')
  const [emailType, setEmailType] = useState('request')
  const [subject, setSubject] = useState('')
  const [mainMessage, setMainMessage] = useState('')
  const [context, setContext] = useState('')
  const [callToAction, setCallToAction] = useState('')
  const [deadline, setDeadline] = useState('')
  const [tone, setTone] = useState('professional')
  const [urgency, setUrgency] = useState('normal')
  const [senderName, setSenderName] = useState('')
  const [senderTitle, setSenderTitle] = useState('')
  const [senderCompany, setSenderCompany] = useState('')
  const [includeSignature, setIncludeSignature] = useState(true)
  
  // Results
  const [result, setResult] = useState(null)
  const [outputTab, setOutputTab] = useState('main')

  const generateEmail = async () => {
    if (!mainMessage.trim()) {
      toast({ title: 'Missing Information', description: 'Please describe the main purpose of your email', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/professional-email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientRole,
          emailType,
          subject,
          mainMessage,
          context,
          callToAction,
          deadline,
          tone,
          urgency,
          senderName,
          senderTitle,
          senderCompany,
          includeSignature
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveTab('results')
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'professional-email',
            category: 'text',
            title: `Email: ${data.data.subjectLine?.substring(0, 40) || mainMessage.substring(0, 40)}...`,
            description: `${EMAIL_TYPES.find(t => t.id === emailType)?.name || emailType} email to ${recipientName || 'recipient'}`,
            content: JSON.stringify(data.data),
            metadata: {
              emailType,
              recipientName,
              tone,
              urgency,
              contentType: 'professional-email'
            }
          })
          if (saveResult.success) {
            toast({ title: '📧 Email Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '📧 Email Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '📧 Email Generated!' })
        }
      } else {
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

  const copyFullEmail = () => {
    if (result) {
      const fullEmail = `Subject: ${result.subjectLine}\n\n${result.email}`
      handleCopy(fullEmail, 'fullEmail')
    }
  }

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
              <Mail className="h-7 w-7 text-orange-500" />
              Professional Email Writer
            </h1>
            <Badge className="bg-orange-500 text-white">Daily Use</Badge>
          </div>
          <p className="text-muted-foreground">Clear, professional emails in seconds</p>
        </div>
      </div>

      {/* Best Practices Banner */}
      <Card className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">Clear</div>
              <div className="text-xs text-orange-100">Subject Line</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Concise</div>
              <div className="text-xs text-orange-100">Short Paragraphs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Action</div>
              <div className="text-xs text-orange-100">Clear CTA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Pro</div>
              <div className="text-xs text-orange-100">Tone & Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="setup">📝 Compose</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>📧 Email</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Email Type */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-5 w-5 text-orange-500" />
                    Email Type
                  </CardTitle>
                  <CardDescription>What kind of email are you writing?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {EMAIL_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setEmailType(type.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            emailType === type.id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                              : 'border-muted hover:border-orange-300'
                          }`}
                        >
                          <Icon className="h-4 w-4 mx-auto mb-1" />
                          <div className="text-[10px] font-medium">{type.name}</div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recipient */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Recipient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g., John Smith"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Role/Title</Label>
                      <Input
                        value={recipientRole}
                        onChange={(e) => setRecipientRole(e.target.value)}
                        placeholder="e.g., Project Manager"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Email Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Subject (optional - will be generated)</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Meeting Request: Q3 Project Review"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Main Message/Purpose *</Label>
                    <Textarea
                      value={mainMessage}
                      onChange={(e) => setMainMessage(e.target.value)}
                      placeholder="e.g., I need to schedule a meeting to discuss the Q3 project timeline and resource allocation..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Context/Background (optional)</Label>
                    <Textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g., Following up on our conversation last week about the budget..."
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Call to Action</Label>
                      <Input
                        value={callToAction}
                        onChange={(e) => setCallToAction(e.target.value)}
                        placeholder="e.g., Please confirm availability"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Deadline (if any)</Label>
                      <Input
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        placeholder="e.g., by Friday EOD"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Tone & Urgency */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Tone & Urgency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Tone</Label>
                    <div className="grid grid-cols-3 gap-2">
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
                  
                  <div>
                    <Label className="text-xs mb-2 block">Urgency Level</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {URGENCY_LEVELS.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setUrgency(u.id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            urgency === u.id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                              : 'border-muted hover:border-orange-300'
                          }`}
                        >
                          <div className="text-lg">{u.icon}</div>
                          <div className="text-[10px] font-medium">{u.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sender Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-500" />
                    Your Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Include signature</Label>
                    <Switch
                      checked={includeSignature}
                      onCheckedChange={setIncludeSignature}
                    />
                  </div>
                  
                  {includeSignature && (
                    <>
                      <div>
                        <Label className="text-xs">Your Name</Label>
                        <Input
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g., Jane Doe"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={senderTitle}
                            onChange={(e) => setSenderTitle(e.target.value)}
                            placeholder="e.g., Marketing Manager"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Company</Label>
                          <Input
                            value={senderCompany}
                            onChange={(e) => setSenderCompany(e.target.value)}
                            placeholder="e.g., Acme Inc."
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200">
                <CardContent className="py-4">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Quick Tips
                  </h4>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Keep subject lines under 50 characters</li>
                    <li>• State your purpose in the first sentence</li>
                    <li>• Use bullet points for multiple items</li>
                    <li>• End with a clear call to action</li>
                    <li>• Tuesday-Thursday mornings get best responses</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                onClick={generateEmail} 
                disabled={generating || !mainMessage.trim()}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                size="lg"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Writing Email...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Professional Email</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              {/* Output Type Tabs */}
              <div className="flex gap-2 flex-wrap">
                {['main', 'alternatives', 'tips'].map((tab) => (
                  <Button
                    key={tab}
                    variant={outputTab === tab ? 'default' : 'outline'}
                    onClick={() => setOutputTab(tab)}
                    className={outputTab === tab ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    {tab === 'main' && <Mail className="h-4 w-4 mr-1" />}
                    {tab === 'alternatives' && <RefreshCw className="h-4 w-4 mr-1" />}
                    {tab === 'tips' && <Lightbulb className="h-4 w-4 mr-1" />}
                    {tab === 'main' ? 'Email' : tab === 'alternatives' ? 'Versions' : 'Tips'}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={copyFullEmail}
                  className="ml-auto"
                >
                  {copied.fullEmail ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy Full Email
                </Button>
              </div>

              {/* Main Email */}
              {outputTab === 'main' && (
                <div className="space-y-4">
                  {/* Subject Line */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-5 w-5 text-orange-500" />
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
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 font-medium">
                        {result.subjectLine}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {result.subjectLine?.length || 0} characters
                        {result.subjectLine?.length <= 50 && <Badge variant="outline" className="ml-2 text-[10px]">✓ Good length</Badge>}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Email Body */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-orange-500" />
                          Email Body
                        </CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCopy(result.email, 'email')}
                        >
                          {copied.email ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <CardDescription>Ready to copy and send</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border">
                          {result.email}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Alternative Versions */}
              {outputTab === 'alternatives' && (
                <div className="space-y-4">
                  {/* Alternative Subjects */}
                  {result.alternativeSubjects && result.alternativeSubjects.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          Alternative Subject Lines
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {result.alternativeSubjects.map((subj, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                            <span className="text-sm">{subj}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCopy(subj, `subj-${idx}`)}
                            >
                              {copied[`subj-${idx}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Shorter Version */}
                  {result.shorterVersion && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Shorter Version
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(result.shorterVersion, 'shorter')}
                          >
                            {copied.shorter ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription>More concise for quick communication</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200">
                          {result.shorterVersion}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Formal Version */}
                  {result.formalVersion && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building className="h-5 w-5 text-purple-500" />
                            Formal Version
                          </CardTitle>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(result.formalVersion, 'formal')}
                          >
                            {copied.formal ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription>For senior leadership or formal contexts</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
                          {result.formalVersion}
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
                          Tips for This Email
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Clock className="h-5 w-5" />
                        Timing & Follow-Up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.timing && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Best Time to Send</Label>
                          <p className="text-sm mt-1">{result.timing}</p>
                        </div>
                      )}
                      {result.followUpSuggestion && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Follow-Up Strategy</Label>
                          <p className="text-sm mt-1">{result.followUpSuggestion}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setResult(null); setActiveTab('setup') }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Start Over
                </Button>
                <Button 
                  onClick={generateEmail}
                  disabled={generating}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Regenerate
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Email Etiquette Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Mail className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Professional Email Best Practices</h4>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• <strong>Subject Line:</strong> Direct, specific, action-oriented (avoid ALL CAPS)</li>
                <li>• <strong>Structure:</strong> Purpose first, short paragraphs, bullet points for lists</li>
                <li>• <strong>CTA:</strong> Clear call to action with specific deadline if needed</li>
                <li>• <strong>Proofread:</strong> Always check for typos and clarity before sending</li>
                <li>• <strong>Reply Promptly:</strong> Acknowledge important emails within one business day</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
