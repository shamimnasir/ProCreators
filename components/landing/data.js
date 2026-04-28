// Landing Page Data Constants
// Centralized data for all landing page sections

import {
  Video,
  Film,
  BookOpen,
  FileText,
  Mic,
  Layers,
  TrendingUp,
  Rocket,
  Heart,
  Megaphone,
  BadgeDollarSign,
  Building2,
  GraduationCap,
  Briefcase,
  Image as ImageIcon,
  Play,
  Clock,
  Users,
  Star as StarIcon
} from 'lucide-react'

export const homepageFAQs = [
  {
    question: 'What is ProCreators?',
    answer: 'ProCreators is a content creation platform with 70+ tools that helps creators make professional videos, images, ebooks, social media posts, and more in minutes.'
  },
  {
    question: 'How much does ProCreators cost?',
    answer: 'ProCreators offers a free plan with 25 credits to try all tools for 30 days. Paid plans start at $19/month for Creator (1,000 credits — about 7 AI video clips or 8 UGC ads at 15s), $49/month for Pro (2,500 credits — about 17 AI video clips or 20 UGC ads), and $99/month for Business (5,000 credits — about 35 AI video clips or 40 UGC ads). Mix and match across every tool — credits are universal.'
  },
  {
    question: 'What types of content can I create with ProCreators?',
    answer: 'You can create videos with voiceovers, Instagram/TikTok reels, YouTube thumbnails, ebooks, blog posts, social media threads, carousels, podcast covers, business plans, educational materials, and 70+ other content types.'
  },
  {
    question: 'Do I need technical skills to use ProCreators?',
    answer: 'Not at all. ProCreators is built for people who want results fast - not people who want to learn complicated software. Pick a tool, give it a topic, and get finished content in minutes.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no questions asked. Your remaining credits stay valid until the end of your billing period.'
  }
]

export const tools = [
  { name: 'AI Video Studio', icon: Video, desc: 'Full videos with voice & captions' },
  { name: 'Ebook Creator', icon: BookOpen, desc: 'Sell on Amazon KDP' },
  { name: 'Thumbnail Maker', icon: ImageIcon, desc: 'YouTube-ready thumbnails' },
  { name: 'Blog Writer', icon: FileText, desc: 'SEO-optimized articles' },
  { name: 'Carousel Maker', icon: Layers, desc: 'Social media carousels' },
  { name: 'Voice Studio', icon: Mic, desc: 'Natural-sounding voiceovers' },
]

export const features = [
  {
    icon: Layers,
    title: '70+ Tools, One Dashboard',
    description: 'Videos, ebooks, blogs, carousels, thumbnails, business plans - stop juggling 10 different apps.',
    gradient: 'from-purple-500 to-violet-500'
  },
  {
    icon: Video,
    title: 'Videos That Actually Get Views',
    description: 'Pick a theme, drop in your topic, and get a complete video with voiceover, captions, and music. Done in minutes.',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    icon: BookOpen,
    title: 'Digital Products You Can Sell',
    description: 'Create ebooks, planners, coloring books, and journals. List them on Amazon, Etsy, or Gumroad and start earning.',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    icon: TrendingUp,
    title: 'Social Media Content on Tap',
    description: 'Threads, carousels, quotes, LinkedIn posts - batch-create a month of content before your coffee gets cold.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: Play,
    title: 'Dead Simple to Use',
    description: 'No learning curve. No design skills. No complicated prompts. Just pick a tool, enter your topic, and hit create.',
    gradient: 'from-cyan-500 to-sky-500'
  },
  {
    icon: Rocket,
    title: 'From Idea to Finished in Minutes',
    description: 'What used to take a freelancer 3 days now takes you 5 minutes. More output, less overhead.',
    gradient: 'from-orange-500 to-amber-500'
  },
]

export const stats = [
  { number: '70+', label: 'Creation Tools', icon: Layers },
  { number: '2 min', label: 'Avg. Creation Time', icon: Clock },
  { number: '4.8/5', label: 'User Rating', icon: StarIcon },
  { number: '15K+', label: 'Creators Using It', icon: Users },
]

export const useCases = [
  {
    title: 'Content Creators',
    icon: Video,
    description: 'Batch-create reels, thumbnails, blog posts, and social content. Spend less time making stuff and more time growing your audience.',
    features: ['Complete videos with voiceovers', 'Click-worthy thumbnails', 'Weeks of posts in one sitting'],
    gradient: 'from-pink-500 to-rose-500',
    stat: '3× faster posting'
  },
  {
    title: 'Digital Marketers',
    icon: Megaphone,
    description: 'Produce campaign assets at scale. Blog posts, ad copy, social graphics - all from one place, all brand-consistent.',
    features: ['SEO blog posts in minutes', 'Ad copy and landing page text', 'Social content calendars'],
    gradient: 'from-orange-500 to-amber-500',
    stat: '15 hrs saved/week'
  },
  {
    title: 'Digital Product Sellers',
    icon: BadgeDollarSign,
    description: 'Build ebooks, planners, journals, and coloring books that sell on Amazon, Etsy, and Gumroad. Your new side hustle starts here.',
    features: ['KDP-ready ebooks with covers', 'Printable planners and journals', 'Coloring books for any niche'],
    gradient: 'from-emerald-500 to-green-500',
    stat: '$3K+ avg/month'
  },
  {
    title: 'Business Owners',
    icon: Building2,
    description: 'Create your own marketing materials, pitch decks, and business plans. No agency fees. No waiting around.',
    features: ['Professional slide decks', 'Business plans and proposals', 'Marketing strategy docs'],
    gradient: 'from-blue-500 to-indigo-500',
    stat: 'No agency fees'
  },
  {
    title: 'Educators & Coaches',
    icon: GraduationCap,
    description: 'Build course content, lesson plans, worksheets, and study guides that your students will actually use.',
    features: ['Lesson plans and quizzes', 'Worksheets and flashcards', 'Video explanations'],
    gradient: 'from-purple-500 to-violet-500',
    stat: 'Built for educators'
  },
  {
    title: 'Agencies & Freelancers',
    icon: Briefcase,
    description: 'Deliver more to your clients without adding headcount. Create at scale and charge what you\'re worth.',
    features: ['Bulk content creation', 'Client-ready exports', 'Multiple format outputs'],
    gradient: 'from-cyan-500 to-sky-500',
    stat: 'Scale without hiring'
  },
]

export const testimonials = [
  {
    name: 'Rakib Hassan',
    role: 'YouTube Creator',
    company: '500K+ Subscribers',
    initials: 'RH',
    image: '/testimonials/rakib.jpg',
    color: 'from-orange-500 to-amber-500',
    quote: 'I used to spend my entire weekend editing videos and making thumbnails. Now I batch-create a week of content on Monday morning. My channel has grown 3x since I started using this.'
  },
  {
    name: 'Priya Sharma',
    role: 'Marketing Lead',
    company: 'Agency Owner',
    initials: 'PS',
    image: '/testimonials/priya.jpg',
    color: 'from-pink-500 to-rose-500',
    quote: 'We replaced 4 different tools with ProCreators. The blog writer alone saves us 15 hours a week. My team was skeptical at first - now they refuse to go back.'
  },
  {
    name: 'James Wilson',
    role: 'KDP Publisher',
    company: 'Self-Published Author',
    initials: 'JW',
    image: '/testimonials/james.jpg',
    color: 'from-blue-500 to-cyan-500',
    quote: 'I\'ve published 12 ebooks and 6 coloring books using ProCreators in the last 3 months. The ebook tool is ridiculously fast. Already making $3K/month in royalties.'
  },
]

export const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '25 free credits (30-day trial)',
      'Access all 70+ tools',
      'Try everything risk-free',
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
      '1,000 credits — mix & match',
      '🎬 7 AI video clips (~60s)',
      '📣 8 UGC talking-head ads (15s)',
      '🎨 66 images / 📝 333 blogs',
      'All 70+ tools, no watermarks',
      'Email support'
    ],
    cta: 'Start Creating',
    popular: true
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    features: [
      '2,500 credits — best value',
      '🎬 17 AI video clips (~2.5 min)',
      '📣 10 UGC talking-head ads',
      '🎨 166 images / 📝 833 blogs',
      'Batch + 4K + brand kit',
      'Priority queue & support'
    ],
    cta: 'Go Pro',
    popular: false
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    features: [
      '5,000 credits — for teams',
      '🎬 35 AI video clips (~5 min)',
      '📣 40 UGC talking-head ads (15s)',
      '🎨 333 images / 📝 1.6K blogs',
      'Team (5) + API + brand kits',
      'Dedicated success manager'
    ],
    cta: 'Start Business',
    popular: false
  },
]

export const popularTools = [
  'AI Video Studio',
  'Thumbnail Maker',
  'Ebook Generator',
  'Carousel Creator',
  'Blog Writer',
  'Quote Maker',
  'Thread Creator',
  'Reels Creator'
]
