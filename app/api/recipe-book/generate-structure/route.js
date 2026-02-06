import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforceRateLimit } from '@/lib/rate-limiter'

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
  'Chinese': [
    { name: 'Kung Pao Chicken', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['1 lb chicken breast, cubed', '1/2 cup roasted peanuts', '8 dried red chilies', '3 tbsp soy sauce', '2 tbsp rice vinegar', '1 tbsp hoisin sauce', '2 tsp sugar', '1 tbsp cornstarch', '3 cloves garlic, minced', '1 inch ginger, minced', '4 green onions, sliced', '2 tbsp vegetable oil'], instructions: ['Mix soy sauce, vinegar, hoisin, sugar, and cornstarch for sauce.', 'Heat oil in wok over high heat. Stir-fry chicken until cooked, 5-6 minutes. Set aside.', 'Add more oil, stir-fry chilies, garlic, and ginger for 30 seconds.', 'Return chicken, add sauce and peanuts.', 'Toss until sauce thickens. Garnish with green onions.'], tips: 'Adjust dried chilies based on your spice preference.' },
    { name: 'Mapo Tofu', servings: 4, prepTime: '15 mins', cookTime: '15 mins', ingredients: ['1 lb firm tofu, cubed', '1/2 lb ground pork', '2 tbsp doubanjiang (spicy bean paste)', '1 tbsp fermented black beans', '2 cups chicken broth', '1 tbsp soy sauce', '1 tsp sugar', '2 tbsp cornstarch slurry', 'Sichuan peppercorns', '3 cloves garlic', '2 green onions'], instructions: ['Brown ground pork in wok, breaking into small pieces.', 'Add doubanjiang, black beans, and garlic. Stir-fry 1 minute.', 'Add broth, soy sauce, and sugar. Bring to simmer.', 'Gently add tofu cubes, simmer 5 minutes.', 'Add cornstarch slurry to thicken.', 'Top with Sichuan peppercorns and green onions.'], tips: 'Use silken tofu for a more traditional texture.' },
    { name: 'Sweet and Sour Pork', servings: 4, prepTime: '25 mins', cookTime: '20 mins', ingredients: ['1 lb pork tenderloin, cubed', '1 cup pineapple chunks', '1 bell pepper, cubed', '1 onion, cubed', '1/2 cup ketchup', '1/4 cup rice vinegar', '1/4 cup brown sugar', '2 tbsp soy sauce', '1 cup cornstarch', '2 eggs, beaten', 'Oil for frying'], instructions: ['Mix ketchup, vinegar, sugar, and soy sauce for sauce.', 'Dip pork in egg, then coat in cornstarch.', 'Deep fry pork until golden and crispy. Drain.', 'Stir-fry pepper and onion until crisp-tender.', 'Add sauce and pineapple, bring to simmer.', 'Add crispy pork, toss to coat. Serve immediately.'], tips: 'Double-fry the pork for extra crispiness.' },
    { name: 'Chinese Fried Rice', servings: 4, prepTime: '10 mins', cookTime: '10 mins', ingredients: ['4 cups day-old rice', '3 eggs, beaten', '1 cup mixed vegetables (peas, carrots, corn)', '4 green onions, sliced', '3 tbsp soy sauce', '1 tbsp sesame oil', '2 tbsp vegetable oil', '1/2 cup diced ham or shrimp (optional)'], instructions: ['Heat wok over high heat, add oil.', 'Scramble eggs, break into pieces, set aside.', 'Add more oil, stir-fry vegetables 2 minutes.', 'Add rice, breaking up any clumps.', 'Stir-fry 3-4 minutes until rice is heated through.', 'Add soy sauce, sesame oil, eggs, and green onions. Toss well.'], tips: 'Cold, day-old rice prevents mushy fried rice.' },
    { name: 'Dim Sum Dumplings', servings: 6, prepTime: '45 mins', cookTime: '15 mins', ingredients: ['1 lb ground pork', '1/2 lb shrimp, minced', '2 cups napa cabbage, minced', '2 tbsp soy sauce', '1 tbsp sesame oil', '1 inch ginger, minced', '2 green onions, minced', '40 dumpling wrappers', 'Dipping sauce: soy sauce, vinegar, chili oil'], instructions: ['Mix pork, shrimp, cabbage, soy sauce, sesame oil, ginger, and green onions.', 'Place 1 tbsp filling in center of wrapper.', 'Wet edges, fold and pleat to seal.', 'Steam dumplings for 10-12 minutes.', 'Or pan-fry: cook bottom until golden, add water, cover and steam.', 'Serve with dipping sauce.'], tips: 'Freeze extra dumplings for quick meals.' },
  ],
  'Indian': [
    { name: 'Butter Chicken (Murgh Makhani)', servings: 6, prepTime: '30 mins', cookTime: '30 mins', ingredients: ['2 lbs chicken thighs, cubed', '1 cup yogurt', '2 tbsp garam masala', '1 tbsp turmeric', '1 can (14 oz) tomato puree', '1 cup heavy cream', '4 tbsp butter', '1 onion, diced', '4 cloves garlic', '2 inch ginger', '1 tsp cumin', 'Fresh cilantro'], instructions: ['Marinate chicken in yogurt, half the garam masala, and turmeric for 30 minutes.', 'Grill or pan-fry marinated chicken until charred. Set aside.', 'Melt butter, saute onion, garlic, and ginger until soft.', 'Add remaining spices, cook 1 minute.', 'Add tomato puree, simmer 15 minutes.', 'Stir in cream, add chicken, simmer 10 minutes.', 'Garnish with cilantro. Serve with rice or naan.'], tips: 'Marinate overnight for deeper flavor.' },
    { name: 'Chicken Tikka Masala', servings: 6, prepTime: '30 mins', cookTime: '25 mins', ingredients: ['2 lbs chicken breast, cubed', '1 cup yogurt', '2 tbsp tikka masala spice', '1 can (14 oz) crushed tomatoes', '1 cup heavy cream', '1 onion, diced', '4 cloves garlic, minced', '2 inch ginger, grated', '2 tbsp vegetable oil', '2 tbsp butter', 'Fresh cilantro', 'Garam masala to finish'], instructions: ['Marinate chicken in yogurt and half the tikka spice for at least 1 hour.', 'Thread chicken on skewers, grill or broil until charred.', 'Saute onion in oil until golden. Add garlic and ginger.', 'Add remaining spices, tomatoes. Simmer 10 minutes.', 'Blend sauce until smooth, return to pan.', 'Add cream and grilled chicken. Simmer 10 minutes.', 'Finish with butter and garam masala. Serve with rice.'], tips: 'Char the chicken for authentic tandoori flavor.' },
    { name: 'Palak Paneer', servings: 4, prepTime: '20 mins', cookTime: '20 mins', ingredients: ['14 oz paneer, cubed', '1 lb fresh spinach', '1 onion, diced', '4 cloves garlic', '1 inch ginger', '2 green chilies', '1 tsp cumin seeds', '1 tsp garam masala', '1/2 cup cream', '2 tbsp ghee', 'Salt to taste'], instructions: ['Blanch spinach in boiling water for 2 minutes. Drain and blend to puree.', 'Fry paneer cubes in ghee until golden. Set aside.', 'Saute cumin seeds until fragrant. Add onion, garlic, ginger, and chilies.', 'Cook until onion is soft. Add garam masala.', 'Add spinach puree, simmer 5 minutes.', 'Stir in cream and fried paneer.', 'Simmer 5 more minutes. Serve with roti or rice.'], tips: 'Don\'t overcook spinach to keep the bright green color.' },
    { name: 'Biryani', servings: 6, prepTime: '45 mins', cookTime: '45 mins', ingredients: ['2 cups basmati rice', '1 lb chicken or lamb', '2 onions, sliced thin', '1 cup yogurt', '2 tbsp biryani masala', '1 tsp turmeric', '4 cardamom pods', '4 cloves', '1 cinnamon stick', 'Saffron in warm milk', '1/4 cup ghee', 'Fried onions, mint, cilantro for garnish'], instructions: ['Soak rice 30 minutes. Parboil with whole spices until 70% done. Drain.', 'Marinate meat in yogurt, biryani masala, and turmeric.', 'Fry onions until golden brown. Remove half for garnish.', 'Add marinated meat to onions, cook until done.', 'Layer meat and rice in pot. Drizzle saffron milk and ghee.', 'Cover tightly, cook on low heat 25-30 minutes (dum).', 'Garnish with fried onions, mint, and cilantro.'], tips: 'The steam cooking (dum) is key - seal the pot well.' },
    { name: 'Samosas', servings: 12, prepTime: '45 mins', cookTime: '20 mins', ingredients: ['For dough: 2 cups flour, 4 tbsp oil, water, salt', 'For filling: 3 potatoes, boiled and mashed', '1 cup green peas', '1 tsp cumin seeds', '1 tsp garam masala', '1 tsp chili powder', '1 inch ginger, minced', 'Fresh cilantro', 'Oil for frying'], instructions: ['Make dough: mix flour, oil, salt. Add water to form stiff dough. Rest 30 minutes.', 'For filling: saute cumin seeds, add all spices.', 'Add mashed potatoes and peas. Mix well. Let cool.', 'Roll dough into circles, cut in half.', 'Form cone shape, fill with potato mixture, seal edges.', 'Deep fry until golden brown.', 'Serve with mint chutney and tamarind sauce.'], tips: 'Ensure edges are well sealed to prevent oil seepage.' },
  ],
  'Indo-Chinese': [
    { name: 'Chicken Manchurian', servings: 4, prepTime: '25 mins', cookTime: '20 mins', ingredients: ['1 lb chicken breast, cubed', '1/2 cup cornstarch', '1 egg', 'For sauce: 3 tbsp soy sauce, 2 tbsp chili sauce, 1 tbsp vinegar', '1 onion, diced', '1 bell pepper, diced', '6 cloves garlic, minced', '1 inch ginger, minced', '4 green onions', '2 tbsp oil', 'Oil for frying'], instructions: ['Mix chicken with egg and cornstarch. Deep fry until golden.', 'Mix all sauce ingredients with 1/2 cup water.', 'Heat oil, saute garlic and ginger.', 'Add onion and bell pepper, stir-fry 2 minutes.', 'Add sauce mixture, bring to boil.', 'Add fried chicken, toss to coat.', 'Garnish with green onions. Serve over rice.'], tips: 'For restaurant-style, double fry the chicken.' },
    { name: 'Hakka Noodles', servings: 4, prepTime: '15 mins', cookTime: '15 mins', ingredients: ['400g hakka noodles', '2 cups mixed vegetables (cabbage, carrots, bell peppers)', '4 cloves garlic, minced', '2 tbsp soy sauce', '1 tbsp chili sauce', '1 tbsp vinegar', '2 tbsp vegetable oil', 'Green onions for garnish', 'Salt and pepper'], instructions: ['Boil noodles until just done. Drain and toss with 1 tbsp oil.', 'Heat remaining oil in wok over high heat.', 'Add garlic, stir-fry 30 seconds.', 'Add vegetables, stir-fry 3-4 minutes until crisp-tender.', 'Add noodles, soy sauce, chili sauce, and vinegar.', 'Toss everything together for 2-3 minutes.', 'Season with salt and pepper. Garnish with green onions.'], tips: 'Keep the heat high for that smoky wok flavor.' },
    { name: 'Chilli Paneer', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['14 oz paneer, cubed', '1/2 cup cornstarch', '1 onion, cubed', '1 bell pepper, cubed', '6 cloves garlic, minced', '1 inch ginger, minced', '2 tbsp soy sauce', '1 tbsp chili sauce', '1 tbsp tomato ketchup', '2 tbsp vegetable oil', 'Green onions'], instructions: ['Coat paneer cubes in cornstarch. Pan-fry until golden. Set aside.', 'Heat oil, saute garlic and ginger.', 'Add onion and bell pepper, stir-fry 2 minutes.', 'Mix soy sauce, chili sauce, ketchup with 1/4 cup water.', 'Add sauce to wok, bring to simmer.', 'Add fried paneer, toss to coat.', 'Garnish with green onions. Serve hot.'], tips: 'For extra crispy paneer, double-coat in cornstarch.' },
    { name: 'Gobi Manchurian', servings: 4, prepTime: '25 mins', cookTime: '20 mins', ingredients: ['1 medium cauliflower, in florets', '1/2 cup all-purpose flour', '1/4 cup cornstarch', '1 tsp ginger-garlic paste', 'For sauce: 2 tbsp soy sauce, 1 tbsp chili sauce, 1 tbsp vinegar', '1 onion, diced', '1 bell pepper, diced', '4 cloves garlic, minced', 'Green onions', 'Oil for frying'], instructions: ['Make batter with flour, cornstarch, ginger-garlic paste, and water.', 'Dip cauliflower florets in batter, deep fry until golden.', 'Mix all sauce ingredients with 1/2 cup water.', 'Saute garlic, onion, and bell pepper.', 'Add sauce, bring to simmer.', 'Add fried cauliflower, toss gently to coat.', 'Garnish with green onions.'], tips: 'Serve immediately for best crunch.' },
    { name: 'Schezwan Fried Rice', servings: 4, prepTime: '15 mins', cookTime: '15 mins', ingredients: ['4 cups cooked rice (day old)', '2 tbsp schezwan sauce', '2 eggs, beaten', '1 cup mixed vegetables', '4 cloves garlic, minced', '2 tbsp soy sauce', '1 tbsp vegetable oil', 'Green onions', 'Salt to taste'], instructions: ['Heat oil in wok over high heat.', 'Scramble eggs, set aside.', 'Add garlic, stir-fry 30 seconds.', 'Add vegetables, stir-fry 2 minutes.', 'Add rice, schezwan sauce, and soy sauce.', 'Toss well for 3-4 minutes.', 'Add scrambled eggs, mix well.', 'Garnish with green onions.'], tips: 'Adjust schezwan sauce for spice level.' },
    { name: 'Vegetable Spring Rolls', servings: 8, prepTime: '30 mins', cookTime: '15 mins', ingredients: ['2 cups cabbage, shredded', '1 cup carrots, julienned', '1/2 cup spring onions', '1 tsp ginger, minced', '2 tbsp soy sauce', '1 tbsp vinegar', '12 spring roll wrappers', 'Oil for frying', 'Sweet chili sauce for dipping'], instructions: ['Saute cabbage, carrots, and spring onions with ginger.', 'Add soy sauce and vinegar. Cool completely.', 'Place 2 tbsp filling on each wrapper.', 'Roll tightly, sealing edges with water.', 'Deep fry until golden brown.', 'Serve hot with sweet chili sauce.'], tips: 'Ensure filling is completely cool before rolling.' },
    { name: 'Manchow Soup', servings: 4, prepTime: '15 mins', cookTime: '20 mins', ingredients: ['6 cups vegetable stock', '1 cup mixed vegetables, julienned', '2 tbsp soy sauce', '1 tbsp chili sauce', '1 tbsp vinegar', '2 tbsp cornstarch', '1 tsp black pepper', 'Crispy noodles for topping', 'Green onions'], instructions: ['Bring stock to boil. Add vegetables.', 'Add soy sauce, chili sauce, and vinegar.', 'Mix cornstarch with water, add to soup.', 'Cook until slightly thickened.', 'Season with pepper.', 'Serve topped with crispy noodles and green onions.'], tips: 'Add an egg for a richer soup.' },
    { name: 'Chilli Chicken', servings: 4, prepTime: '20 mins', cookTime: '20 mins', ingredients: ['1 lb chicken, cubed', '1/2 cup cornstarch', '1 egg', '2 onions, cubed', '2 bell peppers, cubed', '8 dried red chilies', '4 cloves garlic', '1 inch ginger', '3 tbsp soy sauce', '2 tbsp chili sauce', '1 tbsp vinegar', 'Green onions'], instructions: ['Mix chicken with egg and cornstarch. Deep fry until crispy.', 'Heat oil, fry dried chilies, garlic, and ginger.', 'Add onions and peppers, stir-fry 2 minutes.', 'Mix soy sauce, chili sauce, vinegar with 1/4 cup water.', 'Add sauce and fried chicken.', 'Toss until well coated.', 'Garnish with green onions.'], tips: 'Use Kashmiri chilies for color without too much heat.' },
    { name: 'Veg Fried Rice', servings: 4, prepTime: '10 mins', cookTime: '15 mins', ingredients: ['4 cups cooked rice', '2 cups mixed vegetables', '2 eggs', '3 tbsp soy sauce', '1 tbsp sesame oil', '4 cloves garlic, minced', '2 tbsp vegetable oil', 'Green onions', 'White pepper'], instructions: ['Heat oil in wok. Scramble eggs, set aside.', 'Add garlic, stir-fry until fragrant.', 'Add vegetables, cook 3 minutes.', 'Add rice, breaking any clumps.', 'Add soy sauce and sesame oil.', 'Return eggs, toss everything together.', 'Season with white pepper, top with green onions.'], tips: 'Use day-old refrigerated rice for best results.' },
    { name: 'Honey Chilli Potato', servings: 4, prepTime: '15 mins', cookTime: '20 mins', ingredients: ['4 large potatoes, cut into strips', '1/2 cup cornstarch', '3 tbsp honey', '2 tbsp soy sauce', '1 tbsp chili sauce', '4 cloves garlic, minced', '2 tbsp sesame seeds', 'Oil for frying', 'Green onions'], instructions: ['Coat potato strips in cornstarch. Deep fry until golden and crispy.', 'Heat 1 tbsp oil, saute garlic.', 'Add honey, soy sauce, and chili sauce. Cook 1 minute.', 'Add fried potatoes, toss to coat evenly.', 'Sprinkle sesame seeds and green onions.', 'Serve immediately.'], tips: 'Double fry for extra crispy potatoes.' },
    { name: 'Szechuan Chicken', servings: 4, prepTime: '20 mins', cookTime: '15 mins', ingredients: ['1 lb chicken breast, sliced', '2 tbsp Szechuan peppercorns', '6 dried red chilies', '4 cloves garlic', '1 inch ginger', '2 tbsp soy sauce', '1 tbsp dark soy sauce', '1 tbsp rice wine', '1 tsp sugar', '2 tbsp vegetable oil', 'Green onions'], instructions: ['Marinate chicken in soy sauce and rice wine for 15 minutes.', 'Toast Szechuan peppercorns, grind coarsely.', 'Heat oil, stir-fry chicken until cooked. Set aside.', 'Add chilies, garlic, and ginger. Stir-fry 1 minute.', 'Return chicken, add both soy sauces and sugar.', 'Add ground peppercorns, toss well.', 'Garnish with green onions.'], tips: 'Adjust Szechuan peppercorns for numbing spice level.' },
    { name: 'American Chop Suey', servings: 4, prepTime: '15 mins', cookTime: '20 mins', ingredients: ['200g thin noodles', '1 cup mixed vegetables', '1/2 cup ketchup', '2 tbsp soy sauce', '1 tbsp chili sauce', '1 tbsp vinegar', '1 cup vegetable stock', '2 tbsp cornstarch', '4 cloves garlic', 'Oil for frying'], instructions: ['Boil noodles, drain and deep fry until crispy. Set aside.', 'Mix ketchup, soy sauce, chili sauce, vinegar, and stock.', 'Mix cornstarch with water.', 'Saute garlic, add vegetables.', 'Add sauce mixture, bring to boil.', 'Add cornstarch slurry to thicken.', 'Pour hot sauce over crispy noodles and serve.'], tips: 'Serve immediately for crispy noodle texture.' },
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
  if (normalizedName.includes('chinese') || normalizedName.includes('china') || normalizedName.includes('cantonese') || normalizedName.includes('szechuan') || normalizedName.includes('sichuan')) {
    return FALLBACK_RECIPES['Chinese'].slice(0, count)
  }
  if (normalizedName.includes('indian') || normalizedName.includes('india') || normalizedName.includes('curry') || normalizedName.includes('masala') || normalizedName.includes('tikka') || normalizedName.includes('biryani')) {
    return FALLBACK_RECIPES['Indian'].slice(0, count)
  }
  if (normalizedName.includes('indo-chinese') || normalizedName.includes('indo chinese') || normalizedName.includes('manchurian') || normalizedName.includes('hakka')) {
    return FALLBACK_RECIPES['Indo-Chinese'].slice(0, count)
  }
  if (normalizedName.includes('asian') || normalizedName.includes('thai') || normalizedName.includes('vietnamese') || normalizedName.includes('korean') || normalizedName.includes('japanese')) {
    return FALLBACK_RECIPES['Asian'].slice(0, count)
  }
  if (normalizedName.includes('mexican') || normalizedName.includes('taco') || normalizedName.includes('burrito')) {
    return FALLBACK_RECIPES['Mexican'].slice(0, count)
  }
  
  // Default to main courses
  return FALLBACK_RECIPES['Main Courses'].slice(0, count)
}

// Detect cuisine/theme from title
function detectCuisineFromTitle(title) {
  if (!title) return null
  const lowerTitle = title.toLowerCase()
  
  // Check for Indo-Chinese (fusion) first - more specific
  if (lowerTitle.includes('indo-chinese') || lowerTitle.includes('indo chinese') || 
      lowerTitle.includes('manchurian') || lowerTitle.includes('hakka') ||
      (lowerTitle.includes('chinese') && (lowerTitle.includes('masala') || lowerTitle.includes('indian')))) {
    return 'Indo-Chinese'
  }
  // Check for Chinese
  if (lowerTitle.includes('chinese') || lowerTitle.includes('china') || lowerTitle.includes('cantonese') || lowerTitle.includes('szechuan') || lowerTitle.includes('sichuan') || lowerTitle.includes('dim sum') || lowerTitle.includes('wok')) {
    return 'Chinese'
  }
  // Check for Indian
  if (lowerTitle.includes('indian') || lowerTitle.includes('india') || lowerTitle.includes('curry') || lowerTitle.includes('masala') || lowerTitle.includes('tikka') || lowerTitle.includes('biryani') || lowerTitle.includes('tandoori')) {
    return 'Indian'
  }
  if (lowerTitle.includes('italian') || lowerTitle.includes('italy') || lowerTitle.includes('pasta') || lowerTitle.includes('pizza')) {
    return 'Italian'
  }
  if (lowerTitle.includes('mexican') || lowerTitle.includes('mexico') || lowerTitle.includes('taco') || lowerTitle.includes('burrito')) {
    return 'Mexican'
  }
  if (lowerTitle.includes('asian') || lowerTitle.includes('thai') || lowerTitle.includes('vietnamese') || lowerTitle.includes('korean') || lowerTitle.includes('japanese')) {
    return 'Asian'
  }
  if (lowerTitle.includes('mediterranean') || lowerTitle.includes('greek') || lowerTitle.includes('turkish')) {
    return 'Mediterranean'
  }
  
  return null
}

// Generate themed categories based on detected cuisine
function getThemedCategories(cuisine) {
  switch (cuisine) {
    case 'Chinese':
      return ['Appetizers & Dim Sum', 'Stir-Fry Dishes', 'Noodles & Rice', 'Soups', 'Desserts']
    case 'Indian':
      return ['Appetizers & Snacks', 'Curries & Gravies', 'Rice & Biryani', 'Breads & Rotis', 'Desserts & Sweets']
    case 'Indo-Chinese':
      return ['Starters', 'Dry Preparations', 'Gravy Dishes', 'Noodles & Rice', 'Soups']
    case 'Italian':
      return ['Antipasti', 'Pasta', 'Pizza', 'Risotto', 'Dolci']
    case 'Mexican':
      return ['Appetizers', 'Tacos & Burritos', 'Main Dishes', 'Sides & Salsas', 'Desserts']
    case 'Asian':
      return ['Starters', 'Noodles', 'Rice Dishes', 'Stir-Fries', 'Desserts']
    default:
      return null
  }
}

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for content generation
    const rateLimitCheck = await enforceRateLimit(request, 'content_generate')
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response
    }

    const { bookType, title, recipeCount, targetAudience } = await request.json()
    
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
      return NextResponse.json({
        success: true,
        ...data
      })
    } catch (aiError) {
      console.error('AI generation failed, using real recipe fallback:', aiError.message)
      
      // Detect cuisine from user's title to generate relevant recipes
      const detectedCuisine = detectCuisineFromTitle(title)
      let fallbackCategories
      
      if (detectedCuisine) {
        // Use themed categories based on detected cuisine
        const themedCats = getThemedCategories(detectedCuisine) || config.categories
        const cuisineRecipes = FALLBACK_RECIPES[detectedCuisine] || []
        
        fallbackCategories = themedCats.map((catName, idx) => ({
          name: catName,
          // Distribute cuisine recipes across categories
          recipes: cuisineRecipes.slice(
            Math.floor(idx * cuisineRecipes.length / themedCats.length),
            Math.floor((idx + 1) * cuisineRecipes.length / themedCats.length)
          ).concat(
            // If not enough cuisine-specific recipes, get more
            getRecipesForCategory(catName, recipesPerCategory).slice(0, Math.max(0, recipesPerCategory - Math.ceil(cuisineRecipes.length / themedCats.length)))
          ).slice(0, recipesPerCategory)
        }))
      } else {
        // Use default categories from config
        fallbackCategories = config.categories.map(catName => ({
          name: catName,
          recipes: getRecipesForCategory(catName, recipesPerCategory)
        }))
      }
      
      return NextResponse.json({
        success: true,
        title: title || config.name,
        subtitle: detectedCuisine 
          ? `Authentic ${detectedCuisine} Recipes for Every Occasion`
          : `A Collection of ${recipeCount} Delicious Recipes`,
        introduction: detectedCuisine
          ? `Welcome to your ${detectedCuisine} cookbook! This collection features authentic recipes from ${detectedCuisine} cuisine, carefully crafted with traditional ingredients and modern techniques. Whether you're a beginner or an experienced cook, these recipes will help you create delicious ${detectedCuisine} dishes at home.`
          : `Welcome to your personal cookbook! This collection features ${recipeCount} carefully curated recipes to inspire your culinary adventures. Each recipe has been crafted with clear instructions and helpful tips to ensure success in your kitchen.`,
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
