// Admin User Management API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { addCredits } from '@/lib/credits'
import { v4 as uuidv4 } from 'uuid'

// GET - List users or get specific user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')
    
    const { db } = await connectToDatabase()
    
    if (userId || email) {
      // Get specific user
      const query = userId ? { _id: userId } : { email }
      const user = await db.collection('users').findOne(query)
      
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }
      
      // Get user's generation stats
      const totalGenerations = await db.collection('credit_transactions')
        .countDocuments({ userId: user._id, type: { $ne: 'credit_add' } })
      
      const failedGenerations = await db.collection('credit_transactions')
        .countDocuments({ userId: user._id, status: 'refunded' })
      
      return NextResponse.json({
        success: true,
        user: {
          ...user,
          password: undefined, // Don't expose password
          totalGenerations,
          failedGenerations
        }
      })
    }
    
    // List users with filters
    const query = {}
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (plan) {
      query.plan = plan
    }
    
    if (status) {
      query.accountStatus = status
    }
    
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      db.collection('users')
        .find(query)
        .project({ password: 0, passwordHash: 0 }) // Exclude passwords
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(query)
    ])
    
    // Add computed totalCredits to each user (membershipCredits + purchasedCredits)
    const usersWithCredits = users.map(user => ({
      ...user,
      // Calculate total credits from both sources
      totalCredits: (user.membershipCredits || 0) + (user.purchasedCredits || 0),
      // Keep individual breakdown for display
      membershipCredits: user.membershipCredits || 0,
      purchasedCredits: user.purchasedCredits || 0
    }))
    
    // Get stats - use new credit fields
    const stats = await db.collection('users').aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalCredits: { 
            $sum: { 
              $add: [
                { $ifNull: ['$membershipCredits', 0] }, 
                { $ifNull: ['$purchasedCredits', 0] }
              ] 
            } 
          },
          totalUsed: { $sum: '$totalCreditsUsed' }
        }
      }
    ]).toArray()
    
    return NextResponse.json({
      success: true,
      users: usersWithCredits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })
    
  } catch (error) {
    console.error('Error listing users:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - User management actions
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userId, adminId = 'admin', ...params } = body
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    
    // Log all admin actions
    await db.collection('admin_audit_log').insertOne({
      action,
      userId,
      adminId,
      params,
      timestamp: new Date()
    })
    
    switch (action) {
      case 'ban': {
        // Ban user
        const { reason } = params
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              accountStatus: 'banned',
              bannedReason: reason,
              bannedAt: new Date(),
              bannedBy: adminId
            }
          }
        )
        return NextResponse.json({ success: true, message: 'User banned' })
      }
      
      case 'suspend': {
        // Suspend user temporarily
        const { reason, duration } = params // duration in hours
        const suspendUntil = new Date(Date.now() + (duration || 24) * 60 * 60 * 1000)
        
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              accountStatus: 'suspended',
              suspendedReason: reason,
              suspendedAt: new Date(),
              suspendedUntil,
              suspendedBy: adminId
            }
          }
        )
        return NextResponse.json({ success: true, message: 'User suspended', until: suspendUntil })
      }
      
      case 'activate': {
        // Reactivate user
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { accountStatus: 'active' },
            $unset: { 
              bannedReason: '',
              bannedAt: '',
              suspendedReason: '',
              suspendedAt: '',
              suspendedUntil: ''
            }
          }
        )
        return NextResponse.json({ success: true, message: 'User activated' })
      }
      
      case 'add_credits': {
        // Add credits to user
        const { amount, reason } = params
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Valid amount required' }, { status: 400 })
        }
        
        const result = await addCredits(userId, amount, reason || 'Admin credit add', adminId)
        return NextResponse.json(result)
      }
      
      case 'remove_credits': {
        // Remove credits from user
        const { amount, reason } = params
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Valid amount required' }, { status: 400 })
        }
        
        const result = await addCredits(userId, -amount, reason || 'Admin credit removal', adminId)
        return NextResponse.json(result)
      }
      
      case 'reset_credits': {
        // Reset credits to plan default
        const user = await db.collection('users').findOne({ _id: userId })
        const planCredits = { free: 50, creator: 500, pro: 2000, business: 10000 }
        const defaultCredits = planCredits[user?.plan] || 50
        
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { credits: defaultCredits } }
        )
        
        await db.collection('credit_transactions').insertOne({
          _id: uuidv4(),
          userId,
          amount: defaultCredits,
          status: 'completed',
          type: 'credit_reset',
          reason: 'Admin reset',
          adminId,
          createdAt: new Date(),
          completedAt: new Date()
        })
        
        return NextResponse.json({ success: true, message: 'Credits reset', newBalance: defaultCredits })
      }
      
      case 'change_plan': {
        // Change user's plan
        const { newPlan } = params
        const validPlans = ['free', 'creator', 'pro', 'business']
        
        if (!validPlans.includes(newPlan)) {
          return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })
        }
        
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              plan: newPlan,
              planChangedAt: new Date(),
              planChangedBy: adminId
            }
          }
        )
        
        return NextResponse.json({ success: true, message: `Plan changed to ${newPlan}` })
      }
      
      case 'verify_email': {
        // Manually verify email
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
        )
        return NextResponse.json({ success: true, message: 'Email verified' })
      }
      
      case 'clear_suspicious': {
        // Clear suspicious activity flag
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { suspiciousActivity: false },
            $unset: { suspiciousReasons: '', flaggedAt: '' }
          }
        )
        return NextResponse.json({ success: true, message: 'Suspicious flag cleared' })
      }
      
      case 'delete_user': {
        // Delete user permanently
        const { confirmEmail } = params
        const user = await db.collection('users').findOne({ _id: userId })
        
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }
        
        // Safety check - require email confirmation
        if (confirmEmail !== user.email) {
          return NextResponse.json({ success: false, error: 'Email confirmation does not match' }, { status: 400 })
        }
        
        // Archive user data before deletion
        await db.collection('deleted_users').insertOne({
          ...user,
          deletedAt: new Date(),
          deletedBy: adminId
        })
        
        // Delete user's data
        await Promise.all([
          db.collection('users').deleteOne({ _id: userId }),
          db.collection('credit_transactions').deleteMany({ userId }),
          db.collection('payment_transactions').deleteMany({ userId }),
          db.collection('generations').deleteMany({ userId })
        ])
        
        return NextResponse.json({ success: true, message: 'User deleted permanently' })
      }
      
      case 'make_admin': {
        // Make user an admin
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              role: 'admin',
              madeAdminAt: new Date(),
              madeAdminBy: adminId
            }
          }
        )
        return NextResponse.json({ success: true, message: 'User is now an admin' })
      }
      
      case 'remove_admin': {
        // Remove admin privileges
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { role: 'user' },
            $unset: { madeAdminAt: '', madeAdminBy: '' }
          }
        )
        return NextResponse.json({ success: true, message: 'Admin privileges removed' })
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('User management error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
