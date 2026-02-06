import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import { enforceRateLimit } from '@/lib/rate-limiter'

// Generate SWOT Analysis PDF HTML
function generateSwotHTML(data, metadata) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const escapeHTML = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  const getImpactColor = (impact) => {
    if (!impact) return '#64748b'
    const i = impact.toLowerCase()
    if (i === 'high') return '#dc2626'
    if (i === 'medium') return '#f59e0b'
    return '#22c55e'
  }

  const getImpactBg = (impact) => {
    if (!impact) return '#f1f5f9'
    const i = impact.toLowerCase()
    if (i === 'high') return '#fef2f2'
    if (i === 'medium') return '#fffbeb'
    return '#f0fdf4'
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(metadata.subjectName)} - SWOT Analysis</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6; 
      color: #1a1a1a; 
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
      background: white;
    }
    
    /* Cover */
    .cover {
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, #1e40af15 0%, #7c3aed15 100%);
      border-radius: 20px;
      margin-bottom: 40px;
      page-break-after: always;
    }
    .cover-icon { font-size: 64px; margin-bottom: 20px; }
    .cover-title { font-size: 36px; font-weight: 800; color: #1e40af; margin-bottom: 10px; }
    .cover-subtitle { font-size: 18px; color: #64748b; margin-bottom: 30px; }
    .cover-meta { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .cover-meta span { 
      background: white; 
      padding: 10px 20px; 
      border-radius: 10px; 
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    /* Executive Summary */
    .summary {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 40px;
      border-left: 5px solid #3b82f6;
    }
    .summary-title { font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 10px; }
    .summary-text { font-size: 15px; color: #334155; }
    
    /* SWOT Grid */
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .swot-quadrant {
      border-radius: 16px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .quadrant-header {
      padding: 20px 25px;
      color: white;
    }
    .quadrant-header.strengths { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    .quadrant-header.weaknesses { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
    .quadrant-header.opportunities { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .quadrant-header.threats { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    
    .quadrant-title { font-size: 20px; font-weight: 700; margin-bottom: 5px; }
    .quadrant-subtitle { font-size: 13px; opacity: 0.9; }
    
    .quadrant-content {
      padding: 20px;
      background: #f8fafc;
      min-height: 200px;
    }
    .quadrant-content.strengths { background: #f0fdf4; }
    .quadrant-content.weaknesses { background: #fff7ed; }
    .quadrant-content.opportunities { background: #eff6ff; }
    .quadrant-content.threats { background: #fef2f2; }
    
    /* Item Cards */
    .swot-item {
      background: white;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .item-title { font-weight: 700; font-size: 14px; color: #1e293b; flex: 1; }
    .item-impact {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .item-description { font-size: 13px; color: #475569; margin-bottom: 8px; }
    .item-detail { font-size: 12px; color: #64748b; padding: 8px; background: #f8fafc; border-radius: 6px; margin-top: 8px; }
    .item-detail strong { color: #334155; }
    
    /* Strategies Section */
    .strategies-section {
      margin-bottom: 40px;
      page-break-before: always;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .strategy-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid #e2e8f0;
    }
    .strategy-card.so { border-color: #22c55e; background: #f0fdf4; }
    .strategy-card.wo { border-color: #f97316; background: #fff7ed; }
    .strategy-card.st { border-color: #3b82f6; background: #eff6ff; }
    .strategy-card.wt { border-color: #ef4444; background: #fef2f2; }
    
    .strategy-title { font-weight: 700; font-size: 15px; margin-bottom: 5px; }
    .strategy-card.so .strategy-title { color: #166534; }
    .strategy-card.wo .strategy-title { color: #9a3412; }
    .strategy-card.st .strategy-title { color: #1e40af; }
    .strategy-card.wt .strategy-title { color: #991b1b; }
    
    .strategy-desc { font-size: 12px; color: #64748b; margin-bottom: 12px; }
    .strategy-list { list-style: none; padding: 0; }
    .strategy-list li { 
      font-size: 13px; 
      padding: 8px 0 8px 20px; 
      position: relative;
      border-bottom: 1px solid #e2e8f0;
    }
    .strategy-list li:last-child { border-bottom: none; }
    .strategy-list li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: bold;
    }
    
    /* Priority Actions */
    .actions-section {
      margin-bottom: 40px;
    }
    .action-card {
      display: flex;
      align-items: center;
      gap: 15px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 15px 20px;
      margin-bottom: 12px;
    }
    .action-number {
      width: 35px;
      height: 35px;
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
    .action-content { flex: 1; }
    .action-title { font-weight: 600; font-size: 14px; color: #1e293b; }
    .action-meta { font-size: 12px; color: #64748b; margin-top: 3px; }
    .action-badge {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 10px;
      font-weight: 600;
    }
    .action-badge.immediate { background: #fef2f2; color: #dc2626; }
    .action-badge.short-term { background: #fffbeb; color: #d97706; }
    .action-badge.medium-term { background: #f0fdf4; color: #16a34a; }
    
    /* Key Insights */
    .insights-section {
      background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 40px;
    }
    .insights-title { font-size: 18px; font-weight: 700; color: #7c3aed; margin-bottom: 15px; }
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .insight-item:last-child { border-bottom: none; }
    .insight-icon { font-size: 20px; }
    .insight-text { font-size: 14px; color: #334155; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 30px;
      color: #64748b;
      font-size: 12px;
      border-top: 2px solid #e2e8f0;
      margin-top: 40px;
    }
    
    @media print {
      body { padding: 20px; }
      .cover { page-break-after: always; }
      .swot-quadrant { page-break-inside: avoid; }
      .strategies-section { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-icon">📊</div>
    <h1 class="cover-title">SWOT Analysis</h1>
    <p class="cover-subtitle">${escapeHTML(metadata.subjectName)}</p>
    <div class="cover-meta">
      <span>📅 ${date}</span>
      ${metadata.analysisType ? `<span>📋 ${escapeHTML(metadata.analysisType)}</span>` : ''}
      ${metadata.industry ? `<span>🏢 ${escapeHTML(metadata.industry)}</span>` : ''}
    </div>
  </div>

  <!-- Executive Summary -->
  ${data.executiveSummary ? `
  <div class="summary">
    <div class="summary-title">📌 Executive Summary</div>
    <div class="summary-text">${escapeHTML(data.executiveSummary)}</div>
  </div>
  ` : ''}

  <!-- SWOT Grid -->
  <div class="swot-grid">
    <!-- Strengths -->
    <div class="swot-quadrant">
      <div class="quadrant-header strengths">
        <div class="quadrant-title">💪 ${data.strengths?.title || 'Strengths'}</div>
        <div class="quadrant-subtitle">${data.strengths?.subtitle || 'Internal Positive Factors'}</div>
      </div>
      <div class="quadrant-content strengths">
        ${data.strengths?.items?.map(item => `
        <div class="swot-item">
          <div class="item-header">
            <div class="item-title">${escapeHTML(item.point)}</div>
            ${item.impact ? `<span class="item-impact" style="background: ${getImpactBg(item.impact)}; color: ${getImpactColor(item.impact)}">${escapeHTML(item.impact)}</span>` : ''}
          </div>
          <div class="item-description">${escapeHTML(item.description)}</div>
          ${item.strategicImplication ? `<div class="item-detail"><strong>Strategy:</strong> ${escapeHTML(item.strategicImplication)}</div>` : ''}
        </div>
        `).join('') || '<p>No strengths identified</p>'}
      </div>
    </div>

    <!-- Weaknesses -->
    <div class="swot-quadrant">
      <div class="quadrant-header weaknesses">
        <div class="quadrant-title">⚠️ ${data.weaknesses?.title || 'Weaknesses'}</div>
        <div class="quadrant-subtitle">${data.weaknesses?.subtitle || 'Internal Negative Factors'}</div>
      </div>
      <div class="quadrant-content weaknesses">
        ${data.weaknesses?.items?.map(item => `
        <div class="swot-item">
          <div class="item-header">
            <div class="item-title">${escapeHTML(item.point)}</div>
            ${item.impact ? `<span class="item-impact" style="background: ${getImpactBg(item.impact)}; color: ${getImpactColor(item.impact)}">${escapeHTML(item.impact)}</span>` : ''}
          </div>
          <div class="item-description">${escapeHTML(item.description)}</div>
          ${item.mitigationStrategy ? `<div class="item-detail"><strong>Mitigation:</strong> ${escapeHTML(item.mitigationStrategy)}</div>` : ''}
        </div>
        `).join('') || '<p>No weaknesses identified</p>'}
      </div>
    </div>

    <!-- Opportunities -->
    <div class="swot-quadrant">
      <div class="quadrant-header opportunities">
        <div class="quadrant-title">🚀 ${data.opportunities?.title || 'Opportunities'}</div>
        <div class="quadrant-subtitle">${data.opportunities?.subtitle || 'External Positive Factors'}</div>
      </div>
      <div class="quadrant-content opportunities">
        ${data.opportunities?.items?.map(item => `
        <div class="swot-item">
          <div class="item-header">
            <div class="item-title">${escapeHTML(item.point)}</div>
            ${item.impact ? `<span class="item-impact" style="background: ${getImpactBg(item.impact)}; color: ${getImpactColor(item.impact)}">${escapeHTML(item.impact)}</span>` : ''}
          </div>
          <div class="item-description">${escapeHTML(item.description)}</div>
          ${item.captureStrategy ? `<div class="item-detail"><strong>Capture:</strong> ${escapeHTML(item.captureStrategy)}</div>` : ''}
        </div>
        `).join('') || '<p>No opportunities identified</p>'}
      </div>
    </div>

    <!-- Threats -->
    <div class="swot-quadrant">
      <div class="quadrant-header threats">
        <div class="quadrant-title">🛡️ ${data.threats?.title || 'Threats'}</div>
        <div class="quadrant-subtitle">${data.threats?.subtitle || 'External Negative Factors'}</div>
      </div>
      <div class="quadrant-content threats">
        ${data.threats?.items?.map(item => `
        <div class="swot-item">
          <div class="item-header">
            <div class="item-title">${escapeHTML(item.point)}</div>
            ${item.impact ? `<span class="item-impact" style="background: ${getImpactBg(item.impact)}; color: ${getImpactColor(item.impact)}">${escapeHTML(item.impact)}</span>` : ''}
          </div>
          <div class="item-description">${escapeHTML(item.description)}</div>
          ${item.contingencyPlan ? `<div class="item-detail"><strong>Contingency:</strong> ${escapeHTML(item.contingencyPlan)}</div>` : ''}
        </div>
        `).join('') || '<p>No threats identified</p>'}
      </div>
    </div>
  </div>

  <!-- Strategic Recommendations -->
  ${data.strategicRecommendations ? `
  <div class="strategies-section">
    <div class="section-title">🎯 Strategic Recommendations</div>
    <div class="strategy-grid">
      ${data.strategicRecommendations.soStrategies ? `
      <div class="strategy-card so">
        <div class="strategy-title">${escapeHTML(data.strategicRecommendations.soStrategies.title)}</div>
        <div class="strategy-desc">${escapeHTML(data.strategicRecommendations.soStrategies.description)}</div>
        <ul class="strategy-list">
          ${data.strategicRecommendations.soStrategies.strategies?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}
        </ul>
      </div>
      ` : ''}
      
      ${data.strategicRecommendations.woStrategies ? `
      <div class="strategy-card wo">
        <div class="strategy-title">${escapeHTML(data.strategicRecommendations.woStrategies.title)}</div>
        <div class="strategy-desc">${escapeHTML(data.strategicRecommendations.woStrategies.description)}</div>
        <ul class="strategy-list">
          ${data.strategicRecommendations.woStrategies.strategies?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}
        </ul>
      </div>
      ` : ''}
      
      ${data.strategicRecommendations.stStrategies ? `
      <div class="strategy-card st">
        <div class="strategy-title">${escapeHTML(data.strategicRecommendations.stStrategies.title)}</div>
        <div class="strategy-desc">${escapeHTML(data.strategicRecommendations.stStrategies.description)}</div>
        <ul class="strategy-list">
          ${data.strategicRecommendations.stStrategies.strategies?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}
        </ul>
      </div>
      ` : ''}
      
      ${data.strategicRecommendations.wtStrategies ? `
      <div class="strategy-card wt">
        <div class="strategy-title">${escapeHTML(data.strategicRecommendations.wtStrategies.title)}</div>
        <div class="strategy-desc">${escapeHTML(data.strategicRecommendations.wtStrategies.description)}</div>
        <ul class="strategy-list">
          ${data.strategicRecommendations.wtStrategies.strategies?.map(s => `<li>${escapeHTML(s)}</li>`).join('') || ''}
        </ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Priority Actions -->
  ${data.priorityActions && data.priorityActions.length > 0 ? `
  <div class="actions-section">
    <div class="section-title">⚡ Priority Actions</div>
    ${data.priorityActions.map((action, i) => `
    <div class="action-card">
      <div class="action-number">${i + 1}</div>
      <div class="action-content">
        <div class="action-title">${escapeHTML(action.action)}</div>
        <div class="action-meta">${escapeHTML(action.category)} • ${escapeHTML(action.resources || '')}</div>
      </div>
      <span class="action-badge ${(action.urgency || '').toLowerCase().replace(/[- ]/g, '-')}">${escapeHTML(action.urgency)}</span>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Key Insights -->
  ${data.keyInsights && data.keyInsights.length > 0 ? `
  <div class="insights-section">
    <div class="insights-title">💡 Key Insights</div>
    ${data.keyInsights.map(insight => `
    <div class="insight-item">
      <span class="insight-icon">✦</span>
      <span class="insight-text">${escapeHTML(insight)}</span>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p style="font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">📊 ${escapeHTML(metadata.subjectName)} SWOT Analysis</p>
    <p>© ${new Date().getFullYear()} • Confidential Strategic Document</p>
  </div>
</body>
</html>
  `
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const body = await request.json()
    const { data, metadata, saveToLibrary: shouldSaveToLibrary } = body

    if (!data || !metadata) {
      return NextResponse.json(
        { success: false, error: 'Missing data or metadata' },
        { status: 400 }
      )
    }

    // Generate HTML
    const htmlContent = generateSwotHTML(data, metadata)

    // Save to library if requested
    let libraryId = null
    if (shouldSaveToLibrary) {
      try {
        const collection = await getCollection('library')
        const libraryItem = {
          id: randomUUID(),
          userId: 'anonymous',
          type: 'swot-analysis',
          category: 'html',
          title: `SWOT: ${metadata.subjectName}`,
          description: `${metadata.analysisType} - ${metadata.industry}`,
          content: htmlContent,
          metadata: {
            analysisType: metadata.analysisType,
            industry: metadata.industry,
            contentType: 'swot-analysis-html'
          },
          userTier: 'free',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      message: 'PDF content generated'
    })

  } catch (error) {
    console.error('SWOT PDF Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
