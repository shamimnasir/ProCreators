// Stripe Webhook Handler - Process payment events
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { addCredits } from '@/lib/credits'

export async function POST(request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    
    const STRIPE_API_KEY = process.env.STRIPE_API_KEY
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
    
    const stripe = require('stripe')(STRIPE_API_KEY)
    
    let event
    
    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET && WEBHOOK_SECRET !== 'whsec_placeholder') {
      try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        )
      }
    } else {
      // In dev mode without webhook secret, parse body directly
      event = JSON.parse(body)
    }
    
    const { db } = await connectToDatabase()
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Check if already processed
        const transaction = await db.collection('payment_transactions').findOne({
          sessionId: session.id
        })
        
        if (transaction && transaction.creditsAdded) {
          console.log('Payment already processed:', session.id)
          return NextResponse.json({ received: true, status: 'already_processed' })
        }
        
        if (session.payment_status === 'paid') {
          const userId = session.metadata?.userId
          const credits = parseInt(session.metadata?.credits || '0')
          
          if (userId && credits > 0) {
            // Add credits
            await addCredits(
              userId,
              credits,
              `Credit purchase via webhook`,
              'stripe_webhook'
            )
            
            // Update transaction
            await db.collection('payment_transactions').updateOne(
              { sessionId: session.id },
              {
                $set: {
                  status: 'completed',
                  paymentStatus: 'paid',
                  creditsAdded: true,
                  completedAt: new Date(),
                  updatedAt: new Date()
                }
              },
              { upsert: true }
            )
            
            console.log(`Added ${credits} credits to user ${userId}`)
          }
        }
        break
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object
        await db.collection('payment_transactions').updateOne(
          { sessionId: session.id },
          {
            $set: {
              status: 'expired',
              paymentStatus: 'expired',
              updatedAt: new Date()
            }
          }
        )
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log('Payment failed:', paymentIntent.id)
        break
      }
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parser for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}
