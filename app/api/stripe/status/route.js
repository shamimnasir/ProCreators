// Stripe Payment Status API - Check and process payment status
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { addCredits } from '@/lib/credits'
import { getStripe, isStripeConfigured } from '@/lib/services'

export async function GET(request) {
  try {
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
    
    const stripe = getStripe()
    const { db } = await connectToDatabase()
    
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    // Get our transaction record
    const transaction = await db.collection('payment_transactions').findOne({
      sessionId
    })
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // If already processed, return current status
    if (transaction.paymentStatus === 'paid' && transaction.creditsAdded) {
      return NextResponse.json({
        success: true,
        status: session.status,
        paymentStatus: session.payment_status,
        credits: transaction.credits,
        alreadyProcessed: true
      })
    }
    
    // Process successful payment
    if (session.payment_status === 'paid' && !transaction.creditsAdded) {
      const userId = session.metadata.userId
      const credits = parseInt(session.metadata.credits)
      
      // Add credits to user (atomic operation)
      const creditResult = await addCredits(
        userId,
        credits,
        `Credit purchase: ${transaction.packageName}`,
        'stripe'
      )
      
      // Update transaction record
      await db.collection('payment_transactions').updateOne(
        { sessionId },
        {
          $set: {
            status: 'completed',
            paymentStatus: 'paid',
            creditsAdded: true,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        status: session.status,
        paymentStatus: session.payment_status,
        credits,
        newBalance: creditResult.success ? 'updated' : 'error'
      })
    }
    
    // Update status for non-paid sessions
    await db.collection('payment_transactions').updateOne(
      { sessionId },
      {
        $set: {
          status: session.status,
          paymentStatus: session.payment_status,
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({
      success: true,
      status: session.status,
      paymentStatus: session.payment_status
    })
    
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
