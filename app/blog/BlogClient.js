'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Search,
  ArrowRight,
  Calendar,
  User,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/landing/MoreSections'

export default function BlogClient() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const url = selectedCategory === 'All' 
        ? '/api/blog' 
        : `/api/blog?category=${selectedCategory}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts || [])
        setCategories(data.categories || ['All'])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter posts by search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate featured and regular posts
  const featuredPost = filteredPosts.find(p => p.featured)
  const regularPosts = filteredPosts.filter(p => !p.featured || p !== featuredPost)

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 px-4 py-1">
              <BookOpen className="h-3 w-3 mr-2" />
              ProCreators Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Tips, Tutorials & Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Learn how to create better content, grow your audience, and master AI-powered tools.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search articles..." 
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-8">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="px-6 pb-20">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Check back soon for new content!'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-12">
                  <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        {featuredPost.coverImage ? (
                          <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-20 w-20 text-primary/30" />
                        )}
                      </div>
                      <div className="p-6 md:p-8 flex flex-col justify-center">
                        <Badge className="w-fit mb-4">Featured</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">{featuredPost.title}</h2>
                        <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {featuredPost.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(featuredPost.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {featuredPost.readTime}
                          </span>
                        </div>
                        <Link href={`/blog/${featuredPost.slug}`}>
                          <Button>
                            Read Article
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Post Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Card key={post.postId || post.slug} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                        <span className="text-sm text-muted-foreground">{post.readTime}</span>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm">
                          Read More
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-8">
              Get the latest tips, tutorials, and product updates delivered to your inbox.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
