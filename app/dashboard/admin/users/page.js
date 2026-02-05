'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Search, RefreshCw, Loader2, Ban, ShieldCheck, 
  CreditCard, Mail, Calendar, Activity, AlertTriangle,
  ChevronLeft, ChevronRight, Plus, Minus, UserCog, Trash2, Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)
  const [actionParams, setActionParams] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      if (search) params.append('search', search)
      if (planFilter) params.append('plan', planFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = () => {
    fetchUsers(1)
  }

  const openActionDialog = (user, action) => {
    setSelectedUser(user)
    setCurrentAction(action)
    setActionParams({})
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!selectedUser || !currentAction) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentAction,
          userId: selectedUser._id,
          ...actionParams
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({ title: 'Success', description: data.message || 'Action completed' })
        setActionDialogOpen(false)
        fetchUsers(pagination.page)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspended</Badge>
      default:
        return <Badge className="bg-green-500">Active</Badge>
    }
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <Badge className="bg-red-600">Admin</Badge>
    }
    return null
  }

  const getPlanBadge = (plan) => {
    const colors = {
      free: 'bg-gray-500',
      creator: 'bg-blue-500',
      pro: 'bg-purple-500',
      business: 'bg-orange-500'
    }
    return <Badge className={colors[plan] || 'bg-gray-500'}>{plan || 'free'}</Badge>
  }

  // Stats summary
  const totalUsers = stats.reduce((acc, s) => acc + s.count, 0)
  const totalCredits = stats.reduce((acc, s) => acc + (s.totalCredits || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, credits, and account status
          </p>
        </div>
        <Button onClick={() => fetchUsers(pagination.page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        {stats.map(stat => (
          <Card key={stat._id || 'free'}>
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">{stat._id || 'Free'} Users</CardDescription>
              <CardTitle className="text-2xl">{stat.count}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {stat.totalCredits?.toLocaleString() || 0} credits held
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-40">
              <Label>Plan</Label>
              <Select value={planFilter || 'all'} onValueChange={(v) => setPlanFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Status</Label>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {(user.email || user.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.email || user.name || 'Unknown'}</p>
                        {user.suspiciousActivity && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" title="Suspicious Activity" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(user.accountStatus)}
                    {getRoleBadge(user.role)}
                    {getPlanBadge(user.plan)}
                    
                    <div className="text-right">
                      <p className="font-bold">{user.credits?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">{user.totalCreditsUsed?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">used</p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openActionDialog(user, 'add_credits')}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openActionDialog(user, 'remove_credits')}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <UserCog className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage User</DialogTitle>
                            <DialogDescription>{user.email}</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-2">
                            <Button variant="outline" className="justify-start" onClick={() => openActionDialog(user, 'change_plan')}>
                              <CreditCard className="h-4 w-4 mr-2" /> Change Plan
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => openActionDialog(user, 'reset_credits')}>
                              <RefreshCw className="h-4 w-4 mr-2" /> Reset Credits
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => openActionDialog(user, 'verify_email')}>
                              <Mail className="h-4 w-4 mr-2" /> Verify Email
                            </Button>
                            {user.suspiciousActivity && (
                              <Button variant="outline" className="justify-start" onClick={() => openActionDialog(user, 'clear_suspicious')}>
                                <ShieldCheck className="h-4 w-4 mr-2" /> Clear Suspicious Flag
                              </Button>
                            )}
                            <hr className="my-2" />
                            {user.accountStatus === 'active' ? (
                              <>
                                <Button variant="outline" className="justify-start text-yellow-600" onClick={() => openActionDialog(user, 'suspend')}>
                                  <AlertTriangle className="h-4 w-4 mr-2" /> Suspend User
                                </Button>
                                <Button variant="outline" className="justify-start text-red-600" onClick={() => openActionDialog(user, 'ban')}>
                                  <Ban className="h-4 w-4 mr-2" /> Ban User
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" className="justify-start text-green-600" onClick={() => openActionDialog(user, 'activate')}>
                                <ShieldCheck className="h-4 w-4 mr-2" /> Activate User
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'add_credits' && 'Add Credits'}
              {currentAction === 'remove_credits' && 'Remove Credits'}
              {currentAction === 'change_plan' && 'Change Plan'}
              {currentAction === 'reset_credits' && 'Reset Credits'}
              {currentAction === 'suspend' && 'Suspend User'}
              {currentAction === 'ban' && 'Ban User'}
              {currentAction === 'activate' && 'Activate User'}
              {currentAction === 'verify_email' && 'Verify Email'}
              {currentAction === 'clear_suspicious' && 'Clear Suspicious Flag'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(currentAction === 'add_credits' || currentAction === 'remove_credits') && (
              <>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter credit amount"
                    value={actionParams.amount || ''}
                    onChange={(e) => setActionParams({ ...actionParams, amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    placeholder="Reason for adjustment"
                    value={actionParams.reason || ''}
                    onChange={(e) => setActionParams({ ...actionParams, reason: e.target.value })}
                  />
                </div>
              </>
            )}
            
            {currentAction === 'change_plan' && (
              <div className="space-y-2">
                <Label>New Plan</Label>
                <Select value={actionParams.newPlan || ''} onValueChange={(v) => setActionParams({ ...actionParams, newPlan: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="creator">Creator ($19/mo)</SelectItem>
                    <SelectItem value="pro">Pro ($49/mo)</SelectItem>
                    <SelectItem value="business">Business ($149/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(currentAction === 'suspend' || currentAction === 'ban') && (
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Reason for action"
                  value={actionParams.reason || ''}
                  onChange={(e) => setActionParams({ ...actionParams, reason: e.target.value })}
                />
              </div>
            )}
            
            {currentAction === 'suspend' && (
              <div className="space-y-2">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  placeholder="24"
                  value={actionParams.duration || ''}
                  onChange={(e) => setActionParams({ ...actionParams, duration: parseInt(e.target.value) || 24 })}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeAction} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
