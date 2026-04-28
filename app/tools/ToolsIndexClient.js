'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Video,
  Image,
  Music,
  FileText,
  Wand2,
  Briefcase,
  GraduationCap,
  Heart,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Header, Footer } from '@/components/landing'

// All tools organized by category
const TOOLS_BY_CATEGORY = {
  Video: {
    icon: Video,
    color: 'bg-red-500',
    description: 'Create stunning videos with AI',
    tools: [
      { id: 'ai-video-studio', name: 'AI Video Studio', description: 'Create professional videos with AI' },
      { id: 'quick-reels', name: 'Quick Video Studio', description: 'Make viral short videos' },
      { id: 'auto-subtitles', name: 'Auto Subtitles', description: 'Add subtitles automatically' },
      { id: 'auto-reels', name: 'Auto Reels', description: 'Generate reels from content' },
      { id: 'reels', name: 'Reels Creator', description: 'Create social media reels' },
      { id: 'story-reels', name: 'Story Reels', description: 'Create story format videos' },
      { id: 'long-form', name: 'Long Form Video', description: 'Create longer videos' },
      { id: 'thumbnail-maker', name: 'Thumbnail Maker', description: 'Design video thumbnails' },
    ]
  },
  Image: {
    icon: Image,
    color: 'bg-purple-500',
    description: 'Design beautiful graphics',
    tools: [
      { id: 'image-editor', name: 'AI Image Studio', description: 'Create and edit images with AI' },
      { id: 'carousels', name: 'Carousel Creator', description: 'Design carousel posts' },
      { id: 'photo-cards', name: 'Photo Cards', description: 'Create photo cards and graphics' },
      { id: 'cover-image-creator', name: 'Cover Image Creator', description: 'Design cover images' },
      { id: 'meme-generator', name: 'Meme Generator', description: 'Create viral memes' },
      { id: 'avatar-creator', name: 'Avatar Creator', description: 'Generate AI avatars' },
    ]
  },
  Audio: {
    icon: Music,
    color: 'bg-green-500',
    description: 'Edit and enhance audio',
    tools: [
      { id: 'audio-editor', name: 'Audio Editor', description: 'Edit audio files' },
      { id: 'noise-remover', name: 'Noise Remover', description: 'Remove background noise' },
      { id: 'voice-enhancer', name: 'Voice Enhancer', description: 'Enhance voice quality' },
    ]
  },
  'Digital Products': {
    icon: FileText,
    color: 'bg-blue-500',
    description: 'Create sellable digital products',
    tools: [
      { id: 'ebook-maker', name: 'Ebook Creator', description: 'Create professional ebooks' },
      { id: 'planner-maker', name: 'Digital Planner', description: 'Design digital planners' },
      { id: 'worksheet-maker', name: 'Worksheet Generator', description: 'Create worksheets' },
      { id: 'coloring-book', name: 'Coloring Book', description: 'Design coloring books' },
      { id: 'journal-maker', name: 'Journal Maker', description: 'Create journals' },
      { id: 'notion-templates', name: 'Notion Templates', description: 'Build Notion templates' },
      { id: 'slides-maker', name: 'Slides Maker', description: 'Create presentations' },
      { id: 'quiz-maker', name: 'Quiz Maker', description: 'Build quizzes and tests' },
    ]
  },
  Content: {
    icon: Wand2,
    color: 'bg-pink-500',
    description: 'Write and create content',
    tools: [
      { id: 'blog-creator', name: 'Blog Post Writer', description: 'Write SEO blog posts' },
      { id: 'linkedin-posts', name: 'LinkedIn Posts', description: 'Create LinkedIn content' },
      { id: 'youtube-creator', name: 'YouTube Creator', description: 'YouTube content tools' },
      { id: 'quotes', name: 'Quote Generator', description: 'Generate inspiring quotes' },
      { id: 'ai-humanizer', name: 'AI Humanizer', description: 'Humanize AI content' },
      { id: 'news', name: 'News Writer', description: 'Write news articles' },
    ]
  },
  Business: {
    icon: Briefcase,
    color: 'bg-orange-500',
    description: 'Tools for business growth',
    tools: [
      { id: 'ad-copy', name: 'Ad Copy Generator', description: 'Write converting ads' },
      { id: 'business-plan', name: 'Business Plan', description: 'Create business plans' },
      { id: 'pitch-deck', name: 'Pitch Deck', description: 'Design pitch decks' },
      { id: 'marketing-strategy', name: 'Marketing Strategy', description: 'Plan marketing' },
      { id: 'email-campaigns', name: 'Email Campaigns', description: 'Write email campaigns' },
      { id: 'swot-analysis', name: 'SWOT Analysis', description: 'Strategic analysis' },
    ]
  },
  Education: {
    icon: GraduationCap,
    color: 'bg-cyan-500',
    description: 'Learning and study tools',
    tools: [
      { id: 'essay-helper', name: 'Essay Helper', description: 'Help writing essays' },
      { id: 'study-notes', name: 'Study Notes', description: 'Generate study notes' },
      { id: 'exam-prep', name: 'Exam Prep', description: 'Prepare for exams' },
      { id: 'lesson-planner', name: 'Lesson Planner', description: 'Plan lessons' },
      { id: 'citation-generator', name: 'Citation Generator', description: 'Generate citations' },
    ]
  },
  Career: {
    icon: Heart,
    color: 'bg-indigo-500',
    description: 'Advance your career',
    tools: [
      { id: 'resume-builder', name: 'Resume Builder', description: 'Build professional resumes' },
      { id: 'cover-letter', name: 'Cover Letter', description: 'Write cover letters' },
      { id: 'interview-prep', name: 'Interview Prep', description: 'Prepare for interviews' },
      { id: 'job-matcher', name: 'Job Matcher', description: 'Find matching jobs' },
      { id: 'salary-negotiator', name: 'Salary Negotiator', description: 'Negotiate salary' },
    ]
  },
}

export default function ToolsIndexClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Filter tools based on search and category
  const filteredCategories = Object.entries(TOOLS_BY_CATEGORY).filter(([category]) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) return false
    return true
  }).map(([category, data]) => {
    const filteredTools = data.tools.filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return [category, { ...data, tools: filteredTools }]
  }).filter(([_, data]) => data.tools.length > 0)
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            60+ AI Tools
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            All AI Tools
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our complete collection of AI-powered tools for content creation, 
            video editing, marketing, education, and more.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </section>
      
      {/* Category Filter */}
      <section className="pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Tools
            </Button>
            {Object.entries(TOOLS_BY_CATEGORY).map(([category, data]) => {
              const Icon = data.icon
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {category}
                </Button>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Tools Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {filteredCategories.map(([category, data]) => {
            const Icon = data.icon
            return (
              <div key={category} className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${data.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <p className="text-muted-foreground">{data.description}</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.tools.map(tool => (
                    <Link key={tool.id} href={`/tools/${tool.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {tool.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{tool.description}</CardDescription>
                          <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Try it free <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tools found matching "{searchQuery}"</p>
              <Button 
                variant="link" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-muted-foreground mb-8">
            Sign up now and get free credits to try any tool
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
