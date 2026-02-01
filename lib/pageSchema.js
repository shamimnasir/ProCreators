// Tool Page Schema and Block Types
// Used for the block-based CMS system

export const BLOCK_TYPES = {
  HERO: 'hero',
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  FEATURES: 'features',
  FAQ: 'faq',
  IMAGE: 'image',
  VIDEO: 'video',
  CTA: 'cta',
  TESTIMONIALS: 'testimonials',
  PRICING: 'pricing',
  STEPS: 'steps',
  STATS: 'stats',
  DIVIDER: 'divider',
  CUSTOM_HTML: 'custom_html',
  GALLERY: 'gallery',
  COMPARISON: 'comparison'
}

export const BLOCK_TEMPLATES = {
  [BLOCK_TYPES.HERO]: {
    title: '',
    subtitle: '',
    backgroundImage: '',
    ctaText: 'Get Started',
    ctaLink: '',
    alignment: 'center' // left, center, right
  },
  [BLOCK_TYPES.HEADING]: {
    text: '',
    level: 'h2', // h1, h2, h3, h4
    alignment: 'left'
  },
  [BLOCK_TYPES.PARAGRAPH]: {
    text: '',
    alignment: 'left'
  },
  [BLOCK_TYPES.FEATURES]: {
    title: 'Features',
    subtitle: '',
    columns: 3,
    items: [
      { icon: '✨', title: 'Feature 1', description: 'Description here' },
      { icon: '🚀', title: 'Feature 2', description: 'Description here' },
      { icon: '💡', title: 'Feature 3', description: 'Description here' }
    ]
  },
  [BLOCK_TYPES.FAQ]: {
    title: 'Frequently Asked Questions',
    items: [
      { question: 'Question 1?', answer: 'Answer 1' },
      { question: 'Question 2?', answer: 'Answer 2' }
    ]
  },
  [BLOCK_TYPES.IMAGE]: {
    url: '',
    alt: '',
    caption: '',
    width: 'full', // full, large, medium, small
    alignment: 'center'
  },
  [BLOCK_TYPES.VIDEO]: {
    url: '',
    title: '',
    autoplay: false
  },
  [BLOCK_TYPES.CTA]: {
    title: '',
    subtitle: '',
    buttonText: 'Get Started',
    buttonLink: '',
    style: 'primary' // primary, secondary, gradient
  },
  [BLOCK_TYPES.TESTIMONIALS]: {
    title: 'What Our Users Say',
    items: [
      { quote: 'Amazing tool!', author: 'John Doe', role: 'Designer', avatar: '' }
    ]
  },
  [BLOCK_TYPES.PRICING]: {
    title: 'Pricing',
    subtitle: '',
    plans: [
      { name: 'Free', price: '$0', period: 'month', features: ['Feature 1'], ctaText: 'Start Free', highlighted: false },
      { name: 'Pro', price: '$19', period: 'month', features: ['All Free features', 'Feature 2'], ctaText: 'Go Pro', highlighted: true }
    ]
  },
  [BLOCK_TYPES.STEPS]: {
    title: 'How It Works',
    items: [
      { step: 1, title: 'Step 1', description: 'Description' },
      { step: 2, title: 'Step 2', description: 'Description' },
      { step: 3, title: 'Step 3', description: 'Description' }
    ]
  },
  [BLOCK_TYPES.STATS]: {
    items: [
      { value: '10K+', label: 'Users' },
      { value: '50K+', label: 'Downloads' },
      { value: '4.9', label: 'Rating' }
    ]
  },
  [BLOCK_TYPES.DIVIDER]: {
    style: 'line', // line, dots, space
    spacing: 'medium' // small, medium, large
  },
  [BLOCK_TYPES.CUSTOM_HTML]: {
    html: ''
  },
  [BLOCK_TYPES.GALLERY]: {
    title: '',
    columns: 3,
    images: []
  },
  [BLOCK_TYPES.COMPARISON]: {
    title: 'Compare Plans',
    features: [],
    plans: []
  }
}

// Default page template for new tool pages
export const getDefaultPageTemplate = (toolId, toolName) => ({
  toolId,
  slug: `/dashboard/tools/${toolId}`,
  seo: {
    metaTitle: `${toolName} | ProCreators`,
    metaDescription: `Create amazing ${toolName.toLowerCase()} with AI-powered tools. Fast, easy, and professional results.`,
    keywords: [toolName.toLowerCase(), 'ai', 'creator', 'generator'],
    ogImage: ''
  },
  contentBlocks: [
    {
      id: `block-${Date.now()}-1`,
      type: BLOCK_TYPES.HERO,
      content: {
        title: toolName,
        subtitle: `Create professional ${toolName.toLowerCase()} in minutes with AI`,
        ctaText: 'Start Creating',
        ctaLink: '#tool',
        alignment: 'center'
      },
      order: 0
    },
    {
      id: `block-${Date.now()}-2`,
      type: BLOCK_TYPES.FEATURES,
      content: {
        title: 'Why Use Our Tool?',
        subtitle: '',
        columns: 3,
        items: [
          { icon: '⚡', title: 'Fast & Easy', description: 'Create in minutes, not hours' },
          { icon: '🎨', title: 'Professional Quality', description: 'Beautiful designs every time' },
          { icon: '💰', title: 'Sell & Profit', description: 'Ready to sell on Etsy, Gumroad & more' }
        ]
      },
      order: 1
    }
  ],
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Validate block content
export const validateBlock = (type, content) => {
  const template = BLOCK_TEMPLATES[type]
  if (!template) return { valid: false, error: 'Invalid block type' }
  return { valid: true }
}
