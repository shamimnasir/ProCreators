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
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'
import { 
  FileText, Download, Sparkles, Loader2, 
  ArrowLeft, Plus, Trash2, CheckCircle, Copy,
  BookOpen, Globe, Newspaper, Video, Mic,
  GraduationCap, Link2, RefreshCw, FileDown,
  BookMarked, Library, ExternalLink, Search
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import AutoSaveDraftsManager from '@/components/shared/AutoSaveDraftsManager'

// Citation Styles
const CITATION_STYLES = [
  { id: 'apa7', name: 'APA 7th Edition', description: 'American Psychological Association', popular: true },
  { id: 'mla9', name: 'MLA 9th Edition', description: 'Modern Language Association', popular: true },
  { id: 'chicago', name: 'Chicago 17th', description: 'Chicago Manual of Style', popular: true },
  { id: 'harvard', name: 'Harvard', description: 'Harvard Referencing', popular: true },
  { id: 'ieee', name: 'IEEE', description: 'Institute of Electrical and Electronics Engineers', popular: false },
  { id: 'vancouver', name: 'Vancouver', description: 'Medical/Scientific citations', popular: false },
  { id: 'ama', name: 'AMA 11th', description: 'American Medical Association', popular: false },
  { id: 'asa', name: 'ASA 6th', description: 'American Sociological Association', popular: false }
]

// Source Types
const SOURCE_TYPES = [
  { id: 'book', name: 'Book', icon: BookOpen, fields: ['authors', 'title', 'publisher', 'year', 'edition', 'location'] },
  { id: 'journal', name: 'Journal Article', icon: FileText, fields: ['authors', 'title', 'journal', 'year', 'volume', 'issue', 'pages', 'doi'] },
  { id: 'website', name: 'Website', icon: Globe, fields: ['authors', 'title', 'siteName', 'url', 'accessDate', 'publishDate'] },
  { id: 'newspaper', name: 'Newspaper', icon: Newspaper, fields: ['authors', 'title', 'newspaper', 'date', 'pages', 'url'] },
  { id: 'video', name: 'Video/YouTube', icon: Video, fields: ['authors', 'title', 'platform', 'url', 'publishDate', 'duration'] },
  { id: 'podcast', name: 'Podcast', icon: Mic, fields: ['authors', 'episodeTitle', 'podcastName', 'publishDate', 'url'] },
  { id: 'chapter', name: 'Book Chapter', icon: BookMarked, fields: ['authors', 'chapterTitle', 'bookTitle', 'editors', 'publisher', 'year', 'pages'] },
  { id: 'thesis', name: 'Thesis/Dissertation', icon: GraduationCap, fields: ['authors', 'title', 'degree', 'institution', 'year', 'url'] }
]

// Field Labels
const FIELD_LABELS = {
  authors: 'Author(s)',
  title: 'Title',
  publisher: 'Publisher',
  year: 'Year',
  edition: 'Edition',
  location: 'Location (City)',
  journal: 'Journal Name',
  volume: 'Volume',
  issue: 'Issue',
  pages: 'Pages',
  doi: 'DOI',
  siteName: 'Website Name',
  url: 'URL',
  accessDate: 'Access Date',
  publishDate: 'Publish Date',
  newspaper: 'Newspaper Name',
  date: 'Date',
  platform: 'Platform (e.g., YouTube)',
  duration: 'Duration',
  episodeTitle: 'Episode Title',
  podcastName: 'Podcast Name',
  chapterTitle: 'Chapter Title',
  bookTitle: 'Book Title',
  editors: 'Editor(s)',
  degree: 'Degree Type',
  institution: 'Institution'
}

// Field Placeholders
const FIELD_PLACEHOLDERS = {
  authors: 'Last, First M. (separate multiple with semicolon)',
  title: 'Enter the title',
  publisher: 'e.g., Oxford University Press',
  year: 'e.g., 2024',
  edition: 'e.g., 3rd',
  location: 'e.g., New York, NY',
  journal: 'e.g., Nature',
  volume: 'e.g., 42',
  issue: 'e.g., 3',
  pages: 'e.g., 123-145',
  doi: 'e.g., 10.1000/xyz123',
  siteName: 'e.g., BBC News',
  url: 'https://...',
  accessDate: 'YYYY-MM-DD',
  publishDate: 'YYYY-MM-DD',
  newspaper: 'e.g., The New York Times',
  date: 'YYYY-MM-DD',
  platform: 'e.g., YouTube, Vimeo',
  duration: 'e.g., 12:34',
  episodeTitle: 'Episode title',
  podcastName: 'e.g., The Daily',
  chapterTitle: 'Chapter title',
  bookTitle: 'Book title',
  editors: 'Last, First M.',
  degree: 'e.g., PhD, Master\'s',
  institution: 'e.g., Harvard University'
}

export default function CitationGeneratorPage() {
  const [loading, setLoading] = useState(false)
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const { toast } = useToast()

  // Configuration
  const [citationStyle, setCitationStyle] = useState('apa7')
  const [activeTab, setActiveTab] = useState('manual')
  
  // Current source being edited
  const [sourceType, setSourceType] = useState('book')
  const [sourceData, setSourceData] = useState({})
  const [urlToFetch, setUrlToFetch] = useState('')
  
  // Bibliography list
  const [citations, setCitations] = useState([])
  const [generatedBibliography, setGeneratedBibliography] = useState('')

  // Get current data for drafts
  const getCurrentData = useCallback(() => ({
    title: `Bibliography - ${CITATION_STYLES.find(s => s.id === citationStyle)?.name || 'Citations'}`,
    citationStyle,
    citations,
    generatedBibliography
  }), [citationStyle, citations, generatedBibliography])

  // Load draft data
  const loadDraftData = (data) => {
    if (data.citationStyle) setCitationStyle(data.citationStyle)
    if (data.citations) setCitations(data.citations)
    if (data.generatedBibliography) setGeneratedBibliography(data.generatedBibliography)
  }

  // Update source field
  const updateSourceField = (field, value) => {
    setSourceData(prev => ({ ...prev, [field]: value }))
  }

  // Fetch metadata from URL
  const fetchFromUrl = async () => {
    if (!urlToFetch) {
      toast({ title: 'Please enter a URL', variant: 'destructive' })
      return
    }

    setFetchingUrl(true)
    try {
      const response = await fetch('/api/citation-generator/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch })
      })

      const data = await response.json()
      if (data.success && data.metadata) {
        setSourceData(prev => ({ ...prev, ...data.metadata }))
        setSourceType(data.suggestedType || 'website')
        toast({
          title: 'Metadata Retrieved!',
          description: 'Source information has been auto-filled'
        })
      } else {
        toast({
          title: 'Could not fetch metadata',
          description: 'Please enter the information manually',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Fetch Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setFetchingUrl(false)
    }
  }

  // Add citation to list
  const addCitation = async () => {
    const requiredFields = SOURCE_TYPES.find(t => t.id === sourceType)?.fields.slice(0, 2) || []
    const missingFields = requiredFields.filter(f => !sourceData[f]?.trim())
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.map(f => FIELD_LABELS[f]).join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/citation-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'format-citation',
          sourceType,
          sourceData,
          citationStyle
        })
      })

      const data = await response.json()
      if (data.success) {
        const newCitation = {
          id: Date.now(),
          sourceType,
          sourceData: { ...sourceData },
          formatted: data.citation,
          style: citationStyle
        }
        setCitations(prev => [...prev, newCitation])
        setSourceData({})
        setUrlToFetch('')
        toast({ title: 'Citation Added!' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Failed to format citation',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Remove citation
  const removeCitation = (id) => {
    setCitations(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Citation removed' })
  }

  // Copy citation
  const copyCitation = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copied to clipboard!' })
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' })
    }
  }

  // Generate full bibliography
  const generateBibliography = async () => {
    if (citations.length === 0) {
      toast({ title: 'Add some citations first', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/citation-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-bibliography',
          citations,
          citationStyle
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedBibliography(data.bibliography)
        toast({ title: 'Bibliography Generated!' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Reformat all citations when style changes
  const reformatAllCitations = async () => {
    if (citations.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/citation-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reformat-all',
          citations,
          citationStyle
        })
      })

      const data = await response.json()
      if (data.success) {
        setCitations(data.citations)
        setGeneratedBibliography('')
        toast({ title: `Reformatted to ${CITATION_STYLES.find(s => s.id === citationStyle)?.name}` })
      }
    } catch (error) {
      toast({ title: 'Reformat failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Download bibliography
  const downloadBibliography = async (format = 'txt') => {
    const content = generatedBibliography || citations.map(c => c.formatted).join('\n\n')
    
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bibliography-${citationStyle}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Downloaded!' })
    } else if (format === 'pdf') {
      setLoading(true)
      try {
        const response = await fetch('/api/citation-generator/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-pdf',
            bibliography: content,
            citationStyle
          })
        })

        const data = await response.json()
        if (data.success) {
          window.open(data.pdfUrl, '_blank')
          toast({ title: 'PDF Ready!' })
        }
      } catch (error) {
        toast({ title: 'PDF generation failed', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
  }

  const currentSourceType = SOURCE_TYPES.find(t => t.id === sourceType)
  const currentStyle = CITATION_STYLES.find(s => s.id === citationStyle)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/students-teachers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              Citation Generator
            </h1>
            <p className="text-muted-foreground">Generate accurate citations in any format</p>
          </div>
        </div>
        <AutoSaveDraftsManager
          toolType="citation-generator"
          getCurrentData={getCurrentData}
          loadDraftData={loadDraftData}
          currentStep={1}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Add Citations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Citation Style Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Citation Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CITATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setCitationStyle(style.id)
                      if (citations.length > 0) {
                        reformatAllCitations()
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      citationStyle === style.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {style.name}
                    {style.popular && citationStyle !== style.id && (
                      <span className="ml-1 text-xs opacity-60">★</span>
                    )}
                  </button>
                ))}
              </div>
              {currentStyle && (
                <p className="text-xs text-muted-foreground mt-2">
                  {currentStyle.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Citation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Citation
              </CardTitle>
              <CardDescription>Enter source details or fetch from URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="url">From URL</TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={urlToFetch}
                      onChange={(e) => setUrlToFetch(e.target.value)}
                      placeholder="Paste URL to auto-fill citation details..."
                      className="flex-1"
                    />
                    <Button onClick={fetchFromUrl} disabled={fetchingUrl}>
                      {fetchingUrl ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Search className="h-4 w-4 mr-1" /> Fetch</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports websites, news articles, YouTube videos, and more
                  </p>
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  {/* Source Type Selection */}
                  <div className="space-y-3">
                    <Label>Source Type</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {SOURCE_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSourceType(type.id)
                              setSourceData({})
                            }}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              sourceType === type.id
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                          >
                            <Icon className={`h-5 w-5 mx-auto mb-1 ${
                              sourceType === type.id ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <span className="text-xs font-medium">{type.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Source Fields */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {currentSourceType?.fields.map((field) => (
                  <div key={field} className={`space-y-1 ${field === 'title' || field === 'authors' ? 'md:col-span-2' : ''}`}>
                    <Label className="text-sm">
                      {FIELD_LABELS[field]}
                      {(field === 'authors' || field === 'title') && <span className="text-red-500"> *</span>}
                    </Label>
                    {field === 'title' || field === 'authors' ? (
                      <Textarea
                        value={sourceData[field] || ''}
                        onChange={(e) => updateSourceField(field, e.target.value)}
                        placeholder={FIELD_PLACEHOLDERS[field]}
                        rows={2}
                      />
                    ) : (
                      <Input
                        value={sourceData[field] || ''}
                        onChange={(e) => updateSourceField(field, e.target.value)}
                        placeholder={FIELD_PLACEHOLDERS[field]}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={addCitation} disabled={loading} className="w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Formatting...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Add to Bibliography</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bibliography */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Bibliography
                </CardTitle>
                <Badge variant="secondary">{citations.length} sources</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {citations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Library className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No citations yet</p>
                  <p className="text-xs">Add sources to build your bibliography</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {citations.map((citation, idx) => (
                      <div
                        key={citation.id}
                        className="p-3 bg-muted/50 rounded-lg text-sm group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {SOURCE_TYPES.find(t => t.id === citation.sourceType)?.name}
                              </Badge>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ fontFamily: 'serif' }}>
                              {citation.formatted}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyCitation(citation.formatted)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => removeCitation(citation.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {citations.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <Button
                    onClick={generateBibliography}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Bibliography
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadBibliography('txt')}
                    >
                      <FileDown className="h-4 w-4 mr-1" /> TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadBibliography('pdf')}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyCitation(citations.map(c => c.formatted).join('\n\n'))}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Bibliography Preview */}
          {generatedBibliography && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Formatted Bibliography
                </CardTitle>
                <CardDescription>
                  {currentStyle?.name} format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 bg-white dark:bg-gray-900 border rounded-lg text-sm leading-relaxed"
                  style={{ fontFamily: 'Times New Roman, serif' }}
                >
                  <p className="text-center font-bold mb-4">References</p>
                  {generatedBibliography.split('\n\n').map((entry, idx) => (
                    <p key={idx} className="mb-3 pl-8 -indent-8">
                      {entry}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <CardContent className="py-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Tips</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• For multiple authors, separate with semicolons</li>
                <li>• Use "Last, First M." format for names</li>
                <li>• Include DOI when available for journals</li>
                <li>• Always add access date for websites</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
