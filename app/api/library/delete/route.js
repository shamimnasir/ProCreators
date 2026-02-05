import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { getUserIdFromRequest } from '@/lib/get-user-id'

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { id, userId: bodyUserId } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Get user ID from body or request headers
    const userId = bodyUserId || await getUserIdFromRequest(request)

    const libraryCollection = await getCollection('library')
    
    // Get the item first to check if it has a file
    const item = await libraryCollection.findOne({ 
      id,
      userId
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Delete the database entry
    await libraryCollection.deleteOne({ id, userId })

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
