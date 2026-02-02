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
  Copy, Sparkles, Loader2, Wand2,
  Check, ArrowLeft, TrendingUp, Shield, Target,
  Lightbulb, AlertTriangle, CheckCircle2, ChevronRight, 
  Download, Building2, Zap, BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'
import Link from 'next/link'

// Analysis Types
const ANALYSIS_TYPES = [
  { id: 'business', name: 'Business / Company', icon: '🏢', description: 'Full company analysis' },
  { id: 'product', name: 'Product / Service', icon: '📦', description: 'Product-specific analysis' },
  { id: 'project', name: 'Project / Initiative', icon: '🎯', description: 'Project evaluation' },
  { id: 'personal', name: 'Personal / Career', icon: '👤', description: 'Personal development' },
  { id: 'competitor', name: 'Competitor Analysis', icon: '⚔️', description: 'Analyze competition' },
  { id: 'market', name: 'Market Entry', icon: '🌐', description: 'New market evaluation' }
]

// Industries
const INDUSTRIES = [
  { id: 'technology', name: '💻 Technology / SaaS' },
  { id: 'ecommerce', name: '🛒 E-commerce / Retail' },
  { id: 'finance', name: '💰 Finance / Fintech' },
  { id: 'health', name: '🏥 Healthcare' },
  { id: 'education', name: '📚 Education' },
  { id: 'manufacturing', name: '🏭 Manufacturing' },
  { id: 'services', name: '💼 Professional Services' },
  { id: 'food', name: '🍔 Food & Beverage' },
  { id: 'realestate', name: '🏠 Real Estate' },
  { id: 'media', name: '🎬 Media / Entertainment' },
  { id: 'nonprofit', name: '❤️ Non-Profit' },
  { id: 'other', name: '📋 Other' }
]

// Analysis Depth
const DEPTH_OPTIONS = [
  { id: 'quick', name: 'Quick Analysis', description: '3-4 points per category', time: '~30 sec' },
  { id: 'standard', name: 'Standard Analysis', description: '4-5 points per category', time: '~45 sec' },
  { id: 'comprehensive', name: 'Comprehensive Analysis', description: '5-7 detailed points', time: '~60 sec' }
]

export default function SwotAnalysisPage() {
  const [activeTab, setActiveTab] = useState('create')
  const [generating, setGenerating] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()

  // Form State
  const [analysisType, setAnalysisType] = useState('business')
  const [industry, setIndustry] = useState('technology')
  const [analysisDepth, setAnalysisDepth] = useState('comprehensive')
  
  const [subjectName, setSubjectName] = useState('')
  const [subjectDescription, setSubjectDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [currentSituation, setCurrentSituation] = useState('')
  
  // Optional guidance
  const [knownStrengths, setKnownStrengths] = useState('')
  const [knownWeaknesses, setKnownWeaknesses] = useState('')
  const [potentialOpportunities, setPotentialOpportunities] = useState('')
  const [potentialThreats, setPotentialThreats] = useState('')

  // Results
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (!subjectName) {
      toast({ title: 'Missing Information', description: 'Please enter the subject name', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/swot-analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName, subjectDescription, analysisType, industry,
          objectives, targetMarket, competitors, currentSituation,
          knownStrengths, knownWeaknesses, potentialOpportunities, potentialThreats,
          analysisDepth
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('results')
        
        // Auto-save to library
        try {
          await saveToLibrary({
            type: 'swot-analysis',
            category: 'text',
            title: `SWOT: ${subjectName.substring(0, 40)}`,
            description: `${ANALYSIS_TYPES.find(t => t.id === analysisType)?.name} - ${INDUSTRIES.find(i => i.id === industry)?.name}`,
            content: JSON.stringify(data.data),
            metadata: { analysisType, subjectName, industry, contentType: 'swot-analysis' }
          })
          toast({ title: '📊 SWOT Analysis Generated!', description: '✅ Auto-saved to Library' })
        } catch {
          toast({ title: '📊 SWOT Analysis Generated!' })
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
    toast({ title: 'Generating PDF...', description: 'Please wait' })
    
    try {
      const selectedIndustry = INDUSTRIES.find(i => i.id === industry)?.name || industry
      const selectedType = ANALYSIS_TYPES.find(t => t.id === analysisType)?.name || analysisType
      
      const res = await fetch('/api/swot-analysis/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: result.data,
          metadata: {
            subjectName,
            analysisType: selectedType,
            industry: selectedIndustry
          },
          saveToLibrary: true
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Use client-side PDF generation
        const { default: jsPDF } = await import('jspdf')
        const { default: html2canvas } = await import('html2canvas')
        
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.left = '-9999px'
        iframe.style.width = '1000px'
        iframe.style.height = '1400px'
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.open()
        iframeDoc.write(data.htmlContent)
        iframeDoc.close()
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const body = iframeDoc.body
        const canvas = await html2canvas(body, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: body.scrollHeight
        })
        
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = 210
        const pageHeight = 297
        const imgWidth = pageWidth - 20
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const pageCount = Math.ceil(imgHeight / (pageHeight - 20))
        
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) pdf.addPage()
          pdf.addImage(
            canvas.toDataURL('image/jpeg', 0.92),
            'JPEG',
            10,
            10 - (i * (pageHeight - 20)),
            imgWidth,
            imgHeight
          )
        }
        
        pdf.save(`${subjectName.replace(/\s+/g, '_')}_SWOT_Analysis.pdf`)
        document.body.removeChild(iframe)
        toast({ title: '📥 PDF Downloaded!', description: '✅ Saved to Library' })
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
    title: subjectName ? `SWOT: ${subjectName.substring(0, 50)}` : 'Untitled SWOT Analysis',
    analysisType, industry, analysisDepth,
    subjectName, subjectDescription, objectives, targetMarket,
    competitors, currentSituation,
    knownStrengths, knownWeaknesses, potentialOpportunities, potentialThreats,
    result
  }), [analysisType, industry, analysisDepth, subjectName, subjectDescription, objectives,
    targetMarket, competitors, currentSituation, knownStrengths, knownWeaknesses,
    potentialOpportunities, potentialThreats, result])

  const loadDraftData = useCallback((data) => {
    if (data.analysisType) setAnalysisType(data.analysisType)
    if (data.industry) setIndustry(data.industry)
    if (data.analysisDepth) setAnalysisDepth(data.analysisDepth)
    if (data.subjectName) setSubjectName(data.subjectName)
    if (data.subjectDescription) setSubjectDescription(data.subjectDescription)
    if (data.objectives) setObjectives(data.objectives)
    if (data.targetMarket) setTargetMarket(data.targetMarket)
    if (data.competitors) setCompetitors(data.competitors)
    if (data.currentSituation) setCurrentSituation(data.currentSituation)
    if (data.knownStrengths) setKnownStrengths(data.knownStrengths)
    if (data.knownWeaknesses) setKnownWeaknesses(data.knownWeaknesses)
    if (data.potentialOpportunities) setPotentialOpportunities(data.potentialOpportunities)
    if (data.potentialThreats) setPotentialThreats(data.potentialThreats)
    if (data.result) { setResult(data.result); setActiveTab('results') }
  }, [])

  const handleStartNew = useCallback(() => {
    setAnalysisType('business'); setIndustry('technology'); setAnalysisDepth('comprehensive')
    setSubjectName(''); setSubjectDescription(''); setObjectives(''); setTargetMarket('')
    setCompetitors(''); setCurrentSituation(''); setKnownStrengths(''); setKnownWeaknesses('')
    setPotentialOpportunities(''); setPotentialThreats(''); setResult(null); setActiveTab('create')
  }, [])

  const getImpactBadge = (impact) => {
    if (!impact) return null
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    }
    return <Badge className={colors[impact.toLowerCase()] || 'bg-gray-100'}>{impact}</Badge>
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
              <BarChart3 className="h-7 w-7 text-blue-600" />
              SWOT Analysis Generator
            </h1>
            <Badge className="bg-blue-600 text-white">AI-Powered</Badge>
          </div>
          <p className="text-muted-foreground">Strategic analysis to identify Strengths, Weaknesses, Opportunities & Threats</p>
        </div>
      </div>

      {/* Analysis Type Selection */}
      <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-6 gap-3">
            {ANALYSIS_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  analysisType === type.id
                    ? 'bg-white/20 ring-2 ring-white'
                    : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-bold text-xs">{type.name}</span>
                </div>
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
              <TabsTrigger value="create">📝 Create Analysis</TabsTrigger>
              <TabsTrigger value="results" disabled={!result}>📊 View Results</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-6">
              {/* Subject Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Subject Information
                  </CardTitle>
                  <CardDescription>What are you analyzing?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Subject Name *</Label>
                      <Input
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="e.g., Acme Corporation, Product X, My Career"
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
                    <Label>Description</Label>
                    <Textarea
                      value={subjectDescription}
                      onChange={(e) => setSubjectDescription(e.target.value)}
                      placeholder="Describe what you're analyzing..."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <Label>Objectives / Purpose of Analysis</Label>
                    <Textarea
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      placeholder="What decisions will this analysis inform? What are you trying to achieve?"
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Context & Environment
                  </CardTitle>
                  <CardDescription>Help us understand the bigger picture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Target Market / Audience</Label>
                      <Input
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="Who are you serving?"
                      />
                    </div>
                    <div>
                      <Label>Key Competitors</Label>
                      <Input
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        placeholder="Main competitors or alternatives"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Current Situation</Label>
                    <Textarea
                      value={currentSituation}
                      onChange={(e) => setCurrentSituation(e.target.value)}
                      placeholder="Describe the current state - market position, recent developments, challenges..."
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optional Guidance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Optional: Your Insights
                  </CardTitle>
                  <CardDescription>Share what you already know (AI will expand on these)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <span className="text-green-600">💪</span> Known Strengths
                      </Label>
                      <Textarea
                        value={knownStrengths}
                        onChange={(e) => setKnownStrengths(e.target.value)}
                        placeholder="What do you do well? Competitive advantages?"
                        className="min-h-[80px] border-green-200 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <span className="text-orange-600">⚠️</span> Known Weaknesses
                      </Label>
                      <Textarea
                        value={knownWeaknesses}
                        onChange={(e) => setKnownWeaknesses(e.target.value)}
                        placeholder="What needs improvement? Limitations?"
                        className="min-h-[80px] border-orange-200 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <span className="text-blue-600">🚀</span> Potential Opportunities
                      </Label>
                      <Textarea
                        value={potentialOpportunities}
                        onChange={(e) => setPotentialOpportunities(e.target.value)}
                        placeholder="Market trends? Growth areas?"
                        className="min-h-[80px] border-blue-200 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <span className="text-red-600">🛡️</span> Potential Threats
                      </Label>
                      <Textarea
                        value={potentialThreats}
                        onChange={(e) => setPotentialThreats(e.target.value)}
                        placeholder="Risks? Competition? Market changes?"
                        className="min-h-[80px] border-red-200 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Depth & Generate */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analysis Depth</Label>
                      <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPTH_OPTIONS.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name} ({opt.time})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !subjectName}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {generating ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Wand2 className="h-5 w-5 mr-2" /> Generate SWOT Analysis</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {result && result.data && (
                <>
                  {/* Header */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            {result.data.subjectName} SWOT Analysis
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {result.data.analysisType} • {result.data.industry}
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

                  {/* Executive Summary */}
                  {result.data.executiveSummary && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-800 mb-1">Executive Summary</p>
                            <p className="text-blue-700">{result.data.executiveSummary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* SWOT Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2">
                          💪 {result.data.strengths?.title || 'Strengths'}
                        </CardTitle>
                        <CardDescription className="text-green-100">
                          {result.data.strengths?.subtitle || 'Internal Positive Factors'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-3 pr-4">
                            {result.data.strengths?.items?.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-green-100">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="font-semibold text-green-800">{item.point}</p>
                                  {getImpactBadge(item.impact)}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                {item.strategicImplication && (
                                  <p className="text-xs bg-green-50 p-2 rounded text-green-700">
                                    <strong>Strategy:</strong> {item.strategicImplication}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Weaknesses */}
                    <Card className="border-orange-200 bg-orange-50/50">
                      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2">
                          ⚠️ {result.data.weaknesses?.title || 'Weaknesses'}
                        </CardTitle>
                        <CardDescription className="text-orange-100">
                          {result.data.weaknesses?.subtitle || 'Internal Negative Factors'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-3 pr-4">
                            {result.data.weaknesses?.items?.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-orange-100">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="font-semibold text-orange-800">{item.point}</p>
                                  {getImpactBadge(item.impact)}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                {item.mitigationStrategy && (
                                  <p className="text-xs bg-orange-50 p-2 rounded text-orange-700">
                                    <strong>Mitigation:</strong> {item.mitigationStrategy}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Opportunities */}
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🚀 {result.data.opportunities?.title || 'Opportunities'}
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                          {result.data.opportunities?.subtitle || 'External Positive Factors'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-3 pr-4">
                            {result.data.opportunities?.items?.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="font-semibold text-blue-800">{item.point}</p>
                                  {getImpactBadge(item.impact)}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                {item.captureStrategy && (
                                  <p className="text-xs bg-blue-50 p-2 rounded text-blue-700">
                                    <strong>Capture:</strong> {item.captureStrategy}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Threats */}
                    <Card className="border-red-200 bg-red-50/50">
                      <CardHeader className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🛡️ {result.data.threats?.title || 'Threats'}
                        </CardTitle>
                        <CardDescription className="text-red-100">
                          {result.data.threats?.subtitle || 'External Negative Factors'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-3 pr-4">
                            {result.data.threats?.items?.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-red-100">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="font-semibold text-red-800">{item.point}</p>
                                  {getImpactBadge(item.impact)}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                {item.contingencyPlan && (
                                  <p className="text-xs bg-red-50 p-2 rounded text-red-700">
                                    <strong>Contingency:</strong> {item.contingencyPlan}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Strategic Recommendations */}
                  {result.data.strategicRecommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          Strategic Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {result.data.strategicRecommendations.soStrategies && (
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                              <p className="font-bold text-green-800 mb-1">{result.data.strategicRecommendations.soStrategies.title}</p>
                              <p className="text-xs text-green-600 mb-2">{result.data.strategicRecommendations.soStrategies.description}</p>
                              <ul className="space-y-1">
                                {result.data.strategicRecommendations.soStrategies.strategies?.map((s, i) => (
                                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                                    <span className="text-green-500">→</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.data.strategicRecommendations.woStrategies && (
                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <p className="font-bold text-orange-800 mb-1">{result.data.strategicRecommendations.woStrategies.title}</p>
                              <p className="text-xs text-orange-600 mb-2">{result.data.strategicRecommendations.woStrategies.description}</p>
                              <ul className="space-y-1">
                                {result.data.strategicRecommendations.woStrategies.strategies?.map((s, i) => (
                                  <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                                    <span className="text-orange-500">→</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.data.strategicRecommendations.stStrategies && (
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                              <p className="font-bold text-blue-800 mb-1">{result.data.strategicRecommendations.stStrategies.title}</p>
                              <p className="text-xs text-blue-600 mb-2">{result.data.strategicRecommendations.stStrategies.description}</p>
                              <ul className="space-y-1">
                                {result.data.strategicRecommendations.stStrategies.strategies?.map((s, i) => (
                                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                                    <span className="text-blue-500">→</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.data.strategicRecommendations.wtStrategies && (
                            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                              <p className="font-bold text-red-800 mb-1">{result.data.strategicRecommendations.wtStrategies.title}</p>
                              <p className="text-xs text-red-600 mb-2">{result.data.strategicRecommendations.wtStrategies.description}</p>
                              <ul className="space-y-1">
                                {result.data.strategicRecommendations.wtStrategies.strategies?.map((s, i) => (
                                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                    <span className="text-red-500">→</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Priority Actions */}
                  {result.data.priorityActions && result.data.priorityActions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          Priority Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.data.priorityActions.map((action, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{action.action}</p>
                                <p className="text-sm text-muted-foreground">{action.category} • {action.resources}</p>
                              </div>
                              <Badge className={
                                action.urgency?.toLowerCase() === 'immediate' ? 'bg-red-100 text-red-700' :
                                action.urgency?.toLowerCase() === 'short-term' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }>{action.urgency}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Insights */}
                  {result.data.keyInsights && result.data.keyInsights.length > 0 && (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-purple-800 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {result.data.keyInsights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                              <span className="text-purple-600">✦</span>
                              <p className="text-gray-700">{insight}</p>
                            </div>
                          ))}
                        </div>
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
              toolType="swot-analysis"
              getCurrentData={getCurrentData}
              loadDraftData={loadDraftData}
              onStartNew={handleStartNew}
              dependencies={[subjectName, subjectDescription, industry, analysisType]}
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
                  SWOT Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                <p>• <strong>Strengths:</strong> What do you do well?</p>
                <p>• <strong>Weaknesses:</strong> Where can you improve?</p>
                <p>• <strong>Opportunities:</strong> What trends can you exploit?</p>
                <p>• <strong>Threats:</strong> What obstacles do you face?</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
