// Shared PDF Design Utilities
// Beautiful cover designs, color schemes, and decorative elements for all PDF tools

import { rgb } from 'pdf-lib'

// Helper function to convert base64 data URL to bytes for embedding in PDF
export async function embedImageFromDataUrl(pdfDoc, dataUrl) {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return null
    }
    
    // Extract base64 data
    const base64Data = dataUrl.split(',')[1]
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    
    // Determine image type and embed
    if (dataUrl.includes('image/png')) {
      return await pdfDoc.embedPng(imageBytes)
    } else if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) {
      return await pdfDoc.embedJpg(imageBytes)
    }
    
    // Try PNG as default
    return await pdfDoc.embedPng(imageBytes)
  } catch (error) {
    console.error('Error embedding image:', error)
    return null
  }
}

// Draw cover page with AI-generated image (FILL mode - professional book cover style)
export async function drawCoverPageWithImage(page, pdfDoc, options) {
  const { 
    width, 
    height, 
    title, 
    subtitle, 
    authorName,
    year,
    colors, 
    coverStyle,
    boldFont,
    regularFont,
    coverImageUrl
  } = options
  
  // Debug log fonts
  console.log('drawCoverPageWithImage received fonts:', { 
    boldFont: boldFont ? 'object' : boldFont, 
    regularFont: regularFont ? 'object' : regularFont,
    hasBoldWidthMethod: boldFont && typeof boldFont.widthOfTextAtSize === 'function'
  })
  
  const margin = 40
  const centerX = width / 2
  const isDark = isDarkScheme(colors)
  
  // Background (fallback)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: colors.background,
  })
  
  // Try to embed and draw the cover image in FULL PAGE FILL mode
  let hasImage = false
  if (coverImageUrl) {
    try {
      const embeddedImage = await embedImageFromDataUrl(pdfDoc, coverImageUrl)
      if (embeddedImage) {
        // FULL PAGE FILL: Cover entire page, cropping to fit
        const imgDims = embeddedImage.scale(1)
        const imgAspectRatio = imgDims.width / imgDims.height
        const pageAspectRatio = width / height
        
        let drawWidth, drawHeight, drawX, drawY
        
        // Fill the entire page (may crop)
        if (imgAspectRatio > pageAspectRatio) {
          // Image is wider than page - fit height, crop width
          drawHeight = height
          drawWidth = drawHeight * imgAspectRatio
          drawX = (width - drawWidth) / 2 // Center horizontally
          drawY = 0
        } else {
          // Image is taller than page - fit width, crop height
          drawWidth = width
          drawHeight = drawWidth / imgAspectRatio
          drawX = 0
          drawY = (height - drawHeight) / 2 // Center vertically
        }
        
        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        })
        
        hasImage = true
        console.log('Cover image embedded in FULL PAGE FILL mode')
      }
    } catch (error) {
      console.error('Error drawing cover image:', error)
    }
  }
  
  // Scale factor for smaller page sizes (base is 612pt = 8.5")
  const baseWidth = 612
  const scaleFactor = Math.min(1, width / baseWidth)
  
  // Subtle overlay only behind title area for text readability (if image exists)
  if (hasImage) {
    // Small dark strip just behind the title/subtitle area - scaled for page size
    const overlayHeight = Math.floor(280 * scaleFactor)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: overlayHeight,
      color: rgb(0.05, 0.05, 0.15), // Dark overlay
      opacity: 0.75,
    })
  }
  
  // Text colors for contrast - use white on full-page image for visibility
  const titleColor = hasImage ? rgb(1, 1, 1) : (isDark ? colors.text : colors.primary)
  const subtitleColor = hasImage ? rgb(0.9, 0.9, 0.9) : (isDark ? colors.accent : colors.secondary)
  
  // Title section (positioned in the safe lower area with dark overlay)
  const titleY = hasImage ? Math.min(200, height * 0.28) : (height / 2 + 80)
  
  // Title - use safe font with null check
  if (!boldFont || !regularFont) {
    console.error('Font objects are null or undefined', { boldFont: !!boldFont, regularFont: !!regularFont })
    throw new Error('Font objects are not available. PDF generation cannot continue.')
  }
  
  // Scale font size based on page width for proper fit on all sizes
  // Base: 28pt for 612pt width (8.5"), scale down for smaller pages
  const baseWidth = 612
  const scaleFactor = Math.min(1, width / baseWidth)
  const baseTitleSize = title.length > 30 ? 24 : 28
  const titleFontSize = Math.max(14, Math.floor(baseTitleSize * scaleFactor))
  
  // Safe text width calculation that handles Unicode/complex scripts
  const safeGetTextWidth = (text, font, fontSize) => {
    try {
      return font.widthOfTextAtSize(text, fontSize)
    } catch (e) {
      // Fallback for complex scripts (Bengali, Hindi, etc.) where glyph lookup fails
      // Estimate based on character count and average character width
      console.log('Using fallback width calculation for:', text.substring(0, 20))
      return text.length * fontSize * 0.5
    }
  }
  
  // Safe text drawing that handles Unicode/complex scripts
  const safeDrawText = (page, text, options) => {
    if (!text) return true
    try {
      page.drawText(text, options)
      return true
    } catch (e) {
      console.log('Error drawing text, trying character-by-character:', e.message)
      // For complex scripts, try drawing character by character
      try {
        let xOffset = 0
        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          try {
            page.drawText(char, { ...options, x: options.x + xOffset })
            xOffset += safeGetTextWidth(char, options.font, options.size)
          } catch (charError) {
            // Skip problematic character
            xOffset += options.size * 0.5
          }
        }
        return true
      } catch (fallbackError) {
        console.error('Complete text drawing failure:', fallbackError.message)
        return false
      }
    }
  }
  
  // Calculate available width for title (with margins)
  const maxTitleWidth = width - (margin * 2)
  let titleWidth = safeGetTextWidth(title, boldFont, titleFontSize)
  let displayTitle = title
  let finalTitleFontSize = titleFontSize
  
  // If title is too wide, reduce font size or truncate
  if (titleWidth > maxTitleWidth) {
    // First try reducing font size
    finalTitleFontSize = Math.max(12, Math.floor(titleFontSize * (maxTitleWidth / titleWidth)))
    titleWidth = safeGetTextWidth(title, boldFont, finalTitleFontSize)
    
    // If still too wide, truncate
    if (titleWidth > maxTitleWidth) {
      const charsToFit = Math.floor(maxTitleWidth / (finalTitleFontSize * 0.55))
      displayTitle = title.substring(0, Math.min(charsToFit - 3, title.length)) + '...'
      titleWidth = safeGetTextWidth(displayTitle, boldFont, finalTitleFontSize)
    }
  }
  
  safeDrawText(page, displayTitle, {
    x: centerX - titleWidth / 2,
    y: titleY,
    size: finalTitleFontSize,
    font: boldFont,
    color: titleColor,
  })
  
  // Subtitle - scale font based on page width
  if (subtitle) {
    const baseSubFontSize = 13
    const subFontSize = Math.max(10, Math.floor(baseSubFontSize * scaleFactor))
    const maxSubWidth = width - (margin * 2)
    let displaySubtitle = subtitle
    const subWidth = safeGetTextWidth(subtitle, regularFont, subFontSize)
    if (subWidth > maxSubWidth) {
      // Truncate to fit
      const charsToFit = Math.floor(maxSubWidth / (subFontSize * 0.5))
      displaySubtitle = subtitle.substring(0, Math.min(charsToFit, 50)) + '...'
    }
    const subtitleWidth = safeGetTextWidth(displaySubtitle, regularFont, subFontSize)
    safeDrawText(page, displaySubtitle, {
      x: centerX - subtitleWidth / 2,
      y: titleY - Math.floor(28 * scaleFactor),
      size: subFontSize,
      font: regularFont,
      color: subtitleColor,
    })
  }
  
  // Line below subtitle removed for cleaner design
  
  // Bottom band with author info (skip if full-page image - already has dark overlay)
  const bandHeight = Math.floor(90 * scaleFactor)
  if (!hasImage) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: bandHeight,
      color: isDark ? colors.secondary : colors.accent,
    })
    
    // Decorative line at top of band
    page.drawLine({
      start: { x: margin, y: bandHeight },
      end: { x: width - margin, y: bandHeight },
      thickness: 2,
      color: decorColor,
    })
  }
  
  // Author name (without "by" prefix and without year) - scale font
  if (authorName) {
    const baseAuthorFontSize = hasImage ? 18 : 16
    const authorFontSize = Math.max(11, Math.floor(baseAuthorFontSize * scaleFactor))
    const authorY = hasImage ? Math.floor(80 * scaleFactor) : Math.floor(50 * scaleFactor)
    const authorWidth = safeGetTextWidth(authorName, boldFont, authorFontSize)
    safeDrawText(page, authorName, {
      x: centerX - authorWidth / 2,
      y: authorY,
      size: authorFontSize,
      font: boldFont,
      color: hasImage ? rgb(1, 1, 1) : titleColor,
    })
  }
  
  // Branding removed for cleaner design
}

// Helper function to convert hex color to RGB values (0-1 range)
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '')
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  return { r, g, b }
}

// Helper to adjust brightness
function adjustBrightness(color, factor) {
  return {
    r: Math.min(1, Math.max(0, color.r * factor)),
    g: Math.min(1, Math.max(0, color.g * factor)),
    b: Math.min(1, Math.max(0, color.b * factor))
  }
}

// Helper to create lighter tint
function createTint(color, factor) {
  return {
    r: color.r + (1 - color.r) * factor,
    g: color.g + (1 - color.g) * factor,
    b: color.b + (1 - color.b) * factor
  }
}

// Generate a full color scheme from a single custom hex color
export function generateCustomColors(hexColor) {
  const base = hexToRgb(hexColor)
  
  // Calculate perceived brightness
  const brightness = (base.r * 0.299 + base.g * 0.587 + base.b * 0.114)
  const isDark = brightness < 0.5
  
  // Primary color is the base
  const primary = rgb(base.r, base.g, base.b)
  
  // Secondary is a lighter/adjusted version
  const secondaryBase = isDark ? createTint(base, 0.3) : adjustBrightness(base, 0.75)
  const secondary = rgb(secondaryBase.r, secondaryBase.g, secondaryBase.b)
  
  // Accent is a very light tint (for boxes, highlights)
  const accentBase = createTint(base, 0.85)
  const accent = rgb(accentBase.r, accentBase.g, accentBase.b)
  
  // Background - almost white with subtle tint
  const bgBase = createTint(base, 0.97)
  const background = rgb(bgBase.r, bgBase.g, bgBase.b)
  
  // Text - dark version of primary or dark gray
  const textBase = isDark ? { r: 0.15, g: 0.15, b: 0.2 } : adjustBrightness(base, 0.3)
  const text = rgb(textBase.r, textBase.g, textBase.b)
  
  return {
    name: 'Custom',
    primary,
    secondary,
    accent,
    background,
    text,
    coverGradient: [hexColor, lightenHex(hexColor, 30), lightenHex(hexColor, 60)]
  }
}

// Helper to lighten a hex color
function lightenHex(hex, percent) {
  const rgb = hexToRgb(hex)
  const tinted = createTint(rgb, percent / 100)
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(tinted.r)}${toHex(tinted.g)}${toHex(tinted.b)}`
}

// Enhanced color schemes with multiple colors
export const PDF_COLOR_SCHEMES = {
  'rose-gold': {
    name: 'Rose Gold',
    primary: rgb(0.72, 0.43, 0.47),
    secondary: rgb(0.85, 0.65, 0.65),
    accent: rgb(0.95, 0.85, 0.85),
    background: rgb(1, 0.98, 0.97),
    text: rgb(0.25, 0.15, 0.18),
    coverGradient: ['#B76E79', '#E8B4BC', '#F5D5D8'],
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    primary: rgb(0.12, 0.35, 0.55),
    secondary: rgb(0.3, 0.55, 0.75),
    accent: rgb(0.7, 0.85, 0.95),
    background: rgb(0.97, 0.99, 1),
    text: rgb(0.1, 0.2, 0.35),
    coverGradient: ['#1E5A8A', '#4E8BC0', '#A8D4F0'],
  },
  'forest-green': {
    name: 'Forest Green',
    primary: rgb(0.18, 0.4, 0.25),
    secondary: rgb(0.35, 0.6, 0.4),
    accent: rgb(0.75, 0.9, 0.78),
    background: rgb(0.97, 1, 0.97),
    text: rgb(0.15, 0.25, 0.15),
    coverGradient: ['#2D6640', '#5A9968', '#B8E4C0'],
  },
  'lavender': {
    name: 'Lavender Dream',
    primary: rgb(0.5, 0.35, 0.65),
    secondary: rgb(0.7, 0.55, 0.8),
    accent: rgb(0.9, 0.85, 0.95),
    background: rgb(0.99, 0.97, 1),
    text: rgb(0.25, 0.18, 0.35),
    coverGradient: ['#8059A5', '#B38FCC', '#E5D9F0'],
  },
  'sunset': {
    name: 'Sunset Glow',
    primary: rgb(0.8, 0.35, 0.25),
    secondary: rgb(0.95, 0.55, 0.35),
    accent: rgb(1, 0.85, 0.7),
    background: rgb(1, 0.98, 0.96),
    text: rgb(0.35, 0.15, 0.1),
    coverGradient: ['#CC5940', '#F28D5A', '#FFD9B3'],
  },
  'midnight': {
    name: 'Midnight',
    primary: rgb(0.15, 0.15, 0.25),
    secondary: rgb(0.35, 0.35, 0.5),
    accent: rgb(0.7, 0.7, 0.85),
    background: rgb(0.12, 0.12, 0.18),
    text: rgb(0.9, 0.9, 0.95),
    coverGradient: ['#262640', '#5A5A80', '#B3B3D9'],
  },
  'blush-pink': {
    name: 'Blush Pink',
    primary: rgb(0.85, 0.5, 0.6),
    secondary: rgb(0.95, 0.7, 0.75),
    accent: rgb(1, 0.9, 0.92),
    background: rgb(1, 0.98, 0.98),
    text: rgb(0.35, 0.2, 0.25),
    coverGradient: ['#D9809A', '#F2B3BF', '#FFE6EB'],
  },
  'sage': {
    name: 'Sage',
    primary: rgb(0.45, 0.55, 0.45),
    secondary: rgb(0.65, 0.75, 0.65),
    accent: rgb(0.88, 0.92, 0.88),
    background: rgb(0.97, 0.99, 0.97),
    text: rgb(0.2, 0.28, 0.2),
    coverGradient: ['#738C73', '#A6BFA6', '#E0EBE0'],
  },
  'terracotta': {
    name: 'Terracotta',
    primary: rgb(0.75, 0.4, 0.3),
    secondary: rgb(0.88, 0.6, 0.5),
    accent: rgb(0.97, 0.88, 0.82),
    background: rgb(1, 0.98, 0.96),
    text: rgb(0.3, 0.18, 0.12),
    coverGradient: ['#BF664D', '#E09980', '#F7E0D1'],
  },
  'minimal': {
    name: 'Minimal Black',
    primary: rgb(0.1, 0.1, 0.1),
    secondary: rgb(0.4, 0.4, 0.4),
    accent: rgb(0.85, 0.85, 0.85),
    background: rgb(1, 1, 1),
    text: rgb(0.1, 0.1, 0.1),
    coverGradient: ['#1A1A1A', '#666666', '#D9D9D9'],
  },
}

// Cover design styles
export const COVER_STYLES = {
  'elegant': {
    name: 'Elegant',
    description: 'Classic with decorative borders',
    hasFrame: true,
    hasPattern: false,
    cornerStyle: 'ornate',
  },
  'modern': {
    name: 'Modern',
    description: 'Clean with geometric accents',
    hasFrame: false,
    hasPattern: true,
    patternType: 'geometric',
  },
  'floral': {
    name: 'Floral',
    description: 'Delicate floral corners',
    hasFrame: true,
    hasPattern: false,
    cornerStyle: 'floral',
  },
  'minimalist': {
    name: 'Minimalist',
    description: 'Simple and clean',
    hasFrame: false,
    hasPattern: false,
  },
  'watercolor': {
    name: 'Watercolor',
    description: 'Soft watercolor effect',
    hasFrame: false,
    hasPattern: true,
    patternType: 'watercolor',
  },
  'boho': {
    name: 'Boho',
    description: 'Bohemian with organic shapes',
    hasFrame: true,
    hasPattern: true,
    patternType: 'boho',
    cornerStyle: 'boho',
  },
}

// Draw decorative corner elements
export function drawCornerDecorations(page, width, height, margin, colors, style, isDark = false) {
  const lineColor = isDark ? colors.accent : colors.primary
  const accentColor = isDark ? colors.secondary : colors.secondary
  
  if (style === 'ornate' || style === 'elegant') {
    const cornerSize = 40
    // Top-left corner - L shape with inner detail
    page.drawLine({
      start: { x: margin, y: height - margin },
      end: { x: margin + cornerSize, y: height - margin },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: margin, y: height - margin },
      end: { x: margin, y: height - margin - cornerSize },
      thickness: 2,
      color: lineColor,
    })
    // Inner corner accent
    page.drawLine({
      start: { x: margin + 8, y: height - margin - 8 },
      end: { x: margin + 20, y: height - margin - 8 },
      thickness: 1,
      color: accentColor,
    })
    page.drawLine({
      start: { x: margin + 8, y: height - margin - 8 },
      end: { x: margin + 8, y: height - margin - 20 },
      thickness: 1,
      color: accentColor,
    })
    
    // Top-right corner
    page.drawLine({
      start: { x: width - margin, y: height - margin },
      end: { x: width - margin - cornerSize, y: height - margin },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: width - margin, y: height - margin },
      end: { x: width - margin, y: height - margin - cornerSize },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: width - margin - 8, y: height - margin - 8 },
      end: { x: width - margin - 20, y: height - margin - 8 },
      thickness: 1,
      color: accentColor,
    })
    page.drawLine({
      start: { x: width - margin - 8, y: height - margin - 8 },
      end: { x: width - margin - 8, y: height - margin - 20 },
      thickness: 1,
      color: accentColor,
    })
    
    // Bottom-left corner
    page.drawLine({
      start: { x: margin, y: margin },
      end: { x: margin + cornerSize, y: margin },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: margin, y: margin },
      end: { x: margin, y: margin + cornerSize },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: margin + 8, y: margin + 8 },
      end: { x: margin + 20, y: margin + 8 },
      thickness: 1,
      color: accentColor,
    })
    page.drawLine({
      start: { x: margin + 8, y: margin + 8 },
      end: { x: margin + 8, y: margin + 20 },
      thickness: 1,
      color: accentColor,
    })
    
    // Bottom-right corner
    page.drawLine({
      start: { x: width - margin, y: margin },
      end: { x: width - margin - cornerSize, y: margin },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: width - margin, y: margin },
      end: { x: width - margin, y: margin + cornerSize },
      thickness: 2,
      color: lineColor,
    })
    page.drawLine({
      start: { x: width - margin - 8, y: margin + 8 },
      end: { x: width - margin - 20, y: margin + 8 },
      thickness: 1,
      color: accentColor,
    })
    page.drawLine({
      start: { x: width - margin - 8, y: margin + 8 },
      end: { x: width - margin - 8, y: margin + 20 },
      thickness: 1,
      color: accentColor,
    })
  }
  
  // Floral corner style - circles and curves resembling flower petals
  if (style === 'floral') {
    const petalColor = lineColor
    const centerColor = accentColor
    
    // Helper to draw a flower cluster at a corner
    const drawFlowerCluster = (cx, cy, flipX, flipY) => {
      const offsetX = flipX ? -1 : 1
      const offsetY = flipY ? -1 : 1
      
      // Main flower center
      page.drawCircle({
        x: cx + (15 * offsetX),
        y: cy + (15 * offsetY),
        size: 8,
        color: centerColor,
      })
      
      // Petals around center (5 petals)
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 + 36) * Math.PI / 180
        const px = cx + (15 * offsetX) + Math.cos(angle) * 12
        const py = cy + (15 * offsetY) + Math.sin(angle) * 12
        page.drawCircle({
          x: px,
          y: py,
          size: 5,
          color: petalColor,
        })
      }
      
      // Smaller accent flower
      page.drawCircle({
        x: cx + (35 * offsetX),
        y: cy + (8 * offsetY),
        size: 4,
        color: centerColor,
      })
      for (let i = 0; i < 4; i++) {
        const angle = (i * 90 + 45) * Math.PI / 180
        const px = cx + (35 * offsetX) + Math.cos(angle) * 6
        const py = cy + (8 * offsetY) + Math.sin(angle) * 6
        page.drawCircle({
          x: px,
          y: py,
          size: 3,
          color: petalColor,
        })
      }
      
      // Second smaller flower
      page.drawCircle({
        x: cx + (8 * offsetX),
        y: cy + (35 * offsetY),
        size: 4,
        color: centerColor,
      })
      for (let i = 0; i < 4; i++) {
        const angle = (i * 90 + 45) * Math.PI / 180
        const px = cx + (8 * offsetX) + Math.cos(angle) * 6
        const py = cy + (35 * offsetY) + Math.sin(angle) * 6
        page.drawCircle({
          x: px,
          y: py,
          size: 3,
          color: petalColor,
        })
      }
      
      // Decorative dots/leaves
      page.drawCircle({ x: cx + (45 * offsetX), y: cy + (20 * offsetY), size: 2, color: petalColor })
      page.drawCircle({ x: cx + (20 * offsetX), y: cy + (45 * offsetY), size: 2, color: petalColor })
      page.drawCircle({ x: cx + (50 * offsetX), y: cy + (5 * offsetY), size: 1.5, color: accentColor })
      page.drawCircle({ x: cx + (5 * offsetX), y: cy + (50 * offsetY), size: 1.5, color: accentColor })
    }
    
    // Draw flowers at each corner
    drawFlowerCluster(margin, height - margin, 1, -1)  // Top-left
    drawFlowerCluster(width - margin, height - margin, -1, -1)  // Top-right
    drawFlowerCluster(margin, margin, 1, 1)  // Bottom-left
    drawFlowerCluster(width - margin, margin, -1, 1)  // Bottom-right
  }
  
  // Boho style - organic circles and arcs
  if (style === 'boho') {
    const drawBohoCorner = (cx, cy, flipX, flipY) => {
      const offsetX = flipX ? -1 : 1
      const offsetY = flipY ? -1 : 1
      
      // Concentric arcs
      page.drawCircle({
        x: cx,
        y: cy,
        size: 30,
        borderColor: lineColor,
        borderWidth: 1.5,
      })
      page.drawCircle({
        x: cx,
        y: cy,
        size: 22,
        borderColor: accentColor,
        borderWidth: 1,
      })
      page.drawCircle({
        x: cx,
        y: cy,
        size: 14,
        borderColor: lineColor,
        borderWidth: 1,
      })
      
      // Small decorative dots
      page.drawCircle({ x: cx + (20 * offsetX), y: cy + (20 * offsetY), size: 3, color: lineColor })
      page.drawCircle({ x: cx + (35 * offsetX), y: cy + (10 * offsetY), size: 2, color: accentColor })
      page.drawCircle({ x: cx + (10 * offsetX), y: cy + (35 * offsetY), size: 2, color: accentColor })
    }
    
    drawBohoCorner(margin + 5, height - margin - 5, 1, -1)
    drawBohoCorner(width - margin - 5, height - margin - 5, -1, -1)
    drawBohoCorner(margin + 5, margin + 5, 1, 1)
    drawBohoCorner(width - margin - 5, margin + 5, -1, 1)
  }
}

// Draw decorative frame
export function drawDecorativeFrame(page, width, height, margin, colors, isDark = false) {
  const borderColor = isDark ? colors.accent : colors.secondary
  const innerColor = isDark ? colors.text : colors.primary
  
  // Outer frame
  page.drawRectangle({
    x: margin - 5,
    y: margin - 5,
    width: width - (margin * 2) + 10,
    height: height - (margin * 2) + 10,
    borderColor: borderColor,
    borderWidth: 1,
  })
  
  // Inner frame
  page.drawRectangle({
    x: margin + 10,
    y: margin + 10,
    width: width - (margin * 2) - 20,
    height: height - (margin * 2) - 20,
    borderColor: innerColor,
    borderWidth: 2,
  })
}

// Draw pattern background elements
export function drawPatternElements(page, width, height, colors, patternType, isDark = false) {
  const patternColor = isDark ? colors.secondary : colors.accent
  const primaryColor = isDark ? colors.accent : colors.primary
  
  if (patternType === 'geometric') {
    // Draw subtle geometric shapes
    for (let i = 0; i < 8; i++) {
      const x = (width / 8) * i + 30
      page.drawCircle({
        x: x,
        y: height - 50,
        size: 3,
        color: patternColor,
      })
      page.drawCircle({
        x: x,
        y: 50,
        size: 3,
        color: patternColor,
      })
    }
    // Add some geometric lines
    page.drawLine({
      start: { x: 60, y: height - 130 },
      end: { x: 100, y: height - 130 },
      thickness: 1,
      color: patternColor,
    })
    page.drawLine({
      start: { x: width - 100, y: height - 130 },
      end: { x: width - 60, y: height - 130 },
      thickness: 1,
      color: patternColor,
    })
  } else if (patternType === 'dots') {
    // Subtle dot pattern
    for (let y = 0; y < height; y += 40) {
      for (let x = 0; x < width; x += 40) {
        page.drawCircle({
          x: x + 20,
          y: y + 20,
          size: 1,
          color: patternColor,
        })
      }
    }
  } else if (patternType === 'watercolor') {
    // Soft watercolor effect - overlapping transparent circles
    const positions = [
      { x: 80, y: height - 80, size: 35 },
      { x: 120, y: height - 100, size: 25 },
      { x: 60, y: height - 130, size: 20 },
      { x: width - 80, y: height - 80, size: 35 },
      { x: width - 120, y: height - 100, size: 25 },
      { x: width - 60, y: height - 130, size: 20 },
      { x: 80, y: 80, size: 35 },
      { x: 120, y: 100, size: 25 },
      { x: 60, y: 130, size: 20 },
      { x: width - 80, y: 80, size: 35 },
      { x: width - 120, y: 100, size: 25 },
      { x: width - 60, y: 130, size: 20 },
    ]
    positions.forEach(pos => {
      page.drawCircle({
        x: pos.x,
        y: pos.y,
        size: pos.size,
        color: patternColor,
        opacity: 0.3,
      })
    })
  } else if (patternType === 'boho') {
    // Bohemian organic shapes - scattered circles and arcs
    const bohoElements = [
      { x: 70, y: height - 140, size: 8 },
      { x: 90, y: height - 155, size: 5 },
      { x: 55, y: height - 160, size: 3 },
      { x: width - 70, y: height - 140, size: 8 },
      { x: width - 90, y: height - 155, size: 5 },
      { x: width - 55, y: height - 160, size: 3 },
      { x: 70, y: 140, size: 8 },
      { x: 90, y: 155, size: 5 },
      { x: 55, y: 160, size: 3 },
      { x: width - 70, y: 140, size: 8 },
      { x: width - 90, y: 155, size: 5 },
      { x: width - 55, y: 160, size: 3 },
    ]
    bohoElements.forEach(el => {
      page.drawCircle({
        x: el.x,
        y: el.y,
        size: el.size,
        borderColor: primaryColor,
        borderWidth: 1,
      })
    })
    // Add some filled dots
    page.drawCircle({ x: 110, y: height - 145, size: 2, color: patternColor })
    page.drawCircle({ x: width - 110, y: height - 145, size: 2, color: patternColor })
    page.drawCircle({ x: 110, y: 145, size: 2, color: patternColor })
    page.drawCircle({ x: width - 110, y: 145, size: 2, color: patternColor })
  }
}

// Helper to detect if a color scheme is dark (needs light text)
function isDarkScheme(colors) {
  // Check if background is dark by looking at RGB values
  // colors.background is an rgb() object with r, g, b properties from pdf-lib
  const bg = colors.background
  // Estimate luminance - if low, it's a dark theme
  return (bg.red + bg.green + bg.blue) / 3 < 0.5
}

// Draw a beautiful cover page
export function drawCoverPage(page, options) {
  const { 
    width, 
    height, 
    title, 
    subtitle, 
    authorName,
    year,
    colors, 
    coverStyle,
    boldFont,
    regularFont,
    icon
  } = options
  
  const margin = 50
  const centerX = width / 2
  const isDark = isDarkScheme(colors)
  
  // Safe helper functions for complex scripts (Bengali, Hindi, etc.)
  const safeGetTextWidth = (text, font, fontSize) => {
    if (!text) return 0
    try {
      return font.widthOfTextAtSize(text, fontSize)
    } catch (e) {
      return text.length * fontSize * 0.55
    }
  }
  
  const safeDrawText = (pg, text, opts) => {
    if (!text) return true
    try {
      pg.drawText(text, opts)
      return true
    } catch (e) {
      try {
        let xOffset = 0
        for (let i = 0; i < text.length; i++) {
          try {
            pg.drawText(text[i], { ...opts, x: opts.x + xOffset })
            xOffset += safeGetTextWidth(text[i], opts.font, opts.size)
          } catch (charErr) {
            xOffset += opts.size * 0.5
          }
        }
        return true
      } catch (fallbackErr) {
        return false
      }
    }
  }
  
  // For dark themes, use light colors for text
  const titleColor = isDark ? colors.text : colors.primary
  const subtitleColor = isDark ? colors.accent : colors.secondary
  const decorColor = isDark ? colors.accent : colors.primary
  const yearColor = isDark ? colors.secondary : colors.accent
  
  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: colors.background,
  })
  
  // Top decorative band
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: isDark ? colors.secondary : colors.accent,
  })
  
  // Decorative line under band
  page.drawLine({
    start: { x: margin, y: height - 120 },
    end: { x: width - margin, y: height - 120 },
    thickness: 3,
    color: decorColor,
  })
  
  // Draw frame if style has it
  if (coverStyle?.hasFrame) {
    drawDecorativeFrame(page, width, height, margin, colors, isDark)
  }
  
  // Draw corner decorations
  if (coverStyle?.cornerStyle) {
    drawCornerDecorations(page, width, height, margin + 15, colors, coverStyle.cornerStyle, isDark)
  }
  
  // Draw pattern if style has it
  if (coverStyle?.hasPattern) {
    drawPatternElements(page, width, height, colors, coverStyle.patternType || 'geometric', isDark)
  }
  
  // Icon/emoji at top
  if (icon) {
    // Since pdf-lib doesn't support emoji directly, we'll skip this for now
    // In a real app, you'd embed an image here
  }
  
  // Main title with decorative elements
  const titleY = height / 2 + 80
  
  // Decorative line above title
  page.drawLine({
    start: { x: centerX - 100, y: titleY + 40 },
    end: { x: centerX + 100, y: titleY + 40 },
    thickness: 1,
    color: subtitleColor,
  })
  
  // Small decorative diamond
  page.drawLine({
    start: { x: centerX - 8, y: titleY + 40 },
    end: { x: centerX, y: titleY + 48 },
    thickness: 1,
    color: decorColor,
  })
  page.drawLine({
    start: { x: centerX, y: titleY + 48 },
    end: { x: centerX + 8, y: titleY + 40 },
    thickness: 1,
    color: decorColor,
  })
  page.drawLine({
    start: { x: centerX + 8, y: titleY + 40 },
    end: { x: centerX, y: titleY + 32 },
    thickness: 1,
    color: decorColor,
  })
  page.drawLine({
    start: { x: centerX, y: titleY + 32 },
    end: { x: centerX - 8, y: titleY + 40 },
    thickness: 1,
    color: decorColor,
  })
  
  // Title - centered (use text color for proper contrast)
  const titleWidth = safeGetTextWidth(title, boldFont, 32)
  safeDrawText(page, title, {
    x: centerX - titleWidth / 2,
    y: titleY,
    size: 32,
    font: boldFont,
    color: titleColor,
  })
  
  // Subtitle
  if (subtitle) {
    const subtitleWidth = safeGetTextWidth(subtitle, regularFont, 16)
    safeDrawText(page, subtitle, {
      x: centerX - subtitleWidth / 2,
      y: titleY - 35,
      size: 16,
      font: regularFont,
      color: subtitleColor,
    })
  }
  
  // Decorative line below title
  page.drawLine({
    start: { x: centerX - 80, y: titleY - 55 },
    end: { x: centerX + 80, y: titleY - 55 },
    thickness: 1,
    color: subtitleColor,
  })
  
  // Year removed per user request
  
  // Bottom decorative band
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 100,
    color: isDark ? colors.secondary : colors.accent,
  })
  
  // Decorative line at top of bottom band
  page.drawLine({
    start: { x: margin, y: 100 },
    end: { x: width - margin, y: 100 },
    thickness: 3,
    color: decorColor,
  })
  
  // Author name (without "by" prefix)
  if (authorName) {
    const authorWidth = safeGetTextWidth(authorName, boldFont, 18)
    safeDrawText(page, authorName, {
      x: centerX - authorWidth / 2,
      y: 55,
      size: 18,
      font: boldFont,
      color: titleColor,
    })
  }
  
  // Small branding at very bottom
  const brandText = 'Created with ProCreators'
  const brandWidth = safeGetTextWidth(brandText, regularFont, 9)
  safeDrawText(page, brandText, {
    x: centerX - brandWidth / 2,
    y: 15,
    size: 9,
    font: regularFont,
    color: subtitleColor,
  })
}

// Draw a section title page
export function drawSectionPage(page, options) {
  const { width, height, title, subtitle, colors, boldFont, regularFont, pageNumber } = options
  const centerX = width / 2
  const centerY = height / 2
  
  // Safe helper functions for complex scripts (Bengali, Hindi, etc.)
  const safeGetTextWidth = (text, font, fontSize) => {
    if (!text) return 0
    try {
      return font.widthOfTextAtSize(text, fontSize)
    } catch (e) {
      return text.length * fontSize * 0.55
    }
  }
  
  const safeDrawText = (pg, text, opts) => {
    if (!text) return true
    try {
      pg.drawText(text, opts)
      return true
    } catch (e) {
      try {
        let xOffset = 0
        for (let i = 0; i < text.length; i++) {
          try {
            pg.drawText(text[i], { ...opts, x: opts.x + xOffset })
            xOffset += safeGetTextWidth(text[i], opts.font, opts.size)
          } catch (charErr) {
            xOffset += opts.size * 0.5
          }
        }
        return true
      } catch (fallbackErr) {
        return false
      }
    }
  }
  
  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: colors.background,
  })
  
  // Decorative elements
  page.drawCircle({
    x: centerX,
    y: centerY + 80,
    size: 60,
    borderColor: colors.accent,
    borderWidth: 2,
  })
  
  page.drawCircle({
    x: centerX,
    y: centerY + 80,
    size: 50,
    borderColor: colors.secondary,
    borderWidth: 1,
  })
  
  // Section number or icon placeholder
  if (pageNumber) {
    const numText = pageNumber.toString()
    const numWidth = safeGetTextWidth(numText, boldFont, 28)
    safeDrawText(page, numText, {
      x: centerX - numWidth / 2,
      y: centerY + 70,
      size: 28,
      font: boldFont,
      color: colors.primary,
    })
  }
  
  // Title
  const titleWidth = safeGetTextWidth(title, boldFont, 28)
  safeDrawText(page, title, {
    x: centerX - titleWidth / 2,
    y: centerY - 20,
    size: 28,
    font: boldFont,
    color: colors.primary,
  })
  
  // Subtitle
  if (subtitle) {
    const subWidth = safeGetTextWidth(subtitle, regularFont, 14)
    safeDrawText(page, subtitle, {
      x: centerX - subWidth / 2,
      y: centerY - 50,
      size: 14,
      font: regularFont,
      color: colors.secondary,
    })
  }
  
  // Decorative line
  page.drawLine({
    start: { x: centerX - 60, y: centerY - 80 },
    end: { x: centerX + 60, y: centerY - 80 },
    thickness: 2,
    color: colors.accent,
  })
}

// Helper to get current year
export function getCurrentYear() {
  return new Date().getFullYear()
}

// Export paper sizes
export const PAPER_SIZES = {
  letter: { width: 612, height: 792, name: 'US Letter (8.5 x 11")' },
  a4: { width: 595, height: 842, name: 'A4 (210 x 297mm)' },
  a5: { width: 420, height: 595, name: 'A5 (148 x 210mm)' },
  square: { width: 612, height: 612, name: 'Square (8.5 x 8.5")' },
}
