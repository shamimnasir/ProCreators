'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'

// Hook to fetch and use page content from the database
export function useToolPage(toolId) {
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!toolId) return
    
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${toolId}`)
        const data = await res.json()
        if (data.success && data.page) {
          setPageData(data.page)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPage()
  }, [toolId])

  return { pageData, loading, error }
}

// Component to render SEO meta tags from page data
export function ToolPageSEO({ toolId, fallback = {} }) {
  const { pageData } = useToolPage(toolId)
  
  const seo = pageData?.seo || fallback
  
  if (!seo.title && !fallback.title) return null
  
  return (
    <>
      {/* These will be picked up by Next.js metadata */}
      <title>{seo.title || fallback.title}</title>
      <meta name="description" content={seo.description || fallback.description || ''} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}
    </>
  )
}

// Component to render content blocks from page data
export function ToolPageContent({ toolId, className = '' }) {
  const { pageData, loading } = useToolPage(toolId)
  
  if (loading || !pageData?.contentBlocks?.length) return null
  
  return (
    <div className={`tool-page-content ${className}`}>
      {pageData.contentBlocks.map((block) => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </div>
  )
}

// Render individual content block
function ContentBlock({ block }) {
  const { type, content } = block
  
  switch (type) {
    case 'hero':
      return (
        <div className="py-12 px-4 text-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl mb-8">
          {content.badge && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full mb-4">
              {content.badge}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{content.subtitle}</p>
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
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {content.text}
        </p>
      )
    
    case 'features':
      return (
        <div className={`grid gap-6 mb-8 ${
          content.columns === 2 ? 'md:grid-cols-2' :
          content.columns === 3 ? 'md:grid-cols-3' :
          content.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
        }`}>
          {content.items?.map((item, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card">
              {item.icon && <span className="text-2xl mb-2 block">{item.icon}</span>}
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      )
    
    case 'faq':
      return (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold mb-4">{content.title || 'Frequently Asked Questions'}</h2>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{content.title || 'How It Works'}</h2>
          <div className="space-y-4">
            {content.items?.map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    
    case 'cta':
      return (
        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
          <p className="mb-4 opacity-90">{content.subtitle}</p>
          {content.buttonText && (
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition">
              {content.buttonText}
            </button>
          )}
        </div>
      )
    
    case 'stats':
      return (
        <div className={`grid gap-6 mb-8 ${
          content.columns === 2 ? 'md:grid-cols-2' :
          content.columns === 3 ? 'md:grid-cols-3' :
          content.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-4'
        }`}>
          {content.items?.map((item, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-3xl font-bold text-primary">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      )
    
    case 'testimonials':
      return (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{content.title || 'What Our Users Say'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {content.items?.map((item, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card">
                <p className="italic text-muted-foreground mb-4">"{item.quote}"</p>
                <div className="flex items-center gap-3">
                  {item.avatar && (
                    <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full" />
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
      return <hr className="my-8 border-border" />
    
    case 'custom_html':
      return (
        <div 
          className="mb-8"
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
    
    case 'video':
      return (
        <div className="mb-8 aspect-video rounded-lg overflow-hidden">
          {content.embedUrl && (
            <iframe
              src={content.embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )}
        </div>
      )
    
    default:
      return null
  }
}

// Export a wrapper component that renders below the main tool UI
export function ToolPageExtraContent({ toolId }) {
  const { pageData, loading } = useToolPage(toolId)
  
  if (loading || !pageData?.contentBlocks?.length) return null
  
  // Filter out hero blocks (usually shown at top), render remaining
  const extraBlocks = pageData.contentBlocks.filter(b => b.type !== 'hero')
  
  if (extraBlocks.length === 0) return null
  
  return (
    <div className="mt-12 pt-8 border-t">
      {extraBlocks.map((block) => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </div>
  )
}
