'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, 
  ChevronUp, ChevronDown, Loader2, Settings, FileText,
  Image, Type, List, HelpCircle, Play, Quote, DollarSign,
  BarChart, Minus, Code, Layout, Columns, Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BLOCK_ICONS = {
  hero: Layout,
  heading: Type,
  paragraph: FileText,
  features: Star,
  faq: HelpCircle,
  image: Image,
  video: Play,
  cta: Columns,
  testimonials: Quote,
  pricing: DollarSign,
  steps: List,
  stats: BarChart,
  divider: Minus,
  custom_html: Code,
  gallery: Image,
  comparison: Columns
}

const BLOCK_NAMES = {
  hero: 'Hero Section',
  heading: 'Heading',
  paragraph: 'Paragraph',
  features: 'Features Grid',
  faq: 'FAQ Section',
  image: 'Image',
  video: 'Video Embed',
  cta: 'Call to Action',
  testimonials: 'Testimonials',
  pricing: 'Pricing Table',
  steps: 'How It Works',
  stats: 'Statistics',
  divider: 'Divider',
  custom_html: 'Custom HTML',
  gallery: 'Image Gallery',
  comparison: 'Comparison Table'
}

export default function EditPagePage({ params }) {
  const resolvedParams = use(params)
  const toolId = resolvedParams.toolId
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('seo')
  const [blockTypes, setBlockTypes] = useState([])
  const [expandedBlock, setExpandedBlock] = useState(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPage()
    fetchBlockTypes()
  }, [toolId])

  const fetchPage = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pages?toolId=${toolId}`)
      const data = await res.json()
      if (data.success) {
        setPage(data.page)
      } else {
        // Initialize page if it doesn't exist
        const initRes = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, toolName: toolId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), action: 'initialize' })
        })
        const initData = await initRes.json()
        if (initData.success) {
          setPage(initData.page)
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBlockTypes = async () => {
    try {
      const res = await fetch('/api/admin/pages/blocks')
      const data = await res.json()
      if (data.success) {
        setBlockTypes(data.blockTypes)
      }
    } catch (error) {
      console.error('Error fetching block types:', error)
    }
  }

  const savePage = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          seo: page.seo,
          contentBlocks: page.contentBlocks,
          isPublished: page.isPublished
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Saved!', description: 'Page updated successfully' })
        setPage(data.page)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateSeo = (field, value) => {
    setPage(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }))
  }

  const addBlock = (type) => {
    const template = blockTypes.find(bt => bt.id === type)?.template || {}
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: { ...template },
      order: page.contentBlocks.length
    }
    setPage(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }))
    setExpandedBlock(newBlock.id)
  }

  const updateBlock = (blockId, content) => {
    setPage(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(b => 
        b.id === blockId ? { ...b, content } : b
      )
    }))
  }

  const deleteBlock = (blockId) => {
    setPage(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(b => b.id !== blockId)
    }))
  }

  const moveBlock = (blockId, direction) => {
    const blocks = [...page.contentBlocks]
    const index = blocks.findIndex(b => b.id === blockId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [block] = blocks.splice(index, 1)
    blocks.splice(newIndex, 0, block)
    
    setPage(prev => ({ ...prev, contentBlocks: blocks }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Page not found</p>
        <Link href="/dashboard/admin/pages">
          <Button className="mt-4">Back to Pages</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/pages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{page.seo?.metaTitle || toolId}</h1>
            <p className="text-muted-foreground">{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch 
              checked={page.isPublished} 
              onCheckedChange={(checked) => setPage(prev => ({ ...prev, isPublished: checked }))}
            />
            <Label>Published</Label>
          </div>
          <Link href={`/dashboard/tools/${toolId}`} target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
          </Link>
          <Button onClick={savePage} disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="seo">
            <Settings className="h-4 w-4 mr-2" /> SEO Settings
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" /> Content Blocks
          </TabsTrigger>
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
              <CardDescription>Optimize how this page appears in search results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input 
                  value={page.seo?.metaTitle || ''} 
                  onChange={(e) => updateSeo('metaTitle', e.target.value)}
                  placeholder="Page Title | ProCreators"
                />
                <p className="text-xs text-muted-foreground">
                  {(page.seo?.metaTitle || '').length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={page.seo?.metaDescription || ''} 
                  onChange={(e) => updateSeo('metaDescription', e.target.value)}
                  placeholder="A brief description of this page for search engines..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {(page.seo?.metaDescription || '').length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input 
                  value={(page.seo?.keywords || []).join(', ')} 
                  onChange={(e) => updateSeo('keywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input 
                  value={page.seo?.ogImage || ''} 
                  onChange={(e) => updateSeo('ogImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Search Result Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {page.seo?.metaTitle || 'Page Title'}
                </p>
                <p className="text-green-700 text-sm">
                  procreators.com{page.slug}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {page.seo?.metaDescription || 'Page description will appear here...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Blocks Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Add Block */}
          <Card>
            <CardHeader>
              <CardTitle>Add Content Block</CardTitle>
              <CardDescription>Click a block type to add it to the page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Object.entries(BLOCK_NAMES).map(([type, name]) => {
                  const Icon = BLOCK_ICONS[type] || FileText
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => addBlock(type)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] text-center">{name}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <div className="space-y-3">
            {page.contentBlocks?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content blocks yet</p>
                  <p className="text-sm">Add blocks above to build your page</p>
                </CardContent>
              </Card>
            ) : (
              page.contentBlocks?.map((block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  total={page.contentBlocks.length}
                  expanded={expandedBlock === block.id}
                  onToggle={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                  onUpdate={(content) => updateBlock(block.id, content)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Block Editor Component
function BlockEditor({ block, index, total, expanded, onToggle, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const Icon = BLOCK_ICONS[block.type] || FileText
  const name = BLOCK_NAMES[block.type] || block.type

  return (
    <Card className={expanded ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="py-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">Block {index + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="border-t pt-4">
          <BlockContentEditor type={block.type} content={block.content} onUpdate={onUpdate} />
        </CardContent>
      )}
    </Card>
  )
}

// Block Content Editor - Different UI for each block type
function BlockContentEditor({ type, content, onUpdate }) {
  const updateField = (field, value) => {
    onUpdate({ ...content, [field]: value })
  }

  const updateArrayItem = (field, index, key, value) => {
    const newArray = [...(content[field] || [])]
    newArray[index] = { ...newArray[index], [key]: value }
    onUpdate({ ...content, [field]: newArray })
  }

  const addArrayItem = (field, template) => {
    const newArray = [...(content[field] || []), template]
    onUpdate({ ...content, [field]: newArray })
  }

  const removeArrayItem = (field, index) => {
    const newArray = (content[field] || []).filter((_, i) => i !== index)
    onUpdate({ ...content, [field]: newArray })
  }

  switch (type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={content.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input value={content.ctaText || ''} onChange={(e) => updateField('ctaText', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input value={content.ctaLink || ''} onChange={(e) => updateField('ctaLink', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Background Image URL</Label>
            <Input value={content.backgroundImage || ''} onChange={(e) => updateField('backgroundImage', e.target.value)} />
          </div>
        </div>
      )

    case 'heading':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Text</Label>
            <Input value={content.text || ''} onChange={(e) => updateField('text', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={content.level || 'h2'} onValueChange={(v) => updateField('level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1 - Main Title</SelectItem>
                  <SelectItem value="h2">H2 - Section Title</SelectItem>
                  <SelectItem value="h3">H3 - Subsection</SelectItem>
                  <SelectItem value="h4">H4 - Small Heading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={content.alignment || 'left'} onValueChange={(v) => updateField('alignment', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )

    case 'paragraph':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Text</Label>
            <Textarea value={content.text || ''} onChange={(e) => updateField('text', e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select value={content.alignment || 'left'} onValueChange={(v) => updateField('alignment', v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'features':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select value={String(content.columns || 3)} onValueChange={(v) => updateField('columns', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 bg-muted rounded-lg">
                <Input className="w-16" placeholder="Icon" value={item.icon || ''} onChange={(e) => updateArrayItem('items', idx, 'icon', e.target.value)} />
                <Input className="flex-1" placeholder="Title" value={item.title || ''} onChange={(e) => updateArrayItem('items', idx, 'title', e.target.value)} />
                <Input className="flex-1" placeholder="Description" value={item.description || ''} onChange={(e) => updateArrayItem('items', idx, 'description', e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('items', idx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('items', { icon: '✨', title: '', description: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Feature
            </Button>
          </div>
        </div>
      )

    case 'faq':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Questions & Answers</Label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex gap-2">
                  <Input className="flex-1" placeholder="Question" value={item.question || ''} onChange={(e) => updateArrayItem('items', idx, 'question', e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => removeArrayItem('items', idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea placeholder="Answer" value={item.answer || ''} onChange={(e) => updateArrayItem('items', idx, 'answer', e.target.value)} rows={2} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('items', { question: '', answer: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add FAQ
            </Button>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={content.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={content.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input value={content.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={content.style || 'primary'} onValueChange={(v) => updateField('style', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )

    case 'steps':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <Input className="flex-1" placeholder="Step Title" value={item.title || ''} onChange={(e) => updateArrayItem('items', idx, 'title', e.target.value)} />
                <Input className="flex-1" placeholder="Description" value={item.description || ''} onChange={(e) => updateArrayItem('items', idx, 'description', e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('items', idx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('items', { step: (content.items?.length || 0) + 1, title: '', description: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Step
            </Button>
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={content.url || ''} onChange={(e) => updateField('url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input value={content.alt || ''} onChange={(e) => updateField('alt', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input value={content.caption || ''} onChange={(e) => updateField('caption', e.target.value)} />
            </div>
          </div>
        </div>
      )

    case 'video':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Video URL (YouTube/Vimeo)</Label>
            <Input value={content.url || ''} onChange={(e) => updateField('url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={content.title || ''} onChange={(e) => updateField('title', e.target.value)} />
          </div>
        </div>
      )

    case 'custom_html':
      return (
        <div className="space-y-2">
          <Label>Custom HTML</Label>
          <Textarea 
            value={content.html || ''} 
            onChange={(e) => updateField('html', e.target.value)} 
            rows={8}
            className="font-mono text-sm"
            placeholder="<div>Your custom HTML here...</div>"
          />
        </div>
      )

    case 'stats':
      return (
        <div className="space-y-4">
          <Label>Statistics</Label>
          {(content.items || []).map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center p-3 bg-muted rounded-lg">
              <Input className="w-24" placeholder="Value" value={item.value || ''} onChange={(e) => updateArrayItem('items', idx, 'value', e.target.value)} />
              <Input className="flex-1" placeholder="Label" value={item.label || ''} onChange={(e) => updateArrayItem('items', idx, 'label', e.target.value)} />
              <Button variant="ghost" size="icon" onClick={() => removeArrayItem('items', idx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addArrayItem('items', { value: '', label: '' })}>
            <Plus className="h-4 w-4 mr-1" /> Add Stat
          </Button>
        </div>
      )

    case 'divider':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={content.style || 'line'} onValueChange={(v) => updateField('style', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="space">Space Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Spacing</Label>
            <Select value={content.spacing || 'medium'} onValueChange={(v) => updateField('spacing', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-muted-foreground text-sm">
          Editor for "{type}" block type not implemented yet.
        </div>
      )
  }
}
