import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { cookies } from 'next/headers'
import { connectToDatabase } from '@/lib/mongodb'

// Get user ID from session
async function getUserIdFromSession(request) {
  try {
    // Check Authorization header first (primary method)
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('Token from header (first 20 chars):', token.substring(0, 20))
      const { db } = await connectToDatabase()
      const session = await db.collection('sessions').findOne({ 
        token,
        expiresAt: { $gt: new Date() }
      })
      console.log('Session found:', session ? 'Yes' : 'No')
      if (session?.userId) {
        console.log('User ID from session:', session.userId)
        return session.userId
      }
    }
    
    // Fallback to cookies
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    console.log('Cookie session_token:', sessionToken ? 'Present' : 'Missing')
    
    if (sessionToken) {
      const { db } = await connectToDatabase()
      const session = await db.collection('sessions').findOne({ 
        token: sessionToken,
        expiresAt: { $gt: new Date() }
      })
      return session?.userId || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are a social media content expert.') {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      const tempDir = path.join(process.cwd(), 'tmp')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFile = path.join(tempDir, `llm-input-${uuidv4()}.json`)
      await fs.writeFile(tempFile, inputData, 'utf-8')
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, '--file', tempFile], {
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', async (code) => {
        try {
          await fs.unlink(tempFile)
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code !== 0) {
          console.error('LLM stderr:', stderr)
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            if (result.success) {
              resolve(result.content)
            } else {
              reject(new Error(result.error || 'LLM call failed'))
            }
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

const PLATFORM_GUIDES = {
  linkedin: {
    name: 'LinkedIn',
    charLimit: 3000,
    style: 'Professional but engaging. Use line breaks after every 1-2 sentences. Short paragraphs. Business-focused value.',
    formatting: 'Single line breaks between sentences, double line breaks between sections. Bullet points for lists.',
    hashtags: '3-5 professional hashtags',
    bestPractices: [
      'First 2 lines must hook (before "see more")',
      'Use whitespace liberally',
      'Personal stories perform well',
      'End with a question or CTA',
      'Avoid external links in post body'
    ]
  },
  twitter: {
    name: 'X (Twitter)',
    charLimit: 280,
    style: 'Punchy, direct, conversational. Every word counts. Hot takes work well.',
    formatting: 'For threads: Number each tweet (1/, 2/, etc). Single post: maximize impact in 280 chars.',
    hashtags: '1-2 relevant hashtags max',
    bestPractices: [
      'First tweet must hook immediately',
      'Use specific numbers',
      'Contrarian takes get engagement',
      'End threads with recap + CTA',
      'Quote tweet worthy content'
    ]
  },
  facebook: {
    name: 'Facebook',
    charLimit: 63206,
    style: 'Conversational, emotional, community-focused. Storytelling works best.',
    formatting: 'Longer paragraphs OK. Use emojis naturally. Questions drive comments.',
    hashtags: '0-3 hashtags (less important on Facebook)',
    bestPractices: [
      'Emotional content gets shared',
      'Ask questions to drive comments',
      'Native video/images boost reach',
      'Engagement in first hour matters most',
      'Personal stories outperform promotional'
    ]
  },
  threads: {
    name: 'Threads',
    charLimit: 500,
    style: 'Casual, conversational, authentic. Like texting a friend. Less polished than LinkedIn.',
    formatting: 'Short and punchy. Casual line breaks. Feels spontaneous.',
    hashtags: '0-2 hashtags',
    bestPractices: [
      'Authentic > polished',
      'Respond to others to grow',
      'Hot takes perform well',
      'Less professional than LinkedIn',
      'Conversational tone wins'
    ]
  },
  reddit: {
    name: 'Reddit',
    charLimit: 40000,
    style: 'Authentic, detailed, value-first. NO self-promotion vibes. Community-focused.',
    formatting: 'Use markdown. Headers for sections. Bullet points for lists. TL;DR at end for long posts.',
    hashtags: 'No hashtags on Reddit',
    bestPractices: [
      'Provide genuine value first',
      'Know the subreddit rules/culture',
      'Self-promotion = downvotes',
      'Detailed answers get upvoted',
      'Engage authentically in comments',
      'Use TL;DR for long posts'
    ]
  },
  quora: {
    name: 'Quora',
    charLimit: 10000,
    style: 'Expert, authoritative, detailed. Answer the question thoroughly with examples.',
    formatting: 'Use headers for sections. Bold key points. Include personal experience.',
    hashtags: 'No hashtags on Quora',
    bestPractices: [
      'Start with a direct answer',
      'Use personal experience/stories',
      'Include specific examples',
      'Cite sources when relevant',
      'Structure with headers for long answers',
      'End with actionable takeaway'
    ]
  },
  instagram: {
    name: 'Instagram',
    charLimit: 2200,
    style: 'Visual-first, emotional, aspirational. Perfect for theme pages. Short punchy lines.',
    formatting: 'Line breaks for readability. Emojis at start of lines. Hashtags at end.',
    hashtags: '20-30 relevant hashtags (mix of popular and niche)',
    bestPractices: [
      'First line is the hook - make it count',
      'Use line breaks liberally',
      'Include a clear CTA',
      'Emojis boost engagement',
      'Ask questions to drive comments',
      'Use relevant hashtags at the end',
      'Create save-worthy content'
    ]
  },
  blog: {
    name: 'Blog Post',
    charLimit: 50000,
    style: 'SEO-optimized, value-packed, scannable. Use headers, bullets, and clear structure.',
    formatting: 'H1 title, H2 sections, H3 subsections. Short paragraphs. Bullet points. Internal/external links.',
    hashtags: 'No hashtags for blogs',
    bestPractices: [
      'Target keyword in title, first paragraph, headers',
      'Use H2 and H3 headers for structure',
      'Include internal and external links',
      'Write compelling meta description',
      'Add alt text suggestions for images',
      'Include FAQ section for featured snippets',
      'Use short paragraphs (2-3 sentences)',
      'Add a clear conclusion with CTA'
    ]
  }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    // Get user ID from session
    const userId = await getUserIdFromSession(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }

    // Check if user has enough credits
    const creditCheck = await checkCredits(userId, 'linkedin-posts')
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }

    // Deduct credits before generation
    const deductResult = await deductCredits(userId, 'linkedin-posts')
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: deductResult.error || 'Failed to process credits'
      }, { status: 402 })
    }
    const transactionId = deductResult.transactionId

    const body = await request.json()
    const {
      platform = 'linkedin',
      topic,
      postFormat,
      hookStyle,
      tone,
      industry,
      targetAudience,
      keyPoints,
      personalStory,
      ctaType,
      includeEmojis,
      includeHashtags,
      postLength,
      specificNumbers,
      subreddit,
      // Instagram fields
      themePageNiche,
      instagramStyle,
      // Blog SEO fields
      targetKeyword,
      secondaryKeywords,
      wordCountTarget,
      writingStyle,
      includeMetaDesc
    } = body

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a topic for your post'
      }, { status: 400 })
    }

    const platformGuide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.linkedin

    // Build context
    let context = `## Platform: ${platformGuide.name}\n`
    context += `## Post Topic:\n${topic}\n\n`
    
    context += `## Selected Format: ${postFormat}\n`
    context += `## Hook Style: ${hookStyle}\n`
    context += `## Tone: ${tone}\n`
    context += `## Post Length: ${postLength}\n`
    
    if (industry) context += `## Industry: ${industry}\n`
    if (targetAudience) context += `## Target Audience: ${targetAudience}\n`
    if (keyPoints) context += `## Key Points to Include:\n${keyPoints}\n`
    if (personalStory) context += `## Personal Story/Experience:\n${personalStory}\n`
    if (specificNumbers) context += `## Specific Numbers/Results: ${specificNumbers}\n`
    if (subreddit && platform === 'reddit') context += `## Target Subreddit: ${subreddit}\n`
    
    // Instagram-specific context
    if (platform === 'instagram') {
      if (themePageNiche) context += `## Theme Page Niche: ${themePageNiche}\n`
      if (instagramStyle) context += `## Content Style: ${instagramStyle}\n`
      context += `## This is for an Instagram THEME PAGE - content should be generic/universal, not personal\n`
    }
    
    // Blog-specific context
    if (platform === 'blog') {
      if (targetKeyword) context += `## Target SEO Keyword: ${targetKeyword}\n`
      if (secondaryKeywords) context += `## Secondary Keywords: ${secondaryKeywords}\n`
      if (wordCountTarget) context += `## Target Word Count: ~${wordCountTarget} words\n`
      if (writingStyle) context += `## Writing Style: ${writingStyle}\n`
      if (includeMetaDesc) context += `## Include: Meta description, title tag, and heading structure\n`
    }
    
    context += `\n## Options:\n`
    context += `- Include Emojis: ${includeEmojis ? 'Yes (use strategically)' : 'No'}\n`
    context += `- Include Hashtags: ${includeHashtags ? `Yes (${platformGuide.hashtags})` : 'No'}\n`
    context += `- CTA Type: ${ctaType}\n`

    const systemPrompt = `You are a viral social media content strategist who has helped creators grow massive followings across all major platforms. You deeply understand each platform's unique algorithm, culture, and what makes content go viral.

**BANNED WORDS - DO NOT USE THESE AI-SOUNDING WORDS:**
NEVER use these overused, cliché words that make content sound AI-generated:
- unlock, unleash, unveil, uncover
- revolutionize, revolutionary
- game-changer, game-changing
- cutting-edge, groundbreaking
- supercharge, turbocharge, skyrocket
- seamless, seamlessly
- harness, leverage (as verbs)
- elevate, empower, transform (overused)
- dive into, dive deep, deep dive, delve
- journey (business context)
- robust, scalable, synergy
- paradigm shift, disrupt, disruptive
- holistic, streamline
- maximize potential
- take it to the next level
- innovative, innovation (overused)
- world-class, state-of-the-art
- next-generation, best-in-class
- foster, facilitate (overused)
- landscape, navigate (metaphorical)
- realm, realm of

Instead, use natural, conversational language. Write like a real person sharing genuine insights.

## PLATFORM-SPECIFIC EXPERTISE FOR ${platformGuide.name.toUpperCase()}:

### Character Limit: ${platformGuide.charLimit}
### Style: ${platformGuide.style}
### Formatting: ${platformGuide.formatting}
### Hashtags: ${platformGuide.hashtags}

### Best Practices for ${platformGuide.name}:
${platformGuide.bestPractices.map(bp => `- ${bp}`).join('\n')}

## VIRAL POST FORMATS YOU KNOW:

### Authority Builder:
BOLD OPENING STATEMENT.

This isn't luck — it's a repeatable system.

[Specific achievement with numbers]

At a high level:
- Point 1
- Point 2
- Point 3

[Why this works]

[CTA]

### Contrarian Take:
Unpopular opinion:

[Bold contrarian statement]

Here's why everyone is wrong:
1. [Reason]
2. [Reason]
3. [Reason]

### Story Hook:
I [dramatic moment] [timeframe] ago.

[Twist/lesson]

Here's what I learned:
[Lessons]

### Listicle:
[Number] things I wish I knew before [X]:

1. [Tip]
2. [Tip]
...

### Hot Take:
[Trend/common belief] is overrated.

Here's what actually works:
[Alternative]

## HOOK FORMULAS:
- Shocking stat: "97% of [people] fail at [thing]."
- Bold statement: "MOST PEOPLE ARE MISSING THIS."
- Question: "Why are you still [outdated behavior]?"
- Story: "I almost quit last month."
- Contrarian: "Unpopular opinion:"
- Command: "STOP doing this immediately."
- Curiosity: "Nobody talks about this..."
- Result first: "$500K in 6 months. Here's how:"

## CTA STRATEGIES:
- Comment: "Comment '[word]' and I'll send you..."
- Question: "What would you add?"
- Share: "♻️ Repost | 💾 Save for later"
- DM: "DM me '[word]' for the full guide"

## OUTPUT FORMAT:
Return a JSON object:
{
  "posts": [
    {
      "content": "Full post with proper formatting and line breaks",
      "hashtags": ["hashtag1", "hashtag2"],
      "analysis": {
        "hookStrength": "Very Strong/Strong/Medium",
        "viralPotential": "Very High/High/Medium",
        "engagementType": "Comments/Saves/Shares"
      }
    }
  ],
  "alternativeHooks": ["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"],
  "tips": ["Platform-specific tip 1", "Tip 2", "Tip 3"]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown blocks
- Use proper line breaks (\\n) for formatting
- Generate 3 post variations
- Make content native to ${platformGuide.name}
- ${platform === 'reddit' ? 'NO self-promotion vibes, pure value' : ''}
- ${platform === 'twitter' ? 'If long format, create a thread with numbered tweets' : ''}
- ${platform === 'quora' ? 'Write as answering a question, start with direct answer' : ''}
- ${platform === 'instagram' ? 'Create THEME PAGE content - universal/generic content, not personal stories. Focus on the niche.' : ''}
- ${platform === 'blog' ? 'Create SEO-optimized content with proper H2/H3 structure, include meta description and title tag' : ''}

${platform === 'instagram' ? `
## INSTAGRAM THEME PAGE FORMATS:

### Motivation Quote Post:
[POWERFUL HOOK LINE IN CAPS]

[2-3 supporting lines]

[Inspirational closing]

🔥 Double tap if you agree
💬 Tag someone who needs this

### Carousel Tips (for caption):
Stop scrolling. This will change your life. 👇

Swipe through to learn:
→ Tip 1
→ Tip 2
→ Tip 3
→ Tip 4
→ Tip 5

Save this for later 💾
Share with someone who needs it ♻️

### Reel Script:
HOOK (0-3 sec): [Attention grabber]
BODY (3-45 sec): [Main content points]
CTA (45-60 sec): [Follow, like, comment prompt]

` : ''}

${platform === 'blog' ? `
## SEO BLOG POST FORMAT:

Return additional fields in posts array:
{
  "content": "Full article with markdown formatting",
  "title": "SEO-optimized title (60 chars max)",
  "metaDescription": "Compelling meta description (155 chars max)",
  "headings": ["H2 heading 1", "H2 heading 2", "H3 subheading"],
  "targetKeyword": "main keyword",
  "keywordDensity": "Include keyword naturally 3-5 times",
  "wordCount": approximate word count,
  "readingTime": "X min read",
  "faqSection": [
    {"question": "FAQ 1", "answer": "Answer 1"},
    {"question": "FAQ 2", "answer": "Answer 2"}
  ]
}

### Structure:
1. Hook intro paragraph (include target keyword)
2. Table of contents (for long posts)
3. H2 sections with valuable content
4. H3 subsections where needed
5. Bullet points and numbered lists
6. FAQ section (for featured snippets)
7. Conclusion with CTA

` : ''}`

    const lengthGuide = {
      short: platform === 'twitter' ? '200-280 characters, single tweet' : platform === 'blog' ? `~${wordCountTarget || 800} words` : '400-600 characters',
      medium: platform === 'twitter' ? '280 characters or 3-5 tweet thread' : platform === 'blog' ? `~${wordCountTarget || 1500} words` : '800-1200 characters',
      long: platform === 'twitter' ? '7-10 tweet thread' : platform === 'blog' ? `~${wordCountTarget || 2500} words` : '1400-2000+ characters'
    }

    const userPrompt = `Create 3 viral ${platformGuide.name} post variations:

${context}

## Requirements:
1. Format perfectly for ${platformGuide.name}
2. Length: ${platform === 'blog' ? `~${wordCountTarget || 1500} words` : lengthGuide[postLength] || lengthGuide.medium}
3. Hook must stop the scroll
4. ${includeEmojis ? 'Use emojis strategically (not excessive)' : 'No emojis'}
5. ${includeHashtags ? `Include ${platformGuide.hashtags}` : 'No hashtags'}
6. Tone: ${tone}
7. Each variation should have unique angle
8. CTA style: ${ctaType}
${platform === 'reddit' ? '9. Sound authentic, NOT promotional. Pure value.' : ''}
${platform === 'quora' ? '9. Answer format - start with direct answer to implied question.' : ''}
${platform === 'twitter' && postLength === 'long' ? '9. Create numbered thread (1/, 2/, etc.)' : ''}
${platform === 'instagram' ? `9. Create THEME PAGE content for ${themePageNiche || 'motivation'} niche. Style: ${instagramStyle || 'motivational'}. Generic/universal content.` : ''}
${platform === 'blog' ? `9. SEO focus on keyword: "${targetKeyword || topic}". Secondary: ${secondaryKeywords || 'related terms'}. Style: ${writingStyle || 'conversational'}. Include meta description, title tag, H2/H3 structure, and FAQ section.` : ''}

Generate 3 posts + 5 alternative hooks + 3 ${platformGuide.name}-specific tips.
Return ONLY JSON - no markdown.`

    const response = await runLLM(userPrompt, systemPrompt)
    
    // Parse the JSON response
    let postsData
    try {
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      postsData = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('Failed to parse posts JSON:', parseError)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        postsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate structured post data')
      }
    }

    // Handle hashtags based on platform and user preference
    if (postsData.posts) {
      postsData.posts = postsData.posts.map(post => ({
        ...post,
        hashtags: (includeHashtags && platform !== 'reddit' && platform !== 'quora' && platform !== 'blog') 
          ? (post.hashtags || []) 
          : []
      }))
    }

    // Complete the credit transaction on success
    if (transactionId) {
      await completeTransaction(transactionId)
    }

    return NextResponse.json({
      success: true,
      data: postsData,
      metadata: {
        platform,
        topic,
        postFormat,
        tone,
        postLength
      },
      creditsUsed: creditCheck.cost,
      remainingCredits: deductResult.newBalance
    })

  } catch (error) {
    console.error('Social media post generation error:', error)
    
    // Refund credits if generation failed
    if (transactionId) {
      await refundCredits(transactionId, error.message || 'Generation failed')
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate posts'
    }, { status: 500 })
  }
}
