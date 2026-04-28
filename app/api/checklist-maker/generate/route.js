import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { generateCoverImage, getChecklistTheme } from '@/lib/cover-image-generator'
import { drawCoverPageWithImage, drawCoverPage } from '@/lib/pdf-design'
import { getSizeById } from '@/lib/paper-sizes'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'

const TOOL_ID = 'checklist-maker'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY)

// Checklist/Tracker types
const CHECKLIST_TYPES = {
  'habit': { name: 'Habit Tracker', icon: '✓', description: 'Track daily habits' },
  'goal': { name: 'Goal Tracker', icon: '🎯', description: 'Track progress towards goals' },
  'cleaning': { name: 'Cleaning Checklist', icon: '🧹', description: 'Home cleaning tasks' },
  'travel': { name: 'Travel Packing List', icon: '✈️', description: 'Travel preparation' },
  'grocery': { name: 'Grocery List', icon: '🛒', description: 'Shopping list template' },
  'project': { name: 'Project Checklist', icon: '📋', description: 'Project task tracking' },
  'morning': { name: 'Morning Routine', icon: '☀️', description: 'Morning routine tracker' },
  'evening': { name: 'Evening Routine', icon: '🌙', description: 'Evening wind-down routine' },
  'fitness': { name: 'Fitness Tracker', icon: '💪', description: 'Workout and exercise tracking' },
  'savings': { name: 'Savings Tracker', icon: '💰', description: 'Money saving goals' }
}

// Generate checklist items with AI
async function generateChecklistContent(checklistType, customItems, itemCount) {
  const config = CHECKLIST_TYPES[checklistType] || CHECKLIST_TYPES['habit']
  
  // If user provided custom items, use them directly
  if (customItems && customItems.trim()) {
    const userItems = customItems.split('\n').filter(line => line.trim()).map(line => line.trim())
    return {
      title: `My ${config.name}`,
      subtitle: config.description,
      categories: [
        { name: 'My Items', items: userItems }
      ],
      tips: ['Check items as you complete them', 'Review your progress regularly', 'Celebrate your achievements']
    }
  }
  
  // Otherwise try AI generation
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `Create a comprehensive ${config.name} with ${itemCount || 20} items.

Generate:
1. A catchy title
2. ${itemCount || 20} checklist items organized by category
3. Tips for using this tracker effectively

For habit trackers: Include common positive habits
For goal trackers: Include SMART goal elements
For cleaning: Organize by room
For travel: Organize by category (clothes, toiletries, electronics, documents)

Format as JSON:
{
  "title": "...",
  "subtitle": "...",
  "categories": [
    {
      "name": "Category Name",
      "items": ["item1", "item2", ...]
    }
  ],
  "tips": ["tip1", "tip2", "tip3"]
}

IMPORTANT: Return ONLY valid JSON.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('AI checklist generation error:', error)
    // Fallback with sensible defaults based on type
    const defaultItems = {
      'habit': ['Exercise 30 minutes', 'Read for 20 minutes', 'Drink 8 glasses of water', 'Meditate 10 minutes', 'No social media before noon', 'Walk 10,000 steps', 'Practice gratitude', 'Sleep by 10pm'],
      'fitness': ['Warm-up', 'Cardio', 'Strength training', 'Core workout', 'Stretching', 'Track calories', 'Drink water', 'Log workout'],
      'cleaning': ['Make beds', 'Do dishes', 'Wipe counters', 'Vacuum floors', 'Take out trash', 'Do laundry', 'Clean bathroom', 'Organize clutter'],
      'travel': ['Passport', 'Phone charger', 'Toiletries', 'Medications', 'Clothes', 'Camera', 'Snacks', 'Travel documents'],
      'morning': ['Wake up early', 'Drink water', 'Exercise', 'Healthy breakfast', 'Review goals', 'Shower', 'Plan the day', 'Positive affirmations'],
      'evening': ['Review the day', 'Prepare tomorrow', 'Light stretching', 'No screens 1hr before bed', 'Read a book', 'Gratitude journal', 'Skincare routine', 'Sleep on time'],
      'goal': ['Define clear goal', 'Set deadline', 'Break into tasks', 'Track progress', 'Review weekly', 'Adjust as needed', 'Celebrate milestones', 'Stay consistent'],
      'savings': ['Track expenses', 'Set budget', 'Save 10%', 'Cut unnecessary costs', 'Pack lunch', 'Cancel unused subscriptions', 'Shop with list', 'Compare prices']
    }
    
    return {
      title: config.name,
      subtitle: config.description,
      categories: [
        { name: 'Main Items', items: defaultItems[checklistType] || defaultItems['habit'] }
      ],
      tips: ['Check items as you complete them', 'Review regularly', 'Celebrate progress']
    }
  }
}

export async function POST(request) {
  let transactionId = null
  let userId = null
  
  try {
    // SECURITY: Get user ID and check credits
    userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to use this tool.'
      }, { status: 401 })
    }
    
    const creditCheck = await checkCredits(userId, TOOL_ID)
    if (!creditCheck.hasEnough) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. This tool costs ${creditCheck.cost} credits, but you have ${creditCheck.currentBalance}.`,
        creditInfo: creditCheck
      }, { status: 402 })
    }
    
    // Deduct credits before generation
    const deductResult = await deductCredits(userId, TOOL_ID)
    if (!deductResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process credits. Please try again.'
      }, { status: 500 })
    }
    transactionId = deductResult.transactionId

    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { 
      checklistType, 
      customItems, 
      itemCount, 
      designStyle, 
      paperSize, 
      trackingDays,
      coverImageStyle = 'abstract',
      customImagePrompt,
      customTitle
    } = await request.json()
    
    const content = await generateChecklistContent(checklistType, customItems, itemCount)
    
    // Override title if custom title provided
    if (customTitle) {
      content.title = customTitle
    }
    
    // Generate cover image
    let coverImageUrl = null
    if (coverImageStyle !== 'gradient') {
      try {
        if (coverImageStyle === 'custom' && customImagePrompt) {
          const imageResult = await generateCoverImage('default-elegant', customImagePrompt)
          if (imageResult.success && imageResult.imageUrl) {
            coverImageUrl = imageResult.imageUrl
            }
        } else {
          const themeKey = getChecklistTheme(checklistType)
          const imageResult = await generateCoverImage(themeKey)
          if (imageResult.success && imageResult.imageUrl) {
            coverImageUrl = imageResult.imageUrl
            }
        }
      } catch (imgError) {
        }
    }
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Use new paper size system
    const sizeConfig = getSizeById(paperSize)
    const { width, height } = sizeConfig?.points || { width: 612, height: 792 }
    
    // Calculate margins based on page count (KDP compliance)
    const { getMargins } = await import('@/lib/paper-sizes')
    const estimatedPages = Math.max(24, Math.ceil((trackingDays || 30) / 7) + 4)
    const margins = getMargins(estimatedPages, false)
    const margin = margins.inside.points
    
    const colors = {
      modern: { primary: rgb(0.1, 0.1, 0.3), accent: rgb(0.3, 0.5, 0.8), bg: rgb(0.95, 0.97, 1) },
      minimal: { primary: rgb(0, 0, 0), accent: rgb(0.5, 0.5, 0.5), bg: rgb(1, 1, 1) },
      colorful: { primary: rgb(0.4, 0.2, 0.5), accent: rgb(0.8, 0.4, 0.6), bg: rgb(1, 0.98, 0.98) },
      nature: { primary: rgb(0.2, 0.4, 0.2), accent: rgb(0.4, 0.6, 0.3), bg: rgb(0.97, 1, 0.97) }
    }
    const scheme = colors[designStyle] || colors.modern
    
    // Is this a tracking type (needs grid)?
    const isTracker = ['habit', 'fitness', 'savings', 'goal', 'morning', 'evening'].includes(checklistType)
    // KDP requires minimum 24 pages - default to 30 days minimum for trackers
    const days = Math.max(trackingDays || 30, 30)
    
    // Add cover page with image if available
    if (coverImageUrl) {
      const coverPage = pdfDoc.addPage([width, height])
      const colorSchemeMap = {
        modern: {
          primary: rgb(0.1, 0.1, 0.3),
          secondary: rgb(0.3, 0.5, 0.8),
          accent: rgb(0.7, 0.85, 0.95),
          background: rgb(0.95, 0.97, 1),
          text: rgb(0.1, 0.1, 0.2)
        },
        minimal: {
          primary: rgb(0.1, 0.1, 0.1),
          secondary: rgb(0.4, 0.4, 0.4),
          accent: rgb(0.85, 0.85, 0.85),
          background: rgb(1, 1, 1),
          text: rgb(0.1, 0.1, 0.1)
        },
        colorful: {
          primary: rgb(0.5, 0.2, 0.6),
          secondary: rgb(0.8, 0.4, 0.6),
          accent: rgb(0.95, 0.85, 0.9),
          background: rgb(1, 0.98, 0.98),
          text: rgb(0.3, 0.15, 0.35)
        },
        nature: {
          primary: rgb(0.2, 0.45, 0.25),
          secondary: rgb(0.4, 0.6, 0.4),
          accent: rgb(0.85, 0.92, 0.85),
          background: rgb(0.97, 1, 0.97),
          text: rgb(0.15, 0.25, 0.15)
        }
      }
      
      try {
        await drawCoverPageWithImage(coverPage, pdfDoc, {
          width,
          height,
          title: content.title,
          subtitle: content.subtitle || 'Track your progress',
          authorName: '',
          year: new Date().getFullYear(),
          colors: colorSchemeMap[designStyle] || colorSchemeMap.colorful,
          coverStyle: { hasFrame: false, hasPattern: false },
          boldFont,
          regularFont,
          coverImageUrl
        })
        } catch (coverError) {
        console.error('Error adding cover page:', coverError.message)
      }
    }
    
    if (isTracker) {
      // Create tracker grid
      let page = pdfDoc.addPage([width, height])
      let y = height - margin
      
      // Title
      page.drawText(content.title, {
        x: margin,
        y,
        size: 22,
        font: boldFont,
        color: scheme.primary
      })
      y -= 25
      page.drawText(content.subtitle || 'Track your progress', {
        x: margin,
        y,
        size: 11,
        font: regularFont,
        color: scheme.accent
      })
      y -= 40
      
      // Month/Date header
      page.drawText('Month: _____________', { x: margin, y, size: 10, font: regularFont })
      y -= 30
      
      // Grid header (days 1-31 or custom)
      const cellWidth = Math.min(18, (width - margin * 2 - 150) / Math.min(days, 31))
      const itemColWidth = 150
      
      // Day numbers
      page.drawText('Habit', { x: margin, y, size: 9, font: boldFont })
      for (let d = 1; d <= Math.min(days, 31); d++) {
        page.drawText(d.toString(), {
          x: margin + itemColWidth + (d - 1) * cellWidth + 4,
          y,
          size: 8,
          font: regularFont,
          color: scheme.accent
        })
      }
      y -= 15
      
      // Draw tracking rows
      const allItems = content.categories.flatMap(c => c.items)
      allItems.slice(0, 15).forEach((item, idx) => {
        if (y < margin + 50) {
          page = pdfDoc.addPage([width, height])
          y = height - margin - 30
        }
        
        // Item name (truncate if needed)
        const displayItem = item.length > 18 ? item.substring(0, 18) + '...' : item
        page.drawText(displayItem, {
          x: margin,
          y: y + 3,
          size: 9,
          font: regularFont,
          color: scheme.primary
        })
        
        // Checkboxes
        for (let d = 1; d <= Math.min(days, 31); d++) {
          page.drawRectangle({
            x: margin + itemColWidth + (d - 1) * cellWidth,
            y: y - 2,
            width: cellWidth - 2,
            height: cellWidth - 2,
            borderColor: scheme.accent,
            borderWidth: 0.5
          })
        }
        
        y -= cellWidth + 5
      })
      
      // Tips at bottom
      y -= 30
      page.drawText('Tips:', { x: margin, y, size: 10, font: boldFont, color: scheme.primary })
      y -= 18
      content.tips.forEach(tip => {
        page.drawText(`- ${tip}`, { x: margin + 10, y, size: 9, font: regularFont })
        y -= 14
      })
      
    } else {
      // Regular checklist
      let page = pdfDoc.addPage([width, height])
      let y = height - margin
      
      // Title
      page.drawText(content.title, {
        x: margin,
        y,
        size: 22,
        font: boldFont,
        color: scheme.primary
      })
      y -= 40
      
      // Categories and items
      for (const category of content.categories) {
        if (y < margin + 100) {
          page = pdfDoc.addPage([width, height])
          y = height - margin
        }
        
        // Category header
        page.drawText(category.name, {
          x: margin,
          y,
          size: 14,
          font: boldFont,
          color: scheme.accent
        })
        y -= 25
        
        // Items with checkboxes
        for (const item of category.items) {
          if (y < margin + 30) {
            page = pdfDoc.addPage([width, height])
            y = height - margin
          }
          
          // Checkbox
          page.drawRectangle({
            x: margin,
            y: y - 3,
            width: 14,
            height: 14,
            borderColor: scheme.primary,
            borderWidth: 1
          })
          
          // Item text
          page.drawText(item, {
            x: margin + 24,
            y,
            size: 11,
            font: regularFont,
            color: scheme.primary
          })
          
          y -= 22
        }
        
        y -= 15
      }
      
      // Notes section
      if (y > margin + 100) {
        y -= 20
        page.drawText('Notes:', { x: margin, y, size: 12, font: boldFont, color: scheme.primary })
        y -= 20
        for (let l = 0; l < 5; l++) {
          page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: scheme.accent
          })
          y -= 25
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save()
    
    // Save file
    const outputDir = '/app/public/checklists'
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
      type: 'checklist',
      category: 'document',
      title: content.title,
      description: `${checklistType} checklist/tracker`,
      filePath: `/checklists/${fileName}`,
      fileSize: pdfBytes.length,
      metadata: { checklistType, itemCount, designStyle },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    
    // Complete transaction on success

    
    if (transactionId) await completeTransaction(transactionId)

    
    return NextResponse.json({
      success: true,
      title: content.title,
      downloadUrl: `/checklists/${fileName}`,
      pageCount: pdfDoc.getPageCount(),
      libraryId: documentId
    })
    
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Checklist generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate checklist' },
      { status: 500 }
    )
  }
}
