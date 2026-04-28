// Admin Cost Analytics API
// SECURITY: All routes require admin authentication
import { NextResponse } from 'next/server'
import { getCostAnalytics, getPricingRecommendations, autoAdjustPricing } from '@/lib/cost-tracking'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request) {
  // SECURITY: Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const action = searchParams.get('action')
    
    // SECURITY: Validate period format
    if (!/^\d{1,3}[dhm]$/.test(period)) {
      return NextResponse.json({ success: false, error: 'Invalid period format' }, { status: 400 })
    }
    
    if (action === 'recommendations') {
      const recommendations = await getPricingRecommendations()
      return NextResponse.json({ success: true, recommendations })
    }
    
    const analytics = await getCostAnalytics(period)
    return NextResponse.json({ success: true, ...analytics })
    
  } catch (error) {
    console.error('Cost analytics error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

export async function POST(request) {
  // SECURITY: Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const body = await request.json()
    const { action, dryRun = true } = body
    
    if (action === 'auto-adjust') {
      const result = await autoAdjustPricing(dryRun)
      return NextResponse.json({ success: true, ...result })
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    
  } catch (error) {
    console.error('Cost adjustment error:', error)
    return NextResponse.json({ success: false, error: 'Failed to adjust pricing' }, { status: 500 })
  }
}
