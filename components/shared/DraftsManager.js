'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, FolderOpen, Trash2, FilePlus, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ===== DRAFTS MANAGER COMPONENT =====
// Reusable drafts panel for all PDF tools
export default function DraftsManager({ 
  toolType, // e.g., 'planner', 'journal', 'checklist'
  drafts, 
  setDrafts,
  currentDraftId,
  setCurrentDraftId,
  getCurrentData, // Function to get current form data
  loadDraftData,  // Function to load draft data into form
  onStartNew,     // Function to start a new document
}) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  // Save current work as a draft (to database)
  const saveDraft = async () => {
    setIsSaving(true)
    const currentData = getCurrentData()
    const draftTitle = currentData.title || `Untitled ${toolType}`
    
    const draftData = {
      id: currentDraftId || undefined,
      toolType,
      title: draftTitle,
      data: currentData
    }
    
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      })
      
      const result = await res.json()
      
      if (result.success) {
        // Refresh drafts list from DB
        const draftsRes = await fetch(`/api/drafts?toolType=${toolType}`)
        const draftsData = await draftsRes.json()
        if (draftsData.success) {
          setDrafts(draftsData.drafts)
        }
        
        setCurrentDraftId(result.id)
        toast({ title: "Draft Saved!", description: `"${draftTitle}" has been saved.` })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      toast({ 
        title: "Save Failed", 
        description: "Could not save draft. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Load a draft
  const loadDraft = (draft) => {
    loadDraftData(draft.data)
    setCurrentDraftId(draft.id)
    toast({ title: "Draft Loaded", description: `Loaded "${draft.title}"` })
  }
  
  // Delete a draft (from database)
  const deleteDraft = async (draftId, e) => {
    e.stopPropagation()
    
    try {
      const res = await fetch(`/api/drafts?id=${draftId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setDrafts(drafts.filter(d => d.id !== draftId))
        
        if (currentDraftId === draftId) {
          setCurrentDraftId(null)
        }
        toast({ title: "Draft Deleted" })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
      toast({ 
        title: "Delete Failed", 
        description: "Could not delete draft. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Start new document
  const handleStartNew = () => {
    if (onStartNew) onStartNew()
    setCurrentDraftId(null)
    toast({ title: "Started New", description: `Creating a new ${toolType}` })
  }
  
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
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No drafts yet. Click "Save" to save your progress.
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
