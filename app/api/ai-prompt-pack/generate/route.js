import { runSimpleGeneration } from '@/lib/simple-generator'

export async function POST(request) {
  return runSimpleGeneration(request.clone(), {
    toolId: 'ai-prompt-pack',
    creditCost: 8,
    systemPrompt: `You are an expert AI prompt engineer creating sell-ready prompt packs for creators, freelancers, and professionals.

Each prompt pack must be:
- Highly specific to the target niche and use-case
- Copy-paste ready (no <placeholders> unless clearly explained)
- Organized by category with H2 headers
- Include a short use-case + example output for EVERY prompt
- Formatted as clean Markdown so buyers can convert to PDF, Notion, or Gumroad

Output ONLY Markdown, no preamble.`,
    userPrompt: await requestPrompt(request),
  })
}

async function requestPrompt(request) {
  const b = await request.json().catch(() => ({}))
  const niche = b.niche || 'general use'
  const packSize = Number(b.packSize) || 25
  const category = b.category || 'marketing'
  const audience = b.audience || 'professionals'
  const format = b.aiTool || 'ChatGPT / Claude / Gemini'
  return `Create a sellable AI prompt pack of ${packSize} prompts for the "${niche}" niche.

Context:
- Target buyer: ${audience}
- Category focus: ${category}
- Prompts should work in: ${format}
- Buyers will sell / use these on Etsy, Gumroad, and in their own workflows

Structure:
# ${category} Prompt Pack for ${niche}

> ${packSize} copy-paste prompts to accelerate ${niche} work. Works with ChatGPT, Claude, Gemini, and other AI tools.

## How to Use This Pack
- 3 sentences on how to get the most out of the pack

## The Prompts
Group prompts into 3-5 logical sub-categories with H2 headers. Under each sub-category, list the prompts as:

### Prompt N: [Punchy Title]
**Use case:** One-line description of when to use this prompt.

**Prompt:**
\`\`\`
[The full copy-paste prompt with clear placeholders like [YOUR PRODUCT] wherever variables are needed]
\`\`\`

**Example output:** One-line preview of what the AI would return.

---

## Bonus Tips
- 3 pro-tips on customizing the prompts

Return EXACTLY ${packSize} numbered prompts, and only Markdown.`
}
