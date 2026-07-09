// Server-side function to fetch page SEO from database
// This mirrors the logic in /api/content-pages/route.js
import { connectToDatabase } from '@/lib/mongodb'

const UNIFIED_PAGES_COLLECTION = 'unified_pages'
const CUSTOM_PAGES_COLLECTION = 'custom_pages'

// Default SEO values for all pages
const DEFAULT_SEO = {
  homepage: {
    metaTitle: 'ProCreators \u2014 AI Publishing Studio for Amazon KDP & Etsy Sellers',
    metaDescription: 'Publish complete Amazon KDP and Etsy products \u2014 ebooks, journals, planners, and coloring books \u2014 in under 2 hours with AI. First product free. No credit card needed.',
    keywords: 'KDP AI tool, AI ebook creator, Amazon KDP publisher tool, AI journal maker, AI planner creator, coloring book AI generator, Etsy printable creator AI, low content book AI, KDP cover generator'
  },
  about: {
    metaTitle: 'About Us | ProCreators',
    metaDescription: 'Learn about ProCreators \u2014 the AI publishing studio for KDP and Etsy sellers.',
    keywords: 'about procreators, AI publishing platform, KDP publisher tools'
  },
  privacy: {
    metaTitle: 'Privacy Policy | ProCreators',
    metaDescription: 'ProCreators Privacy Policy - Learn how we collect, use, and protect your data.',
    keywords: 'privacy policy, data protection, GDPR'
  },
  terms: {
    metaTitle: 'Terms of Service | ProCreators',
    metaDescription: 'ProCreators Terms of Service - Read our terms and conditions for using our platform.',
    keywords: 'terms of service, terms and conditions, user agreement'
  },
  cookies: {
    metaTitle: 'Cookie Policy | ProCreators',
    metaDescription: 'Learn how ProCreators uses cookies to improve your experience.',
    keywords: 'cookie policy, cookies, tracking'
  },
  contact: {
    metaTitle: 'Contact Us | ProCreators',
    metaDescription: 'Get in touch with the ProCreators team. We\'d love to hear from you!',
    keywords: 'contact, support, help, customer service'
  },
  careers: {
    metaTitle: 'Careers | ProCreators',
    metaDescription: 'Join the ProCreators team. Explore career opportunities in AI and content creation.',
    keywords: 'jobs, careers, hiring, work at procreators'
  },
  security: {
    metaTitle: 'Security | ProCreators',
    metaDescription: 'Learn about ProCreators security practices and how we keep your data safe.',
    keywords: 'security, data protection, encryption, safe'
  },
  community: {
    metaTitle: 'Community | ProCreators',
    metaDescription: 'Join the ProCreators community. Connect with creators and share your work.',
    keywords: 'community, creators, social, network'
  },
  status: {
    metaTitle: 'System Status | ProCreators',
    metaDescription: 'Check the current status of ProCreators services and systems.',
    keywords: 'status, uptime, system status, service status'
  },
  roadmap: {
    metaTitle: 'Product Roadmap | ProCreators',
    metaDescription: 'See what we\'re building and what\'s coming next. Your feedback shapes our future.',
    keywords: 'roadmap, features, upcoming, product development'
  },
  pricing: {
    metaTitle: 'Pricing \u2014 ProCreators AI Publishing Studio',
    metaDescription: 'Plans starting at $29/month for Amazon KDP and Etsy sellers. Publish 10 complete books per month. First product always free. No credit card to start.',
    keywords: 'ProCreators pricing, KDP publisher plans, Etsy seller plans, AI publishing pricing'
  },
  blog: {
    metaTitle: 'Blog | ProCreators',
    metaDescription: 'Tips, tutorials, and insights on AI publishing for KDP and Etsy sellers.',
    keywords: 'KDP blog, Etsy publishing tips, AI publishing guide'
  },
  docs: {
    metaTitle: 'Documentation | ProCreators',
    metaDescription: 'Learn how to use ProCreators tools and features.',
    keywords: 'documentation, guides, help, tutorials'
  },
  faq: {
    metaTitle: 'FAQ | ProCreators',
    metaDescription: 'Frequently asked questions about ProCreators.',
    keywords: 'faq, questions, help, support'
  },
  login: {
    metaTitle: 'Login | ProCreators',
    metaDescription: 'Sign in to your ProCreators account.',
    keywords: 'login, sign in, account'
  },
  register: {
    metaTitle: 'Sign Up | ProCreators',
    metaDescription: 'Create your free ProCreators account and start creating.',
    keywords: 'register, sign up, create account'
  },
  'forgot-password': {
    metaTitle: 'Forgot Password | ProCreators',
    metaDescription: 'Reset your ProCreators account password.',
    keywords: 'forgot password, reset password'
  },
  'reset-password': {
    metaTitle: 'Reset Password | ProCreators',
    metaDescription: 'Set a new password for your ProCreators account.',
    keywords: 'reset password, new password'
  },
  'verify-email': {
    metaTitle: 'Verify Email | ProCreators',
    metaDescription: 'Verify your email address to activate your account.',
    keywords: 'verify email, confirm email'
  },
  onboarding: {
    metaTitle: 'Welcome | ProCreators',
    metaDescription: 'Set up your ProCreators account.',
    keywords: 'onboarding, setup, welcome'
  },
  tools: {
    metaTitle: 'AI Publishing Tools for KDP & Etsy \u2014 ProCreators',
    metaDescription: 'Explore 60+ AI-powered tools for content creation, video editing, marketing, education, and career growth.',
    keywords: 'AI tools, content creation tools, video tools, marketing tools, AI content'
  },
  'solutions-creators': {
    metaTitle: 'For Content Creators | ProCreators',
    metaDescription: 'How ProCreators helps content creators grow their audience and monetize their content.',
    keywords: 'content creators, influencers, social media, growth'
  },
  'solutions-marketers': {
    metaTitle: 'For Marketing Teams | ProCreators',
    metaDescription: 'Scale your marketing content production with AI-powered tools.',
    keywords: 'marketing, marketing teams, content marketing, brand'
  },
  'solutions-agencies': {
    metaTitle: 'For Agencies | ProCreators',
    metaDescription: 'White-label AI content creation tools for agencies.',
    keywords: 'agencies, white label, client work, content agency'
  },
  'solutions-educators': {
    metaTitle: 'For Educators | ProCreators',
    metaDescription: 'Create educational content and learning materials with AI.',
    keywords: 'educators, teachers, courses, learning materials'
  }
}

/**
 * Fetch SEO metadata for a page from the database
 * Uses same logic as /api/content-pages/route.js
 */
export async function getPageSeo(pageId) {
  try {
    const { db } = await connectToDatabase()
    
    // First check unified_pages collection (admin-customized pages)
    let page = await db.collection(UNIFIED_PAGES_COLLECTION).findOne({ pageId })
    
    // If not found, check custom_pages collection
    if (!page) {
      page = await db.collection(CUSTOM_PAGES_COLLECTION).findOne({ pageId })
    }
    
    // Log for debugging
    console.log(`[SEO] pageId: ${pageId}, found in DB: ${page ? 'yes' : 'no'}`)
    if (page) {
      console.log(`[SEO] DB metaTitle: ${page.metaTitle}, seo.metaTitle: ${page.seo?.metaTitle}`)
    }
    
    if (page) {
      // Data can be at top level OR nested in seo object
      // Top level takes priority (this is how admin saves it)
      const seo = page.seo || {}
      
      return {
        title: page.metaTitle || seo.metaTitle || DEFAULT_SEO[pageId]?.metaTitle || 'ProCreators',
        description: page.metaDescription || seo.metaDescription || DEFAULT_SEO[pageId]?.metaDescription || '',
        keywords: page.keywords || seo.keywords || DEFAULT_SEO[pageId]?.keywords || '',
        ogImage: page.ogImage || seo.ogImage || null,
        canonical: page.canonical || seo.canonical || null
      }
    }
    
    // Return defaults if page not found
    console.log(`[SEO] Using defaults for ${pageId}`)
    return {
      title: DEFAULT_SEO[pageId]?.metaTitle || 'ProCreators',
      description: DEFAULT_SEO[pageId]?.metaDescription || '',
      keywords: DEFAULT_SEO[pageId]?.keywords || ''
    }
    
  } catch (error) {
    console.error('[SEO] Error:', error.message)
    return {
      title: DEFAULT_SEO[pageId]?.metaTitle || 'ProCreators',
      description: DEFAULT_SEO[pageId]?.metaDescription || ''
    }
  }
}
