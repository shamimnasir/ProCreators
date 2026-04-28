import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// UGC STUDIO — AD PROJECTS API
// =====================================================
// GET: List user's ad projects
// POST: Create a new ad project

export async function GET(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { db } = await connectToDatabase()
    const projects = await db.collection('ugc_projects').find({
      userId: auth.userId
    }).sort({ updatedAt: -1 }).toArray()

    return NextResponse.json({ success: true, projects })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const body = await request.json()
    const {
      name,
      productName = '',
      productDescription = '',
      script = null,
      avatarId = null,
      avatarImageUrl = null
    } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check project limit (max 50 per user)
    const count = await db.collection('ugc_projects').countDocuments({ userId: auth.userId })
    if (count >= 50) {
      return NextResponse.json({ success: false, error: 'Maximum 50 projects allowed. Please delete some first.' }, { status: 400 })
    }

    const project = {
      _id: uuidv4(),
      userId: auth.userId,
      name: name.trim().slice(0, 100),
      productName,
      productDescription,
      script,
      avatarId,
      avatarImageUrl,
      clips: [],
      status: 'draft',
      totalCreditsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('ugc_projects').insertOne(project)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Project create error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 })
  }
}
