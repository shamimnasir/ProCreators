'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Mail, Copy, Sparkles, Loader2, Wand2, RefreshCw,
  Check, ArrowLeft, Zap, Users, TrendingUp, BarChart3,
  Lightbulb, Target, Send, Clock, Calendar, Layers,
  MousePointer, Eye, CheckCircle2, ChevronRight, Download,
  FileText, Heart, Bell, Gift, Megaphone, UserPlus, ShoppingCart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import Link from 'next/link'

// Campaign Types
const CAMPAIGN_TYPES = [
  { id: 'welcome', name: 'Welcome Series', icon: UserPlus, description: 'Onboard new subscribers', color: 'green', emails: 3, customCount: false },
  { id: 'newsletter', name: 'Newsletter Sequence', icon: FileText, description: 'Regular updates & tips', color: 'blue', emails: 1, customCount: true },
  { id: 'promotional', name: 'Promotional', icon: Gift, description: 'Sales & special offers', color: 'red', emails: 3, customCount: false },
  { id: 'launch', name: 'Product Launch', icon: Megaphone, description: 'New product announcements', color: 'purple', emails: 4, customCount: false },
  { id: 'nurture', name: 'Lead Nurture', icon: Heart, description: 'Guide prospects to purchase', color: 'pink', emails: 5, customCount: true },
  { id: 'reengagement', name: 'Re-engagement', icon: RefreshCw, description: 'Win back inactive users', color: 'orange', emails: 3, customCount: false },
  { id: 'abandoned', name: 'Abandoned Cart', icon: ShoppingCart, description: 'Recover lost sales', color: 'yellow', emails: 3, customCount: false },
  { id: 'event', name: 'Event/Webinar', icon: Calendar, description: 'Promote & follow up', color: 'cyan', emails: 4, customCount: false }
]

// Industries
const INDUSTRIES = [
  { id: 'ecommerce', name: '🛒 E-commerce / Retail' },
  { id: 'saas', name: '💻 SaaS / Software' },
  { id: 'coaching', name: '🎯 Coaching / Consulting' },
  { id: 'agency', name: '🏢 Agency / Services' },
  { id: 'education', name: '📚 Education / Courses' },
  { id: 'health', name: '🏥 Health / Wellness' },
  { id: 'finance', name: '💰 Finance / Fintech' },
  { id: 'nonprofit', name: '❤️ Non-profit / Charity' },
  { id: 'realestate', name: '🏠 Real Estate' },
  { id: 'b2b', name: '🤝 B2B / Enterprise' }
]

// Tones
const TONES = [
  { id: 'professional', name: 'Professional' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'casual', name: 'Casual' },
  { id: 'urgent', name: 'Urgent' },
  { id: 'inspirational', name: 'Inspirational' },
  { id: 'educational', name: 'Educational' }
]

export default function EmailCampaignPage() {
  const [activeTab, setActiveTab] = useState('setup')
  const [mode, setMode] = useState('easy')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Form State
  const [campaignType, setCampaignType] = useState('newsletter')
  const [campaignGoal, setCampaignGoal] = useState('')
  const [industry, setIndustry] = useState('ecommerce')
  
  // Brand
  const [brandName, setBrandName] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  
  // Audience
  const [targetAudience, setTargetAudience] = useState('')
  const [audiencePainPoints, setAudiencePainPoints] = useState('')
  const [audienceDesires, setAudienceDesires] = useState('')
  
  // Content
  const [mainOffer, setMainOffer] = useState('')
  const [keyBenefits, setKeyBenefits] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')
  const [callToAction, setCallToAction] = useState('')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [deadline, setDeadline] = useState('')
  const [socialProof, setSocialProof] = useState('')
  
  // Settings
  const [tone, setTone] = useState('friendly')
  const [emailCount, setEmailCount] = useState('3')
  const [includeSubjectVariants, setIncludeSubjectVariants] = useState(true)
  const [includePreviewText, setIncludePreviewText] = useState(true)

  // Results
  const [result, setResult] = useState(null)
  const [activeEmail, setActiveEmail] = useState(0)

  const handleGenerate = async () => {
    if (!brandName) {
      toast({ title: 'Missing Information', description: 'Please enter your brand/company name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/email-campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignType,
          campaignGoal,
          industry,
          brandName,
          brandDescription,
          brandVoice,
          targetAudience,
          audiencePainPoints,
          audienceDesires,
          mainOffer,
          keyBenefits,
          uniqueValue,
          callToAction,
          productName,
          price,
          deadline,
          socialProof,
          tone,
          emailCount,
          includeSubjectVariants,
          includePreviewText
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('results')
        setActiveEmail(0)
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'email-campaign',
            category: 'text',
            title: `Email Campaign: ${data.data.campaignName?.substring(0, 40) || brandName}`,
            description: `${CAMPAIGN_TYPES.find(t => t.id === campaignType)?.name} - ${data.data.totalEmails} emails`,
            content: JSON.stringify(data.data),
            metadata: {
              campaignType,
              brandName,
              industry,
              emailCount: data.data.totalEmails,
              contentType: 'email-campaign'
            }
          })
          if (saveResult.success) {
            toast({ title: '📧 Email Campaign Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '📧 Email Campaign Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '📧 Email Campaign Generated!' })
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

  const copyFullEmail = (emailIndex) => {
    if (result?.data?.emails?.[emailIndex]) {
      const email = result.data.emails[emailIndex]
      const fullEmail = `Subject: ${email.subjectLine}\nPreview: ${email.previewText}\n\n${email.emailBody}`
      handleCopy(fullEmail, `fullEmail-${emailIndex}`)
    }
  }

  const downloadAllEmails = () => {
    if (!result?.data?.emails) return
    
    let text = `# ${result.data.campaignName}\n\n`
    text += `Campaign Overview: ${result.data.campaignOverview}\n`
    text += `Recommended Schedule: ${result.data.recommendedSchedule}\n\n`
    text += `---\n\n`
    
    result.data.emails.forEach((email, idx) => {
      text += `## Email ${idx + 1}: ${email.emailName}\n`
      text += `Send Timing: ${email.sendTiming}\n`
      text += `Goal: ${email.goal}\n\n`
      text += `**Subject Line:** ${email.subjectLine}\n`
      if (email.subjectVariants?.length) {
        text += `**Subject Variants:**\n${email.subjectVariants.map(s => `- ${s}`).join('\n')}\n`
      }
      text += `**Preview Text:** ${email.previewText}\n\n`
      text += `**Email Body:**\n${email.emailBody}\n\n`
      text += `**CTA Button:** ${email.ctaButton}\n`
      text += `---\n\n`
    })
    
    if (result.data.campaignTips?.length) {
      text += `## Campaign Tips\n${result.data.campaignTips.map(t => `- ${t}`).join('\n')}\n`
    }
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-campaign-${brandName.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Downloaded!', description: 'Email campaign saved as .txt file' })
  }

  const selectedCampaign = CAMPAIGN_TYPES.find(c => c.id === campaignType)

  // AutoSave helper functions
  const getCurrentData = useCallback(() => ({
    title: brandName ? `Campaign: ${brandName.substring(0, 50)}` : 'Untitled Campaign',
    campaignType,
    campaignGoal,
    industry,
    brandName,
    brandDescription,
    brandVoice,
    targetAudience,
    audiencePainPoints,
    audienceDesires,
    mainOffer,
    keyBenefits,
    uniqueValue,
    callToAction,
    productName,
    price,
    deadline,
    socialProof,
    tone,
    emailCount,
    result
  }), [campaignType, campaignGoal, industry, brandName, brandDescription, brandVoice, targetAudience, audiencePainPoints, audienceDesires, mainOffer, keyBenefits, uniqueValue, callToAction, productName, price, deadline, socialProof, tone, emailCount, result])

  const loadDraftData = useCallback((data) => {
    if (data.campaignType) setCampaignType(data.campaignType)
    if (data.campaignGoal) setCampaignGoal(data.campaignGoal)
    if (data.industry) setIndustry(data.industry)
    if (data.brandName) setBrandName(data.brandName)
    if (data.brandDescription) setBrandDescription(data.brandDescription)
    if (data.brandVoice) setBrandVoice(data.brandVoice)
    if (data.targetAudience) setTargetAudience(data.targetAudience)
    if (data.audiencePainPoints) setAudiencePainPoints(data.audiencePainPoints)
    if (data.audienceDesires) setAudienceDesires(data.audienceDesires)
    if (data.mainOffer) setMainOffer(data.mainOffer)
    if (data.keyBenefits) setKeyBenefits(data.keyBenefits)
    if (data.uniqueValue) setUniqueValue(data.uniqueValue)
    if (data.callToAction) setCallToAction(data.callToAction)
    if (data.productName) setProductName(data.productName)
    if (data.price) setPrice(data.price)
    if (data.deadline) setDeadline(data.deadline)
    if (data.socialProof) setSocialProof(data.socialProof)
    if (data.tone) setTone(data.tone)
    if (data.emailCount) setEmailCount(data.emailCount)
    if (data.result) {
      setResult(data.result)
      setActiveTab('results')
    }
  }, [])

  const handleStartNew = useCallback(() => {
    setCampaignType('newsletter')
    setCampaignGoal('')
    setIndustry('ecommerce')
    setBrandName('')
    setBrandDescription('')
    setBrandVoice('')
    setTargetAudience('')
    setAudiencePainPoints('')
    setAudienceDesires('')
    setMainOffer('')
    setKeyBenefits('')
    setUniqueValue('')
    setCallToAction('')
    setProductName('')
    setPrice('')
    setDeadline('')
    setSocialProof('')
    setTone('friendly')
    setEmailCount('3')
    setResult(null)
    setActiveTab('setup')
    setMode('easy')
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/business-ai">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-7 w-7 text-purple-500" />
              Email Campaign & Newsletter Writer
            </h1>
            <Badge className="bg-purple-500 text-white">AI-Powered</Badge>
          </div>
          <p className="text-muted-foreground">Complete email sequences that convert subscribers into customers</p>
        </div>
      </div>

      {/* Stats Banner */}
      <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white border-0 overflow-hidden">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">42%</div>
              <div className="text-xs text-purple-100">Avg Open Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$36</div>
              <div className="text-xs text-purple-100">ROI per $1 Spent</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.2B</div>
              <div className="text-xs text-purple-100">Email Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">#1</div>
              <div className="text-xs text-purple-100">Marketing Channel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="setup">📝 Setup</TabsTrigger>
              <TabsTrigger value="results" disabled={!result}>📧 Emails</TabsTrigger>
              <TabsTrigger value="tips" disabled={!result}>💡 Strategy</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button 
                  variant={mode === 'easy' ? 'default' : 'outline'}
                  onClick={() => setMode('easy')}
                  className={mode === 'easy' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  🌟 Easy Mode
                </Button>
                <Button 
                  variant={mode === 'pro' ? 'default' : 'outline'}
                  onClick={() => setMode('pro')}
                  className={mode === 'pro' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  🚀 Pro Mode
                </Button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Campaign Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="h-5 w-5 text-purple-500" />
                        Campaign Type
                      </CardTitle>
                      <CardDescription>What kind of email campaign?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {CAMPAIGN_TYPES.map((campaign) => {
                          const Icon = campaign.icon
                          return (
                            <button
                              key={campaign.id}
                              onClick={() => {
                                setCampaignType(campaign.id)
                                if (!campaign.customCount) {
                                  setEmailCount(String(campaign.emails))
                                }
                              }}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                campaignType === campaign.id
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                  : 'border-muted hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="text-xs font-medium">{campaign.name}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {campaign.customCount ? 'Custom count' : `${campaign.emails} emails`}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Email Count Selector - shown for newsletter type */}
                      {selectedCampaign?.customCount && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                          <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">
                            How many emails in your {selectedCampaign.name.toLowerCase()}?
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select value={emailCount} onValueChange={setEmailCount}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <SelectItem key={num} value={String(num)}>
                                    {num} email{num > 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">
                              {campaignType === 'newsletter' ? 'newsletters in sequence' : 'emails in sequence'}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            {campaignType === 'newsletter' 
                              ? 'Generate a series of connected newsletters (weekly tips, monthly updates, etc.)'
                              : 'Generate a sequence of nurture emails to guide prospects'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Brand Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Brand Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Brand/Company Name *</Label>
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Acme Inc, The Wellness Co"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">What do you do? (Brief description)</Label>
                        <Textarea
                          value={brandDescription}
                          onChange={(e) => setBrandDescription(e.target.value)}
                          placeholder="e.g., We help busy professionals lose weight through personalized meal plans"
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Industry</Label>
                          <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((ind) => (
                                <SelectItem key={ind.id} value={ind.id}>
                                  {ind.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Tone</Label>
                          <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TONES.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {mode === 'pro' && (
                        <div>
                          <Label className="text-xs">Brand Voice (optional)</Label>
                          <Input
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            placeholder="e.g., Professional yet approachable, uses humor"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Campaign Goal */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Campaign Goal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">What do you want to achieve?</Label>
                        <Textarea
                          value={campaignGoal}
                          onChange={(e) => setCampaignGoal(e.target.value)}
                          placeholder="e.g., Announce our Black Friday sale and drive 50% more purchases this week"
                          className="min-h-[60px]"
                        />
                      </div>
                      {mode === 'pro' && (
                        <>
                          <div>
                            <Label className="text-xs">Main Offer/Content</Label>
                            <Textarea
                              value={mainOffer}
                              onChange={(e) => setMainOffer(e.target.value)}
                              placeholder="e.g., 40% off all courses, Free shipping on orders $50+"
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Product/Service Name</Label>
                              <Input
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., Growth Accelerator Course"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price</Label>
                              <Input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g., $97, $297/month"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Target Audience */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        Target Audience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Who is this for?</Label>
                        <Textarea
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g., Female entrepreneurs aged 25-45 who want to grow their online business"
                          className="min-h-[60px]"
                        />
                      </div>
                      {mode === 'pro' && (
                        <>
                          <div>
                            <Label className="text-xs">Pain Points (What keeps them up at night?)</Label>
                            <Textarea
                              value={audiencePainPoints}
                              onChange={(e) => setAudiencePainPoints(e.target.value)}
                              placeholder="e.g., Not enough time, too many tools, overwhelmed with marketing"
                              className="min-h-[60px]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Desires (What do they want?)</Label>
                            <Textarea
                              value={audienceDesires}
                              onChange={(e) => setAudienceDesires(e.target.value)}
                              placeholder="e.g., More free time, consistent revenue, automated systems"
                              className="min-h-[60px]"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pro Mode Options */}
                  {mode === 'pro' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          Additional Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Key Benefits</Label>
                          <Textarea
                            value={keyBenefits}
                            onChange={(e) => setKeyBenefits(e.target.value)}
                            placeholder="e.g., Save 10 hours/week, increase revenue by 30%, get results in 7 days"
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Call to Action</Label>
                          <Input
                            value={callToAction}
                            onChange={(e) => setCallToAction(e.target.value)}
                            placeholder="e.g., Shop Now, Start Free Trial, Register Today"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Deadline (if any)</Label>
                            <Input
                              value={deadline}
                              onChange={(e) => setDeadline(e.target.value)}
                              placeholder="e.g., Friday at midnight"
                            />
                          </div>
                          <div>
                            <Label className="text-xs"># of Emails</Label>
                            <Select value={emailCount} onValueChange={setEmailCount}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                  <SelectItem key={num} value={String(num)}>
                                    {num} email{num > 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Social Proof (optional)</Label>
                          <Textarea
                            value={socialProof}
                            onChange={(e) => setSocialProof(e.target.value)}
                            placeholder="e.g., 10,000+ students, 4.9 star rating, Featured in Forbes"
                            className="min-h-[60px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Include subject line variants</Label>
                        <Switch
                          checked={includeSubjectVariants}
                          onCheckedChange={setIncludeSubjectVariants}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Include preview text</Label>
                        <Switch
                          checked={includePreviewText}
                          onCheckedChange={setIncludePreviewText}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200">
                    <CardContent className="py-4">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Email Marketing Tips
                      </h4>
                      <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                        <li>• Subject lines under 50 chars get 12% higher opens</li>
                        <li>• Personalized emails get 6x more transactions</li>
                        <li>• Tuesday 10am is often the best send time</li>
                        <li>• One clear CTA per email for best results</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Generate Button */}
                  <Button 
                    onClick={handleGenerate} 
                    disabled={generating || !brandName}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    {generating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Your Campaign...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Email Campaign</>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Results Tab - Emails */}
            <TabsContent value="results" className="space-y-6">
              {result && result.data && (
                <>
                  {/* Campaign Overview */}
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-purple-500" />
                            {result.data.campaignName}
                          </CardTitle>
                          <CardDescription className="mt-1">{result.data.campaignOverview}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{result.data.totalEmails} emails</Badge>
                          <Button variant="outline" size="sm" onClick={downloadAllEmails}>
                            <Download className="h-4 w-4 mr-1" /> Download All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Recommended Schedule: {result.data.recommendedSchedule}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Navigation */}
                  <div className="flex gap-2 flex-wrap">
                    {result.data.emails?.map((email, idx) => (
                      <Button
                        key={idx}
                        variant={activeEmail === idx ? 'default' : 'outline'}
                        onClick={() => setActiveEmail(idx)}
                        className={activeEmail === idx ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        size="sm"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email {idx + 1}
                      </Button>
                    ))}
                  </div>

                  {/* Active Email */}
                  {result.data.emails?.[activeEmail] && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{result.data.emails[activeEmail].emailName}</CardTitle>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {result.data.emails[activeEmail].sendTiming}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" /> {result.data.emails[activeEmail].goal}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => copyFullEmail(activeEmail)}
                            >
                              {copied[`fullEmail-${activeEmail}`] ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                              Copy Email
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Subject Line */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Target className="h-4 w-4 text-purple-500" />
                              Subject Line
                            </CardTitle>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCopy(result.data.emails[activeEmail].subjectLine, `subject-${activeEmail}`)}
                            >
                              {copied[`subject-${activeEmail}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 font-medium">
                            {result.data.emails[activeEmail].subjectLine}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {result.data.emails[activeEmail].subjectLine?.length || 0} characters
                            {result.data.emails[activeEmail].subjectLine?.length <= 50 && 
                              <Badge variant="outline" className="ml-2 text-[10px]">✓ Good length</Badge>
                            }
                          </p>
                          
                          {/* Subject Variants */}
                          {result.data.emails[activeEmail].subjectVariants?.length > 0 && (
                            <div className="mt-3">
                              <Label className="text-xs text-muted-foreground">A/B Test Variants:</Label>
                              <div className="space-y-2 mt-1">
                                {result.data.emails[activeEmail].subjectVariants.map((variant, vIdx) => (
                                  <div key={vIdx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                    <span>{variant}</span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleCopy(variant, `variant-${activeEmail}-${vIdx}`)}
                                    >
                                      {copied[`variant-${activeEmail}-${vIdx}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Preview Text */}
                      {result.data.emails[activeEmail].previewText && (
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-500" />
                                Preview Text
                              </CardTitle>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleCopy(result.data.emails[activeEmail].previewText, `preview-${activeEmail}`)}
                              >
                                {copied[`preview-${activeEmail}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 text-sm">
                              {result.data.emails[activeEmail].previewText}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Email Body */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-green-500" />
                              Email Body
                            </CardTitle>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCopy(result.data.emails[activeEmail].emailBody, `body-${activeEmail}`)}
                            >
                              {copied[`body-${activeEmail}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[400px]">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border">
                              {result.data.emails[activeEmail].emailBody}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      {/* CTA */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-red-500" />
                            Call to Action
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                              {result.data.emails[activeEmail].ctaButton}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              → {result.data.emails[activeEmail].ctaUrl}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tips for this email */}
                      {result.data.emails[activeEmail].tipsForThisEmail?.length > 0 && (
                        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                          <CardContent className="py-4">
                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" /> Tips for This Email
                            </h4>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                              {result.data.emails[activeEmail].tipsForThisEmail.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{tip}</span>
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
                      onClick={handleGenerate}
                      disabled={generating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="tips" className="space-y-6">
              {result && result.data && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Campaign Tips */}
                  {result.data.campaignTips?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-600">
                          <Lightbulb className="h-5 w-5" />
                          Campaign Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.data.campaignTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metrics */}
                  {result.data.metrics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                          <BarChart3 className="h-5 w-5" />
                          Expected Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{result.data.metrics.expectedOpenRate}</div>
                            <div className="text-xs text-muted-foreground">Expected Open Rate</div>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{result.data.metrics.expectedClickRate}</div>
                            <div className="text-xs text-muted-foreground">Expected Click Rate</div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Key Metrics to Track:</Label>
                          <div className="flex gap-2 flex-wrap mt-1">
                            {result.data.metrics.keyMetricsToTrack?.map((metric, idx) => (
                              <Badge key={idx} variant="outline">{metric}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Segmentation Suggestions */}
                  {result.data.segmentationSuggestions?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                          <Users className="h-5 w-5" />
                          Segmentation Ideas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.data.segmentationSuggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* A/B Test Ideas */}
                  {result.data.abTestIdeas?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-pink-600">
                          <Zap className="h-5 w-5" />
                          A/B Test Ideas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.data.abTestIdeas.map((idea, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                              <span>{idea}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Drafts Manager */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <AutoSaveDraftsManager
              toolType="email-campaigns"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[brandName, brandDescription, campaignType, campaignGoal, industry, tone]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={1}
            />
          </div>
        </div>
      </div>

      {/* Best Practices Footer */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Mail className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Email Campaign Best Practices 2026</h4>
              <div className="grid md:grid-cols-4 gap-4 text-xs text-purple-700 dark:text-purple-300">
                <div>
                  <strong>Subject Lines</strong>
                  <p>Under 50 chars, curiosity or benefit</p>
                </div>
                <div>
                  <strong>Mobile First</strong>
                  <p>50%+ read on mobile devices</p>
                </div>
                <div>
                  <strong>One CTA</strong>
                  <p>Single clear action per email</p>
                </div>
                <div>
                  <strong>Test & Learn</strong>
                  <p>A/B test subjects and send times</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
