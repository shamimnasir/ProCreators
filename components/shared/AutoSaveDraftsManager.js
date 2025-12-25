'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, FolderOpen, Trash2, FilePlus, Clock, CloudOff, Cloud, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/**
 * AutoSaveDraftsManager - Enhanced Drafts Panel with Auto-Save
 * 
 * Features:
 * - Automatic saving on content changes (debounced)
 * - Immediate save on important actions
 * - Visual auto-save status indicator
 * - Manual save button still available
 * 
 * Usage:
 * <AutoSaveDraftsManager
 *   toolType="coloring-book"
 *   getCurrentData={() => ({ title, pages, settings })}
 *   loadDraftData={(data) => { setTitle(data.title); setPages(data.pages) }}
 *   onStartNew={() => { setTitle(''); setPages([]) }}
 *   dependencies={[title, pages, settings]} // Triggers auto-save when these change
 *   autoSaveEnabled={true}
 *   debounceMs={2000}
 * />
 */
export default function AutoSaveDraftsManager({ 
  toolType,
  getCurrentData,
  loadDraftData,
  onStartNew,
  dependencies = [],
  autoSaveEnabled = true,
  debounceMs = 2000,
  minStepForAutoSave = 1, // Only auto-save after this step (for multi-step wizards)
  currentStep = 1,
}) {
  const { toast } = useToast()
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // 'idle', 'pending', 'saving', 'saved', 'error'
  
  const autoSaveTimeoutRef = useRef(null)
  const lastSavedDataRef = useRef(null)

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (!toolType) return
      setIsLoading(true)
      try {
        const res = await fetch(`/api/tools/drafts?toolType=${encodeURIComponent(toolType)}`)
        const data = await res.json()
        if (data.success && data.drafts) {
          setDrafts(data.drafts)
        }
      } catch (e) {
        console.log('Failed to load drafts:', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadDrafts()
  }, [toolType])

  // Refresh drafts list
  const refreshDrafts = useCallback(async () => {
    if (!toolType) return
    try {
      const res = await fetch(`/api/tools/drafts?toolType=${encodeURIComponent(toolType)}`)
      const data = await res.json()
      if (data.success && data.drafts) {
        setDrafts(data.drafts)
      }
    } catch (e) {
      console.log('Failed to refresh drafts:', e)
    }
  }, [toolType])

  // Core save function
  const performSave = useCallback(async (isAutoSave = false) => {
    if (!toolType || !getCurrentData) return { success: false }
    
    try {
      const currentData = getCurrentData()
      const dataString = JSON.stringify(currentData)
      
      // Skip if data hasn't changed
      if (lastSavedDataRef.current === dataString) {
        return { success: true, skipped: true }
      }
      
      // Check for meaningful content
      const hasContent = currentData.title || currentData.story || currentData.pages || 
                        currentData.content || currentData.items || currentData.data ||
                        currentData.chapters || currentData.cards || currentData.slides
      if (!hasContent) {
        return { success: false, error: 'No content to save' }
      }
      
      if (isAutoSave) {
        setAutoSaveStatus('saving')
      } else {
        setIsSaving(true)
      }
      
      const response = await fetch('/api/tools/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          toolType,
          title: currentData.title || currentData.name || 'Untitled',
          data: currentData
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        lastSavedDataRef.current = dataString
        setLastSaved(new Date())
        
        if (!currentDraftId && result.id) {
          setCurrentDraftId(result.id)
        }
        
        await refreshDrafts()
        
        if (isAutoSave) {
          setAutoSaveStatus('saved')
          setTimeout(() => setAutoSaveStatus('idle'), 2000)
        }
        
        return { success: true, id: result.id }
      } else {
        if (isAutoSave) {
          setAutoSaveStatus('error')
          setTimeout(() => setAutoSaveStatus('idle'), 3000)
        }
        return { success: false, error: result.error }
      }
    } catch (e) {
      console.log('Save failed:', e)
      if (isAutoSave) {
        setAutoSaveStatus('error')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      }
      return { success: false, error: e.message }
    } finally {
      setIsSaving(false)
    }
  }, [toolType, currentDraftId, getCurrentData, refreshDrafts])

  // Manual save
  const saveDraft = async () => {
    const result = await performSave(false)
    if (result.success && !result.skipped) {
      toast({ title: "Draft Saved!", description: "Your progress has been saved." })
    } else if (result.error) {
      toast({ title: "Save Failed", description: result.error, variant: "destructive" })
    }
  }

  // Load a draft
  const loadDraft = (draft) => {
    if (loadDraftData && draft.data) {
      loadDraftData(draft.data)
    }
    setCurrentDraftId(draft.id)
    lastSavedDataRef.current = JSON.stringify(draft.data)
    toast({ title: "Draft Loaded", description: `Loaded "${draft.title}"` })
  }

  // Delete a draft
  const deleteDraft = async (draftId, e) => {
    e.stopPropagation()
    
    try {
      const res = await fetch(`/api/tools/drafts?id=${encodeURIComponent(draftId)}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setDrafts(drafts.filter(d => d.id !== draftId))
        
        if (currentDraftId === draftId) {
          setCurrentDraftId(null)
          lastSavedDataRef.current = null
        }
        toast({ title: "Draft Deleted" })
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
      toast({ title: "Delete Failed", description: "Could not delete draft.", variant: "destructive" })
    }
  }

  // Start new document
  const handleStartNew = () => {
    if (onStartNew) onStartNew()
    setCurrentDraftId(null)
    lastSavedDataRef.current = null
    toast({ title: "Started New", description: `Creating a new ${toolType}` })
  }

  // Debounced auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !toolType || currentStep < minStepForAutoSave) return
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    setAutoSaveStatus('pending')
    
    // Set a new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performSave(true)
    }, debounceMs)
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveEnabled, toolType, debounceMs, currentStep, minStepForAutoSave, ...dependencies])

  // Get auto-save status display
  const getAutoSaveDisplay = () => {
    if (!autoSaveEnabled) {
      return { icon: CloudOff, text: 'Auto-save off', className: 'text-muted-foreground' }
    }
    
    switch (autoSaveStatus) {
      case 'pending':
        return { icon: Cloud, text: 'Changes pending...', className: 'text-yellow-600' }
      case 'saving':
        return { icon: Loader2, text: 'Saving...', className: 'text-blue-600 animate-spin' }
      case 'saved':
        return { icon: Cloud, text: 'Saved', className: 'text-green-600' }
      case 'error':
        return { icon: CloudOff, text: 'Save failed', className: 'text-red-600' }
      default:
        return { icon: Cloud, text: 'Auto-save on', className: 'text-green-600' }
    }
  }

  const autoSaveDisplay = getAutoSaveDisplay()
  const AutoSaveIcon = autoSaveDisplay.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            My Drafts
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleStartNew}>
              <FilePlus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button size="sm" onClick={saveDraft} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        
        {/* Auto-save status indicator */}
        <div className={`flex items-center gap-1 text-xs mt-2 ${autoSaveDisplay.className}`}>
          <AutoSaveIcon className={`h-3 w-3 ${autoSaveStatus === 'saving' ? 'animate-spin' : ''}`} />
          <span>{autoSaveDisplay.text}</span>
          {lastSaved && autoSaveStatus === 'idle' && (
            <span className="text-muted-foreground ml-1">
              · Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No drafts yet. Your progress will be saved automatically.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                  currentDraftId === draft.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => loadDraft(draft)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{draft.title}</span>
                    {currentDraftId === draft.id && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => deleteDraft(draft.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export for backward compatibility
export { AutoSaveDraftsManager }
