'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  RefreshCw, Zap, BarChart3, Target, CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CostAnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [analytics, setAnalytics] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
    fetchRecommendations()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/costs?period=${period}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/admin/costs?action=recommendations')
      const data = await res.json()
      if (data.success) {
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }

  const handleAutoAdjust = async (dryRun = true) => {
    setAdjusting(true)
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-adjust', dryRun })
      })
      const data = await res.json()
      
      toast({
        title: dryRun ? 'Dry Run Complete' : 'Prices Adjusted',
        description: data.message
      })
      
      if (!dryRun) {
        fetchAnalytics()
        fetchRecommendations()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setAdjusting(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const getMarginColor = (margin) => {
    if (margin >= 70) return 'text-green-500'
    if (margin >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMarginBadge = (margin) => {
    if (margin >= 70) return <Badge className="bg-green-100 text-green-700">Healthy</Badge>
    if (margin >= 50) return <Badge className="bg-yellow-100 text-yellow-700">Moderate</Badge>
    return <Badge className="bg-red-100 text-red-700">Low</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-muted-foreground">Monitor API costs and profit margins</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchAnalytics()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics?.overall?.totalRevenueUSD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {analytics?.overall?.totalGenerations?.toLocaleString() || 0} generations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total API Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(analytics?.overall?.totalCostUSD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {formatCurrency((analytics?.overall?.totalCostUSD || 0) / (analytics?.overall?.totalGenerations || 1))}/gen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.profitUSD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After API costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMarginColor(analytics?.overall?.avgMarginPercent)}`}>
              {(analytics?.overall?.avgMarginPercent || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: 70%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {analytics?.alerts?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Margin Alerts ({analytics.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.alerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium">{alert.toolId}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">{alert.severity}</Badge>
                  <p className="text-sm mt-1">
                    Recommend: <span className="font-medium">{alert.recommendedCredits}</span> credits
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pricing Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pricing Recommendations
              </CardTitle>
              <CardDescription>
                Based on actual API costs over the last 30 days
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleAutoAdjust(true)}
                disabled={adjusting}
              >
                {adjusting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Preview Changes
              </Button>
              <Button 
                onClick={() => handleAutoAdjust(false)}
                disabled={adjusting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Adjustments
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No data yet. Cost tracking will populate as users generate content.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Tool</th>
                    <th className="text-right py-3 px-2 font-medium">Generations</th>
                    <th className="text-right py-3 px-2 font-medium">Avg Cost</th>
                    <th className="text-right py-3 px-2 font-medium">Current Credits</th>
                    <th className="text-right py-3 px-2 font-medium">Recommended</th>
                    <th className="text-right py-3 px-2 font-medium">Margin</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{rec.toolId}</td>
                      <td className="py-3 px-2 text-right">{rec.totalGenerations}</td>
                      <td className="py-3 px-2 text-right">${rec.avgCostUSD}</td>
                      <td className="py-3 px-2 text-right">{rec.currentCredits}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={rec.needsAdjustment ? 'font-bold text-orange-600' : ''}>
                          {rec.recommendedCredits}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-right ${getMarginColor(parseFloat(rec.currentMargin))}`}>
                        {rec.currentMargin}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {rec.needsAdjustment ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Needs Adjustment
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Optimal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost by Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Tool</CardTitle>
          <CardDescription>Top tools by API cost</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.byTool?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No generation data available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.byTool?.slice(0, 10).map((tool, i) => {
                const margin = tool.avgMarginPercent || 0
                const revenue = tool.totalRevenueUSD || 0
                const cost = tool.totalCostUSD || 0
                const profit = revenue - cost
                
                return (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        margin >= 70 ? 'bg-green-100' : margin >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {margin >= 70 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : margin >= 50 ? (
                          <BarChart3 className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tool._id}</p>
                        <p className="text-sm text-muted-foreground">
                          {tool.totalGenerations} generations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-medium text-red-500">{formatCurrency(cost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="font-medium">{formatCurrency(profit)}</p>
                      </div>
                      <div className="text-right w-20">
                        {getMarginBadge(margin)}
                        <p className={`text-sm font-medium ${getMarginColor(margin)}`}>
                          {margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">How Dynamic Pricing Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>1. Cost Tracking:</strong> Every API call logs actual costs (tokens, images, video seconds).</p>
          <p><strong>2. Margin Calculation:</strong> We compare revenue (credits × $0.01) vs actual API cost.</p>
          <p><strong>3. Auto-Adjustment:</strong> If margin drops below 50%, system recommends credit increases.</p>
          <p><strong>4. Target Margin:</strong> 70% profit margin ensures sustainable business even if API costs rise.</p>
          <p><strong>Formula:</strong> Recommended Credits = API Cost ÷ ($0.01 × 30%) = API Cost × 333</p>
        </CardContent>
      </Card>
    </div>
  )
}
