import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

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
  }
}

export async function POST(request) {
  try {
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
      subreddit
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
    
    context += `\n## Options:\n`
    context += `- Include Emojis: ${includeEmojis ? 'Yes (use strategically)' : 'No'}\n`
    context += `- Include Hashtags: ${includeHashtags ? `Yes (${platformGuide.hashtags})` : 'No'}\n`
    context += `- CTA Type: ${ctaType}\n`

    const systemPrompt = `You are a viral social media content strategist who has helped creators grow massive followings across all major platforms. You deeply understand each platform's unique algorithm, culture, and what makes content go viral.

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
- ${platform === 'quora' ? 'Write as answering a question, start with direct answer' : ''}`

    const lengthGuide = {
      short: platform === 'twitter' ? '200-280 characters, single tweet' : '400-600 characters',
      medium: platform === 'twitter' ? '280 characters or 3-5 tweet thread' : '800-1200 characters',
      long: platform === 'twitter' ? '7-10 tweet thread' : '1400-2000+ characters'
    }

    const userPrompt = `Create 3 viral ${platformGuide.name} post variations:

${context}

## Requirements:
1. Format perfectly for ${platformGuide.name}
2. Length: ${lengthGuide[postLength] || lengthGuide.medium}
3. Hook must stop the scroll
4. ${includeEmojis ? 'Use emojis strategically (not excessive)' : 'No emojis'}
5. ${includeHashtags ? `Include ${platformGuide.hashtags}` : 'No hashtags'}
6. Tone: ${tone}
7. Each variation should have unique angle
8. CTA style: ${ctaType}
${platform === 'reddit' ? '9. Sound authentic, NOT promotional. Pure value.' : ''}
${platform === 'quora' ? '9. Answer format - start with direct answer to implied question.' : ''}
${platform === 'twitter' && postLength === 'long' ? '9. Create numbered thread (1/, 2/, etc.)' : ''}

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
        hashtags: (includeHashtags && platform !== 'reddit' && platform !== 'quora') 
          ? (post.hashtags || []) 
          : []
      }))
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
      }
    })

  } catch (error) {
    console.error('Social media post generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate posts'
    }, { status: 500 })
  }
}
