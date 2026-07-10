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

// -----------------------------------------------------------
// HIDDEN_FROM_PUBLIC, tools that still WORK at their direct URLs (dashboard),
// but are hidden from the public /tools index because they don't serve
// the KDP/Etsy publisher audience. Do NOT delete these tool pages.
// -----------------------------------------------------------
const HIDDEN_FROM_PUBLIC = new Set([
 'thread-creator',
 'news',
 'quotes',
 'ad-copy',
 'business-plan',
 'pitch-deck',
 'marketing-strategy',
 'email-campaigns',
 'swot-analysis',
 'essay-helper',
 'study-notes',
 'exam-prep',
 'lesson-planner',
 'citation-generator',
 'auto-subtitles',
 'auto-reels',
 'story-reels',
 'long-form',
 'noise-remover',
 'voice-enhancer',
 'audio-editor',
 'avatar-creator',
 'meme-generator',
 'linkedin-posts',
 'youtube-creator',
 'ai-humanizer',
 'slides-maker',
 'quiz-maker',
])

// -----------------------------------------------------------
// Publisher-focused tool categories, displayed in this exact order.
// -----------------------------------------------------------
const TOOLS_BY_CATEGORY = {
 'Build Your Products': {
 icon: FileText,
 color: 'bg-blue-500',
 slug: 'digital-products',
 description: 'The core publishing stack. Everything you need to build KDP and Etsy products from scratch.',
 tools: [
 { id: 'ebook-maker', name: 'Ebook Creator', description: 'Full ebook with title, TOC, intro, chapters, conclusion, and author bio auto-generated. 5 cover styles × 3 typography sets. Auto-saved drafts. One-click 300 DPI KDP PDF export.' },
 { id: 'planner-maker', name: 'Digital Planner', description: '10 planner types (daily, weekly, monthly, habit, budget, meal, fitness, goal, project, gratitude). 5 color themes × 4 design styles. Pre-formatted for 6×9 and 8.5×11 KDP sizes. Download and upload to KDP directly.' },
 { id: 'worksheet-maker', name: 'Worksheet Generator', description: 'Printable worksheets for any subject or grade level. Teacher-friendly fields (subject, grade, instructions). Custom primary + secondary colors. Multi-page bundles auto-generated. Works for KDP and Etsy.' },
 { id: 'coloring-book', name: 'Coloring Book', description: 'Black-and-white AI line-art. 5 KDP-accepted paper sizes: 8.5×11 (gold standard), 8×10, 8.5×8.5 (mandalas), 7×10, 8.25×8.25. 10 to 120 pages. Print-ready 300 DPI with correct bleed.' },
 { id: 'journal-maker', name: 'Journal Maker', description: '8 journal types (Gratitude, Mindfulness, Self-Discovery, Dream, Fitness, Bullet, Reading, Travel). Unique prompts per page. KDP trims 6×9 and 5.5×8.5. 4 design themes: Floral, Elegant, Minimalist, Boho.' },
 { id: 'notion-templates', name: 'Notion Templates', description: 'Sell-ready Notion templates for Work (Product, Marketing, HR, CRM), School (Study Planner, Class Notes, Research), and Life (Health, Habits, Meal Plans). Includes setup instructions and onboarding copy for buyers.' },
 { id: 'ai-prompt-pack', name: 'AI Prompt Pack Generator', description: 'Sellable prompt packs of 25\u2013200 prompts organized by category (marketing, sales, writing, coding). Each prompt has a use case, ready-to-copy body, and example output. Sells for $9\u2013$99 on Etsy and Gumroad.', badge: 'NEW' },
 { id: 'recipe-book', name: 'Recipe Book Generator', description: 'Complete cookbook (10\u201350 recipes) with prep/cook time, ingredients, steps, nutrition, and one-week meal plan. Any cuisine or diet. KDP paperback-ready.', badge: 'NEW' },
 { id: 'spreadsheet-template', name: 'Spreadsheet Template Builder', description: 'Google Sheets / Excel templates: budget trackers, freelancer invoices, Airbnb dashboards, meal-prep planners. Includes formulas, sample data, dashboards, and CSV download.', badge: 'NEW' },
 { id: 'wedding-suite', name: 'Wedding Printable Suite', description: 'Complete 8-piece wedding stationery: save-the-date, invitation, RSVP, details, program, menu, table cards, thank you. $25\u2013$65 per Etsy sale at 95% margins.', badge: 'NEW' },
 { id: 'puzzle-book', name: 'Themed Puzzle Book Generator', description: 'Themed word-search puzzle books (K-pop, dinosaurs, cats, holidays). Auto-generated printable grids, difficulty tiers, kids-to-seniors audiences. KDP research: themed puzzles outsell generic 4:1.', badge: 'NEW' },
 ]
 },
 'Design Your Covers': {
 icon: Image,
 color: 'bg-purple-500',
 slug: 'covers',
 description: 'KDP-ready cover art and marketplace-perfect product graphics. Sized and export-ready.',
 tools: [
 { id: 'cover-image-creator', name: 'KDP Cover Designer', description: 'Front, spine, and back in one flow. Auto-calculates spine width from your page count. 12+ platform presets (KDP paperback, Kindle, Etsy shop, YouTube, socials) with exact pixel dimensions. 300 DPI download, ready to upload straight to KDP.' },
 { id: 'image-editor', name: 'AI Image Studio', description: 'Generate and edit high-resolution product images for covers, mockups, and Etsy listing photos. Aspect ratios locked to marketplace requirements.' },
 { id: 'carousels', name: 'Carousel Creator', description: 'Design carousel post sets (5+ slides) for promoting your published products on Instagram, LinkedIn, Pinterest.' },
 { id: 'photo-cards', name: 'Photo Cards', description: 'Printable photo cards, greeting cards, and gift tags. Sell as digital printables on Etsy.' },
 ]
 },
 'Write Your Content': {
 icon: Wand2,
 color: 'bg-pink-500',
 slug: 'content',
 description: 'Amazon-ready listing copy that ranks. Blog posts and content that reads human.',
 tools: [
 { id: 'amazon-listing', name: 'Amazon Listing Writer', description: 'Title, 7 bullet points, description, and backend keywords, all Amazon algorithm optimized. Built-in AI Humanizer so your listing passes AI detection. One-click SEO meta description. Copy-paste ready for KDP and Etsy dashboards.' },
 ]
 },
 'Create Your Videos': {
 icon: Video,
 color: 'bg-red-500',
 slug: 'videos',
 description: 'Product promo videos, reels, and thumbnails to drive traffic to your Amazon and Etsy listings.',
 tools: [
 { id: 'ai-video-studio', name: 'AI Video Studio', description: 'Professional product promo videos for KDP and Etsy listings. Cinematic AI video with your product visuals.' },
 { id: 'quick-reels', name: 'Quick Video Studio', description: 'Short, viral videos to promote your published products. Vertical format for Reels, TikTok, and Shorts.' },
 { id: 'reels', name: 'Reels Creator', description: 'Social reels showcasing your new listings. Auto-captioned. Music-ready.' },
 { id: 'thumbnail-maker', name: 'Thumbnail Maker', description: 'Attention-grabbing thumbnails for YouTube promos, blog headers, and social posts.' },
 ]
 },
 'Career & Job Search': {
 icon: Briefcase,
 color: 'bg-emerald-500',
 slug: 'career',
 description: 'AI-powered career suite. Perfect for job seekers AND for creating sellable career-templates on Etsy.',
 tools: [
 { id: 'resume-builder', name: 'Resume Builder', description: 'Build ATS-friendly resumes with multiple templates (Modern, Classic, Creative). One-click PDF export. Bonus: bundle 5+ template variants and sell them as Canva-ready resume packs on Etsy ($5–$25 each).' },
 { id: 'cover-letter', name: 'Cover Letter Writer', description: 'AI-drafted cover letters with 5+ tone options (Professional, Enthusiastic, Confident, Conversational, Formal). PDF-ready. Bundle with resume templates for a complete Etsy career pack.' },
 { id: 'interview-prep', name: 'Interview Prep Coach', description: 'Job-title and company-specific interview questions with difficulty tiers. Paste the job description for hyper-targeted practice. Great for sellable interview-prep guides on Gumroad.' },
 { id: 'job-matcher', name: 'ATS Job Matcher', description: 'Paste a job description and your resume, get a keyword-match score. See missing keywords to add. Beat the ATS filter every time.' },
 { id: 'salary-negotiator', name: 'Salary Negotiator', description: '5 negotiation scenarios: initial offer, counter offer, raise request, promotion, competing offers. AI-written scripts and email templates for each.' },
 ]
 },
}

// Filter out hidden tools from all categories (defense in depth, respects HIDDEN_FROM_PUBLIC)
function getVisibleCategories() {
 const out = {}
 for (const [cat, data] of Object.entries(TOOLS_BY_CATEGORY)) {
 const tools = data.tools.filter(t => !HIDDEN_FROM_PUBLIC.has(t.id) && !t.hidden)
 if (tools.length > 0) out[cat] = { ...data, tools }
 }
 return out
}

export default function ToolsIndexClient() {
 const [searchQuery, setSearchQuery] = useState('')
 const [selectedCategory, setSelectedCategory] = useState('all')

 const visibleCategories = getVisibleCategories()

 const filteredCategories = Object.entries(visibleCategories).filter(([category]) => {
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
 <section aria-label="Complete AI publishing toolkit for KDP and Etsy sellers" className="pt-32 pb-8 px-4">
 <div className="container mx-auto max-w-6xl text-center">
 <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
 AI Publishing Toolkit
 </Badge>
 <h1 className="text-4xl md:text-6xl font-bold mb-6">
 The Complete AI Publishing Toolkit for Amazon KDP and Etsy Sellers
 </h1>
 <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
 Every tool built for one job: getting your product from idea to published, faster than you thought possible.
 </p>

 {/* Not sure where to start bar */}
 <div className="mb-8 max-w-2xl mx-auto glass-badge rounded-full px-5 py-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
 <span className="text-muted-foreground">Not sure where to start?</span>
 <Link href="/tools/ebook-maker" className="font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
 Build your first ebook free in 30 minutes <ArrowRight className="w-3.5 h-3.5" />
 </Link>
 </div>

 {/* Search */}
 <div className="max-w-md mx-auto relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
 <Input
 placeholder="Search publishing tools..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 h-12 text-lg"
 aria-label="Search publishing tools"
 />
 </div>
 </div>
 </section>

 {/* Category Filter */}
 <section aria-label="Filter tools by category" className="pb-8 px-4">
 <div className="container mx-auto max-w-6xl">
 <div className="flex flex-wrap justify-center gap-2">
 <Button
 variant={selectedCategory === 'all' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setSelectedCategory('all')}
 >
 All Tools
 </Button>
 {Object.entries(visibleCategories).map(([category, data]) => {
 const Icon = data.icon
 return (
 <Button
 key={category}
 variant={selectedCategory === category ? 'default' : 'outline'}
 size="sm"
 onClick={() => setSelectedCategory(category)}
 aria-label={`Filter to ${category} tools`}
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
 <section aria-label="All publishing tools grouped by category" className="py-12 px-4">
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

 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {data.tools.map(tool => (
 <Link key={tool.id} href={`/tools/${tool.id}`} aria-label={`Open ${tool.name}`}>
 <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group relative">
 {tool.badge && (
 <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
 {tool.badge}
 </span>
 )}
 <CardHeader className="pb-2">
 <CardTitle className="text-lg group-hover:text-primary transition-colors pr-14">
 {tool.name}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <CardDescription className="leading-relaxed">{tool.description}</CardDescription>
 <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
 Open tool <ArrowRight className="w-4 h-4 ml-1" />
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
 <p className="text-muted-foreground">No tools found matching &ldquo;{searchQuery}&rdquo;</p>
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
 <section aria-label="Start publishing free" className="py-16 bg-muted/30">
 <div className="container mx-auto max-w-4xl px-4 text-center">
 <h2 className="text-3xl font-bold mb-4">Ready to Publish Faster?</h2>
 <p className="text-muted-foreground mb-8">
 Start with your first complete product free. No credit card needed.
 </p>
 <Link href="/register" aria-label="Publish your first product free, no credit card required">
 <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold">
 Publish My First Product Free
 <ArrowRight className="ml-2 w-5 h-5" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 )
}
