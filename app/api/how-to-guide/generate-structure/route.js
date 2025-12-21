import { NextResponse } from 'next/server'

// Keyword-based content database - matched against user's title
const TOPIC_DATABASE = {
  // KDP / Self-Publishing topics
  'kdp': {
    title: 'How to Start a KDP Business',
    subtitle: 'Your Complete Guide to Self-Publishing on Amazon',
    introduction: 'Amazon Kindle Direct Publishing (KDP) offers one of the best opportunities to build a passive income stream. This guide will teach you everything you need to know to launch, grow, and scale your KDP publishing business.',
    chapters: [
      {
        title: 'Understanding the KDP Opportunity',
        sections: [
          { title: 'What is KDP?', content: 'Amazon Kindle Direct Publishing allows anyone to self-publish ebooks and paperbacks. With over 300 million customers, Amazon provides instant access to a massive market.', steps: ['Create a free KDP account at kdp.amazon.com', 'Understand the difference between ebooks and paperbacks', 'Learn about royalty structures (35% vs 70%)', 'Explore the different book categories', 'Research successful KDP publishers'], tips: 'Start with low-content books (journals, planners) - they require less upfront work and can generate passive income quickly.' },
          { title: 'Types of Books You Can Publish', content: 'KDP supports various book types, each with different profit potential and effort requirements.', steps: ['Low-content books: journals, planners, notebooks', 'Medium-content: coloring books, puzzle books, workbooks', 'High-content: ebooks, novels, how-to guides', 'Audiobooks via ACX integration', 'Print-on-demand paperbacks'], tips: 'Low-content books are perfect for beginners - you can create a journal in under an hour using free tools.' }
        ]
      },
      {
        title: 'Finding Profitable Niches',
        sections: [
          { title: 'Niche Research Methods', content: 'Success on KDP starts with choosing the right niche. A good niche has demand but manageable competition.', steps: ['Use Amazon search to find popular categories', 'Check BSR (Best Seller Rank) of top books', 'Look for niches with BSR under 100,000', 'Analyze competitor reviews for gaps', 'Use tools like Publisher Rocket or Book Bolt'], tips: 'A book with BSR 50,000 sells roughly 3-5 copies per day. Look for niches where top books have BSR 10,000-100,000.' },
          { title: 'Validating Your Niche', content: 'Before creating your book, validate that people will actually buy it.', steps: ['Count books in your niche category', 'Check if top books have recent reviews', 'Look for seasonal vs evergreen demand', 'Calculate potential monthly revenue', 'Test with a single book before scaling'], tips: 'Avoid niches where all top books are from big publishers - they have advantages you cannot match.' }
        ]
      },
      {
        title: 'Creating Your First Book',
        sections: [
          { title: 'Book Interior Design', content: 'Your book interior needs to be professionally formatted to meet KDP requirements and please customers.', steps: ['Choose your trim size (6x9 is most common)', 'Set up proper margins for binding', 'Use consistent fonts and formatting', 'Add page numbers and headers', 'Export as print-ready PDF'], tips: 'Use Canva (free) or Adobe InDesign for interior design. Templates save hours of work.' },
          { title: 'Cover Design That Sells', content: 'Your cover is the most important marketing asset - it must stand out in search results.', steps: ['Study top-selling covers in your niche', 'Use bold, readable fonts', 'Keep design simple and uncluttered', 'Ensure thumbnail looks good (most views are tiny)', 'Use high-resolution images (300 DPI)'], tips: 'Hire a cover designer on Fiverr ($20-50) if design is not your strength - a good cover can 10x your sales.' }
        ]
      },
      {
        title: 'Publishing and Optimization',
        sections: [
          { title: 'The Publishing Process', content: 'Publishing on KDP is straightforward once you have your files ready.', steps: ['Upload your manuscript PDF', 'Upload your cover (use KDP cover calculator)', 'Write compelling book description', 'Choose categories and keywords', 'Set your price strategically'], tips: 'Price paperbacks at $9.99-$14.99 for best balance of royalties and sales volume.' },
          { title: 'Keyword and Category Strategy', content: 'The right keywords help customers find your book in Amazon search.', steps: ['Research keywords with Publisher Rocket', 'Use all 7 keyword slots', 'Include misspellings and variations', 'Choose 2 relevant categories', 'Request additional categories via support'], tips: 'Put your most important keyword in your title or subtitle - this boosts search ranking significantly.' }
        ]
      },
      {
        title: 'Scaling Your KDP Business',
        sections: [
          { title: 'Building a Publishing System', content: 'To generate significant income, you need to publish consistently and efficiently.', steps: ['Create templates for faster production', 'Batch similar tasks together', 'Outsource cover design and formatting', 'Track all books in a spreadsheet', 'Reinvest profits into more books'], tips: 'Aim to publish 1-4 books per week. Volume is key - most KDP millionaires have 100+ books.' },
          { title: 'Advanced Growth Strategies', content: 'Once you have a catalog, use advanced strategies to maximize revenue.', steps: ['Create book series for repeat buyers', 'Run Amazon Ads campaigns', 'Build an email list for launches', 'Expand to other marketplaces', 'Create hardcover editions'], tips: 'Amazon Ads can be profitable at $0.10-0.30 per click. Start with $5/day and scale winners.' }
        ]
      }
    ]
  },
  
  // Self-publishing / Amazon
  'publishing': {
    title: 'How to Self-Publish Your Book',
    subtitle: 'From Manuscript to Marketplace',
    introduction: 'Self-publishing has revolutionized the book industry. This guide shows you how to take your book from idea to published product.',
    chapters: [
      {
        title: 'Preparing Your Manuscript',
        sections: [
          { title: 'Editing and Proofreading', content: 'A polished manuscript is essential for success.', steps: ['Complete your first draft', 'Take a break before editing', 'Do multiple editing passes', 'Hire a professional editor', 'Use beta readers for feedback'], tips: 'Never publish without at least one other person reviewing your work.' }
        ]
      },
      {
        title: 'Choosing Your Publishing Platform',
        sections: [
          { title: 'Platform Comparison', content: 'Each platform has pros and cons.', steps: ['Amazon KDP for widest reach', 'IngramSpark for bookstore distribution', 'Draft2Digital for wide distribution', 'Lulu for specialty printing', 'Consider going exclusive vs wide'], tips: 'Start with KDP Select for the first 90 days to maximize visibility.' }
        ]
      }
    ]
  },

  // Online Business
  'business': {
    title: 'How to Start a Successful Online Business',
    subtitle: 'Your Complete Step-by-Step Guide to Entrepreneurship',
    introduction: 'Starting an online business has never been more accessible. This comprehensive guide will walk you through every step of launching, growing, and scaling your digital venture.',
    chapters: [
      {
        title: 'Finding Your Profitable Niche',
        sections: [
          { title: 'Market Research Fundamentals', content: 'Learn how to identify gaps in the market and validate your business idea before investing time and money.', steps: ['Identify your passions and skills', 'Research market demand using Google Trends', 'Analyze competitor offerings', 'Survey potential customers', 'Calculate market size and opportunity'], tips: 'Focus on solving a specific problem rather than creating a product first.' },
          { title: 'Validating Your Business Idea', content: 'Before launching, you need to confirm people will actually pay for your solution.', steps: ['Create a minimum viable product (MVP)', 'Set up a landing page to gauge interest', 'Run small paid ads to test demand', 'Collect email signups', 'Conduct customer interviews'], tips: 'Aim for at least 100 email signups before building your full product.' }
        ]
      },
      {
        title: 'Setting Up Your Online Presence',
        sections: [
          { title: 'Choosing the Right Platform', content: 'Select the best platform for your business type and technical abilities.', steps: ['Compare Shopify, WordPress, and Squarespace', 'Consider your budget and growth plans', 'Evaluate ease of use vs customization', 'Check payment processing options', 'Review SEO capabilities'], tips: 'Start simple - you can always migrate to a more complex platform later.' },
          { title: 'Building Your Website', content: 'Create a professional website that converts visitors into customers.', steps: ['Choose a clean, professional theme', 'Write compelling copy for each page', 'Add high-quality images', 'Set up essential pages (About, Contact, FAQ)', 'Implement SSL security'], tips: 'Your homepage should clearly communicate what you offer within 5 seconds.' }
        ]
      },
      {
        title: 'Marketing Your Business',
        sections: [
          { title: 'Content Marketing Strategy', content: 'Build authority and attract customers through valuable content.', steps: ['Identify your target keywords', 'Create a content calendar', 'Write helpful blog posts', 'Repurpose content across platforms', 'Build an email list'], tips: 'Consistency beats perfection - publish regularly rather than waiting for perfect content.' },
          { title: 'Social Media Marketing', content: 'Leverage social platforms to build your brand and drive traffic.', steps: ['Choose 2-3 platforms where your audience hangs out', 'Create a posting schedule', 'Engage authentically with your community', 'Use hashtags strategically', 'Collaborate with influencers'], tips: 'Focus on providing value first, selling second.' }
        ]
      },
      {
        title: 'Scaling Your Business',
        sections: [
          { title: 'Growth Strategies', content: 'Take your business to the next level with proven scaling tactics.', steps: ['Analyze your best-performing channels', 'Double down on what works', 'Hire your first team member', 'Explore partnerships and affiliates', 'Consider new product lines'], tips: 'Scale slowly and sustainably - rapid growth without systems leads to chaos.' }
        ]
      }
    ]
  },

  // Passive Income
  'passive': {
    title: 'How to Build Passive Income Streams',
    subtitle: 'Create Income That Works While You Sleep',
    introduction: 'Passive income is money earned with minimal ongoing effort. This guide shows you proven methods to build multiple income streams.',
    chapters: [
      {
        title: 'Understanding Passive Income',
        sections: [
          { title: 'Types of Passive Income', content: 'Different passive income streams require different skills and capital.', steps: ['Digital products (ebooks, courses)', 'Print-on-demand products', 'Affiliate marketing', 'Dividend investing', 'Rental income'], tips: 'Start with digital products - they have zero inventory costs and unlimited scalability.' }
        ]
      },
      {
        title: 'Digital Product Creation',
        sections: [
          { title: 'Creating Products That Sell', content: 'Digital products can be sold infinitely with no additional cost.', steps: ['Identify a problem you can solve', 'Create valuable content', 'Package it professionally', 'Set up automated delivery', 'Market through content'], tips: 'One successful digital product can generate income for years.' }
        ]
      }
    ]
  },

  // Photography
  'photography': {
    title: 'How to Master Digital Photography',
    subtitle: 'From Beginner to Professional Photographer',
    introduction: 'Photography is both an art and a science. This guide will teach you the technical foundations and creative techniques used by professional photographers.',
    chapters: [
      {
        title: 'Understanding Your Camera',
        sections: [
          { title: 'Camera Basics Explained', content: 'Learn the fundamental controls and settings of your digital camera.', steps: ['Understand aperture and its effects', 'Master shutter speed', 'Learn ISO sensitivity', 'Practice with manual mode', 'Explore white balance settings'], tips: 'Spend a week shooting in manual mode only - this accelerates your learning dramatically.' },
          { title: 'Lenses and Their Uses', content: 'Different lenses create different effects - learn which to use when.', steps: ['Understand focal length', 'Learn about prime vs zoom lenses', 'Explore wide-angle photography', 'Master telephoto techniques', 'Experiment with macro photography'], tips: 'A 50mm prime lens is the best investment for beginners.' }
        ]
      },
      {
        title: 'Composition Fundamentals',
        sections: [
          { title: 'The Rule of Thirds', content: 'The most fundamental composition technique.', steps: ['Enable the grid on your camera', 'Place subjects on intersection points', 'Use horizontal lines for landscapes', 'Break the rule intentionally for effect', 'Analyze professional photos'], tips: 'The rule of thirds is a starting point, not a requirement.' }
        ]
      }
    ]
  },

  // Cooking / Recipes
  'cooking': {
    title: 'How to Cook Like a Professional',
    subtitle: 'Master Kitchen Skills and Techniques',
    introduction: 'Cooking is a life skill that saves money and improves health. This guide teaches you professional techniques for home cooking.',
    chapters: [
      {
        title: 'Kitchen Essentials',
        sections: [
          { title: 'Must-Have Equipment', content: 'Build your kitchen toolkit without breaking the bank.', steps: ['Get a quality chef knife', 'Invest in a cutting board', 'Buy a reliable pan set', 'Get measuring tools', 'Add mixing bowls and utensils'], tips: 'One good knife beats ten mediocre ones.' }
        ]
      },
      {
        title: 'Fundamental Techniques',
        sections: [
          { title: 'Cooking Methods', content: 'Master these techniques and you can cook anything.', steps: ['Learn to saute properly', 'Master braising for tender meats', 'Understand roasting temperatures', 'Practice proper seasoning', 'Learn sauce basics'], tips: 'Salt your food in layers as you cook, not just at the end.' }
        ]
      }
    ]
  },

  // Programming / Coding
  'programming': {
    title: 'How to Learn Programming',
    subtitle: 'From Zero to Developer',
    introduction: 'Programming is one of the most valuable skills you can learn. This guide will take you from complete beginner to writing real code.',
    chapters: [
      {
        title: 'Getting Started with Coding',
        sections: [
          { title: 'Choosing Your First Language', content: 'Pick the right programming language for your goals.', steps: ['Python for beginners and data science', 'JavaScript for web development', 'Swift for iOS apps', 'Java for enterprise and Android', 'C++ for systems and games'], tips: 'Python is the best first language - readable and versatile.' },
          { title: 'Setting Up Your Environment', content: 'Configure your development tools for success.', steps: ['Install a code editor (VS Code)', 'Set up version control with Git', 'Learn command line basics', 'Configure your terminal', 'Install language-specific tools'], tips: 'Invest time learning your editor shortcuts.' }
        ]
      },
      {
        title: 'Writing Clean Code',
        sections: [
          { title: 'Code Quality Basics', content: 'Write code that others can understand.', steps: ['Use meaningful variable names', 'Keep functions small and focused', 'Comment complex logic', 'Follow language conventions', 'Write tests for your code'], tips: 'If you have to explain your code too much, it is probably too complex.' }
        ]
      }
    ]
  },

  // Fitness / Exercise
  'fitness': {
    title: 'How to Get Fit and Stay Healthy',
    subtitle: 'Your Complete Fitness Guide',
    introduction: 'Fitness is the foundation of a healthy life. This guide provides a practical approach to exercise and wellness.',
    chapters: [
      {
        title: 'Building Your Foundation',
        sections: [
          { title: 'Setting Fitness Goals', content: 'Define clear, achievable fitness objectives.', steps: ['Assess your current fitness level', 'Set SMART goals', 'Choose your training style', 'Create a realistic schedule', 'Track your progress'], tips: 'Start with habits, not goals - show up consistently.' }
        ]
      },
      {
        title: 'Exercise Fundamentals',
        sections: [
          { title: 'Movement Patterns', content: 'Master the basic movements for a complete workout.', steps: ['Push movements (push-ups, presses)', 'Pull movements (rows, pull-ups)', 'Squat patterns', 'Hinge movements (deadlifts)', 'Core stability'], tips: 'Form over weight always.' }
        ]
      }
    ]
  },

  // Marketing
  'marketing': {
    title: 'How to Master Digital Marketing',
    subtitle: 'Attract Customers and Grow Your Brand',
    introduction: 'Digital marketing is essential for any business today. This guide covers the strategies that actually work.',
    chapters: [
      {
        title: 'Understanding Your Audience',
        sections: [
          { title: 'Customer Research', content: 'Know your audience better than they know themselves.', steps: ['Create buyer personas', 'Research pain points', 'Analyze competitor audiences', 'Survey existing customers', 'Map the customer journey'], tips: 'Talk to your customers directly.' }
        ]
      },
      {
        title: 'Marketing Channels',
        sections: [
          { title: 'Choosing Your Channels', content: 'Focus on channels where your audience spends time.', steps: ['Evaluate social platforms', 'Consider email marketing', 'Explore content marketing', 'Test paid advertising', 'Build community'], tips: 'Master one channel before expanding.' }
        ]
      }
    ]
  },

  // Writing
  'writing': {
    title: 'How to Become a Better Writer',
    subtitle: 'Master the Craft of Writing',
    introduction: 'Good writing is a skill that can be learned. This guide will help you improve your writing for any purpose.',
    chapters: [
      {
        title: 'The Writing Process',
        sections: [
          { title: 'From Idea to Draft', content: 'Transform ideas into compelling written content.', steps: ['Brainstorm without editing', 'Outline your structure', 'Write the first draft quickly', 'Let it rest before editing', 'Revise and refine'], tips: 'Separate writing and editing.' }
        ]
      },
      {
        title: 'Writing Techniques',
        sections: [
          { title: 'Engaging Your Reader', content: 'Keep readers hooked from start to finish.', steps: ['Start with a hook', 'Use active voice', 'Vary sentence length', 'Show, do not tell', 'End with impact'], tips: 'Read your writing aloud.' }
        ]
      }
    ]
  },

  // Investing / Finance
  'investing': {
    title: 'How to Start Investing',
    subtitle: 'Build Wealth with Smart Investment Strategies',
    introduction: 'Investing is how ordinary people build wealth. This guide makes investing accessible and understandable.',
    chapters: [
      {
        title: 'Investment Fundamentals',
        sections: [
          { title: 'Why Invest?', content: 'Understanding the power of compound growth.', steps: ['Calculate the cost of waiting', 'Understand compound interest', 'Learn about inflation impact', 'Set clear financial goals', 'Determine your timeline'], tips: 'Time in the market beats timing the market.' },
          { title: 'Types of Investments', content: 'An overview of investment vehicles available to you.', steps: ['Learn about stocks and equity', 'Understand bonds and fixed income', 'Explore mutual funds and ETFs', 'Consider real estate options', 'Evaluate cryptocurrency basics'], tips: 'Diversification is your best protection.' }
        ]
      }
    ]
  },

  // Etsy
  'etsy': {
    title: 'How to Start an Etsy Business',
    subtitle: 'Sell Handmade and Digital Products Online',
    introduction: 'Etsy is one of the best platforms for selling creative products. This guide shows you how to build a successful Etsy shop.',
    chapters: [
      {
        title: 'Setting Up Your Etsy Shop',
        sections: [
          { title: 'Shop Creation', content: 'Create a professional Etsy presence.', steps: ['Create your Etsy account', 'Choose a memorable shop name', 'Set up payment processing', 'Write your shop policies', 'Create your shop banner'], tips: 'Your shop name should be memorable and reflect what you sell.' }
        ]
      },
      {
        title: 'Product Listings That Sell',
        sections: [
          { title: 'Listing Optimization', content: 'Create listings that rank and convert.', steps: ['Write keyword-rich titles', 'Use all 13 tags', 'Write detailed descriptions', 'Price competitively', 'Take professional photos'], tips: 'The first 40 characters of your title are most important for search.' }
        ]
      }
    ]
  }
}

// Keywords that map to specific topics
const KEYWORD_MAPPINGS = {
  'kdp': ['kdp', 'kindle', 'amazon publish', 'self-publish', 'low content', 'low-content'],
  'publishing': ['publish', 'book', 'author', 'manuscript', 'ebook'],
  'business': ['business', 'entrepreneur', 'startup', 'company', 'venture'],
  'passive': ['passive income', 'passive', 'income stream'],
  'photography': ['photo', 'camera', 'photograph'],
  'cooking': ['cook', 'recipe', 'kitchen', 'food', 'chef', 'baking'],
  'programming': ['program', 'code', 'coding', 'developer', 'software', 'web development', 'app'],
  'fitness': ['fitness', 'exercise', 'gym', 'workout', 'health', 'weight loss', 'muscle'],
  'marketing': ['marketing', 'advertis', 'seo', 'social media', 'content marketing'],
  'writing': ['writ', 'author', 'blog', 'copywriting', 'content'],
  'investing': ['invest', 'stock', 'finance', 'money', 'wealth', 'trading'],
  'etsy': ['etsy', 'handmade', 'craft']
}

// Fallback generic content
const GENERIC_GUIDE = {
  title: 'Complete How-To Guide',
  subtitle: 'A Step-by-Step Guide to Success',
  introduction: 'This comprehensive guide will walk you through everything you need to know to achieve your goals.',
  chapters: [
    {
      title: 'Getting Started',
      sections: [
        { title: 'Understanding the Basics', content: 'Before diving in, it is important to understand the fundamentals.', steps: ['Research the topic thoroughly', 'Identify your specific goals', 'Gather necessary resources', 'Create a timeline', 'Set measurable milestones'], tips: 'Start with the end in mind - knowing your goal helps you plan the path.' }
      ]
    },
    {
      title: 'Building Your Foundation',
      sections: [
        { title: 'Essential Skills', content: 'Master these fundamental skills to set yourself up for success.', steps: ['Learn the core concepts', 'Practice consistently', 'Get feedback from others', 'Study successful examples', 'Apply what you learn'], tips: 'Consistency beats intensity - small daily progress adds up.' }
      ]
    },
    {
      title: 'Taking Action',
      sections: [
        { title: 'Implementation Steps', content: 'Put your knowledge into action with these practical steps.', steps: ['Start with the simplest task', 'Build momentum gradually', 'Track your progress', 'Adjust as needed', 'Celebrate small wins'], tips: 'Done is better than perfect - start now and improve as you go.' }
      ]
    },
    {
      title: 'Overcoming Challenges',
      sections: [
        { title: 'Common Obstacles', content: 'Everyone faces challenges - here is how to overcome them.', steps: ['Identify potential roadblocks', 'Prepare backup plans', 'Seek help when stuck', 'Learn from failures', 'Stay persistent'], tips: 'Obstacles are opportunities to learn and grow stronger.' }
      ]
    },
    {
      title: 'Achieving Mastery',
      sections: [
        { title: 'Advanced Strategies', content: 'Take your skills to the next level with these advanced techniques.', steps: ['Refine your process', 'Teach others what you know', 'Stay updated with new developments', 'Network with experts', 'Continue learning always'], tips: 'True mastery comes from continuous improvement over time.' }
      ]
    }
  ]
}

function findMatchingTopic(title) {
  if (!title) return null
  
  const titleLower = title.toLowerCase()
  
  // Check each keyword mapping
  for (const [topicKey, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        console.log(`Matched keyword "${keyword}" to topic "${topicKey}"`)
        return TOPIC_DATABASE[topicKey] || null
      }
    }
  }
  
  return null
}

export async function POST(request) {
  try {
    const { guideType, title, chapterCount, targetAudience, difficulty } = await request.json()
    
    console.log(`Generating guide structure for title: "${title}", type: ${guideType}`)
    
    // First, try to match the title to specific content
    let matchedTopic = findMatchingTopic(title)
    
    // If no match and title has useful words, use generic but keep user's title
    let resultChapters = []
    let generatedTitle = title
    let generatedSubtitle = ''
    let generatedIntro = ''
    
    if (matchedTopic) {
      console.log(`Found matching topic for "${title}"`)
      resultChapters = [...matchedTopic.chapters]
      generatedSubtitle = matchedTopic.subtitle
      generatedIntro = matchedTopic.introduction
    } else {
      console.log(`No specific match for "${title}", using generic content`)
      resultChapters = [...GENERIC_GUIDE.chapters]
      generatedSubtitle = GENERIC_GUIDE.subtitle
      generatedIntro = GENERIC_GUIDE.introduction
    }
    
    // Limit to requested chapter count
    if (resultChapters.length > chapterCount) {
      resultChapters = resultChapters.slice(0, chapterCount)
    }
    
    // Fill remaining chapters if needed
    while (resultChapters.length < chapterCount) {
      const extraChapterNum = resultChapters.length + 1
      resultChapters.push({
        title: `Chapter ${extraChapterNum}: Additional Content`,
        sections: [
          {
            title: 'Key Concepts',
            content: 'Add your content for this section here.',
            steps: ['Step 1: Define your approach', 'Step 2: Take action', 'Step 3: Review results'],
            tips: 'Customize this section with your own expertise.'
          }
        ]
      })
    }
    
    return NextResponse.json({
      success: true,
      title: generatedTitle || 'My How-To Guide',
      subtitle: generatedSubtitle,
      introduction: generatedIntro,
      chapters: resultChapters
    })
    
  } catch (error) {
    console.error('Error generating guide structure:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate guide structure'
    }, { status: 500 })
  }
}
