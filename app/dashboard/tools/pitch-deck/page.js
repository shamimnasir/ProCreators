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
import { Progress } from '@/components/ui/progress'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  Presentation, Copy, Sparkles, Loader2, Wand2,
  Check, ArrowLeft, TrendingUp, Users, BarChart3,
  Lightbulb, Target, DollarSign, Layers, Rocket,
  CheckCircle2, ChevronRight, Download, Eye, 
  Building2, MessageSquare, Award, Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import Link from 'next/link'

// Deck Styles
const DECK_STYLES = [
  { id: 'classic', name: 'Classic Investor Deck', icon: '📊', description: 'Traditional 12-slide format', color: 'blue' },
  { id: 'storytelling', name: 'Storytelling Deck', icon: '📖', description: 'Narrative-driven approach', color: 'purple' },
  { id: 'datadriven', name: 'Data-Driven Deck', icon: '📈', description: 'Heavy on metrics and charts', color: 'green' },
  { id: 'vision', name: 'Vision Deck', icon: '🚀', description: 'Big picture, moonshot focus', color: 'orange' }
]

// Industries
const INDUSTRIES = [
  { id: 'technology', name: '💻 Technology / SaaS' },
  { id: 'ai', name: '🤖 AI / Machine Learning' },
  { id: 'fintech', name: '💰 Fintech' },
  { id: 'health', name: '🏥 Healthcare / Biotech' },
  { id: 'ecommerce', name: '🛒 E-commerce' },
  { id: 'education', name: '📚 EdTech' },
  { id: 'cleantech', name: '🌱 Clean Tech' },
  { id: 'consumer', name: '📱 Consumer Apps' },
  { id: 'b2b', name: '🏢 B2B Enterprise' },
  { id: 'marketplace', name: '🔄 Marketplace' },
  { id: 'media', name: '🎬 Media / Entertainment' },
  { id: 'other', name: '📋 Other' }
]

// Funding Stages
const FUNDING_STAGES = [
  { id: 'preseed', name: 'Pre-Seed ($50K - $500K)', icon: '🌱' },
  { id: 'seed', name: 'Seed ($500K - $2M)', icon: '🌿' },
  { id: 'seriesA', name: 'Series A ($2M - $15M)', icon: '🌳' },
  { id: 'seriesB', name: 'Series B ($15M - $50M)', icon: '🏔️' },
  { id: 'seriesC', name: 'Series C+ ($50M+)', icon: '🚀' }
]

export default function PitchDeckPage() {
  const [activeTab, setActiveTab] = useState('create')
  const [currentStep, setCurrentStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Deck Style
  const [deckStyle, setDeckStyle] = useState('classic')
  
  // Company Info
  const [companyName, setCompanyName] = useState('')
  const [tagline, setTagline] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [industry, setIndustry] = useState('technology')
  
  // Problem & Solution
  const [problemStatement, setProblemStatement] = useState('')
  const [solution, setSolution] = useState('')
  const [keyFeatures, setKeyFeatures] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')
  
  // Market
  const [targetMarket, setTargetMarket] = useState('')
  const [marketSize, setMarketSize] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('')
  
  // Business Model
  const [revenueModel, setRevenueModel] = useState('')
  const [pricing, setPricing] = useState('')
  const [unitEconomics, setUnitEconomics] = useState('')
  
  // Traction
  const [currentTraction, setCurrentTraction] = useState('')
  const [milestones, setMilestones] = useState('')
  const [customerTestimonials, setCustomerTestimonials] = useState('')
  
  // Team
  const [founders, setFounders] = useState('')
  const [keyTeam, setKeyTeam] = useState('')
  const [advisors, setAdvisors] = useState('')
  
  // Financials & Ask
  const [fundingStage, setFundingStage] = useState('seed')
  const [fundingAmount, setFundingAmount] = useState('')
  const [useOfFunds, setUseOfFunds] = useState('')
  const [financialProjections, setFinancialProjections] = useState('')
  
  // Contact
  const [presenterName, setPresenterName] = useState('')
  const [presenterTitle, setPresenterTitle] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Results
  const [result, setResult] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleGenerate = async () => {
    if (!companyName) {
      toast({ title: 'Missing Information', description: 'Please enter your company name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/pitch-deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName, tagline, companyDescription, industry,
          problemStatement, solution, keyFeatures, uniqueValue,
          targetMarket, marketSize, competitors, competitiveAdvantage,
          revenueModel, pricing, unitEconomics,
          currentTraction, milestones, customerTestimonials,
          founders, keyTeam, advisors,
          fundingStage, fundingAmount, useOfFunds, financialProjections,
          presenterName, presenterTitle, contactEmail,
          deckStyle
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('preview')
        setActiveSlide(0)
        
        // Auto-save to library
        try {
          await saveToLibrary({
            type: 'pitch-deck',
            category: 'text',
            title: `Pitch Deck: ${companyName.substring(0, 40)}`,
            description: `${DECK_STYLES.find(s => s.id === deckStyle)?.name} - ${INDUSTRIES.find(i => i.id === industry)?.name}`,
            content: JSON.stringify(data.data),
            metadata: { deckStyle, companyName, industry, fundingStage, contentType: 'pitch-deck' }
          })
          toast({ title: '🎯 Pitch Deck Generated!', description: '✅ Auto-saved to Library' })
        } catch {
          toast({ title: '🎯 Pitch Deck Generated!' })
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

  const exportToPDF = async () => {
    if (!result) return
    
    setExportingPDF(true)
    toast({ title: 'Generating PDF...', description: 'Please wait, this may take a moment' })
    
    try {
      const selectedIndustry = INDUSTRIES.find(i => i.id === industry)?.name || industry
      const selectedStage = FUNDING_STAGES.find(s => s.id === fundingStage)?.name || fundingStage
      
      // Get HTML content from API
      const res = await fetch('/api/pitch-deck/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: result.data,
          metadata: {
            companyName,
            deckStyle,
            industry: selectedIndustry,
            fundingStage: selectedStage
          },
          saveToLibrary: true
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        if (data.fallback || data.htmlContent) {
          // Use client-side PDF generation with jspdf + html2canvas
          const { default: jsPDF } = await import('jspdf')
          const { default: html2canvas } = await import('html2canvas')
          
          // Create hidden iframe to render HTML
          const iframe = document.createElement('iframe')
          iframe.style.position = 'absolute'
          iframe.style.left = '-9999px'
          iframe.style.width = '1000px'
          iframe.style.height = '800px'
          document.body.appendChild(iframe)
          
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
          iframeDoc.open()
          iframeDoc.write(data.htmlContent)
          iframeDoc.close()
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Get all slides from iframe
          const slides = iframeDoc.querySelectorAll('.slide')
          
          if (slides.length === 0) {
            // Fallback: capture entire page
            const body = iframeDoc.body
            const canvas = await html2canvas(body, { 
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#f8fafc'
            })
            
            const pdf = new jsPDF('l', 'mm', 'a4')
            const imgWidth = 297
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidth, imgHeight)
            pdf.save(`${companyName.replace(/\s+/g, '_')}_Pitch_Deck.pdf`)
          } else {
            // Create PDF with each slide as a page
            const pdf = new jsPDF('l', 'mm', 'a4')
            const pageWidth = 297
            const pageHeight = 210
            
            for (let i = 0; i < slides.length; i++) {
              if (i > 0) pdf.addPage()
              
              const canvas = await html2canvas(slides[i], {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
              })
              
              const imgWidth = pageWidth - 10
              const imgHeight = (canvas.height * imgWidth) / canvas.width
              const yOffset = Math.max(0, (pageHeight - Math.min(imgHeight, pageHeight - 10)) / 2)
              
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.92), 
                'JPEG', 
                5, 
                yOffset, 
                imgWidth, 
                Math.min(imgHeight, pageHeight - 10)
              )
            }
            
            pdf.save(`${companyName.replace(/\s+/g, '_')}_Pitch_Deck.pdf`)
          }
          
          // Cleanup
          document.body.removeChild(iframe)
          toast({ title: '📥 PDF Downloaded!', description: '✅ Saved to Library' })
        } else if (data.pdfDataUrl) {
          // Direct PDF download
          const link = document.createElement('a')
          link.href = data.pdfDataUrl
          link.download = data.fileName || `${companyName.replace(/\s+/g, '_')}_Pitch_Deck.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          toast({ title: '📥 PDF Downloaded!', description: '✅ Saved to Library' })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      toast({ title: 'PDF Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setExportingPDF(false)
    }
  }

  const handleCopy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }, [toast])

  // AutoSave helpers
  const getCurrentData = useCallback(() => ({
    title: companyName ? `Pitch: ${companyName.substring(0, 50)}` : 'Untitled Pitch Deck',
    deckStyle, companyName, tagline, companyDescription, industry,
    problemStatement, solution, keyFeatures, uniqueValue,
    targetMarket, marketSize, competitors, competitiveAdvantage,
    revenueModel, pricing, unitEconomics,
    currentTraction, milestones, customerTestimonials,
    founders, keyTeam, advisors,
    fundingStage, fundingAmount, useOfFunds, financialProjections,
    presenterName, presenterTitle, contactEmail, result
  }), [deckStyle, companyName, tagline, companyDescription, industry,
    problemStatement, solution, keyFeatures, uniqueValue,
    targetMarket, marketSize, competitors, competitiveAdvantage,
    revenueModel, pricing, unitEconomics,
    currentTraction, milestones, customerTestimonials,
    founders, keyTeam, advisors,
    fundingStage, fundingAmount, useOfFunds, financialProjections,
    presenterName, presenterTitle, contactEmail, result])

  const loadDraftData = useCallback((data) => {
    if (data.deckStyle) setDeckStyle(data.deckStyle)
    if (data.companyName) setCompanyName(data.companyName)
    if (data.tagline) setTagline(data.tagline)
    if (data.companyDescription) setCompanyDescription(data.companyDescription)
    if (data.industry) setIndustry(data.industry)
    if (data.problemStatement) setProblemStatement(data.problemStatement)
    if (data.solution) setSolution(data.solution)
    if (data.keyFeatures) setKeyFeatures(data.keyFeatures)
    if (data.uniqueValue) setUniqueValue(data.uniqueValue)
    if (data.targetMarket) setTargetMarket(data.targetMarket)
    if (data.marketSize) setMarketSize(data.marketSize)
    if (data.competitors) setCompetitors(data.competitors)
    if (data.competitiveAdvantage) setCompetitiveAdvantage(data.competitiveAdvantage)
    if (data.revenueModel) setRevenueModel(data.revenueModel)
    if (data.pricing) setPricing(data.pricing)
    if (data.unitEconomics) setUnitEconomics(data.unitEconomics)
    if (data.currentTraction) setCurrentTraction(data.currentTraction)
    if (data.milestones) setMilestones(data.milestones)
    if (data.customerTestimonials) setCustomerTestimonials(data.customerTestimonials)
    if (data.founders) setFounders(data.founders)
    if (data.keyTeam) setKeyTeam(data.keyTeam)
    if (data.advisors) setAdvisors(data.advisors)
    if (data.fundingStage) setFundingStage(data.fundingStage)
    if (data.fundingAmount) setFundingAmount(data.fundingAmount)
    if (data.useOfFunds) setUseOfFunds(data.useOfFunds)
    if (data.financialProjections) setFinancialProjections(data.financialProjections)
    if (data.presenterName) setPresenterName(data.presenterName)
    if (data.presenterTitle) setPresenterTitle(data.presenterTitle)
    if (data.contactEmail) setContactEmail(data.contactEmail)
    if (data.result) { setResult(data.result); setActiveTab('preview') }
  }, [])

  const handleStartNew = useCallback(() => {
    setDeckStyle('classic'); setCompanyName(''); setTagline(''); setCompanyDescription('')
    setIndustry('technology'); setProblemStatement(''); setSolution(''); setKeyFeatures('')
    setUniqueValue(''); setTargetMarket(''); setMarketSize(''); setCompetitors('')
    setCompetitiveAdvantage(''); setRevenueModel(''); setPricing(''); setUnitEconomics('')
    setCurrentTraction(''); setMilestones(''); setCustomerTestimonials(''); setFounders('')
    setKeyTeam(''); setAdvisors(''); setFundingStage('seed'); setFundingAmount('')
    setUseOfFunds(''); setFinancialProjections(''); setPresenterName(''); setPresenterTitle('')
    setContactEmail(''); setResult(null); setActiveTab('create'); setCurrentStep(1)
  }, [])

  const selectedDeckStyle = DECK_STYLES.find(s => s.id === deckStyle)

  // Render slide content
  const renderSlideContent = (slide) => {
    if (!slide || !slide.content) return null
    const content = slide.content
    
    return (
      <div className="space-y-4 text-sm">
        {content.headline && (
          <p className="text-lg font-bold text-blue-700">{content.headline}</p>
        )}
        {content.oneLiner && (
          <p className="text-base text-muted-foreground">{content.oneLiner}</p>
        )}
        {content.tagline && <p className="text-base italic">{content.tagline}</p>}
        {content.presenter && <p className="text-muted-foreground">{content.presenter}</p>}
        
        {content.problems && Array.isArray(content.problems) && (
          <div className="space-y-2">
            {content.problems.map((p, i) => (
              <div key={i} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                <p className="font-semibold text-red-800">{p.problem || p}</p>
                {p.impact && <p className="text-red-600 text-xs">{p.impact}</p>}
              </div>
            ))}
          </div>
        )}
        
        {content.keyFeatures && Array.isArray(content.keyFeatures) && (
          <div className="space-y-2">
            {content.keyFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-50 p-2 rounded">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>{typeof f === 'object' ? f.feature : f}</span>
              </div>
            ))}
          </div>
        )}
        
        {(content.tam || content.sam || content.som) && (
          <div className="grid grid-cols-3 gap-2">
            {content.tam && (
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="font-bold text-blue-700">{typeof content.tam === 'object' ? content.tam.value : content.tam}</p>
                <p className="text-xs text-blue-600">TAM</p>
              </div>
            )}
            {content.sam && (
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="font-bold text-purple-700">{typeof content.sam === 'object' ? content.sam.value : content.sam}</p>
                <p className="text-xs text-purple-600">SAM</p>
              </div>
            )}
            {content.som && (
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="font-bold text-green-700">{typeof content.som === 'object' ? content.som.value : content.som}</p>
                <p className="text-xs text-green-600">SOM</p>
              </div>
            )}
          </div>
        )}
        
        {content.keyMetrics && Array.isArray(content.keyMetrics) && (
          <div className="grid grid-cols-3 gap-2">
            {content.keyMetrics.map((m, i) => (
              <div key={i} className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <p className="font-bold text-lg text-green-700">{m.value}</p>
                <p className="text-xs text-green-600">{m.metric}</p>
                {m.growth && <p className="text-xs text-green-500">↑ {m.growth}</p>}
              </div>
            ))}
          </div>
        )}
        
        {content.amount && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl text-center">
            <p className="text-3xl font-bold">{content.amount}</p>
            {content.stage && <p className="text-sm opacity-90">{content.stage}</p>}
          </div>
        )}
        
        {content.useOfFunds && Array.isArray(content.useOfFunds) && (
          <div className="space-y-2">
            {content.useOfFunds.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 text-sm font-medium">{u.category}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                    style={{ width: `${parseInt(u.percentage) || 25}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{u.percentage}</span>
              </div>
            ))}
          </div>
        )}
        
        {content.founders && Array.isArray(content.founders) && (
          <div className="grid grid-cols-2 gap-3">
            {content.founders.map((f, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  {(f.name || 'F').charAt(0)}
                </div>
                <p className="font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.title}</p>
              </div>
            ))}
          </div>
        )}
        
        {content.revenueModel && <p><strong>Revenue Model:</strong> {content.revenueModel}</p>}
        {content.howItWorks && <p><strong>How It Works:</strong> {content.howItWorks}</p>}
        {content.callToAction && (
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="font-semibold text-green-700">{content.callToAction}</p>
          </div>
        )}
        {content.contactInfo && <p className="text-center text-lg font-medium">{content.contactInfo}</p>}
      </div>
    )
  }

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
              <Presentation className="h-7 w-7 text-purple-600" />
              Pitch Deck Creator
            </h1>
            <Badge className="bg-purple-600 text-white">AI-Powered</Badge>
          </div>
          <p className="text-muted-foreground">Create investor-ready pitch decks in minutes</p>
        </div>
      </div>

      {/* Deck Style Selection */}
      <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4">
            {DECK_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setDeckStyle(style.id)}
                className={`p-4 rounded-lg text-left transition-all ${
                  deckStyle === style.id
                    ? 'bg-white/20 ring-2 ring-white'
                    : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{style.icon}</span>
                  <span className="font-bold text-sm">{style.name}</span>
                </div>
                <p className="text-xs text-white/80">{style.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="create">📝 Create Deck</TabsTrigger>
              <TabsTrigger value="preview" disabled={!result}>🎯 Preview Slides</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Company</span>
                    <span>Problem</span>
                    <span>Market</span>
                    <span>Traction</span>
                    <span>Ask</span>
                  </div>
                </CardContent>
              </Card>

              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      Company Information
                    </CardTitle>
                    <CardDescription>Basic info about your startup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g., Acme AI"
                        />
                      </div>
                      <div>
                        <Label>Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map((ind) => (
                              <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Tagline / One-liner</Label>
                      <Input
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g., AI that writes your code"
                      />
                    </div>
                    
                    <div>
                      <Label>Company Description</Label>
                      <Textarea
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="What does your company do?"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Presenter Name</Label>
                        <Input
                          value={presenterName}
                          onChange={(e) => setPresenterName(e.target.value)}
                          placeholder="e.g., John Smith"
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={presenterTitle}
                          onChange={(e) => setPresenterTitle(e.target.value)}
                          placeholder="e.g., CEO & Co-founder"
                        />
                      </div>
                      <div>
                        <Label>Contact Email</Label>
                        <Input
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g., john@acme.ai"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Problem & Solution */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Problem & Solution
                    </CardTitle>
                    <CardDescription>The core of your pitch</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>The Problem</Label>
                      <Textarea
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="What painful problem are you solving? Who has this problem? How big is the pain?"
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Your Solution</Label>
                      <Textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="How do you solve this problem? What is your product/service?"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Key Features / How It Works</Label>
                      <Textarea
                        value={keyFeatures}
                        onChange={(e) => setKeyFeatures(e.target.value)}
                        placeholder="List 3-5 key features or explain how your solution works"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Unique Value Proposition</Label>
                      <Input
                        value={uniqueValue}
                        onChange={(e) => setUniqueValue(e.target.value)}
                        placeholder="What makes you different from alternatives?"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Market & Competition */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Market & Competition
                    </CardTitle>
                    <CardDescription>Market opportunity and competitive landscape</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Target Market</Label>
                      <Textarea
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="Who are your ideal customers? Demographics, behaviors, needs..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Market Size (TAM/SAM/SOM)</Label>
                      <Input
                        value={marketSize}
                        onChange={(e) => setMarketSize(e.target.value)}
                        placeholder="e.g., TAM $50B, SAM $5B, SOM $500M in 3 years"
                      />
                    </div>
                    
                    <div>
                      <Label>Competitors</Label>
                      <Textarea
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        placeholder="Who are your competitors? Direct and indirect..."
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Competitive Advantage / Moat</Label>
                      <Textarea
                        value={competitiveAdvantage}
                        onChange={(e) => setCompetitiveAdvantage(e.target.value)}
                        placeholder="Why will you win? What's your unfair advantage?"
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Revenue Model</Label>
                        <Input
                          value={revenueModel}
                          onChange={(e) => setRevenueModel(e.target.value)}
                          placeholder="e.g., SaaS subscription"
                        />
                      </div>
                      <div>
                        <Label>Pricing</Label>
                        <Input
                          value={pricing}
                          onChange={(e) => setPricing(e.target.value)}
                          placeholder="e.g., $99/mo, $999/year"
                        />
                      </div>
                      <div>
                        <Label>Unit Economics</Label>
                        <Input
                          value={unitEconomics}
                          onChange={(e) => setUnitEconomics(e.target.value)}
                          placeholder="e.g., LTV $5K, CAC $500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Traction & Team */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Traction & Team
                    </CardTitle>
                    <CardDescription>Your progress and team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Traction</Label>
                      <Textarea
                        value={currentTraction}
                        onChange={(e) => setCurrentTraction(e.target.value)}
                        placeholder="Revenue, users, growth rate, key metrics..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Key Milestones</Label>
                      <Textarea
                        value={milestones}
                        onChange={(e) => setMilestones(e.target.value)}
                        placeholder="What have you achieved? Product launches, partnerships, funding..."
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Customer Testimonials / Validation</Label>
                      <Input
                        value={customerTestimonials}
                        onChange={(e) => setCustomerTestimonials(e.target.value)}
                        placeholder="Notable customers, quotes, logos..."
                      />
                    </div>
                    
                    <div>
                      <Label>Founders</Label>
                      <Textarea
                        value={founders}
                        onChange={(e) => setFounders(e.target.value)}
                        placeholder="Founder names, titles, relevant background..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Key Team Members</Label>
                        <Textarea
                          value={keyTeam}
                          onChange={(e) => setKeyTeam(e.target.value)}
                          placeholder="Other key hires and their roles..."
                          className="min-h-[60px]"
                        />
                      </div>
                      <div>
                        <Label>Advisors</Label>
                        <Textarea
                          value={advisors}
                          onChange={(e) => setAdvisors(e.target.value)}
                          placeholder="Notable advisors and their expertise..."
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: The Ask */}
              {currentStep === 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      The Ask
                    </CardTitle>
                    <CardDescription>What you're raising</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Funding Stage</Label>
                        <Select value={fundingStage} onValueChange={setFundingStage}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FUNDING_STAGES.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>{stage.icon} {stage.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Funding Amount</Label>
                        <Input
                          value={fundingAmount}
                          onChange={(e) => setFundingAmount(e.target.value)}
                          placeholder="e.g., $1.5 Million"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Use of Funds</Label>
                      <Textarea
                        value={useOfFunds}
                        onChange={(e) => setUseOfFunds(e.target.value)}
                        placeholder="How will you use the money? e.g., 40% Product, 30% Sales, 30% Team"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Financial Projections</Label>
                      <Textarea
                        value={financialProjections}
                        onChange={(e) => setFinancialProjections(e.target.value)}
                        placeholder="Revenue projections for next 3 years..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    <CreditCostBadge toolId="pitch-deck" />
                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !companyName}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {generating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="h-4 w-4 mr-2" /> Generate Pitch Deck</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              {result && result.data && result.data.slides && (
                <>
                  {/* Deck Header */}
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Presentation className="h-5 w-5 text-purple-600" />
                            {result.data.companyName} Pitch Deck
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {result.data.slides.length} Slides • {selectedDeckStyle?.name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={exportToPDF}
                            disabled={exportingPDF}
                          >
                            {exportingPDF ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Exporting...</>
                            ) : (
                              <><Download className="h-4 w-4 mr-1" /> Export PDF</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Slide Navigator */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {result.data.slides.map((slide, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                          activeSlide === idx
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {idx + 1}. {slide.title}
                      </button>
                    ))}
                  </div>

                  {/* Active Slide */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="bg-white/20 text-white mb-2">
                            Slide {activeSlide + 1} of {result.data.slides.length}
                          </Badge>
                          <h2 className="text-2xl font-bold">{result.data.slides[activeSlide]?.title}</h2>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/10"
                          onClick={() => {
                            const slideContent = JSON.stringify(result.data.slides[activeSlide], null, 2)
                            handleCopy(slideContent, `slide-${activeSlide}`)
                          }}
                        >
                          {copied[`slide-${activeSlide}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {renderSlideContent(result.data.slides[activeSlide])}
                      
                      {result.data.slides[activeSlide]?.speakerNotes && (
                        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                          <p className="text-xs font-bold text-yellow-800 uppercase mb-1">🎤 Speaker Notes</p>
                          <p className="text-sm text-yellow-700 italic">{result.data.slides[activeSlide].speakerNotes}</p>
                        </div>
                      )}
                      
                      {result.data.slides[activeSlide]?.designTips && (
                        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                          <p className="text-xs font-bold text-blue-800">💡 Design Tip:</p>
                          <p className="text-sm text-blue-700">{result.data.slides[activeSlide].designTips}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Navigation Arrows */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                      disabled={activeSlide === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Previous Slide
                    </Button>
                    <Button
                      onClick={() => setActiveSlide(Math.min(result.data.slides.length - 1, activeSlide + 1))}
                      disabled={activeSlide === result.data.slides.length - 1}
                    >
                      Next Slide <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  {/* Tips & Q&A */}
                  {result.data.pitchTips && (
                    <Card className="bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-yellow-800 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" /> Pitch Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.data.pitchTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-yellow-700">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {result.data.commonQuestions && (
                    <Card className="bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-purple-800 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" /> Common Investor Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {result.data.commonQuestions.map((qa, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                            <p className="font-semibold text-purple-800 mb-2">{qa.question}</p>
                            <p className="text-sm text-gray-700">{qa.suggestedAnswer}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <AutoSaveDraftsManager
              toolType="pitch-deck"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[companyName, companyDescription, industry, deckStyle]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={1}
            />
            
            {/* Quick Tips */}
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Pitch Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-purple-700 dark:text-purple-300 space-y-2">
                <p>• Keep your deck to 12-15 slides</p>
                <p>• Lead with a compelling hook</p>
                <p>• Show traction & momentum</p>
                <p>• Know your numbers cold</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
