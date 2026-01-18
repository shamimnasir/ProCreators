import { NextResponse } from 'next/server'

// Fetch metadata from URL
export async function POST(request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error('Failed to fetch URL')
    }

    const html = await response.text()
    
    // Extract metadata
    const metadata = {}
    let suggestedType = 'website'

    // Title
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    metadata.title = ogTitle?.[1] || titleTag?.[1] || ''
    metadata.title = metadata.title.trim().replace(/\s*[-|].*$/, '') // Clean up title

    // Site name
    const ogSite = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"/i)
    metadata.siteName = ogSite?.[1] || new URL(url).hostname.replace('www.', '')

    // Author(s)
    const authorMeta = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/i)
    const byline = html.match(/class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]+)</i)
    const articleAuthor = html.match(/<meta[^>]*property="article:author"[^>]*content="([^"]*)"/i)
    metadata.authors = authorMeta?.[1] || articleAuthor?.[1] || byline?.[1] || ''

    // Date
    const pubDate = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"/i)
    const datePublished = html.match(/"datePublished"\s*:\s*"([^"]*)"/i)
    const timeTag = html.match(/<time[^>]*datetime="([^"]*)"/i)
    let dateStr = pubDate?.[1] || datePublished?.[1] || timeTag?.[1] || ''
    if (dateStr) {
      try {
        const date = new Date(dateStr)
        metadata.publishDate = date.toISOString().split('T')[0]
      } catch (e) {
        metadata.publishDate = dateStr.split('T')[0]
      }
    }

    // URL
    metadata.url = url

    // Access date
    metadata.accessDate = new Date().toISOString().split('T')[0]

    // Determine source type based on URL patterns
    const urlLower = url.toLowerCase()
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('vimeo.com')) {
      suggestedType = 'video'
      metadata.platform = urlLower.includes('youtube') ? 'YouTube' : urlLower.includes('vimeo') ? 'Vimeo' : 'Video Platform'
      
      // Try to get video duration
      const duration = html.match(/"duration"\s*:\s*"PT(\d+)M(\d+)S"/i)
      if (duration) {
        metadata.duration = `${duration[1]}:${duration[2].padStart(2, '0')}`
      }
    } else if (urlLower.includes('podcast') || urlLower.includes('spotify.com/episode') || urlLower.includes('podcasts.apple.com')) {
      suggestedType = 'podcast'
      metadata.podcastName = metadata.siteName
      metadata.episodeTitle = metadata.title
    } else if (
      urlLower.includes('nytimes.com') || 
      urlLower.includes('washingtonpost.com') || 
      urlLower.includes('theguardian.com') ||
      urlLower.includes('bbc.com/news') ||
      urlLower.includes('cnn.com') ||
      urlLower.includes('reuters.com') ||
      html.includes('"@type":"NewsArticle"')
    ) {
      suggestedType = 'newspaper'
      metadata.newspaper = metadata.siteName
    } else if (
      urlLower.includes('doi.org') ||
      urlLower.includes('jstor.org') ||
      urlLower.includes('sciencedirect.com') ||
      urlLower.includes('springer.com') ||
      urlLower.includes('wiley.com') ||
      urlLower.includes('nature.com') ||
      urlLower.includes('pubmed') ||
      html.includes('"@type":"ScholarlyArticle"')
    ) {
      suggestedType = 'journal'
      
      // Try to extract DOI
      const doiMeta = html.match(/<meta[^>]*name="citation_doi"[^>]*content="([^"]*)"/i)
      const doiLink = html.match(/doi\.org\/([^"<\s]+)/i)
      metadata.doi = doiMeta?.[1] || doiLink?.[1] || ''
      
      // Journal name
      const journalMeta = html.match(/<meta[^>]*name="citation_journal_title"[^>]*content="([^"]*)"/i)
      metadata.journal = journalMeta?.[1] || ''
      
      // Volume/Issue
      const volumeMeta = html.match(/<meta[^>]*name="citation_volume"[^>]*content="([^"]*)"/i)
      const issueMeta = html.match(/<meta[^>]*name="citation_issue"[^>]*content="([^"]*)"/i)
      metadata.volume = volumeMeta?.[1] || ''
      metadata.issue = issueMeta?.[1] || ''
      
      // Pages
      const firstPage = html.match(/<meta[^>]*name="citation_firstpage"[^>]*content="([^"]*)"/i)
      const lastPage = html.match(/<meta[^>]*name="citation_lastpage"[^>]*content="([^"]*)"/i)
      if (firstPage?.[1] && lastPage?.[1]) {
        metadata.pages = `${firstPage[1]}-${lastPage[1]}`
      }
      
      // Year from citation
      const yearMeta = html.match(/<meta[^>]*name="citation_publication_date"[^>]*content="([^"]*)"/i)
      if (yearMeta?.[1]) {
        metadata.year = yearMeta[1].split(/[-/]/)[0]
      }
    }

    // Clean up empty values
    Object.keys(metadata).forEach(key => {
      if (!metadata[key]) delete metadata[key]
    })

    return NextResponse.json({
      success: true,
      metadata,
      suggestedType
    })

  } catch (error) {
    console.error('URL fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
