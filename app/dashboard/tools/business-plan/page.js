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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  FileText, Copy, Sparkles, Loader2, Wand2, RefreshCw,
  Check, ArrowLeft, TrendingUp, Users, BarChart3, Building2,
  Lightbulb, Target, DollarSign, Layers, PieChart, Briefcase,
  CheckCircle2, ChevronRight, Download, Eye, Globe, Rocket,
  ClipboardList, Settings, Shield, Award, LineChart
, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import Link from 'next/link'

// Plan Types
const PLAN_TYPES = [
  { id: 'traditional', name: 'Traditional Plan', icon: FileText, description: 'Comprehensive 20-50 page plan', badge: 'Banks & Investors', color: 'blue' },
  { id: 'lean', name: 'Lean Canvas', icon: Layers, description: 'One-page business model', badge: 'Startups', color: 'green' },
  { id: 'pitch', name: 'Pitch Deck', icon: Rocket, description: '10-15 slide presentation', badge: 'Fundraising', color: 'purple' }
]

// Industries
const INDUSTRIES = [
  { id: 'technology', name: '💻 Technology / SaaS' },
  { id: 'ecommerce', name: '🛒 E-commerce / Retail' },
  { id: 'food', name: '🍽️ Food & Beverage' },
  { id: 'health', name: '🏥 Healthcare / Wellness' },
  { id: 'finance', name: '💰 Finance / Fintech' },
  { id: 'education', name: '📚 Education / EdTech' },
  { id: 'manufacturing', name: '🏭 Manufacturing' },
  { id: 'services', name: '💼 Professional Services' },
  { id: 'realestate', name: '🏠 Real Estate' },
  { id: 'media', name: '🎬 Media / Entertainment' },
  { id: 'nonprofit', name: '❤️ Non-profit' },
  { id: 'other', name: '📋 Other' }
]

// Business Stages
const STAGES = [
  { id: 'idea', name: '💡 Idea Stage' },
  { id: 'mvp', name: '🔧 MVP Stage' },
  { id: 'launch', name: '🚀 Launch Stage' },
  { id: 'growth', name: '📈 Growth Stage' },
  { id: 'expansion', name: '🌍 Expansion Stage' }
]

// Legal Structures
const LEGAL_STRUCTURES = [
  { id: 'sole', name: 'Sole Proprietorship' },
  { id: 'llc', name: 'LLC' },
  { id: 'partnership', name: 'Partnership' },
  { id: 'scorp', name: 'S Corporation' },
  { id: 'ccorp', name: 'C Corporation' },
  { id: 'nonprofit', name: 'Non-profit' }
]

export default function BusinessPlanPage() {
  const [activeTab, setActiveTab] = useState('setup')
  const [currentStep, setCurrentStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()

  // Plan Type
  const [planType, setPlanType] = useState('traditional')
  
  // Company Basics
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [industry, setIndustry] = useState('technology')
  const [businessStage, setBusinessStage] = useState('idea')
  const [legalStructure, setLegalStructure] = useState('llc')
  const [foundingDate, setFoundingDate] = useState('')
  const [location, setLocation] = useState('')
  
  // Mission & Vision
  const [missionStatement, setMissionStatement] = useState('')
  const [visionStatement, setVisionStatement] = useState('')
  const [coreValues, setCoreValues] = useState('')
  
  // Products/Services
  const [productsServices, setProductsServices] = useState('')
  const [problemSolved, setProblemSolved] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')
  const [pricingModel, setPricingModel] = useState('')
  
  // Market
  const [targetMarket, setTargetMarket] = useState('')
  const [marketSize, setMarketSize] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('')
  
  // Team
  const [founders, setFounders] = useState('')
  const [keyTeam, setKeyTeam] = useState('')
  const [advisors, setAdvisors] = useState('')
  const [hiringPlan, setHiringPlan] = useState('')
  
  // Operations
  const [operationsDescription, setOperationsDescription] = useState('')
  const [suppliers, setSuppliers] = useState('')
  const [technologyStack, setTechnologyStack] = useState('')
  
  // Financials
  const [revenueModel, setRevenueModel] = useState('')
  const [startupCosts, setStartupCosts] = useState('')
  const [fundingNeeded, setFundingNeeded] = useState('')
  const [fundingUse, setFundingUse] = useState('')
  const [projectedRevenue, setProjectedRevenue] = useState('')
  const [breakEvenTimeline, setBreakEvenTimeline] = useState('')
  
  // Goals
  const [shortTermGoals, setShortTermGoals] = useState('')
  const [longTermGoals, setLongTermGoals] = useState('')
  const [milestones, setMilestones] = useState('')

  // Results
  const [result, setResult] = useState(null)
  const [activeSection, setActiveSection] = useState('executiveSummary')

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
      const res = await fetch('/api/business-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType, companyName, companyDescription, industry, businessStage,
          legalStructure, foundingDate, location, missionStatement, visionStatement,
          coreValues, productsServices, problemSolved, uniqueValue, pricingModel,
          targetMarket, marketSize, competitors, competitiveAdvantage, founders,
          keyTeam, advisors, hiringPlan, operationsDescription, suppliers,
          technologyStack, revenueModel, startupCosts, fundingNeeded, fundingUse,
          projectedRevenue, breakEvenTimeline, shortTermGoals, longTermGoals, milestones
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('plan')
        
        // Auto-save to library
        try {
          const planTypeName = PLAN_TYPES.find(t => t.id === planType)?.name || 'Business Plan'
          await saveToLibrary({
            type: 'business-plan',
            category: 'text',
            title: `${planTypeName}: ${companyName.substring(0, 40)}`,
            description: `${planTypeName} - ${INDUSTRIES.find(i => i.id === industry)?.name}`,
            content: JSON.stringify(data.data),
            metadata: { planType, companyName, industry, businessStage, contentType: 'business-plan' }
          })
          toast({ title: '📋 Business Plan Generated!', description: '✅ Auto-saved to Library' })
        } catch {
          toast({ title: '📋 Business Plan Generated!' })
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

  // PDF Export function
  const exportToPDF = async () => {
    if (!result) return
    
    setExportingPDF(true)
    toast({ title: 'Generating PDF...', description: 'Please wait, this may take a moment' })
    
    try {
      const selectedIndustry = INDUSTRIES.find(i => i.id === industry)?.name || industry
      const selectedStage = STAGES.find(s => s.id === businessStage)?.name || businessStage
      
      const res = await fetch('/api/business-plan/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: result.data,
          metadata: {
            planType: selectedPlanType?.name || 'Business Plan',
            companyName,
            industry: selectedIndustry,
            stage: selectedStage
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
          iframe.style.width = '900px'
          iframe.style.height = '1200px'
          document.body.appendChild(iframe)
          
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
          iframeDoc.open()
          iframeDoc.write(data.htmlContent)
          iframeDoc.close()
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Get sections from iframe
          const body = iframeDoc.body
          const sections = iframeDoc.querySelectorAll('.section, .slide, .cover-page')
          
          // Create PDF in portrait A4
          const pdf = new jsPDF('p', 'mm', 'a4')
          const pageWidth = 210
          const pageHeight = 297
          
          if (sections.length > 0) {
            // Capture each section separately for better quality
            let isFirstPage = true
            
            for (const section of sections) {
              if (!isFirstPage) pdf.addPage()
              isFirstPage = false
              
              const canvas = await html2canvas(section, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
              })
              
              const imgWidth = pageWidth - 20
              const imgHeight = (canvas.height * imgWidth) / canvas.width
              
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                10,
                10,
                imgWidth,
                Math.min(imgHeight, pageHeight - 20)
              )
            }
          } else {
            // Capture full page
            const canvas = await html2canvas(body, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowHeight: body.scrollHeight
            })
            
            const imgWidth = pageWidth - 20
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            const pageCount = Math.ceil(imgHeight / (pageHeight - 20))
            
            for (let i = 0; i < pageCount; i++) {
              if (i > 0) pdf.addPage()
              
              const srcY = i * ((canvas.height / imgHeight) * (pageHeight - 20))
              const srcHeight = Math.min(
                (canvas.height / imgHeight) * (pageHeight - 20),
                canvas.height - srcY
              )
              
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                10,
                10 - (i * (pageHeight - 20)),
                imgWidth,
                imgHeight
              )
            }
          }
          
          pdf.save(`${companyName.replace(/\s+/g, '_')}_Business_Plan.pdf`)
          
          // Cleanup
          document.body.removeChild(iframe)
          toast({ 
            title: '📥 PDF Downloaded!', 
            description: data.libraryId ? '✅ Also saved to Library' : 'Business plan saved successfully'
          })
        } else if (data.pdfDataUrl) {
          // Direct PDF download
          const link = document.createElement('a')
          link.href = data.pdfDataUrl
          link.download = data.fileName || `${companyName.replace(/\s+/g, '_')}_Business_Plan.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          toast({ 
            title: '📥 PDF Downloaded!', 
            description: data.libraryId ? '✅ Also saved to Library' : 'Business plan saved successfully'
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      toast({ title: 'PDF Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setExportingPDF(false)
    }
  }

  const selectedPlanType = PLAN_TYPES.find(t => t.id === planType)

  // AutoSave helpers
  const getCurrentData = useCallback(() => ({
    title: companyName ? `Plan: ${companyName.substring(0, 50)}` : 'Untitled Business Plan',
    planType, companyName, companyDescription, industry, businessStage, legalStructure,
    foundingDate, location, missionStatement, visionStatement, coreValues, productsServices,
    problemSolved, uniqueValue, pricingModel, targetMarket, marketSize, competitors,
    competitiveAdvantage, founders, keyTeam, advisors, hiringPlan, operationsDescription,
    suppliers, technologyStack, revenueModel, startupCosts, fundingNeeded, fundingUse,
    projectedRevenue, breakEvenTimeline, shortTermGoals, longTermGoals, milestones, result
  }), [planType, companyName, companyDescription, industry, businessStage, legalStructure,
    foundingDate, location, missionStatement, visionStatement, coreValues, productsServices,
    problemSolved, uniqueValue, pricingModel, targetMarket, marketSize, competitors,
    competitiveAdvantage, founders, keyTeam, advisors, hiringPlan, operationsDescription,
    suppliers, technologyStack, revenueModel, startupCosts, fundingNeeded, fundingUse,
    projectedRevenue, breakEvenTimeline, shortTermGoals, longTermGoals, milestones, result])

  const loadDraftData = useCallback((data) => {
    if (data.planType) setPlanType(data.planType)
    if (data.companyName) setCompanyName(data.companyName)
    if (data.companyDescription) setCompanyDescription(data.companyDescription)
    if (data.industry) setIndustry(data.industry)
    if (data.businessStage) setBusinessStage(data.businessStage)
    if (data.legalStructure) setLegalStructure(data.legalStructure)
    if (data.foundingDate) setFoundingDate(data.foundingDate)
    if (data.location) setLocation(data.location)
    if (data.missionStatement) setMissionStatement(data.missionStatement)
    if (data.visionStatement) setVisionStatement(data.visionStatement)
    if (data.coreValues) setCoreValues(data.coreValues)
    if (data.productsServices) setProductsServices(data.productsServices)
    if (data.problemSolved) setProblemSolved(data.problemSolved)
    if (data.uniqueValue) setUniqueValue(data.uniqueValue)
    if (data.pricingModel) setPricingModel(data.pricingModel)
    if (data.targetMarket) setTargetMarket(data.targetMarket)
    if (data.marketSize) setMarketSize(data.marketSize)
    if (data.competitors) setCompetitors(data.competitors)
    if (data.competitiveAdvantage) setCompetitiveAdvantage(data.competitiveAdvantage)
    if (data.founders) setFounders(data.founders)
    if (data.keyTeam) setKeyTeam(data.keyTeam)
    if (data.advisors) setAdvisors(data.advisors)
    if (data.hiringPlan) setHiringPlan(data.hiringPlan)
    if (data.operationsDescription) setOperationsDescription(data.operationsDescription)
    if (data.suppliers) setSuppliers(data.suppliers)
    if (data.technologyStack) setTechnologyStack(data.technologyStack)
    if (data.revenueModel) setRevenueModel(data.revenueModel)
    if (data.startupCosts) setStartupCosts(data.startupCosts)
    if (data.fundingNeeded) setFundingNeeded(data.fundingNeeded)
    if (data.fundingUse) setFundingUse(data.fundingUse)
    if (data.projectedRevenue) setProjectedRevenue(data.projectedRevenue)
    if (data.breakEvenTimeline) setBreakEvenTimeline(data.breakEvenTimeline)
    if (data.shortTermGoals) setShortTermGoals(data.shortTermGoals)
    if (data.longTermGoals) setLongTermGoals(data.longTermGoals)
    if (data.milestones) setMilestones(data.milestones)
    if (data.result) { setResult(data.result); setActiveTab('plan') }
  }, [])

  const handleStartNew = useCallback(() => {
    setPlanType('traditional')
    setCompanyName(''); setCompanyDescription(''); setIndustry('technology')
    setBusinessStage('idea'); setLegalStructure('llc'); setFoundingDate('')
    setLocation(''); setMissionStatement(''); setVisionStatement('')
    setCoreValues(''); setProductsServices(''); setProblemSolved('')
    setUniqueValue(''); setPricingModel(''); setTargetMarket('')
    setMarketSize(''); setCompetitors(''); setCompetitiveAdvantage('')
    setFounders(''); setKeyTeam(''); setAdvisors(''); setHiringPlan('')
    setOperationsDescription(''); setSuppliers(''); setTechnologyStack('')
    setRevenueModel(''); setStartupCosts(''); setFundingNeeded('')
    setFundingUse(''); setProjectedRevenue(''); setBreakEvenTimeline('')
    setShortTermGoals(''); setLongTermGoals(''); setMilestones('')
    setResult(null); setActiveTab('setup'); setCurrentStep(1)
  }, [])

  // Render Section Content
  const renderSectionContent = (sectionKey, sectionData) => {
    if (!sectionData) return null
    
    return (
      <div className="space-y-4">
        {Object.entries(sectionData).map(([key, value]) => {
          if (key === 'title') return null
          
          if (typeof value === 'string') {
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <p className="text-sm whitespace-pre-wrap">{value}</p>
              </div>
            )
          }
          
          if (Array.isArray(value)) {
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <ul className="text-sm space-y-1">
                  {value.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
          
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Label className="text-xs font-bold capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                {renderSectionContent(key, value)}
              </div>
            )
          }
          
          return null
        })}
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
              <Briefcase className="h-7 w-7 text-blue-600" />
              Business Plan Generator
            </h1>
            <Badge className="bg-blue-600 text-white">AI-Powered</Badge>
          </div>
          <p className="text-muted-foreground">Create investor-ready business plans, lean canvases, and pitch decks</p>
        </div>
      </div>

      {/* Plan Type Selection Banner */}
      <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4">
            {PLAN_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setPlanType(type.id)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    planType === type.id
                      ? 'bg-white/20 ring-2 ring-white'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5" />
                    <span className="font-bold">{type.name}</span>
                  </div>
                  <p className="text-xs text-white/80">{type.description}</p>
                  <Badge className="mt-2 bg-white/20 text-white text-[10px]">{type.badge}</Badge>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="setup">📝 Create Plan</TabsTrigger>
              <TabsTrigger value="plan" disabled={!result}>📋 View Plan</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress: Step {currentStep} of {totalSteps}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Basics</span>
                    <span>Products</span>
                    <span>Market</span>
                    <span>Team</span>
                    <span>Financials</span>
                  </div>
                </CardContent>
              </Card>

              {/* Step 1: Company Basics */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Company Basics
                    </CardTitle>
                    <CardDescription>Tell us about your company</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g., Acme Technologies"
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
                      <Label>Company Description</Label>
                      <Textarea
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="Brief description of what your company does..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Business Stage</Label>
                        <Select value={businessStage} onValueChange={setBusinessStage}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STAGES.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Legal Structure</Label>
                        <Select value={legalStructure} onValueChange={setLegalStructure}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LEGAL_STRUCTURES.map((struct) => (
                              <SelectItem key={struct.id} value={struct.id}>{struct.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Mission Statement</Label>
                        <Textarea
                          value={missionStatement}
                          onChange={(e) => setMissionStatement(e.target.value)}
                          placeholder="Your company's mission..."
                          className="min-h-[60px]"
                        />
                      </div>
                      <div>
                        <Label>Vision Statement</Label>
                        <Textarea
                          value={visionStatement}
                          onChange={(e) => setVisionStatement(e.target.value)}
                          placeholder="Where do you see the company in 5-10 years?"
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Products/Services */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-green-600" />
                      Products & Services
                    </CardTitle>
                    <CardDescription>What do you offer?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Products/Services Description</Label>
                      <Textarea
                        value={productsServices}
                        onChange={(e) => setProductsServices(e.target.value)}
                        placeholder="Describe your main products or services in detail..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Problem You Solve</Label>
                      <Textarea
                        value={problemSolved}
                        onChange={(e) => setProblemSolved(e.target.value)}
                        placeholder="What problem does your product/service solve for customers?"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Unique Value Proposition</Label>
                      <Textarea
                        value={uniqueValue}
                        onChange={(e) => setUniqueValue(e.target.value)}
                        placeholder="What makes your offering unique? Why choose you over competitors?"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Pricing Model</Label>
                      <Input
                        value={pricingModel}
                        onChange={(e) => setPricingModel(e.target.value)}
                        placeholder="e.g., Subscription $29/mo, One-time $499, Freemium"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Market */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Market Analysis
                    </CardTitle>
                    <CardDescription>Who are your customers and competitors?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Target Market</Label>
                      <Textarea
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="Describe your ideal customers (demographics, behaviors, needs)..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Market Size (TAM/SAM/SOM)</Label>
                      <Input
                        value={marketSize}
                        onChange={(e) => setMarketSize(e.target.value)}
                        placeholder="e.g., $10B total market, targeting $500M segment"
                      />
                    </div>
                    
                    <div>
                      <Label>Main Competitors</Label>
                      <Textarea
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        placeholder="List your main competitors and what they offer..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Competitive Advantage</Label>
                      <Textarea
                        value={competitiveAdvantage}
                        onChange={(e) => setCompetitiveAdvantage(e.target.value)}
                        placeholder="How will you beat the competition? What's your moat?"
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Team */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Management & Team
                    </CardTitle>
                    <CardDescription>Who's building this company?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Founders</Label>
                      <Textarea
                        value={founders}
                        onChange={(e) => setFounders(e.target.value)}
                        placeholder="Founder names, titles, and relevant background/experience..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Key Team Members</Label>
                      <Textarea
                        value={keyTeam}
                        onChange={(e) => setKeyTeam(e.target.value)}
                        placeholder="Other important team members and their roles..."
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Advisors</Label>
                      <Textarea
                        value={advisors}
                        onChange={(e) => setAdvisors(e.target.value)}
                        placeholder="Any advisors, mentors, or board members..."
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div>
                      <Label>Hiring Plan</Label>
                      <Input
                        value={hiringPlan}
                        onChange={(e) => setHiringPlan(e.target.value)}
                        placeholder="e.g., Hire 2 engineers in Q1, Sales lead in Q2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Financials */}
              {currentStep === 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Plan
                    </CardTitle>
                    <CardDescription>The numbers behind your business</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Revenue Model</Label>
                      <Textarea
                        value={revenueModel}
                        onChange={(e) => setRevenueModel(e.target.value)}
                        placeholder="How will your business make money? Describe revenue streams..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Startup Costs</Label>
                        <Input
                          value={startupCosts}
                          onChange={(e) => setStartupCosts(e.target.value)}
                          placeholder="e.g., $50,000"
                        />
                      </div>
                      <div>
                        <Label>Funding Needed</Label>
                        <Input
                          value={fundingNeeded}
                          onChange={(e) => setFundingNeeded(e.target.value)}
                          placeholder="e.g., $500,000 seed round"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Use of Funds</Label>
                      <Textarea
                        value={fundingUse}
                        onChange={(e) => setFundingUse(e.target.value)}
                        placeholder="How will you use the funding? (e.g., 40% product, 30% marketing, 30% team)"
                        className="min-h-[60px]"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Projected Revenue (Year 1-3)</Label>
                        <Input
                          value={projectedRevenue}
                          onChange={(e) => setProjectedRevenue(e.target.value)}
                          placeholder="e.g., Y1: $100K, Y2: $500K, Y3: $2M"
                        />
                      </div>
                      <div>
                        <Label>Break-even Timeline</Label>
                        <Input
                          value={breakEvenTimeline}
                          onChange={(e) => setBreakEvenTimeline(e.target.value)}
                          placeholder="e.g., 18 months"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Key Milestones</Label>
                      <Textarea
                        value={milestones}
                        onChange={(e) => setMilestones(e.target.value)}
                        placeholder="Key milestones for the next 12-24 months..."
                        className="min-h-[60px]"
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    <CreditCostBadge toolId="business-plan" />
                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !companyName}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {generating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="h-4 w-4 mr-2" /> Generate {selectedPlanType?.name}</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Plan View Tab */}
            <TabsContent value="plan" className="space-y-6">
              {result && result.data && (
                <>
                  {/* Plan Header */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {result.data.planType || selectedPlanType?.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {result.data.companyName} • Generated {new Date().toLocaleDateString()}
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
                          <Button 
                            size="sm"
                            onClick={() => {
                              const fullPlan = JSON.stringify(result.data, null, 2)
                              handleCopy(fullPlan, 'fullPlan')
                            }}
                          >
                            {copied['fullPlan'] ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            Copy All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Traditional Plan Sections */}
                  {planType === 'traditional' && result.data.executiveSummary && (
                    <Accordion type="single" collapsible defaultValue="executiveSummary" className="space-y-2">
                      {result.data.executiveSummary && (
                        <AccordionItem value="executiveSummary" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <ClipboardList className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold">Executive Summary</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('executiveSummary', result.data.executiveSummary)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.companyDescription && (
                        <AccordionItem value="companyDescription" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-indigo-600" />
                              <span className="font-semibold">Company Description</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('companyDescription', result.data.companyDescription)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.productsAndServices && (
                        <AccordionItem value="productsAndServices" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Layers className="h-5 w-5 text-green-600" />
                              <span className="font-semibold">Products & Services</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('productsAndServices', result.data.productsAndServices)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.marketAnalysis && (
                        <AccordionItem value="marketAnalysis" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-orange-600" />
                              <span className="font-semibold">Market Analysis</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('marketAnalysis', result.data.marketAnalysis)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.marketingPlan && (
                        <AccordionItem value="marketingPlan" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-pink-600" />
                              <span className="font-semibold">Marketing & Sales Strategy</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('marketingPlan', result.data.marketingPlan)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.operationsPlan && (
                        <AccordionItem value="operationsPlan" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Settings className="h-5 w-5 text-gray-600" />
                              <span className="font-semibold">Operations Plan</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('operationsPlan', result.data.operationsPlan)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.managementTeam && (
                        <AccordionItem value="managementTeam" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-purple-600" />
                              <span className="font-semibold">Management & Organization</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('managementTeam', result.data.managementTeam)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      
                      {result.data.financialPlan && (
                        <AccordionItem value="financialPlan" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="font-semibold">Financial Plan</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            {renderSectionContent('financialPlan', result.data.financialPlan)}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  )}

                  {/* Lean Canvas */}
                  {planType === 'lean' && result.data.canvas && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {Object.entries(result.data.canvas).map(([key, section]) => (
                        <Card key={key} className="h-fit">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium capitalize">
                              {section.title || key.replace(/([A-Z])/g, ' $1')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm">
                            {renderSectionContent(key, section)}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Pitch Deck */}
                  {planType === 'pitch' && result.data.slides && (
                    <div className="space-y-4">
                      {result.data.slides.map((slide, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Badge variant="outline">Slide {slide.slideNumber}</Badge>
                              {slide.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {renderSectionContent(`slide-${idx}`, slide.content)}
                            {slide.speakerNotes && (
                              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                                <Label className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Speaker Notes</Label>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{slide.speakerNotes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Tips */}
                  {result.data.tips && (
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                          <Lightbulb className="h-5 w-5" />
                          Tips for Your Business Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.data.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
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
              toolType="business-plan"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[companyName, companyDescription, industry, planType]}
              autoSaveEnabled={true}
              debounceMs={2000}
              minStepForAutoSave={1}
              currentStep={1}
            />
            
            {/* Quick Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                <p>• Be specific with numbers and timelines</p>
                <p>• Address potential risks upfront</p>
                <p>• Show clear path to profitability</p>
                <p>• Highlight team credentials</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
