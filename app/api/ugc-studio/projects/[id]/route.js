import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { connectToDatabase } from '@/lib/mongodb'

// =====================================================
// UGC STUDIO — SINGLE AD PROJECT API
// =====================================================
// GET: Get a single project with its clips
// PUT: Update project (add clips, update script, etc.)
// DELETE: Delete a project

export async function GET(request, { params }) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { id } = await params
    const { db } = await connectToDatabase()

    const project = await db.collection('ugc_projects').findOne({
      _id: id,
      userId: auth.userId
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Get associated clips
    const clips = await db.collection('ugc_generations').find({
      projectId: id,
      userId: auth.userId
    }).sort({ createdAt: 1 }).toArray()

    return NextResponse.json({ success: true, project: { ...project, clips } })
  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { db } = await connectToDatabase()

    // Only allow updating certain fields
    const allowedUpdates = {}
    if (body.name !== undefined) allowedUpdates.name = body.name.trim().slice(0, 100)
    if (body.script !== undefined) allowedUpdates.script = body.script
    if (body.avatarId !== undefined) allowedUpdates.avatarId = body.avatarId
    if (body.avatarImageUrl !== undefined) allowedUpdates.avatarImageUrl = body.avatarImageUrl
    if (body.clips !== undefined) allowedUpdates.clips = body.clips
    if (body.status !== undefined) allowedUpdates.status = body.status
    if (body.totalCreditsUsed !== undefined) allowedUpdates.totalCreditsUsed = body.totalCreditsUsed
    
    allowedUpdates.updatedAt = new Date()

    const result = await db.collection('ugc_projects').updateOne(
      { _id: id, userId: auth.userId },
      { $set: allowedUpdates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const updatedProject = await db.collection('ugc_projects').findOne({ _id: id })
    return NextResponse.json({ success: true, project: updatedProject })
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request)
  if (!auth.authenticated) {
    return auth.response
  }

  try {
    const { id } = await params
    const { db } = await connectToDatabase()

    const result = await db.collection('ugc_projects').deleteOne({
      _id: id,
      userId: auth.userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Also delete associated clips
    await db.collection('ugc_generations').deleteMany({
      projectId: id,
      userId: auth.userId
    })

    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (error) {
    console.error('Project delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 })
  }
}
