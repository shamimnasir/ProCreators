// Shared utility for removing AI-sounding words from content
// Use this hook in all content generation tools to make output sound more human

/**
 * Clean markdown formatting from text (remove asterisks, headers, etc.)
 * @param {string} text - Text to clean
 * @returns {string} - Clean text without markdown
 */
export function cleanMarkdown(text) {
  if (!text || typeof text !== 'string') return text
  
  let cleaned = text
  
  // Remove ** bold markers (handle **text:** pattern and normal **text**)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*\*([^*]*)/g, '$1')
  cleaned = cleaned.replace(/([^*]*)\*\*/g, '$1')
  
  // Remove ALL remaining asterisks (single and double)
  cleaned = cleaned.replace(/\*+/g, '')
  
  // Remove markdown headers (# ## ###)
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '')
  
  // Remove markdown italic underscores (_text_)
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1')
  
  // Remove backticks for code
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  cleaned = cleaned.replace(/`/g, '')
  
  // Remove triple backticks code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  
  // Clean double spaces
  cleaned = cleaned.replace(/  +/g, ' ')
  
  return cleaned.trim()
}

// List of overused AI-sounding words/phrases and their natural replacements

// List of overused AI-sounding words/phrases and their natural replacements
export const AI_WORD_REPLACEMENTS = {
  // Hype words
  'unlock': 'discover',
  'unleash': 'release',
  'unveil': 'show',
  'uncover': 'find',
  'revolutionize': 'change',
  'revolutionary': 'significant',
  'game-changer': 'big deal',
  'game-changing': 'important',
  'cutting-edge': 'new',
  'groundbreaking': 'new',
  'supercharge': 'boost',
  'turbocharge': 'speed up',
  'skyrocket': 'increase',
  'seamless': 'smooth',
  'seamlessly': 'smoothly',
  
  // Corporate buzzwords
  'harness': 'use',
  'leverage': 'use',
  'elevate': 'improve',
  'empower': 'help',
  'transform': 'change',
  'transformative': 'changing',
  'dive into': 'look at',
  'dive deep': 'examine',
  'deep dive': 'detailed look',
  'delve': 'explore',
  'delve into': 'look into',
  'journey': 'experience',
  'robust': 'strong',
  'scalable': 'flexible',
  'synergy': 'teamwork',
  'synergistic': 'combined',
  'paradigm shift': 'big change',
  'paradigm': 'model',
  'disrupt': 'change',
  'disruptive': 'changing',
  'holistic': 'complete',
  'streamline': 'simplify',
  'maximize': 'increase',
  'maximize potential': 'do your best',
  'take it to the next level': 'improve',
  'next level': 'better',
  
  // Overused adjectives
  'innovative': 'creative',
  'innovation': 'new idea',
  'world-class': 'excellent',
  'state-of-the-art': 'modern',
  'next-generation': 'latest',
  'best-in-class': 'top',
  'comprehensive': 'complete',
  'landscape': 'field',
  'navigate': 'handle',
  'realm': 'area',
  'realm of': 'area of',
  'foster': 'encourage',
  'facilitate': 'help',
  
  // MORE AI-sounding words from the screenshot
  'buckle up': '',
  'voice enthusiasts': 'everyone',
  'ever dreamt of': 'want to',
  'the future is now': 'it\'s possible now',
  'surprisingly affordable': 'affordable',
  'fascinating world': 'world',
  'without breaking the bank': 'for free',
  'top-tier': 'great',
  'primarily geared toward': 'made for',
  'exceptionally realistic': 'realistic',
  'fine-grained control': 'control',
  'perfect for': 'good for',
  'paramount': 'important',
  'the catch': 'downside',
  'generous free trial': 'free trial',
  'voice double': 'voice clone',
  'countdown': 'list',
  'let you explore': 'help you try',
  'synthetic voices': 'AI voices',
  
  // AI-specific phrases
  'in conclusion': '',
  'in summary': '',
  'to summarize': '',
  'it is important to note': '',
  'it should be noted': '',
  'it is worth mentioning': '',
  'as mentioned earlier': '',
  'as we have seen': '',
  'this begs the question': 'this raises the question',
  'at the end of the day': 'ultimately',
  'moving forward': 'next',
  'going forward': 'from now on',
  'in today\'s world': 'today',
  'in this day and age': 'now',
  'first and foremost': 'first',
  'last but not least': 'finally',
  'each and every': 'every',
  'in order to': 'to',
  'due to the fact that': 'because',
  'in light of': 'because of',
  'in terms of': 'about',
  'with regard to': 'about',
  'in the event that': 'if',
  'at this point in time': 'now',
  'for the purpose of': 'for',
  'on the other hand': 'however',
  
  // Fluff phrases to remove
  'it goes without saying': '',
  'needless to say': '',
  'without a doubt': '',
  'beyond a shadow of a doubt': '',
  'absolutely essential': 'essential',
  'completely unique': 'unique',
  'very unique': 'unique',
  'totally transformed': 'changed',
  'truly remarkable': 'remarkable',
  'incredibly important': 'important',
  'extremely crucial': 'crucial',
  
  // More corporate speak
  'alright': '',
  'here\'s a countdown': 'here are',
  'let me': '',
  'allow me to': '',
  'i\'d like to': '',
}

// Words to completely remove (filler words that add nothing)
export const AI_WORDS_TO_REMOVE = [
  'basically',
  'essentially',
  'literally',
  'actually',
  'definitely',
  'certainly',
  'obviously',
  'clearly',
  'simply put',
  'in essence',
  'in fact',
  'as a matter of fact',
  'truth be told',
  'to be honest',
  'to be fair',
  'all things considered',
  'when all is said and done',
]

/**
 * Remove AI-sounding words from text and replace with natural alternatives
 * @param {string} text - The text to humanize
 * @param {object} options - Options for humanization
 * @returns {string} - Humanized text
 */
export function humanizeText(text, options = {}) {
  if (!text || typeof text !== 'string') return text
  
  let result = text
  
  // Replace AI words with natural alternatives (case-insensitive)
  Object.entries(AI_WORD_REPLACEMENTS).forEach(([aiWord, replacement]) => {
    // Create case-insensitive regex with word boundaries
    const regex = new RegExp(`\\b${escapeRegex(aiWord)}\\b`, 'gi')
    result = result.replace(regex, (match) => {
      // Preserve original casing
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1)
      }
      return replacement
    })
  })
  
  // Remove filler words/phrases (only if they don't break the sentence)
  if (options.removeFiller !== false) {
    AI_WORDS_TO_REMOVE.forEach(word => {
      // Match with surrounding punctuation/spaces
      const regex = new RegExp(`\\b${escapeRegex(word)}[,]?\\s*`, 'gi')
      result = result.replace(regex, '')
    })
  }
  
  // Clean up multiple spaces and punctuation
  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
  
  return result
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get a list of AI words found in text (for analysis)
 * @param {string} text - Text to analyze
 * @returns {string[]} - List of AI words found
 */
export function detectAIWords(text) {
  if (!text || typeof text !== 'string') return []
  
  const foundWords = []
  const textLower = text.toLowerCase()
  
  Object.keys(AI_WORD_REPLACEMENTS).forEach(word => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
    if (regex.test(textLower)) {
      foundWords.push(word)
    }
  })
  
  return foundWords
}

/**
 * Calculate AI detection score (0-100, lower is more human)
 * @param {string} text - Text to analyze
 * @returns {number} - Score from 0-100
 */
export function calculateAIScore(text) {
  if (!text || typeof text !== 'string') return 0
  
  const words = text.split(/\s+/).length
  const aiWords = detectAIWords(text)
  const aiWordCount = aiWords.length
  
  // Score based on AI word density
  const density = (aiWordCount / words) * 100
  
  // Cap at 100
  return Math.min(Math.round(density * 10), 100)
}

export default {
  humanizeText,
  detectAIWords,
  calculateAIScore,
  AI_WORD_REPLACEMENTS,
  AI_WORDS_TO_REMOVE
}
