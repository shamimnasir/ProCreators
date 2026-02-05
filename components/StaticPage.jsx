'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { Loader2 } from 'lucide-react'

// Content block renderer (same as in ToolPageRenderer)
function ContentBlock({ block }) {
  const { type, content } = block
  
  switch (type) {
    case 'hero':
      return (
        <div className="py-16 px-4 text-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl mb-8">
          {content.badge && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full mb-4">
              {content.badge}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{content.subtitle}</p>
        </div>
      )
    
    case 'heading':
      const HeadingTag = `h${content.level || 2}`
      return (
        <HeadingTag className={`font-bold mb-4 ${
          content.level === 1 ? 'text-3xl' : 
          content.level === 2 ? 'text-2xl' : 
          content.level === 3 ? 'text-xl' : 'text-lg'
        }`}>
          {content.text}
        </HeadingTag>
      )
    
    case 'paragraph':
      return (
        <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
          {content.text}
        </p>
      )
    
    case 'features':
      return (
        <div className="mb-12">
          {content.title && <h2 className="text-2xl font-bold mb-6 text-center">{content.title}</h2>}
          <div className={`grid gap-6 ${
            content.columns === 2 ? 'md:grid-cols-2' :
            content.columns === 3 ? 'md:grid-cols-3' :
            content.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
          }`}>
            {content.items?.map((item, i) => (
              <div key={i} className="p-6 rounded-xl border bg-card text-center">
                {item.icon && <span className="text-4xl mb-4 block">{item.icon}</span>}
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'faq':
      return (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold mb-6">{content.title || 'Frequently Asked Questions'}</h2>
          {content.items?.map((item, i) => (
            <details key={i} className="p-4 rounded-lg border bg-card group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {item.question}
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      )
    
    case 'steps':
      return (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">{content.title || 'How It Works'}</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {content.items?.map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'cta':
      return (
        <div className="p-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{content.title}</h2>
          <p className="mb-6 text-lg opacity-90">{content.subtitle}</p>
          {content.buttonText && content.buttonLink && (
            <a 
              href={content.buttonLink}
              className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              {content.buttonText}
            </a>
          )}
        </div>
      )
    
    case 'testimonials':
      return (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">{content.title || 'What Our Users Say'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {content.items?.map((item, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card">
                <p className="italic text-muted-foreground mb-4">"{item.quote}"</p>
                <div className="flex items-center gap-3">
                  {item.avatar && (
                    <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full" />
                  )}
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    {item.role && <div className="text-sm text-muted-foreground">{item.role}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'divider':
      return <hr className="my-12 border-border" />
    
    case 'custom_html':
      return (
        <div 
          className="mb-8 prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content.html || '' }} 
        />
      )
    
    case 'image':
      return (
        <div className="mb-8">
          {content.url && (
            <img 
              src={content.url} 
              alt={content.alt || ''} 
              className={`rounded-lg ${content.fullWidth ? 'w-full' : 'max-w-2xl mx-auto'}`}
            />
          )}
          {content.caption && (
            <p className="text-sm text-muted-foreground text-center mt-2">{content.caption}</p>
          )}
        </div>
      )
    
    default:
      return null
  }
}

// Main static page component
export function StaticPage({ pageId }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/static-pages/${pageId}`)
        const data = await res.json()
        if (data.success) {
          setPage(data.page)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPage()
  }, [pageId])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl mx-auto px-6 py-12">
          {page.contentBlocks?.map((block) => (
            <ContentBlock key={block.id} block={block} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
