'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Clapperboard,
  Wand2,
  Film,
  Camera,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Play,
  Pencil,
  Check,
  X,
  Upload,
  User,
  Clock,
  Eye,
  RefreshCw,
  ArrowRight,
  Video,
  Palette,
  Move3D,
  Lightbulb,
  Scissors
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STYLE_OPTIONS = [
  { id: 'cinematic', name: 'Cinematic Film', icon: '🎬', color: 'from-amber-500 to-orange-600' },
  { id: 'scifi', name: 'Sci-Fi Epic', icon: '🚀', color: 'from-blue-500 to-purple-600' },
  { id: 'fantasy', name: 'Fantasy Epic', icon: '🧙', color: 'from-emerald-500 to-teal-600' },
  { id: 'noir', name: 'Film Noir', icon: '🕵️', color: 'from-gray-600 to-gray-800' },
  { id: 'horror', name: 'Horror/Thriller', icon: '👻', color: 'from-red-600 to-red-900' },
  { id: 'documentary', name: 'Documentary', icon: '📹', color: 'from-sky-500 to-blue-600' },
  { id: 'commercial', name: 'Commercial', icon: '💼', color: 'from-pink-500 to-rose-600' },
  { id: 'anime', name: 'Anime Style', icon: '🎌', color: 'from-violet-500 to-fuchsia-600' },
]

const ASPECT_RATIOS = [
  { id: '9:16', name: 'Portrait (9:16)', desc: 'TikTok, Reels, Shorts' },
  { id: '16:9', name: 'Landscape (16:9)', desc: 'YouTube, Film' },
  { id: '1:1', name: 'Square (1:1)', desc: 'Instagram, Social' },
]

export default function CinematicDirector({ onStartGeneration, userCredits = 0 }) {
  const [step, setStep] = useState(1) // 1: concept, 2: review shots, 3: generating
  const [loading, setLoading] = useState(false)
  
  // Step 1: Concept
  const [concept, setConcept] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [numScenes, setNumScenes] = useState(6)
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [characterDescription, setCharacterDescription] = useState('')
  const [mood, setMood] = useState('')
  const [characterImageFile, setCharacterImageFile] = useState(null)
  const [characterImagePreview, setCharacterImagePreview] = useState(null)
  
  // Step 2: Shot list
  const [shotList, setShotList] = useState(null)
  const [editingScene, setEditingScene] = useState(null)
  const [editedPrompt, setEditedPrompt] = useState('')
  
  const { toast } = useToast()

  const handleGenerateShotList = async () => {
    if (!concept.trim() || concept.length < 10) {
      toast({ title: 'Too short', description: 'Please describe your story concept in more detail (at least 10 characters)', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('sessionToken')
      const res = await fetch('/api/ai-video-studio/cinematic-director', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          concept,
          style,
          numScenes,
          aspectRatio,
          characterDescription,
          mood
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setShotList(data.shotList)
        setStep(2)
        toast({ title: 'Shot list ready!', description: `${data.shotList.totalScenes} scenes planned, ~${data.shotList.totalDuration}s total` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditScene = (scene) => {
    setEditingScene(scene.id)
    setEditedPrompt(scene.visualPrompt)
  }

  const handleSaveEdit = (sceneId) => {
    setShotList(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === sceneId ? { ...s, visualPrompt: editedPrompt } : s
      )
    }))
    setEditingScene(null)
    setEditedPrompt('')
  }

  const handleRemoveScene = (sceneId) => {
    setShotList(prev => {
      const updated = prev.scenes.filter(s => s.id !== sceneId).map((s, idx) => ({
        ...s,
        sceneNumber: idx + 1
      }))
      const totalDuration = updated.reduce((sum, s) => sum + s.duration, 0)
      return {
        ...prev,
        scenes: updated,
        totalScenes: updated.length,
        totalDuration,
        estimatedCredits: Math.ceil((totalDuration / 30) * 110)
      }
    })
  }

  const handleCharacterImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCharacterImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setCharacterImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleStartGeneration = () => {
    if (!shotList || shotList.scenes.length === 0) return
    
    if (userCredits < shotList.estimatedCredits) {
      toast({ title: 'Not enough credits', description: `You need ${shotList.estimatedCredits} credits but have ${userCredits}`, variant: 'destructive' })
      return
    }

    // Pass the shot list to the parent for actual video generation
    if (onStartGeneration) {
      onStartGeneration({
        shotList,
        characterImage: characterImageFile,
        characterImagePreview,
        style,
        aspectRatio
      })
    }
  }

  const handleRegenerateShotList = () => {
    setStep(1)
    setShotList(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clapperboard className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Cinematic Director</h2>
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">NEW</Badge>
        </div>
        <p className="text-muted-foreground">
          Describe your vision — AI creates a professional shot list — you review & generate
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[
          { num: 1, label: 'Story Concept', icon: Lightbulb },
          { num: 2, label: 'Review Shot List', icon: Film },
          { num: 3, label: 'Generate', icon: Wand2 }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              step >= s.num 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Story Concept */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Story Concept */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5" />
                Your Story
              </CardTitle>
              <CardDescription>Describe what you want to create. Be as descriptive as possible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., A cyberpunk detective walks through neon-lit streets of a futuristic Tokyo. She discovers a hidden message in a holographic billboard, leading her to an abandoned warehouse where she confronts the mastermind behind a citywide AI conspiracy..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="min-h-[120px] text-base"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{concept.length}/2000</p>
            </CardContent>
          </Card>

          {/* Visual Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Visual Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STYLE_OPTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      style === s.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-sm font-medium mt-1">{s.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Character & Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Character Reference
                </CardTitle>
                <CardDescription>Optional: Describe or upload a character reference</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="e.g., A woman in her 30s with short black hair, cybernetic left arm, wearing a dark leather trenchcoat, neon blue eye implants..."
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  className="min-h-[80px]"
                />
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Reference Image (optional)</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{characterImageFile ? 'Change image' : 'Upload image'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCharacterImage} />
                    </label>
                    {characterImagePreview && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                        <img src={characterImagePreview} alt="Character" className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setCharacterImageFile(null); setCharacterImagePreview(null) }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  Production Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Number of Scenes</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Slider
                      value={[numScenes]}
                      onValueChange={([v]) => setNumScenes(v)}
                      min={3}
                      max={12}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold w-8 text-center">{numScenes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">~{numScenes * 8}s total ({numScenes} scenes × ~8s each)</p>
                </div>

                <div>
                  <Label className="text-sm">Aspect Ratio</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {ASPECT_RATIOS.map(ar => (
                      <button
                        key={ar.id}
                        onClick={() => setAspectRatio(ar.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          aspectRatio === ar.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-xs font-medium">{ar.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ar.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Mood/Tone (optional)</Label>
                  <Input
                    placeholder="e.g., tense, mysterious, hopeful"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleGenerateShotList}
              disabled={loading || concept.length < 10}
              className="px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Shot List...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Cinematic Shot List
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">AI will create a professional shot-by-shot plan for your story</p>
          </div>
        </div>
      )}

      {/* Step 2: Review Shot List */}
      {step === 2 && shotList && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="border-amber-300">
                    <Film className="h-3 w-3 mr-1" /> {shotList.totalScenes} Scenes
                  </Badge>
                  <Badge variant="outline" className="border-amber-300">
                    <Clock className="h-3 w-3 mr-1" /> ~{shotList.totalDuration}s
                  </Badge>
                  <Badge variant="outline" className="border-amber-300">
                    <Play className="h-3 w-3 mr-1" /> {shotList.estimatedCredits} credits
                  </Badge>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    {shotList.stylePreset}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerateShotList}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Redo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    <ChevronLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scene Cards */}
          <div className="space-y-3">
            {shotList.scenes.map((scene, idx) => (
              <Card key={scene.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Scene Number */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                      <div className="text-center">
                        <p className="text-xs font-medium">Scene</p>
                        <p className="text-xl font-bold leading-none">{scene.sceneNumber}</p>
                      </div>
                    </div>

                    {/* Scene Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />{scene.shotType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Move3D className="h-3 w-3 mr-1" />{scene.cameraMovement}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />{scene.duration}s
                        </Badge>
                        {scene.transition && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            → {scene.transition}
                          </Badge>
                        )}
                      </div>

                      {/* Action description */}
                      <p className="text-sm text-foreground mb-2">{scene.action}</p>

                      {/* Visual Prompt (editable) */}
                      {editingScene === scene.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editedPrompt}
                            onChange={(e) => setEditedPrompt(e.target.value)}
                            className="text-xs min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={() => handleSaveEdit(scene.id)}>
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingScene(null)}>
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-2 group relative">
                          <p className="text-xs text-muted-foreground line-clamp-2">{scene.visualPrompt}</p>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => handleEditScene(scene)}
                              className="p-1 rounded bg-background border hover:bg-muted"
                              title="Edit prompt"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {shotList.scenes.length > 3 && (
                              <button
                                onClick={() => handleRemoveScene(scene.id)}
                                className="p-1 rounded bg-background border hover:bg-red-50 text-red-500"
                                title="Remove scene"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Generate Videos Button */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-1">Ready to bring your story to life?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {shotList.totalScenes} scenes • ~{shotList.totalDuration}s total • Seedance 1.5 Pro quality
              </p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{shotList.estimatedCredits}</p>
                  <p className="text-xs text-muted-foreground">credits needed</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{userCredits}</p>
                  <p className="text-xs text-muted-foreground">your balance</p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleStartGeneration}
                disabled={userCredits < shotList.estimatedCredits}
                className="px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                Generate All Scenes with Seedance 1.5 Pro
              </Button>
              {userCredits < shotList.estimatedCredits && (
                <p className="text-xs text-red-500 mt-2">
                  You need {shotList.estimatedCredits - userCredits} more credits. Purchase credits or reduce scenes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
