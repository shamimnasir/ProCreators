// Subscription Checkout API - Creates Stripe subscription checkout sessions
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { MEMBERSHIP_PLANS } from '@/lib/membership'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    const body = await request.json()
    const { planId, billingCycle = 'monthly', originUrl } = body
    
    // Get user from auth header
    let userId = 'demo-user-001'
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        userId = decoded.userId
      } catch (e) {
        // Use demo user if token invalid
      }
    }
    
    // Validate plan
    const plan = MEMBERSHIP_PLANS[planId]
    if (!plan || planId === 'free') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      )
    }
    
    if (!originUrl) {
      return NextResponse.json(
        { success: false, error: 'originUrl required' },
        { status: 400 }
      )
    }
    
    const STRIPE_API_KEY = process.env.STRIPE_API_KEY
    if (!STRIPE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe not configured. Add STRIPE_API_KEY to .env' },
        { status: 500 }
      )
    }
    
    // Calculate price based on billing cycle
    const price = billingCycle === 'yearly' ? plan.priceYearly : plan.price
    const interval = billingCycle === 'yearly' ? 'year' : 'month'
    
    // Create URLs
    const successUrl = `${originUrl}/dashboard/billing?subscription=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${originUrl}/pricing?canceled=true`
    
    // Create Stripe checkout session for subscription
    const stripe = require('stripe')(STRIPE_API_KEY)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan.name} Plan`,
            description: `${plan.monthlyCredits} credits/month - ProCreators ${plan.name} membership`,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
          recurring: {
            interval: interval,
            interval_count: 1
          }
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        billingCycle,
        monthlyCredits: plan.monthlyCredits.toString(),
        source: 'procreators_subscription'
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          monthlyCredits: plan.monthlyCredits.toString()
        }
      }
    })
    
    // Store pending subscription in database
    const { db } = await connectToDatabase()
    await db.collection('subscription_transactions').insertOne({
      _id: uuidv4(),
      sessionId: session.id,
      userId,
      planId,
      planName: plan.name,
      monthlyCredits: plan.monthlyCredits,
      amount: price,
      billingCycle,
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id
    })
    
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET - Return available plans
export async function GET() {
  const plans = Object.values(MEMBERSHIP_PLANS).map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    priceYearly: plan.priceYearly,
    monthlyCredits: plan.monthlyCredits,
    features: plan.features,
    limits: plan.limits
  }))
  
  return NextResponse.json({
    success: true,
    plans
  })
}
