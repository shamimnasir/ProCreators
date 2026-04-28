// Admin Coupon Management API
// SECURITY: All routes require admin authentication
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from '@/lib/auth-middleware'

// GET - List all coupons
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, expired, all

    const query = {}
    if (status === 'active') {
      query.isActive = true
      query.$or = [
        { validUntil: { $gt: new Date() } },
        { validUntil: null }
      ]
    } else if (status === 'expired') {
      query.$or = [
        { isActive: false },
        { validUntil: { $lte: new Date() } }
      ]
    }

    const coupons = await db.collection('coupons')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Get stats
    const totalActive = await db.collection('coupons').countDocuments({
      isActive: true,
      $or: [{ validUntil: { $gt: new Date() } }, { validUntil: null }]
    })
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

    return NextResponse.json({
      success: true,
      coupons,
      stats: { total: coupons.length, totalActive, totalRedemptions }
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create a new coupon
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      code,
      type, // 'credits', 'discount_percent', 'discount_fixed'
      value,
      description,
      maxUses,
      perUserLimit,
      minPlan,
      validFrom,
      validUntil,
      applicablePlans, // array of plan names the coupon can be used with
    } = body

    // Validation
    if (!code || typeof code !== 'string' || code.length < 3 || code.length > 30) {
      return NextResponse.json({ success: false, error: 'Code must be 3-30 characters' }, { status: 400 })
    }

    const validTypes = ['credits', 'discount_percent', 'discount_fixed']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid coupon type' }, { status: 400 })
    }

    if (!value || value <= 0) {
      return NextResponse.json({ success: false, error: 'Value must be greater than 0' }, { status: 400 })
    }

    if (type === 'discount_percent' && value > 100) {
      return NextResponse.json({ success: false, error: 'Percentage cannot exceed 100%' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check for duplicate code (case-insensitive)
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    const existing = await db.collection('coupons').findOne({
      code: cleanCode
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 409 })
    }

    const coupon = {
      _id: uuidv4(),
      code: cleanCode,
      type,
      value: Number(value),
      description: description || '',
      maxUses: maxUses ? Number(maxUses) : null, // null = unlimited
      usedCount: 0,
      usedBy: [],
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      minPlan: minPlan || null,
      applicablePlans: applicablePlans || [], // empty = all plans
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null, // null = never expires
      isActive: true,
      createdBy: auth.userId,
      createdAt: new Date(),
    }

    await db.collection('coupons').insertOne(coupon)

    // Audit log
    await db.collection('admin_audit_log').insertOne({
      action: 'create_coupon',
      couponId: coupon._id,
      couponCode: coupon.code,
      adminId: auth.userId,
      details: { type, value, maxUses },
      timestamp: new Date()
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update a coupon (toggle active, update fields)
export async function PUT(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { couponId, ...updates } = body

    if (!couponId) {
      return NextResponse.json({ success: false, error: 'couponId required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Only allow safe field updates
    const safeUpdates = {}
    const allowedFields = ['isActive', 'description', 'maxUses', 'perUserLimit', 'validUntil', 'minPlan', 'applicablePlans']
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'validUntil' && updates[field]) {
          safeUpdates[field] = new Date(updates[field])
        } else {
          safeUpdates[field] = updates[field]
        }
      }
    }

    safeUpdates.updatedAt = new Date()
    safeUpdates.updatedBy = auth.userId

    const result = await db.collection('coupons').updateOne(
      { _id: couponId },
      { $set: safeUpdates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })
    }

    // Audit log
    await db.collection('admin_audit_log').insertOne({
      action: 'update_coupon',
      couponId,
      adminId: auth.userId,
      changes: safeUpdates,
      timestamp: new Date()
    })

    return NextResponse.json({ success: true, message: 'Coupon updated' })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a coupon
export async function DELETE(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const couponId = searchParams.get('couponId')

    if (!couponId) {
      return NextResponse.json({ success: false, error: 'couponId required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const coupon = await db.collection('coupons').findOne({ _id: couponId })
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })
    }

    await db.collection('coupons').deleteOne({ _id: couponId })

    // Audit log
    await db.collection('admin_audit_log').insertOne({
      action: 'delete_coupon',
      couponId,
      couponCode: coupon.code,
      adminId: auth.userId,
      timestamp: new Date()
    })

    return NextResponse.json({ success: true, message: 'Coupon deleted' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
