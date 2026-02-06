import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limiter'

// PREMIUM TEMPLATE STRUCTURES - Comprehensive multi-database systems
// Each template includes: Multiple databases, Dashboard content, Getting started guide, Rich sample data

const PREMIUM_TEMPLATES = {
  // ============================================
  // WORK TEMPLATES - Professional & Business
  // ============================================
  
  'product': {
    emoji: '📦',
    name: 'Product Management Hub',
    tagline: 'Complete product development lifecycle management',
    description: 'An all-in-one product management system with roadmaps, sprints, feature tracking, bug management, and team collaboration. Perfect for product managers, startup founders, and development teams.',
    
    // Multiple databases in this template
    databases: [
      {
        name: 'Product Roadmap',
        emoji: '🗺️',
        description: 'Strategic product roadmap with initiatives and milestones',
        properties: [
          { name: 'Initiative', type: 'title', icon: '📝' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Discovery', 'Planning', 'In Development', 'Beta', 'Launched', 'On Hold'] },
          { name: 'Priority', type: 'select', icon: '🎯', options: ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low'] },
          { name: 'Quarter', type: 'select', icon: '📅', options: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'] },
          { name: 'Owner', type: 'person', icon: '👤' },
          { name: 'Impact', type: 'select', icon: '📈', options: ['Revenue', 'Retention', 'Acquisition', 'Efficiency'] },
          { name: 'Effort', type: 'select', icon: '⏱️', options: ['XS (1 week)', 'S (2 weeks)', 'M (1 month)', 'L (2 months)', 'XL (3+ months)'] },
          { name: 'Progress', type: 'number', icon: '📊' },
          { name: 'Related Features', type: 'relation', icon: '🔗' }
        ],
        sampleData: [
          { Initiative: 'AI-Powered Recommendations', Status: 'In Development', Priority: 'P0 - Critical', Quarter: 'Q1 2025', Impact: 'Revenue', Effort: 'L (2 months)', Progress: 45 },
          { Initiative: 'Mobile App Launch', Status: 'Planning', Priority: 'P1 - High', Quarter: 'Q2 2025', Impact: 'Acquisition', Effort: 'XL (3+ months)', Progress: 15 },
          { Initiative: 'Performance Optimization', Status: 'Beta', Priority: 'P1 - High', Quarter: 'Q1 2025', Impact: 'Retention', Effort: 'M (1 month)', Progress: 80 },
          { Initiative: 'Admin Dashboard v2', Status: 'Discovery', Priority: 'P2 - Medium', Quarter: 'Q2 2025', Impact: 'Efficiency', Effort: 'S (2 weeks)', Progress: 5 },
          { Initiative: 'API Rate Limiting', Status: 'Launched', Priority: 'P1 - High', Quarter: 'Q1 2025', Impact: 'Efficiency', Effort: 'S (2 weeks)', Progress: 100 }
        ]
      },
      {
        name: 'Sprint Backlog',
        emoji: '🏃',
        description: 'Current and upcoming sprint tasks',
        properties: [
          { name: 'Task', type: 'title', icon: '📝' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'] },
          { name: 'Sprint', type: 'select', icon: '🏃', options: ['Sprint 12', 'Sprint 13', 'Sprint 14', 'Backlog'] },
          { name: 'Story Points', type: 'number', icon: '⭐' },
          { name: 'Assignee', type: 'person', icon: '👤' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Feature', 'Bug', 'Tech Debt', 'Spike', 'Chore'] },
          { name: 'Due Date', type: 'date', icon: '📅' },
          { name: 'Labels', type: 'multi_select', icon: '🏷️', options: ['Frontend', 'Backend', 'API', 'Database', 'DevOps', 'Mobile'] },
          { name: 'Acceptance Criteria', type: 'text', icon: '✅' }
        ],
        sampleData: [
          { Task: 'Implement user authentication flow', Status: 'In Progress', Sprint: 'Sprint 12', 'Story Points': 8, Type: 'Feature', Labels: ['Backend', 'API'], 'Acceptance Criteria': 'Users can login with email/password and OAuth' },
          { Task: 'Fix payment processing timeout', Status: 'In Review', Sprint: 'Sprint 12', 'Story Points': 5, Type: 'Bug', Labels: ['Backend'], 'Acceptance Criteria': 'Payments complete within 30 seconds' },
          { Task: 'Design new onboarding screens', Status: 'Done', Sprint: 'Sprint 12', 'Story Points': 3, Type: 'Feature', Labels: ['Frontend'], 'Acceptance Criteria': 'Figma designs approved by stakeholders' },
          { Task: 'Refactor database queries', Status: 'To Do', Sprint: 'Sprint 13', 'Story Points': 13, Type: 'Tech Debt', Labels: ['Database'], 'Acceptance Criteria': 'Query time reduced by 50%' },
          { Task: 'Research caching strategies', Status: 'Done', Sprint: 'Sprint 12', 'Story Points': 2, Type: 'Spike', Labels: ['Backend', 'DevOps'], 'Acceptance Criteria': 'Document with recommendations' },
          { Task: 'Update API documentation', Status: 'To Do', Sprint: 'Sprint 13', 'Story Points': 2, Type: 'Chore', Labels: ['API'], 'Acceptance Criteria': 'All endpoints documented in Swagger' },
          { Task: 'Mobile push notifications', Status: 'Blocked', Sprint: 'Sprint 12', 'Story Points': 5, Type: 'Feature', Labels: ['Mobile', 'Backend'], 'Acceptance Criteria': 'Blocked: Waiting for Firebase setup' }
        ]
      },
      {
        name: 'Bug Tracker',
        emoji: '🐛',
        description: 'Track and prioritize bugs and issues',
        properties: [
          { name: 'Bug', type: 'title', icon: '🐛' },
          { name: 'Severity', type: 'select', icon: '🚨', options: ['Critical', 'High', 'Medium', 'Low'] },
          { name: 'Status', type: 'select', icon: '🔄', options: ['New', 'Triaged', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Won\'t Fix'] },
          { name: 'Reported By', type: 'text', icon: '👤' },
          { name: 'Assigned To', type: 'person', icon: '👷' },
          { name: 'Environment', type: 'select', icon: '💻', options: ['Production', 'Staging', 'Development'] },
          { name: 'Browser', type: 'multi_select', icon: '🌐', options: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Mobile'] },
          { name: 'Steps to Reproduce', type: 'text', icon: '📋' },
          { name: 'Expected vs Actual', type: 'text', icon: '⚖️' }
        ],
        sampleData: [
          { Bug: 'Login button unresponsive on mobile', Severity: 'Critical', Status: 'In Progress', 'Reported By': 'Customer Support', Environment: 'Production', Browser: ['Mobile', 'Safari'], 'Steps to Reproduce': '1. Open app on iPhone 2. Tap login 3. Nothing happens' },
          { Bug: 'Dashboard charts not loading', Severity: 'High', Status: 'Triaged', 'Reported By': 'QA Team', Environment: 'Staging', Browser: ['Chrome', 'Firefox'], 'Steps to Reproduce': '1. Navigate to dashboard 2. Wait for charts 3. See loading spinner indefinitely' },
          { Bug: 'Typo in welcome email', Severity: 'Low', Status: 'Fixed', 'Reported By': 'Marketing', Environment: 'Production', Browser: [], 'Steps to Reproduce': 'Create new account, check welcome email' },
          { Bug: 'Export CSV missing header row', Severity: 'Medium', Status: 'New', 'Reported By': 'Sales Team', Environment: 'Production', Browser: ['Chrome'], 'Steps to Reproduce': '1. Go to reports 2. Export as CSV 3. Open file' }
        ]
      }
    ],
    
    // Dashboard widgets/stats
    dashboardSections: [
      { title: 'Sprint Progress', type: 'progress', description: 'Current sprint completion rate' },
      { title: 'Bugs by Severity', type: 'chart', description: 'Distribution of open bugs' },
      { title: 'Roadmap Timeline', type: 'timeline', description: 'Upcoming releases and milestones' },
      { title: 'Team Velocity', type: 'metric', description: 'Story points completed per sprint' }
    ],
    
    // Getting started guide
    gettingStarted: [
      'Welcome to your Product Management Hub! This template helps you manage your entire product lifecycle.',
      '1. **Set up your roadmap** - Add your product initiatives to the Roadmap database with priorities and timelines',
      '2. **Plan your sprints** - Break down initiatives into tasks in the Sprint Backlog',
      '3. **Track bugs** - Log all bugs in the Bug Tracker with severity and reproduction steps',
      '4. **Monitor progress** - Use the dashboard views to track velocity and identify blockers',
      '5. **Customize views** - Create filtered views for different team members (dev, design, PM)'
    ],
    
    // Pre-configured views
    views: [
      { name: 'Roadmap Timeline', type: 'timeline', database: 'Product Roadmap', groupBy: 'Quarter' },
      { name: 'Sprint Board', type: 'board', database: 'Sprint Backlog', groupBy: 'Status' },
      { name: 'Current Sprint', type: 'table', database: 'Sprint Backlog', filter: 'Sprint = Current' },
      { name: 'Open Bugs', type: 'board', database: 'Bug Tracker', groupBy: 'Severity' },
      { name: 'My Tasks', type: 'list', database: 'Sprint Backlog', filter: 'Assignee = Me' }
    ]
  },

  'marketing': {
    emoji: '📢',
    name: 'Marketing Command Center',
    tagline: 'Plan, execute, and measure all your marketing campaigns',
    description: 'A comprehensive marketing management system with campaign planning, content calendar, asset library, and analytics tracking. Built for marketing teams, agencies, and growth hackers.',
    
    databases: [
      {
        name: 'Campaigns',
        emoji: '🎯',
        description: 'Marketing campaigns and initiatives',
        properties: [
          { name: 'Campaign', type: 'title', icon: '📝' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Ideation', 'Planning', 'In Production', 'Live', 'Completed', 'Paused'] },
          { name: 'Type', type: 'select', icon: '📋', options: ['Product Launch', 'Brand Awareness', 'Lead Generation', 'Retention', 'Event', 'Seasonal'] },
          { name: 'Channels', type: 'multi_select', icon: '📡', options: ['Email', 'Social Media', 'Paid Ads', 'SEO', 'Content', 'PR', 'Influencer', 'Events'] },
          { name: 'Budget', type: 'number', icon: '💰' },
          { name: 'Spent', type: 'number', icon: '💸' },
          { name: 'Start Date', type: 'date', icon: '📅' },
          { name: 'End Date', type: 'date', icon: '🏁' },
          { name: 'Target Audience', type: 'text', icon: '👥' },
          { name: 'Goals', type: 'text', icon: '🎯' },
          { name: 'Results', type: 'text', icon: '📊' },
          { name: 'Owner', type: 'person', icon: '👤' }
        ],
        sampleData: [
          { Campaign: 'Q1 Product Launch - AI Features', Status: 'Live', Type: 'Product Launch', Channels: ['Email', 'Social Media', 'Paid Ads', 'PR'], Budget: 50000, Spent: 32000, 'Target Audience': 'Tech-savvy professionals, 25-45', Goals: '10,000 sign-ups, 500 paid conversions', Results: '8,500 sign-ups so far, 420 conversions' },
          { Campaign: 'Summer Sale 2025', Status: 'Planning', Type: 'Seasonal', Channels: ['Email', 'Social Media', 'Paid Ads'], Budget: 25000, Spent: 0, 'Target Audience': 'Existing customers + warm leads', Goals: '30% revenue increase vs last year' },
          { Campaign: 'Webinar Series - Industry Insights', Status: 'In Production', Type: 'Lead Generation', Channels: ['Email', 'Content', 'Social Media'], Budget: 5000, Spent: 1500, 'Target Audience': 'Decision makers in B2B', Goals: '500 registrations, 50 SQLs' },
          { Campaign: 'Brand Refresh Campaign', Status: 'Completed', Type: 'Brand Awareness', Channels: ['PR', 'Social Media', 'Content', 'Influencer'], Budget: 75000, Spent: 72000, 'Target Audience': 'General market awareness', Goals: '10M impressions', Results: '12.5M impressions achieved' },
          { Campaign: 'Customer Referral Program', Status: 'Live', Type: 'Retention', Channels: ['Email', 'In-App'], Budget: 10000, Spent: 4500, 'Target Audience': 'Existing active users', Goals: '1000 referrals in Q1', Results: '650 referrals MTD' }
        ]
      },
      {
        name: 'Content Calendar',
        emoji: '📅',
        description: 'Content planning and publishing schedule',
        properties: [
          { name: 'Content', type: 'title', icon: '📝' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Idea', 'Outline', 'Draft', 'Review', 'Scheduled', 'Published'] },
          { name: 'Type', type: 'select', icon: '📋', options: ['Blog Post', 'Social Post', 'Video', 'Podcast', 'Newsletter', 'Infographic', 'Case Study', 'Whitepaper'] },
          { name: 'Platform', type: 'multi_select', icon: '📱', options: ['Website', 'LinkedIn', 'Twitter/X', 'Instagram', 'TikTok', 'YouTube', 'Email'] },
          { name: 'Publish Date', type: 'date', icon: '📅' },
          { name: 'Author', type: 'person', icon: '✍️' },
          { name: 'Campaign', type: 'relation', icon: '🔗' },
          { name: 'Keywords', type: 'multi_select', icon: '🔑', options: ['SEO', 'Product', 'Industry', 'How-to', 'News', 'Thought Leadership'] },
          { name: 'Engagement', type: 'number', icon: '❤️' }
        ],
        sampleData: [
          { Content: '10 Ways AI is Transforming Business in 2025', Status: 'Published', Type: 'Blog Post', Platform: ['Website', 'LinkedIn'], Keywords: ['SEO', 'Industry', 'Thought Leadership'], Engagement: 3420 },
          { Content: 'Product Demo Video - New Features', Status: 'Draft', Type: 'Video', Platform: ['YouTube', 'Website'], Keywords: ['Product', 'How-to'] },
          { Content: 'Weekly Newsletter #45 - Industry Roundup', Status: 'Scheduled', Type: 'Newsletter', Platform: ['Email'], Keywords: ['News', 'Industry'] },
          { Content: 'Customer Success Story: TechCorp', Status: 'Review', Type: 'Case Study', Platform: ['Website', 'LinkedIn'], Keywords: ['Product', 'Thought Leadership'] },
          { Content: 'Behind the Scenes: Team Culture', Status: 'Idea', Type: 'Social Post', Platform: ['Instagram', 'TikTok'], Keywords: ['Industry'] },
          { Content: 'Complete Guide to Getting Started', Status: 'Published', Type: 'Blog Post', Platform: ['Website'], Keywords: ['SEO', 'How-to', 'Product'], Engagement: 5670 }
        ]
      },
      {
        name: 'Asset Library',
        emoji: '🖼️',
        description: 'Marketing assets and brand materials',
        properties: [
          { name: 'Asset', type: 'title', icon: '📝' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Image', 'Video', 'Document', 'Template', 'Logo', 'Icon', 'Audio'] },
          { name: 'Category', type: 'select', icon: '📁', options: ['Brand', 'Product', 'Social', 'Ads', 'Email', 'Print', 'Presentation'] },
          { name: 'File', type: 'files', icon: '📎' },
          { name: 'Dimensions', type: 'text', icon: '📐' },
          { name: 'Created Date', type: 'date', icon: '📅' },
          { name: 'Usage Rights', type: 'select', icon: '©️', options: ['Internal Only', 'Web Use', 'Full Rights', 'Limited License'] }
        ],
        sampleData: [
          { Asset: 'Primary Logo - Full Color', Type: 'Logo', Category: 'Brand', Dimensions: 'SVG + PNG (2000x600)', 'Usage Rights': 'Full Rights' },
          { Asset: 'Product Screenshot - Dashboard', Type: 'Image', Category: 'Product', Dimensions: '1920x1080', 'Usage Rights': 'Full Rights' },
          { Asset: 'Social Media Template Pack', Type: 'Template', Category: 'Social', Dimensions: 'Various (IG, Twitter, LinkedIn)', 'Usage Rights': 'Internal Only' },
          { Asset: 'Brand Guidelines PDF', Type: 'Document', Category: 'Brand', Dimensions: 'A4 - 24 pages', 'Usage Rights': 'Internal Only' },
          { Asset: 'Hero Video - 30 sec', Type: 'Video', Category: 'Ads', Dimensions: '1920x1080 MP4', 'Usage Rights': 'Web Use' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'Campaign Performance', type: 'chart', description: 'ROI by campaign' },
      { title: 'Content Pipeline', type: 'kanban', description: 'Content status overview' },
      { title: 'Budget Tracker', type: 'progress', description: 'Budget spent vs allocated' },
      { title: 'Upcoming Deadlines', type: 'calendar', description: 'Key dates this month' }
    ],
    
    gettingStarted: [
      'Welcome to your Marketing Command Center! Manage all your marketing activities in one place.',
      '1. **Plan campaigns** - Add your marketing initiatives with budgets, timelines, and goals',
      '2. **Create content calendar** - Schedule all content across platforms',
      '3. **Organize assets** - Upload brand materials to the Asset Library for easy access',
      '4. **Track performance** - Update results and engagement metrics',
      '5. **Coordinate team** - Assign tasks and track progress across team members'
    ],
    
    views: [
      { name: 'Active Campaigns', type: 'board', database: 'Campaigns', groupBy: 'Status' },
      { name: 'Content Calendar', type: 'calendar', database: 'Content Calendar', dateProperty: 'Publish Date' },
      { name: 'This Month\'s Content', type: 'table', database: 'Content Calendar', filter: 'This Month' },
      { name: 'Campaign Budget Overview', type: 'table', database: 'Campaigns', groupBy: 'Type' },
      { name: 'Asset Gallery', type: 'gallery', database: 'Asset Library', groupBy: 'Category' }
    ]
  },

  'crm': {
    emoji: '💼',
    name: 'Sales CRM System',
    tagline: 'Track leads, manage deals, and grow revenue',
    description: 'A complete CRM solution with lead management, deal pipeline, contact database, and activity tracking. Perfect for sales teams, freelancers, and small businesses.',
    
    databases: [
      {
        name: 'Deals Pipeline',
        emoji: '💰',
        description: 'Track all sales opportunities',
        properties: [
          { name: 'Deal', type: 'title', icon: '💼' },
          { name: 'Stage', type: 'select', icon: '📊', options: ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'] },
          { name: 'Value', type: 'number', icon: '💰' },
          { name: 'Probability', type: 'number', icon: '📈' },
          { name: 'Expected Close', type: 'date', icon: '📅' },
          { name: 'Company', type: 'relation', icon: '🏢' },
          { name: 'Contact', type: 'relation', icon: '👤' },
          { name: 'Owner', type: 'person', icon: '👔' },
          { name: 'Source', type: 'select', icon: '📥', options: ['Inbound', 'Outbound', 'Referral', 'Partner', 'Event', 'Website'] },
          { name: 'Next Action', type: 'text', icon: '➡️' },
          { name: 'Next Action Date', type: 'date', icon: '⏰' }
        ],
        sampleData: [
          { Deal: 'TechCorp Enterprise License', Stage: 'Negotiation', Value: 150000, Probability: 70, Source: 'Inbound', 'Next Action': 'Send revised proposal with volume discount' },
          { Deal: 'StartupXYZ Growth Plan', Stage: 'Proposal Sent', Value: 24000, Probability: 50, Source: 'Referral', 'Next Action': 'Follow up on pricing questions' },
          { Deal: 'GlobalCo Pilot Program', Stage: 'Qualified', Value: 75000, Probability: 30, Source: 'Event', 'Next Action': 'Schedule technical demo' },
          { Deal: 'SmallBiz Pro Subscription', Stage: 'Closed Won', Value: 5000, Probability: 100, Source: 'Website', 'Next Action': 'Handoff to customer success' },
          { Deal: 'MegaCorp Platform Deal', Stage: 'Lead', Value: 500000, Probability: 10, Source: 'Partner', 'Next Action': 'Initial discovery call' },
          { Deal: 'RetailMax Integration', Stage: 'Closed Lost', Value: 45000, Probability: 0, Source: 'Outbound', 'Next Action': 'Nurture for 6 months' }
        ]
      },
      {
        name: 'Companies',
        emoji: '🏢',
        description: 'Company accounts and information',
        properties: [
          { name: 'Company', type: 'title', icon: '🏢' },
          { name: 'Industry', type: 'select', icon: '🏭', options: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Services', 'Education', 'Government'] },
          { name: 'Size', type: 'select', icon: '📏', options: ['1-10', '11-50', '51-200', '201-1000', '1000+'] },
          { name: 'Website', type: 'url', icon: '🌐' },
          { name: 'Annual Revenue', type: 'text', icon: '💰' },
          { name: 'Location', type: 'text', icon: '📍' },
          { name: 'Tier', type: 'select', icon: '⭐', options: ['Enterprise', 'Mid-Market', 'SMB', 'Startup'] },
          { name: 'Deals', type: 'relation', icon: '💼' },
          { name: 'Contacts', type: 'relation', icon: '👥' }
        ],
        sampleData: [
          { Company: 'TechCorp Inc', Industry: 'Technology', Size: '201-1000', Location: 'San Francisco, CA', Tier: 'Enterprise', 'Annual Revenue': '$50M-100M' },
          { Company: 'StartupXYZ', Industry: 'Technology', Size: '11-50', Location: 'Austin, TX', Tier: 'Startup', 'Annual Revenue': '$1M-5M' },
          { Company: 'GlobalCo', Industry: 'Finance', Size: '1000+', Location: 'New York, NY', Tier: 'Enterprise', 'Annual Revenue': '$500M+' },
          { Company: 'SmallBiz Ltd', Industry: 'Services', Size: '1-10', Location: 'Chicago, IL', Tier: 'SMB', 'Annual Revenue': '<$1M' },
          { Company: 'MegaCorp', Industry: 'Manufacturing', Size: '1000+', Location: 'Detroit, MI', Tier: 'Enterprise', 'Annual Revenue': '$1B+' }
        ]
      },
      {
        name: 'Contacts',
        emoji: '👥',
        description: 'Contact people and relationships',
        properties: [
          { name: 'Name', type: 'title', icon: '👤' },
          { name: 'Role', type: 'text', icon: '💼' },
          { name: 'Email', type: 'email', icon: '📧' },
          { name: 'Phone', type: 'text', icon: '📱' },
          { name: 'Company', type: 'relation', icon: '🏢' },
          { name: 'Type', type: 'select', icon: '🎯', options: ['Decision Maker', 'Influencer', 'Champion', 'Blocker', 'End User'] },
          { name: 'Last Contact', type: 'date', icon: '📅' },
          { name: 'LinkedIn', type: 'url', icon: '🔗' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Name: 'Sarah Johnson', Role: 'VP of Engineering', Email: 'sarah@techcorp.com', Type: 'Decision Maker', Notes: 'Key stakeholder, prefers email communication' },
          { Name: 'Mike Chen', Role: 'CTO', Email: 'mike@startupxyz.com', Type: 'Champion', Notes: 'Very enthusiastic about our product, great internal advocate' },
          { Name: 'Lisa Williams', Role: 'Procurement Manager', Email: 'lwilliams@globalco.com', Type: 'Influencer', Notes: 'Handles all vendor contracts' },
          { Name: 'David Brown', Role: 'CEO', Email: 'david@smallbiz.com', Type: 'Decision Maker', Notes: 'Budget-conscious, needs clear ROI' },
          { Name: 'Jennifer Lee', Role: 'IT Director', Email: 'jlee@megacorp.com', Type: 'Blocker', Notes: 'Concerned about security compliance' }
        ]
      },
      {
        name: 'Activities',
        emoji: '📋',
        description: 'Track all sales activities and follow-ups',
        properties: [
          { name: 'Activity', type: 'title', icon: '📝' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Call', 'Email', 'Meeting', 'Demo', 'Follow-up', 'Proposal', 'Note'] },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Planned', 'Completed', 'Cancelled', 'No Show'] },
          { name: 'Date', type: 'date', icon: '📅' },
          { name: 'Contact', type: 'relation', icon: '👤' },
          { name: 'Deal', type: 'relation', icon: '💼' },
          { name: 'Outcome', type: 'text', icon: '✅' },
          { name: 'Next Steps', type: 'text', icon: '➡️' }
        ],
        sampleData: [
          { Activity: 'Discovery call with Sarah', Type: 'Call', Status: 'Completed', Outcome: 'Great call! They need solution for 500 users', 'Next Steps': 'Send case study and schedule demo' },
          { Activity: 'Product demo for TechCorp', Type: 'Demo', Status: 'Planned', 'Next Steps': 'Prepare custom demo with their use case' },
          { Activity: 'Follow up email to Mike', Type: 'Email', Status: 'Completed', Outcome: 'Confirmed budget approval timeline', 'Next Steps': 'Wait for Q1 budget confirmation' },
          { Activity: 'Contract review meeting', Type: 'Meeting', Status: 'Planned', 'Next Steps': 'Prepare redlined contract' },
          { Activity: 'Quarterly check-in - SmallBiz', Type: 'Call', Status: 'Completed', Outcome: 'Happy customer, potential upsell', 'Next Steps': 'Send upgrade proposal' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'Pipeline Value', type: 'metric', description: 'Total value of active deals' },
      { title: 'Deals by Stage', type: 'funnel', description: 'Deal pipeline visualization' },
      { title: 'Win Rate', type: 'metric', description: 'Closed Won vs Total Closed' },
      { title: 'Activities This Week', type: 'list', description: 'Upcoming calls, meetings, tasks' },
      { title: 'Top Deals to Close', type: 'table', description: 'Highest value opportunities' }
    ],
    
    gettingStarted: [
      'Welcome to your Sales CRM! This system helps you track every lead from first touch to closed deal.',
      '1. **Add companies** - Enter your target accounts and prospects',
      '2. **Add contacts** - Log key people at each company with roles and notes',
      '3. **Create deals** - Track opportunities through your sales pipeline',
      '4. **Log activities** - Record all calls, emails, and meetings',
      '5. **Follow up** - Use Next Action dates to never miss a follow-up'
    ],
    
    views: [
      { name: 'Deal Pipeline', type: 'board', database: 'Deals Pipeline', groupBy: 'Stage' },
      { name: 'Forecast', type: 'table', database: 'Deals Pipeline', groupBy: 'Expected Close' },
      { name: 'My Deals', type: 'table', database: 'Deals Pipeline', filter: 'Owner = Me' },
      { name: 'Companies by Tier', type: 'board', database: 'Companies', groupBy: 'Tier' },
      { name: 'Activity Calendar', type: 'calendar', database: 'Activities', dateProperty: 'Date' },
      { name: 'Upcoming Tasks', type: 'list', database: 'Activities', filter: 'Status = Planned' }
    ]
  },

  'startup': {
    emoji: '🚀',
    name: 'Startup OS',
    tagline: 'Everything you need to launch and scale your startup',
    description: 'A complete startup management system with OKRs, investor tracking, hiring pipeline, and company wiki. Built for founders, co-founders, and early-stage teams.',
    
    databases: [
      {
        name: 'OKRs & Goals',
        emoji: '🎯',
        description: 'Track company objectives and key results',
        properties: [
          { name: 'Objective', type: 'title', icon: '🎯' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Company', 'Team', 'Individual'] },
          { name: 'Category', type: 'select', icon: '📊', options: ['Growth', 'Product', 'Revenue', 'Team', 'Operations'] },
          { name: 'Quarter', type: 'select', icon: '📅', options: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'] },
          { name: 'Status', type: 'select', icon: '🔄', options: ['On Track', 'At Risk', 'Behind', 'Achieved', 'Cancelled'] },
          { name: 'Progress', type: 'number', icon: '📈' },
          { name: 'Owner', type: 'person', icon: '👤' },
          { name: 'Key Results', type: 'text', icon: '✅' }
        ],
        sampleData: [
          { Objective: 'Reach Product-Market Fit', Type: 'Company', Category: 'Product', Quarter: 'Q1 2025', Status: 'On Track', Progress: 60, 'Key Results': 'NPS > 50, 40% weekly retention, 100 paying customers' },
          { Objective: 'Achieve $100K MRR', Type: 'Company', Category: 'Revenue', Quarter: 'Q2 2025', Status: 'At Risk', Progress: 35, 'Key Results': '$50K in Q1, $75K by mid-Q2, $100K by end Q2' },
          { Objective: 'Build World-Class Team', Type: 'Company', Category: 'Team', Quarter: 'Q1 2025', Status: 'On Track', Progress: 80, 'Key Results': 'Hire 2 engineers, 1 designer, 1 marketer' },
          { Objective: 'Launch Mobile App', Type: 'Team', Category: 'Product', Quarter: 'Q2 2025', Status: 'Behind', Progress: 20, 'Key Results': 'iOS app in App Store, 1000 downloads in first month' },
          { Objective: 'Close Series A', Type: 'Company', Category: 'Operations', Quarter: 'Q3 2025', Status: 'On Track', Progress: 15, 'Key Results': 'Talk to 50 VCs, get 10 term sheets, close $5M round' }
        ]
      },
      {
        name: 'Investor Pipeline',
        emoji: '💰',
        description: 'Track investor outreach and fundraising',
        properties: [
          { name: 'Investor', type: 'title', icon: '💰' },
          { name: 'Type', type: 'select', icon: '📋', options: ['VC', 'Angel', 'Family Office', 'Corporate', 'Accelerator'] },
          { name: 'Stage', type: 'select', icon: '📊', options: ['Research', 'Intro Requested', 'First Meeting', 'Partner Meeting', 'Due Diligence', 'Term Sheet', 'Closed', 'Passed'] },
          { name: 'Check Size', type: 'text', icon: '💵' },
          { name: 'Focus Areas', type: 'multi_select', icon: '🎯', options: ['SaaS', 'AI/ML', 'Fintech', 'B2B', 'B2C', 'Marketplace', 'Dev Tools'] },
          { name: 'Contact', type: 'text', icon: '👤' },
          { name: 'Intro Source', type: 'text', icon: '🔗' },
          { name: 'Last Contact', type: 'date', icon: '📅' },
          { name: 'Notes', type: 'text', icon: '📝' },
          { name: 'Next Step', type: 'text', icon: '➡️' }
        ],
        sampleData: [
          { Investor: 'Sequoia Capital', Type: 'VC', Stage: 'Partner Meeting', 'Check Size': '$5-15M', 'Focus Areas': ['SaaS', 'AI/ML', 'B2B'], Contact: 'Alfred Lin', 'Intro Source': 'Warm intro from YC batch mate', Notes: 'Great first meeting, they love our traction', 'Next Step': 'Prep for Monday partner meeting' },
          { Investor: 'a]z Fund', Type: 'VC', Stage: 'First Meeting', 'Check Size': '$10-50M', 'Focus Areas': ['SaaS', 'Dev Tools'], Contact: 'Marc Andreessen', 'Intro Source': 'Cold email', Notes: 'Scheduled for next week', 'Next Step': 'Send deck and metrics' },
          { Investor: 'Naval Ravikant', Type: 'Angel', Stage: 'Term Sheet', 'Check Size': '$100-500K', 'Focus Areas': ['SaaS', 'B2B'], Contact: 'Direct', 'Intro Source': 'Twitter DM', Notes: 'Committed $250K', 'Next Step': 'Send SAFE docs' },
          { Investor: 'Y Combinator', Type: 'Accelerator', Stage: 'Closed', 'Check Size': '$500K', 'Focus Areas': ['SaaS', 'AI/ML', 'B2B', 'B2C'], Contact: 'YC Team', Notes: 'S25 batch!', 'Next Step': 'Start program Jan 6' },
          { Investor: 'Tiger Global', Type: 'VC', Stage: 'Passed', 'Check Size': '$10-100M', 'Focus Areas': ['SaaS'], Contact: 'John Doe', Notes: 'Too early for them, revisit at Series B' }
        ]
      },
      {
        name: 'Hiring Pipeline',
        emoji: '👥',
        description: 'Track job applicants and hiring process',
        properties: [
          { name: 'Candidate', type: 'title', icon: '👤' },
          { name: 'Role', type: 'select', icon: '💼', options: ['Software Engineer', 'Product Designer', 'Product Manager', 'Marketing', 'Sales', 'Operations'] },
          { name: 'Stage', type: 'select', icon: '📊', options: ['Applied', 'Phone Screen', 'Technical Interview', 'Onsite', 'Reference Check', 'Offer', 'Hired', 'Rejected'] },
          { name: 'Source', type: 'select', icon: '📥', options: ['LinkedIn', 'Referral', 'Job Board', 'Inbound', 'Recruiter', 'University'] },
          { name: 'Resume', type: 'files', icon: '📄' },
          { name: 'LinkedIn', type: 'url', icon: '🔗' },
          { name: 'Applied Date', type: 'date', icon: '📅' },
          { name: 'Salary Expectation', type: 'text', icon: '💰' },
          { name: 'Notes', type: 'text', icon: '📝' },
          { name: 'Interviewer', type: 'person', icon: '👔' }
        ],
        sampleData: [
          { Candidate: 'Alex Thompson', Role: 'Software Engineer', Stage: 'Onsite', Source: 'Referral', 'Salary Expectation': '$150-180K', Notes: 'Strong systems background, ex-Google. Culture fit TBD.' },
          { Candidate: 'Jordan Lee', Role: 'Product Designer', Stage: 'Offer', Source: 'LinkedIn', 'Salary Expectation': '$130-150K', Notes: 'Amazing portfolio, great design thinking. Sending offer today!' },
          { Candidate: 'Sam Rodriguez', Role: 'Product Manager', Stage: 'Technical Interview', Source: 'Job Board', 'Salary Expectation': '$140-160K', Notes: 'Strong PM experience at Series B startup' },
          { Candidate: 'Casey Kim', Role: 'Marketing', Stage: 'Phone Screen', Source: 'Inbound', 'Salary Expectation': '$90-110K', Notes: 'Growth marketing specialist, good early-stage experience' },
          { Candidate: 'Taylor Smith', Role: 'Software Engineer', Stage: 'Rejected', Source: 'University', Notes: 'Good potential but needs more experience. Reach out in 1 year.' }
        ]
      },
      {
        name: 'Company Wiki',
        emoji: '📚',
        description: 'Internal documentation and knowledge base',
        properties: [
          { name: 'Page', type: 'title', icon: '📝' },
          { name: 'Category', type: 'select', icon: '📁', options: ['Onboarding', 'Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Legal', 'Finance'] },
          { name: 'Owner', type: 'person', icon: '👤' },
          { name: 'Last Updated', type: 'date', icon: '📅' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Current', 'Needs Update', 'Archived', 'Draft'] }
        ],
        sampleData: [
          { Page: 'Welcome to the Team!', Category: 'Onboarding', Status: 'Current' },
          { Page: 'Engineering Best Practices', Category: 'Engineering', Status: 'Current' },
          { Page: 'Brand Guidelines', Category: 'Marketing', Status: 'Current' },
          { Page: 'Sales Playbook', Category: 'Sales', Status: 'Needs Update' },
          { Page: 'Employee Handbook', Category: 'HR', Status: 'Current' },
          { Page: 'SAFE Agreement Template', Category: 'Legal', Status: 'Current' },
          { Page: 'Expense Policy', Category: 'Finance', Status: 'Current' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'OKR Progress', type: 'progress', description: 'Company goal achievement' },
      { title: 'Runway Calculator', type: 'metric', description: 'Months of runway remaining' },
      { title: 'Fundraising Pipeline', type: 'funnel', description: 'Investor pipeline stages' },
      { title: 'Team Growth', type: 'chart', description: 'Hiring progress' },
      { title: 'Key Metrics', type: 'metrics', description: 'MRR, Users, NPS' }
    ],
    
    gettingStarted: [
      'Welcome to Startup OS! Your command center for building a successful company.',
      '1. **Set your OKRs** - Define company, team, and individual objectives',
      '2. **Track investors** - Add potential investors and manage your fundraising pipeline',
      '3. **Build your team** - Track candidates through your hiring process',
      '4. **Document everything** - Use the Wiki for company knowledge and processes',
      '5. **Stay aligned** - Review OKRs weekly and update progress'
    ],
    
    views: [
      { name: 'OKR Dashboard', type: 'board', database: 'OKRs & Goals', groupBy: 'Status' },
      { name: 'Q1 Goals', type: 'table', database: 'OKRs & Goals', filter: 'Quarter = Q1 2025' },
      { name: 'Investor Pipeline', type: 'board', database: 'Investor Pipeline', groupBy: 'Stage' },
      { name: 'Hot Investors', type: 'table', database: 'Investor Pipeline', filter: 'Stage in Partner Meeting, Due Diligence, Term Sheet' },
      { name: 'Hiring Board', type: 'board', database: 'Hiring Pipeline', groupBy: 'Stage' },
      { name: 'Open Roles', type: 'table', database: 'Hiring Pipeline', filter: 'Stage not in Hired, Rejected' }
    ]
  },

  // ============================================
  // SCHOOL TEMPLATES
  // ============================================

  'student-life': {
    emoji: '🎓',
    name: 'Student Life Hub',
    tagline: 'Ace your academics while enjoying college life',
    description: 'A complete student management system with assignment tracking, grade calculator, study planner, and extracurricular organizer. Perfect for high school and college students.',
    
    databases: [
      {
        name: 'Assignments',
        emoji: '📚',
        description: 'Track all homework, projects, and papers',
        properties: [
          { name: 'Assignment', type: 'title', icon: '📝' },
          { name: 'Course', type: 'select', icon: '📖', options: ['Math 101', 'English 200', 'Chemistry 150', 'History 120', 'CS 180', 'Art 110'] },
          { name: 'Type', type: 'select', icon: '📋', options: ['Homework', 'Quiz', 'Midterm', 'Final', 'Project', 'Paper', 'Lab Report', 'Presentation'] },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Not Started', 'In Progress', 'Done', 'Submitted', 'Graded'] },
          { name: 'Due Date', type: 'date', icon: '📅' },
          { name: 'Weight', type: 'number', icon: '⚖️' },
          { name: 'Grade', type: 'number', icon: '💯' },
          { name: 'Priority', type: 'select', icon: '🎯', options: ['High', 'Medium', 'Low'] },
          { name: 'Time Estimate', type: 'text', icon: '⏱️' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Assignment: 'Calculus Problem Set #5', Course: 'Math 101', Type: 'Homework', Status: 'In Progress', Weight: 5, Priority: 'High', 'Time Estimate': '2 hours', Notes: 'Focus on integration by parts' },
          { Assignment: 'Research Paper - Civil War', Course: 'History 120', Type: 'Paper', Status: 'Not Started', Weight: 25, Priority: 'High', 'Time Estimate': '10 hours', Notes: 'Need 5 primary sources' },
          { Assignment: 'Python Programming Project', Course: 'CS 180', Type: 'Project', Status: 'In Progress', Weight: 20, Priority: 'Medium', 'Time Estimate': '8 hours', Notes: 'Build a web scraper' },
          { Assignment: 'Chemistry Lab Report #3', Course: 'Chemistry 150', Type: 'Lab Report', Status: 'Submitted', Weight: 10, Grade: 92, Priority: 'Low' },
          { Assignment: 'Midterm Exam', Course: 'English 200', Type: 'Midterm', Status: 'Graded', Weight: 20, Grade: 88, Priority: 'High' },
          { Assignment: 'Portfolio Presentation', Course: 'Art 110', Type: 'Presentation', Status: 'Not Started', Weight: 15, Priority: 'Medium', 'Time Estimate': '5 hours' }
        ]
      },
      {
        name: 'Courses',
        emoji: '📖',
        description: 'Course information and grades',
        properties: [
          { name: 'Course', type: 'title', icon: '📖' },
          { name: 'Instructor', type: 'text', icon: '👨‍🏫' },
          { name: 'Schedule', type: 'text', icon: '🕐' },
          { name: 'Location', type: 'text', icon: '📍' },
          { name: 'Credits', type: 'number', icon: '🎓' },
          { name: 'Current Grade', type: 'number', icon: '💯' },
          { name: 'Target Grade', type: 'select', icon: '🎯', options: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'Pass'] },
          { name: 'Office Hours', type: 'text', icon: '🚪' },
          { name: 'Syllabus', type: 'files', icon: '📄' }
        ],
        sampleData: [
          { Course: 'Math 101 - Calculus I', Instructor: 'Dr. Smith', Schedule: 'MWF 9:00-10:00', Location: 'Science Hall 201', Credits: 4, 'Current Grade': 91, 'Target Grade': 'A', 'Office Hours': 'Tu/Th 2-4pm' },
          { Course: 'English 200 - Writing', Instructor: 'Prof. Johnson', Schedule: 'TuTh 11:00-12:30', Location: 'Arts Building 105', Credits: 3, 'Current Grade': 88, 'Target Grade': 'A-', 'Office Hours': 'Wed 1-3pm' },
          { Course: 'Chemistry 150 - Intro', Instructor: 'Dr. Lee', Schedule: 'MWF 2:00-3:00', Location: 'Chemistry Lab', Credits: 4, 'Current Grade': 85, 'Target Grade': 'B+' },
          { Course: 'History 120 - US History', Instructor: 'Prof. Davis', Schedule: 'TuTh 9:30-11:00', Location: 'Humanities 302', Credits: 3, 'Current Grade': 93, 'Target Grade': 'A' },
          { Course: 'CS 180 - Intro to Programming', Instructor: 'Prof. Chen', Schedule: 'MWF 11:00-12:00', Location: 'Tech Center 101', Credits: 3, 'Current Grade': 95, 'Target Grade': 'A' }
        ]
      },
      {
        name: 'Study Sessions',
        emoji: '📝',
        description: 'Plan and track study time',
        properties: [
          { name: 'Topic', type: 'title', icon: '📝' },
          { name: 'Course', type: 'select', icon: '📖', options: ['Math 101', 'English 200', 'Chemistry 150', 'History 120', 'CS 180', 'Art 110'] },
          { name: 'Type', type: 'select', icon: '📋', options: ['Review', 'Practice Problems', 'Reading', 'Writing', 'Group Study', 'Office Hours', 'Tutoring'] },
          { name: 'Date', type: 'date', icon: '📅' },
          { name: 'Duration', type: 'number', icon: '⏱️' },
          { name: 'Location', type: 'text', icon: '📍' },
          { name: 'Completed', type: 'checkbox', icon: '✅' },
          { name: 'Effectiveness', type: 'select', icon: '📊', options: ['Very Effective', 'Effective', 'Okay', 'Not Effective'] }
        ],
        sampleData: [
          { Topic: 'Integration techniques review', Course: 'Math 101', Type: 'Practice Problems', Duration: 2, Location: 'Library 3rd floor', Completed: true, Effectiveness: 'Very Effective' },
          { Topic: 'Civil War primary sources', Course: 'History 120', Type: 'Reading', Duration: 3, Location: 'Dorm room', Completed: false },
          { Topic: 'Python functions practice', Course: 'CS 180', Type: 'Practice Problems', Duration: 2, Location: 'Computer Lab', Completed: true, Effectiveness: 'Effective' },
          { Topic: 'Essay outline with Prof', Course: 'English 200', Type: 'Office Hours', Duration: 1, Location: 'Prof Office', Completed: false },
          { Topic: 'Chemistry study group', Course: 'Chemistry 150', Type: 'Group Study', Duration: 2, Location: 'Student Union', Completed: true, Effectiveness: 'Effective' }
        ]
      },
      {
        name: 'Extracurriculars',
        emoji: '🎭',
        description: 'Clubs, sports, and activities',
        properties: [
          { name: 'Activity', type: 'title', icon: '🎭' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Club', 'Sport', 'Volunteer', 'Job', 'Research', 'Other'] },
          { name: 'Role', type: 'text', icon: '👤' },
          { name: 'Time Commitment', type: 'text', icon: '⏱️' },
          { name: 'Meeting Time', type: 'text', icon: '📅' },
          { name: 'Location', type: 'text', icon: '📍' },
          { name: 'Contact', type: 'text', icon: '📧' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Activity: 'Computer Science Club', Type: 'Club', Role: 'Vice President', 'Time Commitment': '5 hrs/week', 'Meeting Time': 'Wednesdays 7pm', Location: 'Tech Center 201' },
          { Activity: 'Intramural Basketball', Type: 'Sport', Role: 'Team Captain', 'Time Commitment': '4 hrs/week', 'Meeting Time': 'Tuesdays & Thursdays 6pm', Location: 'Rec Center' },
          { Activity: 'Food Bank Volunteer', Type: 'Volunteer', Role: 'Volunteer', 'Time Commitment': '3 hrs/week', 'Meeting Time': 'Saturdays 9am', Location: 'Downtown Food Bank' },
          { Activity: 'Library Front Desk', Type: 'Job', Role: 'Student Worker', 'Time Commitment': '10 hrs/week', 'Meeting Time': 'Mon/Wed/Fri 4-7pm', Location: 'Main Library' },
          { Activity: 'AI Research Assistant', Type: 'Research', Role: 'Research Assistant', 'Time Commitment': '8 hrs/week', Location: 'AI Lab', Notes: 'Working on NLP project with Prof. Chen' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'This Week\'s Assignments', type: 'calendar', description: 'Upcoming due dates' },
      { title: 'GPA Tracker', type: 'metric', description: 'Current semester GPA' },
      { title: 'Study Hours', type: 'chart', description: 'Weekly study time by course' },
      { title: 'Grade Progress', type: 'progress', description: 'Progress toward target grades' }
    ],
    
    gettingStarted: [
      'Welcome to your Student Life Hub! Stay organized and ace your semester.',
      '1. **Add your courses** - Enter all classes with schedules and instructors',
      '2. **Track assignments** - Log every homework, project, and exam',
      '3. **Plan study sessions** - Schedule dedicated study time',
      '4. **Manage activities** - Keep track of clubs, sports, and jobs',
      '5. **Review weekly** - Check your dashboard every Sunday to plan ahead'
    ],
    
    views: [
      { name: 'Assignment Board', type: 'board', database: 'Assignments', groupBy: 'Status' },
      { name: 'Due This Week', type: 'calendar', database: 'Assignments', dateProperty: 'Due Date' },
      { name: 'By Course', type: 'table', database: 'Assignments', groupBy: 'Course' },
      { name: 'Grade Calculator', type: 'table', database: 'Courses' },
      { name: 'Study Calendar', type: 'calendar', database: 'Study Sessions', dateProperty: 'Date' },
      { name: 'Weekly Schedule', type: 'table', database: 'Extracurriculars' }
    ]
  },

  // ============================================
  // LIFE TEMPLATES
  // ============================================

  'productivity': {
    emoji: '⚡',
    name: 'Life Dashboard',
    tagline: 'Take control of your time, goals, and habits',
    description: 'A comprehensive personal productivity system with goal tracking, habit builder, daily planner, and life areas management. Based on proven productivity frameworks like GTD and Atomic Habits.',
    
    databases: [
      {
        name: 'Goals',
        emoji: '🎯',
        description: 'Long-term and short-term goals',
        properties: [
          { name: 'Goal', type: 'title', icon: '🎯' },
          { name: 'Area', type: 'select', icon: '📊', options: ['Career', 'Health', 'Finance', 'Relationships', 'Learning', 'Personal', 'Creative'] },
          { name: 'Timeframe', type: 'select', icon: '📅', options: ['This Week', 'This Month', 'This Quarter', 'This Year', '5 Years', 'Lifetime'] },
          { name: 'Status', type: 'select', icon: '🔄', options: ['Not Started', 'In Progress', 'On Hold', 'Achieved', 'Abandoned'] },
          { name: 'Progress', type: 'number', icon: '📈' },
          { name: 'Target Date', type: 'date', icon: '📅' },
          { name: 'Why', type: 'text', icon: '❓' },
          { name: 'Success Criteria', type: 'text', icon: '✅' },
          { name: 'Next Action', type: 'text', icon: '➡️' }
        ],
        sampleData: [
          { Goal: 'Get promoted to Senior Engineer', Area: 'Career', Timeframe: 'This Year', Status: 'In Progress', Progress: 60, Why: 'Advance my career and increase income', 'Success Criteria': 'Official title change and salary increase', 'Next Action': 'Schedule 1:1 with manager to discuss path' },
          { Goal: 'Run a marathon', Area: 'Health', Timeframe: 'This Year', Status: 'In Progress', Progress: 40, Why: 'Prove to myself I can do hard things', 'Success Criteria': 'Complete 26.2 miles', 'Next Action': 'Increase weekly mileage to 25 miles' },
          { Goal: 'Save $50,000 emergency fund', Area: 'Finance', Timeframe: 'This Year', Status: 'In Progress', Progress: 70, Why: 'Financial security and peace of mind', 'Success Criteria': '$50K in savings account', 'Next Action': 'Automate additional $500/month transfer' },
          { Goal: 'Learn Spanish to B2 level', Area: 'Learning', Timeframe: 'This Year', Status: 'In Progress', Progress: 30, Why: 'Travel in South America, connect with more people', 'Success Criteria': 'Pass B2 certification exam', 'Next Action': 'Complete Duolingo daily + 1 iTalki session/week' },
          { Goal: 'Write and publish a book', Area: 'Creative', Timeframe: '5 Years', Status: 'Not Started', Progress: 5, Why: 'Share my knowledge and leave a legacy', 'Success Criteria': 'Book available on Amazon', 'Next Action': 'Create book outline' }
        ]
      },
      {
        name: 'Habits',
        emoji: '🔄',
        description: 'Daily and weekly habits to build',
        properties: [
          { name: 'Habit', type: 'title', icon: '🔄' },
          { name: 'Frequency', type: 'select', icon: '📅', options: ['Daily', 'Weekdays', 'Weekends', 'Weekly', '3x/Week'] },
          { name: 'Area', type: 'select', icon: '📊', options: ['Health', 'Productivity', 'Learning', 'Mindfulness', 'Social', 'Finance'] },
          { name: 'Time of Day', type: 'select', icon: '🌅', options: ['Morning', 'Afternoon', 'Evening', 'Anytime'] },
          { name: 'Duration', type: 'text', icon: '⏱️' },
          { name: 'Current Streak', type: 'number', icon: '🔥' },
          { name: 'Best Streak', type: 'number', icon: '🏆' },
          { name: 'Cue', type: 'text', icon: '🔔' },
          { name: 'Reward', type: 'text', icon: '🎁' },
          { name: 'Status', type: 'select', icon: '✅', options: ['Active', 'Paused', 'Completed'] }
        ],
        sampleData: [
          { Habit: 'Morning meditation', Frequency: 'Daily', Area: 'Mindfulness', 'Time of Day': 'Morning', Duration: '10 min', 'Current Streak': 45, 'Best Streak': 60, Cue: 'After waking up, before phone', Reward: 'Peaceful start to day', Status: 'Active' },
          { Habit: 'Exercise', Frequency: 'Weekdays', Area: 'Health', 'Time of Day': 'Morning', Duration: '45 min', 'Current Streak': 12, 'Best Streak': 30, Cue: 'After meditation', Reward: 'Post-workout smoothie', Status: 'Active' },
          { Habit: 'Read 30 pages', Frequency: 'Daily', Area: 'Learning', 'Time of Day': 'Evening', Duration: '30 min', 'Current Streak': 21, 'Best Streak': 45, Cue: 'After dinner, on couch', Reward: 'Track on Goodreads', Status: 'Active' },
          { Habit: 'Journal', Frequency: 'Daily', Area: 'Mindfulness', 'Time of Day': 'Evening', Duration: '15 min', 'Current Streak': 8, 'Best Streak': 30, Cue: 'Before bed', Reward: 'Clarity and reflection', Status: 'Active' },
          { Habit: 'Spanish practice', Frequency: 'Daily', Area: 'Learning', 'Time of Day': 'Afternoon', Duration: '20 min', 'Current Streak': 30, 'Best Streak': 30, Cue: 'Lunch break', Reward: 'Track progress', Status: 'Active' },
          { Habit: 'Weekly review', Frequency: 'Weekly', Area: 'Productivity', 'Time of Day': 'Morning', Duration: '1 hour', 'Current Streak': 6, 'Best Streak': 12, Cue: 'Sunday morning coffee', Reward: 'Feeling prepared for week', Status: 'Active' }
        ]
      },
      {
        name: 'Tasks',
        emoji: '✅',
        description: 'Daily tasks and to-dos',
        properties: [
          { name: 'Task', type: 'title', icon: '✅' },
          { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'Done', 'Waiting', 'Someday'] },
          { name: 'Priority', type: 'select', icon: '🎯', options: ['🔴 Urgent', '🟠 High', '🟡 Medium', '🟢 Low'] },
          { name: 'Due Date', type: 'date', icon: '📅' },
          { name: 'Area', type: 'select', icon: '📊', options: ['Work', 'Personal', 'Health', 'Finance', 'Home', 'Learning'] },
          { name: 'Energy', type: 'select', icon: '⚡', options: ['High', 'Medium', 'Low'] },
          { name: 'Time Estimate', type: 'text', icon: '⏱️' },
          { name: 'Goal', type: 'relation', icon: '🎯' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Task: 'Prepare presentation for Monday', Status: 'In Progress', Priority: '🔴 Urgent', Area: 'Work', Energy: 'High', 'Time Estimate': '3 hours' },
          { Task: 'Schedule dentist appointment', Status: 'To Do', Priority: '🟡 Medium', Area: 'Health', Energy: 'Low', 'Time Estimate': '15 min' },
          { Task: 'Review monthly budget', Status: 'To Do', Priority: '🟠 High', Area: 'Finance', Energy: 'Medium', 'Time Estimate': '1 hour' },
          { Task: 'Call mom', Status: 'To Do', Priority: '🟡 Medium', Area: 'Personal', Energy: 'Low', 'Time Estimate': '30 min' },
          { Task: 'Research marathon training plans', Status: 'Done', Priority: '🟡 Medium', Area: 'Health', Energy: 'Medium', 'Time Estimate': '1 hour' },
          { Task: 'Fix leaky faucet', Status: 'Someday', Priority: '🟢 Low', Area: 'Home', Energy: 'Medium', 'Time Estimate': '2 hours' },
          { Task: 'Waiting: Response from client', Status: 'Waiting', Priority: '🟠 High', Area: 'Work', Notes: 'Follow up if no response by Friday' }
        ]
      },
      {
        name: 'Life Areas',
        emoji: '🌟',
        description: 'Track balance across life areas',
        properties: [
          { name: 'Area', type: 'title', icon: '🌟' },
          { name: 'Current Score', type: 'number', icon: '📊' },
          { name: 'Target Score', type: 'number', icon: '🎯' },
          { name: 'Priority', type: 'select', icon: '⭐', options: ['High Focus', 'Maintain', 'Low Focus'] },
          { name: 'What\'s Working', type: 'text', icon: '✅' },
          { name: 'What Needs Work', type: 'text', icon: '🔧' },
          { name: 'Key Actions', type: 'text', icon: '➡️' }
        ],
        sampleData: [
          { Area: 'Career', 'Current Score': 7, 'Target Score': 9, Priority: 'High Focus', 'What\'s Working': 'Good relationship with manager, learning new skills', 'What Needs Work': 'Need more visibility on projects', 'Key Actions': 'Volunteer for cross-team projects, present at team meetings' },
          { Area: 'Health & Fitness', 'Current Score': 6, 'Target Score': 8, Priority: 'High Focus', 'What\'s Working': 'Consistent gym routine', 'What Needs Work': 'Nutrition could be better, sleep is inconsistent', 'Key Actions': 'Meal prep Sundays, no screens after 10pm' },
          { Area: 'Relationships', 'Current Score': 8, 'Target Score': 9, Priority: 'Maintain', 'What\'s Working': 'Great relationship with partner, close friends', 'What Needs Work': 'Haven\'t seen family in a while', 'Key Actions': 'Plan trip home, schedule monthly friend dinners' },
          { Area: 'Finance', 'Current Score': 7, 'Target Score': 8, Priority: 'Maintain', 'What\'s Working': 'Saving consistently, no debt', 'What Needs Work': 'Could optimize investments', 'Key Actions': 'Research index funds, max out 401k' },
          { Area: 'Learning & Growth', 'Current Score': 6, 'Target Score': 8, Priority: 'High Focus', 'What\'s Working': 'Reading habit established', 'What Needs Work': 'Need more structured learning', 'Key Actions': 'Enroll in online course, join study group' },
          { Area: 'Fun & Recreation', 'Current Score': 5, 'Target Score': 7, Priority: 'Low Focus', 'What\'s Working': 'Occasional hobbies', 'What Needs Work': 'Work-life balance', 'Key Actions': 'Block weekends for hobbies, try new activity monthly' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'Today\'s Focus', type: 'list', description: 'Top 3 priorities for today' },
      { title: 'Habit Streaks', type: 'metrics', description: 'Current streak for each habit' },
      { title: 'Goal Progress', type: 'progress', description: 'Progress on active goals' },
      { title: 'Life Balance Wheel', type: 'chart', description: 'Score across all life areas' },
      { title: 'Weekly Review', type: 'template', description: 'Reflect on the week' }
    ],
    
    gettingStarted: [
      'Welcome to your Life Dashboard! Your personal command center for living intentionally.',
      '1. **Set your goals** - Define what you want to achieve across different life areas',
      '2. **Build habits** - Create daily routines that move you toward your goals',
      '3. **Manage tasks** - Capture all your to-dos and prioritize ruthlessly',
      '4. **Review life areas** - Score yourself in each area and identify focus areas',
      '5. **Weekly review** - Spend 30 min every Sunday planning the week ahead'
    ],
    
    views: [
      { name: 'Goal Dashboard', type: 'board', database: 'Goals', groupBy: 'Area' },
      { name: 'Active Goals', type: 'table', database: 'Goals', filter: 'Status = In Progress' },
      { name: 'Habit Tracker', type: 'table', database: 'Habits', filter: 'Status = Active' },
      { name: 'Today\'s Tasks', type: 'list', database: 'Tasks', filter: 'Due Date = Today' },
      { name: 'Task Board', type: 'board', database: 'Tasks', groupBy: 'Status' },
      { name: 'By Priority', type: 'table', database: 'Tasks', groupBy: 'Priority' },
      { name: 'Life Balance', type: 'table', database: 'Life Areas' }
    ]
  },

  'finance': {
    emoji: '💰',
    name: 'Personal Finance Hub',
    tagline: 'Take control of your money and build wealth',
    description: 'A comprehensive personal finance system with budget tracking, expense management, investment portfolio, and financial goals. Based on proven money management principles.',
    
    databases: [
      {
        name: 'Transactions',
        emoji: '💸',
        description: 'Track all income and expenses',
        properties: [
          { name: 'Description', type: 'title', icon: '📝' },
          { name: 'Type', type: 'select', icon: '📊', options: ['Income', 'Expense', 'Transfer'] },
          { name: 'Category', type: 'select', icon: '📁', options: ['Salary', 'Freelance', 'Housing', 'Food', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Subscriptions', 'Other'] },
          { name: 'Amount', type: 'number', icon: '💰' },
          { name: 'Date', type: 'date', icon: '📅' },
          { name: 'Account', type: 'select', icon: '🏦', options: ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'] },
          { name: 'Recurring', type: 'checkbox', icon: '🔄' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Description: 'Monthly Salary', Type: 'Income', Category: 'Salary', Amount: 6500, Account: 'Checking', Recurring: true },
          { Description: 'Rent Payment', Type: 'Expense', Category: 'Housing', Amount: 1800, Account: 'Checking', Recurring: true },
          { Description: 'Groceries - Whole Foods', Type: 'Expense', Category: 'Food', Amount: 156.32, Account: 'Credit Card', Recurring: false },
          { Description: 'Netflix Subscription', Type: 'Expense', Category: 'Subscriptions', Amount: 15.99, Account: 'Credit Card', Recurring: true },
          { Description: 'Gas Station', Type: 'Expense', Category: 'Transportation', Amount: 48.50, Account: 'Credit Card', Recurring: false },
          { Description: 'Freelance Project', Type: 'Income', Category: 'Freelance', Amount: 2000, Account: 'Checking', Recurring: false },
          { Description: 'Electric Bill', Type: 'Expense', Category: 'Utilities', Amount: 95.00, Account: 'Checking', Recurring: true },
          { Description: 'Transfer to Savings', Type: 'Transfer', Category: 'Other', Amount: 1000, Account: 'Savings', Recurring: true }
        ]
      },
      {
        name: 'Budget',
        emoji: '📊',
        description: 'Monthly budget by category',
        properties: [
          { name: 'Category', type: 'title', icon: '📁' },
          { name: 'Budget', type: 'number', icon: '💰' },
          { name: 'Spent', type: 'number', icon: '💸' },
          { name: 'Remaining', type: 'formula', icon: '📊' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Fixed', 'Variable', 'Discretionary'] },
          { name: 'Priority', type: 'select', icon: '⭐', options: ['Essential', 'Important', 'Nice to Have'] },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Category: 'Housing', Budget: 1800, Spent: 1800, Type: 'Fixed', Priority: 'Essential' },
          { Category: 'Food & Groceries', Budget: 600, Spent: 425, Type: 'Variable', Priority: 'Essential' },
          { Category: 'Transportation', Budget: 300, Spent: 180, Type: 'Variable', Priority: 'Essential' },
          { Category: 'Utilities', Budget: 200, Spent: 175, Type: 'Fixed', Priority: 'Essential' },
          { Category: 'Entertainment', Budget: 200, Spent: 85, Type: 'Discretionary', Priority: 'Nice to Have' },
          { Category: 'Shopping', Budget: 150, Spent: 200, Type: 'Discretionary', Priority: 'Nice to Have', Notes: 'Over budget - cut back next month' },
          { Category: 'Health & Fitness', Budget: 150, Spent: 75, Type: 'Variable', Priority: 'Important' },
          { Category: 'Subscriptions', Budget: 100, Spent: 85, Type: 'Fixed', Priority: 'Nice to Have' },
          { Category: 'Savings', Budget: 1500, Spent: 1500, Type: 'Fixed', Priority: 'Essential' }
        ]
      },
      {
        name: 'Financial Goals',
        emoji: '🎯',
        description: 'Savings and financial goals',
        properties: [
          { name: 'Goal', type: 'title', icon: '🎯' },
          { name: 'Target Amount', type: 'number', icon: '💰' },
          { name: 'Current Amount', type: 'number', icon: '📈' },
          { name: 'Progress', type: 'formula', icon: '📊' },
          { name: 'Target Date', type: 'date', icon: '📅' },
          { name: 'Monthly Contribution', type: 'number', icon: '💵' },
          { name: 'Priority', type: 'select', icon: '⭐', options: ['High', 'Medium', 'Low'] },
          { name: 'Account', type: 'text', icon: '🏦' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Goal: 'Emergency Fund (6 months)', 'Target Amount': 30000, 'Current Amount': 22500, 'Monthly Contribution': 500, Priority: 'High', Account: 'High-Yield Savings' },
          { Goal: 'House Down Payment', 'Target Amount': 100000, 'Current Amount': 35000, 'Monthly Contribution': 1000, Priority: 'High', Account: 'Investment Account' },
          { Goal: 'Vacation Fund', 'Target Amount': 5000, 'Current Amount': 2000, 'Monthly Contribution': 200, Priority: 'Medium', Account: 'Savings' },
          { Goal: 'New Car Fund', 'Target Amount': 15000, 'Current Amount': 8000, 'Monthly Contribution': 300, Priority: 'Medium', Account: 'Savings' },
          { Goal: 'Retirement (401k)', 'Target Amount': 1000000, 'Current Amount': 125000, 'Monthly Contribution': 1625, Priority: 'High', Account: '401k', Notes: 'Maxing out contributions + employer match' }
        ]
      },
      {
        name: 'Accounts',
        emoji: '🏦',
        description: 'Bank and investment accounts',
        properties: [
          { name: 'Account', type: 'title', icon: '🏦' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Checking', 'Savings', 'Credit Card', 'Investment', 'Retirement', 'Loan'] },
          { name: 'Institution', type: 'text', icon: '🏛️' },
          { name: 'Balance', type: 'number', icon: '💰' },
          { name: 'APY/APR', type: 'text', icon: '📈' },
          { name: 'Last Updated', type: 'date', icon: '📅' },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Account: 'Primary Checking', Type: 'Checking', Institution: 'Chase', Balance: 5420, 'APY/APR': '0.01%' },
          { Account: 'Emergency Fund', Type: 'Savings', Institution: 'Marcus', Balance: 22500, 'APY/APR': '4.50%' },
          { Account: 'Travel Rewards Card', Type: 'Credit Card', Institution: 'Chase Sapphire', Balance: -1250, 'APY/APR': '24.99%', Notes: 'Pay in full each month' },
          { Account: 'Brokerage', Type: 'Investment', Institution: 'Fidelity', Balance: 45000, Notes: 'Index funds' },
          { Account: '401k', Type: 'Retirement', Institution: 'Vanguard', Balance: 125000, Notes: 'Target date fund 2055' },
          { Account: 'Roth IRA', Type: 'Retirement', Institution: 'Vanguard', Balance: 35000, Notes: 'Maxed out for 2024' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'Net Worth', type: 'metric', description: 'Total assets minus liabilities' },
      { title: 'Monthly Cash Flow', type: 'chart', description: 'Income vs Expenses' },
      { title: 'Budget Status', type: 'progress', description: 'Spending vs Budget by category' },
      { title: 'Goal Progress', type: 'progress', description: 'Progress toward financial goals' },
      { title: 'Account Balances', type: 'metrics', description: 'All account balances at a glance' }
    ],
    
    gettingStarted: [
      'Welcome to your Personal Finance Hub! Take control of your financial future.',
      '1. **Set up accounts** - Add all your bank, credit card, and investment accounts',
      '2. **Create your budget** - Set spending limits for each category',
      '3. **Track transactions** - Log income and expenses (or import from bank)',
      '4. **Set financial goals** - Define savings targets and timelines',
      '5. **Review monthly** - Check progress and adjust budget as needed'
    ],
    
    views: [
      { name: 'Recent Transactions', type: 'table', database: 'Transactions', groupBy: 'Category' },
      { name: 'This Month', type: 'table', database: 'Transactions', filter: 'This Month' },
      { name: 'Budget Overview', type: 'table', database: 'Budget' },
      { name: 'Goal Tracker', type: 'board', database: 'Financial Goals', groupBy: 'Priority' },
      { name: 'Account Summary', type: 'table', database: 'Accounts', groupBy: 'Type' },
      { name: 'Recurring Expenses', type: 'table', database: 'Transactions', filter: 'Recurring = True' }
    ]
  },

  'health': {
    emoji: '💪',
    name: 'Health & Wellness Hub',
    tagline: 'Track workouts, nutrition, and build healthy habits',
    description: 'A comprehensive health management system with workout tracking, meal planning, habit building, and wellness metrics. Perfect for fitness enthusiasts and anyone building a healthier lifestyle.',
    
    databases: [
      {
        name: 'Workouts',
        emoji: '🏋️',
        description: 'Track all exercises and workouts',
        properties: [
          { name: 'Workout', type: 'title', icon: '🏋️' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Sports', 'Walking', 'Swimming', 'Cycling', 'Other'] },
          { name: 'Date', type: 'date', icon: '📅' },
          { name: 'Duration', type: 'number', icon: '⏱️' },
          { name: 'Calories Burned', type: 'number', icon: '🔥' },
          { name: 'Intensity', type: 'select', icon: '💪', options: ['Light', 'Moderate', 'Intense', 'Max Effort'] },
          { name: 'Location', type: 'select', icon: '📍', options: ['Home', 'Gym', 'Outdoors', 'Studio', 'Pool'] },
          { name: 'Exercises', type: 'text', icon: '📝' },
          { name: 'Notes', type: 'text', icon: '📝' },
          { name: 'Feeling', type: 'select', icon: '😊', options: ['Amazing', 'Good', 'Okay', 'Tired', 'Struggled'] }
        ],
        sampleData: [
          { Workout: 'Upper Body Strength', Type: 'Strength', Duration: 60, 'Calories Burned': 350, Intensity: 'Intense', Location: 'Gym', Exercises: 'Bench press 4x8, Rows 4x10, Shoulder press 3x12, Bicep curls 3x15', Feeling: 'Good' },
          { Workout: 'Morning Run', Type: 'Cardio', Duration: 35, 'Calories Burned': 400, Intensity: 'Moderate', Location: 'Outdoors', Exercises: '5K run, 8:30 pace', Feeling: 'Amazing' },
          { Workout: 'HIIT Circuit', Type: 'HIIT', Duration: 25, 'Calories Burned': 300, Intensity: 'Max Effort', Location: 'Home', Exercises: 'Burpees, Mountain climbers, Jump squats, Plank jacks', Feeling: 'Tired' },
          { Workout: 'Yoga Flow', Type: 'Yoga', Duration: 45, 'Calories Burned': 150, Intensity: 'Light', Location: 'Studio', Exercises: 'Vinyasa flow class', Feeling: 'Amazing' },
          { Workout: 'Leg Day', Type: 'Strength', Duration: 55, 'Calories Burned': 400, Intensity: 'Intense', Location: 'Gym', Exercises: 'Squats 5x5, Deadlifts 3x8, Lunges 3x12, Leg press 3x15', Feeling: 'Good' }
        ]
      },
      {
        name: 'Meal Log',
        emoji: '🥗',
        description: 'Track meals and nutrition',
        properties: [
          { name: 'Meal', type: 'title', icon: '🍽️' },
          { name: 'Type', type: 'select', icon: '📋', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'] },
          { name: 'Date', type: 'date', icon: '📅' },
          { name: 'Calories', type: 'number', icon: '🔥' },
          { name: 'Protein', type: 'number', icon: '🥩' },
          { name: 'Carbs', type: 'number', icon: '🍞' },
          { name: 'Fat', type: 'number', icon: '🥑' },
          { name: 'Ingredients', type: 'text', icon: '📝' },
          { name: 'Homemade', type: 'checkbox', icon: '👨‍🍳' },
          { name: 'Rating', type: 'select', icon: '⭐', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐', '⭐'] }
        ],
        sampleData: [
          { Meal: 'Protein Oatmeal', Type: 'Breakfast', Calories: 450, Protein: 35, Carbs: 55, Fat: 12, Ingredients: 'Oats, protein powder, banana, almond butter, blueberries', Homemade: true, Rating: '⭐⭐⭐⭐⭐' },
          { Meal: 'Grilled Chicken Salad', Type: 'Lunch', Calories: 520, Protein: 45, Carbs: 25, Fat: 28, Ingredients: 'Chicken breast, mixed greens, avocado, tomatoes, olive oil dressing', Homemade: true, Rating: '⭐⭐⭐⭐' },
          { Meal: 'Salmon with Veggies', Type: 'Dinner', Calories: 650, Protein: 42, Carbs: 35, Fat: 38, Ingredients: 'Salmon fillet, roasted broccoli, sweet potato', Homemade: true, Rating: '⭐⭐⭐⭐⭐' },
          { Meal: 'Greek Yogurt Bowl', Type: 'Snack', Calories: 250, Protein: 20, Carbs: 30, Fat: 8, Ingredients: 'Greek yogurt, honey, granola, strawberries', Homemade: true, Rating: '⭐⭐⭐⭐' },
          { Meal: 'Protein Shake', Type: 'Post-Workout', Calories: 300, Protein: 40, Carbs: 25, Fat: 5, Ingredients: 'Whey protein, banana, almond milk, spinach', Homemade: true, Rating: '⭐⭐⭐⭐' }
        ]
      },
      {
        name: 'Wellness Metrics',
        emoji: '📊',
        description: 'Track daily health metrics',
        properties: [
          { name: 'Date', type: 'title', icon: '📅' },
          { name: 'Weight', type: 'number', icon: '⚖️' },
          { name: 'Sleep Hours', type: 'number', icon: '😴' },
          { name: 'Sleep Quality', type: 'select', icon: '🌙', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
          { name: 'Water (glasses)', type: 'number', icon: '💧' },
          { name: 'Steps', type: 'number', icon: '👣' },
          { name: 'Energy Level', type: 'select', icon: '⚡', options: ['High', 'Medium', 'Low'] },
          { name: 'Stress Level', type: 'select', icon: '😰', options: ['Low', 'Medium', 'High'] },
          { name: 'Mood', type: 'select', icon: '😊', options: ['Great', 'Good', 'Okay', 'Bad'] },
          { name: 'Notes', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Date: 'Monday Jan 20', Weight: 175.5, 'Sleep Hours': 7.5, 'Sleep Quality': 'Good', 'Water (glasses)': 8, Steps: 8500, 'Energy Level': 'High', 'Stress Level': 'Low', Mood: 'Great' },
          { Date: 'Tuesday Jan 21', Weight: 175.2, 'Sleep Hours': 6.5, 'Sleep Quality': 'Fair', 'Water (glasses)': 6, Steps: 6200, 'Energy Level': 'Medium', 'Stress Level': 'Medium', Mood: 'Good', Notes: 'Late night, tired today' },
          { Date: 'Wednesday Jan 22', Weight: 175.8, 'Sleep Hours': 8, 'Sleep Quality': 'Excellent', 'Water (glasses)': 10, Steps: 10500, 'Energy Level': 'High', 'Stress Level': 'Low', Mood: 'Great', Notes: 'Best sleep in weeks!' },
          { Date: 'Thursday Jan 23', Weight: 175.0, 'Sleep Hours': 7, 'Sleep Quality': 'Good', 'Water (glasses)': 8, Steps: 7800, 'Energy Level': 'Medium', 'Stress Level': 'Medium', Mood: 'Good' }
        ]
      },
      {
        name: 'Recipes',
        emoji: '📖',
        description: 'Healthy recipe collection',
        properties: [
          { name: 'Recipe', type: 'title', icon: '📖' },
          { name: 'Category', type: 'select', icon: '📁', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Smoothie', 'Dessert'] },
          { name: 'Prep Time', type: 'text', icon: '⏱️' },
          { name: 'Cook Time', type: 'text', icon: '🍳' },
          { name: 'Servings', type: 'number', icon: '🍽️' },
          { name: 'Calories', type: 'number', icon: '🔥' },
          { name: 'Protein', type: 'number', icon: '🥩' },
          { name: 'Tags', type: 'multi_select', icon: '🏷️', options: ['High Protein', 'Low Carb', 'Vegetarian', 'Vegan', 'Gluten Free', 'Quick', 'Meal Prep'] },
          { name: 'Rating', type: 'select', icon: '⭐', options: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐', '⭐'] },
          { name: 'Ingredients', type: 'text', icon: '🛒' },
          { name: 'Instructions', type: 'text', icon: '📝' }
        ],
        sampleData: [
          { Recipe: 'Overnight Protein Oats', Category: 'Breakfast', 'Prep Time': '5 min', 'Cook Time': '0 min', Servings: 1, Calories: 450, Protein: 35, Tags: ['High Protein', 'Quick', 'Meal Prep'], Rating: '⭐⭐⭐⭐⭐' },
          { Recipe: 'Chicken Stir Fry', Category: 'Dinner', 'Prep Time': '15 min', 'Cook Time': '15 min', Servings: 4, Calories: 380, Protein: 35, Tags: ['High Protein', 'Low Carb', 'Quick'], Rating: '⭐⭐⭐⭐' },
          { Recipe: 'Greek Salad Bowl', Category: 'Lunch', 'Prep Time': '10 min', 'Cook Time': '0 min', Servings: 2, Calories: 320, Protein: 15, Tags: ['Vegetarian', 'Low Carb', 'Quick'], Rating: '⭐⭐⭐⭐' },
          { Recipe: 'Protein Smoothie Bowl', Category: 'Smoothie', 'Prep Time': '5 min', 'Cook Time': '0 min', Servings: 1, Calories: 350, Protein: 30, Tags: ['High Protein', 'Quick', 'Vegetarian'], Rating: '⭐⭐⭐⭐⭐' }
        ]
      }
    ],
    
    dashboardSections: [
      { title: 'Weekly Summary', type: 'metrics', description: 'Workouts, calories, sleep average' },
      { title: 'Weight Trend', type: 'chart', description: 'Weight over time' },
      { title: 'Workout Calendar', type: 'calendar', description: 'Scheduled and completed workouts' },
      { title: 'Nutrition Overview', type: 'chart', description: 'Macros breakdown' },
      { title: 'Streak Tracker', type: 'metrics', description: 'Current exercise and habit streaks' }
    ],
    
    gettingStarted: [
      'Welcome to your Health & Wellness Hub! Your journey to a healthier you starts here.',
      '1. **Log your workouts** - Track every exercise session with details',
      '2. **Track your meals** - Log what you eat to understand your nutrition',
      '3. **Monitor daily metrics** - Record weight, sleep, water, and mood',
      '4. **Save recipes** - Build a collection of healthy go-to meals',
      '5. **Review weekly** - Check your progress and adjust your plan'
    ],
    
    views: [
      { name: 'Workout Log', type: 'table', database: 'Workouts', groupBy: 'Type' },
      { name: 'This Week\'s Workouts', type: 'calendar', database: 'Workouts', dateProperty: 'Date' },
      { name: 'Meal Log', type: 'table', database: 'Meal Log', groupBy: 'Type' },
      { name: 'Daily Metrics', type: 'table', database: 'Wellness Metrics' },
      { name: 'Recipe Collection', type: 'gallery', database: 'Recipes', groupBy: 'Category' },
      { name: 'High Protein Recipes', type: 'gallery', database: 'Recipes', filter: 'Tags contains High Protein' }
    ]
  }
}

// Fallback for other template types (simplified)
const BASIC_TEMPLATES = {
  'design': { emoji: '🎨', name: 'Design Hub', databases: [{ name: 'Projects', properties: [{ name: 'Project', type: 'title' }, { name: 'Status', type: 'select', options: ['Brief', 'In Design', 'Review', 'Done'] }], sampleData: [] }], views: [] },
  'engineering': { emoji: '⚙️', name: 'Engineering Hub', databases: [{ name: 'Issues', properties: [{ name: 'Issue', type: 'title' }, { name: 'Status', type: 'select', options: ['Open', 'In Progress', 'Done'] }], sampleData: [] }], views: [] },
  'operations': { emoji: '📊', name: 'Operations Hub', databases: [{ name: 'Processes', properties: [{ name: 'Process', type: 'title' }, { name: 'Status', type: 'select', options: ['Active', 'Review', 'Archived'] }], sampleData: [] }], views: [] },
  'hr': { emoji: '👥', name: 'HR Hub', databases: [{ name: 'Employees', properties: [{ name: 'Employee', type: 'title' }, { name: 'Department', type: 'select', options: ['Engineering', 'Marketing', 'Sales'] }], sampleData: [] }], views: [] },
  'study-planner': { emoji: '📚', name: 'Study Planner', databases: [{ name: 'Study Sessions', properties: [{ name: 'Topic', type: 'title' }, { name: 'Status', type: 'select', options: ['To Study', 'Studying', 'Mastered'] }], sampleData: [] }], views: [] },
  'class-notes': { emoji: '📝', name: 'Class Notes', databases: [{ name: 'Notes', properties: [{ name: 'Title', type: 'title' }, { name: 'Course', type: 'select', options: ['Math', 'Science', 'English'] }], sampleData: [] }], views: [] },
  'career': { emoji: '💼', name: 'Career Hub', databases: [{ name: 'Applications', properties: [{ name: 'Company', type: 'title' }, { name: 'Status', type: 'select', options: ['Applied', 'Interview', 'Offer'] }], sampleData: [] }], views: [] },
  'research': { emoji: '🔬', name: 'Research Hub', databases: [{ name: 'Papers', properties: [{ name: 'Paper', type: 'title' }, { name: 'Status', type: 'select', options: ['To Read', 'Reading', 'Done'] }], sampleData: [] }], views: [] },
  'teaching': { emoji: '👨‍🏫', name: 'Teaching Hub', databases: [{ name: 'Lessons', properties: [{ name: 'Lesson', type: 'title' }, { name: 'Subject', type: 'select', options: ['Math', 'Science', 'English'] }], sampleData: [] }], views: [] },
  'hobbies': { emoji: '🎯', name: 'Hobbies Hub', databases: [{ name: 'Projects', properties: [{ name: 'Project', type: 'title' }, { name: 'Status', type: 'select', options: ['Idea', 'In Progress', 'Done'] }], sampleData: [] }], views: [] },
  'travel': { emoji: '✈️', name: 'Travel Hub', databases: [{ name: 'Trips', properties: [{ name: 'Trip', type: 'title' }, { name: 'Status', type: 'select', options: ['Planning', 'Booked', 'Done'] }], sampleData: [] }], views: [] },
  'journal': { emoji: '📓', name: 'Journal Hub', databases: [{ name: 'Entries', properties: [{ name: 'Entry', type: 'title' }, { name: 'Mood', type: 'select', options: ['Great', 'Good', 'Okay', 'Bad'] }], sampleData: [] }], views: [] },
  'home': { emoji: '🏠', name: 'Home Hub', databases: [{ name: 'Tasks', properties: [{ name: 'Task', type: 'title' }, { name: 'Status', type: 'select', options: ['To Do', 'Done'] }], sampleData: [] }], views: [] }
}

// View configurations
const VIEW_CONFIGS = {
  table: { name: 'All Items', type: 'table', filter: null },
  board: { name: 'Board View', type: 'board', groupBy: 'Status' },
  calendar: { name: 'Calendar', type: 'calendar', dateProperty: 'Due Date' },
  gallery: { name: 'Gallery', type: 'gallery', coverProperty: null },
  list: { name: 'List View', type: 'list', filter: null },
  timeline: { name: 'Timeline', type: 'timeline', dateProperty: 'Due Date' }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const { 
      category, 
      subcategory, 
      name, 
      description, 
      colorTheme, 
      views, 
      includeEmoji, 
      includeCover, 
      contentLevel 
    } = body

    // Get premium template if available, otherwise use basic
    let templateStructure = PREMIUM_TEMPLATES[subcategory] || BASIC_TEMPLATES[subcategory]
    
    if (!templateStructure) {
      // Create a generic template
      templateStructure = {
        emoji: '📋',
        name: name || 'Custom Template',
        databases: [{
          name: 'Items',
          properties: [
            { name: 'Name', type: 'title', icon: '📝' },
            { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'Done'] }
          ],
          sampleData: []
        }],
        views: []
      }
    }

    // Build the comprehensive template
    const template = {
      title: name || templateStructure.name,
      description: description || templateStructure.description || `A ${subcategory} template`,
      tagline: templateStructure.tagline || '',
      emoji: includeEmoji ? templateStructure.emoji : null,
      category,
      subcategory,
      
      // Multiple databases
      databases: templateStructure.databases?.map(db => ({
        name: db.name,
        emoji: db.emoji,
        description: db.description,
        properties: db.properties || [],
        sampleData: contentLevel === 'full' ? (db.sampleData || []) : []
      })) || [],
      
      // Legacy single database for backward compatibility
      properties: templateStructure.databases?.[0]?.properties || [],
      sampleData: contentLevel === 'full' ? (templateStructure.databases?.[0]?.sampleData || []) : null,
      
      // Dashboard sections
      dashboardSections: templateStructure.dashboardSections || [],
      
      // Getting started guide
      gettingStarted: templateStructure.gettingStarted || [],
      
      // Pre-configured views
      views: views.map(viewId => {
        const config = VIEW_CONFIGS[viewId] || VIEW_CONFIGS.table
        return {
          ...config,
          name: `${name} ${config.name}`
        }
      }),
      
      // All configured views from template
      allViews: templateStructure.views || [],
      
      colorTheme,
      includeCover,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      template 
    })

  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
