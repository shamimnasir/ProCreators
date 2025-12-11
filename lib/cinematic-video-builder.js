// AI Video Studio - Cinematic Video Templates
// Each template has specific visual styles, animations, and color schemes

// Available Shotstack effects and transitions
const EFFECTS = ['zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 'slideUp', 'slideDown']
const TRANSITIONS = ['fade', 'reveal', 'wipeLeft', 'wipeRight', 'slideLeft', 'slideRight', 'carouselLeft', 'carouselRight', 'zoom']

// Stock video keywords for different template moods
const TEMPLATE_VIDEO_KEYWORDS = {
  'auto-story-reels': ['dramatic', 'cinematic', 'emotional', 'storytelling', 'people', 'city night'],
  'small-business-promo': ['business', 'office', 'professional', 'success', 'team', 'modern'],
  'motivation-broll': ['fitness', 'success', 'mountain', 'sunrise', 'running', 'achievement'],
  'cinematic-script': ['cinematic', 'film noir', 'dramatic', 'atmosphere', 'dark', 'rain'],
  'local-language-explainer': ['technology', 'education', 'science', 'nature', 'world', 'global'],
  'music-facts': ['abstract', 'particles', 'neon', 'energy', 'dynamic', 'colorful'],
  'tribute-video': ['love', 'family', 'memories', 'celebration', 'romantic', 'sunset'],
  'default': ['abstract', 'background', 'nature', 'city', 'sky', 'modern']
}

// Template-specific visual configurations
export const TEMPLATE_VISUAL_CONFIGS = {
  // ==================== AUTO STORY REELS ====================
  'auto-story-reels': {
    name: 'Cinematic Story',
    colorScheme: {
      primary: '#e94560',
      secondary: '#1a1a2e',
      accent: '#ff6b6b',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    },
    typography: {
      fontFamily: 'Oswald',
      titleSize: 72,
      subtitleSize: 36,
      fontWeight: 700
    },
    animation: {
      effect: 'zoomIn',
      transition: 'fade',
      textEffect: 'slideUp'
    },
    style: 'cinematic-drama',
    overlays: ['vignette', 'grain'],
    buildEdit: (prompt, duration, dimensions) => buildStoryReelEdit(prompt, duration, dimensions)
  },

  // ==================== SMALL BUSINESS PROMO ====================
  'small-business-promo': {
    name: 'Business Promo',
    colorScheme: {
      primary: '#ff6b35',
      secondary: '#004e89',
      accent: '#ffd700',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #004e89 0%, #1a5f7a 50%, #159895 100%)'
    },
    typography: {
      fontFamily: 'Montserrat',
      titleSize: 64,
      subtitleSize: 32,
      fontWeight: 800
    },
    animation: {
      effect: 'zoomIn',
      transition: 'wipeRight',
      textEffect: 'slideRight'
    },
    style: 'modern-professional',
    overlays: ['gradient-bottom'],
    buildEdit: (prompt, duration, dimensions) => buildBusinessPromoEdit(prompt, duration, dimensions)
  },

  // ==================== MOTIVATION B-ROLL ====================
  'motivation-broll': {
    name: 'Motivation',
    colorScheme: {
      primary: '#ffd700',
      secondary: '#0a0a0a',
      accent: '#ff4500',
      text: '#ffffff',
      gradient: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)'
    },
    typography: {
      fontFamily: 'Bebas Neue',
      titleSize: 84,
      subtitleSize: 42,
      fontWeight: 400
    },
    animation: {
      effect: 'zoomIn',
      transition: 'fade',
      textEffect: 'zoomIn'
    },
    style: 'bold-impactful',
    overlays: ['dark-vignette'],
    buildEdit: (prompt, duration, dimensions) => buildMotivationEdit(prompt, duration, dimensions)
  },

  // ==================== CINEMATIC SCRIPT ====================
  'cinematic-script': {
    name: 'Cinematic',
    colorScheme: {
      primary: '#4a90d9',
      secondary: '#000000',
      accent: '#00d4ff',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #000000 0%, #0d1b2a 50%, #1b263b 100%)'
    },
    typography: {
      fontFamily: 'Playfair Display',
      titleSize: 68,
      subtitleSize: 34,
      fontWeight: 700
    },
    animation: {
      effect: 'zoomIn',
      transition: 'fade',
      textEffect: 'fade'
    },
    style: 'film-noir',
    overlays: ['letterbox', 'film-grain'],
    buildEdit: (prompt, duration, dimensions) => buildCinematicEdit(prompt, duration, dimensions)
  },

  // ==================== LOCAL LANGUAGE EXPLAINER ====================
  'local-language-explainer': {
    name: 'Explainer',
    colorScheme: {
      primary: '#00b894',
      secondary: '#2d3436',
      accent: '#00cec9',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 50%, #b2bec3 100%)'
    },
    typography: {
      fontFamily: 'Poppins',
      titleSize: 56,
      subtitleSize: 28,
      fontWeight: 600
    },
    animation: {
      effect: 'slideUp',
      transition: 'slideUp',
      textEffect: 'slideUp'
    },
    style: 'clean-modern',
    overlays: [],
    buildEdit: (prompt, duration, dimensions) => buildExplainerEdit(prompt, duration, dimensions)
  },

  // ==================== DEFAULT ====================
  'default': {
    name: 'Default',
    colorScheme: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    typography: {
      fontFamily: 'Montserrat',
      titleSize: 64,
      subtitleSize: 32,
      fontWeight: 700
    },
    animation: {
      effect: 'zoomIn',
      transition: 'fade',
      textEffect: 'slideUp'
    },
    style: 'modern',
    overlays: [],
    buildEdit: (prompt, duration, dimensions) => buildDefaultEdit(prompt, duration, dimensions)
  }
}

// Get visual config for a template
export function getTemplateVisualConfig(templateId) {
  return TEMPLATE_VISUAL_CONFIGS[templateId] || TEMPLATE_VISUAL_CONFIGS['default']
}

// ==================== BUILD FUNCTIONS ====================

// Build Story Reel Edit - Dramatic, emotional, cinematic
function buildStoryReelEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['auto-story-reels']
  const lines = parsePromptToLines(prompt, 4)
  const segmentDuration = Math.max(2.5, duration / lines.length)
  
  const tracks = []
  
  // Track 1: Background with animated gradient
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};position:relative;overflow:hidden;">
          <div style="position:absolute;width:200%;height:200%;top:-50%;left:-50%;background:radial-gradient(circle at 30% 30%, ${config.colorScheme.primary}33 0%, transparent 50%);animation:pulse 4s ease-in-out infinite;"></div>
          <div style="position:absolute;width:100%;height:100%;background:radial-gradient(ellipse at center, transparent 0%, ${config.colorScheme.secondary}cc 100%);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Main text content with animations
  const textClips = lines.map((line, index) => {
    const isFirst = index === 0
    const isLast = index === lines.length - 1
    const startTime = index * segmentDuration
    
    return {
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:${dimensions.width < 1200 ? '40px' : '80px'};">
          <div style="position:relative;">
            ${isFirst ? `<div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);font-family:'${config.typography.fontFamily}',sans-serif;font-size:24px;color:${config.colorScheme.primary};text-transform:uppercase;letter-spacing:8px;">STORY</div>` : ''}
            <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};line-height:1.2;text-align:center;text-shadow:0 4px 30px rgba(0,0,0,0.8),0 0 60px ${config.colorScheme.primary}66;max-width:90%;">${line}</p>
            ${isLast ? `<div style="margin-top:40px;width:60px;height:4px;background:${config.colorScheme.primary};margin:40px auto 0;"></div>` : ''}
          </div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.3,
      effect: isFirst ? 'zoomIn' : 'slideUp',
      transition: {
        in: 'fade',
        out: index < lines.length - 1 ? 'fade' : 'fade'
      }
    }
  })
  
  tracks.push({ clips: textClips })
  
  // Track 3: Vignette overlay
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:radial-gradient(ellipse at center, transparent 40%, ${config.colorScheme.secondary} 100%);pointer-events:none;"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Build Business Promo Edit - Professional, bold, attention-grabbing
function buildBusinessPromoEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['small-business-promo']
  const lines = parsePromptToLines(prompt, 3)
  const segmentDuration = Math.max(3, duration / (lines.length + 1))
  
  const tracks = []
  
  // Track 1: Animated background
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};position:relative;overflow:hidden;">
          <div style="position:absolute;width:300%;height:300%;top:-100%;left:-100%;background:conic-gradient(from 0deg, ${config.colorScheme.primary}11 0deg, transparent 60deg, ${config.colorScheme.accent}11 120deg, transparent 180deg);animation:rotate 20s linear infinite;"></div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(transparent, ${config.colorScheme.secondary}ee);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Accent bar animation
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:15%;left:0;width:100%;height:8px;background:linear-gradient(90deg, transparent 0%, ${config.colorScheme.primary} 20%, ${config.colorScheme.accent} 80%, transparent 100%);"></div>
          <div style="position:absolute;bottom:15%;left:0;width:100%;height:8px;background:linear-gradient(90deg, transparent 0%, ${config.colorScheme.accent} 20%, ${config.colorScheme.primary} 80%, transparent 100%);"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Main content
  const textClips = []
  
  // Hook text (first 2 seconds)
  textClips.push({
    asset: {
      type: 'html',
      html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
        <div style="background:${config.colorScheme.primary};padding:20px 50px;transform:skewX(-5deg);">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize * 0.7}px;color:${config.colorScheme.text};font-weight:900;text-transform:uppercase;letter-spacing:4px;transform:skewX(5deg);">🔥 NOW OPEN 🔥</p>
        </div>
      </div>`,
      width: dimensions.width,
      height: dimensions.height
    },
    start: 0,
    length: 2,
    effect: 'slideRight',
    transition: { in: 'wipeRight', out: 'wipeLeft' }
  })
  
  // Main content
  lines.forEach((line, index) => {
    const startTime = 2 + (index * segmentDuration)
    textClips.push({
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 4px 20px rgba(0,0,0,0.5);line-height:1.1;">
            ${line}
          </p>
          ${index === lines.length - 1 ? `
          <div style="margin-top:50px;display:flex;gap:20px;">
            <div style="background:${config.colorScheme.accent};padding:15px 40px;border-radius:50px;">
              <span style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:28px;color:#000;font-weight:900;">ORDER NOW →</span>
            </div>
          </div>` : ''}
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.3,
      effect: 'slideUp',
      transition: { in: 'fade', out: 'fade' }
    })
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;600;800;900&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Build Motivation Edit - Bold, impactful, inspiring
function buildMotivationEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['motivation-broll']
  const lines = parsePromptToLines(prompt, 3)
  const segmentDuration = Math.max(3, duration / lines.length)
  
  const tracks = []
  
  // Track 1: Dark dramatic background
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};position:relative;overflow:hidden;">
          <div style="position:absolute;width:100%;height:100%;background:repeating-linear-gradient(0deg, transparent, transparent 2px, ${config.colorScheme.secondary}22 2px, ${config.colorScheme.secondary}22 4px);"></div>
          <div style="position:absolute;top:50%;left:50%;width:600px;height:600px;transform:translate(-50%,-50%);background:radial-gradient(circle, ${config.colorScheme.primary}22 0%, transparent 70%);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Quote marks decoration
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="position:absolute;top:20%;left:10%;font-size:200px;color:${config.colorScheme.primary}33;font-family:Georgia,serif;">"</div>
          <div style="position:absolute;bottom:20%;right:10%;font-size:200px;color:${config.colorScheme.primary}33;font-family:Georgia,serif;transform:rotate(180deg);">"</div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Main text
  const textClips = lines.map((line, index) => {
    const startTime = index * segmentDuration
    const words = line.split(' ')
    const highlightWord = words[Math.floor(words.length / 2)]
    const formattedLine = line.replace(highlightWord, `<span style="color:${config.colorScheme.primary};">${highlightWord}</span>`)
    
    return {
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-transform:uppercase;letter-spacing:4px;line-height:1.3;text-shadow:0 0 40px ${config.colorScheme.primary}66;">
            ${formattedLine}
          </p>
          <div style="margin-top:40px;width:100px;height:4px;background:linear-gradient(90deg, transparent, ${config.colorScheme.primary}, transparent);"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.3,
      effect: 'zoomIn',
      transition: { in: 'fade', out: 'fade' }
    }
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Build Cinematic Edit - Film-like, atmospheric
function buildCinematicEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['cinematic-script']
  const lines = parsePromptToLines(prompt, 4)
  const segmentDuration = Math.max(3, duration / lines.length)
  
  // Calculate letterbox height for cinematic ratio
  const letterboxHeight = Math.floor(dimensions.height * 0.12)
  
  const tracks = []
  
  // Track 1: Cinematic background
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};position:relative;overflow:hidden;">
          <div style="position:absolute;width:100%;height:100%;background:radial-gradient(ellipse at 50% 30%, ${config.colorScheme.primary}22 0%, transparent 60%);"></div>
          <div style="position:absolute;width:100%;height:${letterboxHeight}px;top:0;background:#000;"></div>
          <div style="position:absolute;width:100%;height:${letterboxHeight}px;bottom:0;background:#000;"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Film grain effect
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;opacity:0.05;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23noise)\"/></svg>');"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration
    }]
  })
  
  // Track 3: Main text
  const textClips = lines.map((line, index) => {
    const startTime = index * segmentDuration
    
    return {
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px ${letterboxHeight + 40}px;">
          <p style="font-family:'${config.typography.fontFamily}',serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};font-style:italic;text-align:center;line-height:1.4;letter-spacing:2px;text-shadow:0 2px 20px rgba(0,0,0,0.8);">
            ${line}
          </p>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.5,
      effect: 'zoomIn',
      transition: { in: 'fade', out: 'fade' }
    }
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Build Explainer Edit - Clean, educational
function buildExplainerEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['local-language-explainer']
  const lines = parsePromptToLines(prompt, 4)
  const segmentDuration = Math.max(2.5, duration / (lines.length + 1))
  
  const tracks = []
  
  // Track 1: Clean background
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};position:relative;">
          <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg, transparent 0%, ${config.colorScheme.secondary}44 100%);"></div>
          <div style="position:absolute;top:20px;left:20px;width:100px;height:100px;border:3px solid ${config.colorScheme.primary}44;border-radius:50%;"></div>
          <div style="position:absolute;bottom:20px;right:20px;width:60px;height:60px;background:${config.colorScheme.primary}22;"></div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Progress indicator
  tracks.push({
    clips: lines.map((_, index) => {
      const startTime = 1 + (index * segmentDuration)
      const progress = ((index + 1) / lines.length) * 100
      return {
        asset: {
          type: 'html',
          html: `<div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);width:60%;height:6px;background:${config.colorScheme.secondary}88;border-radius:3px;overflow:hidden;">
            <div style="width:${progress}%;height:100%;background:${config.colorScheme.primary};border-radius:3px;transition:width 0.5s;"></div>
          </div>`,
          width: dimensions.width,
          height: dimensions.height
        },
        start: startTime,
        length: segmentDuration
      }
    })
  })
  
  // Track 3: Content
  const textClips = []
  
  // Title card
  textClips.push({
    asset: {
      type: 'html',
      html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
        <div style="background:${config.colorScheme.primary};padding:15px 40px;border-radius:8px;margin-bottom:30px;">
          <span style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:24px;color:#fff;font-weight:600;">📚 DID YOU KNOW?</span>
        </div>
      </div>`,
      width: dimensions.width,
      height: dimensions.height
    },
    start: 0,
    length: 1.5,
    effect: 'slideDown',
    transition: { in: 'slideDown', out: 'fade' }
  })
  
  // Facts
  lines.forEach((line, index) => {
    const startTime = 1 + (index * segmentDuration)
    textClips.push({
      asset: {
        type: 'html',
        html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;">
          <div style="display:flex;align-items:center;gap:20px;max-width:90%;">
            <div style="flex-shrink:0;width:60px;height:60px;background:${config.colorScheme.primary};border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;font-weight:bold;color:#fff;">${index + 1}</span>
            </div>
            <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};line-height:1.3;">
              ${line}
            </p>
          </div>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.3,
      effect: 'slideUp',
      transition: { in: 'slideUp', out: 'fade' }
    })
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;600;700&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Build Default Edit
function buildDefaultEdit(prompt, duration, dimensions) {
  const config = TEMPLATE_VISUAL_CONFIGS['default']
  const lines = parsePromptToLines(prompt, 4)
  const segmentDuration = Math.max(2.5, duration / lines.length)
  
  const tracks = []
  
  // Track 1: Gradient background
  tracks.push({
    clips: [{
      asset: {
        type: 'html',
        html: `<div style="width:100%;height:100%;background:${config.colorScheme.gradient};"></div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: 0,
      length: duration,
      effect: 'zoomIn'
    }]
  })
  
  // Track 2: Text content
  const textClips = lines.map((line, index) => {
    const startTime = index * segmentDuration
    return {
      asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:60px;">
          <p style="font-family:'${config.typography.fontFamily}',sans-serif;font-size:${config.typography.titleSize}px;color:${config.colorScheme.text};font-weight:${config.typography.fontWeight};text-align:center;text-shadow:0 4px 20px rgba(0,0,0,0.3);">
            ${line}
          </p>
        </div>`,
        width: dimensions.width,
        height: dimensions.height
      },
      start: startTime,
      length: segmentDuration + 0.3,
      effect: config.animation.textEffect,
      transition: { in: 'fade', out: 'fade' }
    }
  })
  
  tracks.push({ clips: textClips })
  
  return {
    timeline: {
      background: config.colorScheme.secondary,
      fonts: [
        { src: `https://fonts.googleapis.com/css2?family=${config.typography.fontFamily.replace(' ', '+')}:wght@400;700&display=swap` }
      ],
      tracks
    },
    output: {
      format: 'mp4',
      size: { width: dimensions.width, height: dimensions.height },
      fps: 30
    }
  }
}

// Helper: Parse prompt into lines
function parsePromptToLines(prompt, maxLines = 4) {
  if (!prompt || typeof prompt !== 'string') {
    return ['Your Video Here']
  }
  
  // Split by newlines first
  let lines = prompt.split(/\n+/).filter(l => l.trim())
  
  // If only one line, try to split by sentences
  if (lines.length === 1) {
    lines = prompt.split(/[.!?]+/).filter(l => l.trim()).map(l => l.trim())
  }
  
  // If still one line, split by length
  if (lines.length === 1 && prompt.length > 60) {
    const words = prompt.split(' ')
    const chunkSize = Math.ceil(words.length / maxLines)
    lines = []
    for (let i = 0; i < words.length; i += chunkSize) {
      lines.push(words.slice(i, i + chunkSize).join(' '))
    }
  }
  
  return lines.slice(0, maxLines).map(l => l.trim())
}

// Export the main builder function
export function buildCinematicVideoEdit(templateId, prompt, duration, dimensions) {
  const config = getTemplateVisualConfig(templateId)
  
  if (config.buildEdit) {
    return config.buildEdit(prompt, duration, dimensions)
  }
  
  return buildDefaultEdit(prompt, duration, dimensions)
}
