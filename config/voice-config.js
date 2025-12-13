// Voice Configuration - User-friendly voice names and metadata
// Maps Google Cloud TTS voice codes to human-readable names

// Voice gender detection from ssmlGender or name patterns
export function getVoiceGender(voice) {
  // If Google provides ssmlGender
  if (voice.ssmlGender) {
    if (voice.ssmlGender === 'MALE') return 'Male'
    if (voice.ssmlGender === 'FEMALE') return 'Female'
    if (voice.ssmlGender === 'NEUTRAL') return 'Neutral'
  }
  
  // Fallback: detect from voice name patterns
  const name = voice.name?.toLowerCase() || ''
  
  // Common male voice indicators
  const malePatterns = ['-D', '-B', '-J', '-A-Male', 'male', '-Liam', '-James', '-Benjamin', '-Marcus']
  const femalePatterns = ['-C', '-E', '-F', '-H', '-A-Female', 'female', '-Emma', '-Olivia', '-Sophia', '-Luna']
  
  for (const pattern of malePatterns) {
    if (name.includes(pattern.toLowerCase())) return 'Male'
  }
  for (const pattern of femalePatterns) {
    if (name.includes(pattern.toLowerCase())) return 'Female'
  }
  
  return 'Neutral'
}

// Voice type detection (Neural, Wavenet, Standard, etc.)
export function getVoiceType(voiceName) {
  const name = voiceName?.toUpperCase() || ''
  
  if (name.includes('CHIRP3-HD')) return { type: 'HD', label: 'Ultra HD', tier: 'premium', icon: '💎' }
  if (name.includes('CHIRP3')) return { type: 'Chirp', label: 'Premium', tier: 'premium', icon: '⭐' }
  if (name.includes('NEURAL2')) return { type: 'Neural', label: 'Natural', tier: 'standard', icon: '🎙️' }
  if (name.includes('WAVENET')) return { type: 'WaveNet', label: 'Smooth', tier: 'standard', icon: '🌊' }
  if (name.includes('STANDARD')) return { type: 'Standard', label: 'Basic', tier: 'basic', icon: '📢' }
  if (name.includes('STUDIO')) return { type: 'Studio', label: 'Studio', tier: 'premium', icon: '🎬' }
  if (name.includes('POLYGLOT')) return { type: 'Polyglot', label: 'Multi-lingual', tier: 'standard', icon: '🌍' }
  
  return { type: 'Standard', label: 'Standard', tier: 'basic', icon: '🔊' }
}

// Extract a friendly display name from voice code
export function getFriendlyVoiceName(voiceName) {
  if (!voiceName) return 'Default Voice'
  
  // Extract the last part (usually the character name)
  const parts = voiceName.split('-')
  
  // Handle formats like "en-AU-Chirp3-HD-Achernar"
  if (parts.length >= 3) {
    // Get the last part as the character name
    const charName = parts[parts.length - 1]
    // Capitalize first letter
    return charName.charAt(0).toUpperCase() + charName.slice(1)
  }
  
  return voiceName
}

// Get language display name
export function getLanguageDisplayName(langCode) {
  const languages = {
    'en': 'English',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (AU)',
    'en-IN': 'English (IN)',
    'bn': 'Bengali',
    'bn-IN': 'Bengali',
    'hi': 'Hindi',
    'hi-IN': 'Hindi',
    'es': 'Spanish',
    'es-ES': 'Spanish (ES)',
    'es-US': 'Spanish (US)',
    'fr': 'French',
    'fr-FR': 'French',
    'de': 'German',
    'de-DE': 'German',
    'ja': 'Japanese',
    'ja-JP': 'Japanese',
    'ko': 'Korean',
    'ko-KR': 'Korean',
    'zh': 'Chinese',
    'cmn-CN': 'Chinese (Mandarin)',
    'ar': 'Arabic',
    'ar-XA': 'Arabic',
    'pt': 'Portuguese',
    'pt-BR': 'Portuguese (BR)',
    'it': 'Italian',
    'it-IT': 'Italian',
    'ru': 'Russian',
    'ru-RU': 'Russian',
    'nl': 'Dutch',
    'nl-NL': 'Dutch',
    'pl': 'Polish',
    'pl-PL': 'Polish',
    'tr': 'Turkish',
    'tr-TR': 'Turkish',
    'vi': 'Vietnamese',
    'vi-VN': 'Vietnamese',
    'th': 'Thai',
    'th-TH': 'Thai',
    'id': 'Indonesian',
    'id-ID': 'Indonesian'
  }
  
  return languages[langCode] || langCode
}

// Get accent/region from language code
export function getAccentFromVoice(voiceName) {
  if (!voiceName) return ''
  
  const parts = voiceName.split('-')
  if (parts.length >= 2) {
    const region = parts[1].toUpperCase()
    const accents = {
      'US': 'American',
      'GB': 'British',
      'AU': 'Australian',
      'IN': 'Indian',
      'CA': 'Canadian',
      'NZ': 'New Zealand',
      'ZA': 'South African',
      'IE': 'Irish'
    }
    return accents[region] || region
  }
  return ''
}

// Format voice for display: "Luna (Female, Australian, Premium)"
export function formatVoiceForDisplay(voice) {
  const friendlyName = getFriendlyVoiceName(voice.name)
  const gender = getVoiceGender(voice)
  const accent = getAccentFromVoice(voice.name)
  const voiceType = getVoiceType(voice.name)
  
  // Build display parts
  const parts = [friendlyName]
  const details = []
  
  if (gender && gender !== 'Neutral') details.push(gender)
  if (accent) details.push(accent)
  if (voiceType.label && voiceType.tier !== 'basic') details.push(voiceType.label)
  
  if (details.length > 0) {
    return `${friendlyName} (${details.join(', ')})`
  }
  
  return friendlyName
}

// Get gender icon
export function getGenderIcon(gender) {
  switch (gender) {
    case 'Male': return '👨'
    case 'Female': return '👩'
    default: return '🎙️'
  }
}

// Group voices by category for easier selection
export function groupVoicesForUI(voices) {
  const groups = {
    'Premium HD': [],
    'Premium': [],
    'Natural': [],
    'Standard': []
  }
  
  voices.forEach(voice => {
    const voiceType = getVoiceType(voice.name)
    const displayInfo = {
      ...voice,
      friendlyName: getFriendlyVoiceName(voice.name),
      gender: getVoiceGender(voice),
      genderIcon: getGenderIcon(getVoiceGender(voice)),
      accent: getAccentFromVoice(voice.name),
      voiceType: voiceType,
      displayLabel: formatVoiceForDisplay(voice)
    }
    
    if (voiceType.type === 'HD' || voiceType.type === 'Chirp') {
      groups['Premium HD'].push(displayInfo)
    } else if (voiceType.type === 'Studio') {
      groups['Premium'].push(displayInfo)
    } else if (voiceType.type === 'Neural' || voiceType.type === 'WaveNet') {
      groups['Natural'].push(displayInfo)
    } else {
      groups['Standard'].push(displayInfo)
    }
  })
  
  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) delete groups[key]
  })
  
  return groups
}

// Languages available for TTS
export const SUPPORTED_TTS_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' }
]
