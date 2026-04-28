'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  FileText,
  Search,
  RefreshCw,
  Check,
  X,
  Edit,
  Eye,
  Loader2,
  Database,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import Link from 'next/link'

export default function AdminPagesPage() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

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

  useEffect(() => {
    fetchTools()
  }, [])

  const initializeAllPages = async () => {
    setInitializing(true)
    try {
      const res = await fetch('/api/admin/pages/initialize-all', { 
        method: 'POST',
        headers: { ...getCsrfHeaders() }
      })
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

  const categories = ['all', ...new Set(tools.map(t => t.category))]
  
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: tools.length,
    withPages: tools.filter(t => t.hasPage).length,
    published: tools.filter(t => t.page?.isPublished).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Page Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SEO and content for all tool pages
          </p>
        </div>
        <Button onClick={initializeAllPages} disabled={initializing}>
          {initializing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
          ) : (
            <><Database className="mr-2 h-4 w-4" /> Initialize All Pages</>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tools</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pages Created</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.withPages}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.published}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={fetchTools}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

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
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-sm font-medium truncate max-w-xs">{tool.page.seo.metaTitle}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{tool.page.seo.metaDescription?.slice(0, 60)}...</p>
                      </div>
                    )}
                    <Link href={`/dashboard/admin/pages/${tool.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </Link>
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
    </div>
  )
}
