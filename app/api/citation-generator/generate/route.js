import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { enforceRateLimit } from '@/lib/rate-limiter'
import { saveToLibraryDirect } from '@/lib/library-save-server'
import { getUserIdFromRequest, checkCredits, deductCredits, completeTransaction, refundCredits } from '@/lib/credits'
import { getChromePath } from '@/lib/html-pdf-generator'

const TOOL_ID = 'citation-generator'

// Helper to run LLM
async function runLLM(prompt, systemPrompt = 'You are an expert citation formatter.') {
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
        } catch (e) {}
        
        if (code !== 0) {
          console.error('LLM stderr:', stderr)
          reject(new Error(`LLM process failed: ${stderr}`))
        } else {
          try {
            const result = JSON.parse(stdout)
            resolve(result.response || result.content || result)
          } catch {
            resolve(stdout.trim())
          }
        }
      })
      
      pythonProcess.on('error', async (err) => {
        try {
          await fs.unlink(tempFile)
        } catch (e) {}
        reject(new Error(`Failed to start LLM process: ${err.message}`))
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Citation style guidelines
const STYLE_GUIDELINES = {
  'apa7': `APA 7th Edition format:
- Author(s) last name, first initial(s). (Year). Title in sentence case. Publisher. DOI/URL
- For journals: Author, A. A., & Author, B. B. (Year). Article title. Journal Name, volume(issue), pages. DOI
- Use hanging indent, double-space
- Italicize book titles, journal names, and volume numbers`,

  'mla9': `MLA 9th Edition format:
- Author last name, first name. "Article Title." Container Title, other contributors, version, number, publisher, date, location.
- Use quotation marks for article titles, italicize book/journal titles
- Include page numbers as p. or pp.
- End with period`,

  'chicago': `Chicago 17th Edition (Notes-Bibliography) format:
- Author first name last name, Title in Italics (Place: Publisher, Year), page.
- For journals: Author, "Article Title," Journal Name volume, no. issue (Year): pages.
- Use footnote-style numbering`,

  'harvard': `Harvard Referencing format:
- Author surname, initials. (Year) Title in italics. Edition. Place: Publisher.
- For journals: Author surname, initials. (Year) 'Article title', Journal Name, volume(issue), pp. pages.
- Use single quotes for article titles`,

  'ieee': `IEEE format:
- [#] A. Author, "Article title," Journal Name, vol. #, no. #, pp. ##-##, Month Year.
- Use numbered references in square brackets
- Abbreviate journal names`,

  'vancouver': `Vancouver format:
- Author AA, Author BB. Title of article. Journal Name. Year;Volume(Issue):Pages.
- Use numbered references
- No italics, minimal punctuation`,

  'ama': `AMA 11th Edition format:
- Author AA, Author BB. Article title. Journal Name. Year;vol(issue):pages. doi:
- Use superscript numbers for in-text citations
- Abbreviate journal names`,

  'asa': `ASA 6th Edition format:
- Author Last name, First name. Year. "Article Title." Journal Name Volume(Issue):Pages.
- For books: Author. Year. Title. Place: Publisher.
- Use quotation marks for articles`
}

// Format a single citation
async function formatCitation(sourceType, sourceData, citationStyle) {
  const styleGuide = STYLE_GUIDELINES[citationStyle] || STYLE_GUIDELINES['apa7']
  
  const prompt = `Format this citation in ${citationStyle.toUpperCase()} style.

SOURCE TYPE: ${sourceType}

SOURCE DATA:
${Object.entries(sourceData)
  .filter(([_, v]) => v && v.trim())
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}

STYLE GUIDELINES:
${styleGuide}

IMPORTANT:
- Follow the exact format for ${citationStyle.toUpperCase()}
- Use proper punctuation and italics markers (*text* for italics)
- Include all available information in the correct order
- If information is missing, format with what's available
- Return ONLY the formatted citation, no explanation

Formatted citation:`

  const response = await runLLM(prompt, `You are an expert academic citation formatter specializing in ${citationStyle.toUpperCase()} style. Return only the properly formatted citation with no additional text.`)
  
  // Clean up the response
  let citation = response.trim()
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/^Formatted citation:\s*/i, '') // Remove prefix if present
    .replace(/\*([^*]+)\*/g, '$1') // Convert *italics* to plain text for display
  
  return citation
}

// Generate full bibliography
async function generateBibliography(citations, citationStyle) {
  const styleGuide = STYLE_GUIDELINES[citationStyle] || STYLE_GUIDELINES['apa7']
  
  // Sort citations alphabetically by first author's last name
  const sortedCitations = [...citations].sort((a, b) => {
    const authorA = a.sourceData.authors || ''
    const authorB = b.sourceData.authors || ''
    return authorA.localeCompare(authorB)
  })
  
  // For numbered styles (IEEE, Vancouver), keep original order
  const isNumbered = ['ieee', 'vancouver'].includes(citationStyle)
  const finalCitations = isNumbered ? citations : sortedCitations
  
  let bibliography = ''
  
  for (let i = 0; i < finalCitations.length; i++) {
    const citation = finalCitations[i]
    let formatted = citation.formatted
    
    // Add numbers for IEEE/Vancouver
    if (citationStyle === 'ieee') {
      formatted = `[${i + 1}] ${formatted}`
    } else if (citationStyle === 'vancouver') {
      formatted = `${i + 1}. ${formatted}`
    }
    
    bibliography += formatted + '\n\n'
  }
  
  return bibliography.trim()
}

// Reformat all citations to new style
async function reformatAllCitations(citations, newStyle) {
  const reformatted = []
  
  for (const citation of citations) {
    const newFormatted = await formatCitation(
      citation.sourceType,
      citation.sourceData,
      newStyle
    )
    
    reformatted.push({
      ...citation,
      formatted: newFormatted,
      style: newStyle
    })
  }
  
  return reformatted
}

// Generate PDF
async function generatePDF(bibliography, citationStyle) {
  const styleName = {
    'apa7': 'APA 7th Edition',
    'mla9': 'MLA 9th Edition',
    'chicago': 'Chicago 17th',
    'harvard': 'Harvard',
    'ieee': 'IEEE',
    'vancouver': 'Vancouver',
    'ama': 'AMA 11th',
    'asa': 'ASA 6th'
  }[citationStyle] || citationStyle

  const entries = bibliography.split('\n\n').map((entry, idx) => {
    const escaped = entry
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<p class="entry">${escaped}</p>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Libre Baskerville', 'Times New Roman', serif;
      line-height: 2;
      color: #000;
      font-size: 12pt;
    }
    
    .page {
      padding: 72pt;
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 24pt;
    }
    
    .header h1 {
      font-size: 12pt;
      font-weight: bold;
    }
    
    .header .style {
      font-size: 10pt;
      color: #666;
      margin-top: 6pt;
    }
    
    .entries {
      text-align: left;
    }
    
    .entry {
      margin-bottom: 12pt;
      padding-left: 36pt;
      text-indent: -36pt;
    }
    
    .footer {
      margin-top: 48pt;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>References</h1>
      <p class="style">${styleName} Format</p>
    </div>
    
    <div class="entries">
      ${entries}
    </div>
    
    <div class="footer">
      Generated by ProCreators Citation Generator
    </div>
  </div>
</body>
</html>`

  const puppeteer = (await import('puppeteer-core')).default
  
  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  })
  
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })
    
    return pdfBuffer
  } finally {
    await browser.close()
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

    const body = await request.json()
    const { action } = body
    
    if (action === 'format-citation') {
      const { sourceType, sourceData, citationStyle } = body
      const citation = await formatCitation(sourceType, sourceData, citationStyle)
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        citation
      })
    }
    
    if (action === 'generate-bibliography') {
      const { citations, citationStyle } = body
      const bibliography = await generateBibliography(citations, citationStyle)
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        bibliography
      })
    }
    
    if (action === 'reformat-all') {
      const { citations, citationStyle } = body
      const reformatted = await reformatAllCitations(citations, citationStyle)
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        citations: reformatted
      })
    }
    
    if (action === 'generate-pdf') {
      const { bibliography, citationStyle } = body
      const pdfBuffer = await generatePDF(bibliography, citationStyle)
      
      // Save PDF
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'citations')
      await fs.mkdir(outputDir, { recursive: true })
      
      const filename = `bibliography-${citationStyle}-${uuidv4()}.pdf`
      const outputPath = path.join(outputDir, filename)
      await fs.writeFile(outputPath, pdfBuffer)
      
      const pdfUrl = `/generated/citations/${filename}`
      
      // Save to library
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const citationCount = bibliography.split('\n\n').filter(b => b.trim()).length
        const styleName = {
          'apa7': 'APA 7th',
          'mla9': 'MLA 9th',
          'chicago': 'Chicago',
          'harvard': 'Harvard',
          'ieee': 'IEEE',
          'vancouver': 'Vancouver'
        }[citationStyle] || citationStyle
        
        await saveToLibraryDirect(userId, {
          type: 'citation-generator',
          category: 'document',
          title: `Bibliography (${styleName})`,
          content: pdfUrl,
          filePath: pdfUrl,
          description: `${citationCount} citations in ${styleName} format`,
          metadata: {
            citationStyle,
            citationCount,
            pdfUrl
          }
        })
        } catch (e) {
          console.error('Failed to save to library:', e)
        }
      
      // Complete transaction on success

      
      if (transactionId) await completeTransaction(transactionId)

      
      return NextResponse.json({
        success: true,
        pdfUrl,
        filename
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    // Refund credits on error
    if (transactionId && userId) {
      await refundCredits(userId, transactionId, error.message)
    }
    console.error('Citation generator error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
