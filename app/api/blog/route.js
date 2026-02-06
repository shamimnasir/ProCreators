// Public Blog API - Fetch published posts for the blog page
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

const COLLECTION_NAME = 'blog_posts'

// Default posts if database is empty
const DEFAULT_POSTS = [
  {
    postId: 'default-1',
    slug: '10-tips-viral-content',
    title: '10 Tips for Creating Viral Social Media Content',
    excerpt: 'Learn the secrets to creating content that gets shared thousands of times across social media platforms.',
    content: '',
    category: 'Content Strategy',
    author: 'ProCreators Team',
    featured: true,
    readTime: '5 min read',
    publishedAt: new Date('2025-12-04'),
    isPublished: true
  },
  {
    postId: 'default-2',
    slug: 'ai-revolutionizing-content',
    title: 'How AI is Revolutionizing Content Creation',
    excerpt: 'Discover how artificial intelligence is changing the game for creators, marketers, and businesses.',
    content: '',
    category: 'AI Technology',
    author: 'ProCreators Team',
    featured: false,
    readTime: '7 min read',
    publishedAt: new Date('2025-12-03'),
    isPublished: true
  },
  {
    postId: 'default-3',
    slug: 'beginner-guide-thread-writing',
    title: 'Beginner Guide to Thread Writing',
    excerpt: 'Master the art of Twitter threads that capture attention and drive engagement.',
    content: '',
    category: 'Tutorials',
    author: 'ProCreators Team',
    featured: false,
    readTime: '4 min read',
    publishedAt: new Date('2025-12-02'),
    isPublished: true
  },
  {
    postId: 'default-4',
    slug: 'ai-image-generation-tips',
    title: 'Best Practices for AI Image Generation',
    excerpt: 'Tips and tricks for getting the best results from AI image generation tools.',
    content: '',
    category: 'Design',
    author: 'ProCreators Team',
    featured: false,
    readTime: '6 min read',
    publishedAt: new Date('2025-12-01'),
    isPublished: true
  },
  {
    postId: 'default-5',
    slug: 'content-calendar-framework',
    title: 'Building a Content Calendar That Works',
    excerpt: 'Plan, organize, and execute your content strategy with a proven framework.',
    content: '',
    category: 'Content Strategy',
    author: 'ProCreators Team',
    featured: false,
    readTime: '5 min read',
    publishedAt: new Date('2025-11-30'),
    isPublished: true
  },
  {
    postId: 'default-6',
    slug: 'future-of-video-content',
    title: 'The Future of Video Content Creation',
    excerpt: 'What to expect in the next generation of video creation tools and platforms.',
    content: '',
    category: 'Video',
    author: 'ProCreators Team',
    featured: false,
    readTime: '8 min read',
    publishedAt: new Date('2025-11-29'),
    isPublished: true
  }
]

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
