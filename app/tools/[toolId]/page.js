// Public Tool Landing Page - Server Component with Dynamic Metadata
// These pages are publicly accessible for SEO
import { connectToDatabase } from '@/lib/mongodb'
import { notFound } from 'next/navigation'
import { getDefaultPageTemplate } from '@/lib/pageSchema'
import { v4 as uuidv4 } from 'uuid'
import PublicToolPage from './PublicToolPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Complete tool metadata for SEO (matches initialize-all route)
const TOOL_METADATA = {
  // Video Tools
  'ai-video-studio': { name: 'AI Video Studio', description: 'Create stunning AI-powered videos in minutes with professional quality', category: 'Video' },
  'quick-reels': { name: 'Quick Video Studio', description: 'Create viral short-form videos instantly for TikTok, Reels, and Shorts', category: 'Video' },
  'auto-subtitles': { name: 'Auto Subtitles', description: 'Add accurate AI-generated subtitles to any video automatically', category: 'Video' },
  'auto-reels': { name: 'Auto Reels', description: 'Automatically generate engaging reels from your content', category: 'Video' },
  'auto-longform': { name: 'Auto Longform', description: 'Create long-form video content with AI assistance', category: 'Video' },
  'reels': { name: 'Reels Creator', description: 'Design captivating social media reels in minutes', category: 'Video' },
  'story-reels': { name: 'Story Reels', description: 'Create story-driven reels that engage your audience', category: 'Video' },
  'long-form': { name: 'Long Form Video', description: 'Produce professional long-form video content with AI', category: 'Video' },
  'script-to-ad': { name: 'Script to Ad', description: 'Transform your scripts into compelling video ads', category: 'Video' },
  'thumbnail-maker': { name: 'Thumbnail Maker', description: 'Create eye-catching thumbnails that boost click-through rates', category: 'Video' },
  
  // Image Tools
  'image-editor': { name: 'AI Image Studio', description: 'Edit and enhance images with powerful AI tools', category: 'Image' },
  'cover-image-creator': { name: 'Cover Image Creator', description: 'Design professional cover images for any platform', category: 'Image' },
  'podcast-cover-maker': { name: 'Podcast Cover Maker', description: 'Create stunning podcast cover art that stands out', category: 'Image' },
  'photo-cards': { name: 'Photo Cards', description: 'Create professional photo cards and news graphics instantly', category: 'Image' },
  'carousels': { name: 'Carousel Creator', description: 'Design engaging carousel posts for social media', category: 'Image' },
  'meme-generator': { name: 'AI Meme Generator', description: 'Generate viral memes with AI-powered creativity', category: 'Image' },
  'avatar-creator': { name: 'AI Avatar Creator', description: 'Create unique AI avatars for profiles and branding', category: 'Image' },
  
  // Audio Tools
  'audio-editor': { name: 'Audio Editor', description: 'Edit and enhance audio with professional AI tools', category: 'Audio' },
  'noise-remover': { name: 'Noise Remover', description: 'Remove background noise from audio recordings instantly', category: 'Audio' },
  'voice-enhancer': { name: 'Voice Enhancer', description: 'Enhance voice quality with AI-powered audio processing', category: 'Audio' },
  
  // Digital Products
  'planner-maker': { name: 'Digital Planner Maker', description: 'Create beautiful digital planners to sell or use', category: 'Digital Products' },
  'worksheet-maker': { name: 'Worksheet Generator', description: 'Generate educational worksheets with AI assistance', category: 'Digital Products' },
  'coloring-book': { name: 'Coloring Book Creator', description: 'Create unique coloring book pages with AI', category: 'Digital Products' },
  'journal-maker': { name: 'Journal & Diary Maker', description: 'Design beautiful journals and diaries to sell', category: 'Digital Products' },
  'checklist-maker': { name: 'Checklist Maker', description: 'Create professional checklists and templates', category: 'Digital Products' },
  'ebook-maker': { name: 'Ebook Creator', description: 'Write and design ebooks with AI-powered tools', category: 'Digital Products' },
  'notion-templates': { name: 'Notion Template Maker', description: 'Create and sell Notion templates easily', category: 'Digital Products' },
  'slides-maker': { name: 'Presentation Templates', description: 'Design stunning presentation slides with AI', category: 'Digital Products' },
  'learning-cards': { name: 'Flashcard Pack Creator', description: 'Create educational flashcard packs for learning', category: 'Digital Products' },
  'quiz-maker': { name: 'Quiz & Test Creator', description: 'Generate quizzes and tests with AI assistance', category: 'Digital Products' },
  'storybook-maker': { name: "Children's Storybook", description: 'Create illustrated children\'s stories with AI', category: 'Digital Products' },
  'activity-book': { name: 'Activity Book Creator', description: 'Design engaging activity books for all ages', category: 'Digital Products' },
  'ai-prompt-pack': { name: 'AI Prompt Pack Generator', description: 'Create sellable AI prompt packs for Etsy, Gumroad, and Notion buyers in minutes', category: 'Digital Products' },
  'spreadsheet-template': { name: 'Spreadsheet Template Creator', description: 'Design ready-to-sell Google Sheets and Excel templates with formulas and dashboards', category: 'Digital Products' },
  'wedding-suite': { name: 'Wedding Stationery Suite', description: 'Generate a complete 8-piece printable wedding invitation and stationery suite', category: 'Digital Products' },
  'puzzle-book': { name: 'Puzzle Book Creator', description: 'Create themed word-search puzzle books ready for Amazon KDP publishing', category: 'Digital Products' },
  'recipe-book': { name: 'Recipe Book Creator', description: 'Write complete themed recipe books ready to sell on Amazon KDP and Etsy', category: 'Digital Products' },
  
  // Fun & Recreation
  'joke-generator': { name: 'Joke Generator', description: 'Generate hilarious jokes with AI-powered humor', category: 'Fun' },
  'fortune-teller': { name: 'AI Fortune Teller', description: 'Get fun AI-generated fortune readings', category: 'Fun' },
  'love-letter': { name: 'Love Letter Generator', description: 'Write romantic letters with AI assistance', category: 'Fun' },
  'story-writer': { name: 'AI Story Writer', description: 'Create captivating stories with AI', category: 'Fun' },
  'quotes': { name: 'Quote Generator', description: 'Generate inspirational quotes with AI', category: 'Fun' },
  
  // Business & Marketing
  'ad-copy': { name: 'Ad Copy Generator', description: 'Create high-converting ad copy instantly with AI', category: 'Business' },
  'business-plan': { name: 'Business Plan Generator', description: 'Generate comprehensive business plans with AI', category: 'Business' },
  'pitch-deck': { name: 'Pitch Deck Creator', description: 'Create compelling pitch decks for investors', category: 'Business' },
  'swot-analysis': { name: 'SWOT Analysis', description: 'Generate professional SWOT analyses with AI', category: 'Business' },
  'marketing-strategy': { name: 'Marketing Strategy', description: 'Develop marketing strategies with AI insights', category: 'Business' },
  'email-campaigns': { name: 'Email Campaigns', description: 'Create effective email marketing campaigns', category: 'Business' },
  
  // Content Creation
  'blog-creator': { name: 'Blog Post Writer', description: 'Write SEO-optimized blog posts with AI', category: 'Content' },
  'etsy-listing': { name: 'Etsy Listing Writer', description: 'Generate 13-tag Etsy listings with keyword-rich titles, materials, and structured descriptions that rank in Etsy search', category: 'Business' },
  'youtube-creator': { name: 'YouTube Content Creator', description: 'Create YouTube content with AI tools', category: 'Content' },
  'professional-email': { name: 'Professional Email Writer', description: 'Write professional emails with AI assistance', category: 'Content' },
  'linkedin-posts': { name: 'LinkedIn Post Creator', description: 'Create engaging LinkedIn posts with AI', category: 'Content' },
  'lists': { name: 'List Creator', description: 'Generate comprehensive lists with AI', category: 'Content' },
  'news': { name: 'News Writer', description: 'Create news articles with AI assistance', category: 'Content' },
  'ai-humanizer': { name: 'AI Humanizer', description: 'Make AI-generated text sound more natural', category: 'Content' },
  'content-humanizer': { name: 'Content Humanizer', description: 'Humanize your content with AI refinement', category: 'Content' },
  
  // Education
  'essay-helper': { name: 'Essay Helper', description: 'Get AI assistance with essay writing', category: 'Education' },
  'study-notes': { name: 'Study Notes Generator', description: 'Create comprehensive study notes with AI', category: 'Education' },
  'exam-prep': { name: 'Exam Prep', description: 'Prepare for exams with AI-powered study tools', category: 'Education' },
  'lesson-planner': { name: 'Lesson Planner', description: 'Create lesson plans with AI assistance', category: 'Education' },
  'citation-generator': { name: 'Citation Generator', description: 'Generate proper citations automatically', category: 'Education' },
  'grammar-checker': { name: 'Grammar Checker', description: 'Check and improve grammar with AI', category: 'Education' },
  
  // Career
  'resume-builder': { name: 'Resume Builder', description: 'Build professional resumes that get interviews', category: 'Career' },
  'cover-letter': { name: 'Cover Letter Generator', description: 'Create compelling cover letters with AI', category: 'Career' },
  'interview-prep': { name: 'Interview Prep', description: 'Prepare for job interviews with AI coaching', category: 'Career' },
  'job-matcher': { name: 'Job Matcher', description: 'Find the perfect job matches with AI', category: 'Career' },
  'salary-negotiator': { name: 'Salary Negotiator', description: 'Get AI tips for salary negotiations', category: 'Career' },
  'networking-message': { name: 'Networking Message', description: 'Write professional networking messages', category: 'Career' }
}

// Auto-initialize tool page if not exists
async function ensureToolPageExists(db, toolId) {
  const collection = db.collection('tool_pages')
  let toolPage = await collection.findOne({ toolId })
  
  if (!toolPage) {
    // Auto-create the page from template
    const toolInfo = TOOL_METADATA[toolId]
    if (toolInfo) {
      console.log(`[Tool SEO] Auto-initializing page for: ${toolId}`)
      const newPage = getDefaultPageTemplate(toolId, toolInfo.name)
      newPage._id = uuidv4()
      newPage.category = toolInfo.category
      // Override with better SEO description
      newPage.seo.metaDescription = toolInfo.description
      
      try {
        await collection.insertOne(newPage)
        toolPage = newPage
        console.log(`[Tool SEO] Created page for: ${toolId}`)
      } catch (err) {
        // Handle race condition - another request might have created it
        if (err.code === 11000) {
          toolPage = await collection.findOne({ toolId })
        } else {
          console.error(`[Tool SEO] Error creating page: ${err.message}`)
        }
      }
    }
  }
  
  return toolPage
}

// Generate metadata from database
export async function generateMetadata({ params }) {
  try {
    const { toolId } = await params
    const { db } = await connectToDatabase()
    
    // Ensure tool page exists (auto-create if needed)
    const toolPage = await ensureToolPageExists(db, toolId)
    
    // Get SEO data - check both nested (seo.metaTitle) and flat (metaTitle) structures
    if (toolPage) {
      const seo = toolPage.seo || {}
      const metaTitle = toolPage.metaTitle || seo.metaTitle || `${toolPage.toolName || TOOL_METADATA[toolId]?.name || toolId} | ProCreators`
      const metaDescription = toolPage.metaDescription || seo.metaDescription || TOOL_METADATA[toolId]?.description || 'AI-powered content creation tool'
      const keywords = toolPage.keywords || seo.keywords || ''
      const ogImage = toolPage.ogImage || seo.ogImage || ''
      
      console.log(`[Tool SEO] ${toolId}: title="${metaTitle}"`)
      
      // Use absolute title to bypass the layout template (prevents "| ProCreators | ProCreators")
      return {
        title: { absolute: metaTitle },
        description: metaDescription,
        keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
        openGraph: {
          title: metaTitle,
          description: metaDescription,
          images: ogImage ? [ogImage] : [],
          type: 'website',
        },
      }
    }
    
    // Fallback to static defaults
    const toolInfo = TOOL_METADATA[toolId]
    const toolName = toolInfo?.name || toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    
    return {
      title: { absolute: `${toolName} | ProCreators` },
      description: toolInfo?.description || `Create amazing content with ${toolName} - powered by AI`,
      openGraph: {
        title: `${toolName} | ProCreators`,
        description: toolInfo?.description || `Create amazing content with ${toolName}`,
      },
    }
  } catch (error) {
    console.error('[Tool SEO] Error:', error)
    return {
      title: 'AI Tool | ProCreators',
      description: 'AI-powered content creation tool'
    }
  }
}

export default async function ToolLandingPage({ params }) {
  const { toolId } = await params
  
  // Validate toolId exists
  const validTools = [
    'ai-video-studio', 'quick-reels', 'auto-subtitles', 'auto-reels', 'auto-longform',
    'reels', 'story-reels', 'long-form', 'script-to-ad', 'thumbnail-maker',
    'image-editor', 'cover-image-creator', 'podcast-cover-maker', 'photo-cards', 
    'carousels', 'meme-generator', 'avatar-creator',
    'audio-editor', 'noise-remover', 'voice-enhancer',
    'planner-maker', 'worksheet-maker', 'coloring-book', 'journal-maker',
    'checklist-maker', 'ebook-maker', 'notion-templates', 'slides-maker',
    'learning-cards', 'quiz-maker', 'storybook-maker', 'activity-book',
    'joke-generator', 'fortune-teller', 'love-letter', 'story-writer', 'quotes',
    'ad-copy', 'business-plan', 'pitch-deck', 'swot-analysis', 
    'marketing-strategy', 'email-campaigns',
    'blog-creator', 'youtube-creator', 'professional-email', 'linkedin-posts',
    'lists', 'news', 'ai-humanizer', 'content-humanizer',
    'essay-helper', 'study-notes', 'exam-prep', 'lesson-planner',
    'citation-generator', 'grammar-checker',
    'resume-builder', 'cover-letter', 'interview-prep', 'job-matcher',
    'salary-negotiator', 'networking-message',
    // Sprint 2: new publisher tools
    'ai-prompt-pack', 'recipe-book', 'spreadsheet-template', 'wedding-suite', 'puzzle-book',
    // Sprint 3: Etsy Listing mode gets its own public landing
    'etsy-listing'
  ]
  
  if (!validTools.includes(toolId)) {
    notFound()
  }
  
  return <PublicToolPage toolId={toolId} />
}
