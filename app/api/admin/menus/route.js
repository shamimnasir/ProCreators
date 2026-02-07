// Menu Manager API - Manage header, footer, and custom navigation menus
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { verifyCsrfToken } from '@/lib/csrf'

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

const COLLECTION_NAME = 'site_menus'

// Default menu structure
const DEFAULT_MENUS = {
  header: {
    menuId: 'header',
    name: 'Header Navigation',
    location: 'header',
    items: [
      { id: 'h1', label: 'Features', link: '/#features', type: 'anchor', order: 1 },
      { id: 'h2', label: 'Pricing', link: '/pricing', type: 'page', order: 2 },
      { id: 'h3', label: 'Blog', link: '/blog', type: 'page', order: 3 },
      { id: 'h4', label: 'Roadmap', link: '/roadmap', type: 'page', order: 4 }
    ]
  },
  footer_product: {
    menuId: 'footer_product',
    name: 'Footer - Product',
    location: 'footer',
    column: 1,
    items: [
      { id: 'fp1', label: 'All Features', link: '/#features', type: 'anchor', order: 1 },
      { id: 'fp2', label: 'Pricing', link: '/pricing', type: 'page', order: 2 },
      { id: 'fp3', label: 'Dashboard', link: '/dashboard', type: 'page', order: 3 },
      { id: 'fp4', label: 'Roadmap', link: '/roadmap', type: 'page', order: 4 }
    ]
  },
  footer_solutions: {
    menuId: 'footer_solutions',
    name: 'Footer - Solutions',
    location: 'footer',
    column: 2,
    items: [
      { id: 'fs1', label: 'Content Creators', link: '/solutions/creators', type: 'page', order: 1 },
      { id: 'fs2', label: 'Marketing Teams', link: '/solutions/marketers', type: 'page', order: 2 },
      { id: 'fs3', label: 'Agencies', link: '/solutions/agencies', type: 'page', order: 3 },
      { id: 'fs4', label: 'Educators', link: '/solutions/educators', type: 'page', order: 4 }
    ]
  },
  footer_resources: {
    menuId: 'footer_resources',
    name: 'Footer - Resources',
    location: 'footer',
    column: 3,
    items: [
      { id: 'fr1', label: 'Help Center', link: '/docs', type: 'page', order: 1 },
      { id: 'fr2', label: 'Blog', link: '/blog', type: 'page', order: 2 },
      { id: 'fr3', label: 'Community', link: '/community', type: 'page', order: 3 },
      { id: 'fr4', label: 'Status', link: '/status', type: 'page', order: 4 }
    ]
  },
  footer_company: {
    menuId: 'footer_company',
    name: 'Footer - Company',
    location: 'footer',
    column: 4,
    items: [
      { id: 'fc1', label: 'About Us', link: '/about', type: 'page', order: 1 },
      { id: 'fc2', label: 'Careers', link: '/careers', type: 'page', order: 2 },
      { id: 'fc3', label: 'Contact', link: '/contact', type: 'page', order: 3 }
    ]
  },
  footer_legal: {
    menuId: 'footer_legal',
    name: 'Footer - Legal',
    location: 'footer_bottom',
    items: [
      { id: 'fl1', label: 'Privacy Policy', link: '/privacy', type: 'page', order: 1 },
      { id: 'fl2', label: 'Terms of Service', link: '/terms', type: 'page', order: 2 },
      { id: 'fl3', label: 'Security', link: '/security', type: 'page', order: 3 }
    ]
  }
}

// GET - Fetch all menus or specific menu
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menuId')
    const location = searchParams.get('location')
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    if (menuId) {
      // Get specific menu
      let menu = await collection.findOne({ menuId })
      
      // Return default if not customized
      if (!menu && DEFAULT_MENUS[menuId]) {
        menu = { ...DEFAULT_MENUS[menuId], isDefault: true }
      }
      
      if (!menu) {
        return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 })
      }
      
      return NextResponse.json({ success: true, menu })
    }
    
    if (location) {
      // Get all menus for a location (header, footer, footer_bottom)
      const savedMenus = await collection.find({ location }).toArray()
      const savedMenuIds = new Set(savedMenus.map(m => m.menuId))
      
      // Add defaults that aren't customized
      const defaults = Object.values(DEFAULT_MENUS)
        .filter(m => m.location === location && !savedMenuIds.has(m.menuId))
        .map(m => ({ ...m, isDefault: true }))
      
      const allMenus = [...savedMenus, ...defaults].sort((a, b) => (a.column || 0) - (b.column || 0))
      
      return NextResponse.json({ success: true, menus: allMenus })
    }
    
    // Get all menus
    const savedMenus = await collection.find({}).toArray()
    const savedMenuIds = new Set(savedMenus.map(m => m.menuId))
    
    // Add defaults that aren't customized
    const defaults = Object.values(DEFAULT_MENUS)
      .filter(m => !savedMenuIds.has(m.menuId))
      .map(m => ({ ...m, isDefault: true }))
    
    const allMenus = [...savedMenus, ...defaults]
    
    return NextResponse.json({ success: true, menus: allMenus })
    
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new menu
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, location, column, items = [] } = body
    
    if (!name || !location) {
      return NextResponse.json({ success: false, error: 'Name and location are required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const menuId = `custom_${Date.now()}`
    const newMenu = {
      _id: uuidv4(),
      menuId,
      name,
      location,
      column: column || 0,
      items,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await collection.insertOne(newMenu)
    
    return NextResponse.json({ success: true, menu: newMenu })
    
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update menu
export async function PUT(request) {
  try {
    const body = await request.json()
    const { menuId, name, items, column } = body
    
    if (!menuId) {
      return NextResponse.json({ success: false, error: 'menuId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // Check if menu exists
    const existing = await collection.findOne({ menuId })
    
    const updateData = {
      updatedAt: new Date()
    }
    if (name !== undefined) updateData.name = name
    if (items !== undefined) updateData.items = items
    if (column !== undefined) updateData.column = column
    
    if (existing) {
      // Update existing
      await collection.updateOne({ menuId }, { $set: updateData })
    } else if (DEFAULT_MENUS[menuId]) {
      // Create from default with updates
      const defaultMenu = DEFAULT_MENUS[menuId]
      const newMenu = {
        _id: uuidv4(),
        ...defaultMenu,
        ...updateData,
        createdAt: new Date()
      }
      await collection.insertOne(newMenu)
    } else {
      return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 })
    }
    
    const updatedMenu = await collection.findOne({ menuId })
    return NextResponse.json({ success: true, menu: updatedMenu })
    
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete custom menu or reset to default
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menuId')
    
    if (!menuId) {
      return NextResponse.json({ success: false, error: 'menuId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    await collection.deleteOne({ menuId })
    
    return NextResponse.json({ success: true, message: 'Menu deleted/reset to default' })
    
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
