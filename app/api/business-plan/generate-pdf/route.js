import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'

// Check if Puppeteer/Chromium is available
async function tryGeneratePDF(htmlContent) {
  try {
    const { generatePDFFromHTML } = await import('@/lib/html-pdf-generator')
    return await generatePDFFromHTML(htmlContent)
  } catch (error) {
    return null
  }
}

// Generate Business Plan PDF HTML
function generateBusinessPlanHTML(data, metadata) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Helper to render arrays as list
  const renderList = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return ''
    return `<ul>${arr.map(item => {
      if (typeof item === 'object') {
        // Handle complex objects like team members, milestones
        const parts = Object.entries(item)
          .filter(([k, v]) => v)
          .map(([k, v]) => `<strong>${k}:</strong> ${escapeHTML(v)}`)
        return `<li>${parts.join(' | ')}</li>`
      }
      return `<li>${escapeHTML(item)}</li>`
    }).join('')}</ul>`
  }

  // Helper to render object properties
  const renderObjectProps = (obj) => {
    if (!obj) return ''
    return Object.entries(obj)
      .filter(([k, v]) => v && typeof v !== 'object')
      .map(([k, v]) => `<p><strong>${k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${escapeHTML(v)}</p>`)
      .join('')
  }

  // Determine plan type for different layouts
  const planType = metadata.planType || 'Traditional Business Plan'
  const isPitchDeck = planType.toLowerCase().includes('pitch')
  const isLeanCanvas = planType.toLowerCase().includes('lean')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(metadata.companyName)} - Business Plan</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7; 
      color: #1a1a1a; 
      padding: 50px; 
      max-width: 900px; 
      margin: 0 auto;
      font-size: 14px;
    }
    
    /* Cover Page */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #1e40af22 0%, #7c3aed22 100%);
      padding: 60px;
      border-radius: 16px;
      page-break-after: always;
      margin-bottom: 40px;
    }
    .cover-icon { font-size: 72px; margin-bottom: 30px; }
    .cover-title { font-size: 42px; font-weight: 700; color: #1e40af; margin-bottom: 15px; }
    .cover-subtitle { font-size: 22px; color: #4b5563; margin-bottom: 10px; }
    .cover-type { 
      font-size: 16px; 
      color: #7c3aed; 
      font-weight: 600;
      background: #7c3aed15;
      padding: 8px 24px;
      border-radius: 30px;
      margin-bottom: 40px;
    }
    .cover-meta { 
      display: flex; 
      flex-wrap: wrap; 
      justify-content: center; 
      gap: 15px; 
      margin-top: 30px;
    }
    .cover-meta span { 
      background: white; 
      padding: 10px 20px; 
      border-radius: 10px; 
      font-size: 14px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      font-weight: 500;
    }
    
    /* Section Styles */
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section-title { 
      font-size: 22px; 
      font-weight: 700; 
      color: #1e40af; 
      margin-bottom: 20px; 
      padding-bottom: 12px; 
      border-bottom: 3px solid #3b82f6;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-icon { font-size: 26px; }
    
    /* Cards */
    .card { 
      background: #f8fafc; 
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 16px; 
      border-left: 5px solid #3b82f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card.green { border-left-color: #22c55e; background: #f0fdf4; }
    .card.purple { border-left-color: #8b5cf6; background: #faf5ff; }
    .card.orange { border-left-color: #f97316; background: #fff7ed; }
    .card.pink { border-left-color: #ec4899; background: #fdf2f8; }
    .card.teal { border-left-color: #14b8a6; background: #f0fdfa; }
    .card.indigo { border-left-color: #6366f1; background: #eef2ff; }
    .card.red { border-left-color: #ef4444; background: #fef2f2; }
    .card.yellow { border-left-color: #eab308; background: #fefce8; }
    .card-title { font-weight: 700; margin-bottom: 12px; color: #334155; font-size: 17px; }
    .card-content { font-size: 14px; color: #475569; }
    .card-content p { margin-bottom: 10px; }
    
    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    
    /* SWOT */
    .swot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .swot-item { padding: 18px; border-radius: 12px; }
    .swot-strengths { background: #dcfce7; border-left: 5px solid #22c55e; }
    .swot-weaknesses { background: #fee2e2; border-left: 5px solid #ef4444; }
    .swot-opportunities { background: #dbeafe; border-left: 5px solid #3b82f6; }
    .swot-threats { background: #fed7aa; border-left: 5px solid #f97316; }
    .swot-title { font-weight: 700; margin-bottom: 10px; font-size: 15px; }
    
    /* Lists */
    ul { padding-left: 22px; margin-top: 10px; }
    li { margin-bottom: 8px; font-size: 14px; }
    
    /* Highlight */
    .highlight { 
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); 
      padding: 24px; 
      border-radius: 12px; 
      margin: 20px 0; 
      border-left: 5px solid #3b82f6;
      font-size: 15px;
    }
    
    /* Badges */
    .badge { 
      display: inline-block; 
      background: #3b82f6; 
      color: white; 
      padding: 4px 12px; 
      border-radius: 8px; 
      font-size: 12px; 
      font-weight: 600;
      margin-right: 8px;
    }
    .badge.green { background: #22c55e; }
    .badge.yellow { background: #eab308; color: #1a1a1a; }
    .badge.red { background: #ef4444; }
    .badge.purple { background: #8b5cf6; }
    
    /* Financial Tables */
    .financial-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .financial-table th, .financial-table td { 
      border: 1px solid #e2e8f0; 
      padding: 12px 16px; 
      text-align: left;
    }
    .financial-table th { background: #f1f5f9; font-weight: 600; }
    .financial-table tr:nth-child(even) { background: #f8fafc; }
    
    /* Pitch Deck Slides */
    .slide { 
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .slide-number { 
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .slide-title { font-size: 24px; font-weight: 700; color: #1e40af; margin-bottom: 20px; }
    .speaker-notes { 
      background: #fef3c7; 
      border-left: 4px solid #f59e0b; 
      padding: 15px; 
      margin-top: 20px; 
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }
    .speaker-notes strong { color: #78350f; }
    
    /* Lean Canvas Grid */
    .canvas-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 12px;
      margin-bottom: 20px;
    }
    .canvas-cell {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      min-height: 150px;
    }
    .canvas-cell.highlight { border-color: #3b82f6; background: #eff6ff; }
    .canvas-cell-title { font-weight: 700; font-size: 14px; color: #1e40af; margin-bottom: 10px; }
    
    /* Team Member Cards */
    .team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .team-card { 
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    .team-name { font-weight: 700; font-size: 16px; color: #1e40af; }
    .team-title { color: #64748b; font-size: 14px; margin-bottom: 10px; }
    
    /* Footer */
    .footer { 
      margin-top: 60px; 
      padding-top: 30px; 
      border-top: 2px solid #e2e8f0; 
      text-align: center; 
      color: #64748b; 
      font-size: 13px;
    }
    
    /* Milestone Timeline */
    .milestone { 
      display: flex; 
      align-items: flex-start; 
      gap: 15px; 
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 10px;
    }
    .milestone-marker { 
      width: 40px; 
      height: 40px; 
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      font-weight: 700;
      flex-shrink: 0;
    }
    
    /* Page breaks */
    @media print { 
      body { padding: 30px; }
      .section { page-break-inside: avoid; }
      .card { page-break-inside: avoid; }
      .slide { page-break-inside: avoid; }
      .cover-page { min-height: auto; padding: 50px; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-icon">📋</div>
    <h1 class="cover-title">${escapeHTML(metadata.companyName)}</h1>
    <p class="cover-subtitle">Business Plan</p>
    <div class="cover-type">${escapeHTML(planType)}</div>
    <div class="cover-meta">
      <span>📅 ${date}</span>
      ${metadata.industry ? `<span>🏢 ${escapeHTML(metadata.industry)}</span>` : ''}
      ${metadata.stage ? `<span>📈 ${escapeHTML(metadata.stage)}</span>` : ''}
    </div>
  </div>

  ${isPitchDeck && data.slides ? `
  <!-- PITCH DECK SLIDES -->
  ${data.slides.map(slide => `
  <div class="slide">
    <div class="slide-number">Slide ${slide.slideNumber}</div>
    <div class="slide-title">${escapeHTML(slide.title)}</div>
    <div class="card-content">
      ${slide.content ? Object.entries(slide.content).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong></p>${renderList(value)}`
        }
        if (typeof value === 'object') {
          return `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong></p>${renderObjectProps(value)}`
        }
        return `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${escapeHTML(value)}</p>`
      }).join('') : ''}
    </div>
    ${slide.speakerNotes ? `
    <div class="speaker-notes">
      <strong>🎤 Speaker Notes:</strong> ${escapeHTML(slide.speakerNotes)}
    </div>
    ` : ''}
  </div>
  `).join('')}
  ` : ''}

  ${isLeanCanvas && data.canvas ? `
  <!-- LEAN CANVAS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">📊</span> Business Model Canvas</div>
    
    <div class="canvas-grid">
      ${data.canvas.problem ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">❗ Problem</div>
        ${data.canvas.problem.topProblems ? renderList(data.canvas.problem.topProblems) : ''}
        ${data.canvas.problem.existingAlternatives ? `<p style="margin-top:10px;"><strong>Alternatives:</strong> ${data.canvas.problem.existingAlternatives.join(', ')}</p>` : ''}
      </div>
      ` : ''}
      
      ${data.canvas.solution ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">💡 Solution</div>
        ${data.canvas.solution.topFeatures ? renderList(data.canvas.solution.topFeatures) : ''}
      </div>
      ` : ''}
      
      ${data.canvas.uniqueValueProposition ? `
      <div class="canvas-cell highlight">
        <div class="canvas-cell-title">🎯 Unique Value Proposition</div>
        <p><strong>${escapeHTML(data.canvas.uniqueValueProposition.statement)}</strong></p>
        ${data.canvas.uniqueValueProposition.highLevelConcept ? `<p style="font-style:italic;">"${escapeHTML(data.canvas.uniqueValueProposition.highLevelConcept)}"</p>` : ''}
      </div>
      ` : ''}
    </div>
    
    <div class="canvas-grid">
      ${data.canvas.unfairAdvantage ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">🛡️ Unfair Advantage</div>
        ${data.canvas.unfairAdvantage.advantages ? renderList(data.canvas.unfairAdvantage.advantages) : ''}
      </div>
      ` : ''}
      
      ${data.canvas.customerSegments ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">👥 Customer Segments</div>
        ${data.canvas.customerSegments.targetCustomers ? renderList(data.canvas.customerSegments.targetCustomers) : ''}
        ${data.canvas.customerSegments.earlyAdopters ? `<p><strong>Early Adopters:</strong> ${escapeHTML(data.canvas.customerSegments.earlyAdopters)}</p>` : ''}
      </div>
      ` : ''}
      
      ${data.canvas.keyMetrics ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">📈 Key Metrics</div>
        ${data.canvas.keyMetrics.metrics ? renderList(data.canvas.keyMetrics.metrics) : ''}
      </div>
      ` : ''}
    </div>
    
    <div class="canvas-grid">
      ${data.canvas.channels ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">📢 Channels</div>
        ${data.canvas.channels.pathToCustomers ? renderList(data.canvas.channels.pathToCustomers) : ''}
      </div>
      ` : ''}
      
      ${data.canvas.costStructure ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">💸 Cost Structure</div>
        ${data.canvas.costStructure.fixedCosts ? `<p><strong>Fixed:</strong> ${data.canvas.costStructure.fixedCosts.join(', ')}</p>` : ''}
        ${data.canvas.costStructure.variableCosts ? `<p><strong>Variable:</strong> ${data.canvas.costStructure.variableCosts.join(', ')}</p>` : ''}
        ${data.canvas.costStructure.monthlyBurnRate ? `<p><strong>Burn Rate:</strong> ${escapeHTML(data.canvas.costStructure.monthlyBurnRate)}</p>` : ''}
      </div>
      ` : ''}
      
      ${data.canvas.revenueStreams ? `
      <div class="canvas-cell">
        <div class="canvas-cell-title">💰 Revenue Streams</div>
        ${data.canvas.revenueStreams.streams ? renderList(data.canvas.revenueStreams.streams) : ''}
        ${data.canvas.revenueStreams.pricing ? `<p><strong>Pricing:</strong> ${escapeHTML(data.canvas.revenueStreams.pricing)}</p>` : ''}
        ${data.canvas.revenueStreams.lifetimeValue ? `<p><strong>LTV:</strong> ${escapeHTML(data.canvas.revenueStreams.lifetimeValue)}</p>` : ''}
      </div>
      ` : ''}
    </div>
  </div>
  
  ${data.hypotheses ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🧪</span> Key Hypotheses to Test</div>
    ${data.hypotheses.map((h, i) => `
    <div class="card ${i % 2 === 0 ? 'purple' : ''}">
      <div class="card-title">Hypothesis ${i + 1}: ${escapeHTML(h.hypothesis)}</div>
      <div class="card-content"><p><strong>Test:</strong> ${escapeHTML(h.test)}</p></div>
    </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.mvpPlan ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🚀</span> MVP Plan</div>
    <div class="card green">
      <div class="card-content">
        <p>${escapeHTML(data.mvpPlan.description)}</p>
        ${data.mvpPlan.features ? `<p><strong>Core Features:</strong></p>${renderList(data.mvpPlan.features)}` : ''}
        <p><strong>Timeline:</strong> ${escapeHTML(data.mvpPlan.timeline)}</p>
        <p><strong>Budget:</strong> ${escapeHTML(data.mvpPlan.budget)}</p>
      </div>
    </div>
  </div>
  ` : ''}
  ` : ''}

  ${!isPitchDeck && !isLeanCanvas ? `
  <!-- TRADITIONAL BUSINESS PLAN SECTIONS -->
  
  ${data.executiveSummary ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">✨</span> Executive Summary</div>
    
    <div class="highlight">
      ${escapeHTML(data.executiveSummary.overview)}
    </div>
    
    <div class="grid">
      ${data.executiveSummary.missionStatement ? `
      <div class="card">
        <div class="card-title">🎯 Mission</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.missionStatement)}</p></div>
      </div>
      ` : ''}
      ${data.executiveSummary.businessDescription ? `
      <div class="card green">
        <div class="card-title">🏢 Business Description</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.businessDescription)}</p></div>
      </div>
      ` : ''}
    </div>
    
    ${data.executiveSummary.productsServices ? `
    <div class="card purple">
      <div class="card-title">📦 Products & Services</div>
      <div class="card-content"><p>${escapeHTML(data.executiveSummary.productsServices)}</p></div>
    </div>
    ` : ''}
    
    <div class="grid">
      ${data.executiveSummary.targetMarket ? `
      <div class="card">
        <div class="card-title">👥 Target Market</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.targetMarket)}</p></div>
      </div>
      ` : ''}
      ${data.executiveSummary.competitiveAdvantage ? `
      <div class="card orange">
        <div class="card-title">🏆 Competitive Advantage</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.competitiveAdvantage)}</p></div>
      </div>
      ` : ''}
    </div>
    
    ${data.executiveSummary.financialHighlights ? `
    <div class="card teal">
      <div class="card-title">💰 Financial Highlights</div>
      <div class="card-content"><p>${escapeHTML(data.executiveSummary.financialHighlights)}</p></div>
    </div>
    ` : ''}
    
    ${data.executiveSummary.fundingRequest ? `
    <div class="card indigo">
      <div class="card-title">💵 Funding Request</div>
      <div class="card-content"><p>${escapeHTML(data.executiveSummary.fundingRequest)}</p></div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.companyDescription ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🏢</span> Company Description</div>
    
    ${data.companyDescription.overview ? `
    <div class="highlight">${escapeHTML(data.companyDescription.overview)}</div>
    ` : ''}
    
    <div class="grid">
      ${data.companyDescription.missionStatement ? `
      <div class="card">
        <div class="card-title">🎯 Mission Statement</div>
        <div class="card-content"><p>${escapeHTML(data.companyDescription.missionStatement)}</p></div>
      </div>
      ` : ''}
      ${data.companyDescription.visionStatement ? `
      <div class="card green">
        <div class="card-title">🔭 Vision Statement</div>
        <div class="card-content"><p>${escapeHTML(data.companyDescription.visionStatement)}</p></div>
      </div>
      ` : ''}
    </div>
    
    ${data.companyDescription.coreValues ? `
    <div class="card purple">
      <div class="card-title">💎 Core Values</div>
      <div class="card-content">${renderList(data.companyDescription.coreValues)}</div>
    </div>
    ` : ''}
    
    <div class="grid">
      ${data.companyDescription.legalStructure ? `
      <div class="card">
        <div class="card-title">⚖️ Legal Structure</div>
        <div class="card-content"><p>${escapeHTML(data.companyDescription.legalStructure)}</p></div>
      </div>
      ` : ''}
      ${data.companyDescription.location ? `
      <div class="card">
        <div class="card-title">📍 Location</div>
        <div class="card-content"><p>${escapeHTML(data.companyDescription.location)}</p></div>
      </div>
      ` : ''}
    </div>
    
    ${data.companyDescription.goalsObjectives ? `
    <div class="grid">
      ${data.companyDescription.goalsObjectives.shortTerm ? `
      <div class="card green">
        <div class="card-title">📅 Short-Term Goals</div>
        <div class="card-content">${renderList(data.companyDescription.goalsObjectives.shortTerm)}</div>
      </div>
      ` : ''}
      ${data.companyDescription.goalsObjectives.longTerm ? `
      <div class="card purple">
        <div class="card-title">🚀 Long-Term Goals</div>
        <div class="card-content">${renderList(data.companyDescription.goalsObjectives.longTerm)}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.productsAndServices ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📦</span> Products & Services</div>
    
    ${data.productsAndServices.overview ? `
    <div class="highlight">${escapeHTML(data.productsAndServices.overview)}</div>
    ` : ''}
    
    ${data.productsAndServices.problemSolution ? `
    <div class="card orange">
      <div class="card-title">❗ Problem & Solution</div>
      <div class="card-content"><p>${escapeHTML(data.productsAndServices.problemSolution)}</p></div>
    </div>
    ` : ''}
    
    ${data.productsAndServices.uniqueValueProposition ? `
    <div class="card green">
      <div class="card-title">💎 Unique Value Proposition</div>
      <div class="card-content"><p>${escapeHTML(data.productsAndServices.uniqueValueProposition)}</p></div>
    </div>
    ` : ''}
    
    ${data.productsAndServices.productsList ? `
    <div class="card">
      <div class="card-title">📋 Products/Services List</div>
      <div class="card-content">
        ${data.productsAndServices.productsList.map(prod => `
        <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; margin-bottom: 12px;">
          <strong style="font-size: 16px;">${escapeHTML(prod.name)}</strong>
          <p style="margin: 8px 0;">${escapeHTML(prod.description)}</p>
          ${prod.features ? `<p><strong>Features:</strong> ${prod.features.join(', ')}</p>` : ''}
          ${prod.benefits ? `<p><strong>Benefits:</strong> ${prod.benefits.join(', ')}</p>` : ''}
          ${prod.pricing ? `<p><strong>Pricing:</strong> ${escapeHTML(prod.pricing)}</p>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.productsAndServices.futureProducts ? `
    <div class="card purple">
      <div class="card-title">🔮 Future Products/Services</div>
      <div class="card-content"><p>${escapeHTML(data.productsAndServices.futureProducts)}</p></div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.marketAnalysis ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📊</span> Market Analysis</div>
    
    ${data.marketAnalysis.industryOverview ? `
    <div class="card">
      <div class="card-title">🏭 Industry Overview</div>
      <div class="card-content">
        <p>${escapeHTML(data.marketAnalysis.industryOverview.description)}</p>
        ${data.marketAnalysis.industryOverview.size ? `<p><strong>Market Size:</strong> ${escapeHTML(data.marketAnalysis.industryOverview.size)}</p>` : ''}
        ${data.marketAnalysis.industryOverview.growthRate ? `<p><strong>Growth Rate:</strong> ${escapeHTML(data.marketAnalysis.industryOverview.growthRate)}</p>` : ''}
        ${data.marketAnalysis.industryOverview.trends ? `<p><strong>Key Trends:</strong></p>${renderList(data.marketAnalysis.industryOverview.trends)}` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketAnalysis.targetMarket ? `
    <div class="card green">
      <div class="card-title">🎯 Target Market</div>
      <div class="card-content">
        <p>${escapeHTML(data.marketAnalysis.targetMarket.description)}</p>
        ${data.marketAnalysis.targetMarket.demographics ? `<p><strong>Demographics:</strong> ${escapeHTML(data.marketAnalysis.targetMarket.demographics)}</p>` : ''}
        ${data.marketAnalysis.targetMarket.psychographics ? `<p><strong>Psychographics:</strong> ${escapeHTML(data.marketAnalysis.targetMarket.psychographics)}</p>` : ''}
        ${data.marketAnalysis.targetMarket.size ? `<p><strong>TAM/SAM/SOM:</strong> ${escapeHTML(data.marketAnalysis.targetMarket.size)}</p>` : ''}
        ${data.marketAnalysis.targetMarket.needs ? `<p><strong>Customer Needs:</strong></p>${renderList(data.marketAnalysis.targetMarket.needs)}` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketAnalysis.competitiveAnalysis ? `
    <div class="card purple">
      <div class="card-title">⚔️ Competitive Analysis</div>
      <div class="card-content">
        ${data.marketAnalysis.competitiveAnalysis.overview ? `<p>${escapeHTML(data.marketAnalysis.competitiveAnalysis.overview)}</p>` : ''}
        ${data.marketAnalysis.competitiveAnalysis.directCompetitors ? `
        <div style="margin-top: 15px;">
          <strong>Direct Competitors:</strong>
          ${data.marketAnalysis.competitiveAnalysis.directCompetitors.map(comp => `
          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 10px 0;">
            <strong>${escapeHTML(comp.name)}</strong>
            <p>${escapeHTML(comp.description)}</p>
            ${comp.strengths ? `<p><span class="badge green">Strengths</span>${comp.strengths.join(', ')}</p>` : ''}
            ${comp.weaknesses ? `<p><span class="badge red">Weaknesses</span>${comp.weaknesses.join(', ')}</p>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}
        ${data.marketAnalysis.competitiveAnalysis.competitiveAdvantage ? `<p style="margin-top: 15px;"><strong>Our Competitive Advantage:</strong> ${escapeHTML(data.marketAnalysis.competitiveAnalysis.competitiveAdvantage)}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketAnalysis.swotAnalysis ? `
    <div class="swot-grid">
      ${data.marketAnalysis.swotAnalysis.strengths ? `
      <div class="swot-item swot-strengths">
        <div class="swot-title">💪 Strengths</div>
        ${renderList(data.marketAnalysis.swotAnalysis.strengths)}
      </div>
      ` : ''}
      ${data.marketAnalysis.swotAnalysis.weaknesses ? `
      <div class="swot-item swot-weaknesses">
        <div class="swot-title">⚠️ Weaknesses</div>
        ${renderList(data.marketAnalysis.swotAnalysis.weaknesses)}
      </div>
      ` : ''}
      ${data.marketAnalysis.swotAnalysis.opportunities ? `
      <div class="swot-item swot-opportunities">
        <div class="swot-title">🚀 Opportunities</div>
        ${renderList(data.marketAnalysis.swotAnalysis.opportunities)}
      </div>
      ` : ''}
      ${data.marketAnalysis.swotAnalysis.threats ? `
      <div class="swot-item swot-threats">
        <div class="swot-title">🛡️ Threats</div>
        ${renderList(data.marketAnalysis.swotAnalysis.threats)}
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.marketingPlan ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📣</span> Marketing & Sales Strategy</div>
    
    ${data.marketingPlan.overview ? `
    <div class="highlight">${escapeHTML(data.marketingPlan.overview)}</div>
    ` : ''}
    
    ${data.marketingPlan.positioning ? `
    <div class="card">
      <div class="card-title">🎯 Market Positioning</div>
      <div class="card-content"><p>${escapeHTML(data.marketingPlan.positioning)}</p></div>
    </div>
    ` : ''}
    
    ${data.marketingPlan.pricingStrategy ? `
    <div class="card green">
      <div class="card-title">💰 Pricing Strategy</div>
      <div class="card-content">
        ${data.marketingPlan.pricingStrategy.model ? `<p><strong>Model:</strong> ${escapeHTML(data.marketingPlan.pricingStrategy.model)}</p>` : ''}
        ${data.marketingPlan.pricingStrategy.justification ? `<p><strong>Justification:</strong> ${escapeHTML(data.marketingPlan.pricingStrategy.justification)}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketingPlan.promotionStrategy ? `
    <div class="card purple">
      <div class="card-title">📢 Promotion Strategy</div>
      <div class="card-content">
        ${data.marketingPlan.promotionStrategy.channels ? `<p><strong>Channels:</strong> ${data.marketingPlan.promotionStrategy.channels.join(', ')}</p>` : ''}
        ${data.marketingPlan.promotionStrategy.tactics ? `<p><strong>Tactics:</strong></p>${renderList(data.marketingPlan.promotionStrategy.tactics)}` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketingPlan.salesStrategy ? `
    <div class="card orange">
      <div class="card-title">🤝 Sales Strategy</div>
      <div class="card-content">
        ${data.marketingPlan.salesStrategy.process ? `<p><strong>Sales Process:</strong> ${escapeHTML(data.marketingPlan.salesStrategy.process)}</p>` : ''}
        ${data.marketingPlan.salesStrategy.channels ? `<p><strong>Sales Channels:</strong> ${data.marketingPlan.salesStrategy.channels.join(', ')}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.marketingPlan.customerAcquisition ? `
    <div class="card teal">
      <div class="card-title">👥 Customer Acquisition</div>
      <div class="card-content">
        ${data.marketingPlan.customerAcquisition.strategy ? `<p>${escapeHTML(data.marketingPlan.customerAcquisition.strategy)}</p>` : ''}
        ${data.marketingPlan.customerAcquisition.cac ? `<p><strong>CAC:</strong> ${escapeHTML(data.marketingPlan.customerAcquisition.cac)}</p>` : ''}
        ${data.marketingPlan.customerAcquisition.ltv ? `<p><strong>LTV:</strong> ${escapeHTML(data.marketingPlan.customerAcquisition.ltv)}</p>` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.operationsPlan ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">⚙️</span> Operations Plan</div>
    
    ${data.operationsPlan.overview ? `
    <div class="highlight">${escapeHTML(data.operationsPlan.overview)}</div>
    ` : ''}
    
    ${data.operationsPlan.location ? `
    <div class="card">
      <div class="card-title">📍 Location & Facilities</div>
      <div class="card-content">
        ${data.operationsPlan.location.description ? `<p>${escapeHTML(data.operationsPlan.location.description)}</p>` : ''}
        ${data.operationsPlan.location.equipment ? `<p><strong>Equipment:</strong> ${data.operationsPlan.location.equipment.join(', ')}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.operationsPlan.productionProcess ? `
    <div class="card green">
      <div class="card-title">🔄 Production/Service Delivery</div>
      <div class="card-content"><p>${escapeHTML(data.operationsPlan.productionProcess)}</p></div>
    </div>
    ` : ''}
    
    ${data.operationsPlan.technology ? `
    <div class="card purple">
      <div class="card-title">💻 Technology</div>
      <div class="card-content">
        ${data.operationsPlan.technology.systems ? `<p><strong>Systems:</strong> ${data.operationsPlan.technology.systems.join(', ')}</p>` : ''}
        ${data.operationsPlan.technology.infrastructure ? `<p><strong>Infrastructure:</strong> ${escapeHTML(data.operationsPlan.technology.infrastructure)}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.operationsPlan.milestones ? `
    <div class="card orange">
      <div class="card-title">🏁 Key Milestones</div>
      <div class="card-content">
        ${data.operationsPlan.milestones.map((m, i) => `
        <div class="milestone">
          <div class="milestone-marker">${i + 1}</div>
          <div>
            <strong>${escapeHTML(m.milestone)}</strong>
            <p style="color: #64748b; font-size: 13px;">${escapeHTML(m.timeline)} - ${escapeHTML(m.status)}</p>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.managementTeam ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">👥</span> Management & Organization</div>
    
    ${data.managementTeam.overview ? `
    <div class="highlight">${escapeHTML(data.managementTeam.overview)}</div>
    ` : ''}
    
    ${data.managementTeam.founders ? `
    <div class="card">
      <div class="card-title">👔 Founders</div>
      <div class="team-grid">
        ${data.managementTeam.founders.map(f => `
        <div class="team-card">
          <div class="team-name">${escapeHTML(f.name)}</div>
          <div class="team-title">${escapeHTML(f.title)}</div>
          ${f.bio ? `<p style="font-size: 13px;">${escapeHTML(f.bio)}</p>` : ''}
          ${f.experience ? `<p style="font-size: 12px; color: #64748b;"><strong>Experience:</strong> ${escapeHTML(f.experience)}</p>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.managementTeam.keyTeam ? `
    <div class="card green">
      <div class="card-title">🌟 Key Team Members</div>
      <div class="team-grid">
        ${data.managementTeam.keyTeam.map(t => `
        <div class="team-card">
          <div class="team-name">${escapeHTML(t.name)}</div>
          <div class="team-title">${escapeHTML(t.title)}</div>
          ${t.responsibilities ? `<p style="font-size: 12px;">${escapeHTML(t.responsibilities)}</p>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.managementTeam.advisors ? `
    <div class="card purple">
      <div class="card-title">🧠 Advisors</div>
      <div class="card-content">
        ${data.managementTeam.advisors.map(a => `
        <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
          <strong>${escapeHTML(a.name)}</strong>
          ${a.expertise ? `<span class="badge purple">${escapeHTML(a.expertise)}</span>` : ''}
          ${a.contribution ? `<p style="margin-top: 5px; font-size: 13px;">${escapeHTML(a.contribution)}</p>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.managementTeam.hiringPlan ? `
    <div class="card orange">
      <div class="card-title">📈 Hiring Plan</div>
      <div class="card-content">
        ${data.managementTeam.hiringPlan.currentTeamSize ? `<p><strong>Current Team Size:</strong> ${escapeHTML(data.managementTeam.hiringPlan.currentTeamSize)}</p>` : ''}
        ${data.managementTeam.hiringPlan.plannedHires ? `
        <p><strong>Planned Hires:</strong></p>
        ${data.managementTeam.hiringPlan.plannedHires.map(h => `
        <div style="background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 8px 0;">
          <strong>${escapeHTML(h.role)}</strong>
          <span class="badge ${h.priority === 'High' ? 'red' : h.priority === 'Medium' ? 'yellow' : 'green'}">${escapeHTML(h.priority)}</span>
          <span style="color: #64748b; font-size: 12px;">${escapeHTML(h.timeline)}</span>
        </div>
        `).join('')}
        ` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.financialPlan ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">💰</span> Financial Plan</div>
    
    ${data.financialPlan.overview ? `
    <div class="highlight">${escapeHTML(data.financialPlan.overview)}</div>
    ` : ''}
    
    ${data.financialPlan.revenueModel ? `
    <div class="card">
      <div class="card-title">💵 Revenue Model</div>
      <div class="card-content">
        ${data.financialPlan.revenueModel.description ? `<p>${escapeHTML(data.financialPlan.revenueModel.description)}</p>` : ''}
        ${data.financialPlan.revenueModel.streams ? `<p><strong>Revenue Streams:</strong> ${data.financialPlan.revenueModel.streams.join(', ')}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.financialPlan.startupCosts ? `
    <div class="card orange">
      <div class="card-title">🚀 Startup Costs</div>
      <div class="card-content">
        ${data.financialPlan.startupCosts.total ? `<p style="font-size: 20px; font-weight: bold; color: #f97316;">Total: ${escapeHTML(data.financialPlan.startupCosts.total)}</p>` : ''}
        ${data.financialPlan.startupCosts.breakdown ? `
        <table class="financial-table">
          <thead><tr><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
          <tbody>
            ${data.financialPlan.startupCosts.breakdown.map(item => `
            <tr>
              <td>${escapeHTML(item.category)}</td>
              <td><strong>${escapeHTML(item.amount)}</strong></td>
              <td>${escapeHTML(item.description)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.financialPlan.fundingRequirements ? `
    <div class="card green">
      <div class="card-title">💸 Funding Requirements</div>
      <div class="card-content">
        ${data.financialPlan.fundingRequirements.amount ? `<p style="font-size: 20px; font-weight: bold; color: #22c55e;">Amount Needed: ${escapeHTML(data.financialPlan.fundingRequirements.amount)}</p>` : ''}
        ${data.financialPlan.fundingRequirements.use ? `
        <p><strong>Use of Funds:</strong></p>
        <table class="financial-table">
          <thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead>
          <tbody>
            ${data.financialPlan.fundingRequirements.use.map(item => `
            <tr>
              <td>${escapeHTML(item.category)}</td>
              <td>${escapeHTML(item.amount)}</td>
              <td><span class="badge">${escapeHTML(item.percentage)}</span></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.financialPlan.financialProjections ? `
    <div class="card purple">
      <div class="card-title">📈 Financial Projections</div>
      <div class="card-content">
        <table class="financial-table">
          <thead><tr><th>Year</th><th>Revenue</th><th>Expenses</th><th>Net Income</th></tr></thead>
          <tbody>
            ${data.financialPlan.financialProjections.year1 ? `
            <tr>
              <td><strong>Year 1</strong></td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year1.revenue)}</td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year1.expenses)}</td>
              <td><strong>${escapeHTML(data.financialPlan.financialProjections.year1.netIncome)}</strong></td>
            </tr>
            ` : ''}
            ${data.financialPlan.financialProjections.year2 ? `
            <tr>
              <td><strong>Year 2</strong></td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year2.revenue)}</td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year2.expenses)}</td>
              <td><strong>${escapeHTML(data.financialPlan.financialProjections.year2.netIncome)}</strong></td>
            </tr>
            ` : ''}
            ${data.financialPlan.financialProjections.year3 ? `
            <tr>
              <td><strong>Year 3</strong></td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year3.revenue)}</td>
              <td>${escapeHTML(data.financialPlan.financialProjections.year3.expenses)}</td>
              <td><strong>${escapeHTML(data.financialPlan.financialProjections.year3.netIncome)}</strong></td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        ${data.financialPlan.financialProjections.assumptions ? `
        <p style="margin-top: 15px;"><strong>Key Assumptions:</strong></p>
        ${renderList(data.financialPlan.financialProjections.assumptions)}
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.financialPlan.breakEvenAnalysis ? `
    <div class="card teal">
      <div class="card-title">⚖️ Break-Even Analysis</div>
      <div class="card-content">
        ${data.financialPlan.breakEvenAnalysis.timeline ? `<p><strong>Timeline:</strong> ${escapeHTML(data.financialPlan.breakEvenAnalysis.timeline)}</p>` : ''}
        ${data.financialPlan.breakEvenAnalysis.units ? `<p><strong>Units to Break Even:</strong> ${escapeHTML(data.financialPlan.breakEvenAnalysis.units)}</p>` : ''}
        ${data.financialPlan.breakEvenAnalysis.revenue ? `<p><strong>Revenue to Break Even:</strong> ${escapeHTML(data.financialPlan.breakEvenAnalysis.revenue)}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${data.financialPlan.keyMetrics ? `
    <div class="card indigo">
      <div class="card-title">📊 Key Financial Metrics</div>
      <div class="card-content">
        <div class="grid">
          ${data.financialPlan.keyMetrics.grossMargin ? `<p><strong>Gross Margin:</strong> ${escapeHTML(data.financialPlan.keyMetrics.grossMargin)}</p>` : ''}
          ${data.financialPlan.keyMetrics.netMargin ? `<p><strong>Net Margin:</strong> ${escapeHTML(data.financialPlan.keyMetrics.netMargin)}</p>` : ''}
          ${data.financialPlan.keyMetrics.cac ? `<p><strong>CAC:</strong> ${escapeHTML(data.financialPlan.keyMetrics.cac)}</p>` : ''}
          ${data.financialPlan.keyMetrics.ltv ? `<p><strong>LTV:</strong> ${escapeHTML(data.financialPlan.keyMetrics.ltv)}</p>` : ''}
          ${data.financialPlan.keyMetrics.burnRate ? `<p><strong>Burn Rate:</strong> ${escapeHTML(data.financialPlan.keyMetrics.burnRate)}</p>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}
  ` : ''}

  <!-- TIPS SECTION (all plan types) -->
  ${data.tips ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">💡</span> Tips for Success</div>
    <div class="card yellow">
      <div class="card-content">
        ${data.tips.map((tip, i) => `
        <div style="background: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #eab308;">
          <span class="badge yellow">${i + 1}</span>
          ${escapeHTML(tip)}
        </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p style="font-size: 14px; font-weight: 600;">📋 ${escapeHTML(metadata.companyName)} Business Plan</p>
    <p>Generated with ProCreators Business Plan AI</p>
    <p>© ${new Date().getFullYear()} All Rights Reserved</p>
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
    const htmlContent = generateBusinessPlanHTML(data, metadata)
    
    // Try to generate PDF (may fail if Chromium not installed)
    const pdfBuffer = await tryGeneratePDF(htmlContent)
    
    if (!pdfBuffer) {
      // Return HTML as fallback for browser-based PDF printing
      let libraryId = null
      if (shouldSaveToLibrary) {
        try {
          const collection = await getCollection('library')
          const libraryItem = {
            id: randomUUID(),
            userId: 'anonymous',
            type: 'business-plan',
            category: 'html',
            title: `Business Plan: ${metadata.companyName}`,
            description: `${metadata.planType} - ${metadata.industry}`,
            content: htmlContent,
            metadata: {
              planType: metadata.planType,
              industry: metadata.industry,
              stage: metadata.stage,
              contentType: 'business-plan-html'
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
    } else if (pdfBuffer instanceof Uint8Array) {
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    } else {
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    }
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`

    // Save to library if requested
    let libraryId = null
    if (shouldSaveToLibrary) {
      try {
        const collection = await getCollection('library')
        const libraryItem = {
          id: randomUUID(),
          userId: 'anonymous',
          type: 'business-plan',
          category: 'pdf',
          title: `Business Plan: ${metadata.companyName}`,
          description: `${metadata.planType} - ${metadata.industry}`,
          content: pdfDataUrl,
          metadata: {
            planType: metadata.planType,
            industry: metadata.industry,
            stage: metadata.stage,
            contentType: 'business-plan-pdf'
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
      fileName: `${metadata.companyName.replace(/\s+/g, '_')}_Business_Plan.pdf`
    })

  } catch (error) {
    console.error('Business Plan PDF Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
