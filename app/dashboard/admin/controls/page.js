'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, Power, Shield, Zap, Video, Image, Music, 
  FileText, Type, Loader2, RefreshCw, History, AlertCircle
, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const FEATURE_ICONS = {
  video: Video,
  image: Image,
  audio: Music,
  text: Type,
  pdf: FileText
}

export default function AdminControlsPage() {
  const [controls, setControls] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emergencyReason, setEmergencyReason] = useState('')
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const { toast } = useToast()

  const fetchControls = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/controls?auditLog=true')
      const data = await res.json()
      if (data.success) {
        setControls(data.controls)
        setAuditLog(data.auditLog || [])
        setMaintenanceMessage(data.controls.maintenanceMessage || '')
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchControls()
  }, [])

  const updateControl = async (action, params = {}) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminId: 'admin', ...params })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Updated', description: 'Control updated successfully' })
        fetchControls()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEmergencyKill = async () => {
    await updateControl('emergency_kill', { reason: emergencyReason || 'Emergency shutdown initiated by admin' })
    setEmergencyReason('')
  }

  const handleRestore = async () => {
    await updateControl('restore')
  }

  const toggleFeature = async (featureType, enabled) => {
    await updateControl('toggle_feature', { featureType, enabled })
  }

  const toggleMaintenance = async (enabled) => {
    await updateControl('maintenance_mode', { enabled, message: maintenanceMessage })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isEmergencyActive = controls?.emergencyKillActive
  const isMaintenanceActive = controls?.maintenanceMode

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            System Controls
          </h1>
          <p className="text-muted-foreground mt-1">
            Kill switches and feature toggles for emergency control
          </p>
        </div>
        <Button variant="outline" onClick={fetchControls} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Emergency Kill Section */}
      <Card className={`border-2 ${isEmergencyActive ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-red-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Emergency Kill Switch
          </CardTitle>
          <CardDescription>
            Instantly disable ALL generations. Use only in emergencies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmergencyActive ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  EMERGENCY KILL ACTIVE
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  All generations are currently disabled.
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Reason: {controls?.emergencyKillReason || 'No reason provided'}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Power className="h-4 w-4 mr-2" />
                    Restore System
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore System?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will re-enable all generation features. Make sure the emergency is resolved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Emergency Kill</Label>
                <Textarea
                  placeholder="Describe why you're activating the emergency kill..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  rows={2}
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={saving}>
                    <Zap className="h-4 w-4 mr-2" />
                    ACTIVATE EMERGENCY KILL
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">⚠️ Activate Emergency Kill?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately disable ALL generation features for ALL users. 
                      Only do this if there's a critical issue like runaway API costs or security breach.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEmergencyKill} className="bg-red-600">
                      Yes, Kill Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className={isMaintenanceActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Show maintenance message to users without fully disabling the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode">Maintenance Mode Active</Label>
            <Switch
              id="maintenance-mode"
              checked={isMaintenanceActive}
              onCheckedChange={(checked) => toggleMaintenance(checked)}
            />
          </div>
          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <Textarea
              placeholder="We are currently performing maintenance..."
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={2}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateControl('maintenance_mode', { enabled: isMaintenanceActive, message: maintenanceMessage })}
            >
              Update Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable specific generation types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'video', label: 'Video Generation', desc: 'AI Video Studio, Reels, etc.' },
              { key: 'image', label: 'Image Generation', desc: 'Image Editor, Covers, Avatars' },
              { key: 'audio', label: 'Audio Processing', desc: 'Audio Editor, Voice Clone' },
              { key: 'text', label: 'Text Generation', desc: 'Jokes, Letters, Stories' },
              { key: 'pdf', label: 'PDF Generation', desc: 'Planners, Ebooks, Worksheets' }
            ].map(feature => {
              const Icon = FEATURE_ICONS[feature.key]
              const isEnabled = controls?.[`${feature.key}GenerationEnabled`] !== false
              
              return (
                <div key={feature.key} className={`p-4 rounded-lg border ${isEnabled ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${isEnabled ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="font-medium">{feature.label}</span>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  <Badge variant={isEnabled ? 'default' : 'destructive'} className="mt-2">
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Global Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Global Generation Toggle</p>
              <p className="text-sm text-muted-foreground">Master switch for all generations</p>
            </div>
            <Switch
              checked={controls?.globalEnabled !== false}
              onCheckedChange={(checked) => updateControl('update', { updates: { globalEnabled: checked } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Control Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No changes recorded yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {auditLog.slice(0, 20).map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div>
                    <span className="font-medium">{log.action}</span>
                    {log.toolId && <span className="text-muted-foreground ml-2">({log.toolId})</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
