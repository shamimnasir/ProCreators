// Public Site Settings API - Read-only access to public site settings
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

const DEFAULT_SETTINGS = {
  branding: {
    siteName: 'ProCreators',
    tagline: 'AI-Powered Content Creation Platform',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.svg',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6'
  },
  social: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    discord: ''
  },
  footer: {
    footerDescription: 'The ultimate AI-powered content creation platform. From videos to ebooks, we help creators dominate every platform.',
    copyrightText: '© 2025 ProCreators. All rights reserved.',
    showSocialLinks: true
  },
  seo: {
    defaultTitle: 'ProCreators - AI Content Creation Platform',
    defaultDescription: 'Create viral content, ebooks, videos, and more with AI. 70+ tools for creators, marketers, and businesses.',
    defaultKeywords: 'AI content creation, video generator, ebook maker, social media tools',
    ogImage: '/og-image.png'
  }
}

// GET - Retrieve public site settings (no auth required)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    
    const { db } = await connectToDatabase()
    
    let settings = await db.collection('site_settings').findOne({ _id: 'main' })
    
    // Merge with defaults to ensure all fields exist
    const publicSettings = {
      branding: { ...DEFAULT_SETTINGS.branding, ...(settings?.branding || {}) },
      social: { ...DEFAULT_SETTINGS.social, ...(settings?.social || {}) },
      footer: { ...DEFAULT_SETTINGS.footer, ...(settings?.footer || {}) },
      seo: { ...DEFAULT_SETTINGS.seo, ...(settings?.seo || {}) }
    }
    
    // Return specific section if requested
    if (section && publicSettings[section]) {
      return NextResponse.json({ success: true, settings: publicSettings[section] })
    }
    
    return NextResponse.json({ success: true, settings: publicSettings })
    
  } catch (error) {
    console.error('Error fetching site settings:', error)
    // Return defaults on error
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS })
  }
}
