import { runSimpleGeneration } from '@/lib/simple-generator'

export async function POST(request) {
  return runSimpleGeneration(request.clone(), {
    toolId: 'spreadsheet-template',
    creditCost: 8,
    systemPrompt: `You are a spreadsheet template designer. You create Google Sheets / Excel templates that sell for $15-$50 on Gumroad and Etsy.

For every template you generate:
- Provide a clear list of tabs / sheets (each with a purpose)
- Provide the column headers for the main sheet as a comma-separated CSV row
- Provide 3 sample rows of data
- List all key formulas (using =SUM, =IF, =VLOOKUP style) with plain-English explanation of what they do
- Suggest 2 charts / dashboard blocks
- Include a Setup Guide the buyer sees on Sheet 1

Output as clean Markdown with a fenced CSV block for the main sheet.`,
    userPrompt: await sheetsPrompt(request),
    postProcess: extractCsv,
  })
}

async function sheetsPrompt(request) {
  const b = await request.json().catch(() => ({}))
  const templateType = b.templateType || 'Personal Budget Tracker'
  const audience = b.audience || 'general users'
  const style = b.style || 'Professional'
  return `Design a complete, sellable spreadsheet template.

Template type: ${templateType}
Buyer / audience: ${audience}
Style: ${style}

Deliver the template as Markdown in this exact order:

# ${templateType} Spreadsheet Template

## Overview
- 2-3 sentence explanation of what this template does and who it is for

## Sheets / Tabs
- Bulleted list of every tab in the workbook with a one-line purpose

## Main Sheet: Columns & Sample Data (CSV)
\`\`\`csv
[Header1],[Header2],[Header3],[Header4],[Header5],[Header6]
[sample row 1 values]
[sample row 2 values]
[sample row 3 values]
\`\`\`

## Key Formulas
List 5-8 formulas as a table:

| Cell | Formula | What it does |
| --- | --- | --- |

## Dashboard Ideas
- 2 chart / visual block suggestions with instructions

## Setup Guide (Sheet 1: Read Me)
- Step-by-step onboarding for the buyer

## Pro Tips
- 3 optimization tips for advanced buyers

Return Markdown only.`
}

// Extract the fenced CSV block so we can offer a direct CSV download
function extractCsv(text) {
  const m = text.match(/```csv\n([\s\S]*?)\n```/)
  const csv = m ? m[1] : null
  return { content: text, csv }
}
