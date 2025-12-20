import { NextResponse } from 'next/server'

// Large database of guide content organized by type
const GUIDE_DATABASE = {
  'how-to': {
    topics: [
      {
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
            title: 'Managing Operations',
            sections: [
              { title: 'Tools and Systems', content: 'Set up the right tools to run your business efficiently.', steps: ['Choose an email marketing platform', 'Set up accounting software', 'Implement project management tools', 'Create standard operating procedures', 'Automate repetitive tasks'], tips: 'Document everything - this makes scaling and delegating much easier.' },
              { title: 'Customer Service Excellence', content: 'Build loyalty through exceptional customer experiences.', steps: ['Set up multiple contact channels', 'Create FAQ documentation', 'Respond quickly to inquiries', 'Handle complaints professionally', 'Ask for feedback and testimonials'], tips: 'A satisfied customer is your best marketing asset.' }
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
      {
        title: 'How to Master Digital Photography',
        subtitle: 'From Beginner to Professional Photographer',
        introduction: 'Photography is both an art and a science. This guide will teach you the technical foundations and creative techniques used by professional photographers.',
        chapters: [
          {
            title: 'Understanding Your Camera',
            sections: [
              { title: 'Camera Basics Explained', content: 'Learn the fundamental controls and settings of your digital camera.', steps: ['Understand aperture and its effects', 'Master shutter speed', 'Learn ISO sensitivity', 'Practice with manual mode', 'Explore white balance settings'], tips: 'Spend a week shooting in manual mode only - this accelerates your learning dramatically.' },
              { title: 'Lenses and Their Uses', content: 'Different lenses create different effects - learn which to use when.', steps: ['Understand focal length', 'Learn about prime vs zoom lenses', 'Explore wide-angle photography', 'Master telephoto techniques', 'Experiment with macro photography'], tips: 'A 50mm prime lens is the best investment for beginners - it forces you to move and compose.' }
            ]
          },
          {
            title: 'Composition Fundamentals',
            sections: [
              { title: 'The Rule of Thirds', content: 'The most fundamental composition technique that instantly improves photos.', steps: ['Enable the grid on your camera', 'Place subjects on intersection points', 'Use horizontal lines for landscapes', 'Break the rule intentionally for effect', 'Analyze professional photos for composition'], tips: 'The rule of thirds is a starting point, not a requirement - learn it, then break it.' },
              { title: 'Leading Lines and Framing', content: 'Guide your viewer\'s eye through your photographs.', steps: ['Look for natural leading lines', 'Use roads, fences, and architecture', 'Frame subjects with doorways or trees', 'Create depth with foreground elements', 'Experiment with symmetry'], tips: 'Train yourself to see lines everywhere - it becomes second nature.' }
            ]
          },
          {
            title: 'Lighting Techniques',
            sections: [
              { title: 'Natural Light Photography', content: 'Harness the power of natural light for stunning images.', steps: ['Learn the golden hour timing', 'Understand quality vs quantity of light', 'Use window light for portraits', 'Work with harsh sunlight creatively', 'Embrace overcast conditions'], tips: 'The best light often occurs when most people aren\'t shooting - wake up early!' },
              { title: 'Introduction to Flash', content: 'Master artificial lighting to control your environment.', steps: ['Understand flash basics', 'Learn to bounce flash', 'Use flash outdoors for fill', 'Experiment with off-camera flash', 'Balance flash with ambient light'], tips: 'Start with bounced flash - direct flash is rarely flattering.' }
            ]
          }
        ]
      }
    ]
  },
  'beginner': {
    topics: [
      {
        title: 'Complete Beginner\'s Guide to Investing',
        subtitle: 'Build Wealth with Smart Investment Strategies',
        introduction: 'Investing can seem intimidating, but it doesn\'t have to be. This guide breaks down everything you need to know to start building wealth today.',
        chapters: [
          {
            title: 'Investment Fundamentals',
            sections: [
              { title: 'Why Invest?', content: 'Understanding the power of compound growth and why starting early matters.', steps: ['Calculate the cost of waiting to invest', 'Understand compound interest', 'Learn about inflation\'s impact on savings', 'Set clear financial goals', 'Determine your investment timeline'], tips: 'Time in the market beats timing the market - start now with whatever you have.' },
              { title: 'Types of Investments', content: 'An overview of the main investment vehicles available to you.', steps: ['Learn about stocks and equity', 'Understand bonds and fixed income', 'Explore mutual funds and ETFs', 'Consider real estate options', 'Evaluate cryptocurrency basics'], tips: 'Diversification is your best protection against risk.' }
            ]
          },
          {
            title: 'Building Your First Portfolio',
            sections: [
              { title: 'Opening Your Investment Account', content: 'Step-by-step guide to setting up your first brokerage account.', steps: ['Research brokerage options', 'Compare fees and minimums', 'Gather required documents', 'Complete the application', 'Link your bank account'], tips: 'Look for brokerages with no account minimums and commission-free trades.' },
              { title: 'Your First Investments', content: 'Make your first purchase with confidence.', steps: ['Start with broad market index funds', 'Set up automatic contributions', 'Understand dollar-cost averaging', 'Review your allocations quarterly', 'Stay the course during volatility'], tips: 'A simple three-fund portfolio often outperforms complex strategies.' }
            ]
          }
        ]
      }
    ]
  },
  'ultimate': {
    topics: [
      {
        title: 'The Ultimate Guide to Personal Productivity',
        subtitle: 'Master Your Time, Energy, and Focus',
        introduction: 'In today\'s distraction-filled world, productivity is the ultimate competitive advantage. This comprehensive guide will transform how you work and live.',
        chapters: [
          {
            title: 'The Psychology of Productivity',
            sections: [
              { title: 'Understanding Your Brain', content: 'Learn how your mind works to optimize your productivity systems.', steps: ['Understand decision fatigue', 'Learn about willpower depletion', 'Identify your chronotype', 'Map your energy patterns', 'Design your environment for success'], tips: 'Work with your biology, not against it - schedule demanding tasks during your peak hours.' },
              { title: 'Building Productive Habits', content: 'Create automatic behaviors that drive results.', steps: ['Start with tiny habits', 'Stack new habits on existing ones', 'Design your environment for success', 'Track your progress visibly', 'Celebrate small wins'], tips: 'It takes about 66 days to form a habit - be patient and consistent.' }
            ]
          },
          {
            title: 'Time Management Systems',
            sections: [
              { title: 'Time Blocking Mastery', content: 'The most effective way to protect your focused work time.', steps: ['Audit your current time usage', 'Identify your most important tasks', 'Block time for deep work first', 'Batch similar tasks together', 'Build in buffer time'], tips: 'Schedule your priorities, or others will schedule them for you.' },
              { title: 'The Pomodoro Technique', content: 'Use timed intervals to maintain focus and prevent burnout.', steps: ['Set a 25-minute timer', 'Work with complete focus', 'Take a 5-minute break', 'After 4 pomodoros, take a longer break', 'Adjust intervals to your needs'], tips: 'The breaks are as important as the work - use them to actually rest.' }
            ]
          },
          {
            title: 'Digital Productivity Tools',
            sections: [
              { title: 'Task Management Systems', content: 'Choose and implement the right system for your needs.', steps: ['Evaluate popular options (Todoist, Things, Notion)', 'Define your workflow requirements', 'Set up your system', 'Create a weekly review routine', 'Iterate and improve'], tips: 'The best system is one you\'ll actually use - start simple.' },
              { title: 'Automation and Efficiency', content: 'Let technology handle repetitive tasks.', steps: ['Identify repetitive workflows', 'Learn basic automation tools', 'Set up email filters and templates', 'Use text expansion software', 'Automate file organization'], tips: 'Any task done more than twice should be automated or templated.' }
            ]
          },
          {
            title: 'Focus and Deep Work',
            sections: [
              { title: 'Eliminating Distractions', content: 'Create an environment conducive to deep, focused work.', steps: ['Identify your biggest distractions', 'Use website blockers during work', 'Set phone to Do Not Disturb', 'Communicate boundaries to others', 'Create a shutdown ritual'], tips: 'It takes 23 minutes to refocus after a distraction - protect your attention.' },
              { title: 'Flow State Mastery', content: 'Access the peak performance state at will.', steps: ['Set clear goals for each session', 'Match challenge to skill level', 'Eliminate all external feedback', 'Work on intrinsically motivating tasks', 'Practice regularly to lower the threshold'], tips: 'Flow follows focus - you can\'t force it, but you can create the conditions.' }
            ]
          },
          {
            title: 'Energy Management',
            sections: [
              { title: 'Physical Energy', content: 'Your body is the foundation of your productivity.', steps: ['Prioritize sleep quality', 'Exercise regularly', 'Eat for sustained energy', 'Stay hydrated', 'Take regular movement breaks'], tips: 'Sleep is not a luxury - it\'s the foundation of everything else.' },
              { title: 'Mental and Emotional Energy', content: 'Maintain the mental clarity needed for your best work.', steps: ['Practice daily meditation', 'Manage stress proactively', 'Build recovery into your schedule', 'Connect with supportive people', 'Pursue meaningful work'], tips: 'Sustainable productivity requires regular renewal - schedule it.' }
            ]
          }
        ]
      }
    ]
  },
  'quick-start': {
    topics: [
      {
        title: 'Quick Start Guide to Remote Work',
        subtitle: 'Get Productive from Home in 24 Hours',
        introduction: 'Remote work requires a different approach than office work. This quick start guide will have you set up and productive in no time.',
        chapters: [
          {
            title: 'Setting Up Your Workspace',
            sections: [
              { title: 'Essential Equipment', content: 'Get the basics right for a productive home office.', steps: ['Secure a reliable internet connection', 'Set up a dedicated workspace', 'Invest in a comfortable chair', 'Position your monitor at eye level', 'Add proper lighting'], tips: 'Your workspace doesn\'t need to be fancy, but it does need to be consistent.' }
            ]
          },
          {
            title: 'Daily Routines',
            sections: [
              { title: 'Morning Routine', content: 'Start your day right even when working from home.', steps: ['Wake up at a consistent time', 'Get dressed for work', 'Define your top 3 priorities', 'Check communications once', 'Start with your hardest task'], tips: 'A morning routine creates the boundary between home and work.' }
            ]
          },
          {
            title: 'Communication Best Practices',
            sections: [
              { title: 'Staying Connected', content: 'Maintain strong relationships with your team remotely.', steps: ['Over-communicate status updates', 'Use video for important conversations', 'Schedule regular check-ins', 'Be responsive during work hours', 'Document decisions in writing'], tips: 'When in doubt, over-communicate - remote work requires more intentional communication.' }
            ]
          }
        ]
      }
    ]
  },
  'checklist': {
    topics: [
      {
        title: 'The Complete Home Buying Checklist',
        subtitle: 'Every Step to Purchasing Your Dream Home',
        introduction: 'Buying a home is one of the biggest decisions you\'ll make. This checklist ensures you don\'t miss any crucial steps.',
        chapters: [
          {
            title: 'Pre-Purchase Preparation',
            sections: [
              { title: 'Financial Readiness Checklist', content: 'Ensure your finances are in order before house hunting.', steps: ['Check your credit score', 'Pay down existing debt', 'Save for down payment (aim for 20%)', 'Get pre-approved for a mortgage', 'Calculate your budget including hidden costs'], tips: 'Get pre-approved before house hunting - it strengthens your offer.' },
              { title: 'Documentation Checklist', content: 'Gather the paperwork you\'ll need for the mortgage process.', steps: ['Last 2 years tax returns', 'Recent pay stubs', 'Bank statements (3 months)', 'Proof of additional income', 'ID documents'], tips: 'Create a digital folder with all documents organized and ready to share.' }
            ]
          },
          {
            title: 'House Hunting',
            sections: [
              { title: 'Property Evaluation Checklist', content: 'What to look for when viewing potential homes.', steps: ['Check the roof condition', 'Inspect foundation for cracks', 'Test all faucets and drains', 'Look for water damage signs', 'Check electrical panel and outlets', 'Test HVAC system', 'Note natural light levels', 'Check cell reception'], tips: 'Visit the property at different times of day to assess noise and traffic.' }
            ]
          },
          {
            title: 'Closing Process',
            sections: [
              { title: 'Final Steps Checklist', content: 'The last steps before you get the keys.', steps: ['Schedule home inspection', 'Review inspection report carefully', 'Negotiate repairs if needed', 'Get homeowners insurance quotes', 'Complete final walkthrough', 'Wire closing funds safely', 'Review all closing documents'], tips: 'Never wire money based on email instructions alone - always verify by phone.' }
            ]
          }
        ]
      }
    ]
  },
  'reference': {
    topics: [
      {
        title: 'The Complete Reference Guide to Nutrition',
        subtitle: 'Evidence-Based Dietary Guidelines',
        introduction: 'Cut through the confusion of nutrition advice with this science-based reference guide covering everything you need to know about healthy eating.',
        chapters: [
          {
            title: 'Macronutrients',
            sections: [
              { title: 'Proteins', content: 'Essential for muscle building, repair, and numerous bodily functions.', steps: ['Aim for 0.8-1g protein per pound of body weight', 'Include complete proteins in your diet', 'Spread protein intake throughout the day', 'Consider timing around exercise', 'Mix animal and plant sources'], tips: 'Protein is the most satiating macronutrient - prioritize it for weight management.' },
              { title: 'Carbohydrates', content: 'Your body\'s preferred energy source for brain and muscle function.', steps: ['Focus on complex carbohydrates', 'Include fiber-rich sources', 'Time carbs around activity', 'Limit added sugars', 'Don\'t fear carbs - they\'re essential'], tips: 'The quality of carbs matters more than quantity for most people.' },
              { title: 'Fats', content: 'Essential for hormone production, brain function, and nutrient absorption.', steps: ['Include healthy fats daily', 'Focus on unsaturated sources', 'Don\'t avoid saturated fat entirely', 'Minimize trans fats', 'Consider omega-3 supplementation'], tips: 'Fat doesn\'t make you fat - excess calories do.' }
            ]
          },
          {
            title: 'Micronutrients',
            sections: [
              { title: 'Essential Vitamins', content: 'Reference guide to key vitamins and their functions.', steps: ['Vitamin A - vision and immune function', 'B Vitamins - energy metabolism', 'Vitamin C - immune support and collagen', 'Vitamin D - bone health and mood', 'Vitamin E - antioxidant protection'], tips: 'Get vitamins from food first - supplements are backup.' },
              { title: 'Essential Minerals', content: 'Key minerals your body needs to function optimally.', steps: ['Iron - oxygen transport', 'Calcium - bone and muscle function', 'Magnesium - 300+ enzyme reactions', 'Zinc - immune function', 'Potassium - blood pressure regulation'], tips: 'Magnesium deficiency is common - consider supplementation if needed.' }
            ]
          }
        ]
      }
    ]
  },
  'troubleshoot': {
    topics: [
      {
        title: 'Computer Troubleshooting Guide',
        subtitle: 'Fix Common Tech Problems Yourself',
        introduction: 'Before calling tech support, try these proven troubleshooting steps. Most computer problems can be solved with basic knowledge and patience.',
        chapters: [
          {
            title: 'Startup and Boot Issues',
            sections: [
              { title: 'Computer Won\'t Turn On', content: 'Systematic steps to diagnose power-related issues.', steps: ['Check power cable connections', 'Try a different power outlet', 'Check surge protector/power strip', 'Look for LED lights on the motherboard', 'Try holding power button for 30 seconds', 'Remove and reseat RAM modules', 'Test with minimum hardware'], tips: 'The most common cause is a loose power connection - check cables first.' },
              { title: 'Slow Startup', content: 'Speed up your computer\'s boot time.', steps: ['Disable unnecessary startup programs', 'Check for malware', 'Clean up your hard drive', 'Consider upgrading to SSD', 'Update your operating system', 'Check for driver updates'], tips: 'An SSD is the single best upgrade for speed on older computers.' }
            ]
          },
          {
            title: 'Network Issues',
            sections: [
              { title: 'No Internet Connection', content: 'Step-by-step network troubleshooting.', steps: ['Check if other devices can connect', 'Restart your router and modem', 'Forget and reconnect to WiFi', 'Check network adapter settings', 'Run network troubleshooter', 'Try connecting via ethernet'], tips: 'The universal IT fix: turn it off and on again. It really does work.' }
            ]
          }
        ]
      }
    ]
  },
  'best-practices': {
    topics: [
      {
        title: 'Best Practices for Project Management',
        subtitle: 'Proven Strategies from Industry Experts',
        introduction: 'Successful project management is about people, processes, and tools working together. These best practices will help you deliver projects on time and under budget.',
        chapters: [
          {
            title: 'Project Planning',
            sections: [
              { title: 'Defining Project Scope', content: 'The foundation of every successful project is clear scope definition.', steps: ['Document all project requirements', 'Identify stakeholders and their needs', 'Define clear deliverables', 'Set realistic timelines', 'Create a change management process'], tips: 'Scope creep is the #1 project killer - define boundaries clearly upfront.' },
              { title: 'Resource Allocation', content: 'Match the right people to the right tasks.', steps: ['Inventory team skills and availability', 'Consider capacity constraints', 'Build in buffer time', 'Plan for dependencies', 'Have backup resources identified'], tips: 'Teams work best when slightly under capacity - leave room for the unexpected.' }
            ]
          },
          {
            title: 'Execution Excellence',
            sections: [
              { title: 'Communication Best Practices', content: 'Keep everyone aligned and informed throughout the project.', steps: ['Establish communication channels', 'Set meeting cadence', 'Create status report templates', 'Document decisions', 'Escalate issues early'], tips: 'Over-communication is better than under-communication - err on the side of more updates.' }
            ]
          }
        ]
      }
    ]
  },
  'tutorial-series': {
    topics: [
      {
        title: 'Web Development Tutorial Series',
        subtitle: 'Build Your First Website from Scratch',
        introduction: 'This step-by-step tutorial series will take you from complete beginner to building your own professional website.',
        chapters: [
          {
            title: 'Part 1: HTML Fundamentals',
            sections: [
              { title: 'Introduction to HTML', content: 'HTML is the backbone of every website - learn the basics.', steps: ['Understand what HTML is', 'Learn the basic document structure', 'Practice with common tags (h1, p, a, img)', 'Create your first webpage', 'Validate your HTML code'], tips: 'View the source code of websites you admire to learn how they\'re structured.' }
            ]
          },
          {
            title: 'Part 2: CSS Styling',
            sections: [
              { title: 'Introduction to CSS', content: 'Make your websites beautiful with CSS styling.', steps: ['Understand CSS selectors', 'Learn the box model', 'Practice with colors and fonts', 'Create responsive layouts', 'Use CSS frameworks'], tips: 'Master flexbox and grid - they solve 90% of layout challenges.' }
            ]
          },
          {
            title: 'Part 3: JavaScript Basics',
            sections: [
              { title: 'Adding Interactivity', content: 'Bring your websites to life with JavaScript.', steps: ['Learn JavaScript syntax basics', 'Understand variables and functions', 'Handle user events', 'Manipulate the DOM', 'Practice with small projects'], tips: 'Don\'t try to learn everything at once - master the fundamentals first.' }
            ]
          }
        ]
      }
    ]
  },
  'blank': {
    topics: [
      {
        title: 'My Guide',
        subtitle: 'Add your subtitle here',
        introduction: 'Write your introduction here...',
        chapters: [
          {
            title: 'Chapter 1',
            sections: [
              { title: 'Section 1', content: 'Add your content here...', steps: ['Step 1', 'Step 2', 'Step 3'], tips: 'Add your tips here.' }
            ]
          }
        ]
      }
    ]
  }
}

// Additional topics based on keywords in title
const KEYWORD_CONTENT = {
  'programming': {
    chapters: [
      {
        title: 'Getting Started with Coding',
        sections: [
          { title: 'Choosing Your First Language', content: 'Pick the right programming language for your goals.', steps: ['Python for beginners and data science', 'JavaScript for web development', 'Swift for iOS apps', 'Java for enterprise and Android', 'C++ for systems and games'], tips: 'Python is the best first language - it\'s readable and versatile.' },
          { title: 'Setting Up Your Environment', content: 'Configure your development tools for success.', steps: ['Install a code editor (VS Code recommended)', 'Set up version control with Git', 'Learn command line basics', 'Configure your terminal', 'Install language-specific tools'], tips: 'Invest time in learning your editor\'s shortcuts - it pays dividends forever.' }
        ]
      },
      {
        title: 'Writing Clean Code',
        sections: [
          { title: 'Code Quality Basics', content: 'Write code that others (and future you) can understand.', steps: ['Use meaningful variable names', 'Keep functions small and focused', 'Comment complex logic', 'Follow language conventions', 'Write tests for your code'], tips: 'If you have to explain your code too much, it\'s probably too complex.' }
        ]
      }
    ]
  },
  'cooking': {
    chapters: [
      {
        title: 'Kitchen Essentials',
        sections: [
          { title: 'Must-Have Equipment', content: 'Build your kitchen toolkit without breaking the bank.', steps: ['Get a quality chef\'s knife', 'Invest in a cutting board', 'Buy a reliable pan set', 'Get measuring tools', 'Add mixing bowls and utensils'], tips: 'One good knife beats ten mediocre ones - invest in quality.' }
        ]
      },
      {
        title: 'Cooking Techniques',
        sections: [
          { title: 'Fundamental Methods', content: 'Master these techniques and you can cook anything.', steps: ['Learn to sauté properly', 'Master braising for tender meats', 'Understand roasting temperatures', 'Practice proper seasoning', 'Learn sauce basics'], tips: 'Salt your food in layers as you cook, not just at the end.' }
        ]
      }
    ]
  },
  'fitness': {
    chapters: [
      {
        title: 'Building Your Foundation',
        sections: [
          { title: 'Setting Fitness Goals', content: 'Define clear, achievable fitness objectives.', steps: ['Assess your current fitness level', 'Set SMART goals', 'Choose your training style', 'Create a realistic schedule', 'Track your progress'], tips: 'Start with habits, not goals - show up consistently before worrying about results.' }
        ]
      },
      {
        title: 'Exercise Fundamentals',
        sections: [
          { title: 'Movement Patterns', content: 'Master the basic movements for a complete workout.', steps: ['Push movements (push-ups, presses)', 'Pull movements (rows, pull-ups)', 'Squat patterns', 'Hinge movements (deadlifts)', 'Core stability'], tips: 'Form over weight always - bad form leads to injury and limited progress.' }
        ]
      }
    ]
  },
  'marketing': {
    chapters: [
      {
        title: 'Understanding Your Audience',
        sections: [
          { title: 'Customer Research', content: 'Know your audience better than they know themselves.', steps: ['Create buyer personas', 'Research pain points', 'Analyze competitor audiences', 'Survey existing customers', 'Map the customer journey'], tips: 'Talk to your customers directly - surveys and data only tell part of the story.' }
        ]
      },
      {
        title: 'Marketing Channels',
        sections: [
          { title: 'Choosing Your Channels', content: 'Focus on channels where your audience already spends time.', steps: ['Evaluate social platforms', 'Consider email marketing', 'Explore content marketing', 'Test paid advertising', 'Build community'], tips: 'Master one channel before expanding to others - depth beats breadth.' }
        ]
      }
    ]
  },
  'writing': {
    chapters: [
      {
        title: 'The Writing Process',
        sections: [
          { title: 'From Idea to Draft', content: 'Transform ideas into compelling written content.', steps: ['Brainstorm without editing', 'Outline your structure', 'Write the first draft quickly', 'Let it rest before editing', 'Revise and refine'], tips: 'Separate writing and editing - they use different parts of your brain.' }
        ]
      },
      {
        title: 'Writing Techniques',
        sections: [
          { title: 'Engaging Your Reader', content: 'Keep readers hooked from start to finish.', steps: ['Start with a hook', 'Use active voice', 'Vary sentence length', 'Show, don\'t tell', 'End with impact'], tips: 'Read your writing aloud - you\'ll catch issues your eyes miss.' }
        ]
      }
    ]
  }
}

export async function POST(request) {
  try {
    const { guideType, title, chapterCount, targetAudience, difficulty } = await request.json()
    
    console.log(`Generating guide structure for type: ${guideType}, title: ${title}`)
    
    // Get base content for guide type
    const typeContent = GUIDE_DATABASE[guideType] || GUIDE_DATABASE['how-to']
    const baseTopics = typeContent.topics || []
    
    // Select a random base topic or the first one
    let selectedTopic = baseTopics[Math.floor(Math.random() * baseTopics.length)] || baseTopics[0]
    
    // If user provided a title, check for keyword matches
    let resultChapters = [...(selectedTopic?.chapters || [])]
    
    if (title) {
      const titleLower = title.toLowerCase()
      
      // Check for keyword content to add
      for (const [keyword, content] of Object.entries(KEYWORD_CONTENT)) {
        if (titleLower.includes(keyword)) {
          // Add keyword-specific chapters
          resultChapters = [...resultChapters, ...content.chapters]
          break
        }
      }
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
            steps: ['Step 1', 'Step 2', 'Step 3'],
            tips: 'Add your tips here.'
          }
        ]
      })
    }
    
    // Generate title if not provided
    const generatedTitle = title || selectedTopic?.title || 'My How-To Guide'
    const generatedSubtitle = selectedTopic?.subtitle || 'A Complete Step-by-Step Guide'
    const generatedIntro = selectedTopic?.introduction || 'This guide will walk you through everything you need to know.'
    
    return NextResponse.json({
      success: true,
      title: generatedTitle,
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
