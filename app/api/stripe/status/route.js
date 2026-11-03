// Stripe Payment Status API - report the status of the caller's own checkout session.
//
// SECURITY: this route used to add credits itself (no auth, check-then-set on creditsAdded), so
// parallel calls could credit one payment many times and race the webhook. Credits are now granted
// only by the signed, idempotent webhook; this route just reports progress to the billing page.
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getStripe, isStripeConfigured } from '@/lib/services'
import { getAuthenticatedUserId } from '@/lib/auth-middleware'

export async function GET(request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'session_id required' },
        { status: 400 }
      )
    }
    
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }
    
    const { db } = await connectToDatabase()
    const transaction = await db.collection('payment_transactions').findOne({ sessionId, userId })
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    // Report "paid" only once the webhook has actually added the credits; until then the billing
    // page keeps polling.
    const paymentStatus = session.payment_status === 'paid' && !transaction.creditsAdded
      ? 'processing'
      : session.payment_status

    return NextResponse.json({
      success: true,
      status: session.status,
      paymentStatus,
      credits: transaction.credits,
      alreadyProcessed: !!transaction.creditsAdded
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { success: false, error: 'Could not check payment status' },
      { status: 500 }
    )
  }
}
