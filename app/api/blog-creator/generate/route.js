import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

async function runLLM(prompt, systemPrompt) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      const inputData = JSON.stringify({ prompt, system_prompt: systemPrompt })
      
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--file', tempFile], {
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString() })
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString() })

      pythonProcess.on('close', async (code) => {
        try { await fs.unlink(tempFile) } catch (e) {}
        
        if (code !== 0) {
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            resolve(result.success ? result.content : stdout.trim())
          } catch {
            resolve(stdout.trim())
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      articleType,
      topic,
      targetKeyword,
      secondaryKeywords,
      industry,
      targetAudience,
      writingStyle,
      wordCount,
      tone,
      products,
      affiliateNetwork,
      priceRange,
      includeProsCons,
      includeRatings,
      includePricing,
      includeFAQ,
      includeTOC,
      includeMetaTags,
      internalLinks,
      keyPoints,
      competitorUrls,
      // Humanization settings
      humanizationLevel,
      enabledTechniques
    } = body

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }

    const isAffiliateType = ['affiliate-best', 'product-review', 'comparison', 'buyers-guide'].includes(articleType)

    let context = `## Article Type: ${articleType}\n`
    context += `## Topic: ${topic}\n`
    context += `## Target Keyword: ${targetKeyword || topic}\n`
    if (secondaryKeywords) context += `## Secondary Keywords: ${secondaryKeywords}\n`
    if (industry) context += `## Industry: ${industry}\n`
    if (targetAudience) context += `## Target Audience: ${targetAudience}\n`
    context += `## Writing Style: ${writingStyle}\n`
    context += `## Word Count Target: ~${wordCount} words\n`
    context += `## Tone: ${tone}\n`
    
    // Humanization settings
    if (humanizationLevel && humanizationLevel !== 'none') {
      context += `\n## HUMANIZATION SETTINGS:\n`
      context += `## Level: ${humanizationLevel}\n`
      if (enabledTechniques && enabledTechniques.length > 0) {
        context += `## Techniques: ${enabledTechniques.join(', ')}\n`
      }
    }
    
    if (isAffiliateType) {
      context += `\n## AFFILIATE CONTENT SETTINGS:\n`
      if (products) context += `## Products to Feature:\n${products}\n`
      if (affiliateNetwork) context += `## Affiliate Network: ${affiliateNetwork}\n`
      if (priceRange) context += `## Price Range Focus: ${priceRange}\n`
      context += `## Include Pros/Cons: ${includeProsCons}\n`
      context += `## Include Star Ratings: ${includeRatings}\n`
      context += `## Include Pricing Tables: ${includePricing}\n`
    }
    
    context += `\n## SEO FEATURES:\n`
    context += `## Include FAQ Section: ${includeFAQ}\n`
    context += `## Include Table of Contents: ${includeTOC}\n`
    context += `## Generate Meta Tags: ${includeMetaTags}\n`
    if (internalLinks) context += `## Internal Links to Include:\n${internalLinks}\n`
    if (keyPoints) context += `\n## Key Points to Cover:\n${keyPoints}\n`

    const articleTypeGuides = {
      'seo-article': 'Standard SEO-optimized informational article',
      'affiliate-best': 'Best X for Y format: "Best [products] for [audience/use case]". Include product recommendations with affiliate-friendly descriptions.',
      'product-review': 'In-depth single product review with pros, cons, features, alternatives, and verdict.',
      'comparison': 'X vs Y head-to-head comparison with feature tables, pros/cons for each, and clear winner recommendation.',
      'how-to-guide': 'Step-by-step tutorial with numbered steps, tips, and common mistakes to avoid.',
      'listicle': 'Top X / X Ways / X Tips format with numbered items and brief descriptions.',
      'ultimate-guide': 'Comprehensive pillar content covering all aspects of the topic in depth.',
      'buyers-guide': "What to look for when buying X - criteria, features to consider, price ranges, recommendations."
    }

    const systemPrompt = `You are an expert SEO content writer and affiliate marketing specialist who creates high-ranking, high-converting blog content.

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make writing sound AI-generated:
- unlock, unleash, unveil, uncover
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge, skyrocket
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, deep dive, delve
- journey (customer experience context)
- robust, scalable, synergy
- paradigm shift, disrupt, disruptive
- holistic, streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- world-class, state-of-the-art
- next-generation, best-in-class
- foster, facilitate (overused)
- comprehensive (overused)
- landscape (business context)
- navigate (metaphorical)
- realm, realm of

Use clear, direct, natural language instead. Write like a knowledgeable friend explaining something.

## YOUR EXPERTISE:
- SEO-optimized content that ranks on Google
- Affiliate content that converts (Amazon, ShareASale, CJ, etc.)
- Product reviews that build trust and drive sales
- "Best X for Y" articles that capture high-intent traffic

## ARTICLE TYPE: ${articleTypeGuides[articleType] || 'SEO article'}

## SEO BEST PRACTICES:
1. Include target keyword in: title, first paragraph, H2 headers, conclusion
2. Use H2 for main sections, H3 for subsections
3. Short paragraphs (2-3 sentences max)
4. Bullet points and numbered lists for scanability
5. Internal and external links where natural
6. FAQ section for featured snippet potential
7. Meta title: 50-60 characters with keyword
8. Meta description: 150-155 characters, compelling

${isAffiliateType ? `
## AFFILIATE CONTENT GUIDELINES:
- Be honest and balanced (builds trust = more conversions)
- Include clear pros AND cons for each product
- Use comparison tables when multiple products
- Add "Best for" recommendations (Best for beginners, Best budget option, etc.)
- Natural affiliate disclosure placement
- Price anchoring and value framing
- Urgency without being pushy
- Include alternatives at different price points
` : ''}

## OUTPUT FORMAT:
Return a JSON object:
{
  "title": "SEO-optimized article title (50-60 chars)",
  "metaTitle": "Meta title for SEO (50-60 chars)",
  "metaDescription": "Compelling meta description (150-155 chars)",
  "slug": "url-friendly-slug",
  "content": "Full article content in markdown format with proper H2/H3 headers",
  "wordCount": approximate word count number,
  "readingTime": "X min",
  "outline": [
    {"type": "h2", "text": "Section title"},
    {"type": "h3", "text": "Subsection title"}
  ],
  "tips": [
    "SEO optimization tip 1",
    "Content improvement tip 2",
    "Conversion tip 3"
  ]
}

IMPORTANT:
- Return ONLY valid JSON
- Write the FULL article (~${wordCount} words)
- Use markdown formatting (## for H2, ### for H3, **bold**, *italic*, - bullets)
- Include FAQ section if requested
- For affiliate content, include product recommendations naturally
- Be ${tone} in tone and ${writingStyle} in style`

    const userPrompt = `Write a complete ${articleType} blog post:

${context}

Requirements:
1. Write approximately ${wordCount} words of high-quality content
2. Use proper H2/H3 structure with keyword placement
3. ${includeFAQ ? 'Include a FAQ section with 4-5 questions' : 'No FAQ section needed'}
4. ${includeTOC ? 'Structure content for table of contents' : ''}
5. ${includeMetaTags ? 'Generate SEO meta title and description' : ''}
6. Write in ${writingStyle} style with ${tone} tone
7. Target keyword: "${targetKeyword || topic}"
${isAffiliateType ? '8. Include product recommendations with pros/cons' : ''}

Generate the complete blog post. Return ONLY JSON.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    let blogData
    try {
      // Clean up the response
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      // Try direct parsing first
      blogData = JSON.parse(cleanResponse)
    } catch (parseError) {
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let jsonStr = jsonMatch[0]
          
          // Fix common JSON issues - sanitize control characters
          // Replace problematic characters that break JSON parsing
          jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
            const code = char.charCodeAt(0)
            if (code === 10) return '\\n'  // newline
            if (code === 13) return '\\r'  // carriage return  
            if (code === 9) return '\\t'   // tab
            return ' '  // replace other control chars with space
          })
          
          blogData = JSON.parse(jsonStr)
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (secondError) {
        // Fallback: Create a structured response from raw text
        // Try to extract content from the malformed JSON
        let content = response
        
        // Try to extract just the content field value
        const contentMatch = response.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"wordCount|"\s*,\s*"readingTime|"\s*\})/i)
        if (contentMatch) {
          content = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '  ')
            .replace(/\\"/g, '"')
        } else {
          // Just clean up the raw response
          content = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*\{[\s\S]*?"content"\s*:\s*"/i, '')
            .trim()
        }
        
        blogData = {
          title: topic,
          metaTitle: topic.substring(0, 60),
          metaDescription: `Learn everything about ${topic}. Complete guide with tips and recommendations.`,
          slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
          content: content,
          wordCount: content.split(/\s+/).length,
          readingTime: `${Math.ceil(content.split(/\s+/).length / 200)} min`,
          outline: [],
          tips: ['Review the generated content for accuracy', 'Add internal links to related content']
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: blogData,
      metadata: { articleType, topic, targetKeyword, wordCount }
    })

  } catch (error) {
    console.error('Blog generation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
