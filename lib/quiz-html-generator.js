// Quiz HTML Generator for complex scripts (Bengali, Hindi, Arabic, etc.)
// Uses Google Fonts for proper text rendering

// Escape HTML special characters
function escapeHTML(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Generate Quiz HTML
export function generateQuizHTML(content, options) {
  const { 
    title, 
    authorName, 
    primaryColor = '#1e40af', 
    secondaryColor = '#3b82f6',
    gradeLevel,
    includeAnswerKey = true,
    paperSize = '8.5x11'
  } = options
  
  const questions = content.questions || []
  const finalTitle = title || content.title || 'Quiz'
  
  // Determine paper size dimensions
  const sizes = {
    '8.5x11': '8.5in 11in',
    '8x10': '8in 10in',
    '6x9': '6in 9in',
    'a4': '210mm 297mm'
  }
  const pageSize = sizes[paperSize] || sizes['8.5x11']
  
  // Generate questions HTML
  const questionsHTML = questions.map((q, idx) => {
    let optionsHTML = ''
    
    if (q.type === 'multiple-choice' && q.options) {
      optionsHTML = `<div class="options">
        ${q.options.map(opt => `
          <div class="option">
            <span class="option-circle"></span>
            <span>${escapeHTML(opt)}</span>
          </div>
        `).join('')}
      </div>`
    } else if (q.type === 'true-false') {
      optionsHTML = `<div class="options">
        <div class="option">
          <span class="option-circle"></span>
          <span>True</span>
        </div>
        <div class="option">
          <span class="option-circle"></span>
          <span>False</span>
        </div>
      </div>`
    } else if (q.type === 'fill-blank' || q.type === 'short-answer') {
      optionsHTML = `<div class="answer-line"></div>
        ${q.type === 'short-answer' ? '<div class="answer-line"></div><div class="answer-line"></div>' : ''}`
    }
    
    return `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${idx + 1}</span>
          <span class="question-text">${escapeHTML(q.question || '')}</span>
        </div>
        ${optionsHTML}
      </div>
    `
  }).join('')
  
  // Generate answers HTML
  const answersHTML = questions.map((q, idx) => `
    <div class="answer-item">
      <span class="answer-number">${idx + 1}</span>
      <span class="answer-text">${escapeHTML(q.answer || 'See explanation')}</span>
      ${q.explanation ? `<div class="answer-explanation">${escapeHTML(q.explanation)}</div>` : ''}
    </div>
  `).join('')
  
  // Bonus question HTML
  const bonusHTML = content.bonusQuestion && content.bonusQuestion.question ? `
    <div class="bonus-section">
      <div class="bonus-label">BONUS QUESTION</div>
      <div>${escapeHTML(content.bonusQuestion.question)}</div>
    </div>
  ` : ''
  
  // Bonus answer HTML
  const bonusAnswerHTML = content.bonusQuestion && content.bonusQuestion.answer ? `
    <div class="bonus-answer">
      <div class="bonus-answer-label">BONUS ANSWER:</div>
      <div>${escapeHTML(content.bonusQuestion.answer)}</div>
    </div>
  ` : ''
  
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page { 
      size: ${pageSize}; 
      margin: 0.5in; 
    }
    
    body {
      font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
      line-height: 1.6;
      color: #222;
      font-size: 12pt;
    }
    
    .page {
      page-break-after: always;
      min-height: calc(11in - 1in);
      position: relative;
    }
    
    .page:last-child { page-break-after: auto; }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(11in - 1in);
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      padding: 40px;
      border-radius: 8px;
    }
    
    .cover-title {
      font-size: 32pt;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .cover-description {
      font-size: 14pt;
      margin-bottom: 30px;
      opacity: 0.9;
      max-width: 80%;
    }
    
    .cover-info {
      background: rgba(255,255,255,0.2);
      padding: 15px 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .cover-author {
      font-size: 14pt;
      margin-top: auto;
      opacity: 0.8;
    }
    
    .cover-year {
      font-size: 12pt;
      opacity: 0.7;
      margin-top: 10px;
    }
    
    /* Instructions Page */
    .instructions-page {
      padding: 20px 0;
    }
    
    .instructions-header {
      background: ${primaryColor};
      color: white;
      padding: 15px 20px;
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    
    .instructions-content {
      font-size: 12pt;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .info-fields {
      margin-top: 30px;
    }
    
    .info-field {
      margin-bottom: 15px;
      font-size: 12pt;
    }
    
    .info-field span {
      display: inline-block;
      min-width: 80px;
    }
    
    .blank-line {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 250px;
      margin-left: 10px;
    }
    
    /* Questions Page */
    .questions-header {
      background: ${primaryColor};
      color: white;
      padding: 12px 20px;
      font-size: 16pt;
      font-weight: 600;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    
    .question {
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .question:last-child {
      border-bottom: none;
    }
    
    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .question-number {
      background: ${secondaryColor};
      color: white;
      min-width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12pt;
      flex-shrink: 0;
    }
    
    .question-text {
      font-size: 12pt;
      font-weight: 500;
      flex: 1;
    }
    
    .options {
      margin-left: 40px;
      margin-top: 10px;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 11pt;
    }
    
    .option-circle {
      width: 16px;
      height: 16px;
      border: 2px solid #666;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .answer-line {
      border-bottom: 1px solid #999;
      min-height: 25px;
      margin-left: 40px;
      margin-top: 10px;
    }
    
    .bonus-section {
      background: linear-gradient(135deg, ${secondaryColor}20 0%, ${primaryColor}10 100%);
      border: 2px solid ${secondaryColor};
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    
    .bonus-label {
      color: ${primaryColor};
      font-weight: 700;
      font-size: 14pt;
      margin-bottom: 10px;
    }
    
    /* Answer Key */
    .answer-key-header {
      background: #dc2626;
      color: white;
      padding: 15px 20px;
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .answer-key-title {
      font-size: 14pt;
      color: #666;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    
    .answer-item {
      margin-bottom: 15px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .answer-number {
      display: inline-block;
      background: #dc2626;
      color: white;
      width: 24px;
      height: 24px;
      text-align: center;
      line-height: 24px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11pt;
      margin-right: 10px;
    }
    
    .answer-text {
      font-weight: 600;
      color: #333;
    }
    
    .answer-explanation {
      margin-top: 5px;
      margin-left: 34px;
      font-size: 10pt;
      color: #666;
      font-style: italic;
    }
    
    .bonus-answer {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .bonus-answer-label {
      color: #b45309;
      font-weight: 700;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page">
    <h1 class="cover-title">${escapeHTML(finalTitle)}</h1>
    ${content.description ? `<p class="cover-description">${escapeHTML(content.description)}</p>` : ''}
    <div class="cover-info">
      <div>${questions.length} Questions</div>
      ${gradeLevel ? `<div>${escapeHTML(gradeLevel)}</div>` : ''}
    </div>
    ${authorName ? `<div class="cover-author">By ${escapeHTML(authorName)}</div>` : ''}
    <div class="cover-year">${new Date().getFullYear()}</div>
  </div>
  
  <!-- Instructions Page -->
  <div class="page instructions-page">
    <div class="instructions-header">Instructions</div>
    <div class="instructions-content">
      ${escapeHTML(content.instructions || 'Read each question carefully and select the best answer.')}
    </div>
    <div class="info-fields">
      <div class="info-field">
        <span>Name:</span>
        <span class="blank-line"></span>
      </div>
      <div class="info-field">
        <span>Date:</span>
        <span class="blank-line" style="min-width: 150px;"></span>
      </div>
      <div class="info-field">
        <span>Score:</span>
        <span class="blank-line" style="min-width: 80px;"></span>
        <span>/ ${questions.length}</span>
      </div>
    </div>
  </div>
  
  <!-- Questions Pages -->
  <div class="page">
    <div class="questions-header">${escapeHTML(finalTitle)}</div>
    ${questionsHTML}
    ${bonusHTML}
  </div>
  
  ${includeAnswerKey ? `
    <!-- Answer Key Page -->
    <div class="page">
      <div class="answer-key-header">ANSWER KEY</div>
      <div class="answer-key-title">${escapeHTML(finalTitle)}</div>
      ${answersHTML}
      ${bonusAnswerHTML}
    </div>
  ` : ''}
</body>
</html>`
}
