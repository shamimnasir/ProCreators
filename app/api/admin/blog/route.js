// Blog Posts API - Create, Read, Update, Delete blog posts
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { verifyCsrfToken } from '@/lib/csrf'

const COLLECTION_NAME = 'blog_posts'

// Helper to verify CSRF for mutations
function verifyCsrf(request) {
  const csrfToken = request.headers.get('x-csrf-token')
  const authHeader = request.headers.get('authorization')
  const sessionId = authHeader?.split(' ')[1] || `anon_${Date.now()}`
  
  // In development, allow requests without CSRF for easier testing
  if (process.env.NODE_ENV === 'development' && !csrfToken) {
    return { valid: true }
  }
  
  return verifyCsrfToken(csrfToken, sessionId)
}

// Helper to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET - List all posts or get single post
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const status = searchParams.get('status') // 'published', 'draft', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const featured = searchParams.get('featured')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // Get single post by ID
    if (postId) {
      const post = await collection.findOne({ postId })
      if (!post) {
        return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, post })
    }
    
    // Get single post by slug (for public page)
    if (slug) {
      const post = await collection.findOne({ slug, isPublished: true })
      if (!post) {
        return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, post })
    }
    
    // Build query for listing
    const query = {}
    if (status === 'published') query.isPublished = true
    if (status === 'draft') query.isPublished = false
    if (category && category !== 'all' && category !== 'All') query.category = category
    if (featured === 'true') query.featured = true
    
    // Get posts with sorting
    const posts = await collection
      .find(query)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray()
    
    // Get unique categories
    const allPosts = await collection.find({}).toArray()
    const categories = ['All', ...new Set(allPosts.map(p => p.category).filter(Boolean))]
    
    // Get stats
    const stats = {
      total: allPosts.length,
      published: allPosts.filter(p => p.isPublished).length,
      draft: allPosts.filter(p => !p.isPublished).length,
      featured: allPosts.filter(p => p.featured).length
    }
    
    return NextResponse.json({ success: true, posts, categories, stats })
    
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new post
export async function POST(request) {
  try {
    // Verify CSRF token for mutations
    const csrfResult = verifyCsrf(request)
    if (!csrfResult.valid) {
      return NextResponse.json({ 
        success: false, 
        error: csrfResult.error || 'CSRF validation failed',
        code: 'CSRF_INVALID'
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, 
      excerpt, 
      content, 
      category, 
      author, 
      featured = false,
      coverImage,
      tags = [],
      seo = {}
    } = body
    
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // Generate unique slug
    let slug = generateSlug(title)
    const existing = await collection.findOne({ slug })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }
    
    const postId = uuidv4()
    const newPost = {
      _id: postId,
      postId,
      slug,
      title,
      excerpt: excerpt || '',
      content: content || '',
      category: category || 'Uncategorized',
      author: author || 'ProCreators Team',
      featured,
      coverImage: coverImage || '',
      tags,
      seo: {
        metaTitle: seo.metaTitle || `${title} | ProCreators Blog`,
        metaDescription: seo.metaDescription || excerpt || title,
        ...seo
      },
      isPublished: false,
      readTime: Math.ceil((content || '').split(/\s+/).length / 200) + ' min read',
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null
    }
    
    await collection.insertOne(newPost)
    
    return NextResponse.json({ success: true, post: newPost })
    
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update post
export async function PUT(request) {
  try {
    // Verify CSRF token for mutations
    const csrfResult = verifyCsrf(request)
    if (!csrfResult.valid) {
      return NextResponse.json({ 
        success: false, 
        error: csrfResult.error || 'CSRF validation failed',
        code: 'CSRF_INVALID'
      }, { status: 403 })
    }

    const body = await request.json()
    const { postId, ...updates } = body
    
    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const existing = await collection.findOne({ postId })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }
    
    // Build update object
    const updateData = {
      updatedAt: new Date()
    }
    
    // Handle specific fields
    if (updates.title !== undefined) {
      updateData.title = updates.title
      // Update slug if title changes and post is draft
      if (!existing.isPublished) {
        updateData.slug = generateSlug(updates.title)
      }
    }
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt
    if (updates.content !== undefined) {
      updateData.content = updates.content
      updateData.readTime = Math.ceil((updates.content || '').split(/\s+/).length / 200) + ' min read'
    }
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.author !== undefined) updateData.author = updates.author
    if (typeof updates.featured === 'boolean') updateData.featured = updates.featured
    if (updates.coverImage !== undefined) updateData.coverImage = updates.coverImage
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.seo !== undefined) updateData.seo = updates.seo
    
    // Handle publishing/unpublishing
    if (typeof updates.isPublished === 'boolean') {
      updateData.isPublished = updates.isPublished
      if (updates.isPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    
    await collection.updateOne({ postId }, { $set: updateData })
    
    const updatedPost = await collection.findOne({ postId })
    return NextResponse.json({ success: true, post: updatedPost })
    
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete post
export async function DELETE(request) {
  try {
    // Verify CSRF token for mutations
    const csrfResult = verifyCsrf(request)
    if (!csrfResult.valid) {
      return NextResponse.json({ 
        success: false, 
        error: csrfResult.error || 'CSRF validation failed',
        code: 'CSRF_INVALID'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    await collection.deleteOne({ postId })
    
    return NextResponse.json({ success: true, message: 'Post deleted' })
    
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
