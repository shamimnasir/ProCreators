// Debug endpoint to check SEO data fetch
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('pageId') || 'homepage'
  
  try {
    const { db } = await connectToDatabase()
    
    // Check unified_pages
    const unifiedPage = await db.collection('unified_pages').findOne({ pageId })
    
    // Check custom_pages
    const customPage = await db.collection('custom_pages').findOne({ pageId })
    
    // List all collections
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    // Count documents in unified_pages
    const unifiedCount = await db.collection('unified_pages').countDocuments()
    
    return NextResponse.json({
      success: true,
      pageId,
      unifiedPage: unifiedPage ? {
        pageId: unifiedPage.pageId,
        metaTitle: unifiedPage.metaTitle,
        metaDescription: unifiedPage.metaDescription,
        seo: unifiedPage.seo,
        hasData: true
      } : null,
      customPage: customPage ? {
        pageId: customPage.pageId,
        metaTitle: customPage.metaTitle,
        hasData: true
      } : null,
      collectionNames,
      unifiedPagesCount: unifiedCount,
      dbName: db.databaseName
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
