// Public Blog API - Fetch published posts for the blog page
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { DEFAULT_POSTS } from '@/lib/default-blog-posts'

const COLLECTION_NAME = 'blog_posts'


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // Get single post by slug
    if (slug) {
      let post = await collection.findOne({ slug, isPublished: true })
      
      // Check defaults if not in DB
      if (!post) {
        post = DEFAULT_POSTS.find(p => p.slug === slug)
      }
      
      if (!post) {
        return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true, post })
    }
    
    // Build query for listing
    const query = { isPublished: true }
    if (category && category !== 'all' && category !== 'All') {
      query.category = category
    }
    if (featured === 'true') {
      query.featured = true
    }
    
    // Get posts from database
    let posts = await collection
      .find(query)
      .sort({ featured: -1, publishedAt: -1 })
      .limit(limit)
      .toArray()
    
    // If no posts in DB, use defaults
    if (posts.length === 0) {
      posts = DEFAULT_POSTS
      if (category && category !== 'all' && category !== 'All') {
        posts = posts.filter(p => p.category === category)
      }
      if (featured === 'true') {
        posts = posts.filter(p => p.featured)
      }
    }
    
    // Get categories from both DB and defaults
    const dbPosts = await collection.find({ isPublished: true }).toArray()
    const allPosts = dbPosts.length > 0 ? dbPosts : DEFAULT_POSTS
    const categories = ['All', ...new Set(allPosts.map(p => p.category).filter(Boolean))]
    
    return NextResponse.json({ success: true, posts, categories })
    
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    // Return defaults on error
    return NextResponse.json({ 
      success: true, 
      posts: DEFAULT_POSTS,
      categories: ['All', 'Content Strategy', 'AI Technology', 'Tutorials', 'Design', 'Video']
    })
  }
}
