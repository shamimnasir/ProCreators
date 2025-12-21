import { NextResponse } from 'next/server'

// Template structure definitions by category
const TEMPLATE_STRUCTURES = {
  // WORK TEMPLATES
  'product': {
    emoji: '📦',
    properties: [
      { name: 'Name', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Backlog', 'In Progress', 'Review', 'Done'] },
      { name: 'Priority', type: 'select', icon: '🎯', options: ['High', 'Medium', 'Low'] },
      { name: 'Sprint', type: 'select', icon: '🏃', options: ['Sprint 1', 'Sprint 2', 'Sprint 3'] },
      { name: 'Assignee', type: 'person', icon: '👤' },
      { name: 'Due Date', type: 'date', icon: '📅' },
      { name: 'Story Points', type: 'number', icon: '⭐' },
      { name: 'Type', type: 'select', icon: '📋', options: ['Feature', 'Bug', 'Task', 'Epic'] },
      { name: 'Tags', type: 'multi_select', icon: '🏷️', options: ['Frontend', 'Backend', 'Design', 'Research'] }
    ],
    sampleDataFull: [
      { Name: 'User Authentication Flow', Status: 'In Progress', Priority: 'High', Sprint: 'Sprint 1', 'Story Points': 8, Type: 'Feature' },
      { Name: 'Fix Login Bug', Status: 'Backlog', Priority: 'High', Sprint: 'Sprint 1', 'Story Points': 3, Type: 'Bug' },
      { Name: 'Dashboard Redesign', Status: 'Review', Priority: 'Medium', Sprint: 'Sprint 2', 'Story Points': 13, Type: 'Feature' },
      { Name: 'API Documentation', Status: 'Done', Priority: 'Low', Sprint: 'Sprint 1', 'Story Points': 5, Type: 'Task' },
      { Name: 'Performance Optimization', Status: 'Backlog', Priority: 'Medium', Sprint: 'Sprint 2', 'Story Points': 8, Type: 'Task' }
    ]
  },
  'marketing': {
    emoji: '📢',
    properties: [
      { name: 'Campaign', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Planning', 'Active', 'Completed', 'On Hold'] },
      { name: 'Channel', type: 'multi_select', icon: '📡', options: ['Email', 'Social', 'Paid Ads', 'SEO', 'Content'] },
      { name: 'Budget', type: 'number', icon: '💰' },
      { name: 'Start Date', type: 'date', icon: '📅' },
      { name: 'End Date', type: 'date', icon: '🏁' },
      { name: 'Owner', type: 'person', icon: '👤' },
      { name: 'Target Audience', type: 'select', icon: '🎯', options: ['B2B', 'B2C', 'Enterprise', 'SMB'] },
      { name: 'KPI', type: 'text', icon: '📊' }
    ],
    sampleDataFull: [
      { Campaign: 'Summer Sale 2024', Status: 'Active', Channel: ['Email', 'Social'], Budget: 5000, 'Target Audience': 'B2C' },
      { Campaign: 'Product Launch', Status: 'Planning', Channel: ['Paid Ads', 'Content'], Budget: 15000, 'Target Audience': 'B2B' },
      { Campaign: 'Brand Awareness', Status: 'Active', Channel: ['Social', 'Content'], Budget: 3000, 'Target Audience': 'B2C' },
      { Campaign: 'Webinar Series', Status: 'Completed', Channel: ['Email'], Budget: 1000, 'Target Audience': 'Enterprise' },
      { Campaign: 'SEO Optimization', Status: 'Active', Channel: ['SEO', 'Content'], Budget: 2000, 'Target Audience': 'SMB' }
    ]
  },
  'design': {
    emoji: '🎨',
    properties: [
      { name: 'Project', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Brief', 'In Design', 'Feedback', 'Approved', 'Delivered'] },
      { name: 'Type', type: 'select', icon: '🎯', options: ['UI/UX', 'Branding', 'Marketing', 'Illustration'] },
      { name: 'Client', type: 'text', icon: '🏢' },
      { name: 'Designer', type: 'person', icon: '👤' },
      { name: 'Due Date', type: 'date', icon: '📅' },
      { name: 'Files', type: 'files', icon: '📎' },
      { name: 'Feedback', type: 'text', icon: '💬' }
    ],
    sampleDataFull: [
      { Project: 'App Redesign', Status: 'In Design', Type: 'UI/UX', Client: 'TechCorp', 'Due Date': '2024-02-15' },
      { Project: 'Logo Refresh', Status: 'Feedback', Type: 'Branding', Client: 'StartupXYZ', 'Due Date': '2024-01-30' },
      { Project: 'Social Media Kit', Status: 'Approved', Type: 'Marketing', Client: 'BrandCo', 'Due Date': '2024-02-01' },
      { Project: 'Icon Set', Status: 'Delivered', Type: 'Illustration', Client: 'Internal', 'Due Date': '2024-01-20' }
    ]
  },
  'engineering': {
    emoji: '⚙️',
    properties: [
      { name: 'Issue', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Open', 'In Progress', 'Code Review', 'Testing', 'Closed'] },
      { name: 'Priority', type: 'select', icon: '🎯', options: ['Critical', 'High', 'Medium', 'Low'] },
      { name: 'Type', type: 'select', icon: '📋', options: ['Bug', 'Feature', 'Refactor', 'Documentation'] },
      { name: 'Assignee', type: 'person', icon: '👤' },
      { name: 'Sprint', type: 'select', icon: '🏃', options: ['Current', 'Next', 'Backlog'] },
      { name: 'Estimate', type: 'number', icon: '⏱️' },
      { name: 'Labels', type: 'multi_select', icon: '🏷️', options: ['frontend', 'backend', 'database', 'api', 'security'] }
    ],
    sampleDataFull: [
      { Issue: 'Memory leak in dashboard', Status: 'In Progress', Priority: 'Critical', Type: 'Bug', Estimate: 4 },
      { Issue: 'Add dark mode support', Status: 'Open', Priority: 'Medium', Type: 'Feature', Estimate: 8 },
      { Issue: 'Refactor auth module', Status: 'Code Review', Priority: 'High', Type: 'Refactor', Estimate: 13 },
      { Issue: 'Update API docs', Status: 'Testing', Priority: 'Low', Type: 'Documentation', Estimate: 2 }
    ]
  },
  'startup': {
    emoji: '🚀',
    properties: [
      { name: 'Objective', type: 'title', icon: '📝' },
      { name: 'Key Results', type: 'text', icon: '🎯' },
      { name: 'Progress', type: 'number', icon: '📊' },
      { name: 'Owner', type: 'person', icon: '👤' },
      { name: 'Quarter', type: 'select', icon: '📅', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      { name: 'Status', type: 'select', icon: '🔄', options: ['On Track', 'At Risk', 'Behind', 'Completed'] },
      { name: 'Category', type: 'select', icon: '📋', options: ['Growth', 'Product', 'Team', 'Finance'] }
    ],
    sampleDataFull: [
      { Objective: 'Reach 10K users', 'Key Results': 'Launch marketing campaign, improve onboarding', Progress: 65, Quarter: 'Q1', Status: 'On Track', Category: 'Growth' },
      { Objective: 'Launch MVP v2', 'Key Results': 'Complete core features, beta testing', Progress: 40, Quarter: 'Q1', Status: 'At Risk', Category: 'Product' },
      { Objective: 'Hire 5 engineers', 'Key Results': 'Source candidates, conduct interviews', Progress: 80, Quarter: 'Q1', Status: 'On Track', Category: 'Team' },
      { Objective: 'Secure Series A', 'Key Results': 'Pitch to 20 VCs, due diligence', Progress: 30, Quarter: 'Q2', Status: 'On Track', Category: 'Finance' }
    ]
  },
  'operations': {
    emoji: '📊',
    properties: [
      { name: 'Process', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Draft', 'Active', 'Under Review', 'Archived'] },
      { name: 'Owner', type: 'person', icon: '👤' },
      { name: 'Department', type: 'select', icon: '🏢', options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'] },
      { name: 'Last Updated', type: 'date', icon: '📅' },
      { name: 'Version', type: 'text', icon: '🔢' },
      { name: 'Category', type: 'select', icon: '📋', options: ['SOP', 'Policy', 'Guideline', 'Template'] }
    ],
    sampleDataFull: [
      { Process: 'Employee Onboarding', Status: 'Active', Department: 'HR', Version: '2.1', Category: 'SOP' },
      { Process: 'Code Review Guidelines', Status: 'Active', Department: 'Engineering', Version: '1.3', Category: 'Guideline' },
      { Process: 'Expense Reimbursement', Status: 'Under Review', Department: 'Finance', Version: '1.0', Category: 'Policy' },
      { Process: 'Content Publishing', Status: 'Active', Department: 'Marketing', Version: '1.5', Category: 'SOP' }
    ]
  },
  'hr': {
    emoji: '👥',
    properties: [
      { name: 'Employee', type: 'title', icon: '👤' },
      { name: 'Department', type: 'select', icon: '🏢', options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'] },
      { name: 'Role', type: 'text', icon: '💼' },
      { name: 'Manager', type: 'person', icon: '👔' },
      { name: 'Start Date', type: 'date', icon: '📅' },
      { name: 'Location', type: 'select', icon: '📍', options: ['Remote', 'New York', 'San Francisco', 'London'] },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Active', 'On Leave', 'Offboarding'] },
      { name: 'Email', type: 'email', icon: '✉️' }
    ],
    sampleDataFull: [
      { Employee: 'John Smith', Department: 'Engineering', Role: 'Senior Developer', Location: 'Remote', Status: 'Active' },
      { Employee: 'Sarah Johnson', Department: 'Marketing', Role: 'Marketing Manager', Location: 'New York', Status: 'Active' },
      { Employee: 'Mike Chen', Department: 'Sales', Role: 'Account Executive', Location: 'San Francisco', Status: 'Active' },
      { Employee: 'Emily Davis', Department: 'HR', Role: 'HR Coordinator', Location: 'Remote', Status: 'On Leave' }
    ]
  },
  'crm': {
    emoji: '💰',
    properties: [
      { name: 'Company', type: 'title', icon: '🏢' },
      { name: 'Stage', type: 'select', icon: '🔄', options: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
      { name: 'Value', type: 'number', icon: '💰' },
      { name: 'Contact', type: 'text', icon: '👤' },
      { name: 'Owner', type: 'person', icon: '👔' },
      { name: 'Next Action', type: 'date', icon: '📅' },
      { name: 'Source', type: 'select', icon: '📡', options: ['Inbound', 'Outbound', 'Referral', 'Event'] },
      { name: 'Industry', type: 'select', icon: '🏭', options: ['Tech', 'Finance', 'Healthcare', 'Retail', 'Other'] }
    ],
    sampleDataFull: [
      { Company: 'TechCorp Inc', Stage: 'Proposal', Value: 50000, Contact: 'Jane Doe', Source: 'Inbound', Industry: 'Tech' },
      { Company: 'FinanceHub', Stage: 'Negotiation', Value: 75000, Contact: 'Bob Wilson', Source: 'Referral', Industry: 'Finance' },
      { Company: 'HealthPlus', Stage: 'Qualified', Value: 30000, Contact: 'Alice Brown', Source: 'Event', Industry: 'Healthcare' },
      { Company: 'RetailMax', Stage: 'Lead', Value: 20000, Contact: 'Tom Green', Source: 'Outbound', Industry: 'Retail' }
    ]
  },

  // SCHOOL TEMPLATES
  'student-life': {
    emoji: '🎓',
    properties: [
      { name: 'Task', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'Done'] },
      { name: 'Course', type: 'select', icon: '📚', options: ['Math', 'Science', 'English', 'History', 'Art'] },
      { name: 'Type', type: 'select', icon: '📋', options: ['Assignment', 'Project', 'Exam', 'Reading'] },
      { name: 'Due Date', type: 'date', icon: '📅' },
      { name: 'Priority', type: 'select', icon: '🎯', options: ['High', 'Medium', 'Low'] },
      { name: 'Grade', type: 'number', icon: '⭐' }
    ],
    sampleDataFull: [
      { Task: 'Math Homework Ch. 5', Status: 'In Progress', Course: 'Math', Type: 'Assignment', Priority: 'High' },
      { Task: 'Science Lab Report', Status: 'To Do', Course: 'Science', Type: 'Project', Priority: 'High' },
      { Task: 'Essay Draft', Status: 'Done', Course: 'English', Type: 'Assignment', Priority: 'Medium', Grade: 92 },
      { Task: 'History Reading', Status: 'To Do', Course: 'History', Type: 'Reading', Priority: 'Low' }
    ]
  },
  'study-planner': {
    emoji: '📚',
    properties: [
      { name: 'Subject', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Not Started', 'Studying', 'Review', 'Mastered'] },
      { name: 'Topic', type: 'text', icon: '📖' },
      { name: 'Study Hours', type: 'number', icon: '⏱️' },
      { name: 'Exam Date', type: 'date', icon: '📅' },
      { name: 'Confidence', type: 'select', icon: '💪', options: ['Low', 'Medium', 'High'] },
      { name: 'Resources', type: 'url', icon: '🔗' }
    ],
    sampleDataFull: [
      { Subject: 'Calculus', Topic: 'Derivatives', Status: 'Studying', 'Study Hours': 10, Confidence: 'Medium' },
      { Subject: 'Physics', Topic: 'Mechanics', Status: 'Review', 'Study Hours': 8, Confidence: 'High' },
      { Subject: 'Chemistry', Topic: 'Organic Compounds', Status: 'Not Started', 'Study Hours': 0, Confidence: 'Low' },
      { Subject: 'Biology', Topic: 'Cell Division', Status: 'Mastered', 'Study Hours': 12, Confidence: 'High' }
    ]
  },
  'class-notes': {
    emoji: '📝',
    properties: [
      { name: 'Title', type: 'title', icon: '📝' },
      { name: 'Course', type: 'select', icon: '📚', options: ['Math', 'Science', 'English', 'History', 'Art'] },
      { name: 'Date', type: 'date', icon: '📅' },
      { name: 'Type', type: 'select', icon: '📋', options: ['Lecture', 'Discussion', 'Lab', 'Review'] },
      { name: 'Key Concepts', type: 'text', icon: '💡' },
      { name: 'Questions', type: 'text', icon: '❓' },
      { name: 'Reviewed', type: 'checkbox', icon: '✅' }
    ],
    sampleDataFull: [
      { Title: 'Introduction to Calculus', Course: 'Math', Type: 'Lecture', 'Key Concepts': 'Limits, Continuity', Reviewed: true },
      { Title: 'Newton\'s Laws', Course: 'Science', Type: 'Lecture', 'Key Concepts': 'Force, Motion, Acceleration', Reviewed: false },
      { Title: 'Essay Structure', Course: 'English', Type: 'Discussion', 'Key Concepts': 'Thesis, Arguments, Conclusion', Reviewed: true }
    ]
  },
  'career': {
    emoji: '💼',
    properties: [
      { name: 'Company', type: 'title', icon: '🏢' },
      { name: 'Position', type: 'text', icon: '💼' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Researching', 'Applied', 'Interview', 'Offer', 'Rejected'] },
      { name: 'Applied Date', type: 'date', icon: '📅' },
      { name: 'Deadline', type: 'date', icon: '⏰' },
      { name: 'Salary Range', type: 'text', icon: '💰' },
      { name: 'Location', type: 'text', icon: '📍' },
      { name: 'Notes', type: 'text', icon: '📝' }
    ],
    sampleDataFull: [
      { Company: 'Google', Position: 'Software Engineer Intern', Status: 'Applied', Location: 'Mountain View' },
      { Company: 'Microsoft', Position: 'PM Intern', Status: 'Interview', Location: 'Seattle' },
      { Company: 'Apple', Position: 'Design Intern', Status: 'Researching', Location: 'Cupertino' },
      { Company: 'Amazon', Position: 'SDE Intern', Status: 'Offer', Location: 'Remote' }
    ]
  },
  'research': {
    emoji: '🔬',
    properties: [
      { name: 'Paper', type: 'title', icon: '📝' },
      { name: 'Authors', type: 'text', icon: '👥' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['To Read', 'Reading', 'Summarized', 'Cited'] },
      { name: 'Topic', type: 'select', icon: '📚', options: ['Literature', 'Methodology', 'Theory', 'Case Study'] },
      { name: 'Year', type: 'number', icon: '📅' },
      { name: 'Key Findings', type: 'text', icon: '💡' },
      { name: 'URL', type: 'url', icon: '🔗' }
    ],
    sampleDataFull: [
      { Paper: 'Deep Learning in Healthcare', Authors: 'Smith et al.', Status: 'Summarized', Topic: 'Literature', Year: 2023 },
      { Paper: 'Qualitative Research Methods', Authors: 'Johnson, Brown', Status: 'Reading', Topic: 'Methodology', Year: 2022 },
      { Paper: 'Machine Learning Theory', Authors: 'Chen', Status: 'To Read', Topic: 'Theory', Year: 2024 }
    ]
  },
  'teaching': {
    emoji: '👨‍🏫',
    properties: [
      { name: 'Lesson', type: 'title', icon: '📝' },
      { name: 'Subject', type: 'select', icon: '📚', options: ['Math', 'Science', 'English', 'History', 'Art'] },
      { name: 'Grade Level', type: 'select', icon: '🎓', options: ['Elementary', 'Middle School', 'High School', 'College'] },
      { name: 'Date', type: 'date', icon: '📅' },
      { name: 'Duration', type: 'number', icon: '⏱️' },
      { name: 'Materials', type: 'text', icon: '📦' },
      { name: 'Objectives', type: 'text', icon: '🎯' },
      { name: 'Completed', type: 'checkbox', icon: '✅' }
    ],
    sampleDataFull: [
      { Lesson: 'Fractions Introduction', Subject: 'Math', 'Grade Level': 'Elementary', Duration: 45, Completed: true },
      { Lesson: 'Photosynthesis', Subject: 'Science', 'Grade Level': 'Middle School', Duration: 60, Completed: false },
      { Lesson: 'Essay Writing', Subject: 'English', 'Grade Level': 'High School', Duration: 50, Completed: true }
    ]
  },

  // LIFE TEMPLATES
  'health': {
    emoji: '💪',
    properties: [
      { name: 'Workout', type: 'title', icon: '🏋️' },
      { name: 'Type', type: 'select', icon: '📋', options: ['Cardio', 'Strength', 'Flexibility', 'HIIT', 'Rest'] },
      { name: 'Date', type: 'date', icon: '📅' },
      { name: 'Duration', type: 'number', icon: '⏱️' },
      { name: 'Calories', type: 'number', icon: '🔥' },
      { name: 'Completed', type: 'checkbox', icon: '✅' },
      { name: 'Notes', type: 'text', icon: '📝' }
    ],
    sampleDataFull: [
      { Workout: 'Morning Run', Type: 'Cardio', Duration: 30, Calories: 300, Completed: true },
      { Workout: 'Upper Body', Type: 'Strength', Duration: 45, Calories: 250, Completed: true },
      { Workout: 'Yoga Session', Type: 'Flexibility', Duration: 60, Calories: 150, Completed: false },
      { Workout: 'HIIT Circuit', Type: 'HIIT', Duration: 20, Calories: 350, Completed: true }
    ]
  },
  'finance': {
    emoji: '💵',
    properties: [
      { name: 'Transaction', type: 'title', icon: '📝' },
      { name: 'Type', type: 'select', icon: '📋', options: ['Income', 'Expense', 'Transfer', 'Investment'] },
      { name: 'Category', type: 'select', icon: '🏷️', options: ['Food', 'Transport', 'Housing', 'Entertainment', 'Utilities', 'Salary', 'Other'] },
      { name: 'Amount', type: 'number', icon: '💰' },
      { name: 'Date', type: 'date', icon: '📅' },
      { name: 'Account', type: 'select', icon: '🏦', options: ['Checking', 'Savings', 'Credit Card', 'Cash'] },
      { name: 'Notes', type: 'text', icon: '📝' }
    ],
    sampleDataFull: [
      { Transaction: 'Monthly Salary', Type: 'Income', Category: 'Salary', Amount: 5000, Account: 'Checking' },
      { Transaction: 'Groceries', Type: 'Expense', Category: 'Food', Amount: 150, Account: 'Credit Card' },
      { Transaction: 'Electric Bill', Type: 'Expense', Category: 'Utilities', Amount: 80, Account: 'Checking' },
      { Transaction: 'Netflix', Type: 'Expense', Category: 'Entertainment', Amount: 15, Account: 'Credit Card' }
    ]
  },
  'productivity': {
    emoji: '⚡',
    properties: [
      { name: 'Task', type: 'title', icon: '📝' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'Done', 'Blocked'] },
      { name: 'Priority', type: 'select', icon: '🎯', options: ['High', 'Medium', 'Low'] },
      { name: 'Due Date', type: 'date', icon: '📅' },
      { name: 'Category', type: 'select', icon: '📋', options: ['Work', 'Personal', 'Health', 'Learning'] },
      { name: 'Time Estimate', type: 'number', icon: '⏱️' },
      { name: 'Energy Level', type: 'select', icon: '⚡', options: ['High', 'Medium', 'Low'] }
    ],
    sampleDataFull: [
      { Task: 'Complete project report', Status: 'In Progress', Priority: 'High', Category: 'Work', 'Time Estimate': 2 },
      { Task: 'Grocery shopping', Status: 'To Do', Priority: 'Medium', Category: 'Personal', 'Time Estimate': 1 },
      { Task: 'Morning workout', Status: 'Done', Priority: 'High', Category: 'Health', 'Time Estimate': 1 },
      { Task: 'Read book chapter', Status: 'To Do', Priority: 'Low', Category: 'Learning', 'Time Estimate': 1 }
    ]
  },
  'hobbies': {
    emoji: '🎯',
    properties: [
      { name: 'Project', type: 'title', icon: '📝' },
      { name: 'Hobby', type: 'select', icon: '🎨', options: ['Art', 'Music', 'Gaming', 'Sports', 'Crafts', 'Photography'] },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Idea', 'In Progress', 'Completed', 'On Hold'] },
      { name: 'Started', type: 'date', icon: '📅' },
      { name: 'Time Spent', type: 'number', icon: '⏱️' },
      { name: 'Materials', type: 'text', icon: '📦' },
      { name: 'Notes', type: 'text', icon: '📝' }
    ],
    sampleDataFull: [
      { Project: 'Landscape Painting', Hobby: 'Art', Status: 'In Progress', 'Time Spent': 10 },
      { Project: 'Learn Guitar Song', Hobby: 'Music', Status: 'Completed', 'Time Spent': 20 },
      { Project: 'Minecraft Build', Hobby: 'Gaming', Status: 'In Progress', 'Time Spent': 15 },
      { Project: 'Knit Scarf', Hobby: 'Crafts', Status: 'Idea', 'Time Spent': 0 }
    ]
  },
  'travel': {
    emoji: '✈️',
    properties: [
      { name: 'Trip', type: 'title', icon: '📝' },
      { name: 'Destination', type: 'text', icon: '📍' },
      { name: 'Status', type: 'select', icon: '🔄', options: ['Planning', 'Booked', 'Completed', 'Wishlist'] },
      { name: 'Start Date', type: 'date', icon: '📅' },
      { name: 'End Date', type: 'date', icon: '🏁' },
      { name: 'Budget', type: 'number', icon: '💰' },
      { name: 'Type', type: 'select', icon: '📋', options: ['Adventure', 'Relaxation', 'Business', 'Family'] },
      { name: 'Accommodation', type: 'text', icon: '🏨' }
    ],
    sampleDataFull: [
      { Trip: 'Japan Adventure', Destination: 'Tokyo, Kyoto', Status: 'Planning', Budget: 5000, Type: 'Adventure' },
      { Trip: 'Beach Getaway', Destination: 'Bali', Status: 'Booked', Budget: 3000, Type: 'Relaxation' },
      { Trip: 'Europe Tour', Destination: 'Paris, Rome', Status: 'Wishlist', Budget: 8000, Type: 'Adventure' },
      { Trip: 'NYC Weekend', Destination: 'New York', Status: 'Completed', Budget: 1500, Type: 'Family' }
    ]
  },
  'journal': {
    emoji: '📓',
    properties: [
      { name: 'Entry', type: 'title', icon: '📝' },
      { name: 'Date', type: 'date', icon: '📅' },
      { name: 'Mood', type: 'select', icon: '😊', options: ['Great', 'Good', 'Okay', 'Bad', 'Terrible'] },
      { name: 'Gratitude', type: 'text', icon: '🙏' },
      { name: 'Highlights', type: 'text', icon: '⭐' },
      { name: 'Challenges', type: 'text', icon: '💪' },
      { name: 'Tomorrow Goals', type: 'text', icon: '🎯' }
    ],
    sampleDataFull: [
      { Entry: 'Productive Monday', Mood: 'Great', Gratitude: 'Good health, supportive team', Highlights: 'Finished project ahead of schedule' },
      { Entry: 'Relaxing Sunday', Mood: 'Good', Gratitude: 'Quality family time', Highlights: 'Nice brunch with friends' },
      { Entry: 'Challenging Day', Mood: 'Okay', Gratitude: 'Learning opportunities', Challenges: 'Difficult meeting' }
    ]
  },
  'home': {
    emoji: '🏠',
    properties: [
      { name: 'Task', type: 'title', icon: '📝' },
      { name: 'Category', type: 'select', icon: '📋', options: ['Cleaning', 'Maintenance', 'Repair', 'Organization', 'Shopping'] },
      { name: 'Status', type: 'select', icon: '🔄', options: ['To Do', 'In Progress', 'Done'] },
      { name: 'Frequency', type: 'select', icon: '🔁', options: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'One-time'] },
      { name: 'Room', type: 'select', icon: '🚪', options: ['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Garage', 'Outdoor'] },
      { name: 'Due Date', type: 'date', icon: '📅' },
      { name: 'Cost', type: 'number', icon: '💰' }
    ],
    sampleDataFull: [
      { Task: 'Vacuum floors', Category: 'Cleaning', Status: 'To Do', Frequency: 'Weekly', Room: 'Living Room' },
      { Task: 'Change air filters', Category: 'Maintenance', Status: 'Done', Frequency: 'Monthly', Cost: 20 },
      { Task: 'Fix leaky faucet', Category: 'Repair', Status: 'In Progress', Frequency: 'One-time', Room: 'Bathroom' },
      { Task: 'Organize closet', Category: 'Organization', Status: 'To Do', Frequency: 'Yearly', Room: 'Bedroom' }
    ]
  }
}

// View configurations
const VIEW_CONFIGS = {
  table: { name: 'All Items', type: 'table', filter: null },
  board: { name: 'Board View', type: 'board', groupBy: 'Status' },
  calendar: { name: 'Calendar', type: 'calendar', dateProperty: 'Due Date' },
  gallery: { name: 'Gallery', type: 'gallery', coverProperty: null },
  list: { name: 'List View', type: 'list', filter: null }
}

export async function POST(request) {
  try {
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

    // Get template structure for this subcategory
    const structure = TEMPLATE_STRUCTURES[subcategory]
    if (!structure) {
      return NextResponse.json({ 
        success: false, 
        error: `Template type "${subcategory}" not found` 
      }, { status: 400 })
    }

    // Build the template
    const template = {
      title: name,
      description: description || `A ${subcategory} template for ${category}`,
      emoji: includeEmoji ? structure.emoji : null,
      category,
      subcategory,
      properties: structure.properties,
      views: views.map(viewId => {
        const config = VIEW_CONFIGS[viewId]
        // Try to find appropriate groupBy or dateProperty from the properties
        const statusProp = structure.properties.find(p => p.name === 'Status')
        const dateProp = structure.properties.find(p => p.type === 'date')
        
        return {
          ...config,
          name: viewId === 'table' ? 'All Items' : 
                viewId === 'board' ? `${name} Board` :
                viewId === 'calendar' ? `${name} Calendar` :
                viewId === 'gallery' ? `${name} Gallery` : `${name} List`,
          groupBy: viewId === 'board' && statusProp ? statusProp.name : config.groupBy,
          dateProperty: viewId === 'calendar' && dateProp ? dateProp.name : config.dateProperty
        }
      }),
      colorTheme,
      includeCover,
      sampleData: contentLevel === 'full' ? structure.sampleDataFull : null,
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
