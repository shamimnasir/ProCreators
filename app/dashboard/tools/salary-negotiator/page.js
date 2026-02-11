'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  DollarSign, Sparkles, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, MessageSquare,
  Mail, Phone, Shield, Award, ChevronDown, ChevronUp,
  Briefcase, Users, AlertCircle, Check, Zap, Heart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'

const NEGOTIATION_TYPES = [
  { 
    id: 'initial-offer', 
    name: 'Initial Job Offer', 
    icon: '🎯', 
    desc: 'Negotiating your first offer from a new employer',
    tips: 'Best time to negotiate - they want you!'
  },
  { 
    id: 'counter-offer', 
    name: 'Counter Offer', 
    icon: '🔄', 
    desc: 'Responding to an offer with a higher ask',
    tips: 'Use specific numbers, not ranges'
  },
  { 
    id: 'raise-request', 
    name: 'Raise Request', 
    icon: '📈', 
    desc: 'Asking for a salary increase at current job',
    tips: 'Document your achievements first'
  },
  { 
    id: 'promotion', 
    name: 'Promotion Negotiation', 
    icon: '🚀', 
    desc: 'Negotiating salary for a new role/promotion',
    tips: 'Research market rate for new role'
  },
  { 
    id: 'competing-offers', 
    name: 'Competing Offers', 
    icon: '⚖️', 
    desc: 'Leveraging multiple offers',
    tips: 'Be professional - don\'t bluff'
  }
]

const EXPERIENCE_LEVELS = [
  { id: 'entry', name: 'Entry Level (0-2 years)' },
  { id: 'mid', name: 'Mid Level (3-5 years)' },
  { id: 'senior', name: 'Senior (6-10 years)' },
  { id: 'lead', name: 'Lead/Principal (10+ years)' },
  { id: 'executive', name: 'Executive/Director' }
]

const INDUSTRIES = [
  'Technology', 'Finance/Banking', 'Healthcare', 'Consulting', 
  'Manufacturing', 'Retail', 'Education', 'Government', 
  'Startups', 'Non-Profit', 'Legal', 'Marketing/Advertising', 'Other'
]

const BENEFITS_TO_NEGOTIATE = [
  { id: 'signing-bonus', name: 'Signing Bonus', icon: '🎁' },
  { id: 'equity', name: 'Stock/Equity', icon: '📈' },
  { id: 'remote', name: 'Remote Work', icon: '🏠' },
  { id: 'pto', name: 'Extra PTO', icon: '🏖️' },
  { id: 'title', name: 'Better Title', icon: '📛' },
  { id: 'start-date', name: 'Start Date', icon: '📅' },
  { id: 'relocation', name: 'Relocation Package', icon: '🚚' },
  { id: 'education', name: 'Education/Training', icon: '📚' },
  { id: 'performance-bonus', name: 'Performance Bonus', icon: '🏆' },
  { id: 'review-timeline', name: 'Early Review', icon: '⏰' }
]

export default function SalaryNegotiatorPage() {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState({})
  const [activeTab, setActiveTab] = useState('scripts')
  const { toast } = useToast()
  const { checkAndDeduct, refund, complete } = useCredits()
  
  // Form state
  const [negotiationType, setNegotiationType] = useState('initial-offer')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [yearsExperience, setYearsExperience] = useState('')
  const [location, setLocation] = useState('')
  
  const [currentSalary, setCurrentSalary] = useState('')
  const [offeredSalary, setOfferedSalary] = useState('')
  const [targetSalary, setTargetSalary] = useState('')
  const [marketRate, setMarketRate] = useState('')
  
  const [hasCompetingOffer, setHasCompetingOffer] = useState(false)
  const [competingOfferAmount, setCompetingOfferAmount] = useState('')
  const [competingCompany, setCompetingCompany] = useState('')
  
  const [selectedBenefits, setSelectedBenefits] = useState([])
  const [keyAchievements, setKeyAchievements] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')
  const [concerns, setConcerns] = useState('')
  const [negotiatorStyle, setNegotiatorStyle] = useState('collaborative')

  const toggleBenefit = (benefitId) => {
    setSelectedBenefits(prev => 
      prev.includes(benefitId) 
        ? prev.filter(b => b !== benefitId)
        : [...prev, benefitId]
    )
  }

  const handleGenerate = async () => {
    if (!jobTitle) {
      toast({ 
        title: 'Missing Information', 
        description: 'Please provide at least the job title', 
        variant: 'destructive' 
      })
      return
    }
    
    setGenerating(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/salary-negotiator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationType,
          jobTitle,
          companyName,
          industry,
          experienceLevel,
          yearsExperience,
          location,
          currentSalary,
          offeredSalary,
          targetSalary,
          marketRate,
          hasCompetingOffer,
          competingOfferAmount,
          competingCompany,
          selectedBenefits,
          keyAchievements,
          uniqueValue,
          concerns,
          negotiatorStyle
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        
        // Auto-save to library
        try {
          const negotiationType = NEGOTIATION_TYPES.find(t => t.id === type)
          await saveToLibrary({
            type: 'salary-negotiation',
            category: 'text',
            title: `Salary Negotiation: ${jobTitle || 'Position'}`,
            description: `${negotiationType?.name || 'Salary'} negotiation strategy for ${jobTitle || 'position'}`,
            content: JSON.stringify(data.data),
            metadata: {
              negotiationType: type,
              jobTitle,
              industry,
              currentSalary,
              offeredSalary,
              targetSalary,
              experienceYears,
              contentType: 'salary-negotiation'
            }
          })
          console.log('Salary negotiation auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save salary negotiation:', saveError)
        }
        
        toast({ title: '💰 Negotiation Strategy Ready!' })
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

  const formatCurrency = (value) => {
    if (!value) return ''
    const num = value.replace(/[^0-9]/g, '')
    return num ? `$${parseInt(num).toLocaleString()}` : ''
  }

  const handleCurrencyInput = (setter) => (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setter(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-500" />
            Salary Negotiation Helper
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered scripts and strategies for better offers</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <TrendingUp className="h-3 w-3 mr-1" />Avg +15% Results
        </Badge>
      </div>

      {!result ? (
        <>
          {/* Tips Banner */}
          <Alert className="bg-green-50 border-green-200">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Pro Tip:</strong> Research shows that 70% of employers expect candidates to negotiate. Those who do earn an average of $5,000 more per year.
            </AlertDescription>
          </Alert>

          {/* Negotiation Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">1</span>
                What are you negotiating?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {NEGOTIATION_TYPES.map(type => (
                  <Button
                    key={type.id}
                    variant={negotiationType === type.id ? 'default' : 'outline'}
                    className={`h-auto py-4 flex flex-col items-start text-left ${negotiationType === type.id ? 'ring-2 ring-green-500 bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setNegotiationType(type.id)}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="font-semibold">{type.name}</span>
                    <span className="text-xs opacity-70 font-normal mt-1">{type.desc}</span>
                    {negotiationType === type.id && (
                      <span className="text-xs mt-2 bg-white/20 px-2 py-1 rounded">💡 {type.tips}</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Job Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">2</span>
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Job Title *</Label>
                      <Input 
                        placeholder="e.g., Senior Software Engineer" 
                        value={jobTitle} 
                        onChange={(e) => setJobTitle(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <Input 
                        placeholder="e.g., Google" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g., San Francisco, CA" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Experience Level</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map(level => (
                            <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Years of Relevant Experience</Label>
                      <Input 
                        placeholder="e.g., 7" 
                        value={yearsExperience} 
                        onChange={(e) => setYearsExperience(e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">3</span>
                    Salary Numbers
                  </CardTitle>
                  <CardDescription>Enter what you know - more data = better strategy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(negotiationType === 'raise-request' || negotiationType === 'promotion') && (
                      <div>
                        <Label>Current Salary</Label>
                        <Input 
                          placeholder="$80,000" 
                          value={formatCurrency(currentSalary)} 
                          onChange={handleCurrencyInput(setCurrentSalary)} 
                        />
                      </div>
                    )}
                    {(negotiationType === 'initial-offer' || negotiationType === 'counter-offer' || negotiationType === 'competing-offers') && (
                      <div>
                        <Label>Offered Salary</Label>
                        <Input 
                          placeholder="$95,000" 
                          value={formatCurrency(offeredSalary)} 
                          onChange={handleCurrencyInput(setOfferedSalary)} 
                        />
                      </div>
                    )}
                    <div>
                      <Label>Your Target Salary</Label>
                      <Input 
                        placeholder="$110,000" 
                        value={formatCurrency(targetSalary)} 
                        onChange={handleCurrencyInput(setTargetSalary)} 
                      />
                    </div>
                    <div>
                      <Label>Market Rate (if known)</Label>
                      <Input 
                        placeholder="$100,000 - $120,000" 
                        value={marketRate} 
                        onChange={(e) => setMarketRate(e.target.value)} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Check Glassdoor, Levels.fyi, LinkedIn</p>
                    </div>
                  </div>

                  {/* Competing Offer Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="competing-offer"
                        checked={hasCompetingOffer}
                        onChange={(e) => setHasCompetingOffer(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="competing-offer" className="cursor-pointer">I have a competing offer</Label>
                    </div>
                    {hasCompetingOffer && (
                      <div className="grid grid-cols-2 gap-3 bg-yellow-50 p-3 rounded-lg">
                        <div>
                          <Label>Competing Offer Amount</Label>
                          <Input 
                            placeholder="$105,000" 
                            value={formatCurrency(competingOfferAmount)} 
                            onChange={handleCurrencyInput(setCompetingOfferAmount)} 
                          />
                        </div>
                        <div>
                          <Label>Company Name</Label>
                          <Input 
                            placeholder="e.g., Meta" 
                            value={competingCompany} 
                            onChange={(e) => setCompetingCompany(e.target.value)} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Your Value & Preferences */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">4</span>
                    Your Value Proposition
                  </CardTitle>
                  <CardDescription>Help us craft compelling arguments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Key Achievements (with metrics if possible)</Label>
                    <Textarea 
                      placeholder="• Increased revenue by 40% through new feature launch\n• Led team of 8 engineers to deliver $2M project\n• Reduced customer churn by 25%"
                      className="min-h-[100px]"
                      value={keyAchievements} 
                      onChange={(e) => setKeyAchievements(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>What makes you uniquely valuable?</Label>
                    <Textarea 
                      placeholder="e.g., Rare combination of technical skills and business acumen, domain expertise in fintech, specific certifications..."
                      className="min-h-[80px]"
                      value={uniqueValue} 
                      onChange={(e) => setUniqueValue(e.target.value)} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">5</span>
                    Other Benefits to Negotiate
                  </CardTitle>
                  <CardDescription>If salary is fixed, these can add significant value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {BENEFITS_TO_NEGOTIATE.map(benefit => (
                      <Button
                        key={benefit.id}
                        variant={selectedBenefits.includes(benefit.id) ? 'default' : 'outline'}
                        size="sm"
                        className={`justify-start ${selectedBenefits.includes(benefit.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => toggleBenefit(benefit.id)}
                      >
                        <span className="mr-2">{benefit.icon}</span>
                        {benefit.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Negotiation Style */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">6</span>
                    Your Negotiation Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'collaborative', name: 'Collaborative', icon: '🤝', desc: 'Win-win approach' },
                      { id: 'assertive', name: 'Assertive', icon: '💪', desc: 'Direct & confident' },
                      { id: 'analytical', name: 'Analytical', icon: '📊', desc: 'Data-driven' }
                    ].map(style => (
                      <Button
                        key={style.id}
                        variant={negotiatorStyle === style.id ? 'default' : 'outline'}
                        className={`h-auto py-3 flex flex-col ${negotiatorStyle === style.id ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-500' : ''}`}
                        onClick={() => setNegotiatorStyle(style.id)}
                      >
                        <span className="text-xl mb-1">{style.icon}</span>
                        <span className="font-medium">{style.name}</span>
                        <span className="text-xs opacity-70">{style.desc}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Options */}
          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Any concerns or constraints?</Label>
                  <Textarea 
                    placeholder="e.g., They said budget is tight, I really need this job, timeline pressure..."
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <div className="flex items-center gap-3">

            <CreditCostBadge toolId="salary-negotiator" />

            <Button 
            size="lg" 
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg"
            onClick={handleGenerate}
            disabled={generating || !jobTitle}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Crafting Your Strategy...</>
            ) : (
              <><Wand2 className="mr-2 h-6 w-6" />Generate Negotiation Strategy</>         
            )}
          </Button>

          </div>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your Negotiation Strategy</h2>
            <Button variant="outline" onClick={() => setResult(null)}>
              <RefreshCw className="h-4 w-4 mr-2" />Start Over
            </Button>
          </div>

          {/* Strategy Overview */}
          {result.overview && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Target className="h-5 w-5" />
                  Strategy Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {result.overview.recommendedRange && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Recommended Ask</p>
                      <p className="text-2xl font-bold text-green-700">{result.overview.recommendedRange}</p>
                    </div>
                  )}
                  {result.overview.walkAwayNumber && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Walk Away Below</p>
                      <p className="text-2xl font-bold text-red-600">{result.overview.walkAwayNumber}</p>
                    </div>
                  )}
                  {result.overview.anchorNumber && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Anchor High At</p>
                      <p className="text-2xl font-bold text-blue-600">{result.overview.anchorNumber}</p>
                    </div>
                  )}
                </div>
                {result.overview.strategyStatement && (
                  <p className="text-green-800 bg-white p-4 rounded-lg">{result.overview.strategyStatement}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="scripts" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />Scripts
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />Email
              </TabsTrigger>
              <TabsTrigger value="objections" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />Objections
              </TabsTrigger>
              <TabsTrigger value="tactics" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />Tactics
              </TabsTrigger>
            </TabsList>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="space-y-4 mt-4">
              {result.scripts?.opening && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">🎬</span> Opening Statement
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.scripts.opening, 'opening')}
                      >
                        {copied.opening ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {result.scripts.opening}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.scripts?.askingForMore && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">💰</span> Asking for More
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.scripts.askingForMore, 'askingForMore')}
                      >
                        {copied.askingForMore ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {result.scripts.askingForMore}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.scripts?.valueProposition && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">⭐</span> Value Proposition Statement
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.scripts.valueProposition, 'valueProposition')}
                      >
                        {copied.valueProposition ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {result.scripts.valueProposition}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.scripts?.closingTheNegotiation && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">🤝</span> Closing the Negotiation
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.scripts.closingTheNegotiation, 'closingTheNegotiation')}
                      >
                        {copied.closingTheNegotiation ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {result.scripts.closingTheNegotiation}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-4 mt-4">
              {result.emailTemplates?.counterOffer && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" /> Counter Offer Email
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.emailTemplates.counterOffer, 'counterEmail')}
                      >
                        {copied.counterEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap font-mono text-sm">
                      {result.emailTemplates.counterOffer}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.emailTemplates?.followUp && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" /> Follow-Up Email
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.emailTemplates.followUp, 'followUpEmail')}
                      >
                        {copied.followUpEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap font-mono text-sm">
                      {result.emailTemplates.followUp}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.emailTemplates?.acceptance && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5" /> Acceptance Email
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopy(result.emailTemplates.acceptance, 'acceptanceEmail')}
                      >
                        {copied.acceptanceEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap font-mono text-sm">
                      {result.emailTemplates.acceptance}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Objections Tab */}
            <TabsContent value="objections" className="space-y-4 mt-4">
              {result.objectionHandling && result.objectionHandling.map((obj, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      "{obj.objection}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Your Response:</p>
                      <div className="bg-green-50 p-4 rounded-lg text-gray-800 border-l-4 border-green-500">
                        {obj.response}
                      </div>
                    </div>
                    {obj.followUp && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Follow-up:</p>
                        <p className="text-gray-700 italic">{obj.followUp}</p>
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopy(`Objection: ${obj.objection}\n\nResponse: ${obj.response}`, `obj-${idx}`)}
                    >
                      {copied[`obj-${idx}`] ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      Copy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Tactics Tab */}
            <TabsContent value="tactics" className="space-y-4 mt-4">
              {result.tactics && (
                <div className="grid md:grid-cols-2 gap-4">
                  {result.tactics.map((tactic, idx) => (
                    <Card key={idx} className="border-l-4 border-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-xl">{tactic.icon || '💡'}</span>
                          {tactic.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{tactic.description}</p>
                        {tactic.example && (
                          <div className="mt-3 bg-blue-50 p-3 rounded text-sm">
                            <p className="font-medium text-blue-800">Example:</p>
                            <p className="text-blue-700 italic">"{tactic.example}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Benefits Negotiation */}
              {result.benefitsNegotiation && result.benefitsNegotiation.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      If Salary is Fixed, Negotiate These
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.benefitsNegotiation.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{benefit.icon}</span>
                          <div>
                            <p className="font-medium">{benefit.benefit}</p>
                            <p className="text-sm text-gray-600">{benefit.script}</p>
                            {benefit.estimatedValue && (
                              <Badge variant="secondary" className="mt-1">
                                Estimated Value: {benefit.estimatedValue}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Do's and Don'ts */}
          {result.dosAndDonts && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />Do's
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.dosAndDonts.dos?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-800">
                        <Check className="h-4 w-4 mt-1 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />Don'ts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.dosAndDonts.donts?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-800">
                        <span className="h-4 w-4 mt-1 shrink-0">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Success Message */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Your negotiation toolkit is ready!</h3>
                  <p className="text-green-700">Review the scripts, practice them out loud, and remember: confidence is key!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
