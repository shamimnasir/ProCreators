import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user-001'
    
    const libraryCollection = await getCollection('library')
    const now = new Date()
    
    // Base query for user-specific, non-expired items
    const baseQuery = {
      userId: userId,
      $or: [
        { expiresAt: { $gte: now } },
        { expiresAt: { $exists: false } }
      ]
    }
    
    // Get counts by category
    const stats = await libraryCollection.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
    
    // Get total AI generations (all items for this user)
    const totalCount = await libraryCollection.countDocuments(baseQuery)
    
    // Get recent activity (last 5 items for this user)
    const recentActivity = await libraryCollection
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    // Get tool-specific stats
    const toolStats = await libraryCollection.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray()
    
    // Build response object
    const categoryMap = {
      text: 0,
      image: 0,
      video: 0
    }
    
    stats.forEach(stat => {
      if (stat._id && categoryMap.hasOwnProperty(stat._id)) {
        categoryMap[stat._id] = stat.count
      }
    })
    
    return NextResponse.json({
      success: true,
      stats: {
        totalContent: totalCount,
        textContent: categoryMap.text,
        imageContent: categoryMap.image,
        videoContent: categoryMap.video,
        aiGenerations: totalCount // All items are AI-generated
      },
      toolStats: toolStats.map(t => ({
        tool: t._id,
        count: t.count
      })),
      recentActivity: recentActivity.map(item => ({
        id: item.id,
        title: item.title || 'Untitled',
        type: item.type,
        category: item.category,
        createdAt: item.createdAt,
        videoUrl: item.videoUrl,
        content: item.content ? item.content.substring(0, 100) + '...' : null
      }))
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
