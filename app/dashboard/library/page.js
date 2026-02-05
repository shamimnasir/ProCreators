'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, Image as ImageIcon, Video, Trash2, Download, 
  Library as LibraryIcon, Grid, LayoutGrid, Play, Filter, X 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { QUICK_REELS_NICHES } from '@/config/quick-reels-niches'

// Tool types for filtering
const TOOL_TYPES = [
  { value: 'all', label: 'All Tools', icon: '🎯' },
  { value: 'ai-video-studio', label: 'AI Video Studio', icon: '🎬' },
  { value: 'story-reels', label: 'Quick Video Reels', icon: '📹' },
  { value: 'script-to-ad', label: 'Script to Ad', icon: '📱' },
  { value: 'quote-maker', label: 'Quote Maker', icon: '💬' },
  { value: 'thread-generator', label: 'Thread Generator', icon: '🧵' },
  { value: 'image-generator', label: 'Image Generator', icon: '🖼️' },
  { value: 'planner', label: 'Planner Maker', icon: '📅' },
  { value: 'ebook', label: 'Ebook Maker', icon: '📖' },
  { value: 'journal', label: 'Journal Maker', icon: '📓' },
  { value: 'worksheet', label: 'Worksheet Generator', icon: '📝' },
  { value: 'checklist', label: 'Checklist Maker', icon: '✅' },
  { value: 'slides-maker', label: 'AI Presentation Maker', icon: '📊' },
  { value: 'study-notes', label: 'Study Notes', icon: '📚' },
  { value: 'quiz', label: 'Quiz Maker', icon: '❓' },
  { value: 'flashcards', label: 'Flashcards', icon: '🎴' },
  { value: 'lesson-planner', label: 'Lesson Planner', icon: '📋' },
  { value: 'essay-helper', label: 'Essay Helper', icon: '✍️' },
  { value: 'exam-prep', label: 'Exam Prep', icon: '📝' },
  { value: 'citation-generator', label: 'Citation Generator', icon: '📚' },
]

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'feed'
  const [playingVideo, setPlayingVideo] = useState(null)
  const [userId, setUserId] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get user ID first, then fetch library
    initUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchLibrary()
    }
  }, [selectedTool, userId])

  const initUser = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUserId(data.user.id)
          return
        }
      }
      // SECURITY: Redirect to login instead of demo user fallback
      window.location.href = '/login?redirect=/dashboard/library'
    } catch (error) {
      console.error('Error getting user:', error)
      window.location.href = '/login?redirect=/dashboard/library'
    }
  }

  // Helper to get niche display info
  const getNicheInfo = (nicheSlug) => {
    const niche = QUICK_REELS_NICHES.find(n => n.slug === nicheSlug)
    if (!niche) return null
    return {
      icon: niche.icon,
      name: niche.name,
      color: niche.color
    }
  }

  // Get friendly tool name
  const getToolDisplayName = (type) => {
    const tool = TOOL_TYPES.find(t => t.value === type)
    return tool ? `${tool.icon} ${tool.label}` : type
  }

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      let url = selectedTool === 'all' 
        ? `/api/library/list?userId=${userId}` 
        : `/api/library/list?tool=${selectedTool}&userId=${userId}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setItems(data.items || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load library",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch('/api/library/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setItems(items.filter(item => item.id !== id))
        toast({
          title: "Deleted",
          description: "Item removed from library"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      })
    }
  }

  const handleDownload = (item) => {
    // For videos
    if (item.category === 'video' && item.videoUrl) {
      const a = document.createElement('a')
      a.href = item.videoUrl
      a.download = `${item.type}-${Date.now()}.mp4`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloading", description: "Video download started" })
      return
    }
    
    // For inline PDF data URLs (marketing strategies, etc.)
    if (item.category === 'pdf' && item.content && item.content.startsWith('data:application/pdf')) {
      const a = document.createElement('a')
      a.href = item.content
      a.download = `${item.title || item.type}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloaded", description: "PDF saved successfully" })
      return
    }
    
    // For HTML content that can be printed as PDF
    if (item.category === 'html' && item.content) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(item.content)
        printWindow.document.close()
        printWindow.onload = () => printWindow.print()
      }
      toast({ title: "Print Dialog", description: "Use Save as PDF to download" })
      return
    }
    
    // For documents (PDFs - ebooks, journals, planners, worksheets, checklists)
    if (item.filePath && item.filePath.endsWith('.pdf')) {
      const a = document.createElement('a')
      a.href = item.filePath
      a.download = `${item.title || item.type}-${Date.now()}.pdf`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloading", description: "PDF download started" })
      return
    }
    
    // For images
    if (item.category === 'image' && item.filePath) {
      const a = document.createElement('a')
      a.href = item.filePath
      a.download = `${item.type}-${Date.now()}.jpg`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloaded", description: "Image downloaded successfully" })
      return
    }
    
    // For any other file with filePath
    if (item.filePath) {
      const a = document.createElement('a')
      a.href = item.filePath
      a.download = `${item.title || item.type}-${Date.now()}`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloading", description: "Download started" })
      return
    }
    
    // For text content
    if (item.content) {
      const blob = new Blob([item.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.type}-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: "Downloaded", description: "Content downloaded successfully" })
      return
    }
    
    // Fallback - no downloadable content
    toast({ 
      title: "Download unavailable", 
      description: "This item doesn't have downloadable content",
      variant: "destructive" 
    })
  }

  // Filter items by category tab
  const filterByCategory = (items, category) => {
    if (category === 'all') return items
    if (category === 'text') return items.filter(item => item.category === 'text')
    if (category === 'images') return items.filter(item => item.category === 'image')
    if (category === 'videos') return items.filter(item => item.category === 'video')
    if (category === 'documents') return items.filter(item => 
      item.category === 'document' || 
      item.category === 'pdf' || 
      item.category === 'html' ||
      (item.filePath && item.filePath.endsWith('.pdf'))
    )
    return items
  }

  // Render item card based on view mode
  const renderItem = (item, isGridView = true) => {
    const isFeed = !isGridView
    const isPDF = item.category === 'pdf' || (item.filePath && item.filePath.endsWith('.pdf'))
    
    return (
      <Card key={item.id} className={isFeed ? 'max-w-lg mx-auto' : ''}>
        {/* Video/Image Preview - Instagram style for feed view */}
        {item.category === 'video' && item.videoUrl && (
          <div className={`relative bg-black ${isFeed ? 'aspect-[9/16]' : 'aspect-video'} rounded-t-lg overflow-hidden`}>
            <video 
              src={item.videoUrl} 
              className="w-full h-full object-contain"
              controls={playingVideo === item.id}
              preload="metadata"
              onClick={() => setPlayingVideo(playingVideo === item.id ? null : item.id)}
            />
            {playingVideo !== item.id && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/20 transition-colors"
                onClick={() => setPlayingVideo(item.id)}
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {item.category === 'image' && item.filePath && (
          <div className={`relative ${isFeed ? 'aspect-square' : 'aspect-video'}`}>
            <img 
              src={item.filePath} 
              alt={item.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          </div>
        )}
        
        {/* Document/PDF Preview */}
        {isPDF && (
          <div className={`relative ${isFeed ? 'aspect-square' : 'aspect-video'} bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-t-lg flex items-center justify-center`}>
            <div className="text-center">
              <div className="text-6xl mb-2">📄</div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">PDF</span>
            </div>
          </div>
        )}
        
        <CardHeader className={isFeed ? 'pb-2' : ''}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.category === 'text' && <FileText className="h-4 w-4 text-muted-foreground" />}
              {item.category === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
              {item.category === 'video' && <Video className="h-4 w-4 text-muted-foreground" />}
              <Badge variant="outline" className="text-xs">
                {getToolDisplayName(item.type)}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {item.description}
          </CardDescription>
          {item.niche && (() => {
            const nicheInfo = getNicheInfo(item.niche)
            return nicheInfo && (
              <Badge variant="secondary" className="mt-2 w-fit text-xs">
                <span className="mr-1">{nicheInfo.icon}</span>
                {nicheInfo.name}
              </Badge>
            )
          })()}
        </CardHeader>
        
        <CardContent className={isFeed ? 'pt-0' : ''}>
          {item.category === 'text' && item.content && !isFeed && (
            <div className="mb-3 p-3 bg-muted rounded-md max-h-24 overflow-hidden">
              <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleDownload(item)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LibraryIcon className="h-8 w-8" />
            Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Your saved content and creations ({items.length} items)
          </p>
        </div>
        
        {/* View & Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Tool Filter */}
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              {TOOL_TYPES.map(tool => (
                <SelectItem key={tool.value} value={tool.value}>
                  <span className="flex items-center gap-2">
                    <span>{tool.icon}</span>
                    <span>{tool.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'feed' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('feed')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filter Badge */}
      {selectedTool !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <Badge variant="secondary" className="gap-1">
            {TOOL_TYPES.find(t => t.value === selectedTool)?.icon}
            {TOOL_TYPES.find(t => t.value === selectedTool)?.label}
            <button onClick={() => setSelectedTool('all')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="videos">
            Videos ({items.filter(i => i.category === 'video').length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({items.filter(i => i.category === 'document' || i.category === 'pdf' || i.category === 'html' || (i.filePath && i.filePath.endsWith('.pdf'))).length})
          </TabsTrigger>
          <TabsTrigger value="images">
            Images ({items.filter(i => i.category === 'image').length})
          </TabsTrigger>
          <TabsTrigger value="text">
            Text ({items.filter(i => i.category === 'text').length})
          </TabsTrigger>
        </TabsList>
        
        {['all', 'videos', 'documents', 'images', 'text'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (() => {
              const filteredItems = filterByCategory(items, tab)
              
              return filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <LibraryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedTool !== 'all' 
                        ? `No ${TOOL_TYPES.find(t => t.value === selectedTool)?.label} content yet`
                        : tab === 'all' 
                          ? 'Your library is empty' 
                          : `No ${tab} content yet`
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Start creating content to build your library
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard'}>
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  viewMode === 'feed' 
                    ? 'space-y-6 max-w-lg mx-auto' 
                    : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }>
                  {filteredItems.map((item) => renderItem(item, viewMode === 'grid'))}
                </div>
              )
            })()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
