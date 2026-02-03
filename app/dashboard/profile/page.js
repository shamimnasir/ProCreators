'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ generations: 0, content: 0, storage: 0 })
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setAvatarUrl(data.user.avatarUrl || '')
          
          // Fetch user-specific stats
          fetchUserStats(data.user.id)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (userId) => {
    try {
      const res = await fetch(`/api/user/stats?userId=${userId}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSave = async () => {
    // Get userId either from user state or fallback to demo
    const userId = user?.id || 'demo-user-001'
    
    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        },
        body: JSON.stringify({ 
          userId,
          name,
          avatarUrl
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully"
        })
        // Refresh user data
        fetchUserProfile()
      } else {
        throw new Error(data.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to save profile',
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || 'demo-user-001')

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setAvatarUrl(data.url)
        toast({
          title: "Photo uploaded",
          description: "Your profile photo has been updated"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {getInitials(name, email)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Your monthly usage overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">AI Generations</p>
              <p className="text-2xl font-bold">{stats.generations}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Content Created</p>
              <p className="text-2xl font-bold">{stats.content}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Credits Used</p>
              <p className="text-2xl font-bold">{stats.creditsUsed || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
