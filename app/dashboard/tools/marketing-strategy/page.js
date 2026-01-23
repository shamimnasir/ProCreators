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
import { 
  Target, Copy, Sparkles, Loader2, Wand2, RefreshCw,
  Check, ArrowLeft, TrendingUp, Users, BarChart3,
  Lightbulb, Building2, DollarSign, Calendar, Layers,
  PieChart, ArrowUpRight, ArrowDownRight, Minus, Shield,
  Zap, Globe, Megaphone, Heart, Brain, CheckCircle2,
  AlertTriangle, FileText, Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'
import Link from 'next/link'

// Marketing Frameworks
const FRAMEWORKS = [
  { 
    id: 'complete', 
    name: 'Complete Marketing Plan', 
    description: 'Full 12-month plan with all components',
    icon: '📋',
    time: '~2 min',
    bestFor: 'Comprehensive planning'
  },
  { 
    id: '7ps', 
    name: 'Marketing Mix (7 Ps)', 
    description: 'Product, Price, Promotion, Place, People, Process, Physical Evidence',
    icon: '🎯',
    time: '~1 min',
    bestFor: 'Strategic positioning'
  },
  { 
    id: 'stp', 
    name: 'STP Model', 
    description: 'Segmentation, Targeting, Positioning',
    icon: '🎪',
    time: '~1 min',
    bestFor: 'Market focus'
  },
  { 
    id: 'ansoff', 
    name: 'Ansoff Growth Matrix', 
    description: 'Growth strategy options',
    icon: '📈',
    time: '~1 min',
    bestFor: 'Growth planning'
  },
  { 
    id: 'funnel', 
    name: 'Full-Funnel Strategy', 
    description: 'Awareness to Advocacy journey',
    icon: '🔽',
    time: '~1 min',
    bestFor: 'Customer journey'
  }
]

// Industries
const INDUSTRIES = [
  { id: 'saas', name: 'SaaS / Software' },
  { id: 'ecommerce', name: 'E-commerce / Retail' },
  { id: 'service', name: 'Professional Services' },
  { id: 'health', name: 'Healthcare / Wellness' },
  { id: 'finance', name: 'Finance / Fintech' },
  { id: 'education', name: 'Education / EdTech' },
  { id: 'food', name: 'Food & Beverage' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'travel', name: 'Travel & Hospitality' },
  { id: 'manufacturing', name: 'Manufacturing / B2B' },
  { id: 'nonprofit', name: 'Nonprofit / NGO' },
  { id: 'other', name: 'Other' }
]

// Business Stages
const BUSINESS_STAGES = [
  { id: 'startup', name: 'Startup (0-2 years)', icon: '🚀' },
  { id: 'growth', name: 'Growth Stage (2-5 years)', icon: '📈' },
  { id: 'established', name: 'Established (5+ years)', icon: '🏢' },
  { id: 'enterprise', name: 'Enterprise / Corporation', icon: '🏛️' }
]

// Budget Ranges
const BUDGET_RANGES = [
  { id: 'micro', name: '$0 - $5K/month', icon: '💵' },
  { id: 'small', name: '$5K - $20K/month', icon: '💰' },
  { id: 'medium', name: '$20K - $100K/month', icon: '💎' },
  { id: 'large', name: '$100K+/month', icon: '🏆' }
]

export default function MarketingStrategyPage() {
  const [activeTab, setActiveTab] = useState('setup')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState({})
  const { toast } = useToast()

  // Form State
  const [framework, setFramework] = useState('complete')
  const [businessName, setBusinessName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [industry, setIndustry] = useState('saas')
  const [businessStage, setBusinessStage] = useState('growth')
  const [targetAudience, setTargetAudience] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [currentChallenges, setCurrentChallenges] = useState('')
  const [goals, setGoals] = useState('')
  const [budget, setBudget] = useState('small')
  const [timeline, setTimeline] = useState('12 months')
  const [existingChannels, setExistingChannels] = useState('')
  const [uniqueValue, setUniqueValue] = useState('')

  // Results
  const [result, setResult] = useState(null)
  const [resultTab, setResultTab] = useState('overview')

  const handleGenerate = async () => {
    if (!businessName || !businessDescription) {
      toast({ title: 'Missing Information', description: 'Please enter business name and description', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/marketing-strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessDescription,
          industry,
          businessStage,
          targetAudience,
          competitors,
          currentChallenges,
          goals,
          budget,
          timeline,
          framework,
          existingChannels,
          uniqueValue
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
        setActiveTab('results')
        setResultTab('overview')
        
        // Auto-save to library
        try {
          const saveResult = await saveToLibrary({
            type: 'marketing-strategy',
            category: 'text',
            title: `Marketing Strategy: ${businessName.substring(0, 40)}`,
            description: `${data.metadata.framework} for ${industry}`,
            content: JSON.stringify(data.data),
            metadata: {
              framework: data.metadata.framework,
              industry,
              businessStage,
              budget,
              contentType: 'marketing-strategy'
            }
          })
          if (saveResult.success) {
            toast({ title: '📊 Marketing Strategy Generated!', description: '✅ Auto-saved to Library' })
          } else {
            toast({ title: '📊 Marketing Strategy Generated!' })
          }
        } catch (saveError) {
          console.error('Failed to auto-save:', saveError)
          toast({ title: '📊 Marketing Strategy Generated!' })
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
    const textToCopy = typeof text === 'object' ? JSON.stringify(text, null, 2) : text
    navigator.clipboard.writeText(textToCopy)
    setCopied(prev => ({ ...prev, [key]: true }))
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }, [toast])

  const exportStrategy = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${businessName.replace(/\s+/g, '_')}_marketing_strategy.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Strategy exported as JSON!' })
  }

  // Export to PDF
  const exportToPDF = async () => {
    if (!result) return
    
    // Create a printable HTML document
    const printContent = generatePrintableHTML()
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    toast({ title: 'PDF export opened! Use Print dialog to save as PDF' })
  }

  const generatePrintableHTML = () => {
    const data = result.data
    const meta = result.metadata
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${businessName} - Marketing Strategy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
    .logo { font-size: 32px; margin-bottom: 10px; }
    .title { font-size: 28px; font-weight: bold; color: #1e40af; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
    .meta { display: flex; justify-content: center; gap: 20px; margin-top: 15px; font-size: 12px; color: #64748b; }
    .meta span { background: #f1f5f9; padding: 4px 12px; border-radius: 4px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
    .section-icon { font-size: 20px; }
    .card { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; }
    .card-title { font-weight: bold; margin-bottom: 10px; color: #334155; }
    .card-content { font-size: 14px; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .swot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .swot-item { padding: 15px; border-radius: 8px; }
    .swot-strengths { background: #dcfce7; border-left: 4px solid #22c55e; }
    .swot-weaknesses { background: #fee2e2; border-left: 4px solid #ef4444; }
    .swot-opportunities { background: #dbeafe; border-left: 4px solid #3b82f6; }
    .swot-threats { background: #fed7aa; border-left: 4px solid #f97316; }
    .swot-title { font-weight: bold; margin-bottom: 8px; font-size: 14px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 5px; font-size: 13px; }
    .highlight { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; font-style: italic; border-left: 4px solid #3b82f6; }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    .timeline-item { display: flex; gap: 15px; margin-bottom: 15px; }
    .timeline-marker { width: 30px; height: 30px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0; }
    .timeline-content { flex: 1; background: #f1f5f9; padding: 15px; border-radius: 8px; }
    .kpi-item { background: #f0fdf4; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #22c55e; }
    .kpi-metric { font-weight: bold; color: #166534; }
    .kpi-target { color: #15803d; font-size: 13px; }
    @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📊</div>
    <div class="title">${businessName}</div>
    <div class="subtitle">${meta?.framework || 'Marketing Strategy'}</div>
    <div class="meta">
      <span>📅 ${date}</span>
      <span>🏢 ${meta?.industry || industry}</span>
      <span>💰 ${meta?.budget || budget}</span>
    </div>
  </div>

  ${data.executiveSummary ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">✨</span> Executive Summary</div>
    <div class="card">
      <div class="card-title">Mission</div>
      <div class="card-content">${data.executiveSummary.mission || ''}</div>
    </div>
    <div class="card">
      <div class="card-title">Vision</div>
      <div class="card-content">${data.executiveSummary.vision || ''}</div>
    </div>
    <div class="card">
      <div class="card-title">Marketing Objective</div>
      <div class="card-content">${data.executiveSummary.marketingObjective || ''}</div>
    </div>
    ${data.executiveSummary.keyStrategies ? `
    <div class="card">
      <div class="card-title">Key Strategies</div>
      <ul>
        ${data.executiveSummary.keyStrategies.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.positioning ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📣</span> Brand Positioning</div>
    <div class="highlight">${data.positioning.positioningStatement || ''}</div>
    <div class="card">
      <div class="card-title">Unique Value Proposition</div>
      <div class="card-content">${data.positioning.uniqueValueProposition || ''}</div>
    </div>
    ${data.positioning.keyMessages ? `
    <div class="card">
      <div class="card-title">Key Messages</div>
      <ul>
        ${data.positioning.keyMessages.map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.situationAnalysis?.swot ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🧠</span> SWOT Analysis</div>
    <div class="swot-grid">
      <div class="swot-item swot-strengths">
        <div class="swot-title">💪 Strengths</div>
        <ul>${data.situationAnalysis.swot.strengths?.map(s => `<li>${s}</li>`).join('') || ''}</ul>
      </div>
      <div class="swot-item swot-weaknesses">
        <div class="swot-title">⚠️ Weaknesses</div>
        <ul>${data.situationAnalysis.swot.weaknesses?.map(w => `<li>${w}</li>`).join('') || ''}</ul>
      </div>
      <div class="swot-item swot-opportunities">
        <div class="swot-title">🚀 Opportunities</div>
        <ul>${data.situationAnalysis.swot.opportunities?.map(o => `<li>${o}</li>`).join('') || ''}</ul>
      </div>
      <div class="swot-item swot-threats">
        <div class="swot-title">🛡️ Threats</div>
        <ul>${data.situationAnalysis.swot.threats?.map(t => `<li>${t}</li>`).join('') || ''}</ul>
      </div>
    </div>
  </div>
  ` : ''}

  ${data.targetAudience?.primaryPersona ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">👥</span> Target Audience</div>
    <div class="card">
      <div class="card-title">Primary Persona: ${data.targetAudience.primaryPersona.name || ''}</div>
      <div class="card-content">
        <p><strong>Demographics:</strong> ${data.targetAudience.primaryPersona.demographics || ''}</p>
        <p><strong>Psychographics:</strong> ${data.targetAudience.primaryPersona.psychographics || ''}</p>
        ${data.targetAudience.primaryPersona.painPoints ? `<p><strong>Pain Points:</strong> ${data.targetAudience.primaryPersona.painPoints.join(', ')}</p>` : ''}
        ${data.targetAudience.primaryPersona.goals ? `<p><strong>Goals:</strong> ${data.targetAudience.primaryPersona.goals.join(', ')}</p>` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.smartGoals ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎯</span> SMART Goals</div>
    ${data.smartGoals.map(g => `
    <div class="card">
      <div class="card-title">${g.goal}</div>
      <div class="card-content">
        <p><strong>Metric:</strong> ${g.metric}</p>
        <p><strong>Target:</strong> ${g.target}</p>
        <p><strong>Deadline:</strong> ${g.deadline}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.implementationTimeline ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📅</span> Implementation Timeline</div>
    ${['quarter1', 'quarter2', 'quarter3', 'quarter4'].map((q, i) => {
      const qData = data.implementationTimeline[q]
      if (!qData) return ''
      return `
      <div class="timeline-item">
        <div class="timeline-marker">Q${i+1}</div>
        <div class="timeline-content">
          <div class="card-title">${qData.theme || ''}</div>
          ${qData.priorities ? `<p><strong>Priorities:</strong> ${qData.priorities.join(', ')}</p>` : ''}
          ${qData.milestones ? `<p><strong>Milestones:</strong> ${qData.milestones.join(', ')}</p>` : ''}
        </div>
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  ${data.kpis ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📈</span> Key Performance Indicators</div>
    <div class="grid">
      <div>
        <div class="card-title">Primary KPIs</div>
        ${data.kpis.primary?.map(k => `
        <div class="kpi-item">
          <div class="kpi-metric">${k.metric}</div>
          <div class="kpi-target">Target: ${k.target} | ${k.frequency}</div>
        </div>
        `).join('') || ''}
      </div>
      <div>
        <div class="card-title">Secondary KPIs</div>
        ${data.kpis.secondary?.map(k => `
        <div class="kpi-item">
          <div class="kpi-metric">${k.metric}</div>
          <div class="kpi-target">Target: ${k.target} | ${k.frequency}</div>
        </div>
        `).join('') || ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.nextSteps ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">⚡</span> Immediate Next Steps</div>
    ${data.nextSteps.map((s, i) => `
    <div class="card">
      <div class="card-content">
        <span class="badge">${i + 1}</span>
        <strong>${s.action}</strong>
        <br><small>Deadline: ${s.deadline} | Owner: ${s.owner}</small>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated with Marketing Strategy AI</p>
    <p>© ${new Date().getFullYear()} ${businessName}</p>
  </div>
</body>
</html>
    `
  }

  const selectedFramework = FRAMEWORKS.find(f => f.id === framework)

  // Render SWOT Analysis
  const renderSWOT = (swot) => {
    if (!swot) return null
    const items = [
      { key: 'strengths', label: 'Strengths', icon: '💪', color: 'bg-green-100 dark:bg-green-900/30 border-green-500' },
      { key: 'weaknesses', label: 'Weaknesses', icon: '⚠️', color: 'bg-red-100 dark:bg-red-900/30 border-red-500' },
      { key: 'opportunities', label: 'Opportunities', icon: '🚀', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' },
      { key: 'threats', label: 'Threats', icon: '🛡️', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500' }
    ]
    return (
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.key} className={`p-4 rounded-lg border-l-4 ${item.color}`}>
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <span>{item.icon}</span> {item.label}
            </h4>
            <ul className="space-y-1">
              {swot[item.key]?.map((s, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  // Render Budget Breakdown
  const renderBudgetBreakdown = (budgetData) => {
    if (!budgetData?.breakdown) return null
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
    return (
      <div className="space-y-3">
        {budgetData.breakdown.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.category}</span>
              <span className="text-muted-foreground">{item.percentage}%</span>
            </div>
            <Progress value={item.percentage} className={`h-2 ${colors[idx % colors.length]}`} />
            <p className="text-xs text-muted-foreground">{item.notes}</p>
          </div>
        ))}
      </div>
    )
  }

  // Render Timeline
  const renderTimeline = (timelineData) => {
    if (!timelineData) return null
    const quarters = ['quarter1', 'quarter2', 'quarter3', 'quarter4']
    const labels = ['Q1', 'Q2', 'Q3', 'Q4']
    return (
      <div className="space-y-4">
        {quarters.map((q, idx) => {
          const data = timelineData[q]
          if (!data) return null
          return (
            <div key={q} className="relative pl-8 pb-4 border-l-2 border-blue-300 last:border-0">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                {idx + 1}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <Badge className="mb-2">{labels[idx]}: {data.theme}</Badge>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Priorities:</p>
                    <ul className="text-sm">
                      {data.priorities?.map((p, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 mt-1 text-green-500" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {data.milestones && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Milestones:</p>
                      <ul className="text-sm">
                        {data.milestones.map((m, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Target className="h-3 w-3 mt-1 text-blue-500" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render Funnel
  const renderFunnel = (funnelData) => {
    if (!funnelData) return null
    const stages = [
      { key: 'awareness', label: 'Awareness', icon: '👁️', color: 'bg-purple-100 dark:bg-purple-900/30', width: 'w-full' },
      { key: 'consideration', label: 'Consideration', icon: '🤔', color: 'bg-blue-100 dark:bg-blue-900/30', width: 'w-[85%]' },
      { key: 'decision', label: 'Decision', icon: '✅', color: 'bg-green-100 dark:bg-green-900/30', width: 'w-[70%]' },
      { key: 'retention', label: 'Retention', icon: '💎', color: 'bg-orange-100 dark:bg-orange-900/30', width: 'w-[55%]' },
      { key: 'advocacy', label: 'Advocacy', icon: '📣', color: 'bg-pink-100 dark:bg-pink-900/30', width: 'w-[40%]' }
    ]
    return (
      <div className="space-y-3">
        {stages.map(stage => {
          const data = funnelData[stage.key]
          if (!data) return null
          return (
            <div key={stage.key} className={`${stage.width} mx-auto`}>
              <div className={`p-4 rounded-lg ${stage.color} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{stage.icon}</span>
                  <h4 className="font-bold">{stage.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{data.objective || data.goal}</p>
                {data.tactics && (
                  <div className="flex flex-wrap gap-1">
                    {data.tactics.slice(0, 3).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
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
              <BarChart3 className="h-7 w-7 text-blue-500" />
              Marketing Strategy AI
            </h1>
            <Badge className="bg-blue-500 text-white">Pro</Badge>
          </div>
          <p className="text-muted-foreground">Generate comprehensive marketing strategies and plans</p>
        </div>
      </div>

      {/* Framework Banner */}
      <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {FRAMEWORKS.map(f => (
              <div key={f.id} className="cursor-pointer hover:bg-white/10 rounded-lg p-2 transition-all" onClick={() => setFramework(f.id)}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs font-medium">{f.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="setup">📝 Setup</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>📊 Results</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Framework Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    Strategy Framework
                  </CardTitle>
                  <CardDescription>Choose your strategic approach</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {FRAMEWORKS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFramework(f.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        framework === f.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-muted hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{f.icon}</span>
                          <div>
                            <span className="font-medium text-sm">{f.name}</span>
                            <p className="text-[10px] text-muted-foreground">{f.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[9px]">{f.time}</Badge>
                          {framework === f.id && <Check className="h-4 w-4 text-blue-500 mt-1" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Business Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Business Name *</Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., TechFlow Solutions"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Business Description *</Label>
                    <Textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Describe your product/service, what you sell, and your value proposition..."
                      className="min-h-[100px]"
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
                          {INDUSTRIES.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Business Stage</Label>
                      <Select value={businessStage} onValueChange={setBusinessStage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_STAGES.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Unique Value Proposition</Label>
                    <Input
                      value={uniqueValue}
                      onChange={(e) => setUniqueValue(e.target.value)}
                      placeholder="What makes you different from competitors?"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Market & Audience */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Market & Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Target Audience</Label>
                    <Textarea
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Describe your ideal customers: demographics, behaviors, pain points..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Main Competitors</Label>
                    <Textarea
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      placeholder="List your main competitors (comma-separated)"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current Marketing Channels</Label>
                    <Input
                      value={existingChannels}
                      onChange={(e) => setExistingChannels(e.target.value)}
                      placeholder="e.g., Website, LinkedIn, Google Ads, Email..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Budget */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Goals & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Business Goals</Label>
                    <Textarea
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="What do you want to achieve? e.g., Increase revenue by 50%, acquire 1000 new customers..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current Challenges</Label>
                    <Textarea
                      value={currentChallenges}
                      onChange={(e) => setCurrentChallenges(e.target.value)}
                      placeholder="What marketing challenges are you facing?"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Marketing Budget</Label>
                      <Select value={budget} onValueChange={setBudget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_RANGES.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.icon} {b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Timeline</Label>
                      <Select value={timeline} onValueChange={setTimeline}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3 months">3 months</SelectItem>
                          <SelectItem value="6 months">6 months</SelectItem>
                          <SelectItem value="12 months">12 months</SelectItem>
                          <SelectItem value="24 months">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={generating || !businessName || !businessDescription}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {selectedFramework?.name}...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Generate {selectedFramework?.name}</>  
                )}
              </Button>

              {/* Framework Info */}
              {selectedFramework && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{selectedFramework.icon}</span>
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">{selectedFramework.name}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{selectedFramework.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">Best for: {selectedFramework.bestFor}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result && result.data && (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    📊 {result.metadata?.framework || 'Marketing Strategy'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {businessName} • {result.metadata?.industry} • Generated {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportStrategy}>
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                  <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                  </Button>
                </div>
              </div>

              {/* Results Tabs for Complete Plan */}
              {framework === 'complete' && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {['overview', 'analysis', 'audience', 'strategy', 'channels', 'funnel', 'budget', 'timeline', 'kpis'].map(tab => (
                      <Button
                        key={tab}
                        variant={resultTab === tab ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResultTab(tab)}
                        className={resultTab === tab ? 'bg-blue-600' : ''}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Overview Tab */}
                  {resultTab === 'overview' && result.data.executiveSummary && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Mission</Label>
                            <p className="text-sm font-medium">{result.data.executiveSummary.mission}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Vision</Label>
                            <p className="text-sm">{result.data.executiveSummary.vision}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Marketing Objective</Label>
                            <p className="text-sm">{result.data.executiveSummary.marketingObjective}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Key Strategies
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.executiveSummary.keyStrategies?.map((strategy, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Badge className="bg-blue-500">{idx + 1}</Badge>
                                <span className="text-sm">{strategy}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Positioning */}
                      {result.data.positioning && (
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Megaphone className="h-5 w-5 text-purple-500" />
                              Brand Positioning
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                              <Label className="text-xs text-purple-600 dark:text-purple-400">Positioning Statement</Label>
                              <p className="text-sm font-medium italic mt-1">{result.data.positioning.positioningStatement}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Unique Value Proposition</Label>
                                <p className="text-sm">{result.data.positioning.uniqueValueProposition}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Brand Voice</Label>
                                <p className="text-sm">{result.data.positioning.brandVoice}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Key Messages</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {result.data.positioning.keyMessages?.map((msg, idx) => (
                                  <Badge key={idx} variant="outline">{msg}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Analysis Tab */}
                  {resultTab === 'analysis' && result.data.situationAnalysis && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-green-500" />
                            SWOT Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderSWOT(result.data.situationAnalysis.swot)}
                        </CardContent>
                      </Card>

                      {result.data.situationAnalysis.competitorAnalysis && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-orange-500" />
                              Competitor Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {result.data.situationAnalysis.competitorAnalysis.map((comp, idx) => (
                                <div key={idx} className="p-4 border rounded-lg">
                                  <h4 className="font-bold text-sm">{comp.name}</h4>
                                  <div className="grid md:grid-cols-3 gap-2 mt-2 text-sm">
                                    <div>
                                      <span className="text-green-600 text-xs font-medium">Strengths:</span>
                                      <p>{comp.strengths}</p>
                                    </div>
                                    <div>
                                      <span className="text-red-600 text-xs font-medium">Weaknesses:</span>
                                      <p>{comp.weaknesses}</p>
                                    </div>
                                    <div>
                                      <span className="text-blue-600 text-xs font-medium">How to Beat:</span>
                                      <p>{comp.differentiator}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {result.data.situationAnalysis.marketTrends && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                              Market Trends
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {result.data.situationAnalysis.marketTrends.map((trend, idx) => (
                                <Badge key={idx} variant="outline" className="py-2 px-3">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {trend}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Audience Tab */}
                  {resultTab === 'audience' && result.data.targetAudience && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {result.data.targetAudience.primaryPersona && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-blue-500" />
                              Primary Persona
                              <Badge className="bg-blue-500">Primary</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-4xl mb-2">👤</div>
                              <h4 className="font-bold">{result.data.targetAudience.primaryPersona.name}</h4>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Demographics</Label>
                              <p className="text-sm">{result.data.targetAudience.primaryPersona.demographics}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Psychographics</Label>
                              <p className="text-sm">{result.data.targetAudience.primaryPersona.psychographics}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Pain Points</Label>
                              <ul className="text-sm space-y-1">
                                {result.data.targetAudience.primaryPersona.painPoints?.map((p, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertTriangle className="h-3 w-3 mt-1 text-orange-500" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Goals</Label>
                              <ul className="text-sm space-y-1">
                                {result.data.targetAudience.primaryPersona.goals?.map((g, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <Target className="h-3 w-3 mt-1 text-green-500" />
                                    {g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Preferred Channels</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.data.targetAudience.primaryPersona.preferredChannels?.map((c, i) => (
                                  <Badge key={i} variant="outline">{c}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {result.data.targetAudience.secondaryPersona && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-purple-500" />
                              Secondary Persona
                              <Badge variant="outline">Secondary</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-4xl mb-2">👥</div>
                              <h4 className="font-bold">{result.data.targetAudience.secondaryPersona.name}</h4>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Demographics</Label>
                              <p className="text-sm">{result.data.targetAudience.secondaryPersona.demographics}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Psychographics</Label>
                              <p className="text-sm">{result.data.targetAudience.secondaryPersona.psychographics}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Strategy Tab (7Ps) */}
                  {resultTab === 'strategy' && result.data.marketingMix && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(result.data.marketingMix).map(([key, value]) => {
                        const icons = {
                          product: '📦', price: '💰', place: '📍', promotion: '📣',
                          people: '👥', process: '⚙️', physicalEvidence: '🏪'
                        }
                        const colors = {
                          product: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                          price: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                          place: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                          promotion: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                          people: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
                          process: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20',
                          physicalEvidence: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        }
                        return (
                          <Card key={key} className={`border-l-4 ${colors[key]}`}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">{icons[key]}</span>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                              {Object.entries(value).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                                  <p className="text-sm">{Array.isArray(v) ? v.join(', ') : v}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Channels Tab */}
                  {resultTab === 'channels' && result.data.channelStrategy && (
                    <div className="grid md:grid-cols-3 gap-6">
                      {['paid', 'owned', 'earned'].map(type => {
                        const data = result.data.channelStrategy[type]
                        if (!data) return null
                        const icons = { paid: '💵', owned: '🏠', earned: '🌟' }
                        const colors = {
                          paid: 'from-green-500 to-emerald-500',
                          owned: 'from-blue-500 to-indigo-500',
                          earned: 'from-purple-500 to-pink-500'
                        }
                        return (
                          <Card key={type}>
                            <CardHeader className={`bg-gradient-to-r ${colors[type]} text-white rounded-t-lg`}>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">{icons[type]}</span>
                                {type.charAt(0).toUpperCase() + type.slice(1)} Media
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Channels</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {data.channels?.map((c, i) => (
                                    <Badge key={i} variant="outline">{c}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Strategy</Label>
                                <p className="text-sm">{data.strategy || data.budgetAllocation}</p>
                              </div>
                              {data.tactics && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Tactics</Label>
                                  <ul className="text-sm">
                                    {data.tactics.map((t, i) => (
                                      <li key={i}>• {t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Funnel Tab */}
                  {resultTab === 'funnel' && result.data.funnelStrategy && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-purple-500" />
                          Full-Funnel Strategy
                        </CardTitle>
                        <CardDescription>Customer journey from awareness to advocacy</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderFunnel(result.data.funnelStrategy)}
                      </CardContent>
                    </Card>
                  )}

                  {/* Budget Tab */}
                  {resultTab === 'budget' && result.data.budgetAllocation && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Budget Allocation
                          </CardTitle>
                          <CardDescription>Total: {result.data.budgetAllocation.totalBudget}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {renderBudgetBreakdown(result.data.budgetAllocation)}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-blue-500" />
                            Allocation Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.data.budgetAllocation.breakdown?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="text-sm font-medium">{item.category}</span>
                                <span className="text-sm">{item.amount || `${item.percentage}%`}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Timeline Tab */}
                  {resultTab === 'timeline' && result.data.implementationTimeline && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          Implementation Timeline
                        </CardTitle>
                        <CardDescription>12-month execution roadmap</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderTimeline(result.data.implementationTimeline)}
                      </CardContent>
                    </Card>
                  )}

                  {/* KPIs Tab */}
                  {resultTab === 'kpis' && result.data.kpis && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-500" />
                            Primary KPIs
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.data.kpis.primary?.map((kpi, idx) => (
                            <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{kpi.metric}</span>
                                <Badge className="bg-green-500">{kpi.target}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Measured: {kpi.frequency}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Secondary KPIs
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.data.kpis.secondary?.map((kpi, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{kpi.metric}</span>
                                <Badge variant="outline">{kpi.target}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Measured: {kpi.frequency}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Next Steps */}
                      {result.data.nextSteps && (
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-orange-500" />
                              Immediate Next Steps
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {result.data.nextSteps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <Badge className="bg-orange-500">{idx + 1}</Badge>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{step.action}</p>
                                    <p className="text-xs text-muted-foreground">Deadline: {step.deadline} • Owner: {step.owner}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Non-complete frameworks */}
              {framework !== 'complete' && (
                <>
                  {/* 7 Ps Framework */}
                  {framework === '7ps' && result.data && (
                    <div className="space-y-6">
                      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                        <CardContent className="py-4">
                          <p className="text-sm text-center text-muted-foreground">{result.data.businessContext}</p>
                        </CardContent>
                      </Card>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {['product', 'price', 'place', 'promotion', 'people', 'process', 'physicalEvidence'].map(key => {
                          const data = result.data[key]
                          if (!data) return null
                          const icons = {
                            product: '📦', price: '💰', place: '📍', promotion: '📣',
                            people: '👥', process: '⚙️', physicalEvidence: '🏪'
                          }
                          const colors = {
                            product: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
                            price: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
                            place: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
                            promotion: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
                            people: 'border-l-pink-500 bg-pink-50 dark:bg-pink-900/20',
                            process: 'border-l-teal-500 bg-teal-50 dark:bg-teal-900/20',
                            physicalEvidence: 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          }
                          return (
                            <Card key={key} className={`border-l-4 ${colors[key]}`}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <span className="text-xl">{icons[key]}</span>
                                  {key === 'physicalEvidence' ? 'Physical Evidence' : key.charAt(0).toUpperCase() + key.slice(1)}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3 text-sm">
                                {Object.entries(data).filter(([k]) => k !== 'recommendations').map(([k, v]) => (
                                  <div key={k}>
                                    <p className="text-xs font-medium text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                                    <p>{Array.isArray(v) ? v.join(', ') : v}</p>
                                  </div>
                                ))}
                                {data.recommendations && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-green-600 mb-1">Recommendations:</p>
                                    <ul className="space-y-1">
                                      {data.recommendations.map((r, i) => (
                                        <li key={i} className="text-xs flex items-start gap-1">
                                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                                          <span>{r}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Action Plan */}
                      {result.data.actionPlan && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-orange-500" />
                              Action Plan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {result.data.actionPlan.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <Badge variant="outline">{item.p}</Badge>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.action}</p>
                                    <p className="text-xs text-muted-foreground">Timeline: {item.timeline}</p>
                                  </div>
                                  <Badge className={item.priority === 'High' ? 'bg-red-500' : item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                                    {item.priority}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* STP Framework */}
                  {framework === 'stp' && result.data && (
                    <div className="space-y-6">
                      {/* Segmentation */}
                      {result.data.segmentation && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <PieChart className="h-5 w-5 text-blue-500" />
                              Market Segmentation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                              {['demographic', 'geographic', 'psychographic', 'behavioral'].map(type => {
                                const segments = result.data.segmentation[type]
                                if (!segments?.length) return null
                                const icons = { demographic: '👥', geographic: '🌍', psychographic: '🧠', behavioral: '🎯' }
                                return (
                                  <div key={type} className="p-4 border rounded-lg">
                                    <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
                                      <span>{icons[type]}</span>
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </h4>
                                    <div className="space-y-2">
                                      {segments.map((seg, idx) => (
                                        <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
                                          <p className="font-medium">{seg.segment}</p>
                                          <p className="text-xs text-muted-foreground">{seg.characteristics}</p>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px]">Size: {seg.size}</Badge>
                                            <Badge className={seg.potential === 'High' ? 'bg-green-500' : 'bg-yellow-500'} >
                                              {seg.potential}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Targeting */}
                      {result.data.targeting && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-green-500" />
                              Targeting Strategy
                            </CardTitle>
                            <CardDescription>Strategy: {result.data.targeting.strategy}</CardDescription>
                          </CardHeader>
                          <CardContent className="grid md:grid-cols-2 gap-4">
                            {result.data.targeting.primarySegment && (
                              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                                <Badge className="bg-green-500 mb-2">Primary Target</Badge>
                                <h4 className="font-bold">{result.data.targeting.primarySegment.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{result.data.targeting.primarySegment.why}</p>
                                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                  <div><span className="text-muted-foreground">Size:</span> {result.data.targeting.primarySegment.size}</div>
                                  <div><span className="text-muted-foreground">Growth:</span> {result.data.targeting.primarySegment.growthPotential}</div>
                                </div>
                              </div>
                            )}
                            {result.data.targeting.secondarySegment && (
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                                <Badge variant="outline" className="mb-2">Secondary Target</Badge>
                                <h4 className="font-bold">{result.data.targeting.secondarySegment.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{result.data.targeting.secondarySegment.why}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Positioning */}
                      {result.data.positioning && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Megaphone className="h-5 w-5 text-purple-500" />
                              Brand Positioning
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-600 font-medium mb-1">Positioning Statement</p>
                              <p className="font-medium italic">{result.data.positioning.positioningStatement}</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground font-medium mb-2">Points of Difference</p>
                                <div className="space-y-1">
                                  {result.data.positioning.pointsOfDifference?.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                                      {p}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium mb-2">Points of Parity</p>
                                <div className="space-y-1">
                                  {result.data.positioning.pointsOfParity?.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <Minus className="h-4 w-4 text-gray-500" />
                                      {p}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground">Brand Essence</p>
                              <p className="font-bold text-lg">{result.data.positioning.brandEssence}</p>
                              {result.data.positioning.brandPersonality && (
                                <div className="flex gap-1 mt-2">
                                  {result.data.positioning.brandPersonality.map((t, i) => (
                                    <Badge key={i} variant="outline">{t}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Ansoff Matrix */}
                  {framework === 'ansoff' && result.data && (
                    <div className="space-y-6">
                      {/* Current State */}
                      {result.data.currentState && (
                        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30">
                          <CardContent className="py-4">
                            <div className="grid md:grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Current Products</p>
                                <p className="font-medium text-sm">{result.data.currentState.products}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Current Markets</p>
                                <p className="font-medium text-sm">{result.data.currentState.markets}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Revenue Model</p>
                                <p className="font-medium text-sm">{result.data.currentState.revenue}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Growth Matrix Grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Market Penetration */}
                        {result.data.marketPenetration && (
                          <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="bg-green-50 dark:bg-green-900/20">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">📈</span>
                                Market Penetration
                                <Badge className="bg-green-500">Low Risk</Badge>
                              </CardTitle>
                              <CardDescription>{result.data.marketPenetration.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                              {result.data.marketPenetration.strategies?.map((s, i) => (
                                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                                  <p className="font-medium text-sm">{s.strategy}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Expected: {s.expectedGrowth}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {s.tactics?.map((t, j) => (
                                      <Badge key={j} variant="outline" className="text-[10px]">{t}</Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {result.data.marketPenetration.quickWins && (
                                <div>
                                  <p className="text-xs font-medium text-green-600">Quick Wins:</p>
                                  <ul className="text-sm">
                                    {result.data.marketPenetration.quickWins.map((w, i) => (
                                      <li key={i}>• {w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Market Development */}
                        {result.data.marketDevelopment && (
                          <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">🌍</span>
                                Market Development
                                <Badge className="bg-yellow-500">Medium Risk</Badge>
                              </CardTitle>
                              <CardDescription>{result.data.marketDevelopment.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                              {result.data.marketDevelopment.newMarkets?.map((m, i) => (
                                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                                  <p className="font-medium text-sm">{m.market}</p>
                                  <p className="text-xs text-muted-foreground">{m.opportunity}</p>
                                  <p className="text-xs mt-1">Entry: {m.entryStrategy}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {/* Product Development */}
                        {result.data.productDevelopment && (
                          <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">🚀</span>
                                Product Development
                                <Badge className="bg-yellow-500">Medium Risk</Badge>
                              </CardTitle>
                              <CardDescription>{result.data.productDevelopment.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                              {result.data.productDevelopment.opportunities?.map((o, i) => (
                                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                                  <p className="font-medium text-sm">{o.product}</p>
                                  <p className="text-xs text-muted-foreground">Need: {o.targetNeed}</p>
                                  <p className="text-xs">Timeline: {o.timeline}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {/* Diversification */}
                        {result.data.diversification && (
                          <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="bg-red-50 dark:bg-red-900/20">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="text-xl">🎲</span>
                                Diversification
                                <Badge className="bg-red-500">High Risk</Badge>
                              </CardTitle>
                              <CardDescription>{result.data.diversification.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground">Recommendation</p>
                                <p className="text-sm">{result.data.diversification.recommendation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Recommended Path */}
                      {result.data.recommendedPath && (
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-green-500" />
                              Recommended Growth Path
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                              <Badge className="bg-green-500 mb-2">{result.data.recommendedPath.primaryStrategy}</Badge>
                              <p className="text-sm">{result.data.recommendedPath.rationale}</p>
                            </div>
                            {result.data.recommendedPath.sequencing && (
                              <div>
                                <p className="text-xs font-medium mb-2">Sequencing:</p>
                                <div className="flex flex-wrap gap-2">
                                  {result.data.recommendedPath.sequencing.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <Badge variant="outline">{i + 1}. {s}</Badge>
                                      {i < result.data.recommendedPath.sequencing.length - 1 && <span>→</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Full-Funnel Strategy */}
                  {framework === 'funnel' && result.data && (
                    <div className="space-y-6">
                      {/* Funnel Overview */}
                      {result.data.funnelOverview && (
                        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                          <CardContent className="py-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Total Addressable Market</p>
                                <p className="font-bold">{result.data.funnelOverview.totalAddressableMarket}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Current Funnel Health</p>
                                <p className="font-medium text-sm">{result.data.funnelOverview.currentFunnelHealth}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Biggest Leaks</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.data.funnelOverview.biggestLeaks?.map((l, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] text-red-600">{l}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Visual Funnel */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-purple-500" />
                            Full Marketing Funnel
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderFunnel(result.data)}
                        </CardContent>
                      </Card>

                      {/* Detailed Stages */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['awareness', 'consideration', 'decision', 'retention', 'advocacy'].map(stage => {
                          const data = result.data[stage]
                          if (!data) return null
                          const icons = { awareness: '👁️', consideration: '🤔', decision: '✅', retention: '💎', advocacy: '📣' }
                          const colors = {
                            awareness: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
                            consideration: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
                            decision: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
                            retention: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
                            advocacy: 'border-l-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          }
                          return (
                            <Card key={stage} className={`border-l-4 ${colors[stage]}`}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <span className="text-xl">{icons[stage]}</span>
                                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                </CardTitle>
                                <CardDescription>{data.stage}</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3 text-sm">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Goal</p>
                                  <p>{data.goal || data.objective}</p>
                                </div>
                                {data.channels && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Channels</p>
                                    <div className="space-y-1">
                                      {data.channels.slice(0, 2).map((c, i) => (
                                        <div key={i} className="text-xs p-2 bg-white dark:bg-gray-800 rounded">
                                          <p className="font-medium">{c.channel}</p>
                                          <p className="text-muted-foreground">{c.tactic}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {data.metrics?.primary && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">KPIs</p>
                                    <div className="flex flex-wrap gap-1">
                                      {data.metrics.primary.map((m, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Budget Allocation */}
                      {result.data.budgetAllocation && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-500" />
                              Budget Allocation by Funnel Stage
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-4 gap-4">
                              {Object.entries(result.data.budgetAllocation).map(([stage, data]) => (
                                <div key={stage} className="text-center p-4 bg-muted/30 rounded-lg">
                                  <p className="text-2xl font-bold">{data.percentage}%</p>
                                  <p className="text-sm font-medium capitalize">{stage}</p>
                                  <p className="text-xs text-muted-foreground">{data.rationale}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Tech Stack */}
                      {result.data.techStack && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Layers className="h-5 w-5 text-blue-500" />
                              Recommended Tech Stack
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-3">
                              {result.data.techStack.map((tool, idx) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <p className="font-medium text-sm">{tool.tool}</p>
                                  <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                                  <Badge variant="outline" className="text-[10px] mt-1">{tool.funnelStage}</Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            2026 Marketing Strategy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">AI-First Marketing</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">Leverage AI for personalization at scale</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Privacy-Compliant</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">Build first-party data strategies</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Video-First Content</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">Short-form video dominates all platforms</p>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Community-Led Growth</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">Build engaged communities for advocacy</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
