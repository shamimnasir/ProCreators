'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Image as ImageIcon, Video, Trash2, Download, Library as LibraryIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LibraryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    try {
      const response = await fetch('/api/library/list')
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
        body: JSON.stringify({ id })
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
    // Handle different content types
    if (item.category === 'video' && item.videoUrl) {
      // For videos, create a download link to the video URL
      const a = document.createElement('a')
      a.href = item.videoUrl
      a.download = `${item.type}-${Date.now()}.mp4`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      toast({
        title: "Downloading",
        description: "Video download started"
      })
    } else if (item.category === 'image' && item.filePath) {
      // For images, download the image file
      const a = document.createElement('a')
      a.href = item.filePath
      a.download = `${item.type}-${Date.now()}.jpg`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      toast({
        title: "Downloaded",
        description: "Image downloaded successfully"
      })
    } else if (item.content) {
      // For text content, create a blob
      const blob = new Blob([item.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.type}-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Downloaded",
        description: "Content downloaded successfully"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground mt-1">
          Your saved content and creations
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>
        
        {['all', 'text', 'images', 'videos'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {(() => {
              const filteredItems = tab === 'all' 
                ? items 
                : items.filter(item => {
                    if (tab === 'text') return item.category === 'text'
                    if (tab === 'images') return item.category === 'image'
                    if (tab === 'videos') return item.category === 'video'
                    return true
                  })
              
              return filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <LibraryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {tab === 'all' ? 'Your library is empty' : `No ${tab} content yet`}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Start creating content to build your library
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard/tools/story-reels'}>
                      Create Content
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          {item.category === 'text' && <FileText className="h-5 w-5" />}
                          {item.category === 'image' && <ImageIcon className="h-5 w-5" />}
                          {item.category === 'video' && <Video className="h-5 w-5" />}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {item.category === 'video' && item.videoUrl && (
                          <div className="mb-3">
                            <video 
                              src={item.videoUrl} 
                              className="w-full h-32 object-cover rounded-md bg-black"
                              controls={false}
                              preload="metadata"
                            />
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
                  ))}
                </div>
              )
            })()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
