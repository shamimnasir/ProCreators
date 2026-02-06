'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Eye, Edit, Loader2, Save, ArrowLeft, Plus, Trash2,
  Globe, Home, Shield, Mail, Users, Cookie, ChevronUp, ChevronDown,
  Search, Filter, RefreshCw, ExternalLink, CheckCircle, XCircle,
  Map, CreditCard, BookOpen, FileQuestion, Video, BarChart, Building,
  GraduationCap, Lock, Activity, Users2, Briefcase, Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Icon mapping
const ICONS = {
  Home, Users, Shield, FileText, Cookie, Mail, Briefcase, Map, CreditCard,
  BookOpen, FileQuestion, Video, BarChart, Building, GraduationCap, Lock, Activity, Users2
}

// Block types for content editing
const BLOCK_TYPES = [
  { id: 'hero', name: 'Hero Section', icon: '🎯' },
  { id: 'heading', name: 'Heading', icon: '📝' },
  { id: 'paragraph', name: 'Paragraph', icon: '📄' },
  { id: 'features', name: 'Features Grid', icon: '✨' },
  { id: 'faq', name: 'FAQ Section', icon: '❓' },
  { id: 'cta', name: 'Call to Action', icon: '🚀' },
  { id: 'steps', name: 'Steps/Process', icon: '📋' },
  { id: 'testimonials', name: 'Testimonials', icon: '💬' },
  { id: 'image', name: 'Image', icon: '🖼️' },
  { id: 'divider', name: 'Divider', icon: '➖' },
  { id: 'custom_html', name: 'Custom HTML', icon: '🔧' }
]

export default function UnifiedPageManager() {
  const [pages, setPages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBlock, setExpandedBlock] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPages()
  }, [activeCategory])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const url = activeCategory === 'all' 
        ? '/api/admin/unified-pages' 
        : `/api/admin/unified-pages?category=${activeCategory}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setPages(data.pages)
        if (data.categories) setCategories(data.categories)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadPage = async (pageId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/unified-pages?pageId=${pageId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedPage(data.page)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const savePage = async () => {
    if (!selectedPage) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/unified-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPage)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Saved!', description: 'Page updated successfully' })
        setSelectedPage(data.page)
        fetchPages()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const resetPage = async (pageId) => {
    if (!confirm('Reset this page to default? All customizations will be lost.')) return
    try {
      const res = await fetch(`/api/admin/unified-pages?pageId=${pageId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Reset!', description: 'Page reset to default' })
        setSelectedPage(null)
        fetchPages()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const updateField = (path, value) => {
    setSelectedPage(prev => {
      const updated = { ...prev }
      const parts = path.split('.')
      let current = updated
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {}
        current = current[parts[i]]
      }
      current[parts[parts.length - 1]] = value
      return updated
    })
  }

  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getBlockTemplate(type)
    }
    setSelectedPage(prev => ({
      ...prev,
      contentBlocks: [...(prev.contentBlocks || []), newBlock]
    }))
    setExpandedBlock(newBlock.id)
  }

  const updateBlock = (blockId, content) => {
    setSelectedPage(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(b => 
        b.id === blockId ? { ...b, content } : b
      )
    }))
  }

  const deleteBlock = (blockId) => {
    setSelectedPage(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(b => b.id !== blockId)
    }))
  }

  const moveBlock = (blockId, direction) => {
    const blocks = [...(selectedPage.contentBlocks || [])]
    const index = blocks.findIndex(b => b.id === blockId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [block] = blocks.splice(index, 1)
    blocks.splice(newIndex, 0, block)
    
    setSelectedPage(prev => ({ ...prev, contentBlocks: blocks }))
  }

  const getBlockTemplate = (type) => {
    const templates = {
      hero: { title: 'Page Title', subtitle: 'Page description', alignment: 'center' },
      heading: { text: 'Section Heading', level: 2 },
      paragraph: { text: 'Your content here...' },
      features: { title: 'Features', columns: 3, items: [
        { icon: '⭐', title: 'Feature 1', description: 'Description' }
      ]},
      faq: { title: 'FAQ', items: [{ question: 'Question?', answer: 'Answer' }]},
      cta: { title: 'Get Started', subtitle: 'Join us today', buttonText: 'Sign Up', buttonLink: '/login' },
      steps: { title: 'How It Works', items: [{ title: 'Step 1', description: 'Description' }]},
      testimonials: { title: 'Testimonials', items: [{ name: 'User', role: 'Creator', quote: 'Great!' }]},
      image: { url: '', alt: '', caption: '', fullWidth: false },
      divider: {},
      custom_html: { html: '' }
    }
    return templates[type] || {}
  }

  // Filter pages by search
  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Render page list
  if (!selectedPage) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Page Manager</h1>
            <p className="text-muted-foreground">Manage all website pages from one place</p>
          </div>
          <Button variant="outline" onClick={fetchPages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search pages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={activeCategory === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Page List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPages.map((page) => {
              const IconComponent = ICONS[page.icon] || FileText
              return (
                <Card key={page.pageId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{page.title}</CardTitle>
                          <CardDescription className="text-xs">{page.path}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">{page.category}</Badge>
                      <Badge variant={page.isCustomized ? 'default' : 'secondary'} className="text-xs">
                        {page.isCustomized ? 'Customized' : 'Default'}
                      </Badge>
                      {page.isPublished ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => loadPage(page.pageId)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <Link href={page.path} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {filteredPages.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            No pages found matching your search.
          </div>
        )}
      </div>
    )
  }

  // Render page editor
  const IconComponent = ICONS[selectedPage.icon] || FileText
  const isContentPage = ['content', 'solution'].includes(selectedPage.type)
  const isRoadmapPage = selectedPage.type === 'roadmap'
  const isLandingPage = selectedPage.type === 'landing'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPage(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedPage.title}</h1>
              <p className="text-muted-foreground text-sm">{selectedPage.path}</p>
            </div>
          </div>
          <Badge variant="outline">{selectedPage.type}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={selectedPage.path} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          {selectedPage.isCustomized && (
            <Button variant="outline" onClick={() => resetPage(selectedPage.pageId)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={savePage} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {isContentPage && (
            <ContentBlocksEditor 
              blocks={selectedPage.contentBlocks || []}
              expandedBlock={expandedBlock}
              setExpandedBlock={setExpandedBlock}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onMoveBlock={moveBlock}
            />
          )}

          {isRoadmapPage && (
            <RoadmapEditor 
              page={selectedPage}
              onUpdate={updateField}
            />
          )}

          {isLandingPage && (
            <LandingPageEditor 
              page={selectedPage}
              onUpdate={updateField}
            />
          )}

          {!isContentPage && !isRoadmapPage && !isLandingPage && (
            <Card>
              <CardHeader>
                <CardTitle>Page Type: {selectedPage.type}</CardTitle>
                <CardDescription>
                  This page type has specific settings. Edit via the Settings tab or use custom data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Custom Data (JSON)</Label>
                    <Textarea 
                      value={JSON.stringify(selectedPage.customData || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          updateField('customData', parsed)
                        } catch {}
                      }}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
              <CardDescription>Optimize your page for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input 
                  value={selectedPage.seo?.metaTitle || ''} 
                  onChange={(e) => updateField('seo.metaTitle', e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-muted-foreground">{(selectedPage.seo?.metaTitle || '').length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={selectedPage.seo?.metaDescription || ''} 
                  onChange={(e) => updateField('seo.metaDescription', e.target.value)}
                  placeholder="Brief description for search results"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{(selectedPage.seo?.metaDescription || '').length}/160 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Canonical URL (optional)</Label>
                <Input 
                  value={selectedPage.seo?.canonicalUrl || ''} 
                  onChange={(e) => updateField('seo.canonicalUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Open Graph Image URL (optional)</Label>
                <Input 
                  value={selectedPage.seo?.ogImage || ''} 
                  onChange={(e) => updateField('seo.ogImage', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>Configure page visibility and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">Make this page visible to visitors</p>
                </div>
                <Switch 
                  checked={selectedPage.isPublished ?? true}
                  onCheckedChange={(checked) => updateField('isPublished', checked)}
                />
              </div>
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold mb-3 block">Page Information</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Page ID:</span>
                    <span className="ml-2 font-mono">{selectedPage.pageId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{selectedPage.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{selectedPage.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Path:</span>
                    <span className="ml-2 font-mono">{selectedPage.path}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Content Blocks Editor Component
function ContentBlocksEditor({ blocks, expandedBlock, setExpandedBlock, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Blocks</CardTitle>
        <CardDescription>Build your page with content blocks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocks.map((block, index) => (
          <div 
            key={block.id} 
            className={`border rounded-lg ${expandedBlock === block.id ? 'ring-2 ring-primary' : ''}`}
          >
            <div 
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
              onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
            >
              <div className="flex items-center gap-2">
                <span>{BLOCK_TYPES.find(b => b.id === block.type)?.icon || '📦'}</span>
                <span className="font-medium">{BLOCK_TYPES.find(b => b.id === block.type)?.name || block.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'up'); }}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'down'); }}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {expandedBlock === block.id && (
              <div className="p-4 border-t bg-muted/30">
                <BlockEditor block={block} onUpdate={(content) => onUpdateBlock(block.id, content)} />
              </div>
            )}
          </div>
        ))}

        {/* Add block buttons */}
        <div className="pt-4 border-t">
          <Label className="mb-3 block">Add Content Block</Label>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <Button 
                key={type.id} 
                variant="outline" 
                size="sm"
                onClick={() => onAddBlock(type.id)}
              >
                <span className="mr-1">{type.icon}</span>
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Block Editor Component
function BlockEditor({ block, onUpdate }) {
  const { type, content } = block

  const update = (field, value) => {
    onUpdate({ ...content, [field]: value })
  }

  const updateItem = (index, field, value) => {
    const items = [...(content.items || [])]
    items[index] = { ...items[index], [field]: value }
    onUpdate({ ...content, items })
  }

  const addItem = () => {
    const items = [...(content.items || [])]
    const templates = {
      features: { icon: '⭐', title: 'New Feature', description: 'Description' },
      faq: { question: 'New Question?', answer: 'Answer' },
      steps: { title: 'New Step', description: 'Description' },
      testimonials: { name: 'Name', role: 'Role', quote: 'Quote' }
    }
    items.push(templates[type] || {})
    onUpdate({ ...content, items })
  }

  const removeItem = (index) => {
    const items = content.items.filter((_, i) => i !== index)
    onUpdate({ ...content, items })
  }

  switch (type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} /></div>
          <div><Label>Subtitle</Label><Textarea value={content.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} rows={2} /></div>
          <div><Label>Badge (optional)</Label><Input value={content.badge || ''} onChange={(e) => update('badge', e.target.value)} placeholder="e.g., New" /></div>
        </div>
      )
    case 'heading':
      return (
        <div className="space-y-3">
          <div><Label>Text</Label><Input value={content.text || ''} onChange={(e) => update('text', e.target.value)} /></div>
          <div><Label>Level</Label>
            <select className="w-full border rounded px-3 py-2" value={content.level || 2} onChange={(e) => update('level', parseInt(e.target.value))}>
              <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
            </select>
          </div>
        </div>
      )
    case 'paragraph':
      return <div><Label>Content</Label><Textarea value={content.text || ''} onChange={(e) => update('text', e.target.value)} rows={4} /></div>
    case 'image':
      return (
        <div className="space-y-3">
          <div><Label>Image URL</Label><Input value={content.url || ''} onChange={(e) => update('url', e.target.value)} /></div>
          <div><Label>Alt Text</Label><Input value={content.alt || ''} onChange={(e) => update('alt', e.target.value)} /></div>
          <div><Label>Caption</Label><Input value={content.caption || ''} onChange={(e) => update('caption', e.target.value)} /></div>
        </div>
      )
    case 'custom_html':
      return <div><Label>HTML Code</Label><Textarea value={content.html || ''} onChange={(e) => update('html', e.target.value)} rows={6} className="font-mono text-sm" /></div>
    case 'cta':
      return (
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} /></div>
          <div><Label>Subtitle</Label><Input value={content.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} /></div>
          <div><Label>Button Text</Label><Input value={content.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} /></div>
          <div><Label>Button Link</Label><Input value={content.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} /></div>
        </div>
      )
    case 'features':
    case 'steps':
    case 'faq':
    case 'testimonials':
      return (
        <div className="space-y-3">
          <div><Label>Section Title</Label><Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} /></div>
          {type === 'features' && (
            <div><Label>Columns</Label>
              <select className="w-full border rounded px-3 py-2" value={content.columns || 3} onChange={(e) => update('columns', parseInt(e.target.value))}>
                <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Items</Label>
            {content.items?.map((item, i) => (
              <div key={i} className="p-3 border rounded bg-background space-y-2">
                {type === 'features' && (<><Input placeholder="Icon" value={item.icon || ''} onChange={(e) => updateItem(i, 'icon', e.target.value)} /><Input placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(i, 'title', e.target.value)} /><Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} /></>)}
                {type === 'faq' && (<><Input placeholder="Question" value={item.question || ''} onChange={(e) => updateItem(i, 'question', e.target.value)} /><Textarea placeholder="Answer" value={item.answer || ''} onChange={(e) => updateItem(i, 'answer', e.target.value)} rows={2} /></>)}
                {type === 'steps' && (<><Input placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(i, 'title', e.target.value)} /><Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} /></>)}
                {type === 'testimonials' && (<><Input placeholder="Name" value={item.name || ''} onChange={(e) => updateItem(i, 'name', e.target.value)} /><Input placeholder="Role" value={item.role || ''} onChange={(e) => updateItem(i, 'role', e.target.value)} /><Textarea placeholder="Quote" value={item.quote || ''} onChange={(e) => updateItem(i, 'quote', e.target.value)} rows={2} /></>)}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
          </div>
        </div>
      )
    default:
      return <p className="text-muted-foreground">No editor for this block type</p>
  }
}

// Roadmap Editor Component
function RoadmapEditor({ page, onUpdate }) {
  const quarters = page.quarters || []

  const addQuarter = () => {
    const newQuarter = {
      id: `q-${Date.now()}`,
      quarter: 'Q1 2026',
      status: 'planned',
      features: [{ name: 'New Feature', description: 'Description', completed: false }]
    }
    onUpdate('quarters', [...quarters, newQuarter])
  }

  const updateQuarter = (index, field, value) => {
    const updated = [...quarters]
    updated[index] = { ...updated[index], [field]: value }
    onUpdate('quarters', updated)
  }

  const deleteQuarter = (index) => {
    onUpdate('quarters', quarters.filter((_, i) => i !== index))
  }

  const addFeature = (qIndex) => {
    const updated = [...quarters]
    updated[qIndex].features = [...(updated[qIndex].features || []), { name: 'New Feature', description: '', completed: false }]
    onUpdate('quarters', updated)
  }

  const updateFeature = (qIndex, fIndex, field, value) => {
    const updated = [...quarters]
    updated[qIndex].features[fIndex] = { ...updated[qIndex].features[fIndex], [field]: value }
    onUpdate('quarters', updated)
  }

  const deleteFeature = (qIndex, fIndex) => {
    const updated = [...quarters]
    updated[qIndex].features = updated[qIndex].features.filter((_, i) => i !== fIndex)
    onUpdate('quarters', updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Roadmap Quarters</CardTitle>
            <CardDescription>Manage your product roadmap</CardDescription>
          </div>
          <Button onClick={addQuarter}><Plus className="h-4 w-4 mr-2" /> Add Quarter</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {quarters.map((quarter, qIndex) => (
          <div key={quarter.id || qIndex} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input value={quarter.quarter} onChange={(e) => updateQuarter(qIndex, 'quarter', e.target.value)} className="w-32" />
                <select className="border rounded px-3 py-2" value={quarter.status} onChange={(e) => updateQuarter(qIndex, 'status', e.target.value)}>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuarter(qIndex)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              {quarter.features?.map((feature, fIndex) => (
                <div key={fIndex} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                  <input type="checkbox" checked={feature.completed} onChange={(e) => updateFeature(qIndex, fIndex, 'completed', e.target.checked)} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Input value={feature.name} onChange={(e) => updateFeature(qIndex, fIndex, 'name', e.target.value)} placeholder="Feature name" />
                    <Input value={feature.description || ''} onChange={(e) => updateFeature(qIndex, fIndex, 'description', e.target.value)} placeholder="Description" className="text-sm" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteFeature(qIndex, fIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addFeature(qIndex)}><Plus className="h-3 w-3 mr-1" /> Add Feature</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Landing Page Editor Component
function LandingPageEditor({ page, onUpdate }) {
  const sections = page.sections || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landing Page Sections</CardTitle>
        <CardDescription>Enable/disable and configure homepage sections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta'].map(section => (
          <div key={section} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="capitalize">{section} Section</Label>
              <p className="text-sm text-muted-foreground">Show {section} section on homepage</p>
            </div>
            <Switch 
              checked={sections[section]?.enabled ?? true}
              onCheckedChange={(checked) => onUpdate(`sections.${section}.enabled`, checked)}
            />
          </div>
        ))}
        <p className="text-sm text-muted-foreground pt-4">
          Note: The homepage content is primarily controlled by the main homepage component. 
          Use the static pages editor for detailed homepage customization.
        </p>
      </CardContent>
    </Card>
  )
}
