'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Save, RotateCcw, Plus, Trash2, AlertCircle, Video, Sparkles } from 'lucide-react'
import { AI_VIDEO_TEMPLATES } from '@/config/ai-video-templates'

export default function AIVideoPromptsPage() {
  const [templates, setTemplates] = useState([])
  const [editedTemplates, setEditedTemplates] = useState({})
  const [activeTemplate, setActiveTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Start with default templates from config
      const defaultTemplates = {}
      AI_VIDEO_TEMPLATES.forEach(template => {
        defaultTemplates[template.id] = {
          name: template.name,
          description: template.description,
          icon: template.icon,
          systemPrompt: template.systemPrompt || '',
          inputPlaceholder: template.inputPlaceholder || '',
          isDefault: true
        }
      })

      // Try to load custom prompts from database
      const response = await fetch('/api/admin/ai-video-prompts')
      const data = await response.json()
      
      if (data.success && data.prompts) {
        // Merge custom prompts with defaults (custom overrides default)
        const mergedTemplates = { ...defaultTemplates }
        Object.keys(data.prompts).forEach(key => {
          if (mergedTemplates[key]) {
            mergedTemplates[key] = { ...mergedTemplates[key], ...data.prompts[key], isDefault: false }
          } else {
            // New custom template
            mergedTemplates[key] = { ...data.prompts[key], isDefault: false }
          }
        })
        setTemplates(Object.entries(mergedTemplates).map(([id, data]) => ({ id, ...data })))
        setEditedTemplates(mergedTemplates)
      } else {
        setTemplates(Object.entries(defaultTemplates).map(([id, data]) => ({ id, ...data })))
        setEditedTemplates(defaultTemplates)
      }
      
      // Set first template as active
      if (AI_VIDEO_TEMPLATES.length > 0) {
        setActiveTemplate(AI_VIDEO_TEMPLATES[0].id)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      const defaultTemplates = {}
      AI_VIDEO_TEMPLATES.forEach(template => {
        defaultTemplates[template.id] = {
          name: template.name,
          description: template.description,
          icon: template.icon,
          systemPrompt: template.systemPrompt || '',
          inputPlaceholder: template.inputPlaceholder || '',
          isDefault: true
        }
      })
      setTemplates(Object.entries(defaultTemplates).map(([id, data]) => ({ id, ...data })))
      setEditedTemplates(defaultTemplates)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (templateId) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-video-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          data: editedTemplates[templateId]
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Template "${editedTemplates[templateId].name}" saved successfully!`
        })
        // Reload to get fresh data
        loadTemplates()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (templateId) => {
    const defaultTemplate = AI_VIDEO_TEMPLATES.find(t => t.id === templateId)
    if (defaultTemplate) {
      setEditedTemplates(prev => ({
        ...prev,
        [templateId]: {
          name: defaultTemplate.name,
          description: defaultTemplate.description,
          icon: defaultTemplate.icon,
          systemPrompt: defaultTemplate.systemPrompt || '',
          inputPlaceholder: defaultTemplate.inputPlaceholder || '',
          isDefault: true
        }
      }))
      
      // Delete from database
      try {
        await fetch(`/api/admin/ai-video-prompts?templateId=${templateId}`, {
          method: 'DELETE'
        })
        toast({
          title: "Reset",
          description: "Template reset to default values"
        })
      } catch (error) {
        console.error('Reset error:', error)
      }
    }
  }

  const updateTemplate = (templateId, field, value) => {
    setEditedTemplates(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value,
        isDefault: false
      }
    }))
  }

  const hasChanges = (templateId) => {
    const original = AI_VIDEO_TEMPLATES.find(t => t.id === templateId)
    const edited = editedTemplates[templateId]
    if (!original || !edited) return false
    return original.systemPrompt !== edited.systemPrompt || 
           original.inputPlaceholder !== edited.inputPlaceholder ||
           original.name !== edited.name ||
           original.description !== edited.description
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading AI Video Studio templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Video Studio - System Prompts</h1>
        </div>
        <p className="text-muted-foreground">
          Customize the AI behavior for each video template. System prompts control how AI generates scripts and video content.
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Admin Feature - Edit with Care
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                System prompts directly affect video generation quality. Variables like {'{userInput}'}, {'{duration}'}, {'{format}'} are replaced with actual values during generation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Tabs */}
      <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-2 mb-6">
          {templates.map(template => (
            <TabsTrigger 
              key={template.id} 
              value={template.id}
              className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="mr-1">{template.icon}</span>
              <span className="hidden md:inline">{template.name}</span>
              {hasChanges(template.id) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {templates.map(template => (
          <TabsContent key={template.id} value={template.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{editedTemplates[template.id]?.icon}</span>
                    <div>
                      <CardTitle className="text-2xl">{editedTemplates[template.id]?.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {editedTemplates[template.id]?.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={hasChanges(template.id) ? "destructive" : editedTemplates[template.id]?.isDefault ? "secondary" : "default"}>
                    {hasChanges(template.id) ? "Modified" : editedTemplates[template.id]?.isDefault ? "Default" : "Custom"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={editedTemplates[template.id]?.name || ''}
                      onChange={(e) => updateTemplate(template.id, 'name', e.target.value)}
                      placeholder="Template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon (Emoji)</Label>
                    <Input
                      value={editedTemplates[template.id]?.icon || ''}
                      onChange={(e) => updateTemplate(template.id, 'icon', e.target.value)}
                      placeholder="🎬"
                      className="w-24"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editedTemplates[template.id]?.description || ''}
                    onChange={(e) => updateTemplate(template.id, 'description', e.target.value)}
                    placeholder="Template description"
                  />
                </div>

                {/* Input Placeholder */}
                <div className="space-y-2">
                  <Label>Input Placeholder Text</Label>
                  <Textarea
                    value={editedTemplates[template.id]?.inputPlaceholder || ''}
                    onChange={(e) => updateTemplate(template.id, 'inputPlaceholder', e.target.value)}
                    placeholder="Placeholder text shown in the input field..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This text appears as a hint in the input field when users are creating videos.
                  </p>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    System Prompt (AI Instructions)
                  </Label>
                  <Textarea
                    value={editedTemplates[template.id]?.systemPrompt || ''}
                    onChange={(e) => updateTemplate(template.id, 'systemPrompt', e.target.value)}
                    placeholder="Enter the system prompt that instructs the AI..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{'{{userInput}}'} - User's content</Badge>
                    <Badge variant="outline">{'{{duration}}'} - Video duration</Badge>
                    <Badge variant="outline">{'{{format}}'} - portrait/landscape</Badge>
                    <Badge variant="outline">{'{{language}}'} - Selected language</Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReset(template.id)}
                    disabled={editedTemplates[template.id]?.isDefault}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button
                    onClick={() => handleSave(template.id)}
                    disabled={saving || !hasChanges(template.id)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
