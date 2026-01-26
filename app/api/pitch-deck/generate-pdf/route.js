import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

// Check if Puppeteer/Chromium is available
async function tryGeneratePDF(htmlContent) {
  try {
    const { generatePDFFromHTML } = await import('@/lib/html-pdf-generator')
    return await generatePDFFromHTML(htmlContent)
  } catch (error) {
    console.log('PDF generation not available:', error.message)
    return null
  }
}

// Generate Pitch Deck PDF HTML
function generatePitchDeckHTML(data, metadata) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  const renderList = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return ''
    return `<ul>${arr.map(item => {
      if (typeof item === 'object') {
        const parts = Object.entries(item)
          .filter(([k, v]) => v)
          .map(([k, v]) => `<strong>${k}:</strong> ${escapeHTML(v)}`)
        return `<li>${parts.join(' | ')}</li>`
      }
      return `<li>${escapeHTML(item)}</li>`
    }).join('')}</ul>`
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(metadata.companyName)} - Investor Pitch Deck</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6; 
      color: #1a1a1a; 
      background: #f8fafc;
    }
    
    /* Slide Container */
    .slide {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto 40px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
      page-break-inside: avoid;
      page-break-after: always;
    }
    
    .slide-header {
      padding: 30px 40px;
      background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
      color: white;
    }
    
    .slide-number {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    
    .slide-type {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    
    .slide-title {
      font-size: 32px;
      font-weight: 800;
      margin: 0;
    }
    
    .slide-content {
      padding: 40px;
    }
    
    /* Title Slide Special */
    .slide.title-slide .slide-header {
      padding: 60px 40px;
      text-align: center;
    }
    .slide.title-slide .slide-title {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .slide.title-slide .tagline {
      font-size: 22px;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .slide.title-slide .presenter {
      font-size: 16px;
      opacity: 0.8;
    }
    
    /* Content Blocks */
    .headline {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 25px;
      line-height: 1.3;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 25px;
      margin-bottom: 25px;
    }
    
    .content-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .content-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      border-left: 4px solid #3b82f6;
    }
    .content-card.green { border-left-color: #22c55e; background: #f0fdf4; }
    .content-card.purple { border-left-color: #8b5cf6; background: #faf5ff; }
    .content-card.orange { border-left-color: #f97316; background: #fff7ed; }
    .content-card.red { border-left-color: #ef4444; background: #fef2f2; }
    .content-card.teal { border-left-color: #14b8a6; background: #f0fdfa; }
    
    .content-card-title {
      font-weight: 700;
      color: #334155;
      margin-bottom: 10px;
      font-size: 15px;
    }
    
    .content-card-value {
      font-size: 28px;
      font-weight: 800;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .content-card-label {
      font-size: 13px;
      color: #64748b;
    }
    
    /* Market Size */
    .market-circle {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border-radius: 12px;
    }
    .market-circle .value {
      font-size: 36px;
      font-weight: 800;
      color: #1e40af;
    }
    .market-circle .label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
    }
    
    /* Lists */
    ul { 
      padding-left: 20px; 
      margin: 15px 0;
    }
    li { 
      margin-bottom: 10px; 
      font-size: 15px;
      color: #475569;
    }
    
    /* Problem Cards */
    .problem-card {
      background: #fef2f2;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #ef4444;
    }
    .problem-card .problem {
      font-weight: 700;
      color: #991b1b;
      margin-bottom: 5px;
    }
    .problem-card .impact {
      font-size: 14px;
      color: #dc2626;
    }
    
    /* Solution Features */
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 20px;
      padding: 20px;
      background: #f0fdf4;
      border-radius: 12px;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      flex-shrink: 0;
    }
    .feature-text {
      font-size: 15px;
      color: #166534;
    }
    
    /* Metrics */
    .metric-card {
      text-align: center;
      padding: 25px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-radius: 12px;
      border: 2px solid #22c55e;
    }
    .metric-value {
      font-size: 36px;
      font-weight: 800;
      color: #166534;
    }
    .metric-label {
      font-size: 14px;
      color: #15803d;
      margin-top: 5px;
    }
    .metric-growth {
      font-size: 13px;
      color: #22c55e;
      font-weight: 600;
      margin-top: 8px;
    }
    
    /* Team Cards */
    .team-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      text-align: center;
    }
    .team-photo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 50%;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 700;
    }
    .team-name {
      font-weight: 700;
      font-size: 18px;
      color: #1e40af;
    }
    .team-title {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .team-background {
      font-size: 13px;
      color: #475569;
    }
    
    /* Use of Funds */
    .funds-bar {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      gap: 15px;
    }
    .funds-label {
      width: 150px;
      font-weight: 600;
      font-size: 14px;
    }
    .funds-track {
      flex: 1;
      background: #e2e8f0;
      height: 30px;
      border-radius: 15px;
      overflow: hidden;
    }
    .funds-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 15px;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    
    /* Speaker Notes */
    .speaker-notes {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin-top: 25px;
      border-radius: 0 12px 12px 0;
    }
    .speaker-notes-title {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .speaker-notes-content {
      font-size: 14px;
      color: #78350f;
      font-style: italic;
    }
    
    /* Design Tips */
    .design-tips {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      margin-top: 15px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #1e40af;
    }
    
    /* Testimonial */
    .testimonial {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid #22c55e;
      margin: 20px 0;
    }
    .testimonial-quote {
      font-size: 18px;
      font-style: italic;
      color: #166534;
      margin-bottom: 15px;
    }
    .testimonial-author {
      font-weight: 600;
      color: #15803d;
    }
    
    /* Competition Matrix */
    .competition-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .competition-table th,
    .competition-table td {
      border: 1px solid #e2e8f0;
      padding: 15px;
      text-align: left;
    }
    .competition-table th {
      background: #f1f5f9;
      font-weight: 700;
    }
    
    /* Ask Amount */
    .ask-amount {
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
      border-radius: 16px;
      color: white;
      margin-bottom: 30px;
    }
    .ask-value {
      font-size: 56px;
      font-weight: 800;
      margin-bottom: 10px;
    }
    .ask-stage {
      font-size: 18px;
      opacity: 0.9;
    }
    
    /* Badges */
    .badge {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }
    .badge.green { background: #22c55e; }
    .badge.purple { background: #8b5cf6; }
    .badge.orange { background: #f97316; }
    
    /* Appendix & Tips */
    .tips-section {
      background: #fffbeb;
      border-radius: 12px;
      padding: 30px;
      margin-top: 30px;
    }
    .tips-title {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    .qa-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #8b5cf6;
    }
    .qa-question {
      font-weight: 700;
      color: #5b21b6;
      margin-bottom: 10px;
    }
    .qa-answer {
      font-size: 14px;
      color: #475569;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 40px;
      color: #64748b;
      font-size: 13px;
    }
    
    @media print {
      body { background: white; }
      .slide { 
        box-shadow: none; 
        border: 1px solid #e2e8f0;
        margin-bottom: 20px;
      }
    }
  </style>
</head>
<body>
  ${data.slides ? data.slides.map(slide => `
  <div class="slide ${slide.slideType === 'title' ? 'title-slide' : ''}">
    <div class="slide-header">
      <div class="slide-number">Slide ${slide.slideNumber} of ${data.slides.length}</div>
      ${slide.slideType !== 'title' ? `<div class="slide-type">${escapeHTML(slide.slideType)}</div>` : ''}
      <h1 class="slide-title">${escapeHTML(slide.title)}</h1>
      ${slide.slideType === 'title' && slide.content ? `
        <p class="tagline">${escapeHTML(slide.content.tagline || data.tagline || '')}</p>
        <p class="presenter">${escapeHTML(slide.content.presenter || '')}</p>
      ` : ''}
    </div>
    
    <div class="slide-content">
      ${slide.content ? (() => {
        const content = slide.content
        let html = ''
        
        // Headline
        if (content.headline) {
          html += `<div class="headline">${escapeHTML(content.headline)}</div>`
        }
        
        // One-liner for solution
        if (content.oneLiner) {
          html += `<p style="font-size: 18px; color: #475569; margin-bottom: 25px;">${escapeHTML(content.oneLiner)}</p>`
        }
        
        // Problems (for problem slide)
        if (content.problems && Array.isArray(content.problems)) {
          html += content.problems.map(p => `
            <div class="problem-card">
              <div class="problem">${escapeHTML(p.problem || p)}</div>
              ${p.impact ? `<div class="impact">${escapeHTML(p.impact)}</div>` : ''}
            </div>
          `).join('')
        }
        
        // Problem statements array
        if (content.problemStatements && Array.isArray(content.problemStatements)) {
          html += `<ul>${content.problemStatements.map(p => `<li>${escapeHTML(p)}</li>`).join('')}</ul>`
        }
        
        // Key Features
        if (content.keyFeatures && Array.isArray(content.keyFeatures)) {
          html += content.keyFeatures.map((f, i) => `
            <div class="feature-item">
              <div class="feature-icon">✓</div>
              <div class="feature-text">${escapeHTML(typeof f === 'object' ? f.feature || f.name : f)}</div>
            </div>
          `).join('')
        }
        
        // How it works
        if (content.howItWorks) {
          html += `<div class="content-card green"><div class="content-card-title">How It Works</div><p>${escapeHTML(content.howItWorks)}</p></div>`
        }
        
        // Demo flow
        if (content.demoFlow && Array.isArray(content.demoFlow)) {
          html += `<div class="content-card purple"><div class="content-card-title">Demo Flow</div><ul>${content.demoFlow.map(d => `<li>${escapeHTML(d)}</li>`).join('')}</ul></div>`
        }
        
        // Market TAM/SAM/SOM
        if (content.tam || content.sam || content.som) {
          html += `<div class="content-grid-3">`
          if (content.tam) {
            html += `<div class="market-circle"><div class="value">${escapeHTML(typeof content.tam === 'object' ? content.tam.value : content.tam)}</div><div class="label">TAM</div></div>`
          }
          if (content.sam) {
            html += `<div class="market-circle"><div class="value">${escapeHTML(typeof content.sam === 'object' ? content.sam.value : content.sam)}</div><div class="label">SAM</div></div>`
          }
          if (content.som) {
            html += `<div class="market-circle"><div class="value">${escapeHTML(typeof content.som === 'object' ? content.som.value : content.som)}</div><div class="label">SOM</div></div>`
          }
          html += `</div>`
        }
        
        // Key Metrics
        if (content.keyMetrics && Array.isArray(content.keyMetrics)) {
          html += `<div class="content-grid-3">${content.keyMetrics.map(m => `
            <div class="metric-card">
              <div class="metric-value">${escapeHTML(m.value)}</div>
              <div class="metric-label">${escapeHTML(m.metric)}</div>
              ${m.growth ? `<div class="metric-growth">↑ ${escapeHTML(m.growth)}</div>` : ''}
            </div>
          `).join('')}</div>`
        }
        
        // Metrics object (alternative format)
        if (content.metrics && Array.isArray(content.metrics)) {
          html += `<div class="content-grid-3">${content.metrics.map(m => `
            <div class="metric-card">
              <div class="metric-value">${escapeHTML(m.value)}</div>
              <div class="metric-label">${escapeHTML(m.metric)}</div>
            </div>
          `).join('')}</div>`
        }
        
        // Milestones
        if (content.milestones && Array.isArray(content.milestones)) {
          html += `<div class="content-card"><div class="content-card-title">Key Milestones</div><ul>${content.milestones.map(m => `<li>${escapeHTML(typeof m === 'object' ? `${m.date}: ${m.milestone}` : m)}</li>`).join('')}</ul></div>`
        }
        
        // Testimonial
        if (content.testimonial) {
          html += `<div class="testimonial">
            <div class="testimonial-quote">"${escapeHTML(content.testimonial.quote || content.testimonial)}"</div>
            ${content.testimonial.name ? `<div class="testimonial-author">— ${escapeHTML(content.testimonial.name)}${content.testimonial.company ? `, ${escapeHTML(content.testimonial.company)}` : ''}</div>` : ''}
          </div>`
        }
        
        // Business Model - Pricing Tiers
        if (content.pricingTiers && Array.isArray(content.pricingTiers)) {
          html += `<div class="content-grid">${content.pricingTiers.map(t => `
            <div class="content-card">
              <div class="content-card-title">${escapeHTML(t.tier)}</div>
              <div class="content-card-value">${escapeHTML(t.price)}</div>
              <div class="content-card-label">${escapeHTML(t.features)}</div>
            </div>
          `).join('')}</div>`
        }
        
        // Unit Economics
        if (content.unitEconomics && typeof content.unitEconomics === 'object') {
          html += `<div class="content-grid">
            ${content.unitEconomics.ltv ? `<div class="content-card green"><div class="content-card-title">LTV</div><div class="content-card-value">${escapeHTML(content.unitEconomics.ltv)}</div></div>` : ''}
            ${content.unitEconomics.cac ? `<div class="content-card orange"><div class="content-card-title">CAC</div><div class="content-card-value">${escapeHTML(content.unitEconomics.cac)}</div></div>` : ''}
          </div>`
        }
        
        // Revenue Model
        if (content.revenueModel) {
          html += `<div class="content-card"><div class="content-card-title">Revenue Model</div><p>${escapeHTML(content.revenueModel)}</p></div>`
        }
        
        // Competitors
        if (content.competitors && Array.isArray(content.competitors)) {
          html += `<div class="content-card red"><div class="content-card-title">Competition</div><ul>${content.competitors.map(c => `<li><strong>${escapeHTML(typeof c === 'object' ? c.name : c)}</strong>${c.weakness ? `: ${escapeHTML(c.weakness)}` : ''}</li>`).join('')}</ul></div>`
        }
        
        // Competitive Advantages
        if (content.advantages && Array.isArray(content.advantages)) {
          html += `<div class="content-card green"><div class="content-card-title">Our Advantages</div><ul>${content.advantages.map(a => `<li>${escapeHTML(a)}</li>`).join('')}</ul></div>`
        }
        if (content.competitiveAdvantages && Array.isArray(content.competitiveAdvantages)) {
          html += `<div class="content-card green"><div class="content-card-title">Competitive Advantages</div><ul>${content.competitiveAdvantages.map(a => `<li>${escapeHTML(a)}</li>`).join('')}</ul></div>`
        }
        
        // GTM Channels
        if (content.channels && Array.isArray(content.channels)) {
          html += `<div class="content-card purple"><div class="content-card-title">Channels</div><ul>${content.channels.map(c => `<li>${escapeHTML(typeof c === 'object' ? `${c.channel}: ${c.tactic}` : c)}</li>`).join('')}</ul></div>`
        }
        
        // Team - Founders
        if (content.founders && Array.isArray(content.founders)) {
          html += `<div class="content-grid">${content.founders.map(f => `
            <div class="team-card">
              <div class="team-photo">${escapeHTML((f.name || 'F').charAt(0))}</div>
              <div class="team-name">${escapeHTML(f.name)}</div>
              <div class="team-title">${escapeHTML(f.title)}</div>
              <div class="team-background">${escapeHTML(f.background)}</div>
            </div>
          `).join('')}</div>`
        }
        
        // Advisors
        if (content.advisors && Array.isArray(content.advisors)) {
          html += `<div class="content-card teal"><div class="content-card-title">Advisors</div><ul>${content.advisors.map(a => `<li>${escapeHTML(typeof a === 'object' ? `${a.name}: ${a.background}` : a)}</li>`).join('')}</ul></div>`
        }
        
        // Financial Projections
        if (content.projections && typeof content.projections === 'object') {
          html += `<div class="content-grid-3">`
          if (content.projections.year1) html += `<div class="content-card"><div class="content-card-title">Year 1</div><div class="content-card-value">${escapeHTML(typeof content.projections.year1 === 'object' ? content.projections.year1.revenue : content.projections.year1)}</div></div>`
          if (content.projections.year2) html += `<div class="content-card green"><div class="content-card-title">Year 2</div><div class="content-card-value">${escapeHTML(typeof content.projections.year2 === 'object' ? content.projections.year2.revenue : content.projections.year2)}</div></div>`
          if (content.projections.year3) html += `<div class="content-card purple"><div class="content-card-title">Year 3</div><div class="content-card-value">${escapeHTML(typeof content.projections.year3 === 'object' ? content.projections.year3.revenue : content.projections.year3)}</div></div>`
          html += `</div>`
        }
        
        // The Ask - Amount
        if (content.amount) {
          html += `<div class="ask-amount"><div class="ask-value">${escapeHTML(content.amount)}</div><div class="ask-stage">${escapeHTML(content.stage || '')}</div></div>`
        }
        
        // Use of Funds
        if (content.useOfFunds && Array.isArray(content.useOfFunds)) {
          html += content.useOfFunds.map(u => `
            <div class="funds-bar">
              <div class="funds-label">${escapeHTML(u.category)}</div>
              <div class="funds-track">
                <div class="funds-fill" style="width: ${parseInt(u.percentage) || 25}%">${escapeHTML(u.percentage)}</div>
              </div>
            </div>
          `).join('')
        }
        
        // Contact info
        if (content.contactInfo) {
          html += `<div class="content-card" style="text-align: center;"><div class="content-card-value">${escapeHTML(content.contactInfo)}</div></div>`
        }
        
        // Call to action
        if (content.callToAction) {
          html += `<div class="content-card green" style="text-align: center;"><div class="content-card-title">Next Steps</div><p style="font-size: 18px;">${escapeHTML(content.callToAction)}</p></div>`
        }
        
        return html
      })() : ''}
    </div>
  </div>
  `).join('') : '<p>No slides generated</p>'}
  
  <div class="footer">
    <p style="font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 10px;">${escapeHTML(metadata.companyName)} Investor Pitch Deck</p>
    <p>© ${new Date().getFullYear()} ${escapeHTML(metadata.companyName)} • Confidential</p>
  </div>
</body>
</html>
  `
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { data, metadata, saveToLibrary: shouldSaveToLibrary } = body

    if (!data || !metadata) {
      return NextResponse.json(
        { success: false, error: 'Missing data or metadata' },
        { status: 400 }
      )
    }

    // Generate HTML
    const htmlContent = generatePitchDeckHTML(data, metadata)
    
    // Try to generate PDF
    const pdfBuffer = await tryGeneratePDF(htmlContent)
    
    if (!pdfBuffer) {
      // Return HTML as fallback
      let libraryId = null
      if (shouldSaveToLibrary) {
        try {
          const collection = await getCollection('library')
          const libraryItem = {
            id: randomUUID(),
            userId: 'anonymous',
            type: 'pitch-deck',
            category: 'html',
            title: `Pitch Deck: ${metadata.companyName}`,
            description: `${metadata.deckStyle || 'Classic'} - ${metadata.industry}`,
            content: htmlContent,
            metadata: {
              deckStyle: metadata.deckStyle,
              industry: metadata.industry,
              fundingStage: metadata.fundingStage,
              contentType: 'pitch-deck-html'
            },
            userTier: 'free',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await collection.insertOne(libraryItem)
          libraryId = libraryItem.id
        } catch (saveError) {
          console.error('Failed to save to library:', saveError)
        }
      }
      
      return NextResponse.json({
        success: true,
        fallback: true,
        htmlContent,
        libraryId,
        message: 'Use browser print to save as PDF'
      })
    }
    
    // Convert to base64
    let pdfBase64
    if (Buffer.isBuffer(pdfBuffer)) {
      pdfBase64 = pdfBuffer.toString('base64')
    } else {
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    }
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`

    // Save to library
    let libraryId = null
    if (shouldSaveToLibrary) {
      try {
        const collection = await getCollection('library')
        const libraryItem = {
          id: randomUUID(),
          userId: 'anonymous',
          type: 'pitch-deck',
          category: 'pdf',
          title: `Pitch Deck: ${metadata.companyName}`,
          description: `${metadata.deckStyle || 'Classic'} - ${metadata.industry}`,
          content: pdfDataUrl,
          metadata: {
            deckStyle: metadata.deckStyle,
            industry: metadata.industry,
            fundingStage: metadata.fundingStage,
            contentType: 'pitch-deck-pdf'
          },
          userTier: 'free',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await collection.insertOne(libraryItem)
        libraryId = libraryItem.id
      } catch (saveError) {
        console.error('Failed to save to library:', saveError)
      }
    }

    return NextResponse.json({
      success: true,
      pdfDataUrl,
      libraryId,
      fileName: `${metadata.companyName.replace(/\s+/g, '_')}_Pitch_Deck.pdf`
    })

  } catch (error) {
    console.error('Pitch Deck PDF Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
