// Subscription Checkout API - Secured with Zod validation and rate limiting
// Creates Stripe subscription checkout sessions
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { MEMBERSHIP_PLANS } from '@/lib/membership'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '@/lib/auth-middleware'
import { validateRequest, subscriptionCheckoutSchema } from '@/lib/validation'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security-logger'
import { getStripe, isStripeConfigured } from '@/lib/services'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for subscription changes
    const rateLimitCheck = await enforceRateLimit(request, 'subscription')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }
    
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const body = await request.json()
    
    // SECURITY: Zod validation
    const validation = validateRequest(subscriptionCheckoutSchema, {
      planId: body.planId,
      billingCycle: body.billingCycle,
      originUrl: body.originUrl
    })
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }
    
    const { planId, billingCycle, originUrl } = validation.data
    const userId = auth.userId
    
    // Get plan from server-side config (never trust client)
    const plan = MEMBERSHIP_PLANS[planId]
    if (!plan || planId === 'free') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      )
    }
    
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }
    
    // Get the correct Stripe Price ID from server config
    const priceId = billingCycle === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId
    
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json(
        { success: false, error: 'Stripe price not configured for this plan' },
        { status: 500 }
      )
    }
    
    // Create URLs with validated origin
    const successUrl = `${originUrl}/dashboard/billing?subscription=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${originUrl}/pricing?canceled=true`
    
    // Create Stripe checkout session for subscription
    const stripe = getStripe()
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
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
    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.price
    const transactionId = uuidv4()
    
    await db.collection('subscription_transactions').insertOne({
      _id: transactionId,
      sessionId: session.id,
      userId,
      planId,
      planName: plan.name,
      monthlyCredits: plan.monthlyCredits,
      amount,
      billingCycle,
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Log the subscription initiation for audit
    await logSecurityEvent(SECURITY_EVENTS.SENSITIVE_DATA_ACCESS, {
      action: 'subscription_checkout_initiated',
      userId,
      planId,
      billingCycle,
      amount,
      transactionId,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Subscription checkout failed' },
      { status: 500 }
    )
  }
}

// GET - Return available plans (public, no auth required)
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
