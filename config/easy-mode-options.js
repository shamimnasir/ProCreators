// Easy Mode UI Configuration
// Pre-built options for novice users - generates prompts automatically

// ================== AI VIDEO STUDIO EASY MODE ==================
export const AI_VIDEO_EASY_OPTIONS = {
  productType: {
    label: 'Product Type',
    icon: '📦',
    options: [
      { value: 'gadget', label: 'Tech/Gadget', prompt: 'modern technology product, sleek design, high-tech' },
      { value: 'fashion', label: 'Fashion/Clothing', prompt: 'stylish fashion item, trendy, elegant presentation' },
      { value: 'food', label: 'Food/Beverage', prompt: 'delicious food product, appetizing, fresh ingredients' },
      { value: 'beauty', label: 'Beauty/Cosmetics', prompt: 'luxury beauty product, glamorous, soft lighting' },
      { value: 'home', label: 'Home/Decor', prompt: 'cozy home product, warm ambiance, lifestyle setting' },
      { value: 'fitness', label: 'Fitness/Sports', prompt: 'energetic sports product, dynamic, athletic vibe' },
      { value: 'kids', label: 'Kids/Toys', prompt: 'colorful kids product, playful, fun environment' },
      { value: 'luxury', label: 'Luxury/Premium', prompt: 'premium luxury product, elegant, sophisticated' },
    ]
  },
  visualStyle: {
    label: 'Visual Style',
    icon: '🎨',
    options: [
      { value: '2d', label: '2D Flat', prompt: 'flat 2D animation style, clean graphics' },
      { value: '3d', label: '3D Render', prompt: 'photorealistic 3D render, detailed textures' },
      { value: 'realistic', label: 'Realistic', prompt: 'ultra-realistic, cinematic quality' },
      { value: 'cartoon', label: 'Cartoon', prompt: 'cartoon animation style, vibrant colors' },
      { value: 'minimal', label: 'Minimal', prompt: 'minimalist design, clean white background' },
      { value: 'cinematic', label: 'Cinematic', prompt: 'cinematic movie style, dramatic lighting' },
    ]
  },
  environment: {
    label: 'Environment',
    icon: '🌍',
    options: [
      { value: 'studio', label: 'Studio', prompt: 'professional studio setting, controlled lighting' },
      { value: 'outdoor', label: 'Outdoor', prompt: 'beautiful outdoor location, natural lighting' },
      { value: 'abstract', label: 'Abstract', prompt: 'abstract colorful background, artistic' },
      { value: 'urban', label: 'Urban/City', prompt: 'urban city environment, modern architecture' },
      { value: 'nature', label: 'Nature', prompt: 'natural environment, trees and greenery' },
      { value: 'home', label: 'Home Interior', prompt: 'cozy home interior, lifestyle setting' },
    ]
  },
  cameraMotion: {
    label: 'Camera Motion',
    icon: '🎥',
    options: [
      { value: 'static', label: 'Static', prompt: 'static camera, steady shot' },
      { value: 'zoom', label: 'Zoom In', prompt: 'slow zoom in, focusing on product' },
      { value: 'orbit', label: '360° Orbit', prompt: 'orbiting camera, 360 degree view' },
      { value: 'pan', label: 'Pan/Slide', prompt: 'smooth panning motion, cinematic slide' },
      { value: 'dramatic', label: 'Dramatic', prompt: 'dramatic camera angles, dynamic movement' },
    ]
  },
  mood: {
    label: 'Mood/Tone',
    icon: '✨',
    options: [
      { value: 'energetic', label: 'Energetic', prompt: 'high energy, vibrant, exciting' },
      { value: 'calm', label: 'Calm/Relaxing', prompt: 'peaceful, calming, serene atmosphere' },
      { value: 'luxury', label: 'Luxurious', prompt: 'premium, sophisticated, elegant' },
      { value: 'fun', label: 'Fun/Playful', prompt: 'playful, cheerful, entertaining' },
      { value: 'professional', label: 'Professional', prompt: 'corporate, business-like, trustworthy' },
      { value: 'inspiring', label: 'Inspiring', prompt: 'motivational, uplifting, aspirational' },
    ]
  },
  useModel: {
    label: 'Human Model',
    icon: '👤',
    options: [
      { value: 'none', label: 'No Model', prompt: '' },
      { value: 'hands', label: 'Hands Only', prompt: 'human hands holding/using the product' },
      { value: 'female', label: 'Female Model', prompt: 'attractive female model showcasing product' },
      { value: 'male', label: 'Male Model', prompt: 'professional male model with product' },
      { value: 'diverse', label: 'Diverse Group', prompt: 'diverse group of people using product' },
    ]
  }
}

// ================== QUICK REELS EASY MODE ==================
export const QUICK_REELS_EASY_OPTIONS = {
  contentTone: {
    label: 'Content Tone',
    icon: '🎭',
    options: [
      { value: 'inspiring', label: 'Inspiring', prompt: 'Create an inspiring and motivational message' },
      { value: 'educational', label: 'Educational', prompt: 'Provide educational and informative content' },
      { value: 'entertaining', label: 'Entertaining', prompt: 'Make it fun and entertaining' },
      { value: 'emotional', label: 'Emotional', prompt: 'Create an emotional and touching story' },
      { value: 'humorous', label: 'Humorous', prompt: 'Add humor and comedy elements' },
      { value: 'dramatic', label: 'Dramatic', prompt: 'Build tension and drama' },
    ]
  },
  targetAudience: {
    label: 'Target Audience',
    icon: '👥',
    options: [
      { value: 'general', label: 'General', prompt: 'for a general audience' },
      { value: 'teens', label: 'Teenagers', prompt: 'targeting teenagers and young adults' },
      { value: 'adults', label: 'Adults', prompt: 'for mature adult audience' },
      { value: 'parents', label: 'Parents', prompt: 'speaking to parents and families' },
      { value: 'professionals', label: 'Professionals', prompt: 'for business professionals' },
      { value: 'students', label: 'Students', prompt: 'for students and learners' },
    ]
  },
  hookStyle: {
    label: 'Hook Style',
    icon: '🪝',
    options: [
      { value: 'question', label: 'Question Hook', prompt: 'Start with a compelling question' },
      { value: 'shocking', label: 'Shocking Fact', prompt: 'Open with a shocking or surprising fact' },
      { value: 'story', label: 'Story Start', prompt: 'Begin with "Once upon a time" or a story' },
      { value: 'challenge', label: 'Challenge', prompt: 'Present a challenge or dare' },
      { value: 'countdown', label: 'Countdown', prompt: 'Use a countdown or list format' },
    ]
  }
}

// ================== DIGITAL PRODUCTS EASY MODE ==================
export const DIGITAL_PRODUCTS_EASY_OPTIONS = {
  printableType: {
    label: 'Printable Type',
    icon: '📄',
    options: [
      { value: 'planner', label: 'Daily Planner' },
      { value: 'weekly', label: 'Weekly Planner' },
      { value: 'monthly', label: 'Monthly Calendar' },
      { value: 'habit', label: 'Habit Tracker' },
      { value: 'budget', label: 'Budget Tracker' },
      { value: 'meal', label: 'Meal Planner' },
      { value: 'fitness', label: 'Fitness Log' },
      { value: 'gratitude', label: 'Gratitude Journal' },
    ]
  },
  coloringTheme: {
    label: 'Coloring Theme',
    icon: '🎨',
    options: [
      { value: 'animals', label: 'Animals' },
      { value: 'nature', label: 'Nature/Flowers' },
      { value: 'mandala', label: 'Mandalas' },
      { value: 'fantasy', label: 'Fantasy/Dragons' },
      { value: 'ocean', label: 'Ocean/Sea Life' },
      { value: 'space', label: 'Space/Planets' },
      { value: 'holiday', label: 'Holiday/Seasonal' },
      { value: 'patterns', label: 'Abstract Patterns' },
    ]
  },
  worksheetSubject: {
    label: 'Subject',
    icon: '📚',
    options: [
      { value: 'math', label: 'Math' },
      { value: 'reading', label: 'Reading/Writing' },
      { value: 'science', label: 'Science' },
      { value: 'language', label: 'Language/Vocabulary' },
      { value: 'art', label: 'Art/Drawing' },
      { value: 'music', label: 'Music' },
      { value: 'social', label: 'Social Studies' },
    ]
  },
  gradeLevel: {
    label: 'Grade Level',
    icon: '🎓',
    options: [
      { value: 'preschool', label: 'Preschool (3-5)' },
      { value: 'elementary', label: 'Elementary (6-10)' },
      { value: 'middle', label: 'Middle School (11-14)' },
      { value: 'high', label: 'High School (15-18)' },
      { value: 'adult', label: 'Adult Learning' },
    ]
  }
}

// Helper function to build prompt from Easy Mode selections
export function buildPromptFromEasyMode(selections, optionsConfig) {
  const promptParts = []
  
  Object.entries(selections).forEach(([key, value]) => {
    if (value && optionsConfig[key]) {
      const option = optionsConfig[key].options.find(o => o.value === value)
      if (option?.prompt) {
        promptParts.push(option.prompt)
      }
    }
  })
  
  return promptParts.join(', ')
}

// Helper to get label for a selection
export function getSelectionLabel(key, value, optionsConfig) {
  if (!optionsConfig[key]) return value
  const option = optionsConfig[key].options.find(o => o.value === value)
  return option?.label || value
}
