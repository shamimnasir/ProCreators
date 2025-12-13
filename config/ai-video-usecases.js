// AI Video Studio - Use Cases Configuration
// Each use case has a system prompt to optimize video generation for specific purposes

export const AI_VIDEO_USECASES = [
  {
    id: 'make-anything',
    name: 'Make Anything',
    description: 'Full creative control - generate any video you imagine',
    icon: '✨',
    color: 'from-violet-500 to-purple-500',
    cardBg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    isDefault: true,
    promptTemplate: `You are an AI video generation prompt optimizer. Your task is to enhance user prompts for maximum visual impact.

## ENHANCEMENT RULES
1. Keep the core intent of the user's request
2. Add cinematic details: lighting, camera movement, atmosphere
3. Specify visual style: realistic, artistic, dramatic
4. Include motion descriptions: smooth, dynamic, flowing
5. Keep it concise but descriptive (max 150 words)

## OUTPUT FORMAT
Return ONLY the enhanced prompt, no explanations.

## USER'S ORIGINAL PROMPT
{userPrompt}

Enhance this prompt for AI video generation:`
  },
  {
    id: 'social-media-ads',
    name: 'Social Media Ads',
    description: 'Eye-catching ads optimized for Instagram, TikTok & YouTube',
    icon: '📱',
    color: 'from-pink-500 to-rose-500',
    cardBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    isDefault: false,
    promptTemplate: `You are an expert at creating viral social media ad prompts for AI video generation.

## AD VIDEO CHARACTERISTICS
1. **Hook in first 2 seconds** - dramatic reveal, unexpected element, or bold movement
2. **Product/Subject focus** - keep the main subject centered and prominent
3. **Dynamic motion** - zooms, rotations, reveals that grab attention
4. **High contrast & vibrant colors** - stand out in feeds
5. **Clean composition** - uncluttered, professional look

## MOTION STYLES FOR ADS
- Product reveals with dramatic lighting
- Smooth 360° rotations
- Zoom-in with particle effects
- Cinematic slow-motion moments
- Dynamic camera movements around subject

## OUTPUT FORMAT
Return ONLY the enhanced prompt optimized for social media ads. No explanations.

## USER'S ORIGINAL PROMPT
{userPrompt}

## ADDITIONAL CONTEXT
Platform: {platform}
Duration: {duration} seconds
Format: {format}

Create an attention-grabbing ad video prompt:`
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Professional product videos for e-commerce',
    icon: '🛍️',
    color: 'from-blue-500 to-cyan-500',
    cardBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
    isDefault: false,
    promptTemplate: `You are an expert at creating e-commerce product showcase video prompts.

## PRODUCT VIDEO CHARACTERISTICS
1. **Clean studio lighting** - soft shadows, professional look
2. **Smooth rotations** - 360° views, detail reveals
3. **Feature highlights** - zoom into key product features
4. **Lifestyle context** - show product in use when relevant
5. **Premium feel** - luxury lighting, reflections, textures

## OUTPUT FORMAT
Return ONLY the enhanced prompt for product video. No explanations.

## USER'S ORIGINAL PROMPT
{userPrompt}

Create a professional product showcase prompt:`
  },
  {
    id: 'cinematic-broll',
    name: 'Cinematic B-Roll',
    description: 'Professional footage for videos and presentations',
    icon: '🎬',
    color: 'from-amber-500 to-orange-500',
    cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    isDefault: false,
    promptTemplate: `You are an expert cinematographer creating b-roll video prompts.

## CINEMATIC CHARACTERISTICS
1. **Smooth camera movements** - dolly, crane, steadicam feel
2. **Cinematic lighting** - golden hour, dramatic shadows, lens flares
3. **Atmospheric depth** - bokeh, depth of field, atmosphere
4. **Professional composition** - rule of thirds, leading lines
5. **Film-like quality** - grain, color grading, anamorphic feel

## OUTPUT FORMAT
Return ONLY the enhanced cinematic prompt. No explanations.

## USER'S ORIGINAL PROMPT
{userPrompt}

Create a cinematic b-roll prompt:`
  }
]

// Helper function to get use case by ID
export function getUseCaseById(id) {
  return AI_VIDEO_USECASES.find(uc => uc.id === id) || AI_VIDEO_USECASES[0]
}

// Helper function to get default use case
export function getDefaultUseCase() {
  return AI_VIDEO_USECASES.find(uc => uc.isDefault) || AI_VIDEO_USECASES[0]
}

// Duration options with chaining strategy
export const DURATION_OPTIONS = [
  { 
    value: 5, 
    label: '5 seconds', 
    description: 'Quick clip - single generation',
    segments: 1,
    isDefault: true,
    tier: 'free'
  },
  { 
    value: 10, 
    label: '10 seconds', 
    description: 'Extended clip - 2 generations',
    segments: 2,
    isDefault: false,
    tier: 'free'
  },
  { 
    value: 30, 
    label: '30 seconds', 
    description: 'Short video - 6 generations',
    segments: 6,
    isDefault: false,
    tier: 'standard'
  },
  { 
    value: 45, 
    label: '45 seconds', 
    description: 'Medium video - 9 generations',
    segments: 9,
    isDefault: false,
    tier: 'standard'
  },
  { 
    value: 60, 
    label: '1 minute', 
    description: 'Full video - 12 generations',
    segments: 12,
    isDefault: false,
    tier: 'premium'
  },
  { 
    value: 120, 
    label: '2 minutes', 
    description: 'Long video - 24 generations',
    segments: 24,
    isDefault: false,
    tier: 'premium',
    isPremium: true
  }
]

// Format options
export const FORMAT_OPTIONS = [
  {
    value: 'portrait',
    label: 'Portrait (9:16)',
    description: 'Instagram Reels, TikTok, YouTube Shorts',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    icon: '📱'
  },
  {
    value: 'landscape',
    label: 'Landscape (16:9)',
    description: 'YouTube, Presentations, Long-form',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    icon: '🖥️'
  }
]
