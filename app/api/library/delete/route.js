import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { requireAuth } from '@/lib/auth-middleware'
import { verifyCsrf } from '@/lib/csrf-verify'
import { buildUserDelete } from '@/lib/tenant-isolation'

export async function DELETE(request) {
  try {
    // SECURITY: CSRF verification
    const csrfCheck = verifyCsrf(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'CSRF verification failed', code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
    
    // SECURITY: Require authentication
    const auth = await requireAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }
    
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // SECURITY: Use tenant isolation - user can only delete their own items
    const deleteQuery = buildUserDelete(auth.userId, id)

    const libraryCollection = await getCollection('library')
    
    // Get the item first to check if it has a file (with tenant isolation)
    const item = await libraryCollection.findOne({ 
      id,
      userId: auth.userId // SECURITY: Enforce ownership
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the database entry with tenant isolation
    await libraryCollection.deleteOne({ id, userId: auth.userId })

    // Delete the associated file if it exists
    if (item.filePath) {
      const fullPath = join('/app/public', item.filePath)
      if (existsSync(fullPath)) {
        try {
          await unlink(fullPath)
        } catch (fileError) {
          console.error('Failed to delete file:', fileError)
          // Continue anyway, DB entry is deleted
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
