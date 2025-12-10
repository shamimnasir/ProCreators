'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Search, Music, Download, Play, Pause, Check, Loader2, X } from 'lucide-react'

export default function MusicPicker({ open, onClose, onSelectMusic, videoDuration }) {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('upbeat background music')
  const [searching, setSearching] = useState(false)
  const [tracks, setTracks] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [audioPlayer, setAudioPlayer] = useState(null)

  // Preset search queries
  const presets = [
    'upbeat background music',
    'calm ambient music',
    'epic cinematic music',
    'emotional piano music',
    'energetic electronic music',
    'corporate background music'
  ]

  const searchMusic = async (query = searchQuery) => {
    if (!query.trim()) {
      toast({
        title: "Enter search term",
        description: "Please enter keywords to search for music",
        variant: "destructive"
      })
      return
    }

    setSearching(true)
    setTracks([])

    try {
      const response = await fetch('/api/story-reels/search-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          duration: videoDuration 
        })
      })

      const data = await response.json()

      if (data.needsApiKey) {
        toast({
          title: "API Key Required",
          description: "Freesound API key not configured. Please add FREESOUND_API_KEY to .env file.",
          variant: "destructive"
        })
        return
      }

      if (data.success) {
        setTracks(data.tracks)
        if (data.tracks.length === 0) {
          toast({
            title: "No results",
            description: "Try different search terms"
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
  }

  const playPreview = (track) => {
    // Stop current audio if playing
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
    }

    if (playingId === track.id) {
      // Stop if clicking same track
      setPlayingId(null)
      setAudioPlayer(null)
    } else {
      // Play new track
      const audio = new Audio(track.previewUrl)
      audio.play()
      audio.onended = () => setPlayingId(null)
      setPlayingId(track.id)
      setAudioPlayer(audio)
    }
  }

  const handleSelectTrack = async (track) => {
    // Stop audio preview immediately when selecting
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
      setPlayingId(null)
      setAudioPlayer(null)
    }

    setDownloading(true)

    try {
      // Download and cache the music
      const response = await fetch('/api/story-reels/download-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soundId: track.id,
          name: track.name,
          duration: videoDuration,
          previewUrl: track.previewUrl
        })
      })

      const data = await response.json()

      if (data.success) {
        setSelectedTrack(track)
        onSelectMusic({
          name: track.name,
          path: data.publicUrl,
          filePath: data.filePath,
          soundId: track.id,
          cached: data.cached
        })
        
        toast({
          title: "Music Selected!",
          description: `"${track.name}" will be added to your video`
        })
        
        onClose()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleClose = () => {
    if (audioPlayer) {
      audioPlayer.pause()
      setPlayingId(null)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Choose Background Music
          </DialogTitle>
          <DialogDescription>
            Search our music library for the perfect background track. Music will auto-cut to match your video duration ({Math.floor(videoDuration)}s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMusic()}
            />
            <Button onClick={() => searchMusic()} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Preset Searches */}
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <Badge
                key={preset}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => {
                  setSearchQuery(preset)
                  searchMusic(preset)
                }}
              >
                {preset}
              </Badge>
            ))}
          </div>

          {/* Results */}
          {tracks.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {track.username} • {Math.floor(track.duration)}s • {track.license}
                      </p>
                      {track.tags && track.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {track.tags.slice(0, 5).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playPreview(track)}
                      >
                        {playingId === track.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTrack(track)}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : selectedTrack?.id === track.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searching && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching Freesound...</p>
            </div>
          )}

          {!searching && tracks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Search for background music to add to your video</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
