'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { PublicLayout } from '@/components/shared/PublicLayout'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: '10 Tips for Creating Viral Social Media Content',
      excerpt: 'Learn the secrets to creating content that gets shared thousands of times across social media platforms.',
      category: 'Content Strategy',
      author: 'ProCreators Team',
      date: 'December 4, 2025',
      readTime: '5 min read',
      featured: true
    },
    {
      id: 2,
      title: 'How AI is Revolutionizing Content Creation',
      excerpt: 'Discover how artificial intelligence is changing the game for creators, marketers, and businesses.',
      category: 'AI Technology',
      author: 'ProCreators Team',
      date: 'December 3, 2025',
      readTime: '7 min read',
      featured: false
    },
    {
      id: 3,
      title: 'Beginner Guide to Thread Writing',
      excerpt: 'Master the art of Twitter threads that capture attention and drive engagement.',
      category: 'Tutorials',
      author: 'ProCreators Team',
      date: 'December 2, 2025',
      readTime: '4 min read',
      featured: false
    },
    {
      id: 4,
      title: 'Best Practices for AI Image Generation',
      excerpt: 'Tips and tricks for getting the best results from AI image generation tools.',
      category: 'Design',
      author: 'ProCreators Team',
      date: 'December 1, 2025',
      readTime: '6 min read',
      featured: false
    },
    {
      id: 5,
      title: 'Building a Content Calendar That Works',
      excerpt: 'Plan, organize, and execute your content strategy with a proven framework.',
      category: 'Content Strategy',
      author: 'ProCreators Team',
      date: 'November 30, 2025',
      readTime: '5 min read',
      featured: false
    },
    {
      id: 6,
      title: 'The Future of Video Content Creation',
      excerpt: 'What to expect in the next generation of video creation tools and platforms.',
      category: 'Video',
      author: 'ProCreators Team',
      date: 'November 29, 2025',
      readTime: '8 min read',
      featured: false
    },
  ]

  const categories = ['All', 'Content Strategy', 'AI Technology', 'Tutorials', 'Design', 'Video']

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0e27]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Blog & Resources
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Tips, tutorials, and insights to help you master content creation with AI.
          </p>
        </div>
      </header>

      {/* Categories */}
      <section className="py-8 border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? 'default' : 'outline'}
                className={index === 0 ? 'bg-[#7c3aed] hover:bg-[#6d28d9]' : 'border-white/20 text-gray-300 hover:bg-white/10'}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Featured Post</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded"></div>
          </div>

          {blogPosts.filter(post => post.featured).map((post) => (
            <Card key={post.id} className="overflow-hidden border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-[#7c3aed]/50 transition-all">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20"></div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7c3aed] text-white">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{post.title}</h3>
                  <p className="text-gray-400 mb-6">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white">
                    Read Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* All Posts */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Recent Articles</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded"></div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.filter(post => !post.featured).map((post) => (
              <Card key={post.id} className="overflow-hidden border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-[#7c3aed]/50 transition-all group cursor-pointer">
                <div className="relative h-48 bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20"></div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#a78bfa] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center gap-2">
            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">Previous</Button>
            <Button className="bg-[#7c3aed] hover:bg-[#6d28d9]">1</Button>
            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">2</Button>
            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">3</Button>
            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">Next</Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="p-12 text-center bg-gradient-to-b from-[#7c3aed]/20 to-transparent border-[#7c3aed]/50">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
            <p className="text-gray-400 mb-6">
              Get the latest tips, tutorials, and product updates delivered to your inbox.
            </p>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7c3aed]"
              />
              <Button className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white">
                Subscribe
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
