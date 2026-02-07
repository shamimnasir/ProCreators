// Site Settings API - Manage branding, social links, analytics, and more
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
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

const DEFAULT_SETTINGS = {
  // Branding
  branding: {
    siteName: 'ProCreators',
    tagline: 'AI-Powered Content Creation Platform',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.svg',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6'
  },
  
  // Homepage
  homepage: {
    heroTitle: 'Create Amazing Content with AI',
    heroSubtitle: 'Generate viral videos, ebooks, images, and more in minutes. No design skills needed.',
    heroCta: 'Start Creating Free',
    heroCtaUrl: '/dashboard',
    showFeatures: true,
    showTestimonials: true,
    showPricing: true,
    showFaq: true
  },
  
  // Social Links
  social: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    discord: ''
  },
  
  // Footer
  footer: {
    copyrightText: '© 2025 ProCreators. All rights reserved.',
    showSocialLinks: true,
    links: [
      { label: 'Privacy Policy', url: '/privacy', enabled: true },
      { label: 'Terms of Service', url: '/terms', enabled: true },
      { label: 'Contact', url: '/contact', enabled: true },
      { label: 'Blog', url: '/blog', enabled: false },
      { label: 'Roadmap', url: '/roadmap', enabled: false }
    ]
  },
  
  // Analytics & Tracking
  analytics: {
    googleAnalyticsId: '',
    facebookPixelId: '',
    twitterPixelId: '',
    customHeadScripts: '',
    customBodyScripts: ''
  },
  
  // SEO Defaults
  seo: {
    defaultTitle: 'ProCreators - AI Content Creation Platform',
    defaultDescription: 'Create viral content, ebooks, videos, and more with AI. 70+ tools for creators, marketers, and businesses.',
    defaultKeywords: 'AI content creation, video generator, ebook maker, social media tools',
    ogImage: '/og-image.png'
  },
  
  // Policy Pages Content
  pages: {
    privacy: {
      title: 'Privacy Policy',
      content: '# Privacy Policy\n\nLast updated: February 2025\n\n## Information We Collect\n\nWe collect information you provide directly to us...\n\n## How We Use Your Information\n\nWe use the information we collect to...\n\n## Contact Us\n\nIf you have questions about this Privacy Policy, please contact us at support@procreators.io',
      lastUpdated: '2025-02-01'
    },
    terms: {
      title: 'Terms of Service',
      content: '# Terms of Service\n\nLast updated: February 2025\n\n## Acceptance of Terms\n\nBy accessing ProCreators, you agree to these terms...\n\n## Use of Service\n\nYou may use our service for lawful purposes only...\n\n## Contact Us\n\nQuestions? Email us at support@procreators.io',
      lastUpdated: '2025-02-01'
    },
    contact: {
      title: 'Contact Us',
      content: '# Contact Us\n\nWe\'d love to hear from you!\n\n**Email:** support@procreators.io\n\n**Response Time:** Within 24-48 hours',
      lastUpdated: '2025-02-01'
    }
  }
}

// GET - Retrieve site settings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') // Optional: get specific section
    
    const { db } = await connectToDatabase()
    
    let settings = await db.collection('site_settings').findOne({ _id: 'main' })
    
    // If no settings exist, create with defaults
    if (!settings) {
      settings = { _id: 'main', ...DEFAULT_SETTINGS, createdAt: new Date(), updatedAt: new Date() }
      await db.collection('site_settings').insertOne(settings)
    }
    
    // Merge with defaults to ensure all fields exist
    const mergedSettings = {
      branding: { ...DEFAULT_SETTINGS.branding, ...settings.branding },
      homepage: { ...DEFAULT_SETTINGS.homepage, ...settings.homepage },
      social: { ...DEFAULT_SETTINGS.social, ...settings.social },
      footer: { ...DEFAULT_SETTINGS.footer, ...settings.footer },
      analytics: { ...DEFAULT_SETTINGS.analytics, ...settings.analytics },
      seo: { ...DEFAULT_SETTINGS.seo, ...settings.seo },
      pages: { ...DEFAULT_SETTINGS.pages, ...settings.pages }
    }
    
    // Return specific section if requested
    if (section && mergedSettings[section]) {
      return NextResponse.json({ success: true, settings: mergedSettings[section] })
    }
    
    return NextResponse.json({ success: true, settings: mergedSettings })
    
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Update site settings
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
    const { section, data } = body
    
    if (!section || !data) {
      return NextResponse.json({ success: false, error: 'Section and data required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    
    // Update specific section
    const updateField = `${section}`
    await db.collection('site_settings').updateOne(
      { _id: 'main' },
      { 
        $set: { 
          [updateField]: data,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    return NextResponse.json({ success: true, message: `${section} settings updated` })
    
  } catch (error) {
    console.error('Error updating site settings:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
