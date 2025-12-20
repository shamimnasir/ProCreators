import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY || process.env.GOOGLE_API_KEY)

// Recipe book type configurations
const BOOK_TYPE_CONFIGS = {
  'general': { name: 'General Cookbook', categories: ['Appetizers', 'Main Courses', 'Sides', 'Desserts', 'Drinks'] },
  'family': { name: 'Family Recipes', categories: ['Breakfast Favorites', 'Weeknight Dinners', 'Sunday Specials', 'Holiday Traditions', 'Kid-Friendly'] },
  'baking': { name: 'Baking & Desserts', categories: ['Cakes', 'Cookies', 'Pies & Tarts', 'Breads', 'Special Occasion'] },
  'healthy': { name: 'Healthy Eating', categories: ['Smoothies & Bowls', 'Salads', 'Lean Proteins', 'Whole Grains', 'Healthy Snacks'] },
  'quick': { name: 'Quick & Easy', categories: ['15-Minute Meals', '30-Minute Dinners', 'One-Pot Wonders', 'Sheet Pan Meals', 'No-Cook Recipes'] },
  'vegan': { name: 'Vegan/Vegetarian', categories: ['Plant-Based Proteins', 'Veggie Mains', 'Dairy-Free', 'Raw Recipes', 'Vegan Desserts'] },
  'international': { name: 'International Cuisine', categories: ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'Indian'] },
  'keto': { name: 'Keto/Low-Carb', categories: ['Keto Breakfast', 'Low-Carb Mains', 'Fat Bombs', 'Keto Sides', 'Sugar-Free Desserts'] },
  'meal-prep': { name: 'Meal Prep', categories: ['Breakfast Prep', 'Lunch Containers', 'Dinner Batches', 'Freezer Meals', 'Snack Prep'] },
  'holiday': { name: 'Holiday & Special', categories: ['Thanksgiving', 'Christmas', 'Easter', 'Summer BBQ', 'Party Appetizers'] },
  'blank': { name: 'Blank Recipe Book', categories: ['My Favorites', 'Family Recipes', 'Desserts', 'Quick Meals', 'Special Occasions'] },
}

export async function POST(request) {
  try {
    const { bookType, title, recipeCount, targetAudience } = await request.json()
    
    console.log(`Generating recipe book structure for: ${bookType}`)
    
    const config = BOOK_TYPE_CONFIGS[bookType] || BOOK_TYPE_CONFIGS['general']
    const recipesPerCategory = Math.ceil(recipeCount / config.categories.length)
    
    // Try AI generation
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      
      const prompt = `Create a ${config.name} with approximately ${recipeCount} recipes.
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Generate a complete cookbook structure with:
1. An engaging title and subtitle
2. A warm introduction paragraph (2-3 sentences)
3. ${config.categories.length} categories with ${recipesPerCategory} recipes each

For each recipe include:
- name: Recipe name
- servings: Number (e.g., 4)
- prepTime: Time string (e.g., "15 mins")
- cookTime: Time string (e.g., "30 mins")
- ingredients: Array of ingredient strings
- instructions: Array of step strings
- tips: Optional cooking tip

Format as JSON:
{
  "title": "Catchy Cookbook Title",
  "subtitle": "Enticing subtitle",
  "introduction": "Welcome paragraph...",
  "categories": [
    {
      "name": "Category Name",
      "recipes": [
        {
          "name": "Recipe Name",
          "servings": 4,
          "prepTime": "15 mins",
          "cookTime": "30 mins",
          "ingredients": ["1 cup flour", "2 eggs", ...],
          "instructions": ["Preheat oven to 350F", "Mix ingredients", ...],
          "tips": "Optional tip"
        }
      ]
    }
  ]
}

Return ONLY valid JSON.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text().trim()
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      const data = JSON.parse(text)
      console.log(`AI generated ${data.categories?.length || 0} categories`)
      
      return NextResponse.json({
        success: true,
        ...data
      })
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError.message)
      
      // Fallback with default structure
      const fallbackCategories = config.categories.map(catName => ({
        name: catName,
        recipes: Array.from({ length: recipesPerCategory }, (_, i) => ({
          name: `${catName} Recipe ${i + 1}`,
          servings: 4,
          prepTime: '15 mins',
          cookTime: '30 mins',
          ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3', 'Ingredient 4'],
          instructions: ['Step 1: Prepare ingredients', 'Step 2: Cook as directed', 'Step 3: Serve and enjoy'],
          tips: 'Add your own tips here'
        }))
      }))
      
      return NextResponse.json({
        success: true,
        title: title || config.name,
        subtitle: `A Collection of ${recipeCount} Delicious Recipes`,
        introduction: `Welcome to your personal cookbook! This collection features ${recipeCount} carefully curated recipes to inspire your culinary adventures.`,
        categories: fallbackCategories
      })
    }
    
  } catch (error) {
    console.error('Recipe structure generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate structure' },
      { status: 500 }
    )
  }
}
