// User Profile API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET - Get user stats
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    
    // Get user's generation count this month using aggregation for better performance
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const generationsData = await db.collection('credit_transactions').aggregate([
      { $match: { userId, type: 'deduction', createdAt: { $gte: startOfMonth } } },
      { $count: 'total' }
    ]).toArray()
    const generations = generationsData[0]?.total || 0
    
    // Get user's content count (from library) using aggregation
    const contentData = await db.collection('library').aggregate([
      { $match: { userId, createdAt: { $gte: startOfMonth } } },
      { $count: 'total' }
    ]).toArray()
    const content = contentData[0]?.total || 0
    
    // Get credits used this month
    const creditsData = await db.collection('credit_transactions').aggregate([
      {
        $match: {
          userId,
          type: 'deduction',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$amount' } }
        }
      }
    ]).toArray()
    
    const creditsUsed = creditsData[0]?.total || 0
    
    return NextResponse.json({
      success: true,
      stats: {
        generations,
        content,
        creditsUsed
      }
    })
    
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
