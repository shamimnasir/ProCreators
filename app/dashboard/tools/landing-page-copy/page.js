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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import {
  FileText,
  Copy,
  Loader2,
  Wand2,
  RefreshCw,
  Check,
  ArrowLeft,
  Play,
  Users,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Info,
  Layers,
  Brain,
  Target,
  MessageSquare,
  HelpCircle,
  Shield,
  Star,
  ChevronRight,
  Layout,
  Eye,
  MousePointer,
  DollarSign,
  Download,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Quote,
  Rocket,
  Heart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import Link from 'next/link'

// Copywriting Frameworks for Landing Pages
const FRAMEWORKS = [
  { 
    id: 'pas', 
    name: 'PAS', 
    full: 'Problem → Agitation → Solution',
    description: 'Identify pain, intensify it, present your product as the answer. Classic direct response.',
    icon: '🔥',
    color: 'red',
    bestFor: 'Pain-point targeting, service businesses, B2B'
  },
  { 
    id: 'hso', 
    name: 'HSO', 
    full: 'Hook → Story → Offer',
    description: 'Counter-intuitive hook, relatable journey, product as the system. Personal brand gold.',
    icon: '📖',
    color: 'purple',
    bestFor: 'Courses, coaching, high-ticket services'
  },
  { 
    id: 'bab', 
    name: 'BAB', 
    full: 'Before → After → Bridge',
    description: 'Paint life before, show the after, your product is the bridge. Transformation focused.',
    icon: '🌉',
    color: 'blue',
    bestFor: 'SaaS, productivity tools, fitness, apps'
  },
  { 
    id: 'quest', 
    name: 'QUEST', 
    full: 'Qualify → Understand → Educate → Stimulate → Transition',
    description: 'For complex products requiring buyer education. Systematic qualification.',
    icon: '🎯',
    color: 'green',
    bestFor: 'Complex B2B, expensive products, enterprise'
  },
  { 
    id: 'spin', 
    name: 'SPIN', 
    full: 'Situation → Problem → Implication → Need-Payoff',
    description: 'Self-diagnosis approach. Reader discovers they need your solution.',
    icon: '🔄',
    color: 'orange',
    bestFor: 'Enterprise SaaS, consulting, B2B'
  },
  { 
    id: 'acfunnel', 
    name: 'AC Funnel', 
    full: 'Counterintuitive Approach',
    description: 'Challenge conventional wisdom, break rules, create intrigue. Stand out from competitors.',
    icon: '⚡',
    color: 'yellow',
    bestFor: 'Info products, ebooks, digital courses'
  }
]

// Industries
const INDUSTRIES = [
  { id: 'saas', name: '💻 SaaS / Software' },
  { id: 'ecommerce', name: '🛒 E-commerce / Retail' },
  { id: 'coaching', name: '🎯 Coaching / Consulting' },
  { id: 'agency', name: '🏢 Agency / Services' },
  { id: 'finance', name: '💰 Finance / Fintech' },
  { id: 'health', name: '🏥 Health / Wellness' },
  { id: 'education', name: '📚 Education / Courses' },
  { id: 'realestate', name: '🏠 Real Estate' },
  { id: 'b2b', name: '🤝 B2B / Enterprise' },
  { id: 'startup', name: '🚀 Startup / Tech' }
]

// Tones
const TONES = [
  { id: 'professional', name: '💼 Professional' },
  { id: 'conversational', name: '💬 Conversational' },
  { id: 'urgent', name: '⚡ Urgent/FOMO' },
  { id: 'empathetic', name: '❤️ Empathetic' },
  { id: 'bold', name: '🔥 Bold/Disruptive' },
  { id: 'luxurious', name: '✨ Premium/Luxury' }
]

export default function LandingPageCopyPage() {
  const [activeTab, setActiveTab] = useState('setup')
  const [mode, setMode] = useState('easy')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Form State
  const [framework, setFramework] = useState('pas')
  const [industry, setIndustry] = useState('saas')
  const [tone, setTone] = useState('conversational')
  
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [painPoints, setPainPoints] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState('')
  const [competitorWeaknesses, setCompetitorWeaknesses] = useState('')
  const [socialProof, setSocialProof] = useState('')
  const [specificResults, setSpecificResults] = useState('')
  const [pricing, setPricing] = useState('')
  const [guarantee, setGuarantee] = useState('')
  const [urgencyElement, setUrgencyElement] = useState('')

  // Results
  const [result, setResult] = useState(null)
  const [activeSection, setActiveSection] = useState('hero')

  const handleGenerate = async () => {
    if (!productName) {
      toast({ title: 'Missing Information', description: 'Please enter your product/service name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/landing-page-copy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productDescription,
          industry,
          targetAudience,
          framework,
          tone,
          painPoints,
          desiredOutcome,
          uniqueSellingPoints,
          competitorWeaknesses,
          socialProof,
          specificResults,
          pricing,
          guarantee,
          urgencyElement,
          generateFullPage: true
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('preview')
        setActiveSection('hero')
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'landing-page-copy',
            category: 'text',
            title: `Landing Page: ${productName.substring(0, 40)}`,
            description: `${data.data.framework} framework - ${industry}`,
            content: JSON.stringify(data.data),
            metadata: {
              framework: data.data.framework,
              industry,
              tone,
              contentType: 'landing-page-copy'
            }
          })
          if (saveResult.success) {
            toast({ title: '🎯 Landing Page Copy Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '🎯 Landing Page Copy Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '🎯 Landing Page Copy Generated!' })
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

  const copySection = (sectionName, content) => {
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : content
    handleCopy(text, sectionName)
  }

  const copyAllCopy = () => {
    if (!result?.data) return
    const fullCopy = generateFullCopyText(result.data)
    handleCopy(fullCopy, 'fullCopy')
  }

  const generateFullCopyText = (data) => {
    let text = `# ${data.heroSection?.headline || 'Landing Page Copy'}\n\n`
    
    // Hero
    if (data.heroSection) {
      text += `## HERO SECTION\n`
      text += `Headline: ${data.heroSection.headline}\n`
      text += `Subheadline: ${data.heroSection.subheadline}\n`
      text += `Bullet Points:\n${data.heroSection.bulletPoints?.map(b => `• ${b}`).join('\n')}\n`
      text += `CTA: ${data.heroSection.primaryCTA}\n`
      text += `CTA Trigger: ${data.heroSection.ctaTrigger}\n\n`
    }
    
    // Problem
    if (data.problemSection) {
      text += `## PROBLEM SECTION\n`
      text += `Title: ${data.problemSection.sectionTitle}\n`
      text += `Problem: ${data.problemSection.problemStatement}\n`
      text += `Agitation: ${data.problemSection.agitation}\n`
      text += `Struggles:\n${data.problemSection.relateableStruggles?.map(s => `• ${s}`).join('\n')}\n`
      text += `Bridge: ${data.problemSection.bridgeToSolution}\n\n`
    }
    
    // Solution
    if (data.solutionSection) {
      text += `## SOLUTION SECTION\n`
      text += `Title: ${data.solutionSection.sectionTitle}\n`
      text += `Intro: ${data.solutionSection.introduction}\n`
      text += `\nHow It Works:\n`
      data.solutionSection.howItWorks?.forEach(step => {
        text += `${step.step}. ${step.title}: ${step.description}\n`
      })
      text += `\nKey Benefits:\n`
      data.solutionSection.keyBenefits?.forEach(benefit => {
        text += `• ${benefit.title}: ${benefit.description}\n`
      })
      text += `\n`
    }
    
    // Social Proof
    if (data.socialProofSection) {
      text += `## SOCIAL PROOF SECTION\n`
      text += `Title: ${data.socialProofSection.sectionTitle}\n`
      text += `Headline: ${data.socialProofSection.headline}\n`
      text += `\nStatistics:\n`
      data.socialProofSection.statistics?.forEach(stat => {
        text += `• ${stat.number} ${stat.label}\n`
      })
      text += `\nTestimonials:\n`
      data.socialProofSection.testimonials?.forEach(test => {
        text += `"${test.quote}" - ${test.author} (${test.result})\n`
      })
      text += `\n`
    }
    
    // FAQ
    if (data.faqSection) {
      text += `## FAQ SECTION\n`
      text += `Title: ${data.faqSection.sectionTitle}\n`
      data.faqSection.faqs?.forEach(faq => {
        text += `\nQ: ${faq.question}\nA: ${faq.answer}\n`
      })
      text += `\n`
    }
    
    // CTA
    if (data.ctaSection) {
      text += `## FINAL CTA SECTION\n`
      text += `Headline: ${data.ctaSection.headline}\n`
      text += `Subheadline: ${data.ctaSection.subheadline}\n`
      text += `Primary CTA: ${data.ctaSection.primaryCTA}\n`
      text += `Secondary CTA: ${data.ctaSection.secondaryCTA}\n`
      text += `Risk Reversal: ${data.ctaSection.riskReversal}\n`
      text += `Urgency: ${data.ctaSection.urgencyElement}\n`
      text += `Triggers: ${data.ctaSection.ctaTriggers?.join(' • ')}\n`
    }
    
    return text
  }

  const downloadAsTxt = () => {
    if (!result?.data) return
    const text = generateFullCopyText(result.data)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `landing-page-copy-${productName.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Downloaded!', description: 'Landing page copy saved as .txt file' })
  }

  const selectedFramework = FRAMEWORKS.find(f => f.id === framework)

  // AutoSave helper functions
  const getCurrentData = useCallback(() => ({
    title: productName ? `Landing Page: ${productName.substring(0, 50)}` : 'Untitled Landing Page',
    productName,
    productDescription,
    industry,
    targetAudience,
    framework,
    tone,
    painPoints,
    desiredOutcome,
    uniqueSellingPoints,
    competitorWeaknesses,
    socialProof,
    specificResults,
    pricing,
    guarantee,
    urgencyElement,
    result
  }), [productName, productDescription, industry, targetAudience, framework, tone, painPoints, desiredOutcome, uniqueSellingPoints, competitorWeaknesses, socialProof, specificResults, pricing, guarantee, urgencyElement, result])

  const loadDraftData = useCallback((data) => {
    if (data.productName) setProductName(data.productName)
    if (data.productDescription) setProductDescription(data.productDescription)
    if (data.industry) setIndustry(data.industry)
    if (data.targetAudience) setTargetAudience(data.targetAudience)
    if (data.framework) setFramework(data.framework)
    if (data.tone) setTone(data.tone)
    if (data.painPoints) setPainPoints(data.painPoints)
    if (data.desiredOutcome) setDesiredOutcome(data.desiredOutcome)
    if (data.uniqueSellingPoints) setUniqueSellingPoints(data.uniqueSellingPoints)
    if (data.competitorWeaknesses) setCompetitorWeaknesses(data.competitorWeaknesses)
    if (data.socialProof) setSocialProof(data.socialProof)
    if (data.specificResults) setSpecificResults(data.specificResults)
    if (data.pricing) setPricing(data.pricing)
    if (data.guarantee) setGuarantee(data.guarantee)
    if (data.urgencyElement) setUrgencyElement(data.urgencyElement)
    if (data.result) {
      setResult(data.result)
      setActiveTab('preview')
    }
  }, [])

  const handleStartNew = useCallback(() => {
    setProductName('')
    setProductDescription('')
    setIndustry('saas')
    setTargetAudience('')
    setFramework('pas')
    setTone('conversational')
    setPainPoints('')
    setDesiredOutcome('')
    setUniqueSellingPoints('')
    setCompetitorWeaknesses('')
    setSocialProof('')
    setSpecificResults('')
    setPricing('')
    setGuarantee('')
    setUrgencyElement('')
    setResult(null)
    setActiveTab('setup')
    setMode('easy')
  }, [])

  return (
    <TooltipProvider>
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
                <FileText className="h-7 w-7 text-blue-500" />
                Landing Page Copy Generator
              </h1>
              <Badge className="bg-blue-500 text-white">2026 Frameworks</Badge>
            </div>
            <p className="text-muted-foreground">High-converting landing page copy using 6 proven frameworks</p>
          </div>
        </div>

        {/* Framework Showcase Banner */}
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 overflow-hidden">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">6 Conversion-Optimized Frameworks</h3>
                <p className="text-sm text-white/80">PAS • HSO • BAB • QUEST • SPIN • AC Funnel</p>
              </div>
              <div className="flex gap-2">
                {FRAMEWORKS.map((f) => (
                  <Tooltip key={f.id}>
                    <TooltipTrigger>
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-lg cursor-help hover:bg-white/30 transition-colors">
                        {f.icon}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{f.name}</p>
                      <p className="text-xs">{f.full}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="setup">📝 Setup</TabsTrigger>
                <TabsTrigger value="results" disabled={!result}>📄 Copy</TabsTrigger>
                <TabsTrigger value="preview" disabled={!result}>👁️ Preview</TabsTrigger>
                <TabsTrigger value="tips" disabled={!result}>💡 Tips</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button 
                variant={mode === 'easy' ? 'default' : 'outline'}
                onClick={() => setMode('easy')}
                className={mode === 'easy' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                🌟 Easy Mode
              </Button>
              <Button 
                variant={mode === 'pro' ? 'default' : 'outline'}
                onClick={() => setMode('pro')}
                className={mode === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                🚀 Pro Mode
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Framework Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Copywriting Framework
                    </CardTitle>
                    <CardDescription>Choose your persuasion structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {FRAMEWORKS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFramework(f.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            framework === f.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-muted hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{f.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {f.name}
                                <Badge variant="outline" className="text-[10px]">{f.full}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{f.description}</p>
                            </div>
                            {framework === f.id && <Check className="h-5 w-5 text-blue-500" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-orange-500" />
                      What Are You Selling?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Product/Service Name *</Label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., FlowState AI, Growth Accelerator Course"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="What does it do? What problem does it solve? What transformation does it provide?"
                        className="min-h-[80px]"
                      />
                    </div>
                    {mode === 'pro' && (
                      <>
                        <div>
                          <Label className="text-xs">Unique Selling Points (USP)</Label>
                          <Textarea
                            value={uniqueSellingPoints}
                            onChange={(e) => setUniqueSellingPoints(e.target.value)}
                            placeholder="What makes you different? Why should they choose you over competitors?"
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Competitor Weaknesses</Label>
                          <Input
                            value={competitorWeaknesses}
                            onChange={(e) => setCompetitorWeaknesses(e.target.value)}
                            placeholder="What do competitors do poorly that you do better?"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Industry & Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-500" />
                      Page Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Tone</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {TONES.map((t) => (
                          <Button
                            key={t.id}
                            variant={tone === t.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTone(t.id)}
                            className={tone === t.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
                          >
                            {t.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Target Audience</Label>
                      <Input
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., E-commerce brands doing $1M+ annually, busy entrepreneurs aged 25-45"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pro Mode: Pain & Transformation */}
                {mode === 'pro' && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-5 w-5 text-red-500" />
                          Pain Points & Transformation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Pain Points (What keeps them up at night?)</Label>
                          <Textarea
                            value={painPoints}
                            onChange={(e) => setPainPoints(e.target.value)}
                            placeholder="e.g., Spending $5k/month on ads with only 1% conversion rate. Drowning in Slack notifications. Missing deadlines."
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Desired Outcome (Heaven State)</Label>
                          <Textarea
                            value={desiredOutcome}
                            onChange={(e) => setDesiredOutcome(e.target.value)}
                            placeholder="e.g., Close 30% more deals. Have a clear inbox. Team knows exactly what to do without meetings."
                            className="min-h-[60px]"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Social Proof & Offer
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Social Proof</Label>
                          <Textarea
                            value={socialProof}
                            onChange={(e) => setSocialProof(e.target.value)}
                            placeholder="e.g., 10,000+ customers, 4.9 star rating, featured in Forbes, helped [Company X] reduce churn by 22%"
                            className="min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Specific Results/Case Studies</Label>
                          <Input
                            value={specificResults}
                            onChange={(e) => setSpecificResults(e.target.value)}
                            placeholder="e.g., Helped Brand X increase revenue by 40% in 90 days"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Pricing</Label>
                            <Input
                              value={pricing}
                              onChange={(e) => setPricing(e.target.value)}
                              placeholder="e.g., $97/month, $497 one-time"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Guarantee</Label>
                            <Input
                              value={guarantee}
                              onChange={(e) => setGuarantee(e.target.value)}
                              placeholder="e.g., 30-day money-back"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Urgency Element (optional)</Label>
                          <Input
                            value={urgencyElement}
                            onChange={(e) => setUrgencyElement(e.target.value)}
                            placeholder="e.g., Beta pricing ends in 48 hours, Only 10 spots left"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Generate Button */}
                <div className="flex items-center gap-3">

                  <CreditCostBadge toolId="landing-page-copy" />

                  <Button 
                  onClick={handleGenerate} 
                  disabled={generating || !productName}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Landing Page Copy...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate Complete Landing Page Copy</>  
                  )}
                </Button>

                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab - Copy Sections */}
          <TabsContent value="results" className="space-y-6">
            {result && result.data && (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      📄 Your Landing Page Copy
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Framework: {result.data.framework} • Industry: {result.data.industry}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyAllCopy}>
                      {copied['fullCopy'] ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy All
                    </Button>
                    <Button variant="outline" onClick={downloadAsTxt}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                    </Button>
                  </div>
                </div>

                {/* Section Navigation */}
                <div className="flex gap-2 flex-wrap">
                  {['hero', 'problem', 'solution', 'socialProof', 'faq', 'comparison', 'cta'].map((section) => (
                    <Button
                      key={section}
                      variant={activeSection === section ? 'default' : 'outline'}
                      onClick={() => setActiveSection(section)}
                      className={activeSection === section ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      size="sm"
                    >
                      {section === 'hero' && '🎯 Hero'}
                      {section === 'problem' && '🔥 Problem'}
                      {section === 'solution' && '✨ Solution'}
                      {section === 'socialProof' && '⭐ Social Proof'}
                      {section === 'faq' && '❓ FAQ'}
                      {section === 'comparison' && '⚔️ Comparison'}
                      {section === 'cta' && '🚀 CTA'}
                    </Button>
                  ))}
                </div>

                {/* Section Content */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Main Content */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {activeSection === 'hero' && <><Target className="h-5 w-5 text-blue-500" /> Hero Section (Above the Fold)</>}
                          {activeSection === 'problem' && <><Play className="h-5 w-5 text-red-500" /> Problem Section</>}
                          {activeSection === 'solution' && <><Lightbulb className="h-5 w-5 text-green-500" /> Solution Section</>}
                          {activeSection === 'socialProof' && <><Star className="h-5 w-5 text-yellow-500" /> Social Proof Section</>}
                          {activeSection === 'faq' && <><HelpCircle className="h-5 w-5 text-purple-500" /> FAQ Section</>}
                          {activeSection === 'comparison' && <><BarChart3 className="h-5 w-5 text-orange-500" /> Us vs Them Comparison</>}
                          {activeSection === 'cta' && <><Rocket className="h-5 w-5 text-pink-500" /> Final CTA Section</>}
                        </CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copySection(activeSection, result.data[`${activeSection}Section`])}
                        >
                          {copied[activeSection] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Hero Section */}
                      {activeSection === 'hero' && result.data.heroSection && (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                            <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">HEADLINE (Most Important)</Label>
                            <p className="text-2xl font-bold mt-1">{result.data.heroSection.headline}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Sub-headline (The How)</Label>
                            <p className="text-lg mt-1">{result.data.heroSection.subheadline}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Quick Wins (Bullet Points)</Label>
                            <ul className="mt-2 space-y-1">
                              {result.data.heroSection.bulletPoints?.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                              <Label className="text-xs font-medium text-green-700 dark:text-green-300">Primary CTA</Label>
                              <p className="font-bold mt-1">{result.data.heroSection.primaryCTA}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <Label className="text-xs text-muted-foreground">CTA Trigger (Under Button)</Label>
                              <p className="text-sm mt-1">{result.data.heroSection.ctaTrigger}</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Visual Suggestion</Label>
                            <p className="text-sm mt-1 italic">{result.data.heroSection.visualSuggestion}</p>
                          </div>
                        </div>
                      )}

                      {/* Problem Section */}
                      {activeSection === 'problem' && result.data.problemSection && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Section Title</Label>
                            <p className="text-xl font-bold mt-1">{result.data.problemSection.sectionTitle}</p>
                          </div>
                          
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200">
                            <Label className="text-xs font-medium text-red-700 dark:text-red-300">PROBLEM STATEMENT</Label>
                            <p className="mt-1">{result.data.problemSection.problemStatement}</p>
                          </div>
                          
                          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                            <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">AGITATION (Cost of Inaction)</Label>
                            <p className="mt-1">{result.data.problemSection.agitation}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Relatable Struggles</Label>
                            <ul className="mt-2 space-y-1">
                              {result.data.problemSection.relateableStruggles?.map((struggle, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                  <span>{struggle}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Label className="text-xs text-muted-foreground">Bridge to Solution</Label>
                            <p className="font-medium mt-1 italic">{result.data.problemSection.bridgeToSolution}</p>
                          </div>
                        </div>
                      )}

                      {/* Solution Section */}
                      {activeSection === 'solution' && result.data.solutionSection && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Section Title</Label>
                            <p className="text-xl font-bold mt-1">{result.data.solutionSection.sectionTitle}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Introduction</Label>
                            <p className="mt-1">{result.data.solutionSection.introduction}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 block">HOW IT WORKS</Label>
                            <div className="space-y-3">
                              {result.data.solutionSection.howItWorks?.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {step.step}
                                  </div>
                                  <div>
                                    <p className="font-medium">{step.title}</p>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 block">KEY BENEFITS</Label>
                            <div className="grid gap-3">
                              {result.data.solutionSection.keyBenefits?.map((benefit, idx) => (
                                <div key={idx} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                                  <p className="font-medium">{benefit.title}</p>
                                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {result.data.solutionSection.differentiators && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Differentiators</Label>
                              <ul className="mt-2 space-y-1">
                                {result.data.solutionSection.differentiators.map((diff, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                                    <span>{diff}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Social Proof Section */}
                      {activeSection === 'socialProof' && result.data.socialProofSection && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Section Title</Label>
                            <p className="text-xl font-bold mt-1">{result.data.socialProofSection.sectionTitle}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Headline</Label>
                            <p className="text-lg mt-1">{result.data.socialProofSection.headline}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-2 block">STATISTICS</Label>
                            <div className="grid grid-cols-3 gap-3">
                              {result.data.socialProofSection.statistics?.map((stat, idx) => (
                                <div key={idx} className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200">
                                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stat.number}</p>
                                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-2 block">TESTIMONIALS</Label>
                            <div className="space-y-3">
                              {result.data.socialProofSection.testimonials?.map((test, idx) => (
                                <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                                  <div className="flex items-start gap-2">
                                    <Quote className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                    <div>
                                      <p className="italic">"{test.quote}"</p>
                                      <p className="font-medium mt-2">— {test.author}</p>
                                      {test.result && (
                                        <Badge className="mt-1 bg-green-500">{test.result}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {result.data.socialProofSection.trustBadges && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Trust Badges Suggestions</Label>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {result.data.socialProofSection.trustBadges.map((badge, idx) => (
                                  <Badge key={idx} variant="outline">{badge}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* FAQ Section */}
                      {activeSection === 'faq' && (
                        <div className="space-y-4">
                          {result.data.faqSection && result.data.faqSection.faqs?.length > 0 ? (
                            <>
                              <div>
                                <Label className="text-xs text-muted-foreground">Section Title</Label>
                                <p className="text-xl font-bold mt-1">{result.data.faqSection.sectionTitle}</p>
                              </div>
                          
                              <div>
                                <Label className="text-xs text-muted-foreground">Headline</Label>
                                <p className="text-lg mt-1">{result.data.faqSection.headline}</p>
                              </div>
                          
                              <Accordion type="single" collapsible className="w-full">
                                {result.data.faqSection.faqs?.map((faq, idx) => (
                                  <AccordionItem key={idx} value={`faq-${idx}`}>
                                    <AccordionTrigger className="text-left font-medium">
                                      {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                      {faq.answer}
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="font-medium">FAQ section not generated</p>
                              <p className="text-sm mt-1">Try clicking "Regenerate" to get FAQ content.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comparison Section */}
                      {activeSection === 'comparison' && (
                        <div className="space-y-4">
                          {result.data.comparisonSection && result.data.comparisonSection.categories?.length > 0 ? (
                            <>
                              <div>
                                <Label className="text-xs text-muted-foreground">Section Title</Label>
                                <p className="text-xl font-bold mt-1">{result.data.comparisonSection.sectionTitle}</p>
                              </div>
                          
                              <div>
                                <Label className="text-xs text-muted-foreground">Headline</Label>
                                <p className="text-lg mt-1">{result.data.comparisonSection.headline}</p>
                              </div>
                          
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="p-3 text-left bg-muted/50">Feature</th>
                                      <th className="p-3 text-left bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">Us ✓</th>
                                      <th className="p-3 text-left bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">Them ✗</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {result.data.comparisonSection.categories?.map((cat, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="p-3 font-medium">{cat}</td>
                                        <td className="p-3 bg-green-50/50 dark:bg-green-950/20">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            {result.data.comparisonSection.yourProduct?.[idx]}
                                          </div>
                                        </td>
                                        <td className="p-3 bg-red-50/50 dark:bg-red-950/20">
                                          <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            {result.data.comparisonSection.competitors?.[idx]}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                          
                              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <Label className="text-xs text-muted-foreground">Bottom Line</Label>
                                <p className="font-medium mt-1">{result.data.comparisonSection.bottomLine}</p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="font-medium">Comparison section not generated</p>
                              <p className="text-sm mt-1">Try clicking "Regenerate" to get a complete comparison table, or provide more details about your competitors in Pro Mode.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA Section */}
                      {activeSection === 'cta' && result.data.ctaSection && (
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border">
                            <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">FINAL CTA HEADLINE</Label>
                            <p className="text-2xl font-bold mt-1">{result.data.ctaSection.headline}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Sub-headline</Label>
                            <p className="text-lg mt-1">{result.data.ctaSection.subheadline}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                              <Label className="text-xs font-medium text-green-700 dark:text-green-300">Primary CTA</Label>
                              <p className="font-bold mt-1 text-lg">{result.data.ctaSection.primaryCTA}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <Label className="text-xs text-muted-foreground">Secondary CTA</Label>
                              <p className="font-medium mt-1">{result.data.ctaSection.secondaryCTA}</p>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                            <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                              <Shield className="h-4 w-4" /> RISK REVERSAL / GUARANTEE
                            </Label>
                            <p className="font-medium mt-1">{result.data.ctaSection.riskReversal}</p>
                          </div>
                          
                          {result.data.ctaSection.urgencyElement && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                              <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">Urgency Element</Label>
                              <p className="font-medium mt-1">{result.data.ctaSection.urgencyElement}</p>
                            </div>
                          )}
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">CTA Triggers (Under Button)</Label>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {result.data.ctaSection.ctaTriggers?.map((trigger, idx) => (
                                <Badge key={idx} variant="outline">{trigger}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            {result && result.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>See how your copy looks on a landing page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                    {/* Hero Preview */}
                    {result.data.heroSection && (
                      <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{result.data.heroSection.headline}</h1>
                        <p className="text-lg text-muted-foreground mb-6">{result.data.heroSection.subheadline}</p>
                        <div className="flex justify-center gap-6 mb-6 flex-wrap">
                          {result.data.heroSection.bulletPoints?.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                          {result.data.heroSection.primaryCTA}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">{result.data.heroSection.ctaTrigger}</p>
                      </div>
                    )}
                    
                    {/* Problem Preview */}
                    {result.data.problemSection && (
                      <div className="p-8 bg-white dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-4 text-center">{result.data.problemSection.sectionTitle}</h2>
                        <p className="text-lg text-center max-w-2xl mx-auto mb-4">{result.data.problemSection.problemStatement}</p>
                        <p className="text-center text-red-600 dark:text-red-400 italic mb-4">{result.data.problemSection.agitation}</p>
                        {result.data.problemSection.relateableStruggles && (
                          <div className="max-w-xl mx-auto space-y-2">
                            {result.data.problemSection.relateableStruggles.map((struggle, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <XCircle className="h-4 w-4 text-red-400" />
                                <span>{struggle}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Solution Preview */}
                    {result.data.solutionSection && (
                      <div className="p-8 bg-gray-50 dark:bg-gray-900">
                        <h2 className="text-2xl font-bold mb-2 text-center">{result.data.solutionSection.sectionTitle}</h2>
                        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{result.data.solutionSection.introduction}</p>
                        
                        {/* How It Works */}
                        {result.data.solutionSection.howItWorks && (
                          <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {result.data.solutionSection.howItWorks.map((step, idx) => (
                              <div key={idx} className="text-center p-4">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                                  {step.step}
                                </div>
                                <h3 className="font-semibold mb-1">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Key Benefits */}
                        {result.data.solutionSection.keyBenefits && (
                          <div className="grid md:grid-cols-3 gap-4">
                            {result.data.solutionSection.keyBenefits.map((benefit, idx) => (
                              <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <h3 className="font-semibold text-green-600 mb-1">{benefit.title}</h3>
                                <p className="text-sm text-muted-foreground">{benefit.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Social Proof Preview */}
                    {result.data.socialProofSection && (
                      <div className="p-8 bg-white dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-2 text-center">{result.data.socialProofSection.sectionTitle}</h2>
                        <p className="text-center text-muted-foreground mb-6">{result.data.socialProofSection.headline}</p>
                        
                        {/* Statistics */}
                        <div className="flex justify-center gap-8 flex-wrap mb-8">
                          {result.data.socialProofSection.statistics?.map((stat, idx) => (
                            <div key={idx} className="text-center">
                              <p className="text-3xl font-bold text-blue-600">{stat.number}</p>
                              <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Testimonials */}
                        {result.data.socialProofSection.testimonials && (
                          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {result.data.socialProofSection.testimonials.map((test, idx) => (
                              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <p className="italic text-sm mb-2">"{test.quote}"</p>
                                <p className="text-xs font-medium">— {test.author}</p>
                                {test.result && <Badge className="mt-2 bg-green-500 text-xs">{test.result}</Badge>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* FAQ Preview */}
                    {result.data.faqSection && result.data.faqSection.faqs && (
                      <div className="p-8 bg-gray-50 dark:bg-gray-900">
                        <h2 className="text-2xl font-bold mb-2 text-center">{result.data.faqSection.sectionTitle}</h2>
                        <p className="text-center text-muted-foreground mb-6">{result.data.faqSection.headline}</p>
                        <div className="max-w-2xl mx-auto space-y-4">
                          {result.data.faqSection.faqs.slice(0, 4).map((faq, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                              <p className="font-medium mb-1">{faq.question}</p>
                              <p className="text-sm text-muted-foreground">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Comparison Preview */}
                    {result.data.comparisonSection && (
                      <div className="p-8 bg-white dark:bg-gray-800">
                        <h2 className="text-2xl font-bold mb-2 text-center">{result.data.comparisonSection.sectionTitle}</h2>
                        <p className="text-center text-muted-foreground mb-6">{result.data.comparisonSection.headline}</p>
                        <div className="max-w-3xl mx-auto overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr>
                                <th className="p-3 text-left bg-muted/50">Feature</th>
                                <th className="p-3 text-left bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">Us ✓</th>
                                <th className="p-3 text-left bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">Them ✗</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.comparisonSection.categories?.slice(0, 4).map((cat, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="p-3 font-medium">{cat}</td>
                                  <td className="p-3 bg-green-50/50 dark:bg-green-950/20">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <span className="text-xs">{result.data.comparisonSection.yourProduct?.[idx]}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 bg-red-50/50 dark:bg-red-950/20">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      <span className="text-xs">{result.data.comparisonSection.competitors?.[idx]}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-center font-medium mt-4 text-blue-600">{result.data.comparisonSection.bottomLine}</p>
                      </div>
                    )}
                    
                    {/* CTA Preview */}
                    {result.data.ctaSection && (
                      <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{result.data.ctaSection.headline}</h2>
                        <p className="text-white/80 mb-6">{result.data.ctaSection.subheadline}</p>
                        <div className="flex justify-center gap-4 flex-wrap">
                          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                            {result.data.ctaSection.primaryCTA}
                          </Button>
                          {result.data.ctaSection.secondaryCTA && (
                            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                              {result.data.ctaSection.secondaryCTA}
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-white/70 mt-4">{result.data.ctaSection.riskReversal}</p>
                        {result.data.ctaSection.ctaTriggers && (
                          <div className="flex justify-center gap-3 mt-2 flex-wrap">
                            {result.data.ctaSection.ctaTriggers.map((trigger, idx) => (
                              <span key={idx} className="text-xs text-white/60">{trigger}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-6">
            {result && result.data && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Framework Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Brain className="h-5 w-5" />
                      {result.data.framework} Framework Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.data.frameworkBreakdown && (
                      <ul className="space-y-3">
                        {Object.entries(result.data.frameworkBreakdown).map(([key, section]) => (
                          <li key={key} className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <p className="font-medium text-purple-800 dark:text-purple-200">{section.name}</p>
                            <p className="text-sm text-muted-foreground">{section.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Conversion Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      Conversion Optimization Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.data.conversionTips?.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* SEO Elements */}
                {result.data.seoElements && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-600">
                        <BarChart3 className="h-5 w-5" />
                        SEO Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta Title</Label>
                        <p className="text-sm mt-1 font-medium">{result.data.seoElements.metaTitle}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta Description</Label>
                        <p className="text-sm mt-1">{result.data.seoElements.metaDescription}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">H1</Label>
                        <p className="text-sm mt-1">{result.data.seoElements.h1}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Keywords</Label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {result.data.seoElements.suggestedKeywords?.map((kw, idx) => (
                            <Badge key={idx} variant="outline">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Micro-Copy */}
                {result.data.microCopy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <MessageSquare className="h-5 w-5" />
                        Micro-Copy Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.data.microCopy.aboveFold && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Above Fold</Label>
                          <ul className="mt-1">
                            {result.data.microCopy.aboveFold.map((text, idx) => (
                              <li key={idx} className="text-sm">{text}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.data.microCopy.formLabels && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Form Labels</Label>
                          <div className="mt-1 space-y-1 text-sm">
                            <p>Email: {result.data.microCopy.formLabels.email}</p>
                            <p>Name: {result.data.microCopy.formLabels.name}</p>
                            <p>Submit: {result.data.microCopy.formLabels.submit}</p>
                          </div>
                        </div>
                      )}
                      {result.data.microCopy.successMessage && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Success Message</Label>
                          <p className="text-sm mt-1">{result.data.microCopy.successMessage}</p>
                        </div>
                      )}
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
                toolType="landing-page-copy"
                getCurrentData={getCurrentData}
                loadDraftData={loadDraftData}
                onStartNew={handleStartNew}
                dependencies={[productName, productDescription, industry, framework, tone, targetAudience]}
                autoSaveEnabled={true}
                debounceMs={2000}
                minStepForAutoSave={1}
                currentStep={1}
              />
            </div>
          </div>
        </div>

        {/* Framework Guide */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Framework Guide: {selectedFramework?.name}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{selectedFramework?.full}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{selectedFramework?.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">Best for: {selectedFramework?.bestFor}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2026 Best Practices */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              2026 Landing Page Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Above the Fold</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">Answer in 3 seconds: What? Who? Why now?</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Outcome Headlines</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">"Close 30% More Deals" not "CRM Software"</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Specific Social Proof</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">"Helped [X] reduce churn 22% in 90 days"</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Click Triggers</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">"Join 10,000+ creators • Setup takes 2 min"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
