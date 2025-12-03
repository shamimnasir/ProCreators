import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

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
    
    const result = await libraryCollection.deleteOne({ 
      id,
      userId: 'default-user' // TODO: Replace with actual user ID when auth is implemented
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
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
