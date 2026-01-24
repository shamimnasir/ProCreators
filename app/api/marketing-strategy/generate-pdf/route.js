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

// Generate comprehensive Marketing Strategy PDF HTML
function generateMarketingStrategyHTML(data, metadata) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  // Helper to safely render arrays
  const renderList = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return ''
    return `<ul>${arr.map(item => `<li>${typeof item === 'object' ? (item.strategy || item.name || item.metric || item.action || JSON.stringify(item)) : item}</li>`).join('')}</ul>`
  }

  // Helper to render object properties  
  const renderObjectProps = (obj) => {
    if (!obj) return ''
    return Object.entries(obj)
      .filter(([k, v]) => v && k !== 'recommendations' && typeof v !== 'object')
      .map(([k, v]) => `<p><strong>${k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${Array.isArray(v) ? v.join(', ') : v}</p>`)
      .join('')
  }
  
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(metadata.businessName)} - Marketing Strategy</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6; 
      color: #1a1a1a; 
      padding: 40px; 
      max-width: 900px; 
      margin: 0 auto;
      font-size: 14px;
    }
    
    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #3b82f622 0%, #8b5cf622 100%);
      padding: 60px;
      border-radius: 12px;
      page-break-after: always;
    }
    .cover-logo { font-size: 64px; margin-bottom: 20px; }
    .cover-title { font-size: 36px; font-weight: 700; color: #1e40af; margin-bottom: 10px; }
    .cover-subtitle { font-size: 18px; color: #64748b; margin-bottom: 40px; }
    .cover-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }
    .cover-meta span { background: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    
    /* Section Styles */
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { 
      font-size: 20px; 
      font-weight: 700; 
      color: #1e40af; 
      margin-bottom: 15px; 
      padding-bottom: 10px; 
      border-bottom: 3px solid #3b82f6;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-icon { font-size: 24px; }
    
    /* Cards */
    .card { 
      background: #f8fafc; 
      border-radius: 10px; 
      padding: 20px; 
      margin-bottom: 15px; 
      border-left: 4px solid #3b82f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card.green { border-left-color: #22c55e; background: #f0fdf4; }
    .card.purple { border-left-color: #8b5cf6; background: #faf5ff; }
    .card.orange { border-left-color: #f97316; background: #fff7ed; }
    .card.pink { border-left-color: #ec4899; background: #fdf2f8; }
    .card.teal { border-left-color: #14b8a6; background: #f0fdfa; }
    .card.indigo { border-left-color: #6366f1; background: #eef2ff; }
    .card.red { border-left-color: #ef4444; background: #fef2f2; }
    .card-title { font-weight: 700; margin-bottom: 10px; color: #334155; font-size: 16px; }
    .card-content { font-size: 13px; color: #475569; }
    .card-content p { margin-bottom: 8px; }
    
    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    
    /* SWOT */
    .swot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .swot-item { padding: 15px; border-radius: 10px; }
    .swot-strengths { background: #dcfce7; border-left: 4px solid #22c55e; }
    .swot-weaknesses { background: #fee2e2; border-left: 4px solid #ef4444; }
    .swot-opportunities { background: #dbeafe; border-left: 4px solid #3b82f6; }
    .swot-threats { background: #fed7aa; border-left: 4px solid #f97316; }
    .swot-title { font-weight: 700; margin-bottom: 8px; font-size: 14px; }
    
    /* Lists */
    ul { padding-left: 20px; margin-top: 8px; }
    li { margin-bottom: 6px; font-size: 13px; }
    
    /* Highlight */
    .highlight { 
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); 
      padding: 20px; 
      border-radius: 10px; 
      margin: 15px 0; 
      border-left: 4px solid #3b82f6;
    }
    
    /* Badges */
    .badge { 
      display: inline-block; 
      background: #3b82f6; 
      color: white; 
      padding: 3px 10px; 
      border-radius: 6px; 
      font-size: 11px; 
      font-weight: 600;
      margin-right: 5px;
    }
    .badge.green { background: #22c55e; }
    .badge.yellow { background: #eab308; color: #1a1a1a; }
    .badge.red { background: #ef4444; }
    .badge.purple { background: #8b5cf6; }
    
    /* Timeline */
    .timeline-item { display: flex; gap: 15px; margin-bottom: 20px; }
    .timeline-marker { 
      width: 40px; 
      height: 40px; 
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      font-weight: 700; 
      font-size: 14px; 
      flex-shrink: 0;
    }
    .timeline-content { flex: 1; background: #f8fafc; padding: 15px; border-radius: 10px; }
    
    /* KPI */
    .kpi-item { 
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); 
      padding: 15px; 
      border-radius: 8px; 
      margin-bottom: 10px; 
      border-left: 3px solid #22c55e;
    }
    .kpi-metric { font-weight: 700; color: #166534; font-size: 14px; }
    .kpi-target { color: #15803d; font-size: 12px; }
    
    /* Funnel Stages */
    .funnel-stage { padding: 20px; margin-bottom: 15px; border-radius: 10px; border-left: 5px solid; }
    .funnel-awareness { background: #f3e8ff; border-left-color: #8b5cf6; }
    .funnel-consideration { background: #dbeafe; border-left-color: #3b82f6; }
    .funnel-decision { background: #dcfce7; border-left-color: #22c55e; }
    .funnel-retention { background: #fed7aa; border-left-color: #f97316; }
    .funnel-advocacy { background: #fce7f3; border-left-color: #ec4899; }
    
    /* Recommendations */
    .rec-item { 
      background: #f0fdf4; 
      padding: 10px 15px; 
      border-radius: 6px; 
      margin-bottom: 8px; 
      font-size: 13px; 
      border-left: 3px solid #22c55e;
    }
    
    /* Budget Bar */
    .budget-bar { 
      display: flex; 
      align-items: center; 
      margin-bottom: 12px;
      gap: 10px;
    }
    .budget-label { width: 120px; font-weight: 600; font-size: 13px; }
    .budget-track { flex: 1; background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; }
    .budget-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); }
    .budget-percent { width: 50px; text-align: right; font-weight: 700; font-size: 14px; }
    
    /* Footer */
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 2px solid #e2e8f0; 
      text-align: center; 
      color: #64748b; 
      font-size: 12px;
    }
    
    /* Page breaks */
    @media print { 
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
      .card { page-break-inside: avoid; }
      .cover-page { height: auto; padding: 40px; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">📊</div>
    <h1 class="cover-title">${escapeHTML(metadata.businessName)}</h1>
    <p class="cover-subtitle">${escapeHTML(metadata.framework)}</p>
    <div class="cover-meta">
      <span>📅 ${date}</span>
      <span>🏢 ${escapeHTML(metadata.industry)}</span>
      <span>📈 ${escapeHTML(metadata.businessStage)}</span>
      ${metadata.budget ? `<span>💰 ${escapeHTML(metadata.budget)}</span>` : ''}
    </div>
  </div>

  <!-- COMPLETE MARKETING PLAN SECTIONS -->
  ${data.executiveSummary ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">✨</span> Executive Summary</div>
    <div class="grid">
      <div class="card">
        <div class="card-title">🎯 Mission</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.mission)}</p></div>
      </div>
      <div class="card green">
        <div class="card-title">🔭 Vision</div>
        <div class="card-content"><p>${escapeHTML(data.executiveSummary.vision)}</p></div>
      </div>
    </div>
    <div class="card purple">
      <div class="card-title">📊 Marketing Objective</div>
      <div class="card-content"><p>${escapeHTML(data.executiveSummary.marketingObjective)}</p></div>
    </div>
    ${data.executiveSummary.keyStrategies ? `
    <div class="card">
      <div class="card-title">🚀 Key Strategies</div>
      <div class="card-content">
        ${data.executiveSummary.keyStrategies.map((s, i) => `<div class="rec-item"><span class="badge">${i+1}</span> ${escapeHTML(s)}</div>`).join('')}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.positioning ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎪</span> Brand Positioning</div>
    <div class="highlight">
      <strong>Positioning Statement:</strong><br>
      <em>"${escapeHTML(data.positioning.positioningStatement)}"</em>
    </div>
    <div class="grid">
      <div class="card">
        <div class="card-title">💎 Unique Value Proposition</div>
        <div class="card-content"><p>${escapeHTML(data.positioning.uniqueValueProposition)}</p></div>
      </div>
      <div class="card purple">
        <div class="card-title">🎤 Brand Voice</div>
        <div class="card-content"><p>${escapeHTML(data.positioning.brandVoice)}</p></div>
      </div>
    </div>
    ${data.positioning.keyMessages ? `
    <div class="card green">
      <div class="card-title">💬 Key Messages</div>
      <div class="card-content">${renderList(data.positioning.keyMessages)}</div>
    </div>
    ` : ''}
    ${data.positioning.brandEssence ? `
    <div class="card indigo">
      <div class="card-title">✨ Brand Essence</div>
      <div class="card-content">
        <p style="font-size: 18px; font-weight: bold;">${escapeHTML(data.positioning.brandEssence)}</p>
        ${data.positioning.brandPersonality ? `<p style="margin-top: 10px;">Personality: ${data.positioning.brandPersonality.join(', ')}</p>` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.situationAnalysis?.swot ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🧠</span> SWOT Analysis</div>
    <div class="swot-grid">
      <div class="swot-item swot-strengths">
        <div class="swot-title">💪 Strengths</div>
        ${renderList(data.situationAnalysis.swot.strengths)}
      </div>
      <div class="swot-item swot-weaknesses">
        <div class="swot-title">⚠️ Weaknesses</div>
        ${renderList(data.situationAnalysis.swot.weaknesses)}
      </div>
      <div class="swot-item swot-opportunities">
        <div class="swot-title">🚀 Opportunities</div>
        ${renderList(data.situationAnalysis.swot.opportunities)}
      </div>
      <div class="swot-item swot-threats">
        <div class="swot-title">🛡️ Threats</div>
        ${renderList(data.situationAnalysis.swot.threats)}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.situationAnalysis?.competitorAnalysis ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎯</span> Competitor Analysis</div>
    ${data.situationAnalysis.competitorAnalysis.map(comp => `
    <div class="card">
      <div class="card-title">🏢 ${escapeHTML(comp.name)}</div>
      <div class="card-content">
        <p><strong>Their Strengths:</strong> ${escapeHTML(comp.strengths)}</p>
        <p><strong>Their Weaknesses:</strong> ${escapeHTML(comp.weaknesses)}</p>
        <p><strong>How to Beat Them:</strong> ${escapeHTML(comp.differentiator)}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.targetAudience?.primaryPersona ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">👥</span> Target Audience</div>
    <div class="card green">
      <div class="card-title">👤 Primary Persona: ${escapeHTML(data.targetAudience.primaryPersona.name)}</div>
      <div class="card-content">
        <p><strong>Demographics:</strong> ${escapeHTML(data.targetAudience.primaryPersona.demographics)}</p>
        <p><strong>Psychographics:</strong> ${escapeHTML(data.targetAudience.primaryPersona.psychographics)}</p>
        ${data.targetAudience.primaryPersona.painPoints ? `<p><strong>Pain Points:</strong> ${data.targetAudience.primaryPersona.painPoints.join(' • ')}</p>` : ''}
        ${data.targetAudience.primaryPersona.goals ? `<p><strong>Goals:</strong> ${data.targetAudience.primaryPersona.goals.join(' • ')}</p>` : ''}
        ${data.targetAudience.primaryPersona.preferredChannels ? `<p><strong>Preferred Channels:</strong> ${data.targetAudience.primaryPersona.preferredChannels.join(', ')}</p>` : ''}
        ${data.targetAudience.primaryPersona.buyingBehavior ? `<p><strong>Buying Behavior:</strong> ${escapeHTML(data.targetAudience.primaryPersona.buyingBehavior)}</p>` : ''}
      </div>
    </div>
    ${data.targetAudience.secondaryPersona ? `
    <div class="card purple">
      <div class="card-title">👥 Secondary Persona: ${escapeHTML(data.targetAudience.secondaryPersona.name)}</div>
      <div class="card-content">
        <p><strong>Demographics:</strong> ${escapeHTML(data.targetAudience.secondaryPersona.demographics)}</p>
        <p><strong>Psychographics:</strong> ${escapeHTML(data.targetAudience.secondaryPersona.psychographics)}</p>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- 7 Ps MARKETING MIX SECTIONS -->
  ${data.product ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎯</span> Marketing Mix (7 Ps)</div>
    
    <div class="card">
      <div class="card-title">📦 Product</div>
      <div class="card-content">
        ${renderObjectProps(data.product)}
        ${data.product.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.product.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>

    ${data.price ? `
    <div class="card green">
      <div class="card-title">💰 Price</div>
      <div class="card-content">
        ${renderObjectProps(data.price)}
        ${data.price.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.price.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.place ? `
    <div class="card purple">
      <div class="card-title">📍 Place (Distribution)</div>
      <div class="card-content">
        ${renderObjectProps(data.place)}
        ${data.place.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.place.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.promotion ? `
    <div class="card orange">
      <div class="card-title">📣 Promotion</div>
      <div class="card-content">
        ${renderObjectProps(data.promotion)}
        ${data.promotion.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.promotion.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.people ? `
    <div class="card pink">
      <div class="card-title">👥 People</div>
      <div class="card-content">
        ${renderObjectProps(data.people)}
        ${data.people.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.people.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.process ? `
    <div class="card teal">
      <div class="card-title">⚙️ Process</div>
      <div class="card-content">
        ${renderObjectProps(data.process)}
        ${data.process.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.process.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${data.physicalEvidence ? `
    <div class="card indigo">
      <div class="card-title">🏪 Physical Evidence</div>
      <div class="card-content">
        ${renderObjectProps(data.physicalEvidence)}
        ${data.physicalEvidence.recommendations ? `
        <div style="margin-top: 15px;">
          <strong>Recommendations:</strong>
          ${data.physicalEvidence.recommendations.map(r => `<div class="rec-item">✅ ${escapeHTML(r)}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- 7Ps ACTION PLAN -->
  ${data.actionPlan ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">⚡</span> Action Plan</div>
    ${data.actionPlan.map((item, i) => `
    <div class="card ${item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'orange' : 'green'}">
      <div class="card-content">
        <span class="badge">${escapeHTML(item.p)}</span>
        <span class="badge ${item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'yellow' : 'green'}">${escapeHTML(item.priority)}</span>
        <strong>${escapeHTML(item.action)}</strong>
        <br><small>Timeline: ${escapeHTML(item.timeline)}</small>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- STP MODEL SECTIONS -->
  ${data.segmentation ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎪</span> Market Segmentation</div>
    ${['demographic', 'geographic', 'psychographic', 'behavioral'].map(type => {
      const segments = data.segmentation[type]
      if (!segments?.length) return ''
      const icons = { demographic: '👥', geographic: '🌍', psychographic: '🧠', behavioral: '🎯' }
      return `
      <div class="card">
        <div class="card-title">${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)} Segmentation</div>
        <div class="card-content">
          ${segments.map(seg => `
          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <strong>${escapeHTML(seg.segment)}</strong>
            <p style="font-size: 12px; color: #64748b;">${escapeHTML(seg.characteristics)}</p>
            <span class="badge">Size: ${escapeHTML(seg.size)}</span>
            <span class="badge ${seg.potential === 'High' ? 'green' : 'yellow'}">${escapeHTML(seg.potential)} Potential</span>
          </div>
          `).join('')}
        </div>
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  ${data.targeting ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎯</span> Targeting Strategy</div>
    <div class="highlight">Strategy: <strong>${escapeHTML(data.targeting.strategy)}</strong></div>
    ${data.targeting.primarySegment ? `
    <div class="card green">
      <div class="card-title">🎯 Primary Target: ${escapeHTML(data.targeting.primarySegment.name)}</div>
      <div class="card-content">
        <p><strong>Why:</strong> ${escapeHTML(data.targeting.primarySegment.why)}</p>
        <p><strong>Size:</strong> ${escapeHTML(data.targeting.primarySegment.size)}</p>
        <p><strong>Growth Potential:</strong> ${escapeHTML(data.targeting.primarySegment.growthPotential)}</p>
        <p><strong>Accessibility:</strong> ${escapeHTML(data.targeting.primarySegment.accessibility)}</p>
        <p><strong>Profitability:</strong> ${escapeHTML(data.targeting.primarySegment.profitability)}</p>
      </div>
    </div>
    ` : ''}
    ${data.targeting.secondarySegment ? `
    <div class="card purple">
      <div class="card-title">Secondary Target: ${escapeHTML(data.targeting.secondarySegment.name)}</div>
      <div class="card-content">
        <p>${escapeHTML(data.targeting.secondarySegment.why)}</p>
        <p><strong>Approach:</strong> ${escapeHTML(data.targeting.secondarySegment.approach || '')}</p>
      </div>
    </div>
    ` : ''}
    ${data.targeting.segmentsToAvoid ? `
    <div class="card red">
      <div class="card-title">⚠️ Segments to Avoid</div>
      ${renderList(data.targeting.segmentsToAvoid)}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- ANSOFF MATRIX SECTIONS -->
  ${data.currentState ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📈</span> Ansoff Growth Matrix</div>
    <div class="highlight">
      <strong>Current State:</strong><br>
      <strong>Products:</strong> ${escapeHTML(data.currentState.products)}<br>
      <strong>Markets:</strong> ${escapeHTML(data.currentState.markets)}<br>
      <strong>Revenue:</strong> ${escapeHTML(data.currentState.revenue)}
    </div>
  </div>
  ` : ''}

  ${data.marketPenetration ? `
  <div class="section">
    <div class="card green">
      <div class="card-title">📈 Market Penetration <span class="badge green">Low Risk</span></div>
      <div class="card-content">
        <p><em>${escapeHTML(data.marketPenetration.description)}</em></p>
        ${data.marketPenetration.strategies?.map(s => `
        <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin: 10px 0;">
          <strong>${escapeHTML(s.strategy)}</strong>
          <p>Expected Growth: ${escapeHTML(s.expectedGrowth)}</p>
          ${s.tactics ? `<p>Tactics: ${s.tactics.join(', ')}</p>` : ''}
        </div>
        `).join('') || ''}
        ${data.marketPenetration.quickWins ? `
        <p><strong>Quick Wins:</strong></p>
        ${renderList(data.marketPenetration.quickWins.map(w => `⚡ ${w}`))}
        ` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.marketDevelopment ? `
  <div class="section">
    <div class="card">
      <div class="card-title">🌍 Market Development <span class="badge yellow">Medium Risk</span></div>
      <div class="card-content">
        <p><em>${escapeHTML(data.marketDevelopment.description)}</em></p>
        ${data.marketDevelopment.newMarkets?.map(m => `
        <div style="background: #dbeafe; padding: 12px; border-radius: 8px; margin: 10px 0;">
          <strong>${escapeHTML(m.market)}</strong>
          <p>${escapeHTML(m.opportunity)}</p>
          <p>Entry Strategy: ${escapeHTML(m.entryStrategy)}</p>
        </div>
        `).join('') || ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.productDevelopment ? `
  <div class="section">
    <div class="card purple">
      <div class="card-title">🚀 Product Development <span class="badge yellow">Medium Risk</span></div>
      <div class="card-content">
        <p><em>${escapeHTML(data.productDevelopment.description)}</em></p>
        ${data.productDevelopment.opportunities?.map(o => `
        <div style="background: #f3e8ff; padding: 12px; border-radius: 8px; margin: 10px 0;">
          <strong>${escapeHTML(o.product)}</strong>
          <p>Target Need: ${escapeHTML(o.targetNeed)}</p>
          <p>Timeline: ${escapeHTML(o.timeline)}</p>
        </div>
        `).join('') || ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.diversification ? `
  <div class="section">
    <div class="card red">
      <div class="card-title">🎲 Diversification <span class="badge red">High Risk</span></div>
      <div class="card-content">
        <p><em>${escapeHTML(data.diversification.description)}</em></p>
        <p><strong>Recommendation:</strong> ${escapeHTML(data.diversification.recommendation)}</p>
      </div>
    </div>
  </div>
  ` : ''}

  ${data.recommendedPath ? `
  <div class="section">
    <div class="card green">
      <div class="card-title">✅ Recommended Growth Path</div>
      <div class="card-content">
        <p><span class="badge green">${escapeHTML(data.recommendedPath.primaryStrategy)}</span></p>
        <p>${escapeHTML(data.recommendedPath.rationale)}</p>
        ${data.recommendedPath.sequencing ? `
        <p style="margin-top: 10px;"><strong>Sequencing:</strong></p>
        <p>${data.recommendedPath.sequencing.map((s, i) => `${i+1}. ${escapeHTML(s)}`).join(' → ')}</p>
        ` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- FULL-FUNNEL SECTIONS -->
  ${data.funnelOverview ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🔽</span> Full-Funnel Marketing Strategy</div>
    <div class="highlight">
      <strong>Total Addressable Market:</strong> ${escapeHTML(data.funnelOverview.totalAddressableMarket)}<br>
      <strong>Current Funnel Health:</strong> ${escapeHTML(data.funnelOverview.currentFunnelHealth)}<br>
      ${data.funnelOverview.biggestLeaks ? `<strong>Biggest Leaks:</strong> ${data.funnelOverview.biggestLeaks.join(', ')}` : ''}
    </div>
  </div>
  ` : ''}

  ${data.awareness ? `
  <div class="section">
    <div class="funnel-stage funnel-awareness">
      <div class="card-title">👁️ AWARENESS (Top of Funnel)</div>
      <p><strong>Goal:</strong> ${escapeHTML(data.awareness.goal || data.awareness.objective)}</p>
      ${data.awareness.channels ? `
      <p><strong>Channels:</strong></p>
      ${data.awareness.channels.slice(0, 5).map(c => `<div class="rec-item">${escapeHTML(c.channel)}: ${escapeHTML(c.tactic)}</div>`).join('')}
      ` : ''}
      ${data.awareness.content?.types ? `<p><strong>Content Types:</strong> ${data.awareness.content.types.join(', ')}</p>` : ''}
    </div>
  </div>
  ` : ''}

  ${data.consideration ? `
  <div class="section">
    <div class="funnel-stage funnel-consideration">
      <div class="card-title">🤔 CONSIDERATION (Middle of Funnel)</div>
      <p><strong>Goal:</strong> ${escapeHTML(data.consideration.goal || data.consideration.objective)}</p>
      ${data.consideration.channels ? `
      <p><strong>Channels:</strong></p>
      ${data.consideration.channels.slice(0, 5).map(c => `<div class="rec-item">${escapeHTML(c.channel)}: ${escapeHTML(c.tactic)}</div>`).join('')}
      ` : ''}
      ${data.consideration.content?.leadMagnets ? `<p><strong>Lead Magnets:</strong> ${data.consideration.content.leadMagnets.join(', ')}</p>` : ''}
    </div>
  </div>
  ` : ''}

  ${data.decision ? `
  <div class="section">
    <div class="funnel-stage funnel-decision">
      <div class="card-title">✅ DECISION (Bottom of Funnel)</div>
      <p><strong>Goal:</strong> ${escapeHTML(data.decision.goal || data.decision.objective)}</p>
      ${data.decision.channels ? `
      <p><strong>Channels:</strong></p>
      ${data.decision.channels.slice(0, 5).map(c => `<div class="rec-item">${escapeHTML(c.channel)}: ${escapeHTML(c.tactic)}</div>`).join('')}
      ` : ''}
      ${data.decision.content?.socialProof ? `<p><strong>Social Proof:</strong> ${data.decision.content.socialProof.join(', ')}</p>` : ''}
    </div>
  </div>
  ` : ''}

  ${data.retention ? `
  <div class="section">
    <div class="funnel-stage funnel-retention">
      <div class="card-title">💎 RETENTION (Post-Purchase)</div>
      <p><strong>Goal:</strong> ${escapeHTML(data.retention.goal || data.retention.objective)}</p>
      ${data.retention.tactics ? `
      <p><strong>Tactics:</strong></p>
      ${data.retention.tactics.slice(0, 5).map(t => `<div class="rec-item">${escapeHTML(t.tactic || t)}: ${escapeHTML(t.description || '')}</div>`).join('')}
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${data.advocacy ? `
  <div class="section">
    <div class="funnel-stage funnel-advocacy">
      <div class="card-title">📣 ADVOCACY (Referral)</div>
      <p><strong>Goal:</strong> ${escapeHTML(data.advocacy.goal || data.advocacy.objective)}</p>
      ${data.advocacy.referralProgram ? `<p><strong>Referral Program:</strong> ${escapeHTML(data.advocacy.referralProgram)}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- COMMON SECTIONS FOR ALL FRAMEWORKS -->
  ${data.smartGoals ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">🎯</span> SMART Goals</div>
    ${data.smartGoals.map(g => `
    <div class="card">
      <div class="card-title">${escapeHTML(g.goal)}</div>
      <div class="card-content">
        <p><strong>Metric:</strong> ${escapeHTML(g.metric)}</p>
        <p><strong>Target:</strong> ${escapeHTML(g.target)}</p>
        <p><strong>Deadline:</strong> ${escapeHTML(g.deadline)}</p>
        <p><strong>Owner:</strong> ${escapeHTML(g.owner)}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.channelStrategy ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📢</span> Channel Strategy</div>
    ${['paid', 'owned', 'earned'].map(type => {
      const d = data.channelStrategy[type]
      if (!d) return ''
      const icons = { paid: '💵', owned: '🏠', earned: '🌟' }
      return `
      <div class="card ${type === 'paid' ? 'green' : type === 'owned' ? '' : 'purple'}">
        <div class="card-title">${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)} Media</div>
        <div class="card-content">
          ${d.channels ? `<p><strong>Channels:</strong> ${d.channels.join(', ')}</p>` : ''}
          ${d.strategy ? `<p><strong>Strategy:</strong> ${escapeHTML(d.strategy)}</p>` : ''}
          ${d.budgetAllocation ? `<p><strong>Budget:</strong> ${escapeHTML(d.budgetAllocation)}</p>` : ''}
        </div>
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  ${data.budgetAllocation?.breakdown ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">💰</span> Budget Allocation</div>
    <p style="margin-bottom: 15px;"><strong>Total Budget:</strong> ${escapeHTML(data.budgetAllocation.totalBudget)}</p>
    ${data.budgetAllocation.breakdown.map(item => `
    <div class="budget-bar">
      <div class="budget-label">${escapeHTML(item.category)}</div>
      <div class="budget-track"><div class="budget-fill" style="width: ${item.percentage}%;"></div></div>
      <div class="budget-percent">${item.percentage}%</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.implementationTimeline ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📅</span> Implementation Timeline</div>
    ${['quarter1', 'quarter2', 'quarter3', 'quarter4'].map((q, i) => {
      const qData = data.implementationTimeline[q]
      if (!qData) return ''
      return `
      <div class="timeline-item">
        <div class="timeline-marker">Q${i+1}</div>
        <div class="timeline-content">
          <div class="card-title">${escapeHTML(qData.theme || '')}</div>
          ${qData.priorities ? `<p><strong>Priorities:</strong> ${qData.priorities.join(', ')}</p>` : ''}
          ${qData.milestones ? `<p><strong>Milestones:</strong> ${qData.milestones.join(', ')}</p>` : ''}
        </div>
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  ${data.timeline ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📅</span> Growth Timeline</div>
    ${data.timeline.shortTerm ? `
    <div class="card green">
      <div class="card-title">Short Term (0-6 months)</div>
      <div class="card-content">
        <p>${escapeHTML(data.timeline.shortTerm.focus)}</p>
        ${data.timeline.shortTerm.goals ? renderList(data.timeline.shortTerm.goals) : ''}
      </div>
    </div>
    ` : ''}
    ${data.timeline.mediumTerm ? `
    <div class="card orange">
      <div class="card-title">Medium Term (6-18 months)</div>
      <div class="card-content">
        <p>${escapeHTML(data.timeline.mediumTerm.focus)}</p>
        ${data.timeline.mediumTerm.goals ? renderList(data.timeline.mediumTerm.goals) : ''}
      </div>
    </div>
    ` : ''}
    ${data.timeline.longTerm ? `
    <div class="card purple">
      <div class="card-title">Long Term (18+ months)</div>
      <div class="card-content">
        <p>${escapeHTML(data.timeline.longTerm.focus)}</p>
        ${data.timeline.longTerm.goals ? renderList(data.timeline.longTerm.goals) : ''}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${data.kpis ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">📈</span> Key Performance Indicators</div>
    <div class="grid">
      <div>
        <div class="card-title">Primary KPIs</div>
        ${data.kpis.primary?.map(k => `
        <div class="kpi-item">
          <div class="kpi-metric">${escapeHTML(k.metric)}</div>
          <div class="kpi-target">Target: ${escapeHTML(k.target)} | ${escapeHTML(k.frequency)}</div>
        </div>
        `).join('') || ''}
      </div>
      <div>
        <div class="card-title">Secondary KPIs</div>
        ${data.kpis.secondary?.map(k => `
        <div class="kpi-item">
          <div class="kpi-metric">${escapeHTML(k.metric)}</div>
          <div class="kpi-target">Target: ${escapeHTML(k.target)} | ${escapeHTML(k.frequency)}</div>
        </div>
        `).join('') || ''}
      </div>
    </div>
  </div>
  ` : ''}

  ${data.risksMitigation ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">⚠️</span> Risks & Mitigation</div>
    ${data.risksMitigation.map(r => `
    <div class="card ${r.impact === 'High' ? 'red' : r.impact === 'Medium' ? 'orange' : ''}">
      <div class="card-content">
        <span class="badge ${r.impact === 'High' ? 'red' : r.impact === 'Medium' ? 'yellow' : 'green'}">${escapeHTML(r.impact)} Impact</span>
        <strong>${escapeHTML(r.risk)}</strong>
        <p><strong>Mitigation:</strong> ${escapeHTML(r.mitigation)}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.nextSteps ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">⚡</span> Immediate Next Steps</div>
    ${data.nextSteps.map((s, i) => `
    <div class="card ${i === 0 ? 'green' : ''}">
      <div class="card-content">
        <span class="badge">${i + 1}</span>
        <strong>${escapeHTML(s.action)}</strong>
        <br><small>Deadline: ${escapeHTML(s.deadline)} | Owner: ${escapeHTML(s.owner)}</small>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated with ProCreators Marketing Strategy AI</p>
    <p>© ${new Date().getFullYear()} ${escapeHTML(metadata.businessName)} | All Rights Reserved</p>
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
    const htmlContent = generateMarketingStrategyHTML(data, metadata)
    
    // Try to generate PDF (may fail if Chromium not installed)
    const pdfBuffer = await tryGeneratePDF(htmlContent)
    
    if (!pdfBuffer) {
      // Return HTML as fallback for browser-based PDF printing
      // Also save HTML content to library for later viewing
      let libraryId = null
      if (shouldSaveToLibrary) {
        try {
          const collection = await getCollection('library')
          const libraryItem = {
            id: randomUUID(),
            userId: 'anonymous',
            type: 'marketing-strategy',
            category: 'html',
            title: `Marketing Strategy: ${metadata.businessName}`,
            description: `${metadata.framework} - ${metadata.industry}`,
            content: htmlContent,
            metadata: {
              framework: metadata.framework,
              industry: metadata.industry,
              businessStage: metadata.businessStage,
              budget: metadata.budget,
              contentType: 'marketing-strategy-html'
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
    
    // Convert to base64 - handle both Buffer and Uint8Array
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
          type: 'marketing-strategy',
          category: 'pdf',
          title: `Marketing Strategy: ${metadata.businessName}`,
          description: `${metadata.framework} - ${metadata.industry}`,
          content: pdfDataUrl,
          metadata: {
            framework: metadata.framework,
            industry: metadata.industry,
            businessStage: metadata.businessStage,
            budget: metadata.budget,
            contentType: 'marketing-strategy-pdf'
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
      fileName: `${metadata.businessName.replace(/\s+/g, '_')}_Marketing_Strategy.pdf`
    })

  } catch (error) {
    console.error('Marketing Strategy PDF Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
