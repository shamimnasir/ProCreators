// User-Friendly Names for Technical Terms
// Hide brand names and technical jargon from novice users

// AI Video Generation Models - Simplified
export const AI_MODEL_FRIENDLY_NAMES = {
  // Fal.ai models
  'fal-ai/pixverse/v5.5/text-to-video': { name: 'Quick Creator', tier: 'fast', icon: '⚡', description: 'Fast generation' },
  'fal-ai/longcat-video/distilled/text-to-video/720p': { name: 'Standard', tier: 'standard', icon: '🎥', description: 'Balanced quality' },
  'fal-ai/wan/v2.2-a14b/text-to-video': { name: 'Pro Quality', tier: 'premium', icon: '⭐', description: 'High quality' },
  'fal-ai/hunyuan-video-v1.5/text-to-video': { name: 'Pro Quality', tier: 'premium', icon: '⭐', description: 'High quality' },
  'fal-ai/sana-video': { name: 'Creative', tier: 'standard', icon: '🎨', description: 'Artistic style' },
  'fal-ai/kling-video/v2.5-turbo/pro/text-to-video': { name: 'Cinema', tier: 'ultra', icon: '🎬', description: 'Cinema quality' },
  'fal-ai/kling-video/v2.6/pro/text-to-video': { name: 'Cinema Pro', tier: 'ultra', icon: '🎬', description: 'Best quality' },
  'fal-ai/veo3.1/fast': { name: 'Ultra HD', tier: 'ultra', icon: '💎', description: 'Highest fidelity' },
  
  // Image to video models
  'fal-ai/pixverse/v4/image-to-video': { name: 'Quick Animate', tier: 'fast', icon: '⚡', description: 'Fast animation' },
  'fal-ai/stable-video': { name: 'Smooth Animate', tier: 'standard', icon: '🎥', description: 'Smooth motion' },
  'fal-ai/kling-video/v1.5/pro/image-to-video': { name: 'Pro Animate', tier: 'premium', icon: '⭐', description: 'Pro animation' },
  'fal-ai/veo3/image-to-video': { name: 'Ultra Animate', tier: 'ultra', icon: '💎', description: 'Best animation' },
  
  // Replicate fallback
  'replicate': { name: 'Backup Engine', tier: 'fallback', icon: '🔄', description: 'Alternative engine' }
}

// Quality Tiers for Display
export const QUALITY_TIERS = {
  fast: { label: 'Quick', color: 'bg-green-500', textColor: 'text-green-600', description: 'Fastest generation' },
  standard: { label: 'Standard', color: 'bg-blue-500', textColor: 'text-blue-600', description: 'Good balance' },
  premium: { label: 'Premium', color: 'bg-purple-500', textColor: 'text-purple-600', description: 'High quality' },
  ultra: { label: 'Ultra', color: 'bg-amber-500', textColor: 'text-amber-600', description: 'Best quality' },
  fallback: { label: 'Backup', color: 'bg-gray-500', textColor: 'text-gray-600', description: 'Fallback option' }
}

// Voice/TTS Provider Names
export const TTS_FRIENDLY_NAMES = {
  'google-cloud-tts': 'AI Voice',
  'elevenlabs': 'Premium Voice',
  'default': 'AI Voice'
}

// Video Source Names
export const VIDEO_SOURCE_NAMES = {
  'ai': { name: 'AI-Generated', icon: '🤖', description: '100% AI-created video' },
  'hybrid': { name: 'AI + Stock Mix', icon: '✨', description: 'AI scenes + HD stock footage' },
  'stock': { name: 'Stock Video', icon: '📹', description: 'Professional stock footage' }
}

// Processing Step Names (for progress messages)
export const PROCESSING_STEP_NAMES = {
  'generating-tts': '🎙️ Creating voiceover...',
  'generating-ai-video': '🎨 Creating video scenes...',
  'searching-stock': '🔍 Finding best footage...',
  'downloading-clips': '📥 Preparing clips...',
  'normalizing-clips': '🔧 Optimizing quality...',
  'concatenating': '🎬 Assembling video...',
  'merging-audio': '🔊 Adding voiceover...',
  'burning-captions': '📝 Adding captions...',
  'saving': '💾 Saving to library...',
  'complete': '✅ Complete!'
}

// Helper function to get friendly model name
export function getFriendlyModelName(endpoint) {
  return AI_MODEL_FRIENDLY_NAMES[endpoint]?.name || 'AI Engine'
}

// Helper function to get model tier
export function getModelTier(endpoint) {
  const tier = AI_MODEL_FRIENDLY_NAMES[endpoint]?.tier || 'standard'
  return QUALITY_TIERS[tier]
}

// Helper function to get progress message
export function getProgressMessage(step, elapsedTime) {
  const msg = PROCESSING_STEP_NAMES[step] || 'Processing...'
  if (elapsedTime) {
    const timeStr = elapsedTime > 60 ? `${Math.floor(elapsedTime/60)}m ${elapsedTime%60}s` : `${elapsedTime}s`
    return `${msg} (${timeStr})`
  }
  return msg
}
