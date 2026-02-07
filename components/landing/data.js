// Landing Page Data Constants
// Centralized data for all landing page sections

import { 
  Video, Film, BookOpen, FileText, Mic, Layers, TrendingUp, Rocket, Heart,
  Megaphone, BadgeDollarSign, Building2, GraduationCap, Briefcase,
  Image as ImageIcon, Zap
} from 'lucide-react'

export const homepageFAQs = [
  {
    question: 'What is ProCreators?',
    answer: 'ProCreators is an AI-powered content creation platform that helps creators make professional videos, images, ebooks, social media posts, and more in minutes using advanced artificial intelligence.'
  },
  {
    question: 'How much does ProCreators cost?',
    answer: 'ProCreators offers a free plan with 50 credits to try all tools. Paid plans start at $19/month for Creator (400 credits), $49/month for Pro (1000 credits), and $99/month for Business (3000 credits).'
  },
  {
    question: 'What types of content can I create with ProCreators?',
    answer: 'You can create AI-generated videos, Instagram/TikTok reels, YouTube thumbnails, ebooks, blog posts, social media threads, carousels, podcast covers, business plans, educational materials, and 70+ other content types.'
  },
  {
    question: 'Do I need technical skills to use ProCreators?',
    answer: 'No technical skills required! ProCreators is designed for everyone - from beginners to professionals. Our AI handles all the complex work while you focus on your creative vision.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no questions asked. Your remaining credits stay valid until the end of your billing period.'
  }
]

export const tools = [
  { name: 'AI Video Studio', icon: Video, desc: '4K videos with voice & music' },
  { name: 'Quick Reels', icon: Film, desc: 'Viral TikTok & Instagram reels' },
  { name: 'Ebook Creator', icon: BookOpen, desc: 'Sell on Amazon KDP' },
  { name: 'Thumbnail Maker', icon: ImageIcon, desc: 'YouTube-ready thumbnails' },
  { name: 'Blog Writer', icon: FileText, desc: 'SEO-optimized articles' },
  { name: 'Voice Clone', icon: Mic, desc: 'Your voice, any language' },
]

export const features = [
  {
    icon: Layers,
    title: '70+ AI Tools in ONE Platform',
    description: 'Stop paying for 10 different tools. Get everything you need to dominate content creation.'
  },
  {
    icon: Video,
    title: 'AI Videos That Go VIRAL',
    description: 'Auto-generate reels, shorts, and long-form videos that rack up millions of views.'
  },
  {
    icon: BookOpen,
    title: 'Digital Products = Passive Income',
    description: 'Create ebooks, planners, coloring books, and courses to sell while you sleep.'
  },
  {
    icon: TrendingUp,
    title: 'Social Media on Autopilot',
    description: 'Threads, carousels, quotes, LinkedIn posts - schedule weeks of content in minutes.'
  },
  {
    icon: Sparkles,
    title: 'So Easy, Anyone Can Create',
    description: 'No design skills? No problem. Our AI does the heavy lifting - just click, create, and share.'
  },
  {
    icon: Rocket,
    title: 'From Idea to Income in Minutes',
    description: 'What used to take days now takes minutes. More content = more money.'
  },
]

export const stats = [
  { number: '70+', label: 'AI Tools', icon: Layers },
  { number: '1M+', label: 'Content Created', icon: FileText },
  { number: '99%', label: 'Addiction Rate', icon: Heart },
  { number: '∞', label: 'Creative Possibilities', icon: Rocket },
]

export const useCases = [
  {
    title: 'Content Creators',
    icon: Video,
    description: 'Stop struggling with content. Create viral reels, engaging posts, and professional videos that explode your growth.',
    image: '/api/placeholder/400/300',
    features: ['Auto-generate viral hooks', 'AI thumbnails that get clicks', 'Voice clone in any language']
  },
  {
    title: 'Digital Marketers',
    icon: Megaphone,
    description: 'Scale your campaigns with AI. Create months of content in hours. Yes, your boss will be impressed.',
    image: '/api/placeholder/400/300',
    features: ['SEO-optimized blog posts', 'Ad copy that converts', 'Social media on autopilot']
  },
  {
    title: 'Digital Product Sellers',
    icon: BadgeDollarSign,
    description: 'Create ebooks, planners, coloring books, and courses that sell on Amazon, Etsy, and Gumroad while you sleep.',
    image: '/api/placeholder/400/300',
    features: ['KDP-ready ebooks', 'Print-on-demand designs', 'Course content generator']
  },
  {
    title: 'Business Owners',
    icon: Building2,
    description: 'Stop paying agencies $5000/month. Do it yourself in 10 minutes. We won\'t tell anyone.',
    image: '/api/placeholder/400/300',
    features: ['Professional presentations', 'Business plans & proposals', 'Marketing materials']
  },
  {
    title: 'Educators & Coaches',
    icon: GraduationCap,
    description: 'Create engaging courses, lesson plans, and educational content that your students will actually love.',
    image: '/api/placeholder/400/300',
    features: ['Lesson plan generator', 'Quiz & worksheet maker', 'Video explanations in minutes']
  },
  {
    title: 'Agencies & Freelancers',
    icon: Briefcase,
    description: 'Deliver 10x more to your clients without hiring. White-label everything. Charge premium prices.',
    image: '/api/placeholder/400/300',
    features: ['Bulk content creation', 'Client folder management', 'Brand kit templates']
  },
]

export const testimonials = [
  {
    name: 'Rakib Hassan',
    role: 'YouTube Creator',
    company: '500K+ Subscribers',
    image: '/api/placeholder/100/100',
    quote: 'I was skeptical at first. Now I create 10x more content in half the time. My channel growth went crazy! 🚀'
  },
  {
    name: 'Priya Sharma',
    role: 'Digital Marketer',
    company: 'Agency Owner',
    image: '/api/placeholder/100/100',
    quote: 'Fired my content writer (sorry Amit). ProCreators writes better blog posts and never complains about deadlines. 😂'
  },
  {
    name: 'James Wilson',
    role: 'KDP Publisher',
    company: '$10K/month passive',
    image: '/api/placeholder/100/100',
    quote: 'Made $10,000 last month from ebooks created with ProCreators. The coloring book tool is absolutely insane!'
  },
]

export const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '50 free credits',
      'Access all 70+ tools',
      'Try before you buy',
      'No credit card needed'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Creator',
    price: '$19',
    period: '/mo',
    features: [
      '400 credits/month',
      'All 70+ AI tools',
      'No watermarks',
      'Bangla Voice Studio',
      '5% discount on extra credits',
      'Email support'
    ],
    cta: 'Get Creator',
    popular: true
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    features: [
      '1,000 credits/month',
      'Everything in Creator',
      'Auto-reel generator',
      'Batch generation',
      '10% discount on credits',
      'Priority support'
    ],
    cta: 'Go Pro',
    popular: false
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    features: [
      '3,000 credits/month',
      'Everything in Pro',
      'Team access (5 seats)',
      'API access',
      '15% discount on credits',
      'Dedicated support'
    ],
    cta: 'Get Business',
    popular: false
  },
]

export const popularTools = [
  'Auto Subtitles',
  'Script-to-Ad',
  'Thumbnail Maker',
  'Voice Clone',
  'Ebook Generator',
  'Reels Creator',
  'Talking Head',
  'Thread Creator'
]
