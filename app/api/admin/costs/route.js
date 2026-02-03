// Admin Cost Analytics API
import { NextResponse } from 'next/server'
import { getCostAnalytics, getPricingRecommendations, autoAdjustPricing } from '@/lib/cost-tracking'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const action = searchParams.get('action')
    
    if (action === 'recommendations') {
      const recommendations = await getPricingRecommendations()
      return NextResponse.json({ success: true, recommendations })
    }
    
    const analytics = await getCostAnalytics(period)
    return NextResponse.json({ success: true, ...analytics })
    
  } catch (error) {
    console.error('Cost analytics error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
