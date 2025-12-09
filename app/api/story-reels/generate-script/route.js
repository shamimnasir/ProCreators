import { NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini-text'
import { getNicheBySlug } from '@/config/quick-reels-niches'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { duration, language, niche, customTopic } = await request.json()
    
    console.log('=== SCRIPT GENERATION DEBUG ===')
    console.log('Received niche:', niche)
    console.log('Received language:', language)
    console.log('Received duration:', duration)
    console.log('Received customTopic:', customTopic)

    if (!duration || duration < 10 || duration > 60) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 10 and 60 seconds' },
        { status: 400 }
      )
    }

    const languageText = language === 'bn' ? 'in Bengali language' : 'in English language'
    const languageName = language === 'bn' ? 'Bengali' : 'English'

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
          console.log('✅ Using CUSTOM admin prompt for niche:', niche)
          console.log('Prompt template length:', nichePrompt.length)
        } else {
          // Fall back to default prompt from config
          const nicheConfig = getNicheBySlug(niche)
          console.log('Niche config found:', nicheConfig ? 'YES' : 'NO')
          if (nicheConfig) {
            console.log('Using DEFAULT prompt template for niche:', nicheConfig.name)
            nichePrompt = nicheConfig.promptTemplate
            console.log('Prompt template length:', nichePrompt.length)
          } else {
            console.log('⚠️ WARNING: No niche config found for slug:', niche)
          }
        }
      } catch (dbError) {
        console.log('Could not check custom prompts, using default:', dbError.message)
        // Fall back to default prompt from config
        const nicheConfig = getNicheBySlug(niche)
        if (nicheConfig) {
          nichePrompt = nicheConfig.promptTemplate
        }
      }
    } else {
      console.log('Using default Story Reels prompt (niche:', niche, ')')
    }

    // Default system message for original story-reels (backward compatibility)
    const defaultSystemMessage = `You are a professional viral story writer for TikTok, Instagram Reels, and YouTube Shorts.

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

    // Use niche-specific prompt or default
    let finalSystemMessage = nichePrompt || defaultSystemMessage
    
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
6. Output ONLY the story narration - no meta-text, no instructions, no labels
7. The output will be read aloud as-is, so include ONLY speakable story content`
      : `\n\n## CRITICAL REQUIREMENTS ##
1. Write the entire script in English only
2. DO NOT include any timing references like "seconds" or duration information
3. Output ONLY the story narration - no meta-text, no instructions, no labels
4. The output will be read aloud as-is, so include ONLY speakable story content`
    
    finalSystemMessage = finalSystemMessage + languageEnforcement
    
    console.log('=== FINAL PROMPT BEING USED ===')
    console.log('System message (first 200 chars):', finalSystemMessage.substring(0, 200))
    console.log('Using niche prompt:', nichePrompt ? 'YES' : 'NO (using default)')

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
    
    // Approximate word count based on duration (no mention of seconds in output)
    const wordCount = Math.floor(duration * 2.5)
    
    // Check if user provided a topic/context (from script box or custom topic input)
    const hasUserTopic = customTopic && customTopic.trim().length > 0
    
    console.log('Has user topic:', hasUserTopic, '| Topic:', customTopic?.substring(0, 50))
    
    if (hasUserTopic) {
      // User provided a topic - use it as the basis for generation
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
    } else {
      // No user topic - generate freely based on niche
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

    const result = await generateText(userPrompt, finalSystemMessage)

    if (result.success) {
      // Clean up the script - remove any timing references that might have slipped through
      let cleanedScript = result.content
      
      // Remove common timing patterns in both English and Bengali
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
        // Clean up any double spaces or newlines left behind
        .replace(/\n{3,}/g, '\n\n')
        .replace(/  +/g, ' ')
        .trim()
      
      return NextResponse.json({
        success: true,
        script: cleanedScript,
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
