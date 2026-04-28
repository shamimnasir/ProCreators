// Schema.org JSON-LD generators for SEO
// Supports SoftwareApplication, Organization, Product, FAQPage schemas

const SITE_CONFIG = {
  name: 'ProCreators',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://procreators.io',
  logo: '/logo.png',
  description: 'The ultimate AI-powered content creation platform for creators.',
  foundingDate: '2024',
  founders: ['ProCreators Team'],
  socialLinks: {
    twitter: 'https://twitter.com/procreators',
    instagram: 'https://instagram.com/procreators',
    github: 'https://github.com/procreators'
  }
}

// Default rating for tools (can be overridden per tool)
const DEFAULT_RATING = {
  ratingValue: '4.8',
  ratingCount: '1250',
  bestRating: '5',
  worstRating: '1'
}

// Tool category mappings for applicationCategory
export const TOOL_CATEGORIES = {
  // Video Tools
  'ai-video-studio': 'MultimediaApplication',
  'quick-reels': 'MultimediaApplication',
  'auto-reels': 'MultimediaApplication',
  'story-reels': 'MultimediaApplication',
  'talking-head': 'MultimediaApplication',
  'transformation-video': 'MultimediaApplication',
  'auto-subtitles': 'MultimediaApplication',
  'auto-longform': 'MultimediaApplication',
  
  // Audio Tools
  'voice-clone': 'MultimediaApplication',
  'voice-enhancer': 'MultimediaApplication',
  'noise-remover': 'MultimediaApplication',
  'audio-editor': 'MultimediaApplication',
  
  // Image Tools
  'thumbnail-maker': 'DesignApplication',
  'cover-image-creator': 'DesignApplication',
  'avatar-creator': 'DesignApplication',
  'meme-generator': 'DesignApplication',
  'photo-cards': 'DesignApplication',
  'image-editor': 'DesignApplication',
  'coloring-book': 'DesignApplication',
  'podcast-cover-maker': 'DesignApplication',
  
  // Writing Tools
  'blog-creator': 'BusinessApplication',
  'ad-copy': 'BusinessApplication',
  'email-campaigns': 'BusinessApplication',
  'professional-email': 'BusinessApplication',
  'landing-page-copy': 'BusinessApplication',
  'content-humanizer': 'BusinessApplication',
  'ai-humanizer': 'BusinessApplication',
  'grammar-checker': 'BusinessApplication',
  'essay-helper': 'EducationalApplication',
  'cover-letter': 'BusinessApplication',
  'resume-builder': 'BusinessApplication',
  
  // Social Media Tools
  'threads': 'SocialNetworkingApplication',
  'linkedin-posts': 'SocialNetworkingApplication',
  'carousels': 'SocialNetworkingApplication',
  'quotes': 'SocialNetworkingApplication',
  'reels': 'SocialNetworkingApplication',
  
  // Education Tools
  'lesson-planner': 'EducationalApplication',
  'study-notes': 'EducationalApplication',
  'exam-prep': 'EducationalApplication',
  'worksheet-maker': 'EducationalApplication',
  'learning-cards': 'EducationalApplication',
  'quiz-maker': 'EducationalApplication',
  'citation-generator': 'EducationalApplication',
  
  // Business Tools
  'business-plan': 'BusinessApplication',
  'marketing-strategy': 'BusinessApplication',
  'swot-analysis': 'BusinessApplication',
  'pitch-deck': 'BusinessApplication',
  'interview-prep': 'BusinessApplication',
  'salary-negotiator': 'BusinessApplication',
  'networking-message': 'BusinessApplication',
  'job-matcher': 'BusinessApplication',
  
  // Creative/Publishing Tools
  'ebook-maker': 'DesignApplication',
  'storybook-maker': 'DesignApplication',
  'activity-book': 'DesignApplication',
  'recipe-book': 'DesignApplication',
  'journal-maker': 'DesignApplication',
  'planner-maker': 'DesignApplication',
  'guide-maker': 'DesignApplication',
  'checklist-maker': 'DesignApplication',
  'notion-templates': 'DesignApplication',
  'slides-maker': 'DesignApplication',
  
  // Entertainment
  'joke-generator': 'EntertainmentApplication',
  'fortune-teller': 'EntertainmentApplication',
  'love-letter': 'EntertainmentApplication',
  'story-writer': 'EntertainmentApplication',
  
  // Default
  'default': 'WebApplication'
}

// Generate Organization schema (for homepage, about page)
export function generateOrganizationSchema(customData = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: customData.name || SITE_CONFIG.name,
    url: customData.url || SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    description: customData.description || SITE_CONFIG.description,
    foundingDate: SITE_CONFIG.foundingDate,
    founders: SITE_CONFIG.founders.map(name => ({
      '@type': 'Person',
      name
    })),
    sameAs: Object.values(SITE_CONFIG.socialLinks),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@procreators.io',
      availableLanguage: ['English', 'Bengali']
    }
  }
}

// Generate SoftwareApplication schema (for tool pages)
export function generateToolSchema(toolId, toolData = {}) {
  const category = TOOL_CATEGORIES[toolId] || TOOL_CATEGORIES.default
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: toolData.name || formatToolName(toolId),
    description: toolData.description || `AI-powered ${formatToolName(toolId).toLowerCase()} tool by ProCreators`,
    url: `${SITE_CONFIG.url}/dashboard/tools/${toolId}`,
    applicationCategory: category,
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Works best in Chrome, Firefox, Safari, Edge.',
    softwareVersion: '2.0',
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: '50 credits to try all tools'
        },
        {
          '@type': 'Offer',
          name: 'Creator Plan',
          price: '19',
          priceCurrency: 'USD',
          description: '400 credits/month'
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '49',
          priceCurrency: 'USD',
          description: '1000 credits/month'
        },
        {
          '@type': 'Offer',
          name: 'Business Plan',
          price: '99',
          priceCurrency: 'USD',
          description: '3000 credits/month'
        }
      ]
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: toolData.rating?.value || DEFAULT_RATING.ratingValue,
      ratingCount: toolData.rating?.count || DEFAULT_RATING.ratingCount,
      bestRating: DEFAULT_RATING.bestRating,
      worstRating: DEFAULT_RATING.worstRating
    },
    featureList: toolData.features || getDefaultFeatures(toolId),
    screenshot: toolData.screenshot || `${SITE_CONFIG.url}/screenshots/${toolId}.png`,
    releaseNotes: 'Regular updates with new AI capabilities and improvements'
  }
}

// Generate Product schema (for pricing/landing pages)
export function generateProductSchema(productData = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name || `${SITE_CONFIG.name} - AI Content Creation Platform`,
    description: productData.description || SITE_CONFIG.description,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '4'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2500',
      bestRating: '5',
      worstRating: '1'
    },
    review: [
      {
        '@type': 'Review',
        author: { '@type': 'Person', name: 'Content Creator' },
        reviewRating: { '@type': 'Rating', ratingValue: '5' },
        reviewBody: 'ProCreators has transformed how I create content. The AI tools are incredible!'
      }
    ]
  }
}

// Generate FAQPage schema
export function generateFAQSchema(faqs = []) {
  if (!faqs.length) {
    // Default FAQs
    faqs = [
      {
        question: 'What is ProCreators?',
        answer: 'ProCreators is an AI-powered content creation platform that helps creators make professional videos, images, ebooks, and more in minutes.'
      },
      {
        question: 'How much does ProCreators cost?',
        answer: 'ProCreators offers a free plan with 50 credits, and paid plans starting at $19/month for Creator, $49/month for Pro, and $99/month for Business.'
      },
      {
        question: 'What types of content can I create?',
        answer: 'You can create AI videos, reels, thumbnails, ebooks, blog posts, social media content, educational materials, business documents, and much more.'
      },
      {
        question: 'Do I need any technical skills?',
        answer: 'No! ProCreators is designed for everyone. Our AI handles the complex work while you focus on your creative vision.'
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your credits remain valid until the end of your billing period.'
      }
    ]
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

// Generate WebSite schema (for homepage)
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/dashboard?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_CONFIG.url}${item.url}` : undefined
    }))
  }
}

// Generate combined schemas for different page types
export function generatePageSchemas(pageType, data = {}) {
  const schemas = []
  
  switch (pageType) {
    case 'homepage':
      schemas.push(generateOrganizationSchema())
      schemas.push(generateWebSiteSchema())
      schemas.push(generateProductSchema())
      schemas.push(generateFAQSchema(data.faqs))
      break
      
    case 'tool':
      schemas.push(generateToolSchema(data.toolId, data.toolData))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Tools', url: '/dashboard' },
        { name: data.toolData?.name || formatToolName(data.toolId) }
      ]))
      if (data.faqs?.length) {
        schemas.push(generateFAQSchema(data.faqs))
      }
      break
      
    case 'about':
      schemas.push(generateOrganizationSchema(data))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'About Us' }
      ]))
      break
      
    case 'pricing':
      schemas.push(generateProductSchema(data))
      schemas.push(generateFAQSchema(data.faqs))
      schemas.push(generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Pricing' }
      ]))
      break
      
    case 'faq':
      schemas.push(generateFAQSchema(data.faqs))
      break
      
    default:
      schemas.push(generateOrganizationSchema())
  }
  
  return schemas
}

// Helper: Format tool ID to readable name
function formatToolName(toolId) {
  return toolId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper: Get default features for a tool
function getDefaultFeatures(toolId) {
  const defaultFeatures = [
    'AI-Powered Generation',
    'Professional Quality Output',
    'Fast Processing',
    'Multiple Export Formats',
    'No Watermarks',
    'Cloud Storage'
  ]
  
  const categoryFeatures = {
    video: ['4K Resolution', 'Voice Synthesis', 'Background Music', 'Subtitles'],
    audio: ['Noise Reduction', 'Voice Enhancement', 'Multiple Languages', 'Studio Quality'],
    image: ['High Resolution', 'Multiple Styles', 'Brand Colors', 'Templates'],
    writing: ['SEO Optimization', 'Multiple Tones', 'Grammar Check', 'Plagiarism Free'],
    social: ['Platform Optimized', 'Hashtag Suggestions', 'Scheduling', 'Analytics'],
    education: ['Curriculum Aligned', 'Multiple Formats', 'Student Friendly', 'Printable'],
    business: ['Professional Templates', 'Data Visualization', 'Export to PDF', 'Collaboration']
  }
  
  // Determine category from tool ID
  let category = 'default'
  if (toolId.includes('video') || toolId.includes('reel')) category = 'video'
  else if (toolId.includes('voice') || toolId.includes('audio') || toolId.includes('noise')) category = 'audio'
  else if (toolId.includes('image') || toolId.includes('thumbnail') || toolId.includes('cover') || toolId.includes('avatar')) category = 'image'
  else if (toolId.includes('blog') || toolId.includes('copy') || toolId.includes('email') || toolId.includes('letter')) category = 'writing'
  else if (toolId.includes('thread') || toolId.includes('linkedin') || toolId.includes('carousel') || toolId.includes('quote')) category = 'social'
  else if (toolId.includes('lesson') || toolId.includes('study') || toolId.includes('exam') || toolId.includes('quiz')) category = 'education'
  else if (toolId.includes('business') || toolId.includes('pitch') || toolId.includes('strategy')) category = 'business'
  
  return [...defaultFeatures, ...(categoryFeatures[category] || [])]
}

// Export utility to render schema as JSON-LD script
export function renderSchemaScript(schemas) {
  if (!Array.isArray(schemas)) schemas = [schemas]
  
  return schemas.map((schema, index) => 
    `<script type="application/ld+json" key="schema-${index}">${JSON.stringify(schema, null, 0)}</script>`
  ).join('\n')
}
