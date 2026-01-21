import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// Helper to run LLM using Python script
async function runLLM(prompt, systemPrompt = 'You are a LinkedIn content expert.') {
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

export async function POST(request) {
  try {
    const body = await request.json()
    const {
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
      specificNumbers
    } = body

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a topic for your post'
      }, { status: 400 })
    }

    // Build context
    let context = `## Post Topic:\n${topic}\n\n`
    
    context += `## Selected Format: ${postFormat}\n`
    context += `## Hook Style: ${hookStyle}\n`
    context += `## Tone: ${tone}\n`
    context += `## Post Length: ${postLength}\n`
    
    if (industry) context += `## Industry: ${industry}\n`
    if (targetAudience) context += `## Target Audience: ${targetAudience}\n`
    if (keyPoints) context += `## Key Points to Include:\n${keyPoints}\n`
    if (personalStory) context += `## Personal Story/Experience:\n${personalStory}\n`
    if (specificNumbers) context += `## Specific Numbers/Results: ${specificNumbers}\n`
    
    context += `\n## Options:\n`
    context += `- Include Emojis: ${includeEmojis ? 'Yes' : 'No'}\n`
    context += `- Include Hashtags: ${includeHashtags ? 'Yes' : 'No'}\n`
    context += `- CTA Type: ${ctaType}\n`

    const systemPrompt = `You are a viral LinkedIn content strategist who has helped creators grow from 0 to 500K+ followers. You understand the LinkedIn algorithm deeply and know exactly what makes posts go viral.

## YOUR EXPERTISE:
- Deep knowledge of LinkedIn's algorithm and engagement patterns
- Mastery of viral post formats that consistently perform
- Understanding of what stops the scroll in a professional context
- Expertise in crafting hooks that demand attention

## VIRAL LINKEDIN POST FORMATS YOU KNOW:

### 1. Authority Builder Format:
MOST PEOPLE ARE MISSING THIS.

This isn't luck — it's a repeatable system.

We built [specific achievement with numbers].

At a high level, here's what's happening:
- Point 1
- Point 2
- Point 3

[More context with specifics]

No [common approach].
No [another approach].
No [third approach].

[Why this works section with bullets]

[Call to action]

### 2. Contrarian Take Format:
Unpopular opinion:

[Bold contrarian statement]

Here's why everyone is wrong:

1. [First reason]
2. [Second reason]
3. [Third reason]

[Deeper explanation]

The truth is:
[Insight]

[CTA]

### 3. Story Hook Format:
I got [negative event] [timeframe] ago.

Best thing that ever happened to me.

Here's what I learned:

[Story with lessons]

### 4. Listicle Format:
[Number] things I wish I knew before [X]:

1. [Tip with brief explanation]
2. [Tip with brief explanation]
...

[Closing thought]

### 5. Before/After Format:
[Year]: [Negative state]
[Year]: [Positive state with metrics]

Here's what changed:

[Explanation]

### 6. Pattern Interrupt Format:
[ALL CAPS COMMAND/SHOCK]

[Explanation of why]

[Supporting points]

### 7. Hot Take Format:
[Industry trend/common practice] is overrated.

Here's what actually works:

[Alternative approach]

## FORMATTING RULES FOR LINKEDIN:
- Short sentences (max 10 words ideal)
- Line breaks after every 1-2 sentences
- Use whitespace liberally
- Bullet points for scanability
- No walls of text
- First line MUST be a scroll-stopper
- Use "See more" strategically (hook must be in first 3 lines)

## HOOK FORMULAS THAT WORK:
- Shocking statistic: "97% of [people] fail at [thing]."
- Bold statement: "MOST PEOPLE ARE MISSING THIS."
- Question: "Why are you still [outdated behavior]?"
- Story opener: "I almost quit last month."
- Contrarian: "Unpopular opinion:"
- Command: "STOP doing this immediately."
- Curiosity gap: "Nobody talks about this..."
- Result first: "$500K in 6 months. Here's how:"

## CTA STRATEGIES:
- Comment trigger: "Comment '[word]' and I'll send you..."
- Question: "What would you add to this list?"
- Save/Share: "♻️ Repost to help others | 💾 Save for later"
- DM trigger: "DM me '[word]' for the full guide"

## OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "posts": [
    {
      "content": "Full post content with proper formatting and line breaks",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
      "analysis": {
        "hookStrength": "Very Strong/Strong/Medium",
        "viralPotential": "Very High/High/Medium",
        "engagementType": "Comments/Saves/Shares"
      }
    },
    {
      "content": "Second variation...",
      "hashtags": [...],
      "analysis": {...}
    },
    {
      "content": "Third variation...",
      "hashtags": [...],
      "analysis": {...}
    }
  ],
  "alternativeHooks": [
    "Alternative hook 1",
    "Alternative hook 2",
    "Alternative hook 3",
    "Alternative hook 4",
    "Alternative hook 5"
  ],
  "tips": [
    "Tip for maximizing this post's reach",
    "Another optimization tip",
    "Posting strategy tip"
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- Each post should use proper LinkedIn formatting with line breaks (\n)
- Generate 3 different variations of the post
- Make hooks scroll-stopping and attention-grabbing
- If emojis are requested, use them strategically (not every line)
- Hashtags should be relevant and mix popular + niche tags
- Each variation should have a different angle or hook style`

    const lengthGuide = {
      short: '400-600 characters, punchy and direct',
      medium: '800-1200 characters, balanced detail',
      long: '1400-1800 characters, comprehensive with multiple sections'
    }

    const formatGuides = {
      'authority-builder': 'Use the Authority Builder format: Start with bold statement, share system/results with specific numbers, list key points with bullets, explain what you DON\'T do, end with CTA',
      'contrarian-take': 'Use Contrarian Take format: Start with "Unpopular opinion:" followed by a bold contrarian statement, then explain why conventional wisdom is wrong',
      'story-hook': 'Use Story Hook format: Start with a dramatic personal moment, then reveal the lesson learned',
      'listicle': 'Use Listicle format: Number-based tips, each with brief explanation, easy to scan',
      'before-after': 'Use Before/After format: Show transformation with specific dates/metrics',
      'pattern-interrupt': 'Use Pattern Interrupt format: Start with ALL CAPS command that stops scroll',
      'how-to-guide': 'Use How-To format: Step-by-step guide with clear instructions',
      'hot-take': 'Use Hot Take format: Challenge something popular/trendy with specific reasoning',
      'myth-buster': 'Use Myth Buster format: List common myths and debunk each with truth',
      'engagement-bait': 'Use Engagement Driver format: Pose a controversial question that demands answers'
    }

    const hookGuides = {
      'shocking-stat': 'Start with a surprising statistic',
      'bold-statement': 'Start with ALL CAPS bold statement',
      'question': 'Start with a provocative question',
      'story-opener': 'Start with a dramatic story moment',
      'contrarian': 'Start with "Unpopular opinion:"',
      'command': 'Start with an urgent command (STOP, DELETE, etc.)',
      'curiosity-gap': 'Start with something mysterious that creates curiosity',
      'result-first': 'Start with impressive result/number'
    }

    const ctaGuides = {
      'comment': 'End with: Comment "[relevant word]" and I\'ll send you [value]',
      'question': 'End with an engaging question that invites discussion',
      'save-share': 'End with: ♻️ Repost to help your network | 💾 Save for later',
      'follow': 'End with: Follow [me/for more] for more [topic] insights',
      'dm': 'End with: DM me "[word]" and I\'ll send you [specific value]',
      'none': 'End naturally without explicit CTA'
    }

    const userPrompt = `Create 3 viral LinkedIn post variations based on this:

${context}

## Specific Instructions:
1. Format: ${formatGuides[postFormat] || 'Create an engaging post'}
2. Hook Style: ${hookGuides[hookStyle] || 'Use an attention-grabbing hook'}
3. Length: ${lengthGuide[postLength] || lengthGuide.medium}
4. CTA: ${ctaGuides[ctaType] || 'End with engaging call-to-action'}
5. Emojis: ${includeEmojis ? 'Use emojis strategically (not every line, max 5-8 total)' : 'Do not use emojis'}
6. Hashtags: ${includeHashtags ? 'Include 5 relevant hashtags (mix of popular and niche)' : 'Do not include hashtags'}

## Quality Requirements:
- Hook MUST stop the scroll in the first line
- Use proper LinkedIn formatting with line breaks
- Each variation should have a unique angle
- Include specific numbers/metrics when possible
- Write in ${tone} tone
- Target audience: ${targetAudience || 'professionals'}

Generate 3 post variations + 5 alternative hooks + 3 optimization tips.
Return ONLY the JSON object - no markdown formatting.`

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
      console.error('Failed to parse LinkedIn posts JSON:', parseError)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        postsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to generate structured post data')
      }
    }

    // Ensure hashtags array exists for each post
    if (postsData.posts) {
      postsData.posts = postsData.posts.map(post => ({
        ...post,
        hashtags: includeHashtags ? (post.hashtags || []) : []
      }))
    }

    return NextResponse.json({
      success: true,
      data: postsData,
      metadata: {
        topic,
        postFormat,
        tone,
        postLength
      }
    })

  } catch (error) {
    console.error('LinkedIn post generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate LinkedIn posts'
    }, { status: 500 })
  }
}
