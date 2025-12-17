// Standard Paper/Trim Sizes for Digital Products
// All dimensions in inches, converted to PDF points (1 inch = 72 points)

// ===== PAPERBACK SIZES =====
export const PAPERBACK_SIZES = {
  // Standard Novel/Fiction
  '5x8': { 
    id: '5x8', 
    name: '5" × 8"', 
    category: 'Novel/Fiction',
    inches: { width: 5, height: 8 },
    points: { width: 360, height: 576 },
    description: 'Popular for novels & fiction'
  },
  '5.06x7.81': { 
    id: '5.06x7.81', 
    name: '5.06" × 7.81"', 
    category: 'Novel/Fiction',
    inches: { width: 5.06, height: 7.81 },
    points: { width: 364, height: 562 },
    description: 'Pocket paperback'
  },
  '5.25x8': { 
    id: '5.25x8', 
    name: '5.25" × 8"', 
    category: 'Novel/Fiction',
    inches: { width: 5.25, height: 8 },
    points: { width: 378, height: 576 },
    description: 'Standard trade paperback'
  },
  '5.5x8.5': { 
    id: '5.5x8.5', 
    name: '5.5" × 8.5"', 
    category: 'Novel/Fiction',
    inches: { width: 5.5, height: 8.5 },
    points: { width: 396, height: 612 },
    description: 'Digest size - very popular'
  },
  '6x9': { 
    id: '6x9', 
    name: '6" × 9"', 
    category: 'Novel/Fiction',
    inches: { width: 6, height: 9 },
    points: { width: 432, height: 648 },
    description: 'US Trade - most popular'
  },
  '6.14x9.21': { 
    id: '6.14x9.21', 
    name: '6.14" × 9.21"', 
    category: 'Novel/Fiction',
    inches: { width: 6.14, height: 9.21 },
    points: { width: 442, height: 663 },
    description: 'Royal size'
  },
  
  // Large Format / Journals / Workbooks / Coloring Books
  '7x10': { 
    id: '7x10', 
    name: '7" × 10"', 
    category: 'Large Format',
    inches: { width: 7, height: 10 },
    points: { width: 504, height: 720 },
    description: 'Journals & workbooks'
  },
  '8x10': { 
    id: '8x10', 
    name: '8" × 10"', 
    category: 'Large Format',
    inches: { width: 8, height: 10 },
    points: { width: 576, height: 720 },
    description: 'Photo books & planners'
  },
  '8.5x11': { 
    id: '8.5x11', 
    name: '8.5" × 11"', 
    category: 'Large Format',
    inches: { width: 8.5, height: 11 },
    points: { width: 612, height: 792 },
    description: 'US Letter - worksheets'
  },
  'a4': { 
    id: 'a4', 
    name: '8.27" × 11.69" (A4)', 
    category: 'Large Format',
    inches: { width: 8.27, height: 11.69 },
    points: { width: 595, height: 842 },
    description: 'International standard'
  },
  
  // Square Formats
  '8.25x8.25': { 
    id: '8.25x8.25', 
    name: '8.25" × 8.25"', 
    category: 'Square',
    inches: { width: 8.25, height: 8.25 },
    points: { width: 594, height: 594 },
    description: 'Square - coloring books'
  },
  '8.5x8.5': { 
    id: '8.5x8.5', 
    name: '8.5" × 8.5"', 
    category: 'Square',
    inches: { width: 8.5, height: 8.5 },
    points: { width: 612, height: 612 },
    description: 'Large square format'
  },
  
  // Unique/Landscape
  '8.25x6': { 
    id: '8.25x6', 
    name: '8.25" × 6"', 
    category: 'Landscape',
    inches: { width: 8.25, height: 6 },
    points: { width: 594, height: 432 },
    description: 'Landscape/panoramic'
  },
}

// ===== HARDCOVER SIZES =====
export const HARDCOVER_SIZES = {
  // Standard Hardcover
  '5.5x8.5-hc': { 
    id: '5.5x8.5-hc', 
    name: '5.5" × 8.5"', 
    category: 'Standard Hardcover',
    inches: { width: 5.5, height: 8.5 },
    points: { width: 396, height: 612 },
    description: 'Standard hardcover'
  },
  '6x9-hc': { 
    id: '6x9-hc', 
    name: '6" × 9"', 
    category: 'Standard Hardcover',
    inches: { width: 6, height: 9 },
    points: { width: 432, height: 648 },
    description: 'Popular hardcover'
  },
  
  // Large Format Hardcover
  '6.14x9.21-hc': { 
    id: '6.14x9.21-hc', 
    name: '6.14" × 9.21"', 
    category: 'Large Hardcover',
    inches: { width: 6.14, height: 9.21 },
    points: { width: 442, height: 663 },
    description: 'Royal hardcover'
  },
  '7x10-hc': { 
    id: '7x10-hc', 
    name: '7" × 10"', 
    category: 'Large Hardcover',
    inches: { width: 7, height: 10 },
    points: { width: 504, height: 720 },
    description: 'Large format hardcover'
  },
  '8.5x11-hc': { 
    id: '8.5x11-hc', 
    name: '8.5" × 11"', 
    category: 'Large Hardcover',
    inches: { width: 8.5, height: 11 },
    points: { width: 612, height: 792 },
    description: 'Letter size hardcover'
  },
  '8.25x8.5-hc': { 
    id: '8.25x8.5-hc', 
    name: '8.25" × 8.5"', 
    category: 'Large Hardcover',
    inches: { width: 8.25, height: 8.5 },
    points: { width: 594, height: 612 },
    description: 'Near-square hardcover'
  },
}

// ===== GROUPED SIZES BY USE CASE =====

// For Ebooks & Novels
export const EBOOK_SIZES = [
  PAPERBACK_SIZES['5x8'],
  PAPERBACK_SIZES['5.25x8'],
  PAPERBACK_SIZES['5.5x8.5'],
  PAPERBACK_SIZES['6x9'],
  PAPERBACK_SIZES['6.14x9.21'],
]

// For Planners & Journals
export const PLANNER_SIZES = [
  PAPERBACK_SIZES['5.5x8.5'],
  PAPERBACK_SIZES['6x9'],
  PAPERBACK_SIZES['7x10'],
  PAPERBACK_SIZES['8x10'],
  PAPERBACK_SIZES['8.5x11'],
  PAPERBACK_SIZES['a4'],
]

// For Coloring Books
export const COLORING_BOOK_SIZES = [
  PAPERBACK_SIZES['8x10'],
  PAPERBACK_SIZES['8.5x11'],
  PAPERBACK_SIZES['8.25x8.25'],
  PAPERBACK_SIZES['8.5x8.5'],
  PAPERBACK_SIZES['a4'],
]

// For Workbooks & Worksheets
export const WORKBOOK_SIZES = [
  PAPERBACK_SIZES['7x10'],
  PAPERBACK_SIZES['8x10'],
  PAPERBACK_SIZES['8.5x11'],
  PAPERBACK_SIZES['a4'],
]

// For Checklists & Trackers
export const CHECKLIST_SIZES = [
  PAPERBACK_SIZES['5.5x8.5'],
  PAPERBACK_SIZES['6x9'],
  PAPERBACK_SIZES['8.5x11'],
  PAPERBACK_SIZES['a4'],
]

// For Recipe Books
export const RECIPE_BOOK_SIZES = [
  PAPERBACK_SIZES['6x9'],
  PAPERBACK_SIZES['7x10'],
  PAPERBACK_SIZES['8x10'],
  PAPERBACK_SIZES['8.5x11'],
  PAPERBACK_SIZES['8.25x8.25'],
]

// All sizes combined for tools that support all formats
export const ALL_SIZES = [
  ...Object.values(PAPERBACK_SIZES),
]

// Helper function to get size by ID
export function getSizeById(sizeId) {
  return PAPERBACK_SIZES[sizeId] || HARDCOVER_SIZES[sizeId] || PAPERBACK_SIZES['6x9']
}

// Helper function to get points dimensions
export function getSizePoints(sizeId) {
  const size = getSizeById(sizeId)
  return size.points
}

// Helper to format size options for Select component
export function formatSizeOptions(sizes) {
  // Group by category
  const grouped = {}
  sizes.forEach(size => {
    if (!grouped[size.category]) {
      grouped[size.category] = []
    }
    grouped[size.category].push(size)
  })
  return grouped
}
