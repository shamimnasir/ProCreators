// Shared PDF Design Utilities
// Beautiful cover designs, color schemes, and decorative elements for all PDF tools

import { rgb } from 'pdf-lib'

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
  const titleWidth = boldFont.widthOfTextAtSize(title, 32)
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: titleY,
    size: 32,
    font: boldFont,
    color: titleColor,
  })
  
  // Subtitle
  if (subtitle) {
    const subtitleWidth = regularFont.widthOfTextAtSize(subtitle, 16)
    page.drawText(subtitle, {
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
  
  // Year (if provided)
  if (year) {
    const yearText = year.toString()
    const yearWidth = boldFont.widthOfTextAtSize(yearText, 48)
    page.drawText(yearText, {
      x: centerX - yearWidth / 2,
      y: height / 2 - 30,
      size: 48,
      font: boldFont,
      color: yearColor,
    })
  }
  
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
  
  // Author name
  if (authorName) {
    const byText = 'by'
    const byWidth = regularFont.widthOfTextAtSize(byText, 12)
    page.drawText(byText, {
      x: centerX - byWidth / 2,
      y: 70,
      size: 12,
      font: regularFont,
      color: subtitleColor,
    })
    
    const authorWidth = boldFont.widthOfTextAtSize(authorName, 18)
    page.drawText(authorName, {
      x: centerX - authorWidth / 2,
      y: 45,
      size: 18,
      font: boldFont,
      color: titleColor,
    })
  }
  
  // Small branding at very bottom
  const brandText = 'Created with ProCreators'
  const brandWidth = regularFont.widthOfTextAtSize(brandText, 9)
  page.drawText(brandText, {
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
    const numWidth = boldFont.widthOfTextAtSize(numText, 28)
    page.drawText(numText, {
      x: centerX - numWidth / 2,
      y: centerY + 70,
      size: 28,
      font: boldFont,
      color: colors.primary,
    })
  }
  
  // Title
  const titleWidth = boldFont.widthOfTextAtSize(title, 28)
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: centerY - 20,
    size: 28,
    font: boldFont,
    color: colors.primary,
  })
  
  // Subtitle
  if (subtitle) {
    const subWidth = regularFont.widthOfTextAtSize(subtitle, 14)
    page.drawText(subtitle, {
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
