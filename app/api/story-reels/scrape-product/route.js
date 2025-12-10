import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'

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

    // Fetch the webpage content using simple fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()
    
    // Extract images and videos from HTML first
    const mediaUrls = extractMediaFromHtml(html, url)
    
    // Convert HTML to plain text for easier parsing
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    // Parse the markdown content to extract structured data
    const productInfo = parseProductInfo(content, url)
    
    // Add extracted media URLs
    productInfo.images = [...new Set([...mediaUrls.images, ...productInfo.images])] // Remove duplicates
    productInfo.videos = mediaUrls.videos
    
    // Download and cache images locally to avoid CORS issues
    const cachedImages = await downloadAndCacheImages(productInfo.images.slice(0, 10))
    productInfo.images = cachedImages
    
    console.log(`[Product Scraper] Successfully scraped product:`, productInfo.name || 'Unknown')
    console.log(`[Product Scraper] Cached ${cachedImages.length} images locally`)

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

function extractMediaFromHtml(html, baseUrl) {
  const images = []
  const videos = []
  
  try {
    // Extract image URLs from img tags
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || []
    for (const match of imgMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        let imageUrl = srcMatch[1]
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
          const baseUrlObj = new URL(baseUrl)
          imageUrl = baseUrlObj.origin + imageUrl
        } else if (!imageUrl.startsWith('http')) {
          const baseUrlObj = new URL(baseUrl)
          imageUrl = new URL(imageUrl, baseUrlObj.href).href
        }
        
        // Filter out small icons and common non-product images
        if (!imageUrl.includes('icon') && 
            !imageUrl.includes('logo') && 
            !imageUrl.includes('favicon') &&
            !imageUrl.includes('sprite') &&
            !imageUrl.match(/\d+x\d+/) || 
            imageUrl.match(/(\d+)x(\d+)/) && (parseInt(RegExp.$1) > 200 || parseInt(RegExp.$2) > 200)) {
          images.push(imageUrl)
        }
      }
    }
    
    // Extract video URLs from video tags and common video sources
    const videoMatches = html.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/gi) || []
    for (const match of videoMatches) {
      const srcMatch = match.match(/src=["']([^"']+)["']/)
      if (srcMatch) {
        let videoUrl = srcMatch[1]
        // Convert relative URLs to absolute
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl
        } else if (videoUrl.startsWith('/')) {
          const baseUrlObj = new URL(baseUrl)
          videoUrl = baseUrlObj.origin + videoUrl
        }
        videos.push(videoUrl)
      }
    }
    
    // Extract YouTube embeds
    const youtubeMatches = html.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/g) || []
    for (const match of youtubeMatches) {
      const videoId = match.split('/').pop()
      videos.push(`https://www.youtube.com/watch?v=${videoId}`)
    }
    
  } catch (error) {
    console.error('[Media Extraction] Error:', error)
  }
  
  return {
    images: [...new Set(images)], // Remove duplicates
    videos: [...new Set(videos)]  // Remove duplicates
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

async function downloadAndCacheImages(imageUrls) {
  const cachedImages = []
  const cacheDir = join(process.cwd(), 'public', 'product-images-cache')
  
  // Create cache directory if it doesn't exist
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true })
  }
  
  // Filter out invalid URLs
  const validUrls = imageUrls.filter(url => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  })
  
  console.log(`[Image Cache] Found ${validUrls.length} valid image URLs, will download up to 10`)
  
  for (let i = 0; i < Math.min(validUrls.length, 10); i++) {
    try {
      const imageUrl = validUrls[i]
      const imageId = randomBytes(8).toString('hex')
      const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] || 'jpg'
      const filename = `${imageId}.${ext}`
      const filepath = join(cacheDir, filename)
      
      console.log(`[Image Cache] Downloading image ${i + 1}/10: ${imageUrl.substring(0, 100)}...`)
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': imageUrl.split('/').slice(0, 3).join('/') + '/'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout per image
      })
      
      if (!response.ok) {
        console.log(`[Image Cache] Failed to fetch image ${i + 1}: ${response.status}`)
        continue
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Validate image size (should be at least 1KB)
      if (buffer.length < 1024) {
        console.log(`[Image Cache] Image ${i + 1} too small (${buffer.length} bytes), skipping`)
        continue
      }
      
      await writeFile(filepath, buffer)
      
      // Return the local URL path
      cachedImages.push(`/product-images-cache/${filename}`)
      console.log(`[Image Cache] ✓ Cached image ${i + 1}/10 (${Math.round(buffer.length / 1024)}KB)`)
      
    } catch (error) {
      console.error(`[Image Cache] Error downloading image ${i + 1}:`, error.message)
      // Continue with next image
    }
  }
  
  console.log(`[Image Cache] Successfully cached ${cachedImages.length} images`)
  return cachedImages
}
