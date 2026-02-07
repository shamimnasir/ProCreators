'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, Clock, Share2, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/landing/MoreSections'
import ReactMarkdown from 'react-markdown'

export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params?.slug) {
      fetchPost()
    }
  }, [params?.slug])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog?slug=${params.slug}`)
      const data = await res.json()
      if (data.success && data.post) {
        setPost(data.post)
      } else {
        setError('Post not found')
      }
    } catch (err) {
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-40 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <article className="pt-32 pb-20">
        {/* Header */}
        <header className="container max-w-4xl mx-auto px-6 mb-12">
          <Link href="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{post.category}</Badge>
            {post.featured && <Badge>Featured</Badge>}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
          
          <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={sharePost}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="container max-w-5xl mx-auto px-6 mb-12">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container max-w-3xl mx-auto px-6">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.content ? (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-3">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-6">{children}</blockquote>
                  ),
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
                    ) : (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{children}</code>
                      </pre>
                    ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt} className="rounded-lg my-6" />
                  )
                }}
              >
                {post.content}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                This post doesn't have content yet.
              </p>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 pt-8 border-t text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to create amazing content?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators using ProCreators to produce professional content faster.
            </p>
            <Link href="/login">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}
