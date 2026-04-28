'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import {
  Plus,
  Save,
  Trash2,
  Edit,
  X,
  Check,
  Video,
  Palette,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Smile,
  Star,
  GraduationCap,
  Briefcase,
  Skull,
  Heart,
  Film,
  PartyPopper,
  ShoppingBag,
  RefreshCw,
  Wand2,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react'

// Icon mapping for previews
const ICON_MAP = {
  'BookOpen': BookOpen, 'TrendingUp': TrendingUp, 'Lightbulb': Lightbulb,
  'Smile': Smile, 'Star': Star, 'GraduationCap': GraduationCap,
  'Briefcase': Briefcase, 'Skull': Skull, 'Heart': Heart,
  'Film': Film, 'PartyPopper': PartyPopper, 'ShoppingBag': ShoppingBag,
  'RefreshCw': RefreshCw, 'Wand2': Wand2, 'Wand2': Wand2, 'Video': Video
}

const AVAILABLE_ICONS = Object.keys(ICON_MAP)

const CATEGORIES = [
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'educational', label: 'Educational' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'kids', label: 'Kids Content' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'custom', label: 'Custom' },
]

const COLOR_PRESETS = [
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-blue-500 to-cyan-500',
  'from-yellow-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-green-500 to-emerald-500',
  'from-indigo-500 to-purple-500',
  'from-gray-700 to-gray-900',
  'from-red-500 to-pink-500',
  'from-teal-500 to-cyan-500',
  'from-fuchsia-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-600',
]

export default function VideoThemesAdminPage() {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTheme, setEditingTheme] = useState(null) // null = not editing, {} = new, or existing theme
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('sessionToken') || ''
      const res = await fetch('/api/admin/video-themes?includeInactive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setThemes(data.themes || [])
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load themes', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingTheme.name || !editingTheme.promptTemplate) {
      toast({ title: 'Missing Fields', description: 'Name and Prompt Template are required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('sessionToken') || ''
      const isNew = !editingTheme._existsInDb
      
      const res = await fetch('/api/admin/video-themes', {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getCsrfHeaders()
        },
        body: JSON.stringify(editingTheme)
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({ title: isNew ? 'Theme Created' : 'Theme Updated', description: `"${editingTheme.name}" saved successfully` })
        setEditingTheme(null)
        fetchThemes()
      } else {
        toast({ title: 'Save Failed', description: data.error || 'Unknown error', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (themeId) => {
    if (!confirm('Are you sure you want to delete this theme?')) return
    
    setDeletingId(themeId)
    try {
      const token = localStorage.getItem('sessionToken') || ''
      const res = await fetch(`/api/admin/video-themes?id=${themeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...getCsrfHeaders()
        }
      })
      
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Theme Deleted' })
        fetchThemes()
      } else {
        toast({ title: 'Delete Failed', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (theme) => {
    try {
      const token = localStorage.getItem('sessionToken') || ''
      const res = await fetch('/api/admin/video-themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getCsrfHeaders()
        },
        body: JSON.stringify({ id: theme.id, isActive: !theme.isActive })
      })
      
      const data = await res.json()
      if (data.success) {
        toast({ title: theme.isActive ? 'Theme Deactivated' : 'Theme Activated' })
        fetchThemes()
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const startNewTheme = () => {
    setEditingTheme({
      name: '',
      description: '',
      tagline: '',
      icon: 'Video',
      color: 'from-blue-500 to-cyan-500',
      category: 'custom',
      isActive: true,
      order: themes.length + 1,
      promptTemplate: `You are a professional content creator. Write a compelling narration script.

## OUTPUT FORMAT
Write ONLY the spoken narration. No scene descriptions, no brackets, no labels.

## STRUCTURE
1. Hook (3 seconds): Grab attention immediately
2. Main Content: Deliver the core message
3. Close: End with impact

## STYLE
- Conversational tone
- Short, punchy sentences
- Emotionally engaging

Topic: {customTopic}
Duration: {duration} seconds
Language: {language}`,
      _existsInDb: false
    })
  }

  const startEditTheme = (theme) => {
    setEditingTheme({ ...theme, _existsInDb: true })
  }

  // ==================== EDIT FORM ====================
  if (editingTheme) {
    const PreviewIcon = ICON_MAP[editingTheme.icon] || Video
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setEditingTheme(null)}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              {editingTheme._existsInDb ? 'Edit Theme' : 'Create New Theme'}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Theme
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Theme Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Theme Name *</Label>
                    <Input
                      value={editingTheme.name}
                      onChange={(e) => setEditingTheme(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Horror Stories"
                    />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={editingTheme.tagline || ''}
                      onChange={(e) => setEditingTheme(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="e.g., Spine-chilling short tales"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingTheme.description || ''}
                    onChange={(e) => setEditingTheme(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of what this theme does..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={editingTheme.category || 'custom'}
                      onValueChange={(val) => setEditingTheme(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Icon</Label>
                    <Select
                      value={editingTheme.icon || 'Video'}
                      onValueChange={(val) => setEditingTheme(prev => ({ ...prev, icon: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map(icon => {
                          const IconComp = ICON_MAP[icon]
                          return (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                <IconComp className="h-4 w-4" />
                                {icon}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={editingTheme.order || 1}
                      onChange={(e) => setEditingTheme(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <Label>Card Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} transition-all ${
                          editingTheme.color === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        onClick={() => setEditingTheme(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Switch
                    checked={editingTheme.isActive !== false}
                    onCheckedChange={(checked) => setEditingTheme(prev => ({ ...prev, isActive: checked }))}
                  />
                  <div>
                    <p className="font-medium text-sm">Active</p>
                    <p className="text-xs text-muted-foreground">Theme is visible to users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Template */}
            <Card>
              <CardHeader>
                <CardTitle>AI Prompt Template *</CardTitle>
                <CardDescription>
                  This prompt is sent to the AI when generating scripts for this theme.
                  Use placeholders: {'{customTopic}'}, {'{duration}'}, {'{language}'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editingTheme.promptTemplate || ''}
                  onChange={(e) => setEditingTheme(prev => ({ ...prev, promptTemplate: e.target.value }))}
                  rows={18}
                  className="font-mono text-sm"
                  placeholder="Enter the system prompt for AI script generation..."
                />
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">{'{customTopic}'} = User's topic</Badge>
                  <Badge variant="outline" className="text-xs">{'{duration}'} = Video duration</Badge>
                  <Badge variant="outline" className="text-xs">{'{language}'} = Target language</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${editingTheme.color || 'from-gray-500 to-gray-600'} flex-shrink-0`}>
                      <PreviewIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{editingTheme.name || 'Theme Name'}</h4>
                      <p className="text-sm text-muted-foreground">{editingTheme.description || 'Description...'}</p>
                      {editingTheme.tagline && (
                        <p className="text-xs text-primary/70 mt-1">{editingTheme.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{editingTheme.category || 'custom'}</Badge>
                    <Badge variant={editingTheme.isActive !== false ? 'default' : 'outline'}>
                      {editingTheme.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">Order: {editingTheme.order || 1}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Write prompts as if instructing the AI to create a specific type of content</p>
                <p>• Include structure guidelines (Hook, Build, Close)</p>
                <p>• Specify the output format ("Write ONLY the spoken narration")</p>
                <p>• Add writing style guidelines (tone, sentence length)</p>
                <p>• Include strict rules (what NOT to include)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ==================== THEME LIST ====================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Video Themes Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage video creation themes visible in the Video Studio
          </p>
        </div>
        <Button onClick={startNewTheme}>
          <Plus className="h-4 w-4 mr-2" />
          Add Theme
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {themes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No themes yet</h3>
                <p className="text-muted-foreground mb-4">Create your first video theme to get started</p>
                <Button onClick={startNewTheme}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Theme
                </Button>
              </CardContent>
            </Card>
          ) : (
            themes.map((theme) => {
              const ThemeIcon = ICON_MAP[theme.icon] || Video
              return (
                <Card key={theme.id} className={`transition-all ${theme.isActive === false ? 'opacity-60' : ''}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${theme.color || 'from-gray-500 to-gray-600'} flex-shrink-0`}>
                        <ThemeIcon className="h-5 w-5 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{theme.name}</h3>
                          <Badge variant="secondary" className="text-xs">{theme.category}</Badge>
                          {theme.isActive === false && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" /> Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{theme.description}</p>
                      </div>

                      {/* Order */}
                      <Badge variant="outline" className="flex-shrink-0">#{theme.order || 0}</Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(theme)}
                          title={theme.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {theme.isActive !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEditTheme(theme)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {theme.id !== 'custom' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(theme.id)}
                            disabled={deletingId === theme.id}
                          >
                            {deletingId === theme.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && themes.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{themes.length} total themes</span>
              <span>{themes.filter(t => t.isActive !== false).length} active / {themes.filter(t => t.isActive === false).length} hidden</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
