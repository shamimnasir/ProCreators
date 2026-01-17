'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GraduationCap, 
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Brain,
  PenTool,
  Clock,
  Users,
  Award
} from 'lucide-react'

const EDUCATION_CATEGORIES = [
  {
    id: 'presentations',
    name: 'Presentations & Slides',
    description: 'Create engaging presentations',
    icon: '📊',
    color: 'from-blue-500 to-indigo-500',
    tools: [
      {
        id: 'slides-maker',
        name: 'AI Presentation Maker',
        description: 'Create professional slides in minutes',
        icon: '📊',
        href: '/dashboard/tools/slides-maker',
        useCase: 'Class presentations, lectures',
        badge: 'Most Used'
      },
      {
        id: 'lesson-planner',
        name: 'Lesson Plan Generator',
        description: 'AI-powered lesson plans with objectives, activities & assessments',
        icon: '📋',
        href: '/dashboard/tools/lesson-planner',
        useCase: 'Teachers, trainers',
        badge: 'For Teachers',
        isBuilt: true
      }
    ]
  },
  {
    id: 'study',
    name: 'Study & Learning',
    description: 'Tools to help students learn',
    icon: '📚',
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'learning-cards',
        name: 'Flashcard Creator',
        description: 'Generate study flashcards from any topic',
        icon: '🎴',
        href: '/dashboard/tools/learning-cards',
        useCase: 'Exam prep, memorization',
        badge: 'Popular',
        isBuilt: true
      },
      {
        id: 'storybook-maker',
        name: 'Storybook Creator',
        description: 'Create illustrated educational stories',
        icon: '📖',
        href: '/dashboard/tools/storybook-maker',
        useCase: 'K-12, language learning',
        badge: 'Creative',
        isBuilt: true
      },
      {
        id: 'ebook-maker',
        name: 'eBook Creator',
        description: 'Create comprehensive educational eBooks',
        icon: '📕',
        href: '/dashboard/tools/ebook-maker',
        useCase: 'Course materials, guides',
        badge: '',
        isBuilt: true
      },
      {
        id: 'study-notes',
        name: 'Study Notes Generator',
        description: 'Summarize textbooks and lectures',
        icon: '📝',
        href: '/dashboard/tools/study-notes',
        useCase: 'Note-taking, revision',
        badge: 'New',
        isBuilt: true
      }
    ]
  },
  {
    id: 'assessment',
    name: 'Quizzes & Assessment',
    description: 'Create tests and quizzes',
    icon: '❓',
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'quiz-maker',
        name: 'Quiz & Test Creator',
        description: 'Auto-generate quizzes with PDF export in any language',
        icon: '❓',
        href: '/dashboard/tools/quiz-maker',
        useCase: 'Testing, self-assessment',
        badge: 'Smart',
        isBuilt: true
      },
      {
        id: 'worksheet-maker',
        name: 'Worksheet Generator',
        description: 'Create printable educational worksheets',
        icon: '📄',
        href: '/dashboard/tools/worksheet-maker',
        useCase: 'Practice, homework',
        badge: 'Popular',
        isBuilt: true
      },
      {
        id: 'activity-book',
        name: 'Activity Book Creator',
        description: 'Design fun learning activity books',
        icon: '🎨',
        href: '/dashboard/tools/activity-book',
        useCase: 'K-12, homeschool',
        badge: '',
        isBuilt: true
      },
      {
        id: 'exam-prep',
        name: 'Exam Prep Assistant',
        description: 'Practice questions and mock tests',
        icon: '📝',
        href: '/dashboard/tools/exam-prep',
        useCase: 'Board exams, certifications',
        badge: 'New',
        isBuilt: true
      }
    ]
  },
  {
    id: 'writing',
    name: 'Writing & Essays',
    description: 'Help with academic writing',
    icon: '✍️',
    color: 'from-orange-500 to-red-500',
    tools: [
      {
        id: 'essay-helper',
        name: 'Essay Helper',
        description: 'Structure and improve essays',
        icon: '✍️',
        href: '/dashboard/tools/essay-helper',
        useCase: 'Academic writing',
        badge: 'Coming Soon'
      },
      {
        id: 'citation-generator',
        name: 'Citation Generator',
        description: 'Generate citations in any format',
        icon: '📚',
        href: '/dashboard/tools/citation-generator',
        useCase: 'Research papers',
        badge: 'Coming Soon'
      },
      {
        id: 'grammar-checker',
        name: 'Grammar & Style Checker',
        description: 'Polish your academic writing',
        icon: '✅',
        href: '/dashboard/tools/grammar-checker',
        useCase: 'All writing',
        badge: 'Coming Soon'
      }
    ]
  },
  {
    id: 'planning',
    name: 'Planning & Organization',
    description: 'Tools for planning and organization',
    icon: '📅',
    color: 'from-cyan-500 to-blue-500',
    tools: [
      {
        id: 'planner-maker',
        name: 'Study Planner',
        description: 'Create customized study planners',
        icon: '📅',
        href: '/dashboard/tools/planner-maker',
        useCase: 'Time management, schedules',
        badge: '',
        isBuilt: true
      },
      {
        id: 'checklist-maker',
        name: 'Checklist Creator',
        description: 'Build task and study checklists',
        icon: '✅',
        href: '/dashboard/tools/checklist-maker',
        useCase: 'Task tracking, goals',
        badge: '',
        isBuilt: true
      },
      {
        id: 'journal-maker',
        name: 'Learning Journal',
        description: 'Create reflection and learning journals',
        icon: '📓',
        href: '/dashboard/tools/journal-maker',
        useCase: 'Reflection, growth tracking',
        badge: '',
        isBuilt: true
      }
    ]
  }
]

export default function StudentsTeachersPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Students & Teachers Hub</h1>
              <p className="text-white/80">AI-powered tools for education and learning</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Clock className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">10x</p>
              <p className="text-xs text-white/70">Faster Prep</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Brain className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-white/70">Smart Learning</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Users className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">All Ages</p>
              <p className="text-xs text-white/70">K-12 to PhD</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Award className="h-5 w-5 mb-2" />
              <p className="text-2xl font-bold">A+</p>
              <p className="text-xs text-white/70">Quality Content</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Audience Banner */}
      <Card className="border-dashed bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Perfect for:</span>
              <div className="flex gap-2 flex-wrap">
                {['Students', 'Teachers', 'Professors', 'Researchers', 'Tutors', 'Homeschoolers'].map((audience) => (
                  <Badge key={audience} variant="secondary" className="bg-white dark:bg-emerald-900">
                    {audience}
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
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🎯 All Tools
          </TabsTrigger>
          {EDUCATION_CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.icon} {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {EDUCATION_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                    <span className="text-xl">{category.icon}</span>
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

        {EDUCATION_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white`}>
                <span className="text-2xl">{category.icon}</span>
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
      <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <Sparkles className="h-5 w-5" />
            Study Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎴</span>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Active Recall</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Use flashcards for 3x better retention</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Spaced Repetition</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Review at increasing intervals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Teach Others</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Explaining helps you understand</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ToolCard({ tool, categoryColor, expanded = false }) {
  const isComingSoon = tool.badge === 'Coming Soon'
  
  const CardWrapper = isComingSoon ? 'div' : Link
  const cardProps = isComingSoon ? {} : { href: tool.href }
  
  return (
    <CardWrapper {...cardProps}>
      <Card className={`group h-full transition-all border-2 ${
        isComingSoon 
          ? 'opacity-60 cursor-not-allowed bg-muted/30' 
          : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-primary/50'
      }`}>
        <CardHeader className={expanded ? "pb-2" : "pb-1"}>
          <div className="flex items-start justify-between">
            <div className="text-3xl mb-2">{tool.icon}</div>
            {tool.badge && (
              <Badge className={`${
                tool.badge === 'Coming Soon' 
                  ? 'bg-gray-400 text-white' 
                  : `bg-gradient-to-r ${categoryColor} text-white`
              } text-[10px]`}>
                {tool.badge}
              </Badge>
            )}
          </div>
          <CardTitle className={`transition-colors ${expanded ? "text-lg" : "text-base"} ${
            isComingSoon ? '' : 'group-hover:text-primary'
          }`}>
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
              <Badge variant="outline" className="text-[10px]">{tool.useCase}</Badge>
            </div>
          )}
          <div className="flex items-center justify-between">
            {!expanded && tool.useCase && (
              <span className="text-xs text-muted-foreground">{tool.useCase}</span>
            )}
            {!isComingSoon && (
              <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 ml-auto">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
