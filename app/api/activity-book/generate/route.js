import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getCollection } from '@/lib/mongodb'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

// Activity Generation Functions
const ACTIVITY_GENERATORS = {
  'word-search': generateWordSearch,
  'crossword': generateCrossword,
  'sudoku': generateSudoku,
  'maze': generateMaze,
  'spot-difference': generateSpotDifference,
  'connect-dots': generateConnectDots,
  'math': generateMathProblems,
  'spelling': generateSpellingActivity,
  'tracing': generateTracingActivity,
  'matching': generateMatchingActivity,
  'counting': generateCountingActivity,
  'patterns': generatePatternActivity,
  'would-you-rather': generateWouldYouRather,
  'trivia': generateTrivia,
  'tic-tac-toe': generateTicTacToe,
  'hangman': generateHangman,
  'bingo': generateBingo,
  'travel-games': generateTravelGames,
  'color-by-number': generateColorByNumber,
  'doodle-complete': generateDoodleComplete,
  'drawing-prompts': generateDrawingPrompts,
  'connect-color': generateConnectColor,
  'logic-puzzle': generateLogicPuzzle,
  'riddles': generateRiddles,
  'maze-complex': generateComplexMaze,
  'memory': generateMemoryGame,
  'sequences': generateSequences,
  'visual-puzzles': generateVisualPuzzles
}

// Helper: Run LLM via Python script
async function runLLM(prompt, systemPrompt = '') {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'llm_call.py')
    
    const inputData = JSON.stringify({
      prompt,
      system_prompt: systemPrompt || 'You are a creative activity book creator. Generate engaging, age-appropriate content.'
    })
    
    const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
      env: { ...process.env }
    })
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('LLM call error:', stderr)
        resolve({ success: false, error: stderr })
        return
      }
      
      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (error) {
        resolve({ success: false, error: 'Failed to parse LLM response' })
      }
    })
    
    pythonProcess.on('error', (error) => {
      resolve({ success: false, error: error.message })
    })
    
    setTimeout(() => {
      pythonProcess.kill()
      resolve({ success: false, error: 'LLM call timed out' })
    }, 60000)
  })
}

// Generate cover image using Nano Banana
async function generateCoverImage(theme, customTheme, primaryColor, customCoverPrompt) {
  return new Promise((resolve) => {
    try {
      const themeDesc = customTheme || theme
      
      const fullPrompt = customCoverPrompt 
        ? `${customCoverPrompt}. Professional activity book cover, vibrant colors, fun and engaging design for children.`
        : `Fun and colorful activity book cover for "${themeDesc}" theme. Playful design with puzzles, games, and educational elements. Bright vibrant colors, child-friendly illustration style, professional book cover quality, no text on the image.`
      
      console.log(`Generating cover: ${fullPrompt.substring(0, 80)}...`)
      
      const scriptPath = path.join(process.cwd(), 'scripts', 'generate_image_nano_banana.py')
      
      const inputData = JSON.stringify({
        prompt: fullPrompt,
        model: 'models/nano-banana-pro-preview'
      })
      
      const pythonProcess = spawn('/root/.venv/bin/python3', [scriptPath, inputData], {
        env: { ...process.env }
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Cover generation error:', stderr)
          resolve({ success: false, imageUrl: null, error: stderr })
          return
        }
        
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          resolve({ success: false, imageUrl: null, error: 'Failed to parse response' })
        }
      })
      
      pythonProcess.on('error', (error) => {
        resolve({ success: false, imageUrl: null, error: error.message })
      })
      
      setTimeout(() => {
        pythonProcess.kill()
        resolve({ success: false, imageUrl: null, error: 'Cover generation timed out' })
      }, 45000)
      
    } catch (error) {
      resolve({ success: false, imageUrl: null, error: error.message })
    }
  })
}

// Activity Generator Functions
function generateWordSearch(theme, difficulty, ageGroup) {
  const sizes = { easy: 8, medium: 12, hard: 15 }
  const gridSize = sizes[difficulty] || 10
  
  // Theme-based words
  const themeWords = {
    animals: ['CAT', 'DOG', 'LION', 'TIGER', 'BEAR', 'FISH', 'BIRD', 'FROG', 'SNAKE', 'HORSE'],
    nature: ['TREE', 'FLOWER', 'RIVER', 'MOUNTAIN', 'FOREST', 'OCEAN', 'SUN', 'CLOUD', 'RAIN', 'LEAF'],
    space: ['STAR', 'MOON', 'PLANET', 'ROCKET', 'COMET', 'SUN', 'EARTH', 'MARS', 'ORBIT', 'ALIEN'],
    ocean: ['FISH', 'WHALE', 'SHARK', 'CORAL', 'WAVE', 'SHELL', 'CRAB', 'SEAL', 'DOLPHIN', 'OCTOPUS'],
    dinosaurs: ['TREX', 'RAPTOR', 'FOSSIL', 'BONE', 'CLAW', 'TEETH', 'SCALE', 'TAIL', 'HORN', 'EGG'],
    vehicles: ['CAR', 'TRUCK', 'PLANE', 'TRAIN', 'BOAT', 'BUS', 'BIKE', 'TAXI', 'SHIP', 'VAN'],
    food: ['PIZZA', 'APPLE', 'BREAD', 'MILK', 'EGGS', 'RICE', 'SOUP', 'CAKE', 'PIE', 'FRUIT']
  }
  
  const words = (themeWords[theme] || themeWords.animals).slice(0, difficulty === 'easy' ? 6 : difficulty === 'hard' ? 10 : 8)
  
  // Generate simple grid (placeholder - in real implementation, would place words)
  const grid = Array(gridSize).fill(null).map(() => 
    Array(gridSize).fill(null).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
  )
  
  return {
    type: 'word-search',
    grid,
    words,
    gridSize,
    instructions: `Find and circle these ${words.length} hidden words in the grid!`
  }
}

function generateCrossword(theme, difficulty, ageGroup) {
  return {
    type: 'crossword',
    clues: {
      across: [
        { number: 1, clue: 'A large animal with a mane', answer: 'LION', row: 0, col: 0 },
        { number: 3, clue: 'Man\'s best friend', answer: 'DOG', row: 2, col: 1 }
      ],
      down: [
        { number: 1, clue: 'Has spots and a long neck', answer: 'GIRAFFE', row: 0, col: 0 },
        { number: 2, clue: 'Lives in the ocean', answer: 'FISH', row: 0, col: 3 }
      ]
    },
    gridSize: difficulty === 'easy' ? 8 : difficulty === 'hard' ? 15 : 12,
    instructions: 'Fill in the crossword puzzle using the clues below!'
  }
}

function generateSudoku(theme, difficulty, ageGroup) {
  // For kids, use smaller grids or picture sudoku
  const isKids = ['toddler', 'preschool', 'early'].includes(ageGroup)
  const size = isKids ? 4 : (difficulty === 'easy' ? 6 : 9)
  
  // Generate a valid sudoku grid (simplified)
  const grid = Array(size).fill(null).map(() => Array(size).fill(0))
  
  return {
    type: 'sudoku',
    grid,
    size,
    theme: isKids ? theme : 'numbers',
    instructions: isKids 
      ? `Fill in each row and column with different ${theme} pictures!`
      : `Fill in the grid so each row, column, and box contains the numbers 1-${size}.`
  }
}

function generateMaze(theme, difficulty, ageGroup) {
  const sizes = { easy: 8, medium: 15, hard: 25 }
  const size = sizes[difficulty] || 12
  
  return {
    type: 'maze',
    size,
    start: { x: 0, y: 0 },
    end: { x: size - 1, y: size - 1 },
    theme,
    instructions: `Help the ${theme === 'animals' ? 'lost animal' : 'explorer'} find their way through the maze!`
  }
}

function generateSpotDifference(theme, difficulty, ageGroup) {
  const differences = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10
  
  return {
    type: 'spot-difference',
    differences,
    theme,
    instructions: `Can you spot all ${differences} differences between these two pictures?`
  }
}

function generateConnectDots(theme, difficulty, ageGroup) {
  const dots = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 100 : 50
  
  return {
    type: 'connect-dots',
    dots,
    theme,
    instructions: `Connect the dots from 1 to ${dots} to reveal a surprise ${theme} picture!`
  }
}

function generateMathProblems(theme, difficulty, ageGroup) {
  const operations = {
    toddler: ['+'],
    preschool: ['+', '-'],
    early: ['+', '-'],
    kids: ['+', '-', '×'],
    teens: ['+', '-', '×', '÷'],
    adults: ['+', '-', '×', '÷']
  }
  
  const maxNum = {
    toddler: 5,
    preschool: 10,
    early: 20,
    kids: 50,
    teens: 100,
    adults: 1000
  }
  
  const problems = []
  const ops = operations[ageGroup] || operations.kids
  const max = maxNum[ageGroup] || maxNum.kids
  const count = difficulty === 'easy' ? 8 : difficulty === 'hard' ? 20 : 12
  
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    const a = Math.floor(Math.random() * max) + 1
    const b = Math.floor(Math.random() * (max / 2)) + 1
    problems.push({ a, op, b, answer: eval(`${a} ${op === '×' ? '*' : op === '÷' ? '/' : op} ${b}`) })
  }
  
  return {
    type: 'math',
    problems,
    theme,
    instructions: 'Solve these math problems!'
  }
}

function generateSpellingActivity(theme, difficulty, ageGroup) {
  return {
    type: 'spelling',
    words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO'],
    scrambled: ['LEPPA', 'NANABA', 'GERNAO', 'PRAGE', 'GMANO'],
    instructions: 'Unscramble these words!'
  }
}

function generateTracingActivity(theme, difficulty, ageGroup) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const numbers = '0123456789'.split('')
  
  return {
    type: 'tracing',
    items: ageGroup === 'toddler' ? letters.slice(0, 5) : letters.slice(0, 10),
    instructions: 'Trace each letter carefully!'
  }
}

function generateMatchingActivity(theme, difficulty, ageGroup) {
  const pairs = {
    animals: [['Cat', '🐱'], ['Dog', '🐕'], ['Bird', '🐦'], ['Fish', '🐟']],
    food: [['Apple', '🍎'], ['Pizza', '🍕'], ['Ice Cream', '🍦'], ['Cake', '🎂']]
  }
  
  return {
    type: 'matching',
    pairs: pairs[theme] || pairs.animals,
    instructions: 'Draw lines to match each word with its picture!'
  }
}

function generateCountingActivity(theme, difficulty, ageGroup) {
  return {
    type: 'counting',
    items: ['🌟', '🌟🌟🌟', '🌟🌟', '🌟🌟🌟🌟🌟', '🌟🌟🌟🌟'],
    answers: [1, 3, 2, 5, 4],
    instructions: 'Count the items and write the number!'
  }
}

function generatePatternActivity(theme, difficulty, ageGroup) {
  return {
    type: 'patterns',
    patterns: [
      { sequence: ['🔴', '🔵', '🔴', '🔵', '?'], answer: '🔴' },
      { sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '?'], answer: '🌙' }
    ],
    instructions: 'What comes next in each pattern?'
  }
}

function generateWouldYouRather(theme, difficulty, ageGroup) {
  const questions = {
    animals: [
      'Would you rather have a pet dragon or a pet unicorn?',
      'Would you rather swim like a dolphin or fly like an eagle?',
      'Would you rather be able to talk to animals or speak every human language?'
    ],
    food: [
      'Would you rather only eat pizza or only eat ice cream for a week?',
      'Would you rather have a chocolate fountain or a pizza vending machine at home?'
    ],
    travel: [
      'Would you rather visit outer space or the bottom of the ocean?',
      'Would you rather travel by magic carpet or teleportation?'
    ]
  }
  
  return {
    type: 'would-you-rather',
    questions: questions[theme] || questions.animals,
    instructions: 'Circle your choice and explain why!'
  }
}

function generateTrivia(theme, difficulty, ageGroup) {
  return {
    type: 'trivia',
    questions: [
      { q: 'What is the largest animal?', a: 'Blue Whale', options: ['Elephant', 'Blue Whale', 'Giraffe'] },
      { q: 'How many legs does a spider have?', a: '8', options: ['6', '8', '10'] }
    ],
    instructions: 'Circle the correct answer for each question!'
  }
}

function generateTicTacToe(theme, difficulty, ageGroup) {
  return {
    type: 'tic-tac-toe',
    grids: 6,
    instructions: 'Play Tic-Tac-Toe with a friend! Take turns placing X and O.'
  }
}

function generateHangman(theme, difficulty, ageGroup) {
  const words = {
    animals: ['ELEPHANT', 'PENGUIN', 'DOLPHIN', 'BUTTERFLY'],
    space: ['ASTEROID', 'SATELLITE', 'GALAXY', 'NEBULA']
  }
  
  return {
    type: 'hangman',
    words: words[theme] || words.animals,
    instructions: 'Guess the letters to complete each word before the hangman is drawn!'
  }
}

function generateBingo(theme, difficulty, ageGroup) {
  return {
    type: 'bingo',
    cards: 4,
    theme,
    instructions: 'Use these bingo cards to play with friends and family!'
  }
}

function generateTravelGames(theme, difficulty, ageGroup) {
  return {
    type: 'travel-games',
    games: ['I Spy checklist', 'License Plate Game', 'Road Trip Scavenger Hunt'],
    instructions: 'Fun games to play on your next trip!'
  }
}

function generateColorByNumber(theme, difficulty, ageGroup) {
  return {
    type: 'color-by-number',
    colors: { 1: 'Red', 2: 'Blue', 3: 'Green', 4: 'Yellow', 5: 'Orange' },
    theme,
    instructions: 'Color each numbered section with the matching color!'
  }
}

function generateDoodleComplete(theme, difficulty, ageGroup) {
  return {
    type: 'doodle-complete',
    prompts: ['Complete the face', 'Add details to the house', 'Finish the animal'],
    instructions: 'Use your imagination to complete each doodle!'
  }
}

function generateDrawingPrompts(theme, difficulty, ageGroup) {
  return {
    type: 'drawing-prompts',
    prompts: [
      'Draw your favorite animal',
      'Draw a house you would like to live in',
      'Draw what you want to be when you grow up'
    ],
    instructions: 'Draw what the prompt asks in the box below!'
  }
}

function generateConnectColor(theme, difficulty, ageGroup) {
  return {
    type: 'connect-color',
    dots: 30,
    theme,
    instructions: 'Connect the dots and then color the picture!'
  }
}

function generateLogicPuzzle(theme, difficulty, ageGroup) {
  return {
    type: 'logic-puzzle',
    puzzle: {
      clues: ['The red car is not first', 'The blue car is before the green car'],
      items: ['Red Car', 'Blue Car', 'Green Car']
    },
    instructions: 'Use the clues to figure out the correct order!'
  }
}

function generateRiddles(theme, difficulty, ageGroup) {
  const riddles = [
    { riddle: "I have hands but can't clap. What am I?", answer: 'A clock' },
    { riddle: "What has ears but cannot hear?", answer: 'Corn' },
    { riddle: "What gets wetter the more it dries?", answer: 'A towel' }
  ]
  
  return {
    type: 'riddles',
    riddles,
    instructions: 'Can you solve these brain-teasing riddles?'
  }
}

function generateComplexMaze(theme, difficulty, ageGroup) {
  return {
    type: 'maze-complex',
    size: 30,
    multiPath: true,
    instructions: 'Find the one true path through this challenging maze!'
  }
}

function generateMemoryGame(theme, difficulty, ageGroup) {
  return {
    type: 'memory',
    pairs: 8,
    theme,
    instructions: 'Cut out these cards and play memory match!'
  }
}

function generateSequences(theme, difficulty, ageGroup) {
  return {
    type: 'sequences',
    sequences: [
      { pattern: [2, 4, 6, 8, '?'], answer: 10 },
      { pattern: [1, 3, 5, 7, '?'], answer: 9 },
      { pattern: [5, 10, 15, 20, '?'], answer: 25 }
    ],
    instructions: 'Find the pattern and fill in the missing number!'
  }
}

function generateVisualPuzzles(theme, difficulty, ageGroup) {
  return {
    type: 'visual-puzzles',
    puzzles: ['Which shape doesn\'t belong?', 'Find the hidden object'],
    instructions: 'Look carefully to solve these visual puzzles!'
  }
}

// Helper: Convert hex color to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0.1, 0.3, 0.7)
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  )
}

// Strip emojis from text
function stripEmojis(text) {
  if (!text) return ''
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]/gu, '').trim()
}

// Get image bytes
async function getImageBytes(imageUrl) {
  if (!imageUrl) throw new Error('No image URL provided')
  
  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) throw new Error('Invalid base64 data URL format')
    const format = matches[1]
    const base64Data = matches[2]
    const imageBytes = Buffer.from(base64Data, 'base64')
    return { imageBytes: new Uint8Array(imageBytes), format }
  }
  
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  const format = contentType.includes('png') ? 'png' : 'jpeg'
  const arrayBuffer = await response.arrayBuffer()
  return { imageBytes: new Uint8Array(arrayBuffer), format }
}

// Main API Handler
export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'generate-pages') {
      return await generateActivityPages(body)
    } else if (action === 'generate-pdf') {
      return await generateActivityPDF(body)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Activity book generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate activity book' },
      { status: 500 }
    )
  }
}

// Generate activity page content
async function generateActivityPages(body) {
  const {
    activityType,
    selectedActivities,
    theme,
    customTheme,
    ageGroup,
    pageCount,
    bookTitle
  } = body
  
  const themeToUse = customTheme || theme
  const activities = selectedActivities && selectedActivities.length > 0 
    ? selectedActivities 
    : Object.keys(ACTIVITY_GENERATORS)
  
  console.log(`Generating ${pageCount} activity pages for ${themeToUse} theme, age group: ${ageGroup}`)
  
  const pages = []
  
  // Distribute activities across pages
  for (let i = 0; i < pageCount; i++) {
    const activityId = activities[i % activities.length]
    const generator = ACTIVITY_GENERATORS[activityId]
    
    if (generator) {
      const difficulty = i < pageCount / 3 ? 'easy' : i < (pageCount * 2) / 3 ? 'medium' : 'hard'
      const content = generator(themeToUse, difficulty, ageGroup)
      
      pages.push({
        title: getActivityTitle(activityId, themeToUse, i + 1),
        activityType: activityId,
        description: content.instructions || 'Complete this fun activity!',
        difficulty,
        content
      })
    } else {
      pages.push({
        title: `Activity ${i + 1}`,
        activityType: 'puzzle',
        description: 'Complete this fun activity!',
        difficulty: 'medium',
        content: { type: 'custom' }
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    pages,
    pageCount: pages.length
  })
}

// Get creative activity title
function getActivityTitle(activityId, theme, pageNum) {
  const titles = {
    'word-search': `${theme} Word Search #${Math.ceil(pageNum / 3)}`,
    'crossword': `${theme} Crossword Puzzle`,
    'sudoku': `Number Fun Sudoku`,
    'maze': `${theme} Adventure Maze`,
    'spot-difference': `Spot the Differences`,
    'connect-dots': `Connect the Dots Surprise`,
    'math': `Math Challenge`,
    'spelling': `Spelling Fun`,
    'tracing': `Letter & Number Tracing`,
    'matching': `Match It Up!`,
    'counting': `Counting Activity`,
    'patterns': `Pattern Detective`,
    'would-you-rather': `Would You Rather?`,
    'trivia': `${theme} Trivia Time`,
    'tic-tac-toe': `Tic-Tac-Toe Games`,
    'hangman': `Guess the Word`,
    'bingo': `${theme} Bingo`,
    'travel-games': `Travel Fun Games`,
    'color-by-number': `Color By Number`,
    'doodle-complete': `Complete the Doodle`,
    'drawing-prompts': `Draw It!`,
    'connect-color': `Connect & Color`,
    'logic-puzzle': `Logic Challenge`,
    'riddles': `Riddle Me This!`,
    'maze-complex': `Super Maze Challenge`,
    'memory': `Memory Match Cards`,
    'sequences': `Number Sequences`,
    'visual-puzzles': `Visual Brain Teasers`
  }
  
  return titles[activityId] || `Activity ${pageNum}`
}

// Generate PDF
async function generateActivityPDF(body) {
  const {
    pages,
    title,
    authorName,
    primaryColor,
    secondaryColor,
    generateCover,
    customCoverPrompt,
    paperSize,
    useBleed,
    theme,
    customTheme,
    includeAnswers,
    ageGroup
  } = body
  
  const cleanTitle = stripEmojis(title) || 'Activity Book'
  const cleanAuthor = stripEmojis(authorName) || ''
  const cleanTheme = stripEmojis(customTheme || theme) || 'Fun'
  
  console.log(`Creating Activity Book PDF: ${cleanTitle}, ${pages.length} pages`)
  
  // Create PDF
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Page dimensions
  const baseWidth = paperSize?.width || 612
  const baseHeight = paperSize?.height || 792
  const bleedPoints = useBleed ? 9 : 0
  const pageWidth = baseWidth + (bleedPoints * 2)
  const pageHeight = baseHeight + (bleedPoints * 2)
  
  // Colors
  const pColor = hexToRgb(primaryColor || '#1e40af')
  const sColor = hexToRgb(secondaryColor || '#3b82f6')
  
  // Generate cover image
  let coverImageUrl = null
  if (generateCover !== false) {
    console.log('Generating cover image...')
    const coverResult = await generateCoverImage(theme, customTheme, primaryColor, customCoverPrompt)
    if (coverResult.success && coverResult.imageUrl) {
      coverImageUrl = coverResult.imageUrl
      console.log('Cover image generated successfully')
    }
  }
  
  // ===== COVER PAGE =====
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  
  if (coverImageUrl) {
    try {
      const { imageBytes, format } = await getImageBytes(coverImageUrl)
      let embeddedImage = format === 'png' 
        ? await pdfDoc.embedPng(imageBytes) 
        : await pdfDoc.embedJpg(imageBytes)
      
      // Calculate image dimensions to maintain aspect ratio (cover/fill strategy)
      const imgWidth = embeddedImage.width
      const imgHeight = embeddedImage.height
      const imgAspect = imgWidth / imgHeight
      const pageAspect = pageWidth / pageHeight
      
      let drawWidth, drawHeight, drawX, drawY
      
      if (imgAspect > pageAspect) {
        // Image is wider - fit by height and crop sides
        drawHeight = pageHeight
        drawWidth = pageHeight * imgAspect
        drawX = (pageWidth - drawWidth) / 2
        drawY = 0
      } else {
        // Image is taller - fit by width and crop top/bottom
        drawWidth = pageWidth
        drawHeight = pageWidth / imgAspect
        drawX = 0
        drawY = (pageHeight - drawHeight) / 2
      }
      
      page.drawImage(embeddedImage, {
        x: drawX, y: drawY,
        width: drawWidth, height: drawHeight
      })
      
      // Title bar at bottom
      const hasAuthor = cleanAuthor.length > 0
      const barHeight = hasAuthor ? 90 : 70
      const barY = 40
      
      page.drawRectangle({
        x: 0, y: barY,
        width: pageWidth, height: barHeight,
        color: rgb(0, 0, 0),
        opacity: 0.75
      })
      
      // Title
      const titleFontSize = Math.min(28, 480 / cleanTitle.length)
      page.drawText(cleanTitle.toUpperCase(), {
        x: (pageWidth - cleanTitle.length * titleFontSize * 0.55) / 2,
        y: barY + (hasAuthor ? barHeight - 40 : barHeight / 2 - 8),
        size: titleFontSize,
        font: boldFont,
        color: rgb(1, 1, 1)
      })
      
      if (hasAuthor) {
        const authorFontSize = 14
        page.drawText(cleanAuthor, {
          x: (pageWidth - cleanAuthor.length * authorFontSize * 0.55) / 2,
          y: barY + 20,
          size: authorFontSize,
          font,
          color: rgb(0.85, 0.85, 0.85)
        })
      }
    } catch (imgError) {
      console.error('Failed to embed cover image:', imgError.message)
      drawTextCover(page, pageWidth, pageHeight, cleanTitle, pages.length, cleanAuthor, pColor, sColor, boldFont, font)
    }
  } else {
    drawTextCover(page, pageWidth, pageHeight, cleanTitle, pages.length, cleanAuthor, pColor, sColor, boldFont, font)
  }
  
  // ===== ACTIVITY PAGES =====
  for (let i = 0; i < pages.length; i++) {
    const pageData = pages[i]
    page = pdfDoc.addPage([pageWidth, pageHeight])
    
    // White background
    page.drawRectangle({
      x: 0, y: 0,
      width: pageWidth, height: pageHeight,
      color: rgb(1, 1, 1)
    })
    
    const margin = bleedPoints + 40
    
    // Header with decorative border
    page.drawRectangle({
      x: margin, y: pageHeight - 70 - bleedPoints,
      width: pageWidth - (margin * 2), height: 60,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: pColor,
      borderWidth: 2
    })
    
    // Accent bar
    page.drawRectangle({
      x: margin, y: pageHeight - bleedPoints - 12,
      width: pageWidth - (margin * 2), height: 8,
      color: pColor
    })
    
    // Page title
    const pageTitle = stripEmojis(pageData.title) || `Activity ${i + 1}`
    const titleFontSize = Math.min(20, 400 / pageTitle.length)
    page.drawText(pageTitle, {
      x: margin + 20,
      y: pageHeight - 50 - bleedPoints,
      size: titleFontSize,
      font: boldFont,
      color: pColor
    })
    
    // Decorative circles
    page.drawCircle({ x: pageWidth - margin - 25, y: pageHeight - 40 - bleedPoints, size: 12, color: sColor })
    page.drawCircle({ x: pageWidth - margin - 25, y: pageHeight - 40 - bleedPoints, size: 6, color: rgb(1, 1, 1) })
    
    // Instructions
    const instructions = stripEmojis(pageData.description) || 'Complete this activity!'
    page.drawText(instructions, {
      x: margin + 10,
      y: pageHeight - 95 - bleedPoints,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3)
    })
    
    // Activity content area
    const contentY = pageHeight - 130 - bleedPoints
    const contentHeight = contentY - margin - 50
    
    page.drawRectangle({
      x: margin, y: margin + 50,
      width: pageWidth - (margin * 2), height: contentHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1
    })
    
    // Draw activity-specific content
    await drawActivityContent(page, pageData, margin, margin + 50, pageWidth - (margin * 2), contentHeight, font, boldFont, pColor, sColor)
    
    // Page number
    page.drawCircle({
      x: pageWidth / 2,
      y: bleedPoints + 25,
      size: 15,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: sColor,
      borderWidth: 1
    })
    page.drawText(`${i + 1}`, {
      x: pageWidth / 2 - (i + 1 >= 10 ? 6 : 3),
      y: bleedPoints + 20,
      size: 12,
      font: boldFont,
      color: pColor
    })
  }
  
  // ===== ANSWER KEY (if enabled) =====
  if (includeAnswers) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    
    page.drawRectangle({
      x: 0, y: 0,
      width: pageWidth, height: pageHeight,
      color: rgb(0.98, 0.98, 0.98)
    })
    
    page.drawText('ANSWER KEY', {
      x: pageWidth / 2 - 60,
      y: pageHeight - 60,
      size: 24,
      font: boldFont,
      color: pColor
    })
    
    let answerY = pageHeight - 100
    for (let i = 0; i < Math.min(pages.length, 20); i++) {
      const pageData = pages[i]
      if (pageData.content && pageData.content.answer) {
        page.drawText(`Page ${i + 1}: ${pageData.title}`, {
          x: 50,
          y: answerY,
          size: 10,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3)
        })
        answerY -= 20
      }
    }
    
    page.drawText('Answers vary for creative activities!', {
      x: 50,
      y: answerY - 20,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5)
    })
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save()
  
  const outputDir = '/app/public/activity-books'
  await fs.mkdir(outputDir, { recursive: true })
  
  const fileName = `${randomUUID()}.pdf`
  const filePath = path.join(outputDir, fileName)
  await fs.writeFile(filePath, pdfBytes)
  
  // Save to library
  const libraryCollection = await getCollection('library')
  const documentId = randomUUID()
  
  await libraryCollection.insertOne({
    id: documentId,
    userId: 'default-user',
    type: 'activity-book',
    category: 'document',
    title: cleanTitle,
    description: `${pages.length} page activity book - ${cleanTheme} theme`,
    filePath: `/activity-books/${fileName}`,
    fileSize: pdfBytes.length,
    tool: 'activity-book',
    metadata: {
      theme: cleanTheme,
      pageCount: pages.length,
      primaryColor,
      secondaryColor,
      paperSize: paperSize?.name || '8.5" × 11"',
      kdpCompliant: pages.length >= 24,
      hasAnswerKey: includeAnswers,
      ageGroup
    },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })
  
  console.log(`Activity book generated: ${filePath}`)
  
  return NextResponse.json({
    success: true,
    title: cleanTitle,
    downloadUrl: `/activity-books/${fileName}`,
    pageCount: pages.length + (includeAnswers ? 1 : 0) + 1, // +1 for cover, +1 for answers if enabled
    libraryId: documentId
  })
}

// Draw text-based cover
function drawTextCover(page, pageWidth, pageHeight, title, pageCount, authorName, pColor, sColor, boldFont, font) {
  // Gradient-like background
  page.drawRectangle({
    x: 0, y: 0,
    width: pageWidth, height: pageHeight,
    color: rgb(0.95, 0.97, 1)
  })
  
  // Decorative shapes
  const decorColors = [
    rgb(0.95, 0.8, 0.4),   // Yellow
    rgb(0.5, 0.8, 0.95),   // Blue
    rgb(0.95, 0.6, 0.6),   // Pink
    rgb(0.6, 0.9, 0.7),    // Green
    rgb(0.9, 0.7, 0.9),    // Purple
  ]
  
  // Circles
  page.drawCircle({ x: 80, y: pageHeight - 80, size: 50, color: decorColors[0] })
  page.drawCircle({ x: pageWidth - 80, y: pageHeight - 80, size: 45, color: decorColors[1] })
  page.drawCircle({ x: 70, y: 100, size: 45, color: decorColors[2] })
  page.drawCircle({ x: pageWidth - 70, y: 120, size: 50, color: decorColors[3] })
  
  // Stars
  for (let i = 0; i < 10; i++) {
    const x = 100 + Math.random() * (pageWidth - 200)
    const y = 200 + Math.random() * (pageHeight - 400)
    page.drawCircle({ x, y, size: 5 + Math.random() * 8, color: decorColors[4] })
  }
  
  // Main title box
  page.drawRectangle({
    x: 50, y: pageHeight / 2 + 20,
    width: pageWidth - 100, height: 140,
    color: rgb(1, 1, 1),
    borderColor: pColor,
    borderWidth: 4
  })
  
  // Title
  const titleFontSize = Math.min(32, 480 / title.length)
  page.drawText(title.toUpperCase(), {
    x: (pageWidth - title.length * titleFontSize * 0.55) / 2,
    y: pageHeight / 2 + 100,
    size: titleFontSize,
    font: boldFont,
    color: pColor
  })
  
  // Subtitle
  const subtitle = 'ACTIVITY BOOK'
  page.drawText(subtitle, {
    x: pageWidth / 2 - 70,
    y: pageHeight / 2 + 50,
    size: 18,
    font: boldFont,
    color: sColor
  })
  
  // Page count badge
  const pageLabel = `${pageCount} Fun Activities!`
  page.drawRectangle({
    x: pageWidth / 2 - 80, y: pageHeight / 2 - 40,
    width: 160, height: 35,
    color: decorColors[0],
    borderColor: rgb(0.8, 0.7, 0.3),
    borderWidth: 2
  })
  page.drawText(pageLabel, {
    x: pageWidth / 2 - 55,
    y: pageHeight / 2 - 28,
    size: 12,
    font: boldFont,
    color: rgb(0.3, 0.2, 0.1)
  })
  
  // Author
  if (authorName) {
    page.drawText(authorName, {
      x: pageWidth / 2 - (authorName.length * 5),
      y: 140,
      size: 16,
      font,
      color: pColor
    })
  }
}

// Draw activity-specific content on page
async function drawActivityContent(page, pageData, x, y, width, height, font, boldFont, pColor, sColor) {
  const content = pageData.content || {}
  const centerX = x + width / 2
  const centerY = y + height / 2
  
  switch (content.type) {
    case 'word-search':
      if (content.grid && content.words) {
        const gridSize = content.gridSize || 10
        const words = content.words || []
        
        // Calculate word list area height needed
        const wordsPerRow = 4
        const wordRows = Math.ceil(words.length / wordsPerRow)
        const wordListHeight = 20 + wordRows * 15 + 10 // header + rows + padding
        
        // Calculate available height for grid
        const availableHeightForGrid = height - wordListHeight - 20 // 20 for top padding
        const availableWidthForGrid = width - 40
        
        const cellSize = Math.min(availableWidthForGrid, availableHeightForGrid) / gridSize
        const gridStartX = centerX - (gridSize * cellSize) / 2
        
        // Position grid in upper portion of content area
        const gridTopY = y + height - 10 // Top of grid with padding
        const gridStartY = gridTopY
        
        // Draw the word search grid
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const letter = content.grid[row]?.[col] || 'X'
            page.drawRectangle({
              x: gridStartX + col * cellSize,
              y: gridStartY - (row + 1) * cellSize,
              width: cellSize,
              height: cellSize,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 0.5
            })
            page.drawText(letter, {
              x: gridStartX + col * cellSize + cellSize / 3,
              y: gridStartY - (row + 1) * cellSize + cellSize / 3,
              size: cellSize * 0.6,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2)
            })
          }
        }
        
        // Position word list below the grid with proper spacing
        const gridBottom = gridStartY - (gridSize * cellSize)
        const wordListY = gridBottom - 15 // Space below grid
        
        page.drawText('Find these words:', { x: x + 20, y: wordListY, size: 11, font: boldFont, color: pColor })
        
        // Draw words in columns, ensuring they stay within bounds
        const wordStartY = wordListY - 18
        const columnWidth = (width - 40) / wordsPerRow
        
        words.forEach((word, idx) => {
          const col = idx % wordsPerRow
          const row = Math.floor(idx / wordsPerRow)
          const wordX = x + 20 + col * columnWidth
          const wordY = wordStartY - row * 15
          
          // Only draw if within content area bounds
          if (wordY >= y + 15) {
            page.drawText(word, {
              x: wordX,
              y: wordY,
              size: 10, font, color: rgb(0.3, 0.3, 0.3)
            })
          }
        })
      }
      break
      
    case 'crossword':
      // Draw crossword grid
      const cwGridSize = content.gridSize || 10
      const cwCellSize = Math.min(width - 80, height - 150) / cwGridSize
      const cwStartX = centerX - (cwGridSize * cwCellSize) / 2
      const cwStartY = centerY + (cwGridSize * cwCellSize) / 2 + 20
      
      // Draw empty grid
      for (let row = 0; row < cwGridSize; row++) {
        for (let col = 0; col < cwGridSize; col++) {
          page.drawRectangle({
            x: cwStartX + col * cwCellSize,
            y: cwStartY - (row + 1) * cwCellSize,
            width: cwCellSize, height: cwCellSize,
            borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1
          })
        }
      }
      
      // Draw clues
      const clues = content.clues || { across: [], down: [] }
      let clueY = y + 60
      page.drawText('ACROSS:', { x: x + 10, y: clueY, size: 9, font: boldFont, color: pColor })
      clueY -= 12
      ;(clues.across || []).slice(0, 4).forEach((clue) => {
        page.drawText(`${clue.number}. ${stripEmojis(clue.clue)}`, { x: x + 10, y: clueY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        clueY -= 12
      })
      clueY -= 5
      page.drawText('DOWN:', { x: x + 10, y: clueY, size: 9, font: boldFont, color: pColor })
      clueY -= 12
      ;(clues.down || []).slice(0, 4).forEach((clue) => {
        page.drawText(`${clue.number}. ${stripEmojis(clue.clue)}`, { x: x + 10, y: clueY, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        clueY -= 12
      })
      break
      
    case 'sudoku':
      const sudokuSize = content.size || 9
      const sudokuCellSize = Math.min(width - 60, height - 60) / sudokuSize
      const sudokuStartX = centerX - (sudokuSize * sudokuCellSize) / 2
      const sudokuStartY = centerY + (sudokuSize * sudokuCellSize) / 2
      const boxSize = sudokuSize === 9 ? 3 : (sudokuSize === 6 ? 3 : 2)
      
      for (let row = 0; row < sudokuSize; row++) {
        for (let col = 0; col < sudokuSize; col++) {
          const cellVal = content.grid?.[row]?.[col] || 0
          const isBoxBorder = (row % boxSize === 0) || (col % boxSize === 0)
          
          page.drawRectangle({
            x: sudokuStartX + col * sudokuCellSize,
            y: sudokuStartY - (row + 1) * sudokuCellSize,
            width: sudokuCellSize, height: sudokuCellSize,
            borderColor: isBoxBorder ? rgb(0.2, 0.2, 0.2) : rgb(0.7, 0.7, 0.7),
            borderWidth: isBoxBorder ? 2 : 0.5
          })
          
          if (cellVal > 0) {
            page.drawText(String(cellVal), {
              x: sudokuStartX + col * sudokuCellSize + sudokuCellSize / 3,
              y: sudokuStartY - (row + 1) * sudokuCellSize + sudokuCellSize / 3,
              size: sudokuCellSize * 0.5, font: boldFont, color: rgb(0.2, 0.2, 0.2)
            })
          }
        }
      }
      break
      
    case 'maze':
    case 'maze-complex':
      page.drawRectangle({ x: x + 20, y: y + 40, width: width - 40, height: height - 60, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 2 })
      page.drawText('START', { x: x + 30, y: y + height - 30, size: 10, font: boldFont, color: rgb(0.2, 0.7, 0.2) })
      page.drawText('FINISH', { x: x + width - 60, y: y + 50, size: 10, font: boldFont, color: rgb(0.7, 0.2, 0.2) })
      // Draw maze lines
      for (let i = 0; i < 10; i++) {
        const lineY = y + 60 + i * (height - 80) / 10
        const startOffset = 30 + Math.random() * 80
        const endOffset = 30 + Math.random() * 80
        page.drawLine({ start: { x: x + startOffset, y: lineY }, end: { x: x + width - endOffset, y: lineY }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
        // Vertical connectors
        if (i > 0 && Math.random() > 0.5) {
          const vx = x + 50 + Math.random() * (width - 100)
          const prevY = y + 60 + (i - 1) * (height - 80) / 10
          page.drawLine({ start: { x: vx, y: prevY }, end: { x: vx, y: lineY }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
        }
      }
      break
      
    case 'spot-difference':
      // Draw two boxes side by side with proper spacing for labels
      const boxW = (width - 30) / 2
      const boxTopY = y + height - 50 // Leave space for labels above boxes
      const boxHeight = height - 80 // Reduced height to accommodate label
      
      // Draw boxes lower to make room for labels
      page.drawRectangle({ x: x + 5, y: y + 30, width: boxW, height: boxHeight, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 2 })
      page.drawRectangle({ x: x + boxW + 15, y: y + 30, width: boxW, height: boxHeight, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 2 })
      
      // Labels positioned above the boxes with adequate spacing
      page.drawText('Picture A', { x: x + boxW / 2 - 25, y: y + 30 + boxHeight + 10, size: 11, font: boldFont, color: pColor })
      page.drawText('Picture B', { x: x + boxW + 15 + boxW / 2 - 25, y: y + 30 + boxHeight + 10, size: 11, font: boldFont, color: pColor })
      
      // Draw some shapes in both boxes
      for (let i = 0; i < 5; i++) {
        const shapeY = y + 60 + i * ((boxHeight - 40) / 5)
        page.drawCircle({ x: x + 60, y: shapeY, size: 15, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1 })
        page.drawCircle({ x: x + boxW + 70, y: shapeY, size: 15 + (i % 2 === 0 ? 3 : 0), borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1 })
      }
      page.drawText(`Find ${content.differences || 10} differences!`, { x: centerX - 50, y: y + 12, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
      break
      
    case 'connect-dots':
      // Draw dots in a pattern
      const dotCount = content.dots || 30
      const dotsPerRow = Math.ceil(Math.sqrt(dotCount))
      const dotSpacingX = (width - 60) / dotsPerRow
      const dotSpacingY = (height - 80) / dotsPerRow
      
      for (let i = 0; i < Math.min(dotCount, 50); i++) {
        const row = Math.floor(i / dotsPerRow)
        const col = i % dotsPerRow
        const dotX = x + 40 + col * dotSpacingX + (Math.random() - 0.5) * 20
        const dotY = y + height - 50 - row * dotSpacingY + (Math.random() - 0.5) * 20
        
        page.drawCircle({ x: dotX, y: dotY, size: 4, color: rgb(0.3, 0.3, 0.3) })
        page.drawText(String(i + 1), { x: dotX + 5, y: dotY + 2, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
      }
      break
      
    case 'tic-tac-toe':
      const tttGrids = content.grids || 6
      const tttSize = 80
      const gridsPerRow = 3
      
      for (let g = 0; g < tttGrids; g++) {
        const gx = x + 40 + (g % gridsPerRow) * (tttSize + 40)
        const gy = y + height - 60 - Math.floor(g / gridsPerRow) * (tttSize + 40)
        
        page.drawLine({ start: { x: gx + tttSize / 3, y: gy }, end: { x: gx + tttSize / 3, y: gy - tttSize }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
        page.drawLine({ start: { x: gx + 2 * tttSize / 3, y: gy }, end: { x: gx + 2 * tttSize / 3, y: gy - tttSize }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
        page.drawLine({ start: { x: gx, y: gy - tttSize / 3 }, end: { x: gx + tttSize, y: gy - tttSize / 3 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
        page.drawLine({ start: { x: gx, y: gy - 2 * tttSize / 3 }, end: { x: gx + tttSize, y: gy - 2 * tttSize / 3 }, thickness: 2, color: rgb(0.3, 0.3, 0.3) })
      }
      break
      
    case 'math':
      const problems = content.problems || []
      const problemsPerCol = Math.ceil(problems.length / 2)
      
      problems.forEach((prob, idx) => {
        const col = Math.floor(idx / problemsPerCol)
        const row = idx % problemsPerCol
        const px = x + 50 + col * (width / 2)
        const py = y + height - 50 - row * 40
        
        const problemText = `${idx + 1}. ${prob.a} ${prob.op} ${prob.b} = ____`
        page.drawText(problemText, { x: px, y: py, size: 14, font, color: rgb(0.2, 0.2, 0.2) })
      })
      break
      
    case 'spelling':
      const spellingWords = content.words || []
      const scrambledWords = content.scrambled || []
      let spellingY = y + height - 50
      
      page.drawText('Unscramble these words:', { x: x + 20, y: spellingY, size: 11, font: boldFont, color: pColor })
      spellingY -= 25
      
      scrambledWords.forEach((word, idx) => {
        if (spellingY > y + 60) {
          page.drawText(`${idx + 1}. ${word}  =  ________________`, { x: x + 30, y: spellingY, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
          spellingY -= 30
        }
      })
      break
      
    case 'tracing':
      const items = content.items || ['A', 'B', 'C', 'D', 'E']
      const tracingCols = 5
      const tracingCellW = (width - 40) / tracingCols
      const tracingCellH = (height - 60) / Math.ceil(items.length / tracingCols)
      
      items.forEach((item, idx) => {
        const col = idx % tracingCols
        const row = Math.floor(idx / tracingCols)
        const cellX = x + 20 + col * tracingCellW
        const cellY = y + height - 40 - row * tracingCellH
        
        // Draw dotted letter/number
        page.drawRectangle({ x: cellX + 5, y: cellY - tracingCellH + 5, width: tracingCellW - 10, height: tracingCellH - 10, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 })
        page.drawText(item, { x: cellX + tracingCellW / 3, y: cellY - tracingCellH / 2 - 10, size: 28, font, color: rgb(0.85, 0.85, 0.85) })
      })
      break
      
    case 'matching':
      const pairs = content.pairs || []
      const matchingY = y + height - 50
      const leftCol = x + 30
      const rightCol = x + width - 80
      
      pairs.forEach((pair, idx) => {
        const itemY = matchingY - idx * 50
        if (itemY > y + 60) {
          page.drawText(stripEmojis(pair[0] || ''), { x: leftCol, y: itemY, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawCircle({ x: leftCol + 60, y: itemY + 4, size: 5, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
          page.drawText(stripEmojis(pair[1] || ''), { x: rightCol, y: itemY - (idx % 3) * 15, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawCircle({ x: rightCol - 10, y: itemY - (idx % 3) * 15 + 4, size: 5, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
        }
      })
      page.drawText('Draw lines to match!', { x: centerX - 50, y: y + 25, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
      break
      
    case 'counting':
      const countItems = content.items || []
      let countY = y + height - 60
      
      countItems.forEach((item, idx) => {
        if (countY > y + 80) {
          page.drawText(`${idx + 1}. Count: ${stripEmojis(item)}`, { x: x + 30, y: countY, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawText('Answer: ____', { x: x + width - 100, y: countY, size: 12, font, color: rgb(0.5, 0.5, 0.5) })
          countY -= 40
        }
      })
      break
      
    case 'patterns':
      const patterns = content.patterns || []
      let patternY = y + height - 60
      
      patterns.forEach((p, idx) => {
        if (patternY > y + 80) {
          const seq = (p.sequence || []).map(s => stripEmojis(String(s))).join('  ')
          page.drawText(`${idx + 1}. ${seq}`, { x: x + 30, y: patternY, size: 14, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawText('What comes next? ____', { x: x + 30, y: patternY - 20, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
          patternY -= 60
        }
      })
      break
      
    case 'trivia':
      const triviaQuestions = content.questions || []
      let triviaY = y + height - 50
      
      triviaQuestions.forEach((q, idx) => {
        if (triviaY > y + 100) {
          page.drawText(`${idx + 1}. ${stripEmojis(q.q || '')}`, { x: x + 20, y: triviaY, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
          triviaY -= 18
          ;(q.options || []).forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx) // A, B, C...
            page.drawText(`   ${letter}) ${stripEmojis(opt)}`, { x: x + 30, y: triviaY, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
            triviaY -= 15
          })
          triviaY -= 15
        }
      })
      break
      
    case 'riddles':
      const riddles = content.riddles || []
      let riddleY = y + height - 50
      
      riddles.forEach((r, idx) => {
        if (riddleY > y + 80) {
          page.drawText(`${idx + 1}. ${stripEmojis(r.riddle || '')}`, { x: x + 20, y: riddleY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawText('Answer: _________________________', { x: x + 30, y: riddleY - 20, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
          riddleY -= 60
        }
      })
      break
      
    case 'would-you-rather':
      const wyrQuestions = content.questions || []
      let wyrY = y + height - 50
      
      wyrQuestions.forEach((q, idx) => {
        if (wyrY > y + 60) {
          page.drawText(`${idx + 1}. ${stripEmojis(q)}`, { x: x + 20, y: wyrY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
          page.drawText('My choice: ____________________', { x: x + 30, y: wyrY - 20, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
          page.drawText('Because: ____________________', { x: x + 30, y: wyrY - 35, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
          wyrY -= 80
        }
      })
      break
      
    case 'hangman':
      const hangmanWords = content.words || []
      let hangmanY = y + height - 60
      
      page.drawText('Guess the letters to complete each word!', { x: x + 20, y: hangmanY, size: 11, font: boldFont, color: pColor })
      hangmanY -= 30
      
      hangmanWords.forEach((word, idx) => {
        if (hangmanY > y + 100) {
          // Draw blanks for each letter
          const blanks = '_ '.repeat(word.length).trim()
          page.drawText(`${idx + 1}. ${blanks}`, { x: x + 30, y: hangmanY, size: 14, font, color: rgb(0.2, 0.2, 0.2) })
          // Draw small hangman scaffold
          const scaffoldX = x + width - 80
          page.drawLine({ start: { x: scaffoldX, y: hangmanY - 5 }, end: { x: scaffoldX, y: hangmanY + 25 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) })
          page.drawLine({ start: { x: scaffoldX, y: hangmanY + 25 }, end: { x: scaffoldX + 20, y: hangmanY + 25 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) })
          hangmanY -= 50
        }
      })
      break
      
    case 'bingo':
      // Draw 2 bingo cards
      const bingoSize = 5
      const bingoCellSize = Math.min((width - 60) / 2 / bingoSize, (height - 80) / bingoSize)
      
      for (let card = 0; card < 2; card++) {
        const cardX = x + 20 + card * (width / 2)
        const cardY = y + height - 30
        
        page.drawText(`Card ${card + 1}`, { x: cardX + 30, y: cardY, size: 10, font: boldFont, color: pColor })
        
        // Draw BINGO header
        const bingoLetters = ['B', 'I', 'N', 'G', 'O']
        bingoLetters.forEach((letter, idx) => {
          page.drawText(letter, {
            x: cardX + idx * bingoCellSize + bingoCellSize / 3,
            y: cardY - 20,
            size: 12, font: boldFont, color: pColor
          })
        })
        
        // Draw grid
        for (let row = 0; row < bingoSize; row++) {
          for (let col = 0; col < bingoSize; col++) {
            page.drawRectangle({
              x: cardX + col * bingoCellSize,
              y: cardY - 35 - (row + 1) * bingoCellSize,
              width: bingoCellSize, height: bingoCellSize,
              borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1
            })
            // Free space in center
            if (row === 2 && col === 2) {
              page.drawText('FREE', { x: cardX + col * bingoCellSize + 3, y: cardY - 35 - (row + 1) * bingoCellSize + bingoCellSize / 3, size: 7, font, color: rgb(0.5, 0.5, 0.5) })
            }
          }
        }
      }
      break
      
    case 'travel-games':
      const games = content.games || []
      let travelY = y + height - 50
      
      games.forEach((game, idx) => {
        if (travelY > y + 100) {
          page.drawText(`${idx + 1}. ${stripEmojis(game)}`, { x: x + 20, y: travelY, size: 12, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
          // Draw checkbox
          page.drawRectangle({ x: x + width - 50, y: travelY - 5, width: 15, height: 15, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
          travelY -= 40
        }
      })
      page.drawText('Check off each game as you play!', { x: x + 20, y: y + 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) })
      break
      
    case 'color-by-number':
      // Draw a simple color by number outline
      page.drawRectangle({ x: x + 20, y: y + 60, width: width - 40, height: height - 100, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 2 })
      
      // Draw numbered sections
      const colors = content.colors || { 1: 'Red', 2: 'Blue', 3: 'Green', 4: 'Yellow', 5: 'Orange' }
      let colorKeyY = y + 40
      page.drawText('Color Key:', { x: x + 20, y: colorKeyY, size: 9, font: boldFont, color: pColor })
      Object.entries(colors).forEach(([num, color], idx) => {
        page.drawText(`${num} = ${color}`, { x: x + 20 + idx * 70, y: colorKeyY - 12, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
      })
      
      // Draw some shapes with numbers
      page.drawCircle({ x: centerX - 60, y: centerY + 40, size: 40, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawText('1', { x: centerX - 63, y: centerY + 36, size: 14, font, color: rgb(0.6, 0.6, 0.6) })
      page.drawCircle({ x: centerX + 60, y: centerY + 40, size: 40, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawText('2', { x: centerX + 57, y: centerY + 36, size: 14, font, color: rgb(0.6, 0.6, 0.6) })
      page.drawRectangle({ x: centerX - 50, y: centerY - 80, width: 100, height: 60, borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
      page.drawText('3', { x: centerX - 5, y: centerY - 55, size: 14, font, color: rgb(0.6, 0.6, 0.6) })
      break
      
    case 'doodle-complete':
    case 'drawing-prompts':
      const prompts = content.prompts || ['Draw something creative!']
      page.drawRectangle({ x: x + 20, y: y + 40, width: width - 40, height: height - 80, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 2 })
      page.drawText(stripEmojis(prompts[0] || 'Draw here!'), { x: centerX - 60, y: centerY, size: 12, font, color: rgb(0.7, 0.7, 0.7) })
      break
      
    case 'connect-color':
      // Similar to connect-dots but with coloring instructions
      const ccDots = content.dots || 20
      const ccDotsPerRow = Math.ceil(Math.sqrt(ccDots))
      const ccSpacingX = (width - 60) / ccDotsPerRow
      const ccSpacingY = (height - 100) / ccDotsPerRow
      
      for (let i = 0; i < Math.min(ccDots, 30); i++) {
        const row = Math.floor(i / ccDotsPerRow)
        const col = i % ccDotsPerRow
        const dotX = x + 40 + col * ccSpacingX
        const dotY = y + height - 60 - row * ccSpacingY
        
        page.drawCircle({ x: dotX, y: dotY, size: 4, color: rgb(0.3, 0.3, 0.3) })
        page.drawText(String(i + 1), { x: dotX + 5, y: dotY + 2, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
      }
      page.drawText('Connect the dots, then color the picture!', { x: centerX - 80, y: y + 25, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
      break
      
    case 'logic-puzzle':
      const puzzle = content.puzzle || { clues: [], items: [] }
      let logicY = y + height - 50
      
      page.drawText('Use the clues to solve the puzzle:', { x: x + 20, y: logicY, size: 11, font: boldFont, color: pColor })
      logicY -= 25
      
      ;(puzzle.clues || []).forEach((clue, idx) => {
        if (logicY > y + 150) {
          page.drawText(`${idx + 1}. ${stripEmojis(clue)}`, { x: x + 30, y: logicY, size: 10, font, color: rgb(0.3, 0.3, 0.3) })
          logicY -= 20
        }
      })
      
      logicY -= 20
      page.drawText('Items:', { x: x + 20, y: logicY, size: 10, font: boldFont, color: pColor })
      logicY -= 15
      ;(puzzle.items || []).forEach((item, idx) => {
        page.drawText(`${idx + 1}. ${stripEmojis(item)}: ____`, { x: x + 30, y: logicY - idx * 20, size: 10, font, color: rgb(0.3, 0.3, 0.3) })
      })
      break
      
    case 'memory':
      // Draw memory card grid
      const memPairs = content.pairs || 8
      const memCols = 4
      const memRows = Math.ceil(memPairs * 2 / memCols)
      const memCardW = (width - 60) / memCols
      const memCardH = Math.min(memCardW * 1.3, (height - 80) / memRows)
      
      page.drawText('Cut out and play memory match!', { x: x + 20, y: y + height - 25, size: 10, font: boldFont, color: pColor })
      
      for (let i = 0; i < memPairs * 2; i++) {
        const col = i % memCols
        const row = Math.floor(i / memCols)
        const cardX = x + 30 + col * memCardW
        const cardY = y + height - 50 - (row + 1) * memCardH
        
        page.drawRectangle({ x: cardX, y: cardY, width: memCardW - 10, height: memCardH - 10, borderColor: rgb(0.4, 0.4, 0.4), borderWidth: 1 })
        page.drawText('?', { x: cardX + memCardW / 2 - 8, y: cardY + memCardH / 2 - 12, size: 20, font: boldFont, color: rgb(0.7, 0.7, 0.7) })
      }
      break
      
    case 'sequences':
      const sequences = content.sequences || []
      let seqY = y + height - 50
      
      sequences.forEach((s, idx) => {
        if (seqY > y + 80) {
          const pattern = (s.pattern || []).join(', ')
          page.drawText(`${idx + 1}. ${pattern}`, { x: x + 30, y: seqY, size: 14, font, color: rgb(0.2, 0.2, 0.2) })
          seqY -= 35
        }
      })
      break
      
    case 'visual-puzzles':
      const puzzles = content.puzzles || []
      let vpY = y + height - 50
      
      puzzles.forEach((p, idx) => {
        if (vpY > y + 120) {
          page.drawText(`${idx + 1}. ${stripEmojis(p)}`, { x: x + 20, y: vpY, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
          // Draw a box for the puzzle
          page.drawRectangle({ x: x + 30, y: vpY - 70, width: width - 60, height: 50, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 })
          vpY -= 100
        }
      })
      break
      
    default:
      // Generic activity with actual content attempt
      page.drawRectangle({ x: x + 20, y: y + 40, width: width - 40, height: height - 80, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1 })
      const activityTitle = pageData.title || 'Activity'
      page.drawText(`Complete: ${stripEmojis(activityTitle)}`, { x: centerX - 80, y: centerY + 20, size: 12, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
      page.drawText('Use this space for the activity!', { x: centerX - 70, y: centerY - 10, size: 10, font, color: rgb(0.7, 0.7, 0.7) })
  }
}
