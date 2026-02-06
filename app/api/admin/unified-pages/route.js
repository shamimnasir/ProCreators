// Unified Page Manager API - Manage ALL website pages from admin
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'unified_pages'
const CUSTOM_PAGES_COLLECTION = 'custom_pages'

// All manageable pages with their types and default configurations
const PAGE_REGISTRY = {
  // Static/Info Pages
  homepage: { type: 'landing', title: 'Homepage', path: '/', icon: 'Home', category: 'Core' },
  about: { type: 'content', title: 'About Us', path: '/about', icon: 'Users', category: 'Company' },
  privacy: { type: 'content', title: 'Privacy Policy', path: '/privacy', icon: 'Shield', category: 'Legal' },
  terms: { type: 'content', title: 'Terms of Service', path: '/terms', icon: 'FileText', category: 'Legal' },
  cookies: { type: 'content', title: 'Cookie Policy', path: '/cookies', icon: 'Cookie', category: 'Legal' },
  contact: { type: 'content', title: 'Contact Us', path: '/contact', icon: 'Mail', category: 'Company' },
  careers: { type: 'content', title: 'Careers', path: '/careers', icon: 'Briefcase', category: 'Company' },
  
  // Feature Pages
  roadmap: { type: 'roadmap', title: 'Product Roadmap', path: '/roadmap', icon: 'Map', category: 'Product' },
  pricing: { type: 'pricing', title: 'Pricing', path: '/pricing', icon: 'CreditCard', category: 'Product' },
  blog: { type: 'blog', title: 'Blog', path: '/blog', icon: 'BookOpen', category: 'Content' },
  docs: { type: 'docs', title: 'Documentation', path: '/docs', icon: 'FileQuestion', category: 'Support' },
  
  // Solution Pages
  'solutions-creators': { type: 'solution', title: 'For Content Creators', path: '/solutions/creators', icon: 'Video', category: 'Solutions' },
  'solutions-marketers': { type: 'solution', title: 'For Marketing Teams', path: '/solutions/marketers', icon: 'BarChart', category: 'Solutions' },
  'solutions-agencies': { type: 'solution', title: 'For Agencies', path: '/solutions/agencies', icon: 'Building', category: 'Solutions' },
  'solutions-educators': { type: 'solution', title: 'For Educators', path: '/solutions/educators', icon: 'GraduationCap', category: 'Solutions' },
  
  // Other Pages
  security: { type: 'content', title: 'Security', path: '/security', icon: 'Lock', category: 'Company' },
  status: { type: 'status', title: 'System Status', path: '/status', icon: 'Activity', category: 'Support' },
  community: { type: 'content', title: 'Community', path: '/community', icon: 'Users2', category: 'Support' }
}

// Helper to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Default content templates by page type
const DEFAULT_TEMPLATES = {
  content: {
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Page Title',
          subtitle: 'Page description goes here',
          alignment: 'center'
        }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'Add your content here...'
        }
      }
    ]
  },
  landing: {
    sections: {
      hero: { enabled: true, title: 'Create Content That Dominates', subtitle: 'AI-powered tools for creators' },
      features: { enabled: true, title: 'Features' },
      pricing: { enabled: true },
      testimonials: { enabled: true },
      faq: { enabled: true },
      cta: { enabled: true }
    }
  },
  roadmap: {
    quarters: [
      {
        id: 'q1-2025',
        quarter: 'Q1 2025',
        status: 'completed',
        features: [
          { name: 'Feature 1', description: 'Description', completed: true }
        ]
      }
    ],
    ctaTitle: 'Have a Feature Request?',
    ctaSubtitle: 'We\'d love to hear your ideas!',
    ctaButtonText: 'Submit Feature Request'
  },
  pricing: {
    headline: 'Simple, Transparent Pricing',
    subheadline: 'Choose the plan that works for you',
    showAnnualDiscount: true,
    annualDiscountPercent: 20,
    tiers: [] // Managed separately in pricing system
  },
  blog: {
    headline: 'Blog & Resources',
    subheadline: 'Tips, tutorials, and insights to help you master content creation with AI.',
    showCategories: true,
    showNewsletter: true,
    postsPerPage: 9
  },
  docs: {
    headline: 'Documentation',
    subheadline: 'Everything you need to know about using ProCreators',
    showSearch: true,
    showCategories: true
  },
  solution: {
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Solution for [Audience]',
          subtitle: 'How ProCreators helps you succeed',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Key Benefits',
          columns: 3,
          items: [
            { icon: '⚡', title: 'Benefit 1', description: 'Description' },
            { icon: '🎯', title: 'Benefit 2', description: 'Description' },
            { icon: '💡', title: 'Benefit 3', description: 'Description' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Ready to Get Started?',
          subtitle: 'Join thousands of [audience] using ProCreators',
          buttonText: 'Start Free Trial',
          buttonLink: '/login'
        }
      }
    ]
  },
  status: {
    showHistoricalUptime: true,
    showIncidents: true,
    services: [
      { name: 'API', status: 'operational' },
      { name: 'Dashboard', status: 'operational' },
      { name: 'AI Generation', status: 'operational' }
    ]
  }
}

// GET - List all pages or get specific page
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const category = searchParams.get('category')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customCollection = db.collection(CUSTOM_PAGES_COLLECTION)
    
    if (pageId) {
      // Get specific page - check custom pages first, then registry
      let page = await collection.findOne({ pageId })
      
      // Check custom pages collection
      if (!page) {
        page = await customCollection.findOne({ pageId })
        if (page) {
          page.isCustomPage = true
        }
      }
      
      // If page doesn't exist in DB, return template from registry
      if (!page && PAGE_REGISTRY[pageId]) {
        const registry = PAGE_REGISTRY[pageId]
        const template = DEFAULT_TEMPLATES[registry.type] || DEFAULT_TEMPLATES.content
        page = {
          pageId,
          ...registry,
          ...template,
          seo: {
            metaTitle: `${registry.title} | ProCreators`,
            metaDescription: `${registry.title} - ProCreators AI Content Creation Platform`
          },
          isPublished: true,
          isDefault: true
        }
      }
      
      if (!page) {
        return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true, page })
    }
    
    // List all pages with their status
    const savedPages = await collection.find({}).toArray()
    const savedPagesMap = new Map(savedPages.map(p => [p.pageId, p]))
    
    // Get custom pages
    const customPages = await customCollection.find({}).toArray()
    
    // Build complete page list from registry
    let allPages = Object.entries(PAGE_REGISTRY).map(([pageId, info]) => {
      const saved = savedPagesMap.get(pageId)
      return {
        pageId,
        ...info,
        isPublished: saved?.isPublished ?? true,
        isCustomized: !!saved,
        updatedAt: saved?.updatedAt || null
      }
    })
    
    // Add custom pages to the list
    customPages.forEach(cp => {
      allPages.push({
        pageId: cp.pageId,
        title: cp.title,
        path: cp.path,
        type: cp.type || 'content',
        category: cp.category || 'Custom',
        icon: cp.icon || 'FileText',
        isPublished: cp.isPublished ?? true,
        isCustomized: true,
        isCustomPage: true,
        updatedAt: cp.updatedAt
      })
    })
    
    // Filter by category if specified
    if (category && category !== 'all') {
      allPages = allPages.filter(p => p.category === category)
    }
    
    // Get unique categories (including Custom if there are custom pages)
    const categories = [...new Set([
      ...Object.values(PAGE_REGISTRY).map(p => p.category),
      ...customPages.map(p => p.category || 'Custom')
    ])]
    
    return NextResponse.json({ 
      success: true, 
      pages: allPages,
      categories,
      totalPages: allPages.length
    })
    
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create NEW custom page or initialize existing page
export async function POST(request) {
  try {
    const body = await request.json()
    const { pageId, action, title, path, category, type = 'content', icon = 'FileText' } = body
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customCollection = db.collection(CUSTOM_PAGES_COLLECTION)
    
    // ACTION: Create new custom page
    if (action === 'create-new') {
      if (!title) {
        return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
      }
      
      // Generate pageId and path from title if not provided
      const newPageId = pageId || `custom-${generateSlug(title)}-${Date.now()}`
      const newPath = path || `/p/${generateSlug(title)}`
      
      // Check if path already exists
      const existingPath = await customCollection.findOne({ path: newPath })
      if (existingPath) {
        return NextResponse.json({ success: false, error: 'A page with this path already exists' }, { status: 400 })
      }
      
      const template = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.content
      
      const newPage = {
        _id: uuidv4(),
        pageId: newPageId,
        title,
        path: newPath,
        type,
        category: category || 'Custom',
        icon,
        ...template,
        seo: {
          metaTitle: `${title} | ProCreators`,
          metaDescription: `${title} - ProCreators AI Content Creation Platform`
        },
        isPublished: true,
        isCustomPage: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await customCollection.insertOne(newPage)
      
      return NextResponse.json({ success: true, page: newPage, message: 'Custom page created' })
    }
    
    // ACTION: Initialize existing registry page
    if (!pageId || !PAGE_REGISTRY[pageId]) {
      return NextResponse.json({ success: false, error: 'Invalid pageId for registry page' }, { status: 400 })
    }
    
    // Check if page already exists
    const existing = await collection.findOne({ pageId })
    if (existing) {
      return NextResponse.json({ success: true, page: existing, message: 'Page already exists' })
    }
    
    // Create from template
    const registry = PAGE_REGISTRY[pageId]
    const template = DEFAULT_TEMPLATES[registry.type] || DEFAULT_TEMPLATES.content
    
    const newPage = {
      _id: uuidv4(),
      pageId,
      ...registry,
      ...template,
      seo: {
        metaTitle: `${registry.title} | ProCreators`,
        metaDescription: `${registry.title} - ProCreators AI Content Creation Platform`
      },
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await collection.insertOne(newPage)
    
    return NextResponse.json({ success: true, page: newPage, message: 'Page created' })
    
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update page (both registry and custom pages)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { pageId, seo, contentBlocks, sections, quarters, isPublished, customData, title, path, category } = body
    
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'pageId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customCollection = db.collection(CUSTOM_PAGES_COLLECTION)
    
    // Build update object
    const updateData = {
      updatedAt: new Date()
    }
    
    if (seo !== undefined) updateData.seo = seo
    if (contentBlocks !== undefined) updateData.contentBlocks = contentBlocks
    if (sections !== undefined) updateData.sections = sections
    if (quarters !== undefined) updateData.quarters = quarters
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished
    if (customData !== undefined) updateData.customData = customData
    if (title !== undefined) updateData.title = title
    if (path !== undefined) updateData.path = path
    if (category !== undefined) updateData.category = category
    
    // Check if it's a custom page first
    const existingCustom = await customCollection.findOne({ pageId })
    if (existingCustom) {
      await customCollection.updateOne({ pageId }, { $set: updateData })
      const updatedPage = await customCollection.findOne({ pageId })
      return NextResponse.json({ success: true, page: updatedPage })
    }
    
    // Check if page exists in registry collection
    const existing = await collection.findOne({ pageId })
    
    if (existing) {
      // Update existing
      await collection.updateOne({ pageId }, { $set: updateData })
    } else {
      // Create new with defaults + updates
      const registry = PAGE_REGISTRY[pageId]
      if (!registry) {
        return NextResponse.json({ success: false, error: 'Invalid pageId' }, { status: 400 })
      }
      
      const template = DEFAULT_TEMPLATES[registry.type] || DEFAULT_TEMPLATES.content
      const newPage = {
        _id: uuidv4(),
        pageId,
        ...registry,
        ...template,
        ...updateData,
        createdAt: new Date()
      }
      await collection.insertOne(newPage)
    }
    
    const updatedPage = await collection.findOne({ pageId })
    return NextResponse.json({ success: true, page: updatedPage })
    
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Reset page to default OR delete custom page permanently
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const permanent = searchParams.get('permanent') === 'true'
    
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'pageId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customCollection = db.collection(CUSTOM_PAGES_COLLECTION)
    
    // Check if it's a custom page
    const customPage = await customCollection.findOne({ pageId })
    if (customPage) {
      await customCollection.deleteOne({ pageId })
      return NextResponse.json({ success: true, message: 'Custom page deleted permanently' })
    }
    
    // For registry pages, just remove customizations
    await collection.deleteOne({ pageId })
    
    return NextResponse.json({ success: true, message: 'Page reset to default' })
    
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
