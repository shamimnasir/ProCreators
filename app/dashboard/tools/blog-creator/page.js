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
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  FileText, Sparkles, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, Search,
  DollarSign, Star, BarChart3, BookOpen, Zap,
  ChevronDown, ChevronUp, Check, Edit3, Hash,
  ShoppingCart, Award, List, FileCheck, Wand2,
  Bot, User, Shield, AlertCircle, AlertTriangle,
  PenTool, Brain, Eye, Settings2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { saveToLibrary } from '@/lib/library-utils'

// Article types
const ARTICLE_TYPES = [
  { id: 'seo-article', name: 'SEO Article', icon: '🔍', desc: 'Keyword-optimized content', bestFor: 'Organic traffic', color: 'from-blue-500 to-blue-700' },
  { id: 'affiliate-best', name: 'Best X for Y', icon: '🏆', desc: 'Best [product] for [audience]', bestFor: 'Affiliate commissions', color: 'from-green-500 to-emerald-700' },
  { id: 'product-review', name: 'Product Review', icon: '⭐', desc: 'In-depth single product review', bestFor: 'Affiliate, Trust', color: 'from-yellow-500 to-orange-600' },
  { id: 'comparison', name: 'X vs Y Comparison', icon: '⚖️', desc: 'Head-to-head comparison', bestFor: 'High-intent buyers', color: 'from-purple-500 to-purple-700' },
  { id: 'how-to-guide', name: 'How-To Guide', icon: '📋', desc: 'Step-by-step tutorial', bestFor: 'Featured snippets', color: 'from-cyan-500 to-blue-600' },
  { id: 'listicle', name: 'Listicle', icon: '📝', desc: 'Top X format', bestFor: 'Social shares', color: 'from-pink-500 to-rose-600' },
  { id: 'ultimate-guide', name: 'Ultimate Guide', icon: '📚', desc: 'Comprehensive pillar content', bestFor: 'Authority', color: 'from-indigo-500 to-violet-700' },
  { id: 'buyers-guide', name: "Buyer's Guide", icon: '🛒', desc: 'What to look for when buying', bestFor: 'High-intent traffic', color: 'from-amber-500 to-orange-600' }
]

// Humanization levels from AI Humanizer
const HUMANIZATION_LEVELS = [
  { id: 'none', name: 'None', icon: '📄', desc: 'Raw AI output', changes: 'No humanization applied' },
  { id: 'light', name: 'Light Touch', icon: '✨', desc: 'Minor adjustments', changes: 'Subtle word changes, natural transitions' },
  { id: 'medium', name: 'Balanced', icon: '⚖️', desc: 'Good balance of changes', changes: 'Varied sentences, idioms, personal touches' },
  { id: 'heavy', name: 'Deep Rewrite', icon: '🔄', desc: 'Significant restructuring', changes: 'Complete restructure, unique voice' }
]

// Humanization techniques from AI Humanizer
const HUMANIZATION_TECHNIQUES = [
  { id: 'vary_sentences', name: 'Vary Sentence Length', desc: 'Mix short and long' },
  { id: 'add_transitions', name: 'Natural Transitions', desc: 'Human-like connectors' },
  { id: 'use_contractions', name: 'Use Contractions', desc: "don't instead of do not" },
  { id: 'add_personality', name: 'Add Personality', desc: 'Opinions & asides' },
  { id: 'simplify_vocab', name: 'Simplify Vocabulary', desc: 'Everyday words' },
  { id: 'add_examples', name: 'Add Examples', desc: 'Relatable examples' },
  { id: 'rhetorical_questions', name: 'Rhetorical Questions', desc: 'Engage readers' }
]

// Grammar issue categories from Grammar Checker
const ISSUE_CATEGORIES = {
  grammar: { name: 'Grammar', icon: '📝', color: 'text-red-600 bg-red-50' },
  spelling: { name: 'Spelling', icon: '🔤', color: 'text-orange-600 bg-orange-50' },
  punctuation: { name: 'Punctuation', icon: '❗', color: 'text-yellow-600 bg-yellow-50' },
  style: { name: 'Style', icon: '✨', color: 'text-purple-600 bg-purple-50' },
  readability: { name: 'Readability', icon: '👁️', color: 'text-blue-600 bg-blue-50' }
}

const WRITING_STYLES = [
  { id: 'conversational', name: 'Conversational', desc: 'Friendly, easy to read' },
  { id: 'professional', name: 'Professional', desc: 'Business-like' },
  { id: 'storytelling', name: 'Storytelling', desc: 'Narrative-driven' },
  { id: 'journalistic', name: 'Journalistic', desc: 'News-style' },
  { id: 'persuasive', name: 'Persuasive', desc: 'Sales-focused' }
]

const WORD_COUNTS = [
  { id: '800', name: 'Short (~800)', desc: 'Quick reads' },
  { id: '1500', name: 'Medium (~1,500)', desc: 'Standard post' },
  { id: '2500', name: 'Long (~2,500)', desc: 'In-depth' },
  { id: '4000', name: 'Pillar (~4,000+)', desc: 'Ultimate guides' }
]

const INDUSTRIES = [
  'Technology', 'Finance', 'Health & Fitness', 'Travel', 'Food & Cooking',
  'Home & Garden', 'Fashion', 'Beauty', 'Parenting', 'Business',
  'Marketing', 'Education', 'Entertainment', 'Sports', 'Automotive', 'Other'
]

export default function BlogCreatorPage() {
  const [generating, setGenerating] = useState(false)
  const [humanizing, setHumanizing] = useState(false)
  const [checkingGrammar, setCheckingGrammar] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState({})
  const [activeTab, setActiveTab] = useState('article')
  const { toast } = useToast()
  
  // Form state
  const [articleType, setArticleType] = useState('seo-article')
  const [topic, setTopic] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [secondaryKeywords, setSecondaryKeywords] = useState('')
  const [industry, setIndustry] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [writingStyle, setWritingStyle] = useState('conversational')
  const [wordCount, setWordCount] = useState('1500')
  const [tone, setTone] = useState('helpful')
  
  // Humanization settings (from AI Humanizer)
  const [humanizationLevel, setHumanizationLevel] = useState('medium')
  const [enabledTechniques, setEnabledTechniques] = useState(['vary_sentences', 'add_transitions', 'use_contractions', 'add_personality'])
  
  // Grammar & quality results (from Grammar Checker)
  const [grammarResults, setGrammarResults] = useState(null)
  const [aiDetectionScore, setAiDetectionScore] = useState(null)
  
  // Affiliate specific
  const [products, setProducts] = useState('')
  const [affiliateNetwork, setAffiliateNetwork] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [includeProsCons, setIncludeProsCons] = useState(true)
  const [includeRatings, setIncludeRatings] = useState(true)
  const [includePricing, setIncludePricing] = useState(true)
  
  // SEO specific
  const [includeFAQ, setIncludeFAQ] = useState(true)
  const [includeTOC, setIncludeTOC] = useState(true)
  const [includeMetaTags, setIncludeMetaTags] = useState(true)
  const [internalLinks, setInternalLinks] = useState('')
  const [keyPoints, setKeyPoints] = useState('')

  const toggleTechnique = (id) => {
    setEnabledTechniques(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: 'Missing Topic', description: 'Please enter a topic', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    setResult(null)
    setGrammarResults(null)
    setAiDetectionScore(null)
    
    try {
      const res = await fetch('/api/blog-creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleType, topic, targetKeyword: targetKeyword || topic, secondaryKeywords,
          industry, targetAudience, writingStyle, wordCount, tone,
          products, affiliateNetwork, priceRange, includeProsCons, includeRatings, includePricing,
          includeFAQ, includeTOC, includeMetaTags, internalLinks, keyPoints,
          humanizationLevel, enabledTechniques
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveTab('article')
        
        // Auto-save to library
        try {
          const articleType = ARTICLE_TYPES.find(t => t.id === articleTypeId)
          await saveToLibrary({
            type: 'blog-article',
            category: 'text',
            title: data.data.title || `${articleType?.name || 'Blog'}: ${topic.substring(0, 40)}${topic.length > 40 ? '...' : ''}`,
            description: data.data.metaDescription || `${articleType?.name || 'Blog article'} about ${topic.substring(0, 100)}`,
            content: data.data.content || '',
            metadata: {
              articleType: articleTypeId,
              topic,
              mainKeyword,
              secondaryKeywords,
              wordCount: data.data.wordCount || wordCount,
              tone,
              writingStyle,
              humanizationLevel,
              includeFAQ,
              includeTOC,
              includeMetaTags,
              contentType: 'blog-article'
            }
          })
          console.log('Blog article auto-saved to library')
        } catch (saveError) {
          console.error('Failed to auto-save to library:', saveError)
        }
        
        toast({ title: '📝 Blog Post Generated!' })
        
        // Auto-run grammar check and AI detection after generation
        if (data.data.content) {
          await runQualityChecks(data.data.content)
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

  // Run grammar check and AI detection
  const runQualityChecks = async (text) => {
    // Grammar check
    setCheckingGrammar(true)
    try {
      const grammarRes = await fetch('/api/grammar-checker/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, writingStyle })
      })
      const grammarData = await grammarRes.json()
      if (grammarData.success) {
        setGrammarResults(grammarData.results)
      }
    } catch (err) {
      console.error('Grammar check failed:', err)
    } finally {
      setCheckingGrammar(false)
    }

    // AI Detection check
    try {
      const aiRes = await fetch('/api/ai-humanizer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const aiData = await aiRes.json()
      if (aiData.success) {
        setAiDetectionScore(aiData.analysis)
      }
    } catch (err) {
      console.error('AI detection failed:', err)
    }
  }

  // Humanize the content
  const humanizeContent = async () => {
    if (!result?.content) return
    
    setHumanizing(true)
    try {
      const res = await fetch('/api/ai-humanizer/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: result.content,
          level: humanizationLevel,
          tone: writingStyle,
          techniques: enabledTechniques
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setResult(prev => ({ ...prev, content: data.humanizedText, humanized: true }))
        toast({ title: '✨ Content Humanized!' })
        
        // Re-run quality checks on humanized content
        await runQualityChecks(data.humanizedText)
      }
    } catch (err) {
      toast({ title: 'Humanization Failed', description: err.message, variant: 'destructive' })
    } finally {
      setHumanizing(false)
    }
  }

  const handleCopy = useCallback((text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }, [toast])

  const selectedType = ARTICLE_TYPES.find(t => t.id === articleType)
  const isAffiliateType = ['affiliate-best', 'product-review', 'comparison', 'buyers-guide'].includes(articleType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600" />
            Blog Post Creator
          </h1>
          <p className="text-muted-foreground mt-1">SEO articles, affiliate content & product reviews with AI humanization</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-100 text-emerald-800">
            <TrendingUp className="h-3 w-3 mr-1" />SEO Optimized
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <Wand2 className="h-3 w-3 mr-1" />AI Humanizer
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />Grammar Check
          </Badge>
        </div>
      </div>

      {!result ? (
        <>
          {/* Tips */}
          <Alert className="bg-emerald-50 border-emerald-200">
            <Lightbulb className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Pro Tip:</strong> For affiliate content, specific "Best X for Y" articles convert 3x better. Enable "Balanced" humanization for natural-sounding content that passes AI detectors.
            </AlertDescription>
          </Alert>

          {/* Article Type Selection */}
          <Card className="border-2 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">1</span>
                Choose Article Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ARTICLE_TYPES.map(type => (
                  <Button
                    key={type.id}
                    variant={articleType === type.id ? 'default' : 'outline'}
                    className={`h-auto py-4 flex flex-col items-center text-center ${articleType === type.id ? `bg-gradient-to-r ${type.color} text-white ring-2 ring-offset-2` : ''}`}
                    onClick={() => setArticleType(type.id)}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="font-medium text-sm">{type.name}</span>
                  </Button>
                ))}
              </div>
              {selectedType && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedType.icon} {selectedType.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedType.desc}</p>
                  <Badge variant="outline" className="mt-2">Best for: {selectedType.bestFor}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic & Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">2</span>
                Topic & SEO Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Article Topic / Title *</Label>
                <Input 
                  placeholder={isAffiliateType ? "e.g., Best Laptops for Programming in 2025" : "e.g., Complete Guide to SEO"}
                  value={topic} onChange={(e) => setTopic(e.target.value)} className="text-lg"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Keyword *</Label>
                  <Input placeholder="e.g., best laptops for programming" value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)} />
                </div>
                <div>
                  <Label>Secondary Keywords</Label>
                  <Input placeholder="e.g., coding laptop, developer laptop" value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Settings */}
          {isAffiliateType && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="h-5 w-5" /> Affiliate Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Products to Feature</Label>
                  <Textarea placeholder="Product 1 - $99&#10;Product 2 - $149" className="min-h-[80px]" value={products} onChange={(e) => setProducts(e.target.value)} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Affiliate Network</Label>
                    <Select value={affiliateNetwork} onValueChange={setAffiliateNetwork}>
                      <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amazon">Amazon Associates</SelectItem>
                        <SelectItem value="shareasale">ShareASale</SelectItem>
                        <SelectItem value="cj">CJ Affiliate</SelectItem>
                        <SelectItem value="impact">Impact</SelectItem>
                        <SelectItem value="direct">Direct Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price Range</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget (&lt;$50)</SelectItem>
                        <SelectItem value="mid">Mid-Range ($50-$200)</SelectItem>
                        <SelectItem value="premium">Premium ($200-$500)</SelectItem>
                        <SelectItem value="luxury">Luxury ($500+)</SelectItem>
                        <SelectItem value="all">All Price Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeProsCons} onChange={(e) => setIncludeProsCons(e.target.checked)} className="rounded" /> Pros & Cons</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeRatings} onChange={(e) => setIncludeRatings(e.target.checked)} className="rounded" /> Star Ratings</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includePricing} onChange={(e) => setIncludePricing(e.target.checked)} className="rounded" /> Pricing Tables</label>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Content Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">3</span>
                    Content Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Word Count</Label>
                      <Select value={wordCount} onValueChange={setWordCount}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORD_COUNTS.map(wc => (<SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Writing Style</Label>
                      <Select value={writingStyle} onValueChange={setWritingStyle}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WRITING_STYLES.map(ws => (<SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(ind => (<SelectItem key={ind} value={ind}>{ind}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Input placeholder="e.g., Beginner programmers, Small business owners" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* SEO Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">4</span>
                    SEO Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" checked={includeFAQ} onChange={(e) => setIncludeFAQ(e.target.checked)} className="rounded" />
                      <div><span className="font-medium text-sm">FAQ Section</span><p className="text-xs text-muted-foreground">Featured snippets</p></div>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" checked={includeTOC} onChange={(e) => setIncludeTOC(e.target.checked)} className="rounded" />
                      <div><span className="font-medium text-sm">Table of Contents</span><p className="text-xs text-muted-foreground">Jump links</p></div>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" checked={includeMetaTags} onChange={(e) => setIncludeMetaTags(e.target.checked)} className="rounded" />
                      <div><span className="font-medium text-sm">Meta Tags</span><p className="text-xs text-muted-foreground">Title & description</p></div>
                    </label>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="font-medium text-emerald-800 text-sm">✓ Auto H2/H3</span>
                      <p className="text-xs text-emerald-600">Proper structure</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Humanization Settings */}
            <div className="space-y-4">
              {/* Humanization Level */}
              <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Wand2 className="h-5 w-5" />
                    AI Humanization
                    <Badge className="bg-purple-600 text-white text-xs">From AI Humanizer</Badge>
                  </CardTitle>
                  <CardDescription>Make content sound natural & pass AI detectors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {HUMANIZATION_LEVELS.map(level => (
                      <button
                        key={level.id}
                        onClick={() => setHumanizationLevel(level.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          humanizationLevel === level.id ? 'border-purple-500 bg-white' : 'border-transparent bg-white/50'
                        }`}
                      >
                        <div className="text-lg mb-1">{level.icon}</div>
                        <div className="text-sm font-medium">{level.name}</div>
                        <div className="text-xs text-muted-foreground">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                  {humanizationLevel !== 'none' && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs font-medium text-purple-800 mb-2">Techniques Applied:</p>
                      <div className="flex flex-wrap gap-1">
                        {HUMANIZATION_TECHNIQUES.map(tech => (
                          <button
                            key={tech.id}
                            onClick={() => toggleTechnique(tech.id)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              enabledTechniques.includes(tech.id)
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tech.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tone Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Tone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'helpful', name: 'Helpful', icon: '🤝' },
                      { id: 'authoritative', name: 'Authority', icon: '👨‍🏫' },
                      { id: 'friendly', name: 'Friendly', icon: '😊' },
                      { id: 'enthusiastic', name: 'Enthusiastic', icon: '🔥' },
                      { id: 'objective', name: 'Objective', icon: '📊' },
                      { id: 'urgent', name: 'Urgent', icon: '⚡' }
                    ].map(t => (
                      <Button
                        key={t.id}
                        variant={tone === t.id ? 'default' : 'outline'}
                        size="sm"
                        className={`h-auto py-2 flex flex-col ${tone === t.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setTone(t.id)}
                      >
                        <span>{t.icon}</span>
                        <span className="text-xs">{t.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Points to Cover</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="• Point 1&#10;• Point 2&#10;• Specific angle" className="min-h-[80px]" value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Generate Button */}
          <Button size="lg" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 text-lg" onClick={handleGenerate} disabled={generating || !topic}>
            {generating ? (<><Loader2 className="mr-2 h-6 w-6 animate-spin" />Generating {selectedType?.name}...</>) : (<><Sparkles className="mr-2 h-6 w-6" />Generate Blog Post</>)}
          </Button>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">{selectedType?.icon} {selectedType?.name}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResult(null); setGrammarResults(null); setAiDetectionScore(null); }}>
                <RefreshCw className="h-4 w-4 mr-2" />New Article
              </Button>
            </div>
          </div>

          {/* Quality Scores Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Grammar Score */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className={`text-3xl font-bold ${
                  (grammarResults?.score || 0) >= 80 ? 'text-green-600' :
                  (grammarResults?.score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {checkingGrammar ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : `${grammarResults?.score || '--'}%`}
                </div>
                <p className="text-xs text-blue-700 font-medium">Grammar Score</p>
              </CardContent>
            </Card>

            {/* AI Detection */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className={`text-3xl font-bold ${
                  (aiDetectionScore?.aiProbability || 100) <= 30 ? 'text-green-600' :
                  (aiDetectionScore?.aiProbability || 100) <= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {aiDetectionScore ? `${100 - (aiDetectionScore?.aiProbability || 0)}%` : '--'}
                </div>
                <p className="text-xs text-purple-700 font-medium">Human Score</p>
              </CardContent>
            </Card>

            {/* Readability */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="pt-4 text-center">
                <Eye className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <div className="text-3xl font-bold text-emerald-600">
                  {grammarResults?.readability?.gradeLevel || '--'}
                </div>
                <p className="text-xs text-emerald-700 font-medium">Grade Level</p>
              </CardContent>
            </Card>

            {/* Word Count */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="pt-4 text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <div className="text-3xl font-bold text-amber-600">
                  {result.wordCount || result.content?.split(/\s+/).length || '--'}
                </div>
                <p className="text-xs text-amber-700 font-medium">Words</p>
              </CardContent>
            </Card>
          </div>

          {/* Humanize Button */}
          {!result.humanized && humanizationLevel !== 'none' && (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Make it More Human
                    </h3>
                    <p className="text-sm text-white/80">
                      Apply {HUMANIZATION_LEVELS.find(l => l.id === humanizationLevel)?.name} humanization to improve AI detection scores
                    </p>
                  </div>
                  <Button onClick={humanizeContent} disabled={humanizing} className="bg-white text-purple-600 hover:bg-gray-100">
                    {humanizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Humanizing...</> : <><Sparkles className="h-4 w-4 mr-2" />Humanize Now</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {result.humanized && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✨ Content Humanized!</strong> AI detection has been reduced. The content now sounds more natural.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="article">📝 Article</TabsTrigger>
              <TabsTrigger value="meta">🔍 SEO</TabsTrigger>
              <TabsTrigger value="grammar">✅ Grammar</TabsTrigger>
              <TabsTrigger value="outline">📋 Outline</TabsTrigger>
              <TabsTrigger value="tips">💡 Tips</TabsTrigger>
            </TabsList>

            {/* Article Tab */}
            <TabsContent value="article" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{result.title || topic}</CardTitle>
                    <Button onClick={() => handleCopy(result.content, 'article')}>
                      {copied.article ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy Article
                    </Button>
                  </div>
                  {result.wordCount && (
                    <CardDescription>{result.wordCount} words • {result.readingTime || Math.ceil(result.wordCount / 200)} min read</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="prose prose-lg max-w-none bg-white p-6 rounded-lg border">
                      <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.content?.replace(/\n/g, '<br/>') || '' }} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="meta" className="mt-4 space-y-4">
              {result.metaTitle && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Meta Title</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(result.metaTitle, 'metaTitle')}>
                        {copied.metaTitle ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-blue-600">{result.metaTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.metaTitle?.length || 0}/60 characters</p>
                  </CardContent>
                </Card>
              )}
              {result.metaDescription && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Meta Description</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(result.metaDescription, 'metaDesc')}>
                        {copied.metaDesc ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.metaDescription}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.metaDescription?.length || 0}/155 characters</p>
                  </CardContent>
                </Card>
              )}
              {result.slug && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">URL Slug</CardTitle></CardHeader>
                  <CardContent>
                    <code className="bg-gray-100 px-2 py-1 rounded">/{result.slug}</code>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Grammar Tab */}
            <TabsContent value="grammar" className="mt-4 space-y-4">
              {grammarResults ? (
                <>
                  {/* Category Scores */}
                  {grammarResults.categoryScores && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" /> Category Scores
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(grammarResults.categoryScores).map(([cat, score]) => (
                          <div key={cat} className="flex items-center gap-3">
                            <span className="text-sm w-28">{ISSUE_CATEGORIES[cat]?.name || cat}</span>
                            <Progress value={score} className="flex-1 h-2" />
                            <span className="text-sm w-12 text-right font-medium">{score}%</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Issues List */}
                  {grammarResults.issues && grammarResults.issues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" /> Issues Found ({grammarResults.issues.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {grammarResults.issues.slice(0, 10).map((issue, idx) => (
                              <div key={idx} className={`p-3 rounded-lg border ${ISSUE_CATEGORIES[issue.category]?.color || 'bg-gray-50'}`}>
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className="text-xs">{ISSUE_CATEGORIES[issue.category]?.name || issue.category}</Badge>
                                  <p className="text-sm flex-1">{issue.message}</p>
                                </div>
                                {issue.replacement && (
                                  <p className="text-xs mt-1 text-green-700">Suggestion: <code className="bg-green-100 px-1 rounded">{issue.replacement}</code></p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {grammarResults.issues?.length === 0 && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="py-8 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <h3 className="text-lg font-medium text-green-800">Excellent!</h3>
                        <p className="text-sm text-green-600">No grammar issues found.</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="bg-gray-50">
                  <CardContent className="py-8 text-center">
                    {checkingGrammar ? (
                      <><Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" /><p className="text-muted-foreground">Checking grammar...</p></>
                    ) : (
                      <><CheckCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">Grammar analysis not available</p></>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Outline Tab */}
            <TabsContent value="outline" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Article Structure</CardTitle></CardHeader>
                <CardContent>
                  {result.outline ? (
                    <div className="space-y-2">
                      {result.outline.map((item, idx) => (
                        <div key={idx} className={`p-2 rounded ${item.type === 'h2' ? 'bg-emerald-50 font-medium' : 'bg-gray-50 ml-4'}`}>
                          <span className="text-xs text-muted-foreground mr-2">{item.type?.toUpperCase()}</span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Outline not available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="mt-4 space-y-4">
              {/* Writing Tips */}
              {grammarResults?.tips && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                      <PenTool className="h-5 w-5" /> Writing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {grammarResults.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                          <span>•</span><span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* SEO Tips */}
              {result.tips && (
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                      <Lightbulb className="h-5 w-5" /> SEO Optimization Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Success Message */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-emerald-800">Your blog post is ready!</h3>
                  <p className="text-emerald-700">Copy the content, review the grammar suggestions, and publish to your blog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
