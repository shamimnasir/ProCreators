'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  FileText,
  Eye,
  Edit,
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Globe,
  Home,
  Shield,
  Mail,
  Users,
  Cookie,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import Link from 'next/link'

const PAGE_ICONS = {
  about: Users,
  privacy: Shield,
  terms: FileText,
  contact: Mail,
  careers: Users,
  cookies: Cookie,
  homepage: Home
}

const BLOCK_TYPES = [
  { id: 'hero', name: 'Hero Section', icon: '🎯' },
  { id: 'heading', name: 'Heading', icon: '📝' },
  { id: 'paragraph', name: 'Paragraph', icon: '📄' },
  { id: 'features', name: 'Features Grid', icon: '✨' },
  { id: 'faq', name: 'FAQ Section', icon: '❓' },
  { id: 'cta', name: 'Call to Action', icon: '🚀' },
  { id: 'steps', name: 'Steps/Process', icon: '📋' },
  { id: 'testimonials', name: 'Testimonials', icon: '💬' },
  { id: 'divider', name: 'Divider', icon: '➖' }
]

export default function StaticPagesManager() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState(null)
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/static-pages')
      const data = await res.json()
      if (data.success) {
        setPages(data.pages)
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
      // First try admin endpoint
      const res = await fetch(`/api/admin/static-pages?pageId=${pageId}`)
      const data = await res.json()
      
      if (data.success) {
        setSelectedPage(data.page)
      } else {
        // Page doesn't exist yet, fetch from public API to get template
        const publicRes = await fetch(`/api/static-pages/${pageId}`)
        const publicData = await publicRes.json()
        if (publicData.success) {
          setSelectedPage(publicData.page)
        }
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
      const res = await fetch('/api/admin/static-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
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

  const updateField = (field, value) => {
    setSelectedPage(prev => ({ ...prev, [field]: value }))
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
    const blocks = [...selectedPage.contentBlocks]
    const index = blocks.findIndex(b => b.id === blockId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [block] = blocks.splice(index, 1)
    blocks.splice(newIndex, 0, block)
    
    setSelectedPage(prev => ({ ...prev, contentBlocks: blocks }))
  }

  const getBlockTemplate = (type) => {
    switch (type) {
      case 'hero':
        return { title: 'Page Title', subtitle: 'Page description goes here', alignment: 'center' }
      case 'heading':
        return { text: 'Section Heading', level: 2 }
      case 'paragraph':
        return { text: 'Your content goes here...' }
      case 'features':
        return { title: 'Features', columns: 3, items: [
          { icon: '⭐', title: 'Feature 1', description: 'Description' },
          { icon: '🚀', title: 'Feature 2', description: 'Description' },
          { icon: '💡', title: 'Feature 3', description: 'Description' }
        ]}
      case 'faq':
        return { title: 'FAQ', items: [
          { question: 'Question 1?', answer: 'Answer 1' }
        ]}
      case 'cta':
        return { title: 'Ready to get started?', subtitle: 'Join thousands of creators', buttonText: 'Get Started', buttonLink: '/login' }
      case 'steps':
        return { title: 'How It Works', items: [
          { title: 'Step 1', description: 'First step description' }
        ]}
      case 'testimonials':
        return { title: 'What People Say', items: [
          { name: 'John Doe', role: 'Creator', quote: 'Amazing platform!' }
        ]}
      case 'divider':
        return {}
      default:
        return {}
    }
  }

  // Render page list view
  if (!selectedPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Static Pages</h1>
            <p className="text-muted-foreground">Manage your website's static pages (About, Privacy, Terms, etc.)</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => {
              const Icon = PAGE_ICONS[page.pageId] || FileText
              return (
                <Card key={page.pageId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{page.title}</CardTitle>
                          <CardDescription>/{page.pageId}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={page.exists ? 'default' : 'secondary'}>
                        {page.exists ? 'Customized' : 'Default'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                        <Link href={`/${page.pageId}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render page editor view
  const Icon = PAGE_ICONS[selectedPage.pageId] || FileText
  
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
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedPage.title || 'Edit Page'}</h1>
              <p className="text-muted-foreground">/{selectedPage.pageId}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/${selectedPage.pageId}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button onClick={savePage} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meta/SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>SEO and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Page Title</Label>
              <Input 
                value={selectedPage.title || ''} 
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Page title"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Title (SEO)</Label>
              <Input 
                value={selectedPage.metaTitle || ''} 
                onChange={(e) => updateField('metaTitle', e.target.value)}
                placeholder="SEO title"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea 
                value={selectedPage.metaDescription || ''} 
                onChange={(e) => updateField('metaDescription', e.target.value)}
                placeholder="SEO description"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>Published</Label>
              <Switch 
                checked={selectedPage.isPublished ?? true}
                onCheckedChange={(checked) => updateField('isPublished', checked)}
              />
            </div>
            
            {/* Schema Settings */}
            <div className="pt-4 border-t mt-4">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔍 Schema.org Settings
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                JSON-LD structured data is automatically generated. Customize the key values below:
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Schema Type</Label>
                  <select 
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={selectedPage.schemaType || 'auto'}
                    onChange={(e) => updateField('schemaType', e.target.value)}
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="Organization">Organization</option>
                    <option value="WebPage">WebPage</option>
                    <option value="FAQPage">FAQPage</option>
                    <option value="AboutPage">AboutPage</option>
                    <option value="ContactPage">ContactPage</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Custom Schema (JSON)</Label>
                  <Textarea 
                    value={selectedPage.customSchema || ''} 
                    onChange={(e) => updateField('customSchema', e.target.value)}
                    placeholder='{"@type": "Organization", ...}'
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated schema. Add custom JSON-LD to override.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Blocks</CardTitle>
                  <CardDescription>Build your page with content blocks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Block list */}
              {selectedPage.contentBlocks?.map((block, index) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {expandedBlock === block.id && (
                    <div className="p-4 border-t bg-muted/30">
                      <BlockEditor block={block} onUpdate={(content) => updateBlock(block.id, content)} />
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
                      onClick={() => addBlock(type.id)}
                    >
                      <span className="mr-1">{type.icon}</span>
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Block editor component
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
    if (type === 'features') {
      items.push({ icon: '⭐', title: 'New Feature', description: 'Description' })
    } else if (type === 'faq') {
      items.push({ question: 'New Question?', answer: 'Answer' })
    } else if (type === 'steps') {
      items.push({ title: 'New Step', description: 'Description' })
    } else if (type === 'testimonials') {
      items.push({ name: 'Name', role: 'Role', quote: 'Quote' })
    }
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
          <div>
            <Label>Title</Label>
            <Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea value={content.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Badge (optional)</Label>
            <Input value={content.badge || ''} onChange={(e) => update('badge', e.target.value)} placeholder="e.g., New, Updated" />
          </div>
        </div>
      )

    case 'heading':
      return (
        <div className="space-y-3">
          <div>
            <Label>Text</Label>
            <Input value={content.text || ''} onChange={(e) => update('text', e.target.value)} />
          </div>
          <div>
            <Label>Level</Label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={content.level || 2}
              onChange={(e) => update('level', parseInt(e.target.value))}
            >
              <option value={1}>H1 - Main Heading</option>
              <option value={2}>H2 - Section Heading</option>
              <option value={3}>H3 - Subsection</option>
            </select>
          </div>
        </div>
      )

    case 'paragraph':
      return (
        <div>
          <Label>Content</Label>
          <Textarea value={content.text || ''} onChange={(e) => update('text', e.target.value)} rows={4} />
        </div>
      )

    case 'features':
    case 'steps':
    case 'faq':
    case 'testimonials':
      return (
        <div className="space-y-3">
          <div>
            <Label>Section Title</Label>
            <Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} />
          </div>
          {type === 'features' && (
            <div>
              <Label>Columns</Label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={content.columns || 3}
                onChange={(e) => update('columns', parseInt(e.target.value))}
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Items</Label>
            {content.items?.map((item, i) => (
              <div key={i} className="p-3 border rounded bg-background space-y-2">
                {type === 'features' && (
                  <>
                    <Input placeholder="Icon emoji" value={item.icon || ''} onChange={(e) => updateItem(i, 'icon', e.target.value)} />
                    <Input placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(i, 'title', e.target.value)} />
                    <Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  </>
                )}
                {type === 'faq' && (
                  <>
                    <Input placeholder="Question" value={item.question || ''} onChange={(e) => updateItem(i, 'question', e.target.value)} />
                    <Textarea placeholder="Answer" value={item.answer || ''} onChange={(e) => updateItem(i, 'answer', e.target.value)} rows={2} />
                  </>
                )}
                {type === 'steps' && (
                  <>
                    <Input placeholder="Step title" value={item.title || ''} onChange={(e) => updateItem(i, 'title', e.target.value)} />
                    <Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  </>
                )}
                {type === 'testimonials' && (
                  <>
                    <Input placeholder="Name" value={item.name || ''} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                    <Input placeholder="Role" value={item.role || ''} onChange={(e) => updateItem(i, 'role', e.target.value)} />
                    <Textarea placeholder="Quote" value={item.quote || ''} onChange={(e) => updateItem(i, 'quote', e.target.value)} rows={2} />
                  </>
                )}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={content.title || ''} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={content.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} />
          </div>
          <div>
            <Label>Button Text</Label>
            <Input value={content.buttonText || ''} onChange={(e) => update('buttonText', e.target.value)} />
          </div>
          <div>
            <Label>Button Link</Label>
            <Input value={content.buttonLink || ''} onChange={(e) => update('buttonLink', e.target.value)} />
          </div>
        </div>
      )

    default:
      return <p className="text-muted-foreground">No editor for this block type</p>
  }
}
