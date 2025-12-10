import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request) {
  try {
    const { url } = await request.json()
    
    if (!url || !url.trim()) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 })
    }

    console.log(`[Product Scraper] Scraping URL: ${url}`)

    // Validate URL format
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 })
    }

    // Use the crawl API to fetch and extract product information
    const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: 'markdown',
        question: `Extract product information including:
- Product name and brand
- Product description
- Key features and specifications
- Price (if available)
- Product category
- Any pros/cons mentioned
- Images URLs
- Any ratings or reviews mentioned

Return this as structured information.`
      })
    })

    if (!crawlResponse.ok) {
      throw new Error(`Crawl API failed: ${crawlResponse.status}`)
    }

    const crawlData = await crawlResponse.json()
    
    if (!crawlData.success) {
      throw new Error(crawlData.error || 'Failed to scrape product data')
    }

    // Parse the markdown content to extract structured data
    const content = crawlData.data || crawlData.content || ''
    
    // Extract product information using simple parsing
    const productInfo = parseProductInfo(content, url)
    
    console.log(`[Product Scraper] Successfully scraped product:`, productInfo.name || 'Unknown')

    return NextResponse.json({
      success: true,
      product: productInfo,
      rawContent: content.substring(0, 1000) // First 1000 chars for context
    })

  } catch (error) {
    console.error('[Product Scraper] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to scrape product information'
    }, { status: 500 })
  }
}

function parseProductInfo(content, url) {
  // Extract domain for brand inference
  const domain = new URL(url).hostname.replace('www.', '').split('.')[0]
  
  // Basic product information extraction
  const lines = content.split('\n')
  let productName = ''
  let description = ''
  let price = ''
  let features = []
  let brand = ''
  
  // Try to find product name (usually in first heading or title)
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m)
  if (titleMatch) {
    productName = titleMatch[1].trim()
  }
  
  // Try to find price
  const priceMatch = content.match(/\$[\d,]+\.?\d*/g) || content.match(/£[\d,]+\.?\d*/g) || content.match(/€[\d,]+\.?\d*/g)
  if (priceMatch) {
    price = priceMatch[0]
  }
  
  // Try to extract brand
  const brandMatch = content.match(/brand[:\s]+([a-z0-9\s&]+)/i)
  if (brandMatch) {
    brand = brandMatch[1].trim()
  } else {
    // Infer brand from domain
    brand = domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  
  // Extract features (look for bullet points or numbered lists)
  const featureMatches = content.match(/^[\s]*[-*•]\s+(.+)$/gm) || []
  features = featureMatches.slice(0, 10).map(f => f.replace(/^[\s]*[-*•]\s+/, '').trim())
  
  // Get description (first substantial paragraph)
  const paragraphs = content.split('\n\n').filter(p => p.length > 50 && !p.startsWith('#'))
  if (paragraphs.length > 0) {
    description = paragraphs[0].substring(0, 500)
  }
  
  // Extract image URLs
  const imageMatches = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/g) || []
  const images = imageMatches.map(m => {
    const urlMatch = m.match(/\((https?:\/\/[^\)]+)\)/)
    return urlMatch ? urlMatch[1] : null
  }).filter(Boolean)
  
  return {
    name: productName || 'Product',
    brand: brand,
    description: description || content.substring(0, 300),
    price: price || 'Price not found',
    features: features,
    images: images.slice(0, 5),
    category: inferCategory(productName + ' ' + description, domain),
    url: url
  }
}

function inferCategory(text, domain) {
  const lowerText = text.toLowerCase()
  
  // Common product categories
  const categories = {
    'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'monitor', 'smartwatch', 'electronics'],
    'fashion': ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'clothing', 'fashion', 'wear', 'apparel'],
    'home': ['furniture', 'chair', 'table', 'bed', 'sofa', 'lamp', 'decor', 'kitchen', 'home'],
    'beauty': ['makeup', 'skincare', 'perfume', 'cosmetics', 'beauty', 'fragrance'],
    'sports': ['fitness', 'gym', 'sports', 'exercise', 'yoga', 'running', 'athletic'],
    'toys': ['toy', 'game', 'kids', 'children', 'play', 'puzzle'],
    'books': ['book', 'novel', 'reading', 'author'],
    'food': ['food', 'snack', 'drink', 'beverage', 'nutrition']
  }
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }
  
  // Domain-based inference
  if (domain.includes('apple')) return 'electronics'
  if (domain.includes('amazon') || domain.includes('ebay')) return 'general'
  
  return 'general'
}
