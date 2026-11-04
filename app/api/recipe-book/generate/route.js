import { runSimpleGeneration } from '@/lib/simple-generator'

export async function POST(request) {
  return runSimpleGeneration(request.clone(), {
    toolId: 'recipe-book',
    creditCost: 10,
    systemPrompt: `You are a professional cookbook author. You write compelling, KDP-ready recipe books that sell well on Amazon and Etsy.

Every recipe must include:
- A punchy title with a benefit hook
- Prep time, cook time, servings
- A short story or tip (1-2 sentences)
- Bulleted ingredients (with US measurements)
- Numbered step-by-step instructions
- Nutritional info per serving (calories, protein, carbs, fat)
- A serving suggestion / variation

Output ONLY Markdown so the buyer can print it or import to KDP.`,
    userPrompt: await recipePrompt(request),
  })
}

async function recipePrompt(request) {
  const b = await request.json().catch(() => ({}))
  const cuisine = b.cuisine || 'Mediterranean'
  const recipeCount = Number(b.recipeCount) || 10
  const skill = b.skill || 'Beginner-friendly'
  const diet = b.diet || 'No restrictions'
  const audience = b.audience || 'home cooks'
  return `Write a complete ${recipeCount}-recipe cookbook.

Theme: ${cuisine} cuisine
Skill level: ${skill}
Dietary: ${diet}
Audience: ${audience}

Structure the full book in this order:
# [Compelling Book Title]
## Introduction (200 words)
- Why this cookbook exists, who it is for, what makes these ${cuisine} recipes special

## Kitchen Essentials
- Bulleted list of 8 items every reader needs to make these recipes

## The Recipes
Produce EXACTLY ${recipeCount} recipes, numbered. Each recipe uses this exact structure:

### Recipe N: [Name]

> One-line hook about the recipe

**Prep:** X min | **Cook:** Y min | **Serves:** Z

**Story / Tip:** 1-2 sentence context.

**Ingredients:**
- ...

**Instructions:**
1. ...

**Per Serving:** Calories ... | Protein ...g | Carbs ...g | Fat ...g

**Serving Suggestion / Variation:** ...

---

## Weekly Meal Plan
- One-week suggested meal plan mixing recipes from the book

## Substitution Guide
- Table of ingredient substitutions

Return Markdown only.`
}
