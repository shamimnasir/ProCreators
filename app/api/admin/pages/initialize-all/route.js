import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getDefaultPageTemplate } from '@/lib/pageSchema'
import { v4 as uuidv4 } from 'uuid'

import { requireAdmin } from '@/lib/auth-middleware'
const COLLECTION_NAME = 'tool_pages'

// Complete list of ALL ACTIVE tools in the system
// These match the actual tool directories in /app/dashboard/tools/
const ALL_TOOLS = [
  // ============ VIDEO TOOLS ============
  { id: 'ai-video-studio', name: 'AI Video Studio', category: 'Video' },
  { id: 'quick-reels', name: 'Quick Video Studio', category: 'Video' },
  { id: 'auto-subtitles', name: 'Auto Subtitles', category: 'Video' },
  { id: 'auto-reels', name: 'Auto Reels', category: 'Video' },
  { id: 'auto-longform', name: 'Auto Longform', category: 'Video' },
  { id: 'reels', name: 'Reels Creator', category: 'Video' },
  { id: 'story-reels', name: 'Story Reels', category: 'Video' },
  { id: 'long-form', name: 'Long Form Video', category: 'Video' },
  { id: 'script-to-ad', name: 'Script to Ad', category: 'Video' },
  { id: 'thumbnail-maker', name: 'Thumbnail Maker', category: 'Video' },
  
  // ============ IMAGE TOOLS ============
  { id: 'image-editor', name: 'AI Image Studio', category: 'Image' },
  { id: 'cover-image-creator', name: 'Cover Image Creator', category: 'Image' },
  { id: 'podcast-cover-maker', name: 'Podcast Cover Maker', category: 'Image' },
  { id: 'photo-cards', name: 'Photo Cards', category: 'Image' },
  { id: 'carousels', name: 'Carousel Creator', category: 'Image' },
  { id: 'meme-generator', name: 'AI Meme Generator', category: 'Image' },
  { id: 'avatar-creator', name: 'AI Avatar Creator', category: 'Image' },
  
  // ============ AUDIO TOOLS ============
  { id: 'audio-editor', name: 'Audio Editor', category: 'Audio' },
  { id: 'noise-remover', name: 'Noise Remover', category: 'Audio' },
  { id: 'voice-enhancer', name: 'Voice Enhancer', category: 'Audio' },
  
  // ============ DIGITAL PRODUCTS ============
  { id: 'planner-maker', name: 'Digital Planner Maker', category: 'Digital Products' },
  { id: 'worksheet-maker', name: 'Worksheet Generator', category: 'Digital Products' },
  { id: 'coloring-book', name: 'Coloring Book Creator', category: 'Digital Products' },
  { id: 'journal-maker', name: 'Journal & Diary Maker', category: 'Digital Products' },
  { id: 'checklist-maker', name: 'Checklist Maker', category: 'Digital Products' },
  { id: 'ebook-maker', name: 'Ebook Creator', category: 'Digital Products' },
  { id: 'notion-templates', name: 'Notion Template Maker', category: 'Digital Products' },
  { id: 'slides-maker', name: 'Presentation Templates', category: 'Digital Products' },
  { id: 'learning-cards', name: 'Flashcard Pack Creator', category: 'Digital Products' },
  { id: 'quiz-maker', name: 'Quiz & Test Creator', category: 'Digital Products' },
  { id: 'storybook-maker', name: 'Children\'s Storybook', category: 'Digital Products' },
  { id: 'activity-book', name: 'Activity Book Creator', category: 'Digital Products' },
  
  // ============ FUN & RECREATION ============
  { id: 'joke-generator', name: 'Joke Generator', category: 'Fun' },
  { id: 'fortune-teller', name: 'AI Fortune Teller', category: 'Fun' },
  { id: 'love-letter', name: 'Love Letter Generator', category: 'Fun' },
  { id: 'story-writer', name: 'AI Story Writer', category: 'Fun' },
  { id: 'quotes', name: 'Quote Generator', category: 'Fun' },
  
  // ============ BUSINESS & MARKETING ============
  { id: 'ad-copy', name: 'Ad Copy Generator', category: 'Business' },
  { id: 'business-plan', name: 'Business Plan Generator', category: 'Business' },
  { id: 'pitch-deck', name: 'Pitch Deck Creator', category: 'Business' },
  { id: 'swot-analysis', name: 'SWOT Analysis', category: 'Business' },
  { id: 'marketing-strategy', name: 'Marketing Strategy', category: 'Business' },
  { id: 'email-campaigns', name: 'Email Campaigns', category: 'Business' },
  
  // ============ CONTENT CREATION ============
  { id: 'blog-creator', name: 'Blog Post Writer', category: 'Content' },
  { id: 'youtube-creator', name: 'YouTube Content Creator', category: 'Content' },
  { id: 'professional-email', name: 'Professional Email Writer', category: 'Content' },
  { id: 'linkedin-posts', name: 'LinkedIn Post Creator', category: 'Content' },
  { id: 'lists', name: 'List Creator', category: 'Content' },
  { id: 'news', name: 'News Writer', category: 'Content' },
  { id: 'ai-humanizer', name: 'AI Humanizer', category: 'Content' },
  { id: 'content-humanizer', name: 'Content Humanizer', category: 'Content' },
  
  // ============ STUDENTS & EDUCATION ============
  { id: 'essay-helper', name: 'Essay Helper', category: 'Education' },
  { id: 'study-notes', name: 'Study Notes Generator', category: 'Education' },
  { id: 'exam-prep', name: 'Exam Prep', category: 'Education' },
  { id: 'lesson-planner', name: 'Lesson Planner', category: 'Education' },
  { id: 'citation-generator', name: 'Citation Generator', category: 'Education' },
  { id: 'grammar-checker', name: 'Grammar Checker', category: 'Education' },
  
  // ============ JOBS & CAREER ============
  { id: 'resume-builder', name: 'Resume Builder', category: 'Career' },
  { id: 'cover-letter', name: 'Cover Letter Generator', category: 'Career' },
  { id: 'interview-prep', name: 'Interview Prep', category: 'Career' },
  { id: 'job-matcher', name: 'Job Matcher', category: 'Career' },
  { id: 'salary-negotiator', name: 'Salary Negotiator', category: 'Career' },
  { id: 'networking-message', name: 'Networking Message', category: 'Career' }
]

// POST - Initialize all tool pages
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { db } = await connectToDatabase()
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
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  try {
    const { db } = await connectToDatabase()
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
