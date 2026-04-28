// Coupon Redemption API - User facing
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { addCredits } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request) {
  try {
    // Get user from session
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Verify session
    const session = await db.collection('sessions').findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    })
    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 })
    }

    const userId = session.userId
    const user = await db.collection('users').findOne({ _id: userId })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user is banned
    if (user.accountStatus === 'banned') {
      return NextResponse.json({ success: false, error: 'Account is banned' }, { status: 403 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()

    // Find the coupon
    const coupon = await db.collection('coupons').findOne({ code: cleanCode })

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 404 })
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({ success: false, error: 'This coupon is no longer active' }, { status: 400 })
    }

    // Check validity dates
    const now = new Date()
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return NextResponse.json({ success: false, error: 'This coupon is not yet valid' }, { status: 400 })
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return NextResponse.json({ success: false, error: 'This coupon has expired' }, { status: 400 })
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // Check per-user limit
    const userRedemptions = (coupon.usedBy || []).filter(u => u.userId === userId).length
    if (coupon.perUserLimit && userRedemptions >= coupon.perUserLimit) {
      return NextResponse.json({ success: false, error: 'You have already used this coupon' }, { status: 400 })
    }

    // Check minimum plan requirement
    if (coupon.minPlan) {
      const planRank = { free: 0, creator: 1, pro: 2, business: 3 }
      const userRank = planRank[user.plan || 'free'] || 0
      const minRank = planRank[coupon.minPlan] || 0
      if (userRank < minRank) {
        return NextResponse.json({
          success: false,
          error: `This coupon requires a ${coupon.minPlan} plan or higher`
        }, { status: 400 })
      }
    }

    // Check applicable plans
    if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
      if (!coupon.applicablePlans.includes(user.plan || 'free')) {
        return NextResponse.json({
          success: false,
          error: `This coupon is not available for your plan`
        }, { status: 400 })
      }
    }

    // Apply the coupon based on type
    let result = {}
    switch (coupon.type) {
      case 'credits': {
        // Add credits to user's account
        const creditResult = await addCredits(
          userId,
          coupon.value,
          `Coupon: ${coupon.code} - ${coupon.description || 'Promo credits'}`,
          'coupon_system'
        )
        result = {
          type: 'credits',
          creditsAdded: coupon.value,
          message: `${coupon.value.toLocaleString()} credits added to your account!`,
        }
        break
      }

      case 'discount_percent': {
        // Store discount for next subscription payment
        await db.collection('user_discounts').insertOne({
          _id: uuidv4(),
          userId,
          couponId: coupon._id,
          couponCode: coupon.code,
          type: 'percent',
          value: coupon.value,
          applied: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days to use
        })
        result = {
          type: 'discount',
          discount: `${coupon.value}%`,
          message: `${coupon.value}% discount will be applied to your next subscription payment!`,
        }
        break
      }

      case 'discount_fixed': {
        // Store discount for next subscription payment
        await db.collection('user_discounts').insertOne({
          _id: uuidv4(),
          userId,
          couponId: coupon._id,
          couponCode: coupon.code,
          type: 'fixed',
          value: coupon.value,
          applied: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        result = {
          type: 'discount',
          discount: `$${coupon.value}`,
          message: `$${coupon.value} off will be applied to your next subscription payment!`,
        }
        break
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown coupon type' }, { status: 400 })
    }

    // Record usage
    await db.collection('coupons').updateOne(
      { _id: coupon._id },
      {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            userId,
            email: user.email,
            redeemedAt: new Date(),
          }
        }
      }
    )

    // Record in coupon redemption log
    await db.collection('coupon_redemptions').insertOne({
      _id: uuidv4(),
      couponId: coupon._id,
      couponCode: coupon.code,
      userId,
      userEmail: user.email,
      type: coupon.type,
      value: coupon.value,
      redeemedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      ...result,
    })

  } catch (error) {
    console.error('Coupon redemption error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}
