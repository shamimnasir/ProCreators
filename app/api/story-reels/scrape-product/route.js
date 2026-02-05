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

    // Fetch the webpage content with full browser headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.amazon.com/'
      },
      signal: AbortSignal.timeout(20000) // 20 second timeout
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
    
    // Download and cache UGC videos (max 3 for shorts/reels)
    const cachedVideos = await downloadAndCacheVideos(productInfo.videos.slice(0, 3))
    productInfo.videos = cachedVideos
    
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
    // Method 1: Extract from Amazon's inline JSON data (colorImages, altImages)
    const colorImagesMatch = html.match(/'colorImages':\s*\{[^}]*'initial':\s*(\[[^\]]+\])/s)
    if (colorImagesMatch) {
      const jsonStr = colorImagesMatch[1]
      const urlMatches = jsonStr.match(/https?:\/\/[^"'\s,]+\/images\/I\/[A-Za-z0-9+_-]+\.jpg/g) || []
      urlMatches.forEach(url => {
        const cleanUrl = url.replace(/\\"/g, '').replace(/\\'/g, '')
        if (!cleanUrl.includes('icon') && !cleanUrl.includes('logo')) {
          images.push(cleanUrl)
        }
      })
    }
    
    // Method 2: Extract all Amazon media URLs from entire HTML
    const amazonImageMatches = html.match(/https?:\/\/[^"'\s]*(?:media-amazon\.com|ssl-images-amazon\.com|images-(?:na|eu|fe)\.ssl-images-amazon\.com)[^"'\s]*\/images\/I\/[A-Za-z0-9+_-]+\.(?:jpg|png|webp)/gi) || []
    for (const url of amazonImageMatches) {
      const cleanUrl = url.replace(/\\"/g, '').replace(/\\'/g, '').replace(/&quot;/g, '')
      if (!cleanUrl.includes('icon') && !cleanUrl.includes('logo') && !cleanUrl.includes('sprite')) {
        images.push(cleanUrl)
      }
    }
    
    // Method 5: If still no images, try to find ANY amazon image URLs in the HTML
    if (images.length === 0) {
      const broadMatches = html.match(/https?:\/\/[^"'\s<>]+amazon[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi) || []
      for (const url of broadMatches) {
        const cleanUrl = url.replace(/\\"/g, '').replace(/&quot;/g, '').replace(/&amp;/g, '&')
        // Filter out obvious non-product images
        if (!cleanUrl.match(/nav|sprite|icon|logo|button|badge|arrow|star|checkmark|pixel|1x1|blank/i) &&
            cleanUrl.includes('/I/')) {
          images.push(cleanUrl)
        }
      }
      }
    
    // Method 3: Look for hiRes and large images in JSON structures
    const hiResMatches = html.match(/"(?:hiRes|large)":\s*"([^"]+)"/g) || []
    for (const match of hiResMatches) {
      const urlMatch = match.match(/"(?:hiRes|large)":\s*"([^"]+)"/)
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'null' && urlMatch[1].includes('images-amazon')) {
        images.push(urlMatch[1])
      }
    }
    
    // Method 4: Extract from data-a-dynamic-image attribute
    const dynamicImageMatches = html.match(/data-a-dynamic-image=["']([^"']+)["']/gi) || []
    for (const match of dynamicImageMatches) {
      const jsonMatch = match.match(/data-a-dynamic-image=["']([^"']+)["']/i)
      if (jsonMatch) {
        try {
          const decoded = jsonMatch[1].replace(/&quot;/g, '"')
          const urlMatches = decoded.match(/https?:\/\/[^"]+\/images\/I\/[A-Za-z0-9+_-]+\.jpg/g) || []
          urlMatches.forEach(url => images.push(url))
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    // Extract from img tags as fallback
    const imgMatches = html.match(/<img[^>]+>/gi) || []
    for (const match of imgMatches) {
      // Skip if this image is clearly promotional
      if (match.toLowerCase().includes('fresh') || 
          match.toLowerCase().includes('prime') ||
          match.toLowerCase().includes('video') ||
          match.toLowerCase().includes('grocery') ||
          match.toLowerCase().includes('banner')) {
        continue
      }
      
      // Try multiple attributes where images might be stored
      const srcMatch = match.match(/src=["']([^"']+)["']/) || 
                       match.match(/data-src=["']([^"']+)["']/) ||
                       match.match(/data-old-hires=["']([^"']+)["']/) ||
                       match.match(/data-a-dynamic-image=["']([^"']+)["']/)
      
      if (srcMatch) {
        let imageUrl = srcMatch[1]
        
        // For Amazon dynamic images, extract all URLs from the JSON
        if (imageUrl.startsWith('{')) {
          try {
            // Extract all URLs from the JSON object
            const urlMatches = imageUrl.match(/"(https?:\/\/[^"]+)"/g) || []
            for (const url of urlMatches) {
              const cleanUrl = url.replace(/"/g, '')
              if (cleanUrl.includes('_AC_') || cleanUrl.includes('_SL') || cleanUrl.includes('_SX')) {
                images.push(cleanUrl)
              }
            }
            continue
          } catch (e) {
            continue
          }
        }
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
          const baseUrlObj = new URL(baseUrl)
          imageUrl = baseUrlObj.origin + imageUrl
        } else if (!imageUrl.startsWith('http')) {
          try {
            const baseUrlObj = new URL(baseUrl)
            imageUrl = new URL(imageUrl, baseUrlObj.href).href
          } catch (e) {
            continue
          }
        }
        
        // Skip data URIs and tiny images
        if (imageUrl.startsWith('data:')) continue
        
        // Filter out promotional and UI images
        if (imageUrl.includes('icon') || 
            imageUrl.includes('logo') || 
            imageUrl.includes('favicon') ||
            imageUrl.includes('sprite') ||
            imageUrl.includes('1x1') ||
            imageUrl.includes('pixel') ||
            imageUrl.includes('/nav/') ||
            imageUrl.includes('/chrome/') ||
            imageUrl.includes('fresh') ||
            imageUrl.includes('prime') ||
            imageUrl.includes('banner') ||
            imageUrl.includes('.gif')) {
          continue
        }
        
        // Only include images that look like product images
        // Amazon product images typically have _AC_, _SL, or _SX in the URL
        if ((imageUrl.includes('media-amazon.com') || 
             imageUrl.includes('ssl-images-amazon.com') ||
             imageUrl.includes('images-na.ssl-images-amazon.com')) &&
            (imageUrl.includes('_AC_') || imageUrl.includes('_SL') || imageUrl.includes('_SX') || imageUrl.includes('/I/'))) {
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
    
    // Extract User-Generated Content (UGC) videos from Amazon
    // Amazon stores customer videos in their video player data structures
    // Method 1: Look for video URLs in data-video-url attributes
    const dataVideoMatches = html.match(/data-video-url=["']([^"']+)["']/gi) || []
    for (const match of dataVideoMatches) {
      const urlMatch = match.match(/data-video-url=["']([^"']+)["']/)
      if (urlMatch && urlMatch[1]) {
        let videoUrl = urlMatch[1]
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl
        }
        videos.push(videoUrl)
      }
    }
    
    // Method 2: Look for Amazon video player URLs (m.media-amazon.com/video)
    const amazonVideoMatches = html.match(/https?:\/\/[^"'\s]*(?:m\.media-amazon\.com|images-amazon\.com)[^"'\s]*\/videos?\/[^"'\s]+\.(?:mp4|webm)/gi) || []
    for (const url of amazonVideoMatches) {
      const cleanUrl = url.replace(/\\"/g, '').replace(/\\'/g, '')
      videos.push(cleanUrl)
    }
    
    // Method 3: Extract from video source URLs in the HTML
    const videoSrcMatches = html.match(/<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi) || []
    for (const match of videoSrcMatches) {
      const urlMatch = match.match(/src=["']([^"']+)["']/)
      if (urlMatch && urlMatch[1]) {
        let videoUrl = urlMatch[1]
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl
        }
        videos.push(videoUrl)
      }
    }
    
    // Method 4: Look for Amazon Live video URLs
    const liveVideoMatches = html.match(/https?:\/\/[^"'\s]*amazon\.com\/live\/video\/[a-zA-Z0-9]+/gi) || []
    for (const url of liveVideoMatches) {
      // These are Amazon Live URLs, we'll note them but may need special handling
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
  
  // Filter out invalid URLs and convert thumbnails to full size
  const validUrls = imageUrls
    .filter(url => {
      try {
        const urlObj = new URL(url)
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
      } catch {
        return false
      }
    })
    .map(url => {
      // Convert Amazon thumbnail URLs to full-size versions
      // Replace _AC_US40_ (40px) or similar with _AC_SL1500_ (1500px)
      return url
        .replace(/_AC_US\d+_/, '_AC_SL1500_')
        .replace(/_AC_UL\d+_/, '_AC_SL1500_')
        .replace(/_AC_SR\d+,\d+_/, '_AC_SL1500_')
        .replace(/\.SS\d+_/, '_AC_SL1500_.')
    })
  
  // Remove duplicates
  const uniqueUrls = [...new Set(validUrls)]
  
  for (let i = 0; i < Math.min(uniqueUrls.length, 10); i++) {
    try {
      const imageUrl = uniqueUrls[i]
      const imageId = randomBytes(8).toString('hex')
      const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] || 'jpg'
      const filename = `${imageId}.${ext}`
      const filepath = join(cacheDir, filename)
      
      }...`)
      
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
        continue
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Validate image size (should be at least 1KB)
      if (buffer.length < 1024) {
        , skipping`)
        continue
      }
      
      await writeFile(filepath, buffer)
      
      // Return the local URL path
      cachedImages.push(`/product-images-cache/${filename}`)
      }KB)`)
      
    } catch (error) {
      console.error(`[Image Cache] Error downloading image ${i + 1}:`, error.message)
      // Continue with next image
    }
  }
  
  return cachedImages
}

// Download and cache UGC videos locally
async function downloadAndCacheVideos(videoUrls) {
  const cachedVideos = []
  const cacheDir = join(process.cwd(), 'public', 'product-videos-cache')
  
  // Create cache directory if it doesn't exist
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true })
  }
  
  // Filter out invalid URLs
  const validUrls = videoUrls
    .filter(url => {
      try {
        const urlObj = new URL(url)
        return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && 
               (url.includes('.mp4') || url.includes('.webm') || url.includes('video'))
      } catch {
        return false
      }
    })
  
  // Remove duplicates
  const uniqueUrls = [...new Set(validUrls)]
  
  for (let i = 0; i < Math.min(uniqueUrls.length, 3); i++) {
    try {
      const videoUrl = uniqueUrls[i]
      const videoId = randomBytes(8).toString('hex')
      const ext = videoUrl.match(/\.(mp4|webm|mov)$/i)?.[1] || 'mp4'
      const filename = `${videoId}.${ext}`
      const filepath = join(cacheDir, filename)
      
      }...`)
      
      const response = await fetch(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': videoUrl.split('/').slice(0, 3).join('/') + '/'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout per video
      })
      
      if (!response.ok) {
        continue
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Validate video size (should be at least 10KB)
      if (buffer.length < 10240) {
        , skipping`)
        continue
      }
      
      await writeFile(filepath, buffer)
      
      // Return the local URL path with type indicator
      cachedVideos.push({
        url: `/product-videos-cache/${filename}`,
        type: 'ugc-video'
      })
      }KB)`)
      
    } catch (error) {
      console.error(`[Video Cache] Error downloading video ${i + 1}:`, error.message)
      // Continue with next video
    }
  }
  
  return cachedVideos
}
