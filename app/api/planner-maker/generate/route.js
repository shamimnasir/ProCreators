import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { 
  PDF_COLOR_SCHEMES, 
  COVER_STYLES, 
  PAPER_SIZES,
  drawCoverPage,
  drawCornerDecorations,
  getCurrentYear
} from '@/lib/pdf-design'

// Use Google Generative AI with the proper Google API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Planner types with specific configurations
const PLANNER_CONFIGS = {
  daily: { name: 'Daily Planner', sections: ['Schedule', 'To-Do', 'Notes', 'Reflection'] },
  weekly: { name: 'Weekly Planner', sections: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  monthly: { name: 'Monthly Planner', sections: ['Calendar', 'Goals', 'Notes', 'Habit Tracker'] },
  habit: { name: 'Habit Tracker', sections: ['Daily Habits', 'Weekly Review', 'Monthly Summary'] },
  budget: { name: 'Budget Planner', sections: ['Income', 'Expenses', 'Savings', 'Summary'] },
  meal: { name: 'Meal Planner', sections: ['Weekly Meals', 'Grocery List', 'Recipes', 'Prep Notes'] },
  fitness: { name: 'Fitness Planner', sections: ['Workout Log', 'Progress', 'Goals', 'Measurements'] },
  goals: { name: 'Goal Planner', sections: ['Vision Board', 'Quarterly Goals', 'Action Steps', 'Review'] },
  project: { name: 'Project Planner', sections: ['Overview', 'Timeline', 'Tasks', 'Resources'] },
  gratitude: { name: 'Gratitude Planner', sections: ['Daily Gratitude', 'Reflections', 'Affirmations'] },
}

// Generate planner content with AI using Google Gemini
async function generatePlannerContent(plannerType, customTitle, pageCount, customInstructions) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const config = PLANNER_CONFIGS[plannerType] || PLANNER_CONFIGS.weekly
    
    const prompt = `Create content for a ${config.name} with ${pageCount} pages.
${customTitle ? `Title: "${customTitle}"` : ''}
${customInstructions ? `Special instructions: ${customInstructions}` : ''}

Generate:
1. A catchy title (or use provided title)
2. A subtitle describing the planner's purpose
3. 10 motivational quotes related to ${plannerType} planning${customInstructions ? ` and incorporating themes from: ${customInstructions}` : ''}
4. 5 tips for using this planner effectively${customInstructions ? ` (include tips related to: ${customInstructions})` : ''}
5. Section descriptions for: ${config.sections.join(', ')}

Format as JSON:
{
  "title": "...",
  "subtitle": "...",
  "quotes": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."],
  "tips": ["...", "...", "...", "...", "..."],
  "sections": [{ "name": "...", "description": "..." }]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log('AI generated content successfully via Gemini')
    return JSON.parse(text)
  } catch (error) {
    console.error('AI content generation error:', error.message || error)
    const config = PLANNER_CONFIGS[plannerType] || PLANNER_CONFIGS.weekly
    
    // Generate fallback content that incorporates custom instructions
    const baseQuotes = [
      'A goal without a plan is just a wish.',
      'The secret of getting ahead is getting started.',
      'Plan your work and work your plan.',
      'Every accomplishment starts with the decision to try.',
      'Small steps every day lead to big results.',
      'Progress, not perfection.',
      'Your future is created by what you do today.',
      'Dream big, start small, act now.',
      'Consistency is the key to success.',
      'Make each day your masterpiece.'
    ]
    
    // Add instruction-specific quotes if provided
    let quotes = [...baseQuotes]
    if (customInstructions) {
      const lowerInstructions = customInstructions.toLowerCase()
      if (lowerInstructions.includes('meal') || lowerInstructions.includes('food') || lowerInstructions.includes('diet')) {
        quotes = [
          'Let food be thy medicine.',
          'A balanced diet is a cookie in each hand.',
          'Eat well, live well, be well.',
          'Good food is the foundation of genuine happiness.',
          'Plan your meals, plan your success.',
          ...baseQuotes.slice(0, 5)
        ]
      }
      if (lowerInstructions.includes('fitness') || lowerInstructions.includes('exercise') || lowerInstructions.includes('workout')) {
        quotes = [
          'The only bad workout is the one that didn\'t happen.',
          'Sweat is just fat crying.',
          'Your body can do anything, it\'s your mind you need to convince.',
          'Fitness is not about being better than someone else.',
          'Strong is the new beautiful.',
          ...baseQuotes.slice(0, 5)
        ]
      }
      if (lowerInstructions.includes('motivation') || lowerInstructions.includes('inspire')) {
        quotes = [
          'Believe you can and you\'re halfway there.',
          'The only limit is the one you set yourself.',
          'Success is not final, failure is not fatal.',
          'Be the change you wish to see.',
          'Today is a new opportunity to be better.',
          ...baseQuotes.slice(0, 5)
        ]
      }
    }
    
    // Generate tips based on instructions
    let tips = [
      'Review your planner every morning',
      'Set realistic and achievable goals',
      'Celebrate your progress regularly',
      'Use color coding for different priorities',
      'Schedule breaks and self-care time'
    ]
    
    if (customInstructions) {
      const lowerInstructions = customInstructions.toLowerCase()
      if (lowerInstructions.includes('meal')) {
        tips = [
          'Plan your meals for the week ahead',
          'Prep ingredients on weekends',
          'Keep healthy snacks ready',
          'Track your water intake daily',
          'Try one new recipe each week'
        ]
      }
      if (lowerInstructions.includes('fitness')) {
        tips = [
          'Schedule workouts like appointments',
          'Track your progress with measurements',
          'Start with small achievable goals',
          'Rest days are just as important',
          'Celebrate non-scale victories'
        ]
      }
    }
    
    return {
      title: customTitle || `My ${config.name}`,
      subtitle: customInstructions 
        ? `Your personal ${plannerType} planning companion - ${customInstructions.substring(0, 50)}${customInstructions.length > 50 ? '...' : ''}`
        : `Your personal ${plannerType} planning companion`,
      quotes,
      tips,
      sections: config.sections.map(s => ({ name: s, description: `Your ${s.toLowerCase()} section` }))
    }
  }
}

// Draw daily planner page with enhanced design
function drawDailyPage(page, fonts, colors, dayNum, quote) {
  const { width, height } = page.getSize()
  const margin = 45
  
  // Background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: colors.background,
  })
  
  // Top accent bar
  page.drawRectangle({
    x: 0, y: height - 60, width, height: 60,
    color: colors.accent,
  })
  
  // Day header
  page.drawText(`Day ${dayNum}`, {
    x: margin, y: height - 40,
    size: 24, font: fonts.bold, color: colors.primary,
  })
  
  // Date line
  page.drawText('Date: _______________', {
    x: width - margin - 150, y: height - 40,
    size: 11, font: fonts.regular, color: colors.secondary,
  })
  
  // Divider line
  page.drawLine({
    start: { x: margin, y: height - 70 },
    end: { x: width - margin, y: height - 70 },
    thickness: 2, color: colors.primary,
  })
  
  let y = height - 100
  
  // Morning section
  page.drawText('Morning Intentions', {
    x: margin, y, size: 14, font: fonts.bold, color: colors.primary,
  })
  y -= 25
  
  for (let i = 0; i < 3; i++) {
    page.drawCircle({ x: margin + 8, y: y + 4, size: 5, borderColor: colors.secondary, borderWidth: 1 })
    page.drawLine({
      start: { x: margin + 25, y }, end: { x: width / 2 - 20, y },
      thickness: 0.5, color: colors.accent,
    })
    y -= 22
  }
  
  y -= 15
  
  // Schedule section
  page.drawText('Today\'s Schedule', {
    x: margin, y, size: 14, font: fonts.bold, color: colors.primary,
  })
  y -= 25
  
  const times = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00']
  times.forEach((time) => {
    if (y > 200) {
      page.drawText(time, { x: margin, y, size: 10, font: fonts.regular, color: colors.secondary })
      page.drawLine({
        start: { x: margin + 45, y: y - 2 }, end: { x: width - margin, y: y - 2 },
        thickness: 0.5, color: colors.accent,
      })
      y -= 25
    }
  })
  
  y -= 15
  
  // To-Do section on right side
  const todoX = width / 2 + 20
  let todoY = height - 100
  
  page.drawText('Priority Tasks', {
    x: todoX, y: todoY, size: 14, font: fonts.bold, color: colors.primary,
  })
  todoY -= 25
  
  for (let i = 0; i < 6; i++) {
    page.drawRectangle({
      x: todoX, y: todoY - 2, width: 14, height: 14,
      borderColor: colors.secondary, borderWidth: 1,
    })
    page.drawLine({
      start: { x: todoX + 22, y: todoY + 3 }, end: { x: width - margin, y: todoY + 3 },
      thickness: 0.5, color: colors.accent,
    })
    todoY -= 28
  }
  
  // Notes section
  page.drawText('Notes & Thoughts', {
    x: todoX, y: todoY - 20, size: 14, font: fonts.bold, color: colors.primary,
  })
  todoY -= 45
  
  for (let i = 0; i < 4; i++) {
    page.drawLine({
      start: { x: todoX, y: todoY }, end: { x: width - margin, y: todoY },
      thickness: 0.5, color: colors.accent,
    })
    todoY -= 25
  }
  
  // Quote at bottom
  if (quote) {
    page.drawRectangle({
      x: margin, y: 40, width: width - margin * 2, height: 50,
      color: colors.accent,
      borderColor: colors.secondary, borderWidth: 1,
    })
    page.drawText(`"${quote}"`, {
      x: margin + 15, y: 60,
      size: 10, font: fonts.italic, color: colors.primary,
    })
  }
  
  // Page footer
  page.drawLine({
    start: { x: margin, y: 30 }, end: { x: width - margin, y: 30 },
    thickness: 1, color: colors.accent,
  })
}

// Draw weekly planner spread with enhanced design
function drawWeeklyPage(page, fonts, colors, weekNum, quote) {
  const { width, height } = page.getSize()
  const margin = 35
  
  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
  
  // Header
  page.drawRectangle({ x: 0, y: height - 55, width, height: 55, color: colors.accent })
  page.drawText(`Week ${weekNum}`, {
    x: margin, y: height - 38, size: 22, font: fonts.bold, color: colors.primary,
  })
  page.drawText('Date Range: _____________ to _____________', {
    x: width - margin - 250, y: height - 35, size: 10, font: fonts.regular, color: colors.secondary,
  })
  
  // Weekly goals section at top
  const goalsY = height - 75
  page.drawText('Weekly Goals', {
    x: margin, y: goalsY, size: 12, font: fonts.bold, color: colors.primary,
  })
  
  for (let i = 0; i < 3; i++) {
    page.drawCircle({
      x: margin + 10 + (i * ((width - margin * 2) / 3)),
      y: goalsY - 25,
      size: 5, borderColor: colors.secondary, borderWidth: 1,
    })
    page.drawLine({
      start: { x: margin + 25 + (i * ((width - margin * 2) / 3)), y: goalsY - 22 },
      end: { x: margin + ((i + 1) * ((width - margin * 2) / 3)) - 15, y: goalsY - 22 },
      thickness: 0.5, color: colors.accent,
    })
  }
  
  // Days grid
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayWidth = (width - margin * 2) / 4
  const dayHeight = (height - 180) / 2
  const startY = height - 120
  
  days.forEach((day, idx) => {
    const col = idx % 4
    const row = Math.floor(idx / 4)
    const x = margin + (col * dayWidth)
    const y = startY - (row * dayHeight)
    
    // Day box
    page.drawRectangle({
      x: x + 2, y: y - dayHeight + 10, width: dayWidth - 4, height: dayHeight - 15,
      borderColor: colors.secondary, borderWidth: 1,
    })
    
    // Day header
    page.drawRectangle({
      x: x + 2, y: y - 20, width: dayWidth - 4, height: 25,
      color: colors.accent,
    })
    page.drawText(day, {
      x: x + 10, y: y - 12, size: 11, font: fonts.bold, color: colors.primary,
    })
    
    // Lines inside
    let lineY = y - 45
    while (lineY > y - dayHeight + 20) {
      page.drawLine({
        start: { x: x + 8, y: lineY }, end: { x: x + dayWidth - 10, y: lineY },
        thickness: 0.3, color: colors.accent,
      })
      lineY -= 18
    }
  })
  
  // Notes section (8th box)
  const notesX = margin + (3 * dayWidth)
  const notesY = startY - dayHeight
  page.drawRectangle({
    x: notesX + 2, y: notesY - dayHeight + 10, width: dayWidth - 4, height: dayHeight - 15,
    borderColor: colors.secondary, borderWidth: 1,
  })
  page.drawRectangle({
    x: notesX + 2, y: notesY - 20, width: dayWidth - 4, height: 25,
    color: colors.primary,
  })
  page.drawText('Notes & Ideas', {
    x: notesX + 10, y: notesY - 12, size: 11, font: fonts.bold, color: colors.background,
  })
  
  // Quote at bottom
  if (quote) {
    page.drawText(`"${quote}"`, {
      x: margin, y: 25, size: 9, font: fonts.italic, color: colors.secondary,
    })
  }
}

// Draw habit tracker page
function drawHabitPage(page, fonts, colors, month) {
  const { width, height } = page.getSize()
  const margin = 35
  
  page.drawRectangle({ x: 0, y: 0, width, height, color: colors.background })
  
  // Header
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: colors.accent })
  page.drawText(`Habit Tracker - ${month}`, {
    x: margin, y: height - 40, size: 22, font: fonts.bold, color: colors.primary,
  })
  
  const habits = ['Exercise', 'Read', 'Meditate', 'Water (8 cups)', 'Sleep 7+ hrs', 'No phone AM', 'Gratitude', 'Healthy meals']
  const cellSize = 16
  const startY = height - 100
  const startX = margin + 120
  
  // Day numbers header
  for (let d = 1; d <= 31; d++) {
    const x = startX + (d - 1) * (cellSize + 2)
    if (x < width - margin) {
      page.drawText(d.toString(), {
        x: x + 3, y: startY + 15, size: 8, font: fonts.regular, color: colors.secondary,
      })
    }
  }
  
  // Habit rows
  habits.forEach((habit, idx) => {
    const y = startY - (idx * 30)
    
    // Habit name
    page.drawText(habit, {
      x: margin, y: y + 3, size: 10, font: fonts.regular, color: colors.primary,
    })
    
    // Checkboxes
    for (let d = 1; d <= 31; d++) {
      const x = startX + (d - 1) * (cellSize + 2)
      if (x < width - margin) {
        page.drawRectangle({
          x: x, y: y - 3, width: cellSize, height: cellSize,
          borderColor: colors.secondary, borderWidth: 0.5,
        })
      }
    }
  })
  
  // Summary section at bottom
  const summaryY = startY - (habits.length * 30) - 40
  page.drawText('Monthly Reflection', {
    x: margin, y: summaryY, size: 14, font: fonts.bold, color: colors.primary,
  })
  
  for (let i = 0; i < 4; i++) {
    page.drawLine({
      start: { x: margin, y: summaryY - 25 - (i * 22) },
      end: { x: width - margin, y: summaryY - 25 - (i * 22) },
      thickness: 0.5, color: colors.accent,
    })
  }
}

export async function POST(request) {
  try {
    const { 
      plannerType, 
      colorScheme = 'rose-gold',
      coverStyle = 'elegant',
      paperSize = 'letter', 
      pageCount = 12, 
      customTitle,
      authorName,
      year,
      customInstructions
    } = await request.json()

    console.log(`Generating ${plannerType} planner with ${pageCount} pages...`)

    // Get configurations
    const colors = PDF_COLOR_SCHEMES[colorScheme] || PDF_COLOR_SCHEMES['rose-gold']
    const cover = COVER_STYLES[coverStyle] || COVER_STYLES['elegant']
    const size = PAPER_SIZES[paperSize] || PAPER_SIZES.letter

    // Generate AI content
    const content = await generatePlannerContent(plannerType, customTitle, pageCount, customInstructions)
    console.log('Content generated:', content.title)

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    const fonts = { regular: regularFont, bold: boldFont, italic: italicFont }

    // Cover page
    const coverPage = pdfDoc.addPage([size.width, size.height])
    drawCoverPage(coverPage, {
      width: size.width,
      height: size.height,
      title: content.title,
      subtitle: content.subtitle,
      authorName: authorName || undefined,
      year: year || getCurrentYear(),
      colors,
      coverStyle: cover,
      boldFont,
      regularFont,
    })

    // Generate content pages based on planner type
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
    const pagesToGenerate = Math.min(pageCount, 200)

    for (let i = 0; i < pagesToGenerate; i++) {
      const page = pdfDoc.addPage([size.width, size.height])
      const quote = content.quotes[i % content.quotes.length]

      switch (plannerType) {
        case 'daily':
          drawDailyPage(page, fonts, colors, i + 1, quote)
          break
        case 'weekly':
          drawWeeklyPage(page, fonts, colors, i + 1, quote)
          break
        case 'habit':
          drawHabitPage(page, fonts, colors, months[i % 12])
          break
        default:
          drawDailyPage(page, fonts, colors, i + 1, quote)
      }
    }

    // Tips page at the end
    const tipsPage = pdfDoc.addPage([size.width, size.height])
    tipsPage.drawRectangle({ x: 0, y: 0, width: size.width, height: size.height, color: colors.background })
    
    tipsPage.drawText('Tips for Success', {
      x: 50, y: size.height - 60, size: 24, font: boldFont, color: colors.primary,
    })
    
    content.tips.forEach((tip, index) => {
      tipsPage.drawText(`${index + 1}. ${tip}`, {
        x: 50, y: size.height - 120 - (index * 50), size: 14, font: regularFont, color: colors.text,
      })
    })

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    const outputDir = '/app/public/planners'
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
      type: 'planner',
      category: 'document',
      title: content.title,
      description: `${plannerType} planner with ${pageCount} pages`,
      filePath: `/planners/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: { plannerType, colorScheme, coverStyle, paperSize, pageCount, authorName },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    console.log(`Planner generated: ${filePath}`)

    return NextResponse.json({
      success: true,
      title: content.title,
      downloadUrl: `/planners/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId,
    })

  } catch (error) {
    console.error('Planner generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate planner' },
      { status: 500 }
    )
  }
}
