// AI Video Studio - Template Gallery Configuration
// Each template is a pre-configured use case with system prompts, default settings, and UI hints

// Icon name mapping for Lucide React icons
export const TEMPLATE_ICON_MAP = {
  'popular': 'Flame',
  'social-content': 'Smartphone',
  'explainers': 'FileText',
  'storytelling': 'Drama',
  'business': 'Briefcase',
  'personal': 'Gift'
}

export const TEMPLATE_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: 'Flame',
    description: 'Most used templates'
  },
  {
    id: 'social-content',
    name: 'Social Content',
    icon: 'Smartphone',
    description: 'Reels, Stories & Viral Content'
  },
  {
    id: 'explainers',
    name: 'Explainers & Facts',
    icon: 'FileText',
    description: 'Educational & News Content'
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    icon: 'Clapperboard',
    description: 'Drama, Horror & Fiction'
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'Briefcase',
    description: 'Ads, Reviews & Promotions'
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: 'Gift',
    description: 'Celebrations & Tributes'
  }
]

export const AI_VIDEO_TEMPLATES = [
  // ==================== POPULAR ====================
  {
    id: 'auto-story-reels',
    name: 'Auto Short-Story Reels',
    shortName: 'Story Reels',
    description: 'Write → Animate → Post. Convert simple ideas into ready videos with narration, scenes, and pacing.',
    icon: 'BookOpen',
    category: 'social-content',
    isPopular: true,
    isNew: false,
    color: 'from-rose-500 to-rose-600',
    perfectFor: ['Storytelling channels', 'Relationship drama', 'Moral stories', 'Motivational content'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 30,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'story-script', // story-script, prompt, image, photos, url
    inputPlaceholder: 'Write your story idea... (e.g., "A poor boy finds a wallet with $10,000 and makes a life-changing decision...")',
    systemPrompt: `You are a master short-form storyteller. Create emotionally gripping micro-stories that captivate viewers.

## VIDEO STRUCTURE (for {duration} seconds)
1. **Hook (3 seconds)**: Start with an unexpected statement or shocking moment
2. **Setup (20%)**: Introduce one character with a relatable problem
3. **Rising Tension (40%)**: Build emotional stakes with visual scenes
4. **Twist/Climax (25%)**: Deliver an unexpected turn
5. **Resolution (15%)**: End with a powerful message

## VISUAL STYLE
- Cinematic lighting, dramatic shadows
- Character close-ups for emotion
- Smooth camera movements
- {format} format optimized

## OUTPUT
Generate a detailed scene-by-scene prompt for AI video generation, describing each visual moment.

User's story idea: {userInput}`
  },
  
  {
    id: 'small-business-promo',
    name: 'Small Business Promo Ads',
    shortName: 'Business Ads',
    description: 'Upload photos → Get a polished TikTok/Facebook ad. Perfect for restaurants, salons, freelancers.',
    icon: 'Briefcase',
    category: 'business',
    isPopular: true,
    isNew: false,
    color: 'from-blue-500 to-blue-600',
    perfectFor: ['Local ads', 'Product promotions', 'Real estate', 'Restaurants & cafes'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 15,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'image',
    inputPlaceholder: 'Upload your business/product photos and describe your business...',
    systemPrompt: `You are an expert at creating viral small business promotional videos.

## AD VIDEO STRUCTURE
1. **Hook (2 seconds)**: Eye-catching product reveal or dramatic entrance
2. **Showcase (60%)**: Dynamic product/service highlights with smooth motion
3. **Value Prop (25%)**: Key benefits visualized
4. **CTA (15%)**: Clear call to action with urgency

## VISUAL STYLE
- Professional lighting, clean backgrounds
- Smooth 360° rotations for products
- Dynamic zoom and reveal effects
- High contrast, vibrant colors
- {format} format for social media

## BUSINESS INFO
{userInput}

Generate a compelling promotional video prompt with specific visual directions.`
  },
  
  {
    id: 'cinematic-script',
    name: 'Script → Cinematic Video',
    shortName: 'Cinematic',
    description: '4-6 lines are enough. Produce dramatic, cinematic reels that feel expensive.',
    icon: 'Clapperboard',
    category: 'storytelling',
    isPopular: true,
    isNew: false,
    color: 'from-amber-500 to-amber-600',
    perfectFor: ['Short films', 'Emotional reels', 'Sci-fi/fantasy', 'Premium content'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 30,
      format: 'landscape',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'script',
    inputPlaceholder: 'Enter your short script (4-6 lines)...\n\nExample:\n"The last human stood alone.\nStaring at the red sky.\nRemembering what we lost.\nAnd what we might become."',
    systemPrompt: `You are a cinematic director creating visually stunning short videos.

## CINEMATIC RULES
- Every frame should be poster-worthy
- Use dramatic lighting: golden hour, neon, silhouettes
- Slow motion for emotional impact
- Wide establishing shots → intimate close-ups
- Depth of field, lens flares, atmospheric haze

## VISUAL BREAKDOWN
Convert this script into scene-by-scene cinematic directions:
- Camera angle (low angle, aerial, tracking)
- Lighting mood (warm, cold, dramatic)
- Movement (dolly, crane, steadicam)
- Atmosphere (fog, particles, rain)

## SCRIPT
{userInput}

Generate detailed cinematic video prompt.`
  },
  
  {
    id: 'motivation-broll',
    name: 'Motivation + B-Roll Video',
    shortName: 'Motivation',
    description: 'Type a quote → AI builds a professional motivational montage.',
    icon: 'TrendingUp',
    category: 'social-content',
    isPopular: true,
    isNew: false,
    color: 'from-orange-500 to-orange-600',
    perfectFor: ['Gym influencers', 'Life coaches', 'Productivity pages', 'Quote pages'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 15,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'quote',
    inputPlaceholder: 'Enter your motivational quote or message...\n\nExample: "Success is not final, failure is not fatal. It\'s the courage to continue that counts."',
    systemPrompt: `You are creating a viral motivational video with powerful B-roll.

## VIDEO STRUCTURE
1. **Hook Visual (2 sec)**: Dramatic establishing shot
2. **Build Up (40%)**: Inspiring imagery matching the message
3. **Peak Moment (40%)**: Most powerful visuals
4. **Resolution (20%)**: Uplifting conclusion

## B-ROLL STYLE
- Success imagery: sunrise, mountain peaks, athletes
- Struggle imagery: rain, challenges, determination
- Achievement imagery: celebrations, breakthroughs
- Smooth transitions, cinematic color grading

## QUOTE/MESSAGE
{userInput}

Generate motivational video prompt with specific B-roll scenes.`
  },
  
  // ==================== SOCIAL CONTENT ====================
  {
    id: 'slideshow-reel',
    name: 'Slideshow-to-Reel Converter',
    shortName: 'Photo Reels',
    description: 'Upload 10 photos → Transform into an aesthetic trending reel with music and effects.',
    icon: 'Camera',
    category: 'social-content',
    isPopular: false,
    isNew: true,
    color: 'from-pink-500 to-pink-600',
    perfectFor: ['Travel pages', 'Photography', 'Birthday reels', 'Romantic content'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 30,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'photos',
    inputPlaceholder: 'Upload your photos (up to 10) and describe the vibe you want...',
    systemPrompt: `Create a trendy photo slideshow reel.

## STYLE
- Ken Burns effects (zoom, pan)
- Smooth transitions synced to music
- Color grading for cohesive look
- Beat-matched cuts

## VIBE: {userInput}

Generate photo animation directions.`
  },
  
  {
    id: 'meme-generator',
    name: 'Instant Meme Video Generator',
    shortName: 'Meme Videos',
    description: 'Upload a face → It becomes the character in a trending meme clip. Fast humor, no editing.',
    icon: 'Smile',
    category: 'social-content',
    isPopular: false,
    isNew: true,
    color: 'from-yellow-500 to-amber-500',
    perfectFor: ['Meme pages', 'TikTok roasts', 'Birthday jokes', 'Office humor'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 10,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'image',
    inputPlaceholder: 'Upload a face photo and describe the meme scenario...\n\nExample: "Monday morning vs Friday afternoon", "Me explaining my genius idea to my cat"',
    systemPrompt: `Create a viral meme video.

## MEME STYLE
- Exaggerated expressions and movements
- Comedic timing with pauses
- Text overlays for punchlines
- Trending meme formats

## MEME CONCEPT: {userInput}

Generate funny meme video prompt.`
  },
  
  // ==================== EXPLAINERS & FACTS ====================
  {
    id: 'local-language-explainer',
    name: 'Local Language Explainer',
    shortName: 'Explainers',
    description: 'Type one idea → AI generates visuals + voiceover + captions in Bengali, Hindi, Filipino, etc.',
    icon: 'Globe',
    category: 'explainers',
    isPopular: true,
    isNew: false,
    color: 'from-green-500 to-emerald-500',
    perfectFor: ['News explainers', 'Trending breakdowns', 'Facts channels', 'Regional creators'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 45,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true,
      language: 'bn' // Default to Bengali
    },
    inputType: 'topic',
    inputPlaceholder: 'Enter the topic you want to explain...\n\nExample: "Why is the sky blue?", "How does WiFi work?", "The history of Bangladesh"',
    systemPrompt: `Create an educational explainer video in local language style.

## STRUCTURE
1. **Hook Question (3 sec)**: Intriguing question to start
2. **Visual Explanation (70%)**: Simple visuals for complex ideas
3. **Key Takeaways (20%)**: Memorable summary points
4. **Engagement CTA (10%)**: "Follow for more"

## VISUAL STYLE
- Clean infographic style
- Animated diagrams
- Text callouts for key terms
- Bright, engaging colors

## TOPIC: {userInput}
## LANGUAGE: {language}

Generate explainer video prompt with visual directions.`
  },
  
  {
    id: 'music-facts',
    name: 'Music + Fact Video Generator',
    shortName: 'Beat Facts',
    description: 'The "facts with music beat" trend. Facts synced to trending audio.',
    icon: 'Music',
    category: 'explainers',
    isPopular: false,
    isNew: true,
    color: 'from-violet-500 to-purple-500',
    perfectFor: ['TikTok facts', 'History facts', 'Celebrity facts', 'Top 5/10 content'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 30,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'facts',
    inputPlaceholder: 'Enter 5-7 facts (one per line)...\n\nExample:\n1. Honey never spoils\n2. Octopuses have 3 hearts\n3. A day on Venus is longer than its year',
    systemPrompt: `Create a beat-synced facts video.

## STYLE
- Each fact = 1 visual beat
- Text appears on beat drops
- Dynamic transitions synced to music
- Bold typography, high contrast

## FACTS:
{userInput}

Generate beat-synced fact video prompt.`
  },
  
  {
    id: 'educational-micro',
    name: 'AI Educational Micro-Lecture',
    shortName: 'Micro-Lecture',
    description: 'Type a topic → Get a TED-style 20-second video with visuals.',
    icon: 'GraduationCap',
    category: 'explainers',
    isPopular: false,
    isNew: false,
    color: 'from-blue-500 to-indigo-500',
    perfectFor: ['Science explainers', 'School channels', 'Teacher creators', 'Learning pages'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 20,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: false
    },
    inputType: 'topic',
    inputPlaceholder: 'Enter a topic to explain...\n\nExample: "How does photosynthesis work?", "What causes earthquakes?"',
    systemPrompt: `Create a TED-style micro-lecture video.

## STRUCTURE
- Hook with surprising fact
- Clear visual explanation
- One key insight to remember
- Professional, authoritative tone

## TOPIC: {userInput}

Generate educational micro-lecture prompt.`
  },
  
  // ==================== STORYTELLING ====================
  {
    id: 'animated-chat-story',
    name: 'Animated Chat Story Generator',
    shortName: 'Chat Stories',
    description: 'Type a conversation → AI converts it into an animated messenger story.',
    icon: 'MessageSquare',
    category: 'storytelling',
    isPopular: false,
    isNew: true,
    color: 'from-green-500 to-teal-500',
    perfectFor: ['Gossip channels', 'Relationship drama', 'Gen-Z storytelling', 'Text horror'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 45,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'chat',
    inputPlaceholder: 'Enter your chat conversation...\n\nFormat:\nPerson A: Message\nPerson B: Reply\n\nExample:\nMom: Where are you?\nMe: Almost home\nMom: I can see your location 👀\nMe: ...',
    systemPrompt: `Create an animated chat story video.

## STYLE
- Phone screen interface
- Typing indicators
- Read receipts
- Message bubbles appearing
- Dramatic pauses for tension
- Sound effects for messages

## CHAT:
{userInput}

Generate chat story video prompt.`
  },
  
  {
    id: 'true-crime',
    name: 'True Crime Micro-Story',
    shortName: 'True Crime',
    description: 'Paste a case → AI produces dark cinematic scenes + narration.',
    icon: 'Search',
    category: 'storytelling',
    isPopular: false,
    isNew: false,
    color: 'from-gray-700 to-gray-900',
    perfectFor: ['Horror & mystery', 'True crime pages', 'Paranormal channels'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 60,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'story-script',
    inputPlaceholder: 'Describe the true crime case or mystery...',
    systemPrompt: `Create a true crime micro-documentary.

## STYLE
- Dark, moody cinematography
- Noir lighting
- Suspenseful pacing
- Documentary-style narration
- Evidence board visuals
- Atmospheric tension

## CASE: {userInput}

Generate true crime video prompt.`
  },
  
  {
    id: 'folklore-animation',
    name: 'Folklore & Mythology Animation',
    shortName: 'Folklore',
    description: 'Input a myth/legend → AI animates it with cultural visuals.',
    icon: 'Sparkles',
    category: 'storytelling',
    isPopular: false,
    isNew: false,
    color: 'from-amber-600 to-red-600',
    perfectFor: ['Ghost stories', 'Deshi myths', 'African/Indian tales', 'Horror channels'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 45,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'story-script',
    inputPlaceholder: 'Describe the folklore, myth, or legend...\n\nExample: "The story of Shakchunni, the Bengali ghost bride..."',
    systemPrompt: `Create a folklore/mythology animation.

## STYLE
- Traditional art influences
- Mystical lighting
- Cultural authenticity
- Dramatic supernatural elements
- Rich color palettes

## FOLKLORE: {userInput}

Generate folklore animation prompt.`
  },
  
  // ==================== BUSINESS ====================
  {
    id: 'product-review',
    name: 'Product Review Video',
    shortName: 'Reviews',
    description: 'Paste Amazon/product link → AI creates a review video with visuals + voice.',
    icon: 'ShoppingCart',
    category: 'business',
    isPopular: true,
    isNew: false,
    color: 'from-orange-500 to-amber-500',
    perfectFor: ['Affiliate marketers', 'Product reviewers', 'E-commerce influencers'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 30,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: true
    },
    inputType: 'url',
    inputPlaceholder: 'Paste the product URL (Amazon, eBay, etc.)...',
    systemPrompt: `Create a product review video.

## STRUCTURE
1. Hook: "Is this worth it?"
2. Product showcase with features
3. Pros and cons
4. Value assessment
5. Verdict + CTA

## PRODUCT: {userInput}

Generate product review video prompt.`
  },
  
  {
    id: 'ai-avatar',
    name: 'AI Avatar Presenter',
    shortName: 'Avatar',
    description: 'Pick an avatar → Paste script → Ready to publish. Perfect for faceless channels.',
    icon: 'Bot',
    category: 'business',
    isPopular: false,
    isNew: true,
    color: 'from-indigo-500 to-purple-500',
    perfectFor: ['Faceless channels', 'Teachers', 'Marketers', 'Daily reels creators'],
    defaultSettings: {
      mode: 'text-to-video',
      duration: 30,
      format: 'portrait',
      voiceEnabled: true,
      musicEnabled: false
    },
    inputType: 'script',
    inputPlaceholder: 'Enter the script for your AI avatar to speak...',
    systemPrompt: `Create an AI avatar presenter video.

## STYLE
- Professional avatar appearance
- Natural gestures
- Eye contact with camera
- Clean background
- Teleprompter-style delivery

## SCRIPT: {userInput}

Generate avatar presenter prompt.`
  },
  
  // ==================== PERSONAL ====================
  {
    id: 'tribute-video',
    name: 'Personal Tribute Video',
    shortName: 'Tributes',
    description: 'Upload photos → AI makes a birthday, wedding, romance, or memorial reel.',
    icon: 'Heart',
    category: 'personal',
    isPopular: true,
    isNew: false,
    color: 'from-pink-500 to-red-500',
    perfectFor: ['Anniversaries', 'Proposal videos', 'Birthday reels', 'Memorial videos'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 45,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'photos',
    inputPlaceholder: 'Upload photos and describe the occasion...\n\nExample: "25th wedding anniversary for my parents - romantic and emotional"',
    systemPrompt: `Create a heartfelt tribute video.

## STYLE
- Emotional pacing
- Gentle transitions
- Romantic/nostalgic color grading
- Memory-style effects
- Music-synced moments

## OCCASION: {userInput}

Generate tribute video prompt.`
  },
  
  {
    id: 'influencer-generator',
    name: 'Headshot-to-Influencer Video',
    shortName: 'Influencer',
    description: 'Upload a selfie → AI creates a lifestyle reel. Perfect for personal branding.',
    icon: 'Star',
    category: 'personal',
    isPopular: false,
    isNew: true,
    color: 'from-fuchsia-500 to-pink-500',
    perfectFor: ['Instagram influencers', 'Models', 'Fitness creators', 'Personal brands'],
    defaultSettings: {
      mode: 'image-to-video',
      duration: 15,
      format: 'portrait',
      voiceEnabled: false,
      musicEnabled: true
    },
    inputType: 'image',
    inputPlaceholder: 'Upload your best selfie/headshot and describe the vibe...\n\nExample: "Luxury lifestyle, confident energy, beach sunset vibes"',
    systemPrompt: `Create an influencer-style personal video.

## STYLE
- Glamorous lighting
- Confident poses and movement
- Lifestyle B-roll integration
- Trendy effects and transitions
- Premium aesthetic

## VIBE: {userInput}

Generate influencer video prompt.`
  }
]

// Helper functions
export function getTemplateById(id) {
  return AI_VIDEO_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(categoryId) {
  if (categoryId === 'popular') {
    return AI_VIDEO_TEMPLATES.filter(t => t.isPopular)
  }
  return AI_VIDEO_TEMPLATES.filter(t => t.category === categoryId)
}

export function getPopularTemplates() {
  return AI_VIDEO_TEMPLATES.filter(t => t.isPopular)
}

export function getNewTemplates() {
  return AI_VIDEO_TEMPLATES.filter(t => t.isNew)
}

export function searchTemplates(query) {
  const q = query.toLowerCase()
  return AI_VIDEO_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.perfectFor.some(p => p.toLowerCase().includes(q))
  )
}
