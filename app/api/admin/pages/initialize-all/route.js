import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getDefaultPageTemplate } from '@/lib/pageSchema'
import { v4 as uuidv4 } from 'uuid'
import { DIGITAL_PRODUCT_CATEGORIES } from '@/config/digital-products'

const DB_NAME = 'procreators'
const COLLECTION_NAME = 'tool_pages'

// All tools in the system
const ALL_TOOLS = [
  // Digital Products
  ...DIGITAL_PRODUCT_CATEGORIES.flatMap(cat => cat.tools.map(t => ({ id: t.id, name: t.name, category: 'Digital Products' }))),
  
  // Video Tools
  { id: 'video-editor', name: 'AI Video Editor', category: 'Media' },
  { id: 'auto-subtitles', name: 'Auto Subtitles', category: 'Media' },
  { id: 'background-remover', name: 'Background Remover', category: 'Media' },
  
  // Image Tools
  { id: 'image-editor', name: 'AI Image Studio', category: 'Media' },
  { id: 'cover-maker', name: 'Cover Image Creator', category: 'Media' },
  { id: 'podcast-cover', name: 'Podcast Cover Maker', category: 'Media' },
  
  // Audio Tools
  { id: 'audio-editor', name: 'Audio Editor', category: 'Media' },
  { id: 'noise-remover', name: 'Noise Remover', category: 'Media' },
  { id: 'voice-enhancer', name: 'Voice Enhancer', category: 'Media' },
  
  // Fun & Recreation
  { id: 'meme-generator', name: 'AI Meme Generator', category: 'Fun' },
  { id: 'joke-generator', name: 'Joke Generator', category: 'Fun' },
  { id: 'fortune-teller', name: 'AI Fortune Teller', category: 'Fun' },
  { id: 'love-letter', name: 'Love Letter Generator', category: 'Fun' },
  { id: 'story-writer', name: 'AI Story Writer', category: 'Fun' },
  { id: 'avatar-creator', name: 'AI Avatar Creator', category: 'Fun' },
  
  // Business Tools
  { id: 'ad-copy', name: 'Ad Copy Generator', category: 'Business' },
  { id: 'business-plan', name: 'Business Plan Generator', category: 'Business' },
  { id: 'pitch-deck', name: 'Pitch Deck Creator', category: 'Business' },
  { id: 'swot-analysis', name: 'SWOT Analysis', category: 'Business' },
  
  // Content Tools
  { id: 'blog-writer', name: 'Blog Post Writer', category: 'Content' },
  { id: 'youtube-creator', name: 'YouTube Content Creator', category: 'Content' },
  { id: 'social-post', name: 'Social Media Post Generator', category: 'Content' },
  { id: 'professional-email', name: 'Professional Email Writer', category: 'Content' }
]

// POST - Initialize all tool pages
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    const results = {
      created: [],
      existing: [],
      errors: []
    }
    
    for (const tool of ALL_TOOLS) {
      try {
        const existing = await collection.findOne({ toolId: tool.id })
        
        if (existing) {
          results.existing.push(tool.id)
        } else {
          const newPage = getDefaultPageTemplate(tool.id, tool.name)
          newPage._id = uuidv4()
          newPage.category = tool.category
          await collection.insertOne(newPage)
          results.created.push(tool.id)
        }
      } catch (err) {
        results.errors.push({ toolId: tool.id, error: err.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Initialized ${results.created.length} pages, ${results.existing.length} already existed`,
      results
    })
    
  } catch (error) {
    console.error('Error initializing pages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get status of all tool pages
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    const existingPages = await collection.find({}).toArray()
    const existingIds = new Set(existingPages.map(p => p.toolId))
    
    const status = ALL_TOOLS.map(tool => ({
      ...tool,
      hasPage: existingIds.has(tool.id),
      page: existingPages.find(p => p.toolId === tool.id) || null
    }))
    
    return NextResponse.json({
      success: true,
      totalTools: ALL_TOOLS.length,
      pagesCreated: existingPages.length,
      tools: status
    })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
