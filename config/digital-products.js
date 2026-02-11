// Digital Products Configuration
// Money-making digital products that can be created with AI

// Icon name mapping for Lucide React icons
export const DIGITAL_ICON_MAP = {
  'FileText': 'FileText',
  'Calendar': 'Calendar',
  'ClipboardList': 'ClipboardList',
  'Palette': 'Palette',
  'BookOpen': 'BookOpen',
  'CheckSquare': 'CheckSquare',
  'BookMarked': 'BookMarked',
  'UtensilsCrossed': 'UtensilsCrossed',
  'FileQuestion': 'FileQuestion',
  'Layout': 'Layout',
  'Presentation': 'Presentation',
  'GraduationCap': 'GraduationCap',
  'Layers': 'Layers',
  'Baby': 'Baby',
  'Puzzle': 'Puzzle',
  'Target': 'Target'
}

export const DIGITAL_PRODUCT_CATEGORIES = [
  {
    id: 'printables',
    name: 'Printables & Planners',
    description: 'Create sellable printable products',
    icon: 'FileText',
    color: 'from-blue-500 to-blue-600',
    tools: [
      {
        id: 'planner-maker',
        name: 'Digital Planner Maker',
        description: 'Create customizable daily, weekly, monthly planners',
        icon: 'Calendar',
        href: '/dashboard/tools/planner-maker',
        sellPrice: '$10-$30',
        platforms: ['Etsy', 'Gumroad', 'Creative Market'],
        badge: 'Popular'
      },
      {
        id: 'worksheet-maker',
        name: 'Worksheet Generator',
        description: 'Educational worksheets for all ages',
        icon: 'ClipboardList',
        href: '/dashboard/tools/worksheet-maker',
        sellPrice: '$5-$20',
        platforms: ['Teachers Pay Teachers', 'Etsy'],
        badge: 'High Demand'
      },
      {
        id: 'coloring-book',
        name: 'Coloring Book Creator',
        description: 'AI-generated coloring pages and books',
        icon: 'Palette',
        href: '/dashboard/tools/coloring-book',
        sellPrice: '$5-$15',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: 'Trending'
      },
      {
        id: 'journal-maker',
        name: 'Journal & Diary Maker',
        description: 'Guided journals, gratitude diaries, prompts',
        icon: 'BookOpen',
        href: '/dashboard/tools/journal-maker',
        sellPrice: '$10-$25',
        platforms: ['Amazon KDP', 'Gumroad'],
        badge: ''
      },
      {
        id: 'checklist-maker',
        name: 'Checklist & Tracker Maker',
        description: 'Habit trackers, goal trackers, checklists',
        icon: 'CheckSquare',
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
    icon: 'BookMarked',
    color: 'from-purple-500 to-purple-600',
    tools: [
      {
        id: 'ebook-maker',
        name: 'Ebook Creator',
        description: 'Full ebooks with AI writing assistance',
        icon: 'BookOpen',
        href: '/dashboard/tools/ebook-maker',
        sellPrice: '$10-$50',
        platforms: ['Amazon KDP', 'Gumroad'],
        badge: 'Best Seller'
      },
      {
        id: 'recipe-book',
        name: 'Recipe Book Maker',
        description: 'Cookbook and recipe collection creator',
        icon: 'UtensilsCrossed',
        href: '/dashboard/tools/recipe-book',
        sellPrice: '$15-$40',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: ''
      },
      {
        id: 'guide-maker',
        name: 'How-To Guide Creator',
        description: 'Step-by-step tutorials and guides',
        icon: 'FileQuestion',
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
    icon: 'Layout',
    color: 'from-rose-500 to-rose-600',
    tools: [
      {
        id: 'notion-templates',
        name: 'Notion Template Maker',
        description: 'Productivity templates for Notion',
        icon: 'Layout',
        href: '/dashboard/tools/notion-templates',
        sellPrice: '$10-$40',
        platforms: ['Gumroad', 'Notion Marketplace'],
        badge: 'Hot'
      },
      {
        id: 'presentation-templates',
        name: 'Presentation Templates',
        description: 'PowerPoint, Keynote, Google Slides',
        icon: 'Presentation',
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
    icon: 'GraduationCap',
    color: 'from-emerald-500 to-emerald-600',
    tools: [
      {
        id: 'flashcard-maker',
        name: 'Flashcard Pack Creator',
        description: 'Study flashcards and quiz cards',
        icon: 'Layers',
        href: '/dashboard/tools/flashcards',
        sellPrice: '$5-$15',
        platforms: ['Teachers Pay Teachers', 'Etsy'],
        badge: ''
      },
      {
        id: 'quiz-maker',
        name: 'Quiz & Test Creator',
        description: 'Educational quizzes and assessments',
        icon: 'FileQuestion',
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
    icon: 'Baby',
    color: 'from-amber-500 to-amber-600',
    tools: [
      {
        id: 'storybook-maker',
        name: 'Children\'s Storybook',
        description: 'Illustrated stories for kids',
        icon: 'BookOpen',
        href: '/dashboard/tools/storybook-maker',
        sellPrice: '$10-$25',
        platforms: ['Amazon KDP', 'Etsy'],
        badge: ''
      },
      {
        id: 'activity-book',
        name: 'Activity Book Creator',
        description: 'Games, puzzles, activities for kids',
        icon: 'Puzzle',
        href: '/dashboard/tools/activity-book',
        sellPrice: '$8-$20',
        platforms: ['Amazon KDP', 'Etsy'],
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
