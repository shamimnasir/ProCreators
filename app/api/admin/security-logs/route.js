// Security Logs API - Admin only
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { getSecurityLogs, getSecurityStats } from '@/lib/security-logger'

export async function GET(request) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (!auth.authenticated) {
    return auth.response
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'logs'
    
    if (action === 'stats') {
      const hours = parseInt(searchParams.get('hours') || '24')
      const stats = await getSecurityStats(hours)
      return NextResponse.json({ success: true, stats })
    }
    
    // Get logs
    const options = {
      limit: parseInt(searchParams.get('limit') || '100'),
      severity: searchParams.get('severity'),
      event: searchParams.get('event'),
      since: searchParams.get('since'),
      userId: searchParams.get('userId')
    }
    
    const logs = await getSecurityLogs(options)
    
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch security logs'
    }, { status: 500 })
  }
}
