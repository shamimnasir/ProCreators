// Stripe Webhook Handler - Process payment and subscription events
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { addCredits } from '@/lib/credits'
import { refillMembershipCredits, changeSubscription, MEMBERSHIP_PLANS, addPurchasedCredits } from '@/lib/membership'
import { v4 as uuidv4 } from 'uuid'

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
    
    // Log all webhook events
    await db.collection('webhook_logs').insertOne({
      _id: uuidv4(),
      type: event.type,
      eventId: event.id,
      createdAt: new Date()
    })
    
    switch (event.type) {
      // ============= CHECKOUT COMPLETED =============
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
          const planId = session.metadata?.planId
          const billingCycle = session.metadata?.billingCycle || 'monthly'
          
          // Check if this is a subscription or one-time purchase
          if (session.mode === 'subscription' && planId) {
            // SUBSCRIPTION PURCHASE
            const plan = MEMBERSHIP_PLANS[planId]
            if (plan) {
              // Activate subscription
              await changeSubscription(userId, planId, billingCycle)
              
              // Store Stripe IDs
              await db.collection('users').updateOne(
                { _id: userId },
                {
                  $set: {
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    subscriptionStatus: 'active'
                  }
                }
              )
              
              // Mark transaction complete
              await db.collection('subscription_transactions').updateOne(
                { sessionId: session.id },
                {
                  $set: {
                    status: 'completed',
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    completedAt: new Date()
                  }
                }
              )
              
              console.log(`Subscription activated: ${userId} -> ${planId}`)
            }
            
          } else {
            // ONE-TIME CREDIT PURCHASE
            const credits = parseInt(session.metadata?.credits || '0')
            
            if (userId && credits > 0) {
              // Add as PURCHASED credits (these rollover)
              await addPurchasedCredits(
                userId,
                credits,
                `Credit pack purchase: ${credits} credits`,
                session.payment_intent
              )
              
              // Also update legacy credits field for backward compatibility
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
                    creditType: 'purchased', // Mark as purchased (rollover)
                    completedAt: new Date(),
                    updatedAt: new Date()
                  }
                },
                { upsert: true }
              )
              
              console.log(`Added ${credits} purchased credits to user ${userId}`)
            }
          }
        }
        break
      }
      
      // ============= SUBSCRIPTION RENEWAL (Invoice Paid) =============
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        
        // Only process subscription renewals, not initial payments
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscriptionId = invoice.subscription
          
          // Find user by subscription ID
          const user = await db.collection('users').findOne({ 
            stripeSubscriptionId: subscriptionId 
          })
          
          if (user) {
            // Refill membership credits (resets, no rollover)
            await refillMembershipCredits(user._id)
            
            // Log renewal
            await db.collection('subscription_transactions').insertOne({
              _id: uuidv4(),
              userId: user._id,
              type: 'renewal',
              planId: user.plan,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              stripeInvoiceId: invoice.id,
              status: 'completed',
              createdAt: new Date()
            })
            
            console.log(`Subscription renewed for user ${user._id}`)
          }
        }
        break
      }
      
      // ============= PAYMENT FAILED =============
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
        
        if (subscriptionId) {
          const user = await db.collection('users').findOne({ 
            stripeSubscriptionId: subscriptionId 
          })
          
          if (user) {
            await db.collection('users').updateOne(
              { _id: user._id },
              {
                $set: {
                  subscriptionStatus: 'past_due',
                  paymentFailedAt: new Date()
                },
                $push: {
                  notifications: {
                    type: 'payment_failed',
                    message: 'Your subscription payment failed. Please update your payment method.',
                    createdAt: new Date()
                  }
                }
              }
            )
            console.log(`Payment failed for user ${user._id}`)
          }
        }
        break
      }
      
      // ============= SUBSCRIPTION CANCELED =============
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        const user = await db.collection('users').findOne({ 
          stripeSubscriptionId: subscription.id 
        })
        
        if (user) {
          // Downgrade to free, but KEEP purchased credits
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                plan: 'free',
                membershipCredits: 0, // Remove subscription credits
                subscriptionStatus: 'canceled',
                stripeSubscriptionId: null,
                subscriptionRenewsAt: null,
                canceledAt: new Date()
              },
              $push: {
                notifications: {
                  type: 'subscription_canceled',
                  message: 'Your subscription has been canceled. Your purchased credits are still available.',
                  createdAt: new Date()
                }
              }
            }
          )
          console.log(`Subscription canceled for user ${user._id}`)
        }
        break
      }
      
      // ============= SUBSCRIPTION UPDATED =============
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        const user = await db.collection('users').findOne({ 
          stripeSubscriptionId: subscription.id 
        })
        
        if (user) {
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                subscriptionStatus: subscription.status,
                subscriptionRenewsAt: new Date(subscription.current_period_end * 1000)
              }
            }
          )
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
