// Quick Video Reels & Shorts - Niche Configuration
// Each niche has its own specialized prompt template for better content generation

export const QUICK_REELS_NICHES = [
  {
    id: 'mini-stories',
    name: 'Mini Stories',
    slug: 'mini-stories',
    description: 'Moral, emotional, twist endings, and folklore tales',
    tagline: 'Short stories with powerful messages',
    icon: '📖',
    color: 'from-purple-500 to-pink-500',
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a 20–40 second micro-story with a strong hook in the first sentence. Keep the plot simple: one character, one problem, one twist, one lesson. Use clear emotional pacing and avoid complex names. No real people. End with a short moral or message.

Story types to randomly choose from: moral stories, emotional stories, twist endings, folklore tales.`
  },
  {
    id: 'motivational',
    name: 'Motivational Reels',
    slug: 'motivational',
    description: 'Discipline, growth, and self-worth content',
    tagline: 'Inspire and empower your audience',
    icon: '💪',
    color: 'from-orange-500 to-red-500',
    cardBg: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a motivational script for a 10–25 second reel. Short sentences. Clear rhythm. Focus on discipline, growth, self-worth, or resilience. Avoid referencing any copyrighted speeches or specific influencers. Keep the tone empowering and direct.`
  },
  {
    id: 'facts-explainer',
    name: 'Facts & Explainers',
    slug: 'facts-explainer',
    description: 'Educational facts and science explainers',
    tagline: 'Educate with fascinating facts',
    icon: '🧠',
    color: 'from-blue-500 to-cyan-500',
    cardBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate 5–7 short, verified facts about the topic the user chooses. Facts must be general knowledge or scientifically verified. Avoid speculation, conspiracies, or unproven claims. Keep each fact punchy, clear, and under 15 words.

For science/space topics: Create a 20–40 second explainer. Use simple metaphors. Avoid technical jargon unless necessary and explain it if used. Stick to scientifically accepted information. No speculation stated as fact. Keep pacing smooth and curious.`
  },
  {
    id: 'comedy',
    name: 'Comedy & Memes',
    slug: 'comedy',
    description: 'Localized humor and relatable content',
    tagline: 'Make them laugh and share',
    icon: '😂',
    color: 'from-yellow-500 to-amber-500',
    cardBg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a short, lighthearted script with relatable humor. No insults, sensitive topics, or real-person mockery. Keep the humor situational and friendly. Use everyday scenarios like school, home, or workplace. Keep it culturally appropriate and family-friendly.`
  },
  {
    id: 'kids-stories',
    name: 'Kids Stories',
    slug: 'kids-stories',
    description: 'Playful moral stories for children',
    tagline: 'Engaging tales for young minds',
    icon: '🦄',
    color: 'from-pink-500 to-rose-500',
    cardBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a playful, simple moral story for children. Use friendly animals or objects as characters. No fear, no violence, no sadness. Sentences should be very short and easy to follow. End with a clear moral. Keep language age-appropriate for 4-8 year olds.`
  },
  {
    id: 'kids-learning',
    name: 'Kids Learning',
    slug: 'kids-learning',
    description: 'ABC, 123, colors, and educational content',
    tagline: 'Fun learning for children',
    icon: '🎨',
    color: 'from-green-500 to-emerald-500',
    cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Produce a cheerful, upbeat script teaching a simple concept to kids such as colors, numbers, shapes, or alphabet. Repetition is encouraged. Use clear instructions and positive reinforcement. Avoid long sentences. Make it engaging and interactive.`
  },
  {
    id: 'business-promo',
    name: 'Business Promos',
    slug: 'business-promo',
    description: 'Marketing and promotional content',
    tagline: 'Grow your brand effectively',
    icon: '💼',
    color: 'from-indigo-500 to-purple-500',
    cardBg: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30',
    promptTemplate: `You are a professional promotional script writer. Create ONLY the voiceover narration script - no scene directions, no visual descriptions, no labels like "VOICEOVER:".

Write a promotional script for a business, product, or service. 

CRITICAL RULES:
- Write ONLY what the voice will say - pure narration text
- No brackets, no labels, no scene descriptions
- No "[SCENE START]" or "(Visual:" or "**(Audio:" - just the spoken words
- Language: Use the language specified by the user
- Tone: Friendly, confident, clear, trustworthy
- No exaggerated claims or unrealistic promises
- Structure: Hook (first 3 seconds) → Key Benefit → Unique Value → Call-to-action
- Keep sentences short and punchy
- Focus on emotional connection and customer benefits
- Make it conversational and natural for voice narration

Output format: Plain text only - exactly what the narrator will speak.`
  },
  {
    id: 'horror',
    name: 'Horror Stories',
    slug: 'horror',
    description: 'Atmospheric creepy micro-stories',
    tagline: 'Spine-chilling short tales',
    icon: '👻',
    color: 'from-gray-700 to-gray-900',
    cardBg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Create a 25–40 second horror story with atmospheric tension and a clean buildup. No gore, no graphic violence, no real locations, no real individuals. Use sensory details to imply fear instead of describing explicit harm. End with an eerie unresolved twist.`
  },
  {
    id: 'relationship',
    name: 'Relationship Advice',
    slug: 'relationship',
    description: 'Emotional guidance and communication tips',
    tagline: 'Navigate relationships wisely',
    icon: '❤️',
    color: 'from-red-500 to-pink-500',
    cardBg: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Create a 20–35 second relationship guidance script. Empathetic tone. No blaming. Focus on communication, emotional maturity, or self-respect. Avoid gender stereotypes or real-person references. Keep it universally relatable and constructive.`
  },
  {
    id: 'documentary',
    name: 'Documentary Style',
    slug: 'documentary',
    description: 'Historical and factual mini-documentaries',
    tagline: 'Explore history and facts',
    icon: '🎬',
    color: 'from-teal-500 to-cyan-500',
    cardBg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a short historical mini-documentary. Use factual events only. No fictionalized details. Summaries should be chronological, clear, and neutral. Avoid political bias. If an event is uncertain, state that scholars disagree. Keep tone educational and engaging.`
  },
  {
    id: 'festival',
    name: 'Festival Themed',
    slug: 'festival',
    description: 'Celebration and festive content',
    tagline: 'Celebrate moments together',
    icon: '🎉',
    color: 'from-fuchsia-500 to-purple-500',
    cardBg: 'bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a festive celebration script. Keep it culturally inclusive, joyful, and appropriate for all ages. Focus on universal themes of celebration, togetherness, and joy. Avoid religious specifics unless requested. Keep tone warm and inviting.`
  },
  {
    id: 'generic',
    name: 'Custom Creation',
    slug: 'generic',
    description: 'Create videos on any topic you choose',
    tagline: 'Your vision, your video',
    icon: '✨',
    color: 'from-violet-500 to-purple-500',
    cardBg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    promptTemplate: `You are the internal generator. Produce a short script in simple, emotional, high-retention language. Avoid copyrighted characters, real celebrities, and real events unless they are historical facts. Keep sentences tight. Add natural suspense, rhythm, and hooks.

Generate a script based on the user's specific topic or theme. Adapt your tone and style to match the requested content type. Keep it engaging, clear, and appropriate for short-form video. Focus on strong hooks and satisfying endings.`
  }
]

// Helper function to get niche by slug
export function getNicheBySlug(slug) {
  return QUICK_REELS_NICHES.find(niche => niche.slug === slug)
}

// Helper function to get niche by ID
export function getNicheById(id) {
  return QUICK_REELS_NICHES.find(niche => niche.id === id)
}

// Helper function to get all niche slugs (for dynamic routing)
export function getAllNicheSlugs() {
  return QUICK_REELS_NICHES.map(niche => niche.slug)
}
