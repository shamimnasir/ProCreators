import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/mongodb'

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 }
}

// Helper to strip emojis and non-ASCII characters for PDF (WinAnsi encoding limitation)
function stripEmojis(text) {
  if (!text) return ''
  // Remove emojis and other non-ASCII characters, keep basic ASCII
  return String(text)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, Hot beverage
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // High voltage
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Soccer, Baseball
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman, Sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, Golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[^\x00-\x7F]/g, '')           // Remove any remaining non-ASCII
    .trim()
}

// Generate Notion-compatible JSON
function generateNotionJSON(template) {
  const notionBlock = {
    object: 'block',
    type: 'page',
    page: {
      title: template.title,
      icon: template.emoji ? { type: 'emoji', emoji: template.emoji } : null,
      cover: template.includeCover ? {
        type: 'external',
        external: { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200' }
      } : null
    },
    children: [
      {
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: template.title } }]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: template.description } }]
        }
      },
      {
        object: 'block',
        type: 'divider',
        divider: {}
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '📊 Database' } }]
        }
      }
    ]
  }

  // Add database schema
  const databaseSchema = {
    object: 'database',
    title: [{ type: 'text', text: { content: template.title } }],
    icon: template.emoji ? { type: 'emoji', emoji: template.emoji } : null,
    properties: {}
  }

  // Build properties
  template.properties.forEach(prop => {
    const propConfig = { name: prop.name }
    
    switch (prop.type) {
      case 'title':
        propConfig.type = 'title'
        propConfig.title = {}
        break
      case 'text':
        propConfig.type = 'rich_text'
        propConfig.rich_text = {}
        break
      case 'number':
        propConfig.type = 'number'
        propConfig.number = { format: 'number' }
        break
      case 'select':
        propConfig.type = 'select'
        propConfig.select = {
          options: (prop.options || []).map(opt => ({ name: opt, color: 'default' }))
        }
        break
      case 'multi_select':
        propConfig.type = 'multi_select'
        propConfig.multi_select = {
          options: (prop.options || []).map(opt => ({ name: opt, color: 'default' }))
        }
        break
      case 'date':
        propConfig.type = 'date'
        propConfig.date = {}
        break
      case 'checkbox':
        propConfig.type = 'checkbox'
        propConfig.checkbox = {}
        break
      case 'url':
        propConfig.type = 'url'
        propConfig.url = {}
        break
      case 'email':
        propConfig.type = 'email'
        propConfig.email = {}
        break
      case 'person':
        propConfig.type = 'people'
        propConfig.people = {}
        break
      case 'files':
        propConfig.type = 'files'
        propConfig.files = {}
        break
      default:
        propConfig.type = 'rich_text'
        propConfig.rich_text = {}
    }
    
    databaseSchema.properties[prop.name] = propConfig
  })

  // Add views
  databaseSchema.views = template.views.map(view => ({
    type: view.type,
    name: view.name,
    ...(view.groupBy && { group_by: view.groupBy }),
    ...(view.dateProperty && { date_property: view.dateProperty })
  }))

  // Add sample data if available
  const sampleItems = []
  if (template.sampleData && template.sampleData.length > 0) {
    template.sampleData.forEach(row => {
      const item = {
        object: 'page',
        properties: {}
      }
      
      template.properties.forEach(prop => {
        const value = row[prop.name]
        if (value !== undefined && value !== null) {
          switch (prop.type) {
            case 'title':
              item.properties[prop.name] = {
                title: [{ text: { content: String(value) } }]
              }
              break
            case 'text':
              item.properties[prop.name] = {
                rich_text: [{ text: { content: String(value) } }]
              }
              break
            case 'number':
              item.properties[prop.name] = {
                number: Number(value)
              }
              break
            case 'select':
              item.properties[prop.name] = {
                select: { name: String(value) }
              }
              break
            case 'multi_select':
              item.properties[prop.name] = {
                multi_select: Array.isArray(value) 
                  ? value.map(v => ({ name: v }))
                  : [{ name: String(value) }]
              }
              break
            case 'checkbox':
              item.properties[prop.name] = {
                checkbox: Boolean(value)
              }
              break
            default:
              item.properties[prop.name] = {
                rich_text: [{ text: { content: String(value) } }]
              }
          }
        }
      })
      
      sampleItems.push(item)
    })
  }

  return {
    version: '1.0',
    type: 'notion_template',
    template: {
      ...notionBlock,
      database: databaseSchema,
      sample_data: sampleItems
    },
    metadata: {
      name: template.title,
      description: template.description,
      category: template.category,
      subcategory: template.subcategory,
      created_at: template.createdAt,
      properties_count: template.properties.length,
      views_count: template.views.length,
      sample_data_count: sampleItems.length
    },
    import_instructions: {
      step1: 'Open Notion and navigate to your workspace',
      step2: 'Click "Import" from the sidebar menu',
      step3: 'Select this JSON file or paste the content',
      step4: 'The template will be created as a new page with the database',
      note: 'You may need to use the Notion API for programmatic import'
    }
  }
}

// Generate CSV export (Notion-compatible) - exports all databases
function generateCSV(template) {
  const escapeCSV = (val) => {
    if (val === undefined || val === null) return ''
    let str = String(val)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      str = '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  
  let allCSV = ''
  
  // If we have multiple databases, export the first one (main database)
  // For more complex exports, we'd need multiple files
  const databases = template.databases && template.databases.length > 0 
    ? template.databases 
    : [{ name: template.title, properties: template.properties, sampleData: template.sampleData }]
  
  // Export the primary database
  const mainDb = databases[0]
  const headers = (mainDb.properties || []).map(p => p.name)
  
  if (headers.length === 0) {
    return 'Name\nSample Item 1\nSample Item 2\n'
  }
  
  allCSV = headers.map(h => escapeCSV(h)).join(',') + '\n'
  
  const sampleData = mainDb.sampleData || []
  if (sampleData.length > 0) {
    sampleData.forEach(row => {
      const cells = headers.map(h => {
        const val = row[h]
        if (Array.isArray(val)) return escapeCSV(val.join(', '))
        return escapeCSV(val)
      })
      allCSV += cells.join(',') + '\n'
    })
  } else {
    allCSV += headers.map(() => '').join(',') + '\n'
  }
  
  return allCSV
}

// Generate comprehensive Markdown Setup Guide
function generateMarkdown(template) {
  let md = ''
  
  // Header
  md += `# ${template.emoji || ''} ${template.title}\n\n`
  
  if (template.tagline) {
    md += `> **${template.tagline}**\n\n`
  }
  
  md += `${template.description || ''}\n\n`
  
  // Important Notice Box
  md += `---\n\n`
  md += `## IMPORTANT: This is a Setup Guide\n\n`
  md += `This document is a **blueprint** to help you build the complete template in Notion.\n\n`
  md += `**What this file provides:**\n`
  md += `- Complete database structures with all properties\n`
  md += `- Sample data you can copy\n`
  md += `- Step-by-step setup instructions\n`
  md += `- View configurations to create\n\n`
  md += `**What you need to do manually in Notion:**\n`
  md += `- Create the databases (one for each listed below)\n`
  md += `- Add the properties with correct types\n`
  md += `- Create views (Board, Calendar, etc.)\n`
  md += `- Add a cover image and icon\n`
  md += `- Arrange the dashboard layout\n\n`
  md += `*Estimated setup time: 15-30 minutes*\n\n`
  md += `---\n\n`
  
  // Quick Start Guide
  md += `## Quick Start Guide\n\n`
  md += `### Step 1: Create a New Page\n`
  md += `1. Open Notion and create a new page\n`
  md += `2. Add an icon: ${template.emoji || '📋'}\n`
  md += `3. Add a cover image (gradient or photo)\n`
  md += `4. Title it: "${template.title}"\n\n`
  
  // Getting Started content
  if (template.gettingStarted && template.gettingStarted.length > 0) {
    md += `### Step 2: Understand the System\n\n`
    template.gettingStarted.forEach((step, idx) => {
      md += `${step}\n\n`
    })
  }
  
  md += `---\n\n`
  
  // Databases Section - DETAILED
  const databases = template.databases && template.databases.length > 0 
    ? template.databases 
    : [{ name: 'Main Database', emoji: '📊', properties: template.properties, sampleData: template.sampleData }]
  
  md += `## Databases to Create (${databases.length})\n\n`
  md += `Create each database as an **inline database** on your main page.\n\n`
  
  databases.forEach((db, idx) => {
    md += `### Database ${idx + 1}: ${db.emoji || '📊'} ${db.name}\n\n`
    
    if (db.description) {
      md += `**Purpose:** ${db.description}\n\n`
    }
    
    // Setup Instructions
    md += `**How to create:**\n`
    md += `1. Type \`/database\` and select "Database - Inline"\n`
    md += `2. Name it "${db.name}"\n`
    md += `3. Add the properties below\n\n`
    
    // Properties table with setup instructions
    if (db.properties && db.properties.length > 0) {
      md += `**Properties to add:**\n\n`
      md += `| # | Property Name | Type | How to Set Up |\n`
      md += `|---|--------------|------|---------------|\n`
      
      db.properties.forEach((prop, propIdx) => {
        let setupInstructions = ''
        switch (prop.type) {
          case 'title':
            setupInstructions = 'Already exists as "Name" - rename it'
            break
          case 'select':
            setupInstructions = `Add options: ${(prop.options || []).slice(0, 3).join(', ')}${(prop.options || []).length > 3 ? '...' : ''}`
            break
          case 'multi_select':
            setupInstructions = `Multi-select with: ${(prop.options || []).slice(0, 3).join(', ')}${(prop.options || []).length > 3 ? '...' : ''}`
            break
          case 'number':
            setupInstructions = 'Number format (or currency if money)'
            break
          case 'date':
            setupInstructions = 'Date property'
            break
          case 'checkbox':
            setupInstructions = 'Checkbox'
            break
          case 'url':
            setupInstructions = 'URL property'
            break
          case 'email':
            setupInstructions = 'Email property'
            break
          case 'person':
            setupInstructions = 'Person property'
            break
          case 'files':
            setupInstructions = 'Files & media'
            break
          case 'relation':
            setupInstructions = 'Relation to another database'
            break
          case 'formula':
            setupInstructions = 'Formula (configure after other properties)'
            break
          default:
            setupInstructions = `${prop.type} property`
        }
        md += `| ${propIdx + 1} | ${prop.icon || ''} ${prop.name} | ${prop.type} | ${setupInstructions} |\n`
      })
      md += '\n'
      
      // Select/Multi-select options detail
      const selectProps = db.properties.filter(p => p.type === 'select' || p.type === 'multi_select')
      if (selectProps.length > 0) {
        md += `**Select/Multi-select Options:**\n\n`
        selectProps.forEach(prop => {
          if (prop.options && prop.options.length > 0) {
            md += `- **${prop.name}**: ${prop.options.join(', ')}\n`
          }
        })
        md += '\n'
      }
    }
    
    // Sample Data
    if (db.sampleData && db.sampleData.length > 0) {
      md += `**Sample Data (copy these entries):**\n\n`
      const headers = (db.properties || []).slice(0, 5).map(p => p.name)
      md += `| ${headers.join(' | ')} |\n`
      md += `| ${headers.map(() => '---').join(' | ')} |\n`
      
      db.sampleData.forEach(row => {
        const cells = headers.map(h => {
          const val = row[h]
          if (val === undefined || val === null) return '-'
          if (Array.isArray(val)) return val.slice(0, 2).join(', ')
          return String(val).substring(0, 35)
        })
        md += `| ${cells.join(' | ')} |\n`
      })
      md += '\n'
    }
    
    md += `---\n\n`
  })
  
  // Views Section
  const allViews = template.allViews || template.views || []
  if (allViews.length > 0) {
    md += `## Views to Create\n\n`
    md += `After creating your databases, add these views for better organization:\n\n`
    
    allViews.forEach((view, idx) => {
      md += `### View ${idx + 1}: ${view.name}\n`
      md += `- **Type:** ${view.type.charAt(0).toUpperCase() + view.type.slice(1)} view\n`
      if (view.groupBy) md += `- **Group by:** ${view.groupBy}\n`
      if (view.filter) md += `- **Filter:** ${view.filter}\n`
      if (view.database) md += `- **Database:** ${view.database}\n`
      
      // How to create this view
      md += `- **How to create:** Click "+ Add a view" > Select "${view.type}" > Configure grouping/filters\n`
      md += '\n'
    })
    
    md += `---\n\n`
  }
  
  // Dashboard Layout Section
  if (template.dashboardSections && template.dashboardSections.length > 0) {
    md += `## Dashboard Layout\n\n`
    md += `Arrange these sections on your main page for an organized dashboard:\n\n`
    
    template.dashboardSections.forEach((section, idx) => {
      md += `### ${idx + 1}. ${section.title}\n`
      md += `- **Purpose:** ${section.description}\n`
      md += `- **Type:** ${section.type}\n`
      
      switch (section.type) {
        case 'chart':
          md += `- **How to create:** Use a linked database view with chart visualization, or embed a chart widget\n`
          break
        case 'metric':
          md += `- **How to create:** Use a callout block with the number, or a formula rollup\n`
          break
        case 'progress':
          md += `- **How to create:** Use progress bars or a linked database showing completion status\n`
          break
        case 'funnel':
          md += `- **How to create:** Use a Board view grouped by status/stage\n`
          break
        case 'list':
        case 'table':
          md += `- **How to create:** Add a linked database with filtered view\n`
          break
        case 'calendar':
          md += `- **How to create:** Add a Calendar view of the relevant database\n`
          break
        default:
          md += `- **How to create:** Add appropriate Notion blocks or linked database views\n`
      }
      md += '\n'
    })
    
    md += `---\n\n`
  }
  
  // Tips Section
  md += `## Pro Tips\n\n`
  md += `**Make it look professional:**\n`
  md += `- Add a gradient cover image (Unsplash has great free ones)\n`
  md += `- Use consistent emoji icons for all databases\n`
  md += `- Create a "Quick Actions" section with buttons using callout blocks\n`
  md += `- Use dividers and headings to organize sections\n`
  md += `- Add a toggle for the "Getting Started" guide\n\n`
  
  md += `**Improve functionality:**\n`
  md += `- Set up Relations between databases (e.g., Deals -> Companies)\n`
  md += `- Create Rollup properties to show related data\n`
  md += `- Use Formula properties for calculations\n`
  md += `- Create filtered views for "My Items" or "This Week"\n`
  md += `- Pin your most-used views\n\n`
  
  md += `---\n\n`
  md += `## Need Help?\n\n`
  md += `- [Notion Help Center](https://notion.so/help)\n`
  md += `- [Notion Database Guide](https://notion.so/help/databases)\n`
  md += `- [Notion Templates Gallery](https://notion.so/templates)\n\n`
  
  md += `---\n\n`
  md += `*Template blueprint generated with Notion Template Maker*\n`
  md += `*Follow the steps above to recreate this ${databases.length}-database system*\n`
  
  return md
}

// Generate PDF preview
async function generatePDF(template, colorTheme) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Get colors from theme
  const bgColor = colorTheme?.colors?.bg || '#ffffff'
  const primaryColor = colorTheme?.colors?.primary || '#000000'
  const accentColor = colorTheme?.colors?.accent || '#2383e2'
  
  const bgRgb = hexToRgb(bgColor)
  const primaryRgb = hexToRgb(primaryColor)
  const accentRgb = hexToRgb(accentColor)
  
  // Page 1: Cover
  let page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()
  
  // Background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: rgb(bgRgb.r, bgRgb.g, bgRgb.b)
  })
  
  // Accent bar at top
  page.drawRectangle({
    x: 0, y: height - 150, width, height: 150,
    color: rgb(accentRgb.r, accentRgb.g, accentRgb.b)
  })
  
  // Title - strip emojis for PDF compatibility
  const title = stripEmojis(template.title) || 'Notion Template'
  const titleFontSize = Math.min(36, 500 / (title.length * 0.5))
  page.drawText(title, {
    x: 50, y: height - 100,
    size: titleFontSize,
    font: fontBold,
    color: rgb(1, 1, 1)
  })
  
  // Subtitle
  page.drawText('Notion Template', {
    x: 50, y: height - 130,
    size: 14,
    font: font,
    color: rgb(1, 1, 1)
  })
  
  // Description - strip emojis
  const desc = stripEmojis(template.description) || ''
  const descLines = desc.match(/.{1,70}/g) || []
  descLines.slice(0, 3).forEach((line, i) => {
    page.drawText(stripEmojis(line), {
      x: 50, y: height - 200 - (i * 20),
      size: 12,
      font: font,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    })
  })
  
  // Properties section
  let yPos = height - 300
  page.drawText('Database Properties', {
    x: 50, y: yPos,
    size: 18,
    font: fontBold,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  })
  
  yPos -= 30
  template.properties.forEach((prop, idx) => {
    if (yPos < 100) return
    
    // Use bullet point instead of emoji icon for PDF
    const propText = `* ${stripEmojis(prop.name)} (${prop.type})`
    page.drawText(propText, {
      x: 70, y: yPos,
      size: 11,
      font: font,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    })
    
    if (prop.options && prop.options.length > 0) {
      const optionsText = `   Options: ${prop.options.slice(0, 4).map(o => stripEmojis(o)).join(', ')}${prop.options.length > 4 ? '...' : ''}`
      yPos -= 15
      page.drawText(optionsText, {
        x: 90, y: yPos,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
    
    yPos -= 20
  })
  
  // Views section
  yPos -= 20
  if (yPos > 150) {
    page.drawText('Views Included', {
      x: 50, y: yPos,
      size: 18,
      font: fontBold,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    })
    
    yPos -= 25
    template.views.forEach(view => {
      if (yPos < 100) return
      page.drawText(`* ${stripEmojis(view.name)} (${view.type})`, {
        x: 70, y: yPos,
        size: 11,
        font: font,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
      })
      yPos -= 18
    })
  }
  
  // Footer
  page.drawText('Created with Notion Template Maker', {
    x: 50, y: 40,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  })
  
  // Page 2: Sample Data (if available)
  if (template.sampleData && template.sampleData.length > 0) {
    page = pdfDoc.addPage([612, 792])
    
    // Background
    page.drawRectangle({
      x: 0, y: 0, width, height,
      color: rgb(bgRgb.r, bgRgb.g, bgRgb.b)
    })
    
    // Header
    page.drawText('Sample Data Preview', {
      x: 50, y: height - 50,
      size: 24,
      font: fontBold,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    })
    
    // Table headers
    yPos = height - 100
    const cols = template.properties.slice(0, 4)
    const colWidth = (width - 100) / cols.length
    
    // Header row background
    page.drawRectangle({
      x: 45, y: yPos - 5, width: width - 90, height: 25,
      color: rgb(accentRgb.r, accentRgb.g, accentRgb.b, 0.1)
    })
    
    cols.forEach((col, i) => {
      page.drawText(stripEmojis(col.name), {
        x: 50 + (i * colWidth),
        y: yPos,
        size: 10,
        font: fontBold,
        color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
      })
    })
    
    // Data rows
    yPos -= 30
    template.sampleData.slice(0, 10).forEach((row, rowIdx) => {
      if (yPos < 100) return
      
      cols.forEach((col, i) => {
        let val = row[col.name]
        if (val === undefined || val === null) val = '-'
        if (Array.isArray(val)) val = val.join(', ')
        val = stripEmojis(String(val).substring(0, 20))
        
        page.drawText(val, {
          x: 50 + (i * colWidth),
          y: yPos,
          size: 9,
          font: font,
          color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        })
      })
      
      yPos -= 20
    })
    
    // Footer
    page.drawText('Sample data for preview purposes', {
      x: 50, y: 40,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    })
  }
  
  return await pdfDoc.save()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { template, format, colorTheme } = body
    
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template required' }, { status: 400 })
    }
    
    const fileId = uuidv4()
    let result = { success: true }
    
    switch (format) {
      case 'json': {
        const json = generateNotionJSON(template)
        result.json = json
        
        // Also save as file
        const outputDir = path.join(process.cwd(), 'public', 'notion-templates')
        await fs.mkdir(outputDir, { recursive: true })
        
        const filename = `${fileId}.json`
        await fs.writeFile(
          path.join(outputDir, filename),
          JSON.stringify(json, null, 2)
        )
        
        result.downloadUrl = `/notion-templates/${filename}`
        break
      }
      
      case 'pdf': {
        const pdfBytes = await generatePDF(template, colorTheme)
        
        const outputDir = path.join(process.cwd(), 'public', 'notion-templates')
        await fs.mkdir(outputDir, { recursive: true })
        
        const filename = `${fileId}.pdf`
        await fs.writeFile(path.join(outputDir, filename), pdfBytes)
        
        result.downloadUrl = `/notion-templates/${filename}`
        break
      }
      
      case 'markdown': {
        const markdown = generateMarkdown(template)
        result.markdown = markdown
        
        const outputDir = path.join(process.cwd(), 'public', 'notion-templates')
        await fs.mkdir(outputDir, { recursive: true })
        
        const filename = `${fileId}.md`
        await fs.writeFile(path.join(outputDir, filename), markdown)
        
        result.downloadUrl = `/notion-templates/${filename}`
        break
      }
      
      case 'csv': {
        const csv = generateCSV(template)
        result.csv = csv
        
        const outputDir = path.join(process.cwd(), 'public', 'notion-templates')
        await fs.mkdir(outputDir, { recursive: true })
        
        const filename = `${fileId}.csv`
        await fs.writeFile(path.join(outputDir, filename), csv)
        
        result.downloadUrl = `/notion-templates/${filename}`
        break
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 })
    }
    
    // Save to library
    try {
      const libraryCollection = await getCollection('library')
      const documentId = uuidv4()
      
      await libraryCollection.insertOne({
        id: documentId,
        userId: 'default-user',
        type: 'notion-template',
        category: 'document',
        title: template.name || 'Notion Template',
        description: `${template.category} template - ${format.toUpperCase()} export`,
        filePath: result.downloadUrl,
        fileSize: 0,
        metadata: { 
          category: template.category,
          format,
          templateType: template.type
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      console.log(`Notion template saved to library: ${documentId}`)
    } catch (libError) {
      console.error('Failed to save to library:', libError)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
