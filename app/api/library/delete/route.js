import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const libraryCollection = await getCollection('library')
    
    // Get the item first to check if it has a file
    const item = await libraryCollection.findOne({ 
      id,
      userId: 'default-user' // TODO: Replace with actual user ID when auth is implemented
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Delete the database entry
    await libraryCollection.deleteOne({ id, userId: 'default-user' })

    // Delete the associated file if it exists
    if (item.filePath) {
      const fullPath = join('/app/public', item.filePath)
      if (existsSync(fullPath)) {
        try {
          await unlink(fullPath)
          console.log(`Deleted file: ${fullPath}`)
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
