'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Check,
  Wand2,
  Play,
  Clock,
  Star,
  ChevronRight,
  Users,
  Trophy,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header, Footer } from '@/components/landing'

// Tool category icons and colors
const CATEGORY_CONFIG = {
  Video: { color: 'bg-red-500', icon: Play },
  Image: { color: 'bg-purple-500', icon: Wand2 },
  Audio: { color: 'bg-green-500', icon: Play },
  'Digital Products': { color: 'bg-blue-500', icon: Trophy },
  Fun: { color: 'bg-yellow-500', icon: Star },
  Business: { color: 'bg-orange-500', icon: Trophy },
  Content: { color: 'bg-pink-500', icon: Wand2 },
  Education: { color: 'bg-cyan-500', icon: Users },
  Career: { color: 'bg-indigo-500', icon: Shield },
}

// Tool details
const TOOL_DETAILS = {
  'ai-video-studio': {
    name: 'AI Video Studio',
    tagline: 'Create stunning videos with AI in minutes',
    description: 'Transform your ideas into professional videos using cutting-edge AI technology. No video editing experience required.',
    category: 'Video',
    features: [
      'AI-powered video generation',
      'Multiple video styles and templates',
      'Auto voiceover with natural voices',
      'Background music library',
      'Export in HD quality'
    ],
    useCases: ['Marketing videos', 'Social media content', 'Educational videos', 'Product demos'],
    creditCost: 520
  },
  'carousels': {
    name: 'Carousel Creator',
    tagline: 'Design viral carousel posts in seconds',
    description: 'Create eye-catching carousel posts for Instagram, LinkedIn, and more. Choose from professional templates and customize with ease.',
    category: 'Image',
    features: [
      'Professional templates',
      'Drag-and-drop editor',
      'Brand color customization',
      'Multiple slide layouts',
      'Direct social media export'
    ],
    useCases: ['Instagram posts', 'LinkedIn content', 'Educational slides', 'Product showcases'],
    creditCost: 50
  },
  'blog-creator': {
    name: 'Blog Post Writer',
    tagline: 'Write SEO-optimized blog posts with AI',
    description: 'Generate high-quality, SEO-friendly blog posts in minutes. Our AI understands your topic and creates engaging content that ranks.',
    category: 'Content',
    features: [
      'SEO optimization built-in',
      'Multiple writing tones',
      'Automatic formatting',
      'Plagiarism-free content',
      'Easy export options'
    ],
    useCases: ['Company blogs', 'Personal websites', 'Content marketing', 'Guest posts'],
    creditCost: 3
  },
  'resume-builder': {
    name: 'Resume Builder',
    tagline: 'Build resumes that get you hired',
    description: 'Create ATS-friendly, professional resumes tailored to your target job. Stand out from the competition with AI-optimized content.',
    category: 'Career',
    features: [
      'ATS-optimized formats',
      'Industry-specific templates',
      'AI content suggestions',
      'Multiple export formats',
      'Cover letter matching'
    ],
    useCases: ['Job applications', 'Career transitions', 'Freelance profiles', 'LinkedIn optimization'],
    creditCost: 3
  },
  // Default template for tools not explicitly defined
  default: {
    tagline: 'AI-powered tool for content creation',
    description: 'Create amazing content with our AI-powered tool. Simple, fast, and professional results every time.',
    features: [
      'AI-powered generation',
      'Professional templates',
      'Easy customization',
      'Quick export options',
      'No experience needed'
    ],
    useCases: ['Content creation', 'Marketing', 'Social media', 'Business'],
    creditCost: 5
  }
}

export default function PublicToolPage({ toolId }) {
  const router = useRouter()
  const [toolData, setToolData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Get tool details from config or use defaults
  const toolConfig = TOOL_DETAILS[toolId] || {
    ...TOOL_DETAILS.default,
    name: toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'Content'
  }
  
  // Fetch additional data from API
  useEffect(() => {
    async function fetchToolData() {
      try {
        const res = await fetch(`/api/pages/${toolId}`)
        const data = await res.json()
        if (data.success && data.page) {
          setToolData(data.page)
        }
      } catch (error) {
        console.error('Error fetching tool data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchToolData()
  }, [toolId])
  
  const categoryConfig = CATEGORY_CONFIG[toolConfig.category] || CATEGORY_CONFIG.Content
  const CategoryIcon = categoryConfig.icon
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className={`${categoryConfig.color} text-white mb-4`}>
              <CategoryIcon className="w-3 h-3 mr-1" />
              {toolConfig.category}
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {toolData?.toolName || toolConfig.name}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {toolData?.seo?.metaDescription || toolConfig.tagline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                onClick={() => router.push(`/dashboard/tools/${toolId}`)}
              >
                Try {toolConfig.name} Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8"
                onClick={() => router.push('/register')}
              >
                Sign Up - Get 500 Free Credits
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              <Check className="inline w-4 h-4 text-green-500 mr-1" />
              No credit card required
              <span className="mx-2">•</span>
              <Clock className="inline w-4 h-4 text-blue-500 mr-1" />
              Results in seconds
            </p>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You Can Do With {toolConfig.name}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(toolData?.contentBlocks?.find(b => b.type === 'features')?.items || toolConfig.features).map((feature, index) => (
              <Card key={index} className="bg-background/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-medium">{typeof feature === 'string' ? feature : feature.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Perfect For
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {toolConfig.name} is designed to help you create professional content for various purposes
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {toolConfig.useCases.map((useCase, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-base py-2 px-4"
              >
                {useCase}
              </Badge>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Amazing Content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators using {toolConfig.name} to produce professional content in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 bg-gradient-to-r from-yellow-500 to-orange-500"
              onClick={() => router.push('/register')}
            >
              Get Started Free
              <Wand2 className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/pricing')}
            >
              View Pricing
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>10,000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Tools Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Explore More AI Tools
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            {['ai-video-studio', 'carousels', 'blog-creator', 'resume-builder', 'photo-cards', 'quotes']
              .filter(t => t !== toolId)
              .slice(0, 5)
              .map(tool => (
                <Link key={tool} href={`/tools/${tool}`}>
                  <Button variant="outline" size="sm">
                    {tool.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Button>
                </Link>
              ))
            }
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                View All 60+ Tools →
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
