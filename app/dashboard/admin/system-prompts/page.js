'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, RotateCcw, Video, Type } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { QUICK_REELS_NICHES } from '@/config/quick-reels-niches'

export default function SystemPromptsPage() {
  // State for Viral Tools (text/image)
  const [selectedTool, setSelectedTool] = useState('threads')
  const [tools, setTools] = useState([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [defaultPrompt, setDefaultPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  
  // State for Quick Reels (video)
  const [quickReelsPrompts, setQuickReelsPrompts] = useState({})
  const [editedQuickReelsPrompts, setEditedQuickReelsPrompts] = useState({})
  const [activeNiche, setActiveNiche] = useState('mini-stories')
  const [savingQuickReels, setSavingQuickReels] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState('viral-tools')
  
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  useEffect(() => {
    fetchTools()
    loadQuickReelsPrompts()
  }, [])

  useEffect(() => {
    if (selectedTool) {
      fetchSystemPrompt(selectedTool)
    }
  }, [selectedTool])
  
  // Load Quick Reels prompts
  const loadQuickReelsPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts')
      const data = await response.json()
      
      if (data.success) {
        setQuickReelsPrompts(data.prompts)
        setEditedQuickReelsPrompts(data.prompts)
      } else {
        // Use default prompts from config
        const defaultPrompts = {}
        QUICK_REELS_NICHES.forEach(niche => {
          defaultPrompts[niche.slug] = niche.promptTemplate
        })
        setQuickReelsPrompts(defaultPrompts)
        setEditedQuickReelsPrompts(defaultPrompts)
      }
    } catch (error) {
      console.error('Error loading Quick Reels prompts:', error)
      // Fallback to defaults
      const defaultPrompts = {}
      QUICK_REELS_NICHES.forEach(niche => {
        defaultPrompts[niche.slug] = niche.promptTemplate
      })
      setQuickReelsPrompts(defaultPrompts)
      setEditedQuickReelsPrompts(defaultPrompts)
    }
  }

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/admin/system-prompts/list')
      const data = await response.json()
      if (data.success) {
        setTools(data.tools)
      }
    } catch (error) {
      console.error('Error fetching tools:', error)
    }
  }

  const fetchSystemPrompt = async (toolId) => {
    try {
      const response = await fetch(`/api/admin/system-prompts/get?tool=${toolId}`)
      const data = await response.json()
      if (data.success) {
        setSystemPrompt(data.prompt)
        setDefaultPrompt(data.defaultPrompt)
      }
    } catch (error) {
      console.error('Error fetching prompt:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system-prompts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify({
          tool: selectedTool,
          prompt: systemPrompt
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "System prompt updated successfully"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update system prompt",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSystemPrompt(defaultPrompt)
    toast({
      title: "Reset",
      description: "System prompt reset to default"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Prompts Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure how AI behaves for each tool. These prompts define the output format, style, and behavior.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Tool</CardTitle>
          <CardDescription>
            Choose a tool to view and edit its system prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tools.map((tool) => (
                <SelectItem key={tool.id} value={tool.id}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>
            Define how the AI should behave and format outputs for this tool. Users will not see this prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Prompt Instructions</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter system prompt instructions..."
            />
            <p className="text-xs text-muted-foreground">
              This prompt will be sent to the AI before the user's input to guide the output format and style.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="text-amber-600">⚠️ Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• System prompts define the <strong>behavior and output format</strong> for each tool</p>
          <p>• Users will <strong>not see</strong> these prompts - they only see their input box</p>
          <p>• Changes take effect <strong>immediately</strong> for all new generations</p>
          <p>• Be specific about formatting, tone, length, and structure requirements</p>
          <p>• Test changes thoroughly before deploying to production</p>
        </CardContent>
      </Card>
    </div>
  )
}
