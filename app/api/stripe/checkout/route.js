// Stripe Checkout API - Creates checkout sessions for credit purchases
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { MEMBERSHIP_PLANS } from '@/lib/membership'

// Credit packages - NEVER accept amounts from frontend
const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 9.99,
    popular: false,
    description: 'Perfect for trying out'
  },
  creator: {
    id: 'creator',
    name: 'Creator Pack',
    credits: 500,
    price: 39.99,
    popular: true,
    description: 'Best value for creators'
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1500,
    price: 99.99,
    popular: false,
    description: 'For power users'
  },
  business: {
    id: 'business',
    name: 'Business Pack',
    credits: 5000,
    price: 299.99,
    popular: false,
    description: 'For teams and agencies'
  }
}

// Helper function to get subscriber discount
function getSubscriberDiscount(planId) {
  const plan = MEMBERSHIP_PLANS[planId]
  return plan?.creditDiscount || 0
}

// GET - Return available packages with optional subscriber discount
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let discount = 0
    let userPlan = 'free'
    
    // If userId provided, check their subscription for discounts
    if (userId) {
      const { db } = await connectToDatabase()
      const user = await db.collection('users').findOne({ _id: userId })
      if (user && user.plan && user.plan !== 'free') {
        userPlan = user.plan
        discount = getSubscriberDiscount(user.plan)
      }
    }
    
    // Return packages with discounted prices if applicable
    const packagesWithDiscount = Object.values(CREDIT_PACKAGES).map(pack => ({
      ...pack,
      originalPrice: pack.price,
      price: discount > 0 ? Math.round((pack.price * (1 - discount)) * 100) / 100 : pack.price,
      discount: discount > 0 ? Math.round(discount * 100) : 0,
      discountLabel: discount > 0 ? `${Math.round(discount * 100)}% ${userPlan} discount` : null
    }))
    
    return NextResponse.json({
      success: true,
      packages: packagesWithDiscount,
      userPlan,
      discount: Math.round(discount * 100)
    })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({
      success: true,
      packages: Object.values(CREDIT_PACKAGES)
    })
  }
}

// POST - Create checkout session
export async function POST(request) {
  try {
    const body = await request.json()
    const { packageId, userId, originUrl } = body
    
    // Validate package
    const pack = CREDIT_PACKAGES[packageId]
    if (!pack) {
      return NextResponse.json(
        { success: false, error: 'Invalid package' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
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
        { success: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }
    
    // Create URLs
    const successUrl = `${originUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = `${originUrl}/dashboard/billing?canceled=true`
    
    // Create Stripe checkout session using native API
    const stripe = require('stripe')(STRIPE_API_KEY)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: pack.name,
            description: `${pack.credits} credits for ProCreators`,
          },
          unit_amount: Math.round(pack.price * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        packageId,
        credits: pack.credits.toString(),
        source: 'procreators_web'
      }
    })
    
    // Store pending transaction in database
    const { db } = await connectToDatabase()
    await db.collection('payment_transactions').insertOne({
      _id: uuidv4(),
      sessionId: session.id,
      userId,
      packageId,
      packageName: pack.name,
      credits: pack.credits,
      amount: pack.price,
      currency: 'usd',
      status: 'pending',
      paymentStatus: 'initiated',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id
    })
    
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
