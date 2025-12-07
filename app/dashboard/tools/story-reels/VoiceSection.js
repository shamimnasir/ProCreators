'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Mic, Upload, Loader2, Sparkles, Check, X, Trash2, User
} from 'lucide-react'

export default function VoiceSection({ 
  ttsLanguage, 
  selectedVoiceId, 
  onVoiceChange,
  voiceFile,
  onVoiceFileChange
}) {
  const [voices, setVoices] = useState({ premade: [], cloned: [] })
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [cloning, setCloning] = useState(false)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [deletingVoice, setDeletingVoice] = useState(null)
  
  const audioFileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const { toast } = useToast()

  // Load voices on component mount
  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    setLoadingVoices(true)
    try {
      const response = await fetch('/api/story-reels/voices/list')
      const data = await response.json()
      
      if (data.success) {
        setVoices(data.voices)
        
        // Auto-select first Bengali premade voice if none selected
        if (!selectedVoiceId && data.voices.premade.length > 0) {
          onVoiceChange(data.voices.premade[0].voice_id)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load voices",
        variant: "destructive"
      })
    } finally {
      setLoadingVoices(false)
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      console.log('[Voice Recording] Requesting microphone access...')
      
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1'
      
      if (!isSecureContext) {
        toast({
          title: "Microphone Access Requires HTTPS",
          description: "For security, microphone access requires HTTPS or localhost. Please use a secure connection.",
          variant: "destructive"
        })
        return
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Browser Not Supported",
          description: "Your browser doesn't support microphone access. Please use Chrome, Firefox, or Safari.",
          variant: "destructive"
        })
        return
      }

      // Check current permission status
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' })
        console.log('[Voice Recording] Microphone permission status:', permissionStatus.state)
        
        if (permissionStatus.state === 'denied') {
          toast({
            title: "Microphone Permission Denied",
            description: (
              <div className="space-y-2">
                <p>Please enable microphone access:</p>
                <ol className="text-xs list-decimal list-inside space-y-1">
                  <li>Click the 🎤 icon in your address bar</li>
                  <li>Select "Always allow"</li>
                  <li>Refresh page and try again</li>
                </ol>
              </div>
            ),
            variant: "destructive",
            duration: 10000
          })
          return
        }
      } catch (permError) {
        console.log('[Voice Recording] Could not check permission status:', permError)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      console.log('[Voice Recording] Microphone access granted')
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(audioBlob)
        setUploadedFile(null)
        
        // Stop all tracks to free up the microphone
        stream.getTracks().forEach(track => {
          track.stop()
          console.log(`[Voice Recording] Stopped track: ${track.kind}`)
        })
      }

      mediaRecorder.start()
      setRecording(true)
      
      toast({
        title: "Recording Started! 🎙️",
        description: "Speak clearly for 10-30 seconds in your natural Bengali voice...",
        duration: 3000
      })
      
      console.log('[Voice Recording] Recording started successfully')
      
    } catch (error) {
      console.error('[Voice Recording] Error accessing microphone:', error)
      
      let errorMessage = "Could not access microphone."
      let actionSteps = []
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone permission denied."
        actionSteps = [
          "1. Click the 🎤 microphone icon in your browser's address bar",
          "2. Select 'Always allow' or 'Allow'", 
          "3. Refresh the page and try again"
        ]
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found."
        actionSteps = [
          "1. Connect a microphone to your device",
          "2. Check your system audio settings",
          "3. Try again"
        ]
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is being used by another application."
        actionSteps = [
          "1. Close other apps that might be using the microphone",
          "2. Close other browser tabs with microphone access", 
          "3. Try again"
        ]
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Microphone doesn't support the required settings."
        actionSteps = [
          "1. Try with a different microphone",
          "2. Check your audio drivers",
          "3. Use the file upload option instead"
        ]
      } else if (error.name === 'SecurityError') {
        errorMessage = "Microphone access blocked by security settings."
        actionSteps = [
          "1. Check your browser's privacy settings",
          "2. Make sure you're on localhost or HTTPS",
          "3. Try a different browser"
        ]
      }
      
      toast({
        title: "Microphone Error",
        description: (
          <div className="space-y-2">
            <p className="font-medium">{errorMessage}</p>
            <div className="text-xs space-y-1">
              <p className="font-medium">How to fix:</p>
              {actionSteps.map((step, i) => (
                <p key={i}>{step}</p>
              ))}
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 15000
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      console.log('[Voice Recording] Stopping recording...')
      mediaRecorderRef.current.stop()
      setRecording(false)
      
      toast({
        title: "Recording Stopped",
        description: "Your voice sample is ready for cloning",
        duration: 2000
      })
      
      console.log('[Voice Recording] Recording stopped successfully')
    }
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File must be less than 10MB",
          variant: "destructive"
        })
        return
      }

      setUploadedFile(file)
      setRecordedBlob(null)
      toast({
        title: "Success",
        description: "Voice sample uploaded successfully"
      })
    }
  }

  // Clone voice
  const handleCloneVoice = async () => {
    if (!newVoiceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your voice",
        variant: "destructive"
      })
      return
    }

    if (!recordedBlob && !uploadedFile) {
      toast({
        title: "Error",
        description: "Please record or upload a voice sample first",
        variant: "destructive"
      })
      return
    }

    setCloning(true)
    try {
      const formData = new FormData()
      formData.append('voiceName', newVoiceName)
      formData.append('description', `${ttsLanguage === 'bn' ? 'Bengali' : 'English'} cloned voice`)
      
      if (recordedBlob) {
        formData.append('voiceFile', recordedBlob, 'recording.webm')
      } else if (uploadedFile) {
        formData.append('voiceFile', uploadedFile)
      }

      const response = await fetch('/api/story-reels/voices/clone', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message
        })
        
        // Reload voices and select the new one
        await loadVoices()
        onVoiceChange(data.voiceId)
        
        // Reset form
        setShowCloneDialog(false)
        setNewVoiceName('')
        setRecordedBlob(null)
        setUploadedFile(null)
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
      setCloning(false)
    }
  }

  // Delete voice
  const handleDeleteVoice = async (voiceId) => {
    if (!confirm('Are you sure you want to delete this voice? This action cannot be undone.')) {
      return
    }

    setDeletingVoice(voiceId)
    try {
      const response = await fetch(`/api/story-reels/voices/delete?voiceId=${voiceId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Voice deleted successfully"
        })
        
        // Reload voices
        await loadVoices()
        
        // If deleted voice was selected, select first premade voice
        if (selectedVoiceId === voiceId && voices.premade.length > 0) {
          onVoiceChange(voices.premade[0].voice_id)
        }
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
      setDeletingVoice(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Selection
        </CardTitle>
        <CardDescription>
          Choose a pre-made voice or clone your own for authentic {ttsLanguage === 'bn' ? 'Bangladeshi Bengali' : 'English'} narration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="premade" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="premade">Pre-made Voices</TabsTrigger>
            <TabsTrigger value="original">
              <Mic className="h-4 w-4 mr-1" />
              Use Original Recording
            </TabsTrigger>
            <TabsTrigger value="clone">
              <Sparkles className="h-4 w-4 mr-1" />
              Clone Voice
            </TabsTrigger>
          </TabsList>

          {/* Pre-made Voices */}
          <TabsContent value="premade" className="space-y-4">
            {loadingVoices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Recommended {ttsLanguage === 'bn' ? 'Bengali' : 'English'} Voices</Label>
                  <div className="grid gap-2">
                    {voices.premade.map((voice) => (
                      <div
                        key={voice.voice_id}
                        onClick={() => onVoiceChange(voice.voice_id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                          selectedVoiceId === voice.voice_id 
                            ? 'border-primary bg-primary/5' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{voice.name}</p>
                              {selectedVoiceId === voice.voice_id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{voice.description}</p>
                            <div className="flex gap-1 mt-1">
                              {voice.labels?.gender && (
                                <Badge variant="outline" className="text-xs">
                                  {voice.labels.gender}
                                </Badge>
                              )}
                              {voice.labels?.age && (
                                <Badge variant="outline" className="text-xs">
                                  {voice.labels.age}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {voices.cloned.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Your Cloned Voices</Label>
                      <Badge variant="secondary" className="text-xs">
                        {voices.cloned.length} saved
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {voices.cloned.map((voice) => (
                        <div
                          key={voice.voice_id}
                          className={`p-3 border rounded-lg transition-all ${
                            selectedVoiceId === voice.voice_id 
                              ? 'border-primary bg-primary/5' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => onVoiceChange(voice.voice_id)}
                            >
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <p className="font-medium">{voice.name}</p>
                                {selectedVoiceId === voice.voice_id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{voice.description}</p>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Bangladeshi
                                </Badge>
                                {voice.labels?.usage_count > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Used {voice.labels.usage_count} times
                                  </Badge>
                                )}
                                {voice.created_at && (
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(voice.created_at).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteVoice(voice.voice_id)}
                              disabled={deletingVoice === voice.voice_id}
                            >
                              {deletingVoice === voice.voice_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        ✨ Your cloned voices are permanently saved and can be used for all future videos. 
                        They're stored both in ElevenLabs and our secure database for reliable access.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Clone Voice */}
          <TabsContent value="clone" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">How Voice Cloning Works:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Record or upload 10-30 seconds of clear speech in your natural Bangladeshi voice</li>
                <li>AI analyzes your voice characteristics (tone, pitch, accent) with special optimization for Bangladeshi Bengali</li>
                <li>Your cloned voice preserves your authentic Bangladeshi accent and pronunciation</li>
                <li>Use it to generate any text with your exact voice and regional accent!</li>
              </ol>
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100">📢 Bangladeshi Accent Tips:</h5>
                <ul className="text-xs text-blue-800 dark:text-blue-200 mt-1 space-y-1 list-disc list-inside">
                  <li>Speak naturally with your normal Bangladeshi pronunciation</li>
                  <li>Include some common Bengali words: "আমি", "তুমি", "কেমন আছো", "ভালো"</li>
                  <li>Record in a quiet environment for best accent capture</li>
                  <li>Avoid copying Indian Bengali pronunciation - use YOUR natural accent!</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Name</Label>
                <Input
                  placeholder="e.g., My Voice, Ahmed's Voice, Sarah's Voice"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Sample (10-30 seconds recommended)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={recording ? "destructive" : "outline"}
                    onClick={recording ? stopRecording : startRecording}
                    className="w-full"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {recording ? 'Stop Recording' : 'Record Voice'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => audioFileRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio
                  </Button>
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {(recordedBlob || uploadedFile) && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Voice sample ready: {uploadedFile?.name || 'Recorded audio'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRecordedBlob(null)
                        setUploadedFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCloneVoice}
                disabled={cloning || (!recordedBlob && !uploadedFile) || !newVoiceName.trim()}
                className="w-full"
              >
                {cloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Clone Voice
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                ✨ Your cloned voice will appear in "Pre-made Voices" tab after creation
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
