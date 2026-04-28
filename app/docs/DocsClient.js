'use client'

import { useState } from 'react'
import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Search,
  Video,
  Image,
  FileText,
  Mic,
  Briefcase,
  GraduationCap,
  Wand2,
  ChevronRight,
  BookOpen,
  Play,
  Download,
  Settings,
  ArrowRight
} from 'lucide-react'

// Tool documentation data
const toolDocs = {
  video: {
    name: 'Video Tools',
    icon: Video,
    color: 'from-red-500 to-pink-500',
    tools: [
      {
        id: 'ai-video-studio',
        name: 'AI Video Studio',
        description: 'Create stunning AI-powered videos from text or images',
        steps: [
          { title: 'Choose Your Mode', desc: 'Select "Text to Video" for generating from descriptions, or "Image to Video" to animate static images' },
          { title: 'Enter Your Prompt', desc: 'Describe what you want in detail. Include scene, characters, actions, and style (e.g., "cinematic", "anime", "realistic")' },
          { title: 'Configure Settings', desc: 'Choose video duration (5-10 seconds), resolution (720p/1080p), and aspect ratio (16:9, 9:16, 1:1)' },
          { title: 'Generate & Download', desc: 'Click "Generate Video" and wait 1-3 minutes. Preview and download in MP4 format' },
        ]
      },
      {
        id: 'quick-reels',
        name: 'Quick Video Studio',
        description: 'Create viral short-form videos for TikTok, Reels, and Shorts',
        steps: [
          { title: 'Select Template', desc: 'Choose from trending templates optimized for each platform' },
          { title: 'Add Your Content', desc: 'Enter your script or key points. AI will structure it for maximum engagement' },
          { title: 'Customize Style', desc: 'Pick background music, text animations, and visual effects' },
          { title: 'Export', desc: 'Download in vertical (9:16) format ready for social media posting' },
        ]
      },
      {
        id: 'auto-subtitles',
        name: 'Auto Subtitles',
        description: 'Add accurate AI-generated subtitles to any video',
        steps: [
          { title: 'Upload Video', desc: 'Drag and drop or click to upload your video file (MP4, MOV, AVI supported)' },
          { title: 'Auto-Transcribe', desc: 'AI will automatically transcribe your video audio with 95%+ accuracy' },
          { title: 'Style Your Subtitles', desc: 'Choose font, size, color, position, and animation style' },
          { title: 'Download', desc: 'Export video with burned-in subtitles or download SRT file separately' },
        ]
      },
      {
        id: 'story-reels',
        name: 'Story Reels',
        description: 'Create story-driven reels with AI narration',
        steps: [
          { title: 'Write Your Story', desc: 'Enter your story script or let AI generate one from your topic' },
          { title: 'Select Voice', desc: 'Choose from multiple AI voices in different languages and accents' },
          { title: 'Add Visuals', desc: 'AI will generate or suggest matching visuals for each story segment' },
          { title: 'Preview & Export', desc: 'Watch your complete story reel and download in your preferred format' },
        ]
      },
    ]
  },
  image: {
    name: 'Image Tools',
    icon: Image,
    color: 'from-blue-500 to-cyan-500',
    tools: [
      {
        id: 'carousels',
        name: 'Carousel Creator',
        description: 'Design engaging carousel posts for social media',
        steps: [
          { title: 'Choose Template', desc: 'Select from 50+ professionally designed carousel templates' },
          { title: 'Enter Content', desc: 'Add your text, headlines, and key points for each slide' },
          { title: 'Customize Design', desc: 'Adjust colors, fonts, images, and branding elements' },
          { title: 'Download All', desc: 'Export all slides as individual images or a combined PDF' },
        ]
      },
      {
        id: 'photo-cards',
        name: 'Photo Cards',
        description: 'Create professional photo cards and news graphics',
        steps: [
          { title: 'Select Layout', desc: 'Choose from news-style, quote, announcement, or custom layouts' },
          { title: 'Add Image', desc: 'Upload your image or let AI generate one based on your topic' },
          { title: 'Add Text', desc: 'Enter headline, subheadline, and body text' },
          { title: 'Export', desc: 'Download as PNG or JPG in various sizes for different platforms' },
        ]
      },
      {
        id: 'thumbnail-maker',
        name: 'Thumbnail Maker',
        description: 'Create eye-catching YouTube thumbnails',
        steps: [
          { title: 'Enter Video Topic', desc: 'Describe your video content for AI-powered suggestions' },
          { title: 'Choose Style', desc: 'Select from proven high-CTR thumbnail styles' },
          { title: 'Customize', desc: 'Edit text, add your face, adjust colors and effects' },
          { title: 'A/B Test', desc: 'Generate multiple variants and download all for testing' },
        ]
      },
      {
        id: 'meme-generator',
        name: 'AI Meme Generator',
        description: 'Generate viral memes with AI creativity',
        steps: [
          { title: 'Choose Format', desc: 'Select classic meme format or let AI suggest trending ones' },
          { title: 'Enter Topic', desc: 'Describe what you want to meme about' },
          { title: 'AI Generates', desc: 'AI creates multiple meme variations with clever captions' },
          { title: 'Edit & Download', desc: 'Fine-tune the text and download your favorite' },
        ]
      },
    ]
  },
  content: {
    name: 'Content Writing',
    icon: FileText,
    color: 'from-green-500 to-emerald-500',
    tools: [
      {
        id: 'blog-creator',
        name: 'Blog Post Writer',
        description: 'Write SEO-optimized blog posts with AI',
        steps: [
          { title: 'Enter Topic', desc: 'Provide your blog topic, target keywords, and desired tone' },
          { title: 'Choose Structure', desc: 'Select article length, heading structure, and format style' },
          { title: 'Generate', desc: 'AI creates a complete blog post with intro, body, and conclusion' },
          { title: 'Edit & Export', desc: 'Refine the content and export as HTML, Markdown, or plain text' },
        ]
      },
      {
        id: 'ad-copy',
        name: 'Ad Copy Generator',
        description: 'Create high-converting ad copy instantly',
        steps: [
          { title: 'Select Ad Type', desc: 'Choose platform: Facebook, Google, Instagram, LinkedIn, etc.' },
          { title: 'Enter Product Info', desc: 'Describe your product/service, target audience, and unique value' },
          { title: 'Generate Variants', desc: 'AI creates 5-10 ad copy variations with different angles' },
          { title: 'Copy & Use', desc: 'Select your favorites and copy directly to your ad platform' },
        ]
      },
      {
        id: 'professional-email',
        name: 'Professional Email Writer',
        description: 'Write professional emails with AI assistance',
        steps: [
          { title: 'Select Email Type', desc: 'Choose: follow-up, cold outreach, thank you, apology, etc.' },
          { title: 'Add Context', desc: 'Provide key details, recipient info, and desired outcome' },
          { title: 'Generate', desc: 'AI writes a professional, well-structured email' },
          { title: 'Personalize', desc: 'Edit tone, add personal touches, and send' },
        ]
      },
    ]
  },
  audio: {
    name: 'Audio Tools',
    icon: Mic,
    color: 'from-purple-500 to-pink-500',
    tools: [
      {
        id: 'noise-remover',
        name: 'Noise Remover',
        description: 'Remove background noise from audio recordings',
        steps: [
          { title: 'Upload Audio', desc: 'Upload your audio file (MP3, WAV, M4A supported)' },
          { title: 'Auto-Analyze', desc: 'AI detects and identifies different types of noise' },
          { title: 'Adjust Settings', desc: 'Fine-tune noise reduction level (light, medium, aggressive)' },
          { title: 'Download Clean Audio', desc: 'Preview and download your crystal-clear audio file' },
        ]
      },
      {
        id: 'voice-enhancer',
        name: 'Voice Enhancer',
        description: 'Enhance voice quality with AI processing',
        steps: [
          { title: 'Upload Recording', desc: 'Upload voice recording you want to enhance' },
          { title: 'Select Enhancement', desc: 'Choose: clarity boost, bass/treble adjustment, loudness normalization' },
          { title: 'Preview', desc: 'Listen to before/after comparison' },
          { title: 'Export', desc: 'Download enhanced audio in your preferred format' },
        ]
      },
    ]
  },
  business: {
    name: 'Business Tools',
    icon: Briefcase,
    color: 'from-orange-500 to-red-500',
    tools: [
      {
        id: 'resume-builder',
        name: 'Resume Builder',
        description: 'Build professional resumes that get interviews',
        steps: [
          { title: 'Enter Info', desc: 'Add your work experience, education, skills, and achievements' },
          { title: 'AI Optimization', desc: 'AI enhances descriptions with action verbs and metrics' },
          { title: 'Choose Template', desc: 'Select from ATS-friendly and modern design templates' },
          { title: 'Download', desc: 'Export as PDF or DOCX ready for applications' },
        ]
      },
      {
        id: 'business-plan',
        name: 'Business Plan Generator',
        description: 'Generate comprehensive business plans',
        steps: [
          { title: 'Describe Business', desc: 'Enter your business idea, target market, and goals' },
          { title: 'AI Research', desc: 'AI analyzes market and generates competitive insights' },
          { title: 'Generate Plan', desc: 'Creates executive summary, marketing, financials, and more' },
          { title: 'Export', desc: 'Download as professional PDF document' },
        ]
      },
      {
        id: 'pitch-deck',
        name: 'Pitch Deck Creator',
        description: 'Create compelling pitch decks for investors',
        steps: [
          { title: 'Enter Details', desc: 'Provide company info, problem, solution, and traction' },
          { title: 'AI Structures', desc: 'AI creates investor-ready slide sequence' },
          { title: 'Customize Design', desc: 'Add your branding, charts, and visuals' },
          { title: 'Download', desc: 'Export as PPTX or PDF for presentations' },
        ]
      },
    ]
  },
  education: {
    name: 'Education Tools',
    icon: GraduationCap,
    color: 'from-indigo-500 to-purple-500',
    tools: [
      {
        id: 'essay-helper',
        name: 'Essay Helper',
        description: 'Get AI assistance with essay writing',
        steps: [
          { title: 'Enter Topic', desc: 'Provide essay topic, type (argumentative, expository, etc.), and length' },
          { title: 'AI Outlines', desc: 'AI generates a structured outline with thesis and key points' },
          { title: 'Write Sections', desc: 'Get AI help expanding each section with research and citations' },
          { title: 'Review', desc: 'Check grammar, plagiarism, and export final essay' },
        ]
      },
      {
        id: 'quiz-maker',
        name: 'Quiz & Test Creator',
        description: 'Generate quizzes and tests with AI',
        steps: [
          { title: 'Enter Subject', desc: 'Provide topic, difficulty level, and question count' },
          { title: 'Choose Format', desc: 'Select: multiple choice, true/false, short answer, etc.' },
          { title: 'Generate', desc: 'AI creates diverse questions with answer key' },
          { title: 'Export', desc: 'Download as PDF, Google Forms, or interactive quiz' },
        ]
      },
      {
        id: 'learning-cards',
        name: 'Flashcard Pack Creator',
        description: 'Create educational flashcard packs',
        steps: [
          { title: 'Enter Topic', desc: 'Provide subject matter or paste study material' },
          { title: 'AI Extracts', desc: 'AI identifies key concepts and creates Q&A pairs' },
          { title: 'Review Cards', desc: 'Edit, add images, and organize into sets' },
          { title: 'Study Mode', desc: 'Use built-in study mode or export to Anki' },
        ]
      },
    ]
  },
  digital: {
    name: 'Digital Products',
    icon: Wand2,
    color: 'from-yellow-500 to-orange-500',
    tools: [
      {
        id: 'ebook-maker',
        name: 'Ebook Creator',
        description: 'Write and design ebooks with AI',
        steps: [
          { title: 'Choose Topic', desc: 'Enter ebook topic, target audience, and page count' },
          { title: 'Generate Outline', desc: 'AI creates chapter structure and key topics' },
          { title: 'Write Chapters', desc: 'AI expands each chapter with detailed content' },
          { title: 'Design & Export', desc: 'Add cover, format pages, and export as PDF/EPUB' },
        ]
      },
      {
        id: 'planner-maker',
        name: 'Digital Planner Maker',
        description: 'Create beautiful digital planners to sell',
        steps: [
          { title: 'Select Type', desc: 'Choose: daily, weekly, monthly, or custom planner' },
          { title: 'Customize Layout', desc: 'Design pages with goals, habits, calendars, notes' },
          { title: 'Add Branding', desc: 'Include your colors, fonts, and design elements' },
          { title: 'Export', desc: 'Download as hyperlinked PDF for GoodNotes/Notability' },
        ]
      },
      {
        id: 'coloring-book',
        name: 'Coloring Book Creator',
        description: 'Create unique coloring book pages',
        steps: [
          { title: 'Enter Theme', desc: 'Describe coloring book theme (animals, mandalas, etc.)' },
          { title: 'AI Generates', desc: 'AI creates line art pages ready for coloring' },
          { title: 'Customize', desc: 'Adjust line thickness, add patterns, and borders' },
          { title: 'Compile & Export', desc: 'Arrange pages and export as print-ready PDF' },
        ]
      },
    ]
  },
}

export default function DocsClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)

  const categories = Object.entries(toolDocs)
  
  const filteredCategories = categories.filter(([key, cat]) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return cat.name.toLowerCase().includes(query) ||
           cat.tools.some(tool => 
             tool.name.toLowerCase().includes(query) ||
             tool.description.toLowerCase().includes(query)
           )
  })

  const getFilteredTools = (tools) => {
    if (!searchQuery) return tools
    const query = searchQuery.toLowerCase()
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query)
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 glass-badge bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-sm font-medium mb-4">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Documentation
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How to Use ProCreators Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Step-by-step guides for every tool. Master AI content creation in minutes.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools and guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">60+ Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Step-by-Step Guides</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Multiple Export Formats</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Customizable Settings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {selectedTool ? (
            // Tool Detail View
            <div className="max-w-4xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedTool(null)}
                className="mb-6"
              >
                ← Back to {selectedCategory ? toolDocs[selectedCategory].name : 'All Tools'}
              </Button>
              
              <Card className="glass-card p-8">
                <h1 className="text-3xl font-bold mb-2">{selectedTool.name}</h1>
                <p className="text-lg text-muted-foreground mb-8">{selectedTool.description}</p>
                
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Step-by-Step Guide
                  </h2>
                  
                  {selectedTool.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                  <h3 className="font-semibold mb-2">Ready to try it?</h3>
                  <p className="text-muted-foreground mb-4">Start creating with {selectedTool.name} now.</p>
                  <Link href={`/dashboard/tools/${selectedTool.id}`}>
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg">
                      Open {selectedTool.name} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          ) : (
            // Category Grid View
            <div className="space-y-12">
              {filteredCategories.map(([key, category]) => {
                const Icon = category.icon
                const filteredTools = getFilteredTools(category.tools)
                if (filteredTools.length === 0) return null
                
                return (
                  <div key={key}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold">{category.name}</h2>
                      <span className="text-sm text-muted-foreground">({filteredTools.length} tools)</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTools.map((tool) => (
                        <Card 
                          key={tool.id}
                          className="p-5 cursor-pointer hover:border-blue-500/50 transition-all"
                          onClick={() => {
                            setSelectedCategory(key)
                            setSelectedTool(tool)
                          }}
                        >
                          <h3 className="font-semibold mb-1">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                          <div className="flex items-center text-sm text-blue-500">
                            View Guide <ChevronRight className="h-4 w-4" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="p-12 glass-card-elevated text-center">
            <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Can't find what you're looking for? Check our FAQ or contact our support team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/faq">
                <Button variant="outline">View FAQ</Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg">
                  Contact Support
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
