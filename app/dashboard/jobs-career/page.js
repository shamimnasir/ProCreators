'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase, 
  ArrowRight,
  FileText,
  MessageSquare,
  Mic,
  Target,
  TrendingUp,
  Award,
  Users,
  Mail,
  DollarSign,
  Send,
  Smartphone,
  UserCheck
} from 'lucide-react'

// Icon component mapping
const ICON_MAP = {
  'FileText': FileText,
  'Mail': Mail,
  'Target': Target,
  'Mic': Mic,
  'DollarSign': DollarSign,
  'Smartphone': Smartphone,
  'Send': Send,
  'Users': Users,
  'Briefcase': Briefcase,
  'UserCheck': UserCheck
}

// Helper to render icon
function CareerIcon({ iconName, className = "h-5 w-5" }) {
  const IconComponent = ICON_MAP[iconName]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  return <Briefcase className={className} />
}

const CAREER_CATEGORIES = [
  {
    id: 'applications',
    name: 'Job Applications',
    description: 'Stand out from the crowd',
    icon: 'FileText',
    color: 'from-blue-500 to-blue-600',
    tools: [
      {
        id: 'resume-builder',
        name: 'AI Resume Builder',
        description: 'Create ATS-friendly resumes that get interviews',
        icon: 'FileText',
        href: '/dashboard/tools/resume-builder',
        useCase: 'Job applications',
      },
      {
        id: 'cover-letter',
        name: 'Cover Letter Generator',
        description: 'Personalized cover letters for each application',
        icon: 'Mail',
        href: '/dashboard/tools/cover-letter',
        useCase: 'Applications',
      },
      {
        id: 'job-matcher',
        name: 'Job Description Analyzer',
        description: 'Match your resume to job requirements',
        icon: 'Target',
        href: '/dashboard/tools/job-matcher',
        useCase: 'Optimization',
      }
    ]
  },
  {
    id: 'interview',
    name: 'Interview Prep',
    description: 'Ace your interviews',
    icon: 'Mic',
    color: 'from-emerald-500 to-emerald-600',
    tools: [
      {
        id: 'interview-prep',
        name: 'Interview Prep Coach',
        description: 'Practice with AI-generated questions',
        icon: 'Mic',
        href: '/dashboard/tools/interview-prep',
        useCase: 'Mock interviews',
      },
      {
        id: 'salary-negotiator',
        name: 'Salary Negotiation Helper',
        description: 'Scripts and strategies for better offers',
        icon: 'DollarSign',
        href: '/dashboard/tools/salary-negotiator',
        useCase: 'Negotiations',
      }
    ]
  },
  {
    id: 'networking',
    name: 'Professional Networking',
    description: 'Build your network',
    icon: 'Users',
    color: 'from-purple-500 to-purple-600',
    tools: [
      {
        id: 'social-media-posts',
        name: 'Social Media Post Creator',
        description: 'Viral posts for LinkedIn, X, Facebook & more',
        icon: 'Smartphone',
        href: '/dashboard/tools/linkedin-posts',
        useCase: 'Personal branding',
      },
      {
        id: 'networking-message',
        name: 'Networking Message Generator',
        description: 'Cold outreach that gets responses',
        icon: 'Send',
        href: '/dashboard/tools/networking-message',
        useCase: 'Outreach',
      }
    ]
  },
  {
    id: 'communication',
    name: 'Professional Communication',
    description: 'Write better at work',
    icon: 'Mail',
    color: 'from-rose-500 to-rose-600',
    tools: [
      {
        id: 'email-writer',
        name: 'Professional Email Writer',
        description: 'Clear, professional emails in seconds',
        icon: 'Mail',
        href: '/dashboard/tools/professional-email',
        useCase: 'Work communication',
      }
    ]
  }
]

export default function JobsCareerPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Jobs & Career Hub</h1>
              <p className="text-white/80">Land your dream job with AI-powered tools</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <TrendingUp className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">3x</p>
              <p className="text-xs text-white/70">More Interviews</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <FileText className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">ATS</p>
              <p className="text-xs text-white/70">Optimized</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Award className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">Pro</p>
              <p className="text-xs text-white/70">Quality</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Users className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-xs text-white/70">Jobs Landed</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Platforms Banner */}
      <Card className="border-dashed bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Use with:</span>
              <div className="flex gap-2 flex-wrap">
                {['LinkedIn', 'Indeed', 'Glassdoor', 'Company Websites', 'Recruiters'].map((platform) => (
                  <Badge key={platform} variant="secondary" className="bg-white dark:bg-slate-900">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> All Tools
          </TabsTrigger>
          {CAREER_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
            >
              <CareerIcon iconName={cat.icon} className="h-4 w-4" /> {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {CAREER_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                    <CareerIcon iconName={category.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} categoryColor={category.color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {CAREER_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                <CareerIcon iconName={category.icon} className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} categoryColor={category.color} expanded />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/30 dark:to-blue-950/30 border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-200">
            Job Search Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Tailor Each Resume</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Customize for every job posting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Use Keywords</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Match job description terms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Network First</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">80% of jobs through connections</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ToolCard({ tool, categoryColor, expanded = false }) {
  return (
    <Link href={tool.href}>
      <Card className="group h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
        <CardHeader className={expanded ? "pb-2" : "pb-1"}>
          <div className="flex items-start justify-between">
            <div className="text-3xl mb-2">{tool.icon}</div>
            {tool.badge && (
              <Badge className={`bg-gradient-to-r ${categoryColor} text-white text-[10px]`}>
                {tool.badge}
              </Badge>
            )}
          </div>
          <CardTitle className={`group-hover:text-primary transition-colors ${expanded ? "text-lg" : "text-base"}`}>
            {tool.name}
          </CardTitle>
          <CardDescription className={expanded ? "" : "text-xs line-clamp-2"}>
            {tool.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {expanded && tool.useCase && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Best for:</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            {!expanded && tool.useCase && (
              <span className="text-xs text-muted-foreground">{tool.useCase}</span>
            )}
            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
