import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { getNicheBySlug } from '@/config/quick-reels-niches'
import { connectToDatabase } from '@/lib/mongodb'
import { enforceRateLimit } from '@/lib/rate-limiter'

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { duration, language, niche, customTopic, scriptFormat, videoSource } = await request.json()
    
    // Support both short-form (10-60s) and long-form (up to 10 min / 600s) videos
    if (!duration || duration < 10 || duration > 600) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 10 and 600 seconds (10 minutes)' },
        { status: 400 }
      )
    }

    const languageText = language === 'bn' ? 'in Bengali language' : 'in English language'
    const languageName = language === 'bn' ? 'Bengali' : 'English'
    
    // Determine script format based on video source and duration
    // AI video: Use 'ai-visual' format (optimized for visual generation, no screenplay elements)
    // Stock video: Use 'narration' for short, 'cinematic' for long
    const isAIVideo = videoSource && videoSource.startsWith('ai-')
    let format = scriptFormat
    if (!format) {
      if (isAIVideo) {
        format = 'ai-visual' // New format optimized for AI video generation
      } else if (duration > 60) {
        format = 'cinematic'
      } else {
        format = 'narration'
      }
    }

    // Get niche-specific prompt template or use default
    let nichePrompt = ''
    if (niche && niche !== 'story-reels') {
      // First, check for custom admin-defined prompt
      try {
        const { db } = await connectToDatabase()
        const promptsCollection = db.collection('custom_prompts')
        const customPrompt = await promptsCollection.findOne({ nicheSlug: niche })
        
        if (customPrompt && customPrompt.prompt) {
          nichePrompt = customPrompt.prompt
          } else {
          // Fall back to default prompt from config
          const nicheConfig = getNicheBySlug(niche)
          if (nicheConfig) {
            nichePrompt = nicheConfig.promptTemplate
            } else {
            }
        }
      } catch (dbError) {
        // Fall back to default prompt from config
        const nicheConfig = getNicheBySlug(niche)
        if (nicheConfig) {
          nichePrompt = nicheConfig.promptTemplate
        }
      }
    }

    // CINEMATIC SCREENPLAY FORMAT - Professional video production format
    const cinematicSystemMessage = `You are an expert CINEMATIC SCREENWRITER and VIDEO DIRECTOR for viral video content.

YOUR TASK: Write a professional SCREENPLAY FORMAT script that is PRODUCTION-READY for video creation.

## MANDATORY SCREENPLAY FORMAT ##

Your script MUST include these elements in proper screenplay format:

1. **SCENE HEADINGS** (Sluglines):
   - Format: INT./EXT. LOCATION – TIME OF DAY
   - Example: INT. SMALL APARTMENT – NIGHT
   - Example: EXT. CITY PARK – MORNING

2. **VISUAL DESCRIPTIONS** (Action lines):
   - Describe what we SEE on screen
   - Include character actions, emotions, setting details
   - Write in present tense, third person
   - Be specific and visual

3. **CAMERA/EDIT DIRECTIONS**:
   - Use: FADE IN, FADE OUT, CUT TO:, DISSOLVE TO:
   - Use: MONTAGE for sequence of quick shots
   - Use: CLOSE UP, WIDE SHOT, TRACKING SHOT when needed

4. **CHARACTER DIALOGUE**:
   - Character name in CAPS, centered
   - Dialogue below, indented
   - Parentheticals for tone: (softly), (angry), (V.O.) for voiceover
   
   Example:
   JACK
   (warmly)
   I've been where you are, young man.

5. **NARRATOR VOICEOVER**:
   - Use: NARRATOR (V.O.)
   - For storytelling moments between scenes

6. **TEXT ON SCREEN**:
   - For any title cards, quotes, or end messages
   - Format: TEXT ON SCREEN: "Your message here"

## STRUCTURE FOR ${Math.ceil(duration / 60)} MINUTE VIDEO ##

- Opening Hook (first 10-15 seconds): Grab attention immediately
- Setup: Establish characters, setting, conflict
- Rising Action: Build tension, show struggle
- Climax: The turning point or revelation
- Resolution: Satisfying conclusion with emotional payoff
- Call-to-Action/Logo: Brand moment at the end

## DIALOGUE GUIDELINES ##

- Include meaningful dialogue between characters (not just narration)
- Make dialogue feel natural and conversational
- Use dialogue to reveal character and advance plot
- Balance dialogue with visual storytelling
- Include emotional beats and pauses

Write ${languageText}. Create approximately ${Math.ceil(duration / 60) * 150}-${Math.ceil(duration / 60) * 200} words of screenplay content.`

    // NARRATION FORMAT - For voiceover-based short videos (TikTok, Reels, Shorts)
    const narrationSystemMessage = `You are a professional viral story writer for TikTok, Instagram Reels, and YouTube Shorts.

CRITICAL INSTRUCTIONS:
1. Write ${languageText}
2. Create a compelling short story
3. Story types: moral stories, twist endings, emotional moments, life lessons, folklore
4. Structure: Strong opening hook → Main story conflict → Satisfying twist/ending
5. Use simple, conversational language perfect for narration
6. Make it emotionally engaging and shareable

OUTPUT RULES (VERY IMPORTANT):
- Return ONLY the story narration text
- NO titles, NO labels, NO headers
- NO timing information (do NOT mention "seconds", "সেকেন্ড", duration, or time)
- NO meta-commentary about the script
- NO instructions or notes
- ONLY pure story text that will be spoken aloud

The story should be approximately ${Math.floor(duration * 2.5)} words.`

    // Select system message based on format
    let finalSystemMessage
    if (nichePrompt) {
      // Use niche-specific prompt if available
      finalSystemMessage = nichePrompt
    } else if (format === 'cinematic') {
      finalSystemMessage = cinematicSystemMessage
    } else {
      finalSystemMessage = narrationSystemMessage
    }
    
    // Replace placeholders in the prompt template
    finalSystemMessage = finalSystemMessage
      .replace(/{duration}/g, duration.toString())
      .replace(/{language}/g, languageName)
      .replace(/{customTopic}/g, customTopic || '')
    
    // Add STRICT language enforcement and output rules to the prompt
    const languageEnforcement = language === 'bn' 
      ? `\n\n## CRITICAL REQUIREMENTS ##
1. Write the ENTIRE script in Bengali (বাংলা) language ONLY
2. DO NOT use ANY English words, phrases, or sentences
3. DO NOT mix English and Bengali
4. Every single word must be in Bengali script (বাংলা অক্ষর)
5. DO NOT include any timing references like "সেকেন্ড" (seconds) or duration information
6. Scene headings (INT./EXT.) can remain in English for production clarity`
      : `\n\n## CRITICAL REQUIREMENTS ##
1. Write the entire script in English only
2. DO NOT include any timing references like "seconds" or duration information
3. Make it emotionally engaging and production-ready`
    
    finalSystemMessage = finalSystemMessage + languageEnforcement

    let userPrompt = ''
    
    // Build niche-specific user prompt
    const nicheInstructions = {
      'mini-stories': 'a compelling story with moral, emotional twist, or folklore element',
      'motivational': 'motivational content focused on discipline, growth, success, or resilience',
      'facts-explainer': 'educational facts or science explainer content',
      'comedy': 'comedy or relatable humor content',
      'kids-stories': 'a playful moral story for children',
      'kids-learning': 'educational learning content (ABC, 123, colors, shapes)',
      'business-promo': 'a promotional script',
      'horror': 'an atmospheric horror micro-story',
      'relationship': 'relationship advice or emotional guidance',
      'documentary': 'a historical or factual documentary-style script',
      'festival': 'festive celebration content',
      'generic': 'a compelling script'
    }
    
    const nicheInstruction = nicheInstructions[niche] || 'a compelling script'
    
    // Approximate word count based on duration and format
    const wordCount = format === 'cinematic' 
      ? Math.ceil(duration / 60) * 175 // Screenplay format has more structure
      : Math.floor(duration * 2.5)      // Narration is spoken at ~2.5 words/sec
    
    // Check if user provided a topic/context (from script box or custom topic input)
    const hasUserTopic = customTopic && customTopic.trim().length > 0
    
    if (hasUserTopic) {
      // User provided a topic - use it as the basis for generation
      if (format === 'cinematic') {
        userPrompt = `Create a CINEMATIC SCREENPLAY for a ${Math.ceil(duration / 60)}-minute video based on this story:

STORY/TOPIC: "${customTopic}"

Requirements:
- Language: ${languageName} (scene headings can be in English)
- Format: Professional screenplay with scene headings, dialogue, camera directions
- Include: INT./EXT. sluglines, character dialogue with names, NARRATOR (V.O.), visual descriptions
- Include: MONTAGE sequences, CUT TO:, FADE IN/OUT where appropriate
- Include: Meaningful character dialogue (not just narration)
- Structure: Hook → Setup → Conflict → Climax → Resolution
- End with: TEXT ON SCREEN for brand/message and LOGO placement

CRITICAL: Follow the user's story EXACTLY. Include all characters, plot points, and emotional beats they described.
Write in proper SCREENPLAY FORMAT that a video production team can use directly.`
      } else {
        userPrompt = `Create ${nicheInstruction} for a short video based on this topic/idea:

USER'S TOPIC: "${customTopic}"

Requirements:
- Language: ${languageName} ONLY (DO NOT mix languages)
- Approximately ${wordCount} words
- MUST be related to the user's topic above
- Content Type: ${nicheInstruction}
- Strong opening hook
- Clear and focused messaging
- Suitable for voiceover narration

CRITICAL: Your content MUST be based on the user's topic above. Do not ignore it.
Output ONLY the narration text. No meta-information, no timing references, no labels.
Write ONLY ${language === 'bn' ? 'in Bengali (বাংলা)' : 'in English'}.`
      }
    } else {
      // No user topic - generate freely based on niche
      if (format === 'cinematic') {
        userPrompt = `Create a CINEMATIC SCREENPLAY for a ${Math.ceil(duration / 60)}-minute ${nicheInstruction} video.

Requirements:
- Language: ${languageName} (scene headings can be in English)
- Format: Professional screenplay with scene headings, dialogue, camera directions
- Include: INT./EXT. sluglines, character dialogue with names, NARRATOR (V.O.), visual descriptions
- Include: MONTAGE sequences, CUT TO:, FADE IN/OUT where appropriate
- Include: Meaningful character dialogue (not just narration)
- Structure: Hook → Setup → Conflict → Climax → Resolution
- End with: TEXT ON SCREEN for brand/message

Write in proper SCREENPLAY FORMAT that a video production team can use directly.`
      } else {
        userPrompt = `Create ${nicheInstruction} for a short video.

Requirements:
- Language: ${languageName} ONLY (DO NOT mix languages)
- Approximately ${wordCount} words
- Content Type: ${nicheInstruction}
- Strong opening hook
- Clear and focused messaging
- Suitable for voiceover narration

IMPORTANT: Output ONLY the narration text. No meta-information, no timing references, no labels.
Write ONLY ${language === 'bn' ? 'in Bengali (বাংলা)' : 'in English'}.`
      }
    }

    const result = await generateText(userPrompt, finalSystemMessage)

    if (result.success) {
      // Clean up the script - remove any timing references that might have slipped through
      let cleanedScript = result.content
      
      // Only apply aggressive cleaning for narration format
      // For cinematic format, preserve the screenplay structure
      if (format !== 'cinematic') {
        cleanedScript = cleanedScript
          // Remove patterns like "(30 seconds)", "[30 seconds]", "30 seconds:", etc.
          .replace(/\[?\(?\d+\s*(seconds?|সেকেন্ড|সে\.)\)?\.?\]?:?\s*/gi, '')
          // Remove patterns like "Hook (first 3 seconds):" or "Introduction (10 seconds)"
          .replace(/\([^)]*\d+\s*(seconds?|সেকেন্ড)[^)]*\)\s*:?\s*/gi, '')
          // Remove standalone time markers
          .replace(/^\s*\d+\s*(seconds?|সেকেন্ড)\s*[:—-]?\s*/gim, '')
          // Remove "Duration:" or "সময়:" lines
          .replace(/^(duration|সময়|time|টাইম)\s*[:：]\s*\d+.*$/gim, '')
          // Remove section headers with timing
          .replace(/^(hook|intro|opening|শুরু)\s*\(\s*\d+.*?\)\s*:?\s*/gim, '')
      }
      
      // Clean up any double spaces or newlines left behind
      cleanedScript = cleanedScript
        .replace(/\n{3,}/g, '\n\n')
        .replace(/  +/g, ' ')
        .trim()
      
      return NextResponse.json({
        success: true,
        script: cleanedScript,
        scriptFormat: format, // Return the format used
        language,
        duration,
        niche: niche || 'story-reels'
      })
    } else {
      throw new Error(result.error || 'Failed to generate script')
    }

  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}
