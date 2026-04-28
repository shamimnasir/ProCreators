'use client'

/**
 * VideoStorageManager - Browser-based video storage using IndexedDB
 * 
 * This allows ProCreators to store large video files locally in the browser
 * without uploading to the server, saving bandwidth and storage costs.
 * 
 * Features:
 * - Store videos up to 2GB in IndexedDB
 * - Automatic chunking for large files
 * - Progress tracking for saves/loads
 * - Automatic cleanup of old projects
 */

const DB_NAME = 'ProCreatorsVideoEditor'
const DB_VERSION = 1
const VIDEO_STORE = 'videos'
const PROJECT_STORE = 'projects'
const MAX_PROJECTS = 10 // Maximum number of projects to keep
const MAX_AGE_DAYS = 30 // Auto-delete projects older than this

class VideoStorageManager {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  async init() {
    if (this.isInitialized) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Video blobs store
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          const videoStore = db.createObjectStore(VIDEO_STORE, { keyPath: 'id' })
          videoStore.createIndex('projectId', 'projectId', { unique: false })
          videoStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Project metadata store
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          const projectStore = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
          projectStore.createIndex('createdAt', 'createdAt', { unique: false })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  // Save video file to IndexedDB
  async saveVideo(projectId, videoFile, onProgress) {
    await this.init()

    const videoId = `${projectId}-source`
    const arrayBuffer = await videoFile.arrayBuffer()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([VIDEO_STORE], 'readwrite')
      const store = transaction.objectStore(VIDEO_STORE)

      const videoData = {
        id: videoId,
        projectId,
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size,
        data: arrayBuffer,
        createdAt: new Date().toISOString()
      }

      const request = store.put(videoData)

      request.onsuccess = () => {
        if (onProgress) onProgress(100)
        resolve({ success: true, videoId })
      }

      request.onerror = () => {
        console.error('[VideoStorage] Save failed:', request.error)
        reject(request.error)
      }
    })
  }

  // Load video from IndexedDB
  async loadVideo(projectId) {
    await this.init()

    const videoId = `${projectId}-source`

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([VIDEO_STORE], 'readonly')
      const store = transaction.objectStore(VIDEO_STORE)
      const request = store.get(videoId)

      request.onsuccess = () => {
        if (request.result) {
          const { data, name, type, size } = request.result
          const blob = new Blob([data], { type })
          const url = URL.createObjectURL(blob)
          resolve({ success: true, blob, url, name, type, size })
        } else {
          resolve({ success: false, error: 'Video not found' })
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Save processed video
  async saveProcessedVideo(projectId, blob, name = 'processed.mp4') {
    await this.init()

    const videoId = `${projectId}-processed`
    const arrayBuffer = await blob.arrayBuffer()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([VIDEO_STORE], 'readwrite')
      const store = transaction.objectStore(VIDEO_STORE)

      const videoData = {
        id: videoId,
        projectId,
        name,
        type: blob.type || 'video/mp4',
        size: blob.size,
        data: arrayBuffer,
        createdAt: new Date().toISOString()
      }

      const request = store.put(videoData)

      request.onsuccess = () => {
        resolve({ success: true, videoId })
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Load processed video
  async loadProcessedVideo(projectId) {
    await this.init()

    const videoId = `${projectId}-processed`

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([VIDEO_STORE], 'readonly')
      const store = transaction.objectStore(VIDEO_STORE)
      const request = store.get(videoId)

      request.onsuccess = () => {
        if (request.result) {
          const { data, name, type, size } = request.result
          const blob = new Blob([data], { type })
          const url = URL.createObjectURL(blob)
          resolve({ success: true, blob, url, name, type, size })
        } else {
          resolve({ success: false, error: 'Processed video not found' })
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Save project metadata (without video blob)
  async saveProject(project) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PROJECT_STORE], 'readwrite')
      const store = transaction.objectStore(PROJECT_STORE)

      const projectData = {
        ...project,
        updatedAt: new Date().toISOString(),
        createdAt: project.createdAt || new Date().toISOString()
      }

      const request = store.put(projectData)

      request.onsuccess = () => {
        resolve({ success: true })
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Load project metadata
  async loadProject(projectId) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PROJECT_STORE], 'readonly')
      const store = transaction.objectStore(PROJECT_STORE)
      const request = store.get(projectId)

      request.onsuccess = () => {
        resolve({ success: !!request.result, project: request.result })
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Get all projects
  async getAllProjects() {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PROJECT_STORE], 'readonly')
      const store = transaction.objectStore(PROJECT_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const projects = request.result.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        )
        resolve(projects)
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Delete project and its videos
  async deleteProject(projectId) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PROJECT_STORE, VIDEO_STORE], 'readwrite')
      const projectStore = transaction.objectStore(PROJECT_STORE)
      const videoStore = transaction.objectStore(VIDEO_STORE)

      // Delete project
      projectStore.delete(projectId)

      // Delete associated videos
      videoStore.delete(`${projectId}-source`)
      videoStore.delete(`${projectId}-processed`)

      transaction.oncomplete = () => {
        resolve({ success: true })
      }

      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Get storage usage
  async getStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        usedMB: Math.round((estimate.usage || 0) / 1024 / 1024),
        quotaMB: Math.round((estimate.quota || 0) / 1024 / 1024),
        percentUsed: Math.round(((estimate.usage || 0) / (estimate.quota || 1)) * 100)
      }
    }
    return { used: 0, quota: 0, usedMB: 0, quotaMB: 0, percentUsed: 0 }
  }

  // Cleanup old projects
  async cleanupOldProjects() {
    await this.init()

    const projects = await this.getAllProjects()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS)

    let deletedCount = 0

    // Delete projects older than MAX_AGE_DAYS
    for (const project of projects) {
      const updatedAt = new Date(project.updatedAt)
      if (updatedAt < cutoffDate) {
        await this.deleteProject(project.id)
        deletedCount++
      }
    }

    // If still over limit, delete oldest projects
    const remainingProjects = await this.getAllProjects()
    if (remainingProjects.length > MAX_PROJECTS) {
      const toDelete = remainingProjects.slice(MAX_PROJECTS)
      for (const project of toDelete) {
        await this.deleteProject(project.id)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
    }

    return { deletedCount }
  }
}

// Singleton instance
export const videoStorage = new VideoStorageManager()

// React hook for video storage
export function useVideoStorage() {
  return videoStorage
}

export default VideoStorageManager
