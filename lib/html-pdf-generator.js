// HTML to PDF Generator for Complex Scripts (Bengali, Hindi, Arabic, etc.)
// Uses Puppeteer for proper rendering of complex text

import puppeteer from 'puppeteer-core'
import chromium from 'chromium'
import path from 'path'

// Get Chrome executable path
const getChromePath = () => {
  // System Chromium first (most reliable)
  const systemPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ]
  
  const fs = require('fs')
  for (const p of systemPaths) {
    try {
      fs.accessSync(p)
      return p
    } catch (e) {
      continue
    }
  }
  
  // Try chromium package as fallback
  try {
    if (chromium.path) return chromium.path
  } catch (e) {
    // Ignore
  }
  
  return '/usr/bin/chromium' // Default
}

// Generate PDF from HTML content
export async function generatePDFFromHTML(htmlContent) {
  const chromePath = getChromePath()
  
  if (!chromePath) {
    throw new Error('Chrome/Chromium not found')
  }
  
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  })
  
  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    })
    
    return pdfBuffer
  } finally {
    await browser.close()
  }
}

// Generate ebook HTML template
export function generateEbookHTML(data) {
  const { cover, introduction, chapters, conclusion, settings } = data
  const primaryColor = settings?.customColor || '#3b82f6'
  const fontFamily = settings?.fontStyle === 'sans' ? 'Arial, sans-serif' : 'Georgia, serif'
  
  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Bengali', ${fontFamily};
      line-height: 1.8;
      color: #333;
    }
    
    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}11 100%);
      text-align: center;
      padding: 40px;
      page-break-after: always;
    }
    
    .cover-page .title {
      font-size: 36px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .cover-page .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    
    .cover-page .author {
      font-size: 16px;
      color: #444;
    }
    
    .cover-page .author-name {
      font-size: 20px;
      font-weight: 600;
      color: ${primaryColor};
    }
    
    .cover-page .year {
      font-size: 14px;
      color: #888;
      margin-top: 40px;
    }
    
    /* Chapter Pages */
    .chapter {
      page-break-before: always;
      padding: 20px 0;
    }
    
    .chapter-header {
      background: ${primaryColor};
      color: white;
      padding: 8px 16px;
      display: inline-block;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 10px;
    }
    
    .chapter-title {
      font-size: 28px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 10px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-heading {
      font-size: 18px;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .section p {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    .pro-tip {
      background: ${primaryColor}15;
      border-left: 4px solid ${primaryColor};
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .pro-tip-label {
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 5px;
    }
    
    .bullet-list {
      margin: 15px 0;
      padding-left: 25px;
    }
    
    .bullet-list li {
      margin-bottom: 8px;
    }
    
    .key-takeaways {
      background: #f8f9fa;
      border: 2px solid ${primaryColor};
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
    }
    
    .key-takeaways h4 {
      color: ${primaryColor};
      margin-bottom: 15px;
    }
    
    .key-takeaways ul {
      list-style: none;
      padding: 0;
    }
    
    .key-takeaways li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    
    .key-takeaways li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${primaryColor};
      font-weight: bold;
    }
    
    /* Introduction & Conclusion */
    .intro-page, .conclusion-page {
      page-break-before: always;
    }
    
    .intro-title, .conclusion-title {
      font-size: 24px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 20px;
      text-align: center;
    }
    
    /* Footer */
    .page-footer {
      text-align: center;
      font-size: 10px;
      color: #999;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1 class="title">${escapeHTML(cover.title)}</h1>
    ${cover.subtitle ? `<p class="subtitle">${escapeHTML(cover.subtitle)}</p>` : ''}
    ${cover.authorName ? `
      <div class="author">
        <p>লেখক / by</p>
        <p class="author-name">${escapeHTML(cover.authorName)}</p>
      </div>
    ` : ''}
    <p class="year">${cover.year || new Date().getFullYear()}</p>
  </div>
  
  <!-- Introduction -->
  ${introduction?.content ? `
    <div class="intro-page">
      <h2 class="intro-title">ভূমিকা / Introduction</h2>
      ${formatContent(introduction.content)}
    </div>
  ` : ''}
  
  <!-- Chapters -->
  ${chapters.map((chapter, idx) => `
    <div class="chapter">
      <span class="chapter-header">অধ্যায় ${idx + 1} / Chapter ${idx + 1}</span>
      <h2 class="chapter-title">${escapeHTML(chapter.title)}</h2>
      
      ${chapter.sections ? chapter.sections.map(section => `
        <div class="section">
          ${section.heading ? `<h3 class="section-heading">${escapeHTML(section.heading)}</h3>` : ''}
          ${formatParagraphs(section.content)}
          ${section.tips?.length ? section.tips.map(tip => `
            <div class="pro-tip">
              <div class="pro-tip-label">💡 Pro Tip</div>
              <p>${escapeHTML(tip)}</p>
            </div>
          `).join('') : ''}
          ${section.bullets?.length ? `
            <ul class="bullet-list">
              ${section.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('') : formatContent(chapter.content)}
      
      ${chapter.keyTakeaways?.length ? `
        <div class="key-takeaways">
          <h4>🎯 মূল বিষয়গুলি / Key Takeaways</h4>
          <ul>
            ${chapter.keyTakeaways.map(t => `<li>${escapeHTML(t)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <!-- Conclusion -->
  ${conclusion?.content ? `
    <div class="conclusion-page">
      <h2 class="conclusion-title">উপসংহার / Conclusion</h2>
      ${formatContent(conclusion.content)}
    </div>
  ` : ''}
  
  <div class="page-footer">
    Created with ProCreators Ebook Maker
  </div>
</body>
</html>
  `
}

// Helper: Escape HTML special characters
function escapeHTML(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper: Format content with paragraph breaks
function formatContent(content) {
  if (!content) return ''
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  return paragraphs.map(p => `<p>${escapeHTML(p.trim())}</p>`).join('')
}

// Helper: Format paragraphs
function formatParagraphs(content) {
  if (!content) return ''
  const paragraphs = content.split(/\n+/).filter(p => p.trim())
  return paragraphs.map(p => `<p>${escapeHTML(p.trim())}</p>`).join('')
}
