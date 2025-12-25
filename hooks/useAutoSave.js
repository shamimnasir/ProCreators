'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Universal Auto-Save Hook for ProCreators Tools
 * 
 * Usage:
 * const { 
 *   drafts, 
 *   currentDraftId, 
 *   saveDraft, 
 *   loadDraft, 
 *   deleteDraft, 
 *   startNew,
 *   isLoading 
 * } = useAutoSave({
 *   toolType: 'coloring-book',
 *   getData: () => ({ title, pages, settings }),
 *   setData: (data) => { setTitle(data.title); setPages(data.pages); },
 *   debounceMs: 2000,
 *   autoSaveEnabled: true
 * })
 * 
 * // Trigger immediate save after important actions:
 * await saveDraft({ step: 2, result: data })
 */

const API_ENDPOINT = '/api/tools/drafts'

export function useAutoSave({
  toolType,
  getData,
  setData,
  debounceMs = 2000,
  autoSaveEnabled = true,
  onSaveSuccess,
  onSaveError,
  dependencies = []
}) {
  const [drafts, setDrafts] = useState([])
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const autoSaveTimeoutRef = useRef(null)
  const lastSavedDataRef = useRef(null)

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (!toolType) return
      setIsLoading(true)
      try {
        const res = await fetch(`${API_ENDPOINT}?toolType=${encodeURIComponent(toolType)}`)
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
      const res = await fetch(`${API_ENDPOINT}?toolType=${encodeURIComponent(toolType)}`)
      const data = await res.json()
      if (data.success && data.drafts) {
        setDrafts(data.drafts)
      }
    } catch (e) {
      console.log('Failed to refresh drafts:', e)
    }
  }, [toolType])

  // Save draft function
  const saveDraft = useCallback(async (overrides = {}, options = {}) => {
    if (!toolType) return { success: false, error: 'No tool type specified' }
    
    const { silent = false, immediate = false } = options
    
    try {
      const currentData = getData ? getData() : {}
      const saveData = { ...currentData, ...overrides }
      
      // Check if data has changed to avoid unnecessary saves
      const dataString = JSON.stringify(saveData)
      if (!immediate && lastSavedDataRef.current === dataString) {
        return { success: true, skipped: true }
      }
      
      // Only save if we have meaningful content
      const hasContent = saveData.title || saveData.story || saveData.pages || 
                        saveData.content || saveData.items || saveData.data
      if (!hasContent && !overrides.force) {
        return { success: false, error: 'No content to save' }
      }
      
      if (!silent) setIsSaving(true)
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          toolType,
          title: saveData.title || saveData.name || 'Untitled',
          data: saveData
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        lastSavedDataRef.current = dataString
        if (!currentDraftId && result.id) {
          setCurrentDraftId(result.id)
        }
        await refreshDrafts()
        if (onSaveSuccess) onSaveSuccess(result)
        console.log(`[AutoSave] Draft saved for ${toolType}`)
        return { success: true, id: result.id }
      } else {
        if (onSaveError) onSaveError(result.error)
        return { success: false, error: result.error }
      }
    } catch (e) {
      console.log('Auto-save failed:', e)
      if (onSaveError) onSaveError(e.message)
      return { success: false, error: e.message }
    } finally {
      if (!silent) setIsSaving(false)
    }
  }, [toolType, currentDraftId, getData, refreshDrafts, onSaveSuccess, onSaveError])

  // Load a draft
  const loadDraft = useCallback((draft) => {
    if (!draft) return
    setCurrentDraftId(draft.id)
    if (setData && draft.data) {
      setData(draft.data)
    }
    lastSavedDataRef.current = JSON.stringify(draft.data)
  }, [setData])

  // Delete a draft
  const deleteDraft = useCallback(async (draftId) => {
    if (!draftId) return { success: false }
    
    try {
      const response = await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(draftId)}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        if (currentDraftId === draftId) {
          setCurrentDraftId(null)
          lastSavedDataRef.current = null
        }
        await refreshDrafts()
      }
      return result
    } catch (e) {
      console.log('Delete draft failed:', e)
      return { success: false, error: e.message }
    }
  }, [currentDraftId, refreshDrafts])

  // Start new (clear current draft)
  const startNew = useCallback(() => {
    setCurrentDraftId(null)
    lastSavedDataRef.current = null
  }, [])

  // Debounced auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !toolType) return
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set a new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft({}, { silent: true })
    }, debounceMs)
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [autoSaveEnabled, toolType, debounceMs, saveDraft, ...dependencies])

  return {
    // State
    drafts,
    currentDraftId,
    isLoading,
    isSaving,
    
    // Actions
    saveDraft,
    loadDraft,
    deleteDraft,
    startNew,
    refreshDrafts,
    setCurrentDraftId
  }
}

export default useAutoSave
