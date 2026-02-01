// Digital Products Configuration
// Money-making digital products that can be created with AI

export const DIGITAL_PRODUCT_CATEGORIES = [
  {
    id: 'printables',
    name: 'Printables & Planners',
    description: 'Create sellable printable products',
    icon: '📄',
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'planner-maker',
        name: 'Digital Planner Maker',
        description: 'Create customizable daily, weekly, monthly planners',
        icon: '📅',
        href: '/dashboard/tools/planner-maker',
        sellPrice: '$10-$30',
        platforms: ['Etsy', 'Gumroad', 'Creative Market'],
        badge: 'Popular'
      },
      {
        id: 'worksheet-maker',
        name: 'Worksheet Generator',
        description: 'Educational worksheets for all ages',
        icon: '📝',
        href: '/dashboard/tools/worksheet-maker',
        sellPrice: '$5-$20',
        platforms: ['Teachers Pay Teachers', 'Etsy'],
        badge: 'High Demand'
      },
      {
        id: 'coloring-book',
        name: 'Coloring Book Creator',
        description: 'AI-generated coloring pages and books',
        icon: '🎨',
        href: '/dashboard/tools/coloring-book',
        sellPrice: '$5-$15',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: 'Trending'
      },
      {
        id: 'journal-maker',
        name: 'Journal & Diary Maker',
        description: 'Guided journals, gratitude diaries, prompts',
        icon: '📓',
        href: '/dashboard/tools/journal-maker',
        sellPrice: '$10-$25',
        platforms: ['Amazon KDP', 'Gumroad'],
        badge: ''
      },
      {
        id: 'checklist-maker',
        name: 'Checklist & Tracker Maker',
        description: 'Habit trackers, goal trackers, checklists',
        icon: '✅',
        href: '/dashboard/tools/checklist-maker',
        sellPrice: '$3-$10',
        platforms: ['Etsy', 'Gumroad'],
        badge: ''
      }
    ]
  },
  {
    id: 'ebooks',
    name: 'Ebooks & Guides',
    description: 'Create and sell digital books',
    icon: '📚',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'ebook-maker',
        name: 'Ebook Creator',
        description: 'Full ebooks with AI writing assistance',
        icon: '📖',
        href: '/dashboard/tools/ebook-maker',
        sellPrice: '$10-$50',
        platforms: ['Amazon KDP', 'Gumroad'],
        badge: 'Best Seller'
      },
      {
        id: 'recipe-book',
        name: 'Recipe Book Maker',
        description: 'Cookbook and recipe collection creator',
        icon: '🍳',
        href: '/dashboard/tools/recipe-book',
        sellPrice: '$15-$40',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: ''
      },
      {
        id: 'guide-maker',
        name: 'How-To Guide Creator',
        description: 'Step-by-step tutorials and guides',
        icon: '📋',
        href: '/dashboard/tools/guide-maker',
        sellPrice: '$5-$30',
        platforms: ['Gumroad', 'Teachable'],
        badge: ''
      }
    ]
  },
  {
    id: 'templates',
    name: 'Templates & Assets',
    description: 'Digital templates for various platforms',
    icon: '🎭',
    color: 'from-orange-500 to-red-500',
    tools: [
      {
        id: 'notion-templates',
        name: 'Notion Template Maker',
        description: 'Productivity templates for Notion',
        icon: '📊',
        href: '/dashboard/tools/notion-templates',
        sellPrice: '$10-$40',
        platforms: ['Gumroad', 'Notion Marketplace'],
        badge: 'Hot'
      },
      {
        id: 'social-templates',
        name: 'Social Media Templates',
        description: 'Instagram, TikTok, Pinterest templates',
        icon: '📱',
        href: '/dashboard/tools/social-templates',
        sellPrice: '$15-$50',
        platforms: ['Etsy', 'Creative Market'],
        badge: 'Coming Soon',
        comingSoon: true
      },
      {
        id: 'resume-templates',
        name: 'Resume & CV Templates',
        description: 'Professional resume designs',
        icon: '💼',
        href: '/dashboard/tools/resume-templates',
        sellPrice: '$10-$25',
        platforms: ['Etsy', 'Creative Market'],
        badge: 'Coming Soon',
        comingSoon: true
      },
      {
        id: 'presentation-templates',
        name: 'Presentation Templates',
        description: 'PowerPoint, Keynote, Google Slides',
        icon: '📽️',
        href: '/dashboard/tools/slides-maker',
        sellPrice: '$15-$40',
        platforms: ['Creative Market', 'Etsy'],
        badge: ''
      }
    ]
  },
  {
    id: 'courses',
    name: 'Courses & Education',
    description: 'Educational content packages',
    icon: '🎓',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'course-creator',
        name: 'Mini Course Creator',
        description: 'Create sellable online courses',
        icon: '🎬',
        href: '/dashboard/tools/course-creator',
        sellPrice: '$50-$500',
        platforms: ['Teachable', 'Thinkific', 'Gumroad'],
        badge: 'Coming Soon',
        comingSoon: true
      },
      {
        id: 'flashcard-maker',
        name: 'Flashcard Pack Creator',
        description: 'Study flashcards and quiz cards',
        icon: '🃏',
        href: '/dashboard/tools/learning-cards',
        sellPrice: '$5-$15',
        platforms: ['Teachers Pay Teachers', 'Etsy'],
        badge: ''
      },
      {
        id: 'quiz-maker',
        name: 'Quiz & Test Creator',
        description: 'Educational quizzes and assessments',
        icon: '❓',
        href: '/dashboard/tools/quiz-maker',
        sellPrice: '$5-$20',
        platforms: ['Teachers Pay Teachers'],
        badge: ''
      }
    ]
  },
  {
    id: 'kids',
    name: 'Kids & Education',
    description: 'Products for children and parents',
    icon: '👶',
    color: 'from-yellow-500 to-orange-500',
    tools: [
      {
        id: 'storybook-maker',
        name: 'Children\'s Storybook',
        description: 'Illustrated stories for kids',
        icon: '📕',
        href: '/dashboard/tools/storybook-maker',
        sellPrice: '$10-$25',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: ''
      },
      {
        id: 'activity-book',
        name: 'Activity Book Creator',
        description: 'Games, puzzles, activities for kids',
        icon: '🎯',
        href: '/dashboard/tools/activity-book',
        sellPrice: '$8-$20',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: ''
      },
      {
        id: 'name-tracing',
        name: 'Name Tracing Worksheets',
        description: 'Personalized name practice sheets',
        icon: '✏️',
        href: '/dashboard/tools/name-tracing',
        sellPrice: '$3-$8',
        platforms: ['Etsy'],
        badge: 'Coming Soon',
        comingSoon: true
      }
    ]
  },
  {
    id: 'business',
    name: 'Business & Marketing',
    description: 'Business-focused digital products',
    icon: '💼',
    color: 'from-indigo-500 to-purple-500',
    tools: [
      {
        id: 'media-kit',
        name: 'Media Kit Creator',
        description: 'Professional media kits for influencers',
        icon: '📊',
        href: '/dashboard/tools/media-kit',
        sellPrice: '$20-$50',
        platforms: ['Gumroad', 'Etsy'],
        badge: ''
      },
      {
        id: 'invoice-maker',
        name: 'Invoice Templates',
        description: 'Professional invoice designs',
        icon: '🧾',
        href: '/dashboard/tools/invoice-maker',
        sellPrice: '$10-$25',
        platforms: ['Etsy', 'Creative Market'],
        badge: ''
      },
      {
        id: 'contract-maker',
        name: 'Contract Templates',
        description: 'Business contract templates',
        icon: '📜',
        href: '/dashboard/tools/contract-maker',
        sellPrice: '$15-$50',
        platforms: ['Etsy', 'Gumroad'],
        badge: ''
      }
    ]
  }
]

// Get all tools flat list
export const getAllDigitalProductTools = () => {
  return DIGITAL_PRODUCT_CATEGORIES.flatMap(cat => cat.tools)
}

// Get tool by ID
export const getDigitalProductTool = (toolId) => {
  for (const cat of DIGITAL_PRODUCT_CATEGORIES) {
    const tool = cat.tools.find(t => t.id === toolId)
    if (tool) return { ...tool, category: cat.name }
  }
  return null
}

// Get category by ID
export const getDigitalProductCategory = (catId) => {
  return DIGITAL_PRODUCT_CATEGORIES.find(c => c.id === catId)
}
