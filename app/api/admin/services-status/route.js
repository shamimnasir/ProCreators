// Admin API Status - Check configuration of all external services
import { NextResponse } from 'next/server'
import { getServicesStatus } from '@/lib/services'

import { requireAdmin } from '@/lib/auth-middleware'
export async function GET() {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  const services = getServicesStatus()
  
  // Add webhook secrets count
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_2
  ].filter(s => s && s !== 'whsec_placeholder').length
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ...services,
      stripeWebhookSecrets: webhookSecrets
    },
    environment: process.env.NODE_ENV || 'development'
  })
}
