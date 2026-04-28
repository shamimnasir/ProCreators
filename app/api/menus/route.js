// Public Menu API - Fetch menus for header/footer rendering
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

const COLLECTION_NAME = 'site_menus'

// Default menu structure (same as admin API)
const DEFAULT_MENUS = {
  header: {
    menuId: 'header',
    name: 'Header Navigation',
    location: 'header',
    items: [
      { id: 'h1', label: 'Features', link: '/#features', type: 'anchor', order: 1 },
      { id: 'h2', label: 'Tools', link: '/tools', type: 'page', order: 2 },
      { id: 'h3', label: 'Pricing', link: '/pricing', type: 'page', order: 3 },
      { id: 'h4', label: 'Roadmap', link: '/roadmap', type: 'page', order: 4 },
      { id: 'h5', label: 'Blog', link: '/blog', type: 'page', order: 5 }
    ]
  },
  footer_product: {
    menuId: 'footer_product',
    name: 'Product',
    location: 'footer',
    column: 1,
    items: [
      { id: 'fp1', label: 'All Tools', link: '/tools', type: 'page', order: 1 },
      { id: 'fp2', label: 'Pricing', link: '/pricing', type: 'page', order: 2 },
      { id: 'fp3', label: 'Dashboard', link: '/dashboard', type: 'page', order: 3 },
      { id: 'fp4', label: 'Roadmap', link: '/roadmap', type: 'page', order: 4 }
    ]
  },
  footer_solutions: {
    menuId: 'footer_solutions',
    name: 'Solutions',
    location: 'footer',
    column: 2,
    items: [
      { id: 'fs1', label: 'Content Creators', link: '/tools?category=video', type: 'page', order: 1 },
      { id: 'fs2', label: 'Marketing Teams', link: '/tools?category=business', type: 'page', order: 2 },
      { id: 'fs3', label: 'Agencies', link: '/tools?category=business', type: 'page', order: 3 },
      { id: 'fs4', label: 'Educators', link: '/tools?category=education', type: 'page', order: 4 }
    ]
  },
  footer_resources: {
    menuId: 'footer_resources',
    name: 'Resources',
    location: 'footer',
    column: 3,
    items: [
      { id: 'fr1', label: 'Documentation', link: '/docs', type: 'page', order: 1 },
      { id: 'fr2', label: 'Blog', link: '/blog', type: 'page', order: 2 },
      { id: 'fr3', label: 'FAQ', link: '/faq', type: 'page', order: 3 }
    ]
  },
  footer_company: {
    menuId: 'footer_company',
    name: 'Company',
    location: 'footer',
    column: 4,
    items: [
      { id: 'fc1', label: 'About Us', link: '/about', type: 'page', order: 1 },
      { id: 'fc2', label: 'Careers', link: '/careers', type: 'page', order: 2 },
      { id: 'fc3', label: 'Contact', link: '/contact', type: 'page', order: 3 },
      { id: 'fc4', label: 'Media Kit', link: '/media-kit', type: 'page', order: 4 }
    ]
  },
  footer_legal: {
    menuId: 'footer_legal',
    name: 'Legal',
    location: 'footer_bottom',
    items: [
      { id: 'fl1', label: 'Privacy Policy', link: '/privacy', type: 'page', order: 1 },
      { id: 'fl2', label: 'Terms of Service', link: '/terms', type: 'page', order: 2 },
      { id: 'fl3', label: 'Cookie Policy', link: '/cookies', type: 'page', order: 3 }
    ]
  }
}

// GET - Fetch menus for public rendering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') // header, footer, footer_bottom, all
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // Get all saved menus
    const savedMenus = await collection.find({}).toArray()
    const savedMenusMap = new Map(savedMenus.map(m => [m.menuId, m]))
    
    // Build complete menu list with defaults
    const allMenus = Object.entries(DEFAULT_MENUS).map(([menuId, defaultMenu]) => {
      const saved = savedMenusMap.get(menuId)
      return saved || defaultMenu
    })
    
    // Add any custom menus that aren't in defaults
    savedMenus.forEach(menu => {
      if (!DEFAULT_MENUS[menu.menuId]) {
        allMenus.push(menu)
      }
    })
    
    // Filter by location if specified
    let result = allMenus
    if (location && location !== 'all') {
      result = allMenus.filter(m => m.location === location)
    }
    
    // Sort items by order and menus by column
    result = result.map(menu => ({
      ...menu,
      items: (menu.items || []).sort((a, b) => (a.order || 0) - (b.order || 0))
    })).sort((a, b) => (a.column || 0) - (b.column || 0))
    
    // For header, return single menu
    if (location === 'header') {
      const headerMenu = result.find(m => m.menuId === 'header')
      return NextResponse.json({ 
        success: true, 
        menu: headerMenu || DEFAULT_MENUS.header
      })
    }
    
    // For footer_bottom, return single menu
    if (location === 'footer_bottom') {
      const legalMenu = result.find(m => m.menuId === 'footer_legal')
      return NextResponse.json({ 
        success: true, 
        menu: legalMenu || DEFAULT_MENUS.footer_legal
      })
    }
    
    return NextResponse.json({ success: true, menus: result })
    
  } catch (error) {
    console.error('Error fetching public menus:', error)
    // Return defaults on error
    return NextResponse.json({ 
      success: true, 
      menus: Object.values(DEFAULT_MENUS)
    })
  }
}
