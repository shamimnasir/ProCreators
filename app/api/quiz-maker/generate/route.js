import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

// Check if text contains non-ASCII characters (Bengali, Hindi, Arabic, Chinese, etc.)
function hasNonAscii(text) {
  if (!text) return false
  return /[^\x00-\x7F]/.test(text)
}

// Helper function to call LLM via Python script
async function runLLM(prompt, systemPrompt = "You are a quiz and test creator. Generate engaging, educational content.") {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
      
      const inputData = JSON.stringify({
        prompt,
        system_prompt: systemPrompt
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
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
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('LLM script error:', stderr)
          resolve({ success: false, content: null, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, content: null, error: 'Failed to parse LLM response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, content: null, error: error.message })
      })
      
      // Timeout after 60 seconds
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, content: null, error: 'LLM request timed out' })
      }, 60000)
      
    } catch (error) {
      resolve({ success: false, content: null, error: error.message })
    }
  })
}

// Quiz Types
const QUIZ_TYPES = {
  'academic': { name: 'Academic Test', description: 'Educational assessments' },
  'trivia': { name: 'Trivia Quiz', description: 'Fun knowledge quizzes' },
  'personality': { name: 'Personality Quiz', description: 'Self-discovery quizzes' },
  'assessment': { name: 'Knowledge Assessment', description: 'Skill evaluation' },
  'practice': { name: 'Practice Exam', description: 'Exam preparation' },
  'custom': { name: 'Custom Quiz', description: 'Create from your own prompt' }
}

// Topics from the image
const QUIZ_TOPICS = {
  // Academic Topics
  'math': { name: 'Math', icon: '🔢', category: 'academic' },
  'science': { name: 'Science', icon: '🔬', category: 'academic' },
  'history': { name: 'History', icon: '📜', category: 'academic' },
  'geography': { name: 'Geography', icon: '🌍', category: 'academic' },
  'english': { name: 'English', icon: '📖', category: 'academic' },
  'biology': { name: 'Biology', icon: '🧬', category: 'academic' },
  'chemistry': { name: 'Chemistry', icon: '⚗️', category: 'academic' },
  'computer-science': { name: 'Computer Science', icon: '💻', category: 'academic' },
  
  // Entertainment Topics
  'sports': { name: 'Sports', icon: '⚽', category: 'trivia' },
  'movie': { name: 'Movie', icon: '🎬', category: 'trivia' },
  'entertainment': { name: 'Entertainment', icon: '🎭', category: 'trivia' },
  'technology': { name: 'Technology', icon: '📱', category: 'trivia' },
  'celebrity': { name: 'Celebrity', icon: '⭐', category: 'trivia' },
  'music': { name: 'Music', icon: '🎵', category: 'trivia' },
  'game': { name: 'Video Games', icon: '🎮', category: 'trivia' },
  'book': { name: 'Books & Literature', icon: '📚', category: 'trivia' },
  
  // General Knowledge Topics
  'animal': { name: 'Animals', icon: '🦁', category: 'trivia' },
  'food': { name: 'Food & Cooking', icon: '🍕', category: 'trivia' },
  'country': { name: 'Countries & Flags', icon: '🏳️', category: 'trivia' },
  'art': { name: 'Art & Culture', icon: '🎨', category: 'trivia' },
  
  // Special Topics
  'relationship': { name: 'Relationship', icon: '❤️', category: 'personality' },
  'personality': { name: 'Personality', icon: '🧠', category: 'personality' },
  
  // Custom
  'custom': { name: 'Custom Topic', icon: '✨', category: 'custom' }
}

// Question Types
const QUESTION_TYPES = [
  'multiple-choice',
  'true-false',
  'fill-blank',
  'short-answer',
  'matching'
]

// Generate cover image using Nano Banana
async function generateCoverImage(topic, quizType, customPrompt) {
  return new Promise((resolve) => {
    try {
      const topicInfo = QUIZ_TOPICS[topic] || { name: topic }
      
      const fullPrompt = customPrompt 
        ? `${customPrompt}. Professional quiz book cover, clean modern design, educational and engaging.`
        : `Professional quiz and test book cover about "${topicInfo.name}". Modern, clean design with subtle ${topicInfo.name.toLowerCase()} themed elements. Educational, engaging, high quality cover art, no text on the image.`
      
      console.log(`Generating quiz cover: ${fullPrompt.substring(0, 80)}...`)
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_image_nano_banana.py')
      
      const inputData = JSON.stringify({
        prompt: fullPrompt,
        model: 'models/nano-banana-pro-preview'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
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
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Cover generation error:', stderr)
          resolve({ success: false, imageUrl: null, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, imageUrl: null, error: 'Failed to parse response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, imageUrl: null, error: error.message })
      })
      
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, imageUrl: null, error: 'Cover generation timed out' })
      }, 45000)
      
    } catch (error) {
      resolve({ success: false, imageUrl: null, error: error.message })
    }
  })
}

// Generate quiz content with AI
async function generateQuizContent(topic, quizType, gradeLevel, questionCount, questionTypes, customPrompt, difficulty) {
  try {
    const topicInfo = QUIZ_TOPICS[topic] || { name: topic }
    
    // Build question type instruction
    const questionTypeInstructions = questionTypes.map(type => {
      switch(type) {
        case 'multiple-choice': return 'Multiple Choice (4 options A-D)'
        case 'true-false': return 'True/False'
        case 'fill-blank': return 'Fill in the Blank'
        case 'short-answer': return 'Short Answer'
        case 'matching': return 'Matching (pairs)'
        default: return type
      }
    }).join(', ')
    
    const difficultyDesc = {
      'easy': 'Basic concepts, straightforward questions',
      'medium': 'Moderate complexity, requires understanding',
      'hard': 'Advanced concepts, challenging questions',
      'mixed': 'Mix of easy, medium, and hard questions'
    }
    
    let prompt = ''
    
    if (quizType === 'custom' && customPrompt) {
      // Custom quiz from user's prompt
      prompt = `Create a quiz/test based on this requirement:

"${customPrompt}"

Generate ${questionCount} questions.
Difficulty: ${difficulty || 'medium'} - ${difficultyDesc[difficulty] || difficultyDesc.medium}
Question Types to include: ${questionTypeInstructions}

Format as JSON:
{
  "title": "Quiz title based on the topic",
  "description": "Brief description of what this quiz covers",
  "instructions": "Clear instructions for test takers",
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice|true-false|fill-blank|short-answer|matching",
      "question": "The question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "Correct answer",
      "explanation": "Brief explanation of the answer"
    }
  ],
  "bonusQuestion": {
    "question": "A challenging bonus question",
    "answer": "Answer"
  }
}

IMPORTANT: Return ONLY valid JSON. Make questions engaging, accurate, and educational.`
    } else if (quizType === 'personality') {
      // Personality quiz
      prompt = `Create a fun and insightful ${topicInfo.name} personality quiz.

Generate ${questionCount} personality-type questions about ${topicInfo.name}.
Make it engaging and fun!

Format as JSON:
{
  "title": "${topicInfo.name} Personality Quiz",
  "description": "Discover your ${topicInfo.name.toLowerCase()} personality type!",
  "instructions": "Answer honestly - there are no wrong answers!",
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice",
      "question": "Scenario or preference question",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "traits": {
        "A": "Trait for A",
        "B": "Trait for B",
        "C": "Trait for C",
        "D": "Trait for D"
      }
    }
  ],
  "resultTypes": [
    {
      "type": "Type Name",
      "description": "Description of this personality type"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON.`
    } else {
      // Academic/Trivia quiz
      const gradeContext = gradeLevel ? `appropriate for ${gradeLevel} students` : 'general audience'
      
      prompt = `Create a ${quizType === 'trivia' ? 'fun trivia' : 'comprehensive'} quiz about ${topicInfo.name}.

Topic: ${topicInfo.name}
Audience: ${gradeContext}
Number of questions: ${questionCount}
Difficulty: ${difficulty || 'medium'} - ${difficultyDesc[difficulty] || difficultyDesc.medium}
Question Types: ${questionTypeInstructions}

Generate a complete quiz with:
1. An engaging title
2. Clear instructions
3. ${questionCount} well-crafted questions
4. Accurate answers with brief explanations

For matching questions, provide 4-6 pairs.
For fill-blank, use ___ to indicate the blank.

Format as JSON:
{
  "title": "Quiz title",
  "description": "What this quiz covers",
  "instructions": "Instructions for test takers",
  "questions": [
    {
      "number": 1,
      "type": "multiple-choice|true-false|fill-blank|short-answer|matching",
      "question": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "matchPairs": [{"left": "...", "right": "..."}],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    }
  ],
  "bonusQuestion": {
    "question": "Challenging bonus",
    "answer": "Answer",
    "explanation": "Explanation"
  }
}

IMPORTANT: Return ONLY valid JSON. Questions should be accurate, engaging, and educational.`
    }

    // Call LLM using Python script
    const llmResult = await runLLM(prompt, "You are a professional quiz creator. Generate accurate, engaging, and educational content. Return ONLY valid JSON.")
    
    if (!llmResult.success || !llmResult.content) {
      console.error('LLM call failed:', llmResult.error)
      throw new Error(llmResult.error || 'Failed to generate quiz content')
    }
    
    let text = llmResult.content.trim()
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }
    
    return JSON.parse(text)
  } catch (error) {
    console.error('AI quiz generation error:', error)
    // Return fallback structure
    return {
      title: `${QUIZ_TOPICS[topic]?.name || topic} Quiz`,
      description: `Test your knowledge about ${QUIZ_TOPICS[topic]?.name || topic}`,
      instructions: 'Answer all questions to the best of your ability.',
      questions: Array.from({ length: questionCount }, (_, i) => ({
        number: i + 1,
        type: 'multiple-choice',
        question: `Question ${i + 1} about ${QUIZ_TOPICS[topic]?.name || topic}`,
        options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        answer: 'A',
        explanation: 'Explanation pending'
      })),
      bonusQuestion: { question: 'Bonus question', answer: 'Answer' }
    }
  }
}

// Sanitize text to remove characters not supported by standard PDF fonts
function sanitizeText(text) {
  if (!text) return ''
  return text
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")  // Smart quotes and accents to apostrophe
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014\u2015]/g, '-')        // Various dashes
    .replace(/[\u2026]/g, '...')                   // Ellipsis
    .replace(/[\u00A0]/g, ' ')                     // Non-breaking space
    .replace(/[\u2022\u2023\u25E6\u2043]/g, '*')  // Bullet points
    .replace(/[\u2019]/g, "'")                     // Right single quote
    .trim()
}

// Sanitize text for standard fonts only (removes non-ASCII)
function sanitizeForStandardFont(text) {
  if (!text) return ''
  return sanitizeText(text).replace(/[^\x00-\x7F]/g, '').trim()
}

// Helper to safely draw text - handles both Unicode and standard fonts
function safeDrawText(page, text, options, useUnicode = false) {
  if (!text) return
  try {
    // For Unicode fonts, only do basic cleanup (keep non-ASCII)
    // For standard fonts, remove all non-ASCII characters
    const processedText = useUnicode ? sanitizeText(text) : sanitizeForStandardFont(text)
    if (processedText) {
      page.drawText(processedText, options)
    }
  } catch (e) {
    // Fallback: try with ASCII only
    try {
      const fallbackText = text.replace(/[^\x20-\x7E]/g, '').trim()
      if (fallbackText) {
        page.drawText(fallbackText, options)
      }
    } catch (e2) {
      console.error('Failed to draw text:', e2.message)
    }
  }
}

// Word wrap helper - works with both Unicode and standard fonts
function wrapText(text, font, fontSize, maxWidth, useUnicode = false) {
  if (!text) return []
  const processedText = useUnicode ? sanitizeText(text) : sanitizeForStandardFont(text)
  if (!processedText) return []
  
  const words = processedText.split(' ').filter(w => w.length > 0)
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    } catch (e) {
      // If can't measure, just add word
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      action,
      topic,
      quizType = 'academic',
      gradeLevel,
      questionCount = 10,
      questionTypes = ['multiple-choice'],
      difficulty = 'medium',
      customPrompt,
      customTopic,
      includeAnswerKey = true,
      generateCover = true,
      customCoverPrompt,
      primaryColor = '#1e40af',
      secondaryColor = '#3b82f6',
      paperSize = '8.5x11',
      title: customTitle,
      authorName,
      // For generating structure only
      quizContent
    } = body
    
    // Action: Generate quiz structure (questions only)
    if (action === 'generate-structure') {
      console.log(`Generating quiz structure for topic: ${topic || customTopic}, type: ${quizType}`)
      
      const content = await generateQuizContent(
        customTopic || topic,
        quizType,
        gradeLevel,
        questionCount,
        questionTypes,
        customPrompt,
        difficulty
      )
      
      return NextResponse.json({
        success: true,
        quiz: content
      })
    }
    
    // Action: Generate PDF
    if (action === 'generate-pdf' || !action) {
      console.log(`Generating quiz PDF for topic: ${topic || customTopic}`)
      
      // Get quiz content (either passed in or generate new)
      let content = quizContent
      if (!content) {
        content = await generateQuizContent(
          customTopic || topic,
          quizType,
          gradeLevel,
          questionCount,
          questionTypes,
          customPrompt,
          difficulty
        )
      }
      
      // Generate cover image if requested
      let coverImageUrl = null
      if (generateCover) {
        try {
          const coverResult = await generateCoverImage(topic || customTopic, quizType, customCoverPrompt)
          if (coverResult.success && coverResult.imageUrl) {
            coverImageUrl = coverResult.imageUrl
            console.log('Cover image generated successfully')
          }
        } catch (e) {
          console.log('Cover image generation failed:', e.message)
        }
      }
      
      // Create PDF
      const pdfDoc = await PDFDocument.create()
      
      // Register fontkit for Unicode font support
      pdfDoc.registerFontkit(fontkit)
      
      // Load standard fonts as fallback
      const standardRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const standardBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const standardItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
      
      // Initialize with standard fonts
      let regularFont = standardRegular
      let boldFont = standardBold
      let italicFont = standardItalic
      let hasUnicodeFont = false
      
      // Check if we need Unicode fonts (non-ASCII text detected)
      const allText = [
        customTitle || '',
        content?.title || '',
        content?.description || '',
        content?.instructions || '',
        authorName || '',
        customTopic || '',
        topic || '',
        ...(content?.questions || []).map(q => `${q.question || ''} ${q.answer || ''} ${q.explanation || ''} ${(q.options || []).join(' ')}`),
        content?.bonusQuestion?.question || '',
        content?.bonusQuestion?.answer || ''
      ].join(' ')
      
      if (hasNonAscii(allText)) {
        console.log('Non-ASCII text detected, loading Unicode fonts...')
        
        // Font paths - try multiple options for best compatibility
        const fontPaths = [
          '/app/public/fonts/NotoSansBengali-Regular.ttf',    // Bengali
          '/app/public/fonts/NotoSans-Regular.ttf',           // General Unicode
          '/usr/share/fonts/truetype/freefont/FreeSerif.ttf', // Good Unicode coverage
        ]
        
        const fontBoldPaths = [
          '/app/public/fonts/NotoSansBengali-Bold.ttf',
          '/app/public/fonts/NotoSans-Bold.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf',
        ]
        
        const fontItalicPaths = [
          '/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf',
          '/app/public/fonts/NotoSans-Regular.ttf', // Fallback to regular if no italic
        ]
        
        // Try to load regular Unicode font
        for (const fontPath of fontPaths) {
          try {
            const fontBytes = await fs.readFile(fontPath)
            regularFont = await pdfDoc.embedFont(fontBytes, { subset: false })
            hasUnicodeFont = true
            console.log(`Loaded Unicode font: ${fontPath}`)
            break
          } catch (e) {
            console.log(`Font not available: ${fontPath}`)
          }
        }
        
        // Try to load bold Unicode font
        for (const fontPath of fontBoldPaths) {
          try {
            const fontBytes = await fs.readFile(fontPath)
            boldFont = await pdfDoc.embedFont(fontBytes, { subset: false })
            console.log(`Loaded Unicode bold font: ${fontPath}`)
            break
          } catch (e) {
            // Continue to next
          }
        }
        
        // Try to load italic Unicode font
        for (const fontPath of fontItalicPaths) {
          try {
            const fontBytes = await fs.readFile(fontPath)
            italicFont = await pdfDoc.embedFont(fontBytes, { subset: false })
            console.log(`Loaded Unicode italic font: ${fontPath}`)
            break
          } catch (e) {
            // Continue to next
          }
        }
        
        // If bold/italic not loaded but regular is, use regular as fallback
        if (hasUnicodeFont) {
          if (boldFont === standardBold) boldFont = regularFont
          if (italicFont === standardItalic) italicFont = regularFont
        }
      }
      
      // Helper to get appropriate font based on text content
      const getFont = (text, type = 'regular') => {
        if (hasUnicodeFont && hasNonAscii(text)) {
          switch(type) {
            case 'bold': return boldFont
            case 'italic': return italicFont
            default: return regularFont
          }
        }
        switch(type) {
          case 'bold': return standardBold
          case 'italic': return standardItalic
          default: return standardRegular
        }
      }
      
      // Paper sizes
      const sizes = {
        '8.5x11': { width: 612, height: 792 },
        '8x10': { width: 576, height: 720 },
        '6x9': { width: 432, height: 648 },
        'a4': { width: 595, height: 842 }
      }
      const { width, height } = sizes[paperSize] || sizes['8.5x11']
      const margin = 50
      
      // Parse colors
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0.1, g: 0.25, b: 0.7 }
      }
      
      const primary = hexToRgb(primaryColor)
      const secondary = hexToRgb(secondaryColor)
      
      // === COVER PAGE ===
      let page = pdfDoc.addPage([width, height])
      let y = height - margin
      
      // Draw cover background
      page.drawRectangle({
        x: 0, y: 0,
        width, height,
        color: rgb(primary.r, primary.g, primary.b)
      })
      
      // Add cover image if available
      if (coverImageUrl) {
        try {
          const imageResponse = await fetch(coverImageUrl)
          const imageArrayBuffer = await imageResponse.arrayBuffer()
          const imageBytes = new Uint8Array(imageArrayBuffer)
          
          let embeddedImage
          if (coverImageUrl.includes('.png') || coverImageUrl.includes('image/png')) {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          }
          
          // Draw image as cover background
          const imgDims = embeddedImage.scale(1)
          const scale = Math.max(width / imgDims.width, height / imgDims.height)
          const scaledWidth = imgDims.width * scale
          const scaledHeight = imgDims.height * scale
          
          page.drawImage(embeddedImage, {
            x: (width - scaledWidth) / 2,
            y: (height - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
            opacity: 0.3
          })
        } catch (e) {
          console.log('Failed to embed cover image:', e.message)
        }
      }
      
      // Add decorative elements
      page.drawRectangle({
        x: margin - 10, y: margin - 10,
        width: width - 2 * margin + 20,
        height: height - 2 * margin + 20,
        borderColor: rgb(1, 1, 1),
        borderWidth: 3,
        opacity: 0.8
      })
      
      // Title
      const finalTitle = customTitle || content.title || 'Quiz'
      const titleLines = wrapText(finalTitle, boldFont, 32, width - margin * 2 - 40, hasUnicodeFont)
      y = height - margin - 150
      
      titleLines.forEach((line, idx) => {
        const processedLine = hasUnicodeFont ? sanitizeText(line) : sanitizeForStandardFont(line)
        const titleWidth = processedLine ? boldFont.widthOfTextAtSize(processedLine, 32) : 0
        safeDrawText(page, line, {
          x: (width - titleWidth) / 2,
          y: y - idx * 40,
          size: 32,
          font: boldFont,
          color: rgb(1, 1, 1)
        }, hasUnicodeFont)
      })
      
      y -= titleLines.length * 40 + 30
      
      // Description
      if (content.description) {
        const descLines = wrapText(content.description, regularFont, 14, width - margin * 2 - 60, hasUnicodeFont)
        descLines.forEach((line, idx) => {
          const processedLine = hasUnicodeFont ? sanitizeText(line) : sanitizeForStandardFont(line)
          const lineWidth = processedLine ? regularFont.widthOfTextAtSize(processedLine, 14) : 0
          safeDrawText(page, line, {
            x: (width - lineWidth) / 2,
            y: y - idx * 20,
            size: 14,
            font: regularFont,
            color: rgb(1, 1, 1, 0.9)
          }, hasUnicodeFont)
        })
        y -= descLines.length * 20 + 40
      }
      
      // Quiz info box
      const topicInfo = QUIZ_TOPICS[topic] || { name: customTopic || topic || 'Custom', icon: '📝' }
      const infoY = height / 2 - 50
      
      page.drawRectangle({
        x: width / 2 - 120,
        y: infoY - 30,
        width: 240,
        height: 80,
        color: rgb(1, 1, 1),
        opacity: 0.2,
        borderRadius: 10
      })
      
      const infoText = `${content.questions?.length || questionCount} Questions`
      const processedInfoText = hasUnicodeFont ? sanitizeText(infoText) : sanitizeForStandardFont(infoText)
      const infoWidth = processedInfoText ? regularFont.widthOfTextAtSize(processedInfoText, 16) : 0
      safeDrawText(page, infoText, {
        x: (width - infoWidth) / 2,
        y: infoY,
        size: 16,
        font: regularFont,
        color: rgb(1, 1, 1)
      }, hasUnicodeFont)
      
      if (gradeLevel) {
        const gradeText = gradeLevel
        const processedGradeText = hasUnicodeFont ? sanitizeText(gradeText) : sanitizeForStandardFont(gradeText)
        const gradeWidth = processedGradeText ? regularFont.widthOfTextAtSize(processedGradeText, 14) : 0
        safeDrawText(page, gradeText, {
          x: (width - gradeWidth) / 2,
          y: infoY - 25,
          size: 14,
          font: regularFont,
          color: rgb(1, 1, 1, 0.8)
        }, hasUnicodeFont)
      }
      
      // Author
      if (authorName) {
        const authorText = `By ${authorName}`
        const processedAuthorText = hasUnicodeFont ? sanitizeText(authorText) : sanitizeForStandardFont(authorText)
        const authorWidth = processedAuthorText ? regularFont.widthOfTextAtSize(processedAuthorText, 14) : 0
        safeDrawText(page, authorText, {
          x: (width - authorWidth) / 2,
          y: margin + 60,
          size: 14,
          font: italicFont,
          color: rgb(1, 1, 1, 0.8)
        }, hasUnicodeFont)
      }
      
      // Year
      const yearText = new Date().getFullYear().toString()
      const processedYearText = hasUnicodeFont ? sanitizeText(yearText) : sanitizeForStandardFont(yearText)
      const yearWidth = processedYearText ? regularFont.widthOfTextAtSize(processedYearText, 12) : 0
      safeDrawText(page, yearText, {
        x: (width - yearWidth) / 2,
        y: margin + 30,
        size: 12,
        font: regularFont,
        color: rgb(1, 1, 1, 0.7)
      }, hasUnicodeFont)
      
      // === INSTRUCTIONS PAGE ===
      page = pdfDoc.addPage([width, height])
      y = height - margin
      
      // Header
      page.drawRectangle({
        x: 0, y: height - 80,
        width, height: 80,
        color: rgb(primary.r, primary.g, primary.b)
      })
      
      safeDrawText(page, 'Instructions', {
        x: margin,
        y: height - 55,
        size: 24,
        font: boldFont,
        color: rgb(1, 1, 1)
      }, hasUnicodeFont)
      
      y = height - 120
      
      // Instructions content
      const instructions = content.instructions || 'Read each question carefully and select the best answer.'
      const instrLines = wrapText(instructions, regularFont, 12, width - margin * 2, hasUnicodeFont)
      instrLines.forEach((line, idx) => {
        safeDrawText(page, line, {
          x: margin,
          y: y - idx * 18,
          size: 12,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2)
        }, hasUnicodeFont)
      })
      
      y -= instrLines.length * 18 + 40
      
      // Name and date fields
      safeDrawText(page, 'Name: ___________________________________', {
        x: margin,
        y: y,
        size: 12,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      }, hasUnicodeFont)
      
      safeDrawText(page, 'Date: _________________', {
        x: width - margin - 180,
        y: y,
        size: 12,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      }, hasUnicodeFont)
      
      y -= 40
      
      safeDrawText(page, 'Score: ______ / ' + (content.questions?.length || questionCount), {
        x: margin,
        y: y,
        size: 12,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      }, hasUnicodeFont)
      
      // === QUESTIONS PAGES ===
      const questions = content.questions || []
      page = pdfDoc.addPage([width, height])
      y = height - margin
      
      // Header
      page.drawRectangle({
        x: 0, y: height - 80,
        width, height: 80,
        color: rgb(primary.r, primary.g, primary.b)
      })
      
      safeDrawText(page, finalTitle, {
        x: margin,
        y: height - 55,
        size: 20,
        font: boldFont,
        color: rgb(1, 1, 1)
      }, hasUnicodeFont)
      
      y = height - 110
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        
        // Check if we need a new page
        const estimatedHeight = q.type === 'matching' ? 200 : q.type === 'short-answer' ? 120 : 100
        if (y < margin + estimatedHeight) {
          page = pdfDoc.addPage([width, height])
          y = height - margin
          
          // Header on new page
          page.drawRectangle({
            x: 0, y: height - 60,
            width, height: 60,
            color: rgb(primary.r, primary.g, primary.b)
          })
          
          safeDrawText(page, finalTitle + ' (continued)', {
            x: margin,
            y: height - 40,
            size: 14,
            font: boldFont,
            color: rgb(1, 1, 1)
          }, hasUnicodeFont)
          
          y = height - 90
        }
        
        // Question number box
        page.drawRectangle({
          x: margin,
          y: y - 18,
          width: 30,
          height: 24,
          color: rgb(secondary.r, secondary.g, secondary.b),
          borderRadius: 4
        })
        
        safeDrawText(page, (i + 1).toString(), {
          x: margin + (i + 1 > 9 ? 7 : 10),
          y: y - 12,
          size: 12,
          font: boldFont,
          color: rgb(1, 1, 1)
        }, hasUnicodeFont)
        
        // Question text
        const questionText = q.question || `Question ${i + 1}`
        const qLines = wrapText(questionText, regularFont, 12, width - margin * 2 - 50, hasUnicodeFont)
        qLines.forEach((line, idx) => {
          safeDrawText(page, line, {
            x: margin + 40,
            y: y - idx * 16,
            size: 12,
            font: regularFont,
            color: rgb(0.1, 0.1, 0.1)
          }, hasUnicodeFont)
        })
        
        y -= qLines.length * 16 + 10
        
        // Draw options based on question type
        if (q.type === 'multiple-choice' && q.options) {
          q.options.forEach((opt, oIdx) => {
            // Option circle
            page.drawCircle({
              x: margin + 50,
              y: y - 5,
              size: 8,
              borderColor: rgb(0.5, 0.5, 0.5),
              borderWidth: 1
            })
            
            const optText = opt.startsWith(String.fromCharCode(65 + oIdx)) ? opt : `${String.fromCharCode(65 + oIdx)}) ${opt}`
            safeDrawText(page, optText, {
              x: margin + 65,
              y: y - 3,
              size: 11,
              font: regularFont,
              color: rgb(0.2, 0.2, 0.2)
            }, hasUnicodeFont)
            
            y -= 22
          })
        } else if (q.type === 'true-false') {
          // True option
          page.drawCircle({
            x: margin + 50,
            y: y - 5,
            size: 8,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1
          })
          safeDrawText(page, 'True', {
            x: margin + 65,
            y: y - 3,
            size: 11,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
          }, hasUnicodeFont)
          y -= 22
          
          // False option
          page.drawCircle({
            x: margin + 50,
            y: y - 5,
            size: 8,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1
          })
          safeDrawText(page, 'False', {
            x: margin + 65,
            y: y - 3,
            size: 11,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
          }, hasUnicodeFont)
          y -= 22
        } else if (q.type === 'fill-blank' || q.type === 'short-answer') {
          // Answer line
          page.drawLine({
            start: { x: margin + 40, y: y },
            end: { x: width - margin, y: y },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7)
          })
          y -= 25
          
          if (q.type === 'short-answer') {
            // Extra lines for short answer
            for (let l = 0; l < 2; l++) {
              page.drawLine({
                start: { x: margin + 40, y: y },
                end: { x: width - margin, y: y },
                thickness: 1,
                color: rgb(0.7, 0.7, 0.7)
              })
              y -= 25
            }
          }
        } else if (q.type === 'matching' && q.matchPairs) {
          // Draw matching pairs
          const leftCol = margin + 50
          const rightCol = width / 2 + 20
          
          safeDrawText(page, 'Column A', {
            x: leftCol,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4)
          }, hasUnicodeFont)
          
          safeDrawText(page, 'Column B', {
            x: rightCol,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4)
          }, hasUnicodeFont)
          
          y -= 20
          
          // Shuffle right column for the quiz
          const shuffledRight = [...q.matchPairs].sort(() => Math.random() - 0.5)
          
          q.matchPairs.forEach((pair, pIdx) => {
            safeDrawText(page, `${pIdx + 1}. ${pair.left} ____`, {
              x: leftCol,
              y: y,
              size: 11,
              font: regularFont,
              color: rgb(0.2, 0.2, 0.2)
            }, hasUnicodeFont)
            
            safeDrawText(page, `${String.fromCharCode(65 + pIdx)}. ${shuffledRight[pIdx]?.right || pair.right}`, {
              x: rightCol,
              y: y,
              size: 11,
              font: regularFont,
              color: rgb(0.2, 0.2, 0.2)
            }, hasUnicodeFont)
            
            y -= 20
          })
        }
        
        y -= 20 // Space between questions
      }
      
      // Bonus question
      if (content.bonusQuestion && content.bonusQuestion.question) {
        if (y < margin + 100) {
          page = pdfDoc.addPage([width, height])
          y = height - margin - 60
        }
        
        y -= 20
        
        page.drawRectangle({
          x: margin,
          y: y - 60,
          width: width - margin * 2,
          height: 80,
          color: rgb(secondary.r, secondary.g, secondary.b, 0.1),
          borderColor: rgb(secondary.r, secondary.g, secondary.b),
          borderWidth: 1
        })
        
        safeDrawText(page, 'BONUS QUESTION', {
          x: margin + 10,
          y: y,
          size: 12,
          font: boldFont,
          color: rgb(secondary.r, secondary.g, secondary.b)
        }, hasUnicodeFont)
        
        y -= 20
        
        const bonusLines = wrapText(content.bonusQuestion.question, regularFont, 11, width - margin * 2 - 30, hasUnicodeFont)
        bonusLines.forEach((line, idx) => {
          safeDrawText(page, line, {
            x: margin + 10,
            y: y - idx * 14,
            size: 11,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
          }, hasUnicodeFont)
        })
      }
      
      // === ANSWER KEY ===
      if (includeAnswerKey) {
        page = pdfDoc.addPage([width, height])
        y = height - margin
        
        // Header
        page.drawRectangle({
          x: 0, y: height - 80,
          width, height: 80,
          color: rgb(0.6, 0.1, 0.1)
        })
        
        safeDrawText(page, 'ANSWER KEY', {
          x: margin,
          y: height - 55,
          size: 24,
          font: boldFont,
          color: rgb(1, 1, 1)
        }, hasUnicodeFont)
        
        y = height - 110
        
        // Quiz title
        const titleLines = wrapText(finalTitle, boldFont, 14, width - margin * 2, hasUnicodeFont)
        titleLines.forEach((line, idx) => {
          safeDrawText(page, line, {
            x: margin,
            y: y - idx * 18,
            size: 14,
            font: boldFont,
            color: rgb(0.3, 0.3, 0.3)
          }, hasUnicodeFont)
        })
        y -= titleLines.length * 18 + 20
        
        // Draw a line separator
        page.drawLine({
          start: { x: margin, y: y },
          end: { x: width - margin, y: y },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8)
        })
        y -= 20
        
        // Single column layout for better readability
        const contentWidth = width - margin * 2
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          
          // Check if we need a new page
          const estimatedHeight = q.explanation ? 60 : 30
          if (y < margin + estimatedHeight) {
            page = pdfDoc.addPage([width, height])
            y = height - margin - 30
            
            // Mini header on continuation page
            safeDrawText(page, 'ANSWER KEY (continued)', {
              x: margin,
              y: y + 10,
              size: 12,
              font: boldFont,
              color: rgb(0.5, 0.5, 0.5)
            })
            y -= 20
          }
          
          // Question number badge
          page.drawRectangle({
            x: margin,
            y: y - 12,
            width: 28,
            height: 20,
            color: rgb(0.6, 0.1, 0.1),
            borderRadius: 3
          })
          
          safeDrawText(page, `${i + 1}`, {
            x: margin + (i + 1 > 9 ? 6 : 10),
            y: y - 6,
            size: 11,
            font: boldFont,
            color: rgb(1, 1, 1)
          })
          
          // Answer text - wrap if too long
          const answerText = q.answer || 'See explanation'
          const answerLines = wrapText(answerText, regularFont, 11, contentWidth - 50)
          answerLines.forEach((line, idx) => {
            safeDrawText(page, line, {
              x: margin + 38,
              y: y - idx * 14,
              size: 11,
              font: regularFont,
              color: rgb(0.15, 0.15, 0.15)
            })
          })
          y -= Math.max(answerLines.length * 14, 14)
          
          // Explanation (if available) - show up to 3 lines
          if (q.explanation) {
            y -= 4
            const expLines = wrapText(q.explanation, italicFont, 9, contentWidth - 50)
            const linesToShow = expLines.slice(0, 3)
            linesToShow.forEach((line, idx) => {
              safeDrawText(page, line, {
                x: margin + 38,
                y: y - idx * 12,
                size: 9,
                font: italicFont,
                color: rgb(0.5, 0.5, 0.5)
              })
            })
            y -= linesToShow.length * 12
          }
          
          y -= 15 // Space between answers
        }
        
        // Bonus answer
        if (content.bonusQuestion && content.bonusQuestion.answer) {
          // Check if we need a new page for bonus
          if (y < margin + 80) {
            page = pdfDoc.addPage([width, height])
            y = height - margin - 30
          }
          
          y -= 20
          
          // Bonus box
          page.drawRectangle({
            x: margin,
            y: y - 50,
            width: contentWidth,
            height: 70,
            color: rgb(1, 0.95, 0.85),
            borderColor: rgb(0.8, 0.5, 0),
            borderWidth: 1
          })
          
          safeDrawText(page, 'BONUS ANSWER:', {
            x: margin + 10,
            y: y - 5,
            size: 11,
            font: boldFont,
            color: rgb(0.6, 0.3, 0)
          })
          
          // Wrap bonus answer
          const bonusAnswerLines = wrapText(content.bonusQuestion.answer, regularFont, 11, contentWidth - 30)
          bonusAnswerLines.slice(0, 2).forEach((line, idx) => {
            safeDrawText(page, line, {
              x: margin + 10,
              y: y - 22 - idx * 14,
              size: 11,
              font: regularFont,
              color: rgb(0.4, 0.25, 0)
            })
          })
        }
      }
      
      // Save PDF
      const pdfBytes = await pdfDoc.save()
      
      // Save file
      const outputDir = '/app/public/quizzes'
      await fs.mkdir(outputDir, { recursive: true })
      
      const fileName = `${randomUUID()}.pdf`
      const filePath = path.join(outputDir, fileName)
      await fs.writeFile(filePath, pdfBytes)
      
      // Save to library
      const libraryCollection = await getCollection('library')
      const documentId = randomUUID()
      
      await libraryCollection.insertOne({
        id: documentId,
        userId: 'default-user',
        type: 'quiz',
        category: 'document',
        title: finalTitle,
        description: content.description || `${quizType} quiz about ${topic || customTopic}`,
        filePath: `/quizzes/${fileName}`,
        fileSize: pdfBytes.length,
        metadata: { 
          topic, 
          quizType, 
          gradeLevel, 
          questionCount: questions.length,
          difficulty
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      
      return NextResponse.json({
        success: true,
        title: finalTitle,
        downloadUrl: `/quizzes/${fileName}`,
        pageCount: pdfDoc.getPageCount(),
        questionCount: questions.length,
        libraryId: documentId
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
