'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Ticket,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Copy,
  Check,
  Calendar,
  Users,
  TrendingUp,
  Search,
  Pencil,
  Eye,
  EyeOff,
  Gift,
  Percent,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const COUPON_TYPES = [
  { value: 'credits', label: 'Free Credits', icon: Gift, description: 'Add credits to user account' },
  { value: 'discount_percent', label: 'Percentage Discount', icon: Percent, description: 'Discount on subscription' },
  { value: 'discount_fixed', label: 'Fixed Discount', icon: DollarSign, description: 'Fixed amount off subscription' },
]

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'creator', label: 'Creator' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [stats, setStats] = useState({ total: 0, totalActive: 0, totalRedemptions: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'credits',
    value: '',
    description: '',
    maxUses: '',
    perUserLimit: '1',
    validUntil: '',
    minPlan: '',
    applicablePlans: [],
  })

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)

  // Detail/redemption viewer
  const [detailCoupon, setDetailCoupon] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [copiedCode, setCopiedCode] = useState(null)

  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...getCsrfHeaders(),
    }
  }

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('sessionToken')
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/coupons?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setCoupons(data.coupons)
        setStats(data.stats)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value) {
      toast({ title: 'Error', description: 'Code and value are required', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const payload = {
        code: newCoupon.code,
        type: newCoupon.type,
        value: Number(newCoupon.value),
        description: newCoupon.description,
        maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : null,
        perUserLimit: newCoupon.perUserLimit ? Number(newCoupon.perUserLimit) : 1,
        validUntil: newCoupon.validUntil || null,
        minPlan: newCoupon.minPlan || null,
        applicablePlans: newCoupon.applicablePlans,
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: `Coupon ${data.coupon.code} created!` })
        setCreateDialogOpen(false)
        resetCreateForm()
        fetchCoupons()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          couponId: coupon._id,
          isActive: !coupon.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Updated', description: `Coupon ${coupon.isActive ? 'deactivated' : 'activated'}` })
        fetchCoupons()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return

    try {
      const token = localStorage.getItem('sessionToken')
      const res = await fetch(`/api/admin/coupons?couponId=${coupon._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, ...getCsrfHeaders() },
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Deleted', description: `Coupon ${coupon.code} deleted` })
        fetchCoupons()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          couponId: editingCoupon._id,
          description: editingCoupon.description,
          maxUses: editingCoupon.maxUses ? Number(editingCoupon.maxUses) : null,
          perUserLimit: editingCoupon.perUserLimit ? Number(editingCoupon.perUserLimit) : 1,
          validUntil: editingCoupon.validUntil || null,
          isActive: editingCoupon.isActive,
          minPlan: editingCoupon.minPlan || null,
          applicablePlans: editingCoupon.applicablePlans || [],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Updated', description: 'Coupon updated successfully' })
        setEditDialogOpen(false)
        fetchCoupons()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const resetCreateForm = () => {
    setNewCoupon({
      code: '',
      type: 'credits',
      value: '',
      description: '',
      maxUses: '',
      perUserLimit: '1',
      validUntil: '',
      minPlan: '',
      applicablePlans: [],
    })
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getTypeConfig = (type) => {
    switch (type) {
      case 'credits':
        return { icon: Gift, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Credits' }
      case 'discount_percent':
        return { icon: Percent, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '% Discount' }
      case 'discount_fixed':
        return { icon: DollarSign, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: '$ Discount' }
      default:
        return { icon: Gift, color: 'bg-gray-100 text-gray-700', label: 'Unknown' }
    }
  }

  const formatValue = (coupon) => {
    switch (coupon.type) {
      case 'credits': return `${coupon.value.toLocaleString()} credits`
      case 'discount_percent': return `${coupon.value}% off`
      case 'discount_fixed': return `$${coupon.value} off`
      default: return coupon.value
    }
  }

  const isExpired = (coupon) => {
    if (!coupon.validUntil) return false
    return new Date(coupon.validUntil) < new Date()
  }

  const isMaxedOut = (coupon) => {
    if (!coupon.maxUses) return false
    return coupon.usedCount >= coupon.maxUses
  }

  const getStatusBadge = (coupon) => {
    if (!coupon.isActive) return <Badge variant="secondary">Inactive</Badge>
    if (isExpired(coupon)) return <Badge variant="destructive">Expired</Badge>
    if (isMaxedOut(coupon)) return <Badge className="bg-yellow-500 text-white">Maxed Out</Badge>
    return <Badge className="bg-green-500 text-white">Active</Badge>
  }

  // Filter coupons by search term
  const filteredCoupons = coupons.filter(c => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return c.code.toLowerCase().includes(term) || (c.description || '').toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            Coupon Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promo codes, discounts, and credit rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCoupons} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetCreateForm(); setCreateDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Coupons</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Coupons</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.totalActive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redemptions</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.totalRedemptions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expired / Inactive</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{stats.total - stats.totalActive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coupons</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="expired">Expired / Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchCoupons}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No coupons found</p>
              <Button variant="outline" className="mt-4" onClick={() => { resetCreateForm(); setCreateDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Coupon
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map(coupon => {
                const typeConfig = getTypeConfig(coupon.type)
                const TypeIcon = typeConfig.icon
                return (
                  <div key={coupon._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-bold text-lg tracking-wider">{coupon.code}</code>
                          <button onClick={() => copyToClipboard(coupon.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {copiedCode === coupon.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">{formatValue(coupon)}</span>
                          {coupon.description && <span>• {coupon.description}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(coupon)}
                      <Badge variant="outline" className="font-mono">
                        {typeConfig.label}
                      </Badge>

                      <div className="text-right min-w-[80px]">
                        <p className="font-bold">{coupon.usedCount || 0} <span className="text-xs text-muted-foreground font-normal">/ {coupon.maxUses || '∞'}</span></p>
                        <p className="text-xs text-muted-foreground">redemptions</p>
                      </div>

                      <div className="text-right min-w-[100px]">
                        {coupon.validUntil ? (
                          <>
                            <p className="text-sm">{new Date(coupon.validUntil).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {isExpired(coupon) ? 'Expired' : 'Expires'}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No expiry</p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setDetailCoupon(coupon); setDetailOpen(true) }} title="View details">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingCoupon({ ...coupon }); setEditDialogOpen(true) }} title="Edit">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={coupon.isActive ? "outline" : "default"}
                          onClick={() => handleToggleActive(coupon)}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteCoupon(coupon)} title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Coupon
            </DialogTitle>
            <DialogDescription>
              Create a promo code for credits or subscription discounts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code */}
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., SUMMER50"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="font-mono tracking-wider"
                />
                <Button variant="outline" type="button" onClick={() => setNewCoupon({ ...newCoupon, code: generateCouponCode() })}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">3-30 characters, letters, numbers, hyphens, underscores only</p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Coupon Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                {COUPON_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setNewCoupon({ ...newCoupon, type: type.value, value: '' })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        newCoupon.type === type.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label>
                {newCoupon.type === 'credits' ? 'Credits Amount *' :
                 newCoupon.type === 'discount_percent' ? 'Discount Percentage *' : 'Discount Amount ($) *'}
              </Label>
              <Input
                type="number"
                placeholder={newCoupon.type === 'credits' ? 'e.g., 500' : newCoupon.type === 'discount_percent' ? 'e.g., 20' : 'e.g., 10'}
                value={newCoupon.value}
                onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                min="1"
                max={newCoupon.type === 'discount_percent' ? '100' : undefined}
              />
              {newCoupon.type === 'discount_percent' && (
                <p className="text-xs text-muted-foreground">Max 100%</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g., Summer promotion 2025"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Total Uses</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>
              <div className="space-y-2">
                <Label>Per User Limit</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newCoupon.perUserLimit}
                  onChange={(e) => setNewCoupon({ ...newCoupon, perUserLimit: e.target.value })}
                  min="1"
                />
              </div>
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label>Expires On</Label>
              <Input
                type="datetime-local"
                value={newCoupon.validUntil}
                onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
            </div>

            {/* Min Plan */}
            <div className="space-y-2">
              <Label>Minimum Plan Required</Label>
              <Select value={newCoupon.minPlan || 'none'} onValueChange={(v) => setNewCoupon({ ...newCoupon, minPlan: v === 'none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No minimum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No minimum (all users)</SelectItem>
                  {PLAN_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCoupon} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Coupon
            </DialogTitle>
            <DialogDescription>
              {editingCoupon?.code} — Modify settings for this coupon
            </DialogDescription>
          </DialogHeader>

          {editingCoupon && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <code className="font-bold text-lg">{editingCoupon.code}</code>
                    <p className="text-sm text-muted-foreground">{formatValue(editingCoupon)}</p>
                  </div>
                  <Badge variant="outline">{getTypeConfig(editingCoupon.type).label}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingCoupon.description || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editingCoupon.maxUses || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per User Limit</Label>
                  <Input
                    type="number"
                    value={editingCoupon.perUserLimit || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, perUserLimit: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expires On</Label>
                <Input
                  type="datetime-local"
                  value={editingCoupon.validUntil ? new Date(editingCoupon.validUntil).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, validUntil: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Plan</Label>
                <Select
                  value={editingCoupon.minPlan || 'none'}
                  onValueChange={(v) => setEditingCoupon({ ...editingCoupon, minPlan: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No minimum</SelectItem>
                    {PLAN_OPTIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable this coupon</p>
                </div>
                <Switch
                  checked={editingCoupon.isActive}
                  onCheckedChange={(v) => setEditingCoupon({ ...editingCoupon, isActive: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCoupon} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Redemptions Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Coupon Details
            </DialogTitle>
          </DialogHeader>

          {detailCoupon && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <code className="text-2xl font-bold tracking-wider">{detailCoupon.code}</code>
                  {getStatusBadge(detailCoupon)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{getTypeConfig(detailCoupon.type).label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-medium">{formatValue(detailCoupon)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uses</p>
                    <p className="font-medium">{detailCoupon.usedCount || 0} / {detailCoupon.maxUses || '∞'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Per User</p>
                    <p className="font-medium">{detailCoupon.perUserLimit || 1} max</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(detailCoupon.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium">{detailCoupon.validUntil ? new Date(detailCoupon.validUntil).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>
                {detailCoupon.description && (
                  <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{detailCoupon.description}</p>
                )}
              </div>

              {/* Redemption History */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Redemption History ({(detailCoupon.usedBy || []).length})
                </h4>
                {(detailCoupon.usedBy || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No redemptions yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(detailCoupon.usedBy || []).map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <span>{entry.email || entry.userId}</span>
                        <span className="text-muted-foreground">
                          {entry.redeemedAt ? new Date(entry.redeemedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
