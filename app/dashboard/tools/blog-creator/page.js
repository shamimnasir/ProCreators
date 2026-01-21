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
import { 
  FileText, Sparkles, Loader2, Target, TrendingUp, 
  Copy, RefreshCw, CheckCircle, Lightbulb, Search,
  DollarSign, Star, BarChart3, BookOpen, Zap,
  ChevronDown, ChevronUp, Check, Edit3, Hash,
  ShoppingCart, Award, List, FileCheck
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ARTICLE_TYPES = [
  {
    id: 'seo-article',
    name: 'SEO Article',
    icon: '🔍',
    desc: 'Keyword-optimized content for search rankings',
    bestFor: 'Organic traffic, Authority',
    color: 'from-blue-500 to-blue-700'
  },
  {
    id: 'affiliate-best',
    name: 'Best X for Y',
    icon: '🏆',
    desc: 'Best [product] for [audience/use case]',
    bestFor: 'Affiliate commissions',
    color: 'from-green-500 to-emerald-700'
  },
  {
    id: 'product-review',
    name: 'Product Review',
    icon: '⭐',
    desc: 'In-depth single product review',
    bestFor: 'Affiliate, Trust building',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'comparison',
    name: 'X vs Y Comparison',
    icon: '⚖️',
    desc: 'Head-to-head product comparison',
    bestFor: 'High-intent buyers',
    color: 'from-purple-500 to-purple-700'
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    icon: '📋',
    desc: 'Step-by-step tutorial',
    bestFor: 'Featured snippets, Traffic',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'listicle',
    name: 'Listicle',
    icon: '📝',
    desc: 'Top X, X Ways to, X Tips format',
    bestFor: 'Social shares, Backlinks',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'ultimate-guide',
    name: 'Ultimate Guide',
    icon: '📚',
    desc: 'Comprehensive pillar content',
    bestFor: 'Authority, Backlinks',
    color: 'from-indigo-500 to-violet-700'
  },
  {
    id: 'buyers-guide',
    name: "Buyer's Guide",
    icon: '🛒',
    desc: 'What to look for when buying X',
    bestFor: 'High-intent traffic',
    color: 'from-amber-500 to-orange-600'
  }
]

const WRITING_STYLES = [
  { id: 'conversational', name: 'Conversational', desc: 'Friendly, easy to read' },
  { id: 'professional', name: 'Professional', desc: 'Business-like, authoritative' },
  { id: 'storytelling', name: 'Storytelling', desc: 'Narrative-driven' },
  { id: 'journalistic', name: 'Journalistic', desc: 'News-style, objective' },
  { id: 'persuasive', name: 'Persuasive', desc: 'Sales-focused, convincing' }
]

const WORD_COUNTS = [
  { id: '800', name: 'Short (~800)', desc: 'Quick reads, news' },
  { id: '1500', name: 'Medium (~1,500)', desc: 'Standard blog post' },
  { id: '2500', name: 'Long (~2,500)', desc: 'In-depth article' },
  { id: '4000', name: 'Pillar (~4,000+)', desc: 'Ultimate guides' }
]

const INDUSTRIES = [
  'Technology', 'Finance', 'Health & Fitness', 'Travel', 'Food & Cooking',
  'Home & Garden', 'Fashion', 'Beauty', 'Parenting', 'Business',
  'Marketing', 'Education', 'Entertainment', 'Sports', 'Automotive', 'Other'
]

export default function BlogCreatorPage() {
  const [generating, setGenerating] = useState(false)
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
  
  // Additional
  const [keyPoints, setKeyPoints] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState('')

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: 'Missing Topic', description: 'Please enter a topic', variant: 'destructive' })
      return
    }
    
    setGenerating(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/blog-creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleType,
          topic,
          targetKeyword: targetKeyword || topic,
          secondaryKeywords,
          industry,
          targetAudience,
          writingStyle,
          wordCount,
          tone,
          products,
          affiliateNetwork,
          priceRange,
          includeProsCons,
          includeRatings,
          includePricing,
          includeFAQ,
          includeTOC,
          includeMetaTags,
          internalLinks,
          keyPoints,
          competitorUrls
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data.data)
        setActiveTab('article')
        toast({ title: '📝 Blog Post Generated!' })
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
          <p className="text-muted-foreground mt-1">SEO articles, affiliate content & product reviews</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800">
          <TrendingUp className="h-3 w-3 mr-1" />SEO Optimized
        </Badge>
      </div>

      {!result ? (
        <>
          {/* Tips */}
          <Alert className="bg-emerald-50 border-emerald-200">
            <Lightbulb className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Pro Tip:</strong> For affiliate content, specific "Best X for Y" articles convert 3x better than generic listicles.
            </AlertDescription>
          </Alert>

          {/* Article Type Selection */}
          <Card className="border-2 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">1</span>
                Choose Article Type
              </CardTitle>
              <CardDescription>Select the format that fits your content goal</CardDescription>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedType.icon} {selectedType.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedType.desc}</p>
                    </div>
                    <Badge variant="outline">Best for: {selectedType.bestFor}</Badge>
                  </div>
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
                  placeholder={isAffiliateType 
                    ? "e.g., Best Laptops for Programming in 2025, Notion vs Obsidian Review"
                    : "e.g., How to Start a Successful Blog, Complete Guide to SEO"}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Keyword *</Label>
                  <Input 
                    placeholder="e.g., best laptops for programming"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Main keyword to rank for in search</p>
                </div>
                <div>
                  <Label>Secondary Keywords</Label>
                  <Input 
                    placeholder="e.g., coding laptop, developer laptop, programming notebook"
                    value={secondaryKeywords}
                    onChange={(e) => setSecondaryKeywords(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate-Specific Options */}
          {isAffiliateType && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="h-5 w-5" />
                  Affiliate Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Products to Feature (one per line)</Label>
                  <Textarea 
                    placeholder="Product 1 - $99 - affiliate link&#10;Product 2 - $149 - affiliate link&#10;Product 3 - $79 - affiliate link"
                    className="min-h-[100px]"
                    value={products}
                    onChange={(e) => setProducts(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Add products with prices and affiliate links</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Affiliate Network</Label>
                    <Select value={affiliateNetwork} onValueChange={setAffiliateNetwork}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amazon">Amazon Associates</SelectItem>
                        <SelectItem value="shareasale">ShareASale</SelectItem>
                        <SelectItem value="cj">CJ Affiliate</SelectItem>
                        <SelectItem value="impact">Impact</SelectItem>
                        <SelectItem value="direct">Direct Brand Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price Range Focus</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget-Friendly (&lt;$50)</SelectItem>
                        <SelectItem value="mid">Mid-Range ($50-$200)</SelectItem>
                        <SelectItem value="premium">Premium ($200-$500)</SelectItem>
                        <SelectItem value="luxury">Luxury ($500+)</SelectItem>
                        <SelectItem value="all">All Price Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="pros-cons" checked={includeProsCons} onChange={(e) => setIncludeProsCons(e.target.checked)} className="rounded" />
                    <Label htmlFor="pros-cons">Include Pros & Cons</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ratings" checked={includeRatings} onChange={(e) => setIncludeRatings(e.target.checked)} className="rounded" />
                    <Label htmlFor="ratings">Include Star Ratings</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="pricing" checked={includePricing} onChange={(e) => setIncludePricing(e.target.checked)} className="rounded" />
                    <Label htmlFor="pricing">Include Pricing Tables</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Content Settings */}
            <div className="space-y-4">
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORD_COUNTS.map(wc => (
                            <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Writing Style</Label>
                      <Select value={writingStyle} onValueChange={setWritingStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WRITING_STYLES.map(ws => (
                            <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Industry/Niche</Label>
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
                    <Label>Target Audience</Label>
                    <Input 
                      placeholder="e.g., Beginner programmers, Small business owners"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Points to Cover</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="• Point 1 to cover&#10;• Point 2 to cover&#10;• Specific angle or unique insight"
                    className="min-h-[100px]"
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - SEO Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">4</span>
                    SEO Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" id="faq" checked={includeFAQ} onChange={(e) => setIncludeFAQ(e.target.checked)} className="rounded" />
                      <Label htmlFor="faq" className="cursor-pointer">
                        <span className="font-medium">FAQ Section</span>
                        <p className="text-xs text-muted-foreground">For featured snippets</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" id="toc" checked={includeTOC} onChange={(e) => setIncludeTOC(e.target.checked)} className="rounded" />
                      <Label htmlFor="toc" className="cursor-pointer">
                        <span className="font-medium">Table of Contents</span>
                        <p className="text-xs text-muted-foreground">Jump links</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" id="meta" checked={includeMetaTags} onChange={(e) => setIncludeMetaTags(e.target.checked)} className="rounded" />
                      <Label htmlFor="meta" className="cursor-pointer">
                        <span className="font-medium">Meta Tags</span>
                        <p className="text-xs text-muted-foreground">Title & description</p>
                      </Label>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="font-medium text-emerald-800">✓ Auto H2/H3 Headers</span>
                      <p className="text-xs text-emerald-600">Proper structure</p>
                    </div>
                  </div>
                  <div>
                    <Label>Internal Links to Include (optional)</Label>
                    <Textarea 
                      placeholder="/blog/related-post-1&#10;/blog/related-post-2"
                      className="min-h-[60px]"
                      value={internalLinks}
                      onChange={(e) => setInternalLinks(e.target.value)}
                    />
                  </div>
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
                      { id: 'authoritative', name: 'Authoritative', icon: '👨‍🏫' },
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
            </div>
          </div>

          {/* Advanced Options */}
          <Button variant="ghost" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <Card>
              <CardContent className="pt-6">
                <div>
                  <Label>Competitor URLs to Analyze (optional)</Label>
                  <Textarea 
                    placeholder="https://competitor1.com/similar-article&#10;https://competitor2.com/similar-article"
                    value={competitorUrls}
                    onChange={(e) => setCompetitorUrls(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">We'll create content that outperforms these</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 text-lg"
            onClick={handleGenerate}
            disabled={generating || !topic}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Generating {selectedType?.name}...</>
            ) : (
              <><Sparkles className="mr-2 h-6 w-6" />Generate Blog Post</>         
            )}
          </Button>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Your {selectedType?.name}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />Create New
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="article">📝 Article</TabsTrigger>
              <TabsTrigger value="meta">🔍 SEO Meta</TabsTrigger>
              <TabsTrigger value="outline">📋 Outline</TabsTrigger>
              <TabsTrigger value="tips">💡 Tips</TabsTrigger>
            </TabsList>

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
                  <div className="prose prose-lg max-w-none bg-white p-6 rounded-lg border">
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.content?.replace(/\n/g, '<br/>') || '' }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                  <CardHeader>
                    <CardTitle className="text-lg">URL Slug</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="bg-gray-100 px-2 py-1 rounded">/{result.slug}</code>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="outline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Article Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.outline && (
                    <div className="space-y-2">
                      {result.outline.map((item, idx) => (
                        <div key={idx} className={`p-2 rounded ${item.type === 'h2' ? 'bg-emerald-50 font-medium' : 'bg-gray-50 ml-4'}`}>
                          <span className="text-xs text-muted-foreground mr-2">{item.type?.toUpperCase()}</span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.tips && (
                    <ul className="space-y-2">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-1 text-emerald-600 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Success */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-emerald-800">Your blog post is ready!</h3>
                  <p className="text-emerald-700">Copy the content, review, and publish to your blog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
