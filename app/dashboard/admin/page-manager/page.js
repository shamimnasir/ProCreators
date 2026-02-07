'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Eye, Edit, Loader2, Save, ArrowLeft, Plus, Trash2,
  Globe, Home, Shield, Mail, Users, Cookie, ChevronUp, ChevronDown,
  Search, Filter, RefreshCw, ExternalLink, CheckCircle, XCircle,
  Map, CreditCard, BookOpen, FileQuestion, Video, BarChart, Building,
  GraduationCap, Lock, Activity, Users2, Briefcase, Settings, Database,
  Check, X, Wrench, Layout, Code, Menu, Link2, PlusCircle, Upload, Image,
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, ImagePlus, Link as LinkIcon, Type
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import Link from 'next/link'

// Icon mapping
const ICONS = {
  Home, Users, Shield, FileText, Cookie, Mail, Briefcase, Map, CreditCard,
  BookOpen, FileQuestion, Video, BarChart, Building, GraduationCap, Lock, Activity, Users2, Wrench
}

// Page types for new pages
const PAGE_TYPES = [
  { id: 'content', name: 'Content Page', description: 'Standard page with content blocks' },
  { id: 'solution', name: 'Solution Page', description: 'Page for a specific audience/solution' },
  { id: 'landing', name: 'Landing Page', description: 'Marketing/landing page' }
]

// Categories for new pages
const PAGE_CATEGORIES = ['Custom', 'Company', 'Legal', 'Product', 'Support', 'Solutions', 'Marketing']

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
  const [activeTab, setActiveTab] = useState('website')
  const [pages, setPages] = useState([])
  const [tools, setTools] = useState([])
  const [menus, setMenus] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [blogStats, setBlogStats] = useState({})
  const [blogCategories, setBlogCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBlock, setExpandedBlock] = useState(null)
  const [initializing, setInitializing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreatePostModal, setShowCreatePostModal] = useState(false)
  const [newPage, setNewPage] = useState({ title: '', type: 'content', category: 'Custom' })
  const [newPost, setNewPost] = useState({ title: '', category: 'Uncategorized', excerpt: '' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const contentEditorRef = useRef(null)
  const { toast } = useToast()
  const { csrfToken, getCsrfHeaders } = useCsrf()

  // Rich text editor helper - insert text at cursor position
  const insertAtCursor = (before, after = '', placeholder = '') => {
    const textarea = contentEditorRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = selectedPost.content || ''
    const selectedText = content.substring(start, end) || placeholder
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end)
    setSelectedPost(p => ({ ...p, content: newContent }))
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      const newPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  // Upload and insert image into content
  const uploadContentImage = async (file) => {
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'blog')
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        insertAtCursor(`\n![Image](${data.url})\n`, '', '')
        toast({ title: 'Image uploaded!', description: 'Image inserted into content' })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingImage(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'website') {
      fetchPages()
    } else if (activeTab === 'tools') {
      fetchTools()
    } else if (activeTab === 'menus') {
      fetchMenus()
    } else if (activeTab === 'blog') {
      fetchBlogPosts()
    }
  }, [activeTab, activeCategory])

  // Fetch website pages
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

  // Fetch tool pages
  const fetchTools = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pages/initialize-all')
      const data = await res.json()
      if (data.success) {
        setTools(data.tools)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch menus
  const fetchMenus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/menus')
      const data = await res.json()
      if (data.success) {
        setMenus(data.menus)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      const data = await res.json()
      if (data.success) {
        setBlogPosts(data.posts || [])
        setBlogStats(data.stats || {})
        setBlogCategories(data.categories || ['All', 'Uncategorized'])
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Create new blog post
  const createBlogPost = async () => {
    if (!newPost.title.trim()) {
      toast({ title: 'Error', description: 'Post title is required', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify(newPost)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Post Created!', description: 'Draft saved. Open to edit and publish.' })
        setShowCreatePostModal(false)
        setNewPost({ title: '', category: 'Uncategorized', excerpt: '' })
        fetchBlogPosts()
        setSelectedPost(data.post)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Save blog post
  const saveBlogPost = async () => {
    if (!selectedPost) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify(selectedPost)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Saved!', description: 'Blog post updated' })
        setSelectedPost(data.post)
        fetchBlogPosts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Delete blog post
  const deleteBlogPost = async (postId) => {
    if (!confirm('Delete this post permanently?')) return
    try {
      const res = await fetch(`/api/admin/blog?postId=${postId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Deleted', description: 'Post has been removed' })
        setSelectedPost(null)
        fetchBlogPosts()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Create new custom page
  const createNewPage = async () => {
    if (!newPage.title.trim()) {
      toast({ title: 'Error', description: 'Page title is required', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/unified-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-new',
          title: newPage.title,
          type: newPage.type,
          category: newPage.category
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Page Created!', description: `${newPage.title} has been created` })
        setShowCreateModal(false)
        setNewPage({ title: '', type: 'content', category: 'Custom' })
        fetchPages()
        // Open the page for editing
        setSelectedPage(data.page)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Save menu
  const saveMenu = async () => {
    if (!selectedMenu) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMenu)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Saved!', description: 'Menu updated successfully' })
        setSelectedMenu(data.menu)
        fetchMenus()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Add menu item
  const addMenuItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      label: 'New Link',
      link: '/',
      type: 'page',
      order: (selectedMenu.items?.length || 0) + 1
    }
    setSelectedMenu(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }))
  }

  // Update menu item
  const updateMenuItem = (itemId, field, value) => {
    setSelectedMenu(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  // Delete menu item
  const deleteMenuItem = (itemId) => {
    setSelectedMenu(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  // Move menu item
  const moveMenuItem = (itemId, direction) => {
    const items = [...(selectedMenu.items || [])]
    const index = items.findIndex(i => i.id === itemId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [item] = items.splice(index, 1)
    items.splice(newIndex, 0, item)
    
    // Update order numbers
    items.forEach((item, i) => item.order = i + 1)
    
    setSelectedMenu(prev => ({ ...prev, items }))
  }

  // Initialize all tool pages
  const initializeAllToolPages = async () => {
    setInitializing(true)
    try {
      const res = await fetch('/api/admin/pages/initialize-all', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ 
          title: 'Pages Initialized', 
          description: `Created ${data.results.created.length} new pages`
        })
        fetchTools()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setInitializing(false)
    }
  }

  // Load website page
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

  // Load tool page
  const loadToolPage = async (toolId, toolName) => {
    setLoading(true)
    try {
      // First try to get existing page
      let res = await fetch(`/api/admin/pages?toolId=${toolId}`)
      let data = await res.json()
      
      if (!data.success || !data.page) {
        // Initialize page if it doesn't exist
        res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, toolName, action: 'initialize' })
        })
        data = await res.json()
      }
      
      if (data.success && data.page) {
        setSelectedTool({ ...data.page, toolId, toolName })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Save website page
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

  // Save tool page
  const saveToolPage = async () => {
    if (!selectedTool) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: selectedTool.toolId,
          seo: selectedTool.seo,
          contentBlocks: selectedTool.contentBlocks,
          isPublished: selectedTool.isPublished
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Saved!', description: 'Tool page updated successfully' })
        setSelectedTool({ ...data.page, toolId: selectedTool.toolId, toolName: selectedTool.toolName })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Reset page
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

  // Update field helper
  const updateField = (path, value, isToolPage = false) => {
    const setter = isToolPage ? setSelectedTool : setSelectedPage
    setter(prev => {
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

  // Add content block
  const addBlock = (type, isToolPage = false) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getBlockTemplate(type)
    }
    const setter = isToolPage ? setSelectedTool : setSelectedPage
    setter(prev => ({
      ...prev,
      contentBlocks: [...(prev.contentBlocks || []), newBlock]
    }))
    setExpandedBlock(newBlock.id)
  }

  // Update content block
  const updateBlock = (blockId, content, isToolPage = false) => {
    const setter = isToolPage ? setSelectedTool : setSelectedPage
    setter(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(b => 
        b.id === blockId ? { ...b, content } : b
      )
    }))
  }

  // Delete content block
  const deleteBlock = (blockId, isToolPage = false) => {
    const setter = isToolPage ? setSelectedTool : setSelectedPage
    setter(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(b => b.id !== blockId)
    }))
  }

  // Move content block
  const moveBlock = (blockId, direction, isToolPage = false) => {
    const source = isToolPage ? selectedTool : selectedPage
    const setter = isToolPage ? setSelectedTool : setSelectedPage
    const blocks = [...(source.contentBlocks || [])]
    const index = blocks.findIndex(b => b.id === blockId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const [block] = blocks.splice(index, 1)
    blocks.splice(newIndex, 0, block)
    
    setter(prev => ({ ...prev, contentBlocks: blocks }))
  }

  // Get block template
  const getBlockTemplate = (type) => {
    const templates = {
      hero: { title: 'Page Title', subtitle: 'Page description', alignment: 'center' },
      heading: { text: 'Section Heading', level: 2 },
      paragraph: { text: 'Your content here...' },
      features: { title: 'Features', columns: 3, items: [{ icon: '⭐', title: 'Feature 1', description: 'Description' }]},
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

  // Filter tools by search
  const toolCategories = ['all', ...new Set(tools.map(t => t.category))]
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Stats
  const toolStats = {
    total: tools.length,
    withPages: tools.filter(t => t.hasPage).length,
    published: tools.filter(t => t.page?.isPublished).length
  }

  // ============ RENDER WEBSITE PAGE EDITOR ============
  if (selectedPage) {
    const IconComponent = ICONS[selectedPage.icon] || FileText
    const isContentPage = ['content', 'solution'].includes(selectedPage.type)

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
                <Eye className="h-4 w-4 mr-2" />Preview
              </Link>
            </Button>
            {selectedPage.isCustomized && (
              <Button variant="outline" onClick={() => resetPage(selectedPage.pageId)}>
                <RefreshCw className="h-4 w-4 mr-2" />Reset
              </Button>
            )}
            <Button onClick={savePage} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        {/* Editor */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentBlocksEditor 
              blocks={selectedPage.contentBlocks || []}
              expandedBlock={expandedBlock}
              setExpandedBlock={setExpandedBlock}
              onAddBlock={(type) => addBlock(type, false)}
              onUpdateBlock={(id, content) => updateBlock(id, content, false)}
              onDeleteBlock={(id) => deleteBlock(id, false)}
              onMoveBlock={(id, dir) => moveBlock(id, dir, false)}
            />
          </TabsContent>

          <TabsContent value="seo">
            <SEOEditor 
              seo={selectedPage.seo || {}}
              onUpdate={(field, value) => updateField(`seo.${field}`, value, false)}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsEditor 
              page={selectedPage}
              onUpdate={(field, value) => updateField(field, value, false)}
            />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ============ RENDER TOOL PAGE EDITOR ============
  if (selectedTool) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTool(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedTool.toolName || selectedTool.toolId}</h1>
                <p className="text-muted-foreground text-sm">/dashboard/tools/{selectedTool.toolId}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700">Tool Page</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/tools/${selectedTool.toolId}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />Preview
              </Link>
            </Button>
            <Button onClick={saveToolPage} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        {/* Editor */}
        <Tabs defaultValue="seo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="content">Content Blocks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="seo">
            <SEOEditor 
              seo={selectedTool.seo || {}}
              onUpdate={(field, value) => updateField(`seo.${field}`, value, true)}
            />
          </TabsContent>

          <TabsContent value="content">
            <ContentBlocksEditor 
              blocks={selectedTool.contentBlocks || []}
              expandedBlock={expandedBlock}
              setExpandedBlock={setExpandedBlock}
              onAddBlock={(type) => addBlock(type, true)}
              onUpdateBlock={(id, content) => updateBlock(id, content, true)}
              onDeleteBlock={(id) => deleteBlock(id, true)}
              onMoveBlock={(id, dir) => moveBlock(id, dir, true)}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Tool Page Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-sm text-muted-foreground">Make this tool page visible</p>
                  </div>
                  <Switch 
                    checked={selectedTool.isPublished ?? true}
                    onCheckedChange={(checked) => updateField('isPublished', checked, true)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ============ RENDER MAIN PAGE LIST ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layout className="h-8 w-8" />
            Page Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all website pages, tool pages, and navigation menus
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Page
          </Button>
          <Button variant="outline" onClick={activeTab === 'website' ? fetchPages : activeTab === 'tools' ? fetchTools : fetchMenus}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New Page
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Create a custom page that you can add to your header, footer, or anywhere on your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Page Title *</Label>
                <Input 
                  value={newPage.title}
                  onChange={(e) => setNewPage(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Partner Program, Affiliate, FAQ"
                />
              </div>
              <div className="space-y-2">
                <Label>Page Type</Label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={newPage.type}
                  onChange={(e) => setNewPage(p => ({ ...p, type: e.target.value }))}
                >
                  {PAGE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={newPage.category}
                  onChange={(e) => setNewPage(p => ({ ...p, category: e.target.value }))}
                >
                  {PAGE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={createNewPage} disabled={saving || !newPage.title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="website" className="gap-2">
            <Globe className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Wrench className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="menus" className="gap-2">
            <Menu className="h-4 w-4" />
            Menus
          </TabsTrigger>
        </TabsList>

        {/* Website Pages Tab */}
        <TabsContent value="website" className="space-y-4 mt-6">
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

          {/* Page Grid */}
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
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => loadPage(page.pageId)}>
                          <Edit className="h-4 w-4 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={page.path} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Blog Posts Tab */}
        <TabsContent value="blog" className="space-y-4 mt-6">
          {selectedPost ? (
            // Blog Post Editor
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={selectedPost.isPublished ? 'default' : 'secondary'}>
                        {selectedPost.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">/blog/{selectedPost.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={selectedPost.isPublished ? 'outline' : 'default'}
                    onClick={async () => {
                      const newPublished = !selectedPost.isPublished
                      setSaving(true)
                      try {
                        const res = await fetch('/api/admin/blog', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                          body: JSON.stringify({ 
                            postId: selectedPost.postId, 
                            isPublished: newPublished 
                          })
                        })
                        const data = await res.json()
                        if (data.success) {
                          toast({ title: newPublished ? 'Published!' : 'Unpublished', description: `Post is now ${newPublished ? 'live' : 'a draft'}` })
                          setSelectedPost(data.post)
                          fetchBlogPosts()
                        } else {
                          throw new Error(data.error)
                        }
                      } catch (error) {
                        toast({ title: 'Error', description: error.message, variant: 'destructive' })
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                  >
                    {selectedPost.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="outline" onClick={() => deleteBlogPost(selectedPost.postId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={saveBlogPost} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Post Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input 
                          value={selectedPost.title}
                          onChange={(e) => setSelectedPost(p => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Excerpt (Short description)</Label>
                        <Textarea 
                          value={selectedPost.excerpt || ''}
                          onChange={(e) => setSelectedPost(p => ({ ...p, excerpt: e.target.value }))}
                          rows={2}
                          placeholder="Brief description for blog listing and SEO..."
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Content Editor</Label>
                        
                        {/* Rich Text Toolbar */}
                        <TooltipProvider>
                          <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 rounded-t-lg border border-b-0">
                            {/* Headings */}
                            <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('# ', '\n', 'Heading 1')}
                                  >
                                    <span className="text-xs font-bold">H1</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Heading 1</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('## ', '\n', 'Heading 2')}
                                  >
                                    <span className="text-xs font-bold">H2</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Heading 2</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('### ', '\n', 'Heading 3')}
                                  >
                                    <span className="text-xs font-bold">H3</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Heading 3</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Text Formatting */}
                            <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('**', '**', 'bold text')}
                                  >
                                    <Bold className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bold</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('*', '*', 'italic text')}
                                  >
                                    <Italic className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Italic</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Lists */}
                            <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('- ', '\n', 'list item')}
                                  >
                                    <List className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bullet List</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('1. ', '\n', 'numbered item')}
                                  >
                                    <ListOrdered className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Numbered List</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Quote & Code */}
                            <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('> ', '\n', 'quote')}
                                  >
                                    <Quote className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Blockquote</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertAtCursor('`', '`', 'code')}
                                  >
                                    <Code className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Inline Code</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Link & Image */}
                            <div className="flex items-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      const url = prompt('Enter URL:')
                                      if (url) insertAtCursor('[', `](${url})`, 'link text')
                                    }}
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Insert Link</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/gif,image/webp"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) uploadContentImage(file)
                                        e.target.value = ''
                                      }}
                                    />
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      asChild
                                      disabled={uploadingImage}
                                    >
                                      <span>
                                        {uploadingImage ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ImagePlus className="h-4 w-4" />
                                        )}
                                      </span>
                                    </Button>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent>Upload Image</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </TooltipProvider>
                        
                        {/* Content Textarea */}
                        <Textarea 
                          ref={contentEditorRef}
                          value={selectedPost.content || ''}
                          onChange={(e) => setSelectedPost(p => ({ ...p, content: e.target.value }))}
                          rows={15}
                          placeholder="Write your blog post content here...

Select text and click formatting buttons above, or type:
• Markdown: ## Heading, **bold**, *italic*
• HTML: <h2>Heading</h2>, <b>bold</b>"
                          className="font-mono text-sm rounded-t-none border-t-0 focus:ring-0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Post Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Category</Label>
                        <Input 
                          value={selectedPost.category || ''}
                          onChange={(e) => setSelectedPost(p => ({ ...p, category: e.target.value }))}
                          placeholder="e.g., Tutorials, News"
                        />
                      </div>
                      <div>
                        <Label>Author</Label>
                        <Input 
                          value={selectedPost.author || ''}
                          onChange={(e) => setSelectedPost(p => ({ ...p, author: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Cover Image</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input 
                              value={selectedPost.coverImage || ''}
                              onChange={(e) => setSelectedPost(p => ({ ...p, coverImage: e.target.value }))}
                              placeholder="https://... or upload an image"
                              className="flex-1"
                            />
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('folder', 'blog')
                                  
                                  try {
                                    toast({ title: 'Uploading...', description: 'Please wait' })
                                    const res = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formData
                                    })
                                    const data = await res.json()
                                    if (data.success) {
                                      setSelectedPost(p => ({ ...p, coverImage: data.url }))
                                      toast({ title: 'Uploaded!', description: 'Image uploaded successfully' })
                                    } else {
                                      throw new Error(data.error)
                                    }
                                  } catch (err) {
                                    toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
                                  }
                                }}
                              />
                              <Button type="button" variant="outline" size="icon" asChild>
                                <span><Upload className="h-4 w-4" /></span>
                              </Button>
                            </label>
                          </div>
                          {selectedPost.coverImage && (
                            <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
                              <img 
                                src={selectedPost.coverImage} 
                                alt="Cover preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="absolute top-2 right-2"
                                onClick={() => setSelectedPost(p => ({ ...p, coverImage: '' }))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Featured Post</Label>
                        <Switch 
                          checked={selectedPost.featured || false}
                          onCheckedChange={(checked) => setSelectedPost(p => ({ ...p, featured: checked }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Meta Title</Label>
                        <Input 
                          value={selectedPost.seo?.metaTitle || ''}
                          onChange={(e) => setSelectedPost(p => ({ 
                            ...p, 
                            seo: { ...p.seo, metaTitle: e.target.value } 
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea 
                          value={selectedPost.seo?.metaDescription || ''}
                          onChange={(e) => setSelectedPost(p => ({ 
                            ...p, 
                            seo: { ...p.seo, metaDescription: e.target.value } 
                          }))}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            // Blog Posts List
            <>
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Posts</CardDescription>
                    <CardTitle className="text-3xl">{blogStats.total || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Published</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{blogStats.published || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Drafts</CardDescription>
                    <CardTitle className="text-3xl text-yellow-600">{blogStats.draft || 0}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Featured</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">{blogStats.featured || 0}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {blogCategories.map(cat => (
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
                <Button onClick={() => setShowCreatePostModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Post
                </Button>
              </div>

              {/* Create Post Modal */}
              {showCreatePostModal && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Create New Blog Post</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setShowCreatePostModal(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Post Title *</Label>
                        <Input 
                          value={newPost.title}
                          onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))}
                          placeholder="e.g., 10 Tips for Better Content"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input 
                          value={newPost.category}
                          onChange={(e) => setNewPost(p => ({ ...p, category: e.target.value }))}
                          placeholder="e.g., Tutorials"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Excerpt (optional)</Label>
                      <Textarea 
                        value={newPost.excerpt}
                        onChange={(e) => setNewPost(p => ({ ...p, excerpt: e.target.value }))}
                        rows={2}
                        placeholder="Brief description..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreatePostModal(false)}>Cancel</Button>
                      <Button onClick={createBlogPost} disabled={saving || !newPost.title.trim()}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Create Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posts List */}
              <div className="space-y-3">
                {loading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : blogPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No blog posts yet. Create your first post!</p>
                    </CardContent>
                  </Card>
                ) : blogPosts.map(post => (
                  <Card key={post.postId} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${post.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{post.title}</h3>
                              {post.featured && <Badge className="bg-blue-100 text-blue-700">Featured</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{post.excerpt?.slice(0, 80)}...</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{post.category}</span>
                              <span>•</span>
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={post.isPublished ? 'default' : 'secondary'}>
                            {post.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          {post.isPublished && (
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tool Pages Tab */}
        <TabsContent value="tools" className="space-y-4 mt-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Tools</CardDescription>
                <CardTitle className="text-3xl">{toolStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pages Created</CardDescription>
                <CardTitle className="text-3xl text-green-600">{toolStats.withPages}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Published</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{toolStats.published}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters & Initialize */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {toolCategories.slice(0, 6).map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
            <Button onClick={initializeAllToolPages} disabled={initializing}>
              {initializing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Initialize All</>
              )}
            </Button>
          </div>

          {/* Tools List */}
          <div className="grid gap-3">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Loading tools...</p>
                </CardContent>
              </Card>
            ) : filteredTools.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No tools found matching your search
                </CardContent>
              </Card>
            ) : (
              filteredTools.map(tool => (
                <Card key={tool.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.hasPage ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {tool.hasPage ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">{tool.id}</p>
                        </div>
                        <Badge variant="outline">{tool.category}</Badge>
                        {tool.page?.isPublished && (
                          <Badge className="bg-green-100 text-green-700">Published</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {tool.hasPage && tool.page?.seo && (
                          <div className="text-right mr-4 hidden lg:block">
                            <p className="text-sm font-medium truncate max-w-xs">{tool.page.seo.metaTitle}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{tool.page.seo.metaDescription?.slice(0, 50)}...</p>
                          </div>
                        )}
                        <Button variant="outline" size="sm" onClick={() => loadToolPage(tool.id, tool.name)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Link href={`/dashboard/tools/${tool.id}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-4 mt-6">
          {selectedMenu ? (
            // Menu Editor
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMenu(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMenu.name}</h2>
                    <p className="text-muted-foreground text-sm">Location: {selectedMenu.location}</p>
                  </div>
                </div>
                <Button onClick={saveMenu} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Menu
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Menu Items</CardTitle>
                      <CardDescription>Drag to reorder, edit labels and links</CardDescription>
                    </div>
                    <Button onClick={addMenuItem}>
                      <Plus className="h-4 w-4 mr-2" /> Add Link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedMenu.items?.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMenuItem(item.id, 'up')}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMenuItem(item.id, 'down')}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1 grid md:grid-cols-3 gap-3">
                        <Input 
                          value={item.label} 
                          onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                          placeholder="Link Label"
                        />
                        <Input 
                          value={item.link} 
                          onChange={(e) => updateMenuItem(item.id, 'link', e.target.value)}
                          placeholder="/path or https://..."
                        />
                        <select 
                          className="border rounded px-3 py-2"
                          value={item.type}
                          onChange={(e) => updateMenuItem(item.id, 'type', e.target.value)}
                        >
                          <option value="page">Internal Page</option>
                          <option value="anchor">Anchor Link</option>
                          <option value="external">External Link</option>
                        </select>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMenuItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!selectedMenu.items || selectedMenu.items.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No menu items. Click "Add Link" to add one.</p>
                  )}
                </CardContent>
              </Card>

              {/* Available Pages Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Pages</CardTitle>
                  <CardDescription>Click to copy the path</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pages.slice(0, 15).map(page => (
                      <Badge 
                        key={page.pageId} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => {
                          navigator.clipboard.writeText(page.path)
                          toast({ title: 'Copied!', description: page.path })
                        }}
                      >
                        {page.title}: {page.path}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Menu List
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : menus.map(menu => (
                  <Card key={menu.menuId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Menu className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{menu.name}</CardTitle>
                            <CardDescription className="text-xs">{menu.location}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{menu.items?.length || 0} links</Badge>
                        {menu.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedMenu(menu)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit Menu
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">How Menu Management Works</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Edit the Header and Footer menus to add or remove links. Your changes will automatically appear on the website.
                        You can link to any page you create, including custom pages.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== SHARED COMPONENTS ====================

// Content Blocks Editor
function ContentBlocksEditor({ blocks, expandedBlock, setExpandedBlock, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Blocks</CardTitle>
        <CardDescription>Build your page with content blocks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocks.map((block) => (
          <div key={block.id} className={`border rounded-lg ${expandedBlock === block.id ? 'ring-2 ring-primary' : ''}`}>
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

        <div className="pt-4 border-t">
          <Label className="mb-3 block">Add Content Block</Label>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <Button key={type.id} variant="outline" size="sm" onClick={() => onAddBlock(type.id)}>
                <span className="mr-1">{type.icon}</span>{type.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Block Editor
function BlockEditor({ block, onUpdate }) {
  const { type, content } = block
  const update = (field, value) => onUpdate({ ...content, [field]: value })

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
          <div><Label>Badge</Label><Input value={content.badge || ''} onChange={(e) => update('badge', e.target.value)} placeholder="e.g., New" /></div>
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

// SEO Editor
function SEOEditor({ seo, onUpdate }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO & Meta Tags</CardTitle>
        <CardDescription>Optimize your page for search engines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input 
            value={seo.metaTitle || ''} 
            onChange={(e) => onUpdate('metaTitle', e.target.value)}
            placeholder="Page title for search engines"
          />
          <p className="text-xs text-muted-foreground">{(seo.metaTitle || '').length}/60 characters</p>
        </div>
        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea 
            value={seo.metaDescription || ''} 
            onChange={(e) => onUpdate('metaDescription', e.target.value)}
            placeholder="Brief description for search results"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{(seo.metaDescription || '').length}/160 characters</p>
        </div>
        <div className="space-y-2">
          <Label>Keywords (comma separated)</Label>
          <Input 
            value={seo.keywords || ''} 
            onChange={(e) => onUpdate('keywords', e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>
        <div className="space-y-2">
          <Label>Canonical URL (optional)</Label>
          <Input 
            value={seo.canonicalUrl || ''} 
            onChange={(e) => onUpdate('canonicalUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Open Graph Image URL (optional)</Label>
          <Input 
            value={seo.ogImage || ''} 
            onChange={(e) => onUpdate('ogImage', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Settings Editor
function SettingsEditor({ page, onUpdate }) {
  return (
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
            checked={page.isPublished ?? true}
            onCheckedChange={(checked) => onUpdate('isPublished', checked)}
          />
        </div>
        <div className="pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">Page Information</Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Page ID:</span>
              <span className="ml-2 font-mono">{page.pageId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2">{page.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2">{page.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Path:</span>
              <span className="ml-2 font-mono">{page.path}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
