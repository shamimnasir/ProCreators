// Cover Image Generator for PDF Tools
// Uses Gemini Nano Banana for AI-generated cover artwork

import { spawn } from 'child_process'
import path from 'path'

// Theme-specific cover design prompts
export const COVER_THEMES = {
  // Planner themes
  'planner-daily': {
    name: 'Daily Planner',
    prompts: [
      'Elegant minimalist sunrise gradient with soft orange and pink clouds, clean geometric lines, professional planner cover design, no text',
      'Beautiful morning coffee steam swirls with soft beige and brown watercolor effect, cozy productivity aesthetic, no text',
      'Abstract time management concept with elegant clock elements and flowing ribbons in gold and cream, no text'
    ]
  },
  'planner-weekly': {
    name: 'Weekly Planner',
    prompts: [
      'Seven interconnected circles in a soft gradient pattern representing days of the week, pastel colors, elegant and minimal, no text',
      'Abstract calendar grid with beautiful watercolor washes in soft blues and greens, professional design, no text',
      'Elegant weekly flow design with connected dots and lines in rose gold and white, minimalist style, no text'
    ]
  },
  'planner-monthly': {
    name: 'Monthly Planner',
    prompts: [
      'Beautiful moon phases arrangement in a circle with stars, elegant navy and silver design, celestial theme, no text',
      'Twelve abstract shapes representing months arranged artistically, soft seasonal color palette, no text',
      'Elegant calendar concept with flowing curves and monthly grid pattern, gold and cream colors, no text'
    ]
  },
  'planner-yearly': {
    name: 'Yearly Planner',
    prompts: [
      'Four seasons abstract landscape in quadrants - spring flowers, summer sun, autumn leaves, winter snow, elegant design, no text',
      'Beautiful tree of life with seasonal branches, roots and growth symbolism, earth tones and greens, no text',
      'Abstract year journey with flowing path through beautiful landscapes, soft watercolor style, no text'
    ]
  },
  'planner-fitness': {
    name: 'Fitness Planner',
    prompts: [
      'Dynamic fitness silhouette with energy waves and motion lines, vibrant orange and teal gradient, motivational design, no text',
      'Abstract healthy lifestyle collage with fruits, yoga pose outline, and heartbeat line, fresh green and coral colors, no text',
      'Powerful athletic abstract design with muscle fiber patterns and energy bursts, bold red and black, no text'
    ]
  },
  'planner-meal': {
    name: 'Meal Planner',
    prompts: [
      'Beautiful fresh vegetables and fruits arrangement in watercolor style, farm-to-table aesthetic, vibrant healthy colors, no text',
      'Elegant kitchen herbs and spices pattern with rosemary, basil, and lavender, soft green and purple, no text',
      'Artistic plate composition with colorful healthy food, Mediterranean style, warm appetizing colors, no text'
    ]
  },
  'planner-budget': {
    name: 'Budget Planner',
    prompts: [
      'Elegant piggy bank with golden coins and growth chart, prosperity theme, gold and green colors, no text',
      'Abstract financial growth concept with upward arrows and geometric shapes, professional navy and gold, no text',
      'Beautiful money tree illustration with leaves as currency symbols, abundance theme, green and gold, no text'
    ]
  },
  'planner-goal': {
    name: 'Goal Planner',
    prompts: [
      'Mountain peak with flag at summit and winding path, achievement concept, inspiring sunrise colors, no text',
      'Abstract target with arrows and radiating success lines, bold and motivational, red and gold design, no text',
      'Elegant stairway to stars design with cosmic background, dreams and aspirations theme, purple and gold, no text'
    ]
  },
  'planner-gratitude': {
    name: 'Gratitude Journal',
    prompts: [
      'Beautiful soft pink and coral roses with delicate green leaves, romantic floral pattern, gratitude journal aesthetic, no text',
      'Elegant heart shape made of wildflowers and butterflies, gentle watercolor style, thankfulness theme, no text',
      'Soft sunset over peaceful meadow with floating dandelion seeds, serenity and gratitude, warm golden tones, no text'
    ]
  },
  'planner-project': {
    name: 'Project Planner',
    prompts: [
      'Abstract flowchart and timeline design with connected nodes, professional project management aesthetic, blue and gray, no text',
      'Elegant puzzle pieces coming together with gear icons, teamwork and planning theme, corporate colors, no text',
      'Modern kanban board concept with colorful cards and workflow arrows, productive design, no text'
    ]
  },
  'planner-habit': {
    name: 'Habit Tracker',
    prompts: [
      'Abstract chain links forming upward spiral, habit building concept, strong and elegant, bronze and teal, no text',
      'Beautiful 30-day calendar grid transforming into butterfly, transformation theme, purple gradient, no text',
      'Elegant streak flames growing stronger, consistency and dedication, orange and red warm colors, no text'
    ]
  },
  'planner-travel': {
    name: 'Travel Planner',
    prompts: [
      'Vintage world map with compass rose and airplane trail, wanderlust aesthetic, sepia and blue tones, no text',
      'Beautiful landmarks silhouette collage - Eiffel Tower, mountains, palm trees, adventure theme, sunset colors, no text',
      'Elegant passport stamps and travel stamps pattern, globetrotter design, vintage travel poster style, no text'
    ]
  },

  // Journal themes
  'journal-gratitude': {
    name: 'Gratitude Journal',
    prompts: [
      'Lush floral wreath with peonies, roses and eucalyptus leaves, soft pink and sage green, feminine elegant design, no text',
      'Beautiful watercolor hearts and flowers floating upward, thankfulness and joy theme, pastel rainbow colors, no text',
      'Elegant hand holding blooming flowers, giving and receiving gratitude concept, soft warm tones, no text'
    ]
  },
  'journal-mindfulness': {
    name: 'Mindfulness Journal',
    prompts: [
      'Peaceful zen garden with raked sand patterns and smooth stones, meditation aesthetic, soft gray and green, no text',
      'Beautiful lotus flower on calm water with gentle ripples, mindfulness and peace, soft purple and blue, no text',
      'Abstract mandala design with intricate patterns, spiritual and calming, gold and white on deep blue, no text'
    ]
  },
  'journal-dream': {
    name: 'Dream Journal',
    prompts: [
      'Magical night sky with crescent moon, stars and floating clouds, dreamy ethereal aesthetic, deep purple and silver, no text',
      'Surreal dreamscape with floating islands and soft clouds, fantasy and imagination, pastel cosmic colors, no text',
      'Beautiful sleeping figure surrounded by swirling dream imagery, mystical and peaceful, navy and gold, no text'
    ]
  },
  'journal-prayer': {
    name: 'Prayer Journal',
    prompts: [
      'Elegant praying hands silhouette with divine light rays, spiritual and reverent, gold and cream, no text',
      'Beautiful dove with olive branch and soft light beams, peace and faith theme, white and soft gold, no text',
      'Cross with beautiful flowering vines, faith and growth, soft earth tones and green, no text'
    ]
  },
  'journal-reflection': {
    name: 'Reflection Journal',
    prompts: [
      'Beautiful mirror reflection on calm lake at sunset, self-discovery theme, golden and blue tones, no text',
      'Abstract thought bubbles and lightbulbs in watercolor style, introspection concept, soft purple and teal, no text',
      'Elegant hourglass with sand flowing, time and reflection theme, bronze and cream colors, no text'
    ]
  },

  // Ebook themes
  'ebook-fiction': {
    name: 'Fiction Ebook',
    prompts: [
      'Mysterious open book with magical light and swirling stories emerging, fantasy reading aesthetic, purple and gold, no text',
      'Beautiful vintage library with towering bookshelves and warm lamp light, literary atmosphere, sepia and amber, no text',
      'Abstract storytelling concept with flowing narrative ribbons and book pages, creative and artistic, no text'
    ]
  },
  'ebook-nonfiction': {
    name: 'Non-Fiction Ebook',
    prompts: [
      'Professional abstract knowledge concept with connected ideas and lightbulbs, educational design, blue and white, no text',
      'Elegant brain with blooming flowers representing growth and learning, intellectual theme, teal and gold, no text',
      'Modern geometric pattern representing structured information, professional and clean, navy and silver, no text'
    ]
  },
  'ebook-cookbook': {
    name: 'Cookbook',
    prompts: [
      'Rustic kitchen scene with fresh ingredients, wooden cutting board, herbs and spices, warm appetizing colors, no text',
      'Beautiful food photography style arrangement with colorful dishes and garnishes, gourmet aesthetic, no text',
      'Elegant chef hat with kitchen utensils and ingredient splash, culinary arts theme, red and white, no text'
    ]
  },
  'ebook-selfhelp': {
    name: 'Self-Help Book',
    prompts: [
      'Person standing on mountain peak with arms raised, achievement and empowerment, inspiring sunrise, no text',
      'Beautiful butterfly emerging from cocoon, transformation and growth theme, vibrant colors, no text',
      'Abstract upward path with stepping stones and growth elements, personal development, green and gold, no text'
    ]
  },
  'ebook-business': {
    name: 'Business Book',
    prompts: [
      'Modern city skyline with rising graph overlay, success and growth theme, professional blue and gold, no text',
      'Elegant chess pieces on board representing strategy, business planning concept, black and gold, no text',
      'Abstract networking nodes and connections, business relationships theme, corporate blue and white, no text'
    ]
  },
  'ebook-children': {
    name: 'Children Book',
    prompts: [
      'Whimsical magical forest with cute animals and rainbow, playful and colorful, children book illustration style, no text',
      'Happy cartoon characters playing in sunny meadow with butterflies, joyful and bright colors, no text',
      'Magical castle in clouds with friendly dragon, adventure and imagination, vibrant fantasy colors, no text'
    ]
  },

  // Worksheet themes
  'worksheet-math': {
    name: 'Math Worksheet',
    prompts: [
      'Colorful numbers and math symbols floating in playful pattern, educational fun design, bright primary colors, no text',
      'Friendly cartoon calculator and math tools, learning theme, cheerful blue and yellow, no text',
      'Abstract geometric shapes and equations pattern, mathematics concept, clean professional design, no text'
    ]
  },
  'worksheet-science': {
    name: 'Science Worksheet',
    prompts: [
      'Colorful laboratory beakers and test tubes with bubbling experiments, science fun, bright scientific colors, no text',
      'Solar system planets and stars arrangement, space science theme, cosmic purple and blue, no text',
      'DNA helix with molecular structures, biology and chemistry concept, green and blue scientific, no text'
    ]
  },
  'worksheet-language': {
    name: 'Language Worksheet',
    prompts: [
      'Colorful alphabet letters floating playfully, learning to read theme, cheerful rainbow colors, no text',
      'Open book with words and letters flowing out, literacy and language concept, warm educational tones, no text',
      'World flags and speech bubbles pattern, multilingual learning theme, diverse bright colors, no text'
    ]
  },
  'worksheet-art': {
    name: 'Art Worksheet',
    prompts: [
      'Colorful paint palette with brushes and paint splashes, creative arts theme, vibrant rainbow, no text',
      'Abstract artistic swirls and color mixing, creativity concept, beautiful blended colors, no text',
      'Cute art supplies pattern - crayons, pencils, paintbrushes, fun and creative, bright colors, no text'
    ]
  },

  // Checklist themes
  'checklist-todo': {
    name: 'To-Do Checklist',
    prompts: [
      'Elegant checkmarks and completed tasks with celebration confetti, productivity success, green and gold, no text',
      'Beautiful organized desk with checklist and coffee, productive workspace aesthetic, warm tones, no text',
      'Abstract task completion concept with flowing checkmarks, accomplishment theme, teal and white, no text'
    ]
  },
  'checklist-cleaning': {
    name: 'Cleaning Checklist',
    prompts: [
      'Sparkling clean home interior with fresh flowers and sunlight, cleanliness and freshness, bright airy colors, no text',
      'Cute cleaning supplies arranged neatly - spray bottle, duster, sponge, organized home theme, fresh colors, no text',
      'Abstract sparkles and clean shine effects, spotless concept, white and light blue, no text'
    ]
  },
  'checklist-shopping': {
    name: 'Shopping Checklist',
    prompts: [
      'Colorful shopping bags and fresh groceries arrangement, shopping trip theme, vibrant retail colors, no text',
      'Beautiful farmers market produce display, grocery shopping aesthetic, fresh natural colors, no text',
      'Elegant shopping cart with floating items, retail therapy concept, fun bright colors, no text'
    ]
  },
  'checklist-travel': {
    name: 'Travel Checklist',
    prompts: [
      'Vintage suitcase with travel essentials packing, trip preparation theme, wanderlust colors, no text',
      'Passport, camera, and map arrangement, adventure planning aesthetic, travel poster style, no text',
      'Abstract airplane trail around globe, travel destination concept, sky blue and gold, no text'
    ]
  },

  // Generic/default themes
  'default-elegant': {
    name: 'Elegant Default',
    prompts: [
      'Beautiful abstract marble texture with gold veins, luxury elegant design, sophisticated aesthetic, no text',
      'Soft watercolor gradient in elegant neutral tones, minimalist professional design, no text',
      'Abstract flowing silk fabric in soft colors, elegant and refined, premium quality feel, no text'
    ]
  },
  'default-modern': {
    name: 'Modern Default',
    prompts: [
      'Clean geometric shapes in modern arrangement, contemporary design, bold and minimal, no text',
      'Abstract gradient mesh with smooth color transitions, modern digital aesthetic, no text',
      'Minimal line art with elegant negative space, sophisticated modern design, no text'
    ]
  },
  'default-nature': {
    name: 'Nature Default',
    prompts: [
      'Beautiful botanical illustration with leaves and ferns, natural organic design, green and earth tones, no text',
      'Peaceful forest scene with soft sunlight filtering through trees, nature serenity, no text',
      'Ocean waves and beach scene, calm and refreshing, blue and sandy tones, no text'
    ]
  }
}

// Map planner types to themes
export const PLANNER_TYPE_TO_THEME = {
  'daily': 'planner-daily',
  'weekly': 'planner-weekly',
  'monthly': 'planner-monthly',
  'yearly': 'planner-yearly',
  'fitness': 'planner-fitness',
  'meal': 'planner-meal',
  'budget': 'planner-budget',
  'goal': 'planner-goal',
  'gratitude': 'planner-gratitude',
  'project': 'planner-project',
  'habit': 'planner-habit',
  'travel': 'planner-travel'
}

// Map journal types to themes
export const JOURNAL_TYPE_TO_THEME = {
  'gratitude': 'journal-gratitude',
  'mindfulness': 'journal-mindfulness',
  'dream': 'journal-dream',
  'prayer': 'journal-prayer',
  'reflection': 'journal-reflection',
  'daily': 'journal-reflection',
  'bullet': 'default-modern'
}

// Map ebook genres to themes
export const EBOOK_GENRE_TO_THEME = {
  'fiction': 'ebook-fiction',
  'non-fiction': 'ebook-nonfiction',
  'cookbook': 'ebook-cookbook',
  'self-help': 'ebook-selfhelp',
  'business': 'ebook-business',
  'children': 'ebook-children',
  'romance': 'ebook-fiction',
  'mystery': 'ebook-fiction',
  'sci-fi': 'ebook-fiction',
  'biography': 'ebook-nonfiction',
  'history': 'ebook-nonfiction',
  'health': 'ebook-selfhelp'
}

// Map worksheet subjects to themes
export const WORKSHEET_SUBJECT_TO_THEME = {
  'math': 'worksheet-math',
  'science': 'worksheet-science',
  'language': 'worksheet-language',
  'english': 'worksheet-language',
  'reading': 'worksheet-language',
  'art': 'worksheet-art',
  'music': 'worksheet-art',
  'history': 'ebook-nonfiction',
  'geography': 'default-nature'
}

// Map checklist types to themes
export const CHECKLIST_TYPE_TO_THEME = {
  'todo': 'checklist-todo',
  'cleaning': 'checklist-cleaning',
  'shopping': 'checklist-shopping',
  'grocery': 'checklist-shopping',
  'travel': 'checklist-travel',
  'packing': 'checklist-travel',
  'moving': 'checklist-todo',
  'event': 'checklist-todo',
  'wedding': 'default-elegant',
  'baby': 'ebook-children'
}

/**
 * Generate a cover image for a PDF document
 * @param {string} themeKey - The theme key from COVER_THEMES
 * @param {string} customPrompt - Optional custom prompt (if provided, uses this instead of theme)
 * @returns {Promise<{success: boolean, imageUrl: string|null, error: string|null}>}
 */
export async function generateCoverImage(themeKey, customPrompt = '') {
  return new Promise((resolve) => {
    try {
      let fullPrompt
      
      if (customPrompt && customPrompt.trim().length > 10) {
        // User provided a custom description - use it as the main prompt
        // Add professional book cover styling guidance
        fullPrompt = `Professional ebook cover design: ${customPrompt.trim()}. High quality, suitable for book cover, no text or words on the image.`
        console.log(`Generating cover image with custom prompt: ${fullPrompt.substring(0, 80)}...`)
      } else {
        // Use theme-based prompt
        const theme = COVER_THEMES[themeKey] || COVER_THEMES['default-elegant']
        const basePrompt = theme.prompts[Math.floor(Math.random() * theme.prompts.length)]
        fullPrompt = basePrompt
        console.log(`Generating cover image for theme: ${themeKey}`)
      }
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_image_nano_banana.py')
      
      const inputData = JSON.stringify({
        prompt: fullPrompt,
        model: 'models/nano-banana-pro-preview'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
        env: { ...process.env }
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Cover image generation error:', stderr)
          resolve({
            success: false,
            imageUrl: null,
            error: stderr || 'Failed to generate cover image'
          })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          if (result.success) {
            console.log('Cover image generated successfully')
          }
          resolve(result)
        } catch (error) {
          console.error('Error parsing cover image response:', error)
          resolve({
            success: false,
            imageUrl: null,
            error: 'Failed to parse response'
          })
        }
      })
      
      pythonProcess.on('error', (error) => {
        console.error('Error spawning Python process:', error)
        resolve({
          success: false,
          imageUrl: null,
          error: error.message || 'Failed to generate cover image'
        })
      })
      
      // Timeout after 45 seconds
      setTimeout(() => {
        pythonProcess.kill()
        resolve({
          success: false,
          imageUrl: null,
          error: 'Cover image generation timed out'
        })
      }, 45000)
      
    } catch (error) {
      console.error("Error in generateCoverImage:", error)
      resolve({
        success: false,
        imageUrl: null,
        error: error.message || "Failed to generate cover image"
      })
    }
  })
}

/**
 * Get theme key for a planner type
 */
export function getPlannerTheme(plannerType) {
  return PLANNER_TYPE_TO_THEME[plannerType] || 'default-elegant'
}

/**
 * Get theme key for a journal type
 */
export function getJournalTheme(journalType) {
  return JOURNAL_TYPE_TO_THEME[journalType] || 'journal-reflection'
}

/**
 * Get theme key for an ebook genre
 */
export function getEbookTheme(genre) {
  return EBOOK_GENRE_TO_THEME[genre] || 'ebook-nonfiction'
}

/**
 * Get theme key for a worksheet subject
 */
export function getWorksheetTheme(subject) {
  return WORKSHEET_SUBJECT_TO_THEME[subject] || 'default-modern'
}

/**
 * Get theme key for a checklist type
 */
export function getChecklistTheme(checklistType) {
  return CHECKLIST_TYPE_TO_THEME[checklistType] || 'checklist-todo'
}
