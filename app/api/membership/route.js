// Membership API - Get user membership status and credits breakdown
import { NextResponse } from 'next/server'
import { MEMBERSHIP_PLANS } from '@/lib/membership'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    let userId = null
    
    // SECURITY: Primary method - get userId from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      if (token) {
        const { db } = await connectToDatabase()
        const session = await db.collection('sessions').findOne({
          token,
          expiresAt: { $gt: new Date() }
        })
        if (session) {
          userId = session.userId
        }
      }
    }
    
    // Fallback to query param for backward compatibility (will be deprecated)
    if (!userId) {
      const { searchParams } = new URL(request.url)
      userId = searchParams.get('userId')
    }
    
    if (!userId) {
      return NextResponse.json({
        success: true,
        plan: 'free',
        membershipCredits: 0,
        purchasedCredits: 0,
        totalCredits: 0,
        subscription: null
      })
    }
    
    const { db } = await connectToDatabase()
    const user = await db.collection('users').findOne({ _id: userId })
    
    if (!user) {
      return NextResponse.json({
        success: true,
        plan: 'free',
        membershipCredits: 0,
        purchasedCredits: 0,
        totalCredits: 0,
        subscription: null
      })
    }
    
    const plan = MEMBERSHIP_PLANS[user.plan] || MEMBERSHIP_PLANS.free
    
    return NextResponse.json({
      success: true,
      plan: user.plan || 'free',
      planDetails: {
        name: plan.name,
        price: plan.price,
        monthlyCredits: plan.monthlyCredits,
        features: plan.features
      },
      membershipCredits: user.membershipCredits || 0,
      purchasedCredits: user.purchasedCredits || 0,
      totalCredits: (user.membershipCredits || 0) + (user.purchasedCredits || 0),
      subscription: {
        status: user.subscriptionStatus || 'none',
        renewsAt: user.subscriptionRenewsAt || null,
        billingCycle: user.billingCycle || 'monthly',
        canceledAt: user.canceledAt || null
      },
      creditDiscount: plan.creditDiscount || 0
    })
    
  } catch (error) {
    console.error('Membership API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
