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

// Real recipe database for fallback
const FALLBACK_RECIPES = {
  'Appetizers': [
    { name: 'Bruschetta with Fresh Tomatoes', servings: 8, prepTime: '15 mins', cookTime: '5 mins', ingredients: ['1 French baguette, sliced', '4 ripe tomatoes, diced', '1/4 cup fresh basil, chopped', '3 cloves garlic, minced', '3 tbsp extra virgin olive oil', '1 tbsp balsamic vinegar', 'Salt and pepper to taste'], instructions: ['Preheat oven to 400F. Brush bread slices with olive oil and toast until golden, about 5 minutes.', 'Mix diced tomatoes, basil, garlic, remaining olive oil, and balsamic vinegar.', 'Season with salt and pepper.', 'Spoon tomato mixture onto toasted bread slices and serve immediately.'], tips: 'Use the ripest tomatoes you can find for best flavor.' },
    { name: 'Spinach Artichoke Dip', servings: 12, prepTime: '10 mins', cookTime: '25 mins', ingredients: ['8 oz cream cheese, softened', '1/2 cup sour cream', '1/2 cup mayonnaise', '1 cup Parmesan cheese, grated', '1 can (14 oz) artichoke hearts, drained and chopped', '10 oz frozen spinach, thawed and drained', '3 cloves garlic, minced'], instructions: ['Preheat oven to 350F.', 'Mix cream cheese, sour cream, mayonnaise, and half the Parmesan until smooth.', 'Fold in artichokes, spinach, and garlic.', 'Transfer to baking dish, top with remaining Parmesan.', 'Bake 25 minutes until bubbly and golden.'], tips: 'Squeeze all excess water from spinach to prevent a watery dip.' },
    { name: 'Caprese Skewers', servings: 10, prepTime: '20 mins', cookTime: '0 mins', ingredients: ['20 cherry tomatoes', '20 fresh mozzarella balls (ciliegine)', '20 fresh basil leaves', '3 tbsp balsamic glaze', '2 tbsp olive oil', 'Salt and pepper to taste', '20 small skewers'], instructions: ['Thread one tomato, one basil leaf, and one mozzarella ball onto each skewer.', 'Arrange on a serving platter.', 'Drizzle with olive oil and balsamic glaze.', 'Season with salt and pepper.'], tips: 'Let ingredients come to room temperature before serving for best flavor.' },
  ],
  'Main Courses': [
    { name: 'Garlic Butter Salmon', servings: 4, prepTime: '10 mins', cookTime: '15 mins', ingredients: ['4 salmon fillets (6 oz each)', '4 tbsp butter', '4 cloves garlic, minced', '2 tbsp fresh lemon juice', '2 tbsp fresh parsley, chopped', '1 tsp paprika', 'Salt and pepper to taste'], instructions: ['Preheat oven to 400F. Season salmon with salt, pepper, and paprika.', 'Melt butter in oven-safe skillet over medium heat. Add garlic and cook 1 minute.', 'Add lemon juice to the butter mixture.', 'Place salmon in skillet, spoon butter mixture over fish.', 'Bake 12-15 minutes until salmon flakes easily.', 'Garnish with fresh parsley and serve.'], tips: 'Don\'t overcook - salmon continues cooking after removed from heat.' },
    { name: 'Classic Chicken Parmesan', servings: 4, prepTime: '20 mins', cookTime: '30 mins', ingredients: ['4 chicken breasts, pounded thin', '1 cup all-purpose flour', '2 eggs, beaten', '1 cup breadcrumbs', '1/2 cup Parmesan cheese, grated', '2 cups marinara sauce', '1 cup mozzarella cheese, shredded', '1/4 cup olive oil', 'Salt and pepper'], instructions: ['Preheat oven to 425F. Season chicken with salt and pepper.', 'Set up breading station: flour, eggs, and breadcrumbs mixed with Parmesan.', 'Dredge chicken in flour, dip in egg, then coat in breadcrumb mixture.', 'Heat oil in skillet, cook chicken 3-4 minutes per side until golden.', 'Transfer to baking dish, top with marinara and mozzarella.', 'Bake 15-20 minutes until cheese is melted and bubbly.'], tips: 'Pounding chicken ensures even cooking throughout.' },
    { name: 'Beef Stir-Fry with Vegetables', servings: 4, prepTime: '15 mins', cookTime: '10 mins', ingredients: ['1 lb flank steak, sliced thin', '2 cups broccoli florets', '1 red bell pepper, sliced', '1 cup snap peas', '3 tbsp soy sauce', '1 tbsp sesame oil', '2 tbsp vegetable oil', '3 cloves garlic, minced', '1 tbsp fresh ginger, grated', '2 tbsp cornstarch'], instructions: ['Toss beef slices with 1 tbsp soy sauce and cornstarch.', 'Heat vegetable oil in wok or large skillet over high heat.', 'Stir-fry beef 2-3 minutes until browned. Remove and set aside.', 'Add vegetables, garlic, and ginger. Stir-fry 3-4 minutes.', 'Return beef to wok, add remaining soy sauce and sesame oil.', 'Toss everything together and serve over rice.'], tips: 'Slice beef against the grain for maximum tenderness.' },
  ],
  'Sides': [
    { name: 'Roasted Garlic Mashed Potatoes', servings: 6, prepTime: '15 mins', cookTime: '30 mins', ingredients: ['3 lbs Yukon Gold potatoes, peeled and cubed', '1 head garlic', '1 cup heavy cream, warmed', '4 tbsp butter', '1/2 cup sour cream', 'Salt and pepper to taste', '2 tbsp chives, chopped'], instructions: ['Roast whole garlic head at 400F for 30 minutes until soft.', 'Boil potatoes in salted water until fork-tender, about 15 minutes.', 'Drain potatoes and return to pot over low heat to dry.', 'Squeeze roasted garlic cloves from skins and add to potatoes.', 'Mash with butter, cream, and sour cream until smooth.', 'Season with salt and pepper, garnish with chives.'], tips: 'Warm the cream before adding for fluffier potatoes.' },
    { name: 'Honey Glazed Carrots', servings: 4, prepTime: '10 mins', cookTime: '20 mins', ingredients: ['1 lb carrots, peeled and sliced', '3 tbsp butter', '2 tbsp honey', '1 tbsp brown sugar', '1/4 tsp cinnamon', 'Salt to taste', 'Fresh parsley for garnish'], instructions: ['Boil carrots in salted water until just tender, about 8 minutes. Drain.', 'Melt butter in skillet over medium heat.', 'Add honey, brown sugar, and cinnamon. Stir until dissolved.', 'Add carrots and toss to coat evenly.', 'Cook 5 minutes until carrots are glazed and slightly caramelized.', 'Garnish with fresh parsley.'], tips: 'Cut carrots uniformly for even cooking.' },
    { name: 'Caesar Salad', servings: 4, prepTime: '15 mins', cookTime: '10 mins', ingredients: ['1 large head romaine lettuce, chopped', '1/2 cup Parmesan cheese, shaved', '1 cup croutons', '1/2 cup Caesar dressing', '2 anchovy fillets, minced (optional)', '1 lemon, juiced', 'Black pepper to taste'], instructions: ['Wash and dry romaine lettuce thoroughly. Chop into bite-sized pieces.', 'In a large bowl, whisk together Caesar dressing, anchovy, and lemon juice.', 'Add lettuce and toss to coat evenly.', 'Top with Parmesan shavings and croutons.', 'Season with freshly ground black pepper.', 'Serve immediately.'], tips: 'Make sure lettuce is completely dry for dressing to adhere properly.' },
  ],
  'Desserts': [
    { name: 'Classic Chocolate Chip Cookies', servings: 24, prepTime: '15 mins', cookTime: '12 mins', ingredients: ['2 1/4 cups all-purpose flour', '1 tsp baking soda', '1 tsp salt', '1 cup butter, softened', '3/4 cup granulated sugar', '3/4 cup brown sugar, packed', '2 large eggs', '2 tsp vanilla extract', '2 cups chocolate chips'], instructions: ['Preheat oven to 375F. Line baking sheets with parchment paper.', 'Whisk flour, baking soda, and salt in a bowl.', 'Beat butter and sugars until light and fluffy.', 'Add eggs and vanilla, beat until combined.', 'Gradually mix in flour mixture. Fold in chocolate chips.', 'Drop rounded tablespoons onto baking sheets.', 'Bake 9-12 minutes until golden. Cool on pan 5 minutes.'], tips: 'Chill dough 30 minutes for thicker cookies.' },
    { name: 'New York Cheesecake', servings: 12, prepTime: '30 mins', cookTime: '65 mins', ingredients: ['2 cups graham cracker crumbs', '1/3 cup melted butter', '4 packages (8 oz each) cream cheese, softened', '1 cup sugar', '1 tsp vanilla extract', '4 large eggs', '1 cup sour cream', 'Pinch of salt'], instructions: ['Preheat oven to 325F. Mix graham crumbs with melted butter. Press into springform pan.', 'Beat cream cheese until smooth. Add sugar and vanilla.', 'Add eggs one at a time, beating after each addition.', 'Mix in sour cream and salt.', 'Pour filling over crust. Bake 55-65 minutes until center is almost set.', 'Turn off oven, crack door, let cool 1 hour in oven.', 'Refrigerate at least 4 hours before serving.'], tips: 'Room temperature ingredients prevent lumps.' },
    { name: 'Apple Crisp', servings: 8, prepTime: '20 mins', cookTime: '45 mins', ingredients: ['6 medium apples, peeled and sliced', '1 cup granulated sugar', '1 tbsp cinnamon', '1 cup all-purpose flour', '1 cup rolled oats', '1 cup brown sugar, packed', '1/2 cup butter, cold and cubed', '1/2 tsp nutmeg'], instructions: ['Preheat oven to 350F. Grease a 9x13 inch baking dish.', 'Toss apples with granulated sugar and half the cinnamon.', 'Spread apples in prepared dish.', 'Mix flour, oats, brown sugar, remaining cinnamon, and nutmeg.', 'Cut in butter until mixture resembles coarse crumbs.', 'Sprinkle topping evenly over apples.', 'Bake 45 minutes until golden and bubbly. Serve warm with ice cream.'], tips: 'Use a mix of sweet and tart apples for best flavor.' },
  ],
  'Drinks': [
    { name: 'Fresh Lemonade', servings: 8, prepTime: '15 mins', cookTime: '5 mins', ingredients: ['1 cup fresh lemon juice (about 6 lemons)', '1 cup sugar', '6 cups cold water', 'Ice cubes', 'Lemon slices for garnish', 'Fresh mint leaves (optional)'], instructions: ['Make simple syrup by heating 1 cup water with sugar until dissolved. Let cool.', 'Juice lemons, straining out seeds and pulp.', 'Combine lemon juice, simple syrup, and remaining cold water.', 'Stir well and taste. Adjust sweetness if needed.', 'Serve over ice, garnished with lemon slices and mint.'], tips: 'Roll lemons on counter before juicing to get more juice.' },
    { name: 'Strawberry Banana Smoothie', servings: 2, prepTime: '5 mins', cookTime: '0 mins', ingredients: ['1 cup frozen strawberries', '1 ripe banana', '1 cup vanilla yogurt', '1/2 cup milk', '1 tbsp honey', '1/2 cup ice cubes'], instructions: ['Add all ingredients to blender.', 'Blend on high until smooth and creamy.', 'Pour into glasses and serve immediately.'], tips: 'Use frozen banana for an extra thick smoothie.' },
    { name: 'Iced Coffee', servings: 1, prepTime: '5 mins', cookTime: '0 mins', ingredients: ['1 cup strong brewed coffee, cooled', '2 tbsp half-and-half or milk', '1-2 tbsp simple syrup or sugar', 'Ice cubes', 'Whipped cream (optional)'], instructions: ['Brew coffee double-strength and let cool completely.', 'Fill a tall glass with ice cubes.', 'Pour cooled coffee over ice.', 'Add milk and sweetener to taste. Stir well.', 'Top with whipped cream if desired.'], tips: 'Freeze coffee in ice cube trays to prevent dilution.' },
  ],
  'Breakfast Favorites': [
    { name: 'Fluffy Pancakes', servings: 4, prepTime: '10 mins', cookTime: '15 mins', ingredients: ['1 1/2 cups all-purpose flour', '3 1/2 tsp baking powder', '1 tbsp sugar', '1/4 tsp salt', '1 1/4 cups milk', '1 egg', '3 tbsp melted butter', 'Maple syrup for serving'], instructions: ['Whisk flour, baking powder, sugar, and salt in large bowl.', 'Make a well in center. Add milk, egg, and melted butter.', 'Mix until just combined (lumps are okay).', 'Heat griddle to 375F or medium heat. Lightly grease.', 'Pour 1/4 cup batter per pancake. Cook until bubbles form.', 'Flip and cook until golden brown. Serve with maple syrup.'], tips: 'Don\'t overmix - lumpy batter makes fluffy pancakes.' },
    { name: 'Avocado Toast with Egg', servings: 2, prepTime: '10 mins', cookTime: '5 mins', ingredients: ['2 slices sourdough bread', '1 ripe avocado', '2 eggs', '1 tbsp olive oil', 'Red pepper flakes', 'Salt and pepper', 'Fresh lime juice'], instructions: ['Toast bread until golden and crispy.', 'Mash avocado with lime juice, salt, and pepper.', 'Fry or poach eggs to your preference.', 'Spread mashed avocado on toast.', 'Top each slice with an egg.', 'Sprinkle with red pepper flakes and serve.'], tips: 'Use perfectly ripe avocados - not too firm, not too soft.' },
  ],
  'Weeknight Dinners': [
    { name: 'One-Pan Lemon Herb Chicken', servings: 4, prepTime: '10 mins', cookTime: '35 mins', ingredients: ['4 chicken thighs', '1 lb baby potatoes, halved', '2 cups green beans', '1 lemon, sliced', '4 cloves garlic', '2 tbsp olive oil', '1 tsp dried oregano', '1 tsp dried thyme', 'Salt and pepper'], instructions: ['Preheat oven to 425F.', 'Toss potatoes with 1 tbsp oil, salt, and pepper. Spread on baking sheet.', 'Season chicken with herbs, salt, and pepper. Place on potatoes.', 'Add lemon slices and garlic around chicken.', 'Roast 25 minutes. Add green beans tossed in remaining oil.', 'Continue roasting 10 minutes until chicken is cooked through.'], tips: 'Cut potatoes same size for even cooking.' },
    { name: 'Spaghetti Bolognese', servings: 6, prepTime: '15 mins', cookTime: '45 mins', ingredients: ['1 lb ground beef', '1 lb spaghetti', '1 can (28 oz) crushed tomatoes', '1 onion, diced', '3 cloves garlic, minced', '2 carrots, diced', '2 celery stalks, diced', '1/2 cup red wine', '2 tbsp tomato paste', 'Fresh basil', 'Parmesan cheese'], instructions: ['Brown beef in large pot. Remove and set aside.', 'Saute onion, carrots, celery until softened, about 8 minutes.', 'Add garlic and tomato paste. Cook 2 minutes.', 'Add wine, scraping up brown bits.', 'Add tomatoes and cooked beef. Simmer 30 minutes.', 'Cook spaghetti according to package. Serve sauce over pasta with Parmesan.'], tips: 'The longer it simmers, the better the flavor develops.' },
  ],
  'Smoothies & Bowls': [
    { name: 'Acai Bowl', servings: 1, prepTime: '10 mins', cookTime: '0 mins', ingredients: ['2 frozen acai packets', '1 frozen banana', '1/2 cup frozen berries', '1/2 cup almond milk', 'Granola for topping', 'Fresh berries for topping', 'Honey for drizzling', 'Chia seeds'], instructions: ['Blend acai, banana, frozen berries, and almond milk until thick and smooth.', 'Pour into a bowl.', 'Top with granola, fresh berries, chia seeds.', 'Drizzle with honey and serve immediately.'], tips: 'Use less liquid for a thicker, more scoopable consistency.' },
    { name: 'Green Power Smoothie', servings: 2, prepTime: '5 mins', cookTime: '0 mins', ingredients: ['2 cups fresh spinach', '1 ripe banana', '1 cup frozen mango', '1 cup almond milk', '1 tbsp almond butter', '1 tbsp honey', '1/2 cup ice'], instructions: ['Add spinach and almond milk to blender first.', 'Blend until spinach is fully broken down.', 'Add remaining ingredients and blend until smooth.', 'Pour into glasses and serve immediately.'], tips: 'Blend greens first for smoothest texture.' },
  ],
  'Salads': [
    { name: 'Greek Salad', servings: 4, prepTime: '15 mins', cookTime: '0 mins', ingredients: ['1 English cucumber, diced', '2 cups cherry tomatoes, halved', '1 red onion, thinly sliced', '1 cup Kalamata olives', '1 cup feta cheese, cubed', '1/4 cup olive oil', '2 tbsp red wine vinegar', '1 tsp dried oregano', 'Salt and pepper'], instructions: ['Combine cucumber, tomatoes, onion, and olives in large bowl.', 'Whisk olive oil, vinegar, oregano, salt, and pepper.', 'Pour dressing over vegetables and toss gently.', 'Top with feta cheese cubes.', 'Let sit 10 minutes before serving for flavors to meld.'], tips: 'Don\'t toss the feta - let it sit on top to keep its shape.' },
    { name: 'Asian Sesame Chicken Salad', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['2 chicken breasts, grilled and sliced', '6 cups mixed greens', '1 cup edamame', '1 cup mandarin oranges', '1/2 cup crispy wonton strips', '1/4 cup sesame ginger dressing', '2 green onions, sliced', 'Sesame seeds for garnish'], instructions: ['Grill chicken breasts until cooked through. Let rest, then slice.', 'Arrange mixed greens on plates or in large bowl.', 'Top with chicken, edamame, mandarin oranges.', 'Drizzle with sesame ginger dressing.', 'Garnish with wonton strips, green onions, and sesame seeds.'], tips: 'Marinate chicken in some of the dressing before grilling for extra flavor.' },
  ],
  'Italian': [
    { name: 'Classic Margherita Pizza', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['1 lb pizza dough', '1/2 cup San Marzano tomato sauce', '8 oz fresh mozzarella, sliced', 'Fresh basil leaves', '2 tbsp olive oil', 'Salt to taste', 'Semolina for dusting'], instructions: ['Preheat oven to 500F with pizza stone if available.', 'Stretch dough into 12-inch circle on floured surface.', 'Transfer to semolina-dusted pizza peel or baking sheet.', 'Spread thin layer of tomato sauce, leaving border.', 'Arrange mozzarella slices evenly.', 'Bake 12-15 minutes until crust is golden and cheese bubbles.', 'Top with fresh basil, drizzle with olive oil. Slice and serve.'], tips: 'Let dough come to room temperature for easier stretching.' },
    { name: 'Risotto alla Milanese', servings: 4, prepTime: '10 mins', cookTime: '30 mins', ingredients: ['1 1/2 cups Arborio rice', '4 cups chicken broth, warm', '1/2 cup dry white wine', '1 small onion, finely diced', '3 tbsp butter', '1/2 cup Parmesan, grated', '1/4 tsp saffron threads', 'Salt to taste'], instructions: ['Steep saffron in 1/4 cup warm broth.', 'Saute onion in 1 tbsp butter until soft.', 'Add rice, toast 2 minutes stirring constantly.', 'Add wine, stir until absorbed.', 'Add broth one ladle at a time, stirring until absorbed before adding more.', 'After 18-20 minutes, stir in saffron mixture, remaining butter, and Parmesan.', 'Season with salt. Serve immediately.'], tips: 'Constant stirring releases starch for creamy texture.' },
  ],
  'Asian': [
    { name: 'Chicken Fried Rice', servings: 4, prepTime: '15 mins', cookTime: '15 mins', ingredients: ['3 cups day-old rice', '2 chicken breasts, diced', '3 eggs, beaten', '1 cup frozen peas and carrots', '3 green onions, sliced', '3 tbsp soy sauce', '1 tbsp sesame oil', '2 tbsp vegetable oil', '2 cloves garlic, minced'], instructions: ['Heat 1 tbsp oil in wok. Scramble eggs, set aside.', 'Add remaining oil. Stir-fry chicken until cooked. Set aside.', 'Add vegetables and garlic, stir-fry 2 minutes.', 'Add rice, breaking up any clumps. Stir-fry 3 minutes.', 'Return chicken and eggs. Add soy sauce and sesame oil.', 'Toss everything together. Top with green onions.'], tips: 'Day-old refrigerated rice works best - fresh rice gets mushy.' },
    { name: 'Pad Thai', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['8 oz rice noodles', '1/2 lb shrimp, peeled', '2 eggs, beaten', '1 cup bean sprouts', '3 tbsp fish sauce', '2 tbsp tamarind paste', '2 tbsp brown sugar', '3 tbsp vegetable oil', 'Crushed peanuts', 'Lime wedges', 'Green onions'], instructions: ['Soak rice noodles in warm water 30 minutes. Drain.', 'Mix fish sauce, tamarind paste, and brown sugar for sauce.', 'Heat oil in wok. Cook shrimp until pink. Set aside.', 'Scramble eggs in wok. Add noodles and sauce.', 'Toss 2-3 minutes until noodles are coated.', 'Add shrimp and bean sprouts. Toss briefly.', 'Serve with peanuts, lime, and green onions.'], tips: 'Have all ingredients ready before cooking - it goes fast!' },
  ],
  'Mexican': [
    { name: 'Chicken Tacos', servings: 4, prepTime: '15 mins', cookTime: '20 mins', ingredients: ['1 lb chicken breast', '1 packet taco seasoning', '8 corn tortillas', '1 cup shredded lettuce', '1 cup diced tomatoes', '1 cup shredded cheese', '1/2 cup sour cream', '1 avocado, sliced', 'Fresh cilantro', 'Lime wedges'], instructions: ['Season chicken with taco seasoning.', 'Cook in skillet over medium heat until done, about 8 minutes per side.', 'Let rest 5 minutes, then slice or shred.', 'Warm tortillas in dry skillet.', 'Fill tortillas with chicken.', 'Top with lettuce, tomatoes, cheese, avocado, sour cream, and cilantro.', 'Serve with lime wedges.'], tips: 'Char tortillas slightly for authentic flavor.' },
    { name: 'Guacamole', servings: 6, prepTime: '15 mins', cookTime: '0 mins', ingredients: ['3 ripe avocados', '1 lime, juiced', '1/2 red onion, finely diced', '2 Roma tomatoes, diced', '1/4 cup fresh cilantro, chopped', '1 jalapeno, seeded and minced', '2 cloves garlic, minced', 'Salt to taste'], instructions: ['Cut avocados in half, remove pit, scoop into bowl.', 'Add lime juice and salt. Mash to desired consistency.', 'Fold in onion, tomatoes, cilantro, jalapeno, and garlic.', 'Taste and adjust seasoning.', 'Serve immediately with tortilla chips.'], tips: 'Leave an avocado pit in the guacamole to prevent browning.' },
  ],
}

// Get recipes for a category, with fallback to similar categories
function getRecipesForCategory(categoryName, count) {
  const normalizedName = categoryName.toLowerCase()
  
  // Try exact match first
  for (const [key, recipes] of Object.entries(FALLBACK_RECIPES)) {
    if (key.toLowerCase() === normalizedName) {
      return recipes.slice(0, count)
    }
  }
  
  // Try partial match
  for (const [key, recipes] of Object.entries(FALLBACK_RECIPES)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return recipes.slice(0, count)
    }
  }
  
  // Return from most appropriate category based on keywords
  if (normalizedName.includes('appetizer') || normalizedName.includes('starter')) {
    return FALLBACK_RECIPES['Appetizers'].slice(0, count)
  }
  if (normalizedName.includes('main') || normalizedName.includes('dinner') || normalizedName.includes('entree')) {
    return FALLBACK_RECIPES['Main Courses'].slice(0, count)
  }
  if (normalizedName.includes('dessert') || normalizedName.includes('sweet') || normalizedName.includes('cake') || normalizedName.includes('cookie')) {
    return FALLBACK_RECIPES['Desserts'].slice(0, count)
  }
  if (normalizedName.includes('salad') || normalizedName.includes('healthy') || normalizedName.includes('green')) {
    return FALLBACK_RECIPES['Salads'].slice(0, count)
  }
  if (normalizedName.includes('breakfast') || normalizedName.includes('morning') || normalizedName.includes('brunch')) {
    return FALLBACK_RECIPES['Breakfast Favorites'].slice(0, count)
  }
  if (normalizedName.includes('drink') || normalizedName.includes('beverage') || normalizedName.includes('smoothie')) {
    return FALLBACK_RECIPES['Drinks'].slice(0, count)
  }
  if (normalizedName.includes('italian') || normalizedName.includes('pasta') || normalizedName.includes('pizza')) {
    return FALLBACK_RECIPES['Italian'].slice(0, count)
  }
  if (normalizedName.includes('asian') || normalizedName.includes('chinese') || normalizedName.includes('thai')) {
    return FALLBACK_RECIPES['Asian'].slice(0, count)
  }
  if (normalizedName.includes('mexican') || normalizedName.includes('taco') || normalizedName.includes('burrito')) {
    return FALLBACK_RECIPES['Mexican'].slice(0, count)
  }
  
  // Default to main courses
  return FALLBACK_RECIPES['Main Courses'].slice(0, count)
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
- ingredients: Array of ingredient strings with measurements
- instructions: Array of step strings (detailed)
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
      console.error('AI generation failed, using real recipe fallback:', aiError.message)
      
      // Fallback with REAL recipes
      const fallbackCategories = config.categories.map(catName => ({
        name: catName,
        recipes: getRecipesForCategory(catName, recipesPerCategory)
      }))
      
      return NextResponse.json({
        success: true,
        title: title || config.name,
        subtitle: `A Collection of ${recipeCount} Delicious Recipes`,
        introduction: `Welcome to your personal cookbook! This collection features ${recipeCount} carefully curated recipes to inspire your culinary adventures. Each recipe has been crafted with clear instructions and helpful tips to ensure success in your kitchen.`,
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
