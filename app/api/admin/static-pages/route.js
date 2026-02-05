// Admin Static Pages Management API
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'static_pages'

// List of available static pages
const STATIC_PAGE_IDS = ['about', 'privacy', 'terms', 'contact', 'careers', 'cookies', 'homepage']

// GET - List all static pages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    if (pageId) {
      // Get specific page
      const page = await collection.findOne({ pageId })
      if (!page) {
        return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, page })
    }
    
    // List all pages with their status
    const pages = await collection.find({}).toArray()
    
    // Build list including pages that haven't been created yet
    const allPages = STATIC_PAGE_IDS.map(id => {
      const existing = pages.find(p => p.pageId === id)
      return {
        pageId: id,
        title: existing?.title || formatPageTitle(id),
        isPublished: existing?.isPublished ?? false,
        updatedAt: existing?.updatedAt || null,
        exists: !!existing
      }
    })
    
    return NextResponse.json({ success: true, pages: allPages })
    
  } catch (error) {
    console.error('Error fetching static pages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update static page
export async function PUT(request) {
  try {
    const body = await request.json()
    const { pageId, title, metaTitle, metaDescription, contentBlocks, isPublished } = body
    
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'pageId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const updateData = {
      updatedAt: new Date()
    }
    
    if (title !== undefined) updateData.title = title
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (contentBlocks !== undefined) updateData.contentBlocks = contentBlocks
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished
    
    // Check if page exists
    const existing = await collection.findOne({ pageId })
    
    if (existing) {
      // Update existing page
      await collection.updateOne({ pageId }, { $set: updateData })
    } else {
      // Create new page
      await collection.insertOne({
        _id: uuidv4(),
        pageId,
        ...updateData,
        createdAt: new Date()
      })
    }
    
    const updatedPage = await collection.findOne({ pageId })
    return NextResponse.json({ success: true, page: updatedPage })
    
  } catch (error) {
    console.error('Error updating static page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function formatPageTitle(pageId) {
  const titles = {
    about: 'About Us',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact Us',
    careers: 'Careers',
    cookies: 'Cookie Policy',
    homepage: 'Homepage'
  }
  return titles[pageId] || pageId.charAt(0).toUpperCase() + pageId.slice(1)
}
