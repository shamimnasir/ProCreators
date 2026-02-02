'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { FileText, Save, Loader2, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function PolicyPagesEditor() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('privacy')
  const [previewMode, setPreviewMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings?section=pages')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const savePage = async (pageKey) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section: 'pages', 
          data: {
            ...settings,
            [pageKey]: {
              ...settings[pageKey],
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: '✅ Saved!', description: `${pageKey} page updated` })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updatePage = (pageKey, field, value) => {
    setSettings(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const pages = [
    { key: 'privacy', label: 'Privacy Policy', icon: '🔒' },
    { key: 'terms', label: 'Terms of Service', icon: '📜' },
    { key: 'contact', label: 'Contact', icon: '📧' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Policy Pages
          </h1>
          <p className="text-muted-foreground mt-1">
            Edit your Privacy Policy, Terms of Service, and other pages
          </p>
        </div>
        <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Edit Mode' : 'Preview'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {pages.map(page => (
            <TabsTrigger key={page.key} value={page.key} className="gap-2">
              {page.icon} {page.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page.key} value={page.key}>
            <Card>
              <CardHeader>
                <CardTitle>{page.label}</CardTitle>
                <CardDescription>
                  Last updated: {settings[page.key]?.lastUpdated || 'Never'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${page.key}-title`}>Page Title</Label>
                  <Input
                    id={`${page.key}-title`}
                    value={settings[page.key]?.title || ''}
                    onChange={(e) => updatePage(page.key, 'title', e.target.value)}
                    placeholder={page.label}
                  />
                </div>
                
                {previewMode ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-6 bg-muted/30">
                    <ReactMarkdown>{settings[page.key]?.content || ''}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`${page.key}-content`}>Content (Markdown supported)</Label>
                    <Textarea
                      id={`${page.key}-content`}
                      value={settings[page.key]?.content || ''}
                      onChange={(e) => updatePage(page.key, 'content', e.target.value)}
                      placeholder="# Page Title\n\nYour content here...\n\n## Section\n\nMore content..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Supports Markdown: # headers, **bold**, *italic*, [links](url), lists, etc.</p>
                  </div>
                )}
                
                <Button onClick={() => savePage(page.key)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save {page.label}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
