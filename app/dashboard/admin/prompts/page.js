'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { Save, RotateCcw, Eye, AlertCircle } from 'lucide-react'
import { QUICK_REELS_NICHES } from '@/config/quick-reels-niches'

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState({})
  const [editedPrompts, setEditedPrompts] = useState({})
  const [activeNiche, setActiveNiche] = useState('mini-stories')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setLoading(true)
    try {
      // Start with default prompts from config
      const defaultPrompts = {}
      QUICK_REELS_NICHES.forEach(niche => {
        defaultPrompts[niche.slug] = niche.promptTemplate
      })

      // Try to load custom prompts from database
      const response = await fetch('/api/admin/prompts')
      const data = await response.json()
      
      if (data.success && data.prompts) {
        // Merge custom prompts with defaults (custom overrides default)
        const mergedPrompts = { ...defaultPrompts, ...data.prompts }
        setPrompts(mergedPrompts)
        setEditedPrompts(mergedPrompts)
      } else {
        // Use only default prompts
        setPrompts(defaultPrompts)
        setEditedPrompts(defaultPrompts)
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
      // Fallback to default prompts
      const defaultPrompts = {}
      QUICK_REELS_NICHES.forEach(niche => {
        defaultPrompts[niche.slug] = niche.promptTemplate
      })
      setPrompts(defaultPrompts)
      setEditedPrompts(defaultPrompts)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (nicheSlug) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nicheSlug,
          prompt: editedPrompts[nicheSlug]
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPrompts(prev => ({
          ...prev,
          [nicheSlug]: editedPrompts[nicheSlug]
        }))
        
        toast({
          title: "Success",
          description: `System prompt for ${getNicheName(nicheSlug)} saved successfully!`
        })
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

  const handleReset = (nicheSlug) => {
    const defaultPrompt = QUICK_REELS_NICHES.find(n => n.slug === nicheSlug)?.promptTemplate
    if (defaultPrompt) {
      setEditedPrompts(prev => ({
        ...prev,
        [nicheSlug]: defaultPrompt
      }))
      toast({
        title: "Reset",
        description: "Prompt reset to default value"
      })
    }
  }

  const getNicheName = (slug) => {
    return QUICK_REELS_NICHES.find(n => n.slug === slug)?.name || slug
  }

  const getNicheIcon = (slug) => {
    return QUICK_REELS_NICHES.find(n => n.slug === slug)?.icon || '📄'
  }

  const hasChanges = (nicheSlug) => {
    return prompts[nicheSlug] !== editedPrompts[nicheSlug]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI System Prompts Manager</h1>
        <p className="text-muted-foreground">
          Customize the AI behavior for each Quick Reels niche. Changes will take effect immediately for new script generations.
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Admin Feature - Use with Caution
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Editing system prompts directly affects AI output quality. Test changes thoroughly before deploying to production. 
                Always keep a backup of working prompts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Each Niche */}
      <Tabs value={activeNiche} onValueChange={setActiveNiche}>
        <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 mb-6">
          {QUICK_REELS_NICHES.map(niche => (
            <TabsTrigger 
              key={niche.slug} 
              value={niche.slug}
              className="relative"
            >
              <span className="mr-1">{niche.icon}</span>
              <span className="hidden lg:inline">{niche.name}</span>
              {hasChanges(niche.slug) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {QUICK_REELS_NICHES.map(niche => (
          <TabsContent key={niche.slug} value={niche.slug}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{niche.icon}</span>
                    <div>
                      <CardTitle className="text-2xl">{niche.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {niche.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={hasChanges(niche.slug) ? "destructive" : "secondary"}>
                    {hasChanges(niche.slug) ? "Modified" : "Saved"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prompt Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>System Prompt Template</Label>
                    <div className="text-xs text-muted-foreground">
                      {editedPrompts[niche.slug]?.length || 0} characters
                    </div>
                  </div>
                  
                  <Textarea
                    value={editedPrompts[niche.slug] || ''}
                    onChange={(e) => setEditedPrompts(prev => ({
                      ...prev,
                      [niche.slug]: e.target.value
                    }))}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Enter system prompt template..."
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    This prompt instructs the AI how to generate content for this niche. 
                    Include specific guidelines, tone, structure, and constraints.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleSave(niche.slug)}
                    disabled={saving || !hasChanges(niche.slug)}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={() => handleReset(niche.slug)}
                    disabled={!hasChanges(niche.slug)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Copy prompt to clipboard
                      navigator.clipboard.writeText(editedPrompts[niche.slug])
                      toast({
                        title: "Copied",
                        description: "Prompt copied to clipboard"
                      })
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>

                {/* Guidelines */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Prompt Engineering Tips:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Be specific about the desired output format and structure</li>
                    <li>Include examples of good vs bad outputs when possible</li>
                    <li>Specify tone, style, and target audience clearly</li>
                    <li>Add constraints (what NOT to do) to prevent unwanted content</li>
                    <li>Test changes with multiple script generations before saving</li>
                    <li>Use variables like {`{duration}`}, {`{language}`} for dynamic values</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Bulk Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Perform actions on all niche prompts at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const allPrompts = QUICK_REELS_NICHES.map(n => 
                  `${n.name}:\n${editedPrompts[n.slug]}\n\n`
                ).join('---\n\n')
                navigator.clipboard.writeText(allPrompts)
                toast({
                  title: "Copied",
                  description: "All prompts copied to clipboard"
                })
              }}
            >
              Export All Prompts
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const defaultPrompts = {}
                QUICK_REELS_NICHES.forEach(niche => {
                  defaultPrompts[niche.slug] = niche.promptTemplate
                })
                setEditedPrompts(defaultPrompts)
                toast({
                  title: "Reset All",
                  description: "All prompts reset to defaults"
                })
              }}
            >
              Reset All to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
