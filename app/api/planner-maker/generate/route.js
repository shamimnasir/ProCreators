import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Initialize Google Generative AI with Emergent LLM key
const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

// Paper size dimensions in points (72 points = 1 inch)
const PAPER_SIZES = {
  letter: { width: 612, height: 792 },   // 8.5 x 11 inches
  a4: { width: 595, height: 842 },        // 210 x 297 mm
  a5: { width: 420, height: 595 },        // 148 x 210 mm
  happy: { width: 504, height: 666 },     // 7 x 9.25 inches
}

// Design color schemes
const DESIGN_COLORS = {
  minimal: {
    primary: rgb(0.1, 0.1, 0.1),
    secondary: rgb(0.4, 0.4, 0.4),
    accent: rgb(0.2, 0.2, 0.2),
    background: rgb(1, 1, 1),
    lines: rgb(0.85, 0.85, 0.85),
  },
  pastel: {
    primary: rgb(0.85, 0.6, 0.7),
    secondary: rgb(0.7, 0.8, 0.9),
    accent: rgb(0.8, 0.75, 0.9),
    background: rgb(1, 0.98, 0.98),
    lines: rgb(0.9, 0.85, 0.88),
  },
  boho: {
    primary: rgb(0.6, 0.45, 0.35),
    secondary: rgb(0.8, 0.7, 0.6),
    accent: rgb(0.4, 0.55, 0.4),
    background: rgb(0.98, 0.96, 0.93),
    lines: rgb(0.85, 0.8, 0.75),
  },
  modern: {
    primary: rgb(0.1, 0.2, 0.4),
    secondary: rgb(0.85, 0.75, 0.5),
    accent: rgb(0.3, 0.4, 0.6),
    background: rgb(1, 1, 1),
    lines: rgb(0.9, 0.9, 0.92),
  },
  floral: {
    primary: rgb(0.6, 0.35, 0.45),
    secondary: rgb(0.4, 0.6, 0.45),
    accent: rgb(0.85, 0.7, 0.75),
    background: rgb(0.99, 0.98, 0.97),
    lines: rgb(0.88, 0.85, 0.85),
  },
  dark: {
    primary: rgb(0.95, 0.95, 0.95),
    secondary: rgb(0.5, 0.9, 0.7),
    accent: rgb(0.9, 0.5, 0.6),
    background: rgb(0.12, 0.12, 0.15),
    lines: rgb(0.25, 0.25, 0.28),
  },
}

// Generate AI content for the planner
async function generatePlannerContent(plannerType, customTitle, pageCount) {
  const contentPrompts = {
    daily: 'Generate content for a daily planner page including: a morning routine section, hourly schedule (6am-10pm), to-do list section, notes area, and an inspirational quote.',
    weekly: 'Generate content for a weekly planner spread including: weekly goals section, Monday-Sunday layout, habit tracker for 7 habits, weekly reflection questions.',
    monthly: 'Generate content for a monthly calendar page including: month overview, monthly goals, important dates to remember, notes section.',
    habit: 'Generate content for a habit tracker including: 10 common habits to track, a 30-day grid layout description, motivation tips, and streak rewards.',
    budget: 'Generate content for a budget tracker including: income sources section, expense categories, savings goals, monthly summary calculations.',
    meal: 'Generate content for a meal planner including: weekly meal layout (breakfast, lunch, dinner, snacks), grocery list by category, meal prep tips.',
    fitness: 'Generate content for a fitness log including: workout splits, exercise tracking, progress measurements, personal records section.',
    gratitude: 'Generate content for a gratitude journal including: 5 daily gratitude prompts, positive affirmations section, weekly reflection.',
    goals: 'Generate content for a goal setting planner including: SMART goal template, quarterly objectives, action steps breakdown, progress milestones.',
    project: 'Generate content for a project planner including: project overview section, timeline/milestones, task breakdown, resource allocation, status tracking.',
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `Create content for a ${pageCount}-page ${plannerType} planner${customTitle ? ` titled "${customTitle}"` : ''}.

${contentPrompts[plannerType] || contentPrompts.weekly}

Provide:
1. A catchy title for the planner
2. Section headers for each page type
3. 3 inspirational quotes themed to this planner type
4. 5 tips for using this type of planner effectively

Format your response as JSON with keys: title, sections (array), quotes (array of 3), tips (array of 5)
IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up response if it contains markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const content = JSON.parse(text)
    return content
  } catch (error) {
    console.error('AI content generation error:', error)
    // Return default content if AI fails
    return {
      title: customTitle || `My ${plannerType.charAt(0).toUpperCase() + plannerType.slice(1)} Planner`,
      sections: ['Overview', 'Planning', 'Notes', 'Reflection'],
      quotes: [
        'Every moment is a fresh beginning.',
        'Small steps lead to big changes.',
        'Today is a new opportunity.'
      ],
      tips: [
        'Review your planner every morning',
        'Set realistic daily goals',
        'Celebrate small wins',
        'Be consistent with your entries',
        'Reflect weekly on your progress'
      ]
    }
  }
}

// Draw a daily planner page
async function drawDailyPage(page, fonts, colors, date, quote) {
  const { width, height } = page.getSize()
  const margin = 40
  
  // Header
  page.drawText(date || 'Daily Planner', {
    x: margin,
    y: height - 50,
    size: 24,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Time slots (6am - 10pm)
  const timeSlotHeight = 30
  const startY = height - 100
  const times = ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00']
  
  times.forEach((time, index) => {
    const y = startY - (index * timeSlotHeight)
    if (y > 150) {
      page.drawText(time, {
        x: margin,
        y: y,
        size: 10,
        font: fonts.regular,
        color: colors.secondary,
      })
      page.drawLine({
        start: { x: margin + 40, y: y - 5 },
        end: { x: width - margin, y: y - 5 },
        thickness: 0.5,
        color: colors.lines,
      })
    }
  })
  
  // To-do section
  page.drawText('To-Do List', {
    x: width - 180,
    y: height - 100,
    size: 12,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Checkboxes
  for (let i = 0; i < 8; i++) {
    const y = height - 130 - (i * 25)
    page.drawRectangle({
      x: width - 180,
      y: y,
      width: 12,
      height: 12,
      borderColor: colors.secondary,
      borderWidth: 1,
    })
    page.drawLine({
      start: { x: width - 160, y: y + 2 },
      end: { x: width - margin, y: y + 2 },
      thickness: 0.5,
      color: colors.lines,
    })
  }
  
  // Quote at bottom
  if (quote) {
    page.drawText(`"${quote}"`, {
      x: margin,
      y: 60,
      size: 10,
      font: fonts.regular,
      color: colors.accent,
      maxWidth: width - (margin * 2),
    })
  }
}

// Draw a weekly planner page
async function drawWeeklyPage(page, fonts, colors, weekNum, quote) {
  const { width, height } = page.getSize()
  const margin = 30
  
  // Header
  page.drawText(`Week ${weekNum || ''}`, {
    x: margin,
    y: height - 45,
    size: 22,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Days of week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayWidth = (width - (margin * 2)) / 4
  const dayHeight = (height - 150) / 2
  
  days.forEach((day, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const x = margin + (col * dayWidth)
    const y = height - 80 - (row * dayHeight)
    
    // Day box
    page.drawRectangle({
      x: x,
      y: y - dayHeight + 20,
      width: dayWidth - 10,
      height: dayHeight - 30,
      borderColor: colors.lines,
      borderWidth: 1,
    })
    
    // Day name
    page.drawText(day, {
      x: x + 5,
      y: y - 15,
      size: 11,
      font: fonts.bold,
      color: colors.primary,
    })
  })
  
  // Notes section (8th box)
  const notesX = margin + (3 * dayWidth)
  const notesY = height - 80 - dayHeight
  page.drawText('Notes & Goals', {
    x: notesX + 5,
    y: notesY - 15,
    size: 11,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Quote
  if (quote) {
    page.drawText(`"${quote}"`, {
      x: margin,
      y: 40,
      size: 9,
      font: fonts.regular,
      color: colors.accent,
      maxWidth: width - (margin * 2),
    })
  }
}

// Draw habit tracker page
async function drawHabitPage(page, fonts, colors, month, habits) {
  const { width, height } = page.getSize()
  const margin = 30
  
  page.drawText(`Habit Tracker - ${month || 'Month'}`, {
    x: margin,
    y: height - 45,
    size: 20,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Default habits if not provided
  const defaultHabits = habits || ['Exercise', 'Read', 'Meditate', 'Water', 'Sleep 8h', 'No Phone AM', 'Gratitude']
  const cellSize = 18
  const startY = height - 90
  const startX = margin + 100
  
  // Draw habit names
  defaultHabits.forEach((habit, index) => {
    const y = startY - (index * 28)
    page.drawText(habit, {
      x: margin,
      y: y,
      size: 10,
      font: fonts.regular,
      color: colors.primary,
    })
    
    // Draw 31 day boxes
    for (let day = 0; day < 31; day++) {
      const x = startX + (day * (cellSize + 2))
      if (x < width - margin) {
        page.drawRectangle({
          x: x,
          y: y - 5,
          width: cellSize,
          height: cellSize,
          borderColor: colors.lines,
          borderWidth: 0.5,
        })
      }
    }
  })
  
  // Day numbers header
  for (let day = 1; day <= 31; day++) {
    const x = startX + ((day - 1) * (cellSize + 2))
    if (x < width - margin) {
      page.drawText(day.toString(), {
        x: x + 4,
        y: startY + 15,
        size: 8,
        font: fonts.regular,
        color: colors.secondary,
      })
    }
  }
}

// Draw monthly calendar page
async function drawMonthlyPage(page, fonts, colors, monthName) {
  const { width, height } = page.getSize()
  const margin = 30
  
  page.drawText(monthName || 'Month', {
    x: margin,
    y: height - 50,
    size: 26,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Calendar grid
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const cellWidth = (width - (margin * 2)) / 7
  const cellHeight = 70
  const startY = height - 100
  
  // Day headers
  days.forEach((day, index) => {
    page.drawText(day, {
      x: margin + (index * cellWidth) + 10,
      y: startY,
      size: 11,
      font: fonts.bold,
      color: colors.primary,
    })
  })
  
  // Calendar cells (6 weeks)
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const x = margin + (day * cellWidth)
      const y = startY - 30 - (week * cellHeight)
      
      page.drawRectangle({
        x: x,
        y: y - cellHeight + 10,
        width: cellWidth - 2,
        height: cellHeight - 5,
        borderColor: colors.lines,
        borderWidth: 0.5,
      })
    }
  }
  
  // Notes section at bottom
  page.drawText('Monthly Goals & Notes', {
    x: margin,
    y: 120,
    size: 12,
    font: fonts.bold,
    color: colors.primary,
  })
  
  for (let i = 0; i < 4; i++) {
    page.drawLine({
      start: { x: margin, y: 100 - (i * 20) },
      end: { x: width - margin, y: 100 - (i * 20) },
      thickness: 0.5,
      color: colors.lines,
    })
  }
}

// Draw a generic lined page with title
async function drawLinedPage(page, fonts, colors, title, quote) {
  const { width, height } = page.getSize()
  const margin = 40
  
  page.drawText(title || 'Notes', {
    x: margin,
    y: height - 50,
    size: 18,
    font: fonts.bold,
    color: colors.primary,
  })
  
  // Draw lines
  const lineSpacing = 28
  const startY = height - 90
  
  for (let i = 0; startY - (i * lineSpacing) > 80; i++) {
    page.drawLine({
      start: { x: margin, y: startY - (i * lineSpacing) },
      end: { x: width - margin, y: startY - (i * lineSpacing) },
      thickness: 0.5,
      color: colors.lines,
    })
  }
  
  if (quote) {
    page.drawText(`"${quote}"`, {
      x: margin,
      y: 50,
      size: 9,
      font: fonts.regular,
      color: colors.accent,
    })
  }
}

export async function POST(request) {
  try {
    const { plannerType, designStyle, paperSize, pageCount, customTitle, customInstructions } = await request.json()

    console.log(`Generating ${plannerType} planner with ${pageCount} pages...`)

    // Generate AI content
    const aiContent = await generatePlannerContent(plannerType, customTitle, pageCount)
    console.log('AI content generated:', aiContent.title)

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const fonts = { regular: regularFont, bold: boldFont }
    const colors = DESIGN_COLORS[designStyle] || DESIGN_COLORS.minimal
    const size = PAPER_SIZES[paperSize] || PAPER_SIZES.letter

    // Title page
    const titlePage = pdfDoc.addPage([size.width, size.height])
    titlePage.drawRectangle({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      color: colors.background,
    })
    
    titlePage.drawText(aiContent.title, {
      x: size.width / 2 - 100,
      y: size.height / 2 + 50,
      size: 28,
      font: boldFont,
      color: colors.primary,
    })
    
    titlePage.drawText('Created with ProCreators', {
      x: size.width / 2 - 70,
      y: size.height / 2,
      size: 12,
      font: regularFont,
      color: colors.secondary,
    })

    // Generate content pages based on type
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const pagesToGenerate = Math.min(pageCount, 52) // Cap at 52 pages for performance

    for (let i = 0; i < pagesToGenerate; i++) {
      const page = pdfDoc.addPage([size.width, size.height])
      page.drawRectangle({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        color: colors.background,
      })
      
      const quote = aiContent.quotes[i % aiContent.quotes.length]

      switch (plannerType) {
        case 'daily':
          await drawDailyPage(page, fonts, colors, `Day ${i + 1}`, quote)
          break
        case 'weekly':
          await drawWeeklyPage(page, fonts, colors, i + 1, quote)
          break
        case 'monthly':
          await drawMonthlyPage(page, fonts, colors, months[i % 12])
          break
        case 'habit':
          await drawHabitPage(page, fonts, colors, months[i % 12])
          break
        default:
          await drawLinedPage(page, fonts, colors, aiContent.sections[i % aiContent.sections.length], quote)
      }
    }

    // Tips page at the end
    const tipsPage = pdfDoc.addPage([size.width, size.height])
    tipsPage.drawRectangle({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      color: colors.background,
    })
    
    tipsPage.drawText('Tips for Success', {
      x: 40,
      y: size.height - 50,
      size: 20,
      font: boldFont,
      color: colors.primary,
    })
    
    aiContent.tips.forEach((tip, index) => {
      tipsPage.drawText(`${index + 1}. ${tip}`, {
        x: 40,
        y: size.height - 100 - (index * 40),
        size: 12,
        font: regularFont,
        color: colors.primary,
        maxWidth: size.width - 80,
      })
    })

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Save to file
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
      title: aiContent.title,
      description: `${plannerType} planner with ${pageCount} pages`,
      filePath: `/planners/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: {
        plannerType,
        designStyle,
        paperSize,
        pageCount,
        generatedContent: aiContent,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    console.log(`Planner generated: ${filePath}`)

    return NextResponse.json({
      success: true,
      title: aiContent.title,
      downloadUrl: `/planners/${fileName}`,
      pageCount: pagesToGenerate + 2, // +2 for title and tips pages
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
