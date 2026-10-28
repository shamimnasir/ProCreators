'use client'
import { TextGeneratorTemplate } from '@/components/shared/TextGeneratorTemplate'
import { ChefHat } from 'lucide-react'

export default function RecipeBookPage() {
  return (
    <TextGeneratorTemplate
      config={{
        toolId: 'recipe-book',
        name: 'Recipe Book Generator',
        icon: ChefHat,
        tagline: 'Complete cookbook with 10-50 recipes, meal plan, and substitution guide. KDP paperback-ready.',
        apiPath: '/api/recipe-book/generate',
        bgGradient: 'from-orange-500 to-red-500',
        cta: 'Generate Recipe Book (10 credits)',
        exampleOutput: 'A complete cookbook including:\n\u2022 Book title + introduction\n\u2022 Kitchen essentials list\n\u2022 10-50 recipes with prep/cook time, ingredients, steps, nutritional info\n\u2022 One-week meal plan\n\u2022 Ingredient substitution guide',
        fields: [
          { id: 'cuisine', label: 'Cuisine / theme', required: true, placeholder: 'e.g. Mediterranean, Vegan Comfort Food, Keto Instant Pot, Air Fryer' },
          { id: 'recipeCount', label: 'Number of recipes', type: 'select', options: [
            { value: '10', label: '10 recipes \u2014 starter cookbook ($9\u2013$14)' },
            { value: '20', label: '20 recipes \u2014 standard cookbook ($14\u2013$24)' },
            { value: '30', label: '30 recipes \u2014 premium cookbook ($24\u2013$34)' },
            { value: '50', label: '50 recipes \u2014 ultimate cookbook ($34\u2013$49)' },
          ]},
          { id: 'skill', label: 'Skill level', type: 'select', options: [
            { value: 'Beginner-friendly', label: 'Beginner-friendly' },
            { value: 'Intermediate', label: 'Intermediate' },
            { value: 'Advanced / gourmet', label: 'Advanced / gourmet' },
          ]},
          { id: 'diet', label: 'Dietary restrictions', type: 'select', options: [
            { value: 'No restrictions', label: 'No restrictions' },
            { value: 'Vegetarian', label: 'Vegetarian' },
            { value: 'Vegan', label: 'Vegan' },
            { value: 'Gluten-free', label: 'Gluten-free' },
            { value: 'Keto / low-carb', label: 'Keto / low-carb' },
            { value: 'Paleo', label: 'Paleo' },
            { value: 'Dairy-free', label: 'Dairy-free' },
            { value: 'Diabetes-friendly', label: 'Diabetes-friendly' },
          ]},
          { id: 'audience', label: 'Target readers', placeholder: 'e.g. busy parents, college students, single-serving cooks', default: 'home cooks' },
        ],
      }}
    />
  )
}
